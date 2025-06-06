import pytest
from sqlalchemy import select
from app.user.models import User, UserHistory
from app.user.schemas import UserCreate, UserUpdate
from app.user.service import user_service
from datetime import datetime

def test_audit_create(db):
    """测试手动创建审计记录功能"""
    # 创建用户
    user_in = UserCreate(
        username="audituser",
        email="audit@example.com",
        password="auditpass123",
        full_name="Audit Test User",
        role="user"
    )
    user = user_service.create(db, obj_in=user_in)
    
    # 手动创建一条审计记录
    history = UserHistory(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=user.hashed_password,
        role=user.role,
        is_active=user.is_active,
        action_type="MANUAL",
        action_timestamp=datetime.now(),
        action_by_id=None,
        created_at=user.created_at,
        updated_at=user.updated_at,
        created_by_id=user.created_by_id,
        updated_by_id=user.updated_by_id,
        deleted_at=None
    )
    db.add(history)
    db.commit()
    
    # 查询审计记录
    history_records = db.query(UserHistory).filter(
        UserHistory.id == user.id
    ).all()
    
    # 应该有记录
    assert len(history_records) > 0
    # 检查最新的记录是否与用户数据匹配
    latest_record = history_records[-1]
    assert latest_record.username == user.username
    assert latest_record.email == user.email
    assert latest_record.action_type == "MANUAL"

def test_audit_update(db, test_user):
    """测试更新用户时生成审计记录"""
    # 获取更新前的记录数
    before_count = db.query(UserHistory).filter(
        UserHistory.id == test_user.id
    ).count()
    
    # 更新用户
    user_update = UserUpdate(full_name="Updated Audit Name")
    updated_user = user_service.update(db, db_obj=test_user, obj_in=user_update)
    
    # 查询审计记录
    history_records = db.query(UserHistory).filter(
        UserHistory.id == test_user.id
    ).all()
    
    # 应该比更新前多一条记录
    assert len(history_records) > before_count
    
    # 找到最新记录
    latest_record = history_records[-1]
    assert latest_record.full_name == "Updated Audit Name"

def test_audit_delete(db, test_user):
    """测试删除用户时生成审计记录"""
    # 获取删除前的记录数
    before_count = db.query(UserHistory).filter(
        UserHistory.id == test_user.id
    ).count()
    
    # 删除用户
    user_service.remove(db, id=test_user.id)
    
    # 查询审计记录
    history_records = db.query(UserHistory).filter(
        UserHistory.id == test_user.id
    ).all()
    
    # 应该比删除前多一条记录
    assert len(history_records) > before_count
    
    # 检查原始用户记录是否标记为已删除
    db_user = db.query(User).filter(User.id == test_user.id).first()
    assert db_user.deleted_at is not None 