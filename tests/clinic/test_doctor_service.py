import pytest
from sqlalchemy.orm import Session
from app.clinic.models import Doctor
from app.clinic.schemas import DoctorCreate, DoctorUpdate
from app.clinic.service import doctor_service

def test_create_doctor(db: Session):
    """测试创建医生功能"""
    doctor_in = DoctorCreate(
        name="测试医生",
        specialty="内科",
        user_id=1,
    )
    doctor = doctor_service.create(db, obj_in=doctor_in)
    
    assert doctor.id is not None
    assert doctor.name == "测试医生"
    assert doctor.specialty == "内科"
    assert doctor.user_id == 1

def test_get_doctor(db: Session):
    """测试获取医生信息"""
    # 先创建一个医生
    doctor_in = DoctorCreate(
        name="测试医生2",
        specialty="外科",
        user_id=2,
    )
    created_doctor = doctor_service.create(db, obj_in=doctor_in)
    
    # 获取该医生
    doctor = doctor_service.get(db, id=created_doctor.id)
    
    assert doctor is not None
    assert doctor.name == "测试医生2"
    assert doctor.specialty == "外科"
    assert doctor.user_id == 2

def test_get_by_user_id(db: Session):
    """测试通过用户ID获取医生信息"""
    # 先创建一个医生
    doctor_in = DoctorCreate(
        name="测试医生3",
        specialty="骨科",
        user_id=3,
    )
    doctor_service.create(db, obj_in=doctor_in)
    
    # 通过用户ID获取该医生
    doctor = doctor_service.get_by_user_id(db, user_id=3)
    
    assert doctor is not None
    assert doctor.name == "测试医生3"
    assert doctor.specialty == "骨科"
    assert doctor.user_id == 3

def test_update_doctor(db: Session):
    """测试更新医生信息"""
    # 先创建一个医生
    doctor_in = DoctorCreate(
        name="旧名称",
        specialty="旧科室",
        user_id=4,
    )
    doctor = doctor_service.create(db, obj_in=doctor_in)
    
    # 更新医生信息
    doctor_update = DoctorUpdate(
        name="新名称",
        specialty="新科室",
    )
    updated_doctor = doctor_service.update(db, db_obj=doctor, obj_in=doctor_update)
    
    assert updated_doctor.id == doctor.id
    assert updated_doctor.name == "新名称"
    assert updated_doctor.specialty == "新科室"
    assert updated_doctor.user_id == 4  # 用户ID应保持不变

def test_delete_doctor(db: Session):
    """测试删除医生"""
    # 先创建一个医生
    doctor_in = DoctorCreate(
        name="要删除的医生",
        specialty="科室",
        user_id=5,
    )
    doctor = doctor_service.create(db, obj_in=doctor_in)
    
    # 删除该医生
    deleted_doctor = doctor_service.remove(db, id=doctor.id)
    
    assert deleted_doctor.id == doctor.id
    assert deleted_doctor.name == doctor.name
    
    # 确认已被标记为删除（而非真正从数据库中删除）
    doctor = doctor_service.get(db, id=doctor.id)
    assert doctor is None 