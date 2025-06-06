## **全栈开发与协作指南 (Nekolinic-Reborn V2.0)**

### **1. 核心理念与数据流**

本项目的后端开发遵循**分层架构**和**功能模块化**。每个业务领域（如 `patient`, `finance`）都是一个独立的包，内部包含清晰的层次结构。

#### **1.1 数据流与分层**

一个典型的 HTTP 请求处理流程如下，数据单向流动，各层职责分明：

```
(外部客户端)
      |
      V
[ API 层 (api.py) ] <--- 负责 HTTP 协议，处理请求与响应
      |
      V
[ Service 层 (service.py) ] <--- 负责业务逻辑，编排和处理数据
      |
      V
[ 数据访问层 (models.py) ] <--- 负责数据结构定义与数据库交互 (通过 SQLAlchemy ORM)
```

- **`models.py`**: 定义数据在数据库中的样子（表结构）。
- **`schemas.py`**: 定义数据在 API 接口中的样子（请求和响应的格式）。
- **`service.py`**: **应用的大脑**，实现所有业务规则。
- **`api.py`**: **应用的门户**，负责与外界（前端或第三方服务）沟通。

#### **1.2 关于 `controllers` 层的优化**

在我们的新规范中，原有的 `controllers` 层将被**合并**。其逻辑将根据性质归入 `api.py` 或 `service.py`：

- 如果只是简单地调用 `service` 并返回，这部分逻辑直接在 `api.py` 中完成。
- 如果是编排多个 `service` 的复杂逻辑，应将其抽象为一个更高层次的 `service`。

这样做可以减少不必要的代码层级，使架构更简洁、高效。

------

### **2. 各层职责与规范**

#### **2.1 `models.py` - 数据模型层**

- **核心功能**:
  - **数据结构**：作为**唯一真实来源 (Single Source of Truth)**，使用 SQLAlchemy Declarative ORM 定义数据库的表结构。
  - **继承关系**: 所有业务模型和其对应的历史模型都**必须**继承自 `app.core.database.Base`。
  - **字段与约束**: 定义所有字段（`Column`）、数据类型、主键 (`primary_key`)、唯一键 (`unique`)、索引 (`index`) 和非空 (`nullable`) 等约束。
  - **表间关系**: 使用 `ForeignKey` 和 `relationship` 定义表之间的关联。
  - **审计包含**: 包含主业务表和其对应的 `_history` 表。
- **命名规则**:
  - **类名**: `UpperCamelCase` (驼峰式)，例如 `MedicalRecord`, `MedicalRecordHistory`。
  - **表名 (`__tablename__`)**: `lowercase_snake_case` (下划线式) 且为**复数**，例如 `'medical_records'`。
  - **字段名**: `lowercase_snake_case`，例如 `record_date`, `patient_id`。
- **调用逻辑**:
  - `models.py` **不应包含任何业务逻辑**。
  - 它只被 `service.py` 层导入和使用，用于数据库的增删改查操作。
  - 其他任何层（如 `api.py`）**禁止**直接导入和使用 `models`。

#### **2.2 `schemas.py` - 数据契约层**

- **核心功能**:
  - **API 规格**: 使用 Pydantic 的 `BaseModel` 定义 API 的请求体和响应体的结构。
  - **数据验证**: FastAPI 会自动使用这些 `schema` 来验证传入请求数据的类型和格式。
  - **数据序列化**: FastAPI 会使用 `response_model` 中指定的 `schema` 来过滤和格式化从数据库返回的数据，确保不会泄露敏感字段（如 `hashed_password`）。
  - **解耦**: 将 API 接口的形态与数据库的物理结构解耦，使两者可以独立演进。
- **命名规则**:
  - `[ModelName]Base`: 包含创建和读取时都共有的基础字段。
  - `[ModelName]Create`: 继承自 `Base`，用于**创建**数据（例如 `POST` 请求），通常包含创建时必需的字段。
  - `[ModelName]Update`: 继承自 `Base` 或 `BaseModel`，用于**更新**数据（例如 `PATCH` 请求），所有字段通常都是可选的 (`Optional`)。
  - `[ModelName]`: 继承自 `Base`，用于**响应**数据，通常包含 `id` 和其他从数据库读取的字段。
- **调用逻辑**:
  - 在 `api.py` 中被大量使用，作为 FastAPI 路径操作函数的参数类型提示和 `response_model`。
  - 在 `service.py` 中被用作创建和更新等方法的输入参数类型。
  - **必须**在 `schema` 中配置 `ConfigDict(from_attributes=True)` (或旧版的 `class Config: orm_mode = True`)，以允许 Pydantic 从 SQLAlchemy 的 ORM 模型实例中自动转换数据。

