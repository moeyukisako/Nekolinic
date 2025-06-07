// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取主题切换器元素
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;

    // 从localStorage读取保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 应用保存的主题
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitcher.value = 'dark';
    } else {
        document.body.removeAttribute('data-theme');
        themeSwitcher.value = 'light';
    }
    
    // 监听主题切换事件
    themeSwitcher.addEventListener('change', function() {
        if (this.value === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // 导航与内容切换功能
    const sidebarNav = document.querySelector('.sidebar-nav');
    const mainContent = document.querySelector('.main-content');
    
    // 页面内容渲染函数映射
    const contentRenderers = {
        '仪表盘': renderDashboard,
        '患者管理': renderPatientModule,
        '病历管理': renderMedicalRecordsModule,
        // ... 其他模块的渲染函数 ...
    };

    // 导航点击事件处理 - 如果侧边栏存在
    if (sidebarNav) {
        const links = sidebarNav.querySelectorAll('a');
        
        sidebarNav.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLink = e.target.closest('a');
            if (!targetLink) return;

            // 更新激活状态
            links.forEach(link => link.classList.remove('active'));
            targetLink.classList.add('active');

            // 渲染对应内容
            const moduleName = targetLink.textContent;
            if (contentRenderers[moduleName] && mainContent) {
                contentRenderers[moduleName](mainContent);
            } else if (mainContent) {
                mainContent.innerHTML = `<h1>${moduleName}</h1><p>此模块正在建设中...</p>`;
            }
        });
    }

    // 如果存在主内容区域，默认加载仪表盘
    if (mainContent) {
        renderDashboard(mainContent);
    }
});

// 渲染函数示例
function renderDashboard(container) {
    if (!container) return;
    
    container.innerHTML = `
        <h1>欢迎使用 Nekolinic 系统</h1>
        <p>请从左侧菜单选择一个模块开始操作。</p>
    `;
}

// 全局变量，缓存患者数据用于搜索
let allPatients = []; 
let currentPage = 0;
let pageSize = 15;
let totalPages = 0;
let totalPatients = 0;
let isSearchMode = false;
let currentSearchTerm = '';

// 患者管理模块的渲染函数
function renderPatientModule(container) {
    if (!container) return;
    
    // 1. 渲染基础HTML结构
    container.innerHTML = `
        <div id="patient-module-container" class="patient-module-wrapper">
            <div id="patient-module-content">
            <div class="header-bar">
                <h1>患者管理</h1>
                <button data-action="add-patient" class="btn btn-primary">添加新患者</button>
            </div>
            <div class="search-bar">
                <input type="text" id="patient-search-input" placeholder="按姓名搜索患者...">
            </div>
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
                    <tbody id="patient-table-body">
                    </tbody>
                </table>
                <div id="pagination-container" class="pagination-container">
                    <div class="pagination-info">显示 <span id="pagination-range">0-0</span> 条，共 <span id="pagination-total">0</span> 条</div>
                    <div class="pagination-controls">
                        <button id="pagination-prev" class="pagination-btn" disabled>&lt; 上一页</button>
                        <div id="pagination-pages" class="pagination-pages"></div>
                        <button id="pagination-next" class="pagination-btn" disabled>下一页 &gt;</button>
                    </div>
                </div>
            </div>
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
                            <input type="date" id="patient-birth" required placeholder="YYYY-MM-DD" title="请使用YYYY-MM-DD格式（例如：2000-01-31）">
                            <small style="display:block; color:#666; font-size:0.8rem; margin-top:0.25rem;">格式要求：YYYY-MM-DD（例如：2000-01-31）</small>
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
        </div>
    `;

    // 2. 事件委托
    const moduleContainer = document.getElementById('patient-module-container');
    if (moduleContainer) {
        moduleContainer.addEventListener('click', function(e) {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const id = target.dataset.id;
            const name = target.dataset.name;
            const page = target.dataset.page;

            switch (action) {
                case 'add-patient':
                    showAddPatientModal();
                    break;
                case 'view-patient':
                    viewPatient(id);
                    break;
                case 'edit-patient':
                    editPatient(id);
                    break;
                case 'delete-patient':
                    deletePatient(id, name);
                    break;
                case 'close-modal':
                    hidePatientModal();
                    break;
                case 'change-page':
                    if (page !== undefined) {
                        goToPage(parseInt(page));
                    }
                    break;
                case 'view-records':
                    renderMedicalRecordModule(mainContent, id);
                    break;
            }
        });
    }

    // 3. 分页按钮事件
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 0) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentPage < totalPages - 1) {
                goToPage(currentPage + 1);
            }
        });
    }

    // 搜索框的input事件需要单独绑定
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // 表单提交事件需要单独绑定
    const patientForm = document.getElementById('patient-form');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientFormSubmit);
        setupFormValidation();
    }

    // 重置分页状态
    resetPaginationState();
    
    // 4. 初始加载数据
    if (window.apiClient && window.apiClient.patients) {
        loadAndDisplayPatients();
    } else {
        console.error('API客户端不可用，无法加载患者数据');
        const tableBody = document.getElementById('patient-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-danger">API客户端初始化错误，请刷新页面重试</td></tr>';
        }
    }
}

