import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, UTC
from decimal import Decimal

from app.finance import service as finance_service
from app.finance.schemas import PaymentRequest
from app.patient.service import patient_service, medical_record_service
from app.patient.schemas import PatientCreate, MedicalRecordCreate
from app.user.service import user_service
from app.user.schemas import UserCreate
from app.core.security import create_access_token
from app.app import app
from app.core.database import get_db

# 创建一个可复用的测试数据夹具
@pytest.fixture(scope="function")
def setup_report_data(db: Session, test_user, admin_user):
    """
    创建一个包含精确财务数据的测试环境
    """
    # 1. 创建一些基础数据
    patient1 = patient_service.create(db, obj_in=PatientCreate(name="报告测试患者1", gender="男", birth_date="1990-01-01"))
    
    # 2. 创建两条在指定日期范围内的病历和账单
    record1_date = datetime(2025, 6, 1, 10, 0, tzinfo=UTC)
    record2_date = datetime(2025, 6, 5, 14, 0, tzinfo=UTC)
    
    medical_record1 = medical_record_service.create(db, obj_in=MedicalRecordCreate(
        patient_id=patient1.id, doctor_id=1, record_date=record1_date,
        symptoms="测试症状1", diagnosis="测试诊断1"
    ))
    bill1 = finance_service.billing_service.generate_bill_for_record(db, medical_record_id=medical_record1.id)
    # bill1 的金额是固定的诊疗费 150.00
    
    medical_record2 = medical_record_service.create(db, obj_in=MedicalRecordCreate(
        patient_id=patient1.id, doctor_id=1, record_date=record2_date,
        symptoms="测试症状2", diagnosis="测试诊断2"
    ))
    bill2 = finance_service.billing_service.generate_bill_for_record(db, medical_record_id=medical_record2.id)
    # bill2 的金额也是 150.00
    
    # 3. 创建一笔支付
    finance_service.payment_service.create_payment(db, bill_id=bill1.id, amount=Decimal("100.00"), payment_method="cash")
    
    # 返回测试中需要用到的关键信息
    return {
        "start_date": date(2025, 6, 1),
        "end_date": date(2025, 6, 30),
        "expected_revenue": bill1.total_amount + bill2.total_amount, # 150 + 150 = 300
        "expected_payments": Decimal("100.00"),
        "expected_bill_count": 2
    }

def test_get_financial_summary_json(client: TestClient, setup_report_data):
    """
    测试获取JSON格式的财务摘要报告
    """
    # 构造请求体
    request_data = {
        "start_date": setup_report_data["start_date"].isoformat(),
        "end_date": setup_report_data["end_date"].isoformat(),
    }
    
    # 使用 client 夹具发送请求，它会自动模拟管理员登录
    response = client.post("/api/v1/reports/financial-summary", json=request_data)
    
    # 断言响应状态码
    assert response.status_code == 200
    
    # 断言返回的JSON数据
    report = response.json()
    assert float(report["total_revenue"]) == float(setup_report_data["expected_revenue"])
    assert float(report["total_payments"]) == float(setup_report_data["expected_payments"])
    assert float(report["unpaid_amount"]) == float(setup_report_data["expected_revenue"] - setup_report_data["expected_payments"])
    assert report["bill_count"] == setup_report_data["expected_bill_count"]

def test_download_financial_summary_pdf(client: TestClient, setup_report_data):
    """
    测试下载PDF格式的财务摘要报告
    """
    request_data = {
        "start_date": setup_report_data["start_date"].isoformat(),
        "end_date": setup_report_data["end_date"].isoformat(),
    }
    
    response = client.post("/api/v1/reports/financial-summary/download", json=request_data)
    
    # 1. 验证响应状态和头部信息
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert ".pdf" in response.headers["content-disposition"]
    
    # 2. 验证响应内容
    content = response.content
    assert content is not None
    # 通过检查PDF文件的魔法数字（起始字节）来确认它是一个有效的PDF文件
    assert content.startswith(b'%PDF-')

def test_empty_date_range(client: TestClient, db: Session):
    """
    测试空数据范围
    查询一个没有任何账单的日期范围，验证所有数值字段均为0
    """
    # 使用过去的日期范围，确保没有数据
    request_data = {
        "start_date": "2020-01-01",
        "end_date": "2020-01-31",
    }
    
    response = client.post("/api/v1/reports/financial-summary", json=request_data)
    
    assert response.status_code == 200
    report = response.json()
    
    # 验证所有数值字段均为0
    assert float(report["total_revenue"]) == 0
    assert float(report["total_payments"]) == 0
    assert float(report["unpaid_amount"]) == 0
    assert report["bill_count"] == 0
    assert len(report["revenue_by_type"]) == 0

def test_report_permission_denied(db: Session):
    """
    测试普通用户无法访问报告
    """
    # 创建一个普通用户
    user_data = UserCreate(
        username="normal_report_user",
        email="normal_report@example.com",
        password="password123",
        role="user"  # 非管理员角色
    )
    normal_user = user_service.create_user(db=db, user_in=user_data)
    
    # 为普通用户创建访问令牌
    token = create_access_token(data={"sub": normal_user.username})
    
    # 创建一个新的TestClient，不覆盖权限依赖
    # 重写数据库依赖以使用测试数据库
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app_for_test = app
    app_for_test.dependency_overrides = {}
    app_for_test.dependency_overrides[get_db] = override_get_db
    
    test_client = TestClient(app_for_test)
    
    # 构造请求体
    request_data = {
        "start_date": "2025-06-01",
        "end_date": "2025-06-30",
    }
    
    # 使用普通用户令牌发送请求
    headers = {"Authorization": f"Bearer {token}"}
    response = test_client.post("/api/v1/reports/financial-summary", json=request_data, headers=headers)
    
    # 断言响应状态码为403 Forbidden
    assert response.status_code == 403 