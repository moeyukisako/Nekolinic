"""支付会话服务模块

提供客户被扫支付的核心业务逻辑，包括创建支付会话、查询支付状态、处理支付结果等功能。
"""

from datetime import datetime, timedelta, UTC
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import Depends

from app.core.config import settings
from app.core.database import get_db
from app.finance import models
from app.finance.payment_session_models import PaymentSession, PaymentSessionStatus, PaymentMethod
from app.finance.payment_gateway import AlipayGateway, WechatPayGateway
from app.core.exceptions import ValidationException, ResourceNotFoundException
from app.core.context import current_user_id


class PaymentSessionService:
    """支付会话服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        self.alipay_gateway = AlipayGateway()
        self.wechat_gateway = WechatPayGateway()
    
    def create_payment_session(
        self,
        bill_id: int,
        payment_method: PaymentMethod,
        timeout_minutes: int = 15
    ) -> PaymentSession:
        """创建支付会话
        
        Args:
            bill_id: 账单ID
            payment_method: 支付方式
            timeout_minutes: 超时时间（分钟）
            
        Returns:
            创建的支付会话对象
            
        Raises:
            NotFoundError: 账单不存在
            ValidationError: 账单状态不允许支付
        """
        # 查询账单
        bill = self.db.query(models.Bill).filter(models.Bill.id == bill_id).first()
        if not bill:
            raise ResourceNotFoundException("Bill", bill_id)
        
        # 检查账单状态
        if bill.status != models.BillStatus.UNPAID:
            raise ValidationException(f"账单 {bill_id} 状态为 {bill.status.value}，无法支付")
        
        # 检查是否已有未过期的支付会话
        existing_session = self.db.query(PaymentSession).filter(
            and_(
                PaymentSession.bill_id == bill_id,
                PaymentSession.status == PaymentSessionStatus.PENDING,
                PaymentSession.expires_at > datetime.now(UTC)
            )
        ).first()
        
        if existing_session:
            # 返回现有会话
            return existing_session
        
        # 根据支付方式创建二维码
        if payment_method == PaymentMethod.ALIPAY:
            qr_result = self.alipay_gateway.create_qr_payment(bill, timeout_minutes)
        elif payment_method == PaymentMethod.WECHAT_PAY:
            qr_result = self.wechat_gateway.create_qr_payment(bill, timeout_minutes)
        else:
            raise ValidationError(f"不支持的支付方式: {payment_method.value}")
        
        # 创建支付会话
        payment_session = PaymentSession(
            bill_id=bill_id,
            payment_method=payment_method,
            qr_code_content=qr_result["qr_code"],
            expires_at=qr_result["expires_at"],
            status=PaymentSessionStatus.PENDING,
            prepay_id=qr_result.get("prepay_id"),
            amount=bill.total_amount,
            timeout_minutes=timeout_minutes,
            created_by_id=current_user_id.get(),
            updated_by_id=current_user_id.get()
        )
        
        self.db.add(payment_session)
        self.db.commit()
        self.db.refresh(payment_session)
        
        return payment_session
    
    def get_payment_session(self, session_id: int) -> Optional[PaymentSession]:
        """获取支付会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            支付会话对象或None
        """
        return self.db.query(PaymentSession).filter(
            PaymentSession.id == session_id
        ).first()
    
    def get_qr_code_image(self, session_id: int) -> str:
        """获取二维码图片
        
        Args:
            session_id: 会话ID
            
        Returns:
            Base64编码的二维码图片
            
        Raises:
            NotFoundError: 会话不存在
            ValidationError: 会话已过期
        """
        session = self.get_payment_session(session_id)
        if not session:
            raise ResourceNotFoundException("PaymentSession", session_id)
        
        if session.is_expired:
            raise ValidationError("支付会话已过期")
        
        # 根据支付方式生成二维码图片
        if session.payment_method == PaymentMethod.ALIPAY:
            return self.alipay_gateway.generate_qr_code_image(session.qr_code_content)
        elif session.payment_method == PaymentMethod.WECHAT_PAY:
            return self.wechat_gateway.generate_qr_code_image(session.qr_code_content)
        else:
            raise ValidationError(f"不支持的支付方式: {session.payment_method.value}")
    
    def check_payment_status(self, session_id: int) -> Dict[str, Any]:
        """检查支付状态
        
        Args:
            session_id: 会话ID
            
        Returns:
            支付状态信息
            
        Raises:
            NotFoundError: 会话不存在
        """
        session = self.get_payment_session(session_id)
        if not session:
            raise ResourceNotFoundException("PaymentSession", session_id)
        
        # 如果会话已过期，更新状态
        if session.is_expired and session.status == PaymentSessionStatus.PENDING:
            session.status = PaymentSessionStatus.EXPIRED
            session.updated_by = current_user_id.get()
            self.db.commit()
        
        # 如果会话仍在等待中，查询第三方支付状态
        if session.status == PaymentSessionStatus.PENDING and not session.is_expired:
            if session.payment_method == PaymentMethod.ALIPAY:
                payment_status = self.alipay_gateway.query_payment_status(str(session.bill_id))
            elif session.payment_method == PaymentMethod.WECHAT_PAY:
                payment_status = self.wechat_gateway.query_payment_status(str(session.bill_id))
            else:
                payment_status = {"trade_status": "UNKNOWN"}
            
            # 根据第三方状态更新会话状态
            if payment_status.get("trade_status") == "TRADE_SUCCESS" or payment_status.get("trade_state") == "SUCCESS":
                self._complete_payment(session, payment_status)
        
        return {
            "session_id": session.id,
            "status": session.status.value,
            "bill_id": session.bill_id,
            "amount": float(session.amount),
            "payment_method": session.payment_method.value,
            "expires_at": session.expires_at.isoformat(),
            "is_expired": session.is_expired,
            "created_at": session.created_at.isoformat()
        }
    
    def _complete_payment(self, session: PaymentSession, payment_result: Dict[str, Any]):
        """完成支付处理
        
        Args:
            session: 支付会话
            payment_result: 第三方支付结果
        """
        # 更新会话状态
        session.status = PaymentSessionStatus.PAID
        session.updated_by_id = current_user_id.get()
        
        # 创建支付记录
        payment = models.Payment(
            bill_id=session.bill_id,
            payment_date=datetime.now(UTC),
            amount=session.amount,
            payment_method=session.payment_method,
            payment_mode=models.PaymentMode.QR_CODE,
            provider_transaction_id=payment_result.get('transaction_id'),
            created_by_id=current_user_id.get(),
            updated_by_id=current_user_id.get()
        )
        
        # 更新账单状态
        bill = session.bill
        bill.status = models.BillStatus.PAID
        bill.paid_at = datetime.now(UTC)
        bill.updated_by_id = current_user_id.get()
        
        self.db.add(payment)
        self.db.commit()
    
    def cancel_payment_session(self, session_id: int) -> bool:
        """取消支付会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            是否成功取消
            
        Raises:
            NotFoundError: 会话不存在
            ValidationError: 会话状态不允许取消
        """
        session = self.get_payment_session(session_id)
        if not session:
            raise ResourceNotFoundException("PaymentSession", session_id)
        
        if session.status != PaymentSessionStatus.PENDING:
            raise ValidationError(f"会话状态为 {session.status.value}，无法取消")
        
        session.status = PaymentSessionStatus.CANCELLED
        session.updated_by_id = current_user_id.get()
        self.db.commit()
        
        return True
    
    def cleanup_expired_sessions(self) -> int:
        """清理过期的支付会话
        
        Returns:
            清理的会话数量
        """
        expired_sessions = self.db.query(PaymentSession).filter(
            and_(
                PaymentSession.status == PaymentSessionStatus.PENDING,
                PaymentSession.expires_at <= datetime.now(UTC)
            )
        ).all()
        
        count = 0
        for session in expired_sessions:
            session.status = PaymentSessionStatus.EXPIRED
            session.updated_by_id = current_user_id.get()
            count += 1
        
        if count > 0:
            self.db.commit()
        
        return count


def get_payment_session_service(db: Session = Depends(get_db)) -> PaymentSessionService:
    """获取支付会话服务实例
    
    Args:
        db: 数据库会话
        
    Returns:
        支付会话服务实例
    """
    return PaymentSessionService(db)