#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试账单生成逻辑
分析为什么已结算检查没有生效
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.finance import models as finance_models
from app.pharmacy import models as pharmacy_models
from app.patient import models as patient_models
from sqlalchemy.orm import joinedload

def debug_billing_logic():
    """调试账单生成逻辑"""
    db = next(get_db())
    
    try:
        print("=== 调试账单生成逻辑 ===")
        
        medical_record_id = 2
        
        # 1. 查看所有账单及其状态
        print(f"\n1. 病历{medical_record_id}的所有账单:")
        all_bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.deleted_at.is_(None)
        ).all()
        
        for bill in all_bills:
            print(f"   账单ID: {bill.id}, 状态: {bill.status.value}, 总金额: {bill.total_amount}")
            
            # 查看账单明细
            items = db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id,
                finance_models.BillItem.deleted_at.is_(None)
            ).all()
            
            for item in items:
                print(f"     - {item.item_name} ({item.item_type}): {item.quantity} x {item.unit_price} = {item.subtotal}")
        
        # 2. 查看已结清账单中的药品明细
        print(f"\n2. 已结清账单中的药品明细:")
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
        
        paid_drugs_set = set()
        for item in paid_drug_items:
            drug_key = (item.item_name, float(item.unit_price), item.quantity)
            paid_drugs_set.add(drug_key)
            print(f"   已结算: {item.item_name}, 单价: {item.unit_price}, 数量: {item.quantity}")
        
        print(f"   已结算药品集合大小: {len(paid_drugs_set)}")
        
        # 3. 查看所有处方明细
        print(f"\n3. 病历{medical_record_id}的所有处方明细:")
        prescriptions = db.query(pharmacy_models.Prescription).filter(
            pharmacy_models.Prescription.medical_record_id == medical_record_id,
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
                
                drug_key = (drug_name, float(detail.drug.unit_price), detail.quantity)
                is_paid = drug_key in paid_drugs_set
                
                print(f"     - {drug_name}: {detail.quantity} x {detail.drug.unit_price} = {detail.quantity * detail.drug.unit_price}")
                print(f"       药品键: {drug_key}")
                print(f"       是否已结算: {is_paid}")
        
        # 4. 检查是否有真正的已结清账单
        print(f"\n4. 检查账单状态:")
        paid_bills_count = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id,
            finance_models.Bill.status == finance_models.BillStatus.PAID,
            finance_models.Bill.deleted_at.is_(None)
        ).count()
        
        print(f"   已结清账单数量: {paid_bills_count}")
        
        if paid_bills_count == 0:
            print("   ⚠ 没有已结清的账单，所以所有药品都会被包含在新账单中")
        
        print("\n=== 调试完成 ===")
        
    except Exception as e:
        print(f"调试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_billing_logic()