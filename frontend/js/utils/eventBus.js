/**
 * 事件总线 - 模块间通信的核心机制
 */
const eventBus = {
  events: {},
  
  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {function} callback - 回调函数
   * @returns {function} - 取消订阅的函数
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // 返回取消订阅的函数
    return () => this.off(eventName, callback);
  },
  
  /**
   * 取消订阅事件
   * @param {string} eventName - 事件名称
   * @param {function} callback - 回调函数
   */
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  },
  
  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   */
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  },
  
  /**
   * 清空所有事件
   */
  clear() {
    this.events = {};
  }
};

export default eventBus; 