### **开发指南：报告与分析模块 (含PDF导出功能)**

#### **核心目标**

此阶段旨在为Nekolinic系统增加一个强大的报告与分析模块。其核心功能不仅包括在应用内部以JSON格式展示分析数据，还包括将这些报告导出为可移植的PDF文档，从而为诊所管理者提供数据驱动的决策支持和便捷的线下存档能力。

------

### **Part 1: 架构与文件结构**

我们将严格遵循您项目中已定义的模块化和分层架构。

1. 创建标准模块结构

   : 在 

   ```
   app/
   ```

    目录下创建新文件夹 

   ```
   reports/
   ```

   。为了与项目中其他模块（如 

   ```
   user
   ```

   , 

   ```
   finance
   ```

   ）保持结构一致性，我们将创建全部四个核心文件：

   - `api.py`: 定义报告相关的API端点。
   - `service.py`: 封装所有报告生成的核心业务逻辑（数据聚合与文件渲染）。
   - `schemas.py`: 定义API请求和响应的数据格式。
   - `models.py`: **此文件在初期将保持为空**。报告模块主要读取现有数据，不创建新表。但创建此文件是为了维护项目统一的结构规范。

------

### **Part 2: 模块实现 `app/reports/`**

#### **步骤 1: 安装依赖库**

我们需要一个第三方库来创建PDF。`reportlab` 是一个功能强大且成熟的选择。

首先，请将其添加到您的项目中：

Bash

```
pip install reportlab
```

然后，将 `reportlab==<version>` 添加到您的 `requirements.txt` 文件中，以锁定版本。

#### **步骤 2: 创建模块文件**

在 `app/reports/` 目录下，创建以下五个文件：

- `__init__.py` (空文件)
- `models.py` (空文件)
- `api.py`
- `schemas.py`
- `pdf_generator.py` (新增的PDF渲染工具)

#### **步骤 3: 定义数据契约 (`schemas.py`)**

此文件定义了报告的请求与响应结构。

Python

```
# app/reports/schemas.py

from pydantic import BaseModel, ConfigDict
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
```

#### **步骤 4: 创建PDF生成工具 (`pdf_generator.py`)**

这个独立的工具文件负责将结构化的报告数据渲染成PDF。

Python

```
# app/reports/pdf_generator.py

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from . import schemas

# 建议：如果需要支持中文，请在此处注册中文字体
# 假设项目根目录下有 'SimSun.ttf' 字体文件
# pdfmetrics.registerFont(TTFont('SimSun', 'SimSun.ttf'))

def create_financial_report_pdf(summary_data: schemas.FinancialSummary) -> BytesIO:
    """根据财务摘要数据对象，生成PDF文件流。"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # p.setFont('SimSun', 12) # 如果使用了中文字体，在此设置

    p.drawString(100, height - 100, f"财务摘要报告 ({summary_data.start_date} to {summary_data.end_date})")
    p.line(100, height - 105, width - 100, height - 105)

    y = height - 140
    p.drawString(100, y, f"总收入: {summary_data.total_revenue:.2f}")
    p.drawString(100, y - 20, f"总收款: {summary_data.total_payments:.2f}")
    p.drawString(100, y - 40, f"未付金额: {summary_data.unpaid_amount:.2f}")
    p.drawString(100, y - 60, f"总账单数: {summary_data.bill_count}")

    y -= 100
    p.drawString(100, y, "收入分类统计:")
    p.line(100, y - 5, width - 100, y - 5)
    
    y -= 20
    for item in summary_data.revenue_by_type:
        p.drawString(120, y, f"- 类型: {item.item_type}, 金额: {item.total_amount:.2f}, 数量: {item.count}")
        y -= 20

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer
```

#### **步骤 5: 实现业务逻辑 (`service.py`)**

`ReportService` 现在将包含两个核心方法：一个用于生成JSON数据，另一个用于生成PDF文件流。

Python

```
# app/reports/service.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time
from decimal import Decimal
from io import BytesIO

from . import schemas, pdf_generator
from app.finance import models as finance_models

class ReportService:
    def generate_financial_summary(
        self, db: Session, *, start_date: date, end_date: date
    ) -> schemas.FinancialSummary:
        """生成财务摘要报告所需的数据对象。"""
        # (此部分代码与上一版建议相同，负责从数据库聚合数据)
        # ... 省略详细的数据查询和聚合代码 ...
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        total_revenue = db.query(func.sum(finance_models.Bill.total_amount)).filter(finance_models.Bill.bill_date.between(start_datetime, end_datetime), finance_models.Bill.status != finance_models.BillStatus.VOID).scalar() or Decimal('0.00')
        total_payments = db.query(func.sum(finance_models.Payment.amount)).filter(finance_models.Payment.payment_date.between(start_datetime, end_datetime)).scalar() or Decimal('0.00')
        bill_count = db.query(func.count(finance_models.Bill.id)).filter(finance_models.Bill.bill_date.between(start_datetime, end_datetime), finance_models.Bill.status != finance_models.BillStatus.VOID).scalar() or 0
        revenue_by_type_query = db.query(finance_models.BillItem.item_type, func.sum(finance_models.BillItem.subtotal).label('total_amount'), func.count(finance_models.BillItem.id).label('count')).join(finance_models.Bill).filter(finance_models.Bill.bill_date.between(start_datetime, end_datetime), finance_models.Bill.status != finance_models.BillStatus.VOID).group_by(finance_models.BillItem.item_type)
        revenue_by_type_results = revenue_by_type_query.all()
        
        return schemas.FinancialSummary(
            start_date=start_date,
            end_date=end_date,
            total_revenue=total_revenue,
            total_payments=total_payments,
            unpaid_amount=total_revenue - total_payments,
            bill_count=bill_count,
            revenue_by_type=[schemas.FinancialSummaryItem(item_type=row.item_type, total_amount=row.total_amount, count=row.count) for row in revenue_by_type_results]
        )

    def generate_financial_summary_pdf(
        self, db: Session, *, start_date: date, end_date: date
    ) -> BytesIO:
        """生成财务摘要报告的PDF文件流。"""
        # 1. 调用内部方法生成结构化数据
        summary_data = self.generate_financial_summary(db=db, start_date=start_date, end_date=end_date)
        
        # 2. 将数据传递给PDF渲染工具
        return pdf_generator.create_financial_report_pdf(summary_data)

report_service = ReportService()
```

#### **步骤 6: 创建 API 端点 (`api.py`)**

现在，API层将提供两个端点：一个用于获取JSON数据，另一个用于下载PDF文件。

Python

```
# app/reports/api.py

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
```

通过这套完整的实现，您不仅保持了项目架构的整洁和一致性，还成功地集成了一个实用且技术完善的PDF导出功能。