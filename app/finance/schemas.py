from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# --- Insurance Schemas ---
class InsuranceBase(BaseModel):
    provider_name: str
    policy_number: str
    patient_id: int

class InsuranceCreate(InsuranceBase):
    pass

class InsuranceUpdate(BaseModel):
    provider_name: Optional[str] = None
    policy_number: Optional[str] = None

class Insurance(InsuranceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- BillItem Schemas ---
class BillItemBase(BaseModel):
    item_name: str
    item_type: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

class BillItemCreate(BillItemBase):
    bill_id: int

class BillItem(BillItemBase):
    id: int
    bill_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Payment Schemas ---
class PaymentBase(BaseModel):
    payment_date: datetime
    amount: Decimal
    payment_method: str

class PaymentCreate(PaymentBase):
    bill_id: int

class PaymentUpdate(BaseModel):
    payment_date: Optional[datetime] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None

class Payment(PaymentBase):
    id: int
    bill_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Bill Schemas ---
class BillBase(BaseModel):
    invoice_number: str
    bill_date: datetime
    total_amount: Decimal
    patient_id: int
    medical_record_id: int

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    status: Optional[str] = None

class Bill(BillBase):
    id: int
    status: str
    items: List[BillItem] = []
    payments: List[Payment] = []
    model_config = ConfigDict(from_attributes=True)

# --- Request Schemas ---
class GenerateBillRequest(BaseModel):
    medical_record_id: int

class PaymentRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    payment_method: str

# --- Response Schemas ---
class BillSummary(BaseModel):
    id: int
    invoice_number: str
    bill_date: datetime
    total_amount: Decimal
    status: str
    patient_id: int
    medical_record_id: int
    model_config = ConfigDict(from_attributes=True)

class PaymentResponse(Payment):
    pass
