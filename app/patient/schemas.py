from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.pharmacy.schemas import Prescription, PrescriptionInMedicalRecord

# --- VitalSign Schemas ---
class VitalSignBase(BaseModel):
    patient_id: int
    record_date: datetime
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None

class VitalSignCreate(VitalSignBase):
    pass

class VitalSignUpdate(BaseModel):
    record_date: Optional[datetime] = None
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None

class VitalSign(VitalSignBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- MedicalRecord Schemas ---
class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: int

class MedicalRecordCreate(MedicalRecordBase):
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
    symptoms: Optional[str] = None  # 保留兼容性

# 只包含可更新的表单字段，不包含关系字段如patient_id和doctor_id
# 这些关系字段不应该在更新记录时被修改
class MedicalRecordUpdate(BaseModel):
    record_date: Optional[datetime] = None
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
    symptoms: Optional[str] = None  # 保留兼容性

class MedicalRecord(MedicalRecordBase):
    id: int
    display_id: Optional[str] = None
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
    symptoms: Optional[str] = None  # 保留兼容性
    vital_sign: Optional[VitalSign] = None
    prescriptions: List['PrescriptionInMedicalRecord'] = []
    model_config = ConfigDict(from_attributes=True)

# --- Patient Schemas ---
class PatientBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    past_medical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    name: Optional[str] = None

class Patient(PatientBase):
    id: int
    medical_records: List['MedicalRecord'] = []
    vital_signs: List[VitalSign] = []
    model_config = ConfigDict(from_attributes=True)

class PatientWithMedicalRecords(Patient):
    medical_records: List['MedicalRecord'] = []
    model_config = ConfigDict(from_attributes=True)

# -------- 修改/新增代码开始 --------
# 在文件末尾，为了让 model_rebuild 能够找到定义，在这里执行真正的导入
from app.pharmacy.schemas import Prescription, PrescriptionInMedicalRecord

# 现在，重建模型，此时 'Prescription' 已经在当前作用域中定义
Patient.model_rebuild()
MedicalRecord.model_rebuild()
PatientWithMedicalRecords.model_rebuild()
# -------- 修改/新增代码结束 --------
