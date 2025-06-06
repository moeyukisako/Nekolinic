from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

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