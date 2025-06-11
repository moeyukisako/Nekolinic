from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time, UTC
from decimal import Decimal
from io import BytesIO
import json
import os
from pathlib import Path

from . import schemas, pdf_generator
from app.finance import models as finance_models
from app.finance.models import BillStatus

class ReportService:
    def generate_financial_summary(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.FinancialSummary:
        """生成财务摘要报告所需的数据对象。"""
        # 转换日期范围为datetime以便在数据库查询中使用
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 计算总收入（排除作废的账单）
        total_revenue = db.query(func.sum(finance_models.Bill.total_amount)).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime), 
            finance_models.Bill.status != BillStatus.VOID
        ).scalar() or Decimal('0.00')
        
        # 计算总收款
        total_payments = db.query(func.sum(finance_models.Payment.amount)).filter(
            finance_models.Payment.payment_date.between(start_datetime, end_datetime)
        ).scalar() or Decimal('0.00')
        
        # 统计账单数量（排除作废的账单）
        bill_count = db.query(func.count(finance_models.Bill.id)).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime), 
            finance_models.Bill.status != BillStatus.VOID
        ).scalar() or 0
        
        # 按项目类型统计收入
        revenue_by_type_query = db.query(
            finance_models.BillItem.item_type, 
            func.sum(finance_models.BillItem.subtotal).label('total_amount'), 
            func.count(finance_models.BillItem.id).label('count')
        ).join(finance_models.Bill).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime), 
            finance_models.Bill.status != BillStatus.VOID
        ).group_by(finance_models.BillItem.item_type)
        
        revenue_by_type_results = revenue_by_type_query.all()
        
        # 构建响应对象
        return schemas.FinancialSummary(
            start_date=start_date,
            end_date=end_date,
            total_revenue=total_revenue,
            total_payments=total_payments,
            unpaid_amount=total_revenue - total_payments,
            bill_count=bill_count,
            revenue_by_type=[
                schemas.FinancialSummaryItem(
                    item_type=row.item_type, 
                    total_amount=row.total_amount, 
                    count=row.count
                ) for row in revenue_by_type_results
            ]
        )

    def generate_financial_summary_pdf(
        self, db: Session, *, start_date: date, end_date: date
    ) -> BytesIO:
        """生成财务摘要报告的PDF文件流。"""
        # 1. 调用内部方法生成结构化数据
        summary_data = self.generate_financial_summary(db=db, start_date=start_date, end_date=end_date)
        
        # 2. 将数据传递给PDF渲染工具
        return pdf_generator.create_financial_report_pdf(summary_data)

    def get_patient_statistics(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.PatientStatistics:
        """获取患者统计数据"""
        from datetime import datetime, time
        from app.patient import models as patient_models
        from app.clinic import models as clinic_models
        
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 总患者数
        total_patients = db.query(func.count(patient_models.Patient.id)).filter(
            patient_models.Patient.created_at <= end_datetime
        ).scalar() or 0
        
        # 新患者数（在指定时间范围内创建的）
        new_patients = db.query(func.count(patient_models.Patient.id)).filter(
            patient_models.Patient.created_at.between(start_datetime, end_datetime)
        ).scalar() or 0
        
        # 回访患者数（在指定时间范围内有病历记录的）
        returning_patients = db.query(func.count(func.distinct(patient_models.MedicalRecord.patient_id))).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime)
        ).scalar() or 0
        
        # 年龄分布
        age_groups = [
            ("0-18", 0, 18),
            ("19-35", 19, 35),
            ("36-50", 36, 50),
            ("51-65", 51, 65),
            ("65+", 66, 150)
        ]
        
        age_distribution = []
        for group_name, min_age, max_age in age_groups:
            count = db.query(func.count(patient_models.Patient.id)).filter(
                func.extract('year', func.current_date()) - func.extract('year', patient_models.Patient.birth_date) >= min_age,
                func.extract('year', func.current_date()) - func.extract('year', patient_models.Patient.birth_date) <= max_age
            ).scalar() or 0
            percentage = (count / total_patients * 100) if total_patients > 0 else 0
            age_distribution.append(schemas.StatisticsItem(
                name=group_name, count=count, percentage=round(percentage, 2)
            ))
        
        # 性别分布
        gender_stats = db.query(
            patient_models.Patient.gender,
            func.count(patient_models.Patient.id).label('count')
        ).group_by(patient_models.Patient.gender).all()
        
        gender_distribution = []
        for gender, count in gender_stats:
            percentage = (count / total_patients * 100) if total_patients > 0 else 0
            gender_distribution.append(schemas.StatisticsItem(
                name=gender or "未知", count=count, percentage=round(percentage, 2)
            ))
        
        # 就诊频次（简化版本）
        visit_frequency = [
            schemas.StatisticsItem(name="首次就诊", count=new_patients, percentage=0),
            schemas.StatisticsItem(name="复诊", count=returning_patients, percentage=0)
        ]
        
        return schemas.PatientStatistics(
            start_date=start_date,
            end_date=end_date,
            total_patients=total_patients,
            new_patients=new_patients,
            returning_patients=returning_patients,
            age_distribution=age_distribution,
            gender_distribution=gender_distribution,
            visit_frequency=visit_frequency
        )
    
    def get_medical_record_statistics(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.MedicalRecordStatistics:
        """获取病历统计数据"""
        from datetime import datetime, time
        from app.clinic import models as clinic_models
        from app.user import models as user_models
        
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 总病历数
        total_records = db.query(func.count(patient_models.MedicalRecord.id)).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime)
        ).scalar() or 0
        
        # 诊断类型分布
        diagnosis_stats = db.query(
            patient_models.MedicalRecord.diagnosis,
            func.count(patient_models.MedicalRecord.id).label('count')
        ).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime),
            patient_models.MedicalRecord.diagnosis.isnot(None)
        ).group_by(patient_models.MedicalRecord.diagnosis).order_by(
            func.count(patient_models.MedicalRecord.id).desc()
        ).limit(10).all()
        
        diagnosis_distribution = [
            schemas.StatisticsItem(
                name=diagnosis or "未知", 
                count=count, 
                percentage=round((count / total_records * 100) if total_records > 0 else 0, 2)
            ) for diagnosis, count in diagnosis_stats
        ]
        
        # 治疗方案分布
        treatment_stats = db.query(
            patient_models.MedicalRecord.treatment_plan,
            func.count(patient_models.MedicalRecord.id).label('count')
        ).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime),
            patient_models.MedicalRecord.treatment_plan.isnot(None)
        ).group_by(patient_models.MedicalRecord.treatment_plan).order_by(
            func.count(patient_models.MedicalRecord.id).desc()
        ).limit(10).all()
        
        treatment_distribution = [
            schemas.StatisticsItem(
                name=treatment[:50] + "..." if len(treatment) > 50 else treatment, 
                count=count, 
                percentage=round((count / total_records * 100) if total_records > 0 else 0, 2)
            ) for treatment, count in treatment_stats
        ]
        
        # 医生工作量
        doctor_stats = db.query(
            user_models.User.username,
            func.count(patient_models.MedicalRecord.id).label('count')
        ).join(
            patient_models.MedicalRecord, user_models.User.id == patient_models.MedicalRecord.doctor_id
        ).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime)
        ).group_by(user_models.User.username).order_by(
            func.count(patient_models.MedicalRecord.id).desc()
        ).all()
        
        doctor_workload = [
            schemas.StatisticsItem(
                name=username, 
                count=count, 
                percentage=round((count / total_records * 100) if total_records > 0 else 0, 2)
            ) for username, count in doctor_stats
        ]
        
        # 月度病历统计
        monthly_stats = db.query(
            func.extract('year', patient_models.MedicalRecord.record_date).label('year'),
            func.extract('month', patient_models.MedicalRecord.record_date).label('month'),
            func.count(patient_models.MedicalRecord.id).label('count')
        ).filter(
            patient_models.MedicalRecord.record_date.between(start_datetime, end_datetime)
        ).group_by(
            func.extract('year', patient_models.MedicalRecord.record_date),
            func.extract('month', patient_models.MedicalRecord.record_date)
        ).order_by(
            func.extract('year', patient_models.MedicalRecord.record_date),
            func.extract('month', patient_models.MedicalRecord.record_date)
        ).all()
        
        monthly_records = [
            {"month": f"{int(year)}-{int(month):02d}", "count": count}
            for year, month, count in monthly_stats
        ]
        
        return schemas.MedicalRecordStatistics(
            start_date=start_date,
            end_date=end_date,
            total_records=total_records,
            diagnosis_distribution=diagnosis_distribution,
            treatment_distribution=treatment_distribution,
            doctor_workload=doctor_workload,
            monthly_records=monthly_records
        )
    
    def get_medicine_statistics(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.MedicineStatistics:
        """获取药品统计数据"""
        from datetime import datetime, time
        from app.pharmacy import models as pharmacy_models
        
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 总药品数
        total_medicines = db.query(func.count(pharmacy_models.Medicine.id)).scalar() or 0
        
        # 低库存药品数（库存小于最小库存量）
        low_stock_count = db.query(func.count(pharmacy_models.Medicine.id)).filter(
            pharmacy_models.Medicine.stock_quantity < pharmacy_models.Medicine.min_stock_level
        ).scalar() or 0
        
        # 过期药品数
        expired_count = db.query(func.count(pharmacy_models.Medicine.id)).filter(
            pharmacy_models.Medicine.expiry_date < func.current_date()
        ).scalar() or 0
        
        # 最常用药品（基于处方记录）
        most_used_stats = db.query(
            pharmacy_models.Medicine.name,
            func.count(pharmacy_models.PrescriptionItem.id).label('usage_count')
        ).join(
            pharmacy_models.PrescriptionItem, 
            pharmacy_models.Medicine.id == pharmacy_models.PrescriptionItem.medicine_id
        ).join(
            pharmacy_models.Prescription,
            pharmacy_models.PrescriptionItem.prescription_id == pharmacy_models.Prescription.id
        ).filter(
            pharmacy_models.Prescription.created_at.between(start_datetime, end_datetime)
        ).group_by(pharmacy_models.Medicine.name).order_by(
            func.count(pharmacy_models.PrescriptionItem.id).desc()
        ).limit(10).all()
        
        total_usage = sum(count for _, count in most_used_stats)
        most_used_medicines = [
            schemas.StatisticsItem(
                name=name, 
                count=count, 
                percentage=round((count / total_usage * 100) if total_usage > 0 else 0, 2)
            ) for name, count in most_used_stats
        ]
        
        # 药品分类分布
        category_stats = db.query(
            pharmacy_models.Medicine.category,
            func.count(pharmacy_models.Medicine.id).label('count')
        ).group_by(pharmacy_models.Medicine.category).all()
        
        category_distribution = [
            schemas.StatisticsItem(
                name=category or "未分类", 
                count=count, 
                percentage=round((count / total_medicines * 100) if total_medicines > 0 else 0, 2)
            ) for category, count in category_stats
        ]
        
        # 库存总价值
        stock_value = db.query(
            func.sum(pharmacy_models.Medicine.stock_quantity * pharmacy_models.Medicine.unit_price)
        ).scalar() or Decimal('0')
        
        return schemas.MedicineStatistics(
            start_date=start_date,
            end_date=end_date,
            total_medicines=total_medicines,
            low_stock_count=low_stock_count,
            expired_count=expired_count,
            most_used_medicines=most_used_medicines,
            category_distribution=category_distribution,
            stock_value=stock_value
        )
    
    def get_finance_statistics(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.FinanceStatistics:
        """获取财务统计数据"""
        from datetime import datetime, time
        from app.finance import models as finance_models
        
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 总收入
        total_revenue = db.query(func.sum(finance_models.Bill.total_amount)).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime),
            finance_models.Bill.status != finance_models.BillStatus.VOID
        ).scalar() or Decimal('0')
        
        # 总支出
        total_expenses = db.query(func.sum(finance_models.Expense.amount)).filter(
            finance_models.Expense.expense_date.between(start_datetime, end_datetime),
            finance_models.Expense.deleted_at.is_(None)
        ).scalar() or Decimal('0')
        
        # 净利润
        net_profit = total_revenue - total_expenses
        
        # 账单数量
        bill_count = db.query(func.count(finance_models.Bill.id)).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime),
            finance_models.Bill.status != finance_models.BillStatus.VOID
        ).scalar() or 0
        
        # 支付方式分布
        payment_stats = db.query(
            finance_models.Payment.payment_method,
            func.count(finance_models.Payment.id).label('count')
        ).filter(
            finance_models.Payment.payment_date.between(start_datetime, end_datetime)
        ).group_by(finance_models.Payment.payment_method).all()
        
        total_payments = sum(count for _, count in payment_stats)
        payment_methods = [
            schemas.StatisticsItem(
                name=method or "未知", 
                count=count, 
                percentage=round((count / total_payments * 100) if total_payments > 0 else 0, 2)
            ) for method, count in payment_stats
        ]
        
        # 月度收支统计
        monthly_revenue_stats = db.query(
            func.extract('year', finance_models.Bill.bill_date).label('year'),
            func.extract('month', finance_models.Bill.bill_date).label('month'),
            func.sum(finance_models.Bill.total_amount).label('revenue')
        ).filter(
            finance_models.Bill.bill_date.between(start_datetime, end_datetime),
            finance_models.Bill.status != finance_models.BillStatus.VOID
        ).group_by(
            func.extract('year', finance_models.Bill.bill_date),
            func.extract('month', finance_models.Bill.bill_date)
        ).all()
        
        monthly_expense_stats = db.query(
            func.extract('year', finance_models.Expense.expense_date).label('year'),
            func.extract('month', finance_models.Expense.expense_date).label('month'),
            func.sum(finance_models.Expense.amount).label('expenses')
        ).filter(
            finance_models.Expense.expense_date.between(start_datetime, end_datetime),
            finance_models.Expense.deleted_at.is_(None)
        ).group_by(
            func.extract('year', finance_models.Expense.expense_date),
            func.extract('month', finance_models.Expense.expense_date)
        ).all()
        
        # 合并月度数据
        monthly_data = {}
        for year, month, revenue in monthly_revenue_stats:
            key = f"{int(year)}-{int(month):02d}"
            monthly_data[key] = {"month": key, "revenue": revenue, "expenses": Decimal('0')}
        
        for year, month, expenses in monthly_expense_stats:
            key = f"{int(year)}-{int(month):02d}"
            if key in monthly_data:
                monthly_data[key]["expenses"] = expenses
            else:
                monthly_data[key] = {"month": key, "revenue": Decimal('0'), "expenses": expenses}
        
        monthly_revenue = list(monthly_data.values())
        monthly_revenue.sort(key=lambda x: x["month"])
        
        return schemas.FinanceStatistics(
            start_date=start_date,
            end_date=end_date,
            total_revenue=total_revenue,
            total_expenses=total_expenses,
            net_profit=net_profit,
            bill_count=bill_count,
            payment_methods=payment_methods,
            monthly_revenue=monthly_revenue
        )
    
    def save_report_to_file(self, report_data, report_type: str, start_date: date, end_date: date) -> str:
        """保存报表数据到JSON文件"""
        # 创建reports目录（如果不存在）
        reports_dir = Path("reports")
        reports_dir.mkdir(exist_ok=True)
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_type}_{start_date}_{end_date}_{timestamp}.json"
        file_path = reports_dir / filename
        
        # 准备保存的数据
        save_data = {
            "report_type": report_type,
            "generated_at": datetime.now().isoformat(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "data": report_data.dict() if hasattr(report_data, 'dict') else report_data
        }
        
        # 保存到文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2, default=str)
        
        return str(file_path)

# 实例化服务
report_service = ReportService()