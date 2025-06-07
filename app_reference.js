// frontend/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    // 仅在 dashboard.html 页面执行主应用逻辑
    if (window.location.pathname.endsWith('dashboard.html')) {
        initializeDashboard();
    } 
    // 在 index.html 页面执行认证和欢迎页逻辑
    else if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        initializeAppAuth();
    }
});


/**
 * 初始化认证和欢迎页 (index.html)
 */
function initializeAppAuth() {
    const authContainer = document.getElementById('auth-container');
    const token = localStorage.getItem('accessToken');

    if (token) {
        checkAuthAndRenderUserInfo(authContainer);
    } else {
        renderLoginForm(authContainer);
    }
    
    // 背景设置初始化总是执行
    initBackgroundSettings();
}

/**
 * 检查认证并渲染用户信息
 * @param {HTMLElement} container 
 */
async function checkAuthAndRenderUserInfo(container) {
    if (!container) return;
    try {
        const user = await apiClient.auth.getCurrentUser();
        renderUserInfo(container, user);
    } catch (error) {
        localStorage.removeItem('accessToken');
        renderLoginForm(container);
    }
}

/**
 * 渲染用户信息
 * @param {HTMLElement} container 
 * @param {object} user 
 */
function renderUserInfo(container, user) {
    if (!container) return;
    const userName = user.full_name || user.username || 'User';
    const nameInitial = userName.charAt(0).toUpperCase();
    
    container.innerHTML = `
        <div class="user-info">
            <div class="login-logo">Nekolinic.</div>
            <div class="user-avatar">${nameInitial}</div>
            <div class="user-name">欢迎回来，${userName}</div>
            <button class="btn btn-primary enter-btn" onclick="enterSystem()">进入系统</button>
            <a href="#" onclick="logout(); return false;" class="logout-link">退出登录</a>
        </div>
    `;
}

/**
 * 渲染登录表单
 * @param {HTMLElement} container 
 */
