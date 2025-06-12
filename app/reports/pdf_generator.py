from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from . import schemas
import os

# PDF内容翻译字典
PDF_TRANSLATIONS = {
    'zh-CN': {
        'prescription_form': '处方单',
        'patient_info': '患者信息',
        'medical_record_info': '病历信息',
        'prescription_info': '处方信息',
        'patient_name_label': '姓名',
        'patient_gender_label': '性别',
        'patient_age_label': '年龄',
        'patient_phone_label': '电话',
        'record_id_label': '病历ID',
        'visit_date_label': '就诊日期',
        'chief_complaint_label': '主诉',
        'present_illness_label': '现病史',
        'past_history_label': '既往史',
        'physical_examination_label': '体格检查',
        'diagnosis_label': '诊断',
        'treatment_plan_label': '治疗方案',
        'related_prescriptions_label': '相关处方',
        'prescription_label': '处方',
        'unknown_drug_label': '未知药品',
        'prescription_id_label': '处方ID',
        'prescription_date_label': '开具日期',
        'medicine_label': '药品',
        'quantity_label': '数量',
        'dosage_label': '剂量',
        'frequency_label': '频率',
        'dispensing_status_label': '配药状态',
        'no_prescription_details': '无处方详情',
        'na': 'N/A',
        # 财务统计相关翻译
        'finance_statistics_report': '财务统计报告',
        'finance_overview': '财务概览',
        'total_revenue': '总收入',
        'total_expenses': '总支出',
        'net_profit': '净利润',
        'total_bills': '总账单数',
        'payment_method_distribution': '支付方式分布',
        'monthly_revenue_trend': '月度收入趋势',
        'revenue': '收入',
        'expenses': '支出'
    },
    'en': {
        'prescription_form': 'Prescription Form',
        'patient_info': 'Patient Information',
        'medical_record_info': 'Medical Record Information',
        'prescription_info': 'Prescription Information',
        'patient_name_label': 'Name',
        'patient_gender_label': 'Gender',
        'patient_age_label': 'Age',
        'patient_phone_label': 'Phone',
        'record_id_label': 'Record ID',
        'visit_date_label': 'Visit Date',
        'chief_complaint_label': 'Chief Complaint',
        'present_illness_label': 'Present Illness',
        'past_history_label': 'Past History',
        'physical_examination_label': 'Physical Examination',
        'diagnosis_label': 'Diagnosis',
        'treatment_plan_label': 'Treatment Plan',
        'related_prescriptions_label': 'Related Prescriptions',
        'prescription_label': 'Prescription',
        'unknown_drug_label': 'Unknown Drug',
        'prescription_id_label': 'Prescription ID',
        'prescription_date_label': 'Prescription Date',
        'medicine_label': 'Medicine',
        'quantity_label': 'Quantity',
        'dosage_label': 'Dosage',
        'frequency_label': 'Frequency',
        'dispensing_status_label': 'Dispensing Status',
        'no_prescription_details': 'No prescription details',
        'na': 'N/A',
        # 财务统计相关翻译
        'finance_statistics_report': 'Finance Statistics Report',
        'finance_overview': 'Finance Overview',
        'total_revenue': 'Total Revenue',
        'total_expenses': 'Total Expenses',
        'net_profit': 'Net Profit',
        'total_bills': 'Total Bills',
        'payment_method_distribution': 'Payment Method Distribution',
        'monthly_revenue_trend': 'Monthly Revenue Trend',
        'revenue': 'Revenue',
        'expenses': 'Expenses'
    },
    'ja': {
        'prescription_form': '処方箋',
        'patient_info': '患者情報',
        'medical_record_info': '医療記録情報',
        'prescription_info': '処方情報',
        'patient_name_label': '氏名',
        'patient_gender_label': '性別',
        'patient_age_label': '年齢',
        'patient_phone_label': '電話',
        'record_id_label': '記録ID',
        'visit_date_label': '受診日',
        'chief_complaint_label': '主訴',
        'present_illness_label': '現病歴',
        'past_history_label': '既往歴',
        'physical_examination_label': '身体診察',
        'diagnosis_label': '診断',
        'treatment_plan_label': '治療計画',
        'related_prescriptions_label': '関連処方',
        'prescription_label': '処方',
        'unknown_drug_label': '不明な薬品',
        'prescription_id_label': '処方ID',
        'prescription_date_label': '処方日',
        'medicine_label': '薬品',
        'quantity_label': '数量',
        'dosage_label': '用量',
        'frequency_label': '頻度',
        'dispensing_status_label': '調剤状況',
        'no_prescription_details': '処方詳細なし',
        'na': 'N/A',
        # 财务统计相关翻译
        'finance_statistics_report': '財務統計レポート',
        'finance_overview': '財務概要',
        'total_revenue': '総収入',
        'total_expenses': '総支出',
        'net_profit': '純利益',
        'total_bills': '総請求書数',
        'payment_method_distribution': '支払方法分布',
        'monthly_revenue_trend': '月次収入トレンド',
        'revenue': '収入',
        'expenses': '支出'
    }
}

