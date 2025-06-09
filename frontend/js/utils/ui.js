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
 * 隐藏加载中状态
 * @param {HTMLElement} container - 容器元素
 */
export function hideLoading(container) {
  if (!container) return;
  
  const loadingContainer = container.querySelector('.loading-container');
  if (loadingContainer) {
    loadingContainer.remove();
  }
}

// 全局变量用于管理通知定时器
let notificationTimer = null;
let hideTimer = null;

/**
 * 显示一个短暂的顶部通知 (Toast)。
 * @param {string} message - 要显示的消息。
 * @param {string} type - 通知类型 ('success', 'error', 'info', 'warning')，会影响背景色。
 */
export function showNotification(message, type = 'info') {
    // 调试信息：检查DOM状态
    console.log('showNotification called:', message, type);
    console.log('Document ready state:', document.readyState);
    
    const statusElement = document.getElementById('status-message');
    if (!statusElement) {
        console.error('Status message element not found! Available elements:', {
            'by_id': document.getElementById('status-message'),
            'by_class': document.querySelector('.status-message'),
            'all_with_class': document.querySelectorAll('.status-message'),
            'navbar_exists': !!document.querySelector('.navbar'),
            'body_children': Array.from(document.body.children).map(el => el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''))
        });
        
        // 尝试使用querySelector作为备选方案
        const fallbackElement = document.querySelector('.status-message');
        if (fallbackElement) {
            console.log('Found element using class selector, using fallback');
            showNotificationInternal(fallbackElement, message, type);
            return;
        }
        
        console.warn('Status message element not found, creating temporary notification:', message);
        createTemporaryNotification(message, type);
        return;
    }
    
    console.log('Found status element immediately:', statusElement);
    console.log('Element details:', {
        tagName: statusElement.tagName,
        id: statusElement.id,
        className: statusElement.className,
        textContent: statusElement.textContent,
        parentElement: statusElement.parentElement?.tagName
    });
    showNotificationInternal(statusElement, message, type);
}

/**
 * 创建临时通知元素
 * @param {string} message - 要显示的消息
 * @param {string} type - 通知类型
 */
function createTemporaryNotification(message, type) {
    console.log('createTemporaryNotification called:', message, type);
    // 创建临时通知容器
    let tempContainer = document.getElementById('temp-notification-container');
    if (!tempContainer) {
        tempContainer = document.createElement('div');
        tempContainer.id = 'temp-notification-container';
        tempContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        `;
        document.body.appendChild(tempContainer);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
        border-radius: 4px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    tempContainer.appendChild(notification);
    console.log('Temporary notification element created and appended to container');
    
    // 动画显示
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
        console.log('Temporary notification animation started');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * 内部通知显示函数
 * @param {HTMLElement} statusElement - 状态消息元素
 * @param {string} message - 要显示的消息
 * @param {string} type - 通知类型
 */
function showNotificationInternal(statusElement, message, type) {

    // 清除之前的定时器
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
    }
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    // 设置消息文本
    statusElement.textContent = message;
    statusElement.classList.add('show');
    
    // 根据类型设置颜色
    statusElement.classList.remove('text-success', 'text-danger', 'text-warning', 'text-info');
    switch (type) {
        case 'success':
            statusElement.classList.add('text-success');
            break;
        case 'error':
            statusElement.classList.add('text-danger');
            break;
        case 'warning':
            statusElement.classList.add('text-warning');
            break;
        case 'info':
        default:
            statusElement.classList.add('text-info');
            break;
    }
    
    // 3秒后自动隐藏
    notificationTimer = setTimeout(() => {
        statusElement.classList.remove('show');
        hideTimer = setTimeout(() => {
            statusElement.textContent = '';
            statusElement.classList.remove('text-success', 'text-danger', 'text-warning', 'text-info');
            notificationTimer = null;
            hideTimer = null;
        }, 300); // 等待淡出动画完成
    }, 3000);
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
    // 回退到浏览器默认确认对话框
    const confirmed = confirm(`${title}: ${message}`);
    resolve(confirmed);
  });
}

// 创建模态框
export function createModal(title, content, options = {}) {
  const modalId = 'dynamic-modal-' + Date.now();
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = modalId;
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-labelledby', modalId + '-label');
  modal.setAttribute('aria-hidden', 'true');
  
  const showFooter = options.showFooter !== false;
  const footerButtons = options.footerButtons || [
    { text: '关闭', class: 'btn-secondary', action: 'close' }
  ];
  
  modal.innerHTML = `
    <div class="modal-dialog ${options.size ? 'modal-' + options.size : ''}">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${modalId}-label" ${options.titleI18n ? `data-i18n="${options.titleI18n}"` : ''}>${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          ${typeof content === 'string' ? content : ''}
        </div>
        ${showFooter ? `
          <div class="modal-footer">
            ${footerButtons.map(btn => 
              `<button type="button" class="btn ${btn.class}" data-action="${btn.action}" ${btn['data-i18n'] ? `data-i18n="${btn['data-i18n']}"` : ''}>${btn.text}</button>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 如果内容是DOM元素，插入到modal-body中
  if (typeof content !== 'string') {
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.appendChild(content);
  }
  
  // 添加按钮事件监听
  const footer = modal.querySelector('.modal-footer');
  if (footer) {
    footer.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action && options.onButtonClick) {
        options.onButtonClick(action, modal);
      }
      if (action === 'close' || action === 'cancel') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    });
  }
  
  // 创建Bootstrap模态框实例
  const bsModal = new bootstrap.Modal(modal);
  
  // 模态框隐藏后移除DOM元素
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
  
  return {
    modal: modal,
    bsModal: bsModal,
    show: () => bsModal.show(),
    hide: () => bsModal.hide()
  };
}

// 确认对话框模态框
export function confirmModal(title, message, options = {}) {
  return new Promise((resolve) => {
    const modalInstance = createModal(title, `<p>${message}</p>`, {
      footerButtons: [
        { text: options.cancelText || '取消', class: 'btn-secondary', action: 'cancel' },
        { text: options.confirmText || '确认', class: options.confirmClass || 'btn-danger', action: 'confirm' }
      ],
      onButtonClick: (action) => {
        resolve(action === 'confirm');
        modalInstance.hide();
      }
    });
    
    modalInstance.show();
  });
}