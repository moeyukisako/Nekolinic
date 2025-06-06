import pytest
from app.user.service import user_service
from app.user.schemas import UserCreate, UserUpdate
from app.core.exceptions import AuthenticationException

def test_create_user(db):
    """测试创建用户功能"""
    user_in = UserCreate(
        username="newuser",
        email="new@example.com",
        password="newpass123",
        full_name="New User",
        role="user"
    )
    user = user_service.create(db, obj_in=user_in)
    
    assert user.username == "newuser"
    assert user.email == "new@example.com"
    assert user.full_name == "New User"
    assert user.role == "user"
    assert user.is_active == True
    assert hasattr(user, "hashed_password")
    assert user.hashed_password != "newpass123"  # 确保密码已被哈希
    
def test_authenticate_user(db, test_user):
    """测试用户认证功能"""
    # 正确的用户名和密码
    authenticated_user = user_service.authenticate(
        db, username="testuser", password="password123"
    )
    assert authenticated_user
    assert authenticated_user.id == test_user.id
    
    # 错误的密码
    with pytest.raises(AuthenticationException):
        user_service.authenticate(
            db, username="testuser", password="wrongpassword"
        )
    
    # 不存在的用户名
    with pytest.raises(AuthenticationException):
        user_service.authenticate(
            db, username="nonexistentuser", password="password123"
        )
    
    # 将用户设为非活跃
    test_user.is_active = False
    db.add(test_user)
    db.commit()
    
    # 非活跃用户不能认证
    with pytest.raises(AuthenticationException):
        user_service.authenticate(
            db, username="testuser", password="password123"
        )

def test_update_user(db, test_user):
    """测试更新用户功能"""
    user_update = UserUpdate(
        full_name="Updated Name",
        email="updated@example.com"
    )
    
    updated_user = user_service.update(
        db, db_obj=test_user, obj_in=user_update
    )
    
    assert updated_user.full_name == "Updated Name"
    assert updated_user.email == "updated@example.com"
    assert updated_user.username == "testuser"  # 未更改的字段保持不变

def test_get_user(db, test_user):
    """测试获取用户功能"""
    user = user_service.get(db, id=test_user.id)
    assert user
    assert user.id == test_user.id
    assert user.username == test_user.username
    
    # 获取不存在的用户
    non_existent_user = user_service.get(db, id=9999)
    assert non_existent_user is None

def test_get_user_by_attributes(db, test_user):
    """测试通过属性获取用户功能"""
    user = user_service.get_by_attributes(db, username="testuser")
    assert user
    assert user.id == test_user.id
    
    user = user_service.get_by_attributes(db, email="test@example.com")
    assert user
    assert user.id == test_user.id
    
    # 获取不存在的用户
    non_existent_user = user_service.get_by_attributes(db, username="nonexistent")
    assert non_existent_user is None

def test_remove_user(db, test_user):
    """测试删除用户功能（软删除）"""
    removed_user = user_service.remove(db, id=test_user.id)
    assert removed_user.id == test_user.id
    
    # 软删除后，通过get方法应该获取不到用户
    user = user_service.get(db, id=test_user.id)
    assert user is None
    
    # 但在数据库中应该还存在，只是deleted_at字段不为空
    db_user = db.query(user_service.model).filter(
        user_service.model.id == test_user.id
    ).first()
    assert db_user is not None
    assert db_user.deleted_at is not None

def test_restore_user(db, test_user):
    """测试恢复已删除用户功能"""
    # 先删除用户
    user_service.remove(db, id=test_user.id)
    
    # 恢复用户
    restored_user = user_service.restore(db, id=test_user.id)
    assert restored_user
    assert restored_user.id == test_user.id
    assert restored_user.deleted_at is None
    
    # 恢复后应该能通过get方法获取到用户
    user = user_service.get(db, id=test_user.id)
    assert user is not None
    assert user.id == test_user.id 