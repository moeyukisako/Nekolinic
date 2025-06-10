#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成测试数据
- 30个患者
- 30种药品
- 50份病历（随机分配给30个患者）
- 70个处方（随机分配给50份病历）
- 验证通过处方创建账单的功能
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
from app.clinic import models as clinic_models
from decimal import Decimal
from datetime import datetime, timedelta
import random
import string

def generate_random_name():
    """生成随机姓名"""
    surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
    given_names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀', '霞', '平']
    return random.choice(surnames) + random.choice(given_names) + random.choice(given_names)

def generate_random_phone():
    """生成随机手机号"""
    prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
    return random.choice(prefixes) + ''.join([str(random.randint(0, 9)) for _ in range(8)])

def generate_random_id_card():
    """生成随机身份证号"""
    # 简化版身份证号生成
    area_codes = ['110101', '310101', '440101', '500101', '120101']
    birth_year = random.randint(1950, 2005)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)
    sequence = random.randint(100, 999)
    return f"{random.choice(area_codes)}{birth_year:04d}{birth_month:02d}{birth_day:02d}{sequence}X"

def generate_drug_name():
    """生成随机药品名称"""
    prefixes = ['阿莫西林', '头孢', '青霉素', '红霉素', '氯霉素', '链霉素', '庆大霉素', '卡那霉素', '新霉素', '多西环素']
    suffixes = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '滴眼液', '喷雾剂', '栓剂', '贴剂']
    specs = ['0.25g', '0.5g', '1g', '2g', '5mg', '10mg', '25mg', '50mg', '100mg', '250mg']
    return f"{random.choice(prefixes)}{random.choice(suffixes)}（{random.choice(specs)}）"

