#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查已结清账单的详细内容
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.finance import models as finance_models

def check_paid_bill_details():
    """检查已结清账单的详细内容"""
    db = next(get_db())
    
    try:
        print("=== 检查已结清账单的详细内容 ===")
        
        medical_record_id = 2
        
        # 查找已结清的账单
        paid_bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.status == finance_models.BillStatus.PAID,
            finance_models.Bill.deleted_at.is_(None)
        ).all()
        
        print(f"已结清账单数量: {len(paid_bills)}")
        
        for bill in paid_bills:
            print(f"\n账单ID: {bill.id}, 状态: {bill.status.value}, 总金额: {bill.total_amount}")
            
            # 查看所有账单明细
            all_items = db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id,
                finance_models.BillItem.deleted_at.is_(None)
            ).all()
            
            print(f"账单明细总数: {len(all_items)}")
            for item in all_items:
                print(f"  - {item.item_name} (类型: {item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
            
            # 专门查看药物类型的明细
            drug_items = db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id,
                finance_models.BillItem.item_type == "药物",
                finance_models.BillItem.deleted_at.is_(None)
            ).all()
            
            print(f"药物明细数量: {len(drug_items)}")
            for item in drug_items:
                print(f"  药物: {item.item_name}: {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        print("\n=== 检查完成 ===")
        
    except Exception as e:
        print(f"检查过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_paid_bill_details()