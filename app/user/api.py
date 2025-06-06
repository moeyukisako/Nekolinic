from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import schemas, service
from app.core.database import get_db
# 假设安全相关的 JWT token 创建在 app.core.security 中
# from app.core.security import create_access_token 

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    创建新用户
    """
    # 检查用户名是否存在
    db_user = service.user_service.get_by_attributes(db, username=user_in.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # 检查邮箱是否存在
    db_user = service.user_service.get_by_attributes(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    return service.user_service.create(db=db, obj_in=user_in)

# 登录获取 token 的 API 可以在这里实现
# @router.post("/token", response_model=schemas.Token)
# ... 