// 重置分页状态
function resetPaginationState() {
    currentPage = 0;
    allPatients = [];
    totalPages = 0;
    totalPatients = 0;
    isSearchMode = false;
    currentSearchTerm = '';
}

// 前往指定页
function goToPage(page) {
    if (page < 0 || page >= totalPages) {
        return;
    }
    
    currentPage = page;
    loadAndDisplayPatients();
}

// 更新分页器UI (优化后)
function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    const paginationRange = document.getElementById('pagination-range');
    const paginationTotal = document.getElementById('pagination-total');
    const paginationPages = document.getElementById('pagination-pages');
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (!paginationContainer || !paginationRange || !paginationTotal || !paginationPages || !prevBtn || !nextBtn) {
        return;
    }
    
    // 如果总页数小于等于1，则隐藏整个分页组件
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    paginationContainer.style.display = ''; // 确保在需要时显示

    const startItem = totalPatients > 0 ? (currentPage * pageSize) + 1 : 0;
    const endItem = Math.min((currentPage + 1) * pageSize, totalPatients);
    
    paginationRange.textContent = `${startItem}-${endItem}`;
    paginationTotal.textContent = totalPatients;
    
    prevBtn.disabled = (currentPage === 0);
    nextBtn.disabled = (currentPage >= totalPages - 1);
    
    let pagesHTML = '';
    
    if (totalPages <= 4) {
        // 总页数小于等于4页，则全部显示
        for (let i = 0; i < totalPages; i++) {
            pagesHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-action="change-page" data-page="${i}">${i + 1}</button>`;
        }
    } else {
        // 总页数大于4页，智能显示
        const pagesToShow = new Set();
        pagesToShow.add(0); // 始终显示第一页
        pagesToShow.add(totalPages - 1); // 始终显示最后一页

        // 添加当前页和其前后两页
        for (let i = -2; i <= 2; i++) {
            const page = currentPage + i;
            if (page > 0 && page < totalPages - 1) {
                pagesToShow.add(page);
            }
        }

        let lastPage = -1;
        Array.from(pagesToShow).sort((a, b) => a - b).forEach(i => {
            if (lastPage !== -1 && i > lastPage + 1) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            pagesHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-action="change-page" data-page="${i}">${i + 1}</button>`;
            lastPage = i;
        });
    }
    
    paginationPages.innerHTML = pagesHTML;
}

// 加载并显示患者数据 (修复后)
async function loadAndDisplayPatients() {
    const tableBody = document.getElementById('patient-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6">正在加载...</td></tr>';

    try {
        if (!window.apiClient || !window.apiClient.patients) {
            throw new Error('API客户端未初始化');
        }
        
        const skipCount = currentPage * pageSize;
        let response;
        
        // 根据是否搜索模式调用不同的API
        if (isSearchMode && currentSearchTerm) {
            response = await window.apiClient.patients.search(currentSearchTerm, skipCount, pageSize);
        } else {
            response = await window.apiClient.patients.getAll(skipCount, pageSize);
        }
        
        // **核心修改**：检查并解析新的响应格式
        if (response && typeof response.total === 'number' && Array.isArray(response.items)) {
            totalPatients = response.total; // 直接从后端获取准确的总数
            allPatients = response.items;   // 获取当页的数据
            totalPages = Math.ceil(totalPatients / pageSize);
            
            // 渲染表格和分页
            renderPatientTable(allPatients);
            updatePagination();
        } else {
            // 如果API响应格式不正确，抛出错误
            throw new Error('API返回数据格式不正确，期望格式为 {total: number, items: array}');
        }
        
    } catch (error) {
        console.error('加载患者数据失败:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">加载失败: ${error.message}</td></tr>`;
        }
    }
}

// 渲染患者表格
function renderPatientTable(patients) {
    const tableBody = document.getElementById('patient-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // 清空表格
    
    if (!patients || patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">未找到患者。</td></tr>';
        return;
    }
    
    // 渲染数据
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.gender || ''}</td>
            <td>${patient.birth_date || ''}</td>
            <td>${patient.contact_number || ''}</td>
            <td>
                <a href="#" class="action-link view" data-action="view-patient" data-id="${patient.id}">查看</a>
                <a href="#" class="action-link edit" data-action="edit-patient" data-id="${patient.id}">编辑</a>
                <a href="#" class="action-link delete" data-action="delete-patient" data-id="${patient.id}" data-name="${patient.name}">删除</a>
                <a href="#" class="action-link" data-action="view-records" data-id="${patient.id}">查看病历</a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 搜索功能
function handleSearch(event) {
    if (!event || !event.target) return;
    
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // 重置分页状态
    currentPage = 0;
    totalPages = 0;
    totalPatients = 0;
    
    // 根据搜索词是否为空决定是搜索模式还是普通加载
    isSearchMode = searchTerm.length > 0;
    currentSearchTerm = searchTerm;
    
    // 重新加载第一页数据
    loadAndDisplayPatients();
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
    
    // 清除所有错误提示
    clearFormErrors();
    
    // 在短暂延迟后检查表单状态，确保DOM已更新
    setTimeout(() => {
        validatePatientForm();
        setupFormValidation();
    }, 100);
}

// 显示编辑患者模态框
async function editPatient(id) {
    if (!window.apiClient || !window.apiClient.patients) {
        alert('API客户端未初始化，无法编辑患者');
        return;
    }
    
    try {
        const patient = await window.apiClient.patients.getById(id);
        
        const modalTitle = document.getElementById('patient-modal-title');
        if (modalTitle) modalTitle.textContent = '编辑患者';
        
        // 安全地填充表单
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
        
        // 清除所有错误提示
        clearFormErrors();
        
        // 在短暂延迟后检查表单状态，确保DOM已更新
        setTimeout(() => {
            validatePatientForm();
            setupFormValidation();
        }, 100);
    } catch (error) {
        console.error('加载患者数据失败:', error);
        alert(`加载患者数据失败: ${error.message}`);
    }
}

// 清除表单错误提示
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => el.remove());
}

