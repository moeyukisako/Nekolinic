/**
 * 认证相关功能
 */

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
  
  // 处理文件上传事件（如果有相关元素）
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
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // 重置背景按钮
  if (resetBgBtn) {
    resetBgBtn.addEventListener('click', function() {
      if (bgContainer) {
        bgContainer.style.backgroundImage = 'url(assets/backgrounds/bg_1_20250607103706.jpg)';
      }
    });
  }
}

// 导出函数给全局使用
window.enterSystem = enterSystem;
window.logout = logout;

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initAuth); 