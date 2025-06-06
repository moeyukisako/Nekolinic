### **核心开发策略：增量重构，逐个击破**

我们将采用“切片式”重构方法。选择一个业务功能“垂直切片”（从 `models` -> `service` -> `api`），将其完全按照新规范进行重构和优化，充分测试后再进行下一个切片。

------

### **推荐的开发路径**

#### **阶段零：奠定基石 (Foundation Setup)**

在开始任何业务功能开发前，必须先搭建好新架构的“骨架”。这一步不涉及复杂的业务逻辑，但至关重要。

1. **创建新目录结构**:
   - 在 `app/` 下创建 `core/`, `user/`, `patient/`, `clinic/`, `pharmacy/`, `finance/` 等新目录。
   - 在每个新目录中创建空的 `__init__.py`, `models.py`, `schemas.py`, `service.py`, `api.py` 文件。
2. **实现核心模块 (`app/core`)**:
   - **`database.py`**: 定义并实现共享的 `Base`, `engine`, `SessionLocal` 和 `get_db`。这是所有模块数据库操作的基础。
   - **`auditing.py`**: (可选，但建议) 创建审计事件监听器的框架代码。即使 `AUDIT_MAP` 暂时为空，也要建立这个机制。
   - **`exceptions.py`**: 定义通用的自定义异常，如 `ResourceNotFoundException`。
3. **配置数据库迁移工具 (Alembic)**:
   - 在项目根目录运行 `alembic init alembic`。
   - **立即配置 `alembic/env.py`**，使其能找到我们共享的 `app.core.database.Base` 并导入所有功能模块的 `models.py`。**这是确保未来所有数据库变更都能被追踪的关键第一步。**

#### **阶段一：用户与认证模块 (`app/user`) - 系统的大门**

这是最理想的起点，因为系统中几乎所有其他功能都依赖于用户认证和权限。

1. **`models.py`**:
   - 将原 `database/schema.py` 中的 `User` 模型代码移动到 `app/user/models.py`。
   - 按照我们的 V3.0 规范，为 `User` 表添加所有基础审计字段 (`created_at` 等)。
   - 创建 `UserHistory` 表。
2. **`schemas.py`**:
   - 定义 `UserBase`, `UserCreate`, `UserUpdate`, `User` 以及 `Token` 等 Pydantic 模型。
3. **数据库迁移**:
   - 运行 `alembic revision --autogenerate -m "Init user and user_history tables"`。这会生成第一个迁移脚本。
   - 运行 `alembic upgrade head`，在数据库中实际创建这两张表。
4. **`service.py`**:
   - 将原 `app/auth/` 目录下的密码处理、认证逻辑和原 `app/services/user_service.py` 的 CRUD 功能，重构并整合进新的 `app/user/service.py` 中。可以创建一个 `UserService` 类来组织这些方法。
5. **`api.py`**:
   - 将原 `app/api/auth_api.py` 和 `user_api.py` 的端点重构到新的 `app/user/api.py` 中。
   - 确保所有端点都遵循新的调用逻辑：`API` -> `Service` -> `Data`。
6. **测试**:
   - 更新或编写新的单元测试和集成测试，确保用户注册、登录、获取用户信息、更新、删除等功能在新架构下工作正常。

**完成此阶段后，您将拥有一个稳定、可审计的用户核心，可以支撑后续所有模块的开发。**

#### **阶段二：病患与临床核心模块 (`app/patient` & `app/clinic`)**

病患和看诊流程是诊所的业务核心，第二步就应该聚焦于此。

1. **`models.py`**:
   - **`app/patient/`**: 迁移 `Patient`, `MedicalRecord` 模型，并创建新的 `VitalSign` 模型。为它们都添加完整的审计字段和对应的 `_history` 表。**确保实现 `MedicalRecord` 到 `Appointment` 的外键关联**。
   - **`app/clinic/`**: 迁移 `Doctor`, `Appointment` 模型，并添加审计字段和 `_history` 表。
2. **数据库迁移**:
   - 再次运行 `alembic revision --autogenerate ...` 和 `alembic upgrade head` 来更新数据库。
3. **`schemas.py` & `service.py` & `api.py`**:
   - 按照新规范，分别为 `patient`, `medical_record`, `doctor`, `appointment` 等实体创建完整的 CRUD 和业务逻辑。
   - 例如，在 `AppointmentService` 中，创建一个预约后，可能需要触发某些后续逻辑。
4. **测试**:
   - 重点测试病患的创建、查询，病历的创建，以及预约的整个生命周期。

#### **阶段三：药局与处方模块 (`app/pharmacy`)**

此模块与临床核心紧密相连，是看诊流程的自然延伸。

1. **`models.py`**:
   - 迁移 `Drug`, `DrugCategory`, `Prescription`, `PrescriptionDetail` 模型。
   - **用新的 `InventoryTransaction` 模型替换掉旧的库存模型**。
   - 为所有模型（`InventoryTransaction` 除外）添加审计字段和 `_history` 表。
2. **数据库迁移**:
   - 更新数据库。
3. **`service.py`**:
   - 实现药品管理、处方管理逻辑。
   - **实现新的库存服务**：`stock_in` (入库), `dispense` (发药), `get_current_stock` (计算当前库存) 等方法。`dispense` 方法会创建一条 `quantity_change` 为负数的流水记录。
4. **`api.py` & 测试**:
   - 实现相关 API 并编写测试，确保处方能正确关联药品，发药后库存能正确扣减。

#### **阶段四：财务模块 (`app/finance`)**

财务是业务流程的最后一环，它依赖于前面所有模块产生的数据，因此放在最后重构。

1. **`models.py`**:
   - 迁移 `Bill`, `BillItem`, `Payment`, `Insurance` 模型，并添加审计支持。
   - **确保实现 `Bill` 到 `MedicalRecord` 的外键关联**，使费用可追溯。
2. **数据库迁移**:
   - 更新数据库。
3. **`service.py`**:
   - 实现核心的计费逻辑。例如，创建一个 `BillingService`，其 `generate_bill_for_record` 方法可以根据一份病历（包含的诊疗和药品）自动生成 `Bill` 和 `BillItem`。
   - 实现支付处理逻辑。
4. **`api.py` & 测试**:
   - 实现帐务相关的 API 并进行端到端的测试，例如完成一次看诊后，能否正确生成帐单并完成支付。

#### **阶段五：清理与收尾**

1. **删除旧代码**: 在所有功能都迁移到新架构后，安全地删除原有的 `app/controllers`, `app/auth` 等旧目录。
2. **代码审查**: 对整个项目进行一次全面的代码审查，确保所有模块都遵循了最终的开发指南。
3. **回归测试**: 执行所有测试用例，确保重构没有引入新的问题。