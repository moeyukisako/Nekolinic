from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.core.database import Base
from app.core.auditing import Auditable, register_audit_model

# --- 历史记录表 ---
class UserHistory(Base):
    __tablename__ = 'users_history'
    history_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(10), nullable=False)
    action_timestamp = Column(DateTime, nullable=False)
    action_by_id = Column(Integer, ForeignKey('users.id'))
    
    # User 表的字段快照
    id = Column(Integer, index=True)
    username = Column(String(50))
    email = Column(String(100))
    full_name = Column(String(100))
    hashed_password = Column(String(255))
    role = Column(String(50))
    is_active = Column(Boolean)
    
    # 审计字段快照
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer)
    updated_by_id = Column(Integer)
    deleted_at = Column(DateTime)

# --- 主业务表 ---
@register_audit_model(UserHistory)
class User(Base, Auditable):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='user')
    is_active = Column(Boolean, default=True)
    
    # 基础审计字段 (由 BaseService 自动填充)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # 为了软删除 