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

// 全局通知函数
window.showNotification = showNotification;

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
  
  // 初始化背景设置
  initBackgroundSettings();
  
  // 初始化模态框
  initModalSystem();
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
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (!sidebarMenu) return;
    
    sidebarMenu.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLink = e.target.closest('a');
        if (!targetLink) return;
        
        // 移除所有导航项的 active 状态
        sidebarMenu.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });
        
        // 为当前点击项添加 active 状态
        targetLink.classList.add('active');
        
        // 获取中文模块名
        const moduleName = targetLink.textContent.trim();
        
        // 切换模块
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

/**
 * 初始化背景设置
 */
function initBackgroundSettings() {
  const bgSettingsTrigger = document.getElementById('bg-settings-trigger');
  const bgSettingsPanel = document.getElementById('bg-settings-panel');
  const bgPreview = document.getElementById('bg-preview');
  const resetBgBtn = document.getElementById('reset-bg-btn');
  const fileInput = document.getElementById('bg-file-input');
  const localBackgrounds = document.getElementById('local-backgrounds');
  const bgContainer = document.querySelector('.bg-container');
  
  // 加载用户背景设置
  loadUserBackgroundSetting();
  
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
          
          // 压缩图片
          compressImage(imageUrl, function(compressedImageUrl) {
            const fileName = `bg_${Date.now()}.jpg`;
            
            // 应用背景到UI
            if (bgContainer) {
              bgContainer.style.backgroundImage = `url(${compressedImageUrl})`;
            }
            if (bgPreview) bgPreview.style.backgroundImage = `url(${compressedImageUrl})`;
            
            // 保存到服务器
            apiClient.request('/users/me/background-image', {
              method: 'POST',
              body: JSON.stringify({
                image_data: compressedImageUrl,
                filename: fileName
              })
            }).then(user => {
              document.documentElement.style.setProperty('--bg-image', `url(${user.background_preference})`);
              showNotification('成功', '背景图片已成功应用并保存', 'info');
            }).catch(err => {
              showNotification('错误', '保存背景图片失败: ' + err.message, 'error');
            });
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // 重置背景
  if (resetBgBtn) {
    resetBgBtn.addEventListener('click', function() {
      resetBackground();
    });
  }
  
  // 加载本地预设背景
  loadLocalBackgrounds();
}

/**
 * 加载用户背景设置
 */
async function loadUserBackgroundSetting() {
  try {
    const user = await apiClient.auth.getCurrentUser();
    const bgContainer = document.querySelector('.bg-container');
    const bgPreview = document.getElementById('bg-preview');
    
    if (user && user.background_preference) {
      const backgroundUrl = user.background_preference;
      document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);
      
      if (bgContainer) {
        bgContainer.style.backgroundImage = `url(${backgroundUrl})`;
      }
      if (bgPreview) bgPreview.style.backgroundImage = `url(${backgroundUrl})`;
    } else {
      // 用户未设置背景时，使用默认背景
      const defaultBg = 'url(assets/backgrounds/default_background.jpg)';
      document.documentElement.style.setProperty('--bg-image', defaultBg);
      
      if (bgContainer) {
        bgContainer.style.backgroundImage = defaultBg;
      }
      if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
    }
  } catch (err) {
    console.error('加载用户背景设置失败:', err);
    // 出错时也使用默认背景
    const defaultBg = 'url(assets/backgrounds/default_background.jpg)';
    const bgContainer = document.querySelector('.bg-container');
    if (bgContainer) {
      bgContainer.style.backgroundImage = defaultBg;
    }
    document.documentElement.style.setProperty('--bg-image', defaultBg);
  }
}

/**
 * 重置背景
 */
function resetBackground() {
  const bgContainer = document.querySelector('.bg-container');
  const bgPreview = document.getElementById('bg-preview');
  const fileInput = document.getElementById('bg-file-input');
  
  if (bgContainer) bgContainer.style.backgroundImage = 'none';
  document.documentElement.style.setProperty('--bg-image', 'none');
  if (bgPreview) bgPreview.style.backgroundImage = 'none';
  
  // 清除所有缩略图激活状态
  const thumbnails = document.querySelectorAll('.bg-thumbnail');
  thumbnails.forEach(thumb => thumb.classList.remove('active'));
  
  // 清除文件输入
  if (fileInput) fileInput.value = '';
  
  // 保存到服务器
  apiClient.auth.updatePreferences({
    background_preference: null
  }).then(() => {
    showNotification('成功', '背景已重置', 'info');
  }).catch(err => {
    showNotification('错误', '重置背景设置失败: ' + err.message, 'error');
  });
}

/**
 * 加载本地预设背景
 */
function loadLocalBackgrounds() {
  const localBackgrounds = document.getElementById('local-backgrounds');
  if (!localBackgrounds) return;
  
  const backgrounds = [
    {name: '浅色背景', color: '#f5f5f5'},
    {name: '深色背景', color: '#333333'},
    {name: '蓝色背景', color: '#3498db'},
    {name: '绿色背景', color: '#2ecc71'},
    {name: '粉色背景', color: '#e91e63'}
  ];
  
  let html = '';
  backgrounds.forEach(bg => {
    html += `
      <div class="bg-thumbnail" 
          style="background-color: ${bg.color}" 
          data-color="${bg.color}"
          title="${bg.name}">
      </div>
    `;
  });
  
  localBackgrounds.innerHTML = html || '<div class="no-backgrounds">暂无预设背景</div>';
  
  // 添加点击事件
  document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', function() {
      const color = this.getAttribute('data-color');
      const bgContainer = document.querySelector('.bg-container');
      const bgPreview = document.getElementById('bg-preview');
      
      document.documentElement.style.setProperty('--bg-image', 'none');
      document.documentElement.style.setProperty('--color-bg-primary', color);
      if (bgContainer) bgContainer.style.backgroundImage = 'none';
      if (bgPreview) {
        bgPreview.style.backgroundColor = color;
        bgPreview.style.backgroundImage = 'none';
      }
      
      // 保存颜色到服务器
      apiClient.auth.updatePreferences({
        background_preference: `color:${color}`
      }).then(() => {
        // 更新激活状态
        document.querySelectorAll('.bg-thumbnail').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        showNotification('成功', '背景颜色已成功应用并保存', 'info');
      }).catch(err => {
        showNotification('错误', '保存背景颜色失败: ' + err.message, 'error');
      });
    });
  });
}

