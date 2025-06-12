// frontend/js/main.js

import eventBus from './utils/eventBus.js';
import store from './utils/store.js';
import { showLoading, showNotification, showModalNotification } from './utils/ui.js';
import configManager from './utils/configManager.js';

// 导入动画工具
import('./utils/moduleAnimations.js').catch((err) => {
    console.error('❌ 加载动画工具失败:', err);
});

// 导入PDF预览模块
import('./modules/pdfPreview.js').catch((err) => {
    console.error('❌ 加载PDF预览模块失败:', err);
});

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
  
  // 先初始化配置管理器
  initConfigManager().then(async () => {
    // 配置管理器初始化完成后，重新初始化国际化系统以应用正确的语言设置
    if (window.initI18n) {
      await window.initI18n();
    }
  });
  
  // 初始化国际化系统（使用默认设置）
  if (window.initI18n) {
    window.initI18n();
  }
  
  // 加载用户信息
  loadCurrentUser();
  
  // 绑定侧边栏导航
  bindSidebarNavigation();
  
  // 加载模块渲染器
  loadModuleRenderers().then(moduleRenderers => {
    // 添加调试日志
    console.log('loadModuleRenderers completed:', moduleRenderers);
    console.log('Available module keys:', Object.keys(moduleRenderers));
    
    // 保存到全局存储
    store.set('moduleRenderers', moduleRenderers);
    
    // 验证存储
    console.log('Stored moduleRenderers:', store.get('moduleRenderers'));
    
    // 初始加载默认模块
    const defaultModuleName = 'status';
    switchModule(defaultModuleName);
    
    // 标记默认模块为激活状态
    document.querySelector(`.sidebar-item[data-module="${defaultModuleName}"]`)?.classList.add('active');
  }).catch(error => {
    console.error('Failed to load module renderers:', error);
  });
  
  // 初始化模态框
  initModalSystem();
  
  // 监听语言切换事件，更新导航栏标题
  window.addEventListener('languageChanged', function() {
    // 获取当前活跃的模块
    const activeModule = document.querySelector('.sidebar-item.active');
    if (activeModule) {
      const moduleName = activeModule.getAttribute('data-module');
      updateNavbarTitle(moduleName);
    }
  });
}

/**
 * 加载当前用户信息
 */
