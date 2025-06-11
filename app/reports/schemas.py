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

class StatisticsItem(BaseModel):
    """统计项目基础模型"""
    name: str
    count: int
    percentage: float = 0.0

class PatientStatistics(BaseModel):
    """患者统计数据"""
    start_date: date
    end_date: date
    total_patients: int
    new_patients: int
    returning_patients: int
    age_distribution: List[StatisticsItem]
    gender_distribution: List[StatisticsItem]
    visit_frequency: List[StatisticsItem]

class MedicalRecordStatistics(BaseModel):
    """病历统计数据"""
    start_date: date
    end_date: date
    total_records: int
    diagnosis_distribution: List[StatisticsItem]
    treatment_distribution: List[StatisticsItem]
    doctor_workload: List[StatisticsItem]
    monthly_records: List[dict]  # [{"month": str, "count": int}]

class MedicineStatistics(BaseModel):
    """药品统计数据"""
    start_date: date
    end_date: date
    total_medicines: int
    low_stock_count: int
    expired_count: int
    most_used_medicines: List[StatisticsItem]
    category_distribution: List[StatisticsItem]
    stock_value: Decimal

class FinanceStatistics(BaseModel):
    """财务统计数据"""
    start_date: date
    end_date: date
    total_revenue: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    bill_count: int
    payment_methods: List[StatisticsItem]
    monthly_revenue: List[dict]  # [{"month": str, "revenue": Decimal, "expenses": Decimal}]