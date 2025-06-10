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
    provider_transaction_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    bill_id: int

class PaymentUpdate(BaseModel):
    payment_date: Optional[datetime] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    provider_transaction_id: Optional[str] = None

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
    items: Optional[List[BillItemBase]] = []

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

# --- 在线支付相关 Schemas ---
class OnlinePaymentInitiateRequest(BaseModel):
    provider: str  # e.g., "alipay", "wechat_pay"

class OnlinePaymentResponse(BaseModel):
    payment_url: str
    bill_id: int
    provider: str

class PaymentNotificationData(BaseModel):
    """支付平台回调通知数据"""
    out_trade_no: str  # 商户订单号 (对应bill_id)
    trade_no: str  # 支付平台交易号
    trade_status: str  # 交易状态
    total_amount: str  # 支付金额
    buyer_email: Optional[str] = None
    buyer_id: Optional[str] = None
    gmt_payment: Optional[str] = None  # 支付时间

class PaymentResponse(Payment):
    pass

# --- 合并支付相关 Schemas ---
class MergedPaymentSessionBase(BaseModel):
    patient_id: int
    total_amount: Decimal
    payment_method: str
    status: str
    expires_at: datetime
    qr_code_content: Optional[str] = None
    provider_transaction_id: Optional[str] = None

class MergedPaymentSessionCreate(BaseModel):
    patient_id: int
    bill_ids: List[int]
    payment_method: str
    timeout_minutes: int = 15

class MergedPaymentSessionRead(MergedPaymentSessionBase):
    id: int
    session_id: str
    created_at: datetime
    updated_at: datetime
    bills: List[BillSummary] = []
    model_config = ConfigDict(from_attributes=True)

class MergedPaymentSessionBillBase(BaseModel):
    merged_session_id: int
    bill_id: int
    bill_amount: Decimal

class MergedPaymentSessionBillRead(MergedPaymentSessionBillBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- 合并支付请求响应 Schemas ---
class MergedPaymentRequest(BaseModel):
    patient_id: int
    bill_ids: List[int]
    payment_method: str = Field(..., pattern="^(alipay|wechat)$")
    timeout_minutes: int = Field(default=15, ge=5, le=60)

class MergedPaymentResponse(BaseModel):
    session_id: str
    qr_code_content: str
    total_amount: Decimal
    expires_at: datetime
    bills: List[BillSummary]

class MergedPaymentCallbackResponse(BaseModel):
    session_id: str
    total_amount: Decimal
    processed_bills: List[dict]
    transaction_id: str
