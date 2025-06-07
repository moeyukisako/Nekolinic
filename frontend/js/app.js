// frontend/js/app.js (最终正确版本)

// debounce 工具函数，用于限制函数调用频率
function debounce(func, delay = 1500) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.querySelector('.main-content');
    const sidebarNav = document.querySelector('.sidebar-nav');

    if (!mainContent || !sidebarNav) return;
    
    // 页面内容渲染函数的映射表
    const contentRenderers = {
        '仪表盘': renderDashboard,
        '患者管理': renderPatientModule,
        '病历管理': renderMedicalRecordsModule,
    };

    // 单一的主导航事件监听器
        sidebarNav.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLink = e.target.closest('a');
            if (!targetLink) return;

        sidebarNav.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            targetLink.classList.add('active');

        const moduleName = targetLink.textContent.trim();
        
        // 使用一个包装函数来调用渲染器，并处理错误
        renderModule(moduleName);
    });
    
    // 单一的主内容区事件监听器（事件委托）
    mainContent.addEventListener('click', mainContentHandler);
    mainContent.addEventListener('submit', mainContentHandler);
    
    // 添加input事件监听
    mainContent.addEventListener('input', function(e) {
        if (e.target.id === 'medical-records-patient-search') {
            const searchTerm = e.target.value.trim();
            if (searchTerm) {
                renderMedicalRecordsPatientList(1, searchTerm);
            } else {
                renderMedicalRecordsPatientList(1, '');
            }
        }
    });

    // 封装的模块渲染器
    function renderModule(moduleName) {
        mainContent.innerHTML = ''; // 切换前清空所有内容
        try {
            if (contentRenderers[moduleName]) {
                contentRenderers[moduleName](mainContent);
            } else {
                mainContent.innerHTML = `<h1>${moduleName}</h1><p>此模块正在建设中...</p>`;
            }
        } catch (error) {
            console.error(`渲染模块 "${moduleName}" 失败:`, error);
            mainContent.innerHTML = `<div class="error-message"><h2>渲染失败</h2><p>加载模块时发生严重错误。</p></div>`;
        }
    }

    // 默认加载仪表盘
        renderDashboard(mainContent);
});


// 全局唯一的事件处理器
async function mainContentHandler(e) {
    const target = e.target.closest('[data-action]');
    if (!target && e.type !== 'submit') return;

    let action;
    if(e.type === 'submit') {
        if(e.target.id === 'patient-form') action = 'submit-patient-form';
        // 移除旧的表单提交处理，因为现在使用自动保存
        else return;
        e.preventDefault();
    } else {
        action = target.dataset.action;
        e.preventDefault();
    }

    const id = target?.dataset.id;
    const patientId = target?.dataset.patientId;
    const page = parseInt(target?.dataset.page, 10);
    const query = target?.dataset.query;
    const mainContent = document.querySelector('.main-content');

    switch(action) {
        // --- 患者管理 ---
        case 'add-patient': showAddPatientModal(); break;
        case 'edit-patient': editPatient(id); break;
        case 'delete-patient': deletePatient(id, target.dataset.name); break;
        case 'close-modal': hidePatientModal(); break;
        case 'change-patient-page':
            const currentSearchTerm = document.getElementById('patient-search-input')?.value || '';
            loadAndDisplayPatients(page, currentSearchTerm);
            break;
        case 'submit-patient-form': handlePatientFormSubmit(e); break;
        case 'view-records': renderMedicalRecordModule(mainContent, id); break;
        
        // --- 病历管理 (患者选择) ---
        case 'search-medical-records-patient':
            const searchInput = document.getElementById('medical-records-patient-search');
            renderMedicalRecordsPatientList(1, searchInput?.value);
            break;
        case 'change-mr-patient-page':
            renderMedicalRecordsPatientList(page, query);
            break;
        case 'view-patient-records':
            renderMedicalRecordModule(mainContent, id);
            break;

        // --- 病历管理 (病历详情) ---
        case 'back-to-patient-selection': renderMedicalRecordsModule(mainContent); break;
        // 移除不再需要的旧版病历模态框相关操作
    }
}


