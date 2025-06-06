from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

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
