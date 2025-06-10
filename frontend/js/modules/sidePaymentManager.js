// sidePaymentManager.js - 聚合支付管理模块
// 从 financeManager.js 重构的独立聚合支付功能

import { apiClient } from '../apiClient.js';
import { showNotification } from '../utils/ui.js';

// 聚合支付管理器
const sidePaymentManager = {
  // 模块状态
  state: {
    selectedPatient: null,
    unpaidBills: [],
    selectedBills: [],
    paymentSession: null,
    pollingInterval: null,
    isPolling: false
  },

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 初始化模块
  init(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    return this.cleanup.bind(this);
  },

  // 渲染界面
  render() {
    this.container.innerHTML = `
      <div class="side-payment-manager">
        <div class="payment-collection-section">
          <div class="payment-collection-header">
            <h3 data-i18n="payment_collection">费用收取</h3>
            <div class="patient-search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="side-patient-search" placeholder="搜索患者姓名或ID..." data-i18n-placeholder="search_patient">
              <button id="side-search-patient-btn" class="btn btn-primary">
                <i class="fas fa-search"></i>
                <span data-i18n="search">搜索</span>
              </button>
            </div>
          </div>
          
          <div id="side-patient-selection-area" class="patient-selection-area" style="display: none;">
            <div class="patient-list-container">
              <h4 data-i18n="select_patient">选择患者</h4>
              <div id="side-patient-search-results" class="patient-search-results">
                <!-- 患者搜索结果将在这里显示 -->
              </div>
            </div>
          </div>
          
          <div id="side-payment-cards-area" class="payment-cards-area" style="display: none;">
            <div class="selected-patient-info">
              <h4 data-i18n="selected_patient">选中患者</h4>
              <div id="side-selected-patient-card" class="selected-patient-card">
                <!-- 选中的患者信息将在这里显示 -->
              </div>
            </div>
            
            <div class="aggregated-payment-cards">
              <h4 data-i18n="payment_summary">支付汇总</h4>
              <div id="side-aggregated-payment-card" class="aggregated-payment-card">
                <!-- 聚合支付卡片将在这里显示 -->
              </div>
            </div>
            
            <div id="side-bill-details-area" class="bill-details-area" style="display: none;">
              <h4 data-i18n="bill_details">账单明细</h4>
              <div id="side-bill-details-list" class="bill-details-list">
                <!-- 账单明细列表将在这里显示 -->
              </div>
              <div class="bill-details-actions">
                <button id="side-generate-selected-payment-btn" class="btn btn-primary">
                  <i class="fas fa-qrcode"></i>
                  <span data-i18n="generate_payment">生成支付</span>
                </button>
                <button id="side-cancel-details-btn" class="btn btn-secondary">
                  <i class="fas fa-times"></i>
                  <span data-i18n="cancel">取消</span>
                </button>
              </div>
            </div>
          </div>
          
          <div id="side-payment-qr-area" class="payment-qr-area" style="display: none;">
            <div class="payment-qr-container">
              <h4 data-i18n="scan_to_pay">扫码支付</h4>
              <div id="side-payment-qr-code" class="payment-qr-code">
                <!-- 支付二维码将在这里显示 -->
              </div>
              <div class="payment-info">
                <div class="payment-amount" id="side-payment-amount-display">¥0.00</div>
                <div class="payment-description" id="side-payment-description">等待支付...</div>
              </div>
              <div class="payment-actions">
                <button id="side-refresh-payment-status-btn" class="btn btn-primary">
                  <i class="fas fa-sync-alt"></i>
                  <span data-i18n="refresh_status">刷新状态</span>
                </button>
                <button id="side-cancel-payment-btn" class="btn btn-secondary">
                  <i class="fas fa-times"></i>
                  <span data-i18n="cancel_payment">取消支付</span>
                </button>
              </div>
            </div>
          </div>
          
          <div id="side-payment-success-area" class="payment-success-area" style="display: none;">
            <div class="payment-success-container">
              <div class="success-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h4 data-i18n="payment_success">支付成功</h4>
              <div id="side-payment-success-details" class="payment-success-details">
                <!-- 支付成功详情将在这里显示 -->
              </div>
              <button id="side-new-payment-btn" class="btn btn-primary">
                <i class="fas fa-plus"></i>
                <span data-i18n="new_payment">新建支付</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 翻译页面内容
    if (window.translatePage) {
      window.translatePage();
    }
  },

  // 绑定事件
  bindEvents() {
    const searchInput = this.container.querySelector('#side-patient-search');
    const searchBtn = this.container.querySelector('#side-search-patient-btn');
    const generatePaymentBtn = this.container.querySelector('#side-generate-selected-payment-btn');
    const cancelDetailsBtn = this.container.querySelector('#side-cancel-details-btn');
    const refreshStatusBtn = this.container.querySelector('#side-refresh-payment-status-btn');
    const cancelPaymentBtn = this.container.querySelector('#side-cancel-payment-btn');
    const newPaymentBtn = this.container.querySelector('#side-new-payment-btn');

    // 患者搜索
    if (searchInput) {
      const debouncedSearch = this.debounce((value) => {
        if (value.trim()) {
          this.searchPatients(value.trim());
        }
      }, 300);

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const value = e.target.value.trim();
          if (value) {
            this.searchPatients(value);
          }
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const value = searchInput?.value.trim();
        if (value) {
          this.searchPatients(value);
        }
      });
    }

    // 生成支付按钮
    if (generatePaymentBtn) {
      generatePaymentBtn.addEventListener('click', () => {
        const selectedBills = this.getSelectedBills();
        if (selectedBills.length === 0) {
          showNotification('请至少选择一个账单', 'warning');
          return;
        }
        
        const totalAmount = selectedBills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
        this.createPaymentSession(selectedBills, totalAmount);
      });
    }

    // 取消明细按钮
    if (cancelDetailsBtn) {
      cancelDetailsBtn.addEventListener('click', () => {
        this.hideBillDetails();
      });
    }

    // 刷新支付状态按钮
    if (refreshStatusBtn) {
      refreshStatusBtn.addEventListener('click', () => {
        if (this.state.paymentSession) {
          this.checkPaymentStatus();
        }
      });
    }

    // 取消支付按钮
    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener('click', () => {
        this.resetPaymentCollection();
      });
    }

    // 新建支付按钮
    if (newPaymentBtn) {
      newPaymentBtn.addEventListener('click', () => {
        this.resetPaymentCollection();
      });
    }
  },

  // 搜索患者
  async searchPatients(query) {
    try {
      console.log('搜索患者:', query);
      const response = await apiClient.patients.search({ query, limit: 10 });
      console.log('患者搜索结果:', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        this.renderPatientSearchResults(response.items);
      } else {
        this.renderPatientSearchResults([]);
      }
    } catch (error) {
      console.error('搜索患者失败:', error);
      showNotification('搜索患者失败', 'error');
      this.renderPatientSearchResults([]);
    }
  },

  // 渲染患者搜索结果
  renderPatientSearchResults(patients) {
    const resultsContainer = this.container.querySelector('#side-patient-search-results');
    const selectionArea = this.container.querySelector('#side-patient-selection-area');
    
    if (!resultsContainer || !selectionArea) return;

    if (patients.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">未找到匹配的患者</div>';
    } else {
      resultsContainer.innerHTML = patients.map(patient => `
        <div class="patient-result-item" data-patient-id="${patient.id}">
          <div class="patient-info">
            <div class="patient-name">${patient.name || '未知'}</div>
            <div class="patient-details">
              <span class="patient-id">ID: ${patient.id}</span>
              <span class="patient-gender">${this.getGenderText(patient.gender)}</span>
              <span class="patient-phone">${patient.contact || '无电话'}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary select-patient-btn" data-patient-id="${patient.id}">
            选择
          </button>
        </div>
      `).join('');

      // 绑定选择患者事件
      resultsContainer.querySelectorAll('.select-patient-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const patientId = e.target.dataset.patientId;
          const patient = patients.find(p => p.id == patientId);
          if (patient) {
            this.selectPatient(patient);
          }
        });
      });
    }

    selectionArea.style.display = 'block';
  },

  // 选择患者
  async selectPatient(patient) {
    try {
      console.log('选择患者:', patient);
      this.state.selectedPatient = patient;
      
      // 隐藏搜索结果
      const selectionArea = this.container.querySelector('#side-patient-selection-area');
      if (selectionArea) {
        selectionArea.style.display = 'none';
      }
      
      // 显示选中患者信息
      this.renderSelectedPatientInfo(patient);
      
      // 加载患者的未支付账单
      await this.loadPatientUnpaidBills(patient.id);
      
      // 显示支付卡片区域
      const cardsArea = this.container.querySelector('#side-payment-cards-area');
      if (cardsArea) {
        cardsArea.style.display = 'block';
      }
    } catch (error) {
      console.error('选择患者失败:', error);
      showNotification('选择患者失败', 'error');
    }
  },

  // 渲染选中患者信息
  renderSelectedPatientInfo(patient) {
    const container = this.container.querySelector('#side-selected-patient-card');
    if (!container) return;

    container.innerHTML = `
      <div class="patient-card">
        <div class="patient-header">
          <div class="patient-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="patient-basic-info">
            <h5 class="patient-name">${patient.name || '未知'}</h5>
            <div class="patient-meta">
              <span class="patient-id">ID: ${patient.id}</span>
              <span class="patient-gender">${this.getGenderText(patient.gender)}</span>
            </div>
          </div>
        </div>
        <div class="patient-details">
          <div class="detail-item">
            <span class="label">电话:</span>
            <span class="value">${patient.contact || '无'}</span>
          </div>
          <div class="detail-item">
            <span class="label">地址:</span>
            <span class="value">${patient.address || '无'}</span>
          </div>
        </div>
      </div>
    `;
  },

  // 加载患者未支付账单
  async loadPatientUnpaidBills(patientId) {
    try {
      console.log('加载患者未支付账单:', patientId);
      const response = await apiClient.finance.getPatientUnpaidBills(patientId);
      console.log('未支付账单响应:', response);
      
      let bills = [];
      if (response) {
        if (Array.isArray(response)) {
          bills = response;
        } else if (response.items && Array.isArray(response.items)) {
          bills = response.items;
        } else if (response.bills && Array.isArray(response.bills)) {
          bills = response.bills;
        }
      }
      
      console.log('处理后的账单数据:', bills);
      this.state.unpaidBills = bills;
      this.renderAggregatedPaymentCard(bills);
    } catch (error) {
      console.error('加载患者未支付账单失败:', error);
      showNotification('加载账单失败', 'error');
      this.state.unpaidBills = [];
      this.renderAggregatedPaymentCard([]);
    }
  },

  // 渲染聚合支付卡片
  renderAggregatedPaymentCard(bills) {
    const container = this.container.querySelector('#side-aggregated-payment-card');
    if (!container) return;

    const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
    const billCount = bills.length;

    container.innerHTML = `
      <div class="aggregated-card">
        <div class="card-header">
          <h5>聚合支付</h5>
          <div class="card-actions">
            <button class="btn btn-sm btn-outline view-details-btn" ${billCount === 0 ? 'disabled' : ''}>
              <i class="fas fa-list"></i>
              查看明细
            </button>
            <button class="btn btn-sm btn-primary scan-pay-btn" ${billCount === 0 ? 'disabled' : ''}>
              <i class="fas fa-qrcode"></i>
              扫码支付
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="payment-summary">
            <div class="summary-item">
              <span class="label">未结清账单:</span>
              <span class="value">${billCount} 个</span>
            </div>
            <div class="summary-item total">
              <span class="label">应付总金额:</span>
              <span class="value amount">¥${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    const viewDetailsBtn = container.querySelector('.view-details-btn');
    const scanPayBtn = container.querySelector('.scan-pay-btn');

    if (viewDetailsBtn && billCount > 0) {
      viewDetailsBtn.addEventListener('click', () => {
        this.showBillDetails(bills);
      });
    }

    if (scanPayBtn && billCount > 0) {
      scanPayBtn.addEventListener('click', () => {
        this.createPaymentSession(bills, totalAmount);
      });
    }
  },

  // 显示账单明细
  showBillDetails(bills) {
    const container = this.container.querySelector('#side-bill-details-list');
    const area = this.container.querySelector('#side-bill-details-area');
    
    if (!container || !area) return;

    container.innerHTML = `
      <div class="bill-details-header">
        <div class="select-all-container">
          <label class="checkbox-label">
            <input type="checkbox" id="side-select-all-bills" checked>
            <span class="checkmark"></span>
            全选
          </label>
        </div>
        <div class="selected-amount">
          已选金额: <span id="side-selected-amount">¥0.00</span>
        </div>
      </div>
      <div class="bill-list">
        ${bills.map(bill => `
          <div class="bill-item">
            <label class="checkbox-label">
              <input type="checkbox" class="bill-checkbox" data-bill-id="${bill.id}" data-amount="${bill.amount || 0}" checked>
              <span class="checkmark"></span>
            </label>
            <div class="bill-info">
              <div class="bill-header">
                <span class="bill-id">#${bill.id}</span>
                <span class="bill-amount">¥${parseFloat(bill.amount || 0).toFixed(2)}</span>
              </div>
              <div class="bill-details">
                <span class="bill-date">${this.formatDate(bill.created_at)}</span>
                <span class="bill-type">${bill.type || '医疗费用'}</span>
              </div>
              ${bill.description ? `<div class="bill-description">${bill.description}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // 绑定全选事件
    const selectAllCheckbox = container.querySelector('#side-select-all-bills');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = container.querySelectorAll('.bill-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked;
        });
        this.updateSelectedAmount();
      });
    }

    // 绑定单个账单选择事件
    container.querySelectorAll('.bill-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedAmount();
      });
    });

    // 初始化选中金额
    this.updateSelectedAmount();
    
    area.style.display = 'block';
  },

  // 更新选中金额
  updateSelectedAmount() {
    const container = this.container.querySelector('#side-bill-details-list');
    const amountDisplay = this.container.querySelector('#side-selected-amount');
    
    if (!container || !amountDisplay) return;

    const selectedCheckboxes = container.querySelectorAll('.bill-checkbox:checked');
    const totalAmount = Array.from(selectedCheckboxes).reduce((sum, cb) => {
      return sum + parseFloat(cb.dataset.amount || 0);
    }, 0);

    amountDisplay.textContent = `¥${totalAmount.toFixed(2)}`;
  },

  // 获取选中的账单
  getSelectedBills() {
    const container = this.container.querySelector('#side-bill-details-list');
    if (!container) return [];

    const selectedCheckboxes = container.querySelectorAll('.bill-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => {
      const billId = cb.dataset.billId;
      return this.state.unpaidBills.find(bill => bill.id == billId);
    }).filter(Boolean);
  },

  // 隐藏账单明细
  hideBillDetails() {
    const area = this.container.querySelector('#side-bill-details-area');
    if (area) {
      area.style.display = 'none';
    }
  },

  // 创建支付会话
  async createPaymentSession(bills, totalAmount) {
    try {
      console.log('创建支付会话:', { bills, totalAmount });
      
      // 显示二维码区域
      const qrArea = this.container.querySelector('#side-payment-qr-area');
      const cardsArea = this.container.querySelector('#side-payment-cards-area');
      
      if (qrArea) qrArea.style.display = 'block';
      if (cardsArea) cardsArea.style.display = 'none';
      
      // 更新支付金额显示
      const amountDisplay = this.container.querySelector('#side-payment-amount-display');
      const descriptionDisplay = this.container.querySelector('#side-payment-description');
      
      if (amountDisplay) {
        amountDisplay.textContent = `¥${totalAmount.toFixed(2)}`;
      }
      if (descriptionDisplay) {
        descriptionDisplay.textContent = '正在生成支付二维码...';
      }
      
      // 调用后端API创建合并支付会话
      const billIds = bills.map(bill => bill.id);
      const response = await apiClient.finance.createMergedPaymentSession({
        billIds,
        totalAmount,
        patientId: this.state.selectedPatient.id
      });
      
      console.log('支付会话创建响应:', response);
      
      if (response && response.qrCode) {
        this.state.paymentSession = response;
        
        // 显示二维码
        const qrContainer = this.container.querySelector('#side-payment-qr-code');
        if (qrContainer) {
          qrContainer.innerHTML = `<img src="${response.qrCode}" alt="支付二维码" class="qr-image">`;
        }
        
        // 更新描述
        if (descriptionDisplay) {
          descriptionDisplay.textContent = `请使用支付宝或微信扫码支付 ¥${totalAmount.toFixed(2)}`;
        }
        
        // 开始轮询支付状态
        this.startPaymentStatusPolling();
      } else {
        throw new Error('创建支付会话失败');
      }
    } catch (error) {
      console.error('创建支付会话失败:', error);
      showNotification('创建支付会话失败', 'error');
      
      const descriptionDisplay = this.container.querySelector('#side-payment-description');
      if (descriptionDisplay) {
        descriptionDisplay.textContent = '支付会话创建失败，请重试';
      }
    }
  },

  // 开始轮询支付状态
  startPaymentStatusPolling() {
    if (this.state.isPolling || !this.state.paymentSession) return;
    
    console.log('开始轮询支付状态');
    this.state.isPolling = true;
    
    this.state.pollingInterval = setInterval(() => {
      this.checkPaymentStatus();
    }, 3000); // 每3秒检查一次
    
    // 设置超时时间（10分钟）
    setTimeout(() => {
      if (this.state.isPolling) {
        this.stopPaymentStatusPolling();
        const descriptionDisplay = this.container.querySelector('#side-payment-description');
        if (descriptionDisplay) {
          descriptionDisplay.textContent = '支付超时，请重新生成支付码';
        }
        showNotification('支付超时，请重新生成支付码', 'warning');
      }
    }, 10 * 60 * 1000);
  },

  // 检查支付状态
  async checkPaymentStatus() {
    if (!this.state.paymentSession) return;
    
    try {
      const response = await apiClient.finance.getPaymentStatus(this.state.paymentSession.sessionId);
      console.log('支付状态检查响应:', response);
      
      if (response && response.status === 'PAID') {
        this.stopPaymentStatusPolling();
        this.showPaymentSuccess(response);
      } else if (response && response.status === 'EXPIRED') {
        this.stopPaymentStatusPolling();
        const descriptionDisplay = this.container.querySelector('#side-payment-description');
        if (descriptionDisplay) {
          descriptionDisplay.textContent = '支付已过期，请重新生成支付码';
        }
        showNotification('支付已过期', 'warning');
      }
    } catch (error) {
      console.error('检查支付状态失败:', error);
    }
  },

  // 停止轮询支付状态
  stopPaymentStatusPolling() {
    if (this.state.pollingInterval) {
      clearInterval(this.state.pollingInterval);
      this.state.pollingInterval = null;
    }
    this.state.isPolling = false;
    console.log('停止轮询支付状态');
  },

  // 显示支付成功
  showPaymentSuccess(paymentResult) {
    console.log('支付成功:', paymentResult);
    
    const successArea = this.container.querySelector('#side-payment-success-area');
    const qrArea = this.container.querySelector('#side-payment-qr-area');
    
    if (successArea) successArea.style.display = 'block';
    if (qrArea) qrArea.style.display = 'none';
    
    // 显示支付成功详情
    const detailsContainer = this.container.querySelector('#side-payment-success-details');
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="success-details">
          <div class="detail-item">
            <span class="label">支付金额:</span>
            <span class="value">¥${parseFloat(paymentResult.amount || 0).toFixed(2)}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付时间:</span>
            <span class="value">${this.formatDate(paymentResult.paidAt || new Date())}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付方式:</span>
            <span class="value">${paymentResult.paymentMethod || '扫码支付'}</span>
          </div>
          <div class="detail-item">
            <span class="label">交易号:</span>
            <span class="value">${paymentResult.transactionId || '无'}</span>
          </div>
        </div>
      `;
    }
    
    showNotification('支付成功！', 'success');
    
    // 绑定新建支付按钮事件
    const newPaymentBtn = this.container.querySelector('#side-new-payment-btn');
    if (newPaymentBtn) {
      newPaymentBtn.onclick = () => {
        this.resetPaymentCollection();
      };
    }
  },

  // 重置支付收取
  resetPaymentCollection() {
    console.log('重置支付收取状态');
    
    // 停止轮询
    this.stopPaymentStatusPolling();
    
    // 清理状态
    this.state.selectedPatient = null;
    this.state.unpaidBills = [];
    this.state.selectedBills = [];
    this.state.paymentSession = null;
    
    // 隐藏所有区域
    const areas = [
      '#side-patient-selection-area',
      '#side-payment-cards-area', 
      '#side-payment-qr-area',
      '#side-payment-success-area'
    ];
    
    areas.forEach(selector => {
      const area = this.container.querySelector(selector);
      if (area) area.style.display = 'none';
    });
    
    // 清空搜索框
    const searchInput = this.container.querySelector('#side-patient-search');
    if (searchInput) {
      searchInput.value = '';
    }
    
    console.log('支付收取状态已重置');
  },

  // 工具函数
  getGenderText(gender) {
    const genderMap = {
      'male': '男',
      'female': '女',
      'other': '其他'
    };
    return genderMap[gender] || '未知';
  },

  formatDate(dateString) {
    if (!dateString) return '无';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '无效日期';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 清理函数
  cleanup() {
    console.log('清理聚合支付管理器');
    this.stopPaymentStatusPolling();
    
    // 清理状态
    this.state = {
      selectedPatient: null,
      unpaidBills: [],
      selectedBills: [],
      paymentSession: null,
      pollingInterval: null,
      isPolling: false
    };
    
    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
};

// 导出模块渲染函数（兼容主应用的模块加载系统）
export default function renderSidePaymentModule(container, options = {}) {
  console.log('初始化聚合支付模块');
  
  // 初始化模块并返回清理函数
  const cleanup = sidePaymentManager.init(container);
  
  return cleanup;
}