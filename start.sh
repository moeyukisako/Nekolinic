#!/bin/bash

# Nekolinic 医疗管理系统启动器
# 版本: alpha0.1.3

set -e

echo "Nekolinic 医疗管理系统启动器"
echo "版本: alpha0.1.3"
echo "================================"
echo

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查Python环境
echo "正在检查Python环境..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "错误: 未找到Python，请确保已安装Python 3.8+"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# 检查Python版本
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
echo "Python版本: $PYTHON_VERSION"

# 检查依赖包
echo "正在检查依赖包..."
if ! $PYTHON_CMD -c "import uvicorn, sqlalchemy, fastapi" &> /dev/null; then
    echo "正在安装依赖包..."
    $PYTHON_CMD -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "错误: 依赖包安装失败"
        exit 1
    fi
fi

# 设置权限
chmod +x start_silent.py

echo "正在启动系统..."
$PYTHON_CMD start_silent.py