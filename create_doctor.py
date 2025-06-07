from sqlalchemy.orm import Session
from app.user import schemas, service
from app.clinic import schemas as clinic_schemas
from app.clinic import service as clinic_service
from app.core.database import SessionLocal

def create_temporary_doctor():
    """创建一个临时的医生用户和对应的医生身份"""
    db = SessionLocal()
    try:
        # 检查是否已存在同名用户
        existing_user = service.user_service.get_by_attributes(db, username="temp_doctor")
        if existing_user:
            print(f"临时医生用户已存在，ID: {existing_user.id}")
            if hasattr(existing_user, 'doctor') and existing_user.doctor:
                print(f"医生身份 ID: {existing_user.doctor.id}")
            return
            
        # 创建临时医生用户
        doctor_data = schemas.UserCreate(
            username="temp_doctor",
            email="temp_doctor@nekolinic.com",
            password="password",  # 简单密码用于测试
            full_name="临时测试医生",
            role="doctor"
        )
        
        user = service.user_service.create(db, obj_in=doctor_data)
        print(f"临时医生用户创建成功: {user.username}, ID: {user.id}")
        
        # 检查默认诊所是否存在
        default_clinic = clinic_service.clinic_service.get(db, id=1)
        if not default_clinic:
            print("默认诊所不存在，创建中...")
            clinic_in = clinic_schemas.ClinicCreate(
                name="Nekolinic 总院", 
                address="互联网", 
                contact_number="010-88888888"
            )
            default_clinic = clinic_service.clinic_service.create(db, obj_in=clinic_in)
        
        # 为临时医生创建医生身份
        doctor_in = clinic_schemas.DoctorCreate(
            name=user.full_name,
            specialty="临床医学", 
            user_id=user.id,
            clinic_id=default_clinic.id
        )
        doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
        print(f"已为临时医生创建医生身份，ID: {doctor.id}")
        
    except Exception as e:
        print(f"创建临时医生出错: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_temporary_doctor() 