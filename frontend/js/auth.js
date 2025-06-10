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
  }
  
  // 背景设置初始化已移至main.js中统一处理
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
      <div class="user-name"><span data-i18n="login_welcome_back">欢迎回来</span>，${userName}</div>
      <button class="btn btn-primary enter-btn" onclick="enterSystem()" data-i18n="enter_system">进入系统</button>
      <a href="#" onclick="logout(); return false;" class="logout-link" data-i18n="login_logout">退出登录</a>
    </div>
  `;
  
  // 应用翻译到新生成的元素
  if (typeof translatePage === 'function') {
    translatePage();
  }
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
      <form id="login-form">
        <div class="form-group">
          <label for="username" data-i18n="login_username">用户名</label>
          <input type="text" id="username" name="username" data-i18n-placeholder="login_username_placeholder" placeholder="请输入用户名 (测试账号: admin)">
        </div>
        <div class="form-group">
          <label for="password" data-i18n="login_password">密码</label>
          <input type="password" id="password" name="password" data-i18n-placeholder="login_password_placeholder" placeholder="请输入密码 (测试密码: password)">
        </div>
        <button type="submit" class="btn btn-primary login-button" data-i18n="login_button">登录</button>
      </form>
    </div>
  `;
  
  // 应用翻译到新生成的元素
  if (typeof translatePage === 'function') {
    translatePage();
  }
  
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
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginButton = document.querySelector('.login-button');
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  // 清除之前的错误状态
  usernameInput.classList.remove('error');
  passwordInput.classList.remove('error');
  
  // 验证输入
  if (!username || !password) {
    if (!username) {
      usernameInput.classList.add('error');
      usernameInput.focus();
    }
    if (!password) {
      passwordInput.classList.add('error');
      if (username) passwordInput.focus();
    }
    
    showFormNotification(
      'error',
      window.getTranslation ? window.getTranslation('input_incomplete', '输入不完整') : '输入不完整',
      !username && !password ? 
        (window.getTranslation ? window.getTranslation('username_password_required', '请输入用户名和密码') : '请输入用户名和密码') : 
      !username ? 
        (window.getTranslation ? window.getTranslation('username_required', '请输入用户名') : '请输入用户名') : 
        (window.getTranslation ? window.getTranslation('password_required', '请输入密码') : '请输入密码')
    );
    return;
  }
  
  // 禁用按钮防止重复提交
  loginButton.disabled = true;
  loginButton.textContent = window.getTranslation ? window.getTranslation('logging_in', '登录中...') : '登录中...';
  
  try {
    await apiClient.auth.login(username, password);
    
    // 登录成功通知
    showFormNotification('success', '登录成功', '正在进入系统...');
    
    // 延迟一下再跳转，让用户看到成功消息
    setTimeout(() => {
      checkAuthAndRenderUserInfo(document.getElementById('auth-container'));
    }, 1000);
    
  } catch (error) {
    // 登录失败处理
    usernameInput.classList.add('error');
    passwordInput.classList.add('error');
    
    let errorTitle = window.getTranslation ? window.getTranslation('login_failed', '登录失败') : '登录失败';
    let errorMessage = window.getTranslation ? window.getTranslation('login_error_invalid', '用户名或密码错误，请检查后重试') : '用户名或密码错误，请检查后重试';
    
    // 统一使用通用错误消息，不区分用户名和密码错误，提高安全性
    if (error.message) {
      errorMessage = window.getTranslation ? window.getTranslation('account_password_error', '账户不存在或密码错误') : '账户不存在或密码错误';
    }
    
    showFormNotification('error', errorTitle, errorMessage);
    
    // 重置按钮状态
    loginButton.disabled = false;
    loginButton.textContent = window.getTranslation ? window.getTranslation('login_button', '登录') : '登录';
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

// 用户背景设置加载已移至main.js中统一处理

// 背景设置功能已移至main.js中统一处理

/**
 * 显示表单通知
 * @param {string} type - 通知类型: success, error, warning, info
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function showFormNotification(type, title, message) {
  // 移除现有通知
  const existingNotification = document.querySelector('.form-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `form-notification ${type}`;
  
  // 图标映射
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  notification.innerHTML = `
    <div class="form-notification-header">
      <div>
        <span class="form-notification-icon">${icons[type] || 'ℹ'}</span>
        <span>${title}</span>
      </div>
      <button class="form-notification-close" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
    <div class="form-notification-body">${message}</div>
  `;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示动画
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  // 自动隐藏（错误消息显示更久）
  const hideDelay = type === 'error' ? 5000 : 3000;
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 400);
    }
  }, hideDelay);
}

/**
 * 验证输入字段
 * @param {HTMLInputElement} input - 输入字段
 * @param {string} fieldName - 字段名称
 * @returns {boolean} - 是否有效
 */
function validateInput(input, fieldName) {
  const value = input.value.trim();
  
  if (!value) {
    input.classList.add('error');
    const title = window.getTranslation ? window.getTranslation('input_error', '输入错误') : '输入错误';
    const message = window.getTranslation ? window.getTranslation('field_required', `请输入${fieldName}`) : `请输入${fieldName}`;
    showFormNotification('warning', title, message);
    input.focus();
    return false;
  }
  
  input.classList.remove('error');
  return true;
}

// 导出函数给全局使用
window.enterSystem = enterSystem;
window.logout = logout;
window.showFormNotification = showFormNotification;
window.validateInput = validateInput;

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initAuth);