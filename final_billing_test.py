#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整的账单生成优化测试
1. 创建初始处方
2. 生成第一个账单并结清
3. 添加新处方
4. 生成第二个账单，验证只包含新药品
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

def final_billing_test():
    """完整的账单生成优化测试"""
    db = next(get_db())
    billing_service = BillingService()
    
    # 设置当前用户ID
    current_user_id.set(1)
    
    try:
        print("=== 完整的账单生成优化测试 ===")
        
        medical_record_id = 2
        
        # 步骤1: 创建初始处方
        print("\n步骤1: 创建初始处方")
        
        # 获取两种不同的药品
        drug1 = db.query(pharmacy_models.Drug).filter(
            pharmacy_models.Drug.id == 1,
            pharmacy_models.Drug.deleted_at.is_(None)
        ).first()
        
        drug2 = db.query(pharmacy_models.Drug).filter(
            pharmacy_models.Drug.id == 2,
            pharmacy_models.Drug.deleted_at.is_(None)
        ).first()
        
        if not drug1 or not drug2:
            print("   错误: 找不到足够的药品数据")
            return
        
        print(f"   药品1: {drug1.name} (单价: {drug1.unit_price})")
        print(f"   药品2: {drug2.name} (单价: {drug2.unit_price})")
        
        # 创建第一个处方
        prescription1 = pharmacy_models.Prescription(
            medical_record_id=medical_record_id,
            doctor_id=1,
            prescription_date=datetime.now(),
            dispensing_status=pharmacy_models.DispensingStatus.PENDING
        )
        db.add(prescription1)
        db.flush()
        
        # 添加处方明细
        detail1_1 = pharmacy_models.PrescriptionDetail(
            prescription_id=prescription1.id,
            drug_id=drug1.id,
            quantity=5,
            dosage="500mg",
            frequency="每日两次",
            days=7
        )
        
        detail1_2 = pharmacy_models.PrescriptionDetail(
            prescription_id=prescription1.id,
            drug_id=drug2.id,
            quantity=3,
            dosage="250mg",
            frequency="每日一次",
            days=5
        )
        
        db.add(detail1_1)
        db.add(detail1_2)
        db.commit()
        
        print(f"   处方1创建完成 (ID: {prescription1.id})")
        print(f"     - {drug1.name} x {detail1_1.quantity}")
        print(f"     - {drug2.name} x {detail1_2.quantity}")
        
        # 步骤2: 生成第一个账单并结清
        print("\n步骤2: 生成第一个账单并结清")
        
        bill1 = billing_service.generate_bill_for_record(
            db=db,
            medical_record_id=medical_record_id,
            include_consultation_fee=False
        )
        
        print(f"   第一个账单生成 (ID: {bill1.id}, 金额: {bill1.total_amount})")
        
        # 查看第一个账单明细
        bill1_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.bill_id == bill1.id,
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print("   第一个账单明细:")
        for item in bill1_items:
            print(f"     - {item.item_name}: {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 将第一个账单标记为已结清
        bill1.status = finance_models.BillStatus.PAID
        db.commit()
        print(f"   账单{bill1.id}已标记为已结清")
        
        # 步骤3: 添加新处方
        print("\n步骤3: 添加新处方")
        
        prescription2 = pharmacy_models.Prescription(
            medical_record_id=medical_record_id,
            doctor_id=1,
            prescription_date=datetime.now(),
            dispensing_status=pharmacy_models.DispensingStatus.PENDING
        )
        db.add(prescription2)
        db.flush()
        
        # 添加新的处方明细（包含一个已结清的药品和一个新药品）
        detail2_1 = pharmacy_models.PrescriptionDetail(
            prescription_id=prescription2.id,
            drug_id=drug1.id,  # 重复药品
            quantity=2,  # 不同数量
            dosage="500mg",
            frequency="每日一次",
            days=3
        )
        
        detail2_2 = pharmacy_models.PrescriptionDetail(
            prescription_id=prescription2.id,
            drug_id=drug2.id,  # 重复药品
            quantity=1,  # 不同数量
            dosage="250mg",
            frequency="每日一次",
            days=2
        )
        
        db.add(detail2_1)
        db.add(detail2_2)
        db.commit()
        
        print(f"   处方2创建完成 (ID: {prescription2.id})")
        print(f"     - {drug1.name} x {detail2_1.quantity} (重复药品)")
        print(f"     - {drug2.name} x {detail2_2.quantity} (重复药品)")
        
        # 步骤4: 生成第二个账单
        print("\n步骤4: 生成第二个账单")
        
        bill2 = billing_service.generate_bill_for_record(
            db=db,
            medical_record_id=medical_record_id,
            include_consultation_fee=False
        )
        
        print(f"   第二个账单生成 (ID: {bill2.id}, 金额: {bill2.total_amount})")
        
        # 查看第二个账单明细
        bill2_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.bill_id == bill2.id,
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print("   第二个账单明细:")
        for item in bill2_items:
            print(f"     - {item.item_name}: {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 步骤5: 验证优化结果
        print("\n步骤5: 验证优化结果")
        
        # 计算期望的第二个账单金额（只包含新增的药品数量）
        expected_amount = (drug1.unit_price * detail2_1.quantity + 
                          drug2.unit_price * detail2_2.quantity)
        
        print(f"   期望第二个账单金额: {expected_amount}")
        print(f"   实际第二个账单金额: {bill2.total_amount}")
        
        if bill2.total_amount == expected_amount:
            print("   ✓ 优化成功！第二个账单只包含新增的药品数量")
        elif bill2.total_amount == 0:
            print("   ⚠ 第二个账单金额为0，可能所有药品都被排除了")
        else:
            print(f"   ⚠ 第二个账单金额异常")
        
        # 验证明细数量
        if len(bill2_items) == 2:
            print("   ✓ 第二个账单包含正确数量的明细")
        elif len(bill2_items) == 0:
            print("   ⚠ 第二个账单没有明细")
        else:
            print(f"   ⚠ 第二个账单明细数量异常: {len(bill2_items)}")
        
        print("\n=== 测试完成 ===")
        
    except Exception as e:
        print(f"测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    final_billing_test()