def get_pdf_translation(key: str, language: str = 'zh-CN') -> str:
    """获取PDF内容的翻译文本"""
    # 语言代码映射：将完整的语言代码映射到简化版本
    language_mapping = {
        'ja-JP': 'ja',
        'en-US': 'en',
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-CN'  # 繁体中文也使用简体中文翻译
    }
    
    # 获取映射后的语言代码
    mapped_language = language_mapping.get(language, language)
    
    # 如果映射后的语言不存在，尝试使用语言的前缀部分（如 'ja-JP' -> 'ja'）
    if mapped_language not in PDF_TRANSLATIONS and '-' in language:
        mapped_language = language.split('-')[0]
    
    # 如果还是不存在，使用默认的中文
    if mapped_language not in PDF_TRANSLATIONS:
        mapped_language = 'zh-CN'
    
    return PDF_TRANSLATIONS.get(mapped_language, PDF_TRANSLATIONS['zh-CN']).get(key, key)

# 注册中文字体支持
try:
    # 尝试使用系统字体
    if os.name == 'nt':  # Windows
        font_path = 'C:/Windows/Fonts/simsun.ttc'  # 宋体
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('SimSun', font_path))
        else:
            # 备用字体路径
            font_path = 'C:/Windows/Fonts/msyh.ttc'  # 微软雅黑
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont('SimSun', font_path))
except Exception:
    # 如果字体注册失败，使用默认字体
    pass

def _draw_header(p, width, height, title, date_range):
    """绘制PDF头部"""
    # 尝试使用中文字体，如果失败则使用默认字体
    try:
        p.setFont("SimSun", 16)
        font_name = "SimSun"
    except:
        p.setFont("Helvetica-Bold", 16)
        font_name = "Helvetica"
    
    p.drawString(100, height - 100, title)
    
    # 设置日期范围的字体
    try:
        p.setFont(font_name, 12)
    except:
        p.setFont("Helvetica", 12)
    
    p.drawString(100, height - 120, f"Date Range: {date_range}")
    p.line(100, height - 130, width - 100, height - 130)
    return height - 160

def _draw_statistics_table(p, y, title, items, width):
    """绘制统计表格"""
    # 尝试使用中文字体，如果失败则使用默认字体
    try:
        p.setFont("SimSun", 12)
        font_name = "SimSun"
    except:
        p.setFont("Helvetica-Bold", 12)
        font_name = "Helvetica"
    
    p.drawString(100, y, title)
    p.line(100, y - 5, width - 100, y - 5)
    
    y -= 25
    
    # 设置内容字体
    try:
        p.setFont(font_name, 10)
    except:
        p.setFont("Helvetica", 10)
    
    for item in items:
        if hasattr(item, 'percentage'):
            text = f"- {item.name}: {item.count} ({item.percentage:.1f}%)"
        else:
            text = f"- {item.name}: {item.count}"
        p.drawString(120, y, text)
        y -= 15
        if y < 100:  # 如果接近页面底部，换页
            p.showPage()
            y = 750
    
    return y - 20

