# Nekolinic 安装程序制作指南

本指南将帮助您为 Nekolinic 医疗管理系统创建专业的 Windows 安装程序。

## 前提条件

### 1. 下载并安装 Inno Setup

- 访问官网：https://jrsoftware.org/isdl.php
- 下载 **Inno Setup 6** (推荐最新版本)
- 安装到默认路径：`C:\Program Files (x86)\Inno Setup 6\`

### 2. 确保项目已打包

在创建安装程序之前，请确保已经运行了 `build.py` 并成功打包：

```bash
python build.py
```

确认 `dist\Nekolinic\` 目录下存在完整的可执行文件。

## 快速开始

### 方法一：使用批处理文件（推荐）

1. 双击运行 `build_installer.bat`
2. 脚本会自动检查环境并构建安装程序
3. 安装程序将生成在 `installer\` 目录下

### 方法二：手动构建

1. 打开 Inno Setup Compiler
2. 打开 `setup.iss` 文件
3. 点击 "Build" -> "Compile" 或按 F9
4. 等待编译完成

## 安装程序特性

### 🎯 主要功能

- **多语言支持**：中文简体 + 英文界面
- **智能升级**：自动检测并卸载旧版本
- **桌面快捷方式**：可选创建桌面图标
- **开始菜单**：自动创建程序组
- **完整卸载**：清理所有相关文件

### 📁 安装内容

- 主程序：`Nekolinic.exe`
- 运行时库：`_internal\` 目录下的所有依赖
- 前端文件：`frontend\` 目录
- 配置文件：`alembic.ini`、`requirements.txt`

### 🔧 安装选项

- **安装路径**：默认 `C:\Program Files\Nekolinic\`
- **桌面图标**：可选（默认不创建）
- **快速启动**：可选（仅 Windows 7 以下）
- **安装后启动**：可选

## 自定义配置

### 修改安装程序信息

编辑 `setup.iss` 文件中的 `[Setup]` 部分：

```ini
[Setup]
AppName=您的应用名称
AppVersion=您的版本号
AppPublisher=您的公司名称
AppPublisherURL=您的网站
```

### 修改图标

替换 `frontend\assets\icons\app.ico` 文件，或修改 `setup.iss` 中的图标路径：

```ini
SetupIconFile=您的图标路径\app.ico
```

### 添加许可协议

1. 创建 `LICENSE.txt` 文件
2. 在 `setup.iss` 中取消注释并设置：

```ini
LicenseFile=LICENSE.txt
```

## 分发安装程序

### 📦 生成的文件

构建完成后，您将在 `installer\` 目录下找到：

- `Nekolinic-Setup-valpha0.1.3.exe` - 安装程序

### 🚀 分发建议

1. **重命名**：可以重命名为更友好的名称，如 `Nekolinic医疗管理系统安装程序.exe`
2. **数字签名**：建议对安装程序进行数字签名以提高信任度
3. **病毒扫描**：分发前进行病毒扫描确保安全
4. **测试安装**：在干净的系统上测试安装过程

## 用户安装指南

### 系统要求

- **操作系统**：Windows 7 SP1 或更高版本
- **架构**：64位系统
- **权限**：管理员权限（安装时）
- **磁盘空间**：至少 200MB 可用空间

### 安装步骤

1. 以管理员身份运行安装程序
2. 选择安装语言（中文/英文）
3. 阅读并接受许可协议（如有）
4. 选择安装路径
5. 选择附加任务（桌面图标等）
6. 开始安装
7. 完成安装

### 卸载程序

- **控制面板**：通过 "程序和功能" 卸载
- **开始菜单**：使用程序组中的卸载快捷方式

## 故障排除

### 常见问题

**Q: 提示 "未找到 Inno Setup 6"**
A: 请确保 Inno Setup 安装在默认路径，或修改 `build_installer.bat` 中的路径

**Q: 编译失败**
A: 检查 `dist\Nekolinic\` 目录是否存在且包含完整文件

**Q: 安装程序无法运行**
A: 确保以管理员权限运行，检查系统兼容性

**Q: 安装后程序无法启动**
A: 检查 Windows Defender 或杀毒软件是否误报

### 调试模式

如需调试安装过程，可以在命令行中运行：

```cmd
Nekolinic-Setup-valpha0.1.3.exe /LOG="install.log"
```

这将生成详细的安装日志文件。

## 高级配置

### 静默安装

支持静默安装模式：

```cmd
Nekolinic-Setup-valpha0.1.3.exe /SILENT /DIR="C:\MyPath\Nekolinic"
```

### 企业部署

对于企业环境，可以使用组策略或部署工具进行批量安装：

```cmd
Nekolinic-Setup-valpha0.1.3.exe /VERYSILENT /NORESTART /SUPPRESSMSGBOXES
```

---

## 技术支持

如果您在制作或使用安装程序时遇到问题，请联系开发者获取支持。

**版本**：alpha0.1.3  
**更新日期**：2025年1月  
**开发者**：moeyukisako