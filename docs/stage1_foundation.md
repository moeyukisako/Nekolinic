## **全栈开发与协作高级指南 (V2.0) - Nekolinic 项目**

### **1. 核心理念与数据流 (无变化)**

我们的核心理念依然是**分层架构**和**功能模块化**。数据流保持单向清晰：

```
(外部客户端) -> [ API 层 ] -> [ Service 层 ] -> [ 数据访问层 (ORM) ]
```

### **2. 各层职责与高级规范 (已优化)**

#### **2.1 `models.py` - 数据模型层**

- 核心功能与命名规则

  : (与 V1.0 指南保持一致)

  - **职责**: 定义数据库的表结构、字段、约束和关系。
  - **规范**: 使用 SQLAlchemy Declarative ORM，继承自共享的 `Base`，包含主业务表和对应的 `_history` 审计表。

#### **2.2 `schemas.py` - 数据契约层**

- 核心功能与命名规则

  : (与 V1.0 指南保持一致)

  - **职责**: 使用 Pydantic 定义 API 的数据形态，用于请求验证和响应序列化。
  - **规范**: 遵循 `Base`, `Create`, `Update`, `[ModelName]` 的命名范式，并配置 `ConfigDict(from_attributes=True)`。

- 优化点 - 嵌套响应

  :

  - 为了提供更丰富的 API 响应，

    ```
    [ModelName]
    ```

     类型的 

    ```
    schema
    ```

    应该

    包含其关联对象的 

    ```
    schema
    ```

    。

    Python

    ```
    # app/patient/schemas.py
    
    class MedicalRecord(MedicalRecordBase):
        id: int
        # ...
    
    class Patient(PatientBase): # 响应模型
        id: int
        # 嵌套 medical_records，返回病患时自动带出其所有病历
        medical_records: list[MedicalRecord] = [] 
    ```

#### **2.3 `service.py` - 业务逻辑层 (重大优化)**

##### **核心功能 (已优化)**

- **职责**: 封装所有业务规则和数据库交互。

- **优化点 - 引入通用基类 `BaseService`**:

  - 为了避免在每个 `service` 文件中重复编写几乎完全一样的 `get`, `create`, `update`, `remove` 代码，我们创建一个可复用的 `BaseService` (或称之为 Repository 模式)。

  1. **创建 `app/core/service_base.py`**:

     Python

     ```
     # app/core/service_base.py
     from typing import Any, Generic, Type, TypeVar
     from pydantic import BaseModel
     from sqlalchemy.orm import Session
     from app.core.database import Base
     
     ModelType = TypeVar("ModelType", bound=Base)
     CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
     UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
     
     class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
         def __init__(self, model: Type[ModelType]):
             """
             基础服务类，预先实现了通用的 CRUD 方法。
             :param model: SQLAlchemy 模型类
             """
             self.model = model
     
         def get(self, db: Session, id: Any) -> ModelType | None:
             return db.query(self.model).filter(self.model.id == id).first()
     
         def get_multi(
             self, db: Session, *, skip: int = 0, limit: int = 100
         ) -> list[ModelType]:
             return db.query(self.model).offset(skip).limit(limit).all()
     
         def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
             obj_in_data = obj_in.model_dump()
             db_obj = self.model(**obj_in_data)
             db.add(db_obj)
             db.commit()
             db.refresh(db_obj)
             return db_obj
     
         def update(
             self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType | dict[str, Any]
         ) -> ModelType:
             obj_data = db_obj.model_dump()
             if isinstance(obj_in, dict):
                 update_data = obj_in
             else:
                 update_data = obj_in.model_dump(exclude_unset=True)
     
             for field in obj_data:
                 if field in update_data:
                     setattr(db_obj, field, update_data[field])
     
             db.add(db_obj)
             db.commit()
             db.refresh(db_obj)
             return db_obj
     
         def remove(self, db: Session, *, id: int) -> ModelType | None:
             obj = db.query(self.model).get(id)
             if obj:
                 db.delete(obj)
                 db.commit()
             return obj
     ```

  2. 具体 Service 继承 BaseService:

     现在，patient_service 的实现变得极其简单。

     Python

     ```
     # app/patient/service.py
     from sqlalchemy.orm import Session
     from app.core.service_base import BaseService
     from . import models, schemas
     
     class PatientService(BaseService[models.Patient, schemas.PatientCreate, schemas.PatientUpdate]):
         def __init__(self):
             super().__init__(models.Patient)
     
         # 在这里添加 Patient 独有的业务逻辑方法
         # 例如：get_patient_by_id_card(...)
         def get_by_id_card(self, db: Session, *, id_card: str) -> models.Patient | None:
             return db.query(models.Patient).filter(models.Patient.id_card_number == id_card).first()
     
     # 实例化 service，以便在 api 层使用
     patient_service = PatientService()
     ```

  - **好处**: 极大减少了重复代码，所有模块的 CRUD 逻辑都得到了统一，并且易于维护和扩展。

##### **命名规则**

- **类名**: `[ModelName]Service`，例如 `PatientService`。
- **实例名**: `lowercase_snake_case`，例如 `patient_service`。
- **方法**: 保持 `动词_名词` 格式，自定义业务方法应有清晰的命名。

#### **2.4 `api.py` - API 接口层 (重大优化)**

