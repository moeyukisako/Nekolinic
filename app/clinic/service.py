from sqlalchemy.orm import Session
from . import models, schemas
from app.core.service_base import BaseService
from app.core.exceptions import ResourceNotFoundException

class DoctorService(BaseService[models.Doctor, schemas.DoctorCreate, schemas.DoctorUpdate]):
    def get_by_user_id(self, db: Session, user_id: int):
        """根据用户ID查找医生"""
        return db.query(self.model).filter(self.model.user_id == user_id).first()

class AppointmentService(BaseService[models.Appointment, schemas.AppointmentCreate, schemas.AppointmentUpdate]):
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
        appointment_update = schemas.AppointmentUpdate(status=models.AppointmentStatus.CANCELLED)
        return self.update(db, db_obj=appointment, obj_in=appointment_update)

doctor_service = DoctorService(models.Doctor)
appointment_service = AppointmentService(models.Appointment)
