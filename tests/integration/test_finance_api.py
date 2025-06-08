import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from app.finance import models, schemas
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.pharmacy import models as pharmacy_models
from app.user.models import User
from app.core.context import current_user_id
from datetime import date, datetime

@pytest.fixture
def test_patient(db: Session):
    """创建测试患者"""
    patient = patient_models.Patient(
        name="Test Patient",
        gender="male",
        birth_date=date(1990, 1, 1),
        contact_number="1234567890",
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

@pytest.fixture
def test_bill(db: Session, test_patient, test_medical_record, admin_user: User):
    """创建测试账单"""
    # 设置当前用户上下文
    token = current_user_id.set(admin_user.id)
    
    try:
        # 创建账单
        test_date = datetime(2023, 1, 1)
        bill = models.Bill(
            invoice_number="TEST-INVOICE-001",
            bill_date=test_date,
            total_amount=Decimal("100.00"),
            status="unpaid",
            patient_id=test_patient.id,
            medical_record_id=test_medical_record.id,
            created_at=test_date,
            updated_at=test_date,
            created_by_id=admin_user.id,
            updated_by_id=admin_user.id
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        # 创建账单明细
        bill_item = models.BillItem(
            item_name="Test Item",
            item_type="consultation",
            quantity=1,
            unit_price=Decimal("100.00"),
            subtotal=Decimal("100.00"),
            bill_id=bill.id,
            created_at=test_date,
            updated_at=test_date,
            created_by_id=admin_user.id,
            updated_by_id=admin_user.id
        )
        db.add(bill_item)
        db.commit()
        db.refresh(bill_item)
        
        return bill
    finally:
        # 重置上下文
        if token:
            current_user_id.reset(token)

def test_overpay_bill_fails(client: TestClient, db: Session, test_bill, admin_user: User):
    """测试支付金额超过账单总额的情况"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 尝试支付超过账单总额的金额
    response = client.post(
        f"/api/v1/finance/bills/{test_bill.id}/payments",
        json={"amount": 120, "payment_method": "cash"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 400
    assert "超过了剩余未付金额" in response.json()["detail"]

def test_exact_payment_succeeds(client: TestClient, db: Session, test_bill, admin_user: User):
    """测试支付金额恰好等于账单总额的情况"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 支付等于账单总额的金额
    response = client.post(
        f"/api/v1/finance/bills/{test_bill.id}/payments",
        json={"amount": 100, "payment_method": "cash"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    payment = response.json()
    assert payment["amount"] == "100.00"
    
    # 验证账单状态已更新为已支付
    bill_response = client.get(
        f"/api/v1/finance/bills/{test_bill.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bill_response.status_code == 200
    assert bill_response.json()["status"] == "paid"

def test_partial_payment_updates_status(client: TestClient, db: Session, test_bill, admin_user: User):
    """测试部分支付后账单状态的更新"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": admin_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 进行部分支付
    response = client.post(
        f"/api/v1/finance/bills/{test_bill.id}/payments",
        json={"amount": 50, "payment_method": "cash"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    payment = response.json()
    assert payment["amount"] == "50.00"
    
    # 验证账单状态已更新为部分支付
    bill_response = client.get(
        f"/api/v1/finance/bills/{test_bill.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bill_response.status_code == 200
    assert bill_response.json()["status"] == "partially_paid"