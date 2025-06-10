#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整测试账单生成场景
1. 先生成一个包含药物的账单
2. 将其标记为已结清
3. 再生成新账单，验证是否排除已结清的药物
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

def test_complete_billing_scenario():
    """完整测试账单生成场景"""
    db = next(get_db())
    billing_service = BillingService()
    
    # 设置当前用户ID
    current_user_id.set(1)
    
    try:
        print("=== 完整测试账单生成场景 ===")
        
        medical_record_id = 2
        
        # 1. 清理之前的测试数据（删除未结清的账单）
        print("\n1. 清理之前的测试数据...")
        unpaid_bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.status != finance_models.BillStatus.PAID,
            finance_models.Bill.deleted_at.is_(None)
        ).all()
        
        for bill in unpaid_bills:
            print(f"   删除未结清账单: {bill.id}")
            # 先删除账单明细
            db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id
            ).delete()
            # 再删除账单
            db.delete(bill)
        
        db.commit()
        
        # 2. 生成第一个包含药物的账单
        print("\n2. 生成第一个包含药物的账单...")
        first_bill = billing_service.generate_bill_for_record(
            db=db, 
            medical_record_id=medical_record_id, 
            include_consultation_fee=False  # 只包含药物
        )
        
        print(f"   第一个账单ID: {first_bill.id}, 总金额: {first_bill.total_amount}")
        
        # 查看第一个账单的明细
        first_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.bill_id == first_bill.id,
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print("   第一个账单明细:")
        for item in first_items:
            print(f"     - {item.item_name} ({item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 3. 将第一个账单标记为已结清
        print(f"\n3. 将第一个账单(ID: {first_bill.id})标记为已结清...")
        first_bill.status = finance_models.BillStatus.PAID
        db.commit()
        print(f"   账单{first_bill.id}已标记为已结清")
        
        # 4. 验证已结清账单中的药物明细
        print("\n4. 验证已结清账单中的药物明细:")
        paid_drug_items = db.query(
            finance_models.BillItem.item_name,
            finance_models.BillItem.unit_price,
            finance_models.BillItem.quantity
        ).join(
            finance_models.Bill, finance_models.Bill.id == finance_models.BillItem.bill_id
        ).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.status == finance_models.BillStatus.PAID,
            finance_models.BillItem.item_type == "药物",
            finance_models.Bill.deleted_at.is_(None),
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print(f"   已结清的药物明细数量: {len(paid_drug_items)}")
        for item in paid_drug_items:
            print(f"     - {item.item_name}: {item.quantity} x {item.unit_price}")
        
        # 5. 生成第二个账单（应该排除已结清的药物）
        print("\n5. 生成第二个账单（应该排除已结清的药物）:")
        second_bill = billing_service.generate_bill_for_record(
            db=db, 
            medical_record_id=medical_record_id, 
            include_consultation_fee=False
        )
        
        print(f"   第二个账单ID: {second_bill.id}, 总金额: {second_bill.total_amount}")
        
        # 查看第二个账单的明细
        second_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.bill_id == second_bill.id,
            finance_models.BillItem.deleted_at.is_(None)
        ).all()
        
        print("   第二个账单明细:")
        for item in second_items:
            print(f"     - {item.item_name} ({item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 6. 验证结果
        print("\n6. 验证结果:")
        if second_bill.total_amount == 0:
            print("   ✓ 优化成功！第二个账单总金额为0，说明已结清的药品被正确排除")
        else:
            print(f"   ⚠ 第二个账单仍有金额: {second_bill.total_amount}")
            print("   这可能意味着:")
            print("     - 存在新的处方明细")
            print("     - 或者排除逻辑需要进一步调整")
        
        print("\n=== 测试完成 ===")
        
    except Exception as e:
        print(f"测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_complete_billing_scenario()