// 显示表单错误提示
function showFormError(inputElement, errorMessage) {
    // 先清除可能已存在的错误消息
    const parent = inputElement.parentElement;
    const existingError = parent.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 创建错误消息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = errorMessage;
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '0.25rem';
    
    // 添加到表单组中
    parent.appendChild(errorElement);
    
    // 设置输入框边框为红色
    inputElement.style.borderColor = 'red';
    
    // 添加输入事件监听，当用户修改内容时清除错误提示并重新验证表单
    inputElement.addEventListener('input', function() {
        const error = parent.querySelector('.form-error');
        if (error) {
            error.remove();
            inputElement.style.borderColor = '';
        }
        
        // 重新验证表单
        validatePatientForm();
    }, { once: true });
}

// 验证日期格式是否为YYYY-MM-DD
function isValidDateFormat(dateString) {
    // 不允许空日期
    if (!dateString) return false;
    
    // 检查是否符合YYYY-MM-DD格式
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // 验证日期是否有效
    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (isNaN(timestamp)) return false;
    
    // 检查是否与输入的格式一致（避免自动转换，如2023/12/01）
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return formattedDate === dateString;
}

// 验证表单
function validatePatientForm() {
    const nameInput = document.getElementById('patient-name');
    const birthInput = document.getElementById('patient-birth');
    const submitButton = document.querySelector('#patient-form button[type="submit"]');
    let isValid = true;
    
    // 检查名称是否为空
    if (!nameInput || !nameInput.value.trim()) {
        isValid = false;
        if (nameInput && !nameInput.parentElement.querySelector('.form-error')) {
            nameInput.style.borderColor = 'red';
        }
    }
    
    // 验证出生日期是否存在且格式正确
    if (!birthInput || !birthInput.value || !isValidDateFormat(birthInput.value)) {
        isValid = false;
        if (birthInput && !birthInput.parentElement.querySelector('.form-error')) {
            birthInput.style.borderColor = 'red';
        }
    }
    
    // 设置保存按钮状态
    if (submitButton) {
        submitButton.disabled = !isValid;
        if (isValid) {
            submitButton.classList.remove('btn-disabled');
            submitButton.classList.add('btn-primary');
        } else {
            submitButton.classList.add('btn-disabled');
            submitButton.classList.remove('btn-primary');
        }
    }
    
    return isValid;
}

// 为表单添加验证监听器
function setupFormValidation() {
    const formInputs = document.querySelectorAll('#patient-form input, #patient-form select, #patient-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', validatePatientForm);
        input.addEventListener('change', validatePatientForm);
    });
}

// 隐藏患者模态框
function hidePatientModal() {
    const modal = document.getElementById('patient-modal');
    if (modal) modal.style.display = 'none';
}

// 处理患者表单提交
async function handlePatientFormSubmit(event) {
    if (!event) return;
    event.preventDefault();
    
    // 清除之前的错误提示
    clearFormErrors();
    
    if (!window.apiClient || !window.apiClient.patients) {
        alert('API客户端未初始化，无法保存患者数据');
        return;
    }
    
    // 安全地收集表单数据
    const elements = {
        id: document.getElementById('patient-id'),
        name: document.getElementById('patient-name'),
        gender: document.getElementById('patient-gender'),
        birth: document.getElementById('patient-birth'),
        phone: document.getElementById('patient-phone'),
        address: document.getElementById('patient-address')
    };
    
    // 仅当表单元素存在时获取其值
    const patientId = elements.id ? elements.id.value : '';
    
    // 验证日期格式
    const birthDate = elements.birth ? elements.birth.value : '';
    if (!birthDate) {
        showFormError(elements.birth, '出生日期为必填项');
        return;
    }
    if (!isValidDateFormat(birthDate)) {
        showFormError(elements.birth, '请输入正确的日期格式：YYYY-MM-DD (例如：2000-01-31)');
        return;
    }
    
    // 验证姓名是否为空
    const name = elements.name ? elements.name.value.trim() : '';
    if (!name) {
        showFormError(elements.name, '姓名不能为空');
        return;
    }
    
    const patientData = {
        name: name,
        gender: elements.gender ? elements.gender.value : '',
        birth_date: birthDate,
        contact_number: elements.phone ? elements.phone.value : '',
        address: elements.address ? elements.address.value : ''
    };
    
    // 获取提交按钮并禁用
    const submitButton = event.submitter;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '保存中...';
    }
    
    try {
        // 根据是否有ID决定是创建还是更新
        if (patientId) {
            await window.apiClient.patients.update(patientId, patientData);
            alert('患者信息更新成功');
        } else {
            await window.apiClient.patients.create(patientData);
            alert('患者添加成功');
        }
        
        // 关闭模态框并重新加载数据
        hidePatientModal();
        loadAndDisplayPatients();
    } catch (error) {
        console.error('保存患者数据失败:', error);
        alert(`操作失败: ${error.message}`);
        
        // 如果是422错误，可能是日期格式问题
        if (error.message.includes('422') && elements.birth) {
            showFormError(elements.birth, '日期格式不正确，请使用YYYY-MM-DD格式 (例如：2000-01-31)');
        }
    } finally {
        // 恢复按钮状态
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '保存';
        }
    }
}

