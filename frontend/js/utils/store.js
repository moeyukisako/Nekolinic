import eventBus from './eventBus.js';

/**
 * 简易状态管理 - 存储全局状态
 */
const store = {
  state: {
    currentUser: null,
    currentModule: null,
    selectedPatient: null,
    // 其他全局状态...
  },
  
  /**
   * 获取状态
   * @param {string} key - 状态键
   * @returns {any} 状态值
   */
  get(key) {
    return this.state[key];
  },
  
  /**
   * 设置状态
   * @param {string} key - 状态键
   * @param {any} value - 状态值
   */
  set(key, value) {
    this.state[key] = value;
    // 触发更新事件
    eventBus.emit(`state:${key}:updated`, value);
  }
};

export default store; 