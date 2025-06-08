export default async function render(container, { signal }) {
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div class="content-header">
                <h1 data-i18n="welcome_to_nekolinic">欢迎使用 Nekolinic 系统</h1>
            </div>
            <div class="dashboard-content">
                <p data-i18n="select_module_from_menu">请从左侧菜单选择一个模块开始操作。</p>
            </div>
        </div>
    `;
    
    // 翻译页面内容
    if (window.translatePage) {
        window.translatePage();
    }

    return function cleanup() {
        console.log('Dashboard module cleaned up');
    };
}