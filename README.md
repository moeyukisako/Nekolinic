# Nekolinic 医疗诊所管理系统

Nekolinic是一个现代化的医疗诊所管理系统，旨在帮助医疗机构高效管理病患、预约、诊疗、药房和财务等业务流程。该系统采用模块化架构设计，易于扩展和维护。

## 技术栈

- **后端框架**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **数据验证**: Pydantic
- **数据库迁移**: Alembic
- **认证**: JWT (JSON Web Token)
- **密码处理**: Passlib + BCrypt
- **数据库**: SQLite (可扩展至PostgreSQL、MySQL等)

## 核心功能

- **用户管理**: 用户注册、登录、权限控制
- **病患管理**: 病患信息录入、查询、病历管理
- **诊所运营**: 医生管理、科室管理、预约排班
- **药房管理**: 药品库存、处方开具与审核、药品发放
- **财务管理**: 账单生成、支付处理、保险对接

## 系统架构

- **分层架构**:
  - 表现层(API): 处理HTTP请求和响应
  - 业务层(Service): 实现业务逻辑
  - 数据访问层(Model): 负责数据持久化
  - 领域层(Schema): 定义数据契约

- **特色设计**:
  - 全面的审计日志
  - 软删除支持
  - 基于角色的访问控制
  - 通用服务基类
  - 全局异常处理

## 部署指南

### 系统要求

- Python 3.10+
- pip

### 安装步骤

1. **克隆代码库**
   ```bash
   git clone https://github.com/yourusername/nekolinic.git
   cd nekolinic
   ```

2. **创建虚拟环境**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **初始化数据库**
   ```bash
   # 运行数据库迁移
   alembic upgrade head
   
   # 初始化基础数据
   python init_db.py
   ```

5. **启动应用**
   ```bash
   uvicorn main:app --reload
   ```

6. **访问API文档**
   
   打开浏览器访问: http://localhost:8000/docs

### 配置

主要配置在 `app/core/config.py` 中，可通过环境变量或.env文件覆盖默认配置。

## API使用示例

### 用户认证

```bash
# 获取访问令牌
curl -X POST http://localhost:8000/api/v1/user/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# 使用令牌访问API
curl -X GET http://localhost:8000/api/v1/user/me \
  -H "Authorization: Bearer {your_token}"
```

### 患者管理

```bash
# 创建患者
curl -X POST http://localhost:8000/api/v1/patient/ \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "gender": "male",
    "birth_date": "1990-01-01",
    "phone": "13800138000",
    "address": "北京市海淀区",
    "id_card": "110101199001010000"
  }'
```

## 开发指南

- **添加新功能**:
  1. 在相应模块下创建/修改models.py、schemas.py、service.py和api.py
  2. 在routes.py中注册新的路由
  3. 使用alembic创建迁移脚本: `alembic revision --autogenerate -m "Add new feature"`

- **运行测试**:
  ```bash
  pytest
  ```

- **生成覆盖率报告**:
  ```bash
  pytest --cov=app tests/
  ```

## 许可证

MIT License 