from sqlalchemy.orm import Session
from . import schemas, service
from app.core.database import SessionLocal

def init_admin_user():
    """创建管理员用户，如果不存在"""
    db = SessionLocal()
    try:
        # 检查admin用户是否已存在
        existing_user = service.user_service.get_by_attributes(db, username="admin")
        if existing_user:
            print("管理员用户已存在，无需初始化")
            return
            
        # 创建管理员账号
        admin_data = schemas.UserCreate(
            username="admin",
            email="admin@nekolinic.com",
            password="password",  # 简单密码用于测试
            full_name="系统管理员",
            role="admin"
        )
        
        admin = service.user_service.create(db, obj_in=admin_data)
        print(f"管理员用户创建成功: {admin.username}")
        
        # 创建普通测试用户
        user_data = schemas.UserCreate(
            username="doctor",
            email="doctor@nekolinic.com", 
            password="password",  # 简单密码用于测试
            full_name="测试医生",
            role="doctor"
        )
        
        user = service.user_service.create(db, obj_in=user_data)
        print(f"测试用户创建成功: {user.username}")
        
    except Exception as e:
        print(f"初始化用户出错: {e}")
    finally:
        db.close() 