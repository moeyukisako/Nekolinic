from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Date
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
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    INSURANCE = "insurance"

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
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), unique=True)
    
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
    
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    bill = relationship("Bill", back_populates="payments")
