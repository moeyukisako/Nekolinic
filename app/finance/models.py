from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum
from datetime import datetime

# --- History Models ---
class InsuranceHistory(Base):
    __tablename__ = 'insurances_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Insurance fields
    id = Column(Integer, index=True)
    provider_name = Column(String(100))
    policy_number = Column(String(100))
    patient_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class BillHistory(Base):
    __tablename__ = 'bills_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Bill fields
    id = Column(Integer, index=True)
    invoice_number = Column(String(50))
    bill_date = Column(DateTime)
    total_amount = Column(Numeric(10, 2))
    status = Column(String(20))
    patient_id = Column(Integer)
    medical_record_id = Column(Integer)
    payment_method = Column(String, nullable=True)
    provider_transaction_id = Column(String, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class BillItemHistory(Base):
    __tablename__ = 'bill_items_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of BillItem fields
    id = Column(Integer, index=True)
    item_name = Column(String(200))
    item_type = Column(String(50))
    quantity = Column(Integer)
    unit_price = Column(Numeric(10, 2))
    subtotal = Column(Numeric(10, 2))
    bill_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class PaymentHistory(Base):
    __tablename__ = 'payments_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Payment fields
    id = Column(Integer, index=True)
    payment_date = Column(DateTime)
    amount = Column(Numeric(10, 2))
    payment_method = Column(String(20))
    payment_mode = Column(String(20))
    provider_transaction_id = Column(String(100), nullable=True)
    qr_code_url = Column(String(500), nullable=True)
    qr_code_expires_at = Column(DateTime, nullable=True)
    bill_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

# --- Enums for Status and Type ---
class BillStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    VOID = "void"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    ALIPAY = "alipay"
    WECHAT = "wechat"
    BANK_CARD = "bank_card"


class PaymentMode(str, enum.Enum):
    """支付模式"""
    REDIRECT = "redirect"  # 跳转支付（原有模式）
    QR_CODE = "qr_code"   # 二维码支付（新增模式）


class PaymentSessionStatus(str, enum.Enum):
    """支付会话状态"""
    PENDING = "pending"      # 待支付
    PAID = "paid"           # 已支付
    EXPIRED = "expired"     # 已过期
    CANCELLED = "cancelled" # 已取消

# --- Main Business Models ---

@register_audit_model(InsuranceHistory)
class Insurance(Base, Auditable):
    __tablename__ = 'insurances'
    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String(100), nullable=False)
    policy_number = Column(String(100), nullable=False)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    patient = relationship("Patient")

@register_audit_model(BillHistory)
class Bill(Base, Auditable):
    __tablename__ = 'bills'
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    bill_date = Column(DateTime, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BillStatus), nullable=False, default=BillStatus.UNPAID)
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), nullable=True)
    
    # 新增支付相关字段
    payment_method = Column(String, nullable=True)  # 例如 'cash', 'alipay', 'wechat_pay'
    provider_transaction_id = Column(String, nullable=True, index=True)  # 支付平台返回的交易号
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    patient = relationship("Patient")
    medical_record = relationship("MedicalRecord")
    items = relationship("BillItem", back_populates="bill")
    payments = relationship("Payment", back_populates="bill")
    payment_sessions = relationship("PaymentSession", back_populates="bill")

@register_audit_model(BillItemHistory)
class BillItem(Base, Auditable):
    __tablename__ = 'bill_items'
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(200), nullable=False)
    item_type = Column(String(50), nullable=False)  # e.g., 'consultation', 'drug', 'treatment'
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    bill = relationship("Bill", back_populates="items")

@register_audit_model(PaymentHistory)
class Payment(Base, Auditable):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_mode = Column(Enum(PaymentMode), default=PaymentMode.REDIRECT, nullable=False)  # 支付模式
    provider_transaction_id = Column(String(100), nullable=True)  # 第三方支付平台的交易ID
    qr_code_url = Column(String(500), nullable=True)  # 二维码链接（用于二维码支付）
    qr_code_expires_at = Column(DateTime, nullable=True)  # 二维码过期时间
    
    # Foreign keys
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    bill = relationship("Bill", back_populates="payments")


# PaymentSession模型已移至payment_session_models.py文件中