async function loadCurrentUser() {
  try {
    const user = await apiClient.auth.getCurrentUser();
    store.set('currentUser', user);
    window.currentUser = user; // 缓存用户信息
    // 使用已获取的用户信息加载背景设置，避免重复API调用
    loadUserBackgroundSetting(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 如果获取用户信息失败，可能是token过期，重定向到登录页
    if (error.message && error.message.includes('401')) {
      window.location.href = 'index.html';
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
        
        // 获取模块名（使用data-module属性）
        const moduleName = targetLink.getAttribute('data-module');
        
        // 切换模块
        switchModule(moduleName);
    });
}

/**
 * 异步加载模块渲染器
 * @returns {Promise<Object>} 模块渲染器映射表
 */
async function loadModuleRenderers() {
  console.log('🔄 开始加载模块渲染器...');
  
  // 动态导入
  const [
    statusModule,
    patientModule,
    medicalRecordsModule,
    medicineModule,
    prescriptionModule,
    financeModule,
    sidePaymentModule,
    reportsModule,
    settingsModule
  ] = await Promise.all([
    import('./modules/status.js').catch((err) => { 
      console.error('Failed to load status module:', err); 
      return { default: fallbackRenderer('状态') }; 
    }),
    import('./modules/patientManager.js').catch((err) => { 
      console.error('Failed to load patientManager module:', err); 
      return { default: fallbackRenderer('患者管理') }; 
    }),
    import('./modules/medicalRecords.js').catch((err) => { 
      console.error('Failed to load medicalRecords module:', err); 
      return { default: fallbackRenderer('病历管理') }; 
    }),
    import('./modules/medicineManager.js').catch((err) => { 
      console.error('Failed to load medicineManager module:', err); 
      return { default: fallbackRenderer('药品管理') }; 
    }),
    import('./modules/prescriptionManager.js').catch((err) => { 
      console.error('Failed to load prescriptionManager module:', err); 
      return { default: fallbackRenderer('处方管理') }; 
    }),
    import('./modules/financeManager.js').catch((err) => { 
      console.error('Failed to load financeManager module:', err); 
      return { default: fallbackRenderer('财务管理') }; 
    }),
    import('./modules/sidePaymentManager.js').then((module) => {
      console.log('sidePaymentManager module loaded successfully:', module);
      // 使用renderSidePaymentModule函数作为默认导出
      return { default: module.renderSidePaymentModule || fallbackRenderer('聚合支付') };
    }).catch((err) => { 
      console.error('Failed to load sidePaymentManager module:', err); 
      console.error('sidePaymentManager error details:', err.stack);
      return { default: fallbackRenderer('聚合支付') }; 
    }),
    import('./modules/reportsManager.js').catch((err) => { 
      console.error('Failed to load reportsManager module:', err); 
      return { default: fallbackRenderer('报表管理') }; 
    }),
    import('./modules/settingsManager.js').catch((err) => { 
      console.error('Failed to load settingsManager module:', err); 
      return { default: fallbackRenderer('设置管理') }; 
    })
  ]);
  
  // 验证sidePaymentModule
  console.log('sidePaymentModule after import:', sidePaymentModule);
  console.log('sidePaymentModule.default:', sidePaymentModule.default);
  
  // 模块映射
  return {
    'status': statusModule.default,
    'patients': patientModule.default,
    'medical-records': medicalRecordsModule.default,
    'pharmacy': medicineModule.default,
    'prescriptions': prescriptionModule.default,
    'finance': financeModule.default,
    'side-payment': sidePaymentModule.default,
    'reports': reportsModule.default,
    'settings': settingsModule.default
  };
}

/**
 * 切换模块
 * @param {string} moduleName - 要切换到的模块名称
 * @param {object} [payload={}] - 传递给模块的初始数据
 */
async function switchModule(moduleName, payload = {}) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // 添加调试日志
  console.log('switchModule called with:', moduleName);
  
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
  const loadingText = window.t ? window.t('loading') || '正在加载...' : '正在加载...';
  mainContent.innerHTML = `<div class="loading-module"><div class="spinner"></div><p>${loadingText}</p></div>`;
  

  
  // 更新当前模块状态
  store.set('currentModule', moduleName);
  
  // 更新顶部导航栏标题
  updateNavbarTitle(moduleName);
  
  // 更新侧边栏active状态
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`.sidebar-item[data-module="${moduleName}"]`)?.classList.add('active');
  
  try {
    // 获取模块渲染器
    const moduleRenderers = store.get('moduleRenderers');
    
    // 添加调试日志
    console.log('moduleRenderers:', moduleRenderers);
    console.log('Looking for module:', moduleName);
    console.log('Available modules:', moduleRenderers ? Object.keys(moduleRenderers) : 'none');
    
    if (moduleRenderers && moduleRenderers[moduleName]) {
      console.log('Found module renderer for:', moduleName);
      
      // 创建AbortController用于清理事件
      const abortController = new AbortController();
      
      // 调用模块渲染函数，传递payload
      const cleanup = await moduleRenderers[moduleName](mainContent, { 
        signal: abortController.signal,
        payload: payload
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
      
      // 应用模块动画效果
      if (window.moduleAnimations) {
        // 延迟应用动画，确保DOM已渲染
        setTimeout(() => {
          window.moduleAnimations.applyModuleAnimations(mainContent, {
            animationType: 'fadeInUp',
            delay: 100
          });
        }, 50);
      }
      
      // 触发模块加载完成事件
      eventBus.emit('module:loaded', { name: moduleName });
      
      // 确保翻译应用到新加载的模块
      if (window.translatePage) {
        setTimeout(() => {
          window.translatePage();
        }, 100);
      }
    } else {
      // 没有对应渲染函数时显示提示
      mainContent.innerHTML = `<div class="module-placeholder"><h2>此模块正在开发中</h2></div>`;
      
      // 为开发中的模块也应用动画效果
      if (window.moduleAnimations) {
        setTimeout(() => {
          window.moduleAnimations.applyModuleAnimations(mainContent, {
            animationType: 'fadeInUp',
            delay: 100
          });
        }, 50);
      }
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
 * 更新顶部导航栏标题
 * @param {string} moduleName - 模块名称
 */
function updateNavbarTitle(moduleName) {
  const navbarTitle = document.getElementById('navbar-title');
  if (!navbarTitle) return;
  
  // 模块名称到i18n键的映射
  const moduleI18nMap = {
    'status': 'nav_status',
    'patients': 'nav_patients',
    'medical-records': 'nav_medical_records',
    'pharmacy': 'nav_pharmacy',
    'prescriptions': 'nav_prescriptions',
    'finance': 'nav_finance',
    'side-payment': 'nav_side_payment',
    'reports': 'nav_reports',
    'settings': 'nav_settings'
  };
  
  // 获取翻译后的模块名称
  const i18nKey = moduleI18nMap[moduleName];
  let displaySuffix = '';
  
  if (i18nKey && window.getTranslation) {
    const translatedName = window.getTranslation(i18nKey, moduleName);
    displaySuffix = ' ' + translatedName;
  } else {
    // 后备方案：如果没有翻译函数，使用原始名称
    displaySuffix = ' ' + moduleName;
  }
  
  // 保留status-message元素，只更新文本部分
  const statusMessage = navbarTitle.querySelector('#status-message');
  navbarTitle.textContent = 'Nekolinic.' + displaySuffix;
  
  // 重新添加status-message元素
  if (statusMessage) {
    navbarTitle.appendChild(document.createTextNode(' '));
    navbarTitle.appendChild(statusMessage);
  } else {
    // 如果status-message不存在，创建一个新的
    const newStatusMessage = document.createElement('span');
    newStatusMessage.id = 'status-message';
    newStatusMessage.className = 'status-message';
    navbarTitle.appendChild(document.createTextNode(' '));
    navbarTitle.appendChild(newStatusMessage);
  }
}

/**
 * 创建一个后备渲染器
 * @param {string} moduleName - 模块名称
 * @returns {Function} 渲染函数
 */
function fallbackRenderer(moduleName) {
  return (container) => {
    // 获取翻译后的模块名称
    const translatedModuleName = window.t ? window.t(`nav_${getModuleKey(moduleName)}`) || moduleName : moduleName;
    const developingText = window.t ? window.t('module_developing') || '此模块正在开发中，敬请期待...' : '此模块正在开发中，敬请期待...';
    
    container.innerHTML = `
      <div class="module-placeholder">
        <h2>${translatedModuleName}</h2>
        <p>${developingText}</p>
      </div>
    `;
    return () => {}; // 空的清理函数
  };
}

// 获取模块对应的翻译键
function getModuleKey(moduleName) {
  const moduleKeyMap = {
    'status': 'nav_status',
    'patients': 'nav_patients',
    'medical-records': 'nav_medical_records',
    'pharmacy': 'nav_pharmacy',
    'prescriptions': 'nav_prescriptions',
    'finance': 'nav_finance',
    'side-payment': 'nav_side_payment',
    'reports': 'nav_reports',
    'settings': 'nav_settings'
  };
  return moduleKeyMap[moduleName] || moduleName;
}

/**
 * 初始化背景设置UI交互
 */
function initBackgroundSettingsUI() {
  const bgSettingsTrigger = document.getElementById('bg-settings-trigger');
  const bgSettingsPanel = document.getElementById('bg-settings-panel');
  const bgPreview = document.getElementById('bg-preview');
  const resetBgBtn = document.getElementById('reset-bg-btn');
  const fileInput = document.getElementById('bg-file-input');
  const localBackgrounds = document.getElementById('local-backgrounds');
  const bgContainer = document.querySelector('.bg-container');
  
  // 加载用户背景设置（如果已有缓存的用户信息则使用，否则会自动获取）
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
            apiClient.request('/api/v1/users/me/background-image', {
              method: 'POST',
              body: JSON.stringify({
                image_data: compressedImageUrl,
                filename: fileName
              })
            }).then(user => {
              document.documentElement.style.setProperty('--bg-image', `url(${user.background_preference})`);
              showNotification('背景图片已成功应用并保存', 'success');
            }).catch(err => {
              showNotification('保存背景图片失败: ' + err.message, 'error');
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
 * @param {object} user - 可选的用户对象，如果提供则使用，否则从全局状态获取
 */
async function loadUserBackgroundSetting(user = null) {
  try {
    // 如果没有提供用户对象，尝试从全局状态获取
    if (!user && window.currentUser) {
      user = window.currentUser;
    }
    
    // 如果仍然没有用户信息，则获取用户信息
    if (!user) {
      user = await apiClient.auth.getCurrentUser();
      window.currentUser = user; // 缓存用户信息
    }
    
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
      const defaultBg = 'url(../assets/backgrounds/default_background.jpg)';
      document.documentElement.style.setProperty('--bg-image', defaultBg);
      
      if (bgContainer) {
        bgContainer.style.backgroundImage = defaultBg;
      }
      if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
    }
  } catch (err) {
    console.error('加载用户背景设置失败:', err);
    // 出错时也使用默认背景
    const defaultBg = 'url(../assets/backgrounds/default_background.jpg)';
    const bgContainer = document.querySelector('.bg-container');
    if (bgContainer) {
      bgContainer.style.backgroundImage = defaultBg;
    }
    const bgPreview = document.getElementById('bg-preview');
    if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
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
    showNotification('背景已重置', 'success');
  }).catch(err => {
    showNotification('重置背景设置失败: ' + err.message, 'error');
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
        showNotification('背景颜色已成功应用并保存', 'success');
      }).catch(err => {
        showNotification('保存背景颜色失败: ' + err.message, 'error');
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
 * 初始化配置管理器
 */
async function initConfigManager() {
  try {
    // 初始化配置管理器
    await configManager.init();
    console.log('配置管理器初始化完成');
    
    // 初始化背景设置UI（保留原有的UI交互逻辑）
    initBackgroundSettingsUI();
    
  } catch (error) {
     console.error('配置管理器初始化失败:', error);
     // 降级到原有的初始化方式
     initBackgroundSettingsUI();
     initThemeSettingsLegacy();
   }
}

/**
 * 传统主题设置初始化（降级使用）
 */
function initThemeSettingsLegacy() {
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    const savedTheme = settings['theme-select'];
    
    if (savedTheme) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      if (savedTheme !== 'auto') {
        document.body.classList.add(`theme-${savedTheme}`);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
  } catch (error) {
    console.error('加载主题设置失败:', error);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
  }
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



// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 将 switchModule 和 showNotification 暴露到全局，以便其他模块可以调用
window.switchModule = switchModule;
window.showNotification = showNotification;
window.showModalNotification = showModalNotification;

export { initApp, switchModule, showNotification, showModalNotification };