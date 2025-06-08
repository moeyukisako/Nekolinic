/**
 * 报表管理模块
 */

export default function renderReportsModule(container, options = {}) {
  const { signal } = options;
  
  // 创建报表管理界面
  container.innerHTML = `
    <div class="reports-module-wrapper">
      <div class="reports-grid">
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-user-friends"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="patient_statistics_report">患者统计报表</h3>
            <p data-i18n="patient_statistics_desc">患者数量、年龄分布、就诊频次等统计</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-notes-medical"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="medical_record_statistics_report">病历统计报表</h3>
            <p data-i18n="medical_record_statistics_desc">病历数量、疾病分类、治疗效果等统计</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-pills"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="medicine_statistics_report">药品统计报表</h3>
            <p data-i18n="medicine_statistics_desc">药品库存、使用量、过期提醒等统计</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="finance_statistics_report">财务统计报表</h3>
            <p data-i18n="finance_statistics_desc">收入支出、利润分析、账单统计等</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="appointment_statistics_report">预约统计报表</h3>
            <p data-i18n="appointment_statistics_desc">预约数量、时间分布、取消率等统计</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="report-content">
            <h3 data-i18n="workload_statistics_report">工作量统计报表</h3>
            <p data-i18n="workload_statistics_desc">医生工作量、科室效率、时间分析等</p>
            <button class="btn btn-primary" data-i18n="generate_report">生成报表</button>
          </div>
        </div>
      </div>
      
      <div class="reports-history">
        <div class="section-header">
          <h3 data-i18n="report_history">报表历史</h3>
          <div class="section-actions">
            <button class="btn btn-outline" data-i18n="clear_history">清理历史</button>
          </div>
        </div>
        
        <div class="reports-table">
          <table class="table">
            <thead>
              <tr>
                <th data-i18n="report_name">报表名称</th>
                <th data-i18n="generation_time">生成时间</th>
                <th data-i18n="file_size">文件大小</th>
                <th data-i18n="status">状态</th>
                <th data-i18n="actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" class="empty-state" data-i18n="no_report_history">暂无报表历史</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
  
  // 绑定报表生成按钮事件
  const generateBtns = container.querySelectorAll('.report-card .btn-primary');
  generateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reportCard = e.target.closest('.report-card');
      const reportTitle = reportCard.querySelector('h3').textContent;
      
      // 显示生成中状态
      btn.textContent = '生成中...';
      btn.disabled = true;
      
      // 模拟报表生成过程
      setTimeout(() => {
        btn.textContent = '生成报表';
        btn.disabled = false;
        
        // 显示成功提示
        window.showNotification('成功', `${reportTitle}生成完成`, 'success');
      }, 2000);
    }, { signal });
  });
  
  // 返回清理函数
  return () => {
    console.log('报表模块已卸载');
  };
}

// 显示通知的辅助函数
function showNotification(title, message, type = 'info') {
  // 这里可以调用全局的通知系统
  if (window.showNotification) {
    window.showNotification(title, message, type);
  } else {
    alert(`${title}: ${message}`);
  }
}