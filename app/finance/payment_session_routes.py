"""支付会话API路由模块

提供客户被扫支付的REST API接口，包括创建支付会话、获取二维码、查询支付状态等功能。
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.finance import models
from app.finance.payment_session_service import get_payment_session_service, PaymentSessionService
from app.core.exceptions import ValidationException, ResourceNotFoundException
from app.core.security import get_current_user
from app.user.models import User

router = APIRouter(prefix="/payment-sessions", tags=["payment-sessions"])


class CreatePaymentSessionRequest(BaseModel):
    """创建支付会话请求模型"""
    bill_id: int = Field(..., description="账单ID")
    payment_method: models.PaymentMethod = Field(..., description="支付方式")
    timeout_minutes: int = Field(15, ge=5, le=60, description="超时时间（分钟），范围5-60")


class PaymentSessionResponse(BaseModel):
    """支付会话响应模型"""
    id: int
    bill_id: int
    payment_method: str
    status: str
    amount: float
    expires_at: str
    timeout_minutes: int
    is_expired: bool
    created_at: str
    
    class Config:
        from_attributes = True


class QRCodeResponse(BaseModel):
    """二维码响应模型"""
    session_id: int
    qr_code_image: str = Field(..., description="Base64编码的二维码图片")
    expires_at: str
    payment_method: str
    amount: float


class PaymentStatusResponse(BaseModel):
    """支付状态响应模型"""
    session_id: int
    status: str
    bill_id: int
    amount: float
    payment_method: str
    expires_at: str
    is_expired: bool
    created_at: str


@router.post("/", response_model=PaymentSessionResponse)
def create_payment_session(
    request: CreatePaymentSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> PaymentSessionResponse:
    """创建支付会话
    
    创建一个新的支付会话，生成对应的二维码供客户扫描支付。
    
    Args:
        request: 创建支付会话请求
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        创建的支付会话信息
        
    Raises:
        HTTPException: 账单不存在或状态不允许支付
    """
    try:
        session = payment_service.create_payment_session(
            bill_id=request.bill_id,
            payment_method=request.payment_method,
            timeout_minutes=request.timeout_minutes
        )
        
        return PaymentSessionResponse(
            id=session.id,
            bill_id=session.bill_id,
            payment_method=session.payment_method.value,
            status=session.status.value,
            amount=float(session.amount),
            expires_at=session.expires_at.isoformat(),
            timeout_minutes=session.timeout_minutes,
            is_expired=session.is_expired,
            created_at=session.created_at.isoformat()
        )
        
    except ResourceNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{session_id}", response_model=PaymentSessionResponse)
def get_payment_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> PaymentSessionResponse:
    """获取支付会话信息
    
    Args:
        session_id: 会话ID
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        支付会话信息
        
    Raises:
        HTTPException: 会话不存在
    """
    session = payment_service.get_payment_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支付会话 {session_id} 不存在"
        )
    
    return PaymentSessionResponse(
        id=session.id,
        bill_id=session.bill_id,
        payment_method=session.payment_method.value,
        status=session.status.value,
        amount=float(session.amount),
        expires_at=session.expires_at.isoformat(),
        timeout_minutes=session.timeout_minutes,
        is_expired=session.is_expired,
        created_at=session.created_at.isoformat()
    )


@router.get("/{session_id}/qr-code", response_model=QRCodeResponse)
def get_qr_code(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> QRCodeResponse:
    """获取支付二维码
    
    获取指定支付会话的二维码图片，供客户扫描支付。
    
    Args:
        session_id: 会话ID
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        二维码图片信息
        
    Raises:
        HTTPException: 会话不存在或已过期
    """
    try:
        session = payment_service.get_payment_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"支付会话 {session_id} 不存在"
            )
        
        qr_code_image = payment_service.get_qr_code_image(session_id)
        
        return QRCodeResponse(
            session_id=session.id,
            qr_code_image=qr_code_image,
            expires_at=session.expires_at.isoformat(),
            payment_method=session.payment_method.value,
            amount=float(session.amount)
        )
        
    except ResourceNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{session_id}/status", response_model=PaymentStatusResponse)
def check_payment_status(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> PaymentStatusResponse:
    """检查支付状态
    
    检查指定支付会话的当前状态，包括是否已支付、是否过期等。
    
    Args:
        session_id: 会话ID
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        支付状态信息
        
    Raises:
        HTTPException: 会话不存在
    """
    try:
        status_info = payment_service.check_payment_status(session_id)
        
        return PaymentStatusResponse(
            session_id=status_info["session_id"],
            status=status_info["status"],
            bill_id=status_info["bill_id"],
            amount=status_info["amount"],
            payment_method=status_info["payment_method"],
            expires_at=status_info["expires_at"],
            is_expired=status_info["is_expired"],
            created_at=status_info["created_at"]
        )
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{session_id}")
def cancel_payment_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> Dict[str, Any]:
    """取消支付会话
    
    取消指定的支付会话，使其无法继续支付。
    
    Args:
        session_id: 会话ID
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        操作结果
        
    Raises:
        HTTPException: 会话不存在或状态不允许取消
    """
    try:
        success = payment_service.cancel_payment_session(session_id)
        
        return {
            "success": success,
            "message": f"支付会话 {session_id} 已取消"
        }
        
    except ResourceNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/cleanup-expired")
def cleanup_expired_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payment_service: PaymentSessionService = Depends(get_payment_session_service)
) -> Dict[str, Any]:
    """清理过期的支付会话
    
    清理所有过期的支付会话，将其状态更新为已过期。
    
    Args:
        db: 数据库会话
        current_user: 当前用户
        payment_service: 支付会话服务
        
    Returns:
        清理结果
    """
    count = payment_service.cleanup_expired_sessions()
    
    return {
        "success": True,
        "cleaned_count": count,
        "message": f"已清理 {count} 个过期的支付会话"
    }