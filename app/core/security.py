from datetime import datetime, timedelta, UTC
from functools import wraps
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import List, Optional, Callable, Dict, Any, Union
from sqlalchemy.orm import Session
from .exceptions import AuthenticationException, AuthorizationException
from .database import get_db
from .config import settings

# OAuth2密码流的token URL (将是我们的登录端点)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/token")

def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建JWT访问令牌
    
    Args:
        data: 要编码到令牌中的数据
        expires_delta: 令牌的有效期
        
    Returns:
        编码后的JWT令牌
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    """
    从请求中获取当前用户
    
    这是一个FastAPI依赖项，可以用于保护API端点
    
    Args:
        db: 数据库会话
        token: JWT令牌
        
    Returns:
        当前用户
        
    Raises:
        AuthenticationException: 如果认证失败
    """
    try:
        # 解码JWT令牌
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise AuthenticationException("无效的认证凭据")
        
        # 从数据库获取用户
        from app.user.service import user_service
        # 先获取用户基本信息
        user = user_service.get_by_attributes(db, username=username)
        
        if user is None:
            raise AuthenticationException("用户不存在")
        
        if not user.is_active:
            raise AuthenticationException("用户已被禁用")
        
        # 使用新方法预加载医生信息
        user_with_doctor = user_service.get_with_doctor(db, user_id=user.id)
        
        return user_with_doctor
    except JWTError:
        raise AuthenticationException("无效的认证凭据")

async def get_current_active_user(current_user = Depends(get_current_user)):
    """
    获取当前激活的用户
    
    这是一个FastAPI依赖项，可以用于保护API端点
    
    Args:
        current_user: 当前用户
        
    Returns:
        当前激活的用户
        
    Raises:
        AuthenticationException: 如果用户未激活
    """
    if not current_user.is_active:
        raise AuthenticationException("用户已被禁用")
    return current_user

def requires_role(role: str):
    """
    角色权限装饰器，用于保护需要特定角色的API端点
    
    Args:
        role: 所需的角色名称
        
    Returns:
        装饰器函数
        
    用法示例:
    ```
    @router.post("/reports")
    def generate_financial_report(current_user = Depends(get_current_user_with_role("admin"))):
        # 只有admin角色可以访问
        ...
    ```
    """
    def get_current_user_with_role(current_user = Depends(get_current_user)):
        if current_user.role != role:
            raise AuthorizationException(f"需要 {role} 权限")
        return current_user
    return get_current_user_with_role

def requires_roles(roles: List[str], require_all: bool = False):
    """
    多角色权限装饰器，可以要求用户拥有所有指定角色或任一指定角色
    
    Args:
        roles: 所需角色的列表
        require_all: 如果为True，则需要用户拥有所有指定角色；如果为False，则只需拥有任一角色
        
    Returns:
        装饰器函数
    """
    def get_current_user_with_roles(current_user = Depends(get_current_user)):
        user_role = current_user.role
        
        if require_all:
            # 需要用户拥有所有指定角色 (在单角色模型中无法实现)
            raise NotImplementedError("当前用户模型不支持多角色")
        else:
            # 只需用户拥有任一指定角色
            if user_role not in roles:
                required_roles = ", ".join(roles)
                raise AuthorizationException(f"需要以下角色之一：{required_roles}")
        
        return current_user
    return get_current_user_with_roles

def protect_resource(resource_owner_field: str, model):
    """
    资源所有者保护装饰器，确保用户只能访问自己的资源
    
    Args:
        resource_owner_field: 资源中标识所有者ID的字段名
        model: 资源的模型类
        
    Returns:
        依赖函数
    """
    def get_current_user_with_resource_ownership(
        resource_id: int, 
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # 查找资源
        resource = db.query(model).filter(model.id == resource_id).first()
        
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="资源不存在"
            )
        
        # 检查所有权
        owner_id = getattr(resource, resource_owner_field, None)
        if owner_id != current_user.id:
            # 检查是否为管理员（有权限访问所有资源）
            if current_user.role != "admin":
                raise AuthorizationException("您没有权限操作此资源")
        
        return current_user
    return get_current_user_with_resource_ownership
