"""
Nekolinic应用程序配置文件
包含各种业务参数和系统设置
"""
from decimal import Decimal
from pydantic_settings import BaseSettings
from typing import List, Optional, Union
from datetime import timedelta
import os

class Settings(BaseSettings):
    """应用配置类，使用pydantic管理配置"""
    # 数据库设置
    DATABASE_URL: str = "sqlite:///./nekolinic.db"
    
    # 安全设置
    SECRET_KEY: str = "nejJQoMlyQnNWcRaJrEXNTnFV3w_ht5i7eAyJlQ7Z3I"  # 生产环境应更换
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24小时
    
    # CORS设置
    CORS_ORIGINS: List[str] = ["*"]  # 生产环境应限制为特定域名
    
    # 业务参数
    # 财务参数
    CONSULTATION_FEE: Decimal = Decimal("150.00")  # 标准诊疗费
    
    # 药房参数
    LOW_STOCK_THRESHOLD: int = 10  # 低库存阈值
    
    # 审计跟踪设置
    ENABLE_AUDIT: bool = True
    
    PROJECT_NAME: str = "Nekolinic"
    API_V1_STR: str = "/api/v1"
    
    # 支付宝配置
    ALIPAY_APP_ID: str = "your_alipay_app_id"
    ALIPAY_APP_PRIVATE_KEY_STRING: str = "-----BEGIN RSA PRIVATE KEY-----\nyour_private_key_content_here\n-----END RSA PRIVATE KEY-----"
    ALIPAY_PUBLIC_KEY_STRING: str = "-----BEGIN PUBLIC KEY-----\nyour_public_key_content_here\n-----END PUBLIC KEY-----"
    
    # 微信支付配置 (预留)
    WECHAT_APP_ID: str = "your_wechat_app_id"
    WECHAT_MCH_ID: str = "your_merchant_id"
    WECHAT_API_KEY: str = "your_api_key"
    
    # 应用URL配置
    APP_FRONTEND_URL: str = "http://localhost:8000"
    APP_BACKEND_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 创建全局设置实例
settings = Settings()