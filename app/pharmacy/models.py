from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum
from datetime import datetime

# --- History Models (for auditable tables) ---
class DrugCategoryHistory(Base):
    __tablename__ = 'drug_categories_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of DrugCategory fields
    id = Column(Integer, index=True)
    name = Column(String(100))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class DrugHistory(Base):
    __tablename__ = 'drugs_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Drug fields
    id = Column(Integer, index=True)
    name = Column(String(100))
    code = Column(String(50))
    description = Column(Text)
    specification = Column(String(100))
    manufacturer = Column(String(100))
    unit = Column(String(20))
    unit_price = Column(Numeric(10, 2))
    cost_price = Column(Numeric(10, 2))
    category_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class PrescriptionHistory(Base):
    __tablename__ = 'prescriptions_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Prescription fields
    id = Column(Integer, index=True)
    prescription_date = Column(DateTime)
    dispensing_status = Column(String(50))
    medical_record_id = Column(Integer)
    doctor_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

class PrescriptionDetailHistory(Base):
    __tablename__ = 'prescription_details_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of PrescriptionDetail fields
    id = Column(Integer, index=True)
    dosage = Column(String(100))
    frequency = Column(String(100))
    days = Column(Integer)
    quantity = Column(Integer)
    prescription_id = Column(Integer)
    drug_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime, nullable=True)

# --- Main Business Models ---

@register_audit_model(DrugCategoryHistory)
class DrugCategory(Base, Auditable):
    __tablename__ = 'drug_categories'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    drugs = relationship("Drug", back_populates="category")

@register_audit_model(DrugHistory)
class Drug(Base, Auditable):
    __tablename__ = 'drugs'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(50), unique=True)
    description = Column(Text)
    specification = Column(String(100))
    manufacturer = Column(String(100))
    unit = Column(String(20))  # e.g., '片', '瓶', '支'
    unit_price = Column(Numeric(10, 2), nullable=False)  # 售价
    cost_price = Column(Numeric(10, 2))  # 成本价
    
    category_id = Column(Integer, ForeignKey('drug_categories.id'))
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    category = relationship("DrugCategory", back_populates="drugs")
    inventory_transactions = relationship("InventoryTransaction", back_populates="drug")

class DispensingStatus(str, enum.Enum):
    PENDING = "pending"
    DISPENSED = "dispensed"
    CANCELLED = "cancelled"

@register_audit_model(PrescriptionHistory)
class Prescription(Base, Auditable):
    __tablename__ = 'prescriptions'
    id = Column(Integer, primary_key=True, index=True)
    prescription_date = Column(DateTime, nullable=False)
    dispensing_status = Column(Enum(DispensingStatus), nullable=False, default=DispensingStatus.PENDING)
    
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), nullable=False, unique=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    medical_record = relationship("MedicalRecord")
    doctor = relationship("Doctor")
    details = relationship("PrescriptionDetail", back_populates="prescription")

@register_audit_model(PrescriptionDetailHistory)
class PrescriptionDetail(Base, Auditable):
    __tablename__ = 'prescription_details'
    id = Column(Integer, primary_key=True, index=True)
    dosage = Column(String(100))  # e.g., "500mg"
    frequency = Column(String(100))  # e.g., "TID" (每日三次)
    days = Column(Integer)
    quantity = Column(Integer, nullable=False)  # 总数量
    
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'), nullable=False)
    drug_id = Column(Integer, ForeignKey('drugs.id'), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    prescription = relationship("Prescription", back_populates="details")
    drug = relationship("Drug")

# --- 【核心】库存流水模型 ---
class InventoryTransactionType(str, enum.Enum):
    STOCK_IN = "stock_in"  # 入库
    DISPENSE = "dispense"  # 发药
    ADJUSTMENT = "adjustment"  # 盘点调整
    INITIAL = "initial"  # 初始库存

class InventoryTransaction(Base):
    __tablename__ = 'inventory_transactions'
    # 注意：此表自身即为日志，无需历史表，也无需继承 Auditable
    id = Column(Integer, primary_key=True, index=True)
    transaction_time = Column(DateTime, nullable=False)
    transaction_type = Column(Enum(InventoryTransactionType), nullable=False)
    quantity_change = Column(Integer, nullable=False)  # 正数为增，负数为减
    notes = Column(Text)
    
    drug_id = Column(Integer, ForeignKey('drugs.id'), nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    drug = relationship("Drug", back_populates="inventory_transactions")
    user = relationship("User")
