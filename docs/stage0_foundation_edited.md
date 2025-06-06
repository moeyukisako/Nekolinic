

## **架构与开发实践优化指南 (V3.0) - Nekolinic项目**

### **1. 架构与代码优化 (Architecture & Code Refinement)**

#### **1.1 严格执行分层职责 (Stricter Layer Enforcement)**

这是优化的基础。我们需确保每一层都“纯粹”。

- **API 层 (`api.py`)**:

  - **职责**: 只负责 HTTP 协议转换。解析请求，调用 Service，返回响应。

  - **禁止**: 出现任何业务逻辑判断 (`if/else`) 或直接的数据库操作。

  - 示例

    :

    Python

    ```
    # app/patient/api.py
    @router.post("/")
    def create_patient(patient_in: schemas.PatientCreate, service: PatientService = Depends()):
        # 只做转换和调用，所有逻辑都在 service 里
        return service.create_new_patient_profile(patient_data=patient_in)
    ```

- **Service 层 (`service.py`)**:

  - **职责**: 应用的业务逻辑核心。
  - **禁止**: 导入任何 FastAPI 相关的模块（如 `Request`, `HTTPException`）。应通过抛出自定义业务异常（如 `PatientNotFoundException`）来与上层通信。

- **数据访问层 (`models.py`)**:

  - **职责**: 仅定义数据结构。
  - **禁止**: 出现任何方法或业务逻辑。

#### **1.2 进一步简化 `BaseService` 实现 (Enhanced `BaseService`)**

您提出的这一点非常关键。我们可以让 `BaseService` 更加强大和灵活。

- **优化方向**:

  1. **增加通用查询**: 添加 `get_by_attribute`, `get_multi_by_ids` 等通用方法。
  2. **集成审计信息**: 在创建和更新时，自动注入 `created_by_id` 和 `updated_by_id`。

- **`app/core/service_base.py` 优化示例**:

  Python

  ```
  # app/core/service_base.py
  from typing import Generic, Type, TypeVar, Any, Optional, list, Dict
  # ... 其他导入 ...
  from app.core.context import current_user_id # 导入我们用于获取用户的上下文变量
  
  class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
      # ... __init__, get, get_multi ...
  
      def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
          obj_in_data = obj_in.model_dump()
  
          # (优化) 自动注入审计信息
          user_id = current_user_id.get()
          if not user_id:
              raise Exception("操作用户信息丢失，无法创建记录") # 或者使用默认系统用户ID
  
          obj_in_data['created_by_id'] = user_id
          obj_in_data['updated_by_id'] = user_id
  
          db_obj = self.model(**obj_in_data)
          # ... 后续逻辑不变 ...
          return db_obj
  
      def update(
          self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType | Dict[str, Any]
      ) -> ModelType:
          # (优化) 自动注入审计信息
          user_id = current_user_id.get()
          if not user_id:
              raise Exception("操作用户信息丢失，无法更新记录")
  
          # ... 原有更新逻辑 ...
  
          setattr(db_obj, 'updated_by_id', user_id) # 确保更新操作者
          db.add(db_obj)
          db.commit()
          db.refresh(db_obj)
          return db_obj
  
      # (新增) 按条件查询的通用方法
      def get_by_attributes(self, db: Session, **kwargs) -> Optional[ModelType]:
          """根据任意字段查询单个对象"""
          return db.query(self.model).filter_by(**kwargs).first()
  ```

#### **1.3 采用装饰器优化代码 (Leveraging Decorators)**

装饰器是减少重复代码、实现横切关注点的利器。

- **权限验证装饰器**:

  - 我们可以创建一个装饰器，用于保护需要特定角色的 API 端点。

  - `app/core/security.py` 示例

    :

    Python

    ```
    # app/core/security.py
    from functools import wraps
    from fastapi import Depends, HTTPException, status
    # from .auth import get_current_active_user ...
    
    def requires_role(role: str):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs, current_user: models.User = Depends(get_current_active_user)):
                if role not in current_user.roles: # 假设用户有 roles 列表
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to perform this action",
                    )
                return await func(*args, **kwargs, current_user=current_user)
            return wrapper
        return decorator
    ```

  - API 使用

    :

    Python

    ```
    # app/finance/api.py
    @router.post("/reports")
    @requires_role("admin") # <-- 使用装饰器保护路由
    async def generate_financial_report(...):
        # ... 只有 admin 角色可以访问 ...
    ```

