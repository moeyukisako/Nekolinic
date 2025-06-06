import pytest
from datetime import date
from sqlalchemy.orm import Session
from app.patient.models import Patient
from app.patient.schemas import PatientCreate, PatientUpdate
from app.patient.service import patient_service

def test_create_patient(db: Session):
    """测试创建患者功能"""
    patient_in = PatientCreate(
        name="测试患者",
        birth_date=date(1990, 1, 1),
        gender="男",
        phone="13800138000",
        address="测试地址",
    )
    patient = patient_service.create(db, obj_in=patient_in)
    
    assert patient.id is not None
    assert patient.name == "测试患者"
    assert patient.birth_date == date(1990, 1, 1)
    assert patient.gender == "男"
    assert patient.phone == "13800138000"
    assert patient.address == "测试地址"

def test_get_patient(db: Session):
    """测试获取患者信息"""
    # 先创建一个患者
    patient_in = PatientCreate(
        name="测试患者2",
        birth_date=date(1992, 2, 2),
        gender="女",
        phone="13900139000",
        address="测试地址2",
    )
    created_patient = patient_service.create(db, obj_in=patient_in)
    
    # 获取该患者
    patient = patient_service.get(db, id=created_patient.id)
    
    assert patient is not None
    assert patient.name == "测试患者2"
    assert patient.birth_date == date(1992, 2, 2)
    assert patient.gender == "女"
    assert patient.phone == "13900139000"
    assert patient.address == "测试地址2"

def test_search_patients(db: Session):
    """测试搜索患者功能"""
    # 创建多个患者
    patient1_in = PatientCreate(name="张三", gender="男")
    patient2_in = PatientCreate(name="李四", gender="男")
    patient3_in = PatientCreate(name="王五", gender="男")
    
    patient_service.create(db, obj_in=patient1_in)
    patient_service.create(db, obj_in=patient2_in)
    patient_service.create(db, obj_in=patient3_in)
    
    # 搜索名字中包含"张"的患者
    patients = patient_service.search_patients(db, name="张")
    
    assert len(patients) == 1
    assert patients[0].name == "张三"
    
    # 搜索所有患者
    all_patients = patient_service.search_patients(db)
    assert len(all_patients) >= 3

def test_update_patient(db: Session):
    """测试更新患者信息"""
    # 先创建一个患者
    patient_in = PatientCreate(
        name="旧名称",
        phone="旧电话",
    )
    patient = patient_service.create(db, obj_in=patient_in)
    
    # 更新患者信息
    patient_update = PatientUpdate(
        name="新名称",
        phone="新电话",
    )
    updated_patient = patient_service.update(db, db_obj=patient, obj_in=patient_update)
    
    assert updated_patient.id == patient.id
    assert updated_patient.name == "新名称"
    assert updated_patient.phone == "新电话"

def test_delete_patient(db: Session):
    """测试删除患者"""
    # 先创建一个患者
    patient_in = PatientCreate(
        name="要删除的患者",
    )
    patient = patient_service.create(db, obj_in=patient_in)
    
    # 删除该患者
    deleted_patient = patient_service.remove(db, id=patient.id)
    
    assert deleted_patient.id == patient.id
    assert deleted_patient.name == patient.name
    
    # 确认已被标记为删除
    patient = patient_service.get(db, id=patient.id)
    assert patient is None 