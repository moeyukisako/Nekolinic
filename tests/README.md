# Nekolinic 测试指南

本目录包含 Nekolinic 项目的所有测试代码，按照不同类型分为三个子目录：

## 测试类型

1. **单元测试 (Unit Tests)**：位于 `tests/unit/` 目录下，测试单个组件的功能，如服务层方法。
2. **集成测试 (Integration Tests)**：位于 `tests/integration/` 目录下，测试多个组件之间的交互，如API端点。
3. **端到端测试 (End-to-End Tests)**：位于 `tests/e2e/` 目录下，测试完整的用户工作流程。

## 运行测试

### 安装依赖

首先确保已安装测试所需的依赖：

```bash
pip install pytest pytest-cov httpx
```

### 运行所有测试

```bash
pytest
```

### 运行特定类型的测试

```bash
# 运行单元测试
pytest tests/unit/

# 运行集成测试
pytest tests/integration/

# 运行端到端测试
pytest tests/e2e/
```

### 运行特定测试文件

```bash
pytest tests/unit/test_user_service.py
```

### 运行带覆盖率报告的测试

```bash
pytest --cov=app tests/
```

## 测试数据库

测试使用SQLite内存数据库，不会影响生产数据库。每个测试运行后会自动清理测试数据。

## 测试夹具 (Fixtures)

主要的测试夹具定义在 `tests/conftest.py` 文件中：

- `db`: 提供测试数据库会话
- `client`: 提供FastAPI测试客户端
- `test_user`: 创建一个测试用户

## 添加新测试

添加新测试时，请遵循以下命名约定：

- 单元测试文件：`test_<module>_<component>.py`
- 集成测试文件：`test_<module>_api.py`
- 端到端测试文件：`test_<workflow>.py` 