/**
 * 报表管理模块
 */

import { showNotification } from '../utils/ui.js';
import { i18n } from '../../utils/i18n.js';
import Modal from '../components/modal.js';

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
    const modal = new Modal({
      title: title,
      content: `
        <div class="statistics-content">
          ${generateStatisticsHTML(data, type)}
        </div>
      `,
      size: 'large',
      showFooter: true,
      confirmText: '导出数据',
      cancelText: '关闭',
      onConfirm: () => {
        exportStatistics(type, title);
        return false; // 不关闭模态框
      },
      onCancel: () => {
        // 关闭模态框
      }
    });
    
    modal.render();
    
    // 翻译新创建的模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
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
          <h4 data-i18n="total_revenue">${window.getTranslation ? window.getTranslation('total_revenue', '总收入') : '总收入'}</h4>
          <div class="stat-value text-success">¥${parseFloat(data.total_revenue).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4 data-i18n="total_expenses">${window.getTranslation ? window.getTranslation('total_expenses', '总支出') : '总支出'}</h4>
          <div class="stat-value text-danger">¥${parseFloat(data.total_expenses).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4 data-i18n="net_profit">${window.getTranslation ? window.getTranslation('net_profit', '净利润') : '净利润'}</h4>
          <div class="stat-value ${parseFloat(data.net_profit) >= 0 ? 'text-success' : 'text-danger'}">¥${parseFloat(data.net_profit).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h4 data-i18n="bill_count">${window.getTranslation ? window.getTranslation('bill_count', '账单数量') : '账单数量'}</h4>
          <div class="stat-value">${data.bill_count}</div>
        </div>
      </div>
      
      <div class="statistics-charts">
        <div class="chart-section">
          <h4 data-i18n="payment_method_distribution">${window.getTranslation ? window.getTranslation('payment_method_distribution', '支付方式分布') : '支付方式分布'}</h4>
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
          <h4 data-i18n="monthly_revenue_trend">${window.getTranslation ? window.getTranslation('monthly_revenue_trend', '月度收支趋势') : '月度收支趋势'}</h4>
          <div class="chart-data">
            ${data.monthly_revenue.slice(-6).map(item => `
              <div class="chart-item">
                <span class="chart-label">${item.month}</span>
                <div class="chart-details">
                  <div>${window.getTranslation ? window.getTranslation('revenue', '收入') : '收入'}: ¥${parseFloat(item.revenue).toFixed(2)}</div>
                  <div>${window.getTranslation ? window.getTranslation('expenses', '支出') : '支出'}: ¥${parseFloat(item.expenses).toFixed(2)}</div>
                  <div>${window.getTranslation ? window.getTranslation('net_profit', '净利') : '净利'}: ¥${(parseFloat(item.revenue) - parseFloat(item.expenses)).toFixed(2)}</div>
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
    const reportTitle = window.getTranslation ? window.getTranslation('finance_statistics', '财务统计报表') : '财务统计报表';
    let csv = reportTitle + '\n\n';
    
    // 基本统计信息
    const statisticsItem = window.getTranslation ? window.getTranslation('statistics_item', '统计项目') : '统计项目';
    const amount = window.getTranslation ? window.getTranslation('amount', '金额') : '金额';
    csv += `${statisticsItem},${amount}\n`;
    csv += `${window.getTranslation ? window.getTranslation('total_revenue', '总收入') : '总收入'},¥${parseFloat(data.total_revenue || 0).toFixed(2)}\n`;
    csv += `${window.getTranslation ? window.getTranslation('total_expenses', '总支出') : '总支出'},¥${parseFloat(data.total_expenses || 0).toFixed(2)}\n`;
    csv += `${window.getTranslation ? window.getTranslation('net_profit', '净利润') : '净利润'},¥${(parseFloat(data.total_revenue || 0) - parseFloat(data.total_expenses || 0)).toFixed(2)}\n`;
    csv += `${window.getTranslation ? window.getTranslation('bill_count', '账单数量') : '账单数量'},${data.bill_count || 0}\n`;
    csv += `${window.getTranslation ? window.getTranslation('paid_bills', '已支付账单') : '已支付账单'},${data.paid_bills || 0}\n`;
    csv += `${window.getTranslation ? window.getTranslation('unpaid_bills', '未支付账单') : '未支付账单'},${data.unpaid_bills || 0}\n\n`;
    
    // 收入分类
    if (data.revenue_by_category && data.revenue_by_category.length > 0) {
      csv += `${window.getTranslation ? window.getTranslation('revenue_by_category', '收入分类统计') : '收入分类统计'}\n`;
      const category = window.getTranslation ? window.getTranslation('category', '分类') : '分类';
      const percentage = window.getTranslation ? window.getTranslation('percentage', '占比') : '占比';
      csv += `${category},${amount},${percentage}\n`;
      data.revenue_by_category.forEach(item => {
        csv += `${item.category},¥${parseFloat(item.amount).toFixed(2)},${item.percentage}%\n`;
      });
      csv += '\n';
    }
    
    // 月度收支趋势
    if (data.monthly_revenue && data.monthly_revenue.length > 0) {
      csv += `${window.getTranslation ? window.getTranslation('monthly_revenue_trend', '月度收支趋势') : '月度收支趋势'}\n`;
      const month = window.getTranslation ? window.getTranslation('month', '月份') : '月份';
      const revenue = window.getTranslation ? window.getTranslation('revenue', '收入') : '收入';
      const expenses = window.getTranslation ? window.getTranslation('expenses', '支出') : '支出';
      const netProfit = window.getTranslation ? window.getTranslation('net_profit', '净利润') : '净利润';
      csv += `${month},${revenue},${expenses},${netProfit}\n`;
      data.monthly_revenue.forEach(item => {
        const netProfitValue = parseFloat(item.revenue) - parseFloat(item.expenses);
        csv += `${item.month},¥${parseFloat(item.revenue).toFixed(2)},¥${parseFloat(item.expenses).toFixed(2)},¥${netProfitValue.toFixed(2)}\n`;
      });
    }
    
    return csv;
  }
  
  // 显示确认模态框
  function showConfirmModal(title, message, onConfirm) {
    console.log('报表模块：showConfirmModal被调用', { title, message });
    
    const modal = new Modal({
      title: title,
      content: `<p>${message}</p>`,
      confirmText: i18n.t('confirm') || '确认',
      cancelText: i18n.t('cancel') || '取消',
      onConfirm: () => {
        console.log('报表模块：确认操作被执行');
        onConfirm();
        return true; // 允许关闭模态框
      },
      onCancel: () => {
        console.log('报表模块：取消操作被执行');
      }
    });
    
    modal.render();
    console.log('报表模块：模态框已显示');
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
    
    // 设置默认日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const modal = new Modal({
      title: i18n.t('select_report_date_range'),
      content: `
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
      `,
      size: 'medium',
      showFooter: true,
      confirmText: i18n.t('generate_report'),
      cancelText: i18n.t('cancel'),
      onConfirm: () => {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (startDateInput && endDateInput) {
          const selectedStartDate = startDateInput.value;
          const selectedEndDate = endDateInput.value;
          
          if (selectedStartDate && selectedEndDate) {
            generateReportWithDateRange(reportType, reportTitle, selectedStartDate, selectedEndDate);
            return true; // 关闭模态框
          }
        }
        return false; // 不关闭模态框
      }
    });
    
    modal.render();
    
    // 快速选择按钮事件
    setTimeout(() => {
      const modalElement = document.querySelector('.modal.active');
      if (modalElement) {
        modalElement.querySelectorAll('.quick-select-buttons button').forEach(button => {
          button.addEventListener('click', function() {
            const days = parseInt(this.dataset.days);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            
            document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
            document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
            
            // 更新按钮状态
            modalElement.querySelectorAll('.quick-select-buttons button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
          });
        });
        
        // 日期输入验证
        const startDateInput = modalElement.querySelector('#start-date');
        const endDateInput = modalElement.querySelector('#end-date');
        
        if (startDateInput && endDateInput) {
          startDateInput.addEventListener('change', function() {
            endDateInput.min = this.value;
          });
          
          endDateInput.addEventListener('change', function() {
            startDateInput.max = this.value;
          });
        }
      }
    }, 100);
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
        i18n.t('confirm_clear_history_title') || '确认清理',
        i18n.t('confirm_clear_history') || '确定要清理所有报表历史吗？此操作不可撤销。',
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

  // 全局函数：PDF预览报表
  window.previewReportPDF = async function(reportId) {
    console.log('报表模块：previewReportPDF被调用，reportId:', reportId);
    const report = reportsHistory.find(r => r.id === reportId);
    if (!report || report.status !== 'completed') {
      const warningMessage = window.getTranslation ? window.getTranslation('report_not_ready', '报表尚未生成完成') : '报表尚未生成完成';
      window.showNotification(warningMessage, 'warning');
      return;
    }

    try {
      // 显示加载提示
      const loadingMessage = window.getTranslation ? window.getTranslation('generating_pdf', '正在生成PDF...') : '正在生成PDF...';
      window.showNotification(loadingMessage, 'info');

      // 根据报表类型调用相应的PDF生成API
      let pdfUrl;
      const dateRange = report.dateRange;
      const requestData = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      };

      switch (report.type) {
        case 'patient':
          pdfUrl = await generatePDFUrl('/api/v1/reports/statistics/patients/download', requestData);
          break;
        case 'medical_record':
          pdfUrl = await generatePDFUrl('/api/v1/reports/statistics/medical-records/download', requestData);
          break;
        case 'medicine':
          pdfUrl = await generatePDFUrl('/api/v1/reports/statistics/medicines/download', requestData);
          break;
        case 'finance':
          pdfUrl = await generatePDFUrl('/api/v1/reports/statistics/finance/download', requestData);
          break;
        case 'financial_summary':
          pdfUrl = await generatePDFUrl('/api/v1/reports/financial-summary/download', requestData);
          break;
        default:
          throw new Error('不支持的报表类型');
      }

      // 使用模态框显示PDF预览
      showPDFPreviewModal(report, pdfUrl);

    } catch (error) {
      console.error('PDF预览失败:', error);
      const errorMessage = window.getTranslation ? window.getTranslation('pdf_preview_failed', 'PDF预览失败') : 'PDF预览失败';
      window.showNotification(errorMessage + ': ' + error.message, 'error');
    }
  };

  // 显示PDF预览模态框
  function showPDFPreviewModal(report, pdfUrl) {
    const modal = new Modal({
      title: `${window.getTranslation ? window.getTranslation('preview_pdf', 'PDF预览') : 'PDF预览'} - ${report.name}`,
      content: `
        <div class="pdf-preview-container" style="height: 70vh; width: 100%;">
          <iframe 
            src="${pdfUrl}" 
            style="width: 100%; height: 100%; border: none; border-radius: 4px;"
            title="PDF预览">
          </iframe>
        </div>
      `,
      size: 'large',
      showFooter: true,
      confirmText: window.getTranslation ? window.getTranslation('download', '下载') : '下载',
      cancelText: window.getTranslation ? window.getTranslation('close', '关闭') : '关闭',
      onConfirm: () => {
        // 下载PDF
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `${report.name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return false; // 不关闭模态框
      },
      onCancel: () => {
        // 清理URL
        URL.revokeObjectURL(pdfUrl);
      }
    });
    
    modal.render();
    
    // 手动添加large样式到modal-content
    const modalContent = modal.element.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.add('large');
    }
    
    // 当模态框关闭时清理URL
    const originalClose = modal.close.bind(modal);
    modal.close = function() {
      URL.revokeObjectURL(pdfUrl);
      originalClose();
    };
  }

  // 生成PDF URL
  async function generatePDFUrl(endpoint, requestData) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('未找到认证令牌');
    }

    // 获取当前语言设置
    const currentLanguage = window.configManager ? window.configManager.get('language', 'zh-CN') : 'zh-CN';
    
    // 在URL中添加language参数
    const urlWithLanguage = `${endpoint}?language=${encodeURIComponent(currentLanguage)}`;

    const response = await fetch(urlWithLanguage, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // 创建Blob URL用于预览
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // 全局函数：删除报表
  window.deleteReport = function(reportId) {
    console.log('报表模块：deleteReport被调用，reportId:', reportId);
    const report = reportsHistory.find(r => r.id === reportId);
    if (report) {
      showConfirmModal(
        i18n.t('confirm_delete_report_title') || '确认删除',
        i18n.t('confirm_delete_report', `确定要删除报表 "${report.name}" 吗？此操作不可撤销。`).replace('{name}', report.name),
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
    const modal = new Modal({
      title: i18n.t('report_preview'),
      content: `
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
      `,
      size: 'large',
      showFooter: false
    });
    
    modal.render();
    
    // 添加自定义按钮
    setTimeout(() => {
      const modalElement = document.querySelector('.modal.active');
      if (modalElement) {
        const modalBody = modalElement.querySelector('.modal-body');
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-footer';
        buttonContainer.innerHTML = `
           <button class="btn btn-primary" onclick="previewReportPDF('${report.id}')" data-i18n="preview_pdf">${i18n.t('preview_pdf')}</button>
           <button class="btn btn-outline" onclick="downloadReport('${report.id}')" data-i18n="download">${i18n.t('download')}</button>
           <button class="btn btn-secondary" onclick="window.currentModal && window.currentModal.close()" data-i18n="close">${i18n.t('close')}</button>
         `;
        modalElement.appendChild(buttonContainer);
        window.currentModal = modal;
      }
    }, 100);
    
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