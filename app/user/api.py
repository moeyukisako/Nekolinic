from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from . import schemas, service
from app.core.database import get_db
from app.core.security import create_access_token, get_current_active_user
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    创建新用户
    
    用户名和邮箱必须是唯一的
    """
    return service.user_service.create_user(db=db, user_in=user_in)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    用户登录获取访问令牌
    
    使用用户名和密码进行身份验证，返回JWT令牌
    """
    # 验证用户
    user = service.user_service.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user = Depends(get_current_active_user)):
    """
    获取当前登录用户信息
    """
    return current_user 