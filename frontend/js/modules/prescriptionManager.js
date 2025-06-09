import apiClient from '../apiClient.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';

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
                            <button id="add-prescription-btn" class="search-addon-btn" data-i18n="add_new_prescription">开具新处方</button>
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
    // 添加处方按钮
    const addBtn = document.getElementById('add-prescription-btn');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            try {
                await showPrescriptionModal();
            } catch (error) {
                console.error('显示处方模态框失败:', error);
                window.showNotification('打开处方表单失败: ' + error.message, 'error');
            }
        }, { signal });
    }
    
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
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-cell">正在加载处方数据...</td></tr>';
        
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
            tableBody.innerHTML = '<tr><td colspan="6" class="error-cell">加载处方数据失败</td></tr>';
        }
        window.showNotification('加载处方数据失败: ' + error.message, 'error');
    }
}

/**
 * 渲染处方表格
 */
function renderPrescriptionTable(prescriptions) {
    const tableBody = document.getElementById('prescription-table-body');
    if (!tableBody) return;
    
    if (prescriptions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无处方记录</td></tr>';
        return;
    }
    
    tableBody.innerHTML = prescriptions.map(prescription => {
        const statusText = getDispensingStatusText(prescription.dispensing_status);
        const statusClass = getDispensingStatusClass(prescription.dispensing_status);
        
        return `
            <tr>
                <td>#${prescription.id}</td>
                <td>${prescription.patient?.name || '未知患者'}</td>
                <td>${prescription.doctor?.name || '未知医生'}</td>
                <td>${formatDate(prescription.prescription_date)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="viewPrescriptionDetails(${prescription.id})" data-i18n="view">查看</button>
                    ${prescription.dispensing_status === 'PENDING' ? 
                        `<button class="btn btn-sm btn-success" onclick="dispensePrescription(${prescription.id})" data-i18n="dispense">发药</button>` : 
                        ''
                    }
                    <button class="btn btn-sm btn-danger" onclick="deletePrescription(${prescription.id})" data-i18n="delete">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 获取发药状态文本
 */
function getDispensingStatusText(status) {
    const statusMap = {
        'PENDING': '待发药',
        'DISPENSED': '已发药',
        'CANCELLED': '已取消'
    };
    return statusMap[status] || status;
}

/**
 * 获取发药状态样式类
 */
function getDispensingStatusClass(status) {
    const classMap = {
        'PENDING': 'status-warning',
        'DISPENSED': 'status-success',
        'CANCELLED': 'status-danger'
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
        window.showNotification('获取处方详情失败: ' + error.message, 'error');
    }
};

/**
 * 发药操作
 */
window.dispensePrescription = async function(prescriptionId) {
    if (!confirm('确认要为此处方发药吗？')) {
        return;
    }
    
    try {
        await apiClient.prescriptions.dispense(prescriptionId);
        window.showNotification('发药成功', 'success');
        await loadPrescriptions();
    } catch (error) {
        console.error('发药失败:', error);
        window.showNotification('发药失败: ' + error.message, 'error');
    }
};

/**
 * 删除处方
 */
window.deletePrescription = async function(prescriptionId) {
    if (!confirm('确认要删除此处方吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        await apiClient.prescriptions.delete(prescriptionId);
        window.showNotification('处方删除成功', 'success');
        await loadPrescriptions();
    } catch (error) {
        console.error('删除处方失败:', error);
        window.showNotification('删除处方失败: ' + error.message, 'error');
    }
};

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
    
    // 初始化模态框数据
    await initPrescriptionModal(prescription);
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('prescription-modal'));
    modal.show();
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
        
        // 清空现有选项
        const patientSelect = document.getElementById('patient-select');
        patientSelect.innerHTML = '<option value="">请选择患者</option>';
        
        // 填充患者选择框
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name;
            patientSelect.appendChild(option);
        });
        
        // 获取当前用户作为医生
        const currentUser = await apiClient.auth.getCurrentUser();
        const doctorSelect = document.getElementById('doctor-select');
        doctorSelect.innerHTML = '<option value="">请选择医生</option>';
        if (currentUser) {
            const option = document.createElement('option');
            option.value = currentUser.id;
            option.textContent = currentUser.name || currentUser.username;
            option.selected = true;
            doctorSelect.appendChild(option);
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
        window.showNotification('初始化处方表单失败: ' + error.message, 'error');
    }
}

/**
 * 添加处方明细项
 */
async function addPrescriptionDetail() {
    const container = document.getElementById('prescription-details-container');
    const detailHtml = `
        <div class="prescription-detail-item">
            <div class="form-row">
                <div class="form-group">
                    <select class="drug-select" required>
                        <option value="">请选择药品</option>
                    </select>
                </div>
                <div class="form-group">
                    <input type="number" class="dosage-input" placeholder="剂量" min="0.1" step="0.1" required>
                </div>
                <div class="form-group">
                    <input type="text" class="frequency-input" placeholder="用法用量" required>
                </div>
                <div class="form-group">
                    <input type="number" class="duration-input" placeholder="天数" min="1" required>
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-sm btn-danger remove-detail-btn">删除</button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', detailHtml);
    
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
                window.showNotification('至少需要保留一个药品明细', 'warning');
            }
        };
    });
}

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
            const dosage = item.querySelector('.dosage-input').value;
            const frequency = item.querySelector('.frequency-input').value;
            const duration = item.querySelector('.duration-input').value;
            
            if (!drugId || !dosage || !frequency || !duration) {
                window.showNotification('请填写完整的药品明细信息', 'error');
                return;
            }
            
            details.push({
                medicine_id: parseInt(drugId),
                dosage: parseFloat(dosage),
                frequency: frequency,
                duration_days: parseInt(duration)
            });
        }
        
        const prescriptionData = {
            patient_id: parseInt(document.getElementById('patient-select').value),
            doctor_id: parseInt(document.getElementById('doctor-select').value),
            prescription_date: document.getElementById('prescription-date').value,
            notes: document.getElementById('notes').value,
            details: details
        };
        
        if (!prescriptionData.patient_id || !prescriptionData.doctor_id) {
            window.showNotification('请选择患者和医生', 'error');
            return;
        }
        
        await apiClient.prescriptions.create(prescriptionData);
        window.showNotification('处方保存成功', 'success');
        closePrescriptionModal();
        await loadPrescriptions();
        
    } catch (error) {
        console.error('保存处方失败:', error);
        window.showNotification('保存处方失败: ' + error.message, 'error');
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
                                <span>${prescription.patient?.name || '未知患者'}</span>
                            </div>
                            <div class="info-item">
                                <label data-i18n="doctor_name">医生姓名:</label>
                                <span>${prescription.doctor?.name || '未知医生'}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-item">
                                <label data-i18n="prescription_date">开具日期:</label>
                                <span>${formatDate(prescription.prescription_date)}</span>
                            </div>
                            <div class="info-item">
                                <label data-i18n="dispensing_status">发药状态:</label>
                                <span class="status-badge ${getDispensingStatusClass(prescription.dispensing_status)}">
                                    ${getDispensingStatusText(prescription.dispensing_status)}
                                </span>
                            </div>
                        </div>
                        ${prescription.notes ? `
                            <div class="info-row">
                                <div class="info-item full-width">
                                    <label>备注:</label>
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
                                    <th>药品名称</th>
                                    <th>规格</th>
                                    <th>剂量</th>
                                    <th>用法用量</th>
                                    <th>天数</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prescription.details?.map(detail => `
                                    <tr>
                                        <td>${detail.medicine?.name || '未知药品'}</td>
                                        <td>${detail.medicine?.specification || '-'}</td>
                                        <td>${detail.dosage}</td>
                                        <td>${detail.frequency}</td>
                                        <td>${detail.duration_days}天</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5">暂无药品明细</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePrescriptionDetailsModal()">关闭</button>
                    ${prescription.dispensing_status === 'PENDING' ? 
                        `<button type="button" class="btn btn-success" onclick="dispensePrescription(${prescription.id}); closePrescriptionDetailsModal();">发药</button>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 关闭处方详情模态框
 */
window.closePrescriptionDetailsModal = function() {
    const modal = document.getElementById('prescription-details-modal');
    if (modal) {
        modal.remove();
    }
};