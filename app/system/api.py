from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import os
import shutil
import json
from datetime import datetime
import zipfile
import tempfile
from pathlib import Path

from ..core.database import get_db
from ..core import security
from ..user import models as user_models
from .service import SystemService
from .schemas import BackupResponse, BackupListResponse, SystemInfoResponse

router = APIRouter()
system_service = SystemService()

@router.post("/backup", response_model=BackupResponse)
async def create_backup(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """
    创建系统备份
    只有管理员可以执行此操作
    """
    try:
        # 在后台任务中执行备份
        backup_info = await system_service.create_backup(db)
        
        return BackupResponse(
            success=True,
            message="备份创建成功",
            backup_id=backup_info["backup_id"],
            backup_path=backup_info["backup_path"],
            created_at=backup_info["created_at"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"备份创建失败: {str(e)}"
        )

@router.get("/backups", response_model=BackupListResponse)
async def list_backups(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """
    获取备份列表
    只有管理员可以执行此操作
    """
    try:
        backups = await system_service.list_backups()
        return BackupListResponse(
            success=True,
            backups=backups
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取备份列表失败: {str(e)}"
        )

@router.post("/restore/{backup_id}")
async def restore_backup(
    backup_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """
    恢复系统备份
    只有管理员可以执行此操作
    """
    try:
        # 在后台任务中执行恢复
        result = await system_service.restore_backup(backup_id, db)
        
        return {
            "success": True,
            "message": "备份恢复成功",
            "restored_at": result["restored_at"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"备份恢复失败: {str(e)}"
        )

@router.delete("/backup/{backup_id}")
async def delete_backup(
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """
    删除指定备份
    只有管理员可以执行此操作
    """
    try:
        await system_service.delete_backup(backup_id)
        return {
            "success": True,
            "message": "备份删除成功"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"备份删除失败: {str(e)}"
        )

@router.get("/info", response_model=SystemInfoResponse)
async def get_system_info(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """
    获取系统信息
    只有管理员可以执行此操作
    """
    try:
        info = await system_service.get_system_info(db)
        return SystemInfoResponse(
            success=True,
            **info
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取系统信息失败: {str(e)}"
        )