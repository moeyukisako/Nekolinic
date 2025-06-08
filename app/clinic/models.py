from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum

# --- History Models ---

class DoctorHistory(Base):
    __tablename__ = 'doctors_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Doctor fields
    id = Column(Integer, index=True)
    name = Column(String(100))
    title = Column(String(50))
    specialty = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    user_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

class AppointmentHistory(Base):
    __tablename__ = 'appointments_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))

    # Snapshot of Appointment fields
    id = Column(Integer, index=True)
    appointment_time = Column(DateTime)
    status = Column(String(50))
    patient_id = Column(Integer)
    doctor_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

# --- Main Business Models ---

class Clinic(Base, Auditable):
    __tablename__ = 'clinics'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(200))
    contact_number = Column(String(20))
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

@register_audit_model(DoctorHistory)
class Doctor(Base, Auditable):
    __tablename__ = 'doctors'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    title = Column(String(50))  # 职称
    specialty = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@register_audit_model(AppointmentHistory)
class Appointment(Base, Auditable):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    appointment_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.SCHEDULED)
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
