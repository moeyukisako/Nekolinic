#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新处方的账单生成
1. 在已有结清账单的基础上
2. 添加新的处方
3. 生成新账单，验证只包含新增的药品
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.finance.service import BillingService
from app.core.context import current_user_id
from app.finance import models as finance_models
from app.pharmacy import models as pharmacy_models
from app.patient import models as patient_models
from decimal import Decimal
from datetime import datetime

def test_new_prescription_billing():
    """测试新处方的账单生成"""
    db = next(get_db())
    billing_service = BillingService()
    
    # 设置当前用户ID
    current_user_id.set(1)
    
    try:
        print("=== 测试新处方的账单生成 ===")
        
        medical_record_id = 2
        
        # 1. 检查当前状态
        print("\n1. 检查当前状态:")
        paid_bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.status == finance_models.BillStatus.PAID,
            finance_models.Bill.deleted_at.is_(None)
        ).count()
        print(f"   已结清账单数量: {paid_bills}")
        
        # 2. 添加新的处方
        print("\n2. 添加新的处方:")
        
        # 获取一个药品（假设使用ID为1的药品）
        drug = db.query(pharmacy_models.Drug).filter(
            pharmacy_models.Drug.id == 1,
            pharmacy_models.Drug.deleted_at.is_(None)
        ).first()
        
        if not drug:
            print("   错误: 找不到药品ID为1的药品")
            return
        
        print(f"   使用药品: {drug.name} (ID: {drug.id}), 单价: {drug.unit_price}")
        
        # 创建新的处方
        new_prescription = pharmacy_models.Prescription(
            medical_record_id=medical_record_id,
            doctor_id=1,  # 假设医生ID为1
            prescription_date=datetime.now(),
            dispensing_status=pharmacy_models.DispensingStatus.PENDING
        )
        db.add(new_prescription)
        db.flush()  # 获取处方ID
        
        print(f"   新处方ID: {new_prescription.id}")
        
        # 添加处方明细
        new_detail = pharmacy_models.PrescriptionDetail(
            prescription_id=new_prescription.id,
            drug_id=drug.id,
            quantity=10,  # 10个单位
            dosage="500mg",
            frequency="每日一次",
            days=7
        )
        db.add(new_detail)
        db.commit()
        
        print(f"   新处方明细: {drug.name} x {new_detail.quantity}")
        
        # 3. 生成新账单
        print("\n3. 生成新账单:")
        new_bill = billing_service.generate_bill_for_record(
            db=db, 
            medical_record_id=medical_record_id, 
            include_consultation_fee=False
        )
        
        print(f"   新账单ID: {new_bill.id}, 总金额: {new_bill.total_amount}")
        
        # 查看新账单的明细
        new_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.bill_id == new_bill.id,
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print("   新账单明细:")
        for item in new_items:
            print(f"     - {item.item_name} ({item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 4. 验证结果
        print("\n4. 验证结果:")
        expected_amount = drug.unit_price * new_detail.quantity
        if new_bill.total_amount == expected_amount:
            print(f"   ✓ 优化成功！新账单只包含新增药品，金额正确: {new_bill.total_amount}")
        else:
            print(f"   ⚠ 账单金额异常: 期望 {expected_amount}, 实际 {new_bill.total_amount}")
        
        if len(new_items) == 1 and drug.name in new_items[0].item_name:
            print("   ✓ 账单明细正确，只包含新增的药品")
        else:
            print(f"   ⚠ 账单明细异常，包含 {len(new_items)} 个明细")
        
        print("\n=== 测试完成 ===")
        
    except Exception as e:
        print(f"测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_new_prescription_billing()