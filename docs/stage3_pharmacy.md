## 第三阶段开发指南：药局与处方模块 (Pharmacy)

### **核心目标**

此阶段我们将构建与药局相关的所有功能，包括**药品管理**、**处方开立**以及**库存控制**。本阶段的重点是实现一个基于流水记录的、完全可追溯的库存系统。

------

### **Part 1: `app/pharmacy` 模块 — 模型定义 (`models.py`)**

这是本阶段最关键的一步，尤其是 `InventoryTransaction` 的设计。

#### **步骤 1.1: 创建模块文件**

在 `app/pharmacy/` 目录下，创建以下四个文件：

- `models.py`
- `schemas.py`
- `service.py`
- `api.py`

#### **步骤 1.2: 定义数据模型**

在 `app/pharmacy/models.py` 中，根据 `guideline1_separated_data_schema.md` 定义以下所有模型。

Python

```
# app/pharmacy/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum

# --- History Models (for auditable tables) ---
# 此处省略 DrugCategoryHistory, DrugHistory, PrescriptionHistory, PrescriptionDetailHistory 的代码
# 它们的结构与前两个阶段的 History 模型完全一致，请比照创建。

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
    unit = Column(String(20)) # e.g., '片', '瓶', '支'
    unit_price = Column(Numeric(10, 2), nullable=False) # 售价
    cost_price = Column(Numeric(10, 2)) # 成本价
    
    category_id = Column(Integer, ForeignKey('drug_categories.id'))
    
    # Audit fields
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    updated_by_id = Column(Integer, ForeignKey('users.id'))
    deleted_at = Column(DateTime, nullable=True)

    category = relationship("DrugCategory", back_populates="drugs")

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
    dosage = Column(String(100)) # e.g., "500mg"
    frequency = Column(String(100)) # e.g., "TID" (每日三次)
    days = Column(Integer)
    quantity = Column(Integer, nullable=False) # 总数量
    
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
    STOCK_IN = "stock_in" # 入库
    DISPENSE = "dispense" # 发药
    ADJUSTMENT = "adjustment" # 盘点调整
    INITIAL = "initial" # 初始库存

class InventoryTransaction(Base):
    __tablename__ = 'inventory_transactions'
    # 注意：此表自身即为日志，无需历史表，也无需继承 Auditable
    id = Column(Integer, primary_key=True, index=True)
    transaction_time = Column(DateTime, nullable=False)
    transaction_type = Column(Enum(InventoryTransactionType), nullable=False)
    quantity_change = Column(Integer, nullable=False) # 正数为增，负数为减
    notes = Column(Text)
    
    drug_id = Column(Integer, ForeignKey('drugs.id'), nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    drug = relationship("Drug")
    user = relationship("User")
```

- **特别注意**：`InventoryTransaction` 表的设计是“只增不删”的流水账，它本身就是一种审计日志，因此**不需要**为它创建对应的 `_history` 表，也**不需要**继承 `Auditable`。

------

### **Part 2: `app/pharmacy` 模块 — 数据契约 (`schemas.py`)**

为新模型创建 Pydantic Schemas，并设计好嵌套响应。

Python

```
# app/pharmacy/schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.clinic.schemas import Doctor # 假设可以从 clinic 导入

# --- Drug & Category Schemas ---
# ... 此处省略 DrugCategory 和 Drug 的 Base, Create, Update, Response Schemas ...
# Drug 的 Response Schema 应包含其 Category 信息

# --- Prescription & Detail Schemas ---
class PrescriptionDetailBase(BaseModel):
    dosage: str
    frequency: str
    days: int
    quantity: int
    drug_id: int

class PrescriptionDetailCreate(PrescriptionDetailBase):
    pass

class PrescriptionDetail(PrescriptionDetailBase):
    id: int
    drug: Drug # 嵌套显示药品信息
    model_config = ConfigDict(from_attributes=True)

class PrescriptionBase(BaseModel):
    prescription_date: datetime
    medical_record_id: int
    doctor_id: int

class PrescriptionCreate(PrescriptionBase):
    details: List[PrescriptionDetailCreate] # 创建主表时同时创建明细

class Prescription(PrescriptionBase):
    id: int
    dispensing_status: str
    doctor: Doctor # 嵌套显示医生信息
    details: List[PrescriptionDetail] = []
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
    model_config = ConfigDict(from_attributes=True)
```

