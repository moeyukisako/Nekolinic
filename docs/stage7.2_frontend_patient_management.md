### **Nekolinic前端开发第二阶段指南：核心模块 - 患者管理**

**本阶段目标**：在已经搭建好的漂亮“骨架”上，填充第一个核心功能模块的“血肉”。我们将实现完整的**患者管理**功能，让应用从一个静态的框架，变为一个可以与用户进行真实数据交互的动态工具。

------

#### **1. 激活导航与内容切换**

目前，主界面的侧边栏导航链接还无法工作。第一步是让它们“活”起来。我们将采用单页面应用（SPA）的模式，通过JavaScript动态切换主内容区的显示，而不是刷新整个页面。

**修改 `frontend/js/app.js`**:

JavaScript

```
// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // ... 已有的主题切换代码 ...

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

// 患者管理模块的渲染函数（我们将在下一步中填充它）
function renderPatientModule(container) {
    // 稍后我们将在这里构建患者管理的HTML
    container.innerHTML = `<h1>患者管理</h1><div id="patient-content"></div>`;
    loadAndDisplayPatients(); // 加载并显示患者数据
}
```

------

#### **2. 构建“患者管理”模块界面与逻辑**

现在我们来填充 `renderPatientModule` 的具体内容，实现完整的患者管理功能。

**2.1. 动态生成模块HTML**

修改 `renderPatientModule` 函数，让它生成患者管理界面所需的HTML结构。

JavaScript

```
// js/app.js (继续)

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
    `;

    // 绑定事件监听器
    document.getElementById('add-patient-btn').addEventListener('click', showAddPatientModal);
    document.getElementById('patient-search-input').addEventListener('input', handleSearch);

    // 初始加载数据
    loadAndDisplayPatients();
}
```

*您需要在 `style.css` 中为 `.header-bar`, `.search-bar`, `.data-table` 等新添加的类编写一些基本样式。*

**2.2. 实现患者数据显示**

创建一个函数来调用API并把数据填充到表格中。

JavaScript

```
// js/app.js (继续)

let allPatients = []; // 缓存全量患者数据，用于客户端搜索

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
                <button class="btn btn-secondary" onclick="editPatient(${patient.id})">编辑</button>
                <button class="btn btn-danger" onclick="deletePatient(${patient.id}, '${patient.name}')">删除</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
```

**2.3. 实现“添加/编辑”与“删除”功能**

这些操作通常需要一个模态框（Modal）来完成。

- 添加/编辑模态框

  : 创建一个通用的模态框HTML结构（初始时 

  ```
  display: none;
  ```

  ），然后编写 

  ```
  showAddPatientModal()
  ```

   和 

  ```
  editPatient(id)
  ```

   函数来显示它，并分别处理添加和编辑的逻辑。

  - **添加**: 表单提交时调用 `apiClient.patients.create(data)`。
  - **编辑**: `editPatient(id)` 函数首先调用 `apiClient.patients.getById(id)` 获取数据并填充表单，提交时调用 `apiClient.patients.update(id, data)`。

- **删除功能**: `deletePatient(id, name)` 函数应弹出一个确认对话框 (`if (confirm(...))`)，确认后调用 `apiClient.patients.delete(id)`。

**2.4. 实现客户端搜索**

JavaScript

```
// js/app.js (继续)

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredPatients = allPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm)
    );
    renderPatientTable(filteredPatients);
}
```

------

#### **第二阶段成果总结**

完成本阶段后，您的Nekolinic应用将：

1. **拥有动态的导航**：用户可以在不同模块（尽管目前只有一个可用）之间切换。
2. **实现首个核心业务模块**：患者管理功能闭环，用户可以顺畅地进行患者的增、删、改、查操作。
3. **验证前后端连接**：您将第一次看到精心设计的前端界面与强大的后端API成功交互，动态地展示和操作真实数据。

这是将项目从一个静态框架转变为一个真正“可用”的动态应用的关键一步。完成之后，后续模块的开发将遵循类似的模式，变得更加得心应手。