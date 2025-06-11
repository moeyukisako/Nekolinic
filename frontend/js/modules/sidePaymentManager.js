// sidePaymentManager.js - 聚合支付管理模块
// 从 financeManager.js 重构的独立聚合支付功能

import apiClient from '../apiClient.js';
import { showNotification } from '../utils/ui.js';
import { i18n } from '../../utils/i18n.js';

// 聚合支付管理器
const sidePaymentManager = {
  // 模块状态
  state: {
    selectedPatient: null,
    unpaidBills: [],
    selectedBills: [],
    paymentSession: null,
    pollingInterval: null,
    isPolling: false,
    allPatients: [], // 存储所有患者数据
    isLoading: false
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
    // 初始化时加载所有患者
    this.loadAllPatients();
    return this.cleanup.bind(this);
  },

  // 渲染界面
  render() {
    this.container.innerHTML = `
      <div class="side-payment-manager">
        <div class="payment-collection-section">
          <div class="payment-collection-header">
            <h3 data-i18n="side_payment.payment_collection">费用收取</h3>
            <div class="patient-search-box">
              <input type="text" id="side-patient-search" placeholder="搜索患者姓名或ID..." data-i18n-placeholder="side_payment.search_patient">
              <button id="side-search-patient-btn" class="btn btn-primary">
                <span data-i18n="side_payment.search">搜索</span>
              </button>
            </div>
          </div>
          
          <div id="side-default-content" class="default-content" style="display: none;">
            <div class="welcome-message">
              <i class="fas fa-search-plus"></i>
              <h4 data-i18n="side_payment.start_billing">开始收费</h4>
              <p data-i18n="side_payment.search_patient_desc">请在上方搜索框中输入患者姓名或ID来查找患者，然后选择需要收费的账单。</p>
              <div class="quick-tips">
                <h5 data-i18n="side_payment.quick_tips">快速提示：</h5>
                <ul>
                  <li data-i18n="side_payment.tip_search_name">支持按患者姓名搜索</li>
                  <li data-i18n="side_payment.tip_search_id">支持按患者ID搜索</li>
                  <li data-i18n="side_payment.tip_batch_select">可以批量选择多个账单进行收费</li>
                  <li data-i18n="side_payment.tip_qr_payment">支持生成二维码收款</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div id="side-patient-selection-area" class="patient-selection-area">
            <div class="patient-list-container">
              <h4 data-i18n="side_payment.select_patient">选择患者</h4>
              <div id="side-patient-search-results" class="patient-search-results">
                <div class="loading-message">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span data-i18n="side_payment.loading_patients">正在加载患者列表...</span>
                </div>
              </div>
            </div>
          </div>
          
          <div id="side-payment-cards-area" class="payment-cards-area" style="display: none;">
            <div class="selected-patient-info">
              <div class="selected-patient-header">
                <button id="side-back-to-search-btn" class="btn btn-secondary back-btn">
                  <i class="fas fa-arrow-left"></i>
                  <span data-i18n="side_payment.back_to_search">返回搜索</span>
                </button>
                <h4 data-i18n="side_payment.selected_patient">选中患者</h4>
              </div>
              <div id="side-selected-patient-card" class="selected-patient-card">
                <!-- 选中的患者信息将在这里显示 -->
              </div>
            </div>
            
            <div class="aggregated-payment-cards">
              <h4 data-i18n="side_payment.payment_summary">支付汇总</h4>
              <div id="side-aggregated-payment-card" class="aggregated-payment-card">
                <!-- 聚合支付卡片将在这里显示 -->
              </div>
            </div>
            
            <div id="side-bill-details-area" class="bill-details-area" style="display: none;">
              <h4 data-i18n="side_payment.bill_details">账单明细</h4>
              <div id="side-bill-details-list" class="bill-details-list">
                <!-- 账单明细列表将在这里显示 -->
              </div>
              <div class="bill-details-actions">
                <div class="select-all-compact">
                  <input type="checkbox" id="side-select-all-bills" checked>
                  <label for="side-select-all-bills" data-i18n="side_payment.select_all">全选</label>
                </div>
                <div class="selected-summary">
                  <span data-i18n="side_payment.selected_amount">已选金额:</span>
                  <span id="side-selected-amount">¥0.00</span>
                </div>
                <div class="btn-group">
                  <button id="side-generate-selected-payment-btn" class="btn btn-primary">
                    <i class="fas fa-qrcode"></i>
                    <span data-i18n="side_payment.generate_payment">生成支付</span>
                  </button>
                  <button id="side-cancel-details-btn" class="btn btn-secondary">
                    <i class="fas fa-times"></i>
                    <span data-i18n="side_payment.cancel">取消</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div id="side-payment-qr-area" class="payment-qr-area" style="display: none;">
            <div class="payment-qr-container">
              <h4 data-i18n="side_payment.scan_to_pay">扫码支付</h4>
              <div id="side-payment-qr-code" class="payment-qr-code">
                <!-- 支付二维码将在这里显示 -->
              </div>
              <div class="payment-info">
                <div class="payment-amount" id="side-payment-amount-display">¥0.00</div>
                <div class="payment-description" id="side-payment-description" data-i18n="side_payment.waiting_payment">等待支付...</div>
              </div>
              <div class="payment-actions">
                <button id="side-refresh-payment-status-btn" class="btn btn-primary">
                  <i class="fas fa-sync-alt"></i>
                  <span data-i18n="side_payment.refresh_status">刷新状态</span>
                </button>
                <button id="side-cancel-payment-btn" class="btn btn-secondary">
                  <i class="fas fa-times"></i>
                  <span data-i18n="side_payment.cancel_payment">取消支付</span>
                </button>
              </div>
            </div>
          </div>
          
          <div id="side-payment-success-area" class="payment-success-area" style="display: none;">
            <div class="payment-success-container">
              <div class="success-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h4 data-i18n="side_payment.payment_success">支付成功</h4>
              <div id="side-payment-success-details" class="payment-success-details">
                <!-- 支付成功详情将在这里显示 -->
              </div>
              <button id="side-new-payment-btn" class="btn btn-primary">
                <i class="fas fa-plus"></i>
                <span data-i18n="side_payment.new_payment">新建支付</span>
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
    const backToSearchBtn = this.container.querySelector('#side-back-to-search-btn');

    // 患者搜索
    if (searchInput) {
      const debouncedSearch = this.debounce((value) => {
        this.searchPatients(value.trim());
      }, 300);

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const value = e.target.value.trim();
          this.searchPatients(value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const value = searchInput?.value.trim() || '';
        this.searchPatients(value);
      });
    }

    // 生成支付按钮
    if (generatePaymentBtn) {
      generatePaymentBtn.addEventListener('click', () => {
        const selectedBills = this.getSelectedBills();
        if (selectedBills.length === 0) {
          showNotification(i18n.t('side_payment.select_at_least_one_bill'), 'warning');
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

    // 返回搜索按钮
    if (backToSearchBtn) {
      backToSearchBtn.addEventListener('click', () => {
        this.backToSearch();
      });
    }
  },

  // 加载所有患者
  async loadAllPatients() {
    if (this.state.isLoading) return;
    
    try {
      this.state.isLoading = true;
      console.log('加载所有患者...');
      
      // 加载更多患者数据，设置较大的limit
      const response = await apiClient.patients.search('', 1, 100);
      console.log('所有患者数据:', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        this.state.allPatients = response.items;
        this.renderPatientSearchResults(response.items);
      } else {
        this.state.allPatients = [];
        this.renderPatientSearchResults([]);
      }
    } catch (error) {
      console.error('加载患者失败:', error);
      showNotification(i18n.t('side_payment.load_patients_failed'), 'error');
      this.renderPatientSearchResults([]);
    } finally {
      this.state.isLoading = false;
    }
  },

  // 搜索患者
  async searchPatients(query) {
    try {
      console.log('搜索患者:', query);
      
      // 如果有查询条件，先在本地过滤
      if (query && this.state.allPatients.length > 0) {
        const filteredPatients = this.state.allPatients.filter(patient => {
          const name = (patient.name || '').toLowerCase();
          const id = (patient.id || '').toString();
          const contact = (patient.contact_number || '').toLowerCase();
          const searchTerm = query.toLowerCase();
          
          return name.includes(searchTerm) || 
                 id.includes(searchTerm) || 
                 contact.includes(searchTerm);
        });
        
        this.renderPatientSearchResults(filteredPatients);
        return;
      }
      
      // 如果没有查询条件，显示所有患者
      if (!query) {
        this.renderPatientSearchResults(this.state.allPatients);
        return;
      }
      
      // 如果本地没有数据，使用API搜索
      const response = await apiClient.patients.search(query, 1, 10);
      console.log('患者搜索结果:', response);
      
      if (response && response.items && Array.isArray(response.items)) {
        this.renderPatientSearchResults(response.items);
      } else {
        this.renderPatientSearchResults([]);
      }
    } catch (error) {
        console.error('搜索患者失败:', error);
        showNotification(i18n.t('side_payment.search_patients_failed'), 'error');
        this.renderPatientSearchResults([]);
    }
  },

  // 渲染患者搜索结果
  renderPatientSearchResults(patients) {
    const resultsContainer = this.container.querySelector('#side-patient-search-results');
    const selectionArea = this.container.querySelector('#side-patient-selection-area');
    const defaultContent = this.container.querySelector('#side-default-content');
    
    if (!resultsContainer || !selectionArea) return;

    // 隐藏默认内容
    if (defaultContent) {
      defaultContent.style.display = 'none';
    }

    if (patients.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <p data-i18n="side_payment.no_patients_found">${i18n.t('side_payment.no_patients_found')}</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = patients.map(patient => `
        <div class="patient-result-item" data-patient-id="${patient.id}">
          <div class="patient-info">
            <div class="patient-name">${patient.name || i18n.t('side_payment.unknown')}</div>
            <div class="patient-details">
              <span class="patient-id">${i18n.t('side_payment.id_label')} ${patient.id}</span>
              <span class="patient-gender">${this.getGenderText(patient.gender)}</span>
              <span class="patient-phone">${patient.contact_number || i18n.t('side_payment.no_phone')}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary select-patient-btn" data-patient-id="${patient.id}">
            <span data-i18n="side_payment.select">${i18n.t('side_payment.select')}</span>
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
      
      // 隐藏默认内容和搜索结果
      const defaultContent = this.container.querySelector('#side-default-content');
      const selectionArea = this.container.querySelector('#side-patient-selection-area');
      if (defaultContent) {
        defaultContent.style.display = 'none';
      }
      if (selectionArea) {
        selectionArea.style.display = 'none';
      }
      
      // 隐藏搜索框
      const searchBox = this.container.querySelector('.patient-search-box');
      if (searchBox) {
        searchBox.style.display = 'none';
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
      <div class="selected-patient-info-card">
        <div class="patient-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="patient-info-content">
          <div class="patient-main-info">
            <h4 class="patient-name">${patient.name || '未知'}</h4>
            <div class="patient-meta">
              <span class="patient-id"><i class="fas fa-id-card"></i> ${patient.id}</span>
              <span class="patient-gender"><i class="fas ${patient.gender === 'male' ? 'fa-mars' : 'fa-venus'}"></i></span>
            </div>
          </div>
          <div class="patient-contact-info">
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>${patient.contact_number || '无电话'}</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${patient.address || '无地址'}</span>
            </div>
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
        showNotification(i18n.t('side_payment.load_bills_failed'), 'error');
      this.state.unpaidBills = [];
      this.renderAggregatedPaymentCard([]);
    }
  },

  // 渲染聚合支付卡片
  renderAggregatedPaymentCard(bills) {
    const container = this.container.querySelector('#side-aggregated-payment-card');
    if (!container) return;

    const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
    const billCount = bills.length;

    if (billCount === 0) {
      // 无数据时显示提示信息
      container.innerHTML = `
        <div class="aggregated-card">
          <div class="card-header">
            <h5 data-i18n="side_payment.aggregated_payment">${i18n.t('side_payment.aggregated_payment')}</h5>
          </div>
          <div class="card-content">
            <div class="no-data-message">
              <div class="no-data-icon">
                <i class="fas fa-receipt"></i>
              </div>
              <div class="no-data-text">
                <h6 data-i18n="side_payment.no_unpaid_bills">${i18n.t('side_payment.no_unpaid_bills')}</h6>
                <p data-i18n="side_payment.no_bills_for_patient">${i18n.t('side_payment.no_bills_for_patient')}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="aggregated-card">
        <div class="card-header">
          <div class="card-actions">
            <button class="btn btn-xs btn-outline view-details-btn">
              <i class="fas fa-list"></i>
              <span data-i18n="side_payment.view_details">${i18n.t('side_payment.view_details')}</span>
            </button>
            <button class="btn btn-xs btn-primary scan-pay-btn">
              <i class="fas fa-qrcode"></i>
              <span data-i18n="side_payment.scan_to_pay">${i18n.t('side_payment.scan_to_pay')}</span>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="bills-text-summary">
            ${bills.map(bill => `账单ID: ${bill.id || 'N/A'} | 发票号: ${bill.invoice_number || 'N/A'} | 金额: ¥${parseFloat(bill.total_amount || 0).toFixed(2)}`).join('<br>')}
            <div class="total-summary">
                <strong>共 ${billCount} 个账单，总金额: ¥${totalAmount.toFixed(2)}</strong>
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
        const area = this.container.querySelector('#side-bill-details-area');
        if (area && area.style.display === 'block') {
          this.hideBillDetails();
          viewDetailsBtn.innerHTML = '<i class="fas fa-list"></i> 查看明细';
        } else {
          this.showBillDetails(bills);
          viewDetailsBtn.innerHTML = '<i class="fas fa-times"></i> <span data-i18n="side_payment.hide_details">' + i18n.t('side_payment.hide_details') + '</span>';
        }
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
      <div class="bill-table">
        ${bills.map((bill, index) => `
          <div class="bill-row">
            <input type="checkbox" class="bill-checkbox" data-bill-id="${bill.id}" data-amount="${bill.total_amount || 0}" checked>
            <span class="bill-id">#${bill.invoice_number || bill.id}</span>
            <span class="bill-date">${this.formatDate(bill.bill_date || bill.created_at)}</span>
            <span class="bill-type">${bill.type || i18n.t('side_payment.medical_fee')}</span>
            <span class="bill-patient">${bill.patient_name || this.state.selectedPatient?.name || '患者'}</span>
            <span class="bill-amount">¥${parseFloat(bill.total_amount || 0).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    `;

    // 绑定全选事件
    const selectAllCheckbox = this.container.querySelector('#side-select-all-bills');
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
    
    if (!container || !amountDisplay) {
      return;
    }

    const selectedCheckboxes = container.querySelectorAll('.bill-checkbox:checked');
    
    const totalAmount = Array.from(selectedCheckboxes).reduce((sum, cb) => {
      const amount = parseFloat(cb.dataset.amount || 0);
      return sum + amount;
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

  // 生成支付
  generatePayment() {
    const selectedBills = this.getSelectedBills();
    if (selectedBills.length === 0) {
        alert(i18n.t('side_payment.select_bills_to_pay'));
        return;
      }

    const totalAmount = selectedBills.reduce((sum, bill) => {
      return sum + parseFloat(bill.total_amount || 0);
    }, 0);

    console.log('生成支付:', { selectedBills, totalAmount });
    this.createPaymentSession(selectedBills, totalAmount);
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
      
      // 隐藏搜索框
      const searchBox = this.container.querySelector('.patient-search-box');
      if (searchBox) {
        searchBox.style.display = 'none';
      }
      
      // 更新支付金额显示
      const amountDisplay = this.container.querySelector('#side-payment-amount-display');
      const descriptionDisplay = this.container.querySelector('#side-payment-description');
      
      if (amountDisplay) {
        amountDisplay.textContent = `¥${totalAmount.toFixed(2)}`;
      }
      if (descriptionDisplay) {
        descriptionDisplay.textContent = i18n.t('side_payment.generating_qr');
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
          descriptionDisplay.textContent = i18n.t('side_payment.scan_to_pay_amount', {amount: totalAmount.toFixed(2)});
        }
        
        // 开始轮询支付状态
        this.startPaymentStatusPolling();
      } else {
        throw new Error(i18n.t('side_payment.create_session_failed'));
      }
    } catch (error) {
      console.error('创建支付会话失败:', error);
      showNotification(i18n.t('side_payment.create_session_failed'), 'error');
      
      const descriptionDisplay = this.container.querySelector('#side-payment-description');
      if (descriptionDisplay) {
        descriptionDisplay.textContent = i18n.t('side_payment.session_failed_retry');
      }
    }
  },

  // 开始轮询支付状态
  startPaymentStatusPolling() {
    if (this.state.isPolling || !this.state.paymentSession) return;
    
    console.log(i18n.t('side_payment.start_polling'));
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
          descriptionDisplay.textContent = i18n.t('side_payment.payment_timeout');
        }
        showNotification(i18n.t('side_payment.payment_timeout'), 'warning');
      }
    }, 10 * 60 * 1000);
  },

  // 检查支付状态
  async checkPaymentStatus() {
    if (!this.state.paymentSession) return;
    
    try {
      const response = await apiClient.finance.getMergedPaymentSessionStatus(this.state.paymentSession.sessionId);
      console.log('支付状态检查响应:', response);
      
      if (response && response.status === 'paid') {
        this.stopPaymentStatusPolling();
        this.showPaymentSuccess(response);
      } else if (response && response.status === 'EXPIRED') {
        this.stopPaymentStatusPolling();
        const descriptionDisplay = this.container.querySelector('#side-payment-description');
        if (descriptionDisplay) {
          descriptionDisplay.textContent = i18n.t('side_payment.payment_expired');
        }
        showNotification(i18n.t('side_payment.payment_expired'), 'warning');
      }
    } catch (error) {
      console.error(i18n.t('side_payment.check_status_failed'), error);
    }
  },

  // 停止轮询支付状态
  stopPaymentStatusPolling() {
    if (this.state.pollingInterval) {
      clearInterval(this.state.pollingInterval);
      this.state.pollingInterval = null;
    }
    this.state.isPolling = false;
    console.log(i18n.t('side_payment.stop_polling'));
  },

  // 显示支付成功
  showPaymentSuccess(paymentResult) {
    console.log(i18n.t('side_payment.payment_success'), paymentResult);
    
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
            <span class="label" data-i18n="side_payment.payment_amount_label">${i18n.t('side_payment.payment_amount_label')}</span>
            <span class="value">¥${parseFloat(paymentResult.amount || 0).toFixed(2)}</span>
          </div>
          <div class="detail-item">
            <span class="label" data-i18n="side_payment.payment_time_label">${i18n.t('side_payment.payment_time_label')}</span>
            <span class="value">${this.formatDate(paymentResult.paidAt || new Date())}</span>
          </div>
          <div class="detail-item">
            <span class="label" data-i18n="side_payment.payment_method_label">${i18n.t('side_payment.payment_method_label')}</span>
            <span class="value">${paymentResult.paymentMethod || i18n.t('side_payment.scan_to_pay')}</span>
          </div>
          <div class="detail-item">
            <span class="label" data-i18n="side_payment.transaction_id_label">${i18n.t('side_payment.transaction_id_label')}</span>
            <span class="value">${paymentResult.transactionId || i18n.t('side_payment.none')}</span>
          </div>
        </div>
      `;
    }
    
    showNotification(i18n.t('side_payment.payment_success_notification'), 'success');
    
    // 绑定新建支付按钮事件
    const newPaymentBtn = this.container.querySelector('#side-new-payment-btn');
    if (newPaymentBtn) {
      newPaymentBtn.onclick = () => {
        this.resetPaymentCollection();
      };
    }
  },

  // 返回搜索
  backToSearch() {
    console.log('返回搜索患者');
    
    // 停止轮询
    this.stopPaymentStatusPolling();
    
    // 清理支付相关状态
    this.state.unpaidBills = [];
    this.state.selectedBills = [];
    this.state.paymentSession = null;
    
    // 隐藏支付相关区域
    const areas = [
      '#side-payment-cards-area', 
      '#side-payment-qr-area',
      '#side-payment-success-area'
    ];
    
    areas.forEach(selector => {
      const area = this.container.querySelector(selector);
      if (area) area.style.display = 'none';
    });
    
    // 显示搜索框
    const searchBox = this.container.querySelector('.patient-search-box');
    if (searchBox) {
      searchBox.style.display = 'flex';
    }
    
    // 重新显示患者选择区域
    const selectionArea = this.container.querySelector('#side-patient-selection-area');
    if (selectionArea) {
      selectionArea.style.display = 'block';
    }
    
    // 重新显示所有患者
    this.renderPatientSearchResults(this.state.allPatients);
  },

  // 重置支付收取
  resetPaymentCollection() {
    console.log(i18n.t('side_payment.reset_payment_status'));
    
    // 停止轮询
    this.stopPaymentStatusPolling();
    
    // 清理状态
    this.state.selectedPatient = null;
    this.state.unpaidBills = [];
    this.state.selectedBills = [];
    this.state.paymentSession = null;
    
    // 隐藏支付相关区域
    const areas = [
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
    
    // 显示搜索框
    const searchBox = this.container.querySelector('.patient-search-box');
    if (searchBox) {
      searchBox.style.display = 'flex';
    }
    
    // 隐藏默认内容
    const defaultContent = this.container.querySelector('#side-default-content');
    if (defaultContent) {
      defaultContent.style.display = 'none';
    }
    
    // 重新显示患者选择区域和所有患者
    const selectionArea = this.container.querySelector('#side-patient-selection-area');
    if (selectionArea) {
      selectionArea.style.display = 'block';
    }
    
    // 重新显示所有患者
    this.renderPatientSearchResults(this.state.allPatients);
    
    console.log(i18n.t('side_payment.payment_status_reset'));
  },

  // 工具函数
  getGenderText(gender) {
    const genderMap = {
      'male': i18n.t('side_payment.male'),
      'female': i18n.t('side_payment.female'),
      'other': i18n.t('side_payment.other')
    };
    return genderMap[gender] || i18n.t('side_payment.unknown');
  },

  formatDate(dateString) {
    if (!dateString) return i18n.t('side_payment.none');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return i18n.t('side_payment.invalid_date');
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
    console.log(i18n.t('side_payment.cleanup_manager'));
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
function renderSidePaymentModule(container, options = {}) {
  console.log(i18n.t('side_payment.init_module'));
  
  // 初始化模块并返回清理函数
  const cleanup = sidePaymentManager.init(container);
  
  return cleanup;
}

// 同时导出管理器对象和渲染函数，以支持不同的使用方式
export default sidePaymentManager;
export { renderSidePaymentModule };