from fastapi import APIRouter, Depends, HTTPException, status, Body, Request, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
import os
import base64
import shutil
from pathlib import Path
from datetime import datetime

from . import schemas, service
from .settings_api import router as settings_router
from app.core.database import get_db
from app.core.security import create_access_token, get_current_active_user
from app.core.config import settings

router = APIRouter()

# 包含设置相关的路由
router.include_router(settings_router, prefix="")

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

# JSON登录请求模型
class LoginRequest(BaseModel):
    username: str
    password: str

# 密码修改请求模型
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/login", response_model=schemas.Token)
async def json_login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    JSON格式登录API
    """
    # 验证用户
    user = service.user_service.authenticate(
        db, username=login_data.username, password=login_data.password
    )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    用户登录获取访问令牌 (OAuth2)
    
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

@router.put("/password", response_model=schemas.User)
async def change_password(
    *,
    db: Session = Depends(get_db),
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_active_user)
):
    """
    修改当前用户密码
    """
    user = service.user_service.change_password(
        db=db,
        user=current_user,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )
    return user

@router.put("/me/preferences", response_model=schemas.User)
def update_current_user_preferences(
    *,
    db: Session = Depends(get_db),
    preferences_in: schemas.UserPreferenceUpdate,
    current_user = Depends(get_current_active_user)
):
    """
    更新当前用户的偏好设置，例如背景图片
    """
    user = service.user_service.update_preferences(
        db, user=current_user, preferences=preferences_in
    )
    return user

# 背景图片保存请求模型
class BackgroundImageRequest(BaseModel):
    image_data: str
    filename: str

@router.post("/me/background-image", response_model=schemas.User)
async def upload_background_image(
    *,
    db: Session = Depends(get_db),
    image_data: BackgroundImageRequest,
    current_user = Depends(get_current_active_user)
):
    """
    上传并保存用户背景图片
    """
    try:
        # 确保目录存在
        backgrounds_dir = Path("frontend/assets/backgrounds")
        backgrounds_dir.mkdir(parents=True, exist_ok=True)
        
        # 解析Base64图片数据
        if "base64," in image_data.image_data:
            # 从Data URL中提取实际的Base64编码部分
            encoded_data = image_data.image_data.split("base64,")[1]
        else:
            encoded_data = image_data.image_data
            
        # 生成唯一文件名
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"bg_{current_user.id}_{timestamp}.jpg"
        file_path = backgrounds_dir / filename
        
        # 解码Base64数据并写入文件
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(encoded_data))
        
        # 更新用户记录中的背景偏好
        background_path = f"/assets/backgrounds/{filename}"
        
        # 使用服务更新用户偏好
        user = service.user_service.update_preferences(
            db, 
            user=current_user, 
            preferences=schemas.UserPreferenceUpdate(background_preference=background_path)
        )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"无法保存背景图片: {str(e)}"
        )