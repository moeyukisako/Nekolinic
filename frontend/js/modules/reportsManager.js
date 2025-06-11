/**
 * 报表管理模块
 */

import { showNotification } from '../utils/ui.js';
import { i18n } from '../../utils/i18n.js';

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
    console.log('报表模块：renderReportsHistory被调用，历史记录数量:', reportsHistory.length);
    const tbody = container.querySelector('#reports-history-tbody');
    console.log('报表模块：tbody元素:', tbody);
    
    if (reportsHistory.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state" data-i18n="no_report_history">暂无报表历史</td>
        </tr>
      `;
    } else {
      const htmlContent = reportsHistory.map(report => `
        <tr>
          <td>${report.name}</td>
          <td><span class="report-type-badge" data-i18n="${report.type}_report">${getReportTypeText(report.type)}</span></td>
          <td>${formatDateTime(report.generationTime)}</td>
          <td>${formatFileSize(report.fileSize)}</td>
          <td><span class="status-badge status-${report.status}" data-i18n="report_status_${report.status}"></span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="previewReport('${report.id}')" data-i18n="preview">预览</button>
            <button class="btn btn-sm btn-outline" onclick="downloadReport('${report.id}')" data-i18n="download">下载</button>
            <button class="btn btn-sm btn-outline btn-danger" onclick="deleteReport('${report.id}')" data-i18n="delete">删除</button>
          </td>
        </tr>
      `).join('');
      console.log('报表模块：生成的HTML内容:', htmlContent);
      tbody.innerHTML = htmlContent;
    }
    
    // 重新翻译
    if (window.translatePage) {
      window.translatePage();
    }
    
    // 验证全局函数是否存在
    console.log('报表模块：全局函数检查');
    console.log('window.deleteReport:', typeof window.deleteReport);
    console.log('window.previewReport:', typeof window.previewReport);
    console.log('window.downloadReport:', typeof window.downloadReport);
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
  
  // 生成报表（带日期范围）
  async function generateReportWithDateRange(type, title, startDate, endDate) {
    const reportId = 'report_' + Date.now();
    const report = {
      id: reportId,
      name: title,
      title: title,  // 添加title字段以保持兼容性
      type: type,
      generationTime: Date.now(),
      fileSize: 0,
      status: 'generating',
      dateRange: { startDate, endDate }
    };
    
    // 添加到历史记录
    reportsHistory.unshift(report);
    localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
    renderReportsHistory();
    
    try {
      let statisticsData;
      
      // 根据报表类型调用相应的API
      switch (type) {
        case 'patient':
          statisticsData = await apiClient.reports.getPatientStatistics(startDate, endDate);
          break;
        case 'medical_record':
          statisticsData = await apiClient.reports.getMedicalRecordStatistics(startDate, endDate);
          break;
        case 'medicine':
          statisticsData = await apiClient.reports.getMedicineStatistics(startDate, endDate);
          break;
        case 'finance':
          statisticsData = await apiClient.reports.getFinanceStatistics(startDate, endDate);
          break;
        default:
          throw new Error('不支持的报表类型');
      }
      
      // 显示统计数据
      showStatisticsModal(title, statisticsData, type);
      
      // 更新报表状态
      const reportIndex = reportsHistory.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reportsHistory[reportIndex].status = 'completed';
        reportsHistory[reportIndex].fileSize = JSON.stringify(statisticsData).length;
        reportsHistory[reportIndex].data = statisticsData;
        localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
        renderReportsHistory();
        window.showNotification(`${title}生成完成`, 'success');
      }
      
    } catch (error) {
      console.error('生成报表失败:', error);
      
      // 更新报表状态为失败
      const reportIndex = reportsHistory.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reportsHistory[reportIndex].status = 'failed';
        localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
        renderReportsHistory();
      }
      
      window.showNotification(`${title}生成失败: ${error.message}`, 'error');
    }
    
    return reportId;
  }
  
  // 生成报表（兼容旧版本，使用默认日期范围）
  async function generateReport(type, title) {
    // 获取日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return generateReportWithDateRange(type, title, startDateStr, endDateStr);
  }
  
  // 显示统计数据模态框
  function showStatisticsModal(title, data, type) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal statistics-modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="statistics-content">
            ${generateStatisticsHTML(data, type)}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
          <button class="btn btn-primary" onclick="exportStatistics('${type}', '${title}')">导出数据</button>
        </div>
      </div>
    `;
    
    console.log('报表模块：将模态框添加到DOM');
    document.body.appendChild(modal);
    
    // 翻译新创建的模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
    
    // 模态框已经在创建时添加了active类
    console.log('报表模块：模态框已激活显示');
    
    console.log('报表模块：模态框已添加到DOM，当前body子元素数量:', document.body.children.length);
    console.log('报表模块：模态框元素信息', {
      className: modal.className,
      innerHTML: modal.innerHTML.substring(0, 200) + '...',
      style: modal.style.cssText,
      offsetWidth: modal.offsetWidth,
      offsetHeight: modal.offsetHeight,
      display: getComputedStyle(modal).display,
      visibility: getComputedStyle(modal).visibility,
      zIndex: getComputedStyle(modal).zIndex
    });
    
    // 点击背景关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // 生成统计数据HTML
  function generateStatisticsHTML(data, type) {
    switch (type) {
      case 'patient':
        return generatePatientStatisticsHTML(data);
      case 'medical_record':
        return generateMedicalRecordStatisticsHTML(data);
      case 'medicine':
        return generateMedicineStatisticsHTML(data);
      case 'finance':
        return generateFinanceStatisticsHTML(data);
      default:
        return '<p>暂不支持此类型的统计数据显示</p>';
    }
  }
  
  // 患者统计HTML
  function generatePatientStatisticsHTML(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-card">
          <h4>总患者数</h4>
          <div class="stat-value">${data.total_patients}</div>
        </div>
        <div class="stat-card">
          <h4>新患者</h4>
          <div class="stat-value">${data.new_patients}</div>
        </div>
        <div class="stat-card">
          <h4>回访患者</h4>
          <div class="stat-value">${data.returning_patients}</div>
        </div>
      </div>
      
      <div class="statistics-charts">
        <div class="chart-section">
          <h4>年龄分布</h4>
          <div class="chart-data">
            ${data.age_distribution.map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chart-section">
          <h4>性别分布</h4>
          <div class="chart-data">
            ${data.gender_distribution.map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 病历统计HTML
  function generateMedicalRecordStatisticsHTML(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-card">
          <h4>总病历数</h4>
          <div class="stat-value">${data.total_records}</div>
        </div>
      </div>
      
      <div class="statistics-charts">
        <div class="chart-section">
          <h4>常见诊断</h4>
          <div class="chart-data">
            ${data.diagnosis_distribution.slice(0, 5).map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chart-section">
          <h4>医生工作量</h4>
          <div class="chart-data">
            ${data.doctor_workload.map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 药品统计HTML
  function generateMedicineStatisticsHTML(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-card">
          <h4>总药品数</h4>
          <div class="stat-value">${data.total_medicines}</div>
        </div>
        <div class="stat-card">
          <h4>低库存</h4>
          <div class="stat-value text-warning">${data.low_stock_count}</div>
        </div>
        <div class="stat-card">
          <h4>已过期</h4>
          <div class="stat-value text-danger">${data.expired_count}</div>
        </div>
        <div class="stat-card">
          <h4>库存价值</h4>
          <div class="stat-value">¥${parseFloat(data.stock_value).toFixed(2)}</div>
        </div>
      </div>
      
      <div class="statistics-charts">
        <div class="chart-section">
          <h4>最常用药品</h4>
          <div class="chart-data">
            ${data.most_used_medicines.slice(0, 5).map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chart-section">
          <h4>药品分类分布</h4>
          <div class="chart-data">
            ${data.category_distribution.map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 财务统计HTML
  function generateFinanceStatisticsHTML(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-card">
          <h4>总收入</h4>
          <div class="stat-value text-success">¥${parseFloat(data.total_revenue).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4>总支出</h4>
          <div class="stat-value text-danger">¥${parseFloat(data.total_expenses).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4>净利润</h4>
          <div class="stat-value ${parseFloat(data.net_profit) >= 0 ? 'text-success' : 'text-danger'}">¥${parseFloat(data.net_profit).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4>账单数量</h4>
          <div class="stat-value">${data.bill_count}</div>
        </div>
      </div>
      
      <div class="statistics-charts">
        <div class="chart-section">
          <h4>支付方式分布</h4>
          <div class="chart-data">
            ${data.payment_methods.map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.name}</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="chart-value">${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chart-section">
          <h4>月度收支趋势</h4>
          <div class="chart-data">
            ${data.monthly_revenue.slice(-6).map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.month}</span>
                <div class="chart-details">
                  <div>收入: ¥${parseFloat(item.revenue).toFixed(2)}</div>
                  <div>支出: ¥${parseFloat(item.expenses).toFixed(2)}</div>
                  <div>净利: ¥${(parseFloat(item.revenue) - parseFloat(item.expenses)).toFixed(2)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 生成财务报表CSV内容
  function generateFinanceCSV(data) {
    let csv = '财务统计报表\n\n';
    
    // 基本统计信息
    csv += '统计项目,金额\n';
    csv += `总收入,¥${parseFloat(data.total_revenue || 0).toFixed(2)}\n`;
    csv += `总支出,¥${parseFloat(data.total_expenses || 0).toFixed(2)}\n`;
    csv += `净利润,¥${(parseFloat(data.total_revenue || 0) - parseFloat(data.total_expenses || 0)).toFixed(2)}\n`;
    csv += `账单数量,${data.bill_count || 0}\n`;
    csv += `已支付账单,${data.paid_bills || 0}\n`;
    csv += `未支付账单,${data.unpaid_bills || 0}\n\n`;
    
    // 收入分类
    if (data.revenue_by_category && data.revenue_by_category.length > 0) {
      csv += '收入分类统计\n';
      csv += '分类,金额,占比\n';
      data.revenue_by_category.forEach(item => {
        csv += `${item.category},¥${parseFloat(item.amount).toFixed(2)},${item.percentage}%\n`;
      });
      csv += '\n';
    }
    
    // 月度收支趋势
    if (data.monthly_revenue && data.monthly_revenue.length > 0) {
      csv += '月度收支趋势\n';
      csv += '月份,收入,支出,净利润\n';
      data.monthly_revenue.forEach(item => {
        const netProfit = parseFloat(item.revenue) - parseFloat(item.expenses);
        csv += `${item.month},¥${parseFloat(item.revenue).toFixed(2)},¥${parseFloat(item.expenses).toFixed(2)},¥${netProfit.toFixed(2)}\n`;
      });
    }
    
    return csv;
  }
  
  // 显示确认模态框
  function showConfirmModal(title, message, onConfirm) {
    console.log('报表模块：showConfirmModal被调用', { title, message });
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline cancel-btn">取消</button>
          <button class="btn btn-danger confirm-btn">确认</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    console.log('报表模块：模态框已显示');
    
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
    
    // 模态框关闭函数
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
        console.log('报表模块：模态框已关闭并移除');
      }, 300); // 等待动画完成
    };
    
    // 更新关闭按钮的onclick事件
    const closeButtons = modal.querySelectorAll('[onclick*="remove"]');
    closeButtons.forEach(btn => {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', closeModal);
    });
    
    // 点击背景关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // ESC键关闭模态框
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  // 导出统计数据
  window.exportStatistics = function(type, title) {
    const report = reportsHistory.find(r => r.name === title && r.type === type);
    if (report && report.data) {
      try {
        let downloadContent;
        let fileName;
        let mimeType;
        
        if (type === 'finance') {
          downloadContent = generateFinanceCSV(report.data);
          fileName = `${title}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv;charset=utf-8';
        } else {
          downloadContent = JSON.stringify(report.data, null, 2);
          fileName = `${title}_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
        }
        
        const blob = new Blob([downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.showNotification('统计数据已导出', 'success');
      } catch (error) {
        console.error('导出失败:', error);
        window.showNotification('导出失败，请重试', 'error');
      }
    } else {
      window.showNotification('没有可导出的数据', 'warning');
    }
  };
  
  // 显示日期选择模态框
  function showDateSelectionModal(reportType, reportTitle) {
    console.log('报表模块：showDateSelectionModal被调用', { reportType, reportTitle });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    console.log('报表模块：创建模态框元素', modal);
    
    // 设置默认日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    modal.innerHTML = `
      <div class="modal date-selection-modal">
        <div class="modal-header">
          <h3 data-i18n="select_report_date_range">${i18n.t('select_report_date_range')}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="date-selection-content">
            <div class="report-info">
              <h4>${reportTitle}</h4>
              <p data-i18n="select_date_range_desc">${i18n.t('select_date_range_desc')}</p>
            </div>
            
            <div class="date-range-form">
              <div class="form-group">
                <label for="start-date" data-i18n="start_date">${i18n.t('start_date')}：</label>
                <input type="date" id="start-date" class="form-control" value="${startDateStr}" max="${endDateStr}">
              </div>
              
              <div class="form-group">
                <label for="end-date" data-i18n="end_date">${i18n.t('end_date')}：</label>
                <input type="date" id="end-date" class="form-control" value="${endDateStr}" max="${endDateStr}">
              </div>
              
              <div class="quick-select-buttons">
                <button type="button" class="btn btn-outline btn-sm" data-days="7" data-i18n="recent_7_days">${i18n.t('recent_7_days')}</button>
                <button type="button" class="btn btn-outline btn-sm" data-days="30" data-i18n="recent_30_days">${i18n.t('recent_30_days')}</button>
                <button type="button" class="btn btn-outline btn-sm" data-days="90" data-i18n="recent_90_days">${i18n.t('recent_90_days')}</button>
                <button type="button" class="btn btn-outline btn-sm" data-days="365" data-i18n="recent_1_year">${i18n.t('recent_1_year')}</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()" data-i18n="cancel">${i18n.t('cancel')}</button>
          <button class="btn btn-primary" id="generate-report-btn" data-i18n="generate_report">${i18n.t('generate_report')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加调试信息和激活模态框
    setTimeout(() => {
      modal.classList.add('active');
      // 强制设置样式确保显示
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('z-index', '1000', 'important');
      // 确保内部modal元素也正确显示并居中
       const innerModal = modal.querySelector('.modal');
       if (innerModal) {
         innerModal.style.setProperty('display', 'block', 'important');
         innerModal.style.setProperty('position', 'fixed', 'important');
         innerModal.style.setProperty('top', '50%', 'important');
         innerModal.style.setProperty('left', '50%', 'important');
         innerModal.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
         innerModal.style.setProperty('background', 'var(--color-bg-card)', 'important');
         innerModal.style.setProperty('color', 'var(--color-text-primary)', 'important');
         innerModal.style.setProperty('border', '1px solid var(--color-border)', 'important');
         innerModal.style.setProperty('border-radius', '12px', 'important');
         innerModal.style.setProperty('box-shadow', '0 10px 30px rgba(0, 0, 0, 0.3)', 'important');
         innerModal.style.setProperty('max-height', '90vh', 'important');
         innerModal.style.setProperty('overflow-y', 'auto', 'important');
       }
      console.log('报表模块：模态框已激活显示');
      console.log('报表模块：强制设置样式后的状态', {
        display: getComputedStyle(modal).display,
        opacity: getComputedStyle(modal).opacity,
        zIndex: getComputedStyle(modal).zIndex
      });
    }, 10);
    
    console.log('报表模块：模态框已添加到DOM，当前body子元素数量:', document.body.children.length);
    console.log('报表模块：模态框元素信息', {
      className: modal.className,
      innerHTML: modal.innerHTML.substring(0, 200) + '...',
      style: modal.style.cssText,
      offsetWidth: modal.offsetWidth,
      offsetHeight: modal.offsetHeight,
      display: getComputedStyle(modal).display,
      visibility: getComputedStyle(modal).visibility,
      zIndex: getComputedStyle(modal).zIndex
    });
    
    // 快速选择按钮事件
    const quickSelectBtns = modal.querySelectorAll('.quick-select-buttons .btn');
    quickSelectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-days'));
        const newEndDate = new Date();
        const newStartDate = new Date();
        newStartDate.setDate(newEndDate.getDate() - days);
        
        modal.querySelector('#start-date').value = newStartDate.toISOString().split('T')[0];
        modal.querySelector('#end-date').value = newEndDate.toISOString().split('T')[0];
        
        // 更新按钮状态
        quickSelectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // 日期验证
    const startDateInput = modal.querySelector('#start-date');
    const endDateInput = modal.querySelector('#end-date');
    
    function validateDates() {
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      const generateBtn = modal.querySelector('#generate-report-btn');
      
      if (startDate > endDate) {
        generateBtn.disabled = true;
        generateBtn.textContent = i18n.t('date_range_invalid');
      } else {
        generateBtn.disabled = false;
        generateBtn.textContent = i18n.t('generate_report');
      }
    }
    
    startDateInput.addEventListener('change', validateDates);
    endDateInput.addEventListener('change', validateDates);
    
    // 生成报表按钮事件
    modal.querySelector('#generate-report-btn').addEventListener('click', () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      
      if (!startDate || !endDate) {
        window.showNotification(i18n.t('please_select_date_range'), 'warning');
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        window.showNotification(i18n.t('date_range_invalid'), 'warning');
        return;
      }
      
      // 关闭模态框
      modal.remove();
      
      // 生成报表
      generateReportWithDateRange(reportType, reportTitle, startDate, endDate);
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
  
  // 绑定报表生成按钮事件
  const generateBtns = container.querySelectorAll('.report-card .btn-primary');
  console.log('报表模块：找到生成按钮数量:', generateBtns.length);
  
  generateBtns.forEach((btn, index) => {
    console.log(`报表模块：绑定第${index + 1}个按钮事件，报表类型:`, btn.getAttribute('data-report-type'));
    btn.addEventListener('click', (e) => {
      console.log('报表模块：按钮被点击', e.target);
      
      const reportCard = e.target.closest('.report-card');
      const reportTitle = reportCard.querySelector('h3').textContent;
      const reportType = btn.getAttribute('data-report-type');
      
      console.log('报表模块：获取到的信息', { reportTitle, reportType });
      
      // 显示日期选择模态框
      showDateSelectionModal(reportType, reportTitle);
    }, signal ? { signal } : {});
  });
  
  // 刷新历史按钮事件
  const refreshBtn = container.querySelector('#refresh-history-btn');
  console.log('报表模块：刷新按钮元素:', refreshBtn);
  if (refreshBtn) {
    console.log('报表模块：绑定刷新按钮事件');
    refreshBtn.addEventListener('click', () => {
      console.log('报表模块：刷新按钮被点击');
      renderReportsHistory();
      const message = window.getTranslation ? window.getTranslation('report_history_refreshed', '报表历史已刷新') : '报表历史已刷新';
        window.showNotification(message, 'info');
    }, signal ? { signal } : {});
  } else {
    console.error('报表模块：未找到刷新按钮元素');
  }
  
  // 清理历史按钮事件
  const clearBtn = container.querySelector('#clear-history-btn');
  console.log('报表模块：清理按钮元素:', clearBtn);
  if (clearBtn) {
    console.log('报表模块：绑定清理按钮事件');
    clearBtn.addEventListener('click', () => {
      console.log('报表模块：清理按钮被点击');
      showConfirmModal(
        '确认清理',
        '确定要清理所有报表历史吗？此操作不可撤销。',
        () => {
          console.log('报表模块：确认清理操作');
          reportsHistory = [];
          localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
          renderReportsHistory();
          const successMessage = window.getTranslation ? window.getTranslation('report_history_cleared', '报表历史已清理') : '报表历史已清理';
          window.showNotification(successMessage, 'success');
        }
      );
    }, signal ? { signal } : {});
  } else {
    console.error('报表模块：未找到清理按钮元素');
  }
  
  // 全局函数：下载报表
  window.downloadReport = function(reportId) {
    console.log('报表模块：downloadReport被调用，reportId:', reportId);
    const report = reportsHistory.find(r => r.id === reportId);
    if (report && report.status === 'completed' && report.data) {
      try {
        // 创建下载内容
        let downloadContent;
        let fileName;
        let mimeType;
        
        // 根据报表类型生成不同格式的下载内容
        if (report.type === 'finance') {
          // 财务报表生成CSV格式
          downloadContent = generateFinanceCSV(report.data);
          fileName = `${report.name}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv;charset=utf-8';
        } else {
          // 其他报表生成JSON格式
          downloadContent = JSON.stringify(report.data, null, 2);
          fileName = `${report.name}_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
        }
        
        // 创建并触发下载
        // 为 CSV 文件添加 BOM 头以解决中文乱码问题
        if (mimeType.includes('csv')) {
          const BOM = '\uFEFF';
          downloadContent = BOM + downloadContent;
        }
        const blob = new Blob([downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.showNotification(`${report.name} 下载完成`, 'success');
      } catch (error) {
        console.error('下载报表失败:', error);
        window.showNotification('下载失败，请重试', 'error');
      }
    } else {
      const warningMessage = window.getTranslation ? window.getTranslation('report_not_ready', '报表尚未生成完成') : '报表尚未生成完成';
      window.showNotification(warningMessage, 'warning');
    }
  };
  
  // 全局函数：预览报表
  window.previewReport = function(reportId) {
    console.log('报表模块：previewReport被调用，reportId:', reportId);
    const report = reportsHistory.find(r => r.id === reportId);
    if (report && report.status === 'completed' && report.data) {
      showReportPreviewModal(report);
    } else {
      const warningMessage = window.getTranslation ? window.getTranslation('report_not_ready', '报表尚未生成完成') : '报表尚未生成完成';
      window.showNotification(warningMessage, 'warning');
    }
  };

  // 全局函数：删除报表
  window.deleteReport = function(reportId) {
    console.log('报表模块：deleteReport被调用，reportId:', reportId);
    const report = reportsHistory.find(r => r.id === reportId);
    if (report) {
      showConfirmModal(
        '确认删除',
        `确定要删除报表 "${report.name}" 吗？此操作不可撤销。`,
        () => {
          reportsHistory = reportsHistory.filter(r => r.id !== reportId);
          localStorage.setItem('reportsHistory', JSON.stringify(reportsHistory));
          renderReportsHistory();
          const successMessage = window.getTranslation ? window.getTranslation('report_deleted', '报表已删除') : '报表已删除';
          window.showNotification(successMessage, 'success');
        }
      );
    }
  };
  
  // 初始渲染报表历史
  renderReportsHistory();
  
  // 显示报表预览模态框
  function showReportPreviewModal(report) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content report-preview-modal">
        <div class="modal-header">
          <h3 data-i18n="report_preview">报表预览</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="report-info">
            <h4>${report.name}</h4>
            <p><strong data-i18n="report_type">报表类型:</strong> <span data-i18n="${report.type}_report">${getReportTypeText(report.type)}</span></p>
            <p><strong data-i18n="generation_time">生成时间:</strong> ${formatDateTime(report.generationTime)}</p>
            <p><strong data-i18n="file_size">文件大小:</strong> ${formatFileSize(report.fileSize)}</p>
          </div>
          <div class="report-data-container">
            <h5 data-i18n="report_data">报表数据:</h5>
            <div class="report-data-content">
              ${formatReportDataForPreview(report.data, report.type)}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="downloadReport('${report.id}')" data-i18n="download">下载</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()" data-i18n="close">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    console.log('报表模块：预览模态框已显示');
    
    // 重新翻译
    if (window.translatePage) {
      window.translatePage();
    }
    
    // 点击背景关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // ESC键关闭模态框
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }
  
  // 格式化报表数据用于预览
  function formatReportDataForPreview(data, type) {
    if (!data) return '<p data-i18n="no_data">暂无数据</p>';
    
    try {
      switch (type) {
        case 'patient':
          return formatPatientStatistics(data);
        case 'medical_record':
          return formatMedicalRecordStatistics(data);
        case 'medicine':
          return formatMedicineStatistics(data);
        case 'finance':
          return formatFinanceStatistics(data);
        default:
          return `<pre class="json-preview">${JSON.stringify(data, null, 2)}</pre>`;
      }
    } catch (error) {
      console.error('格式化报表数据失败:', error);
      return '<p class="error" data-i18n="data_format_error">数据格式错误</p>';
    }
  }
  
  // 格式化患者统计数据
  function formatPatientStatistics(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-item">
          <span class="stat-label" data-i18n="total_patients">总患者数:</span>
          <span class="stat-value">${data.total_patients || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" data-i18n="new_patients">新患者数:</span>
          <span class="stat-value">${data.new_patients || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" data-i18n="returning_patients">回访患者数:</span>
          <span class="stat-value">${data.returning_patients || 0}</span>
        </div>
      </div>
      <div class="statistics-charts">
        <div class="chart-section">
          <h6 data-i18n="age_distribution">年龄分布:</h6>
          <div class="distribution-list">
            ${(data.age_distribution || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chart-section">
          <h6 data-i18n="gender_distribution">性别分布:</h6>
          <div class="distribution-list">
            ${(data.gender_distribution || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 格式化病历统计数据
  function formatMedicalRecordStatistics(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-item">
          <span class="stat-label" data-i18n="total_records">总病历数:</span>
          <span class="stat-value">${data.total_records || 0}</span>
        </div>
      </div>
      <div class="statistics-charts">
        <div class="chart-section">
          <h6 data-i18n="diagnosis_distribution">诊断分布:</h6>
          <div class="distribution-list">
            ${(data.diagnosis_distribution || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chart-section">
          <h6 data-i18n="treatment_distribution">治疗分布:</h6>
          <div class="distribution-list">
            ${(data.treatment_distribution || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 格式化药品统计数据
  function formatMedicineStatistics(data) {
    return `
      <div class="statistics-summary">
        <div class="stat-item">
          <span class="stat-label" data-i18n="total_medicines">总药品数:</span>
          <span class="stat-value">${data.total_medicines || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" data-i18n="low_stock_medicines">低库存药品:</span>
          <span class="stat-value">${data.low_stock_medicines || 0}</span>
        </div>
      </div>
      <div class="statistics-charts">
        <div class="chart-section">
          <h6 data-i18n="usage_distribution">使用分布:</h6>
          <div class="distribution-list">
            ${(data.usage_distribution || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>${item.count} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // 格式化财务统计数据
  function formatFinanceStatistics(data) {
    // 安全地转换 Decimal 类型为数字
    const safeToNumber = (value) => {
      if (value === null || value === undefined) return 0;
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    };
    
    return `
      <div class="statistics-summary">
        <div class="stat-item">
          <span class="stat-label" data-i18n="total_revenue">总收入:</span>
          <span class="stat-value">¥${safeToNumber(data.total_revenue).toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" data-i18n="total_expenses">总支出:</span>
          <span class="stat-value">¥${safeToNumber(data.total_expenses).toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" data-i18n="net_profit">净利润:</span>
          <span class="stat-value">¥${safeToNumber(data.net_profit).toFixed(2)}</span>
        </div>
      </div>
      <div class="statistics-charts">
        <div class="chart-section">
          <h6 data-i18n="expense_by_category">支出分类:</h6>
          <div class="distribution-list">
            ${(data.expense_by_category || []).map(item => `
              <div class="distribution-item">
                <span>${item.name}</span>
                <span>¥${safeToNumber(item.count).toFixed(2)} (${item.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 返回清理函数
  return () => {
    // 清理全局函数
    delete window.downloadReport;
    delete window.deleteReport;
    delete window.previewReport;
    console.log('报表模块已卸载');
  };
}

// 使用全局的showNotification函数
// 注意：全局showNotification只接受两个参数：(message, type)
// 如果需要显示标题，可以将标题包含在消息中