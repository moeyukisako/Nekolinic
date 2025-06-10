from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal

if TYPE_CHECKING:
    from app.patient.schemas import Patient
    from app.clinic.schemas import Doctor as DoctorSchema
else:
    # Import related schemas for nested data
    from app.clinic.schemas import Doctor as DoctorSchema

# --- Drug Schemas ---
class DrugBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    unit: str
    unit_price: Decimal
    cost_price: Optional[Decimal] = None

class DrugCreate(DrugBase):
    pass

class DrugUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None

class Drug(DrugBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- PrescriptionDetail Schemas ---
class PrescriptionDetailBase(BaseModel):
    dosage: str
    frequency: str
    days: int
    quantity: int
    drug_id: int

class PrescriptionDetailCreate(PrescriptionDetailBase):
    pass

class PrescriptionDetailUpdate(BaseModel):
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    days: Optional[int] = None
    quantity: Optional[int] = None

class PrescriptionDetail(PrescriptionDetailBase):
    id: int
    drug: Optional[Drug] = None
    model_config = ConfigDict(from_attributes=True)

# --- Prescription Schemas ---
class PrescriptionBase(BaseModel):
    prescription_date: datetime
    medical_record_id: int
    doctor_id: int

class PrescriptionCreate(PrescriptionBase):
    details: List[PrescriptionDetailCreate]  # 创建主表时同时创建明细

class PrescriptionUpdate(BaseModel):
    dispensing_status: Optional[str] = None

class Prescription(PrescriptionBase):
    id: int
    dispensing_status: str
    details: List[PrescriptionDetail] = []
    # 嵌套的患者和医生信息
    patient: Optional['Patient'] = None
    doctor: Optional['DoctorSchema'] = None
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Schemas ---
class InventoryTransactionBase(BaseModel):
    transaction_type: str
    quantity_change: int
    drug_id: int
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransaction(InventoryTransactionBase):
    id: int
    transaction_time: datetime
    action_by_id: int
    drug: Optional[Drug] = None
    model_config = ConfigDict(from_attributes=True)

# --- 库存操作相关Schemas ---
class StockInRequest(BaseModel):
    drug_id: int
    quantity: int = Field(gt=0)
    notes: Optional[str] = None

class BulkStockInItem(BaseModel):
    drug_id: int
    quantity: int = Field(gt=0)
    cost_price: Optional[Decimal] = None
    notes: Optional[str] = None

class BulkStockInRequest(BaseModel):
    items: List[BulkStockInItem]
    notes: Optional[str] = None

class DispenseRequest(BaseModel):
    prescription_id: int
    notes: Optional[str] = None

class StockResponse(BaseModel):
    drug_id: int
    drug_name: str
    current_stock: int
    model_config = ConfigDict(from_attributes=True)

class DrugWithStock(DrugBase):
    """药品信息包含库存数据"""
    id: int
    stock: int  # 当前库存
    model_config = ConfigDict(from_attributes=True)
