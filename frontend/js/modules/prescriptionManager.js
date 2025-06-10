import apiClient from '../apiClient.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';
import { confirmModal } from '../utils/ui.js';

/**
 * 处方管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
    container.innerHTML = `
        <div class="prescription-module-wrapper">
            <div id="prescription-module-content">
                <div class="data-table-container">
                    <div class="table-header-controls">
                        <div class="search-input-group">
                            <input type="text" id="prescription-search-input" data-i18n-placeholder="search_prescription_placeholder" placeholder="按患者姓名、医生姓名搜索...">
                        </div>
                    </div>
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-i18n="prescription_id">处方编号</th>
                                    <th data-i18n="patient_name">患者姓名</th>
                                    <th data-i18n="doctor_name">医生姓名</th>
                                    <th data-i18n="prescription_date">开具日期</th>
                                    <th data-i18n="bill_status">账单状态</th>
                                    <th data-i18n="dispensing_status">发药状态</th>
                                    <th class="actions-column" data-i18n="actions">操作</th>
                                </tr>
                            </thead>
                            <tbody id="prescription-table-body"></tbody>
                        </table>
                        <div id="pagination-container" class="pagination-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 翻译页面内容
    if (window.translatePage) {
        window.translatePage();
    }
    
    // 初始化加载数据
    await loadPrescriptions();
    
    // 绑定事件
    bindEvents(signal);
    
    // 返回清理函数
    return () => {
        // 清理事件监听器等
        console.log('处方管理模块已清理');
    };
}

/**
 * 绑定事件监听器
 */
function bindEvents(signal) {
    // 移除原有的"开具新处方"按钮事件监听器，现在通过病历模块调用
    
    // 搜索输入框
    const searchInput = document.getElementById('prescription-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadPrescriptions(1, e.target.value.trim());
            }, 300);
        }, { signal });
    }
}

/**
 * 加载处方列表
 */
