#!/usr/bin/env python3
import sqlite3
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db
from app.pharmacy.service import PrescriptionService
from app.finance import models as finance_models
from app.pharmacy import models as pharmacy_models
from app.core.context import current_user_id

def check_data_before_deletion():
    """检查删除前的数据状态"""
    conn = sqlite3.connect('nekolinic.db')
    cursor = conn.cursor()
    
    print("=== 删除前的数据状态 ===")
    
    # 检查处方数据
    cursor.execute('SELECT id, medical_record_id, deleted_at FROM prescriptions WHERE deleted_at IS NULL')
    prescriptions = cursor.fetchall()
    print(f"活跃处方数量: {len(prescriptions)}")
    for p in prescriptions:
        print(f"  处方ID: {p[0]}, 病历ID: {p[1]}")
    
    # 检查处方明细
    cursor.execute('SELECT id, prescription_id, drug_id, quantity, deleted_at FROM prescription_details WHERE deleted_at IS NULL')
    details = cursor.fetchall()
    print(f"活跃处方明细数量: {len(details)}")
    for d in details:
        print(f"  明细ID: {d[0]}, 处方ID: {d[1]}, 药品ID: {d[2]}, 数量: {d[3]}")
    
    # 检查账单项
    cursor.execute('SELECT id, bill_id, item_name, item_type, quantity, unit_price, deleted_at FROM bill_items WHERE deleted_at IS NULL AND item_type = "药物"')
    bill_items = cursor.fetchall()
    print(f"活跃药物账单项数量: {len(bill_items)}")
    for b in bill_items:
        print(f"  账单项ID: {b[0]}, 账单ID: {b[1]}, 项目名称: {b[2]}, 数量: {b[4]}, 单价: {b[5]}")
    
    # 检查账单总金额
    cursor.execute('SELECT id, total_amount FROM bills WHERE deleted_at IS NULL')
    bills = cursor.fetchall()
    print(f"活跃账单数量: {len(bills)}")
    for bill in bills:
        print(f"  账单ID: {bill[0]}, 总金额: {bill[1]}")
    
    conn.close()
    return prescriptions, details, bill_items, bills

def check_data_after_deletion():
    """检查删除后的数据状态"""
    conn = sqlite3.connect('nekolinic.db')
    cursor = conn.cursor()
    
    print("\n=== 删除后的数据状态 ===")
    
    # 检查处方数据
    cursor.execute('SELECT id, medical_record_id, deleted_at FROM prescriptions WHERE deleted_at IS NULL')
    prescriptions = cursor.fetchall()
    print(f"活跃处方数量: {len(prescriptions)}")
    for p in prescriptions:
        print(f"  处方ID: {p[0]}, 病历ID: {p[1]}")
    
    # 检查已删除的处方
    cursor.execute('SELECT id, medical_record_id, deleted_at FROM prescriptions WHERE deleted_at IS NOT NULL')
    deleted_prescriptions = cursor.fetchall()
    print(f"已删除处方数量: {len(deleted_prescriptions)}")
    for p in deleted_prescriptions:
        print(f"  已删除处方ID: {p[0]}, 病历ID: {p[1]}, 删除时间: {p[2]}")
    
    # 检查处方明细
    cursor.execute('SELECT id, prescription_id, drug_id, quantity, deleted_at FROM prescription_details WHERE deleted_at IS NULL')
    details = cursor.fetchall()
    print(f"活跃处方明细数量: {len(details)}")
    
    # 检查账单项
    cursor.execute('SELECT id, bill_id, item_name, item_type, quantity, unit_price, deleted_at FROM bill_items WHERE deleted_at IS NULL AND item_type = "药物"')
    bill_items = cursor.fetchall()
    print(f"活跃药物账单项数量: {len(bill_items)}")
    for b in bill_items:
        print(f"  账单项ID: {b[0]}, 账单ID: {b[1]}, 项目名称: {b[2]}, 数量: {b[4]}, 单价: {b[5]}")
    
    # 检查已删除的账单项
    cursor.execute('SELECT id, bill_id, item_name, item_type, quantity, unit_price, deleted_at FROM bill_items WHERE deleted_at IS NOT NULL AND item_type = "药物"')
    deleted_bill_items = cursor.fetchall()
    print(f"已删除药物账单项数量: {len(deleted_bill_items)}")
    for b in deleted_bill_items:
        print(f"  已删除账单项ID: {b[0]}, 账单ID: {b[1]}, 项目名称: {b[2]}, 数量: {b[4]}, 单价: {b[5]}, 删除时间: {b[6]}")
    
    # 检查账单总金额
    cursor.execute('SELECT id, total_amount FROM bills WHERE deleted_at IS NULL')
    bills = cursor.fetchall()
    print(f"活跃账单数量: {len(bills)}")
    for bill in bills:
        print(f"  账单ID: {bill[0]}, 总金额: {bill[1]}")
    
    conn.close()

def test_prescription_deletion():
    """测试删除处方功能"""
    # 设置当前用户ID（模拟登录用户）
    current_user_id.set(1)
    
    # 检查删除前的数据
    prescriptions_before, details_before, bill_items_before, bills_before = check_data_before_deletion()
    
    if not prescriptions_before:
        print("没有找到可删除的处方")
        return
    
    # 选择第一个处方进行删除测试
    prescription_to_delete = prescriptions_before[0]
    prescription_id = prescription_to_delete[0]
    
    print(f"\n=== 准备删除处方ID: {prescription_id} ===")
    
    # 创建数据库会话
    from app.core.database import engine
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 创建服务实例
        prescription_service = PrescriptionService()
        
        # 执行删除操作
        result = prescription_service.remove(db, id=prescription_id)
        print(f"删除操作完成，返回结果: {result}")
        
        # 检查删除后的数据
        check_data_after_deletion()
        
    except Exception as e:
        print(f"删除操作失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_prescription_deletion()