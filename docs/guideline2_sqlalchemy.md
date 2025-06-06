## **数据库模型适配 SQLAlchemy 与审计实现指南 (V2.0)**

这份指南将详细阐述如何将我们设计的、分散在各个功能模块中的数据表结构，完美地适配 SQLAlchemy，并实现自动化的数据审计。

### **1. 核心原则与基石**

#### **1.1 模块化与 SQLAlchemy 的协同**

我们的模块化文件结构（例如 `app/patient/models.py`）与 SQLAlchemy 的工作方式完全兼容。SQLAlchemy 通过一个中央“注册表”（即 `Base.metadata`）来收集所有数据表的信息，模型的物理文件位置在哪里并不重要，只要它们被正确地“注册”即可。

#### **1.2 共享的声明性基础 `Base`**

`Base` 对象是连接所有分散模型的纽带，是整个适配过程的基石。

- **文件位置**: `app/core/database.py`

- 核心定义

  :

  Python

  ```
  from sqlalchemy.orm import declarative_base
  
  # 这个 Base 就是我们所有模型的统一注册中心
  Base = declarative_base()
  ```

- **规定**: 项目中所有的数据表模型，都**必须**从此 `Base` 继承。

### **2. 模型定义与适配规范**

#### **2.1 定义业务模型 (`models.py`)**

在每个功能模块的 `models.py` 中定义模型时，需遵循以下规范以适配 SQLAlchemy：

1. **导入 `Base`**: `from app.core.database import Base`

2. **继承 `Base`**: `class Patient(Base):`

3. 定义外键

   : 使用

   字符串形式

   引用目标表，格式为 

   ```
   '表名.字段名'
   ```

   。这可以避免因文件相互引用而导致的循环导入错误。

   Python

   ```
   # 正确示例 (在 MedicalRecord 模型中)
   patient_id = Column(Integer, ForeignKey('patients.id'))
   ```

4. 定义关系

   : 使用 

   ```
   relationship
   ```

    时，同样建议使用

   目标模型的类名字符串

   。使用 

   ```
   back_populates
   ```

    参数可以建立清晰的双向关系。

   Python

   ```
   # 在 Patient 模型中
   medical_records = relationship("MedicalRecord", back_populates="patient")
   
   # 在 MedicalRecord 模型中
   patient = relationship("Patient", back_populates="medical_records")
   ```

#### **2.2 定义历史与审计模型 (`_history`)**

历史记录表的定义遵循同样的基本原则（继承 `Base`），它是对主表数据在某个时间点的完整快照。

### **3. 自动化审计的实现**

为了自动化地记录数据变更历史，我们采用 **SQLAlchemy Events** 机制，这是最专业、侵入性最小的方案。

#### **3.1 方案选型：SQLAlchemy Events**

我们监听数据库会话 (Session) 的 `before_flush` 事件。该事件在数据即将通过 `INSERT`, `UPDATE`, `DELETE` 写入数据库但尚未提交时触发，可以让我们捕获所有待处理的变更。

#### **3.2 创建事件监听器 (`auditing.py`)**

在 `app/core/auditing.py` 中，我们创建监听器函数。

- **文件位置**: `app/core/auditing.py`