// --- 渲染函数 ---

function renderDashboard(container) {
    container.innerHTML = `<div class="patient-module-wrapper"><h1>欢迎使用 Nekolinic 系统</h1><p>请从左侧菜单选择一个模块开始操作。</p></div>`;
}

function renderPatientModule(container) {
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div class="header-bar"><h1>患者管理</h1><button data-action="add-patient" class="btn btn-primary">添加新患者</button></div>
            <div class="search-bar"><input type="text" id="patient-search-input" placeholder="按姓名搜索患者..."></div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>姓名</th>
                            <th>性别</th>
                            <th>出生日期</th>
                            <th>电话</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="patient-table-body"></tbody>
                </table>
                <div id="pagination-container"></div>
            </div>
            <div id="patient-modal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" data-action="close-modal">&times;</span>
                    <h2 id="patient-modal-title">添加新患者</h2>
                    <form id="patient-form">
                        <input type="hidden" id="patient-id">
                        <div class="form-group">
                            <label for="patient-name">姓名 <span class="required">*</span></label>
                            <input type="text" id="patient-name" required>
                        </div>
                        <div class="form-group">
                            <label for="patient-gender">性别</label>
                            <select id="patient-gender">
                                <option value="男">男</option>
                                <option value="女">女</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="patient-birth">出生日期 <span class="required">*</span></label>
                            <input type="date" id="patient-birth" required placeholder="YYYY-MM-DD">
                        </div>
                        <div class="form-group">
                            <label for="patient-phone">电话</label>
                            <input type="tel" id="patient-phone">
                        </div>
                        <div class="form-group">
                            <label for="patient-address">地址</label>
                            <textarea id="patient-address"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存</button>
                            <button type="button" class="btn btn-secondary" data-action="close-modal">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    loadAndDisplayPatients(1, '');
}

async function renderMedicalRecordsModule(container) {
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div class="header-bar"><h1>病历管理</h1></div>
            <div class="search-bar"><input type="text" id="medical-records-patient-search" placeholder="按姓名搜索患者..."></div>
            <div id="medical-records-patient-list-container"></div>
            <div id="medical-records-patient-pagination-container"></div>
        </div>`;
    await renderMedicalRecordsPatientList(1, '');
}

async function renderMedicalRecordModule(container, patientId) {
    container.innerHTML = `<div class="patient-module-wrapper"><p>正在加载病历...</p></div>`;
    let patient;
    try {
        patient = await apiClient.patients.getById(patientId);
    } catch (error) {
        container.innerHTML = `<div class="error-message"><h2>加载患者信息失败</h2><p>${error.message}</p></div>`;
        return;
    }

    // 计算年龄
    const calculateAge = (birthDate) => {
        if (!birthDate) return '未知';
        const birth = new Date(birthDate);
        const ageDifMs = Date.now() - birth.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const patientAge = calculateAge(patient.birth_date);

    // 渲染可直接编辑的表单UI，将患者基本信息改为横排只读文本
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div class="header-bar">
                <h1>电子病历</h1>
                <div>
                    <span id="save-status" style="margin-right: 20px; color: #888; font-style: italic;"></span>
                    <button data-action="back-to-patient-selection" class="btn btn-secondary">返回患者列表</button>
                </div>
            </div>
            <div class="card">
                <form id="medical-record-form" data-patient-id="${patient.id}">
                    <input type="hidden" id="medical-record-id">
                    
                    <fieldset>
                        <legend>患者基本信息</legend>
                        <div class="patient-info-row">
                            <span class="patient-info-item">姓名：${patient.name}</span>
                            <span class="patient-info-item">性别：${patient.gender || '未填写'}</span>
                            <span class="patient-info-item">年龄：${patientAge}岁</span>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>临床记录</legend>
                        <div class="form-group">
                            <label for="record-date">就诊时间</label>
                            <input type="datetime-local" id="record-date" required>
                        </div>
                        <div class="form-group">
                            <label for="past-history">既往病史 (Past Medical History)</label>
                            <textarea id="past-history" rows="2" placeholder="请输入患者既往病史..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="symptoms">主诉与病症 (Symptoms)</label>
                            <textarea id="symptoms" rows="4"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="diagnosis">诊断 (Diagnosis)</label>
                            <textarea id="diagnosis" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="treatment-plan">处置意见 (Treatment Plan)</label>
                            <textarea id="treatment-plan" rows="4"></textarea>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    `;

    // 加载并填充最新病历数据和既往病史
    loadAndPopulateLatestRecord(patient);

    // 绑定自动保存事件
    const form = document.getElementById('medical-record-form');
    const debouncedSave = debounce(saveMedicalRecordChanges);
    form.addEventListener('input', debouncedSave);
}