async function loadPrescriptions(page = 1, search = '') {
    try {
        const tableBody = document.getElementById('prescription-table-body');
        if (!tableBody) return;
        
        // 显示加载状态
        tableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">${window.getTranslation ? window.getTranslation('loading_prescription_data') : '正在加载处方数据...'}</td></tr>`;
        
        // 获取处方数据
        const prescriptions = await apiClient.prescriptions.getAll();
        
        // 过滤搜索结果
        let filteredPrescriptions = prescriptions;
        if (search) {
            filteredPrescriptions = prescriptions.filter(prescription => 
                prescription.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
                prescription.doctor?.name?.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // 渲染表格
        renderPrescriptionTable(filteredPrescriptions);
        
    } catch (error) {
        console.error('加载处方列表失败:', error);
        const tableBody = document.getElementById('prescription-table-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="error-cell">${window.getTranslation ? window.getTranslation('load_prescription_data_failed') : '加载处方数据失败'}</td></tr>`;
        }
        window.showNotification((window.getTranslation ? window.getTranslation('load_prescription_data_failed') : '加载处方数据失败') + ': ' + error.message, 'error');
    }
}

/**
 * 渲染处方表格
 */
async function renderPrescriptionTable(prescriptions) {
    const tableBody = document.getElementById('prescription-table-body');
    if (!tableBody) return;
    
    if (prescriptions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${window.getTranslation ? window.getTranslation('no_prescription_records') : '暂无处方记录'}</td></tr>`;
        return;
    }
    
    // 获取所有处方的账单状态
    const prescriptionsWithBillStatus = await Promise.all(
        prescriptions.map(async (prescription) => {
            try {
                // 通过medical_record_id获取账单信息
                const billsResponse = await apiClient.finance.getBills();
                const bills = billsResponse.items || [];
                const relatedBill = bills.find(bill => bill.medical_record_id === prescription.medical_record_id);
                
                return {
                    ...prescription,
                    billStatus: relatedBill ? relatedBill.status : 'no_bill',
                    billPaid: relatedBill ? relatedBill.status === 'paid' : false
                };
            } catch (error) {
                console.error('获取账单状态失败:', error);
                return {
                    ...prescription,
                    billStatus: 'unknown',
                    billPaid: false
                };
            }
        })
    );
    
    tableBody.innerHTML = prescriptionsWithBillStatus.map(prescription => {
        const statusText = getDispensingStatusText(prescription.dispensing_status);
        const statusClass = getDispensingStatusClass(prescription.dispensing_status);
        const billStatusText = getBillStatusText(prescription.billStatus);
        const billStatusClass = getBillStatusClass(prescription.billStatus);
        
        // 发药按钮逻辑：只有待发药状态才显示，已发药状态显示为灰色不可点击
        let dispenseButton = '';
        const dispensingStatus = prescription.dispensing_status?.toUpperCase() || '';
        if (dispensingStatus === 'PENDING') {
            dispenseButton = `<button class="btn btn-sm btn-success" onclick="showDispenseModal(${prescription.id}, ${prescription.billPaid})" data-i18n="dispense">发药</button>`;
        } else if (dispensingStatus === 'DISPENSED') {
            dispenseButton = `<button class="btn btn-sm btn-secondary" disabled data-i18n="dispensed">已发药</button>`;
        }
        
        return `
            <tr>
                <td>#${prescription.id}</td>
                <td>${prescription.patient?.name || (window.getTranslation ? window.getTranslation('unknown_patient') : '未知患者')}</td>
                <td>${prescription.doctor?.name || (window.getTranslation ? window.getTranslation('unknown_doctor') : '未知医生')}</td>
                <td>${formatDate(prescription.prescription_date)}</td>
                <td><span class="status-badge ${billStatusClass}" data-i18n="${prescription.billStatus === 'no_bill' ? 'no_bill' : 'bill_' + prescription.billStatus}">${billStatusText}</span></td>
                <td><span class="status-badge ${statusClass}" data-i18n="dispensing.status.${prescription.dispensing_status}">${statusText}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="viewPrescriptionDetails(${prescription.id})" data-i18n="view">查看</button>
                    ${dispenseButton}
                    <button class="btn btn-sm btn-danger" onclick="deletePrescription(${prescription.id})" data-i18n="delete">删除</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // 翻译新生成的内容
    if (window.translatePage) {
        window.translatePage();
    }
}

/**
 * 获取发药状态文本
 */
function getDispensingStatusText(status) {
    const upperStatus = status?.toUpperCase() || '';
    const statusMap = {
        'PENDING': window.getTranslation ? window.getTranslation('pending_dispensing') : '待发药',
        'DISPENSED': window.getTranslation ? window.getTranslation('dispensed') : '已发药',
        'CANCELLED': window.getTranslation ? window.getTranslation('cancelled') : '已取消'
    };
    return statusMap[upperStatus] || status;
}

/**
 * 获取发药状态样式类
 */
function getDispensingStatusClass(status) {
    const upperStatus = status?.toUpperCase() || '';
    const classMap = {
        'PENDING': 'status-warning',
        'DISPENSED': 'status-success',
        'CANCELLED': 'status-danger'
    };
    return classMap[upperStatus] || '';
}

/**
 * 获取账单状态文本
 */
function getBillStatusText(status) {
    const statusMap = {
        'paid': window.getTranslation ? window.getTranslation('bill_paid') : '已支付',
        'unpaid': window.getTranslation ? window.getTranslation('bill_unpaid') : '未支付',
        'partially_paid': window.getTranslation ? window.getTranslation('bill_partially_paid') : '部分支付',
        'void': window.getTranslation ? window.getTranslation('bill_void') : '已作废',
        'no_bill': window.getTranslation ? window.getTranslation('no_bill') : '无账单',
        'unknown': window.getTranslation ? window.getTranslation('unknown_status') : '未知状态'
    };
    return statusMap[status] || status;
}

/**
 * 获取账单状态样式类
 */
function getBillStatusClass(status) {
    const classMap = {
        'paid': 'status-success',
        'unpaid': 'status-danger',
        'partially_paid': 'status-warning',
        'void': 'status-secondary',
        'no_bill': 'status-secondary',
        'unknown': 'status-secondary'
    };
    return classMap[status] || '';
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

/**
 * 显示处方详情
 */
window.viewPrescriptionDetails = async function(prescriptionId) {
    try {
        const prescription = await apiClient.prescriptions.getById(prescriptionId);
        showPrescriptionDetailsModal(prescription);
    } catch (error) {
        console.error('获取处方详情失败:', error);
        window.showNotification((window.getTranslation ? window.getTranslation('get_prescription_details_failed') : '获取处方详情失败') + ': ' + error.message, 'error');
    }
};

/**
 * 显示发药确认模态框
 */
window.showDispenseModal = function(prescriptionId, billPaid) {
    const modalHtml = `
        <div class="modal-overlay" id="dispense-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 data-i18n="prescription_dispense">处方发药</h3>
                    <button class="modal-close" onclick="closeDispenseModal()" data-i18n-title="close">&times;</button>
                </div>
                <div class="modal-body">
                    <p data-i18n="confirm_dispense_message">是否确认发药？处方状态将会被更新。</p>
                    <div id="dispense-notification" class="form-notification" style="display: none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeDispenseModal()" data-i18n="cancel">取消</button>
                    <button type="button" class="btn btn-primary" onclick="confirmDispense(${prescriptionId}, ${billPaid})" data-i18n="confirm">确认</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = document.getElementById('dispense-modal');
    if (modal) {
        // 使用setTimeout确保DOM已经渲染
        setTimeout(() => {
            modal.classList.add('active');
            // 在模态框显示后再次翻译内容
            if (window.translatePage) {
                window.translatePage();
            }
        }, 10);
    }
    
    // 立即翻译模态框内容
    if (window.translatePage) {
        window.translatePage();
    }
};

/**
 * 关闭发药模态框
 */
window.closeDispenseModal = function() {
    const modal = document.getElementById('dispense-modal');
    if (modal) {
        modal.classList.remove('active');
        // 等待动画完成后移除元素
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

/**
 * 确认发药操作
 */
window.confirmDispense = async function(prescriptionId, billPaid) {
    const notificationDiv = document.getElementById('dispense-notification');
    
    // 检查账单支付状态
    if (!billPaid) {
        // 显示错误通知
        notificationDiv.innerHTML = `
            <div class="notification error">
                <span data-i18n="bill_not_paid_cannot_dispense">该处方账单未被支付，无法发药</span>
            </div>
        `;
        notificationDiv.style.display = 'block';
        
        // 翻译通知内容
        if (window.translatePage) {
            window.translatePage();
        }
        return;
    }
    
    try {
        await apiClient.prescriptions.dispense(prescriptionId);
        window.showNotification(window.getTranslation ? window.getTranslation('dispense_success') : '发药成功', 'success');
        closeDispenseModal();
        await loadPrescriptions();
    } catch (error) {
        console.error('发药失败:', error);
        // 在模态框内显示错误
        notificationDiv.innerHTML = `
            <div class="notification error">
                <span>${(window.getTranslation ? window.getTranslation('dispense_failed') : '发药失败')}: ${error.message}</span>
            </div>
        `;
        notificationDiv.style.display = 'block';
    }
};

/**
 * 发药操作（保留原有函数以兼容）
 */
window.dispensePrescription = async function(prescriptionId) {
    if (!confirm(window.getTranslation ? window.getTranslation('confirm_dispense_prescription') : '确认要为此处方发药吗？')) {
        return;
    }
    
    try {
        await apiClient.prescriptions.dispense(prescriptionId);
        window.showNotification(window.getTranslation ? window.getTranslation('dispense_success') : '发药成功', 'success');
        await loadPrescriptions();
    } catch (error) {
        console.error('发药失败:', error);
        window.showNotification((window.getTranslation ? window.getTranslation('dispense_failed') : '发药失败') + ': ' + error.message, 'error');
    }
};

/**
 * 删除处方
 */
window.deletePrescription = async function(prescriptionId) {
    const confirmed = await confirmModal(
        window.getTranslation ? window.getTranslation('confirm_delete') : '确认删除',
        window.getTranslation ? window.getTranslation('confirm_delete_prescription') : '确认要删除此处方吗？此操作不可撤销，请谨慎操作。',
        {
            confirmText: window.getTranslation ? window.getTranslation('confirm_delete') : '确认删除',
            cancelText: window.getTranslation ? window.getTranslation('cancel') : '取消',
            confirmClass: 'btn-danger'
        }
    );
    
    if (confirmed) {
        try {
            await apiClient.prescriptions.delete(prescriptionId);
            window.showNotification(window.getTranslation ? window.getTranslation('prescription_deleted') : '处方删除成功', 'success');
            await loadPrescriptions();
        } catch (error) {
            console.error('删除处方失败:', error);
            window.showNotification((window.getTranslation ? window.getTranslation('delete_prescription_failed') : '删除处方失败') + ': ' + error.message, 'error');
        }
    }
};

/**
 * 从病历模块调用的处方模态框函数
 */
window.openPrescriptionModalWithContext = async function(patientId, patientName, medicalRecordId) {
    if (!medicalRecordId) {
        window.showNotification(window.getTranslation ? window.getTranslation('medical_record_required') : '必须先保存病历才能开具处方', 'error');
        return;
    }
    
    try {
        await showPrescriptionModalWithContext({
            patientId: patientId,
            patientName: patientName,
            medicalRecordId: medicalRecordId
        });
    } catch (error) {
        console.error('打开处方模态框失败:', error);
        window.showNotification((window.getTranslation ? window.getTranslation('open_prescription_form_failed') : '打开处方表单失败') + ': ' + error.message, 'error');
    }
};

/**
 * 显示处方模态框（带上下文信息）
 */
async function showPrescriptionModalWithContext(context = null) {
    const prescription = null; // 新建处方
    
    // 移除现有模态框
    const existingModal = document.getElementById('prescription-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHtml = `
        <div class="modal fade" id="prescription-modal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" data-i18n="new_prescription">开具新处方</h5>
                        <button type="button" class="btn-close" onclick="closePrescriptionModal()"></button>
                    </div>
                    <div class="modal-body">
                        <form id="prescription-form">
                            ${context ? `
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label class="form-label" data-i18n="medical_record_id">病历ID</label>
                                    <input type="text" id="medical-record-display" class="form-control" value="${context.medicalRecordId}" readonly>
                                    <input type="hidden" id="medical-record-select" value="${context.medicalRecordId}">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" data-i18n="patient">患者</label>
                                    <input type="text" id="patient-display" class="form-control" value="${context.patientName}" readonly>
                                    <input type="hidden" id="patient-select" value="${context.patientId}">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" data-i18n="prescription_date">开具日期</label>
                                    <input type="datetime-local" id="prescription-date" class="form-control" value="${new Date().toISOString().slice(0, 16)}" readonly>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <label class="form-label" data-i18n="doctor">医生</label>
                                    <input type="text" id="doctor-display" class="form-control" value="当前用户" readonly>
                                    <input type="hidden" id="doctor-select" value="">
                                </div>
                            </div>
                            ` : `
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="patient-select" class="form-label" data-i18n="patient">患者</label>
                                    <select id="patient-select" class="form-select" required>
                                        <option value="" data-i18n="select_patient">请选择患者</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="doctor-select" class="form-label" data-i18n="doctor">医生</label>
                                    <select id="doctor-select" class="form-select" required>
                                        <option value="" data-i18n="select_doctor">请选择医生</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="prescription-date" class="form-label" data-i18n="prescription_date">开具日期</label>
                                    <input type="datetime-local" id="prescription-date" class="form-control" required>
                                </div>
                            </div>
                            `}
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 data-i18n="prescription_details">处方明细</h6>
                                    <button type="button" id="add-detail-btn" class="btn btn-sm btn-outline-primary" data-i18n="add_medication">添加药品</button>
                                </div>
                                <div id="prescription-details-container">
                                    <!-- 药品明细将通过添加按钮动态生成 -->
                                </div>
                            </div>
                        
                        <div class="form-group">
                            <label for="notes" data-i18n="notes">备注</label>
                            <textarea id="notes" rows="3" data-i18n-placeholder="prescription_notes_placeholder" placeholder="处方备注信息..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePrescriptionModal()" data-i18n="cancel">取消</button>
                    <button type="button" class="btn btn-primary" onclick="savePrescription()" data-i18n="save">保存</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = document.getElementById('prescription-modal');
    if (modal) {
        // 使用Bootstrap模态框
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // 翻译新添加的内容
        if (window.translatePage) {
            window.translatePage();
        }
        
        // 初始化模态框内容
        await initPrescriptionModal(prescription);
    }
}

/**
 * 显示处方模态框
 */
async function showPrescriptionModal(prescription = null) {
    // 移除现有模态框
    const existingModal = document.getElementById('prescription-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHtml = `
        <div class="modal fade" id="prescription-modal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" data-i18n="new_prescription">开具新处方</h5>
                        <button type="button" class="btn-close" onclick="closePrescriptionModal()"></button>
                    </div>
                    <div class="modal-body">
                        <form id="prescription-form">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="patient-select" class="form-label" data-i18n="patient">患者</label>
                                    <select id="patient-select" class="form-select" required>
                                        <option value="" data-i18n="select_patient">请选择患者</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="doctor-select" class="form-label" data-i18n="doctor">医生</label>
                                    <select id="doctor-select" class="form-select" required>
                                        <option value="" data-i18n="select_doctor">请选择医生</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="prescription-date" class="form-label" data-i18n="prescription_date">开具日期</label>
                                    <input type="datetime-local" id="prescription-date" class="form-control" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 data-i18n="prescription_details">处方明细</h6>
                                    <button type="button" id="add-detail-btn" class="btn btn-sm btn-outline-primary" data-i18n="add_medication">添加药品</button>
                                </div>
                                <div id="prescription-details-container">
                                    <!-- 药品明细将通过添加按钮动态生成 -->
                                </div>
                            </div>
                        
                        <div class="form-group">
                            <label for="notes" data-i18n="notes">备注</label>
                            <textarea id="notes" rows="3" data-i18n-placeholder="prescription_notes_placeholder" placeholder="处方备注信息..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePrescriptionModal()" data-i18n="cancel">取消</button>
                    <button type="button" class="btn btn-primary" onclick="savePrescription()" data-i18n="save">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = document.getElementById('prescription-modal');
    if (modal) {
        // 使用Bootstrap模态框
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // 翻译新添加的内容
        if (window.translatePage) {
            window.translatePage();
        }
        
        // 初始化模态框内容
        await initPrescriptionModal(prescription);
    }
}

/**
 * 初始化处方模态框
 */
async function initPrescriptionModal(prescription) {
    try {
        // 加载患者和药品数据
        const [patientsResponse, medicinesResponse] = await Promise.all([
            apiClient.patients.getAll(),
            apiClient.medicines.getAll()
        ]);
        
        // 处理返回的数据格式
        const patients = Array.isArray(patientsResponse) ? patientsResponse : patientsResponse.items || [];
        const medicines = Array.isArray(medicinesResponse) ? medicinesResponse : medicinesResponse.items || [];
        
        // 只有在非上下文模式下才需要填充患者和医生选择框
        const patientSelect = document.getElementById('patient-select');
        if (patientSelect && patientSelect.tagName === 'SELECT') {
            // 清空现有选项
            patientSelect.innerHTML = `<option value="">${window.getTranslation ? window.getTranslation('select_patient') : '请选择患者'}</option>`;
            
            // 填充患者选择框
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = patient.name;
                patientSelect.appendChild(option);
            });
        }
        
        // 获取当前用户作为医生
        const doctorSelect = document.getElementById('doctor-select');
        const currentUser = await apiClient.auth.getCurrentUser();
        
        if (doctorSelect && doctorSelect.tagName === 'SELECT') {
            // 非上下文模式：填充select选项
            doctorSelect.innerHTML = `<option value="">${window.getTranslation ? window.getTranslation('select_doctor') : '请选择医生'}</option>`;
            if (currentUser) {
                const option = document.createElement('option');
                option.value = currentUser.id;
                option.textContent = currentUser.name || currentUser.username;
                option.selected = true;
                doctorSelect.appendChild(option);
            }
        } else if (doctorSelect && doctorSelect.tagName === 'INPUT') {
            // 上下文模式：设置hidden input的值
            if (currentUser) {
                doctorSelect.value = currentUser.id;
                // 同时更新显示的医生名称
                const doctorDisplay = document.getElementById('doctor-display');
                if (doctorDisplay) {
                    doctorDisplay.value = currentUser.name || currentUser.username;
                }
            }
        }
        
        // 设置默认日期
        const dateInput = document.getElementById('prescription-date');
        dateInput.value = new Date().toISOString().slice(0, 16);
        
        // 绑定添加明细按钮
        document.getElementById('add-detail-btn').addEventListener('click', addPrescriptionDetail);
        
        // 初始化时添加一个药品明细项
        await addPrescriptionDetail();
        
        // 绑定删除明细按钮
        bindRemoveDetailButtons();
        
        // 如果是编辑模式，填充数据
        if (prescription) {
            fillPrescriptionData(prescription);
        }
        
    } catch (error) {
        console.error('初始化处方模态框失败:', error);
        window.showNotification((window.getTranslation ? window.getTranslation('init_prescription_form_failed') : '初始化处方表单失败') + ': ' + error.message, 'error');
    }
}

/**
 * 添加处方明细项
 */
// 辅助函数：创建数字输入框
function createSpinnerInput(className, initialValue, placeholder) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = className;
    input.value = initialValue;
    input.min = '1';
    input.placeholder = placeholder;
    input.required = true;

    return input; // 返回输入框元素
}

async function addPrescriptionDetail() {
    const container = document.getElementById('prescription-details-container');
    
    // 创建处方明细项容器
    const detailItem = document.createElement('div');
    detailItem.className = 'prescription-detail-item';
    
    // 第一行：药品选择、数量、删除按钮
    const firstRow = document.createElement('div');
    firstRow.className = 'form-row';
    
    // 药品选择组
    const drugGroup = document.createElement('div');
    drugGroup.className = 'form-group drug-group';
    const drugLabel = document.createElement('label');
    drugLabel.textContent = window.getTranslation ? window.getTranslation('medicine') : '药品';
    const drugSelect = document.createElement('select');
    drugSelect.className = 'drug-select';
    drugSelect.required = true;
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = window.getTranslation ? window.getTranslation('select_medicine') : '请选择药品';
    drugSelect.appendChild(defaultOption);
    drugGroup.appendChild(drugLabel);
    drugGroup.appendChild(drugSelect);
    
    // 数量组
    const quantityGroup = document.createElement('div');
    quantityGroup.className = 'form-group quantity-group';
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = window.getTranslation ? window.getTranslation('quantity') : '数量';
    const quantityInput = createSpinnerInput('quantity-input', 1, window.getTranslation ? window.getTranslation('quantity') : '数量');
    quantityGroup.appendChild(quantityLabel);
    quantityGroup.appendChild(quantityInput);
    
    // 删除按钮组
    const deleteGroup = document.createElement('div');
    deleteGroup.className = 'form-group';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-sm btn-danger remove-detail-btn';
    deleteBtn.textContent = window.getTranslation ? window.getTranslation('delete') : '删除';
    deleteGroup.appendChild(deleteBtn);
    
    firstRow.appendChild(drugGroup);
    firstRow.appendChild(quantityGroup);
    firstRow.appendChild(deleteGroup);
    
    // 第二行：用法用量、天数
    const secondRow = document.createElement('div');
    secondRow.className = 'form-row';
    
    // 用法用量组
    const frequencyGroup = document.createElement('div');
    frequencyGroup.className = 'form-group';
    const frequencyLabel = document.createElement('label');
    frequencyLabel.textContent = window.getTranslation ? window.getTranslation('frequency') : '用法用量';
    const frequencyInput = document.createElement('input');
    frequencyInput.type = 'text';
    frequencyInput.className = 'frequency-input';
    frequencyInput.placeholder = window.getTranslation ? window.getTranslation('frequency_placeholder') : '如：每日3次，每次1片';
    frequencyInput.required = true;
    frequencyGroup.appendChild(frequencyLabel);
    frequencyGroup.appendChild(frequencyInput);
    
    // 天数组
    const durationGroup = document.createElement('div');
    durationGroup.className = 'form-group';
    const durationLabel = document.createElement('label');
    durationLabel.textContent = window.getTranslation ? window.getTranslation('days') : '天数';
    const durationInput = createSpinnerInput('duration-input', '', window.getTranslation ? window.getTranslation('days') : '天数');
    durationGroup.appendChild(durationLabel);
    durationGroup.appendChild(durationInput);
    
    secondRow.appendChild(frequencyGroup);
    secondRow.appendChild(durationGroup);
    
    // 组装完整的明细项
    detailItem.appendChild(firstRow);
    detailItem.appendChild(secondRow);
    
    // 添加到容器
    container.appendChild(detailItem);
    
    // 为新添加的药品选择框填充选项
    try {
        const medicinesResponse = await apiClient.medicines.getAll();
        const medicines = Array.isArray(medicinesResponse) ? medicinesResponse : medicinesResponse.items || [];
        
        const newSelect = container.lastElementChild.querySelector('.drug-select');
        medicines.forEach(medicine => {
            const option = document.createElement('option');
            option.value = medicine.id;
            option.textContent = `${medicine.name} (${medicine.specification || ''})`;
            newSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载药品数据失败:', error);
    }
    
    bindRemoveDetailButtons();
}

/**
 * 绑定删除明细按钮
 */
function bindRemoveDetailButtons() {
    const removeButtons = document.querySelectorAll('.remove-detail-btn');
    removeButtons.forEach(button => {
        button.onclick = function() {
            const container = document.getElementById('prescription-details-container');
            if (container.children.length > 1) {
                this.closest('.prescription-detail-item').remove();
            } else {
                if (window.showModalNotification) {
                    window.showModalNotification(window.getTranslation ? window.getTranslation('keep_at_least_one_medication') : '至少需要保留一个药品明细', 'warning');
                } else {
                    window.showNotification(window.getTranslation ? window.getTranslation('keep_at_least_one_medication') : '至少需要保留一个药品明细', 'warning');
                }
            }
        };
    });
}

/**
 * 验证处方表单
 * @param {object} prescriptionData 处方数据
 * @param {array} details 处方明细
 * @returns {array} 验证错误数组
 */
function validatePrescriptionForm(prescriptionData, details) {
    const errors = [];
    
    // 清除之前的错误样式
    clearFormErrors();
    
    // 验证患者选择
    if (!prescriptionData.patient_id || isNaN(prescriptionData.patient_id)) {
        showFieldError('patient-select', '请选择患者');
        errors.push('patient_id');
    }
    
    // 验证医生选择
    if (!prescriptionData.doctor_id || isNaN(prescriptionData.doctor_id)) {
        showFieldError('doctor-select', window.getTranslation ? window.getTranslation('select_doctor') : '请选择医生');
        errors.push('doctor_id');
    }
    
    // 验证处方日期
    if (!prescriptionData.prescription_date) {
        showFieldError('prescription-date', window.getTranslation ? window.getTranslation('select_prescription_date') : '请选择处方日期');
        errors.push('prescription_date');
    }
    
    // 验证处方明细
    if (details.length === 0) {
        if (window.showModalNotification) {
            window.showModalNotification(window.getTranslation ? window.getTranslation('add_at_least_one_medication') : '请至少添加一个药品明细', 'error');
        } else {
            window.showNotification(window.getTranslation ? window.getTranslation('add_at_least_one_medication') : '请至少添加一个药品明细', 'error');
        }
        errors.push('details');
    } else {
        // 验证每个明细项
        const detailItems = document.querySelectorAll('.prescription-detail-item');
        detailItems.forEach((item, index) => {
            const drugSelect = item.querySelector('.drug-select');
            const frequencyInput = item.querySelector('.frequency-input');
            const durationInput = item.querySelector('.duration-input');
            const quantityInput = item.querySelector('.quantity-input');
            
            if (!drugSelect.value) {
                showFieldError(drugSelect.id || `drug-select-${index}`, window.getTranslation ? window.getTranslation('select_medicine') : '请选择药品');
                errors.push(`detail_${index}_drug`);
            }
            
            if (!frequencyInput.value) {
                showFieldError(frequencyInput.id || `frequency-input-${index}`, window.getTranslation ? window.getTranslation('enter_medication_frequency') : '请输入用药频次');
                errors.push(`detail_${index}_frequency`);
            }
            
            if (!durationInput.value || parseInt(durationInput.value) <= 0) {
                showFieldError(durationInput.id || `duration-input-${index}`, window.getTranslation ? window.getTranslation('enter_valid_medication_days') : '请输入有效的用药天数');
                errors.push(`detail_${index}_duration`);
            }
            
            if (!quantityInput.value || parseInt(quantityInput.value) <= 0) {
                showFieldError(quantityInput.id || `quantity-input-${index}`, window.getTranslation ? window.getTranslation('enter_valid_quantity') : '请输入有效的数量');
                errors.push(`detail_${index}_quantity`);
            }
        });
    }
    
    return errors;
}

/**
 * 显示字段错误
 * @param {string} fieldId 字段ID
 * @param {string} message 错误消息
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // 添加错误样式
    field.classList.add('is-invalid');
    field.style.borderColor = '#dc3545';
    
    // 创建或更新错误消息
    let errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.875em';
        errorDiv.style.marginTop = '0.25rem';
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

/**
 * 清除表单错误样式
 */
function clearFormErrors() {
    // 清除所有错误样式
    const invalidFields = document.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
        field.style.borderColor = '';
    });
    
    // 移除所有错误消息
    const errorMessages = document.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(msg => msg.remove());
}

/**
 * 处理服务器返回的验证错误
 * @param {string} errorMessage 错误消息
 */
function handleServerValidationErrors(errorMessage) {
    // 清除之前的错误
    clearFormErrors();
    
    // 解析错误消息中的字段信息
    const fieldMappings = {
        'patient_id': 'patient-select',
        'doctor_id': 'doctor-select', 
        'prescription_date': 'prescription-date',
        'medical_record_id': 'medical-record-select',
        'details': 'details',
        'medicine_id': 'drug-select',
        'drug_id': 'drug-select',
        'frequency': 'frequency-input',
        'duration_days': 'duration-input',
        'days': 'duration-input',
        'quantity': 'quantity-input'
    };
    
    // 尝试从错误消息中提取字段信息
    for (const [serverField, elementId] of Object.entries(fieldMappings)) {
        if (errorMessage.includes(serverField)) {
            let message = '此字段有误';
            
            // 提取具体错误信息
            if (errorMessage.includes('required')) {
                message = window.getTranslation ? window.getTranslation('field_required') : '此字段为必填项';
            } else if (errorMessage.includes('invalid')) {
                message = window.getTranslation ? window.getTranslation('invalid_format') : '此字段格式不正确';
            } else if (errorMessage.includes('not found')) {
                message = window.getTranslation ? window.getTranslation('item_not_found') : '选择的项目不存在';
            }
            
            showFieldError(elementId, message);
        }
    }
    
    // 如果没有找到具体字段，显示通用错误
    if (!document.querySelector('.is-invalid')) {
        if (window.showModalNotification) {
            window.showModalNotification(window.getTranslation ? window.getTranslation('data_validation_failed') : '数据验证失败，请检查表单内容', 'error');
        } else {
            window.showNotification(window.getTranslation ? window.getTranslation('data_validation_failed') : '数据验证失败，请检查表单内容', 'error');
        }
    }
}

// 移除创建临时病历的逻辑，现在处方只能通过已有病历创建

/**
 * 保存处方
 */
window.savePrescription = async function() {
    try {
        const form = document.getElementById('prescription-form');
        const formData = new FormData(form);
        
        // 收集处方明细数据
        const details = [];
        const detailItems = document.querySelectorAll('.prescription-detail-item');
        
        for (const item of detailItems) {
            const drugId = item.querySelector('.drug-select').value;
            const frequency = item.querySelector('.frequency-input').value;
            const duration = item.querySelector('.duration-input').value;
            const quantity = item.querySelector('.quantity-input')?.value || '1'; // 默认数量为1
            
            if (!drugId || !frequency || !duration) {
                if (window.showModalNotification) {
                    window.showModalNotification(window.getTranslation ? window.getTranslation('fill_complete_medication_info') : '请填写完整的药品明细信息', 'error');
                } else {
                    window.showNotification(window.getTranslation ? window.getTranslation('fill_complete_medication_info') : '请填写完整的药品明细信息', 'error');
                }
                return;
            }
            
            details.push({
                drug_id: parseInt(drugId),
                dosage: '', // 剂量信息已包含在药品规格中，设为空字符串
                frequency: frequency,
                days: parseInt(duration),
                quantity: parseInt(quantity)
            });
        }
        
        // 获取medical_record_id - 必须从上下文中获取
        const medicalRecordId = document.getElementById('medical-record-select')?.value;
        if (!medicalRecordId) {
            throw new Error(window.getTranslation ? window.getTranslation('medical_record_required') : '必须选择病历才能开具处方');
        }
        
        // 安全获取表单元素值
        const patientSelectElement = document.getElementById('patient-select');
        const doctorSelectElement = document.getElementById('doctor-select');
        const prescriptionDateElement = document.getElementById('prescription-date');
        
        if (!patientSelectElement || !patientSelectElement.value) {
            throw new Error(window.getTranslation ? window.getTranslation('patient_required') : '请选择患者');
        }
        
        if (!doctorSelectElement || !doctorSelectElement.value) {
            throw new Error(window.getTranslation ? window.getTranslation('doctor_required') : '请选择医生');
        }
        
        if (!prescriptionDateElement || !prescriptionDateElement.value) {
            throw new Error(window.getTranslation ? window.getTranslation('prescription_date_required') : '请选择开具日期');
        }
        
        const prescriptionData = {
            patient_id: parseInt(patientSelectElement.value),
            doctor_id: parseInt(doctorSelectElement.value),
            prescription_date: prescriptionDateElement.value,
            medical_record_id: parseInt(medicalRecordId),
            details: details
        };
        
        // 验证必填字段
        const validationErrors = validatePrescriptionForm(prescriptionData, details);
        if (validationErrors.length > 0) {
            return;
        }
        
        await apiClient.prescriptions.create(prescriptionData);
        window.showNotification(window.getTranslation ? window.getTranslation('prescription_saved_successfully') : '处方保存成功，账单已自动生成', 'success');
        closePrescriptionModal();
        await loadPrescriptions();
        
    } catch (error) {
        console.error('保存处方失败:', error);
        
        // 处理服务器返回的验证错误
        if (error.message && error.message.includes('validation error')) {
            // 尝试解析验证错误并显示在表单上
            try {
                handleServerValidationErrors(error.message);
            } catch (e) {
                // 如果解析失败，回退到通知
                window.showNotification((window.getTranslation ? window.getTranslation('save_prescription_failed') : '保存处方失败') + ': ' + error.message, 'error');
            }
        } else {
            // 其他错误显示为通知
            window.showNotification((window.getTranslation ? window.getTranslation('save_prescription_failed') : '保存处方失败') + ': ' + error.message, 'error');
        }
    }
};

/**
 * 关闭处方模态框
 */
function closePrescriptionModal() {
    const modal = document.getElementById('prescription-modal');
    if (modal) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
        // 延迟移除DOM元素，确保动画完成
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }
}

// 暴露到全局作用域
window.closePrescriptionModal = closePrescriptionModal;
window.savePrescription = savePrescription;

/**
 * 显示处方详情模态框
 */
function showPrescriptionDetailsModal(prescription) {
    const modalHtml = `
        <div class="modal-overlay" id="prescription-details-modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3 data-i18n="prescription_details">处方详情</h3> - #${prescription.id}
                    <button class="modal-close" onclick="closePrescriptionDetailsModal()" data-i18n-title="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="prescription-info">
                        <div class="info-row">
                            <div class="info-item">
                                <label data-i18n="patient_name">患者姓名:</label>
                                <span>${prescription.patient?.name || (window.getTranslation ? window.getTranslation('unknown_patient') : '未知患者')}</span>
                            </div>
                            <div class="info-item">
                                <label data-i18n="doctor_name">医生姓名:</label>
                                <span>${prescription.doctor?.name || (window.getTranslation ? window.getTranslation('unknown_doctor') : '未知医生')}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-item">
                                <label data-i18n="prescription_date">开具日期:</label>
                                <span>${formatDate(prescription.prescription_date)}</span>
                            </div>
                            <div class="info-item">
                                <label data-i18n="dispensing_status">发药状态:</label>
                                <span class="status-badge ${getDispensingStatusClass(prescription.dispensing_status)}" data-i18n="dispensing.status.${prescription.dispensing_status}">
                                </span>
                            </div>
                        </div>
                        ${prescription.notes ? `
                            <div class="info-row">
                                <div class="info-item full-width">
                                    <label data-i18n="notes">备注:</label>
                                    <span>${prescription.notes}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="prescription-details">
                        <h4 data-i18n="medication_details">药品明细</h4>
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th data-i18n="medicine_name">药品名称</th>
                                    <th data-i18n="quantity">数量</th>
                                    <th data-i18n="specification">规格</th>
                                    <th data-i18n="frequency">用法用量</th>
                                    <th data-i18n="days">天数</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prescription.details?.map(detail => `
                                    <tr>
                                        <td>${detail.drug?.name || (window.getTranslation ? window.getTranslation('unknown_medicine') : '未知药品')}</td>
                                        <td>${detail.quantity}</td>
                                        <td>${detail.drug?.specification || '-'}</td>
                                        <td>${detail.frequency}</td>
                                        <td>${detail.days}${window.getTranslation ? window.getTranslation('days_unit') : '天'}</td>
                                    </tr>
                                `).join('') || `<tr><td colspan="5">${window.getTranslation ? window.getTranslation('no_medicine_details') : '暂无药品明细'}</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePrescriptionDetailsModal()" data-i18n="close">关闭</button>
                    ${prescription.dispensing_status === 'PENDING' ? 
                        `<button type="button" class="btn btn-success" onclick="dispensePrescription(${prescription.id}); closePrescriptionDetailsModal();" data-i18n="dispense">发药</button>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 应用翻译到新插入的模态框
    if (window.translatePage) {
        window.translatePage();
    }
    
    // 显示模态框
    const modal = document.getElementById('prescription-details-modal');
    if (modal) {
        // 先显示模态框
        modal.style.display = 'flex';
        // 添加active类触发动画
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // 添加点击背景关闭功能
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePrescriptionDetailsModal();
            }
        });
    }
}

/**
 * 关闭处方详情模态框
 */
window.closePrescriptionDetailsModal = function() {
    const modal = document.getElementById('prescription-details-modal');
    if (modal) {
        // 移除active类触发关闭动画
        modal.classList.remove('active');
        // 等待动画完成后移除DOM元素
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }
};