- **事务装饰器**:

  - 简化事务管理，确保一个 `service` 方法要么完全成功，要么完全失败。

  - `app/core/database.py` 示例

    :

    Python

    ```
    # app/core/database.py
    from functools import wraps
    
    def transactional(func):
        @wraps(func)
        def wrapper(self, db: Session, *args, **kwargs):
            try:
                result = func(self, db, *args, **kwargs)
                db.commit()
                return result
            except Exception as e:
                db.rollback()
                raise e # 重新抛出异常，让上层处理
        return wrapper
    ```

  - Service 使用

    :

    Python

    ```
    # app/finance/service.py
    class FinanceService(...):
        @transactional # <-- 装饰器自动管理 commit 和 rollback
        def process_complex_payment(self, db: Session, ...):
            # ... 执行多个数据库操作 ...
            # 不再需要手动调用 db.commit() 或 db.rollback()
    ```

### **2. 数据层面优化 (Data Layer Refinement)**

#### **2.1 审计系统优化 (Auditing System Enhancement)**

- **使用元类自动注册 `AUDIT_MAP`**:

  - 这是一个非常高级但有效的技巧，可以避免每次新增模型时都手动去 `auditing.py` 中更新映射关系。

  - `app/core/auditing.py` 优化示例

    :

    Python

    ```
    # app/core/auditing.py
    
    AUDIT_MAP = {}
    
    class Auditable:
        """一个 Mixin 类，所有需要被审计的主模型都可以继承它。"""
        pass
    
    def register_audit_model(history_model):
        """一个类装饰器，用于注册历史模型和它对应的主模型。"""
        def decorator(main_model):
            if not issubclass(main_model, Auditable):
                raise TypeError("被审计的模型必须继承自 Auditable")
            AUDIT_MAP[main_model] = history_model
            return main_model
        return decorator
    
    # ... before_flush_listener 逻辑不变 ...
    ```

  - `models.py` 使用

    :

    Python

    ```
    # app/patient/models.py
    from app.core.auditing import Auditable, register_audit_model
    
    @register_audit_model(PatientHistory) # <-- 使用装饰器自动注册
    class Patient(Base, Auditable): # <-- 继承 Auditable Mixin
        # ...
    ```

  - **好处**: 完全自动化，消除了人为遗忘导致的错误。

- **软删除 (Soft Deletes)**:

  - 对于核心业务表（如 `patients`, `medical_records`），物理删除通常是禁止的。软删除是一个更好的选择。

  - 实现

    :

    1. 在主模型中增加一个字段 `deleted_at: Column(DateTime, nullable=True)`。
    2. 重写 `BaseService` 中的 `remove` 方法，将其行为从 `db.delete(obj)` 改为更新 `deleted_at` 字段。
    3. 修改所有 `get` 和 `get_multi` 方法，默认只查询 `deleted_at IS NULL` 的记录。
    4. 在审计历史表中，`action_type` 依然记录为 `'DELETE'`。

### **3. 开发流程与实践 (Development Process & Practices)**

#### **3.1 测试策略 (Testing Strategy)**

- **单元测试**: 针对 `service` 层中的复杂业务逻辑方法（如计费、报表生成）编写单元测试，使用 Mock 对象模拟数据库会话。
- **集成测试**: 为每个功能模块编写集成测试，使用测试数据库（如独立的 SQLite 或 Docker 化的 MariaDB）来验证 `API -> Service -> DB` 的完整流程。
- **端到端 (E2E) 测试**: 使用 Cypress 或 Playwright 等工具，模拟真实用户操作，测试核心业务流程（如用户登录 -> 预约 -> 看诊 -> 开处方 -> 付费）的正确性。

#### **3.2 文档优化 (Documentation Enhancement)**

- **API 文档**: FastAPI 已自动生成了 OpenAPI (Swagger/ReDoc) 文档。我们需要做的是为每个端点和 `schema` 添加清晰的 `description`、`summary` 和 `example`，使其更具可读性。
- **代码示例**: 在项目的 `docs` 目录下，为每种高级模式（如 `BaseService` 的使用、装饰器的应用）创建简短的 `.md` 文件和代码示例，作为新成员的快速入门指南。