// 删除患者
async function deletePatient(id, name) {
    if (!window.apiClient || !window.apiClient.patients) {
        showNotification('错误', 'API客户端未初始化，无法删除患者', 'error');
        return;
    }
    
    // 使用自定义模态框代替confirm
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');
    const modal = document.getElementById('notification-modal');
    const cancelBtn = document.getElementById('modal-cancel');
    
    if (modalTitle) modalTitle.textContent = '确认删除';
    if (modalBody) modalBody.textContent = `确定要删除患者 ${name} 吗？此操作不可撤销。`;
    
    // 显示确认和取消按钮
    if (confirmBtn) {
        confirmBtn.textContent = '删除';
        confirmBtn.style.display = '';
        confirmBtn.className = 'btn btn-danger';
    }
    
    if (cancelBtn) {
        cancelBtn.style.display = '';
    }
    
    // 设置确认按钮事件
    if (confirmBtn) {
        // 移除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', async function() {
            try {
                modal.classList.remove('active');
            await window.apiClient.patients.delete(id);
                showNotification('成功', '删除成功', 'info');
            loadAndDisplayPatients();
        } catch (error) {
            console.error('删除患者失败:', error);
                showNotification('错误', `删除失败: ${error.message}`, 'error');
            }
        });
    }
    
    if (modal) modal.classList.add('active');
}

