@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Nekolinic 医疗管理系统启动器
echo 版本: alpha0.1.3
echo ================================
echo.
echo 正在检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请确保已安装Python 3.8+
    pause
    exit /b 1
)

echo 正在检查依赖包...
python -c "import uvicorn, sqlalchemy, fastapi" >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
)

echo 正在启动系统...
python start_silent.py
pause