------

### **Part 3: `app/pharmacy` 模块 — 业务逻辑 (`service.py`)**

#### **步骤 3.1: 标准服务**

为 `DrugCategory`, `Drug`, `Prescription`, `PrescriptionDetail` 创建继承自 `BaseService` 的标准服务类。

- `PrescriptionService` 的 `create` 方法需要重写，以处理嵌套创建 `PrescriptionDetail` 的逻辑。

#### **步骤 3.2: 【核心】库存服务 (`InventoryService`)**

这个服务不继承 `BaseService`，需要手动实现。

Python

```
# app/pharmacy/service.py
from sqlalchemy import func
from app.core.context import current_user_id
# ...其他导入...

class InventoryService:
    def add_stock(self, db: Session, *, drug_id: int, quantity: int, notes: Optional[str] = None) -> models.InventoryTransaction:
        """入库操作"""
        if quantity <= 0:
            raise ValidationException("入库数量必须为正数")
        
        transaction = models.InventoryTransaction(
            transaction_time=datetime.utcnow(),
            transaction_type=models.InventoryTransactionType.STOCK_IN,
            quantity_change=quantity,
            notes=notes,
            drug_id=drug_id,
            action_by_id=current_user_id.get()
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    def dispense_drugs(self, db: Session, *, prescription_id: int, notes: Optional[str] = None) -> List[models.InventoryTransaction]:
        """根据处方发药，一次性扣减所有药品库存"""
        prescription = db.query(models.Prescription).get(prescription_id)
        # ... 检查处方状态等逻辑 ...
        
        transactions = []
        for detail in prescription.details:
            current_stock = self.get_current_stock(db, drug_id=detail.drug_id)
            if current_stock < detail.quantity:
                raise ValidationException(f"药品 {detail.drug.name} 库存不足")
            
            transaction = models.InventoryTransaction(
                transaction_time=datetime.utcnow(),
                transaction_type=models.InventoryTransactionType.DISPENSE,
                quantity_change=-detail.quantity, # 负数为扣减
                notes=f"处方 #{prescription.id} 发药",
                drug_id=detail.drug_id,
                action_by_id=current_user_id.get()
            )
            transactions.append(transaction)
        
        db.add_all(transactions)
        # 更新处方状态为“已发药”
        prescription.dispensing_status = models.DispensingStatus.DISPENSED
        db.add(prescription)
        
        db.commit()
        return transactions

    def get_current_stock(self, db: Session, *, drug_id: int) -> int:
        """计算指定药品的当前库存"""
        total = db.query(func.sum(models.InventoryTransaction.quantity_change)).filter(
            models.InventoryTransaction.drug_id == drug_id
        ).scalar()
        return total or 0

# 实例化所有服务
inventory_service = InventoryService()
# ... 其他服务的实例化 ...
```

------

### **Part 4 & 5: API 端点、整合与迁移**

1. API 端点

   :

   - 为药品、药品分类提供标准的 CRUD 接口。
   - 设计嵌套路由来创建处方：`POST /medical-records/{record_id}/prescriptions/`。
   - 设计发药接口：`POST /prescriptions/{prescription_id}/dispense`。
   - 设计库存查询接口：`GET /drugs/{drug_id}/stock`。

2. 整合与迁移

   ：

   - 在 `alembic/env.py` 中导入 `app.pharmacy.models`。
   - 在 `app/routes.py` 中挂载 `pharmacy_router`。
   - 运行 `alembic revision --autogenerate -m "Add pharmacy module"` 和 `alembic upgrade head`。

### **Part 6: 测试策略**

- 核心流程测试

  ：编写一个覆盖“开处方 -> 发药 -> 库存扣减”的完整集成测试。

  1. 创建病历。
  2. 为病历创建处方和处方明细。
  3. 为处方中的药品添加入库记录，使其有库存。
  4. 调用发药接口。
  5. 验证处方状态是否变为 `dispensed`。
  6. 验证药品的当前库存是否被正确扣减。

完成此阶段后，您的诊所系统将具备药品和库存管理能力，向一个完整的 HIS 系统又迈进了一大步。祝您开发顺利！