// 查看患者详情
async function viewPatient(id) {
    if (!window.apiClient || !window.apiClient.patients) {
        showNotification('错误', 'API客户端未初始化，无法查看患者', 'error');
        return;
    }
    
    try {
        const patient = await window.apiClient.patients.getById(id);
        
        // 创建患者详情的HTML - 使用表格格式
        const detailsHtml = `
            <div class="patient-detail-view">
                <table class="patient-detail-table">
                    <tr>
                        <th>ID</th>
                        <td>${patient.id}</td>
                    </tr>
                    <tr>
                        <th>姓名</th>
                        <td>${patient.name || ''}</td>
                    </tr>
                    <tr>
                        <th>性别</th>
                        <td>${patient.gender || '未填写'}</td>
                    </tr>
                    <tr>
                        <th>出生日期</th>
                        <td>${patient.birth_date || '未填写'}</td>
                    </tr>
                    <tr>
                        <th>联系电话</th>
                        <td>${patient.contact_number || '未填写'}</td>
                    </tr>
                    <tr>
                        <th>地址</th>
                        <td>${patient.address || '未填写'}</td>
                    </tr>
                    <tr>
                        <th>创建时间</th>
                        <td>${formatDate(patient.created_at) || ''}</td>
                    </tr>
                    <tr>
                        <th>更新时间</th>
                        <td>${formatDate(patient.updated_at) || ''}</td>
                    </tr>
                </table>
            </div>
        `;
        
        // 显示通知模态框
        showNotification(`患者详情：${patient.name}`, detailsHtml, 'info');
    } catch (error) {
        console.error('加载患者数据失败:', error);
        showNotification('错误', `加载患者数据失败: ${error.message}`, 'error');
    }
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// 全局变量，用于病历管理
let currentPatientForRecords = null;
let medicalRecordsCurrentPage = 0;
const medicalRecordsPageSize = 15; // 可自定义

async function renderMedicalRecordModule(container, patientId) {
    if (!container || !patientId) return;

    // 首先确保病历管理部分显示
    const section = document.getElementById('medical-records-section');
    if (section) {
        // 先隐藏其他所有部分
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        // 显示病历管理部分
        section.style.display = 'block';
        
        // 更新侧边栏的激活状态
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.sidebar-item[data-section="medical-records"]')?.classList.add('active');
    }

    // 处理容器
    let targetContainer = container;
    if (section) {
        const medicalRecordsContainer = section.querySelector('#medical-records-container');
        if (medicalRecordsContainer) {
            targetContainer = medicalRecordsContainer;
        }
    }

    try {
        // 获取当前患者信息，用于显示标题
        currentPatientForRecords = await window.apiClient.patients.getById(patientId);
    } catch (error) {
        targetContainer.innerHTML = `<h1>错误</h1><p>无法加载患者信息: ${error.message}</p>`;
        return;
    }
    
    // 渲染UI骨架，与患者管理模块高度相似
    targetContainer.innerHTML = `
        <div id="medical-record-module-container">
            <div class="header-bar">
                <h1>病历管理: ${currentPatientForRecords.name}</h1>
                <button data-action="add-record" class="btn btn-primary">添加新病历</button>
                <button data-action="back-to-records" class="btn btn-secondary">返回患者选择</button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>病历ID</th>
                            <th>就诊日期</th>
                            <th>主诉症状</th>
                            <th>诊断结果</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="record-table-body"></tbody>
                </table>
                <div id="record-pagination-container" class="pagination-container">
                </div>
            </div>

            <div id="record-modal" class="modal">
                <div class="modal-content large"> <span class="close-btn" data-action="close-record-modal">&times;</span>
                    <h2 id="record-modal-title">添加新病历</h2>
                    <form id="record-form">
                        <input type="hidden" id="record-id">
                        <fieldset>
                            <legend>基本信息</legend>
                            <div class="form-group">
                                <label for="record-date">就诊日期</label>
                                <input type="datetime-local" id="record-date" required>
                            </div>
                            <div class="form-group">
                                <label for="record-symptoms">主诉症状</label>
                                <textarea id="record-symptoms" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="record-diagnosis">诊断结果</label>
                                <textarea id="record-diagnosis" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="record-treatment">治疗方案</label>
                                <textarea id="record-treatment" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="record-notes">备注</label>
                                <textarea id="record-notes" rows="2"></textarea>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>生命体征</legend>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="vital-temp">体温 (°C)</label>
                                    <input type="number" step="0.1" id="vital-temp" placeholder="例如 36.5">
                                </div>
                                <div class="form-group">
                                    <label for="vital-hr">心率 (次/分)</label>
                                    <input type="number" id="vital-hr" placeholder="例如 75">
                                </div>
                                <div class="form-group">
                                    <label for="vital-bp">血压 (mmHg)</label>
                                    <input type="text" id="vital-bp" placeholder="例如 120/80">
                                </div>
                                <div class="form-group">
                                    <label for="vital-rr">呼吸频率 (次/分)</label>
                                    <input type="number" id="vital-rr" placeholder="例如 18">
                                </div>
                                <div class="form-group">
                                    <label for="vital-sat">血氧饱和度 (%)</label>
                                    <input type="number" step="0.1" id="vital-sat" placeholder="例如 98.5">
                                </div>
                            </div>
                        </fieldset>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存</button>
                            <button type="button" class="btn btn-secondary" data-action="close-record-modal">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 绑定事件监听器
    setupMedicalRecordEventListeners();

    // 初始加载第一页病历数据
    medicalRecordsCurrentPage = 0;
    loadAndDisplayRecords(patientId);
}

function setupMedicalRecordEventListeners() {
    const container = document.getElementById('medical-record-module-container');
    if (!container) return;

    // 使用事件委托
    container.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const recordId = target.dataset.id;

        switch (action) {
            case 'add-record':
                showAddRecordModal();
                break;
            case 'edit-record':
                showEditRecordModal(recordId);
                break;
            case 'delete-record':
                deleteRecord(recordId);
                break;
            case 'close-record-modal':
                hideRecordModal();
                break;
            case 'change-record-page':
                const page = parseInt(target.dataset.page, 10);
                goToRecordPage(page);
                break;
            case 'back-to-records':
                // 返回患者选择
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    // 检查是否从病历管理模块进入
                    const medicalRecordsSection = document.getElementById('medical-records-section');
                    const patientsSection = document.getElementById('patients-section');
                    const activeSidebar = document.querySelector('.sidebar-item.active');
                    
                    if (activeSidebar && activeSidebar.getAttribute('data-section') === 'medical-records') {
                        // 如果侧边栏激活的是病历管理，返回病历管理的患者选择页面
                        renderMedicalRecordsModule(mainContent);
                    } else {
                        // 否则默认返回患者管理模块
                        renderPatientModule(mainContent);
                    }
                }
                break;
        }
    });

    // 表单提交
    const recordForm = document.getElementById('record-form');
    if (recordForm) {
        recordForm.addEventListener('submit', handleRecordFormSubmit);
    }
}

async function loadAndDisplayRecords(patientId) {
    const tableBody = document.getElementById('record-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">正在加载病历...</td></tr>';

    try {
        const skip = medicalRecordsCurrentPage * medicalRecordsPageSize;
        const response = await window.apiClient.medicalRecords.getByPatientId(patientId, skip, medicalRecordsPageSize);
        
        tableBody.innerHTML = '';
        if (response.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">该患者暂无病历记录。</td></tr>';
            return;
        }

        response.items.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.id}</td>
                <td>${new Date(record.record_date).toLocaleString()}</td>
                <td>${(record.symptoms || '').substring(0, 20)}${record.symptoms && record.symptoms.length > 20 ? '...' : ''}</td>
                <td>${(record.diagnosis || '').substring(0, 20)}${record.diagnosis && record.diagnosis.length > 20 ? '...' : ''}</td>
                <td>
                    <button class="btn btn-secondary" data-action="edit-record" data-id="${record.id}">编辑</button>
                    <button class="btn btn-danger" data-action="delete-record" data-id="${record.id}">删除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // 调用分页渲染函数
        renderRecordPagination(response.total, medicalRecordsCurrentPage, medicalRecordsPageSize);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">加载病历失败: ${error.message}</td></tr>`;
    }
}

