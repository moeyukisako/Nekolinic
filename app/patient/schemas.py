from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Dict, Any

# --- VitalSign Schemas ---
class VitalSignBase(BaseModel):
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    medical_record_id: int

class VitalSignCreate(VitalSignBase):
    pass

class VitalSignUpdate(BaseModel):
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None

class VitalSign(VitalSignBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- MedicalRecord Schemas ---
class MedicalRecordBase(BaseModel):
    record_date: datetime
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    record_date: Optional[datetime] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None

class MedicalRecord(MedicalRecordBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    vital_sign: Optional[VitalSign] = None
    model_config = ConfigDict(from_attributes=True)

# --- Patient Schemas ---
class PatientBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None

class Patient(PatientBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class PatientWithMedicalRecords(Patient):
    medical_records: List[MedicalRecord] = []
    model_config = ConfigDict(from_attributes=True)
