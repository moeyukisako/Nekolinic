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
}