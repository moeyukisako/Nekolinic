from sqlalchemy import func, and_
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
from .payment_gateway import alipay_gateway, wechat_gateway

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
    
    def create_bill(self, db: Session, *, bill_data: schemas.BillCreate) -> models.Bill:
        """直接创建账单"""
        # 1. 检查患者是否存在
        patient = db.query(patient_models.Patient).filter(
            patient_models.Patient.id == bill_data.patient_id,
            patient_models.Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise ResourceNotFoundException(resource_type="Patient", resource_id=bill_data.patient_id)
        
        # 2. 检查病历是否存在
        medical_record = db.query(patient_models.MedicalRecord).filter(
            patient_models.MedicalRecord.id == bill_data.medical_record_id,
            patient_models.MedicalRecord.deleted_at.is_(None)
        ).first()
        
        if not medical_record:
            raise ResourceNotFoundException(resource_type="MedicalRecord", resource_id=bill_data.medical_record_id)
        
        # 3. 检查是否已存在相同发票号的账单
        existing_bill = db.query(models.Bill).filter(
            models.Bill.invoice_number == bill_data.invoice_number,
            models.Bill.deleted_at.is_(None)
        ).first()
        
        if existing_bill:
            raise ValidationException(f"发票号 {bill_data.invoice_number} 已存在")
        
        # 4. 创建账单
        new_bill = models.Bill(
            invoice_number=bill_data.invoice_number,
            bill_date=bill_data.bill_date,
            total_amount=bill_data.total_amount,
            status=models.BillStatus.UNPAID,
            patient_id=bill_data.patient_id,
            medical_record_id=bill_data.medical_record_id
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
        db.flush()  # 获取账单ID但不提交事务
        
        # 5. 创建账单明细（如果提供了）
        if bill_data.items:
            bill_items = []
            for item_data in bill_data.items:
                bill_item = models.BillItem(
                    item_name=item_data.item_name,
                    item_type=item_data.item_type,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    subtotal=item_data.subtotal,
                    bill_id=new_bill.id
                )
                bill_items.append(bill_item)
            
            db.add_all(bill_items)
        
        db.commit()
        db.refresh(new_bill)
        
        return new_bill
    
    def generate_bill_for_record(self, db: Session, *, medical_record_id: int, include_consultation_fee: bool = True) -> models.Bill:
        """根据病历生成账单"""
        # 1. 使用预加载一次性获取所需数据
        record = db.query(patient_models.MedicalRecord).options(
            joinedload(patient_models.MedicalRecord.patient)
        ).filter(
            patient_models.MedicalRecord.id == medical_record_id,
            patient_models.MedicalRecord.deleted_at.is_(None)
        ).first()

        if not record:
            raise ResourceNotFoundException(resource_type="MedicalRecord", resource_id=medical_record_id)
        
        # 2. 允许为同一病历生成多个账单（已移除唯一性检查）

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

        # 根据参数决定是否添加挂号/诊费
        if include_consultation_fee:
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

        # 添加药品费用 - 从处方明细获取药品信息，排除已结算的处方
        # 1. 查找该病历下所有已结清账单中包含的药品账单明细
        paid_drug_items = db.query(
            models.BillItem.item_name,
            models.BillItem.unit_price,
            models.BillItem.quantity
        ).join(
            models.Bill, models.Bill.id == models.BillItem.bill_id
        ).filter(
            models.Bill.medical_record_id == medical_record_id,
            models.Bill.status == models.BillStatus.PAID,
            models.BillItem.item_type == "药物",
            models.Bill.deleted_at.is_(None),
            models.BillItem.deleted_at.is_(None)
        ).all()
        
        # 创建已结算药品的集合，用于快速查找
        paid_drugs_set = set()
        for item in paid_drug_items:
            paid_drugs_set.add((item.item_name, float(item.unit_price), item.quantity))
        
        # 2. 获取所有处方，但排除已结算的处方明细
        prescriptions = db.query(pharmacy_models.Prescription).filter(
            pharmacy_models.Prescription.medical_record_id == medical_record_id,
            pharmacy_models.Prescription.deleted_at.is_(None)
        ).all()
        
        for prescription in prescriptions:
            prescription_details = db.query(pharmacy_models.PrescriptionDetail).options(
                joinedload(pharmacy_models.PrescriptionDetail.drug)
            ).filter(
                pharmacy_models.PrescriptionDetail.prescription_id == prescription.id,
                pharmacy_models.PrescriptionDetail.deleted_at.is_(None)
            ).all()
            
            for detail in prescription_details:
                # 构建药品名称：药品名（药品规格）
                drug_name = detail.drug.name
                if detail.drug.specification:
                    drug_name = f"{detail.drug.name}（{detail.drug.specification}）"
                
                # 检查这个药品是否已经在已结算的账单中
                drug_key = (drug_name, float(detail.drug.unit_price), detail.quantity)
                if drug_key in paid_drugs_set:
                    # 跳过已结算的药品
                    continue
                
                drug_item = models.BillItem(
                    item_name=drug_name,
                    item_type="药物",  # 按要求设置为"药物"
                    quantity=detail.quantity,
                    unit_price=detail.drug.unit_price,
                    subtotal=detail.drug.unit_price * detail.quantity,
                    bill_id=new_bill.id,
                    created_at=now,
                    updated_at=now,
                    created_by_id=user_id,
                    updated_by_id=user_id
                )
                bill_items.append(drug_item)
                total_amount += drug_item.subtotal
        
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
    
    def get_bills_count(self, db: Session) -> int:
        """获取账单总数"""
        return db.query(models.Bill).filter(
            models.Bill.deleted_at.is_(None)
        ).count()
    
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
    
    def delete_bill(self, db: Session, *, bill_id: int) -> models.Bill:
        """删除账单（软删除）"""
        # 1. 检查账单是否存在
        bill = db.query(models.Bill).filter(
            models.Bill.id == bill_id,
            models.Bill.deleted_at.is_(None)
        ).first()
        
        if not bill:
            raise ResourceNotFoundException(resource_type="Bill", resource_id=bill_id)
        
        # 2. 检查账单状态，不允许删除已支付的账单
        if bill.status == models.BillStatus.PAID:
            raise BusinessLogicException("已支付的账单不能删除，请使用作废功能")
        
        # 3. 检查是否有支付记录
        payment_count = db.query(func.count(models.Payment.id)).filter(
            models.Payment.bill_id == bill_id,
            models.Payment.deleted_at.is_(None)
        ).scalar()
        
        if payment_count > 0:
            raise BusinessLogicException("此账单已有支付记录，不能删除")
        
        # 4. 软删除账单及其明细
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        now = datetime.now(UTC)
        
        # 软删除账单明细
        db.query(models.BillItem).filter(
            models.BillItem.bill_id == bill_id,
            models.BillItem.deleted_at.is_(None)
        ).update({
            "deleted_at": now,
            "updated_at": now,
            "updated_by_id": user_id
        })
        
        # 软删除账单
        bill.deleted_at = now
        bill.updated_at = now
        bill.updated_by_id = user_id
        
        # 5. 提交事务
        db.commit()
        db.refresh(bill)
        
        return bill

class OnlinePaymentService:
    """在线支付服务类"""
    
    def initiate_payment(self, bill: models.Bill, provider: str) -> str:
        """发起在线支付"""
        if provider.lower() == 'alipay':
            return alipay_gateway.create_payment_url(bill)
        elif provider.lower() == 'wechat_pay':
            return wechat_gateway.create_payment_qr(bill)
        else:
            raise ValueError(f"不支持的支付提供商: {provider}")
    
    def process_alipay_notification(self, db: Session, notification_data: dict) -> models.Bill:
        """处理支付宝回调通知"""
        try:
            # 提取关键信息
            bill_id = int(notification_data.get('out_trade_no'))
            trade_status = notification_data.get('trade_status')
            trade_no = notification_data.get('trade_no')
            total_amount = Decimal(notification_data.get('total_amount', '0'))
            
            # 使用数据库锁防止并发问题
            bill = db.query(models.Bill).filter(
                models.Bill.id == bill_id,
                models.Bill.deleted_at.is_(None)
            ).with_for_update().first()
            
            if not bill:
                raise ResourceNotFoundException(resource_type="Bill", resource_id=bill_id)
            
            # 只有在交易成功且账单未支付时才处理
            if trade_status == 'TRADE_SUCCESS' and bill.status != models.BillStatus.PAID:
                # 获取当前用户ID，如果无法获取则使用系统用户ID
                user_id = current_user_id.get()
                if user_id is None:
                    # 在回调处理中，如果无法获取当前用户，使用账单创建者ID
                    user_id = bill.created_by_id
                
                # 检查是否已存在相同交易号的支付记录，避免重复处理
                existing_payment = db.query(models.Payment).filter(
                    models.Payment.bill_id == bill_id,
                    models.Payment.payment_method == models.PaymentMethod.ALIPAY,
                    models.Payment.provider_transaction_id == trade_no
                ).first()
                
                if existing_payment:
                    return bill  # 避免重复处理
                
                # 创建支付记录
                payment = models.Payment(
                    payment_date=datetime.now(UTC),
                    amount=total_amount,
                    payment_method=models.PaymentMethod.ALIPAY,
                    provider_transaction_id=trade_no,
                    bill_id=bill_id,
                    created_at=datetime.now(UTC),
                    updated_at=datetime.now(UTC),
                    created_by_id=user_id,
                    updated_by_id=user_id
                )
                
                db.add(payment)
                db.flush()  # 确保支付记录被保存
                
                # 计算总已支付金额
                total_paid = db.query(func.sum(models.Payment.amount)).filter(
                    models.Payment.bill_id == bill_id,
                    models.Payment.deleted_at.is_(None)
                ).scalar() or Decimal('0')
                
                # 根据已支付金额更新账单状态
                if total_paid >= bill.total_amount:
                    bill.status = models.BillStatus.PAID
                elif total_paid > Decimal('0'):
                    bill.status = models.BillStatus.PARTIALLY_PAID
                else:
                    bill.status = models.BillStatus.UNPAID
                
                # 更新账单信息
                bill.updated_at = datetime.now(UTC)
                bill.updated_by_id = user_id
                
                db.commit()
                db.refresh(bill)
            
            return bill
            
        except Exception as e:
            db.rollback()
            # 对于并发情况下的常见错误，返回账单而不是抛出异常
            if "duplicate" in str(e).lower() or "constraint" in str(e).lower():
                # 可能是重复处理，尝试重新获取账单状态
                try:
                    bill = db.query(models.Bill).filter(
                        models.Bill.id == int(notification_data.get('out_trade_no')),
                        models.Bill.deleted_at.is_(None)
                    ).first()
                    if bill:
                        return bill
                except:
                    pass
            raise BusinessLogicException(f"处理支付宝通知失败: {str(e)}")
    
    def process_wechat_notification(self, db: Session, notification_data: dict) -> models.Bill:
        """处理微信支付回调通知 (预留)"""
        # TODO: 实现微信支付通知处理逻辑
        pass


class MergedPaymentService:
    """合并支付服务类"""
    
    def __init__(self):
        self.alipay_gateway = alipay_gateway
        self.wechat_gateway = wechat_gateway
    
    def get_patient_unpaid_bills(self, db: Session, *, patient_id: int) -> List[models.Bill]:
        """获取患者所有未支付的账单"""
        return db.query(models.Bill).filter(
            models.Bill.patient_id == patient_id,
            models.Bill.status == models.BillStatus.UNPAID,
            models.Bill.deleted_at.is_(None)
        ).all()
    
    def create_merged_payment_session(
        self, 
        db: Session, 
        *, 
        patient_id: int, 
        bill_ids: List[int], 
        payment_method: str, 
        timeout_minutes: int = 15
    ) -> models.MergedPaymentSession:
        """创建合并支付会话"""
        # 1. 验证患者存在
        patient = db.query(patient_models.Patient).filter(
            patient_models.Patient.id == patient_id,
            patient_models.Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise ResourceNotFoundException(resource_type="Patient", resource_id=patient_id)
        
        # 2. 验证账单存在且属于该患者
        bills = db.query(models.Bill).filter(
            models.Bill.id.in_(bill_ids),
            models.Bill.patient_id == patient_id,
            models.Bill.status == models.BillStatus.UNPAID,
            models.Bill.deleted_at.is_(None)
        ).all()
        
        if len(bills) != len(bill_ids):
            raise ValidationException("部分账单不存在或不属于该患者")
        
        # 3. 计算总金额
        total_amount = sum(bill.total_amount for bill in bills)
        
        if total_amount <= 0:
            raise ValidationException("合并支付总金额必须大于0")
        
        # 4. 生成会话ID
        session_id = f"MERGED_{uuid.uuid4().hex[:16].upper()}"
        
        # 5. 创建合并支付会话
        expires_at = datetime.now(UTC) + timedelta(minutes=timeout_minutes)
        
        merged_session = models.MergedPaymentSession(
            session_id=session_id,
            patient_id=patient_id,
            total_amount=total_amount,
            payment_method=payment_method,
            status=models.MergedPaymentSessionStatus.PENDING,
            expires_at=expires_at
        )
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        # 设置审计字段
        now = datetime.now(UTC)
        merged_session.created_at = merged_session.updated_at = now
        merged_session.created_by_id = merged_session.updated_by_id = user_id
        
        db.add(merged_session)
        db.flush()  # 获取会话ID
        
        # 6. 创建账单关联记录
        bill_associations = []
        for bill in bills:
            association = models.MergedPaymentSessionBill(
                merged_session_id=merged_session.id,
                bill_id=bill.id,
                bill_amount=bill.total_amount
            )
            bill_associations.append(association)
        
        db.add_all(bill_associations)
        
        # 7. 生成支付二维码
        try:
            if payment_method == "alipay":
                qr_content = self.alipay_gateway.create_payment_url(
                    order_id=session_id,
                    amount=float(total_amount),
                    subject=f"合并支付-患者{patient.name}"
                )
            elif payment_method == "wechat":
                qr_content = self.wechat_gateway.create_payment_url(
                    order_id=session_id,
                    amount=float(total_amount),
                    subject=f"合并支付-患者{patient.name}"
                )
            else:
                raise ValidationException(f"不支持的支付方式: {payment_method}")
            
            merged_session.qr_code_content = qr_content
            
        except Exception as e:
            raise BusinessLogicException(f"生成支付二维码失败: {str(e)}")
        
        db.commit()
        db.refresh(merged_session)
        
        return merged_session
    
    def process_merged_payment_success(
        self, 
        db: Session, 
        *, 
        session_id: str, 
        provider_transaction_id: str
    ) -> Dict[str, Any]:
        """处理合并支付成功回调"""
        # 1. 查找合并支付会话
        merged_session = db.query(models.MergedPaymentSession).filter(
            models.MergedPaymentSession.session_id == session_id,
            models.MergedPaymentSession.deleted_at.is_(None)
        ).first()
        
        if not merged_session:
            raise ResourceNotFoundException(resource_type="MergedPaymentSession", resource_id=session_id)
        
        if merged_session.status != models.MergedPaymentSessionStatus.PENDING:
            raise ValidationException(f"合并支付会话状态异常: {merged_session.status}")
        
        # 2. 获取关联的账单
        bill_associations = db.query(models.MergedPaymentSessionBill).filter(
            models.MergedPaymentSessionBill.merged_session_id == merged_session.id
        ).all()
        
        if not bill_associations:
            raise ValidationException("合并支付会话没有关联的账单")
        
        # 3. 为每个账单创建支付记录并更新状态
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        now = datetime.now(UTC)
        processed_bills = []
        
        try:
            for association in bill_associations:
                # 创建支付记录
                payment = models.Payment(
                    payment_date=now,
                    amount=association.bill_amount,
                    payment_method=merged_session.payment_method,
                    provider_transaction_id=provider_transaction_id,
                    bill_id=association.bill_id,
                    created_at=now,
                    updated_at=now,
                    created_by_id=user_id,
                    updated_by_id=user_id
                )
                db.add(payment)
                
                # 更新账单状态
                bill = db.query(models.Bill).filter(
                    models.Bill.id == association.bill_id
                ).first()
                
                if bill:
                    bill.status = models.BillStatus.PAID
                    bill.payment_method = merged_session.payment_method
                    bill.provider_transaction_id = provider_transaction_id
                    bill.updated_at = now
                    bill.updated_by_id = user_id
                    
                    processed_bills.append({
                        "bill_id": bill.id,
                        "invoice_number": bill.invoice_number,
                        "amount": association.bill_amount
                    })
            
            # 4. 更新合并支付会话状态
            merged_session.status = models.MergedPaymentSessionStatus.PAID
            merged_session.provider_transaction_id = provider_transaction_id
            merged_session.updated_at = now
            merged_session.updated_by_id = user_id
            
            db.commit()
            
            return {
                "session_id": session_id,
                "total_amount": merged_session.total_amount,
                "processed_bills": processed_bills,
                "transaction_id": provider_transaction_id
            }
            
        except Exception as e:
            db.rollback()
            raise BusinessLogicException(f"处理合并支付失败: {str(e)}")
    
    def get_merged_payment_session(
        self, 
        db: Session, 
        *, 
        session_id: str
    ) -> Optional[models.MergedPaymentSession]:
        """获取合并支付会话详情"""
        return db.query(models.MergedPaymentSession).filter(
            models.MergedPaymentSession.session_id == session_id,
            models.MergedPaymentSession.deleted_at.is_(None)
        ).first()

# 创建服务实例
insurance_service = InsuranceService()
payment_service = PaymentService()
billing_service = BillingService()
merged_payment_service = MergedPaymentService()
online_payment_service = OnlinePaymentService()