function renderRecordPagination(totalItems, currentPage, pageSize) {
    const container = document.getElementById('record-pagination-container');
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // 如果总页数小于等于1，则隐藏整个分页组件
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = ''; // 确保在需要时显示
    
    const startItem = totalItems > 0 ? (currentPage * pageSize) + 1 : 0;
    const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
    
    let paginationHTML = `<div class="pagination-info">显示 ${startItem}-${endItem} 条，共 ${totalItems} 条</div>`;
    paginationHTML += `<div class="pagination-controls">`;
    paginationHTML += `<button class="pagination-btn" ${currentPage === 0 ? 'disabled' : ''} data-action="change-record-page" data-page="${currentPage - 1}">&lt; 上一页</button>`;
    
    paginationHTML += `<div class="pagination-pages">`;
    
    if (totalPages <= 4) {
        // 总页数小于等于4页，则全部显示
        for (let i = 0; i < totalPages; i++) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-action="change-record-page" data-page="${i}">${i + 1}</button>`;
        }
    } else {
        // 总页数大于4页，智能显示
        const pagesToShow = new Set();
        pagesToShow.add(0); // 始终显示第一页
        pagesToShow.add(totalPages - 1); // 始终显示最后一页

        // 添加当前页和其前后两页
        for (let i = -2; i <= 2; i++) {
            const page = currentPage + i;
            if (page > 0 && page < totalPages - 1) {
                pagesToShow.add(page);
            }
        }

        let lastPage = -1;
        Array.from(pagesToShow).sort((a, b) => a - b).forEach(i => {
            if (lastPage !== -1 && i > lastPage + 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-action="change-record-page" data-page="${i}">${i + 1}</button>`;
            lastPage = i;
        });
    }
    
    paginationHTML += `</div>`;
    
    paginationHTML += `<button class="pagination-btn" ${currentPage >= totalPages - 1 ? 'disabled' : ''} data-action="change-record-page" data-page="${currentPage + 1}">下一页 &gt;</button>`;
    paginationHTML += `</div>`;
    
    container.innerHTML = paginationHTML;
}

function goToRecordPage(page) {
    medicalRecordsCurrentPage = page;
    loadAndDisplayRecords(currentPatientForRecords.id);
}

function showAddRecordModal() {
    document.getElementById('record-form').reset();
    document.getElementById('record-id').value = '';
    document.getElementById('record-modal-title').textContent = '添加新病历';
    document.getElementById('record-modal').style.display = 'block';
    
    // 设置默认的就诊日期为当前时间
    const now = new Date();
    const dateTimeStr = now.toISOString().slice(0, 16); // 格式：2023-11-23T10:30
    document.getElementById('record-date').value = dateTimeStr;
}

async function showEditRecordModal(recordId) {
    document.getElementById('record-form').reset();
    try {
        const record = await window.apiClient.medicalRecords.getById(recordId);
        
        document.getElementById('record-id').value = record.id;
        document.getElementById('record-modal-title').textContent = '编辑病历';
        
        // 填充表单
        document.getElementById('record-date').value = new Date(record.record_date).toISOString().slice(0, 16);
        document.getElementById('record-symptoms').value = record.symptoms || '';
        document.getElementById('record-diagnosis').value = record.diagnosis || '';
        document.getElementById('record-treatment').value = record.treatment_plan || '';
        document.getElementById('record-notes').value = record.notes || '';

        if (record.vital_sign) {
            document.getElementById('vital-temp').value = record.vital_sign.temperature || '';
            document.getElementById('vital-hr').value = record.vital_sign.heart_rate || '';
            document.getElementById('vital-bp').value = record.vital_sign.blood_pressure || '';
            document.getElementById('vital-rr').value = record.vital_sign.respiratory_rate || '';
            document.getElementById('vital-sat').value = record.vital_sign.oxygen_saturation || '';
        }
        
        document.getElementById('record-modal').style.display = 'block';
    } catch (error) {
        alert('加载病历信息失败: ' + error.message);
    }
}

function hideRecordModal() {
    document.getElementById('record-modal').style.display = 'none';
}