- 实现范例

  :

  Python

  ```
  from sqlalchemy import event
  from sqlalchemy.orm import Session
  from datetime import datetime
  
  # 假设 get_current_user() 是一个能获取当前登录用户的函数
  # from app.auth.session import get_current_user
  # from app.user.models import User
  
  from app.patient.models import Patient, PatientHistory
  # ... 导入所有需要审计的模型及其历史模型 ...
  
  # 映射：将主模型映射到其历史模型，便于查找
  AUDIT_MAP = {
      Patient: PatientHistory,
      # ... 添加其他模型的映射, 例如 Doctor: DoctorHistory ...
  }
  
  def before_flush_listener(session: Session, flush_context, instances):
      """在 session flush 前拦截所有变更，并创建历史记录。"""
      # 在实际应用中，你需要一个可靠的方式来获取当前用户
      # current_user = get_current_user(session) or User(id=0, username='system')
      # 此处为演示，假设操作者ID为 1
      action_by_id = 1 
  
      # 待添加的历史记录列表
      history_to_add = []
  
      # 遍历所有新增和修改的对象
      for instance in session.new.union(session.dirty):
          if type(instance) in AUDIT_MAP:
              HistoryModel = AUDIT_MAP[type(instance)]
              action_type = 'INSERT' if instance in session.new else 'UPDATE'
  
              snapshot = {col.name: getattr(instance, col.name) for col in instance.__table__.columns}
  
              history_record = HistoryModel(
                  **snapshot,
                  action_type=action_type,
                  action_by_id=action_by_id,
                  action_timestamp=datetime.utcnow()
              )
              history_to_add.append(history_record)
  
      # 遍历所有被删除的对象
      for instance in session.deleted:
          if type(instance) in AUDIT_MAP:
              HistoryModel = AUDIT_MAP[type(instance)]
              snapshot = {col.name: getattr(instance, col.name) for col in instance.__table__.columns}
  
              history_record = HistoryModel(
                  **snapshot,
                  action_type='DELETE',
                  action_by_id=action_by_id,
                  action_timestamp=datetime.utcnow()
              )
              history_to_add.append(history_record)
  
      # 将所有待添加的历史记录加入到会话中
      if history_to_add:
          session.add_all(history_to_add)
  
  def register_audit_listeners():
      """统一注册所有审计监听器。"""
      event.listen(Session, 'before_flush', before_flush_listener)
  ```

#### **3.3 注册监听器**

在您的应用启动入口（例如 `main.py` 或 `app/app.py`）调用注册函数，使其全局生效。

Python

```
# 在 main.py 或 app/app.py
from app.core.auditing import register_audit_listeners

# ... 创建 FastAPI app 实例 ...

# 在应用启动时注册审记监听器
register_audit_listeners()
```

### **4. 数据库的创建与演进**

#### **4.1 开发环境：首次创建 (`init_db.py`)**

此脚本用于从零开始创建所有数据表。

- **文件位置**: `/init_db.py` (项目根目录)

- 核心逻辑

  :

  Python

  ```
  from app.core.database import Base, engine
  
  print("正在导入所有功能模块的模型以完成向 Base 的注册...")
  # 关键：导入所有 models.py 文件，触发模型注册
  from app.user import models
  from app.clinic import models
  from app.patient import models
  from app.pharmacy import models
  from app.finance import models
  print("模型注册完成。")
  
  print("准备在数据库中创建所有表...")
  # create_all 会根据依赖关系按正确顺序创表
  Base.metadata.create_all(bind=engine)
  print("所有表已成功创建！")
  ```

#### **4.2 生产环境：数据库迁移 (Alembic)**

对于已上线的数据库，使用 **Alembic** 进行结构变更。

- 核心流程

  :

  1. **初始化**: 在项目根目录执行 `alembic init alembic`。

  2. 配置 `alembic/env.py`

     :

     - 修改 `sqlalchemy.url` 指向您的生产数据库。

     - 导入共享的 

       ```
       Base
       ```

        和所有功能模块的 

       ```
       models.py
       ```

       ，并将 

       ```
       Base.metadata
       ```

        赋值给 

       ```
       target_metadata
       ```

       。

       Python

       ```
       # 在 alembic/env.py 中
       from app.core.database import Base
       # 导入所有模型以完成注册
       from app.user import models
       from app.clinic import models
       # ... etc ...
       target_metadata = Base.metadata
       ```

  3. 自动生成迁移脚本

     : 当您修改了任何 

     ```
     models.py
     ```

      文件后，执行：

     Bash

     ```
     alembic revision --autogenerate -m "对 patient 表新增了 blood_type 字段"
     ```

  4. 应用迁移到数据库

     :

     Bash

     ```
     alembic upgrade head
     ```

遵循此份详尽的指南，您的团队将能够高效、规范地进行数据库模型的开发与维护，确保系统在 SQLAlchemy 框架下稳定、可靠地运行。