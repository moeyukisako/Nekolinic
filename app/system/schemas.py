from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BackupInfo(BaseModel):
    """备份信息模型"""
    backup_id: str
    backup_path: str
    created_at: datetime
    size: int  # 备份文件大小（字节）
    description: Optional[str] = None

class BackupResponse(BaseModel):
    """备份操作响应模型"""
    success: bool
    message: str
    backup_id: Optional[str] = None
    backup_path: Optional[str] = None
    created_at: Optional[datetime] = None

class BackupListResponse(BaseModel):
    """备份列表响应模型"""
    success: bool
    backups: List[BackupInfo]

class SystemInfoResponse(BaseModel):
    """系统信息响应模型"""
    success: bool
    system_name: str
    version: str
    database_size: int  # 数据库大小（字节）
    total_users: int
    total_patients: int
    total_records: int
    uptime: str
    last_backup: Optional[datetime] = None

class RestoreRequest(BaseModel):
    """恢复备份请求模型"""
    backup_id: str
    confirm: bool = False