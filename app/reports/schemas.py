from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import List

class ReportRequest(BaseModel):
    """生成报告的通用请求体，包含日期范围。"""
    start_date: date
    end_date: date

class FinancialSummaryItem(BaseModel):
    """财务摘要中的单个收入分类项。"""
    item_type: str
    total_amount: Decimal
    count: int

class FinancialSummary(BaseModel):
    """财务摘要报告的JSON响应模型。"""
    start_date: date
    end_date: date
    total_revenue: Decimal
    total_payments: Decimal
    unpaid_amount: Decimal
    bill_count: int
    revenue_by_type: List[FinancialSummaryItem] 