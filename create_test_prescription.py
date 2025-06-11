#!/usr/bin/env python3
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.pharmacy import models as pharmacy_models
from app.finance import models as finance_models
from app.patient import models as patient_models_extended
from app.patient import models as patient_models
from app.user import models as user_models
from app.core.context import current_user_id
from datetime import datetime, timezone

def create_test_data():
    """创建测试数据：患者、医生、病历、处方和账单"""
    # 设置当前用户ID
    current_user_id.set(1)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 检查是否已有测试数据
        existing_patient = db.query(patient_models.Patient).filter(
            patient_models.Patient.name == "测试患者",
            patient_models.Patient.deleted_at.is_(None)
        ).first()
        
        if existing_patient:
            print("测试数据已存在，跳过创建")
            return
        
        # 创建测试患者
        from datetime import date
        patient = patient_models.Patient(
            name="测试患者",
            gender="男",
            birth_date=date(1993, 1, 1),
            contact_number="13800138000",
            created_by_id=1
        )
        db.add(patient)
        db.flush()  # 获取ID
        
        # 创建测试医生（如果不存在）
        doctor = db.query(user_models.User).filter(
            user_models.User.id == 1
        ).first()
        
        if not doctor:
            doctor = user_models.User(
                username="doctor1",
                email="doctor1@test.com",
                full_name="测试医生",
                role="doctor",
                hashed_password="test"
            )
            db.add(doctor)
            db.flush()
        
        # 创建测试药品（如果不存在）
        drug = db.query(pharmacy_models.Drug).filter(
            pharmacy_models.Drug.name == "测试药品"
        ).first()
        
        if not drug:
            drug = pharmacy_models.Drug(
                name="测试药品",
                specification="10mg",
                unit="片",
                unit_price=15.50,
                created_by_id=1
            )
            db.add(drug)
            db.flush()
        
        # 创建病历
        from datetime import datetime
        medical_record = patient_models_extended.MedicalRecord(
            display_id="MR20241201001",
            record_date=datetime.now(),
            patient_id=patient.id,
            doctor_id=doctor.id,
            chief_complaint="测试主诉",
            present_illness="测试现病史",
            diagnosis="测试诊断",
            treatment_plan="测试治疗方案",
            created_by_id=1
        )
        db.add(medical_record)
        db.flush()
        
        # 创建处方
        prescription = pharmacy_models.Prescription(
            prescription_date=datetime.now(),
            medical_record_id=medical_record.id,
            doctor_id=doctor.id,
            created_by_id=1
        )
        db.add(prescription)
        db.flush()
        
        # 创建处方明细
        prescription_detail = pharmacy_models.PrescriptionDetail(
            prescription_id=prescription.id,
            drug_id=drug.id,
            quantity=10,
            dosage="每日三次，每次一片",
            created_by_id=1
        )
        db.add(prescription_detail)
        db.flush()
        
        # 创建账单
        bill = finance_models.Bill(
            invoice_number="INV20241201001",
            bill_date=datetime.now(),
            medical_record_id=medical_record.id,
            patient_id=patient.id,
            total_amount=205.50,  # 诊疗费50 + 药费155
            status=finance_models.BillStatus.UNPAID,
            created_by_id=1
        )
        db.add(bill)
        db.flush()
        
        # 创建诊疗费账单项
        consultation_item = finance_models.BillItem(
            bill_id=bill.id,
            item_name="诊疗费",
            item_type="诊疗",
            quantity=1,
            unit_price=50.00,
            subtotal=50.00,
            created_by_id=1
        )
        db.add(consultation_item)
        
        # 创建药品账单项
        drug_item = finance_models.BillItem(
            bill_id=bill.id,
            item_name=f"{drug.name}（{drug.specification}）",
            item_type="药物",
            quantity=10,
            unit_price=15.50,
            subtotal=155.00,
            created_by_id=1
        )
        db.add(drug_item)
        
        db.commit()
        
        print("测试数据创建成功！")
        print(f"患者ID: {patient.id}")
        print(f"病历ID: {medical_record.id}")
        print(f"处方ID: {prescription.id}")
        print(f"账单ID: {bill.id}")
        print(f"药品账单项ID: {drug_item.id}")
        
    except Exception as e:
        db.rollback()
        print(f"创建测试数据失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()