## Nekolinic 项目测试策略与实践指南

### **核心理念：测试金字塔**

我们的测试策略将遵循经典的“测试金字塔”模型：

1. **单元测试 (Unit Tests)**：构成金字塔的坚实底座。它们数量最多，运行速度快，专注于测试单个函数或方法的逻辑是否正确。
2. **集成测试 (Integration Tests)**：金字塔的中间层。数量较少，用于测试多个组件（如 API -> Service -> 数据库）协同工作的正确性。
3. **端到端测试 (End-to-End Tests)**：金字塔的顶端。数量最少，但覆盖范围最广，模拟一个完整的用户业务流程。

------

### **Part 1: 测试环境搭建**

为了不污染开发数据，所有测试都应在独立的测试环境中运行。

#### **步骤 1.1: 独立的测试数据库**

我们需要让测试运行时，应用连接到一个专门的测试数据库。

1. **修改 `app/core/config.py`**：

   - 允许通过环境变量覆盖数据库 URL。

   <!-- end list -->

   Python

   ```
   # app/core/config.py
   from pydantic_settings import BaseSettings
   import os
   
   class Settings(BaseSettings):
       # ...
       # 如果设置了 TEST_DATABASE_URL 环境变量，则优先使用它
       DATABASE_URL: str = os.getenv("TEST_DATABASE_URL", "sqlite:///./nekolinic.db")
       # ...
   
   settings = Settings()
   ```

2. **配置 `pytest`**：

   - 在项目根目录的 `pytest.ini` 文件（如果不存在则创建）中设置环境变量，这样每次运行 `pytest` 命令时都会自动使用测试数据库。

   <!-- end list -->

   Ini, TOML

   ```
   # pytest.ini
   [pytest]
   env =
       TEST_DATABASE_URL=sqlite:///./test_nekolinic.db
   ```

#### **步骤 1.2: 通用测试夹具 (`tests/conftest.py`)**

`conftest.py` 是 `pytest` 的魔术文件，用于定义可被所有测试文件共享的“夹具 (Fixtures)”，极大提升测试代码的复用性。

Python

```
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app # 导入主 app
from app.core.database import Base, get_db
import os

# 定义测试数据库 URL
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """在测试会话开始时创建数据库，结束后删除"""
    if os.path.exists("./test.db"):
        os.remove("./test.db")
    engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield
    os.remove("./test.db")

@pytest.fixture(scope="function")
def db_session():
    """为每个测试函数提供一个独立的数据库会话"""
    engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def client(db_session):
    """提供一个 TestClient 实例，并覆盖 get_db 依赖"""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    # 清理
    app.dependency_overrides.clear()
```

- **说明**：这段代码将在每次测试会话开始时创建一个全新的 `test.db` 文件，并在结束后删除，确保了测试之间的完全隔离。`client` 夹具则为我们提供了一个可以模拟 HTTP 请求的测试客户端。

------

### **Part 2: 单元测试 (Unit Testing)**

**目标**：验证 `Service` 层中不直接依赖数据库的、纯粹的业务逻辑。

#### **示例：测试 `security.py` 的 Token 生成**

Python

```
# tests/core/test_security.py
from datetime import timedelta
from jose import jwt
from app.core import security
from app.core.config import settings

def test_create_access_token():
    # 测试 Token 能否被正确创建和解码
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=15)
    token = security.create_access_token(data, expires_delta=expires_delta)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload.get("sub") == "testuser"
```

------

### **Part 3: 集成测试 (Integration Testing)**

**目标**：通过 API 层测试整个请求->响应链路，验证各层之间的协同工作。这是我们测试的重点。

#### **示例 1：测试用户创建的唯一性约束**

Python

```
# tests/user/test_user_api.py
from fastapi.testclient import TestClient

def test_create_duplicate_user(client: TestClient):
    # 第一次创建，应该成功
    response1 = client.post(
        "/api/v1/users/",
        json={"username": "testuser", "email": "test@example.com", "password": "password123", "role": "user"}
    )
    assert response1.status_code == 200

    # 使用相同的用户名再次创建，应该失败
    response2 = client.post(
        "/api/v1/users/",
        json={"username": "testuser", "email": "another@example.com", "password": "password123", "role": "user"}
    )
    assert response2.status_code == 400
    assert "Username already exists" in response2.json()["detail"]
```

#### **示例 2：测试支付金额超额的边缘情况**

Python

```
# tests/finance/test_finance_api.py

def test_overpay_bill_fails(client: TestClient, db_session):
    # --- 准备数据 ---
    # 此处需要先创建用户、病历和账单，账单总额为 100
    # ... setup code to create a bill with total_amount=100 and id=1 ...

    # --- 测试支付 ---
    # 尝试支付 120，超过了总额
    response = client.post(
        "/api/v1/finance/bills/1/payments",
        json={"amount": 120, "payment_method": "cash"}
    )
    
    assert response.status_code == 400
    assert "超过了剩余未付金额" in response.json()["detail"]
```

------

### **Part 4: 端到端测试 (End-to-End Testing)**

**目标**：模拟一个完整的核心业务流程，确保所有模块能无缝衔接。

#### **示例：测试“看诊到支付”的完整流程**

Python

```
# tests/e2e/test_full_workflow.py

def test_full_workflow(client: TestClient):
    # 1. 登录管理员，获取 token
    # (假设已有 admin 用户)
    
    # 2. 创建医生
    # ... client.post("/api/v1/clinic/doctors/", ...) ...
    
    # 3. 创建病患
    # ... client.post("/api/v1/patients/", ...) ...
    
    # 4. 创建预约
    # ... client.post("/api/v1/clinic/appointments/", ...) ...
    
    # 5. 创建病历
    # ... client.post("/api/v1/patients/{patient_id}/medical-records/", ...) ...
    
    # 6. 创建药品，并入库
    # ... client.post("/api/v1/pharmacy/drugs/", ...) ...
    # ... client.post("/api/v1/pharmacy/inventory/stock-in", ...) ...
    
    # 7. 创建处方
    # ... client.post("/api/v1/pharmacy/prescriptions/", ...) ...
    
    # 8. 发药
    # ... client.post("/api/v1/pharmacy/inventory/dispense", ...) ...
    
    # 9. 生成账单
    response = client.post("/api/v1/finance/billing/generate-from-record/{record_id}")
    assert response.status_code == 200
    bill = response.json()
    assert bill["total_amount"] > 0
    
    # 10. 支付账单
    response = client.post(
        f"/api/v1/finance/bills/{bill['id']}/payments",
        json={"amount": bill["total_amount"], "payment_method": "cash"}
    )
    assert response.status_code == 200
    
    # 11. 验证最终状态
    response = client.get(f"/api/v1/finance/bills/{bill['id']}")
    assert response.json()["status"] == "paid"
```

------

### **Part 5: 运行测试与覆盖率报告**

1. **安装测试依赖**：

   Bash

   ```
   pip install pytest pytest-cov
   ```

2. **运行所有测试**：

   - 在项目根目录执行：

   <!-- end list -->

   Bash

   ```
   pytest
   ```

3. **生成覆盖率报告**：

   - 执行以下命令：

   <!-- end list -->

   Bash

   ```
   pytest --cov=app --cov-report=html
   ```

   - 这会在项目根目录生成一个 `htmlcov/` 文件夹。用浏览器打开其中的 `index.html`，您就可以清晰地看到每个文件、每一行代码是否被测试覆盖到。

