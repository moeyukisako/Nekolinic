from sqlalchemy.orm import Session
from . import schemas, service
from app.core.database import SessionLocal
from app.core.config import settings

# --- 新增的 import ---
from app.clinic import service as clinic_service
from app.clinic import schemas as clinic_schemas
# --- 结束 ---

from app.user import service as user_service
from app.user import schemas as user_schemas

def init_admin_user():
    """创建管理员用户，如果不存在"""
    db = SessionLocal()
    try:
        # 检查admin用户是否已存在
        existing_user = service.user_service.get_by_attributes(db, username="admin")
        if existing_user:
            print("管理员用户已存在，无需初始化")
            
            # 即使用户已存在，也要检查是否有关联的医生身份，如果没有则创建
            if not hasattr(existing_user, 'doctor') or existing_user.doctor is None:
                print("为管理员用户创建医生身份...")
                
                # 检查并创建默认诊所
                default_clinic = clinic_service.clinic_service.get(db, id=1)
                if not default_clinic:
                    clinic_in = clinic_schemas.ClinicCreate(
                        name="Nekolinic 总院", 
                        address="互联网", 
                        contact_number="010-88888888"
                    )
                    default_clinic = clinic_service.clinic_service.create(db, obj_in=clinic_in)
                    
                # 创建医生身份
                doctor_in = clinic_schemas.DoctorCreate(
                    name=existing_user.username,
                    specialty="系统管理", 
                    user_id=existing_user.id
                )
                admin_doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
                print(f"已为管理员用户创建医生身份，ID: {admin_doctor.id}")
            
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
        
        # 检查并创建默认诊所
        default_clinic = clinic_service.clinic_service.get(db, id=1)
        if not default_clinic:
            clinic_in = clinic_schemas.ClinicCreate(
                name="Nekolinic 总院", 
                address="互联网", 
                contact_number="010-88888888"
            )
            default_clinic = clinic_service.clinic_service.create(db, obj_in=clinic_in)
        
        # 为管理员创建医生身份
        doctor_in = clinic_schemas.DoctorCreate(
            name=admin.username,
            specialty="系统管理", 
            user_id=admin.id
        )
        admin_doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
        print(f"已为管理员用户创建医生身份，ID: {admin_doctor.id}")
        
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
        
        # 为测试医生创建医生身份
        doctor_in = clinic_schemas.DoctorCreate(
            name=user.username,
            specialty="全科医学", 
            user_id=user.id
        )
        doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
        print(f"已为测试医生创建医生身份，ID: {doctor.id}")
        
    except Exception as e:
        print(f"初始化用户出错: {e}")
    finally:
        db.close() 

def init_db(db: Session) -> None:
    """
    初始化数据库，创建超级用户，并为其配置关联的诊所和医生身份。
    """
    # 检查超级用户是否存在
    user = user_service.get_by_email(db, email=settings.FIRST_SUPERUSER)
    
    # 只有在用户不存在时，才执行初始化
    if not user:
        print("Superuser not found. Starting initial data setup...")
        
        # 1. 创建超级用户
        user_in = user_schemas.UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = user_service.create(db, obj_in=user_in)
        print(f"Superuser '{user.email}' created successfully.")

        # 2. 检查并创建默认诊所
        # 在一个干净的数据库中，这将是第一个诊所，ID会自动设为1
        default_clinic = clinic_service.clinic_service.get(db, id=1)
        if not default_clinic:
            print("Default clinic not found. Creating one...")
            clinic_in = clinic_schemas.ClinicCreate(
                name="Nekolinic 总院", 
                address="互联网", 
                contact_number="010-88888888"
            )
            default_clinic = clinic_service.clinic_service.create(db, obj_in=clinic_in)
            print(f"Default clinic '{default_clinic.name}' created with ID {default_clinic.id}.")

        # 3. 为新创建的超级用户创建关联的医生档案
        # 在一个干净的数据库中，这将是第一个医生，ID会自动设为1
        print(f"Creating doctor profile for user '{user.email}'...")
        doctor_in = clinic_schemas.DoctorCreate(
            name=user.email.split('@')[0], # 使用 "admin" 作为名字
            specialty="系统管理", 
            clinic_id=default_clinic.id,  # 关联到ID为1的诊所
            user_id=user.id               # 关联到当前创建的超级用户
        )
        admin_doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
        print(f"Doctor profile '{admin_doctor.name}' created with ID {admin_doctor.id} and linked to user.")
        
        print("Initial data setup complete.")
    else:
        print("Superuser already exists. Skipping initial data setup.") 