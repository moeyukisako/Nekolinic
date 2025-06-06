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
def client(db):
    """
    提供测试客户端
    """
    # 重写依赖项，使用测试数据库
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    
    # 清理依赖项覆盖
    app.dependency_overrides = {}

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