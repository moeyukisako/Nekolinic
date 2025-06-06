nekolinic/
├── alembic/                      # (新增) Alembic 迁移工具目录
│   ├── versions/                 # 存放自动生成的迁移脚本
│   ├── env.py                    # Alembic 配置文件，需要修改以适配我们的架构
│   └── script.py.mako            # 迁移脚本模板
├── app/
│   ├── __init__.py
│   ├── app.py                    # FastAPI 应用主程序，挂载路由和中间件
│   ├── routes.py                 # 统一的 API 路由器注册入口
│   │
│   ├── core/                     # 核心共享模块
│   │   ├── __init__.py
│   │   ├── auditing.py           # (新增) 自动化审计事件监听器
│   │   ├── database.py           # 共享的 Base, engine, SessionLocal
│   │   └── exceptions.py         # 自定义应用异常
│   │
│   ├── user/                     # 功能模块: 用户与认证
│   │   ├── __init__.py
│   │   ├── api.py                # 用户与认证相关的 API 端点
│   │   ├── models.py             # User, UserHistory 模型定义
│   │   ├── schemas.py            # Pydantic 模型
│   │   └── service.py            # 业务逻辑
│   │
│   ├── patient/                  # 功能模块: 病患
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── models.py             # Patient, MedicalRecord, VitalSign 及它们的 History 模型
│   │   ├── schemas.py
│   │   └── service.py
│   │
│   ├── clinic/                   # 功能模块: 诊所运营
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── models.py             # Doctor, Appointment 及它们的 History 模型
│   │   ├── schemas.py
│   │   └── service.py
│   │
│   ├── pharmacy/                 # 功能模块: 药局
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── models.py             # Drug, Prescription, InventoryTransaction 等及 History 模型
│   │   ├── schemas.py
│   │   └── service.py
│   │
│   └── finance/                  # 功能模块: 财务
│       ├── __init__.py
│       ├── api.py
│       ├── models.py             # Bill, Payment, Insurance 及它们的 History 模型
│       ├── schemas.py
│       └── service.py
│
├── config/                       # 配置文件目录
│   └── ...
├── tests/                         # 測試 (目錄結構應對應 app 的新結構)
│   ├── __init__.py
│   ├── conftest.py                # Pytest 的共用 fixture
│   ├── core/
│   ├── user/
│   ├── patient/
│   ├── clinic/
│   ├── pharmacy/
│   └── finance/

├── alembic.ini                   # (新增) Alembic 主配置文件
├── init_db.py                    # (新增) 数据库初始化脚本
├── main.py                       # 主程序入口
└── requirements.txt