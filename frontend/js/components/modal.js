/**
 * 模态框组件
 */
export default class Modal {
  /**
   * 构造函数
   * @param {Object} options - 配置项
   * @param {string} options.title - 模态框标题
   * @param {string|HTMLElement} options.content - 模态框内容(HTML字符串或DOM元素)
   * @param {Function} [options.onConfirm] - 确认按钮回调
   * @param {Function} [options.onCancel] - 取消按钮回调
   * @param {boolean} [options.showFooter=true] - 是否显示底部按钮区域
   * @param {string} [options.confirmText='确认'] - 确认按钮文本
   * @param {string} [options.cancelText='取消'] - 取消按钮文本
   * @param {string} [options.size='medium'] - 模态框大小(small, medium, large)
   * @param {boolean} [options.closeOnBackdrop=true] - 点击背景是否关闭模态框
   */
  constructor(options = {}) {
    this.title = options.title || '提示';
    this.content = options.content || '';
    this.onConfirm = options.onConfirm;
    this.onCancel = options.onCancel;
    this.showFooter = options.showFooter !== undefined ? options.showFooter : true;
    this.confirmText = options.confirmText || '确认';
    this.cancelText = options.cancelText || '取消';
    this.size = options.size || 'medium';
    this.closeOnBackdrop = options.closeOnBackdrop !== undefined ? options.closeOnBackdrop : true;
    this.element = null;
    this.contentContainer = null;
  }
  
  /**
   * 渲染模态框
   * @returns {Modal} 当前模态框实例
   */
  render() {
    // 创建模态框元素
    this.element = document.createElement('div');
    this.element.className = `modal modal-${this.size}`;
    
    // 设置HTML内容
    this.element.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${this.title}</h3>
          <button type="button" class="close-modal" aria-label="关闭">&times;</button>
        </div>
        <div class="modal-body"></div>
        ${this.showFooter ? `
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary cancel-modal">${this.cancelText}</button>
            <button type="button" class="btn btn-primary confirm-modal">${this.confirmText}</button>
          </div>
        ` : ''}
      </div>
    `;
    
    // 获取内容容器
    this.contentContainer = this.element.querySelector('.modal-body');
    
    // 设置内容
    if (typeof this.content === 'string') {
      this.contentContainer.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      this.contentContainer.appendChild(this.content);
    }
    
    // 绑定事件
    const closeButton = this.element.querySelector('.close-modal');
    closeButton.addEventListener('click', () => this.close());
    
    if (this.showFooter) {
      const cancelButton = this.element.querySelector('.cancel-modal');
      const confirmButton = this.element.querySelector('.confirm-modal');
      
      cancelButton.addEventListener('click', () => {
        if (this.onCancel) this.onCancel();
        this.close();
      });
      
      confirmButton.addEventListener('click', async () => {
        if (this.onConfirm) {
          const result = await this.onConfirm();
          if (result !== false) {
            this.close();
          }
        } else {
          this.close();
        }
      });
    }
    
    // 点击背景关闭
    if (this.closeOnBackdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.close();
        }
      });
    }
    
    // 添加到DOM
    document.body.appendChild(this.element);
    
    // 触发动画
    setTimeout(() => {
      this.element.classList.add('active');
    }, 10);
    
    return this;
  }
  
  /**
   * 关闭模态框
   */
  close() {
    if (!this.element) return;
    
    this.element.classList.remove('active');
    
    // 淡出动画
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      }
    }, 300);
  }
  
  /**
   * 更新内容
   * @param {string|HTMLElement} content - 新内容
   */
  setContent(content) {
    if (!this.contentContainer) return;
    
    if (typeof content === 'string') {
      this.contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.contentContainer.innerHTML = '';
      this.contentContainer.appendChild(content);
    }
  }
  
  /**
   * 更新标题
   * @param {string} title - 新标题
   */
  setTitle(title) {
    const titleEl = this.element?.querySelector('.modal-header h3');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
  
  /**
   * 静态方法: 确认对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Function} [onConfirm] - 确认回调
   * @param {Function} [onCancel] - 取消回调
   * @returns {Promise} 返回Promise以保持兼容性
   */
  static confirm(title, message, onConfirm, onCancel) {
    if (window.showNotification) {
      window.showNotification(title, message, 'info');
      if (onConfirm) onConfirm();
      return Promise.resolve(true);
    }
    // 降级到原生confirm
    const result = confirm(`${title}: ${message}`);
    if (result && onConfirm) onConfirm();
    if (!result && onCancel) onCancel();
    return Promise.resolve(result);
  }
  
  /**
   * 静态方法: 信息提示框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Function} [onClose] - 关闭回调
   * @returns {Promise} 返回Promise以保持兼容性
   */
  static alert(title, message, onClose) {
    if (window.showNotification) {
      window.showNotification(title, message, 'info');
      if (onClose) onClose();
      return Promise.resolve();
    }
    // 降级到原生alert
    alert(`${title}: ${message}`);
    if (onClose) onClose();
    return Promise.resolve();
  }

  /**
   * 静态方法: 表格提醒方式通知（类似Index登录组件的通知形式）
   * @param {string} type - 通知类型: success, error, warning, info
   * @param {string} title - 通知标题
   * @param {string} message - 通知内容
   * @param {number} [duration] - 显示时长（毫秒），默认根据类型自动设置
   * @returns {Promise} 返回Promise以保持兼容性
   */
  static showFormNotification(type, title, message, duration) {
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
    
    // 添加样式（如果不存在）
    if (!document.querySelector('#form-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'form-notification-styles';
      style.textContent = `
        .form-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 350px;
          min-width: 280px;
          background: var(--color-bg-card, rgba(255, 255, 255, 0.95));
          border: 1px solid var(--color-border, rgba(255, 255, 255, 0.2));
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(20px);
          z-index: 10002;
          opacity: 0;
          transform: translateX(100%) scale(0.9);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          line-height: 1.5;
        }
        
