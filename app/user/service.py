from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
from . import models, schemas
from app.core.service_base import BaseService
from app.core.exceptions import AuthenticationException, ValidationException
from typing import Optional

# 密码处理
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService(BaseService[models.User, schemas.UserCreate, schemas.UserUpdate]):
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def create_user(self, db: Session, *, user_in: schemas.UserCreate) -> models.User:
        """
        创建用户前进行用户名和邮箱的唯一性验证
        """
        if self.get_by_attributes(db, username=user_in.username):
            raise ValidationException(message="Username already exists")
        if self.get_by_attributes(db, email=user_in.email):
            raise ValidationException(message="Email already exists")
        
        # 通过验证后调用原始的create方法
        return self.create(db=db, obj_in=user_in)

    def create(self, db: Session, *, obj_in: schemas.UserCreate) -> models.User:
        """
        重写 create 方法以处理密码哈希
        """
        create_data = obj_in.model_dump(exclude={"password"})
        create_data["hashed_password"] = self.get_password_hash(obj_in.password)
        
        db_obj = self.model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, *, username: str, password: str) -> models.User:
        user = self.get_by_attributes(db, username=username)
        if not user:
            raise AuthenticationException(message="Incorrect username or password")
        if not self.verify_password(password, user.hashed_password):
            raise AuthenticationException(message="Incorrect username or password")
        if not user.is_active:
            raise AuthenticationException(message="Inactive user")
        return user
        
    def update_preferences(
        self, db: Session, *, user: models.User, preferences: schemas.UserPreferenceUpdate
    ) -> models.User:
        """
        更新用户的偏好设置
        """
        # 将偏好数据转换为字典
        update_data = preferences.model_dump(exclude_unset=True)
        # 调用基类的update方法来更新用户对象
        return super().update(db, db_obj=user, obj_in=update_data)
    
    def change_password(
        self, db: Session, *, user: models.User, current_password: str, new_password: str
    ) -> models.User:
        """
        修改用户密码
        """
        # 验证当前密码
        if not self.verify_password(current_password, user.hashed_password):
            raise AuthenticationException(message="Current password is incorrect")
        
        # 更新密码
        user.hashed_password = self.get_password_hash(new_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    def get_with_doctor(self, db: Session, *, user_id: int) -> Optional[models.User]:
        """
        根据用户ID获取用户，并预先加载其关联的医生信息。
        """
        return (
            db.query(self.model)
            .options(joinedload(self.model.doctor)) # 核心：强制加载doctor关系
            .filter(self.model.id == user_id)
            .first()
        )

# 创建 service 实例供 api 层使用
user_service = UserService(models.User)