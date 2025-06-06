from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time, UTC
from decimal import Decimal
from io import BytesIO

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

# 实例化服务
report_service = ReportService() 