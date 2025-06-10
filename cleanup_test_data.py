#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理测试数据
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.finance import models as finance_models
from app.pharmacy import models as pharmacy_models

def cleanup_test_data():
    """清理测试数据"""
    db = next(get_db())
    
    try:
        print("=== 清理测试数据 ===")
        
        medical_record_id = 2
        
        # 1. 删除所有账单及其明细
        print("\n1. 删除所有账单及其明细...")
        bills = db.query(finance_models.Bill).filter(
            finance_models.Bill.medical_record_id == medical_record_id
        ).all()
        
        for bill in bills:
            print(f"   删除账单: {bill.id} (状态: {bill.status.value})")
            # 删除账单明细
            db.query(finance_models.BillItem).filter(
                finance_models.BillItem.bill_id == bill.id
            ).delete()
            # 删除账单
            db.delete(bill)
        
        # 2. 删除所有处方及其明细
        print("\n2. 删除所有处方及其明细...")
        prescriptions = db.query(pharmacy_models.Prescription).filter(
            pharmacy_models.Prescription.medical_record_id == medical_record_id
        ).all()
        
        for prescription in prescriptions:
            print(f"   删除处方: {prescription.id}")
            # 删除处方明细
            db.query(pharmacy_models.PrescriptionDetail).filter(
                pharmacy_models.PrescriptionDetail.prescription_id == prescription.id
            ).delete()
            # 删除处方
            db.delete(prescription)
        
        db.commit()
        print("\n✓ 清理完成")
        
    except Exception as e:
        print(f"清理过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_test_data()