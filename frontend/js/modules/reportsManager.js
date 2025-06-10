/**
 * 报表管理模块
 */

export default function renderReportsModule(container, options = {}) {
  const { signal } = options;
  
  // 创建报表管理界面
  container.innerHTML = `
    <div class="reports-module-wrapper">
      <div id="reports-module-content">
        <div class="reports-grid">
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-user-friends"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="patient_statistics_report">患者统计报表</h3>
              <p data-i18n="patient_statistics_desc">患者数量、年龄分布、就诊频次等统计</p>
              <button class="btn btn-primary" data-report-type="patient" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-notes-medical"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="medical_record_statistics_report">病历统计报表</h3>
              <p data-i18n="medical_record_statistics_desc">病历数量、疾病分类、治疗效果等统计</p>
              <button class="btn btn-primary" data-report-type="medical_record" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-pills"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="medicine_statistics_report">药品统计报表</h3>
              <p data-i18n="medicine_statistics_desc">药品库存、使用量、过期提醒等统计</p>
              <button class="btn btn-primary" data-report-type="medicine" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="finance_statistics_report">财务统计报表</h3>
              <p data-i18n="finance_statistics_desc">收入支出、利润分析、账单统计等</p>
              <button class="btn btn-primary" data-report-type="finance" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="appointment_statistics_report">预约统计报表</h3>
              <p data-i18n="appointment_statistics_desc">预约数量、时间分布、取消率等统计</p>
              <button class="btn btn-primary" data-report-type="appointment" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="report-content">
              <h3 data-i18n="workload_statistics_report">工作量统计报表</h3>
              <p data-i18n="workload_statistics_desc">医生工作量、科室效率、时间分析等</p>
              <button class="btn btn-primary" data-report-type="workload" data-i18n="generate_report">生成报表</button>
            </div>
          </div>
        </div>
        
        <div class="reports-history">
          <div class="section-header">
            <h3 data-i18n="report_history">报表历史</h3>
            <div class="section-actions">
              <button class="btn btn-outline" id="refresh-history-btn" data-i18n="refresh_history">刷新历史</button>
              <button class="btn btn-outline" id="clear-history-btn" data-i18n="clear_history">清理历史</button>
            </div>
          </div>
          
          <div class="reports-table-container">
            <table class="data-table reports-history-table">
              <thead>
                <tr>
                  <th data-i18n="report_name">报表名称</th>
                  <th data-i18n="report_type">报表类型</th>
                  <th data-i18n="generation_time">生成时间</th>
                  <th data-i18n="file_size">文件大小</th>
                  <th data-i18n="status">状态</th>
                  <th data-i18n="actions">操作</th>
                </tr>
              </thead>
              <tbody id="reports-history-tbody">
                <tr>
                  <td colspan="6" class="empty-state" data-i18n="no_report_history">暂无报表历史</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
  
  // 报表历史数据存储
  let reportsHistory = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
  
  // 渲染报表历史
  function renderReportsHistory() {
    const tbody = container.querySelector('#reports-history-tbody');
    
    if (reportsHistory.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state" data-i18n="no_report_history">暂无报表历史</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = reportsHistory.map(report => `
        <tr>
          <td>${report.name}</td>
          <td><span class="report-type-badge" data-i18n="${report.type}_report">${getReportTypeText(report.type)}</span></td>
          <td>${formatDateTime(report.generationTime)}</td>
          <td>${formatFileSize(report.fileSize)}</td>
          <td><span class="status-badge status-${report.status}" data-i18n="report_status_${report.status}"></span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="downloadReport('${report.id}')" data-i18n="download">下载</button>
            <button class="btn btn-sm btn-outline btn-danger" onclick="deleteReport('${report.id}')" data-i18n="delete">删除</button>
          </td>
        </tr>
      `).join('');
    }
    
    // 重新翻译
    if (window.translatePage) {
      window.translatePage();
    }
  }
  
  // 获取报表类型文本
  function getReportTypeText(type) {
    const typeMap = {
      'patient': '患者统计',
      'medical_record': '病历统计',
      'medicine': '药品统计',
      'finance': '财务统计',
      'appointment': '预约统计',
      'workload': '工作量统计'
    };
    return typeMap[type] || type;
  }
  
  // 获取状态文本
  function getStatusText(status) {
    const statusMap = {
      'completed': '已完成',
      'generating': '生成中',
      'failed': '失败'
    };
    return statusMap[status] || status;
  }
  
  // 格式化日期时间
  function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN');
  }
  
  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // 生成报表
  function generateReport(type, title) {
    const reportId = 'report_' + Date.now();
    const report = {
      id: reportId,
      name: title,
      type: type,
      generationTime: Date.now(),
      fileSize: Math.floor(Math.random() * 1000000) + 50000, // 模拟文件大小
      status: 'generating'
    };
    
    // 添加到历史记录
    reportsHistory.unshift(report);
    localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
    renderReportsHistory();
    
    // 模拟生成过程
    setTimeout(() => {
      const reportIndex = reportsHistory.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reportsHistory[reportIndex].status = 'completed';
        localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
        renderReportsHistory();
        window.showNotification(`${title}生成完成`, 'success');
      }
    }, 3000);
    
    return reportId;
  }
  
  // 绑定报表生成按钮事件
  const generateBtns = container.querySelectorAll('.report-card .btn-primary');
  generateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reportCard = e.target.closest('.report-card');
      const reportTitle = reportCard.querySelector('h3').textContent;
      const reportType = btn.getAttribute('data-report-type');
      
      // 显示生成中状态
      const originalText = btn.textContent;
      btn.textContent = '生成中...';
      btn.disabled = true;
      
      // 生成报表
      generateReport(reportType, reportTitle);
      
      // 恢复按钮状态
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1000);
    }, { signal });
  });
  
  // 刷新历史按钮事件
  const refreshBtn = container.querySelector('#refresh-history-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderReportsHistory();
      const message = window.getTranslation ? window.getTranslation('report_history_refreshed', '报表历史已刷新') : '报表历史已刷新';
        window.showNotification(message, 'info');
    }, { signal });
  }
  
  // 清理历史按钮事件
  const clearBtn = container.querySelector('#clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清理所有报表历史吗？此操作不可撤销。')) {
        reportsHistory = [];
        localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
        renderReportsHistory();
        const successMessage = window.getTranslation ? window.getTranslation('report_history_cleared', '报表历史已清理') : '报表历史已清理';
        window.showNotification(successMessage, 'success');
      }
    }, { signal });
  }
  
  // 全局函数：下载报表
  window.downloadReport = function(reportId) {
    const report = reportsHistory.find(r => r.id === reportId);
    if (report && report.status === 'completed') {
      // 模拟下载
      window.showNotification(`正在下载 ${report.name}`, 'info');
      // 这里可以添加实际的下载逻辑
    } else {
      const warningMessage = window.getTranslation ? window.getTranslation('report_not_ready', '报表尚未生成完成') : '报表尚未生成完成';
        window.showNotification(warningMessage, 'warning');
    }
  };
  
  // 全局函数：删除报表
  window.deleteReport = function(reportId) {
    if (confirm('确定要删除这个报表吗？')) {
      reportsHistory = reportsHistory.filter(r => r.id !== reportId);
      localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
      renderReportsHistory();
      const successMessage = window.getTranslation ? window.getTranslation('report_deleted', '报表已删除') : '报表已删除';
        window.showNotification(successMessage, 'success');
    }
  };
  
  // 初始渲染报表历史
  renderReportsHistory();
  
  // 返回清理函数
  return () => {
    // 清理全局函数
    delete window.downloadReport;
    delete window.deleteReport;
    console.log('报表模块已卸载');
  };
}

// 使用全局的showNotification函数
// 注意：全局showNotification只接受两个参数：(message, type)
// 如果需要显示标题，可以将标题包含在消息中