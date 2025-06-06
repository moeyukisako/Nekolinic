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
    
    # 2. 创建一个医生
    doctor_data = {
        "name": "张医生",
        "specialty": "内科",
        "user_id": user_id
    }
    doctor_response = client.post("/api/v1/clinic/doctors/", json=doctor_data)
    assert doctor_response.status_code == 200
    doctor_id = doctor_response.json()["id"]
    
    # 3. 创建一个患者
    patient_data = {
        "name": "李患者",
        "birth_date": "1985-05-15",
        "gender": "男",
        "contact_number": "13912345678",
        "address": "北京市海淀区"
    }
    patient_response = client.post("/api/v1/patients/", json=patient_data)
    assert patient_response.status_code == 200
    patient_id = patient_response.json()["id"]
    
    # 4. 为他们创建一个预约
    appointment_time = datetime.now() + timedelta(days=1)
    appointment_data = {
        "appointment_time": appointment_time.isoformat(),
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "status": "scheduled"
    }
    appointment_response = client.post("/api/v1/clinic/appointments/", json=appointment_data)
    assert appointment_response.status_code == 200
    appointment_id = appointment_response.json()["id"]
    
    # 5. 获取预约详情
    appointment_detail = client.get(f"/api/v1/clinic/appointments/{appointment_id}")
    assert appointment_detail.status_code == 200
    assert appointment_detail.json()["doctor"]["name"] == "张医生"
    
    # 6. 基于该预约创建一个病历
    medical_record_data = {
        "record_date": datetime.now().isoformat(),
        "diagnosis": "感冒",
        "treatment_plan": "多喝热水，休息两天",
        "notes": "患者症状较轻",
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_id": appointment_id
    }
    medical_record_response = client.post(f"/api/v1/patients/{patient_id}/medical-records/", json=medical_record_data)
    assert medical_record_response.status_code == 200
    medical_record_id = medical_record_response.json()["id"]
    
    # 7. 为该病历添加生命体征
    vital_sign_data = {
        "temperature": 37.2,
        "heart_rate": 75,
        "blood_pressure": "120/80",
        "respiratory_rate": 18,
        "oxygen_saturation": 98.5,
        "medical_record_id": medical_record_id
    }
    vital_sign_response = client.post(f"/api/v1/patients/medical-records/{medical_record_id}/vital-signs/", json=vital_sign_data)
    assert vital_sign_response.status_code == 200
    vital_sign_id = vital_sign_response.json()["id"]
    
    # 8. 获取患者信息，包含其病历
    patient_with_records = client.get(f"/api/v1/patients/{patient_id}/full")
    assert patient_with_records.status_code == 200
    patient_data = patient_with_records.json()
    
    # 9. 验证数据关联
    assert len(patient_data["medical_records"]) == 1
    assert patient_data["medical_records"][0]["id"] == medical_record_id
    
    # 10. 获取病历详情，验证病历与生命体征关联
    medical_record_detail = client.get(f"/api/v1/patients/medical-records/{medical_record_id}")
    assert medical_record_detail.status_code == 200
    record_data = medical_record_detail.json()
    
    assert record_data["vital_sign"]["temperature"] == 37.2
    assert record_data["vital_sign"]["heart_rate"] == 75
    
    # 11. 更新预约状态为已完成
    update_appointment_data = {"status": "completed"}
    update_appointment = client.put(f"/api/v1/clinic/appointments/{appointment_id}", json=update_appointment_data)
    assert update_appointment.status_code == 200
    assert update_appointment.json()["status"] == "completed" 