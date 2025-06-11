import os
import shutil
import json
import zipfile
import tempfile
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import psutil

from ..core.config import settings
from ..user import models as user_models
from ..patient import models as patient_models
from ..clinic import models as clinic_models
from .schemas import BackupInfo

class SystemService:
    """系统管理服务"""
    
    def __init__(self):
        # 备份存储目录
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
        # 项目根目录
        self.project_root = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        
    async def create_backup(self, db: Session) -> Dict[str, Any]:
        """创建系统备份"""
        try:
            # 生成备份ID和时间戳
            backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
            backup_time = datetime.now()
            
            # 创建临时目录
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                backup_content_dir = temp_path / backup_id
                backup_content_dir.mkdir()
                
                # 1. 备份数据库
                await self._backup_database(db, backup_content_dir)
                
                # 2. 备份配置文件
                await self._backup_config_files(backup_content_dir)
                
                # 3. 备份用户上传的文件（如果有）
                await self._backup_user_files(backup_content_dir)
                
                # 4. 创建备份元数据
                metadata = {
                    "backup_id": backup_id,
                    "created_at": backup_time.isoformat(),
                    "version": "1.0.0",
                    "description": f"系统备份 - {backup_time.strftime('%Y-%m-%d %H:%M:%S')}",
                    "includes": ["database", "config", "user_files"]
                }
                
                metadata_file = backup_content_dir / "metadata.json"
                with open(metadata_file, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)
                
                # 5. 压缩备份文件
                backup_zip_path = self.backup_dir / f"{backup_id}.zip"
                with zipfile.ZipFile(backup_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in backup_content_dir.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(backup_content_dir)
                            zipf.write(file_path, arcname)
                
                return {
                    "backup_id": backup_id,
                    "backup_path": str(backup_zip_path),
                    "created_at": backup_time
                }
                
        except Exception as e:
            raise Exception(f"创建备份失败: {str(e)}")
    
    async def _backup_database(self, db: Session, backup_dir: Path):
        """备份数据库"""
        try:
            # 获取数据库文件路径
            db_path = self.project_root / "nekolinic.db"
            
            if db_path.exists():
                # 复制SQLite数据库文件
                backup_db_path = backup_dir / "database"
                backup_db_path.mkdir(exist_ok=True)
                shutil.copy2(db_path, backup_db_path / "nekolinic.db")
                
                # 导出数据库结构和数据为SQL文件
                sql_backup_path = backup_db_path / "database_dump.sql"
                await self._export_database_to_sql(str(db_path), str(sql_backup_path))
            
        except Exception as e:
            raise Exception(f"备份数据库失败: {str(e)}")
    
    async def _export_database_to_sql(self, db_path: str, output_path: str):
        """导出数据库为SQL文件"""
        try:
            conn = sqlite3.connect(db_path)
            with open(output_path, 'w', encoding='utf-8') as f:
                for line in conn.iterdump():
                    f.write(f"{line}\n")
            conn.close()
        except Exception as e:
            raise Exception(f"导出数据库失败: {str(e)}")
    
    async def _backup_config_files(self, backup_dir: Path):
        """备份配置文件"""
        try:
            config_backup_dir = backup_dir / "config"
            config_backup_dir.mkdir(exist_ok=True)
            
            # 备份前端配置文件
            frontend_config_path = self.project_root / "frontend" / "config" / "settings.json"
            if frontend_config_path.exists():
                shutil.copy2(frontend_config_path, config_backup_dir / "frontend_settings.json")
            
            # 备份环境配置文件（不包含敏感信息）
            env_path = self.project_root / ".env"
            if env_path.exists():
                # 读取.env文件并过滤敏感信息
                filtered_env = config_backup_dir / "env_backup.txt"
                with open(env_path, 'r', encoding='utf-8') as src, open(filtered_env, 'w', encoding='utf-8') as dst:
                    for line in src:
                        # 过滤包含密码、密钥等敏感信息的行
                        if not any(keyword in line.upper() for keyword in ['PASSWORD', 'SECRET', 'KEY', 'TOKEN']):
                            dst.write(line)
                        else:
                            # 保留配置项名称，但隐藏值
                            if '=' in line:
                                key = line.split('=')[0]
                                dst.write(f"{key}=***HIDDEN***\n")
            
        except Exception as e:
            raise Exception(f"备份配置文件失败: {str(e)}")
    
    async def _backup_user_files(self, backup_dir: Path):
        """备份用户文件"""
        try:
            user_files_dir = backup_dir / "user_files"
            user_files_dir.mkdir(exist_ok=True)
            
            # 备份可能的用户上传文件目录
            uploads_dir = self.project_root / "uploads"
            if uploads_dir.exists():
                shutil.copytree(uploads_dir, user_files_dir / "uploads")
            
            # 备份报告文件
            reports_dir = self.project_root / "reports"
            if reports_dir.exists():
                shutil.copytree(reports_dir, user_files_dir / "reports")
                
        except Exception as e:
            # 用户文件备份失败不应该阻止整个备份过程
            print(f"警告: 备份用户文件失败: {str(e)}")
    
    async def list_backups(self) -> List[BackupInfo]:
        """获取备份列表"""
        try:
            backups = []
            
            for backup_file in self.backup_dir.glob("*.zip"):
                try:
                    # 获取文件信息
                    stat = backup_file.stat()
                    
                    # 尝试从压缩文件中读取元数据
                    metadata = None
                    try:
                        with zipfile.ZipFile(backup_file, 'r') as zipf:
                            if 'metadata.json' in zipf.namelist():
                                with zipf.open('metadata.json') as f:
                                    metadata = json.load(f)
                    except:
                        pass
                    
                    backup_info = BackupInfo(
                        backup_id=backup_file.stem,
                        backup_path=str(backup_file),
                        created_at=datetime.fromtimestamp(stat.st_ctime),
                        size=stat.st_size,
                        description=metadata.get('description') if metadata else None
                    )
                    backups.append(backup_info)
                    
                except Exception as e:
                    print(f"读取备份文件 {backup_file} 信息失败: {str(e)}")
                    continue
            
            # 按创建时间倒序排列
            backups.sort(key=lambda x: x.created_at, reverse=True)
            return backups
            
        except Exception as e:
            raise Exception(f"获取备份列表失败: {str(e)}")
    
    async def restore_backup(self, backup_id: str, db: Session) -> Dict[str, Any]:
        """恢复备份"""
        try:
            backup_file = self.backup_dir / f"{backup_id}.zip"
            if not backup_file.exists():
                raise Exception(f"备份文件不存在: {backup_id}")
            
            # 创建临时目录解压备份
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # 解压备份文件
                with zipfile.ZipFile(backup_file, 'r') as zipf:
                    zipf.extractall(temp_path)
                
                # 读取元数据
                metadata_file = temp_path / "metadata.json"
                if metadata_file.exists():
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                else:
                    raise Exception("备份文件格式错误：缺少元数据")
                
                # 恢复数据库
                if "database" in metadata.get("includes", []):
                    await self._restore_database(temp_path / "database")
                
                # 恢复配置文件
                if "config" in metadata.get("includes", []):
                    await self._restore_config_files(temp_path / "config")
                
                # 恢复用户文件
                if "user_files" in metadata.get("includes", []):
                    await self._restore_user_files(temp_path / "user_files")
                
                return {
                    "restored_at": datetime.now(),
                    "backup_id": backup_id,
                    "metadata": metadata
                }
                
        except Exception as e:
            raise Exception(f"恢复备份失败: {str(e)}")
    
    async def _restore_database(self, backup_db_dir: Path):
        """恢复数据库"""
        try:
            db_backup_file = backup_db_dir / "nekolinic.db"
            if db_backup_file.exists():
                # 备份当前数据库
                current_db = self.project_root / "nekolinic.db"
                if current_db.exists():
                    backup_current = self.project_root / f"nekolinic_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
                    shutil.copy2(current_db, backup_current)
                
                # 恢复数据库文件
                shutil.copy2(db_backup_file, current_db)
                
        except Exception as e:
            raise Exception(f"恢复数据库失败: {str(e)}")
    
    async def _restore_config_files(self, backup_config_dir: Path):
        """恢复配置文件"""
        try:
            # 恢复前端配置
            frontend_config_backup = backup_config_dir / "frontend_settings.json"
            if frontend_config_backup.exists():
                frontend_config_path = self.project_root / "frontend" / "config" / "settings.json"
                frontend_config_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(frontend_config_backup, frontend_config_path)
                
        except Exception as e:
            raise Exception(f"恢复配置文件失败: {str(e)}")
    
    async def _restore_user_files(self, backup_user_files_dir: Path):
        """恢复用户文件"""
        try:
            # 恢复上传文件
            uploads_backup = backup_user_files_dir / "uploads"
            if uploads_backup.exists():
                uploads_dir = self.project_root / "uploads"
                if uploads_dir.exists():
                    shutil.rmtree(uploads_dir)
                shutil.copytree(uploads_backup, uploads_dir)
            
            # 恢复报告文件
            reports_backup = backup_user_files_dir / "reports"
            if reports_backup.exists():
                reports_dir = self.project_root / "reports"
                if reports_dir.exists():
                    shutil.rmtree(reports_dir)
                shutil.copytree(reports_backup, reports_dir)
                
        except Exception as e:
            # 用户文件恢复失败不应该阻止整个恢复过程
            print(f"警告: 恢复用户文件失败: {str(e)}")
    
    async def delete_backup(self, backup_id: str):
        """删除备份"""
        try:
            backup_file = self.backup_dir / f"{backup_id}.zip"
            if backup_file.exists():
                backup_file.unlink()
            else:
                raise Exception(f"备份文件不存在: {backup_id}")
                
        except Exception as e:
            raise Exception(f"删除备份失败: {str(e)}")
    
    async def get_system_info(self, db: Session) -> Dict[str, Any]:
        """获取系统信息"""
        try:
            # 获取数据库统计信息
            user_count = db.query(user_models.User).count()
            patient_count = db.query(patient_models.Patient).count()
            
            # 获取数据库大小
            db_path = self.project_root / "nekolinic.db"
            db_size = db_path.stat().st_size if db_path.exists() else 0
            
            # 获取最后备份时间
            backups = await self.list_backups()
            last_backup = backups[0].created_at if backups else None
            
            # 获取系统运行时间
            uptime = self._get_system_uptime()
            
            return {
                "system_name": "Nekolinic诊所管理系统",
                "version": "1.0.0",
                "database_size": db_size,
                "total_users": user_count,
                "total_patients": patient_count,
                "total_records": 0,  # 可以根据需要添加更多统计
                "uptime": uptime,
                "last_backup": last_backup
            }
            
        except Exception as e:
            raise Exception(f"获取系统信息失败: {str(e)}")
    
    def _get_system_uptime(self) -> str:
        """获取系统运行时间"""
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = datetime.now().timestamp() - boot_time
            
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            
            return f"{days}天 {hours}小时 {minutes}分钟"
        except:
            return "未知"