function renderLoginForm(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="login-box">
            <div class="login-logo">Nekolinic.</div>
            <div id="login-error" class="text-danger" style="display: none; margin-bottom: 1rem;"></div>
            <form id="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" required placeholder="请输入用户名 (测试账号: admin)">
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" required placeholder="请输入密码 (测试密码: password)">
                </div>
                <button type="submit" class="btn btn-primary login-button">登录</button>
            </form>
        </div>
    `;
    
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * 处理登录逻辑
 * @param {Event} e 
 */
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    
    try {
        loginError.style.display = 'none';
        await apiClient.auth.login(username, password);
        checkAuthAndRenderUserInfo(document.getElementById('auth-container'));
    } catch (error) {
        loginError.textContent = error.message || '用户名或密码错误';
        loginError.style.display = 'block';
    }
}

/**
 * 进入系统
 */
function enterSystem() {
    window.location.href = 'dashboard.html';
}

/**
 * 退出登录
 */
function logout() {
    apiClient.auth.logout();
}

/**
 * 初始化主操作界面 (dashboard.html)
 */
function initializeDashboard() {
    // 原有的 dashboard.html 的所有 JS 逻辑都放在这里
    // 例如：菜单切换、加载患者数据、模态框事件等
    console.log("Dashboard Initialized");
    
    const mainContent = document.querySelector('.main-content');
    const sidebarNav = document.querySelector('.sidebar-nav');

    if (!mainContent || !sidebarNav) return;
    
    // 页面内容渲染函数的映射表
    const contentRenderers = {
        '状态': renderDashboard,
        '患者': renderPatientModule,
        '病历': renderMedicalRecordsModule,
        '药品': renderMedicineModule,
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
}


/**
 * 背景图片设置相关功能
 */
function initBackgroundSettings() {
    const bgContainer = document.querySelector('.bg-container');
    const bgPreview = document.getElementById('bg-preview');
    const bgSettingsTrigger = document.getElementById('bg-settings-trigger');
    const bgSettingsPanel = document.getElementById('bg-settings-panel');
    const fileInput = document.getElementById('bg-file-input');
    const resetBgBtn = document.getElementById('reset-bg-btn');
    
    // 从LocalStorage加载保存的背景
    const savedBgImage = localStorage.getItem('nekolinic-bg-image');
    if (savedBgImage) {
        bgContainer.style.backgroundImage = `url(${savedBgImage})`;
    } else {
        bgContainer.style.backgroundImage = 'url(assets/backgrounds/bg_1_20250607103706.jpg)';
    }
    
    // 背景设置面板切换
    if (bgSettingsTrigger) {
        bgSettingsTrigger.addEventListener('click', function() {
            if (bgSettingsPanel) {
                bgSettingsPanel.classList.toggle('active');
            }
        });
    }
    
    // 点击其他区域关闭面板
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.bg-settings') && 
            bgSettingsPanel && 
            bgSettingsPanel.classList.contains('active')) {
            bgSettingsPanel.classList.remove('active');
        }
    });
    
    // 处理文件上传事件
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const imageUrl = event.target.result;
                    if (bgContainer) {
                        bgContainer.style.backgroundImage = `url(${imageUrl})`;
                    }
                    
                    if (bgPreview) {
                        bgPreview.style.backgroundImage = `url(${imageUrl})`;
                    }
                    
                    localStorage.setItem('nekolinic-bg-image', imageUrl);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 重置背景
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', function() {
            if (bgContainer) {
                bgContainer.style.backgroundImage = 'url(assets/backgrounds/bg_1_20250607103706.jpg)';
            }
            
            if (bgPreview) {
                bgPreview.style.backgroundImage = 'url(assets/backgrounds/bg_1_20250607103706.jpg)';
            }
            
            localStorage.removeItem('nekolinic-bg-image');
        });
    }
    
    // 加载预设背景
    const localBackgrounds = document.getElementById('local-backgrounds');
    if (localBackgrounds) {
        const backgrounds = [
            { name: '背景1', url: 'assets/backgrounds/bg_1_20250607103706.jpg' },
            { name: '背景2', url: 'assets/backgrounds/bg_2_20250607103707.jpg' },
            { name: '背景3', url: 'assets/backgrounds/bg_3_20250607103708.jpg' }
        ];
        
        let html = '';
        backgrounds.forEach(bg => {
            html += `
                <div class="bg-thumbnail" style="background-image: url(${bg.url})" data-img="${bg.url}" title="${bg.name}"></div>
            `;
        });
        
        localBackgrounds.innerHTML = html;
        
        // 添加点击事件
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', function() {
                const imgUrl = this.getAttribute('data-img');
                if (bgContainer) bgContainer.style.backgroundImage = `url(${imgUrl})`;
                if (bgPreview) bgPreview.style.backgroundImage = `url(${imgUrl})`;
                
                localStorage.setItem('nekolinic-bg-image', imgUrl);
            });
        });
    }
}

// 下面是仪表盘页面的其余函数，保持原样

// debounce 工具函数，用于限制函数调用频率
function debounce(func, delay = 1500) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

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
                    
                    <!-- 添加处方区域 -->
                    <fieldset>
                        <legend style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span>处方信息</span>
                            <button type="button" id="print-prescription-btn" class="btn btn-secondary btn-sm">打印/输出处方</button>
                        </legend>
                        <div class="content-header" style="padding:0; margin-bottom: 1rem;">
                            <h4>处方药品列表</h4>
                            <button type="button" id="add-prescription-item-btn" class="btn btn-secondary btn-sm">添加药品到处方</button>
                        </div>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>药品名称</th>
                                    <th>单次用量</th>
                                    <th>用法频率</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="prescription-items-body">
                            </tbody>
                        </table>
                    </fieldset>
                </form>
                <div class="form-actions">
                    <button id="print-record-btn" class="btn btn-secondary">打印/输出病历</button>
                    <button id="save-record-btn" class="btn btn-primary">保存病历</button>
                </div>
            </div>
        </div>
    `;

    // 初始化处方项目临时数组
    window.tempPrescriptionItems = [];

    // 加载并填充最新病历数据和既往病史
    loadAndPopulateLatestRecord(patient);

    // 绑定按钮事件
    document.getElementById('add-prescription-item-btn').addEventListener('click', () => {
        showAddPrescriptionModal();
    });

    document.getElementById('print-prescription-btn').addEventListener('click', () => {
        const recordId = document.getElementById('medical-record-id').value;
        if (recordId) {
            handlePrintPrescription(recordId);
        } else {
            alert('请先保存病历记录');
        }
    });

    document.getElementById('print-record-btn').addEventListener('click', () => {
        const recordId = document.getElementById('medical-record-id').value;
        if (recordId) {
            handlePrintMedicalRecord(recordId);
        } else {
            alert('请先保存病历记录');
        }
    });

    document.getElementById('save-record-btn').addEventListener('click', async () => {
        const recordId = document.getElementById('medical-record-id').value;
        if (recordId) {
            // 先保存病历主信息
            await saveMedicalRecordChanges();
            // 然后保存处方信息
            await savePrescriptions(recordId);
            alert('病历及处方已成功保存！');
        }
    });

    // 绑定自动保存事件
    const form = document.getElementById('medical-record-form');
    const debouncedSave = debounce(saveMedicalRecordChanges);
    form.addEventListener('input', debouncedSave);
}

