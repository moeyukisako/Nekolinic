from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date

from . import schemas, service
from app.core.database import get_db
from app.core import security
from app.user import models as user_models

router = APIRouter()

@router.post(
    "/financial-summary", 
    response_model=schemas.FinancialSummary,
    summary="获取财务摘要报告 (JSON)"
)
def get_financial_summary_report_json(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """根据指定的日期范围，生成并返回JSON格式的财务摘要报告。"""
    return service.report_service.generate_financial_summary(
        db=db, start_date=request.start_date, end_date=request.end_date
    )

@router.post(
    "/financial-summary/download",
    summary="下载财务摘要报告 (PDF)"
)
def download_financial_summary_report_pdf(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """根据指定的日期范围，生成并提供PDF格式的财务摘要报告以供下载。"""
    pdf_buffer = service.report_service.generate_financial_summary_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date
    )
    
    filename = f"financial_report_{request.start_date}_to_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get(
    "/statistics/patients",
    response_model=schemas.PatientStatistics,
    summary="获取患者统计数据"
)
def get_patient_statistics(
    start_date: date = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: date = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取患者统计数据"""
    statistics = service.report_service.get_patient_statistics(
        db=db, start_date=start_date, end_date=end_date
    )
    
    # 保存报表到文件
    try:
        file_path = service.report_service.save_report_to_file(
            statistics, "patient_statistics", start_date, end_date
        )
        print(f"患者统计报表已保存到: {file_path}")
    except Exception as e:
        print(f"保存报表文件失败: {e}")
    
    return statistics

@router.get(
    "/statistics/medical-records",
    response_model=schemas.MedicalRecordStatistics,
    summary="获取病历统计数据"
)
def get_medical_record_statistics(
    start_date: date = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: date = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取病历统计数据"""
    statistics = service.report_service.get_medical_record_statistics(
        db=db, start_date=start_date, end_date=end_date
    )
    
    # 保存报表到文件
    try:
        file_path = service.report_service.save_report_to_file(
            statistics, "medical_record_statistics", start_date, end_date
        )
        print(f"病历统计报表已保存到: {file_path}")
    except Exception as e:
        print(f"保存报表文件失败: {e}")
    
    return statistics

@router.get(
    "/statistics/medicines",
    response_model=schemas.MedicineStatistics,
    summary="获取药品统计数据"
)
def get_medicine_statistics(
    start_date: date = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: date = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取药品统计数据"""
    statistics = service.report_service.get_medicine_statistics(
        db=db, start_date=start_date, end_date=end_date
    )
    
    # 保存报表到文件
    try:
        file_path = service.report_service.save_report_to_file(
            statistics, "medicine_statistics", start_date, end_date
        )
        print(f"药品统计报表已保存到: {file_path}")
    except Exception as e:
        print(f"保存报表文件失败: {e}")
    
    return statistics

@router.get(
    "/statistics/finance",
    response_model=schemas.FinanceStatistics,
    summary="获取财务统计数据"
)
def get_finance_statistics(
    start_date: date = Query(..., description="开始日期 (YYYY-MM-DD)"),
    end_date: date = Query(..., description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取财务统计数据"""
    statistics = service.report_service.get_finance_statistics(
        db=db, start_date=start_date, end_date=end_date
    )
    
    # 保存报表到文件
    try:
        file_path = service.report_service.save_report_to_file(
            statistics, "finance_statistics", start_date, end_date
        )
        print(f"财务统计报表已保存到: {file_path}")
    except Exception as e:
        print(f"保存报表文件失败: {e}")
    
    return statistics