async function loadAndPopulateLatestRecord(patient) {
    const form = document.getElementById('medical-record-form');
    
    // 填充既往病史字段
    form.querySelector('#past-history').value = patient.past_medical_history || '';
    
    try {
        const response = await apiClient.medicalRecords.getByPatientId(patient.id, 1, 1); // 获取第一页的第一条，即最新的
        let latestRecord;

        if (response.items && response.items.length > 0) {
            latestRecord = response.items[0];
        } else {
            // 如果没有记录，可能需要创建一个新的（或者后端已经创建了空白的）
            console.log("该患者没有病历，将显示空白表单。");
            latestRecord = { record_date: new Date().toISOString() }; // 默认值
        }

        // 填充表单
        form.querySelector('#medical-record-id').value = latestRecord.id || '';
        form.querySelector('#record-date').value = new Date(latestRecord.record_date).toISOString().slice(0, 16);
        form.querySelector('#symptoms').value = latestRecord.symptoms || '';
        form.querySelector('#diagnosis').value = latestRecord.diagnosis || '';
        form.querySelector('#treatment-plan').value = latestRecord.treatment_plan || '';
        
    } catch (error) {
        console.error("加载最新病历失败:", error);
        document.getElementById('save-status').textContent = '加载病历失败!';
        document.getElementById('save-status').style.color = '#b83b51';
    }
}

async function saveMedicalRecordChanges() {
    const form = document.getElementById('medical-record-form');
    if (!form) return;

    const statusEl = document.getElementById('save-status');
    statusEl.textContent = '正在保存...';
    statusEl.style.color = '#888';

    const recordId = form.querySelector('#medical-record-id').value;
    const patientId = form.dataset.patientId;

    // 1. 准备患者数据（只包含既往病史）
    const patientUpdateData = {
        past_medical_history: form.querySelector('#past-history').value
    };
    
    // 2. 准备病历数据
    const recordData = {
        record_date: new Date(form.querySelector('#record-date').value).toISOString(),
        symptoms: form.querySelector('#symptoms').value,
        diagnosis: form.querySelector('#diagnosis').value,
        treatment_plan: form.querySelector('#treatment-plan').value,
        notes: '' // notes字段暂时未在UI上体现，给个默认值
    };
    
    console.log('准备保存病历数据:', recordData);
    
    try {
        // 创建两个独立的保存任务
        const patientUpdatePromise = apiClient.patients.update(patientId, patientUpdateData);
        
        let recordUpdatePromise;
        if (recordId) {
            console.log('更新已有病历记录, ID:', recordId);
            recordUpdatePromise = apiClient.medicalRecords.update(recordId, recordData);
        } else {
            console.log('创建新病历记录');
            const recordCreateData = {
                ...recordData,
                patient_id: parseInt(patientId, 10),
                doctor_id: 1 // 临时医生ID
            };
            recordUpdatePromise = apiClient.medicalRecords.create(recordCreateData);
        }
        
        // 并行执行两个API请求
        const [patientResult, recordResult] = await Promise.all([
            patientUpdatePromise, 
            recordUpdatePromise
        ]);
        
        console.log('患者信息更新成功:', patientResult);
        console.log('病历保存成功:', recordResult);
        
        // 如果是新创建的病历，保存ID以便下次更新
        if (!recordId && recordResult && recordResult.id) {
            form.querySelector('#medical-record-id').value = recordResult.id;
            console.log('已将新病历ID写回表单:', recordResult.id);
        }
        
        statusEl.textContent = `已于 ${new Date().toLocaleTimeString()} 保存`;
        statusEl.style.color = 'green';
        
    } catch (error) {
        console.error("保存失败:", error);
        statusEl.textContent = `保存失败: ${error.message}`;
        statusEl.style.color = '#b83b51';
    }
}