def create_financial_report_pdf(summary_data: schemas.FinancialSummary) -> BytesIO:
    """根据财务摘要数据对象，生成PDF文件流。"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    date_range = f"{summary_data.start_date} to {summary_data.end_date}"
    y = _draw_header(p, width, height, "Financial Summary Report", date_range)
    
    # 绘制财务摘要
    try:
        p.setFont(font_name, 14)
    except:
        p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Financial Overview")
    y -= 30
    
    try:
        p.setFont(font_name, 12)
    except:
        p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Total Revenue: ${summary_data.total_revenue}")
    y -= 20
    p.drawString(100, y, f"Total Payments: ${summary_data.total_payments}")
    y -= 20
    p.drawString(100, y, f"Unpaid Amount: ${summary_data.unpaid_amount}")
    y -= 20
    p.drawString(100, y, f"Total Bills: {summary_data.bill_count}")
    y -= 40
    
    # 绘制收入分类
    if summary_data.revenue_by_type:
        y = _draw_statistics_table(p, y, "Revenue by Type", summary_data.revenue_by_type, width)
    
    p.save()
    buffer.seek(0)
    return buffer

def create_patient_statistics_pdf(data: schemas.PatientStatistics) -> BytesIO:
    """生成患者统计PDF报告"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    date_range = f"{data.start_date} to {data.end_date}"
    y = _draw_header(p, width, height, "Patient Statistics Report", date_range)
    
    # 绘制患者统计概览
    try:
        p.setFont(font_name, 14)
    except:
        p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Patient Overview")
    y -= 30
    
    try:
        p.setFont(font_name, 12)
    except:
        p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Total Patients: {data.total_patients}")
    y -= 20
    p.drawString(100, y, f"New Patients: {data.new_patients}")
    y -= 20
    p.drawString(100, y, f"Returning Patients: {data.returning_patients}")
    y -= 40
    
    # 绘制年龄分布
    if data.age_distribution:
        y = _draw_statistics_table(p, y, "Age Distribution", data.age_distribution, width)
    
    # 绘制性别分布
    if data.gender_distribution:
        y = _draw_statistics_table(p, y, "Gender Distribution", data.gender_distribution, width)
    
    # 绘制就诊频率
    if data.visit_frequency:
        y = _draw_statistics_table(p, y, "Visit Frequency", data.visit_frequency, width)
    
    p.save()
    buffer.seek(0)
    return buffer

def create_medical_record_statistics_pdf(data: schemas.MedicalRecordStatistics) -> BytesIO:
    """生成病历统计PDF报告"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    date_range = f"{data.start_date} to {data.end_date}"
    y = _draw_header(p, width, height, "Medical Record Statistics Report", date_range)
    
    # 绘制病历统计概览
    try:
        p.setFont(font_name, 14)
    except:
        p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Medical Record Overview")
    y -= 30
    
    try:
        p.setFont(font_name, 12)
    except:
        p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Total Records: {data.total_records}")
    y -= 40
    
    # 绘制诊断分布
    if data.diagnosis_distribution:
        y = _draw_statistics_table(p, y, "Diagnosis Distribution", data.diagnosis_distribution, width)
    
    # 绘制治疗分布
    if data.treatment_distribution:
        y = _draw_statistics_table(p, y, "Treatment Distribution", data.treatment_distribution, width)
    
    p.save()
    buffer.seek(0)
    return buffer

def create_medicine_statistics_pdf(data: schemas.MedicineStatistics) -> BytesIO:
    """生成药品统计PDF报告"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    date_range = f"{data.start_date} to {data.end_date}"
    y = _draw_header(p, width, height, "Medicine Statistics Report", date_range)
    
    # 绘制药品统计概览
    try:
        p.setFont(font_name, 14)
    except:
        p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Medicine Overview")
    y -= 30
    
    try:
        p.setFont(font_name, 12)
    except:
        p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Total Medicines: {data.total_medicines}")
    y -= 40
    
    # 绘制药品使用分布
    if data.most_used_medicines:
        y = _draw_statistics_table(p, y, "Most Used Medicines", data.most_used_medicines, width)
    
    p.save()
    buffer.seek(0)
    return buffer

