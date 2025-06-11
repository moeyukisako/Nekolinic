/**
 * 状态模块
 * 显示透明背景的空白状态页面
 */

function renderStatus(container) {
    if (!container) {
        console.error('Status container not found');
        return;
    }

    // 创建状态模块的HTML内容
    const statusHTML = `
        <div style="
            background: transparent;
            height: 70vh;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        ">
            <h1 class="status-title" style="
                font-size: 50px;
                font-weight: bold;
                margin: 0;
                margin-left: -150px;
                text-align: center;
                font-family: 'Arial', sans-serif;
                opacity: 0.2;
            ">Nekolinic</h1>
        </div>
    `;

    container.innerHTML = statusHTML;
    
    // 确保容器本身也是透明的
    container.style.background = 'transparent';
    
    console.log('Status module rendered successfully');
}

// 导出渲染函数
export default renderStatus;