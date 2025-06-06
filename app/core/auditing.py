from sqlalchemy import event
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Type, Any
from .context import current_user_id

# 初始化审计映射字典
# 这个字典将主模型类映射到对应的历史模型类
# 例如: {Patient: PatientHistory, Doctor: DoctorHistory}
AUDIT_MAP = {}


class Auditable:
    """
    一个Mixin类，所有需要被审计的主模型都应该继承它
    这个类不包含任何属性或方法，只作为标记
    """
    pass


def register_audit_model(history_model):
    """
    一个类装饰器，用于注册历史模型和它对应的主模型
    
    用法示例:
    @register_audit_model(PatientHistory)
    class Patient(Base, Auditable):
        # 模型定义...
    """
    def decorator(main_model):
        # 确保主模型继承了Auditable
        if not issubclass(main_model, Auditable):
            raise TypeError("被审计的模型必须继承自Auditable")
        
        # 将主模型与历史模型的映射关系添加到AUDIT_MAP
        AUDIT_MAP[main_model] = history_model
        return main_model
    
    return decorator


def before_flush_listener(session: Session, flush_context, instances):
    """
    在session flush前拦截所有变更，并创建历史记录
    
    这个监听器会自动捕获:
    - 新创建的对象 (session.new)
    - 被修改的对象 (session.dirty)
    - 被删除的对象 (session.deleted)
    
    对于每个变更，如果该对象的类型在AUDIT_MAP中注册，
    则创建一条对应的历史记录
    """
    # 获取当前用户ID，如果未设置，则默认为0（代表系统操作）
    try:
        action_by_id = current_user_id.get()
    except LookupError:
        action_by_id = 0 # 0 代表系统操作
    
    # 待添加的历史记录列表
    history_to_add = []
    
    # 处理新增和修改的对象
    for instance in session.new.union(session.dirty):
        model_class = instance.__class__
        # 检查该类是否在审计映射中注册
        if model_class in AUDIT_MAP:
            HistoryModel = AUDIT_MAP[model_class]
            action_type = 'INSERT' if instance in session.new else 'UPDATE'
            
            # 创建一个包含所有字段值的快照
            snapshot = {
                col.name: getattr(instance, col.name) 
                for col in instance.__table__.columns
            }
            
            # 创建历史记录
            history_record = HistoryModel(
                **snapshot,
                action_type=action_type,
                action_by_id=action_by_id,
                action_timestamp=datetime.utcnow()
            )
            
            history_to_add.append(history_record)
    
    # 处理被删除的对象
    for instance in session.deleted:
        model_class = instance.__class__
        if model_class in AUDIT_MAP:
            HistoryModel = AUDIT_MAP[model_class]
            
            # 创建一个包含所有字段值的快照
            snapshot = {
                col.name: getattr(instance, col.name) 
                for col in instance.__table__.columns
            }
            
            # 创建历史记录
            history_record = HistoryModel(
                **snapshot,
                action_type='DELETE',
                action_by_id=action_by_id,
                action_timestamp=datetime.utcnow()
            )
            
            history_to_add.append(history_record)
    
    # 将所有历史记录添加到会话中
    if history_to_add:
        session.add_all(history_to_add)


def register_audit_listeners():
    """
    注册所有审计监听器
    在应用启动时调用
    """
    # 监听session的before_flush事件
    event.listen(Session, 'before_flush', before_flush_listener)