def create_finance_statistics_pdf(data: schemas.FinanceStatistics, language: str = 'zh-CN') -> BytesIO:
    """生成财务统计PDF报告"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    date_range = f"{data.start_date} to {data.end_date}"
    y = _draw_header(p, width, height, get_pdf_translation('finance_statistics_report', language), date_range)
    
    # 绘制财务统计概览
    p.setFont(font_name, 14)
    p.drawString(100, y, get_pdf_translation('finance_overview', language))
    y -= 30
    
    p.setFont(font_name, 12)
    p.drawString(100, y, f"{get_pdf_translation('total_revenue', language)}: ${data.total_revenue}")
    y -= 20
    p.drawString(100, y, f"{get_pdf_translation('total_expenses', language)}: ${data.total_expenses}")
    y -= 20
    p.drawString(100, y, f"{get_pdf_translation('net_profit', language)}: ${data.net_profit}")
    y -= 20
    p.drawString(100, y, f"{get_pdf_translation('total_bills', language)}: {data.bill_count}")
    y -= 40
    
    # 绘制支付方式分布
    if data.payment_methods:
        y = _draw_statistics_table(p, y, get_pdf_translation('payment_method_distribution', language), data.payment_methods, width)
    
    # 绘制月度收入趋势
    if data.monthly_revenue:
        p.setFont(font_name, 12)
        p.drawString(100, y, get_pdf_translation('monthly_revenue_trend', language))
        y -= 20
        p.setFont(font_name, 10)
        for month_data in data.monthly_revenue[:6]:  # Show last 6 months
            p.drawString(100, y, f"{month_data['month']}: {get_pdf_translation('revenue', language)} ${month_data['revenue']}, {get_pdf_translation('expenses', language)} ${month_data['expenses']}")
            y -= 15
        y -= 20
    
    p.save()
    buffer.seek(0)
    return buffer

def generate_prescription_pdf(prescription, medical_record, patient, language: str = 'zh-CN') -> BytesIO:
    """生成单个处方的PDF文件"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置中文字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica"
        p.setFont("Helvetica-Bold", 16)
    
    # 绘制头部
    p.drawString(100, height - 100, get_pdf_translation('prescription_form', language))
    p.line(100, height - 110, width - 100, height - 110)
    
    y = height - 140
    
    # 患者信息
    if patient:
        p.setFont(font_name, 12)
        p.drawString(100, y, f"{get_pdf_translation('patient_info', language)}:")
        y -= 20
        p.setFont(font_name, 10)
        p.drawString(120, y, f"{get_pdf_translation('patient_name_label', language)}: {patient.name}")
        y -= 15
        p.drawString(120, y, f"{get_pdf_translation('patient_gender_label', language)}: {patient.gender or get_pdf_translation('na', language)}")
        y -= 15
        # 计算年龄
        if patient.birth_date:
            from datetime import date
            today = date.today()
            age = today.year - patient.birth_date.year - ((today.month, today.day) < (patient.birth_date.month, patient.birth_date.day))
            p.drawString(120, y, f"{get_pdf_translation('patient_age_label', language)}: {age}")
        else:
            p.drawString(120, y, f"{get_pdf_translation('patient_age_label', language)}: {get_pdf_translation('na', language)}")
        y -= 15
        p.drawString(120, y, f"{get_pdf_translation('patient_phone_label', language)}: {patient.contact_number or get_pdf_translation('na', language)}")
        y -= 30
    
    # 病历信息
    if medical_record:
        p.setFont(font_name, 12)
        p.drawString(100, y, f"{get_pdf_translation('medical_record_info', language)}:")
        y -= 20
        p.setFont(font_name, 10)
        p.drawString(120, y, f"{get_pdf_translation('chief_complaint_label', language)}: {medical_record.chief_complaint or get_pdf_translation('na', language)}")
        y -= 15
        p.drawString(120, y, f"{get_pdf_translation('diagnosis_label', language)}: {medical_record.diagnosis or get_pdf_translation('na', language)}")
        y -= 30
    
    # 处方信息
    p.setFont(font_name, 12)
    p.drawString(100, y, f"{get_pdf_translation('prescription_info', language)}:")
    y -= 20
    p.setFont(font_name, 10)
    p.drawString(120, y, f"{get_pdf_translation('prescription_id_label', language)}: {prescription.id}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('prescription_date_label', language)}: {prescription.created_at.strftime('%Y-%m-%d %H:%M')}")
    y -= 15
    # 处方详情
    if prescription.details:
        for detail in prescription.details:
            p.drawString(120, y, f"{get_pdf_translation('medicine_label', language)}: {detail.drug.name if detail.drug else get_pdf_translation('na', language)}")
            y -= 15
            p.drawString(120, y, f"{get_pdf_translation('quantity_label', language)}: {detail.quantity or get_pdf_translation('na', language)}")
            y -= 15
            p.drawString(120, y, f"{get_pdf_translation('dosage_label', language)}: {detail.dosage or get_pdf_translation('na', language)}")
            y -= 15
            p.drawString(120, y, f"{get_pdf_translation('frequency_label', language)}: {detail.frequency or get_pdf_translation('na', language)}")
            y -= 15
    else:
        p.drawString(120, y, f"{get_pdf_translation('medicine_label', language)}: {get_pdf_translation('no_prescription_details', language)}")
        y -= 15
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('dispensing_status_label', language)}: {prescription.dispensing_status.value if prescription.dispensing_status else get_pdf_translation('na', language)}")
    y -= 15
    
    p.save()
    buffer.seek(0)
    return buffer

