from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..core.database import get_db
from ..core import security
from ..user import models as user_models
from . import schemas, service

router = APIRouter()

@router.post(
    "/statistics/finance/download",
    summary="下载财务统计报表PDF"
)
def download_finance_statistics_pdf(
    request: schemas.ReportRequest,
    language: str = 'zh-CN',
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """下载财务统计报表的PDF文件"""
    pdf_buffer = service.report_service.generate_finance_statistics_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date, language=language
    )
    
    filename = f"finance_statistics_{request.start_date}_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.post(
    "/statistics/medicines/download",
    summary="下载药品统计报表PDF"
)
def download_medicines_statistics_pdf(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """下载药品统计报表的PDF文件"""
    pdf_buffer = service.report_service.generate_medicine_statistics_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date
    )
    
    filename = f"medicines_statistics_{request.start_date}_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.post(
    "/financial-summary/download",
    summary="下载财务摘要报表PDF"
)
def download_financial_summary_pdf(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """下载财务摘要报表的PDF文件"""
    pdf_buffer = service.report_service.generate_financial_summary_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date
    )
    
    filename = f"financial_summary_{request.start_date}_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.post(
    "/statistics/patients/download",
    summary="下载患者统计报表PDF"
)
def download_patients_statistics_pdf(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """下载患者统计报表的PDF文件"""
    pdf_buffer = service.report_service.generate_patients_statistics_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date
    )
    
    filename = f"patients_statistics_{request.start_date}_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.post(
    "/statistics/medical-records/download",
    summary="下载病历统计报表PDF"
)
def download_medical_records_statistics_pdf(
    request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """下载病历统计报表的PDF文件"""
    pdf_buffer = service.report_service.generate_medical_records_statistics_pdf(
        db=db, start_date=request.start_date, end_date=request.end_date
    )
    
    filename = f"medical_records_statistics_{request.start_date}_{request.end_date}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get(
    "/prescription/{prescription_id}/pdf",
    summary="生成单个处方PDF"
)
def generate_prescription_pdf(
    prescription_id: int,
    language: str = 'zh-CN',
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """生成单个处方的PDF文件"""
    pdf_buffer = service.report_service.generate_prescription_pdf(
        db=db, prescription_id=prescription_id, language=language
    )
    
    filename = f"prescription_{prescription_id}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get(
    "/medical-record/{record_id}/pdf",
    summary="生成单个病历PDF"
)
def generate_medical_record_pdf(
    record_id: int,
    language: str = 'zh-CN',
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """生成单个病历的PDF文件"""
    pdf_buffer = service.report_service.generate_medical_record_pdf(
        db=db, record_id=record_id, language=language
    )
    
    filename = f"medical_record_{record_id}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get(
    "/financial-summary",
    response_model=schemas.FinancialSummary,
    summary="获取财务摘要"
)
def get_financial_summary(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定日期范围内的财务摘要"""
    summary = service.report_service.get_financial_summary(
        db=db, start_date=start_date, end_date=end_date
    )
    
    # 保存报表到文件
    try:
        file_path = service.report_service.save_report_to_file(
            summary, "financial_summary", start_date, end_date
        )
        print(f"财务摘要报表已保存到: {file_path}")
    except Exception as e:
        print(f"保存报表文件失败: {e}")
    
    return summary

@router.get(
    "/statistics/medicines",
    response_model=schemas.MedicineStatistics,
    summary="获取药品统计"
)
def get_medicine_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定日期范围内的药品统计"""
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
    "/statistics/patients",
    response_model=schemas.PatientStatistics,
    summary="获取患者统计"
)
def get_patient_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定日期范围内的患者统计"""
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
    summary="获取病历统计"
)
def get_medical_record_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定日期范围内的病历统计"""
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