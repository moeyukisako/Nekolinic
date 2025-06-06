import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import status
from fastapi.testclient import TestClient
import json

from app.user.models import User
from app.user.schemas import UserCreate
from app.user.service import user_service
from app.clinic.models import Doctor, AppointmentStatus
from app.clinic.schemas import DoctorCreate
from app.clinic.service import doctor_service
from app.patient.models import Patient, MedicalRecord, VitalSign
from app.patient.schemas import PatientCreate
from app.patient.service import patient_service

def test_clinical_workflow(client: TestClient, db: Session):
    """
    测试完整的临床工作流程:
    1. 创建一个医生
    2. 创建一个患者
    3. 为他们创建一个预约
    4. 基于该预约创建一个病历
    5. 为该病历添加生命体征
    6. 验证所有数据关联是否正确
    """
    # 1. 创建一个用户（医生的基础账号）
    user_data = {
        "username": "doctoruser",
        "email": "doctor@example.com",
        "password": "password123",
        "full_name": "医生账户",
        "role": "doctor"
    }
    user_response = client.post("/api/v1/users/", json=user_data)
    assert user_response.status_code == 200
    user_id = user_response.json()["id"]
    
    # 登录并获取token
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": "doctoruser", "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. 创建一个医生
    doctor_data = {
        "name": "张医生",
        "specialty": "内科",
        "user_id": user_id
    }
    doctor_response = client.post("/api/v1/clinic/doctors/", json=doctor_data, headers=auth_headers)
    assert doctor_response.status_code == 200
    doctor_id = doctor_response.json()["id"]
    
    # 3. 创建一个患者
    patient_data = {
        "name": "张病人",
        "gender": "男",
        "birth_date": "1980-01-01"
    }
    patient_response = client.post("/api/v1/patients/", json=patient_data, headers=auth_headers)
    assert patient_response.status_code == 200
    patient_id = patient_response.json()["id"]
    
    # 4. 创建一个预约
    today = datetime.now()
    appointment_time = (today + timedelta(days=1)).isoformat()
    
    appointment_data = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "appointment_time": appointment_time,
        "status": "scheduled"
    }
    appointment_response = client.post("/api/v1/clinic/appointments/", json=appointment_data, headers=auth_headers)
    assert appointment_response.status_code == 200
    appointment_id = appointment_response.json()["id"]
    
    # 5. 创建病历
    record_data = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "appointment_id": appointment_id,
        "record_date": datetime.now().isoformat(),
        "symptoms": "发热, 咳嗽",
        "diagnosis": "感冒",
        "treatment_plan": "休息, 多喝水",
        "notes": "患者需要观察"
    }
    record_response = client.post(f"/api/v1/patients/{patient_id}/medical-records/", json=record_data, headers=auth_headers)
    assert record_response.status_code == 200
    record_id = record_response.json()["id"]
    
    # 6. 添加生命体征
    vitals_data = {
        "temperature": 37.5,
        "heart_rate": 80,
        "blood_pressure": "120/80",
        "respiratory_rate": 18,
        "oxygen_saturation": 98,
        "medical_record_id": record_id
    }
    vitals_response = client.post(f"/api/v1/patients/medical-records/{record_id}/vital-signs", json=vitals_data, headers=auth_headers)
    assert vitals_response.status_code == 200
    
    # 7. 获取预约详情
    appointment_detail = client.get(f"/api/v1/clinic/appointments/{appointment_id}", headers=auth_headers)
    assert appointment_detail.status_code == 200
    assert appointment_detail.json()["doctor"]["name"] == "张医生"
    
    # 8. 获取患者信息，包含其病历
    patient_with_records = client.get(f"/api/v1/patients/{patient_id}/full", headers=auth_headers)
    assert patient_with_records.status_code == 200
    patient_data = patient_with_records.json()
    
    # 9. 验证数据关联
    assert len(patient_data["medical_records"]) == 1
    assert patient_data["medical_records"][0]["id"] == record_id
    
    # 10. 获取病历详情，验证病历与生命体征关联
    medical_record_detail = client.get(f"/api/v1/patients/medical-records/{record_id}", headers=auth_headers)
    assert medical_record_detail.status_code == 200
    record_data = medical_record_detail.json()
    
    assert record_data["vital_sign"]["temperature"] == 37.5
    assert record_data["vital_sign"]["heart_rate"] == 80
    
    # 11. 更新预约状态为已完成
    update_appointment_data = {"status": "completed"}
    update_appointment = client.put(f"/api/v1/clinic/appointments/{appointment_id}", json=update_appointment_data, headers=auth_headers)
    assert update_appointment.status_code == 200
    assert update_appointment.json()["status"] == "completed" 