#### **2.3 `service.py` - 业务逻辑层**

- **核心功能**:

  - **业务逻辑封装**: **应用的核心**。所有业务规则、计算、数据处理和复杂的数据验证都在这一层实现。
  - **数据库交互**: **唯一可以直接与数据库会话 (`db: Session`) 交互的层**。负责执行所有 CRUD (Create, Read, Update, Delete) 操作。
  - **事务管理**: 复杂的业务操作（例如，创建病历后，更新库存，再生成帐单）应在同一个服务方法中完成，以确保事务的原子性。
  - **保持纯粹**: `service` 层不应知道任何关于 HTTP 的信息（如 `Request`, `Response`, `status_code`）。它的输入是 Python 对象（通常是 Pydantic `schema`），输出也是 Python 对象（通常是 SQLAlchemy `model` 实例或布尔值等）。

- **命名规则**:

  - **组织形式**: 建议将相关的业务方法组织在**类**中，例如 `PatientService`, `MedicalRecordService`。对于简单的 CRUD，也可以使用函数集合。

  - 方法命名

    : 

    动词 + 名词

     的格式，清晰地描述其功能。

    - **创建**: `create(db, *, obj_in: schemas.ModelCreate)`
    - **读取单个**: `get(db, *, id: int)`
    - **读取多个**: `get_multi(db, *, skip: int = 0, limit: int = 100)`
    - **更新**: `update(db, *, db_obj: models.Model, obj_in: schemas.ModelUpdate)`
    - **删除**: `remove(db, *, id: int)`
    - **自定义业务**: `process_payment(...)`, `calculate_report(...)`

- **调用逻辑**:

  - 由 `api.py` 层调用。
  - 方法的第一个参数**必须**是 `db: Session`，通过依赖注入传入。
  - 接收 Pydantic `schema` 或 Python 基本类型作为输入。
  - 执行数据库查询和业务逻辑。
  - 返回 SQLAlchemy 的 `model` 实例、实例列表或操作结果。

#### **2.4 `api.py` - API 接口层**

- **核心功能**:
  - **路由定义**: 使用 FastAPI 的 `APIRouter` 定义所有 HTTP 端点（路径、方法）。
  - **HTTP 协议处理**: 负责处理路径参数、查询参数、请求头、HTTP 状态码等所有与 HTTP 相关的内容。
  - **依赖注入**: 使用 `Depends` 来注入依赖项，最核心的就是获取数据库会话：`db: Session = Depends(get_db)`。
  - **请求到业务的桥梁**: 调用 `service` 层的方法来执行实际的业务逻辑。
  - **响应格式化**: 使用 `response_model` 参数指定返回数据所用的 `schema`，FastAPI 会自动完成序列化。
  - **异常处理**: 捕获 `service` 层抛出的业务异常，并将其转换为合适的 HTTP 错误响应（例如 `HTTPException`）。
- **命名规则**:
  - **路由器**: `router = APIRouter()`
  - **路径操作函数**: 与 `service` 层类似，采用**动词 + 名词**，例如 `read_patient`, `create_patient_record`。
- **调用逻辑 (一个完整请求的生命周期)**:
  1. **客户端** 发送 `POST /patients` 请求，附带 JSON 数据。
  2. `api.py` 中的 `@router.post("/patients", response_model=schemas.Patient)` 路径操作函数被触发。
  3. FastAPI 使用 `schemas.PatientCreate` 作为参数类型提示，自动验证请求体 JSON 并将其解析为一个 `PatientCreate` 对象。
  4. 该函数通过 `Depends(get_db)` 获得一个数据库会话 `db`。
  5. 函数内部调用 `service.patient.create(db=db, patient_in=patient_create_schema)`。
  6. `service.py` 中的 `create` 方法接收 `db` 和 `patient_create_schema`，创建 `models.Patient` 的实例，`add`, `commit`, `refresh` 它，然后返回这个新创建的 `models.Patient` 实例。
  7. `api.py` 的函数接收到从 `service` 返回的 `models.Patient` 实例。
  8. 函数直接返回这个实例。FastAPI 看到 `response_model=schemas.Patient`，会自动将 SQLAlchemy 模型实例转换为 `schemas.Patient` Pydantic 模型，再序列化为 JSON 发送给客户端。