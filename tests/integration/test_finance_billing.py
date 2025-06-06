import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date

from app.finance import models, schemas, service
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.user.models import User
from app.core.context import current_user_id

@pytest.fixture
def test_patient(db: Session):
    """创建测试患者"""
    patient = patient_models.Patient(
        name="Test Patient",
        gender="male",
        birth_date=date(1990, 1, 1),
        phone="1234567890",
        email="patient@test.com",
        address="Test Address"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@pytest.fixture
def test_doctor(db: Session):
    """创建测试医生"""
    doctor = clinic_models.Doctor(
        name="Test Doctor",
        specialty="General",
        user_id=1  # 假设用户ID为1
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@pytest.fixture
def test_medical_record(db: Session, test_patient, test_doctor):
    """创建测试病历"""
    record = patient_models.MedicalRecord(
        patient_id=test_patient.id,
        doctor_id=test_doctor.id,
        symptoms="Test symptoms",
        diagnosis="Test diagnosis",
        treatment_plan="Test treatment",
        notes="Test notes",
        record_date=datetime(2023, 1, 1)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def test_generate_bill_from_medical_record(client: TestClient, db: Session, test_medical_record, admin_user: User):
    """测试根据病历生成账单"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 生成账单
    response = client.post(
        f"/api/v1/finance/billing/generate-from-record/{test_medical_record.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    bill = response.json()
    
    # 验证账单数据
    assert bill["patient_id"] == test_medical_record.patient_id
    assert bill["medical_record_id"] == test_medical_record.id
    assert bill["status"] == "unpaid"
    assert Decimal(bill["total_amount"]) > 0

def test_get_bill_details(client: TestClient, db: Session, test_medical_record, admin_user: User):
    """测试获取账单详情"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 先生成账单
    bill_response = client.post(
        f"/api/v1/finance/billing/generate-from-record/{test_medical_record.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bill_response.status_code == 200
    bill_id = bill_response.json()["id"]
    
    # 获取账单详情
    response = client.get(
        f"/api/v1/finance/bills/{bill_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    bill_detail = response.json()
    
    # 验证详情数据
    assert bill_detail["id"] == bill_id
    assert "items" in bill_detail
    assert len(bill_detail["items"]) > 0
    assert bill_detail["items"][0]["item_type"] == "consultation"

def test_void_bill(client: TestClient, db: Session, test_medical_record, admin_user: User):
    """测试作废账单"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 先生成账单
    bill_response = client.post(
        f"/api/v1/finance/billing/generate-from-record/{test_medical_record.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bill_response.status_code == 200
    bill_id = bill_response.json()["id"]
    
    # 作废账单
    response = client.post(
        f"/api/v1/finance/bills/{bill_id}/void",
        json={"reason": "测试作废"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    
    # 验证账单状态已更新
    bill_check = client.get(
        f"/api/v1/finance/bills/{bill_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bill_check.status_code == 200
    assert bill_check.json()["status"] == "void"

def test_get_patient_bills(client: TestClient, db: Session, test_patient, test_medical_record, admin_user: User):
    """测试获取患者的所有账单"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 先生成账单
    client.post(
        f"/api/v1/finance/billing/generate-from-record/{test_medical_record.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # 获取患者账单
    response = client.get(
        f"/api/v1/finance/bills?patient_id={test_patient.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    bills = response.json()
    
    # 验证账单列表
    assert len(bills) > 0
    assert bills[0]["patient_id"] == test_patient.id 