export default async function render(container, { signal }) {
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div class="content-header">
                <h1>欢迎使用 Nekolinic 系统</h1>
            </div>
            <div class="dashboard-content">
                <p>请从左侧菜单选择一个模块开始操作。</p>
            </div>
        </div>
    `;

    return function cleanup() {
        console.log('Dashboard module cleaned up');
    };
}