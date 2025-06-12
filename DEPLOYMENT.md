# Nekolinic 医疗管理系统部署指南

版本: alpha0.1.3

## 快速启动

### 方式一：使用启动脚本（推荐）

#### Windows用户
```bash
# 双击运行
start.bat

# 或在命令行中运行
start.bat
```

#### Linux/macOS用户
```bash
# 添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方式二：Python直接启动

#### 标准模式（自动打开浏览器）
```bash
python main.py
```

#### 静默模式（不打开浏览器）
```bash
python main.py --silent
# 或
python main.py -s
# 或
python start_silent.py
```

## 系统要求

- Python 3.8 或更高版本
- 操作系统：Windows 10+, macOS 10.14+, Ubuntu 18.04+
- 内存：至少 512MB 可用内存
- 磁盘空间：至少 100MB 可用空间

## 依赖安装

系统会自动检查并安装所需依赖，也可以手动安装：

```bash
pip install -r requirements.txt
```

## 打包为可执行文件

### 使用打包脚本
```bash
python build.py
```

### 手动打包
```bash
# 安装PyInstaller
pip install pyinstaller

# 创建可执行文件
pyinstaller --clean Nekolinic.spec
```

打包完成后，可执行文件位于 `dist/Nekolinic/` 目录中。

## 访问系统

启动成功后，可通过以下地址访问：

- **前端登录页面**: http://localhost:8000/index.html
- **管理面板**: http://localhost:8000/dashboard.html
- **API文档**: http://localhost:8000/docs

## 默认登录信息

- **用户名**: admin
- **密码**: password

> ⚠️ **安全提示**: 首次登录后请立即修改默认密码！

## 功能特性

### 自动化功能
- ✅ 自动数据库初始化
- ✅ 自动创建默认用户
- ✅ 自动依赖检查和安装
- ✅ 静默启动模式

### 系统功能
- 👥 用户管理
- 🏥 诊所管理
- 👤 患者管理
- 💊 药房管理
- 💰 财务管理
- 📊 报表生成

### 界面特性
- 🌍 多语言支持（中文/英文/日文）
- 🌙 深色/浅色主题
- 📱 响应式设计
- 🔒 安全认证

## 目录结构

```
Nekolinic/
├── app/                    # 后端应用
│   ├── user/              # 用户模块
│   ├── clinic/            # 诊所模块
│   ├── patient/           # 患者模块
│   ├── pharmacy/          # 药房模块
│   ├── finance/           # 财务模块
│   ├── reports/           # 报表模块
│   └── core/              # 核心模块
├── frontend/              # 前端文件
│   ├── js/               # JavaScript文件
│   ├── css/              # 样式文件
│   ├── assets/           # 静态资源
│   └── utils/            # 工具文件
├── alembic/              # 数据库迁移
├── docs/                 # 文档
├── main.py               # 主启动文件
├── start_silent.py       # 静默启动文件
├── start.bat             # Windows启动脚本
├── start.sh              # Linux/macOS启动脚本
├── build.py              # 打包脚本
├── requirements.txt      # Python依赖
└── README.md             # 项目说明
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```
   错误: [Errno 10048] Only one usage of each socket address
   ```
   解决方案：
   - 关闭占用8000端口的程序
   - 或修改 `main.py` 中的端口号

2. **Python版本过低**
   ```
   错误: Python 3.8+ required
   ```
   解决方案：升级Python到3.8或更高版本

3. **依赖安装失败**
   ```
   错误: pip install failed
   ```
   解决方案：
   ```bash
   # 升级pip
   python -m pip install --upgrade pip
   
   # 使用国内镜像
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

4. **数据库初始化失败**
   ```
   错误: Database initialization failed
   ```
   解决方案：
   - 检查磁盘空间
   - 确保有写入权限
   - 删除 `*.db` 文件重新初始化

### 日志查看

系统启动时会显示详细的日志信息，包括：
- 数据库初始化状态
- 前端文件检查结果
- 服务器启动信息
- 错误详情

## 生产环境部署

### 使用反向代理（推荐）

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 使用进程管理器

#### systemd服务配置
```ini
[Unit]
Description=Nekolinic Medical Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Nekolinic
ExecStart=/usr/bin/python3 start_silent.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改admin用户密码
2. **使用HTTPS**: 生产环境建议配置SSL证书
3. **防火墙配置**: 仅开放必要端口
4. **定期备份**: 定期备份数据库文件
5. **更新维护**: 定期检查并更新系统

## 技术支持

如遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查系统日志输出
3. 联系开发者获取支持

---

**Nekolinic 医疗管理系统**  
版本: alpha0.1.3  
Copyright © 2025 moeyukisako. All rights reserved.