from sqlalchemy.orm import Session
from datetime import datetime, timezone
from . import models
from app.core.service_base import BaseService
from app.core.exceptions import ResourceNotFoundException
from app.clinic.models import Clinic, Doctor, Appointment
from app.clinic.schemas import ClinicCreate, ClinicUpdate, DoctorCreate, DoctorUpdate, AppointmentCreate, AppointmentUpdate
from app.patient.models import MedicalRecord
from app.patient.schemas import MedicalRecordCreate

class ClinicService(BaseService[Clinic, ClinicCreate, ClinicUpdate]):
    def __init__(self):
        super().__init__(Clinic)

class DoctorService(BaseService[Doctor, DoctorCreate, DoctorUpdate]):
    def __init__(self):
        super().__init__(Doctor)
        
    def get_by_user_id(self, db: Session, user_id: int):
        """根据用户ID查找医生"""
        return db.query(Doctor).filter(Doctor.user_id == user_id).first()

class AppointmentService(BaseService[Appointment, AppointmentCreate, AppointmentUpdate]):
    def __init__(self):
        super().__init__(Appointment)
        
    def get_by_doctor_id(self, db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
        """获取指定医生的所有预约"""
        return db.query(self.model).filter(self.model.doctor_id == doctor_id).offset(skip).limit(limit).all()
    
    def get_by_patient_id(self, db: Session, patient_id: int, skip: int = 0, limit: int = 100):
        """获取指定患者的所有预约"""
        return db.query(self.model).filter(self.model.patient_id == patient_id).offset(skip).limit(limit).all()
    
    def cancel_appointment(self, db: Session, id: int):
        """取消预约"""
        appointment = self.get(db, id)
        if not appointment:
            raise ResourceNotFoundException(resource_id=id, resource_type="Appointment")
        
        # 修改状态为取消
        appointment_update = AppointmentUpdate(status=models.AppointmentStatus.CANCELLED)
        return self.update(db, db_obj=appointment, obj_in=appointment_update)

class MedicalRecordService(BaseService[MedicalRecord, MedicalRecordCreate, None]):
    def __init__(self):
        super().__init__(MedicalRecord)
    
    def generate_display_id(self, db: Session, patient_id: int) -> str:
        """
        生成病历显示ID，格式：MR-{患者ID}-{时间戳}
        例如：MR-001-20241201143022
        """
        from app.patient.models import Patient
        
        # 获取患者信息
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ResourceNotFoundException(resource_id=patient_id, resource_type="Patient")
        
        # 生成时间戳
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # 生成display_id，使用患者ID而不是姓名拼音
        display_id = f"MR-{patient_id:03d}-{timestamp}"
        return display_id
    
    def create_medical_record(self, db: Session, *, obj_in: MedicalRecordCreate) -> MedicalRecord:
        """
        创建病历，自动生成display_id
        """
        # 生成display_id
        display_id = self.generate_display_id(db, obj_in.patient_id)
        
        # 创建病历对象
        db_obj = MedicalRecord(
            display_id=display_id,
            patient_id=obj_in.patient_id,
            doctor_id=obj_in.doctor_id,
            record_date=obj_in.record_date,
            chief_complaint=obj_in.chief_complaint,
            present_illness=obj_in.present_illness,
            past_history=obj_in.past_history,
            temperature=obj_in.temperature,
            pulse=obj_in.pulse,
            respiratory_rate=obj_in.respiratory_rate,
            blood_pressure=obj_in.blood_pressure,
            physical_examination=obj_in.physical_examination,
            diagnosis=obj_in.diagnosis,
            treatment_plan=obj_in.treatment_plan,
            prescription=obj_in.prescription,
            notes=obj_in.notes,
            symptoms=obj_in.symptoms
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_patient_id(self, db: Session, patient_id: int, skip: int = 0, limit: int = 100):
        """获取指定患者的所有病历"""
        return db.query(self.model).filter(
            self.model.patient_id == patient_id
        ).order_by(self.model.record_date.desc()).offset(skip).limit(limit).all()

# 创建服务实例
clinic_service = ClinicService()
doctor_service = DoctorService()
appointment_service = AppointmentService()
medical_record_service = MedicalRecordService()
