import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException, status
from app.core.exceptions import (
    ValidationException,
    AuthenticationException,
    ResourceNotFoundException,
    InsufficientStockException
)
from app.user.models import User
from app.app import app
from app.core.database import get_db

@pytest.fixture
def test_patient(db):
    """创建测试患者"""
    from app.patient.models import Patient
    from datetime import date
    
    patient = Patient(
        name="Test Patient",
        gender="male",
        birth_date=date(1990, 1, 1),
        phone="1234567890",
        email="patient@test.com",
        address="Test Address"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

def test_validation_exception(client: TestClient, test_user: User):
    """测试验证异常的处理"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": test_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 使用无效格式的时间戳应该触发验证错误
    response = client.post(
        "/api/v1/clinic/appointments/",
        json={
            "appointment_time": "invalid-datetime-format", # 无效的日期时间格式
            "patient_id": 1,
            "doctor_id": 1,
            "status": "scheduled"
        },
        headers=headers
    )
    assert response.status_code == 422  # FastAPI的验证错误码

def test_resource_not_found_exception(client: TestClient, test_user: User):
    """测试资源不存在异常的处理"""
    # 登录用户
    login_response = client.post(
        "/api/v1/users/token",
        data={"username": test_user.username, "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 尝试访问不存在的患者
    response = client.get("/api/v1/patients/99999", headers=headers)
    assert response.status_code == 404
    assert "不存在" in response.json()["detail"]

def test_authentication_exception():
    """测试认证异常的处理"""
    # 使用临时客户端，避开conftest中的认证覆盖
    from fastapi.testclient import TestClient
    from app.app import app
    from app.core.security import get_current_user, get_current_active_user, requires_role, oauth2_scheme
    
    # 创建一个没有认证覆盖的新客户端
    with TestClient(app) as temp_client:
        # 保存原始的依赖覆盖
        original_overrides = app.dependency_overrides.copy()
        
        # 清除依赖覆盖，恢复正常的认证行为
        app.dependency_overrides = {}
        
        try:
            # 不提供认证令牌
            response = temp_client.get("/api/v1/patients/")
            assert response.status_code == 401
        finally:
            # 恢复原始的依赖覆盖
            app.dependency_overrides = original_overrides

def test_invalid_token_exception():
    """测试无效令牌的处理"""
    # 使用临时客户端，避开conftest中的认证覆盖
    from fastapi.testclient import TestClient
    from app.app import app
    
    # 创建一个没有认证覆盖的新客户端
    with TestClient(app) as temp_client:
        # 保存原始的依赖覆盖
        original_overrides = app.dependency_overrides.copy()
        
        # 清除依赖覆盖，恢复正常的认证行为
        app.dependency_overrides = {}
        
        try:
            # 提供无效的认证令牌
            headers = {"Authorization": "Bearer invalid_token"}
            response = temp_client.get("/api/v1/patients/", headers=headers)
            assert response.status_code == 401
        finally:
            # 恢复原始的依赖覆盖
            app.dependency_overrides = original_overrides

def test_expired_token_exception():
    """测试过期令牌的处理"""
    # 使用临时客户端，避开conftest中的认证覆盖
    from fastapi.testclient import TestClient
    from app.app import app
    from jose import jwt
    import time
    from app.core.config import settings
    
    # 创建一个已过期的令牌
    payload = {
        "sub": "test",
        "exp": int(time.time()) - 300  # 5分钟前过期
    }
    expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # 创建一个没有认证覆盖的新客户端
    with TestClient(app) as temp_client:
        # 保存原始的依赖覆盖
        original_overrides = app.dependency_overrides.copy()
        
        # 清除依赖覆盖，恢复正常的认证行为
        app.dependency_overrides = {}
        
        try:
            headers = {"Authorization": f"Bearer {expired_token}"}
            response = temp_client.get("/api/v1/patients/", headers=headers)
            assert response.status_code == 401
            # 认证错误可能有不同的消息格式，只检查状态码
        finally:
            # 恢复原始的依赖覆盖
            app.dependency_overrides = original_overrides

def test_permission_denied_exception(db, test_patient):
    """测试权限拒绝异常的处理"""
    # 使用临时客户端，避开conftest中的认证覆盖
    from fastapi.testclient import TestClient
    from app.app import app
    from app.core.database import get_db
    
    # 创建一个没有认证覆盖的新客户端
    with TestClient(app) as temp_client:
        # 保存原始的依赖覆盖
        original_overrides = app.dependency_overrides.copy()
        
        # 只覆盖数据库依赖，保持认证依赖正常
        def override_get_db():
            try:
                yield db
            finally:
                pass
        
        app.dependency_overrides = {get_db: override_get_db}
        
        try:
            # 先创建一个普通用户并登录
            user_data = {
                "username": "regularuser",
                "email": "regular@example.com",
                "password": "password123",
                "full_name": "Regular User",
                "role": "user"  # 非管理员角色
            }
            temp_client.post("/api/v1/users/", json=user_data)
            
            login_response = temp_client.post(
                "/api/v1/users/token",
                data={"username": "regularuser", "password": "password123"}
            )
            assert login_response.status_code == 200
            token = login_response.json()["access_token"]
            
            # 尝试访问需要管理员权限的端点，使用已知存在的患者ID
            headers = {"Authorization": f"Bearer {token}"}
            response = temp_client.delete(f"/api/v1/patients/{test_patient.id}", headers=headers)
            
            # 权限被拒绝，状态码可能是401/403/404，具体取决于API实现
            assert response.status_code in [401, 403, 404]
        finally:
            # 恢复原始的依赖覆盖
            app.dependency_overrides = original_overrides

def test_method_not_allowed(client: TestClient):
    """测试不允许的HTTP方法处理"""
    response = client.put("/api/v1/users/token")
    assert response.status_code == 405

def test_insufficient_stock_exception():
    """测试库存不足异常"""
    # 这是一个直接的异常对象测试，不通过API
    with pytest.raises(InsufficientStockException) as exc_info:
        raise InsufficientStockException("测试药品", 10, 5)
    
    assert "库存不足" in str(exc_info.value)
    assert "测试药品" in str(exc_info.value)  # 药品名称
    assert "10" in str(exc_info.value)  # 需求数量
    assert "5" in str(exc_info.value)   # 当前库存 