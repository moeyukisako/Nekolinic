## 第四阶段开发指南：财务与计费模块 (Finance)

### **核心目标**

此阶段是业务流程的“最后一公里”，我们将把之前所有的临床行为（如看诊、开药）转化为具体的财务记录。核心任务是实现一个能够根据病历自动生成账单的计费引擎，并处理支付流程。

### **Part 1: `app/finance` 模块 — 模型定义 (`models.py`)**

#### **步骤 1.1: 创建模块文件**

在 `app/finance/` 目录下，创建以下四个文件：

- `models.py`
- `schemas.py`
- `service.py`
- `api.py`

#### **步骤 1.2: 定义数据模型**

在 `app/finance/models.py` 中，根据 `guideline1_separated_data_schema.md` 定义以下所有模型。

Python

```
# app/finance/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum

# --- History Models ---
# 此处省略 InsuranceHistory, BillHistory, BillItemHistory, PaymentHistory 的代码
# 它们的结构与之前阶段的 History 模型完全一致，请比照创建。

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
    # ...审计字段...
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
    # ...审计字段...

    patient = relationship("Patient")
    medical_record = relationship("MedicalRecord")
    items = relationship("BillItem", back_populates="bill")
    payments = relationship("Payment", back_populates="bill")

@register_audit_model(BillItemHistory)
class BillItem(Base, Auditable):
    __tablename__ = 'bill_items'
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(200), nullable=False)
    item_type = Column(String(50), nullable=False) # e.g., 'consultation', 'drug', 'treatment'
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False)
    # ...审计字段...

    bill = relationship("Bill", back_populates="items")

@register_audit_model(PaymentHistory)
class Payment(Base, Auditable):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False)
    # ...审计字段...

    bill = relationship("Bill", back_populates="payments")
```

------

### **Part 2: `app/finance` 模块 — 数据契约 (`schemas.py`)**

为新模型创建 Pydantic Schemas，并设计好嵌套响应。

Python

```
# app/finance/schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# --- BillItem & Payment Schemas ---
class BillItemBase(BaseModel):
    item_name: str
    item_type: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
class BillItem(BillItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
    
class PaymentBase(BaseModel):
    payment_date: datetime
    amount: Decimal
    payment_method: str
    bill_id: int
class Payment(PaymentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Bill Schemas ---
class BillBase(BaseModel):
    invoice_number: str
    bill_date: datetime
    total_amount: Decimal
    patient_id: int
    medical_record_id: int
class Bill(BillBase):
    id: int
    status: str
    items: List[BillItem] = []
    payments: List[Payment] = []
    model_config = ConfigDict(from_attributes=True)

# --- Insurance Schemas (省略) ---
# ...
```

------

### **Part 3: `app/finance` 模块 — 业务逻辑 (`service.py`)**

#### **步骤 3.1: 基础服务**

为 `Insurance` 和 `Payment` 创建标准的、继承自 `BaseService` 的服务类。

#### **步骤 3.2: 【核心】计费服务 (`BillingService`)**

这个服务将包含最核心的业务逻辑：自动生成账单。

Python

```
# app/finance/service.py
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import ValidationException
from app.patient import models as patient_models
from app.pharmacy import models as pharmacy_models
from decimal import Decimal
import uuid # 用于生成唯一发票号
# ...其他导入...

class BillingService:
    def generate_bill_for_record(self, db: Session, *, medical_record_id: int) -> models.Bill:
        # 1. 使用预加载一次性获取所有需要的数据
        record = db.query(patient_models.MedicalRecord).options(
            joinedload(patient_models.MedicalRecord.appointment),
            joinedload(patient_models.MedicalRecord.patient),
            joinedload(patient_models.MedicalRecord.prescription)
            .joinedload(pharmacy_models.Prescription.details)
            .joinedload(pharmacy_models.PrescriptionDetail.drug)
        ).filter(patient_models.MedicalRecord.id == medical_record_id).first()

        if not record:
            raise ResourceNotFoundException(resource_id=medical_record_id, resource_type="MedicalRecord")
        
        # 2. 检查是否已生成过账单
        if db.query(models.Bill).filter(models.Bill.medical_record_id == medical_record_id).first():
            raise ValidationException(f"病历ID {medical_record_id} 的账单已存在")

        # 3. 创建账单主表
        new_bill = models.Bill(
            invoice_number=str(uuid.uuid4()),
            bill_date=datetime.now(UTC),
            total_amount=Decimal('0.00'), # 初始总额为0
            status=models.BillStatus.UNPAID,
            patient_id=record.patient_id,
            medical_record_id=record.id
        )
        # 此处我们不继承 BaseService，所以手动设置审计信息
        user_id = current_user_id.get()
        if user_id is None: raise AuthenticationException(...)
        now = datetime.now(UTC)
        new_bill.created_at = new_bill.updated_at = now
        new_bill.created_by_id = new_bill.updated_by_id = user_id
        
        db.add(new_bill)
        db.flush() # 刷新以获取 new_bill.id

        # 4. 创建账单明细
        bill_items = []
        total_amount = Decimal('0.00')

        # 添加挂号/诊费
        # (此处假设诊费固定为150，实际应从配置或医生等级等获取)
        consultation_fee = Decimal('150.00')
        bill_items.append(models.BillItem(
            item_name="诊疗费", item_type="consultation", quantity=1,
            unit_price=consultation_fee, subtotal=consultation_fee, bill_id=new_bill.id
        ))
        total_amount += consultation_fee

        # 添加药品费用
        if record.prescription:
            for detail in record.prescription.details:
                subtotal = detail.drug.unit_price * detail.quantity
                bill_items.append(models.BillItem(
                    item_name=detail.drug.name, item_type="drug", quantity=detail.quantity,
                    unit_price=detail.drug.unit_price, subtotal=subtotal, bill_id=new_bill.id
                ))
                total_amount += subtotal
        
        db.add_all(bill_items)
        
        # 5. 更新账单总额
        new_bill.total_amount = total_amount
        db.add(new_bill)
        
        db.commit()
        db.refresh(new_bill)
        return new_bill

# ...PaymentService 的实现...
# 其中应包含处理支付后更新 Bill 状态的逻辑
```

------

### **Part 4 & 5: API 端点、整合与迁移**

1. API 端点

   :

   - `POST /billing/generate-from-record/{medical_record_id}`: 核心路由，用于触发账单生成。
   - `GET /bills/{bill_id}`: 查看账单详情（包含所有明细和支付记录）。
   - `POST /bills/{bill_id}/payments`: 为账单添加一笔支付。

2. 整合与迁移

   ：

   - 在 `alembic/env.py` 中导入 `app.finance.models`。
   - 在 `app/routes.py` 中挂载 `finance_router`。
   - 运行 `alembic revision --autogenerate -m "Add finance module"` 和 `alembic upgrade head`。

### **Part 6: 测试策略**

- 端到端测试

  ：编写一个覆盖“就诊 -> 开处方 -> 生成账单 -> 支付”的完整测试用例。

  1. 完整地创建一个包含处方和药品的病历。
  2. 调用 `POST /billing/generate-from-record/{medical_record_id}` 接口。
  3. 验证返回的账单 `total_amount` 是否等于诊疗费加上所有药品费用的总和。
  4. 验证 `BillItem` 的数量和内容是否正确。
  5. 调用 `POST /bills/{bill_id}/payments` 接口进行支付。
  6. 验证 `Bill` 的状态是否已更新为 `PAID`。

