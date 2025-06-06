import uvicorn
import webbrowser
import threading
import time
import os
from app.app import app

def open_browser():
    """在应用启动后打开浏览器"""
    time.sleep(1)  # 等待服务器启动
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    # 检查前端目录是否存在
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    print(f"前端目录路径: {frontend_dir}")
    print(f"前端目录是否存在: {os.path.exists(frontend_dir)}")
    if os.path.exists(frontend_dir):
        files = os.listdir(frontend_dir)
        print(f"前端目录中的文件: {files}")
    
    # 启动一个线程来打开浏览器
    threading.Thread(target=open_browser).start()
    # 启动服务器
    uvicorn.run(app, host="0.0.0.0", port=8000) 