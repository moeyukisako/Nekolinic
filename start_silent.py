#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静默启动脚本
自动初始化数据库并启动服务器，无浏览器弹出
"""

import os
import sys
import uvicorn
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

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
            from app.user.init_data import init_default_users
            init_default_users()
            print("默认用户数据初始化完成")
        except Exception as e:
            print(f"初始化默认用户数据时出错: {e}")
            
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    print("Nekolinic 医疗管理系统 - 静默启动模式")
    print("版本: alpha0.1.3")
    print("="*50)
    
    # 初始化数据库
    init_database()
    
    # 检查前端目录
    frontend_dir = project_root / "frontend"
    if not frontend_dir.exists():
        print(f"警告: 前端目录不存在 - {frontend_dir}")
    else:
        print(f"前端目录: {frontend_dir}")
    
    # 启动服务器
    print("正在启动服务器...")
    print("服务器地址: http://localhost:8000")
    print("前端访问: http://localhost:8000/index.html")
    print("管理面板: http://localhost:8000/dashboard.html")
    print("按 Ctrl+C 停止服务器")
    print("="*50)
    
    try:
        from app.app import app
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"启动服务器时出错: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()