##### **核心功能 (已优化)**

- **职责**: 定义路由，处理 HTTP 协议细节。

- **优化点 1 - 统一的异常处理**:

  - 我们不应在每个 API 端点中手动处理 `try...except`。FastAPI 提供了优雅的全局异常处理机制。

  1. **在 `app/core/exceptions.py` 中定义好业务异常** (我们已在 V1.0 指南中完成)。

  2. 在 `app/app.py` 中注册异常处理器

     :

     Python

     ```
     # app/app.py
     from fastapi import FastAPI, Request, status
     from fastapi.responses import JSONResponse
     from app.core.exceptions import PatientNotFoundException # 导入自定义异常
     
     app = FastAPI()
     
     @app.exception_handler(PatientNotFoundException)
     async def patient_not_found_exception_handler(request: Request, exc: PatientNotFoundException):
         return JSONResponse(
             status_code=status.HTTP_404_NOT_FOUND,
             content={"message": f"Patient with id {exc.patient_id} not found."},
         )
     
     # ... 在这里注册其他异常处理器 ...
     ```

  - **好处**: 现在，任何 `service` 抛出 `PatientNotFoundException`，都会被自动捕获并返回一个标准的 `404 Not Found` JSON 响应，API 层的代码变得极其干净。

- **优化点 2 - 依赖注入服务实例**:

  - 与其在每个 API 函数中手动导入和使用 `service` 实例，不如利用 FastAPI 的依赖注入系统。

  1. 在 `api.py` 中直接依赖 `service` 实例

     :

     Python

     ```
     # app/patient/api.py
     from fastapi import APIRouter, Depends, HTTPException
     from sqlalchemy.orm import Session
     from . import schemas, service
     from app.core.database import get_db
     
     router = APIRouter()
     
     @router.post("/", response_model=schemas.Patient)
     def create_patient(
         *,
         db: Session = Depends(get_db),
         patient_in: schemas.PatientCreate,
         # (如果需要权限，可以在此添加 Depends(get_current_user))
     ):
         """创建新病患。"""
         # 直接调用 service 实例的方法
         return service.patient_service.create(db=db, obj_in=patient_in)
     
     @router.get("/{patient_id}", response_model=schemas.Patient)
     def read_patient(
         *,
         db: Session = Depends(get_db),
         patient_id: int,
     ):
         """根据 ID 获取病患信息。"""
         patient = service.patient_service.get(db=db, id=patient_id)
         if not patient:
             # 即使有全局处理器，也可以在需要时手动抛出 HTTP 异常
             raise HTTPException(
                 status_code=404, 
                 detail="Patient not found"
             )
         return patient
     ```

  - **好处**: 更好地利用了框架特性，使得测试时可以轻松地替换依赖项（例如，用一个 `MockPatientService` 来替代真实的 `service`）。

### **3. 自动化审计的高级实现**

在 V1.0 指南中，我们提出了 `before_flush` 事件监听器方案，但留下一个关键问题：**如何在事件监听器中获取当前操作用户？**

- 解决方案

  : 使用 Python 的 

  ```
  contextvars
  ```

  。

  1. 定义上下文变量

     : 在一个共享的地方（如 

     ```
     app/core/context.py
     ```

     ）定义一个上下文变量。

     Python

     ```
     # app/core/context.py
     from contextvars import ContextVar
     from typing import Optional
     
     current_user_id: ContextVar[Optional[int]] = ContextVar("current_user_id", default=None)
     ```

  2. 创建中间件

     : 在 

     ```
     app/app.py
     ```

      中创建一个中间件，在每个请求开始时，从请求头（如 JWT Token）中解析出用户 ID，并设置到该上下文变量中。

     Python

     ```
     # app/app.py
     from starlette.middleware.base import BaseHTTPMiddleware
     from app.core.context import current_user_id
     
     class UserContextMiddleware(BaseHTTPMiddleware):
         async def dispatch(self, request: Request, call_next):
             # 此处是伪代码：你需要实现从请求中解析用户ID的逻辑
             # user_id = await get_user_id_from_token(request)
             user_id = 1 # 假设解析出的用户ID为 1
     
             token = current_user_id.set(user_id)
             response = await call_next(request)
             current_user_id.reset(token)
             return response
     
     app.add_middleware(UserContextMiddleware)
     ```

  3. 在监听器中获取用户

     : 现在，

     ```
     auditing.py
     ```

      中的监听器可以安全地获取到用户ID。

     Python

     ```
     # app/core/auditing.py
     from app.core.context import current_user_id
     
     def before_flush_listener(...):
         action_by_id = current_user_id.get()
         if action_by_id is None:
             action_by_id = 0 # 0 代表系统操作
         # ... 后续逻辑不变 ...
     ```

  - **好处**: 这是一个**线程安全**且与业务逻辑完全解耦的方案，用于在请求处理的深层逻辑中安全地传递上下文信息。

### **4. 数据库创建与演进 (无变化)**

此部分的指南（使用 `init_db.py` 进行初始化，使用 `Alembic` 进行生产迁移）依然是最佳实践，无需改动。

------

这份 V2.0 指南通过引入**通用服务基类**、**全局异常处理**和**上下文变量**等高级模式，极大地提升了原有架构的开发效率、可维护性和健壮性，为您和您的团队提供了一套专业、现代的开发标准。