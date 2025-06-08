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
            <h3>患者统计报表</h3>
            <p>患者数量、年龄分布、就诊频次等统计</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-notes-medical"></i>
          </div>
          <div class="report-content">
            <h3>病历统计报表</h3>
            <p>病历数量、疾病分类、治疗效果等统计</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-pills"></i>
          </div>
          <div class="report-content">
            <h3>药品统计报表</h3>
            <p>药品库存、使用量、过期提醒等统计</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="report-content">
            <h3>财务统计报表</h3>
            <p>收入支出、利润分析、账单统计等</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="report-content">
            <h3>预约统计报表</h3>
            <p>预约数量、时间分布、取消率等统计</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="report-content">
            <h3>工作量统计报表</h3>
            <p>医生工作量、科室效率、时间分析等</p>
            <button class="btn btn-primary">生成报表</button>
          </div>
        </div>
      </div>
      
      <div class="reports-history">
        <div class="section-header">
          <h3>报表历史</h3>
          <div class="section-actions">
            <button class="btn btn-outline">清理历史</button>
          </div>
        </div>
        
        <div class="reports-table">
          <table class="table">
            <thead>
              <tr>
                <th>报表名称</th>
                <th>生成时间</th>
                <th>文件大小</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" class="empty-state">暂无报表历史</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
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
        showNotification('成功', `${reportTitle}生成完成`, 'success');
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