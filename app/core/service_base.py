from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from .database import Base
from .context import current_user_id

# 定义类型变量，用于泛型服务类
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    通用服务基类，提供标准CRUD操作和附加功能
    
    类型参数:
    - ModelType: SQLAlchemy模型类
    - CreateSchemaType: Pydantic模型类，用于创建操作
    - UpdateSchemaType: Pydantic模型类，用于更新操作
    
    用法示例:
    ```
    class PatientService(BaseService[models.Patient, schemas.PatientCreate, schemas.PatientUpdate]):
        def __init__(self):
            super().__init__(models.Patient)
    ```
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        初始化服务类
        
        Args:
            model: SQLAlchemy模型类
        """
        self.model = model
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        根据ID查询单个对象
        
        Args:
            db: 数据库会话
            id: 对象ID
            
        Returns:
            查询到的对象，如果未找到则返回None
        """
        # 如果模型有deleted_at字段，则添加软删除过滤条件
        if hasattr(self.model, "deleted_at"):
            return db.query(self.model).filter(
                self.model.id == id,
                self.model.deleted_at.is_(None)
            ).first()
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_by_attributes(self, db: Session, **kwargs) -> Optional[ModelType]:
        """
        根据任意字段值查询单个对象
        
        Args:
            db: 数据库会话
            **kwargs: 字段名称和值的键值对
            
        Returns:
            查询到的对象，如果未找到则返回None
        """
        query = db.query(self.model)
        
        # 如果模型有deleted_at字段，则添加软删除过滤条件
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at.is_(None))
            
        return query.filter_by(**kwargs).first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        获取多个对象，支持分页
        
        Args:
            db: 数据库会话
            skip: 跳过的记录数
            limit: 返回的最大记录数
            
        Returns:
            对象列表
        """
        query = db.query(self.model)
        
        # 如果模型有deleted_at字段，则添加软删除过滤条件
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at.is_(None))
            
        return query.offset(skip).limit(limit).all()
    
    def get_multi_by_ids(self, db: Session, *, ids: List[int]) -> List[ModelType]:
        """
        根据多个ID查询对象
        
        Args:
            db: 数据库会话
            ids: ID列表
            
        Returns:
            对象列表
        """
        query = db.query(self.model).filter(self.model.id.in_(ids))
        
        # 如果模型有deleted_at字段，则添加软删除过滤条件
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at.is_(None))
            
        return query.all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        创建新对象
        
        Args:
            db: 数据库会话
            obj_in: 包含创建数据的Pydantic模型
            
        Returns:
            创建后的对象
        """
        obj_in_data = obj_in.model_dump()
        
        # 添加审计信息
        if hasattr(self.model, "created_at"):
            obj_in_data["created_at"] = datetime.utcnow()
            
        if hasattr(self.model, "updated_at"):
            obj_in_data["updated_at"] = datetime.utcnow()
            
        if hasattr(self.model, "created_by_id"):
            try:
                user_id = current_user_id.get()
                if user_id:
                    obj_in_data["created_by_id"] = user_id
            except LookupError:
                # 如果上下文变量未设置，则不添加用户ID
                pass
            
        if hasattr(self.model, "updated_by_id"):
            try:
                user_id = current_user_id.get()
                if user_id:
                    obj_in_data["updated_by_id"] = user_id
            except LookupError:
                # 如果上下文变量未设置，则不添加用户ID
                pass
        
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, 
        db: Session, 
        *, 
        db_obj: ModelType, 
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        更新对象
        
        Args:
            db: 数据库会话
            db_obj: 要更新的数据库对象
            obj_in: 包含更新数据的Pydantic模型或字典
            
        Returns:
            更新后的对象
        """
        # 获取原对象的字典表示
        obj_data = {
            column.name: getattr(db_obj, column.name)
            for column in db_obj.__table__.columns
        }
        
        # 准备更新数据
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        # 更新字段
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        # 更新审计信息
        if hasattr(db_obj, "updated_at"):
            setattr(db_obj, "updated_at", datetime.utcnow())
            
        if hasattr(db_obj, "updated_by_id"):
            try:
                user_id = current_user_id.get()
                if user_id:
                    setattr(db_obj, "updated_by_id", user_id)
            except LookupError:
                # 如果上下文变量未设置，则不更新用户ID
                pass
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: int) -> Optional[ModelType]:
        """
        删除对象，支持软删除
        
        如果模型有deleted_at字段，则执行软删除
        否则执行物理删除
        
        Args:
            db: 数据库会话
            id: 对象ID
            
        Returns:
            删除的对象，如果未找到则返回None
        """
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj is None:
            return None
            
        if hasattr(obj, "deleted_at"):
            # 软删除
            setattr(obj, "deleted_at", datetime.utcnow())
            
            # 更新最后修改信息
            if hasattr(obj, "updated_at"):
                setattr(obj, "updated_at", datetime.utcnow())
                
            if hasattr(obj, "updated_by_id"):
                try:
                    user_id = current_user_id.get()
                    if user_id:
                        setattr(obj, "updated_by_id", user_id)
                except LookupError:
                    # 如果上下文变量未设置，则不更新用户ID
                    pass
            
            db.add(obj)
        else:
            # 物理删除
            db.delete(obj)
            
        db.commit()
        return obj
        
    def restore(self, db: Session, *, id: int) -> Optional[ModelType]:
        """
        恢复软删除的对象
        
        Args:
            db: 数据库会话
            id: 对象ID
            
        Returns:
            恢复的对象，如果未找到则返回None
        """
        if not hasattr(self.model, "deleted_at"):
            return None  # 如果模型不支持软删除，则返回None
            
        obj = db.query(self.model).filter(
            self.model.id == id
        ).first()
        
        if obj is None or obj.deleted_at is None:
            return None  # 对象不存在或未被软删除
            
        # 恢复对象
        setattr(obj, "deleted_at", None)
        
        # 更新最后修改信息
        if hasattr(obj, "updated_at"):
            setattr(obj, "updated_at", datetime.utcnow())
            
        if hasattr(obj, "updated_by_id"):
            try:
                user_id = current_user_id.get()
                if user_id:
                    setattr(obj, "updated_by_id", user_id)
            except LookupError:
                # 如果上下文变量未设置，则不更新用户ID
                pass
        
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
