/**
 * 财务管理模块 - 重新设计版本
 */

import Pagination from '../components/pagination.js';
import { MergedPaymentManager } from './mergedPaymentManager.js';
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
          <button class="tab-btn" data-tab="payment-collection" data-i18n="payment_collection">费用收取</button>
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
                        <a class="dropdown-item" data-value="PENDING" data-i18n="status_pending">待支付</a>
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
                    <button id="merged-payment-btn" class="btn btn-primary">
                      <i class="fas fa-layer-group"></i>
                      <span data-i18n="mergedPayment.title">合并支付</span>
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
                  <table id="bills-table" class="bills-table">
                    <thead class="bills-table-header">
                      <tr>
                        <th class="expand-column"></th>
                        <th data-i18n="finance.table.billId">账单号</th>
                        <th data-i18n="finance.table.invoice">发票号</th>
                        <th data-i18n="finance.table.patient">患者</th>
                        <th data-i18n="finance.table.status">状态</th>
                        <th data-i18n="finance.table.date">日期</th>
                        <th data-i18n="finance.table.amount">金额</th>
                        <th data-i18n="finance.table.actions">操作</th>
                      </tr>
                    </thead>
                    <tbody id="bills-tbody">
                      <!-- 账单行将在这里动态生成 -->
                    </tbody>
                  </table>
                </div>
                <div id="bills-pagination" class="pagination-container"></div>
              </div>
            </div>
          </div>
          
          <div id="payment-collection-tab" class="tab-pane">
            <div class="payment-collection-section">
              <div class="payment-collection-header">
                <h3 data-i18n="payment_collection">费用收取</h3>
                <div class="patient-search-box">
                  <i class="fas fa-search"></i>
                  <input type="text" id="patient-search" placeholder="搜索患者姓名或ID..." data-i18n-placeholder="search_patient">
                  <button id="search-patient-btn" class="btn btn-primary">
                    <i class="fas fa-search"></i>
                    <span data-i18n="search">搜索</span>
                  </button>
                </div>
              </div>
              
              <div id="patient-selection-area" class="patient-selection-area" style="display: none;">
                <div class="patient-list-container">
                  <h4 data-i18n="select_patient">选择患者</h4>
                  <div id="patient-search-results" class="patient-search-results">
                    <!-- 患者搜索结果将在这里显示 -->
                  </div>
                </div>
              </div>
              
              <div id="payment-cards-area" class="payment-cards-area" style="display: none;">
                <div class="selected-patient-info">
                  <h4 data-i18n="selected_patient">选中患者</h4>
                  <div id="selected-patient-card" class="selected-patient-card">
                    <!-- 选中的患者信息将在这里显示 -->
                  </div>
                </div>
                
                <div class="aggregated-payment-cards">
                  <h4 data-i18n="payment_summary">支付汇总</h4>
                  <div id="aggregated-payment-card" class="aggregated-payment-card">
                    <!-- 聚合支付卡片将在这里显示 -->
                  </div>
                </div>
                
                <div id="bill-details-area" class="bill-details-area" style="display: none;">
                  <h4 data-i18n="bill_details">账单明细</h4>
                  <div id="bill-details-list" class="bill-details-list">
                    <!-- 账单明细列表将在这里显示 -->
                  </div>
                  <div class="bill-details-actions">
                    <button id="generate-selected-payment-btn" class="btn btn-primary">
                      <i class="fas fa-qrcode"></i>
                      <span data-i18n="generate_payment">生成支付</span>
                    </button>
                    <button id="cancel-details-btn" class="btn btn-secondary">
                      <i class="fas fa-times"></i>
                      <span data-i18n="cancel">取消</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="payment-qr-area" class="payment-qr-area" style="display: none;">
                <div class="payment-qr-container">
                  <h4 data-i18n="scan_to_pay">扫码支付</h4>
                  <div id="payment-qr-code" class="payment-qr-code">
                    <!-- 支付二维码将在这里显示 -->
                  </div>
                  <div class="payment-info">
                    <div class="payment-amount" id="payment-amount-display">¥0.00</div>
                    <div class="payment-description" id="payment-description">等待支付...</div>
                  </div>
                  <div class="payment-actions">
                    <button id="refresh-payment-status-btn" class="btn btn-primary">
                      <i class="fas fa-sync-alt"></i>
                      <span data-i18n="refresh_status">刷新状态</span>
                    </button>
                    <button id="cancel-payment-btn" class="btn btn-secondary">
                      <i class="fas fa-times"></i>
                      <span data-i18n="cancel_payment">取消支付</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="payment-success-area" class="payment-success-area" style="display: none;">
                <div class="payment-success-container">
                  <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <h4 data-i18n="payment_success">支付成功</h4>
                  <div id="payment-success-details" class="payment-success-details">
                    <!-- 支付成功详情将在这里显示 -->
                  </div>
                  <button id="new-payment-btn" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    <span data-i18n="new_payment">新建支付</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div id="income-tab" class="tab-pane">
            <div class="income-section">
              <h3 data-i18n="income_statistics">收入统计</h3>
              <div class="income-chart">
                <p class="empty-state" data-i18n="income_chart_developing">收入统计图表开发中...</p>
              </div>
            </div>
          </div>
          
          <div id="expenses-tab" class="tab-pane">
            <div class="expenses-section">
              <h3 data-i18n="expense_management">支出管理</h3>
              <div class="expenses-list">
                <p class="empty-state" data-i18n="expense_feature_developing">支出管理功能开发中...</p>
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
      const response = await window.apiClient.finance.getBills({ skip, limit: pageSize });
      console.log('API响应:', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        console.log('获取到账单数据:', response.items.length, '条，总计:', response.total, '条');
        allBills = response.items;
        filteredBills = [...allBills];
        totalCount = response.total;
        renderBills(filteredBills);
        updateStats(allBills);
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
      <tr class="bill-row" data-bill-id="${bill.id}">
        <td class="expand-cell">
          <button class="expand-btn" data-action="toggle-details">
            <i class="fas fa-chevron-right"></i>
          </button>
        </td>
        <td class="bill-id-cell">#${bill.id}</td>
        <td class="invoice-cell">${bill.invoice_number || 'N/A'}</td>
        <td class="patient-cell" data-patient-id="${bill.patient_id}">${bill.patient_name || '加载中...'}</td>
        <td class="status-cell">
          <span class="bill-status-text ${statusClass}">
            <span data-i18n="finance.status.${bill.status}"></span>
          </span>
        </td>
        <td class="date-cell">${billDate}</td>
        <td class="amount-cell">¥${parseFloat(bill.total_amount).toFixed(2)}</td>
        <td class="actions-cell">
          <div class="bill-actions">
            <button class="btn-text btn-text-danger" data-action="delete" title="删除" data-i18n-title="finance.actions.delete">
                  <i class="fas fa-trash"></i>
                  <span data-i18n="finance.actions.delete">删除</span>
                </button>
            ${bill.status === 'PENDING' ? `
              <button class="btn-text btn-text-success" data-action="payment" title="支付" data-i18n-title="finance.actions.payment">
                  <i class="fas fa-credit-card"></i>
                  <span data-i18n="finance.actions.payment">支付</span>
                </button>
            ` : ''}
          </div>
        </td>
      </tr>
      <tr class="bill-details-row" data-bill-id="${bill.id}" style="display: none;">
        <td colspan="8" class="details-cell">
          <div class="bill-details-container">
            <div class="details-loading" style="display: none;">
              <i class="fas fa-spinner fa-spin"></i>
              <span data-i18n="finance.loading">加载中...</span>
            </div>
            <div class="details-content" style="display: none;">

              <div class="details-table-container">
                <table class="details-table">
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
                </table>
              </div>
              <div class="details-footer">
                <div class="details-total">
                  <span data-i18n="finance.details.total">总计:</span>
                  <span class="total-amount">¥${parseFloat(bill.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div class="details-error" style="display: none;">
              <i class="fas fa-exclamation-triangle"></i>
              <span data-i18n="finance.error">加载失败，请重试</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  // 获取账单状态文本
  function getBillStatusText(status) {
    const statusMap = {
      'unpaid': '待支付',
      'paid': '已支付',
      'partially_paid': '部分支付',
      'void': '已作废',
      'PENDING': '待支付',
      'PAID': '已支付',
      'CANCELLED': '已取消',
      'REFUNDED': '已退款'
    };
    return statusMap[status] || status;
  }

  // 获取状态样式类
  function getStatusClass(status) {
    const classMap = {
      'PENDING': 'pending',
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
      'PENDING': 'fa-clock',
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
        const patient = await window.apiClient.patients.getById(patientId);
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
      
      await window.apiClient.finance.deleteBill(billId);
      
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
    const billRows = container.querySelectorAll('.bill-row');
    
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
    const detailsRow = container.querySelector(`tr.bill-details-row[data-bill-id="${billId}"]`);
    const expandBtn = container.querySelector(`tr.bill-row[data-bill-id="${billId}"] .expand-btn i`);
    
    if (!detailsRow || !expandBtn) return;
    
    const isExpanded = detailsRow.style.display !== 'none';
    
    if (isExpanded) {
      // 收起明细
      detailsRow.style.display = 'none';
      expandBtn.className = 'fas fa-chevron-right';
    } else {
      // 展开明细
      detailsRow.style.display = 'table-row';
      expandBtn.className = 'fas fa-chevron-down';
      
      // 加载明细数据
      await loadBillDetails(billId);
    }
  }
  
  // 加载账单明细
  async function loadBillDetails(billId) {
    const detailsContainer = container.querySelector(`tr.bill-details-row[data-bill-id="${billId}"] .bill-details-container`);
    const loadingEl = detailsContainer.querySelector('.details-loading');
    const contentEl = detailsContainer.querySelector('.details-content');
    const errorEl = detailsContainer.querySelector('.details-error');
    
    // 显示加载状态
    if (loadingEl) loadingEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    try {
      console.log('开始加载账单明细，账单ID:', billId);
      const response = await window.apiClient.finance.getBillById(billId);
      console.log('账单明细API响应:', response);
      
      // 处理不同的响应格式
      const bill = response.data ? response.data : response;
      
      if (bill && contentEl) {
        const detailsTbody = contentEl.querySelector('.details-tbody');
        
        if (bill.items && bill.items.length > 0) {
          const itemsHtml = bill.items.map(item => `
            <tr class="detail-item-row">
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
                <td colspan="4" class="no-items-cell">
                  <i class="fas fa-inbox"></i>
                  <span data-i18n="finance.details.noItems">暂无明细项目</span>
                </td>
              </tr>
            `;
          }
        }
        
        // 显示内容
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        
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
      const billDetails = await window.apiClient.finance.getBillById(billId);
      
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
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let todayIncome = 0;
    let monthlyIncome = 0;
    let totalIncome = 0;
    let pendingCount = 0;
    
    bills.forEach(bill => {
      const billDate = new Date(bill.bill_date);
      const amount = parseFloat(bill.total_amount);
      
      if (bill.status === 'PAID') {
        totalIncome += amount;
        
        if (billDate.toDateString() === today.toDateString()) {
          todayIncome += amount;
        }
        
        if (billDate >= thisMonth) {
          monthlyIncome += amount;
        }
      }
      
      if (bill.status === 'PENDING') {
        pendingCount++;
      }
    });
    
    // 更新统计卡片
    const statCards = container.querySelectorAll('.stat-card');
    if (statCards[0]) statCards[0].querySelector('.stat-value').textContent = `¥${todayIncome.toFixed(2)}`;
    if (statCards[1]) statCards[1].querySelector('.stat-value').textContent = `¥${monthlyIncome.toFixed(2)}`;
    if (statCards[2]) statCards[2].querySelector('.stat-value').textContent = pendingCount;
    if (statCards[3]) statCards[3].querySelector('.stat-value').textContent = `¥${totalIncome.toFixed(2)}`;
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
    refreshBtn.addEventListener('click', () => loadBills(1), { signal });
  }

  // 绑定合并支付按钮事件
  const mergedPaymentBtn = container.querySelector('#merged-payment-btn');
  if (mergedPaymentBtn) {
    mergedPaymentBtn.addEventListener('click', () => {
      showMergedPayment();
    }, { signal });
  }

  // 显示合并支付功能
  async function showMergedPayment() {
    try {
      // 显示患者选择界面
      await showPatientSelectionForMergedPayment();
    } catch (error) {
      console.error('显示合并支付界面失败:', error);
      showNotification('加载合并支付界面失败，请重试', 'error');
    }
  }
  
  // 显示患者选择界面用于合并支付
  async function showPatientSelectionForMergedPayment() {
    const getTranslation = window.getTranslation || ((key, fallback) => fallback);
    
    // 创建患者选择模态框
    const modalHtml = `
      <div class="modal fade" id="patientSelectionModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-i18n="patient_selection.title">${getTranslation('patient_selection.title', '选择患者进行合并支付')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="patient-search-box mb-3">
                <input type="text" class="form-control" id="patient-search-input" data-i18n-placeholder="patient_selection.search_placeholder" placeholder="${getTranslation('patient_selection.search_placeholder', '搜索患者姓名或ID...')}">
              </div>
              <div class="patients-loading" style="display: none;">
                <div class="text-center">
                  <div class="spinner-border" role="status"></div>
                  <p class="mt-2" data-i18n="patient_selection.loading">${getTranslation('patient_selection.loading', '加载患者列表...')}</p>
                </div>
              </div>
              <div class="patients-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('patientSelectionModal'));
    
    // 加载患者列表
    await loadPatientsForSelection();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('patient-search-input');
    searchInput.addEventListener('input', debounce(handlePatientSearch, 300));
    
    // 显示模态框
    modal.show();
    
    // 模态框关闭时清理
    document.getElementById('patientSelectionModal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
  }
  
  // 加载患者列表用于选择
  async function loadPatientsForSelection() {
    const loadingElement = document.querySelector('.patients-loading');
    const patientsListElement = document.querySelector('.patients-list');
    
    loadingElement.style.display = 'block';
    
    try {
      const response = await apiClient.patients.getAll(1, 50, '');
      
      if (response.success && response.data) {
        renderPatientsList(patientsListElement, response.data);
      } else {
        const getTranslation = window.getTranslation || ((key, fallback) => fallback);
        patientsListElement.innerHTML = `<p class="text-center text-muted" data-i18n="patient_selection.no_patients">${getTranslation('patient_selection.no_patients', '暂无患者数据')}</p>`;
      }
    } catch (error) {
      console.error('加载患者列表失败:', error);
      const getTranslation = window.getTranslation || ((key, fallback) => fallback);
      patientsListElement.innerHTML = `<p class="text-center text-danger" data-i18n="patient_selection.load_failed">${getTranslation('patient_selection.load_failed', '加载患者列表失败，请重试')}</p>`;
    } finally {
      loadingElement.style.display = 'none';
    }
  }
  
  // 渲染患者列表
  function renderPatientsList(container, patients) {
    const getTranslation = window.getTranslation || ((key, fallback) => fallback);
    
    if (!patients || patients.length === 0) {
      container.innerHTML = `<p class="text-center text-muted" data-i18n="patient_selection.no_patients">${getTranslation('patient_selection.no_patients', '暂无患者数据')}</p>`;
      return;
    }
    
    container.innerHTML = patients.map(patient => `
      <div class="patient-item" data-patient-id="${patient.id}" style="cursor: pointer; padding: 10px; border: 1px solid #ddd; margin-bottom: 5px; border-radius: 5px;">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${patient.name}</strong>
            <small class="text-muted d-block"><span data-i18n="patient_selection.patient_id_label">${getTranslation('patient_selection.patient_id_label', 'ID')}</span>: ${patient.id}</small>
            ${patient.phone ? `<small class="text-muted d-block"><span data-i18n="patient_selection.phone_label">${getTranslation('patient_selection.phone_label', '电话')}</span>: ${patient.phone}</small>` : ''}
          </div>
          <button class="btn btn-primary btn-sm select-patient-btn" data-patient-id="${patient.id}" data-i18n="patient_selection.select_button">
            ${getTranslation('patient_selection.select_button', '选择')}
          </button>
        </div>
      </div>
    `).join('');
    
    // 绑定选择事件
    container.querySelectorAll('.select-patient-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const patientId = btn.dataset.patientId;
        await handlePatientSelected(patientId);
      });
    });
    
    // 绑定患者项点击事件
    container.querySelectorAll('.patient-item').forEach(item => {
      item.addEventListener('click', async () => {
        const patientId = item.dataset.patientId;
        await handlePatientSelected(patientId);
      });
    });
  }
  
  // 处理患者选择
  async function handlePatientSelected(patientId) {
    try {
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(document.getElementById('patientSelectionModal'));
      modal.hide();
      
      // 创建合并支付管理器并显示界面
      const mergedPaymentManager = new MergedPaymentManager();
      const mergedPaymentInterface = await mergedPaymentManager.renderMergedPaymentInterface(patientId);
      
      // 清空当前容器并显示合并支付界面
      container.innerHTML = '';
      container.appendChild(mergedPaymentInterface);
    } catch (error) {
      console.error('加载合并支付界面失败:', error);
      showNotification('加载合并支付界面失败，请重试', 'error');
    }
  }
  
  // 处理患者搜索
  async function handlePatientSearch(event) {
    const searchTerm = event.target.value.trim();
    
    try {
      let response;
      if (searchTerm) {
        // 搜索患者
        response = await apiClient.patients.search(searchTerm);
      } else {
        // 获取所有患者
        response = await apiClient.patients.getAll({ page: 1, per_page: 50 });
      }
      
      const patientsListElement = document.querySelector('.patients-list');
      if (response.success && response.data) {
        renderPatientsList(patientsListElement, response.data);
      } else {
        const getTranslation = window.getTranslation || ((key, fallback) => fallback);
        patientsListElement.innerHTML = `<p class="text-center text-muted" data-i18n="patient_selection.search_no_results">${getTranslation('patient_selection.search_no_results', '未找到匹配的患者')}</p>`;
      }
    } catch (error) {
      console.error('搜索患者失败:', error);
      const getTranslation = window.getTranslation || ((key, fallback) => fallback);
      const patientsListElement = document.querySelector('.patients-list');
      patientsListElement.innerHTML = `<p class="text-center text-danger" data-i18n="patient_selection.search_failed">${getTranslation('patient_selection.search_failed', '搜索失败，请重试')}</p>`;
    }
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

  // 初始加载账单数据
  loadBills();

  // 费用收取功能相关变量
  let selectedPatient = null;
  let currentPaymentSession = null;
  
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
  
  // 费用收取功能函数
  async function searchPatients(query) {
    console.log('开始搜索患者:', query); // 调试日志
    
    const resultsContainer = container.querySelector('#patient-search-results');
    const selectionArea = container.querySelector('#patient-selection-area');
    
    console.log('搜索结果容器:', resultsContainer); // 调试日志
    console.log('选择区域:', selectionArea); // 调试日志
    
    if (!query.trim()) {
      console.log('搜索查询为空，隐藏选择区域'); // 调试日志
      if (selectionArea) {
        selectionArea.style.display = 'none';
      }
      return;
    }
    
    try {
      console.log('显示搜索区域并开始搜索'); // 调试日志
      if (selectionArea) {
        selectionArea.style.display = 'block';
      }
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';
      }
      
      console.log('调用API搜索患者:', query); // 调试日志
      const response = await window.apiClient.patients.search(query);
      console.log('搜索响应:', response); // 调试日志
      
      if (response && response.items && response.items.length > 0) {
        console.log('找到患者:', response.items.length, '个'); // 调试日志
        renderPatientSearchResults(response.items);
      } else {
        console.log('未找到匹配的患者'); // 调试日志
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="no-results">未找到匹配的患者</div>';
        }
      }
    } catch (error) {
      console.error('搜索患者失败:', error);
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="error">搜索失败，请重试</div>';
      }
    }
  }
  
  function renderPatientSearchResults(patients) {
    const resultsContainer = container.querySelector('#patient-search-results');
    
    resultsContainer.innerHTML = patients.map(patient => `
      <div class="patient-result-item" data-patient-id="${patient.id}">
        <div class="patient-info">
          <div class="patient-name">${patient.name}</div>
          <div class="patient-details">
            <span class="patient-id">ID: ${patient.id}</span>
            ${patient.phone ? `<span class="patient-phone">电话: ${patient.phone}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-primary select-patient-btn" data-patient-id="${patient.id}">
          <i class="fas fa-check"></i> 选择
        </button>
      </div>
    `).join('');
    
    // 绑定选择患者事件
    resultsContainer.querySelectorAll('.select-patient-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const patientId = parseInt(btn.dataset.patientId);
        const patient = patients.find(p => p.id === patientId);
        await selectPatient(patient);
      }, { signal });
    });
  }
  
  async function selectPatient(patient) {
    selectedPatient = patient;
    
    // 隐藏患者选择区域
    container.querySelector('#patient-selection-area').style.display = 'none';
    
    // 显示支付卡片区域
    const paymentCardsArea = container.querySelector('#payment-cards-area');
    paymentCardsArea.style.display = 'block';
    
    // 渲染选中的患者信息
    renderSelectedPatientCard(patient);
    
    // 加载并渲染聚合支付卡片
    await loadAndRenderAggregatedPaymentCard(patient.id);
  }
  
  function renderSelectedPatientCard(patient) {
    const selectedPatientCard = container.querySelector('#selected-patient-card');
    
    selectedPatientCard.innerHTML = `
      <div class="patient-card">
        <div class="patient-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="patient-info">
          <div class="patient-name">${patient.name}</div>
          <div class="patient-details">
            <span class="patient-id">ID: ${patient.id}</span>
            ${patient.phone ? `<span class="patient-phone">电话: ${patient.phone}</span>` : ''}
            ${patient.birth_date ? `<span class="patient-birth">生日: ${patient.birth_date}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-secondary change-patient-btn">
          <i class="fas fa-exchange-alt"></i> 更换患者
        </button>
      </div>
    `;
    
    // 绑定更换患者事件
    selectedPatientCard.querySelector('.change-patient-btn').addEventListener('click', () => {
      resetPaymentCollection();
    }, { signal });
  }
  
  async function loadAndRenderAggregatedPaymentCard(patientId) {
    const aggregatedCard = container.querySelector('#aggregated-payment-card');
    
    try {
      aggregatedCard.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载账单信息...</div>';
      
      // 获取患者未支付账单
      const response = await window.apiClient.finance.getPatientUnpaidBills(patientId);
      console.log('患者账单响应:', response); // 调试日志
      
      // 适配不同的响应格式
      let bills = [];
      if (response) {
        if (response.items) {
          bills = response.items;
        } else if (Array.isArray(response)) {
          bills = response;
        } else if (response.data && Array.isArray(response.data)) {
          bills = response.data;
        }
      }
      
      // 过滤出未支付的账单
      const unpaidBills = bills.filter(bill => 
        bill.status === 'unpaid' || bill.status === 'PENDING' || bill.status === 'pending'
      );
      
      console.log('未支付账单:', unpaidBills); // 调试日志
      
      if (unpaidBills.length > 0) {
        const totalAmount = unpaidBills.reduce((sum, bill) => {
          const amount = parseFloat(bill.total_amount || bill.amount || 0);
          return sum + amount;
        }, 0);
        
        renderAggregatedPaymentCard(unpaidBills, totalAmount);
      } else {
        aggregatedCard.innerHTML = `
          <div class="no-bills-card">
            <div class="no-bills-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="no-bills-message">
              <h4>该患者暂无待支付账单</h4>
              <p>所有账单均已结清</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('加载患者账单失败:', error);
      aggregatedCard.innerHTML = '<div class="error">加载账单信息失败，请重试</div>';
    }
  }
  
  function renderAggregatedPaymentCard(bills, totalAmount) {
    const aggregatedCard = container.querySelector('#aggregated-payment-card');
    
    aggregatedCard.innerHTML = `
      <div class="payment-summary-card">
        <div class="payment-summary-header">
          <div class="patient-name">${selectedPatient.name}</div>
          <div class="payment-summary-stats">
            <div class="stat-item">
              <div class="stat-value">${bills.length}</div>
              <div class="stat-label">笔未结清账单</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">¥${totalAmount.toFixed(2)}</div>
              <div class="stat-label">应付总金额</div>
            </div>
          </div>
        </div>
        
        <div class="payment-summary-actions">
          <button class="btn btn-primary btn-lg scan-pay-btn" data-bills='${JSON.stringify(bills.map(b => b.id))}'>
            <i class="fas fa-qrcode"></i>
            <span>扫码支付</span>
          </button>
          <button class="btn btn-outline-secondary view-details-btn">
            <i class="fas fa-list"></i>
            <span>查看明细与部分支付</span>
          </button>
        </div>
      </div>
    `;
    
    // 绑定扫码支付事件
    aggregatedCard.querySelector('.scan-pay-btn').addEventListener('click', async (e) => {
      const billIds = JSON.parse(e.currentTarget.dataset.bills);
      await createPaymentSession(billIds, totalAmount);
    }, { signal });
    
    console.log('聚合支付卡片已渲染，账单数量:', bills.length, '总金额:', totalAmount); // 调试日志
    
    // 绑定查看明细事件
    aggregatedCard.querySelector('.view-details-btn').addEventListener('click', () => {
      showBillDetails(bills);
    }, { signal });
  }
  
  function showBillDetails(bills) {
    const billDetailsArea = container.querySelector('#bill-details-area');
    const billDetailsList = container.querySelector('#bill-details-list');
    
    billDetailsArea.style.display = 'block';
    
    billDetailsList.innerHTML = `
      <div class="bill-details-header">
        <div class="select-all-container">
          <label class="checkbox-container">
            <input type="checkbox" id="select-all-bills" checked>
            <span class="checkmark"></span>
            <span class="label-text">全选</span>
          </label>
        </div>
        <div class="selected-total">
          <span>已选金额: </span>
          <span id="selected-amount" class="amount">¥${bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || bill.amount || 0), 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="bill-items">
        ${bills.map(bill => `
          <div class="bill-detail-item">
            <label class="checkbox-container">
              <input type="checkbox" class="bill-checkbox" data-bill-id="${bill.id}" data-amount="${bill.total_amount || bill.amount || 0}" checked>
              <span class="checkmark"></span>
            </label>
            <div class="bill-info">
              <div class="bill-header">
                <span class="bill-number">账单号: ${bill.invoice_number || bill.id}</span>
                <span class="bill-amount">¥${parseFloat(bill.total_amount || bill.amount || 0).toFixed(2)}</span>
              </div>
              <div class="bill-details">
                <span class="bill-date">日期: ${new Date(bill.bill_date).toLocaleDateString()}</span>
                <span class="bill-type">类型: ${bill.bill_type}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // 绑定全选事件
    const selectAllCheckbox = billDetailsList.querySelector('#select-all-bills');
    const billCheckboxes = billDetailsList.querySelectorAll('.bill-checkbox');
    const selectedAmountEl = billDetailsList.querySelector('#selected-amount');
    
    selectAllCheckbox.addEventListener('change', (e) => {
      billCheckboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
      updateSelectedAmount();
    }, { signal });
    
    // 绑定单个账单选择事件
    billCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        updateSelectedAmount();
        
        // 更新全选状态
        const checkedCount = Array.from(billCheckboxes).filter(cb => cb.checked).length;
        selectAllCheckbox.checked = checkedCount === billCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < billCheckboxes.length;
      }, { signal });
    });
    
    function updateSelectedAmount() {
      const selectedTotal = Array.from(billCheckboxes)
        .filter(cb => cb.checked)
        .reduce((sum, cb) => sum + parseFloat(cb.dataset.amount), 0);
      selectedAmountEl.textContent = `¥${selectedTotal.toFixed(2)}`;
    }
    
    // 绑定生成支付按钮事件
    container.querySelector('#generate-selected-payment-btn').addEventListener('click', async () => {
      const selectedBillIds = Array.from(billCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.dataset.billId));
      
      if (selectedBillIds.length === 0) {
        alert('请至少选择一个账单');
        return;
      }
      
      const selectedTotal = Array.from(billCheckboxes)
        .filter(cb => cb.checked)
        .reduce((sum, cb) => sum + parseFloat(cb.dataset.amount), 0);
      
      await createPaymentSession(selectedBillIds, selectedTotal);
    }, { signal });
    
    // 绑定取消按钮事件
    container.querySelector('#cancel-details-btn').addEventListener('click', () => {
      billDetailsArea.style.display = 'none';
    }, { signal });
  }
  
  async function createPaymentSession(billIds, totalAmount) {
    try {
      // 隐藏其他区域，显示支付二维码区域
      container.querySelector('#payment-cards-area').style.display = 'none';
      container.querySelector('#payment-qr-area').style.display = 'block';
      
      // 更新支付金额显示
      container.querySelector('#payment-amount-display').textContent = `¥${totalAmount.toFixed(2)}`;
      container.querySelector('#payment-description').textContent = '正在生成支付二维码...';
      
      // 调用后端API创建合并支付会话
      const response = await window.apiClient.finance.createMergedPaymentSession({
        patient_id: selectedPatient.id,
        bill_ids: billIds,
        payment_method: 'alipay' // 默认支付宝
      });
      
      if (response && response.session_id) {
        currentPaymentSession = response;
        
        // 显示二维码
        const qrCodeContainer = container.querySelector('#payment-qr-code');
        qrCodeContainer.innerHTML = `
          <div class="qr-code-image">
            <img src="data:image/png;base64,${response.qr_code_image}" alt="支付二维码">
          </div>
        `;
        
        container.querySelector('#payment-description').textContent = `支付金额: ¥${totalAmount.toFixed(2)} | 会话ID: ${response.session_id}`;
        
        // 开始轮询支付状态
        startPaymentStatusPolling(response.session_id);
      } else {
        throw new Error('创建支付会话失败');
      }
    } catch (error) {
      console.error('创建支付会话失败:', error);
      alert('创建支付会话失败，请重试');
      
      // 返回到支付卡片区域
      container.querySelector('#payment-qr-area').style.display = 'none';
      container.querySelector('#payment-cards-area').style.display = 'block';
    }
  }
  
  function startPaymentStatusPolling(sessionId) {
    const pollInterval = setInterval(async () => {
      try {
        const response = await window.apiClient.finance.getMergedPaymentSessionStatus(sessionId);
        
        if (response && response.status === 'PAID') {
          clearInterval(pollInterval);
          showPaymentSuccess(response);
        } else if (response && response.status === 'EXPIRED') {
          clearInterval(pollInterval);
          alert('支付已过期，请重新发起支付');
          resetPaymentCollection();
        }
      } catch (error) {
        console.error('查询支付状态失败:', error);
      }
    }, 3000); // 每3秒查询一次
    
    // 存储轮询ID以便取消
    currentPaymentSession.pollInterval = pollInterval;
  }
  
  function showPaymentSuccess(paymentResult) {
    // 隐藏二维码区域，显示成功区域
    container.querySelector('#payment-qr-area').style.display = 'none';
    container.querySelector('#payment-success-area').style.display = 'block';
    
    // 显示支付成功详情
    const successDetails = container.querySelector('#payment-success-details');
    successDetails.innerHTML = `
      <div class="success-details">
        <div class="detail-item">
          <span class="label">支付金额:</span>
          <span class="value">¥${parseFloat(paymentResult.total_amount).toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="label">支付时间:</span>
          <span class="value">${new Date(paymentResult.paid_at).toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="label">交易号:</span>
          <span class="value">${paymentResult.provider_transaction_id}</span>
        </div>
        <div class="detail-item">
          <span class="label">患者:</span>
          <span class="value">${selectedPatient.name}</span>
        </div>
      </div>
    `;
    
    // 绑定新建支付按钮事件
    container.querySelector('#new-payment-btn').addEventListener('click', () => {
      resetPaymentCollection();
    }, { signal });
  }
  
  function resetPaymentCollection() {
    // 清理状态
    selectedPatient = null;
    currentPaymentSession = null;
    
    // 清理轮询
    if (currentPaymentSession && currentPaymentSession.pollInterval) {
      clearInterval(currentPaymentSession.pollInterval);
    }
    
    // 重置界面
    container.querySelector('#patient-search').value = '';
    container.querySelector('#patient-selection-area').style.display = 'none';
    container.querySelector('#payment-cards-area').style.display = 'none';
    container.querySelector('#bill-details-area').style.display = 'none';
    container.querySelector('#payment-qr-area').style.display = 'none';
    container.querySelector('#payment-success-area').style.display = 'none';
  }
  
  // 绑定费用收取相关事件
  function bindPaymentCollectionEvents() {
    console.log('绑定费用收取事件...'); // 调试日志
    
    // 患者搜索事件
    const patientSearchInput = container.querySelector('#patient-search');
    const searchPatientBtn = container.querySelector('#search-patient-btn');
    
    console.log('患者搜索输入框:', patientSearchInput); // 调试日志
    console.log('搜索按钮:', searchPatientBtn); // 调试日志
    
    if (patientSearchInput) {
      console.log('绑定患者搜索输入事件'); // 调试日志
      patientSearchInput.addEventListener('input', debounce((e) => {
        console.log('患者搜索输入:', e.target.value); // 调试日志
        searchPatients(e.target.value);
      }, 300), { signal });
      
      patientSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('回车搜索患者:', e.target.value); // 调试日志
          searchPatients(e.target.value);
        }
      }, { signal });
    } else {
      console.warn('未找到患者搜索输入框元素'); // 调试日志
    }
    
    if (searchPatientBtn) {
      console.log('绑定搜索按钮事件'); // 调试日志
      searchPatientBtn.addEventListener('click', () => {
        const searchValue = patientSearchInput ? patientSearchInput.value : '';
        console.log('点击搜索按钮:', searchValue); // 调试日志
        searchPatients(searchValue);
      }, { signal });
    } else {
      console.warn('未找到搜索按钮元素'); // 调试日志
    }
    
    // 支付相关按钮事件
    const refreshPaymentStatusBtn = container.querySelector('#refresh-payment-status-btn');
    const cancelPaymentBtn = container.querySelector('#cancel-payment-btn');
    
    if (refreshPaymentStatusBtn) {
      refreshPaymentStatusBtn.addEventListener('click', async () => {
        if (currentPaymentSession) {
          try {
            const response = await window.apiClient.finance.getMergedPaymentSessionStatus(currentPaymentSession.session_id);
            
            if (response && response.status === 'PAID') {
              showPaymentSuccess(response);
            } else {
              container.querySelector('#payment-description').textContent = `状态: ${response.status} | 会话ID: ${currentPaymentSession.session_id}`;
            }
          } catch (error) {
            console.error('刷新支付状态失败:', error);
            alert('刷新支付状态失败');
          }
        }
      }, { signal });
    }
    
    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener('click', () => {
        if (confirm('确定要取消当前支付吗？')) {
          resetPaymentCollection();
        }
      }, { signal });
    }
  }
  
  // 绑定标签页切换事件
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabPanes = container.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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
      
      // 如果切换到费用收取标签页，重置状态
      if (tabId === 'payment-collection') {
        resetPaymentCollection();
      }
    }, { signal });
  });
  
  // 初始化时就绑定费用收取相关事件
  bindPaymentCollectionEvents();
  
  // 返回清理函数
  return () => {
    console.log('财务模块已卸载');
  };
}