async function loadAndPopulateLatestRecord(patient) {
    const statusElement = document.getElementById('save-status');
    try {
        // 在新函数里统一处理表单填充
        const populateForm = (record) => {
            document.getElementById('medical-record-id').value = record.id || '';
            document.getElementById('record-date').value = record.record_date ? record.record_date.slice(0, 16) : new Date().toISOString().slice(0, 16);
            document.getElementById('past-history').value = patient.past_medical_history || ''; // 既往史来自患者信息
            document.getElementById('symptoms').value = record.symptoms || '';
            document.getElementById('diagnosis').value = record.diagnosis || '';
            document.getElementById('treatment-plan').value = record.treatment_plan || '';
            
            // 加载处方数据
            if (record.id) {
                loadPrescriptions(record.id);
            }
        };

        const recordsResponse = await apiClient.medicalRecords.getByPatientId(patient.id, 1, 1);
        const records = recordsResponse.items || [];
        
        if (records.length > 0) {
            // 如果有记录，使用最新的一条填充表单
            populateForm(records[0]);
        } else {
            // 如果没有记录，创建一个新的空记录
            if (statusElement) statusElement.textContent = '正在创建新病历...';

            // 【关键修复】构造完全符合后端 MedicalRecordCreate 要求的对象
            const newRecordData = {
                patient_id: patient.id,
                doctor_id: 1, // 临时硬编码为1。未来应从当前登录用户获取
                record_date: new Date().toISOString(), // 提供当前时间
                symptoms: "首次就诊",
                diagnosis: "待查",
                treatment_plan: "",
                notes: "系统自动创建"
            };
            
            const newRecord = await apiClient.medicalRecords.create(newRecordData);
            
            // 用后端返回的新记录来填充表单
            populateForm(newRecord);
            
            if (statusElement) statusElement.textContent = '新病历已创建，可以开始编辑。';
        }
    } catch (error) {
        console.error('加载或创建病历失败:', error);
        if (statusElement) {
            statusElement.textContent = '操作失败: ' + error.message;
            statusElement.style.color = 'red';
        }
    }
}

async function saveMedicalRecordChanges() {
    const recordId = document.getElementById('medical-record-id').value;
    const patientId = document.getElementById('medical-record-form').dataset.patientId;

    if (!recordId) {
        console.error("无法保存，病历ID丢失。");
        return;
    }
    
    const statusElement = document.getElementById('save-status');
    if (statusElement) statusElement.textContent = '正在保存...';

    // 构造符合后端 MedicalRecordUpdate 模型的对象
    const recordData = {
        record_date: document.getElementById('record-date').value ? new Date(document.getElementById('record-date').value).toISOString() : new Date().toISOString(),
        symptoms: document.getElementById('symptoms').value,
        diagnosis: document.getElementById('diagnosis').value,
        treatment_plan: document.getElementById('treatment-plan').value,
        notes: "" // notes 字段暂无UI，给一个默认值
    };

    // 构造符合后端 PatientUpdate 模型的对象
    const patientData = {
        past_medical_history: document.getElementById('past-history').value
    };

    try {
        // 并行发起两个更新请求
        await Promise.all([
            apiClient.medicalRecords.update(recordId, recordData),
            apiClient.patients.update(patientId, patientData) 
        ]);

        if (statusElement) {
            statusElement.textContent = '已保存';
            statusElement.style.color = '#4CAF50';
            setTimeout(() => {
                if (statusElement && statusElement.textContent === '已保存') {
                    statusElement.textContent = '';
                }
            }, 3000);
        }
        return true;
    } catch (error) {
        console.error('保存失败:', error);
        if (statusElement) {
            statusElement.textContent = '保存失败: ' + error.message;
            statusElement.style.color = '#F44336';
        }
        throw error;
    }
}

