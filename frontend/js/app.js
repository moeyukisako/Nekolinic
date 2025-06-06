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

// 更新分页器UI
function updatePagination() {
    const paginationRange = document.getElementById('pagination-range');
    const paginationTotal = document.getElementById('pagination-total');
    const paginationPages = document.getElementById('pagination-pages');
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (!paginationRange || !paginationTotal || !paginationPages || !prevBtn || !nextBtn) {
        return;
    }
    
    // 计算显示范围
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalPatients);
    
    // 更新显示范围和总数
    paginationRange.textContent = `${start}-${end}`;
    paginationTotal.textContent = totalPatients;
    
    // 更新分页按钮状态
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    
    // 生成分页数字按钮
    let pagesHTML = '';
    const maxVisiblePages = 5; // 最多显示的页码数
    
    if (totalPages <= maxVisiblePages) {
        // 页数少，全部显示
        for (let i = 0; i < totalPages; i++) {
            const isActive = i === currentPage ? 'active' : '';
            pagesHTML += `<button class="pagination-btn ${isActive}" data-action="change-page" data-page="${i}">${i + 1}</button>`;
        }
    } else {
        // 页数多，显示部分，带省略号
        const showFirst = true;
        const showLast = true;
        const midCount = maxVisiblePages - (showFirst ? 1 : 0) - (showLast ? 1 : 0);
        let startPage = Math.max(0, currentPage - Math.floor(midCount / 2));
        let endPage = Math.min(totalPages - 1, startPage + midCount - 1);
        
        if (endPage - startPage + 1 < midCount) {
            startPage = Math.max(0, endPage - midCount + 1);
        }
        
        // 第一页
        if (showFirst && startPage > 0) {
            pagesHTML += `<button class="pagination-btn ${currentPage === 0 ? 'active' : ''}" data-action="change-page" data-page="0">1</button>`;
            if (startPage > 1) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // 中间页码
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? 'active' : '';
            pagesHTML += `<button class="pagination-btn ${isActive}" data-action="change-page" data-page="${i}">${i + 1}</button>`;
        }
        
        // 最后一页
        if (showLast && endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            pagesHTML += `<button class="pagination-btn ${currentPage === totalPages - 1 ? 'active' : ''}" data-action="change-page" data-page="${totalPages - 1}">${totalPages}</button>`;
        }
    }
    
    paginationPages.innerHTML = pagesHTML;
}

// 加载并显示患者数据
async function loadAndDisplayPatients() {
    const tableBody = document.getElementById('patient-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6">正在加载...</td></tr>';

    try {
        if (!window.apiClient || !window.apiClient.patients) {
            console.error('API客户端未初始化');
            throw new Error('API客户端未初始化');
        }
        
        console.log(`正在加载患者数据，页码: ${currentPage}, 每页: ${pageSize}...`);
        
        let patients;
        let skipCount = currentPage * pageSize;
        
        try {
            if (isSearchMode && currentSearchTerm) {
                patients = await window.apiClient.patients.search(currentSearchTerm, skipCount, pageSize);
            } else {
                patients = await window.apiClient.patients.getAll(skipCount, pageSize);
            }
            
            console.log("患者数据加载成功:", patients);
            
            // 检查响应是否包含总记录数信息（服务端可能会返回总记录数）
            if (patients && typeof patients === 'object') {
                if (patients.total !== undefined) {
                    // 直接从服务器获取总记录数
                    totalPatients = patients.total;
                    // 数据可能在items或data字段中
                    if (Array.isArray(patients.items)) {
                        allPatients = patients.items;
                    } else if (Array.isArray(patients.data)) {
                        allPatients = patients.data;
                    } else if (Array.isArray(patients)) {
                        // 仍然支持旧的API格式
                        allPatients = patients;
                        // 如果仍需要估算总记录数
                        estimateTotalFromCurrentPage(patients, skipCount);
                    }
                } else if (Array.isArray(patients)) {
                    // 旧API格式，需要估算总记录数
                    allPatients = patients;
                    estimateTotalFromCurrentPage(patients, skipCount);
                }
            }
            
            // 计算总页数
            totalPages = Math.ceil(totalPatients / pageSize);
            console.log(`总记录数: ${totalPatients}, 总页数: ${totalPages}`);
            
            // 渲染表格
            renderPatientTable(allPatients);
            
            // 更新分页器
            updatePagination();
            
        } catch (error) {
            console.error('加载患者数据失败:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">加载失败: ${error.message}</td></tr>`;
            }
        }
    } catch (error) {
        console.error('API客户端初始化失败:', error);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-danger">API客户端初始化错误，请刷新页面重试</td></tr>';
        }
    }
}

// 辅助函数：根据当前页估算总记录数
function estimateTotalFromCurrentPage(patients, skipCount) {
    // 如果返回的数据少于pageSize，说明已经是最后一页
    if (patients.length < pageSize) {
        totalPatients = skipCount + patients.length;
        console.log(`估算总患者数: ${totalPatients} (不足一页，可能是最后一页)`);
    } else {
        // 如果返回的数据等于pageSize，那么总数至少还有这么多
        // 在实际环境中，后端应该返回总数，这里仅为简单实现
        totalPatients = Math.max(totalPatients, skipCount + patients.length + pageSize);
        console.log(`估算总患者数: ${totalPatients} (可能有更多页)`);
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