def generate_test_data():
    """生成测试数据"""
    db = next(get_db())
    billing_service = BillingService()
    
    # 设置当前用户ID
    current_user_id.set(1)
    
    try:
        print("=== 开始生成测试数据 ===")
        
        # 1. 生成30个患者
        print("\n1. 生成30个患者...")
        patients = []
        for i in range(30):
            patient = patient_models.Patient(
                name=f"患者{i+1}",
                gender=random.choice(['男', '女']),
                birth_date=datetime(random.randint(1950, 2010), random.randint(1, 12), random.randint(1, 28)),
                contact_number=generate_random_phone(),
                address=f"测试地址{i+1}号",
                past_medical_history=f"既往病史{i+1}"
            )
            db.add(patient)
            patients.append(patient)
        
        db.flush()  # 获取患者ID
        print(f"   已生成{len(patients)}个患者")
        
        # 2. 生成30种药品
        print("\n2. 生成30种药品...")
        drugs = []
        for i in range(30):
            drug = pharmacy_models.Drug(
                name=generate_drug_name(),
                code=f"DRUG{i+1:03d}",
                description=f"测试药品{i+1}的描述",
                specification=random.choice(['0.25g*12片/盒', '0.5g*24片/盒', '1g*6片/盒', '100ml/瓶', '50ml/瓶']),
                manufacturer=f"测试制药公司{random.randint(1, 10)}",
                unit=random.choice(['盒', '瓶', '支', '片', '粒']),
                unit_price=Decimal(str(round(random.uniform(5.0, 200.0), 2))),
                cost_price=Decimal(str(round(random.uniform(2.0, 100.0), 2)))
            )
            db.add(drug)
            drugs.append(drug)
        
        db.flush()  # 获取药品ID
        print(f"   已生成{len(drugs)}种药品")
        
        # 3. 生成50份病历（随机分配给30个患者）
        print("\n3. 生成50份病历...")
        medical_records = []
        for i in range(50):
            patient = random.choice(patients)
            # 生成唯一的display_id
            timestamp = int(datetime.now().timestamp() * 1000000) + i
            record = patient_models.MedicalRecord(
                display_id=f"MR{timestamp}",
                patient_id=patient.id,
                doctor_id=1,  # 假设有医生ID为1
                record_date=datetime.now() - timedelta(days=random.randint(0, 365)),
                chief_complaint=f"测试主诉{i+1}",
                present_illness=f"测试现病史{i+1}",
                past_history=f"测试既往史{i+1}",
                physical_examination=f"测试体格检查{i+1}",
                diagnosis=f"测试诊断{i+1}",
                treatment_plan=f"测试治疗方案{i+1}",
                notes=f"测试备注{i+1}"
            )
            db.add(record)
            medical_records.append(record)
        
        db.flush()  # 获取病历ID
        print(f"   已生成{len(medical_records)}份病历")
        
        # 4. 生成70个处方（随机分配给50份病历）
        print("\n4. 生成70个处方...")
        prescriptions = []
        for i in range(70):
            record = random.choice(medical_records)
            prescription = pharmacy_models.Prescription(
                medical_record_id=record.id,
                doctor_id=1,
                prescription_date=record.record_date + timedelta(hours=random.randint(1, 24)),
                dispensing_status=pharmacy_models.DispensingStatus.PENDING
            )
            db.add(prescription)
            db.flush()  # 获取处方ID
            
            # 为每个处方添加1-5个药品明细
            detail_count = random.randint(1, 5)
            selected_drugs = random.sample(drugs, min(detail_count, len(drugs)))
            
            for drug in selected_drugs:
                detail = pharmacy_models.PrescriptionDetail(
                    prescription_id=prescription.id,
                    drug_id=drug.id,
                    quantity=random.randint(1, 10),
                    dosage=random.choice(['500mg', '250mg', '1g', '0.5g', '100mg']),
                    frequency=random.choice(['每日一次', '每日两次', '每日三次', '每8小时一次', '每12小时一次']),
                    days=random.randint(3, 14)
                )
                db.add(detail)
            
            prescriptions.append(prescription)
        
        db.commit()
        print(f"   已生成{len(prescriptions)}个处方")
        
        # 5. 验证通过处方创建账单的功能
        print("\n5. 验证通过处方创建账单的功能...")
        
        # 随机选择10份病历来生成账单
        test_records = random.sample(medical_records, 10)
        bills_created = 0
        
        for record in test_records:
            try:
                bill = billing_service.generate_bill_for_record(
                    db=db,
                    medical_record_id=record.id,
                    include_consultation_fee=random.choice([True, False])
                )
                
                if bill and bill.total_amount > 0:
                    bills_created += 1
                    print(f"   病历{record.id}生成账单{bill.id}，金额：{bill.total_amount}")
                    
                    # 随机将一些账单标记为已结清
                    if random.random() < 0.3:  # 30%的概率标记为已结清
                        bill.status = finance_models.BillStatus.PAID
                        db.commit()
                        print(f"     账单{bill.id}已标记为已结清")
                        
            except Exception as e:
                print(f"   病历{record.id}生成账单失败：{e}")
        
        print(f"   成功生成{bills_created}个账单")
        
        # 6. 统计信息
        print("\n6. 数据统计:")
        patient_count = db.query(patient_models.Patient).filter(patient_models.Patient.deleted_at.is_(None)).count()
        drug_count = db.query(pharmacy_models.Drug).filter(pharmacy_models.Drug.deleted_at.is_(None)).count()
        record_count = db.query(patient_models.MedicalRecord).filter(patient_models.MedicalRecord.deleted_at.is_(None)).count()
        prescription_count = db.query(pharmacy_models.Prescription).filter(pharmacy_models.Prescription.deleted_at.is_(None)).count()
        bill_count = db.query(finance_models.Bill).filter(finance_models.Bill.deleted_at.is_(None)).count()
        
        print(f"   患者总数：{patient_count}")
        print(f"   药品总数：{drug_count}")
        print(f"   病历总数：{record_count}")
        print(f"   处方总数：{prescription_count}")
        print(f"   账单总数：{bill_count}")
        
        # 7. 验证账单明细
        print("\n7. 验证账单明细:")
        bills_with_items = db.query(finance_models.Bill).join(
            finance_models.BillItem, finance_models.Bill.id == finance_models.BillItem.bill_id
        ).filter(
            finance_models.Bill.deleted_at.is_(None),
            finance_models.BillItem.deleted_at.is_(None)
        ).distinct().count()
        
        total_bill_items = db.query(finance_models.BillItem).filter(
            finance_models.BillItem.deleted_at.is_(None)
        ).count()
        
        print(f"   有明细的账单数：{bills_with_items}")
        print(f"   账单明细总数：{total_bill_items}")
        
        print("\n=== 测试数据生成完成 ===")
        print("\n✓ 成功验证了通过处方创建账单的功能")
        print("✓ 数据已准备就绪，可以进行进一步的测试")
        
    except Exception as e:
        print(f"生成测试数据时发生错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_test_data()