async function loadAndDisplayPatients(page = 1, query = '') {
    try {
        const tableBody = document.getElementById('patient-table-body');
        const paginationContainer = document.getElementById('pagination-container');
        
        if (!tableBody || !paginationContainer) return;
        
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">正在加载患者数据...</td></tr>';
        
        const response = await apiClient.patients.getAll(page, 15, query);
        const patients = response.items || [];
        const totalPages = response.total_pages || 1;
        
        if (patients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">没有找到患者记录</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = '';
        patients.forEach(patient => {
            html += `
                <tr>
                    <td>${patient.id}</td>
                    <td>${patient.name}</td>
                    <td>${patient.gender || ''}</td>
                    <td>${patient.birth_date || ''}</td>
                    <td>${patient.phone || ''}</td>
                    <td>
                        <a href="#" class="action-link" data-action="view-records" data-id="${patient.id}">查看病历</a>
                        <a href="#" class="action-link edit" data-action="edit-patient" data-id="${patient.id}">编辑</a>
                        <a href="#" class="action-link delete" data-action="delete-patient" data-id="${patient.id}" data-name="${patient.name}">删除</a>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
        // 渲染分页
        renderPagination(paginationContainer, page, totalPages, query, 'change-patient-page');
        
    } catch (error) {
        console.error('加载患者数据失败:', error);
        document.getElementById('patient-table-body').innerHTML = `<tr><td colspan="6" class="text-center text-danger">加载失败: ${error.message}</td></tr>`;
    }
}

async function renderMedicalRecordsPatientList(page = 1, query = '') {
    try {
        const listContainer = document.getElementById('medical-records-patient-list-container');
        const paginationContainer = document.getElementById('medical-records-patient-pagination-container');
        
        if (!listContainer || !paginationContainer) return;
        
        listContainer.innerHTML = '<p>正在加载患者列表...</p>';
        paginationContainer.innerHTML = '';
        
        const response = await apiClient.patients.getAll(page, 15, query);
        const patients = response.items || [];
        const totalPages = response.total_pages || 1;
        
        if (patients.length === 0) {
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
                        ${patients.map(p => `
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
            </div>`;
        
        // 渲染分页
        renderPagination(paginationContainer, page, totalPages, query, 'change-mr-patient-page');
        
    } catch (error) {
        console.error('加载患者列表失败:', error);
        listContainer.innerHTML = `<p class="error">加载患者列表失败: ${error.message}</p>`;
    }
}

function renderPagination(container, currentPage, totalPages, query, action, patientId = null) {
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
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

function showAddPatientModal() {
    // 清空表单
    document.getElementById('patient-id').value = '';
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-gender').value = '男';
    document.getElementById('patient-birth').value = '';
    document.getElementById('patient-phone').value = '';
    document.getElementById('patient-address').value = '';
    
    // 更新标题
    document.getElementById('patient-modal-title').textContent = '添加新患者';
    
    // 显示模态框
    document.getElementById('patient-modal').classList.add('show');
}

async function editPatient(id) {
    try {
        const patient = await apiClient.patients.getById(id);
        
        // 填充表单
        document.getElementById('patient-id').value = patient.id;
        document.getElementById('patient-name').value = patient.name || '';
        document.getElementById('patient-gender').value = patient.gender || '男';
        document.getElementById('patient-birth').value = patient.birth_date || '';
        document.getElementById('patient-phone').value = patient.phone || '';
        document.getElementById('patient-address').value = patient.address || '';
        
        // 更新标题
        document.getElementById('patient-modal-title').textContent = '编辑患者信息';
        
        // 显示模态框
        document.getElementById('patient-modal').classList.add('show');
    } catch (error) {
        alert(`获取患者信息失败: ${error.message}`);
    }
}

function hidePatientModal() {
    document.getElementById('patient-modal').classList.remove('show');
}

async function handlePatientFormSubmit(event) {
    event.preventDefault();
    
    const patientId = document.getElementById('patient-id').value;
    const patientData = {
        name: document.getElementById('patient-name').value,
        gender: document.getElementById('patient-gender').value,
        birth_date: document.getElementById('patient-birth').value,
        phone: document.getElementById('patient-phone').value,
        address: document.getElementById('patient-address').value
    };
    
    try {
        if (patientId) {
            // 更新已有患者
            await apiClient.patients.update(patientId, patientData);
        } else {
            // 创建新患者
            await apiClient.patients.create(patientData);
        }
        
        // 关闭模态框
        hidePatientModal();
        
        // 重新加载患者列表
        const currentSearchTerm = document.getElementById('patient-search-input').value || '';
        loadAndDisplayPatients(1, currentSearchTerm);
    } catch (error) {
        alert(`保存患者信息失败: ${error.message}`);
    }
}

async function deletePatient(id, name) {
    if (confirm(`确定要删除患者 ${name} 吗？此操作不可恢复。`)) {
        try {
            await apiClient.patients.delete(id);
            
            // 重新加载患者列表
            const currentSearchTerm = document.getElementById('patient-search-input').value || '';
            loadAndDisplayPatients(1, currentSearchTerm);
        } catch (error) {
            alert(`删除患者失败: ${error.message}`);
        }
    }
}

async function viewPatient(id) {
    try {
        const patient = await apiClient.patients.getById(id);
        console.log('患者信息:', patient);
        // TODO: 实现患者详情页
    } catch (error) {
        alert(`获取患者信息失败: ${error.message}`);
    }
}

/**
 * 渲染药品管理模块的主函数
 */
async function renderMedicineModule() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>药品管理</h2>
            <button id="add-medicine-btn" class="btn btn-primary">添加新药品</button>
        </div>
        <div class="search-bar">
            <input type="text" id="medicine-search-input" placeholder="按药品名称、厂家搜索...">
            <button id="medicine-search-btn" class="btn">搜索</button>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>药品名称</th>
                        <th>规格</th>
                        <th>生产厂家</th>
                        <th>当前库存</th>
                        <th class="actions-column">操作</th>
                    </tr>
                </thead>
                <tbody id="medicine-table-body"></tbody>
            </table>
        </div>
    `;

    // 初始加载数据
    await loadAndDisplayMedicines();

    // --- 事件监听 ---
    // 使用事件委托来处理表格中的按钮点击，性能更佳
    document.getElementById('add-medicine-btn').addEventListener('click', () => {
        showMedicineFormModal();
    });

    document.getElementById('medicine-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('medicine-search-input').value;
        loadAndDisplayMedicines(searchTerm);
    });
    
    // 搜索框回车事件
    document.getElementById('medicine-search-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            loadAndDisplayMedicines(e.target.value);
        }
    });

    // 使用事件委托处理表格操作按钮
    document.getElementById('medicine-table-body').addEventListener('click', e => {
        const target = e.target;
        if (target.classList.contains('btn-edit')) {
            const id = target.dataset.id;
            handleEditMedicine(id);
        } else if (target.classList.contains('btn-delete')) {
            const id = target.dataset.id;
            handleDeleteMedicine(id);
        }
    });
}

/**
 * 加载并显示药品列表
 * @param {string} searchTerm - 搜索关键词
 */
async function loadAndDisplayMedicines(searchTerm = '') {
    const tableBody = document.getElementById('medicine-table-body');
    
    // 显示加载动画
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only">加载中...</span>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const medicines = await apiClient.medicines.list(searchTerm);
        tableBody.innerHTML = ''; // 清空旧数据
        
        if (medicines.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">未找到相关药品信息</td></tr>';
            return;
        }
        
        medicines.forEach(med => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${med.name}</td>
                <td>${med.specification || 'N/A'}</td>
                <td>${med.manufacturer || 'N/A'}</td>
                <td>${med.stock}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-edit" data-id="${med.id}">编辑</button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${med.id}">删除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载药品列表失败:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">加载失败: ${error.message}</td></tr>`;
    }
}

/**
 * 显示药品表单对话框
 * @param {object} [medicine=null] - 当编辑时提供药品数据
 */
function showMedicineFormModal(medicine = null) {
    const title = medicine ? '编辑药品' : '添加新药品';
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'medicine-form-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <span class="close" id="close-medicine-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="medicine-form">
                    <input type="hidden" id="medicine-id" value="${medicine?.id || ''}">
                    <div class="form-group">
                        <label for="medicine-name">药品名称</label>
                        <input type="text" id="medicine-name" value="${medicine?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="medicine-specification">规格</label>
                        <input type="text" id="medicine-specification" value="${medicine?.specification || ''}">
                    </div>
                    <div class="form-group">
                        <label for="medicine-manufacturer">生产厂家</label>
                        <input type="text" id="medicine-manufacturer" value="${medicine?.manufacturer || ''}">
                    </div>
                    <div class="form-group">
                        <label for="medicine-stock">初始库存</label>
                        <input type="number" id="medicine-stock" value="${medicine?.stock || 0}" required ${medicine ? 'disabled' : ''}>
                        ${medicine ? '<small>库存管理请在入库模块操作。</small>' : ''}
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-medicine-form">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // 添加关闭模态框的事件
    document.getElementById('close-medicine-modal').addEventListener('click', closeMedicineModal);
    document.getElementById('cancel-medicine-form').addEventListener('click', closeMedicineModal);
    
    // 添加表单提交事件
    document.getElementById('medicine-form').addEventListener('submit', handleMedicineFormSubmit);
}

/**
 * 关闭药品表单模态框
 */
function closeMedicineModal() {
    const modal = document.getElementById('medicine-form-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }
}

/**
 * 处理药品表单提交
 * @param {Event} e - 表单提交事件
 */
async function handleMedicineFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('medicine-id').value;
    const medicineData = {
        name: document.getElementById('medicine-name').value,
        specification: document.getElementById('medicine-specification').value,
        manufacturer: document.getElementById('medicine-manufacturer').value,
        stock: parseInt(document.getElementById('medicine-stock').value, 10) || 0
    };
    
    try {
        if (id) {
            // 编辑现有药品
            await apiClient.medicines.update(id, medicineData);
        } else {
            // 创建新药品
            await apiClient.medicines.create(medicineData);
        }
        
        closeMedicineModal();
        loadAndDisplayMedicines(); // 刷新列表
    } catch (error) {
        console.error('保存药品失败:', error);
        alert(`保存失败: ${error.message}`);
    }
}

/**
 * 处理编辑药品
 * @param {number} id - 药品ID
 */
async function handleEditMedicine(id) {
    try {
        const medicine = await apiClient.medicines.getById(id);
        showMedicineFormModal(medicine);
    } catch (error) {
        console.error('获取药品数据失败:', error);
        alert(`获取药品信息失败: ${error.message}`);
    }
}

/**
 * 处理删除药品
 * @param {number} id - 药品ID
 */
async function handleDeleteMedicine(id) {
    if (confirm('确定要删除此药品吗？此操作不可撤销。')) {
        try {
            await apiClient.medicines.delete(id);
            loadAndDisplayMedicines(); // 刷新列表
        } catch (error) {
            console.error('删除药品失败:', error);
            alert(`删除失败: ${error.message}`);
        }
    }
}

/**
 * 加载处方数据
 * @param {number} recordId - 病历ID
 */
async function loadPrescriptions(recordId) {
    try {
        const prescriptions = await apiClient.prescriptions.getByMedicalRecordId(recordId);
        window.tempPrescriptionItems = prescriptions.map(p => ({
            id: p.id,
            medicineId: p.medicine_id,
            medicineName: p.medicine_name,
            dosage: p.dosage,
            frequency: p.frequency,
            notes: p.notes || ''
        }));
        renderPrescriptionTable();
    } catch (error) {
        console.error('加载处方失败:', error);
    }
}

/**
 * 渲染处方表格
 */
function renderPrescriptionTable() {
    const tbody = document.getElementById('prescription-items-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!window.tempPrescriptionItems || window.tempPrescriptionItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无处方记录</td></tr>';
        return;
    }
    
    window.tempPrescriptionItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.medicineName}</td>
            <td>${item.dosage}</td>
            <td>${item.frequency}</td>
            <td>${item.notes || ''}</td>
            <td>
                <button class="btn btn-sm btn-danger remove-prescription-item" data-index="${index}">移除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // 绑定移除按钮事件
    document.querySelectorAll('.remove-prescription-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removePrescriptionItem(index);
        });
    });
}

