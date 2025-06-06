### **Nekolinic前端开发第一阶段指南：基于指定配色的主题化框架实现**

**本阶段核心目标**：构建一个功能完备、视觉精致的应用“骨架”。我们将以您提供的配色方案为基础，利用CSS自定义属性（变量）技术，创建一个支持主题切换的系统，并完成登录页面和主应用框架的静态实现。

------

#### **1. 设计语言解析与CSS变量定义**

我们首先将您提供的配色方案，转化为一套有语义的CSS变量。这是整个主题化系统的基石。

- **您的配色方案**:
  - `#eeeeee` (空白部分)
  - `#39c5bb` (各类bar)
  - `#393e46` (边框或小的bar)
  - `#222831` (文字或线条)
  - `#b83b51` (点缀)
- **转化为CSS变量 (我们将以此为规范)**:
  - `--color-bg-primary`: `#eeeeee` (主背景色)
  - `--color-bg-card`: `#ffffff` (卡片、输入框等背景，用纯白与主背景形成视觉区分)
  - `--color-bar-primary`: `#39c5bb` (主功能条，如顶部栏/侧边栏)
  - `--color-bar-secondary`: `#393e46` (次级条/强调边框)
  - `--color-text-primary`: `#222831` (主要文字颜色)
  - `--color-text-on-bar`: `#ffffff` (在深色功能条上的文字颜色)
  - `--color-accent-danger`: `#b83b51` (危险/重要点缀色，如删除、警告)
  - `--color-border`: `#dcdcdc` (通用边框颜色)

------

#### **2. CSS架构：定义主题与全局样式**

我们将所有主题和基础样式都放在 `frontend/css/style.css` 文件中。

**`frontend/css/style.css` 完整代码**:

CSS

```
/* ============================================= */
/* 1. 主题定义 (Theme Definitions)              */
/* ============================================= */

/* :root 定义了默认主题 (您的明亮主题) */
:root {
    --color-bg-primary: #eeeeee;
    --color-bg-card: #ffffff;
    --color-bar-primary: #39c5bb;
    --color-bar-secondary: #393e46;
    --color-text-primary: #222831;
    --color-text-on-bar: #ffffff;
    --color-accent-danger: #b83b51;
    --color-border: #dcdcdc;

    --font-family-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --spacing-unit: 8px;
    --border-radius: 4px;
}

/* 预留的暗色主题，只需添加一个data-theme属性即可切换 */
[data-theme="dark"] {
    --color-bg-primary: #222831;
    --color-bg-card: #393e46;
    --color-bar-primary: #39c5bb;
    --color-bar-secondary: #eeeeee;
    --color-text-primary: #eeeeee;
    --color-text-on-bar: #222831;
    --color-accent-danger: #f96d80; /* 暗色模式下点缀色可以更亮一些 */
    --color-border: #393e46;
}


/* ============================================= */
/* 2. 全局样式重置与基础定义 (Global Resets & Base) */
/* ============================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: var(--font-family-main);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: background-color 0.3s, color 0.3s;
}

h1, h2, h3 {
    margin-bottom: calc(var(--spacing-unit) * 2);
}


/* ============================================= */
/* 3. 通用工具类 (Utility Classes)             */
/* ============================================= */

.btn {
    padding: calc(var(--spacing-unit) * 1.25) calc(var(--spacing-unit) * 2);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.1s;
}

.btn:hover {
    transform: translateY(-1px);
}

.btn-primary {
    background-color: var(--color-bar-primary);
    color: var(--color-text-on-bar);
}

.btn-danger {
    background-color: var(--color-accent-danger);
    color: #ffffff;
}
```

------

#### **3. 登录页面 (`login.html`) 的精细化实现**

**`frontend/login.html` 完整代码**:

HTML

```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Nekolinic - 登录</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* 仅用于登录页的特定样式 */
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: var(--color-bg-primary);
        }
        .login-box {
            background-color: var(--color-bg-card);
            padding: calc(var(--spacing-unit) * 5);
            border-radius: var(--border-radius);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            border-top: 5px solid var(--color-bar-primary);
        }
        .login-box h1 {
            text-align: center;
            color: var(--color-text-primary);
        }
        .form-group {
            margin-bottom: calc(var(--spacing-unit) * 2);
        }
        .form-group label {
            display: block;
            margin-bottom: var(--spacing-unit);
            font-weight: 600;
        }
        .form-group input {
            width: 100%;
            padding: calc(var(--spacing-unit) * 1.25);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
        }
        .login-box .btn {
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-box">
            <h1>Nekolinic 登录</h1>
            <form id="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary">登录</button>
            </form>
        </div>
    </div>
    </body>
</html>
```

