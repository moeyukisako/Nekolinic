/**
 * 认证相关功能
 */

/**
 * 初始化认证页面
 */
function initAuth() {
  // 检查当前页面是否为登录页面
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    // 在登录页面，初始化登录表单
    const authContainer = document.getElementById('auth-container');
    const token = localStorage.getItem('accessToken');
    
    if (token && authContainer) {
      // 如果有token，检查并渲染用户信息
      checkAuthAndRenderUserInfo(authContainer);
    } else if (authContainer) {
      // 没有token，渲染登录表单
      renderLoginForm(authContainer);
    }
    
    // 初始化背景设置
    initBackgroundSettings();
  }
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
    // 登录成功后显示用户信息和进入系统按钮
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
 * 初始化背景设置
 */
function initBackgroundSettings() {
  const bgSettingsTrigger = document.getElementById('bg-settings-trigger');
  const bgSettingsPanel = document.getElementById('bg-settings-panel');
  const bgFileInput = document.getElementById('bg-file-input');
  const resetBgBtn = document.getElementById('reset-bg-btn');
  const localBackgrounds = document.getElementById('local-backgrounds');
  
  // 加载用户背景设置
  loadUserBackgroundSetting();
  
  // 背景设置面板切换
  if (bgSettingsTrigger && bgSettingsPanel) {
    bgSettingsTrigger.addEventListener('click', () => {
      bgSettingsPanel.classList.toggle('active');
    });
    
    // 点击外部关闭面板
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.bg-settings') &&
          bgSettingsPanel.classList.contains('active')) {
        bgSettingsPanel.classList.remove('active');
      }
    });
  }
  
  // 文件上传处理
  if (bgFileInput) {
    bgFileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const compressedImageUrl = await compressImage(file, 0.8, 1920, 1080);
        
        // 应用背景到UI
        const bgContainer = document.querySelector('.bg-container');
        const bgPreview = document.getElementById('bg-preview');
        
        if (bgContainer) {
          bgContainer.style.backgroundImage = `url(${compressedImageUrl})`;
        }
        if (bgPreview) bgPreview.style.backgroundImage = `url(${compressedImageUrl})`;
        
        // 保存到服务器
        await apiClient.request('/api/v1/users/me/background-image', {
          method: 'PUT',
          body: JSON.stringify({ background_preference: compressedImageUrl })
        });
        
        document.documentElement.style.setProperty('--bg-image', `url(${compressedImageUrl})`);
        showNotification('成功', '背景图片已成功应用并保存', 'info');
      } catch (err) {
        showNotification('错误', '保存背景图片失败: ' + err.message, 'error');
      }
    });
  }
  
  // 重置背景
  if (resetBgBtn) {
    resetBgBtn.addEventListener('click', () => {
      resetBackground();
    });
  }
  
  // 加载本地预设背景
  loadLocalBackgrounds();
}

/**
 * 加载用户背景设置
 */
async function loadUserBackgroundSetting(user = null) {
  try {
    if (!user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        user = await apiClient.auth.getCurrentUser();
      }
    }
    
    const bgContainer = document.querySelector('.bg-container');
    const bgPreview = document.getElementById('bg-preview');
    
    if (user && user.background_preference) {
      let backgroundUrl = user.background_preference;
      
      // 处理不同类型的背景设置
      if (backgroundUrl.startsWith('color:')) {
        // 颜色背景
        const color = backgroundUrl.replace('color:', '');
        document.documentElement.style.setProperty('--bg-image', 'none');
        document.body.style.backgroundColor = color;
      } else if (backgroundUrl.startsWith('image:')) {
        // 图片背景
        backgroundUrl = backgroundUrl.replace('image:', '');
        document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);
        document.body.style.backgroundColor = '';
      } else {
        // 直接的图片URL
        document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);
        document.body.style.backgroundColor = '';
      }
      
      if (bgContainer && !backgroundUrl.startsWith('color:')) {
        bgContainer.style.backgroundImage = `url(${backgroundUrl.replace('image:', '')})`;
      }
      if (bgPreview && !backgroundUrl.startsWith('color:')) {
        bgPreview.style.backgroundImage = `url(${backgroundUrl.replace('image:', '')})`;
      }
    } else {
      // 用户未设置背景时，使用默认背景
      const defaultBg = 'url(assets/backgrounds/default_background.jpg)';
      document.documentElement.style.setProperty('--bg-image', defaultBg);
      document.body.style.backgroundColor = '';
      
      if (bgContainer) {
        bgContainer.style.backgroundImage = defaultBg;
      }
      if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
    }
  } catch (err) {
    console.error('加载用户背景设置失败:', err);
    // 出错时也使用默认背景
    const defaultBg = 'url(assets/backgrounds/default_background.jpg)';
    document.documentElement.style.setProperty('--bg-image', defaultBg);
    document.body.style.backgroundColor = '';
    
    const bgContainer = document.querySelector('.bg-container');
    if (bgContainer) {
      bgContainer.style.backgroundImage = defaultBg;
    }
    const bgPreview = document.getElementById('bg-preview');
    if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
  }
}

/**
 * 重置背景
 */
function resetBackground() {
  const bgContainer = document.querySelector('.bg-container');
  const bgPreview = document.getElementById('bg-preview');
  
  document.documentElement.style.setProperty('--bg-image', 'none');
  document.body.style.backgroundColor = '';
  
  if (bgContainer) bgContainer.style.backgroundImage = 'none';
  if (bgPreview) {
    bgPreview.style.backgroundImage = 'none';
    bgPreview.style.backgroundColor = '#f5f5f5';
  }
  
  // 保存到服务器
  apiClient.request('/api/v1/users/me/background-image', {
    method: 'PUT',
    body: JSON.stringify({
      background_preference: null
    })
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
      <button class="local-bg-btn" data-color="${bg.color}" 
        style="background-color: ${bg.color}"
        onclick="applyBackgroundColor('${bg.color}')">
        ${bg.name}
      </button>
    `;
  });
  
  localBackgrounds.innerHTML = html || '<div class="no-backgrounds">暂无预设背景</div>';
}

/**
 * 应用背景颜色
 */
function applyBackgroundColor(color) {
  const bgContainer = document.querySelector('.bg-container');
  const bgPreview = document.getElementById('bg-preview');
  
  document.documentElement.style.setProperty('--bg-image', 'none');
  document.body.style.backgroundColor = color;
  
  if (bgContainer) bgContainer.style.backgroundImage = 'none';
  if (bgPreview) {
    bgPreview.style.backgroundColor = color;
    bgPreview.style.backgroundImage = 'none';
  }
  
  // 保存到服务器
  apiClient.request('/api/v1/users/me/background-image', {
    method: 'PUT',
    body: JSON.stringify({
      background_preference: `color:${color}`
    })
  }).then(() => {
    showNotification('成功', '背景颜色已成功应用并保存', 'info');
  }).catch(err => {
    showNotification('错误', '保存背景颜色失败: ' + err.message, 'error');
  });
}

/**
 * 压缩图片
 */
function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      // 计算新尺寸
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 显示通知
 */
function showNotification(title, message, type = 'info') {
  // 简单的通知实现
  console.log(`${title}: ${message}`);
  alert(`${title}: ${message}`);
}

// 将函数暴露到全局
window.applyBackgroundColor = applyBackgroundColor;

// 导出函数给全局使用
window.enterSystem = enterSystem;
window.logout = logout;

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initAuth);