/**
 * 移除处方项目
 * @param {number} index - 处方项目索引
 */
function removePrescriptionItem(index) {
    window.tempPrescriptionItems.splice(index, 1);
    renderPrescriptionTable();
}

/**
 * 显示添加处方项目模态框
 */
function showAddPrescriptionModal() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'add-prescription-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加药品到处方</h3>
                <span class="close" id="close-prescription-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="medicine-search">搜索药品</label>
                    <input type="text" id="medicine-search" placeholder="输入药品名称搜索...">
                </div>
                <div id="medicine-search-results" class="search-results" style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">
                    <p>请输入药品名称进行搜索</p>
                </div>
                <form id="prescription-form">
                    <input type="hidden" id="selected-medicine-id">
                    <input type="hidden" id="selected-medicine-name">
                    <div class="form-group">
                        <label for="dosage">单次用量</label>
                        <input type="text" id="dosage" required placeholder="例如：1片、5ml等">
                    </div>
                    <div class="form-group">
                        <label for="frequency">服用频率</label>
                        <input type="text" id="frequency" required placeholder="例如：每日三次、睡前服用等">
                    </div>
                    <div class="form-group">
                        <label for="notes">备注</label>
                        <textarea id="notes" rows="2" placeholder="可选：用药注意事项等"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-prescription">取消</button>
                        <button type="submit" class="btn btn-primary" id="add-prescription" disabled>添加到处方</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // 绑定关闭事件
    document.getElementById('close-prescription-modal').addEventListener('click', closePrescriptionModal);
    document.getElementById('cancel-prescription').addEventListener('click', closePrescriptionModal);
    
    // 绑定搜索事件
    const searchInput = document.getElementById('medicine-search');
    searchInput.addEventListener('input', debounce(async function() {
        await searchMedicines(this.value);
    }, 500));
    
    // 绑定表单提交事件
    document.getElementById('prescription-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addPrescriptionItem();
    });
}

