# app.js解耦方案

当前app.js文件已经超过1600行代码，包含了所有模块的逻辑，确实需要进行解耦优化。我将提供一个更细致的解耦方案，既参考您提供的指南，又增加一些优化点。

## 文件结构设计

```
frontend/
└── js/
    ├── apiClient.js          // 已有API客户端
    |
    ├── main.js               // 新的应用入口
    ├── auth.js               // 专门处理认证相关逻辑
    |
    ├── modules/              
    │   ├── dashboard.js        // 仪表板模块
    │   ├── patientManager.js   // 患者管理模块  
    │   ├── medicalRecords.js   // 病历管理模块
    │   ├── medicineManager.js  // 药品管理模块
    │   └── prescriptionManager.js // 处方管理模块(独立出来)
    |
    ├── utils/                
    │   ├── ui.js              // UI工具函数
    │   ├── date.js            // 日期处理工具
    │   └── eventBus.js        // 事件总线(优化模块通信)
    |
    └── components/           // 可重用组件
        ├── modal.js            // 模态框组件
        ├── pagination.js       // 分页组件
        └── searchBar.js        // 搜索组件
```

## 优化要点

### 1. 模块更细致的划分

处方功能和药品功能分离，虽然关联但职责不同，避免单个模块过度膨胀。

### 2. 添加EventBus机制

```javascript
// eventBus.js
export default {
  events: {},
  
  // 订阅事件
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // 返回取消订阅的函数
    return () => this.off(eventName, callback);
  },
  
  // 取消订阅
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  },
  
  // 触发事件
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  },
  
  // 清空所有事件
  clear() {
    this.events = {};
  }
};
```

### 3. 通用组件化

抽取模态框、分页和搜索栏为可复用组件:

```javascript
// components/modal.js
export default class Modal {
  constructor({title, content, onConfirm, onCancel}) {
    this.title = title;
    this.content = content;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.element = null;
  }
  
  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal';
    // 设置HTML内容
    this.element.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${this.title}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">${this.content}</div>
        <div class="modal-footer">
          <button class="btn-cancel">取消</button>
          <button class="btn-confirm">确认</button>
        </div>
      </div>
    `;
    
    // 绑定事件
    this.element.querySelector('.close').addEventListener('click', () => this.close());
    this.element.querySelector('.btn-cancel').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
      this.close();
    });
    this.element.querySelector('.btn-confirm').addEventListener('click', () => {
      if (this.onConfirm) this.onConfirm();
      this.close();
    });
    
    document.body.appendChild(this.element);
    return this;
  }
  
  close() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  static confirm(title, message, onConfirm) {
    return new Modal({
      title,
      content: `<p>${message}</p>`,
      onConfirm
    }).render();
  }
}
```

### 4. 状态管理增强

使用一个简单的中央状态存储，类似迷你版的Vuex/Redux:

```javascript
// utils/store.js
export default {
  state: {
    currentUser: null,
    currentModule: null,
    selectedPatient: null,
    // 其他全局状态...
  },
  
  // 获取状态
  get(key) {
    return this.state[key];
  },
  
  // 设置状态
  set(key, value) {
    this.state[key] = value;
    // 触发更新事件
    if (window.eventBus) {
      window.eventBus.emit(`state:${key}:updated`, value);
    }
  }
};
```

### 5. 主入口main.js实现

```javascript
// main.js
import apiClient from './apiClient.js';
import eventBus from './utils/eventBus.js';
import store from './utils/store.js';

// 导入模块
import renderDashboard from './modules/dashboard.js';
import renderPatientModule from './modules/patientManager.js';
import renderMedicalRecords from './modules/medicalRecords.js';
import renderMedicineModule from './modules/medicineManager.js';

// 全局对象
window.apiClient = apiClient;
window.eventBus = eventBus;
window.store = store;

// 模块映射
const moduleRenderers = {
  'dashboard-link': renderDashboard,
  'patient-management-link': renderPatientModule,
  'medical-records-link': renderMedicalRecords,
  'medicine-management-link': renderMedicineModule
};