async function handleRecordFormSubmit(event) {
    event.preventDefault();
    const recordId = document.getElementById('record-id').value;

    const recordData = {
        patient_id: currentPatientForRecords.id,
        doctor_id: 1, // 临时的医生ID，后续应从当前登录用户获取
        record_date: new Date(document.getElementById('record-date').value).toISOString(),
        symptoms: document.getElementById('record-symptoms').value,
        diagnosis: document.getElementById('record-diagnosis').value,
        treatment_plan: document.getElementById('record-treatment').value,
        notes: document.getElementById('record-notes').value,
        vital_sign: { // 将生命体征作为嵌套对象
            temperature: parseFloat(document.getElementById('vital-temp').value) || null,
            heart_rate: parseInt(document.getElementById('vital-hr').value, 10) || null,
            blood_pressure: document.getElementById('vital-bp').value,
            respiratory_rate: parseInt(document.getElementById('vital-rr').value, 10) || null,
            oxygen_saturation: parseFloat(document.getElementById('vital-sat').value) || null,
        }
    };
    
    try {
        if (recordId) {
            // 更新逻辑
            await window.apiClient.medicalRecords.update(recordId, recordData);
        } else {
            // 创建新病历
            await window.apiClient.medicalRecords.create(recordData);
        }
        alert('病历保存成功！');
        hideRecordModal();
        loadAndDisplayRecords(currentPatientForRecords.id);
    } catch (error) {
        alert('保存失败: ' + error.message);
    }
}

