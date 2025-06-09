from fastapi import APIRouter, Depends, HTTPException, status, Path, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException, ValidationException, BusinessLogicException
from app.core import security
from app.user import models as user_models
from . import schemas, service
from .payment_gateway import alipay_gateway
from . import payment_session_routes

router = APIRouter()

# 注册支付会话子路由
router.include_router(payment_session_routes.router)

# --- 保险API端点 ---
@router.post("/insurances/", response_model=schemas.Insurance)
def create_insurance(
    insurance_in: schemas.InsuranceCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建患者的保险信息 (需要认证)"""
    return service.insurance_service.create(db=db, obj_in=insurance_in)

@router.get("/insurances/patient/{patient_id}", response_model=List[schemas.Insurance])
def read_patient_insurances(
    patient_id: int = Path(..., title="患者ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取患者的所有保险信息 (需要认证)"""
    return service.insurance_service.get_by_patient(db=db, patient_id=patient_id)

@router.get("/insurances/{insurance_id}", response_model=schemas.Insurance)
def read_insurance(
    insurance_id: int = Path(..., title="保险ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取保险详情 (需要认证)"""
    insurance = service.insurance_service.get(db=db, id=insurance_id)
    if not insurance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"保险ID {insurance_id} 不存在"
        )
    return insurance

@router.put("/insurances/{insurance_id}", response_model=schemas.Insurance)
def update_insurance(
    insurance_in: schemas.InsuranceUpdate,
    insurance_id: int = Path(..., title="保险ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新保险信息 (需要认证)"""
    insurance = service.insurance_service.get(db=db, id=insurance_id)
    if not insurance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"保险ID {insurance_id} 不存在"
        )
    return service.insurance_service.update(db=db, db_obj=insurance, obj_in=insurance_in)

@router.delete("/insurances/{insurance_id}", response_model=schemas.Insurance)
def delete_insurance(
    insurance_id: int = Path(..., title="保险ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """删除保险信息 (需要认证)"""
    insurance = service.insurance_service.get(db=db, id=insurance_id)
    if not insurance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"保险ID {insurance_id} 不存在"
        )
    return service.insurance_service.remove(db=db, id=insurance_id)

# --- 账单API端点 ---
@router.post("/bills", response_model=schemas.Bill)
def create_bill(
    bill_data: schemas.BillCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建账单 (需要认证)"""
    try:
        return service.billing_service.create_bill(db=db, bill_data=bill_data)
    except (ResourceNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/billing/generate-from-record/{medical_record_id}", response_model=schemas.Bill)
def generate_bill_from_medical_record(
    medical_record_id: int = Path(..., title="病历ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据病历生成账单 (需要认证)"""
    try:
        return service.billing_service.generate_bill_for_record(db=db, medical_record_id=medical_record_id)
    except (ResourceNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/bills/", response_model=List[schemas.BillSummary])
def read_bills(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取账单列表 (需要认证)"""
    return service.billing_service.get_multi_bills(db=db, skip=skip, limit=limit)

@router.get("/bills/{bill_id}", response_model=schemas.Bill)
def read_bill(
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取账单详情（包含明细和支付记录） (需要认证)"""
    bill = service.billing_service.get_bill_with_details(db=db, bill_id=bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"账单ID {bill_id} 不存在"
        )
    return bill

@router.post("/bills/{bill_id}/void", response_model=schemas.BillSummary)
def void_bill(
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """作废账单 (需要认证)"""
    try:
        return service.billing_service.void_bill(db=db, bill_id=bill_id)
    except (ResourceNotFoundException, ValidationException, BusinessLogicException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# --- 支付API端点 ---
@router.post("/bills/{bill_id}/payments", response_model=schemas.PaymentResponse)
def create_payment(
    payment_in: schemas.PaymentRequest,
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """为账单添加一笔支付 (需要认证)"""
    try:
        return service.payment_service.create_payment(
            db=db,
            bill_id=bill_id,
            amount=payment_in.amount,
            payment_method=payment_in.payment_method
        )
    except (ResourceNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/bills/{bill_id}/payments", response_model=List[schemas.Payment])
def read_bill_payments(
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取账单的所有支付记录 (需要认证)"""
    # 先检查账单是否存在
    bill = service.billing_service.get_bill_with_details(db=db, bill_id=bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"账单ID {bill_id} 不存在"
        )
    
    return service.payment_service.get_by_bill(db=db, bill_id=bill_id)

# --- 在线支付API端点 ---
@router.post("/bills/{bill_id}/initiate-online-payment", response_model=schemas.OnlinePaymentResponse)
def initiate_online_payment(
    provider_data: schemas.OnlinePaymentInitiateRequest,
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """发起在线支付 (需要认证)"""
    # 检查账单是否存在
    bill = service.billing_service.get_bill_with_details(db=db, bill_id=bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"账单ID {bill_id} 不存在"
        )
    
    # 检查账单状态
    if bill.status == service.models.BillStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此账单已支付完成"
        )
    
    if bill.status == service.models.BillStatus.VOID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此账单已作废"
        )
    
    try:
        payment_url = service.online_payment_service.initiate_payment(
            bill=bill, 
            provider=provider_data.provider
        )
        
        return schemas.OnlinePaymentResponse(
            payment_url=payment_url,
            bill_id=bill_id,
            provider=provider_data.provider
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/webhooks/alipay", include_in_schema=False)
async def alipay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """支付宝异步回调接口"""
    try:
        # 获取form-data
        form_data = await request.form()
        notification_data = {k: v for k, v in form_data.items()}
        
        # 验证签名
        is_valid = alipay_gateway.verify_notification(notification_data.copy())
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # 处理支付通知
        service.online_payment_service.process_alipay_notification(db, notification_data)
        
        # 必须返回 "success" 字符串，否则支付宝会重复通知
        return PlainTextResponse("success")
        
    except Exception as e:
        # 记录错误日志
        print(f"处理支付宝回调失败: {e}")
        # 即使处理失败，也返回 success，避免支付宝重复通知
        return PlainTextResponse("success")

@router.post("/webhooks/wechat", include_in_schema=False)
async def wechat_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """微信支付异步回调接口 (预留)"""
    try:
        # TODO: 实现微信支付回调处理
        return {"status": "success"}
    except Exception as e:
        print(f"处理微信支付回调失败: {e}")
        return {"status": "success"}