// 当前活跃模块的清理函数
let currentModuleCleanup = null;

/**
 * 初始化应用
 */
function initApp() {
  // 检查用户认证
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  // 加载用户信息
  loadCurrentUser();
  
  // 绑定侧边栏导航
  bindSidebarNavigation();
  
  // 初始加载默认模块
  const defaultModuleId = 'dashboard-link';
  switchModule(defaultModuleId);
  
  // 标记默认模块为激活状态
  document.querySelector(`[id="${defaultModuleId}"]`)?.classList.add('active');
}

/**
 * 加载当前用户信息
 */
async function loadCurrentUser() {
  try {
    const user = await apiClient.auth.getCurrentUser();
    store.set('currentUser', user);
    updateUserMenuDisplay(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html';
  }
}

/**
 * 更新用户菜单显示
 */
function updateUserMenuDisplay(user) {
  const userName = user.full_name || user.username || 'User';
  const nameInitial = userName.charAt(0).toUpperCase();
  
  document.getElementById('user-name').textContent = userName;
  document.getElementById('dropdown-user-name').textContent = userName;
  document.getElementById('dropdown-user-role').textContent = user.role === 'admin' ? '系统管理员' : '普通用户';
  document.getElementById('user-avatar').textContent = nameInitial;
}

/**
 * 绑定侧边栏导航事件
 */
function bindSidebarNavigation() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;
  
  sidebarNav.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (!targetLink) return;
    
    e.preventDefault();
    
    // 移除所有active状态
    sidebarNav.querySelectorAll('a').forEach(link => link.classList.remove('active'));
    // 添加当前项的active状态
    targetLink.classList.add('active');
    
    // 获取模块ID
    const moduleId = targetLink.id;
    
    // 切换到相应模块
    switchModule(moduleId);
  });
}

/**
 * 切换模块
 */
