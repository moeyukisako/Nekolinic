from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException, ValidationException, BusinessLogicException
from app.core import security
from app.user import models as user_models
from . import schemas, service

router = APIRouter()

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
