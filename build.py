#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目打包脚本
使用PyInstaller将项目打包为可执行文件
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def install_pyinstaller():
    """安装PyInstaller"""
    try:
        import PyInstaller
        print("PyInstaller已安装")
    except ImportError:
        print("正在安装PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("PyInstaller安装完成")

def create_spec_file():
    """创建PyInstaller规格文件"""
    spec_content = '''
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['start_silent.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend', 'frontend'),
        ('app', 'app'),
        ('alembic', 'alembic'),
        ('alembic.ini', '.'),
        ('requirements.txt', '.'),
    ],
    hiddenimports=[
        'uvicorn',
        'sqlalchemy',
        'fastapi',
        'pydantic',
        'alembic',
        'reportlab',
        'qrcode',
        'passlib',
        'jose',
        'bcrypt',
        'app.user.models',
        'app.clinic.models',
        'app.patient.models',
        'app.pharmacy.models',
        'app.finance.models',
        'app.reports.models',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Nekolinic',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='frontend/assets/icons/app.ico' if os.path.exists('frontend/assets/icons/app.ico') else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Nekolinic',
)
'''
    
    with open('Nekolinic.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    print("已创建PyInstaller规格文件: Nekolinic.spec")

def build_executable():
    """构建可执行文件"""
    print("正在构建可执行文件...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "PyInstaller", 
            "--clean",
            "Nekolinic.spec"
        ])
        print("构建完成！")
        print("可执行文件位置: dist/Nekolinic/")
    except subprocess.CalledProcessError as e:
        print(f"构建失败: {e}")
        return False
    return True

def create_readme():
    """创建README文件"""
    readme_content = '''
# Nekolinic 医疗管理系统

版本: alpha0.1.3

## 使用说明

### Windows用户
1. 双击 `start.bat` 启动系统
2. 或者运行 `Nekolinic.exe`（如果已打包）

### Linux/macOS用户
1. 在终端中运行: `./start.sh`
2. 或者运行: `python3 start_silent.py`

### 访问系统
- 前端页面: http://localhost:8000/index.html
- 管理面板: http://localhost:8000/dashboard.html

### 默认登录信息
- 用户名: admin
- 密码: password

### 系统要求
- Python 3.8+
- 所需依赖包（自动安装）

### 功能特性
- 自动数据库初始化
- 静默启动模式
- 多语言支持（中文/英文/日文）
- 完整的医疗管理功能

### 技术支持
如有问题，请联系开发者。

Copyright moeyukisako 2025.
'''
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("已创建README.md文件")

def main():
    """主函数"""
    print("Nekolinic 项目打包工具")
    print("版本: alpha0.1.3")
    print("="*40)
    
    # 检查当前目录
    if not os.path.exists('start_silent.py'):
        print("错误: 请在项目根目录运行此脚本")
        sys.exit(1)
    
    # 安装PyInstaller
    install_pyinstaller()
    
    # 创建规格文件
    create_spec_file()
    
    # 构建可执行文件
    if build_executable():
        print("\n打包成功！")
        print("可执行文件位于: dist/Nekolinic/")
    else:
        print("\n打包失败！")
        sys.exit(1)
    
    # 创建README
    create_readme()
    
    print("\n打包完成！")
    print("您可以将 dist/Nekolinic/ 目录分发给用户")

if __name__ == "__main__":
    main()