from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, UTC
from decimal import Decimal
from typing import List, Optional, Dict, Any
import uuid

from app.core.service_base import BaseService
from app.core.context import current_user_id
from app.core.config import settings
from app.core.exceptions import (
    ValidationException, 
    ResourceNotFoundException, 
    AuthenticationException,
    BusinessLogicException
)

from app.patient import models as patient_models
from app.pharmacy import models as pharmacy_models

from . import models, schemas

class InsuranceService(BaseService[models.Insurance, schemas.InsuranceCreate, schemas.InsuranceUpdate]):
    """保险管理服务类"""
    def __init__(self):
        super().__init__(models.Insurance)
    
    def get_by_patient(self, db: Session, *, patient_id: int) -> List[models.Insurance]:
        """获取患者的所有保险信息"""
        return db.query(models.Insurance).filter(
            models.Insurance.patient_id == patient_id,
            models.Insurance.deleted_at.is_(None)
        ).all()

class PaymentService(BaseService[models.Payment, schemas.PaymentCreate, schemas.PaymentUpdate]):
    """支付管理服务类"""
    def __init__(self):
        super().__init__(models.Payment)
    
    def create_payment(self, db: Session, *, bill_id: int, amount: Decimal, payment_method: str) -> models.Payment:
        """创建新支付记录并更新账单状态"""
        # 1. 检查账单是否存在
        bill = db.query(models.Bill).filter(
            models.Bill.id == bill_id,
            models.Bill.deleted_at.is_(None)
        ).first()
        
        if not bill:
            raise ResourceNotFoundException(resource_type="Bill", resource_id=bill_id)
        
        # 2. 检查账单状态
        if bill.status == models.BillStatus.PAID:
            raise ValidationException("此账单已经完全支付")
        
        if bill.status == models.BillStatus.VOID:
            raise ValidationException("此账单已作废，不能进行支付")
        
        # 3. 检查支付金额
        if amount <= 0:
            raise ValidationException("支付金额必须大于0")
        
        # 计算已支付金额
        paid_amount = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.bill_id == bill_id,
            models.Payment.deleted_at.is_(None)
        ).scalar() or Decimal('0.00')
        
        # 计算剩余未付金额
        remaining = bill.total_amount - paid_amount
        
        if amount > remaining:
            raise ValidationException(f"支付金额 {amount} 超过了剩余未付金额 {remaining}")
        
        # 4. 创建支付记录
        payment = models.Payment(
            payment_date=datetime.now(UTC),
            amount=amount,
            payment_method=payment_method,
            bill_id=bill_id
        )
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        # 设置审计字段
        now = datetime.now(UTC)
        payment.created_at = payment.updated_at = now
        payment.created_by_id = payment.updated_by_id = user_id
        
        db.add(payment)
        
        # 5. 更新账单状态
        new_paid_amount = paid_amount + amount
        
        if new_paid_amount >= bill.total_amount:
            bill.status = models.BillStatus.PAID
        else:
            bill.status = models.BillStatus.PARTIALLY_PAID
        
        bill.updated_at = now
        bill.updated_by_id = user_id
        
        # 6. 提交事务
        db.commit()
        db.refresh(payment)
        
        return payment
    
    def get_by_bill(self, db: Session, *, bill_id: int) -> List[models.Payment]:
        """获取账单的所有支付记录"""
        return db.query(models.Payment).filter(
            models.Payment.bill_id == bill_id,
            models.Payment.deleted_at.is_(None)
        ).all()

