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
    创建新用户 - 用户名和邮箱的唯一性检查已移至服务层
    """
    return service.user_service.create_user(db=db, user_in=user_in)

# 登录获取 token 的 API 可以在这里实现
# @router.post("/token", response_model=schemas.Token)
# ... 