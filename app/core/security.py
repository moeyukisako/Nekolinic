from functools import wraps
from fastapi import Depends, HTTPException, status
from typing import List, Optional, Callable
from sqlalchemy.orm import Session
from .exceptions import AuthenticationException, AuthorizationException

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
    @requires_role("admin")
    def generate_financial_report(...):
        # 只有admin角色可以访问
        ...
    ```
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取当前用户，由于用户模块尚未开发，这里先做一个假设
            # 实际使用时需要替换为正确的用户获取方式
            current_user = kwargs.get("current_user")
            if not current_user:
                raise AuthenticationException("请先登录")
            
            # 假设用户对象有roles属性
            if not hasattr(current_user, "roles") or role not in current_user.roles:
                raise AuthorizationException(f"需要 {role} 权限")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def requires_roles(roles: List[str], require_all: bool = False):
    """
    多角色权限装饰器，可以要求用户拥有所有指定角色或任一指定角色
    
    Args:
        roles: 所需角色的列表
        require_all: 如果为True，则需要用户拥有所有指定角色；如果为False，则只需拥有任一角色
        
    Returns:
        装饰器函数
        
    用法示例:
    ```
    @router.delete("/patients/{patient_id}")
    @requires_roles(["admin", "supervisor"], require_all=False)
    def delete_patient(...):
        # 需要admin或supervisor权限
        ...
    ```
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取当前用户
            current_user = kwargs.get("current_user")
            if not current_user:
                raise AuthenticationException("请先登录")
            
            # 假设用户对象有roles属性，且为列表
            if not hasattr(current_user, "roles"):
                raise AuthorizationException("您没有所需权限")
            
            user_roles = current_user.roles
            
            if require_all:
                # 需要用户拥有所有指定角色
                if not all(role in user_roles for role in roles):
                    required_roles = ", ".join(roles)
                    raise AuthorizationException(f"需要同时拥有以下角色：{required_roles}")
            else:
                # 只需用户拥有任一指定角色
                if not any(role in user_roles for role in roles):
                    required_roles = ", ".join(roles)
                    raise AuthorizationException(f"需要以下角色之一：{required_roles}")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def protect_resource(resource_owner_field: str):
    """
    资源所有者保护装饰器，确保用户只能访问自己的资源
    
    Args:
        resource_owner_field: 资源中标识所有者ID的字段名
        
    Returns:
        装饰器函数
        
    用法示例:
    ```
    @router.put("/medical-records/{record_id}")
    @protect_resource("created_by_id")
    def update_medical_record(...):
        # 只有记录的创建者可以更新
        ...
    ```
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, db: Session = Depends(), current_user = None, **kwargs):
            # 获取资源ID和模型
            # 此处需要根据实际情况修改
            resource_id = kwargs.get("id")
            if not resource_id:
                # 尝试从路径参数中获取
                for key, value in kwargs.items():
                    if key.endswith("_id"):
                        resource_id = value
                        break
            
            if not resource_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="找不到资源ID"
                )
            
            # 获取当前用户
            if not current_user:
                raise AuthenticationException("请先登录")
            
            # 查找资源
            # 注意：实际使用时需要替换为正确的资源查询方式
            resource = None  # db.query(Model).filter(Model.id == resource_id).first()
            
            if not resource:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="资源不存在"
                )
            
            # 检查所有权
            owner_id = getattr(resource, resource_owner_field, None)
            if owner_id != current_user.id:
                # 检查是否为管理员（有权限访问所有资源）
                if not hasattr(current_user, "roles") or "admin" not in current_user.roles:
                    raise AuthorizationException("您没有权限操作此资源")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
