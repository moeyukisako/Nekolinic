# -*- coding: utf-8 -*-
"""
支付会话模型
用于管理客户被扫支付的二维码会话
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.auditing import Auditable
import enum
from datetime import datetime


class PaymentMethod(str, enum.Enum):
    """支付方式"""
    ALIPAY = "alipay"      # 支付宝
    WECHAT_PAY = "wechat_pay"  # 微信支付
    BANK_CARD = "bank_card"    # 银行卡
    CASH = "cash"              # 现金
    INSURANCE = "insurance"    # 医保


class PaymentMode(str, enum.Enum):
    """支付模式"""
    REDIRECT = "redirect"  # 跳转支付（原有模式）
    QR_CODE = "qr_code"   # 二维码支付（新增模式）


class PaymentSessionStatus(str, enum.Enum):
    """支付会话状态"""
    PENDING = "pending"      # 待支付
    PAID = "paid"           # 已支付
    EXPIRED = "expired"     # 已过期
    CANCELLED = "cancelled" # 已取消


class PaymentSession(Base, Auditable):
    """支付会话表
    
    用于管理客户被扫支付的二维码会话，每个会话对应一个二维码
    """
    __tablename__ = 'payment_sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 关联的账单
    bill_id = Column(Integer, ForeignKey('bills.id'), nullable=False, index=True)
    
    # 支付方式
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    
    # 二维码内容（支付链接）
    qr_code_content = Column(Text, nullable=False)
    
    # 二维码过期时间
    expires_at = Column(DateTime, nullable=False, index=True)
    
    # 会话状态
    status = Column(Enum(PaymentSessionStatus), default=PaymentSessionStatus.PENDING, nullable=False, index=True)
    
    # 第三方支付平台的预支付订单号
    prepay_id = Column(String(100), nullable=True)
    
    # 支付金额（冗余字段，便于查询）
    amount = Column(Numeric(10, 2), nullable=False)
    
    # 超时时间（分钟）
    timeout_minutes = Column(Integer, default=15, nullable=False)
    
    # 审计字段
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # 关系
    bill = relationship("Bill", back_populates="payment_sessions")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    
    def __repr__(self):
        return f"<PaymentSession(id={self.id}, bill_id={self.bill_id}, method={self.payment_method}, status={self.status})>"
    
    @property
    def is_expired(self) -> bool:
        """检查会话是否已过期"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_active(self) -> bool:
        """检查会话是否仍然有效"""
        return self.status == PaymentSessionStatus.PENDING and not self.is_expired