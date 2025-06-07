/**
 * 仪表板模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
  // 渲染模块基本结构
  container.innerHTML = `
    <div class="dashboard-module">
      <div class="content-header">
        <h2>欢迎使用 Nekolinic 系统</h2>
      </div>
      <div class="dashboard-content">
        <p>请从左侧菜单选择一个模块开始操作。</p>
      </div>
    </div>
  `;

  // 模块清理函数
  return function cleanup() {
    console.log('Dashboard module cleaned up');
  };
} 