class BillingService:
    """账单生成服务类"""
    
    def generate_bill_for_record(self, db: Session, *, medical_record_id: int) -> models.Bill:
        """根据病历生成账单"""
        # 1. 使用预加载一次性获取所需数据
        record = db.query(patient_models.MedicalRecord).options(
            joinedload(patient_models.MedicalRecord.patient),
            joinedload(patient_models.MedicalRecord.appointment)
        ).filter(
            patient_models.MedicalRecord.id == medical_record_id,
            patient_models.MedicalRecord.deleted_at.is_(None)
        ).first()

        if not record:
            raise ResourceNotFoundException(resource_type="MedicalRecord", resource_id=medical_record_id)
        
        # 2. 检查是否已生成过账单
        existing_bill = db.query(models.Bill).filter(
            models.Bill.medical_record_id == medical_record_id,
            models.Bill.deleted_at.is_(None)
        ).first()
        
        if existing_bill:
            raise ValidationException(f"病历ID {medical_record_id} 的账单已存在")

        # 3. 创建账单主表
        new_bill = models.Bill(
            invoice_number=f"INV-{str(uuid.uuid4())[:8].upper()}",
            bill_date=datetime.now(UTC),
            total_amount=Decimal('0.00'),  # 初始总额为0
            status=models.BillStatus.UNPAID,
            patient_id=record.patient_id,
            medical_record_id=record.id
        )
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        # 设置审计字段
        now = datetime.now(UTC)
        new_bill.created_at = new_bill.updated_at = now
        new_bill.created_by_id = new_bill.updated_by_id = user_id
        
        db.add(new_bill)
        db.flush()  # 刷新以获取new_bill.id

        # 4. 创建账单明细
        bill_items = []
        total_amount = Decimal('0.00')

        # 添加挂号/诊费
        # 从配置文件中获取诊疗费
        consultation_fee = settings.CONSULTATION_FEE
        
        consultation_item = models.BillItem(
            item_name="诊疗费",
            item_type="consultation",
            quantity=1,
            unit_price=consultation_fee,
            subtotal=consultation_fee,
            bill_id=new_bill.id,
            created_at=now,
            updated_at=now,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        bill_items.append(consultation_item)
        total_amount += consultation_fee

        # 添加药品费用 - 简化为暂时不获取处方药品
        # 这部分在现实业务中需要从药房系统获取处方明细
        
        db.add_all(bill_items)
        
        # 5. 更新账单总额
        new_bill.total_amount = total_amount
        
        # 6. 提交事务
        db.commit()
        db.refresh(new_bill)
        
        return new_bill
    
    def get_bill_with_details(self, db: Session, *, bill_id: int) -> Optional[models.Bill]:
        """获取账单及其所有明细和支付记录"""
        return db.query(models.Bill).options(
            joinedload(models.Bill.items),
            joinedload(models.Bill.payments)
        ).filter(
            models.Bill.id == bill_id,
            models.Bill.deleted_at.is_(None)
        ).first()
    
    def get_multi_bills(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[models.Bill]:
        """获取账单列表，支持分页"""
        return db.query(models.Bill).filter(
            models.Bill.deleted_at.is_(None)
        ).order_by(models.Bill.bill_date.desc()).offset(skip).limit(limit).all()
    
    def void_bill(self, db: Session, *, bill_id: int) -> models.Bill:
        """作废账单"""
        # 1. 检查账单是否存在
        bill = db.query(models.Bill).filter(
            models.Bill.id == bill_id,
            models.Bill.deleted_at.is_(None)
        ).first()
        
        if not bill:
            raise ResourceNotFoundException(resource_type="Bill", resource_id=bill_id)
        
        # 2. 检查账单状态
        if bill.status == models.BillStatus.VOID:
            raise ValidationException("此账单已作废")
        
        # 3. 检查是否已有支付记录
        payment_count = db.query(func.count(models.Payment.id)).filter(
            models.Payment.bill_id == bill_id,
            models.Payment.deleted_at.is_(None)
        ).scalar()
        
        if payment_count > 0:
            raise BusinessLogicException("此账单已有支付记录，不能作废")
        
        # 4. 更新账单状态
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        bill.status = models.BillStatus.VOID
        bill.updated_at = datetime.now(UTC)
        bill.updated_by_id = user_id
        
        # 5. 提交事务
        db.commit()
        db.refresh(bill)
        
        return bill

# 实例化所有服务
insurance_service = InsuranceService()
payment_service = PaymentService()
billing_service = BillingService()
