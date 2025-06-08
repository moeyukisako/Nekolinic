/**
 * 财务管理模块
 */

export default function renderFinanceModule(container, options = {}) {
  const { signal } = options;
  
  // 创建财务管理界面
  container.innerHTML = `
    <div class="finance-module-wrapper">
      <div class="finance-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3 data-i18n="today_income">今日收入</h3>
            <p class="stat-value">¥0.00</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3 data-i18n="monthly_income">本月收入</h3>
            <p class="stat-value">¥0.00</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-receipt"></i>
          </div>
          <div class="stat-content">
            <h3 data-i18n="pending_bills">待收账单</h3>
            <p class="stat-value">0</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="stat-content">
            <h3 data-i18n="total_income">总收入</h3>
            <p class="stat-value">¥0.00</p>
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
              <h3 data-i18n="billing_list">账单列表</h3>
              <div class="billing-list">
                <p class="empty-state" data-i18n="no_billing_data">暂无账单数据</p>
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