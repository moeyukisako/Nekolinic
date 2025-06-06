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
    const links = sidebarNav.querySelectorAll('a');

    // 页面内容渲染函数映射
    const contentRenderers = {
        '仪表盘': renderDashboard,
        '患者管理': renderPatientModule,
        // ... 其他模块的渲染函数 ...
    };

    // 导航点击事件处理
    sidebarNav.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLink = e.target.closest('a');
        if (!targetLink) return;

        // 更新激活状态
        links.forEach(link => link.classList.remove('active'));
        targetLink.classList.add('active');

        // 渲染对应内容
        const moduleName = targetLink.textContent;
        if (contentRenderers[moduleName]) {
            contentRenderers[moduleName](mainContent);
        } else {
            mainContent.innerHTML = `<h1>${moduleName}</h1><p>此模块正在建设中...</p>`;
        }
    });

    // 默认加载仪表盘
    renderDashboard(mainContent);
});

// 渲染函数示例
function renderDashboard(container) {
    container.innerHTML = `
        <h1>欢迎使用 Nekolinic 系统</h1>
        <p>请从左侧菜单选择一个模块开始操作。</p>
    `;
}

// 患者管理模块的渲染函数
function renderPatientModule(container) {
    container.innerHTML = `
        <div class="header-bar">
            <h1>患者管理</h1>
            <button id="add-patient-btn" class="btn btn-primary">添加新患者</button>
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
        </div>
        
        <!-- 患者添加/编辑模态框 -->
        <div id="patient-modal" class="modal">
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2 id="patient-modal-title">添加新患者</h2>
                <form id="patient-form">
                    <input type="hidden" id="patient-id">
                    <div class="form-group">
                        <label for="patient-name">姓名</label>
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
                        <label for="patient-birth">出生日期</label>
                        <input type="date" id="patient-birth">
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
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定事件监听器
    document.getElementById('add-patient-btn').addEventListener('click', showAddPatientModal);
    document.getElementById('patient-search-input').addEventListener('input', handleSearch);
    
    // 模态框关闭事件
    document.querySelector('.close-btn').addEventListener('click', hidePatientModal);
    document.querySelector('.cancel-btn').addEventListener('click', hidePatientModal);
    
    // 表单提交事件
    document.getElementById('patient-form').addEventListener('submit', handlePatientFormSubmit);

    // 初始加载数据
    loadAndDisplayPatients();
}

// 全局变量，缓存患者数据用于搜索
let allPatients = []; 

// 加载并显示患者数据
async function loadAndDisplayPatients() {
    const tableBody = document.getElementById('patient-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6">正在加载...</td></tr>';

    try {
        allPatients = await window.apiClient.patients.getAll();
        renderPatientTable(allPatients);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">加载失败: ${error.message}</td></tr>`;
    }
}

// 渲染患者表格
function renderPatientTable(patients) {
    const tableBody = document.getElementById('patient-table-body');
    tableBody.innerHTML = ''; // 清空

    if (patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">未找到患者。</td></tr>';
        return;
    }

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.gender || ''}</td>
            <td>${patient.birth_date || ''}</td>
            <td>${patient.phone || ''}</td>
            <td>
                <button class="btn btn-secondary edit-btn" data-id="${patient.id}">编辑</button>
                <button class="btn btn-danger delete-btn" data-id="${patient.id}" data-name="${patient.name}">删除</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // 绑定编辑和删除按钮事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editPatient(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deletePatient(e.target.dataset.id, e.target.dataset.name));
    });
}

// 搜索功能
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredPatients = allPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm)
    );
    renderPatientTable(filteredPatients);
}

// 显示添加患者模态框
function showAddPatientModal() {
    document.getElementById('patient-modal-title').textContent = '添加新患者';
    document.getElementById('patient-form').reset();
    document.getElementById('patient-id').value = '';
    document.getElementById('patient-modal').style.display = 'block';
}

// 显示编辑患者模态框
async function editPatient(id) {
    try {
        const patient = await window.apiClient.patients.getById(id);
        document.getElementById('patient-modal-title').textContent = '编辑患者';
        
        // 填充表单
        document.getElementById('patient-id').value = patient.id;
        document.getElementById('patient-name').value = patient.name;
        document.getElementById('patient-gender').value = patient.gender || '';
        document.getElementById('patient-birth').value = patient.birth_date || '';
        document.getElementById('patient-phone').value = patient.phone || '';
        document.getElementById('patient-address').value = patient.address || '';
        
        // 显示模态框
        document.getElementById('patient-modal').style.display = 'block';
    } catch (error) {
        alert(`加载患者数据失败: ${error.message}`);
    }
}

// 隐藏患者模态框
function hidePatientModal() {
    document.getElementById('patient-modal').style.display = 'none';
}

// 处理患者表单提交
async function handlePatientFormSubmit(event) {
    event.preventDefault();
    
    // 收集表单数据
    const patientId = document.getElementById('patient-id').value;
    const patientData = {
        name: document.getElementById('patient-name').value,
        gender: document.getElementById('patient-gender').value,
        birth_date: document.getElementById('patient-birth').value,
        phone: document.getElementById('patient-phone').value,
        address: document.getElementById('patient-address').value
    };
    
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
        alert(`操作失败: ${error.message}`);
    }
}

// 删除患者
async function deletePatient(id, name) {
    if (confirm(`确定要删除患者 ${name} 吗？此操作不可撤销。`)) {
        try {
            await window.apiClient.patients.delete(id);
            alert('删除成功');
            loadAndDisplayPatients();
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
} 