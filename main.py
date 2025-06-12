import uvicorn
import webbrowser
import threading
import time
import os
import sys
import uvicorn
from app.app import app

def open_browser():
    """在应用启动后打开浏览器"""
    time.sleep(1)  # 等待服务器启动
    # 始终打开 index.html
    webbrowser.open("http://localhost:8000/index.html")

def init_database():
    """初始化数据库"""
    try:
        print("正在初始化数据库...")
        from app.core.database import Base, engine
        
        # 导入所有模型以确保它们被注册到Base
        from app.user import models as user_models
        from app.clinic import models as clinic_models
        from app.patient import models as patient_models
        from app.pharmacy import models as pharmacy_models
        from app.finance import models as finance_models
        from app.reports import models as reports_models
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("数据库初始化完成")
        
        # 初始化默认用户数据
        try:
            from app.user.init_data import init_admin_user
            init_admin_user()
            print("默认用户数据初始化完成")
        except Exception as e:
            print(f"初始化默认用户数据时出错: {e}")
            
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 检查命令行参数
    silent_mode = '--silent' in sys.argv or '-s' in sys.argv
    
    print("Nekolinic 医疗管理系统")
    print("版本: alpha0.1.3")
    print("="*40)
    
    # 初始化数据库
    init_database()
    
    # 检查前端目录是否存在
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    print(f"前端目录路径: {frontend_dir}")
    print(f"前端目录是否存在: {os.path.exists(frontend_dir)}")
    if os.path.exists(frontend_dir):
        files = os.listdir(frontend_dir)
        print(f"前端目录中的文件数量: {len(files)}")
    
    if not silent_mode:
        # 启动一个线程来打开浏览器
        threading.Thread(target=open_browser).start()
        print("浏览器将自动打开...")
    else:
        print("静默模式启动，不会打开浏览器")
        print("访问地址: http://localhost:8000/index.html")
    
    print("正在启动服务器...")
    print("按 Ctrl+C 停止服务器")
    print("="*40)
    
    # 启动服务器
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        print("\n服务器已停止")