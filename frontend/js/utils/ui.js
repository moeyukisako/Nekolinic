/**
 * UI工具函数
 */

/**
 * 显示加载中状态
 * @param {HTMLElement} container - 容器元素
 * @param {number} [rows=3] - 显示的行数
 */
export function showLoading(container, rows = 3) {
  if (!container) return;
  
  let loadingHTML = '';
  for (let i = 0; i < rows; i++) {
    loadingHTML += `
      <div class="loading-row">
        <div class="loading-cell"></div>
        <div class="loading-cell"></div>
        <div class="loading-cell"></div>
      </div>
    `;
  }
  
  container.innerHTML = `<div class="loading-container">${loadingHTML}</div>`;
}

/**
 * 显示通知消息
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {string} type - 类型 (success, error, info, warning)
 */
export function showNotification(title, message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-header">
      <h4>${title}</h4>
      <button class="close-notification">&times;</button>
    </div>
    <div class="notification-body">
      <p>${message}</p>
    </div>
  `;
  
  // 添加关闭按钮事件
  const closeBtn = notification.querySelector('.close-notification');
  closeBtn.addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
  
  notificationContainer.appendChild(notification);
  
  // 自动关闭
  setTimeout(() => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * 创建通知容器
 * @returns {HTMLElement} 通知容器元素
 */
function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  document.body.appendChild(container);
  return container;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 确认对话框
 * @param {string} title - 标题
 * @param {string} message - 消息
 * @returns {Promise<boolean>} 用户选择结果
 */
export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    // 使用顶部通知栏显示确认消息
    if (window.showNotification) {
      window.showNotification(title, message, 'confirm');
      resolve(true);
    } else {
      // 回退到简单的confirm
      resolve(confirm(`${title}: ${message}`));
    }
  });