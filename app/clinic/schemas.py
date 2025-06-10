from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# --- Clinic Schemas ---
class ClinicBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_number: Optional[str] = None

class ClinicCreate(ClinicBase):
    pass

class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None

class Clinic(ClinicBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Doctor Schemas ---
class DoctorBase(BaseModel):
    name: str
    specialty: str
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    user_id: int

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class Doctor(DoctorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    appointment_time: datetime
    patient_id: int
    doctor_id: int
    status: str = "scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_time: Optional[datetime] = None
    status: Optional[str] = None

class AppointmentWithDoctor(AppointmentBase):
    id: int
    doctor: Doctor # 嵌套显示医生信息
    model_config = ConfigDict(from_attributes=True)

class Appointment(AppointmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Medical Record Schemas ---
class MedicalRecordBase(BaseModel):
    record_date: datetime
    chief_complaint: Optional[str] = None
    present_illness: Optional[str] = None
    past_history: Optional[str] = None
    temperature: Optional[float] = None
    pulse: Optional[int] = None
    respiratory_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    physical_examination: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    symptoms: Optional[str] = None
    patient_id: int
    doctor_id: int

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecord(MedicalRecordBase):
    id: int
    display_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
