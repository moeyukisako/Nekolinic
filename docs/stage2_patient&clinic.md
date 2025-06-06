## 第二阶段开发指南：病患与临床核心模块 (Patient & Clinic)

### **核心目标**

此阶段的目标是构建诊所业务的核心功能，管理**医生 (Doctor)**、**预约 (Appointment)**、**病患 (Patient)** 和 **病历 (MedicalRecord)**。我们将严格遵循已建立的分层架构和开发规范。

------

### **Part 1: `app/clinic` 模块 — 医生与预约管理**

我们首先建立 `clinic` 模块，因为后续的病历将依赖于本模块的预约信息。

#### **步骤 1.1: 创建模块文件**

在 `app/clinic/` 目录下，创建以下四个空文件：

- `models.py`
- `schemas.py`
- `service.py`
- `api.py`

#### **步骤 1.2: 定义数据模型 (`app/clinic/models.py`)**

根据 `guideline1_separated_data_schema.md`，将医生和预约的模型定义如下。

Python

```
# app/clinic/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
import enum

# --- History Models ---

class DoctorHistory(Base):
    __tablename__ = 'doctors_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # Snapshot of Doctor fields
    id = Column(Integer, index=True)
    name = Column(String(100))
    specialty = Column(String(100))
    user_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

class AppointmentHistory(Base):
    __tablename__ = 'appointments_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))

    # Snapshot of Appointment fields
    id = Column(Integer, index=True)
    appointment_time = Column(DateTime)
    status = Column(String(50))
    patient_id = Column(Integer)
    doctor_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime)

# --- Main Business Models ---

@register_audit_model(DoctorHistory)
class Doctor(Base, Auditable):
    __tablename__ = 'doctors'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User")
    appointments = relationship("Appointment", back_populates="doctor")

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@register_audit_model(AppointmentHistory)
class Appointment(Base, Auditable):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    appointment_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.SCHEDULED)
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
```

#### **步骤 1.3: 定义数据契约 (`app/clinic/schemas.py`)**

为医生和预约创建 Pydantic 模型。

Python

```
# app/clinic/schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# --- Doctor Schemas ---
class DoctorBase(BaseModel):
    name: str
    specialty: str
    user_id: int

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None

class Doctor(DoctorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    appointment_time: datetime
    patient_id: int
    doctor_id: int
    status: str = "scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_time: Optional[datetime] = None
    status: Optional[str] = None

class Appointment(AppointmentBase):
    id: int
    doctor: Doctor # 嵌套显示医生信息
    model_config = ConfigDict(from_attributes=True)
```

#### **步骤 1.4: 实现业务逻辑 (`app/clinic/service.py`)**

创建继承自 `BaseService` 的服务类。

Python

```
# app/clinic/service.py
from . import models, schemas
from app.core.service_base import BaseService

class DoctorService(BaseService[models.Doctor, schemas.DoctorCreate, schemas.DoctorUpdate]):
    # 未来可在这里添加医生相关的特殊业务逻辑
    pass

class AppointmentService(BaseService[models.Appointment, schemas.AppointmentCreate, schemas.AppointmentUpdate]):
    # 未来可在这里添加预约相关的特殊业务逻辑，例如检查医生时间是否冲突
    pass

doctor_service = DoctorService(models.Doctor)
appointment_service = AppointmentService(models.Appointment)
```

#### **步骤 1.5: 创建 API 端点 (`app/clinic/api.py`)**

为医生和预约提供基础的 CRUD 接口。

Python

```
# app/clinic/api.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from . import schemas, service
from app.core.database import get_db

router = APIRouter()

# --- Doctor Endpoints ---
@router.post("/doctors/", response_model=schemas.Doctor)
def create_doctor(doctor_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
    return service.doctor_service.create(db=db, obj_in=doctor_in)

@router.get("/doctors/", response_model=List[schemas.Doctor])
def read_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.doctor_service.get_multi(db, skip=skip, limit=limit)

# --- Appointment Endpoints ---
@router.post("/appointments/", response_model=schemas.Appointment)
def create_appointment(appt_in: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    return service.appointment_service.create(db=db, obj_in=appt_in)

@router.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.appointment_service.get_multi(db, skip=skip, limit=limit)
```

------

### **Part 2: `app/patient` 模块 — 病患与病历管理**

#### **步骤 2.1: 创建模块文件**

在 `app/patient/` 目录下，创建以下四个空文件：

- `models.py`
- `schemas.py`
- `service.py`
- `api.py`

#### **步骤 2.2: 定义数据模型 (`app/patient/models.py`)**

定义病患、病历和生命体征的模型。

Python

