/*
 * 财务管理模块 - 重新设计版本
 */

import apiClient from '../apiClient.js';
import Pagination from '../components/pagination.js';
import { confirmModal } from '../utils/ui.js';

export default function renderFinanceModule(container, options = {}) {
  const { signal } = options;
  
  // 创建财务管理界面
  container.innerHTML = `
    <div class="finance-module-wrapper">
      <div class="finance-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value" id="total-bills">0</div>
            <div class="stat-label" data-i18n="finance.stats.totalBills">总账单数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value" id="total-amount">¥0</div>
            <div class="stat-label" data-i18n="finance.stats.totalAmount">总金额</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value" id="paid-bills">0</div>
            <div class="stat-label" data-i18n="finance.stats.paidBills">已支付</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value" id="pending-bills">0</div>
            <div class="stat-label" data-i18n="finance.stats.pendingBills">待支付</div>
          </div>
        </div>
      </div>
      
      <div id="finance-module-content">
        <div class="finance-tabs">
          <button class="tab-btn active" data-tab="billing" data-i18n="billing_management">账单管理</button>
          <button class="tab-btn" data-tab="income" data-i18n="income_statistics">收入统计</button>
          <button class="tab-btn" data-tab="expenses" data-i18n="expense_management">支出管理</button>
        </div>
        
        <div class="tab-content">
          <div id="billing-tab" class="tab-pane active">
            <div class="billing-section">
              <div class="billing-header">
                <h3 data-i18n="billing_list">账单列表</h3>
                <div class="billing-controls">
                  <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="bill-search" placeholder="搜索账单号、患者..." data-i18n-placeholder="search_bills">
                  </div>
                  <div class="filter-buttons">
                    <div class="dropdown">
                      <button class="btn btn-secondary dropdown-toggle" id="status-filter-btn" data-i18n="all_status">全部状态</button>
                      <div class="dropdown-menu" id="status-filter-menu">
                        <a class="dropdown-item" data-value="" data-i18n="all_status">全部状态</a>
                        <a class="dropdown-item" data-value="UNPAID" data-i18n="status_pending">待支付</a>
                        <a class="dropdown-item" data-value="PAID" data-i18n="status_paid">已支付</a>
                        <a class="dropdown-item" data-value="CANCELLED" data-i18n="status_cancelled">已取消</a>
                        <a class="dropdown-item" data-value="REFUNDED" data-i18n="status_refunded">已退款</a>
                      </div>
                    </div>
                    <div class="dropdown">
                      <button class="btn btn-secondary dropdown-toggle" id="date-filter-btn" data-i18n="all_dates">全部日期</button>
                      <div class="dropdown-menu" id="date-filter-menu">
                        <a class="dropdown-item" data-value="" data-i18n="all_dates">全部日期</a>
                        <a class="dropdown-item" data-value="today" data-i18n="today">今天</a>
                        <a class="dropdown-item" data-value="week" data-i18n="this_week">本周</a>
                        <a class="dropdown-item" data-value="month" data-i18n="this_month">本月</a>
                      </div>
                    </div>
                    <button id="refresh-bills-btn" class="btn btn-primary">
                      <i class="fas fa-sync-alt"></i>
                      <span data-i18n="refresh">刷新</span>
                    </button>

                  </div>
                </div>
              </div>
              
              <div class="billing-list-container">
                <div id="bills-loading" class="loading-state" style="display: none;">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span data-i18n="loading">加载中...</span>
                </div>

                <div id="bills-error" class="bills-error" style="display: none;">
                  <i class="fas fa-exclamation-triangle"></i>
                  <p>加载账单失败，请稍后重试</p>
                </div>
                <div class="bills-table-container">
                  <div class="bills-table-flex">
                    <div class="bills-table-header-flex">
                      <div class="header-cell expand-header"></div>
                      <div class="header-cell bill-id-header" data-i18n="finance.table.billId">账单号</div>
                      <div class="header-cell invoice-header" data-i18n="finance.table.invoice">发票号</div>
                      <div class="header-cell patient-header" data-i18n="finance.table.patient">患者</div>
                      <div class="header-cell status-header" data-i18n="finance.table.status">状态</div>
                      <div class="header-cell date-header" data-i18n="finance.table.date">日期</div>
                      <div class="header-cell amount-header" data-i18n="finance.table.amount">金额</div>
                      <div class="header-cell actions-header" data-i18n="finance.table.actions">操作</div>
                    </div>
                    <div id="bills-tbody" class="bills-tbody-flex">
                      <!-- 账单行将在这里动态生成 -->
                    </div>
                  </div>
                </div>
                <div id="bills-pagination" class="pagination-container"></div>
              </div>
            </div>
          </div>
          
          <div id="payment-collection-tab" class="tab-pane">
            <div class="placeholder-content">
              <div class="placeholder-icon">
                <i class="fas fa-credit-card"></i>
              </div>
              <h3 data-i18n="payment_collection">费用收取</h3>
              <p data-i18n="side_payment_migrated">聚合支付功能已迁移到独立模块</p>
            </div>
          </div>
          
          <div id="income-tab" class="tab-pane">
            <div class="income-section">
              <h3 data-i18n="income_statistics">收入统计</h3>
              
              <!-- 日期选择器 -->
              <div class="date-range-selector mb-3">
                <div class="row">
                  <div class="col-md-4">
                    <label for="income-start-date" class="form-label" data-i18n="start_date">开始日期</label>
                    <input type="date" id="income-start-date" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="income-end-date" class="form-label" data-i18n="end_date">结束日期</label>
                    <input type="date" id="income-end-date" class="form-control">
                  </div>
                  <div class="col-md-4 d-flex align-items-end">
                    <button id="load-income-stats" class="btn btn-primary" data-i18n="load_statistics">加载统计</button>
                  </div>
                </div>
              </div>
              
              <!-- 收入统计卡片 -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-success" data-i18n="total_income">总收入</h5>
                      <h3 id="total-income-amount" class="text-success">¥0.00</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-info" data-i18n="paid_bills_count">已支付账单数</h5>
                      <h3 id="paid-bills-count" class="text-info">0</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-primary" data-i18n="average_bill_amount">平均账单金额</h5>
                      <h3 id="average-bill-amount" class="text-primary">¥0.00</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-warning" data-i18n="payment_methods">支付方式</h5>
                      <div id="payment-methods-summary" class="small">-</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 图表区域 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header">
                      <h6 data-i18n="monthly_income_trend">月度收入趋势</h6>
                    </div>
                    <div class="card-body">
                      <canvas id="income-monthly-chart" width="400" height="200"></canvas>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header">
                      <h6 data-i18n="payment_method_breakdown">支付方式分布</h6>
                    </div>
                    <div class="card-body">
                      <canvas id="payment-method-chart" width="400" height="200"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div id="expenses-tab" class="tab-pane">
            <div class="expenses-section">
              <h3 data-i18n="expense_management">支出管理</h3>
              
              <!-- 操作按钮 -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="btn-group">
                  <button id="add-expense-btn" class="btn btn-primary" data-i18n="add_expense">添加支出</button>
                  <button id="init-categories-btn" class="btn btn-outline-secondary" data-i18n="init_categories">初始化分类</button>
                </div>
                <div class="date-range-filter">
                  <input type="date" id="expense-start-date" class="form-control d-inline-block" style="width: auto;">
                  <span class="mx-2" data-i18n="to">至</span>
                  <input type="date" id="expense-end-date" class="form-control d-inline-block" style="width: auto;">
                  <select id="expense-category-filter" class="form-select d-inline-block ms-2" style="width: auto;">
                    <option value="" data-i18n="all_categories">所有分类</option>
                  </select>
                  <button id="filter-expenses-btn" class="btn btn-outline-primary ms-2" data-i18n="filter">筛选</button>
                </div>
              </div>
              
              <!-- 支出统计卡片 -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-danger" data-i18n="total_expenses">总支出</h5>
                      <h3 id="total-expenses-amount" class="text-danger">¥0.00</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-info" data-i18n="expense_count">支出笔数</h5>
                      <h3 id="expense-count" class="text-info">0</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title text-warning" data-i18n="top_category">主要分类</h5>
                      <div id="top-expense-category" class="small">-</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 支出列表 -->
              <div class="card">
                <div class="card-header">
                  <h6 data-i18n="expense_list">支出列表</h6>
                </div>
                <div class="card-body">
                  <div id="expenses-loading" class="text-center" style="display: none;">
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden" data-i18n="loading">加载中...</span>
                    </div>
                  </div>
                  <div id="expenses-error" class="alert alert-danger" style="display: none;">
                    <span data-i18n="load_expenses_error">加载支出数据失败</span>
                  </div>
                  <div id="expenses-table-container">
                    <table id="expenses-table" class="table table-striped">
                      <thead>
                        <tr>
                          <th data-i18n="expense_date">支出日期</th>
                          <th data-i18n="category">分类</th>
                          <th data-i18n="description">描述</th>
                          <th data-i18n="amount">金额</th>
                          <th data-i18n="actions">操作</th>
                        </tr>
                      </thead>
                      <tbody id="expenses-tbody">
                      </tbody>
                    </table>
                  </div>
                  <div id="expenses-pagination" class="d-flex justify-content-center mt-3">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }

  // 存储原始账单数据
  let allBills = [];
  let filteredBills = [];
  
  // 分页相关变量
  let currentPage = 1;
  let pageSize = 20;
  let totalCount = 0;
  let pagination = null;

  // 加载账单数据
  async function loadBills(page = 1) {
    const loadingEl = container.querySelector('#bills-loading');
    const errorEl = container.querySelector('#bills-error');
    const tableEl = container.querySelector('#bills-table');
    
    try {
      console.log('开始加载账单数据...');
      if (loadingEl) loadingEl.style.display = 'block';
      if (errorEl) errorEl.style.display = 'none';
      if (tableEl) tableEl.style.display = 'none';
      
      currentPage = page;
      const skip = (page - 1) * pageSize;
      const response = await apiClient.finance.getBills({ skip, limit: pageSize });
      console.log('API响应:', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        console.log('获取到账单数据:', response.items.length, '条，总计:', response.total, '条');
        allBills = response.items;
        filteredBills = [...allBills];
        totalCount = response.total;
        renderBills(filteredBills);
        setupFilters();
        
        // 初始化或更新分页组件
        if (!pagination) {
          initPagination();
        } else {
          // 只更新分页数据，不重新渲染（避免重复渲染导致的无限循环）
          const totalPages = Math.ceil(totalCount / pageSize);
          pagination.currentPage = currentPage;
          pagination.totalPages = totalPages;
        }
      } else {
        console.log('响应数据格式不正确或为空:', response);
        allBills = [];
        filteredBills = [];
        totalCount = 0;
        const emptyEl = container.querySelector('#bills-empty');
        if (emptyEl) emptyEl.style.display = 'flex';
      }
    } catch (error) {
      console.error('加载账单失败:', error);
      console.error('错误详情:', error.message, error.stack);
      if (errorEl) errorEl.style.display = 'flex';
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      if (window.translatePage) {
        window.translatePage();
      }
    }
  }

  // 渲染账单列表
  function renderBills(bills) {
    console.log('开始渲染账单列表:', bills);
    const billsTable = container.querySelector('#bills-table');
    const billsTbody = container.querySelector('#bills-tbody');
    const loadingEl = container.querySelector('#bills-loading');
    const errorEl = container.querySelector('#bills-error');
    
    console.log('找到的DOM元素:', {
      billsTable: !!billsTable,
      billsTbody: !!billsTbody,
      loadingEl: !!loadingEl,
      errorEl: !!errorEl
    });
    
    // 隐藏所有状态元素
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    if (!bills || bills.length === 0) {
      console.log('账单数据为空');
      if (billsTable) billsTable.style.display = 'none';
      return;
    }
    
    console.log('渲染', bills.length, '条账单数据');
    if (billsTable) billsTable.style.display = 'table';
    const billsHtml = bills.map(bill => createBillRow(bill)).join('');
    console.log('生成的HTML长度:', billsHtml.length);
    if (billsTbody) {
      billsTbody.innerHTML = billsHtml;
      console.log('HTML已插入到tbody');
    }
    
    // 异步加载患者姓名
    loadPatientNames(bills);
    
    // 绑定表格行事件
    bindBillRowEvents();
    
    // 翻译动态生成的内容
    if (window.translatePage) {
      window.translatePage();
    }
  }

  // 创建账单行
  function createBillRow(bill) {
    const statusClass = getStatusClass(bill.status);
    const statusText = getBillStatusText(bill.status);
    const billDate = new Date(bill.bill_date).toLocaleDateString('zh-CN');
    
    return `
      <div class="bill-row-flex" data-bill-id="${bill.id}">
        <div class="bill-cell expand-cell">
          <button class="expand-btn" data-action="toggle-details">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="bill-cell bill-id-cell">
          <span class="bill-id-text">#${bill.id}</span>
        </div>
        <div class="bill-cell invoice-cell">
          <span class="invoice-text">${bill.invoice_number || 'N/A'}</span>
        </div>
        <div class="bill-cell patient-cell" data-patient-id="${bill.patient_id}">
          <span class="patient-text">${bill.patient_name || '加载中...'}</span>
        </div>
        <div class="bill-cell status-cell">
          <span class="bill-status-text ${statusClass}">
            <span data-i18n="finance.status.${bill.status}"></span>
          </span>
        </div>
        <div class="bill-cell date-cell">
          <span class="date-text">${billDate}</span>
        </div>
        <div class="bill-cell amount-cell">
          <span class="amount-text">¥${parseFloat(bill.total_amount).toFixed(2)}</span>
        </div>
        <div class="bill-cell actions-cell">
          <div class="bill-actions">
            <button class="btn-text btn-text-danger" data-action="delete" title="删除" data-i18n-title="finance.actions.delete">
              <i class="fas fa-trash"></i>
              <span data-i18n="finance.actions.delete">删除</span>
            </button>
            ${bill.status === 'unpaid' ? `
              <button class="btn-text btn-text-success" data-action="payment" title="支付" data-i18n-title="finance.actions.payment">
                <i class="fas fa-credit-card"></i>
                <span data-i18n="finance.actions.payment">支付</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="bill-details-row-flex" data-bill-id="${bill.id}" style="display: none;">
         <div class="bill-details-container">
           <div class="details-loading" style="display: none;">
             <i class="fas fa-spinner fa-spin"></i>
             <span data-i18n="finance.loading">加载中...</span>
           </div>
           <table class="bill-details-table" style="display: none;">
             <thead>
               <tr>
                 <th data-i18n="finance.details.description">项目描述</th>
                 <th data-i18n="finance.details.quantity">数量</th>
                 <th data-i18n="finance.details.unitPrice">单价</th>
                 <th data-i18n="finance.details.subtotal">小计</th>
               </tr>
             </thead>
             <tbody class="details-tbody">
               <!-- 明细项目将在这里动态加载 -->
             </tbody>
             <tfoot>
               <tr class="details-total-row">
                 <td colspan="3" class="total-label" data-i18n="finance.details.total">总计:</td>
                 <td class="total-amount">¥${parseFloat(bill.total_amount).toFixed(2)}</td>
               </tr>
             </tfoot>
           </table>
           <div class="details-error" style="display: none;">
             <i class="fas fa-exclamation-triangle"></i>
             <span data-i18n="finance.error">加载失败，请重试</span>
           </div>
         </div>
       </div>
    `;
  }

  // 获取账单状态文本
  function getBillStatusText(status) {
    const statusMap = {
      'unpaid': '待支付',
      'paid': '已支付',
      'partially_paid': '部分支付',
      'void': '已作废',
      'UNPAID': '待支付',
      'PAID': '已支付',
      'CANCELLED': '已取消',
      'REFUNDED': '已退款'
    };
    return statusMap[status] || status;
  }

  // 获取状态样式类
  function getStatusClass(status) {
    const classMap = {
      'UNPAID': 'pending',
      'PAID': 'paid',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'cancelled',
      'unpaid': 'pending',
      'paid': 'paid',
      'void': 'cancelled',
      'overdue': 'overdue'
    };
    return classMap[status] || 'pending';
  }

  // 获取状态图标
  function getStatusIcon(status) {
    const iconMap = {
      'UNPAID': 'fa-clock',
      'PAID': 'fa-check-circle',
      'CANCELLED': 'fa-times-circle',
      'REFUNDED': 'fa-undo',
      'unpaid': 'fa-clock',
      'paid': 'fa-check-circle',
      'void': 'fa-times-circle'
    };
    return iconMap[status] || 'fa-clock';
  }

  // 异步加载患者姓名
  async function loadPatientNames(bills) {
    const patientIds = [...new Set(bills.map(bill => bill.patient_id).filter(id => id))];
    
    for (const patientId of patientIds) {
      try {
        const patient = await apiClient.patients.getById(patientId);
        const patientName = patient.name || '未知患者';
        
        // 更新所有该患者的账单行
        const patientCells = container.querySelectorAll(`[data-patient-id="${patientId}"]`);
        patientCells.forEach(cell => {
          cell.textContent = patientName;
        });
      } catch (error) {
        console.error(`获取患者${patientId}信息失败:`, error);
        const patientCells = container.querySelectorAll(`[data-patient-id="${patientId}"]`);
        patientCells.forEach(cell => {
          cell.textContent = '获取失败';
        });
      }
    }
  }

  // 删除账单
  async function deleteBill(billId) {
    const bill = allBills.find(b => b.id == billId);
    if (!bill) return;
    
    const confirmTitle = window.getTranslation ? window.getTranslation('confirm_delete', '确认删除') : '确认删除';
    const confirmMessage = `确定要删除账单 #${billId} 吗？<br><br><strong>发票号:</strong> ${bill.invoice_number || 'N/A'}<br><strong>金额:</strong> ¥${parseFloat(bill.total_amount).toFixed(2)}<br><br><span style="color: #dc3545;">此操作不可撤销</span>`;
    
    try {
      const confirmed = await confirmModal(confirmTitle, confirmMessage, {
        confirmText: '删除',
        cancelText: '取消',
        confirmClass: 'btn-danger'
      });
      
      if (!confirmed) return;
      
      await apiClient.finance.deleteBill(billId);
      
      // 从本地数据中移除
      const index = allBills.findIndex(b => b.id == billId);
      if (index > -1) {
        allBills.splice(index, 1);
      }
      
      // 重新渲染列表
      renderBills(allBills);
      updateStats(allBills);
      
      // 显示成功消息
      if (window.showNotification) {
        const successTitle = window.getTranslation ? window.getTranslation('success', '成功') : '成功';
        const successMessage = window.getTranslation ? window.getTranslation('bill_deleted_success', '账单已删除') : '账单已删除';
        window.showNotification(successTitle, successMessage, 'success');
      }
    } catch (error) {
      console.error('删除账单失败:', error);
      if (window.showNotification) {
        const errorTitle = window.getTranslation ? window.getTranslation('error', '错误') : '错误';
        const errorMessage = window.getTranslation ? window.getTranslation('bill_delete_failed', '删除账单失败') : '删除账单失败';
        window.showNotification(errorTitle, errorMessage + ': ' + error.message, 'error');
      }
    }
  }

  // 绑定表格行事件
  function bindBillRowEvents() {
    const billRows = container.querySelectorAll('.bill-row-flex');
    
    billRows.forEach(row => {
      const billId = row.dataset.billId;
      
      // 绑定展开按钮事件
      const expandBtn = row.querySelector('.expand-btn');
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleBillDetails(billId);
        }, { signal });
      }
      
      // 绑定操作按钮事件
      const actionBtns = row.querySelectorAll('[data-action]');
      actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          handleBillAction(billId, action);
        }, { signal });
      });
    });
  }

  // 切换账单明细显示
  async function toggleBillDetails(billId) {
    const detailsRow = container.querySelector(`.bill-details-row-flex[data-bill-id="${billId}"]`);
    const expandBtn = container.querySelector(`.bill-row-flex[data-bill-id="${billId}"] .expand-btn i`);
    
    if (!detailsRow || !expandBtn) return;
    
    const isExpanded = detailsRow.style.display !== 'none';
    
    if (isExpanded) {
      // 收起明细
      detailsRow.style.display = 'none';
      expandBtn.className = 'fas fa-chevron-right';
    } else {
      // 展开明细
      detailsRow.style.display = 'block';
      expandBtn.className = 'fas fa-chevron-down';
      
      // 加载明细数据
      await loadBillDetails(billId);
    }
  }
  
  // 加载账单明细
  async function loadBillDetails(billId) {
    const detailsContainer = container.querySelector(`.bill-details-row-flex[data-bill-id="${billId}"] .bill-details-container`);
    const loadingEl = detailsContainer.querySelector('.details-loading');
    const tableEl = detailsContainer.querySelector('.bill-details-table');
    const errorEl = detailsContainer.querySelector('.details-error');
    
    // 显示加载状态
    if (loadingEl) loadingEl.style.display = 'flex';
    if (tableEl) tableEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    try {
      console.log('开始加载账单明细，账单ID:', billId);
      const response = await apiClient.finance.getBillById(billId);
      console.log('账单明细API响应:', response);
      
      // 处理不同的响应格式
      const bill = response.data ? response.data : response;
      
      if (bill && tableEl) {
        const detailsTbody = tableEl.querySelector('tbody');
        
        if (bill.items && bill.items.length > 0) {
          const itemsHtml = bill.items.map(item => `
            <tr class="bill-detail-item-row">
              <td class="item-description">${item.item_name || '未知项目'}</td>
              <td class="item-quantity">${item.quantity || 0}</td>
              <td class="item-unit-price">¥${parseFloat(item.unit_price || 0).toFixed(2)}</td>
              <td class="item-subtotal">¥${parseFloat(item.subtotal || 0).toFixed(2)}</td>
            </tr>
          `).join('');
          
          if (detailsTbody) detailsTbody.innerHTML = itemsHtml;
        } else {
          if (detailsTbody) {
            detailsTbody.innerHTML = `
              <tr class="no-items-row">
                <td colspan="4" class="no-items-message">
                  <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <span data-i18n="finance.details.noItems">暂无明细项目</span>
                  </div>
                </td>
              </tr>
            `;
          }
        }
        
        // 显示内容
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
        
        // 翻译动态生成的内容
        if (window.translatePage) {
          window.translatePage();
        }
      } else {
        throw new Error('Invalid bill data received');
      }
    } catch (error) {
      console.error('加载账单明细失败:', error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'flex';
    }
  }

  // 处理账单操作
  async function handleBillAction(billId, action, cardElement) {
    switch (action) {
      case 'details':
        showBillDetails(billId);
        break;
      case 'items':
        await toggleBillItems(billId, cardElement);
        break;
      case 'pay':
        showPaymentDialog(billId);
        break;
      case 'payment':
        showPaymentDialog(billId);
        break;
      case 'delete':
        await deleteBill(billId);
        break;
    }
  }

  // 显示账单详情
  function showBillDetails(billId) {
    const bill = allBills.find(b => b.id == billId);
    if (!bill) return;
    
    // 这里可以打开一个模态框显示详细信息
    alert(`账单详情\n账单号: ${bill.invoice_number}\n患者ID: ${bill.patient_id}\n总金额: ¥${bill.total_amount}\n状态: ${getBillStatusText(bill.status)}`);
  }

  // 切换账单明细显示
  async function toggleBillItems(billId, cardElement) {
    const itemsContainer = cardElement.querySelector('.bill-items-container');
    const toggleBtn = cardElement.querySelector('.btn-toggle-items');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    const placeholder = cardElement.querySelector('.bill-items-placeholder');
    
    if (itemsContainer.style.display === 'block') {
      // 隐藏明细
      itemsContainer.style.display = 'none';
      placeholder.style.display = 'block';
      toggleBtn.innerHTML = '<i class="fas fa-eye"></i><span class="toggle-text">显示明细</span>';
    } else {
      // 显示明细
      placeholder.style.display = 'none';
      await loadBillItems(billId, cardElement);
      itemsContainer.style.display = 'block';
      toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span class="toggle-text">隐藏明细</span>';
    }
  }

  // 加载账单明细
  async function loadBillItems(billId, cardElement) {
    const itemsContent = cardElement.querySelector('.bill-items-content');
    
    // 显示加载状态
    itemsContent.innerHTML = `
      <div class="loading-items">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载明细中...</span>
      </div>
    `;
    
    try {
      // 获取账单详情（包含明细）
      const billDetails = await apiClient.finance.getBillById(billId);
      
      if (billDetails && billDetails.items && billDetails.items.length > 0) {
        const itemsHtml = billDetails.items.map(item => `
          <div class="bill-item-row">
            <div class="item-info">
              <div class="item-name">${item.item_name}</div>
              <div class="item-type">${item.item_type}</div>
            </div>
            <div class="item-quantity">×${item.quantity}</div>
            <div class="item-price">¥${parseFloat(item.unit_price).toFixed(2)}</div>
            <div class="item-subtotal">¥${parseFloat(item.subtotal).toFixed(2)}</div>
          </div>
        `).join('');
        
        itemsContent.innerHTML = `
          <div class="bill-items-table">
            <div class="bill-items-header-row">
              <div class="header-item-info">项目信息</div>
              <div class="header-quantity">数量</div>
              <div class="header-price">单价</div>
              <div class="header-subtotal">小计</div>
            </div>
            ${itemsHtml}
            <div class="bill-items-total">
              <div class="total-label">总计:</div>
              <div class="total-amount">¥${parseFloat(billDetails.total_amount).toFixed(2)}</div>
            </div>
          </div>
        `;
      } else {
        itemsContent.innerHTML = `
          <div class="empty-items">
            <i class="fas fa-inbox"></i>
            <span>暂无明细数据</span>
          </div>
        `;
      }
    } catch (error) {
      console.error('加载账单明细失败:', error);
      itemsContent.innerHTML = `
        <div class="error-items">
          <i class="fas fa-exclamation-triangle"></i>
          <span>加载明细失败，请重试</span>
        </div>
      `;
    }
  }

  // 显示支付对话框
  function showPaymentDialog(billId) {
    const bill = allBills.find(b => b.id == billId);
    if (!bill) return;
    
    // 这里可以打开支付模态框
    alert(`支付功能开发中\n账单: ${bill.invoice_number}\n金额: ¥${bill.total_amount}`);
  }

  // 更新统计数据
  function updateStats(bills) {
    let totalBills = bills.length;
    let totalAmount = 0;
    let paidBills = 0;
    let unpaidBills = 0;
    
    bills.forEach(bill => {
      const amount = parseFloat(bill.total_amount) || 0;
      totalAmount += amount;
      
      if (bill.status === 'paid') {
        paidBills++;
      } else if (bill.status === 'unpaid') {
        unpaidBills++;
      }
    });
    
    // 更新统计卡片
    // 第1个卡片：总账单数
    const totalBillsEl = container.querySelector('#total-bills');
    if (totalBillsEl) totalBillsEl.textContent = totalBills;
    
    // 第2个卡片：总金额
    const totalAmountEl = container.querySelector('#total-amount');
    if (totalAmountEl) totalAmountEl.textContent = `¥${totalAmount.toFixed(2)}`;
    
    // 第3个卡片：已支付账单数
    const paidBillsEl = container.querySelector('#paid-bills');
    if (paidBillsEl) paidBillsEl.textContent = paidBills;
    
    // 第4个卡片：待支付账单数
    const unpaidBillsEl = container.querySelector('#pending-bills');
    if (unpaidBillsEl) unpaidBillsEl.textContent = unpaidBills;
    
    console.log('统计数据已更新:', {
      totalBills,
      totalAmount: totalAmount.toFixed(2),
      paidBills,
      unpaidBills
    });
  }

  // 搜索和过滤功能
  function setupFilters() {
    const searchInput = container.querySelector('#bill-search');
    const statusFilterBtn = container.querySelector('#status-filter-btn');
    const statusFilterMenu = container.querySelector('#status-filter-menu');
    const dateFilterBtn = container.querySelector('#date-filter-btn');
    const dateFilterMenu = container.querySelector('#date-filter-menu');
    
    let currentStatusFilter = '';
    let currentDateFilter = '';
    
    function applyFilters() {
      let filtered = [...allBills];
      
      // 搜索过滤
      const searchTerm = searchInput.value.toLowerCase().trim();
      if (searchTerm) {
        filtered = filtered.filter(bill => 
          bill.invoice_number.toLowerCase().includes(searchTerm) ||
          bill.id.toString().includes(searchTerm) ||
          bill.patient_id.toString().includes(searchTerm)
        );
      }
      
      // 状态过滤
      if (currentStatusFilter) {
        filtered = filtered.filter(bill => bill.status === currentStatusFilter);
      }
      
      // 日期过滤
      if (currentDateFilter) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        filtered = filtered.filter(bill => {
          const billDate = new Date(bill.bill_date);
          switch (currentDateFilter) {
            case 'today':
              return billDate >= startOfToday;
            case 'week':
              return billDate >= startOfWeek;
            case 'month':
              return billDate >= startOfMonth;
            default:
              return true;
          }
        });
      }
      
      filteredBills = filtered;
      renderBills(filteredBills);
    }
    
    // 绑定搜索事件
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters, { signal });
    }
    
    // 绑定状态过滤器下拉菜单事件
    if (statusFilterBtn && statusFilterMenu) {
      statusFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        statusFilterMenu.classList.toggle('show');
        dateFilterMenu.classList.remove('show');
      }, { signal });
      
      statusFilterMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
          e.preventDefault();
          currentStatusFilter = e.target.dataset.value;
          statusFilterBtn.textContent = e.target.textContent;
          statusFilterMenu.classList.remove('show');
          applyFilters();
        }
      }, { signal });
    }
    
    // 绑定日期过滤器下拉菜单事件
    if (dateFilterBtn && dateFilterMenu) {
      dateFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dateFilterMenu.classList.toggle('show');
        statusFilterMenu.classList.remove('show');
      }, { signal });
      
      dateFilterMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
          e.preventDefault();
          currentDateFilter = e.target.dataset.value;
          dateFilterBtn.textContent = e.target.textContent;
          dateFilterMenu.classList.remove('show');
          applyFilters();
        }
      }, { signal });
    }
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
      if (statusFilterMenu) statusFilterMenu.classList.remove('show');
      if (dateFilterMenu) dateFilterMenu.classList.remove('show');
    }, { signal });
  }

  // 初始化分页组件
  function initPagination() {
    const paginationContainer = container.querySelector('#bills-pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(totalCount / pageSize);
    pagination = new Pagination({
      containerId: paginationContainer,
      currentPage: currentPage,
      totalPages: totalPages,
      onPageChange: (page) => {
        loadBills(page);
      }
    });
    pagination.render();
  }
  
  // 更新分页组件
  function updatePagination() {
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalCount / pageSize);
    pagination.currentPage = currentPage;
    pagination.totalPages = totalPages;
    pagination.render();
  }

  // 绑定刷新按钮事件
  const refreshBtn = container.querySelector('#refresh-bills-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadBills(1);
      loadStats();
    }, { signal });
  }




  

  

  

  

  

  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }


  // 加载统计数据
  async function loadStats() {
    try {
      console.log('开始加载统计数据...');
      // 获取所有账单数据用于统计（不分页）
      const response = await apiClient.finance.getBills({ skip: 0, limit: 10000 });
      if (response && response.items && Array.isArray(response.items)) {
        console.log('获取到统计数据:', response.items.length, '条账单');
        console.log('账单数据详情:', response.items);
        updateStats(response.items);
      } else {
        console.log('统计数据响应格式不正确:', response);
        // 如果获取失败，显示默认值
        updateStats([]);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 如果获取失败，显示默认值
      updateStats([]);
    }
  }

  // 收入统计功能
  async function loadIncomeStatistics(startDate, endDate) {
    try {
      const response = await apiClient.finance.getIncomeStatistics({
        start_date: startDate,
        end_date: endDate
      });
      
      console.log('收入统计响应数据:', response);
      
      // 更新统计卡片
      const totalIncomeEl = container.querySelector('#total-income-amount');
      const paidBillsCountEl = container.querySelector('#paid-bills-count');
      const averageBillAmountEl = container.querySelector('#average-bill-amount');
      const paymentMethodsSummaryEl = container.querySelector('#payment-methods-summary');
      
      if (totalIncomeEl) {
        const totalIncome = parseFloat(response.total_income) || 0;
        totalIncomeEl.textContent = `¥${totalIncome.toFixed(2)}`;
      }
      if (paidBillsCountEl) {
        paidBillsCountEl.textContent = response.paid_bills_count || 0;
      }
      if (averageBillAmountEl) {
        const avgAmount = parseFloat(response.average_bill_amount) || 0;
        averageBillAmountEl.textContent = `¥${avgAmount.toFixed(2)}`;
      }
      
      // 显示主要支付方式
      if (paymentMethodsSummaryEl && response.payment_method_breakdown && response.payment_method_breakdown.length > 0) {
        const topMethod = response.payment_method_breakdown[0];
        const methodAmount = parseFloat(topMethod.amount) || 0;
        paymentMethodsSummaryEl.textContent = `${topMethod.method}: ¥${methodAmount.toFixed(2)}`;
      } else if (paymentMethodsSummaryEl) {
        paymentMethodsSummaryEl.textContent = '暂无数据';
      }
      
      // 绘制图表（简化版，可以后续使用Chart.js等库）
      renderIncomeCharts(response);
      
      showMessage('收入统计数据加载成功', 'success');
      
    } catch (error) {
      console.error('加载收入统计失败:', error);
      showMessage('加载收入统计失败', 'error');
    }
  }
  
  function renderIncomeCharts(data) {
    // 这里可以使用Chart.js等图表库来绘制图表
    // 暂时显示简单的文本信息
    const monthlyChartEl = container.querySelector('#income-monthly-chart');
    const paymentMethodChartEl = container.querySelector('#payment-method-chart');
    
    if (monthlyChartEl && monthlyChartEl.getContext) {
      try {
        const ctx = monthlyChartEl.getContext('2d');
        ctx.clearRect(0, 0, monthlyChartEl.width, monthlyChartEl.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('月度收入趋势图', monthlyChartEl.width / 2, monthlyChartEl.height / 2);
        const monthCount = data.monthly_breakdown ? data.monthly_breakdown.length : 0;
        ctx.fillText(`共${monthCount}个月的数据`, monthlyChartEl.width / 2, monthlyChartEl.height / 2 + 25);
      } catch (e) {
        console.log('月度图表渲染跳过:', e.message);
      }
    }
    
    if (paymentMethodChartEl && paymentMethodChartEl.getContext) {
      try {
        const ctx = paymentMethodChartEl.getContext('2d');
        ctx.clearRect(0, 0, paymentMethodChartEl.width, paymentMethodChartEl.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('支付方式分布图', paymentMethodChartEl.width / 2, paymentMethodChartEl.height / 2);
        const methodCount = data.payment_method_breakdown ? data.payment_method_breakdown.length : 0;
        ctx.fillText(`共${methodCount}种支付方式`, paymentMethodChartEl.width / 2, paymentMethodChartEl.height / 2 + 25);
      } catch (e) {
        console.log('支付方式图表渲染跳过:', e.message);
      }
    }
  }
  
  // 支出管理功能
  let expenseCategories = [];
  let currentExpenses = [];
  
  async function loadExpenseCategories() {
    try {
      const response = await apiClient.finance.getExpenseCategories();
      expenseCategories = response || [];
      
      // 更新分类下拉菜单
      const categoryFilterEl = container.querySelector('#expense-category-filter');
      if (categoryFilterEl) {
        categoryFilterEl.innerHTML = '<option value="" data-i18n="all_categories">所有分类</option>';
        if (expenseCategories.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = '暂无分类，请先初始化分类';
          option.disabled = true;
          categoryFilterEl.appendChild(option);
        } else {
          expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilterEl.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('加载支出分类失败:', error);
      showMessage('加载支出分类失败', 'error');
    }
  }
  
  async function loadExpenses(startDate, endDate, categoryId = null) {
    try {
      const loadingEl = container.querySelector('#expenses-loading');
      const errorEl = container.querySelector('#expenses-error');
      
      if (loadingEl) loadingEl.style.display = 'block';
      if (errorEl) errorEl.style.display = 'none';
      
      const params = {
        start_date: startDate,
        end_date: endDate,
        skip: 0,
        limit: 100
      };
      
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const response = await apiClient.finance.getExpenses(params);
      currentExpenses = response.items;
      
      renderExpenses(currentExpenses);
      await loadExpenseStatistics(startDate, endDate);
      
    } catch (error) {
      console.error('加载支出数据失败:', error);
      const errorEl = container.querySelector('#expenses-error');
      if (errorEl) errorEl.style.display = 'block';
    } finally {
      const loadingEl = container.querySelector('#expenses-loading');
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }
  
  function renderExpenses(expenses) {
    const tbody = container.querySelector('#expenses-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(expense.expense_date).toLocaleDateString()}</td>
        <td>${expense.category?.name || '未分类'}</td>
        <td>${expense.description}</td>
        <td class="text-danger">¥${parseFloat(expense.amount).toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary edit-expense-btn" data-id="${expense.id}" data-i18n="edit">编辑</button>
          <button class="btn btn-sm btn-outline-danger delete-expense-btn" data-id="${expense.id}" data-i18n="delete">删除</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // 绑定编辑和删除事件
    tbody.querySelectorAll('.edit-expense-btn').forEach(btn => {
      btn.addEventListener('click', () => editExpense(btn.dataset.id), { signal });
    });
    
    tbody.querySelectorAll('.delete-expense-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteExpense(btn.dataset.id), { signal });
    });
  }
  
  async function loadExpenseStatistics(startDate, endDate) {
    try {
      const response = await apiClient.finance.getExpenseStatistics({
        start_date: startDate,
        end_date: endDate
      });
      
      // 更新统计卡片
      const totalExpensesEl = container.querySelector('#total-expenses-amount');
      const expenseCountEl = container.querySelector('#expense-count');
      const topCategoryEl = container.querySelector('#top-expense-category');
      
      if (totalExpensesEl) totalExpensesEl.textContent = `¥${parseFloat(response.total_expenses).toFixed(2)}`;
      if (expenseCountEl) expenseCountEl.textContent = response.expense_count;
      
      if (topCategoryEl && response.category_breakdown.length > 0) {
        const topCategory = response.category_breakdown[0];
        topCategoryEl.textContent = `${topCategory.category_name}: ¥${parseFloat(topCategory.amount).toFixed(2)}`;
      }
      
    } catch (error) {
      console.error('加载支出统计失败:', error);
    }
  }
  
  async function showAddExpenseModal() {
    // 确保分类数据已加载
    if (expenseCategories.length === 0) {
      await loadExpenseCategories();
    }
    
    const modalHtml = `
      <div class="modal fade" id="addExpenseModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-i18n="add_expense">添加支出</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="addExpenseForm">
                <div class="mb-3">
                  <label for="expenseDate" class="form-label" data-i18n="expense_date">支出日期</label>
                  <input type="date" class="form-control" id="expenseDate" required>
                </div>
                <div class="mb-3">
                  <label for="expenseCategory" class="form-label" data-i18n="category">分类</label>
                  <select class="form-select" id="expenseCategory" required>
                    <option value="" data-i18n="select_category">请选择分类</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="expenseDescription" class="form-label" data-i18n="description">描述</label>
                  <textarea class="form-control" id="expenseDescription" rows="3" required></textarea>
                </div>
                <div class="mb-3">
                  <label for="expenseAmount" class="form-label" data-i18n="amount">金额</label>
                  <input type="number" class="form-control" id="expenseAmount" step="0.01" min="0" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="cancel">取消</button>
              <button type="button" class="btn btn-primary" id="saveExpenseBtn" data-i18n="save">保存</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.querySelector('#addExpenseModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 添加新模态框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 填充分类选项
    const categorySelect = document.querySelector('#expenseCategory');
    if (expenseCategories.length === 0) {
      // 如果仍然没有分类数据，显示提示
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '暂无分类，请先初始化分类';
      option.disabled = true;
      categorySelect.appendChild(option);
    } else {
      expenseCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
    
    // 设置默认日期为今天
    const dateInput = document.querySelector('#expenseDate');
    dateInput.value = new Date().toISOString().split('T')[0];
    
    // 绑定保存事件
    const saveBtn = document.querySelector('#saveExpenseBtn');
    saveBtn.addEventListener('click', async () => {
      const form = document.querySelector('#addExpenseForm');
      if (form.checkValidity()) {
        const formData = new FormData(form);
        const expenseData = {
          title: document.querySelector('#expenseDescription').value || '支出记录',
          expense_date: document.querySelector('#expenseDate').value,
          category_id: parseInt(document.querySelector('#expenseCategory').value),
          description: document.querySelector('#expenseDescription').value,
          amount: parseFloat(document.querySelector('#expenseAmount').value)
        };
        
        try {
          await apiClient.finance.createExpense(expenseData);
          showMessage('支出添加成功', 'success');
          
          // 关闭模态框
          const modal = bootstrap.Modal.getInstance(document.querySelector('#addExpenseModal'));
          modal.hide();
          
          // 重新加载支出数据
          const startDate = container.querySelector('#expense-start-date').value;
          const endDate = container.querySelector('#expense-end-date').value;
          if (startDate && endDate) {
            await loadExpenses(startDate, endDate);
          }
        } catch (error) {
          console.error('添加支出失败:', error);
          showMessage('添加支出失败', 'error');
        }
      } else {
        form.reportValidity();
      }
    });
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.querySelector('#addExpenseModal'));
    modal.show();
    
    // 翻译模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
  }
  
  async function editExpense(expenseId) {
    // 实现编辑支出功能
    console.log('编辑支出:', expenseId);
  }
  
  // 显示确认模态框
  function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    modal.innerHTML = `
      <div class="modal-content" style="
        background-color: var(--color-bg-card);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        overflow: hidden;
      ">
        <div class="modal-header" style="
          padding: calc(var(--spacing-unit) * 2);
          background-color: #39c5bb;
          color: white;
          border-bottom: 1px solid var(--color-border);
        ">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">${title}</h3>
        </div>
        <div class="modal-body" style="padding: calc(var(--spacing-unit) * 2);">
          <p style="margin: 0; color: var(--color-text-primary);">${message}</p>
        </div>
        <div class="modal-footer" style="
          padding: calc(var(--spacing-unit) * 2);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: calc(var(--spacing-unit) * 1.5);
        ">
          <button class="btn btn-outline cancel-btn">取消</button>
          <button class="btn btn-danger confirm-btn">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    confirmBtn.addEventListener('click', () => {
      modal.remove();
      onConfirm();
    });
    
    // 点击背景关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // ESC键关闭模态框
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  async function deleteExpense(expenseId) {
    showConfirmModal(
      '确认删除',
      '确定要删除这条支出记录吗？此操作不可撤销。',
      async () => {
        try {
          await apiClient.finance.deleteExpense(expenseId);
          showMessage('支出删除成功', 'success');
          
          // 重新加载支出数据
          const startDate = container.querySelector('#expense-start-date').value;
          const endDate = container.querySelector('#expense-end-date').value;
          if (startDate && endDate) {
            await loadExpenses(startDate, endDate);
          }
        } catch (error) {
          console.error('删除支出失败:', error);
          showMessage('删除支出失败', 'error');
        }
      }
    );
  }
  
  async function initDefaultCategories() {
    try {
      const response = await apiClient.finance.initDefaultCategories();
      showMessage(response.message, 'success');
      await loadExpenseCategories();
    } catch (error) {
      console.error('初始化默认分类失败:', error);
      showMessage('初始化默认分类失败', 'error');
    }
  }
  
  function showMessage(message, type = 'info') {
    // 简单的消息提示实现
    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    const alertHtml = `
      <div class="alert ${alertClass} alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // 3秒后自动消失
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert) {
        alert.remove();
      }
    }, 3000);
  }
  
  // 绑定收入统计事件
  const loadIncomeStatsBtn = container.querySelector('#load-income-stats');
  if (loadIncomeStatsBtn) {
    loadIncomeStatsBtn.addEventListener('click', () => {
      const startDate = container.querySelector('#income-start-date').value;
      const endDate = container.querySelector('#income-end-date').value;
      
      if (startDate && endDate) {
        loadIncomeStatistics(startDate, endDate);
      } else {
        showMessage('请选择开始和结束日期', 'error');
      }
    }, { signal });
  }
  
  // 绑定支出管理事件
  const addExpenseBtn = container.querySelector('#add-expense-btn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', async () => {
      await showAddExpenseModal();
    }, { signal });
  }
  
  const initCategoriesBtn = container.querySelector('#init-categories-btn');
  if (initCategoriesBtn) {
    initCategoriesBtn.addEventListener('click', initDefaultCategories, { signal });
  }
  
  const filterExpensesBtn = container.querySelector('#filter-expenses-btn');
  if (filterExpensesBtn) {
    filterExpensesBtn.addEventListener('click', () => {
      const startDate = container.querySelector('#expense-start-date').value;
      const endDate = container.querySelector('#expense-end-date').value;
      const categoryId = container.querySelector('#expense-category-filter').value;
      
      if (startDate && endDate) {
        loadExpenses(startDate, endDate, categoryId || null);
      } else {
        showMessage('请选择开始和结束日期', 'error');
      }
    }, { signal });
  }
  
  // 设置默认日期（最近30天）
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const incomeStartDateEl = container.querySelector('#income-start-date');
  const incomeEndDateEl = container.querySelector('#income-end-date');
  const expenseStartDateEl = container.querySelector('#expense-start-date');
  const expenseEndDateEl = container.querySelector('#expense-end-date');
  
  if (incomeStartDateEl) incomeStartDateEl.value = thirtyDaysAgo.toISOString().split('T')[0];
  if (incomeEndDateEl) incomeEndDateEl.value = today.toISOString().split('T')[0];
  if (expenseStartDateEl) expenseStartDateEl.value = thirtyDaysAgo.toISOString().split('T')[0];
  if (expenseEndDateEl) expenseEndDateEl.value = today.toISOString().split('T')[0];
  
  // 初始加载数据
  loadBills();
  loadStats();
  loadExpenseCategories();

  // 绑定标签页切换事件
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabPanes = container.querySelectorAll('.tab-pane');
  
  // 检查初始激活的标签页，如果是支出标签则自动加载数据
  const activeTab = container.querySelector('.tab-btn.active');
  if (activeTab && activeTab.dataset.tab === 'expenses') {
    setTimeout(async () => {
      await loadExpenseCategories();
      
      // 设置默认日期范围（最近30天）
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const startDateEl = container.querySelector('#expense-start-date');
      const endDateEl = container.querySelector('#expense-end-date');
      
      if (startDateEl && endDateEl) {
        startDateEl.value = startDate.toISOString().split('T')[0];
        endDateEl.value = endDate.toISOString().split('T')[0];
        
        // 加载支出数据
        await loadExpenses(startDateEl.value, endDateEl.value);
      }
    }, 100);
  }
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const tabId = btn.dataset.tab;
      
      // 移除所有活动状态
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // 添加当前活动状态
      btn.classList.add('active');
      const targetPane = container.querySelector(`#${tabId}-tab`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
      
      // 如果切换到支出标签，自动加载支出数据
      if (tabId === 'expenses') {
        await loadExpenseCategories();
        
        // 设置默认日期范围（最近30天）
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        const startDateEl = container.querySelector('#expense-start-date');
        const endDateEl = container.querySelector('#expense-end-date');
        
        if (startDateEl && endDateEl) {
          startDateEl.value = startDate.toISOString().split('T')[0];
          endDateEl.value = endDate.toISOString().split('T')[0];
          
          // 加载支出数据
          await loadExpenses(startDateEl.value, endDateEl.value);
        }
      }
    }, { signal });
  });

  // 返回清理函数
  return () => {
    console.log('财务模块已卸载');
  };
}