/**
 * 关闭处方模态框
 */
function closePrescriptionModal() {
    const modal = document.getElementById('add-prescription-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }
}

/**
 * 搜索药品
 * @param {string} query - 搜索关键词
 */
async function searchMedicines(query) {
    const resultsContainer = document.getElementById('medicine-search-results');
    
    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '<p>请输入至少2个字符进行搜索</p>';
        return;
    }
    
    resultsContainer.innerHTML = '<p>搜索中...</p>';
    
    try {
        const medicines = await apiClient.medicines.list(query);
        
        if (medicines.length === 0) {
            resultsContainer.innerHTML = '<p>未找到相关药品</p>';
            return;
        }
        
        resultsContainer.innerHTML = '';
        medicines.forEach(medicine => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <span>${medicine.name} (${medicine.specification || 'N/A'}) - ${medicine.manufacturer || 'N/A'}</span>
            `;
            item.addEventListener('click', () => selectMedicine(medicine.id, medicine.name));
            resultsContainer.appendChild(item);
        });
    } catch (error) {
        console.error('搜索药品失败:', error);
        resultsContainer.innerHTML = `<p>搜索失败: ${error.message}</p>`;
    }
}

/**
 * 选择药品
 * @param {number} id - 药品ID
 * @param {string} name - 药品名称
 */
function selectMedicine(id, name) {
    document.getElementById('selected-medicine-id').value = id;
    document.getElementById('selected-medicine-name').value = name;
    document.getElementById('medicine-search').value = name;
    document.getElementById('add-prescription').disabled = false;
    document.getElementById('medicine-search-results').innerHTML = `<p>已选择: ${name}</p>`;
}

/**
 * 添加处方项目
 */
function addPrescriptionItem() {
    const medicineId = document.getElementById('selected-medicine-id').value;
    const medicineName = document.getElementById('selected-medicine-name').value;
    const dosage = document.getElementById('dosage').value;
    const frequency = document.getElementById('frequency').value;
    const notes = document.getElementById('notes').value;
    
    if (!medicineId || !medicineName || !dosage || !frequency) {
        alert('请完善药品信息');
        return;
    }
    
    // 将处方项目添加到临时数组
    window.tempPrescriptionItems.push({
        medicineId,
        medicineName,
        dosage,
        frequency,
        notes
    });
    
    // 刷新表格
    renderPrescriptionTable();
    
    // 关闭模态框
    closePrescriptionModal();
}

/**
 * 保存处方
 * @param {number} recordId - 病历ID
 */
async function savePrescriptions(recordId) {
    try {
        // 为每个处方项目创建处方记录
        const prescriptionPromises = window.tempPrescriptionItems.map(item => {
            // 如果已经有ID，则不需要创建
            if (item.id) return Promise.resolve();
            
            return apiClient.prescriptions.create({
                medical_record_id: recordId,
                medicine_id: item.medicineId,
                dosage: item.dosage,
                frequency: item.frequency,
                notes: item.notes
            });
        });
        
        await Promise.all(prescriptionPromises);
        
        // 重新加载处方列表
        await loadPrescriptions(recordId);
        
        return true;
    } catch (error) {
        console.error('保存处方失败:', error);
        alert(`保存处方失败: ${error.message}`);
        return false;
    }
}

/**
 * 打印病历
 * @param {string} recordId - 病历ID
 */
async function handlePrintMedicalRecord(recordId) {
    if (!recordId) {
        alert('缺少病历ID');
        return;
    }
    
    try {
        // 并行获取所有需要的数据
        const [record, prescriptions] = await Promise.all([
            apiClient.medicalRecords.getById(recordId),
            apiClient.prescriptions.getByMedicalRecordId(recordId)
        ]);
        
        const patient = await apiClient.patients.getById(record.patient_id);
        
        // 计算年龄
        const calculateAge = (birthDate) => {
            if (!birthDate) return '未知';
            const birth = new Date(birthDate);
            const ageDifMs = Date.now() - birth.getTime();
            const ageDate = new Date(ageDifMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        };
        
        const patientAge = calculateAge(patient.birth_date);
        
        // 构建打印用的HTML
        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>病历记录 - ${patient.name}</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; }
                    .section { margin-bottom: 15px; }
                    .section-title { font-weight: bold; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    table, th, td { border: 1px solid #ddd; }
                    th, td { padding: 8px; text-align: left; }
                    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Nekolinic诊所 - 病历记录</div>
                    <p>就诊时间: ${new Date(record.record_date).toLocaleString()}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">患者信息</div>
                    <p>姓名: ${patient.name} | 性别: ${patient.gender || '未记录'} | 年龄: ${patientAge}岁</p>
                </div>
                
                <div class="section">
                    <div class="section-title">既往病史</div>
                    <p>${patient.past_medical_history || '无'}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">主诉与症状</div>
                    <p>${record.symptoms || '无记录'}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">诊断</div>
                    <p>${record.diagnosis || '无记录'}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">处置意见</div>
                    <p>${record.treatment_plan || '无记录'}</p>
                </div>
                
                ${prescriptions.length > 0 ? `
                <div class="section">
                    <div class="section-title">处方信息</div>
                    <table>
                        <thead>
                            <tr>
                                <th>药品名称</th>
                                <th>用量</th>
                                <th>频率</th>
                                <th>备注</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prescriptions.map(p => `
                                <tr>
                                    <td>${p.medicine_name}</td>
                                    <td>${p.dosage}</td>
                                    <td>${p.frequency}</td>
                                    <td>${p.notes || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <div class="footer">
                    <div>医师签名: _________________</div>
                    <div>日期: ${new Date().toLocaleDateString()}</div>
                </div>
                
                <button onclick="window.print();" style="margin-top: 20px;">打印</button>
            </body>
            </html>
        `;
        
        // 打开新窗口并打印
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        
    } catch (error) {
        console.error('准备打印病历失败:', error);
        alert(`获取病历信息失败: ${error.message}`);
    }
}

/**
 * 打印处方
 * @param {string} recordId - 病历ID
 */
async function handlePrintPrescription(recordId) {
    if (!recordId) {
        alert('缺少病历ID');
        return;
    }
    
    try {
        // 获取数据
        const prescriptions = await apiClient.prescriptions.getByMedicalRecordId(recordId);
        
        if (prescriptions.length === 0) {
            alert('此病历没有处方信息可打印');
            return;
        }
        
        const record = await apiClient.medicalRecords.getById(recordId);
        const patient = await apiClient.patients.getById(record.patient_id);
        
        // 计算年龄
        const calculateAge = (birthDate) => {
            if (!birthDate) return '未知';
            const birth = new Date(birthDate);
            const ageDifMs = Date.now() - birth.getTime();
            const ageDate = new Date(ageDifMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        };
        
        const patientAge = calculateAge(patient.birth_date);
        
        // 构建处方笺格式的HTML
        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>处方笺 - ${patient.name}</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; }
                    .info-section { margin-bottom: 15px; }
                    .prescription-list { margin: 20px 0; }
                    .prescription-item { margin-bottom: 10px; }
                    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                    .line { border-bottom: 1px solid #000; margin: 5px 0; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Nekolinic 诊所 - 处方笺</div>
                    <div class="line"></div>
                </div>
                
                <div class="info-section">
                    <p><strong>患者:</strong> ${patient.name} &nbsp;&nbsp; <strong>性别:</strong> ${patient.gender || '未记录'} &nbsp;&nbsp; <strong>年龄:</strong> ${patientAge}岁</p>
                    <p><strong>诊断:</strong> ${record.diagnosis || '无记录'}</p>
                    <p><strong>日期:</strong> ${new Date(record.record_date).toLocaleDateString()}</p>
                </div>
                
                <h2>Rp.</h2>
                <ol class="prescription-list">
                    ${prescriptions.map(p => `
                        <li class="prescription-item">
                            ${p.medicine_name} ${p.medicine_specification ? `(${p.medicine_specification})` : ''}
                            <br>
                            用法: ${p.dosage}, ${p.frequency}
                            ${p.notes ? `<br>备注: ${p.notes}` : ''}
                        </li>
                    `).join('')}
                </ol>
                
                <div class="footer">
                    <div><strong>医师签名:</strong> __________________</div>
                    <div><strong>日期:</strong> ${new Date().toLocaleDateString()}</div>
                </div>
                
                <button onclick="window.print();" style="margin-top: 20px;">打印</button>
            </body>
            </html>
        `;
        
        // 打开新窗口并打印
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        
    } catch (error) {
        console.error('准备打印处方失败:', error);
        alert(`获取处方信息失败: ${error.message}`);
    }
}