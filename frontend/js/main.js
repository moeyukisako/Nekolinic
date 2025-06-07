// frontend/js/main.js

import eventBus from './utils/eventBus.js';
import store from './utils/store.js';

// 稍后导入模块
// import renderDashboard from './modules/dashboard.js';
// import renderPatientModule from './modules/patientManager.js';
// import renderMedicalRecordsModule from './modules/medicalRecords.js';
// import renderMedicineModule from './modules/medicineManager.js';

// 全局对象
window.eventBus = eventBus;
window.store = store;

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
  
  // 加载模块渲染器
  loadModuleRenderers().then(moduleRenderers => {
    // 保存到全局存储
    store.set('moduleRenderers', moduleRenderers);
    
    // 初始加载默认模块
    const defaultModuleName = '状态';
    switchModule(defaultModuleName);
    
    // 标记默认模块为激活状态
    document.querySelector(`.sidebar-item[data-module="${defaultModuleName}"]`)?.classList.add('active');
  });
  
  // 绑定用户菜单
  bindUserMenu();
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
 * 绑定用户菜单事件
 */
function bindUserMenu() {
  const userMenuTrigger = document.querySelector('.user-menu-trigger');
  const userMenuDropdown = document.querySelector('.user-menu-dropdown');
  
  if (userMenuTrigger && userMenuDropdown) {
    userMenuTrigger.addEventListener('click', () => {
      userMenuDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu') && userMenuDropdown.classList.contains('active')) {
        userMenuDropdown.classList.remove('active');
      }
    });
    
    // 退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        apiClient.auth.logout();
      });
    }
  }
}

/**
 * 绑定侧边栏导航事件
 */
function bindSidebarNavigation() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;
  
  sidebarNav.addEventListener('click', (e) => {
    const targetLink = e.target.closest('.sidebar-item');
    if (!targetLink) return;
    
    e.preventDefault();
    
    // 移除所有active状态
    sidebarNav.querySelectorAll('.sidebar-item').forEach(link => link.classList.remove('active'));
    // 添加当前项的active状态
    targetLink.classList.add('active');
    
    // 获取模块名称
    const moduleName = targetLink.getAttribute('data-module');
    
    // 切换到相应模块
    switchModule(moduleName);
  });
}

/**
 * 异步加载模块渲染器
 * @returns {Promise<Object>} 模块渲染器映射表
 */
async function loadModuleRenderers() {
  // 动态导入
  const [
    dashboardModule,
    patientModule,
    medicalRecordsModule,
    medicineModule
  ] = await Promise.all([
    import('./modules/dashboard.js').catch(() => ({ default: fallbackRenderer('仪表盘') })),
    import('./modules/patientManager.js').catch(() => ({ default: fallbackRenderer('患者管理') })),
    import('./modules/medicalRecords.js').catch(() => ({ default: fallbackRenderer('病历管理') })),
    import('./modules/medicineManager.js').catch(() => ({ default: fallbackRenderer('药品管理') }))
  ]);
  
  // 模块映射
  return {
    '状态': dashboardModule.default,
    '患者': patientModule.default,
    '病历': medicalRecordsModule.default,
    '药品': medicineModule.default
  };
}

/**
 * 切换模块
 */
async function switchModule(moduleName) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // 清理当前模块
  if (currentModuleCleanup) {
    try {
      currentModuleCleanup();
    } catch (err) {
      console.warn('模块清理时出错:', err);
    }
    currentModuleCleanup = null;
  }
  
  // 清空内容区域
  mainContent.innerHTML = '';
  
  // 显示加载状态
  mainContent.innerHTML = '<div class="loading-module"><div class="spinner"></div><p>加载中...</p></div>';
  
  // 更新当前模块状态
  store.set('currentModule', moduleName);
  
  try {
    // 获取模块渲染器
    const moduleRenderers = store.get('moduleRenderers');
    
    if (moduleRenderers && moduleRenderers[moduleName]) {
      // 创建AbortController用于清理事件
      const abortController = new AbortController();
      
      // 调用模块渲染函数
      const cleanup = await moduleRenderers[moduleName](mainContent, { 
        signal: abortController.signal 
      });
      
      // 保存清理函数
      currentModuleCleanup = () => {
        abortController.abort();
        if (typeof cleanup === 'function') {
          cleanup();
        }
        // 触发模块卸载事件
        eventBus.emit('module:unloaded', { name: moduleName });
      };
      
      // 触发模块加载完成事件
      eventBus.emit('module:loaded', { name: moduleName });
    } else {
      // 没有对应渲染函数时显示提示
      mainContent.innerHTML = `<div class="module-placeholder"><h2>此模块正在开发中</h2></div>`;
    }
  } catch (error) {
    console.error(`加载模块 "${moduleName}" 失败:`, error);
    mainContent.innerHTML = `
      <div class="error-message">
        <h2>加载失败</h2>
        <p>模块 "${moduleName}" 加载时发生错误: ${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">刷新页面</button>
      </div>
    `;
  }
}

/**
 * 创建一个后备渲染器
 * @param {string} moduleName - 模块名称
 * @returns {Function} 渲染函数
 */
function fallbackRenderer(moduleName) {
  return (container) => {
    container.innerHTML = `
      <div class="module-placeholder">
        <h2>${moduleName}</h2>
        <p>此模块正在开发中，敬请期待...</p>
      </div>
    `;
    return () => {}; // 空的清理函数
  };
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出主要函数以便测试
export { initApp, switchModule }; 