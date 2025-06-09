from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, UTC
from typing import List, Optional, Dict
from app.core.service_base import BaseService
from app.core.context import current_user_id
from app.core.exceptions import (
    ValidationException, 
    DrugNotFoundException, 
    PrescriptionNotFoundException,
    InsufficientStockException,
    AuthenticationException
)
from . import models, schemas

class DrugService(BaseService[models.Drug, schemas.DrugCreate, schemas.DrugUpdate]):
    def __init__(self):
        super().__init__(models.Drug)

    def get_by_code(self, db: Session, *, code: str) -> Optional[models.Drug]:
        return db.query(models.Drug).filter(models.Drug.code == code).first()
    
    def search_by_name(self, db: Session, *, name: str, skip: int = 0, limit: int = 100) -> List[models.Drug]:
        """根据药品名称搜索药品"""
        return (
            db.query(models.Drug)
            .filter(
                models.Drug.name.ilike(f"%{name}%"),
                models.Drug.deleted_at.is_(None)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search_by_name_paginated(self, db: Session, *, name: str, skip: int = 0, limit: int = 100) -> Dict:
        """根据药品名称搜索药品（分页格式）"""
        query = db.query(models.Drug).filter(
            models.Drug.name.ilike(f"%{name}%"),
            models.Drug.deleted_at.is_(None)
        )
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        
        return {
            "total": total,
            "items": items
        }
    
    def get_with_stock(self, db: Session, *, id: int) -> Optional[Dict]:
        """获取单个药品信息（包含库存信息）"""
        drug = self.get(db, id=id)
        if not drug:
            return None
            
        # 获取当前库存
        current_stock = db.query(func.sum(models.InventoryTransaction.quantity_change)).filter(
            models.InventoryTransaction.drug_id == id
        ).scalar() or 0
        
        return {
            "id": drug.id,
            "name": drug.name,
            "code": drug.code,
            "specification": drug.specification,
            "manufacturer": drug.manufacturer,
            "unit": drug.unit,
            "unit_price": drug.unit_price,
            "stock": current_stock,
            "created_at": drug.created_at,
            "updated_at": drug.updated_at
        }
    
    def get_paginated_with_stock(self, db: Session, *, skip: int = 0, limit: int = 100) -> Dict:
        """获取药品列表（分页格式，包含库存信息）"""
        from . import service  # 避免循环导入
        
        query = db.query(models.Drug).filter(models.Drug.deleted_at.is_(None))
        total = query.count()
        drugs = query.offset(skip).limit(limit).all()
        
        # 为每个药品添加库存信息
        items_with_stock = []
        for drug in drugs:
            current_stock = service.inventory_service.get_current_stock(db, drug_id=drug.id)
            # 创建包含库存的药品对象
            drug_dict = {
                "id": drug.id,
                "name": drug.name,
                "code": drug.code,
                "description": drug.description,
                "specification": drug.specification,
                "manufacturer": drug.manufacturer,
                "unit": drug.unit,
                "unit_price": drug.unit_price,
                "cost_price": drug.cost_price,
                "stock": current_stock
            }
            items_with_stock.append(drug_dict)
        
        return {
            "total": total,
            "items": items_with_stock
        }
    
    def search_by_name_paginated_with_stock(self, db: Session, *, name: str, skip: int = 0, limit: int = 100) -> Dict:
        """根据药品名称搜索药品（分页格式，包含库存信息）"""
        from . import service  # 避免循环导入
        
        query = db.query(models.Drug).filter(
            models.Drug.name.ilike(f"%{name}%"),
            models.Drug.deleted_at.is_(None)
        )
        total = query.count()
        drugs = query.offset(skip).limit(limit).all()
        
        # 为每个药品添加库存信息
        items_with_stock = []
        for drug in drugs:
            current_stock = service.inventory_service.get_current_stock(db, drug_id=drug.id)
            # 创建包含库存的药品对象
            drug_dict = {
                "id": drug.id,
                "name": drug.name,
                "code": drug.code,
                "description": drug.description,
                "specification": drug.specification,
                "manufacturer": drug.manufacturer,
                "unit": drug.unit,
                "unit_price": drug.unit_price,
                "cost_price": drug.cost_price,
                "stock": current_stock
            }
            items_with_stock.append(drug_dict)
        
        return {
            "total": total,
            "items": items_with_stock
        }

class PrescriptionService(BaseService[models.Prescription, schemas.PrescriptionCreate, schemas.PrescriptionUpdate]):
    def __init__(self):
        super().__init__(models.Prescription)

    def create(self, db: Session, *, obj_in: schemas.PrescriptionCreate) -> models.Prescription:
        """重写create方法，支持嵌套创建处方明细"""
        # 提取处方明细数据
        details_data = obj_in.details
        
        # 创建处方主表 (使用BaseService处理审计字段)
        obj_in_data = obj_in.model_dump(exclude={"details"})
        
        # 使用基础服务创建处方对象，但不使用PrescriptionCreate验证模型
        db_obj = models.Prescription(**obj_in_data)
        
        # 获取当前用户ID用于审计
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
            
        # 设置审计字段
        now = datetime.now(UTC)
        db_obj.created_at = db_obj.updated_at = now
        db_obj.created_by_id = db_obj.updated_by_id = user_id
        
        # 设置默认状态
        db_obj.dispensing_status = models.DispensingStatus.PENDING
        
        db.add(db_obj)
        db.flush()  # 刷新以获取ID
        
        # 创建处方明细
        for detail_data in details_data:
            detail = models.PrescriptionDetail(
                **detail_data.model_dump(),
                prescription_id=db_obj.id,
                created_at=db_obj.created_at,
                updated_at=db_obj.updated_at,
                created_by_id=user_id,
                updated_by_id=user_id
            )
            db.add(detail)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_with_details(self, db: Session, *, id: int) -> Optional[models.Prescription]:
        """获取处方及其所有明细，包含患者和医生信息"""
        prescription = (
            db.query(models.Prescription)
            .options(
                joinedload(models.Prescription.details).joinedload(models.PrescriptionDetail.drug),
                joinedload(models.Prescription.medical_record).joinedload(models.MedicalRecord.patient),
                joinedload(models.Prescription.doctor)
            )
            .filter(models.Prescription.id == id)
            .filter(models.Prescription.deleted_at.is_(None))  # 过滤软删除的记录
            .first()
        )
        
        # 将medical_record.patient映射到prescription.patient以便schema序列化
        if prescription and prescription.medical_record and prescription.medical_record.patient:
            prescription.patient = prescription.medical_record.patient
        
        return prescription
    
    def get_multi_with_details(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[models.Prescription]:
        """获取处方列表，包含患者和医生信息"""
        prescriptions = (
            db.query(models.Prescription)
            .options(
                joinedload(models.Prescription.details).joinedload(models.PrescriptionDetail.drug),
                joinedload(models.Prescription.medical_record).joinedload(models.MedicalRecord.patient),
                joinedload(models.Prescription.doctor)
            )
            .filter(models.Prescription.deleted_at.is_(None))  # 过滤软删除的记录
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # 为每个处方映射patient信息
        for prescription in prescriptions:
            if prescription.medical_record and prescription.medical_record.patient:
                prescription.patient = prescription.medical_record.patient
        
        return prescriptions

class InventoryService:
    def add_stock(self, db: Session, *, drug_id: int, quantity: int, notes: Optional[str] = None) -> models.InventoryTransaction:
        """入库操作"""
        if quantity <= 0:
            raise ValidationException("入库数量必须为正数")
        
        # 检查药品是否存在
        drug = db.query(models.Drug).get(drug_id)
        if not drug:
            raise DrugNotFoundException(drug_id)
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        transaction = models.InventoryTransaction(
            transaction_time=datetime.now(UTC),
            transaction_type=models.InventoryTransactionType.STOCK_IN,
            quantity_change=quantity,
            notes=notes,
            drug_id=drug_id,
            action_by_id=user_id
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    def bulk_add_stock(self, db: Session, *, stock_items: List[schemas.BulkStockInItem], notes: Optional[str] = None) -> List[models.InventoryTransaction]:
        """批量入库操作"""
        if not stock_items:
            raise ValidationException("批量入库项目不能为空")
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        transactions = []
        
        # 验证所有药品是否存在
        drug_ids = [item.drug_id for item in stock_items]
        existing_drugs = db.query(models.Drug).filter(models.Drug.id.in_(drug_ids)).all()
        existing_drug_ids = {drug.id for drug in existing_drugs}
        
        for item in stock_items:
            if item.drug_id not in existing_drug_ids:
                raise DrugNotFoundException(item.drug_id)
            if item.quantity <= 0:
                raise ValidationException(f"药品ID {item.drug_id} 的入库数量必须为正数")
        
        # 创建库存交易记录
        for item in stock_items:
            item_notes = item.notes or notes
            transaction = models.InventoryTransaction(
                transaction_time=datetime.now(UTC),
                transaction_type=models.InventoryTransactionType.STOCK_IN,
                quantity_change=item.quantity,
                notes=item_notes,
                drug_id=item.drug_id,
                action_by_id=user_id
            )
            db.add(transaction)
            transactions.append(transaction)
        
        # 如果提供了进价信息，更新药品的进价
        for item in stock_items:
            if item.cost_price is not None:
                drug = next(d for d in existing_drugs if d.id == item.drug_id)
                drug.cost_price = item.cost_price
        
        db.commit()
        
        # 刷新所有交易记录
        for transaction in transactions:
            db.refresh(transaction)
        
        return transactions

    def dispense_drugs(self, db: Session, *, prescription_id: int, notes: Optional[str] = None) -> List[models.InventoryTransaction]:
        """根据处方发药，一次性扣减所有药品库存"""
        # 获取处方
        prescription = db.query(models.Prescription).get(prescription_id)
        if not prescription:
            raise PrescriptionNotFoundException(prescription_id)
        
        # 检查处方状态
        if prescription.dispensing_status != models.DispensingStatus.PENDING:
            raise ValidationException(f"处方已经是 {prescription.dispensing_status} 状态，不能发药")
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
            
        transactions = []
        
        # 检查所有药品库存并创建发药事务
        for detail in prescription.details:
            current_stock = self.get_current_stock(db, drug_id=detail.drug_id)
            if current_stock < detail.quantity:
                # 获取药品名称
                drug = db.query(models.Drug).get(detail.drug_id)
                drug_name = drug.name if drug else f"药品ID:{detail.drug_id}"
                
                raise InsufficientStockException(
                    drug_name=drug_name,
                    requested=detail.quantity,
                    current_stock=current_stock
                )
            
            transaction = models.InventoryTransaction(
                transaction_time=datetime.now(UTC),
                transaction_type=models.InventoryTransactionType.DISPENSE,
                quantity_change=-detail.quantity,  # 负数为扣减
                notes=notes or f"处方 #{prescription.id} 发药",
                drug_id=detail.drug_id,
                action_by_id=user_id
            )
            transactions.append(transaction)
        
        # 添加所有事务并更新处方状态
        db.add_all(transactions)
        prescription.dispensing_status = models.DispensingStatus.DISPENSED
        prescription.updated_at = datetime.now(UTC)
        prescription.updated_by_id = user_id
        
        db.commit()
        
        # 刷新所有事务对象
        for transaction in transactions:
            db.refresh(transaction)
            
        return transactions

    def adjust_stock(self, db: Session, *, drug_id: int, quantity_change: int, notes: str) -> models.InventoryTransaction:
        """库存调整（盘点）"""
        # 检查药品是否存在
        drug = db.query(models.Drug).get(drug_id)
        if not drug:
            raise DrugNotFoundException(drug_id)
        
        # 获取当前用户ID
        user_id = current_user_id.get()
        if user_id is None:
            raise AuthenticationException("无法获取当前用户信息，请先登录")
        
        # 如果是减少库存，检查库存是否足够
        if quantity_change < 0:
            current_stock = self.get_current_stock(db, drug_id=drug_id)
            if current_stock + quantity_change < 0:  # +是因为quantity_change本身已经是负数
                raise InsufficientStockException(
                    drug_name=drug.name,
                    requested=-quantity_change,
                    current_stock=current_stock
                )
        
        transaction = models.InventoryTransaction(
            transaction_time=datetime.now(UTC),
            transaction_type=models.InventoryTransactionType.ADJUSTMENT,
            quantity_change=quantity_change,
            notes=notes,
            drug_id=drug_id,
            action_by_id=user_id
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    def get_current_stock(self, db: Session, *, drug_id: int) -> int:
        """计算指定药品的当前库存"""
        total = db.query(func.sum(models.InventoryTransaction.quantity_change)).filter(
            models.InventoryTransaction.drug_id == drug_id
        ).scalar()
        return total or 0

    def get_all_stocks(self, db: Session) -> List[Dict]:
        """获取所有药品的当前库存"""
        # 获取所有药品
        drugs = db.query(models.Drug).all()
        
        # 为每个药品计算库存
        result = []
        for drug in drugs:
            current_stock = self.get_current_stock(db, drug_id=drug.id)
            result.append({
                "drug_id": drug.id,
                "drug_name": drug.name,
                "current_stock": current_stock
            })
        
        return result

    def get_stock_history(self, db: Session, *, drug_id: int, skip: int = 0, limit: int = 100) -> List[models.InventoryTransaction]:
        """获取指定药品的库存变动历史"""
        # 验证药品是否存在
        drug = db.query(models.Drug).get(drug_id)
        if not drug:
            raise DrugNotFoundException(drug_id)
            
        return (
            db.query(models.InventoryTransaction)
            .filter(models.InventoryTransaction.drug_id == drug_id)
            .order_by(models.InventoryTransaction.transaction_time.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_low_stock_drugs(self, db: Session) -> List[Dict]:
        """获取库存低于阈值的药品"""
        from app.core.config import settings
        
        # 获取所有药品的库存
        all_stocks = self.get_all_stocks(db)
        
        # 筛选出低于阈值的药品
        low_stock_drugs = [
            stock for stock in all_stocks 
            if stock["current_stock"] <= settings.LOW_STOCK_THRESHOLD
        ]
        
        return low_stock_drugs

# 实例化所有服务
drug_service = DrugService()
prescription_service = PrescriptionService()
inventory_service = InventoryService()