        .form-notification.show {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        
        .form-notification.success {
          border-left: 4px solid #28a745;
          color: var(--color-text-primary, #333);
        }
        
        .form-notification.error {
          border-left: 4px solid #dc3545;
          color: var(--color-text-primary, #333);
        }
        
        .form-notification.warning {
          border-left: 4px solid #ffc107;
          color: var(--color-text-primary, #333);
        }
        
        .form-notification.info {
          border-left: 4px solid #17a2b8;
          color: var(--color-text-primary, #333);
        }
        
        .form-notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .form-notification-icon {
          margin-right: 8px;
          font-weight: bold;
        }
        
        .form-notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--color-text-secondary, #666);
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .form-notification-close:hover {
          background: var(--color-bg-hover, rgba(0, 0, 0, 0.1));
          color: var(--color-text-primary, #333);
        }
        
        .form-notification-body {
          color: var(--color-text-secondary, #666);
          font-size: 13px;
        }
        
        /* 深色主题适配 */
        [data-theme="dark"] .form-notification {
          background: var(--color-bg-card, rgba(30, 30, 30, 0.95));
          border-color: var(--color-border, rgba(255, 255, 255, 0.1));
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          color: var(--color-text-primary, #fff);
        }
        
        [data-theme="dark"] .form-notification-body {
          color: var(--color-text-secondary, #ccc);
        }
        
        [data-theme="dark"] .form-notification-close {
          color: var(--color-text-secondary, #ccc);
        }
        
        [data-theme="dark"] .form-notification-close:hover {
          background: var(--color-bg-hover, rgba(255, 255, 255, 0.1));
          color: var(--color-text-primary, #fff);
        }
        
        /* 移动端响应式 */
        @media (max-width: 768px) {
          .form-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            min-width: auto;
            border-radius: 10px;
            padding: 14px 16px;
            font-size: 13px;
          }
          
          .form-notification-header {
            margin-bottom: 6px;
          }
          
          .form-notification-body {
            font-size: 12px;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // 自动隐藏（错误消息显示更久）
    const hideDelay = duration || (type === 'error' ? 5000 : 3000);
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
    
    return Promise.resolve();
  }

  /**
   * 静态方法: 替换showNotification的通知方法
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型: success, error, warning, info
   * @param {string} [title] - 通知标题，默认根据类型自动设置
   * @returns {Promise} 返回Promise以保持兼容性
   */
  static notification(message, type = 'info', title) {
    // 默认标题映射
    const defaultTitles = {
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '提示'
    };
    
    const notificationTitle = title || defaultTitles[type] || '通知';
    return Modal.showFormNotification(type, notificationTitle, message);
  }
}