- **JavaScript逻辑**: `login.html` 本身不含复杂JS。其表单提交逻辑应由一个独立的 `login.js` 或在主 `app.js` 中通过判断当前页面URL来处理，核心是调用API、保存token并跳转 `window.location.href = 'index.html';`。

------

#### **4. 主应用框架 (`index.html`) 的精细化实现**

**`frontend/index.html` 完整代码**:

HTML

```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Nekolinic 诊所管理系统</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* 主应用框架特定样式 */
        .app-container { display: flex; height: 100vh; }
        .sidebar {
            width: 240px;
            background-color: var(--color-bar-secondary);
            color: var(--color-text-on-bar);
            padding: var(--spacing-unit);
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            padding: calc(var(--spacing-unit) * 2);
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .sidebar-nav {
            list-style: none;
            margin-top: calc(var(--spacing-unit) * 2);
        }
        .sidebar-nav a {
            display: block;
            color: var(--color-text-on-bar);
            text-decoration: none;
            padding: calc(var(--spacing-unit) * 1.5);
            border-radius: var(--border-radius);
            transition: background-color 0.2s;
        }
        .sidebar-nav a:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .sidebar-nav a.active {
            background-color: var(--color-bar-primary);
        }

        .main-wrapper { flex-grow: 1; display: flex; flex-direction: column; }
        .header {
            height: 60px;
            background: var(--color-bg-card);
            border-bottom: 1px solid var(--color-border);
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 0 calc(var(--spacing-unit) * 3);
        }
        .main-content {
            flex-grow: 1;
            padding: calc(var(--spacing-unit) * 3);
            background-color: var(--color-bg-primary);
        }
        .theme-switcher-container { display: flex; align-items: center; gap: var(--spacing-unit); }
    </style>
</head>
<body>
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-header">Nekolinic</div>
            <ul class="sidebar-nav">
                <li><a href="#" class="active">仪表盘</a></li>
                <li><a href="#">患者管理</a></li>
                <li><a href="#">预约管理</a></li>
                <li><a href="#">药局管理</a></li>
                <li><a href="#">财务管理</a></li>
                <li><a href="#">报告分析</a></li>
            </ul>
        </aside>
        <div class="main-wrapper">
            <header class="header">
                <div class="theme-switcher-container">
                    <label for="theme-switcher">主题:</label>
                    <select id="theme-switcher">
                        <option value="light">明亮</option>
                        <option value="dark">暗色</option>
                    </select>
                </div>
            </header>
            <main class="main-content">
                <h1>欢迎使用 Nekolinic 系统</h1>
                <p>请从左侧菜单选择一个模块开始操作。</p>
            </main>
        </div>
    </div>
    <script src="js/app.js"></script>
    <script src="js/apiClient.js"></script> </body>
</html>
```

------

#### **5. 主题切换功能实现**

此部分JS逻辑与上一版回复完全相同，请将其放入 `frontend/js/app.js` 中。它负责读取和写入 `localStorage`，并动态修改 `<body>` 的 `data-theme` 属性。

------

#### **阶段成果总结**

恭喜！完成本阶段后，您将拥有一个坚实且美观的前端基础，具体成果包括：

- **一个专业级的CSS架构**：基于CSS变量，实现了高度可维护和可扩展的主题系统。
- **首个主题的落地**：完全按照您的配色方案，实现了一个完整、统一的明亮主题。
- **精致的静态页面**：一个设计精良的登录页面和主应用框架，为后续填充功能做好了万全准备。
- **顺滑的主题切换功能**：用户可以自由切换主题，其选择会被浏览器记住，提供了极佳的个性化体验。

现在，您的项目已经拥有了一个“漂亮的骨架”，可以满怀信心地进入**第二阶段**，开始为这个骨架填充“血肉”——即实现患者管理等核心功能模块的交互逻辑。