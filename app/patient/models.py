from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Float, ForeignKey
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
    contact_number = Column(String(20))
    address = Column(String(200))
    past_medical_history = Column(Text)  # 添加既往病史字段
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
    display_id = Column(String(50), nullable=True)  # 添加display_id字段
    record_date = Column(DateTime)
    chief_complaint = Column(Text)  # 主诉
    present_illness = Column(Text)  # 现病史
    past_history = Column(Text)  # 既往病史
    temperature = Column(Float)  # 体温
    pulse = Column(Integer)  # 脉搏
    respiratory_rate = Column(Integer)  # 呼吸频率
    blood_pressure = Column(String(20))  # 血压
    physical_examination = Column(Text)  # 体格检查
    diagnosis = Column(Text)  # 诊断
    treatment_plan = Column(Text)  # 治疗方案
    prescription = Column(Text)  # 处方
    notes = Column(Text)  # 备注
    symptoms = Column(Text)  # 症状描述（保留兼容性）
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
    contact_number = Column(String(20))
    address = Column(String(200))
    past_medical_history = Column(Text, nullable=True)  # 添加既往病史字段
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    # appointments = relationship("Appointment", back_populates="patient")  # 暂时注释避免循环依赖
    medical_records = relationship("MedicalRecord", back_populates="patient")

@register_audit_model(MedicalRecordHistory)
class MedicalRecord(Base, Auditable):
    __tablename__ = 'medical_records'
    id = Column(Integer, primary_key=True, index=True)
    display_id = Column(String(50), unique=True, nullable=False, index=True)  # 显示用的病历ID，格式如MR20241201001
    record_date = Column(DateTime, nullable=False)
    chief_complaint = Column(Text)  # 主诉
    present_illness = Column(Text)  # 现病史
    past_history = Column(Text)  # 既往病史
    temperature = Column(Float)  # 体温
    pulse = Column(Integer)  # 脉搏
    respiratory_rate = Column(Integer)  # 呼吸频率
    blood_pressure = Column(String(20))  # 血压
    physical_examination = Column(Text)  # 体格检查
    diagnosis = Column(Text)  # 诊断
    treatment_plan = Column(Text)  # 治疗方案
    prescription = Column(Text)  # 处方
    notes = Column(Text)  # 备注
    symptoms = Column(Text)  # 症状描述（保留兼容性）
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), unique=True)
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    patient = relationship("Patient", back_populates="medical_records")
    # appointment = relationship("Appointment", back_populates="medical_record")  # 暂时注释避免循环依赖
    vital_sign = relationship("VitalSign", back_populates="medical_record", uselist=False)
    prescriptions = relationship("Prescription", back_populates="medical_record")

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
