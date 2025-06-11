from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException, ValidationException, BusinessLogicException
from app.core import security
from app.user import models as user_models
from . import schemas, service
from .payment_gateway import alipay_gateway
from . import payment_session_routes
from .service import (
    insurance_service,
    payment_service,
    billing_service,
    online_payment_service,
    merged_payment_service,
    expense_category_service,
    expense_service,
    finance_statistics_service
)

router = APIRouter()

# 合并支付路由
merged_payment_router = APIRouter()

@merged_payment_router.get("/patients/{patient_id}/unpaid-bills", response_model=List[schemas.Bill])
def get_patient_unpaid_bills(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取患者未支付账单列表"""
    bills = merged_payment_service.get_patient_unpaid_bills(db, patient_id=patient_id)
    return bills

@merged_payment_router.post("/sessions", response_model=schemas.MergedPaymentSessionRead)
def create_merged_payment_session(
    session_data: schemas.MergedPaymentSessionCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建合并支付会话"""
    session = merged_payment_service.create_merged_payment_session(
        db,
        patient_id=session_data.patient_id,
        bill_ids=session_data.bill_ids,
        payment_method=session_data.payment_method,
        timeout_minutes=session_data.timeout_minutes
    )
    return session

@merged_payment_router.get("/sessions/{session_id}", response_model=schemas.MergedPaymentSessionRead)
def get_merged_payment_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取合并支付会话详情"""
    session = merged_payment_service.get_merged_payment_session(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="合并支付会话不存在")
    return session

@merged_payment_router.post("/alipay/callback")
def alipay_merged_payment_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """支付宝合并支付回调"""
    try:
        # 这里应该验证支付宝回调签名
        # 简化处理，实际应该按照支付宝文档验证
        form_data = request.form()
        session_id = form_data.get("out_trade_no")
        transaction_id = form_data.get("trade_no")
        
        if not session_id or not transaction_id:
            raise HTTPException(status_code=400, detail="回调参数不完整")
        
        result = merged_payment_service.process_merged_payment_success(
            db,
            session_id=session_id,
            provider_transaction_id=transaction_id
        )
        
        return {"status": "success", "data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理支付回调失败: {str(e)}")

@merged_payment_router.post("/wechat/callback")
def wechat_merged_payment_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """微信合并支付回调"""
    try:
        # 这里应该验证微信回调签名
        # 简化处理，实际应该按照微信文档验证
        xml_data = request.body
        # 解析XML获取订单号和交易号
        # 简化处理
        session_id = ""  # 从XML中解析
        transaction_id = ""  # 从XML中解析
        
        if not session_id or not transaction_id:
            raise HTTPException(status_code=400, detail="回调参数不完整")
        
        result = merged_payment_service.process_merged_payment_success(
            db,
            session_id=session_id,
            provider_transaction_id=transaction_id
        )
        
        return {"status": "success", "data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理支付回调失败: {str(e)}")

# 注册支付会话子路由
router.include_router(payment_session_routes.router)
router.include_router(merged_payment_router, prefix="/merged-payments", tags=["Merged Payments"])

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

@router.get("/bills/")
def read_bills(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取账单列表 (需要认证)"""
    bills = service.billing_service.get_multi_bills(db=db, skip=skip, limit=limit)
    total = service.billing_service.get_bills_count(db=db)
    return {
        "items": bills,
        "total": total,
        "skip": skip,
        "limit": limit
    }

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

@router.delete("/bills/{bill_id}", response_model=schemas.Bill)
def delete_bill(
    bill_id: int = Path(..., title="账单ID"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """删除账单 (需要认证)"""
    try:
        bill = service.billing_service.get_bill_with_details(db=db, bill_id=bill_id)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"账单ID {bill_id} 不存在"
            )
        
        # 检查账单状态，只允许删除未支付或部分支付的账单
        if bill.status == service.models.BillStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="已支付的账单不能删除，请使用作废功能"
            )
        
        return service.billing_service.delete_bill(db=db, bill_id=bill_id)
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


# --- 支出分类API端点 ---
@router.get("/expense-categories", response_model=List[schemas.ExpenseCategory])
def get_expense_categories(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有启用的支出分类 (需要认证)"""
    return expense_category_service.get_active_categories(db)

@router.post("/expense-categories", response_model=schemas.ExpenseCategory)
def create_expense_category(
    category_data: schemas.ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建支出分类 (需要认证)"""
    return expense_category_service.create(db=db, obj_in=category_data)

@router.put("/expense-categories/{category_id}", response_model=schemas.ExpenseCategory)
def update_expense_category(
    category_id: int,
    category_data: schemas.ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新支出分类 (需要认证)"""
    category = expense_category_service.get(db=db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支出分类ID {category_id} 不存在"
        )
    return expense_category_service.update(db=db, db_obj=category, obj_in=category_data)

@router.delete("/expense-categories/{category_id}")
def delete_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """删除支出分类 (需要认证)"""
    category = expense_category_service.get(db=db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支出分类ID {category_id} 不存在"
        )
    expense_category_service.remove(db=db, id=category_id)
    return {"message": "支出分类删除成功"}

@router.post("/expense-categories/init-defaults")
def init_default_categories(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """初始化默认支出分类 (需要认证)"""
    created_categories = expense_category_service.create_default_categories(db)
    return {
        "message": f"成功创建 {len(created_categories)} 个默认分类",
        "categories": created_categories
    }


# --- 支出管理API端点 ---
@router.get("/expenses", response_model=schemas.PaginatedResponse[schemas.Expense])
def get_expenses(
    start_date: str = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="结束日期 (YYYY-MM-DD)"),
    category_id: Optional[int] = Query(None, description="支出分类ID"),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取支出记录列表 (需要认证)"""
    from datetime import datetime
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期格式错误，请使用 YYYY-MM-DD 格式"
        )
    
    result = expense_service.get_expenses_by_date_range(
        db,
        start_date=start_dt,
        end_date=end_dt,
        category_id=category_id,
        skip=skip,
        limit=limit
    )
    return result

@router.post("/expenses", response_model=schemas.Expense)
def create_expense(
    expense_data: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建支出记录 (需要认证)"""
    return expense_service.create(db=db, obj_in=expense_data)

@router.get("/expenses/{expense_id}", response_model=schemas.Expense)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取支出记录详情 (需要认证)"""
    expense = expense_service.get(db=db, id=expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支出记录ID {expense_id} 不存在"
        )
    return expense

@router.put("/expenses/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    expense_data: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新支出记录 (需要认证)"""
    expense = expense_service.get(db=db, id=expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支出记录ID {expense_id} 不存在"
        )
    return expense_service.update(db=db, db_obj=expense, obj_in=expense_data)

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """删除支出记录 (需要认证)"""
    expense = expense_service.get(db=db, id=expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"支出记录ID {expense_id} 不存在"
        )
    expense_service.remove(db=db, id=expense_id)
    return {"message": "支出记录删除成功"}


# --- 财务统计API端点 ---
@router.get("/statistics/expenses", response_model=schemas.ExpenseStatistics)
def get_expense_statistics(
    start_date: str = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取支出统计数据 (需要认证)"""
    from datetime import datetime
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期格式错误，请使用 YYYY-MM-DD 格式"
        )
    
    return expense_service.get_expense_statistics(
        db,
        start_date=start_dt,
        end_date=end_dt
    )

@router.get("/statistics/income", response_model=schemas.IncomeStatistics)
def get_income_statistics(
    start_date: str = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: str = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取收入统计数据 (需要认证)"""
    from datetime import datetime
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期格式错误，请使用 YYYY-MM-DD 格式"
        )
    
    return finance_statistics_service.get_income_statistics(
        db,
        start_date=start_dt,
        end_date=end_dt
    )
