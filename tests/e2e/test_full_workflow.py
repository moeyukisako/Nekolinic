import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from app.user.models import User
import json
import random
import string
from datetime import datetime, timedelta, UTC

def generate_random_string(length=8):
    """生成随机字符串"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def test_full_workflow(client: TestClient, db: Session, test_user: User):
    """测试从预约到支付的完整工作流程"""
    
    # 1. 用户登录，获取token
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": test_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # 2. 创建医生
    doctor_data = {
        "name": f"Dr. {generate_random_string()}",
        "specialty": "General Medicine",
        "user_id": test_user.id
    }
    doctor_response = client.post(
        "/api/v1/clinic/doctors/",
        json=doctor_data,
        headers=auth_headers
    )
    assert doctor_response.status_code == 200
    doctor = doctor_response.json()
    
    # 3. 创建患者
    patient_data = {
        "name": f"Patient {generate_random_string()}",
        "gender": "male",
        "birth_date": "1990-01-01",
        "phone": "0987654321",
        "email": f"{generate_random_string()}@example.com",
        "address": "Test Address"
    }
    patient_response = client.post(
        "/api/v1/patients/",
        json=patient_data,
        headers=auth_headers
    )
    assert patient_response.status_code == 200
    patient = patient_response.json()
    
    # 4. 创建预约
    tomorrow = (datetime.now(UTC) + timedelta(days=1)).strftime("%Y-%m-%d")
    appointment_data = {
        "patient_id": patient["id"],
        "doctor_id": doctor["id"],
        "appointment_time": f"{tomorrow}T10:00:00",
        "status": "scheduled",
        "reason": "Regular checkup"
    }
    appointment_response = client.post(
        "/api/v1/clinic/appointments/",
        json=appointment_data,
        headers=auth_headers
    )
    assert appointment_response.status_code == 200
    appointment = appointment_response.json()
    
    # 5. 创建病历
    medical_record_data = {
        "patient_id": patient["id"],
        "doctor_id": doctor["id"],
        "record_date": datetime.now(UTC).isoformat(),
        "symptoms": "Fever, cough",
        "diagnosis": "Common cold",
        "treatment_plan": "Rest, fluids",
        "notes": "Patient should return if symptoms worsen"
    }
    medical_record_response = client.post(
        f"/api/v1/patients/{patient['id']}/medical-records/",
        json=medical_record_data,
        headers=auth_headers
    )
    assert medical_record_response.status_code == 200
    medical_record = medical_record_response.json()
    
    # 6. 创建药品
    drug_data = {
        "name": f"Drug {generate_random_string()}",
        "description": "Test drug",
        "specification": "100mg",
        "manufacturer": "Test Manufacturer",
        "unit_price": 10.00,
        "unit": "片",
        "code": f"CODE-{generate_random_string()}"
    }
    drug_response = client.post(
        "/api/v1/pharmacy/drugs/",
        json=drug_data,
        headers=auth_headers
    )
    assert drug_response.status_code == 200
    drug = drug_response.json()
    
    # 6c. 药品入库
    stock_in_data = {
        "drug_id": drug["id"],
        "quantity": 100,
        "notes": "Initial stock"
    }
    stock_in_response = client.post(
        "/api/v1/pharmacy/inventory/stock-in",
        json=stock_in_data,
        headers=auth_headers
    )
    assert stock_in_response.status_code == 200
    
    # 7. 创建处方
    prescription_data = {
        "medical_record_id": medical_record["id"],
        "prescription_date": datetime.now(UTC).isoformat(),
        "doctor_id": doctor["id"],
        "notes": "Take as directed",
        "details": [
            {
                "drug_id": drug["id"],
                "quantity": 10,
                "dosage": "1 tablet, 3 times daily",
                "frequency": "TID",
                "days": 7,
                "notes": "After meals"
            }
        ]
    }
    prescription_response = client.post(
        "/api/v1/pharmacy/prescriptions/",
        json=prescription_data,
        headers=auth_headers
    )
    assert prescription_response.status_code == 200
    prescription = prescription_response.json()
    
    # 8. 发药
    dispense_data = {
        "prescription_id": prescription["id"],
        "notes": "Dispensed to patient"
    }
    dispense_response = client.post(
        "/api/v1/pharmacy/inventory/dispense",
        json=dispense_data,
        headers=auth_headers
    )
    assert dispense_response.status_code == 200
    
    # 9. 生成账单
    bill_response = client.post(
        f"/api/v1/finance/billing/generate-from-record/{medical_record['id']}",
        headers=auth_headers
    )
    assert bill_response.status_code == 200
    bill = bill_response.json()
    assert float(bill["total_amount"]) > 0
    
    # 10. 支付账单
    payment_data = {
        "amount": float(bill["total_amount"]),
        "payment_method": "cash"
    }
    payment_response = client.post(
        f"/api/v1/finance/bills/{bill['id']}/payments",
        json=payment_data,
        headers=auth_headers
    )
    assert payment_response.status_code == 200
    
    # 11. 验证账单状态为已支付
    bill_check_response = client.get(
        f"/api/v1/finance/bills/{bill['id']}",
        headers=auth_headers
    )
    assert bill_check_response.status_code == 200
    updated_bill = bill_check_response.json()
    assert updated_bill["status"] == "paid"
    
    # 验证药品库存已减少
    stock_response = client.get(
        f"/api/v1/pharmacy/inventory/drugs/{drug['id']}/stock",
        headers=auth_headers
    )
    assert stock_response.status_code == 200
    stock_data = stock_response.json()
    assert stock_data["current_stock"] == 90  # 初始100减去10