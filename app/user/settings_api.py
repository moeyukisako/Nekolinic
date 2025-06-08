from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json

from app.core.database import get_db
from app.core.security import get_current_active_user
from . import service

router = APIRouter()

# 用户设置模型
class UserSettings(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    autoSave: Optional[bool] = None
    showTooltips: Optional[bool] = None
    desktopNotifications: Optional[bool] = None
    soundNotifications: Optional[bool] = None
    emailNotifications: Optional[bool] = None
    sessionTimeout: Optional[int] = None
    autoBackup: Optional[bool] = None
    backupFrequency: Optional[str] = None
    background: Optional[str] = None

class UserSettingsResponse(BaseModel):
    theme: str = "light"
    language: str = "zh-CN"
    autoSave: bool = True
    showTooltips: bool = True
    desktopNotifications: bool = True
    soundNotifications: bool = True
    emailNotifications: bool = False
    sessionTimeout: int = 30
    autoBackup: bool = True
    backupFrequency: str = "daily"
    background: Optional[str] = None

@router.get("/settings", response_model=UserSettingsResponse)
async def get_user_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    获取当前用户的设置
    """
    try:
        # 从用户的preferences字段中获取设置
        user_preferences = current_user.preferences or {}
        
        # 返回默认设置，如果用户有自定义设置则覆盖
        settings = UserSettingsResponse(
            theme=user_preferences.get("theme", "light"),
            language=user_preferences.get("language", "zh-CN"),
            autoSave=user_preferences.get("autoSave", True),
            showTooltips=user_preferences.get("showTooltips", True),
            desktopNotifications=user_preferences.get("desktopNotifications", True),
            soundNotifications=user_preferences.get("soundNotifications", True),
            emailNotifications=user_preferences.get("emailNotifications", False),
            sessionTimeout=user_preferences.get("sessionTimeout", 30),
            autoBackup=user_preferences.get("autoBackup", True),
            backupFrequency=user_preferences.get("backupFrequency", "daily"),
            background=user_preferences.get("background")
        )
        
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户设置失败: {str(e)}"
        )

@router.post("/settings", response_model=UserSettingsResponse)
async def update_user_settings(
    settings: UserSettings,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    更新当前用户的设置
    """
    try:
        # 获取当前用户的preferences
        current_preferences = current_user.preferences or {}
        
        # 更新设置（只更新提供的字段）
        settings_dict = settings.dict(exclude_unset=True)
        current_preferences.update(settings_dict)
        
        # 更新用户的preferences字段
        from . import schemas
        user = service.user_service.update_preferences(
            db, 
            user=current_user, 
            preferences=schemas.UserPreferenceUpdate(preferences=current_preferences)
        )
        
        # 返回更新后的设置
        return UserSettingsResponse(
            theme=current_preferences.get("theme", "light"),
            language=current_preferences.get("language", "zh-CN"),
            autoSave=current_preferences.get("autoSave", True),
            showTooltips=current_preferences.get("showTooltips", True),
            desktopNotifications=current_preferences.get("desktopNotifications", True),
            soundNotifications=current_preferences.get("soundNotifications", True),
            emailNotifications=current_preferences.get("emailNotifications", False),
            sessionTimeout=current_preferences.get("sessionTimeout", 30),
            autoBackup=current_preferences.get("autoBackup", True),
            backupFrequency=current_preferences.get("backupFrequency", "daily"),
            background=current_preferences.get("background")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新用户设置失败: {str(e)}"
        )