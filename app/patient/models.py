from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, Float, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model

# --- History Models ---

class PatientHistory(Base):
    __tablename__ = 'patients_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Patient fields
    id = Column(Integer, index=True)
    name = Column(String(100))
    birth_date = Column(Date)
    gender = Column(String(10))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(200))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

class MedicalRecordHistory(Base):
    __tablename__ = 'medical_records_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))

    # Snapshot of MedicalRecord fields
    id = Column(Integer, index=True)
    record_date = Column(DateTime)
    symptoms = Column(Text)
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    notes = Column(Text)
    patient_id = Column(Integer)
    doctor_id = Column(Integer)
    appointment_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

class VitalSignHistory(Base):
    __tablename__ = 'vital_signs_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))

    # Snapshot of VitalSign fields
    id = Column(Integer, index=True)
    temperature = Column(Float)
    heart_rate = Column(Integer)
    blood_pressure = Column(String(20))
    respiratory_rate = Column(Integer)
    oxygen_saturation = Column(Float)
    medical_record_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

# --- Main Business Models ---

@register_audit_model(PatientHistory)
class Patient(Base, Auditable):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    birth_date = Column(Date)
    gender = Column(String(10))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(200))
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")

@register_audit_model(MedicalRecordHistory)
class MedicalRecord(Base, Auditable):
    __tablename__ = 'medical_records'
    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(DateTime, nullable=False)
    symptoms = Column(Text)  # 症状描述
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    notes = Column(Text)
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), unique=True)
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    patient = relationship("Patient", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_record")
    vital_sign = relationship("VitalSign", back_populates="medical_record", uselist=False)

@register_audit_model(VitalSignHistory)
class VitalSign(Base, Auditable):
    __tablename__ = 'vital_signs'
    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float)  # 体温，摄氏度
    heart_rate = Column(Integer)  # 心率，每分钟次数
    blood_pressure = Column(String(20))  # 血压，格式如"120/80"
    respiratory_rate = Column(Integer)  # 呼吸频率，每分钟次数
    oxygen_saturation = Column(Float)  # 血氧饱和度，百分比
    
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), unique=True)
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    medical_record = relationship("MedicalRecord", back_populates="vital_sign")