```
# app/patient/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, Float, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model
# 省略 History 模型的定义，结构与 clinic 模块类似

# --- Main Business Models ---

@register_audit_model(PatientHistory)
class Patient(Base, Auditable):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    birth_date = Column(Date)
    # ... 其他字段根据 guideline1 ...
    
    created_at = Column(DateTime)
    # ... 其他审计字段 ...
    
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")

@register_audit_model(MedicalRecordHistory)
class MedicalRecord(Base, Auditable):
    __tablename__ = 'medical_records'
    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(DateTime, nullable=False)
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), unique=True) # 关联到预约
    
    # ... 审计字段 ...
    
    patient = relationship("Patient", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_record")
    vital_sign = relationship("VitalSign", back_populates="medical_record", uselist=False)

@register_audit_model(VitalSignHistory)
class VitalSign(Base, Auditable):
    __tablename__ = 'vital_signs'
    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float)
    # ... 其他生命体征字段 ...
    
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), unique=True)
    
    # ... 审计字段 ...
    
    medical_record = relationship("MedicalRecord", back_populates="vital_sign")
```

#### **步骤 2.3: 定义数据契约 (`app/patient/schemas.py`)**

为 `Patient`, `MedicalRecord`, `VitalSign` 创建 Pydantic 模型，并实现嵌套响应。

Python

```
# app/patient/schemas.py
from pydantic import BaseModel, ConfigDict
# ...其他导入...

# --- VitalSign Schemas ---
class VitalSignBase(BaseModel):
    temperature: Optional[float] = None
    # ...
class VitalSign(VitalSignBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- MedicalRecord Schemas ---
class MedicalRecordBase(BaseModel):
    record_date: datetime
    # ...
class MedicalRecord(MedicalRecordBase):
    id: int
    vital_sign: Optional[VitalSign] = None # 嵌套生命体征
    model_config = ConfigDict(from_attributes=True)

# --- Patient Schemas ---
class PatientBase(BaseModel):
    name: str
    # ...
class Patient(PatientBase):
    id: int
    medical_records: List[MedicalRecord] = [] # 嵌套病历列表
    model_config = ConfigDict(from_attributes=True)

# ... 为所有模型补充 Create 和 Update Schemas ...
```

#### **步骤 2.4: 实现业务逻辑与 API**

与 `clinic` 模块类似，为 `patient`, `medical_record`, `vital_sign` 分别创建 `Service` 类和 `API` 端点。可以考虑设计嵌套路由，例如：

- `POST /patients/{patient_id}/medical_records/`：为指定病患创建病历。
- `POST /medical_records/{record_id}/vital_signs/`：为指定病历添加生命体征。

------

### **Part 3: 整合与数据库迁移**

#### **步骤 3.1: 启用所有新模块**

1. Alembic 配置

   ：打开 

   ```
   alembic/env.py
   ```

   ，

   取消注释

   ```
   patient
   ```

    和 

   ```
   clinic
   ```

    模块的模型导入。

   Python

   ```
   from app.user import models
   from app.patient import models # 取消注释
   from app.clinic import models  # 取消注释
   # ...
   ```

2. 主路由

   ：打开 

   ```
   app/routes.py
   ```

   ，导入并挂载 

   ```
   clinic
   ```

    和 

   ```
   patient
   ```

    的路由。

   Python

   ```
   from .user.api import router as user_router
   from .clinic.api import router as clinic_router   # 新增
   from .patient.api import router as patient_router # 新增
   
   router.include_router(user_router, prefix="/users", tags=["用户管理"])
   router.include_router(clinic_router, prefix="/clinic", tags=["诊所管理"])   # 新增
   router.include_router(patient_router, prefix="/patients", tags=["病患管理"]) # 新增
   ```

#### **步骤 3.2: 数据库迁移**

1. 生成迁移脚本

   ：

   Bash

   ```
   alembic revision --autogenerate -m "Add clinic and patient modules"
   ```

2. **检查脚本**：打开新生成的迁移文件，确认其中包含了所有新表 (`doctors`, `appointments`, `patients`, `medical_records`, `vital_signs` 等) 的 `op.create_table` 指令。

3. 应用迁移

   ：

   Bash

   ```
   alembic upgrade head
   ```

------

### **Part 4: 测试策略**

- 在 `tests/` 目录下创建 `clinic/` 和 `patient/` 子目录。
- 为 `Doctor` 和 `Patient` 的基础 CRUD 编写集成测试。
- 编写一个端到端的测试用例，模拟一个完整的核心流程：
  1. 创建一个 `Doctor`。
  2. 创建一个 `Patient`。
  3. 为他们创建一个 `Appointment`。
  4. 基于该 `Appointment` 创建一个 `MedicalRecord`。
  5. 验证所有数据关联是否正确。

完成以上所有步骤后，您的项目将拥有一个功能强大的临床核心。祝您开发顺利！