/**
 * 图片压缩函数
 */
function compressImage(dataUrl, callback, maxWidth = 8000, maxHeight = 6000, quality = 0.7) {
  const img = new Image();
  img.onload = function() {
    let width = img.width;
    let height = img.height;
    
    // 如果图片尺寸已经小于最大尺寸，直接返回
    if (width <= maxWidth && height <= maxHeight && dataUrl.length < 5242880) {
      callback(dataUrl);
      return;
    }
    
    // 计算新的尺寸，保持宽高比
    if (width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = Math.round(width * (maxHeight / height));
      height = maxHeight;
    }
    
    // 创建canvas绘制压缩后的图片
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // 转换为DataURL
    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // 如果压缩后仍然过大，继续压缩
    if (compressedDataUrl.length > 5242880) {
      compressImage(compressedDataUrl, callback, maxWidth, maxHeight, quality * 0.8);
    } else {
      callback(compressedDataUrl);
    }
  };
  img.onerror = function() {
    callback(dataUrl); // 加载失败时使用原始数据
  };
  img.src = dataUrl;
}

/**
 * 初始化模态框系统
 */
function initModalSystem() {
  const modal = document.getElementById('notification-modal');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('active');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      modal.classList.remove('active');
    });
  }
  
  // 默认确认按钮行为
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      modal.classList.remove('active');
    });
  }
}

/**
 * 显示通知模态框
 */
function showNotification(title, message, type = 'info') {
  const modal = document.getElementById('notification-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  if (!modal || !modalTitle || !modalBody) {
    console.warn('模态框元素未找到，使用浏览器alert');
    alert(`${title}: ${message}`);
    return;
  }
  
  modalTitle.textContent = title;
  modalBody.innerHTML = message;
  modal.setAttribute('data-type', type);
  
  // 重置按钮事件为默认行为
  if (confirmBtn) {
    confirmBtn.onclick = function() {
      modal.classList.remove('active');
    };
  }
  
  // 根据类型配置按钮
  if (type === 'info') {
    if (confirmBtn) {
      confirmBtn.textContent = '确定';
      confirmBtn.style.display = '';
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
  } else if (type === 'confirm') {
    if (confirmBtn) {
      confirmBtn.textContent = '确定';
      confirmBtn.style.display = '';
    }
    if (cancelBtn) cancelBtn.style.display = '';
  } else if (type === 'form') {
    if (confirmBtn) {
      confirmBtn.textContent = '保存';
      confirmBtn.style.display = '';
    }
    if (cancelBtn) cancelBtn.style.display = '';
  } else {
    if (confirmBtn) {
      confirmBtn.textContent = '确定';
      confirmBtn.style.display = '';
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
  }
  
  modal.classList.add('active');
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出主要函数以便测试
export { initApp, switchModule };