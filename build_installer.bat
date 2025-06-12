@echo off
chcp 65001 >nul
echo ====================================
echo Nekolinic 安装程序构建工具
echo 版本: alpha0.1.3
echo ====================================
echo.

REM 检查 Inno Setup 是否已安装
set "INNO_SETUP_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist "%INNO_SETUP_PATH%" (
    echo 错误: 未找到 Inno Setup 6
    echo 请先下载并安装 Inno Setup 6: https://jrsoftware.org/isdl.php
    echo 安装路径应为: %INNO_SETUP_PATH%
    echo.
    pause
    exit /b 1
)

REM 检查打包文件是否存在
if not exist "dist\Nekolinic\Nekolinic.exe" (
    echo 错误: 未找到打包后的可执行文件
    echo 请先运行 build.py 进行打包
    echo.
    pause
    exit /b 1
)

REM 创建安装程序输出目录
if not exist "installer" mkdir installer

echo 正在构建安装程序...
echo.

REM 使用 Inno Setup 编译安装程序
"%INNO_SETUP_PATH%" "setup.iss"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo 安装程序构建成功！
    echo ====================================
    echo 安装程序位置: installer\Nekolinic-Setup-valpha0.1.3.exe
    echo.
    echo 您现在可以将安装程序分发给用户了。
    echo 用户运行安装程序后，程序将被安装到系统中。
    echo.
) else (
    echo.
    echo ====================================
    echo 安装程序构建失败！
    echo ====================================
    echo 请检查错误信息并重试。
    echo.
)

pause