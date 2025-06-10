#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试优化后的账单生成逻辑
验证已结算检查功能是否正常工作
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
from sqlalchemy.orm import joinedload

def test_optimized_billing():
    """测试优化后的账单生成逻辑"""
    db = next(get_db())
    billing_service = BillingService()
    
    # 设置当前用户ID
    current_user_id.set(1)
    
    try:
        print("=== 测试优化后的账单生成逻辑 ===")
        
        # 1. 查看病历2的现有账单状态
        print("\n1. 查看病历2的现有账单:")
        existing_bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == 2,
            finance_models.Bill.deleted_at.is_(None)
        ).all()
        
        for bill in existing_bills:
            print(f"   账单ID: {bill.id}, 状态: {bill.status}, 总金额: {bill.total_amount}")
            
            # 查看账单明细
            items = db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id,
                finance_models.BillItem.deleted_at.is_(None)
            ).all()
            
            for item in items:
                print(f"     - {item.item_name} ({item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 2. 查看病历2的所有处方明细
        print("\n2. 查看病历2的所有处方明细:")
        prescriptions = db.query(pharmacy_models.Prescription).filter(
            pharmacy_models.Prescription.medical_record_id == 2,
            pharmacy_models.Prescription.deleted_at.is_(None)
        ).all()
        
        for prescription in prescriptions:
            print(f"   处方ID: {prescription.id}")
            details = db.query(pharmacy_models.PrescriptionDetail).options(
                joinedload(pharmacy_models.PrescriptionDetail.drug)
            ).filter(
                pharmacy_models.PrescriptionDetail.prescription_id == prescription.id,
                pharmacy_models.PrescriptionDetail.deleted_at.is_(None)
            ).all()
            
            for detail in details:
                drug_name = detail.drug.name
                if detail.drug.specification:
                    drug_name = f"{detail.drug.name}（{detail.drug.specification}）"
                print(f"     - {drug_name}: {detail.quantity} x {detail.drug.unit_price}")
        
        # 3. 模拟第一个账单已结清的情况
        if existing_bills:
            first_bill = existing_bills[0]
            if first_bill.status != finance_models.BillStatus.PAID:
                print(f"\n3. 将第一个账单(ID: {first_bill.id})标记为已结清...")
                first_bill.status = finance_models.BillStatus.PAID
                db.commit()
                print(f"   账单{first_bill.id}已标记为已结清")
        
        # 4. 生成新账单（应该排除已结清账单中的药品）
        print("\n4. 生成新账单（应该排除已结清的药品）:")
        new_bill = billing_service.generate_bill_for_record(
            db=db, 
            medical_record_id=2, 
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
        
        # 5. 验证结果
        print("\n5. 验证结果:")
        if new_bill.total_amount == 0:
            print("   ✓ 优化成功！新账单总金额为0，说明已结清的药品被正确排除")
        else:
            print(f"   ⚠ 新账单仍有金额: {new_bill.total_amount}，可能存在未结清的药品或逻辑需要调整")
        
        print("\n=== 测试完成 ===")
        
    except Exception as e:
        print(f"测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_optimized_billing()