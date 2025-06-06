import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.user.models import User
from app.user.service import user_service
from app.user.schemas import UserCreate
from fastapi.testclient import TestClient
from app.app import app
from app.core.auditing import register_audit_listeners
from app.core.security import get_current_user, get_current_active_user, requires_role, oauth2_scheme
from fastapi import Depends
from app.core.context import current_user_id

# 创建内存数据库引擎用于测试
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 确保审计监听器被注册
register_audit_listeners()

@pytest.fixture(scope="function")
def db():
    """
    提供测试数据库会话
    """
    # 创建测试数据库表
    Base.metadata.create_all(bind=engine)
    
    # 创建会话
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # 清理测试数据库
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db, admin_user):
    """
    提供测试客户端，包括绕过认证
    """
    # 重写依赖项，使用测试数据库
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    # 重写认证依赖项，使用admin_user
    async def override_get_current_user():
        return admin_user
        
    async def override_get_current_active_user():
        return admin_user
        
    def override_requires_role(role: str):
        async def get_current_user_with_role():
            return admin_user
        return get_current_user_with_role
        
    # 重写oauth2_scheme依赖项
    async def override_oauth2_scheme():
        return "test-token"
    
    # 设置当前用户上下文
    token = current_user_id.set(admin_user.id)
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    app.dependency_overrides[requires_role] = override_requires_role
    app.dependency_overrides[oauth2_scheme] = override_oauth2_scheme
    
    with TestClient(app) as c:
        yield c
    
    # 清理依赖项覆盖
    app.dependency_overrides = {}
    # 重置上下文变量，传入token
    if token:
        current_user_id.reset(token)

@pytest.fixture(scope="function")
def test_user(db):
    """
    创建测试用户
    """
    user_in = UserCreate(
        username="testuser",
        email="test@example.com",
        password="password123",
        full_name="Test User",
        role="user"
    )
    user = user_service.create(db, obj_in=user_in)
    return user

@pytest.fixture(scope="function")
def admin_user(db):
    """
    创建管理员测试用户
    """
    user_in = UserCreate(
        username="adminuser",
        email="admin@example.com",
        password="password123",
        full_name="Admin User",
        role="admin"
    )
    user = user_service.create(db, obj_in=user_in)
    return user 