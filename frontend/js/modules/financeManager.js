/**
 * 财务管理模块 - 重新设计版本
 */

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
                  <div class="search-filter-group">
                    <div class="search-box">
                      <i class="fas fa-search"></i>
                      <input type="text" id="bill-search" placeholder="搜索账单号、患者..." data-i18n-placeholder="search_bills">
                    </div>
                    <select id="status-filter" class="filter-select">
                      <option value="" data-i18n="all_status">全部状态</option>
                      <option value="PENDING" data-i18n="status_pending">待支付</option>
                      <option value="PAID" data-i18n="status_paid">已支付</option>
                      <option value="CANCELLED" data-i18n="status_cancelled">已取消</option>
                      <option value="REFUNDED" data-i18n="status_refunded">已退款</option>
                    </select>
                    <select id="date-filter" class="filter-select">
                      <option value="" data-i18n="all_dates">全部日期</option>
                      <option value="today" data-i18n="today">今天</option>
                      <option value="week" data-i18n="this_week">本周</option>
                      <option value="month" data-i18n="this_month">本月</option>
                    </select>
                  </div>
                  <button id="refresh-bills-btn" class="btn btn-primary">
                    <i class="fas fa-sync-alt"></i>
                    <span data-i18n="refresh">刷新</span>
                  </button>
                </div>
              </div>
              
              <div class="billing-list-container">
                <div id="bills-loading" class="loading-state" style="display: none;">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span data-i18n="loading">加载中...</span>
                </div>
                <div id="bills-empty" class="bills-empty" style="display: none;">
                  <i class="fas fa-inbox"></i>
                  <p data-i18n="no_billing_data">暂无账单数据</p>
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

  // 加载账单数据
  async function loadBills() {
    const loadingEl = container.querySelector('#bills-loading');
    const emptyEl = container.querySelector('#bills-empty');
    const errorEl = container.querySelector('#bills-error');
    const tableEl = container.querySelector('#bills-table');
    
    try {
      console.log('开始加载账单数据...');
      if (loadingEl) loadingEl.style.display = 'block';
      if (emptyEl) emptyEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';
      if (tableEl) tableEl.style.display = 'none';
      
      const response = await window.apiClient.finance.getBills();
      console.log('API响应:', response);
      
      if (response && Array.isArray(response)) {
        console.log('获取到账单数据:', response.length, '条');
        allBills = response;
        filteredBills = [...allBills];
        renderBills(filteredBills);
        updateStats(allBills);
        setupFilters();
      } else {
        console.log('响应数据格式不正确或为空:', response);
        allBills = [];
        filteredBills = [];
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
    const emptyEl = container.querySelector('#bills-empty');
    const errorEl = container.querySelector('#bills-error');
    
    console.log('找到的DOM元素:', {
      billsTable: !!billsTable,
      billsTbody: !!billsTbody,
      loadingEl: !!loadingEl,
      emptyEl: !!emptyEl,
      errorEl: !!errorEl
    });
    
    // 隐藏所有状态元素
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    if (!bills || bills.length === 0) {
      console.log('账单数据为空，显示空状态');
      if (billsTable) billsTable.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
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
          <span class="bill-status ${statusClass}">
            <span data-i18n="finance.status.${bill.status}">${statusText}</span>
          </span>
        </td>
        <td class="date-cell">${billDate}</td>
        <td class="amount-cell">¥${parseFloat(bill.total_amount).toFixed(2)}</td>
        <td class="actions-cell">
          <div class="bill-actions">
            <button class="btn-action btn-danger" data-action="delete" title="删除" data-i18n-title="finance.actions.delete">
              <i class="fas fa-trash"></i>
            </button>
            ${bill.status === 'PENDING' ? `
              <button class="btn-action btn-success" data-action="payment" title="支付" data-i18n-title="finance.actions.payment">
                <i class="fas fa-credit-card"></i>
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
              <div class="details-header">
                <h4 data-i18n="finance.details.title">账单明细</h4>
                <div class="details-summary">
                  <span data-i18n="finance.details.recordId">病历ID:</span>
                  <span class="record-id">${bill.medical_record_id || 'N/A'}</span>
                </div>
              </div>
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
    
    const confirmed = confirm(`确定要删除账单 #${billId} 吗？\n发票号: ${bill.invoice_number || 'N/A'}\n此操作不可撤销。`);
    if (!confirmed) return;
    
    try {
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
        window.showNotification('成功', '账单已删除', 'success');
      }
    } catch (error) {
      console.error('删除账单失败:', error);
      if (window.showNotification) {
        window.showNotification('错误', '删除账单失败: ' + error.message, 'error');
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
      const actionBtns = row.querySelectorAll('.btn-action');
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
              <td class="item-description">${item.description || '未知项目'}</td>
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
    const statusFilter = container.querySelector('#status-filter');
    const dateFilter = container.querySelector('#date-filter');
    
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
      const statusValue = statusFilter.value;
      if (statusValue) {
        filtered = filtered.filter(bill => bill.status === statusValue);
      }
      
      // 日期过滤
      const dateValue = dateFilter.value;
      if (dateValue) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        filtered = filtered.filter(bill => {
          const billDate = new Date(bill.bill_date);
          switch (dateValue) {
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
    
    // 绑定过滤事件
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters, { signal });
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFilters, { signal });
    }
    if (dateFilter) {
      dateFilter.addEventListener('change', applyFilters, { signal });
    }
  }

  // 绑定刷新按钮事件
  const refreshBtn = container.querySelector('#refresh-bills-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadBills, { signal });
  }

  // 初始加载账单数据
  loadBills();

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
    }, { signal });
  });
  
  // 返回清理函数
  return () => {
    console.log('财务模块已卸载');
  };
}