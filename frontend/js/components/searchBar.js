import { debounce } from '../utils/ui.js';

/**
 * 搜索栏组件
 */
export default class SearchBar {
  /**
   * 构造函数
   * @param {Object} options - 配置项
   * @param {string|HTMLElement} options.containerId - 容器ID或DOM元素
   * @param {string} [options.placeholder='搜索...'] - 占位文本
   * @param {Function} options.onSearch - 搜索回调函数
   * @param {number} [options.debounceTime=300] - 防抖延迟时间(ms)
   * @param {boolean} [options.showButton=true] - 是否显示搜索按钮
   * @param {string} [options.buttonText='搜索'] - 按钮文本
   */
  constructor(options = {}) {
    this.container = typeof options.containerId === 'string' 
      ? document.getElementById(options.containerId) 
      : options.containerId;
    this.placeholder = options.placeholder || '搜索...';
    this.onSearch = options.onSearch || (() => {});
    this.debounceTime = options.debounceTime || 300;
    this.showButton = options.showButton !== undefined ? options.showButton : true;
    this.buttonText = options.buttonText || '搜索';
    this.searchInput = null;
    this.searchButton = null;
    
    // 防抖处理
    this.debouncedSearch = debounce((value) => {
      this.onSearch(value);
    }, this.debounceTime);
  }
  
  /**
   * 渲染搜索栏
   * @returns {SearchBar} 当前搜索栏实例
   */
  render() {
    if (!this.container) return this;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建搜索栏容器
    const searchBarEl = document.createElement('div');
    searchBarEl.className = 'search-bar';
    
    // 创建搜索输入框
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.className = 'search-input';
    this.searchInput.placeholder = this.placeholder;
    
    // 输入框事件监听
    this.searchInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      this.debouncedSearch(value);
    });
    
    // 回车键触发搜索
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = e.target.value.trim();
        this.onSearch(value);
      }
    });
    
    // 添加搜索图标
    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = '<i class="fas fa-search"></i>';
    
    // 创建搜索按钮(如果需要)
    if (this.showButton) {
      this.searchButton = document.createElement('button');
      this.searchButton.type = 'button';
      this.searchButton.className = 'btn btn-primary search-btn';
      this.searchButton.textContent = this.buttonText;
      
      // 按钮点击事件
      this.searchButton.addEventListener('click', () => {
        const value = this.searchInput.value.trim();
        this.onSearch(value);
      });
    }
    
    // 添加到搜索栏容器
    const searchInputWrapper = document.createElement('div');
    searchInputWrapper.className = 'search-input-wrapper';
    searchInputWrapper.appendChild(searchIcon);
    searchInputWrapper.appendChild(this.searchInput);
    
    searchBarEl.appendChild(searchInputWrapper);
    
    if (this.showButton) {
      searchBarEl.appendChild(this.searchButton);
    }
    
    // 添加到容器
    this.container.appendChild(searchBarEl);
    
    return this;
  }
  
  /**
   * 获取搜索值
   * @returns {string} 当前搜索值
   */
  getValue() {
    return this.searchInput ? this.searchInput.value.trim() : '';
  }
  
  /**
   * 设置搜索值
   * @param {string} value - 搜索值
   */
  setValue(value) {
    if (this.searchInput) {
      this.searchInput.value = value;
    }
  }
  
  /**
   * 清空搜索框
   */
  clear() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
  }
  
  /**
   * 触发搜索
   */
  triggerSearch() {
    if (this.searchInput) {
      this.onSearch(this.searchInput.value.trim());
    }
  }
} 