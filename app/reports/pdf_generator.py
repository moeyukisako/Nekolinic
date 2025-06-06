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