// --- 数据加载与辅助函数 ---

async function loadAndDisplayPatients(page = 1, query = '') {
    const tableBody = document.getElementById('patient-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="6">正在加载...</td></tr>';
    if(paginationContainer) paginationContainer.innerHTML = '';
    
    try {
        const response = await apiClient.patients.getAll(page, 15, query);
        if (!response.items.length) {
            tableBody.innerHTML = '<tr><td colspan="6">未找到患者记录</td></tr>';
        return;
    }
        tableBody.innerHTML = response.items.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.gender||''}</td>
                <td>${p.birth_date||''}</td>
                <td>${p.contact_number||''}</td>
                <td>
                    <a href="#" class="action-link view" data-action="view-patient" data-id="${p.id}">查看</a>
                    <a href="#" class="action-link edit" data-action="edit-patient" data-id="${p.id}">编辑</a>
                    <a href="#" class="action-link delete" data-action="delete-patient" data-id="${p.id}" data-name="${p.name}">删除</a>
                    <a href="#" class="action-link" data-action="view-records" data-id="${p.id}">查看病历</a>
                </td>
            </tr>`).join('');
        
        const totalPages = Math.ceil(response.total / 15);
        renderPagination(paginationContainer, page, totalPages, query, 'change-patient-page');
    } catch(error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="error">加载失败: ${error.message}</td></tr>`;
    }
}