async function switchModule(moduleId) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // 清理当前模块
  if (currentModuleCleanup) {
    currentModuleCleanup();
    currentModuleCleanup = null;
  }
  
  // 清空内容区域
  mainContent.innerHTML = '';
  
  // 更新当前模块状态
  store.set('currentModule', moduleId);
  
  // 如果有对应的渲染函数，执行它
  const renderer = moduleRenderers[moduleId];
  if (renderer) {
    // 创建AbortController用于清理事件
    const abortController = new AbortController();
    
    // 调用模块渲染函数
    const cleanup = await renderer(mainContent, { 
      signal: abortController.signal 
    });
    
    // 保存清理函数
    currentModuleCleanup = () => {
      abortController.abort();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  } else {
    // 没有对应渲染函数时显示提示
    mainContent.innerHTML = `<div class="module-placeholder"><h2>此模块正在开发中</h2></div>`;
  }
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出主要函数以便测试
export { initApp, switchModule };
```

### 6. 模块实现示例 - 药品管理

```javascript
// modules/medicineManager.js
import { showLoading } from '../utils/ui.js';
import Modal from '../components/modal.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';

/**
 * 药品管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
  // 渲染模块基本结构
  container.innerHTML = `
    <div class="medicine-module">
      <div class="content-header">
        <h2>药品管理</h2>
        <button id="add-medicine-btn" class="btn btn-primary">添加新药品</button>
      </div>
      <div id="search-container"></div>
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
      <div id="pagination-container"></div>
    </div>
  `;

  // 初始化搜索组件
  const searchBar = new SearchBar({
    containerId: 'search-container',
    placeholder: '按药品名称、厂家搜索...',
    onSearch: (query) => loadMedicines(query)
  }).render();

  // 初始化加载数据
  await loadMedicines();

  // 绑定事件
  const addBtn = document.getElementById('add-medicine-btn');
  addBtn?.addEventListener('click', showAddMedicineModal, { signal });

  // 绑定表格事件
  const tableBody = document.getElementById('medicine-table-body');
  tableBody?.addEventListener('click', handleTableAction, { signal });

  // 模块清理函数
  return function cleanup() {
    // 取消事件订阅
    eventBus.off('medicine:updated');
    // 其他可能的清理工作
    console.log('Medicine module cleaned up');
  };
}

/**
 * 加载药品列表
 */
async function loadMedicines(searchTerm = '', page = 1) {
  const tableBody = document.getElementById('medicine-table-body');
  if (!tableBody) return;

  // 显示加载状态
  showLoading(tableBody, 5);

  try {
    // 获取药品数据
    const medicines = await apiClient.medicines.list(searchTerm);
    
    if (medicines.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">未找到相关药品信息</td></tr>';
      return;
    }

    // 渲染数据
    renderMedicineTable(medicines, tableBody);
    
    // 渲染分页
    if (medicines.total_pages > 1) {
      new Pagination({
        containerId: 'pagination-container',
        currentPage: page,
        totalPages: medicines.total_pages,
        onPageChange: (newPage) => loadMedicines(searchTerm, newPage)
      }).render();
    }
  } catch (error) {
    console.error('加载药品列表失败:', error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center">加载失败: ${error.message}</td></tr>`;
  }
}

/**
 * 渲染药品表格
 */
function renderMedicineTable(medicines, tableBody) {
  tableBody.innerHTML = '';
  
  medicines.forEach(med => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${med.name}</td>
      <td>${med.specification || 'N/A'}</td>
      <td>${med.manufacturer || 'N/A'}</td>
      <td>${med.stock}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-edit" data-id="${med.id}" data-action="edit">编辑</button>
        <button class="btn btn-sm btn-danger" data-id="${med.id}" data-action="delete">删除</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * 处理表格操作事件
 */
function handleTableAction(e) {
  const target = e.target;
  if (!target.dataset.action) return;
  
  const id = target.dataset.id;
  const action = target.dataset.action;
  
  switch (action) {
    case 'edit':
      editMedicine(id);
      break;
    case 'delete':
      deleteMedicine(id);
      break;
  }
}

/**
 * 显示添加药品模态框
 */
function showAddMedicineModal() {
  const form = `
    <form id="medicine-form">
      <div class="form-group">
        <label for="medicine-name">药品名称</label>
        <input type="text" id="medicine-name" required>
      </div>
      <div class="form-group">
        <label for="medicine-specification">规格</label>
        <input type="text" id="medicine-specification">
      </div>
      <div class="form-group">
        <label for="medicine-manufacturer">生产厂家</label>
        <input type="text" id="medicine-manufacturer">
      </div>
      <div class="form-group">
        <label for="medicine-stock">初始库存</label>
        <input type="number" id="medicine-stock" value="0" required>
      </div>
    </form>
  `;

  const modal = new Modal({
    title: '添加新药品',
    content: form,
    onConfirm: () => saveMedicineForm()
  }).render();
}

// 其他函数如editMedicine, deleteMedicine等实现省略...
```

### 7. 修改dashboard.html

```html
<!-- dashboard.html脚本部分 -->
<script src="js/apiClient.js"></script>
<script type="module" src="js/main.js"></script>
```

### 8. 处理index.html (登录页)

创建专门的auth.js:

```javascript
// auth.js - 专门处理登录页逻辑
import apiClient from './apiClient.js';

/**
 * 初始化认证页面
 */
function initAuth() {
  const authContainer = document.getElementById('auth-container');
  const token = localStorage.getItem('accessToken');

  if (token) {
    checkAuthAndRenderUserInfo(authContainer);
  } else {
    renderLoginForm(authContainer);
  }
}

// 登录页其他函数...

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initAuth);
```

修改index.html:

```html
<!-- index.html脚本部分 -->
<script src="js/apiClient.js"></script>
<script type="module" src="js/auth.js"></script>
```

## 实施步骤建议

1. 先创建文件夹结构
2. 创建基础工具类
3. 实现一个模块作为示例(如药品管理)
4. 修改main.js引入该模块
5. 测试该模块功能完整性
6. 再逐步实现其他模块
7. 最后完成auth.js和处理index.html

此方案不仅实现了完整解耦，还提供了更强大的模块通信和状态管理机制，增强了代码的可维护性和可扩展性。