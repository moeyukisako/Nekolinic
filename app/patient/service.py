from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any
from . import models, schemas
from app.core.service_base import BaseService
from app.core.exceptions import ResourceNotFoundException, ValidationException

class PatientService(BaseService[models.Patient, schemas.PatientCreate, schemas.PatientUpdate]):
    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 15) -> Dict[str, Any]:
        """
        获取患者列表（分页），通过调用基类的 get_paginated 来实现。
        """
        # 直接调用基类中已经实现好的、能返回总数的分页方法
        return super().get_paginated(db=db, skip=skip, limit=limit)

    def search_patients(self, db: Session, name: str, skip: int = 0, limit: int = 15) -> Dict[str, Any]:
        """
        按姓名搜索患者（分页），通过调用基类的 get_paginated 实现。
        """
        # 构造过滤条件，并调用基类的分页方法
        filters = {"name_like": name}
        return super().get_paginated(db=db, skip=skip, limit=limit, **filters)

    def get_patient_with_medical_records(self, db: Session, id: int):
        """获取患者及其所有病历 (使用预加载优化性能)"""
        patient = (
            db.query(self.model)
            .options(
                joinedload(self.model.medical_records)
                .joinedload(models.MedicalRecord.vital_sign)
            )
            .filter(self.model.id == id, self.model.deleted_at.is_(None))
            .first()
        )
        if not patient:
            raise ResourceNotFoundException(resource_id=id, resource_type="Patient")
        return patient

class MedicalRecordService(BaseService[models.MedicalRecord, schemas.MedicalRecordCreate, schemas.MedicalRecordUpdate]):
    def get_by_patient_id(self, db: Session, patient_id: int, skip: int = 0, limit: int = 100):
        """获取指定患者的所有病历"""
        return db.query(self.model).filter(self.model.patient_id == patient_id).offset(skip).limit(limit).all()
    
    def get_by_doctor_id(self, db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
        """获取指定医生的所有病历"""
        return db.query(self.model).filter(self.model.doctor_id == doctor_id).offset(skip).limit(limit).all()
    
    def get_by_appointment_id(self, db: Session, appointment_id: int):
        """根据预约ID获取病历"""
        return db.query(self.model).filter(self.model.appointment_id == appointment_id).first()

class VitalSignService(BaseService[models.VitalSign, schemas.VitalSignCreate, schemas.VitalSignUpdate]):
    def get_by_medical_record_id(self, db: Session, medical_record_id: int):
        """根据病历ID获取生命体征"""
        return db.query(self.model).filter(self.model.medical_record_id == medical_record_id).first()
    
    def create_for_medical_record(self, db: Session, medical_record_id: int, vital_sign_in: schemas.VitalSignCreate):
        """为指定病历创建生命体征"""
        # 检查病历是否存在
        medical_record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == medical_record_id).first()
        if not medical_record:
            raise ResourceNotFoundException(resource_id=medical_record_id, resource_type="MedicalRecord")
        
        # 检查该病历是否已有生命体征记录
        existing = self.get_by_medical_record_id(db, medical_record_id)
        if existing:
            raise ValidationException(message="该病历已有生命体征记录")
        
        # 确保传入的vital_sign_in.medical_record_id与指定的medical_record_id一致
        if vital_sign_in.medical_record_id != medical_record_id:
            # 创建一个新的VitalSignCreate对象
            obj_in = schemas.VitalSignCreate(
                temperature=vital_sign_in.temperature,
                heart_rate=vital_sign_in.heart_rate,
                blood_pressure=vital_sign_in.blood_pressure,
                respiratory_rate=vital_sign_in.respiratory_rate,
                oxygen_saturation=vital_sign_in.oxygen_saturation,
                medical_record_id=medical_record_id
            )
        else:
            obj_in = vital_sign_in
        
        # 直接调用父类的create方法完成创建操作
        return super().create(db=db, obj_in=obj_in)

patient_service = PatientService(models.Patient)
medical_record_service = MedicalRecordService(models.MedicalRecord)
vital_sign_service = VitalSignService(models.VitalSign)