def generate_medical_record_pdf(medical_record, patient, prescriptions, language: str = 'zh-CN') -> BytesIO:
    """生成单个病历的PDF文件"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 设置字体
    try:
        font_name = "SimSun"
        p.setFont(font_name, 16)
    except:
        font_name = "Helvetica-Bold"
        p.setFont(font_name, 16)
    
    # 绘制头部
    p.drawString(100, height - 100, get_pdf_translation('medical_record_info', language))
    p.line(100, height - 110, width - 100, height - 110)
    
    y = height - 140
    
    # 患者信息
    if patient:
        p.setFont(font_name, 12)
        p.drawString(100, y, f"{get_pdf_translation('patient_info', language)}:")
        y -= 20
        p.setFont(font_name, 10)
        p.drawString(120, y, f"{get_pdf_translation('patient_name_label', language)}: {patient.name}")
        y -= 15
        p.drawString(120, y, f"{get_pdf_translation('patient_gender_label', language)}: {patient.gender or get_pdf_translation('na', language)}")
        y -= 15
        # Calculate age from birth_date
        age_str = get_pdf_translation('na', language)
        if patient.birth_date:
            from datetime import date
            today = date.today()
            age = today.year - patient.birth_date.year - ((today.month, today.day) < (patient.birth_date.month, patient.birth_date.day))
            age_str = str(age)
        p.drawString(120, y, f"{get_pdf_translation('patient_age_label', language)}: {age_str}")
        y -= 15
        p.drawString(120, y, f"{get_pdf_translation('patient_phone_label', language)}: {patient.contact_number or get_pdf_translation('na', language)}")
        y -= 30
    
    # 病历信息
    p.setFont(font_name, 12)
    p.drawString(100, y, f"{get_pdf_translation('medical_record_info', language)}:")
    y -= 20
    p.setFont(font_name, 10)
    p.drawString(120, y, f"{get_pdf_translation('record_id_label', language)}: {medical_record.id}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('visit_date_label', language)}: {medical_record.record_date.strftime('%Y-%m-%d')}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('chief_complaint_label', language)}: {medical_record.chief_complaint or get_pdf_translation('na', language)}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('present_illness_label', language)}: {medical_record.present_illness or get_pdf_translation('na', language)}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('past_history_label', language)}: {medical_record.past_history or get_pdf_translation('na', language)}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('physical_examination_label', language)}: {medical_record.physical_examination or get_pdf_translation('na', language)}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('diagnosis_label', language)}: {medical_record.diagnosis or get_pdf_translation('na', language)}")
    y -= 15
    p.drawString(120, y, f"{get_pdf_translation('treatment_plan_label', language)}: {medical_record.treatment_plan or get_pdf_translation('na', language)}")
    y -= 30
    
    # 处方信息
    if prescriptions:
        p.setFont(font_name, 12)
        p.drawString(100, y, f"{get_pdf_translation('related_prescriptions_label', language)}:")
        y -= 20
        p.setFont(font_name, 10)
        for i, prescription in enumerate(prescriptions, 1):
            p.drawString(120, y, f"{get_pdf_translation('prescription_label', language)} {i} ({get_pdf_translation('prescription_date_label', language)}: {prescription.prescription_date.strftime('%Y-%m-%d')})")
            y -= 15
            if prescription.details:
                for detail in prescription.details:
                    drug_name = detail.drug.name if detail.drug else get_pdf_translation('unknown_drug_label', language)
                    p.drawString(140, y, f"- {drug_name} x {detail.quantity}")
                    y -= 15
                    if detail.dosage and detail.frequency:
                        p.drawString(160, y, f"{get_pdf_translation('dosage_label', language)}: {detail.dosage}, {get_pdf_translation('frequency_label', language)}: {detail.frequency}")
                        y -= 15
    
    p.save()
    buffer.seek(0)
    return buffer