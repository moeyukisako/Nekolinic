/**
 * 分页组件
 */
export default class Pagination {
  /**
   * 构造函数
   * @param {Object} options - 配置项
   * @param {string|HTMLElement} options.containerId - 容器ID或DOM元素
   * @param {number} options.currentPage - 当前页码
   * @param {number} options.totalPages - 总页数
   * @param {Function} options.onPageChange - 页码变化回调
   * @param {number} [options.visiblePages=5] - 可见页码数
   */
  constructor(options = {}) {
    this.container = typeof options.containerId === 'string' 
      ? document.getElementById(options.containerId) 
      : options.containerId;
    this.currentPage = options.currentPage || 1;
    this.totalPages = options.totalPages || 1;
    this.onPageChange = options.onPageChange || (() => {});
    this.visiblePages = options.visiblePages || 5;
  }
  
  /**
   * 渲染分页组件
   * @returns {Pagination} 当前分页实例
   */
  render() {
    if (!this.container) return this;
    
    // 清空容器
    this.container.innerHTML = '';
    
    if (this.totalPages === 0) {
      return this; // 没有数据，不显示分页
    }
    
    // 创建分页容器
    const paginationEl = document.createElement('div');
    paginationEl.className = 'pagination';
    
    // 添加分页信息
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    // 使用国际化翻译
    const infoText = window.t ? window.t('pagination_info').replace('{current}', this.currentPage).replace('{total}', this.totalPages) : `第 ${this.currentPage} 页，共 ${this.totalPages} 页`;
    paginationInfo.textContent = infoText;
    this.container.appendChild(paginationInfo);
    
    // 如果只有一页，只显示信息，不显示控件
    if (this.totalPages === 1) {
      return this;
    }
    
    // 上一页按钮
    const prevButton = document.createElement('button');
    prevButton.className = `pagination-btn prev-btn${this.currentPage <= 1 ? ' disabled' : ''}`;
    prevButton.innerHTML = '&laquo;';
    prevButton.title = window.t ? window.t('pagination_prev') : '上一页';
    prevButton.disabled = this.currentPage <= 1;
    prevButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    paginationEl.appendChild(prevButton);
    
    // 计算显示的页码范围
    const halfVisible = Math.floor(this.visiblePages / 2);
    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + this.visiblePages - 1);
    
    if (endPage - startPage + 1 < this.visiblePages) {
      startPage = Math.max(1, endPage - this.visiblePages + 1);
    }
    
    // 第一页
    if (startPage > 1) {
      const firstPageBtn = document.createElement('button');
      firstPageBtn.className = 'pagination-btn page-btn';
      firstPageBtn.textContent = '1';
      firstPageBtn.title = window.t ? window.t('pagination_first') : '首页';
      firstPageBtn.addEventListener('click', () => this.goToPage(1));
      paginationEl.appendChild(firstPageBtn);
      
      // 省略号
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationEl.appendChild(ellipsis);
      }
    }
    
    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pagination-btn page-btn${i === this.currentPage ? ' active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => this.goToPage(i));
      paginationEl.appendChild(pageBtn);
    }
    
    // 最后一页
    if (endPage < this.totalPages) {
      // 省略号
      if (endPage < this.totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationEl.appendChild(ellipsis);
      }
      
      const lastPageBtn = document.createElement('button');
      lastPageBtn.className = 'pagination-btn page-btn';
      lastPageBtn.textContent = this.totalPages;
      lastPageBtn.title = window.t ? window.t('pagination_last') : '末页';
      lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));
      paginationEl.appendChild(lastPageBtn);
    }
    
    // 下一页按钮
    const nextButton = document.createElement('button');
    nextButton.className = `pagination-btn next-btn${this.currentPage >= this.totalPages ? ' disabled' : ''}`;
    nextButton.innerHTML = '&raquo;';
    nextButton.title = window.t ? window.t('pagination_next') : '下一页';
    nextButton.disabled = this.currentPage >= this.totalPages;
    nextButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    paginationEl.appendChild(nextButton);
    
    // 添加到容器
    this.container.appendChild(paginationEl);
    
    return this;
  }
  
  /**
   * 跳转到指定页码
   * @param {number} page - 目标页码
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.onPageChange(page);
    this.render();
  }
  
  /**
   * 更新分页选项
   * @param {Object} options - 新的配置项
   */
  update(options = {}) {
    if (options.currentPage !== undefined) {
      this.currentPage = options.currentPage;
    }
    if (options.totalPages !== undefined) {
      this.totalPages = options.totalPages;
    }
    if (options.onPageChange !== undefined) {
      this.onPageChange = options.onPageChange;
    }
    if (options.visiblePages !== undefined) {
      this.visiblePages = options.visiblePages;
    }
    
    this.render();
  }
}