async function renderMedicalRecordsPatientList(page = 1, query = '') {
    const listContainer = document.getElementById('medical-records-patient-list-container');
    const paginationContainer = document.getElementById('medical-records-patient-pagination-container');
    if (!listContainer || !paginationContainer) return;
    listContainer.innerHTML = '<p>正在加载患者列表...</p>';
    paginationContainer.innerHTML = '';

    try {
        const response = await apiClient.patients.getAll(page, 15, query);
        if (!response.items || !response.items.length) {
            listContainer.innerHTML = `<p>${query ? '未找到匹配的患者' : '系统中没有患者'}</p>`;
            return;
        }
        listContainer.innerHTML = `
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>姓名</th>
                            <th>性别</th>
                            <th>出生日期</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.items.map(p => `
                            <tr>
                                <td>${p.id}</td>
                                <td>${p.name}</td>
                                <td>${p.gender || ''}</td>
                                <td>${p.birth_date || ''}</td>
                                <td>
                                    <a href="#" class="action-link" data-action="view-patient-records" data-id="${p.id}">查看病历</a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div id="medical-records-patient-pagination-container"></div>
            </div>`;
        const totalPages = Math.ceil(response.total / 15);
        renderPagination(document.getElementById('medical-records-patient-pagination-container'), page, totalPages, query, 'change-mr-patient-page');
    } catch(error) {
        listContainer.innerHTML = `<p class="error">加载患者列表失败: ${error.message}</p>`;
    }
}

function renderPagination(container, currentPage, totalPages, query, action, patientId = null) {
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    const patientIdAttr = patientId ? `data-patient-id="${patientId}"` : '';
    let html = `<div class="pagination-controls" style="display: flex; justify-content: flex-end; margin-top: 10px;">`;
    html += `<button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} data-action="${action}" data-page="${currentPage - 1}" data-query="${query}" ${patientIdAttr}>&lt; 上一页</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= 7 || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-action="${action}" data-page="${i}" data-query="${query}" ${patientIdAttr}>${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    html += `<button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-action="${action}" data-page="${currentPage + 1}" data-query="${query}" ${patientIdAttr}>下一页 &gt;</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

// 显示添加患者模态框
function showAddPatientModal() {
    const modalTitle = document.getElementById('patient-modal-title');
    const form = document.getElementById('patient-form');
    const idField = document.getElementById('patient-id');
    const modal = document.getElementById('patient-modal');
    
    if (modalTitle) modalTitle.textContent = '添加新患者';
    if (form) form.reset();
    if (idField) idField.value = '';
    if (modal) modal.style.display = 'block';
}

// 编辑患者
async function editPatient(id) {
    try {
        const patient = await apiClient.patients.getById(id);
        
        const modalTitle = document.getElementById('patient-modal-title');
        if (modalTitle) modalTitle.textContent = '编辑患者';
        
        // 填充表单
        const elements = {
            id: document.getElementById('patient-id'),
            name: document.getElementById('patient-name'),
            gender: document.getElementById('patient-gender'),
            birth: document.getElementById('patient-birth'),
            phone: document.getElementById('patient-phone'),
            address: document.getElementById('patient-address')
        };
        
        if (elements.id) elements.id.value = patient.id;
        if (elements.name) elements.name.value = patient.name || '';
        if (elements.gender) elements.gender.value = patient.gender || '';
        if (elements.birth) elements.birth.value = patient.birth_date || '';
        if (elements.phone) elements.phone.value = patient.contact_number || '';
        if (elements.address) elements.address.value = patient.address || '';
        
        // 显示模态框
        const modal = document.getElementById('patient-modal');
        if (modal) modal.style.display = 'block';
    } catch (error) {
        console.error('加载患者数据失败:', error);
        alert(`加载患者数据失败: ${error.message}`);
    }
}

// 隐藏患者模态框
function hidePatientModal() {
    const modal = document.getElementById('patient-modal');
    if (modal) modal.style.display = 'none';
}

// 处理患者表单提交
async function handlePatientFormSubmit(event) {
    if (!event) return;
    
    // 获取表单数据
    const idField = document.getElementById('patient-id');
    const patientId = idField ? idField.value : '';
    
    const patientData = {
        name: document.getElementById('patient-name')?.value?.trim() || '',
        gender: document.getElementById('patient-gender')?.value || '',
        birth_date: document.getElementById('patient-birth')?.value || '',
        contact_number: document.getElementById('patient-phone')?.value || '',
        address: document.getElementById('patient-address')?.value || ''
    };
    
    if (!patientData.name) {
        alert('姓名不能为空');
        return;
    }
    
    if (!patientData.birth_date) {
        alert('出生日期为必填项');
        return;
    }
    
    try {
        // 根据是否有ID决定是创建还是更新
        if (patientId) {
            await apiClient.patients.update(patientId, patientData);
            alert('患者信息更新成功');
        } else {
            await apiClient.patients.create(patientData);
            alert('患者添加成功');
        }
        
        // 关闭模态框并重新加载数据
        hidePatientModal();
        loadAndDisplayPatients(1, '');
    } catch (error) {
        console.error('保存患者数据失败:', error);
        alert(`操作失败: ${error.message}`);
    }
}

// 删除患者
async function deletePatient(id, name) {
    if (confirm(`确定要删除患者 ${name} 吗？此操作不可撤销。`)) {
        try {
            await apiClient.patients.delete(id);
            alert('删除成功');
            loadAndDisplayPatients(1, '');
        } catch (error) {
            console.error('删除患者失败:', error);
            alert(`删除失败: ${error.message}`);
            }
    }
}

// 查看患者详情
async function viewPatient(id) {
    try {
        const patient = await apiClient.patients.getById(id);
        alert(`
            患者详情：
            ID: ${patient.id}
            姓名: ${patient.name || ''}
            性别: ${patient.gender || '未填写'}
            出生日期: ${patient.birth_date || '未填写'}
            联系电话: ${patient.contact_number || '未填写'}
            地址: ${patient.address || '未填写'}
        `);
    } catch (error) {
        console.error('加载患者数据失败:', error);
        alert(`加载患者数据失败: ${error.message}`);
    }
} 