async function deleteRecord(recordId) {
    if (confirm('确定要删除这条病历吗？')) {
        try {
            await window.apiClient.medicalRecords.delete(recordId);
            alert('删除成功！');
            loadAndDisplayRecords(currentPatientForRecords.id);
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }
}

// 新增病历管理主模块渲染函数
function renderMedicalRecordsModule(container) {
    if (!container) return;
    
    // 首先确保病历管理部分可见
    const section = document.getElementById('medical-records-section');
    if (section) {
        // 隐藏其他所有部分
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        // 显示病历管理部分
        section.style.display = 'block';
        
        // 更新侧边栏的激活状态
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.sidebar-item[data-section="medical-records"]')?.classList.add('active');
    }
    
    // 获取或创建medical-records-container
    let medicalRecordsContainer = section ? section.querySelector('#medical-records-container') : null;
    if (!medicalRecordsContainer) {
        medicalRecordsContainer = document.createElement('div');
        medicalRecordsContainer.id = 'medical-records-container';
        if (section) {
            section.appendChild(medicalRecordsContainer);
        }
    }
    
    // 使用正确的容器
    const targetContainer = medicalRecordsContainer || container;
    
    // 渲染病历管理主界面
    targetContainer.innerHTML = `
        <div id="medical-records-module-container" class="patient-module-wrapper">
            <div id="medical-records-module-content">
                <div class="header-bar">
                    <h1>病历管理</h1>
                </div>
                <div class="card">
                    <div class="patient-selection">
                        <h3>请先选择一个患者</h3>
                        <div class="search-bar">
                            <input type="text" id="medical-records-patient-search" placeholder="按姓名搜索患者...">
                        </div>
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
                            <tbody id="medical-records-patient-table-body">
                                <tr>
                                    <td colspan="6">正在加载患者数据...</td>
                                </tr>
                            </tbody>
                        </table>
                        <div id="medical-records-pagination-container" class="pagination-container">
                            <div class="pagination-info">显示 <span id="medical-records-pagination-range">0-0</span> 条，共 <span id="medical-records-pagination-total">0</span> 条</div>
                            <div class="pagination-controls">
                                <button id="medical-records-pagination-prev" class="pagination-btn" disabled>&lt; 上一页</button>
                                <div id="medical-records-pagination-pages" class="pagination-pages"></div>
                                <button id="medical-records-pagination-next" class="pagination-btn" disabled>下一页 &gt;</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 为患者选择界面绑定事件
    setupMedicalRecordsPatientSelection(targetContainer);
}

// 设置病历管理中的患者选择功能
function setupMedicalRecordsPatientSelection(container) {
    // 复用患者管理模块的变量，但使用独立的搜索和分页状态
    let mrCurrentPage = 0;
    let mrPageSize = 15;
    let mrTotalPages = 0;
    let mrTotalPatients = 0;
    let mrIsSearchMode = false;
    let mrCurrentSearchTerm = '';

    // 加载患者数据
    loadAndDisplayMRPatients();

    // 搜索框事件绑定
    const searchInput = document.getElementById('medical-records-patient-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleMRPatientSearch);
    }

    // 分页按钮事件
    const prevBtn = document.getElementById('medical-records-pagination-prev');
    const nextBtn = document.getElementById('medical-records-pagination-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (mrCurrentPage > 0) {
                goToMRPage(mrCurrentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (mrCurrentPage < mrTotalPages - 1) {
                goToMRPage(mrCurrentPage + 1);
            }
        });
    }

    // 事件委托，处理患者表格内的操作
    const moduleContainer = container.querySelector('#medical-records-module-container');
    if (moduleContainer) {
        moduleContainer.addEventListener('click', function(e) {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const id = target.dataset.id;
            const page = target.dataset.page;

            if (action === 'view-patient-records') {
                renderMedicalRecordModule(container, id);
            } else if (action === 'change-mr-page' && page !== undefined) {
                goToMRPage(parseInt(page));
            }
        });
    }

    // 加载并显示患者列表
    async function loadAndDisplayMRPatients() {
        const tableBody = document.getElementById('medical-records-patient-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="6">正在加载患者数据...</td></tr>';

        try {
            if (!window.apiClient || !window.apiClient.patients) {
                throw new Error('API客户端未初始化');
            }
            
            const skipCount = mrCurrentPage * mrPageSize;
            let response;
            
            // 根据是否搜索模式调用不同的API
            if (mrIsSearchMode && mrCurrentSearchTerm) {
                response = await window.apiClient.patients.search(mrCurrentSearchTerm, skipCount, mrPageSize);
            } else {
                response = await window.apiClient.patients.getAll(skipCount, mrPageSize);
            }
            
            // 处理响应
            if (response && typeof response.total === 'number' && Array.isArray(response.items)) {
                mrTotalPatients = response.total;
                mrTotalPages = Math.ceil(mrTotalPatients / mrPageSize);
                
                // 渲染表格和分页
                renderMRPatientTable(response.items);
                updateMRPagination();
            } else {
                throw new Error('API返回数据格式不正确');
            }
            
        } catch (error) {
            console.error('加载患者数据失败:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">加载失败: ${error.message}</td></tr>`;
            }
        }
    }

    // 渲染患者表格
    function renderMRPatientTable(patients) {
        const tableBody = document.getElementById('medical-records-patient-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!patients || patients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">未找到患者。</td></tr>';
            return;
        }
        
        // 渲染数据
        patients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.gender || ''}</td>
                <td>${patient.birth_date || ''}</td>
                <td>${patient.contact_number || ''}</td>
                <td>
                    <a href="#" class="action-link" data-action="view-patient-records" data-id="${patient.id}">查看病历</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 更新分页UI
    function updateMRPagination() {
        const paginationContainer = document.getElementById('medical-records-pagination-container');
        const paginationRange = document.getElementById('medical-records-pagination-range');
        const paginationTotal = document.getElementById('medical-records-pagination-total');
        const paginationPages = document.getElementById('medical-records-pagination-pages');
        const prevBtn = document.getElementById('medical-records-pagination-prev');
        const nextBtn = document.getElementById('medical-records-pagination-next');
        
        if (!paginationContainer || !paginationRange || !paginationTotal || !paginationPages || !prevBtn || !nextBtn) {
            return;
        }
        
        // 如果总页数小于等于1，则隐藏整个分页组件
        if (mrTotalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = '';

        const startItem = mrTotalPatients > 0 ? (mrCurrentPage * mrPageSize) + 1 : 0;
        const endItem = Math.min((mrCurrentPage + 1) * mrPageSize, mrTotalPatients);
        
        paginationRange.textContent = `${startItem}-${endItem}`;
        paginationTotal.textContent = mrTotalPatients;
        
        prevBtn.disabled = (mrCurrentPage === 0);
        nextBtn.disabled = (mrCurrentPage >= mrTotalPages - 1);
        
        let pagesHTML = '';
        
        if (mrTotalPages <= 4) {
            // 总页数小于等于4页，则全部显示
            for (let i = 0; i < mrTotalPages; i++) {
                pagesHTML += `<button class="pagination-btn ${i === mrCurrentPage ? 'active' : ''}" data-action="change-mr-page" data-page="${i}">${i + 1}</button>`;
            }
        } else {
            // 总页数大于4页，智能显示
            const pagesToShow = new Set();
            pagesToShow.add(0); // 始终显示第一页
            pagesToShow.add(mrTotalPages - 1); // 始终显示最后一页

            // 添加当前页和其前后两页
            for (let i = -2; i <= 2; i++) {
                const page = mrCurrentPage + i;
                if (page > 0 && page < mrTotalPages - 1) {
                    pagesToShow.add(page);
                }
            }

            let lastPage = -1;
            Array.from(pagesToShow).sort((a, b) => a - b).forEach(i => {
                if (lastPage !== -1 && i > lastPage + 1) {
                    pagesHTML += `<span class="pagination-ellipsis">...</span>`;
                }
                pagesHTML += `<button class="pagination-btn ${i === mrCurrentPage ? 'active' : ''}" data-action="change-mr-page" data-page="${i}">${i + 1}</button>`;
                lastPage = i;
            });
        }
        
        paginationPages.innerHTML = pagesHTML;
    }

    // 前往指定页
    function goToMRPage(page) {
        if (page < 0 || page >= mrTotalPages) return;
        mrCurrentPage = page;
        loadAndDisplayMRPatients();
    }

    // 搜索功能
    function handleMRPatientSearch(event) {
        if (!event || !event.target) return;
        
        const searchTerm = event.target.value.toLowerCase().trim();
        
        // 重置分页状态
        mrCurrentPage = 0;
        mrTotalPages = 0;
        mrTotalPatients = 0;
        
        // 根据搜索词是否为空决定是搜索模式还是普通加载
        mrIsSearchMode = searchTerm.length > 0;
        mrCurrentSearchTerm = searchTerm;
        
        // 重新加载数据
        loadAndDisplayMRPatients();
    }
} 