"""支付会话功能测试模块

测试客户被扫支付功能的各个方面，包括创建支付会话、生成二维码、查询支付状态等。
"""

import pytest
from datetime import datetime, timedelta, UTC
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.app import app
from app.core.database import get_db
from app.finance import models
from app.user.models import User
from app.finance.payment_session_service import PaymentSessionService
from app.core.context import current_user_id
from tests.conftest import TestingSessionLocal

# override_get_db函数在conftest.py的fixture内部定义，不需要直接导入
def override_get_db():
    """覆盖数据库依赖"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# 使用测试数据库
app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestPaymentSessionService:
    """支付会话服务测试类"""
    
    def setup_method(self):
        """测试前准备"""
        # 创建数据库表
        from app.core.database import Base
        from tests.conftest import engine
        Base.metadata.create_all(bind=engine)
        
        self.db = TestingSessionLocal()
        self.service = PaymentSessionService(self.db)
        
        # 创建测试用户
        self.test_user = User(
            username="test_user",
            email="test@example.com",
            hashed_password="hashed_password"
        )
        self.db.add(self.test_user)
        self.db.commit()
        self.db.refresh(self.test_user)
        
        # 创建测试账单
        self.test_bill = models.Bill(
            invoice_number="TEST-001",
            bill_date=datetime.now(UTC),
            patient_id=1,
            total_amount=100.00,
            status=models.BillStatus.UNPAID,
            created_by_id=self.test_user.id,
            updated_by_id=self.test_user.id
        )
        self.db.add(self.test_bill)
        self.db.commit()
        self.db.refresh(self.test_bill)
        
        # 设置当前用户上下文
        current_user_id.set(self.test_user.id)
    
    def teardown_method(self):
        """测试后清理"""
        self.db.close()
        current_user_id.set(None)
        
        # 清理数据库表
        from app.core.database import Base
        from tests.conftest import engine
        Base.metadata.drop_all(bind=engine)
    
    @patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment')
    def test_create_alipay_session(self, mock_alipay):
        """测试创建支付宝支付会话"""
        # 模拟支付宝网关响应
        mock_alipay.return_value = {
            "qr_code": "https://qr.alipay.com/test123",
            "out_trade_no": str(self.test_bill.id),
            "expires_at": datetime.now(UTC) + timedelta(minutes=15),
            "prepay_id": "test_prepay_id"
        }
        
        # 创建支付会话
        session = self.service.create_payment_session(
            bill_id=self.test_bill.id,
            payment_method=models.PaymentMethod.ALIPAY,
            timeout_minutes=15
        )
        
        # 验证结果
        assert session is not None
        assert session.bill_id == self.test_bill.id
        assert session.payment_method == models.PaymentMethod.ALIPAY
        assert session.status == models.PaymentSessionStatus.PENDING
        assert session.amount == self.test_bill.total_amount
        assert session.timeout_minutes == 15
        assert session.qr_code_content == "https://qr.alipay.com/test123"
        assert session.prepay_id == "test_prepay_id"
        
        # 验证支付宝网关被调用
        mock_alipay.assert_called_once_with(self.test_bill, 15)
    
    @patch('app.finance.payment_gateway.WechatPayGateway.create_qr_payment')
    def test_create_wechat_session(self, mock_wechat):
        """测试创建微信支付会话"""
        # 模拟微信网关响应
        mock_wechat.return_value = {
            "qr_code": "weixin://wxpay/bizpayurl?pr=test123",
            "out_trade_no": str(self.test_bill.id),
            "expires_at": datetime.now(UTC) + timedelta(minutes=15)
        }
        
        # 创建支付会话
        session = self.service.create_payment_session(
            bill_id=self.test_bill.id,
            payment_method=models.PaymentMethod.WECHAT,
            timeout_minutes=15
        )
        
        # 验证结果
        assert session is not None
        assert session.payment_method == models.PaymentMethod.WECHAT
        assert session.qr_code_content == "weixin://wxpay/bizpayurl?pr=test123"
        
        # 验证微信网关被调用
        mock_wechat.assert_called_once_with(self.test_bill, 15)
    
    def test_create_session_bill_not_found(self):
        """测试创建支付会话时账单不存在"""
        with pytest.raises(Exception) as exc_info:
            self.service.create_payment_session(
                bill_id=99999,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        assert "not found" in str(exc_info.value)
    
    def test_create_session_bill_already_paid(self):
        """测试创建支付会话时账单已支付"""
        # 将账单状态设为已支付
        self.test_bill.status = models.BillStatus.PAID
        self.db.commit()
        
        with pytest.raises(Exception) as exc_info:
            self.service.create_payment_session(
                bill_id=self.test_bill.id,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        assert "无法支付" in str(exc_info.value)
    
    @patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment')
    def test_get_existing_session(self, mock_alipay):
        """测试获取已存在的支付会话"""
        # 模拟支付宝网关响应
        mock_alipay.return_value = {
            "qr_code": "https://qr.alipay.com/test123",
            "out_trade_no": str(self.test_bill.id),
            "expires_at": datetime.now(UTC) + timedelta(minutes=15)
        }
        
        # 创建第一个会话
        session1 = self.service.create_payment_session(
            bill_id=self.test_bill.id,
            payment_method=models.PaymentMethod.ALIPAY,
            timeout_minutes=15
        )
        
        # 尝试创建第二个会话（应该返回现有会话）
        session2 = self.service.create_payment_session(
            bill_id=self.test_bill.id,
            payment_method=models.PaymentMethod.ALIPAY,
            timeout_minutes=15
        )
        
        # 验证返回的是同一个会话
        assert session1.id == session2.id
        
        # 验证支付宝网关只被调用一次
        assert mock_alipay.call_count == 1
    
    @patch('app.finance.payment_gateway.AlipayGateway.generate_qr_code_image')
    def test_get_qr_code_image(self, mock_qr_image):
        """测试获取二维码图片"""
        # 模拟二维码图片生成
        mock_qr_image.return_value = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
        
        # 创建支付会话
        with patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment') as mock_alipay:
            mock_alipay.return_value = {
                "qr_code": "https://qr.alipay.com/test123",
                "out_trade_no": str(self.test_bill.id),
                "expires_at": datetime.now(UTC) + timedelta(minutes=15)
            }
            
            session = self.service.create_payment_session(
                bill_id=self.test_bill.id,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        # 获取二维码图片
        qr_image = self.service.get_qr_code_image(session.id)
        
        # 验证结果
        assert qr_image == "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
        mock_qr_image.assert_called_once_with("https://qr.alipay.com/test123")
    
    @patch('app.finance.payment_gateway.AlipayGateway.query_payment_status')
    def test_check_payment_status_pending(self, mock_query):
        """测试检查支付状态 - 等待中"""
        # 模拟支付状态查询
        mock_query.return_value = {"trade_status": "WAIT_BUYER_PAY"}
        
        # 创建支付会话
        with patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment') as mock_alipay:
            mock_alipay.return_value = {
                "qr_code": "https://qr.alipay.com/test123",
                "out_trade_no": str(self.test_bill.id),
                "expires_at": datetime.now(UTC) + timedelta(minutes=15)
            }
            
            session = self.service.create_payment_session(
                bill_id=self.test_bill.id,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        # 检查支付状态
        status_info = self.service.check_payment_status(session.id)
        
        # 验证结果
        assert status_info["status"] == "pending"
        assert status_info["session_id"] == session.id
        assert status_info["bill_id"] == self.test_bill.id
        assert status_info["amount"] == float(self.test_bill.total_amount)
    
    @patch('app.finance.payment_gateway.AlipayGateway.query_payment_status')
    def test_check_payment_status_completed(self, mock_query):
        """测试检查支付状态 - 已完成"""
        # 模拟支付状态查询
        mock_query.return_value = {
            "trade_status": "TRADE_SUCCESS",
            "trade_no": "test_trade_no_123"
        }
        
        # 创建支付会话
        with patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment') as mock_alipay:
            mock_alipay.return_value = {
                "qr_code": "https://qr.alipay.com/test123",
                "out_trade_no": str(self.test_bill.id),
                "expires_at": datetime.now(UTC) + timedelta(minutes=15)
            }
            
            session = self.service.create_payment_session(
                bill_id=self.test_bill.id,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        # 检查支付状态
        status_info = self.service.check_payment_status(session.id)
        
        # 验证结果
        assert status_info["status"] == "paid"
        
        # 验证支付记录被创建
        payment = self.db.query(models.Payment).filter(
            models.Payment.bill_id == self.test_bill.id
        ).first()
        assert payment is not None
        assert payment.amount == self.test_bill.total_amount
        
        # 验证账单状态被更新
        self.db.refresh(self.test_bill)
        assert self.test_bill.status == models.BillStatus.PAID
        assert self.test_bill.paid_at is not None
    
    def test_cancel_payment_session(self):
        """测试取消支付会话"""
        # 创建支付会话
        with patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment') as mock_alipay:
            mock_alipay.return_value = {
                "qr_code": "https://qr.alipay.com/test123",
                "out_trade_no": str(self.test_bill.id),
                "expires_at": datetime.now(UTC) + timedelta(minutes=15)
            }
            
            session = self.service.create_payment_session(
                bill_id=self.test_bill.id,
                payment_method=models.PaymentMethod.ALIPAY,
                timeout_minutes=15
            )
        
        # 取消支付会话
        result = self.service.cancel_payment_session(session.id)
        
        # 验证结果
        assert result is True
        
        # 验证会话状态被更新
        self.db.refresh(session)
        assert session.status == models.PaymentSessionStatus.CANCELLED
    
    def test_cleanup_expired_sessions(self):
        """测试清理过期的支付会话"""
        # 创建过期的支付会话
        expired_session = models.PaymentSession(
            bill_id=self.test_bill.id,
            payment_method=models.PaymentMethod.ALIPAY,
            qr_code_content="https://qr.alipay.com/expired",
            expires_at=datetime.now(UTC) - timedelta(minutes=1),  # 已过期
            status=models.PaymentSessionStatus.PENDING,
            amount=self.test_bill.total_amount,
            timeout_minutes=15,
            created_by_id=self.test_user.id,
            updated_by_id=self.test_user.id
        )
        self.db.add(expired_session)
        self.db.commit()
        
        # 清理过期会话
        count = self.service.cleanup_expired_sessions()
        
        # 验证结果
        assert count == 1
        
        # 验证会话状态被更新
        self.db.refresh(expired_session)
        assert expired_session.status == models.PaymentSessionStatus.EXPIRED


class TestPaymentSessionAPI:
    """支付会话API测试类"""
    
    @pytest.fixture(autouse=True)
    def setup_test_data(self, db, admin_user):
        """测试前准备"""
        self.db = db
        self.test_user = admin_user
        
        self.test_bill = models.Bill(
            invoice_number="TEST-002",
            bill_date=datetime.now(UTC),
            patient_id=1,
            total_amount=200.00,
            status=models.BillStatus.UNPAID,
            created_by_id=self.test_user.id,
            updated_by_id=self.test_user.id
        )
        self.db.add(self.test_bill)
        self.db.commit()
        self.db.refresh(self.test_bill)
        
        # 设置认证头
        self.auth_headers = {"Authorization": f"Bearer test_token"}
    
    @patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment')
    def test_create_session_api(self, mock_alipay, client):
        """测试创建支付会话API"""
        # 模拟支付宝网关
        mock_alipay.return_value = {
            "qr_code": "https://qr.alipay.com/api_test",
            "out_trade_no": str(self.test_bill.id),
            "expires_at": datetime.now(UTC) + timedelta(minutes=15)
        }
        
        # 发送API请求
        response = client.post(
            "/api/v1/finance/payment-sessions/",
            json={
                "bill_id": self.test_bill.id,
                "payment_method": "alipay",
                "timeout_minutes": 15
            },
            headers=self.auth_headers
        )
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["bill_id"] == self.test_bill.id
        assert data["payment_method"] == "alipay"
        assert data["status"] == "pending"
        assert data["amount"] == 200.0
    
    def test_create_session_api_invalid_bill(self, client):
        """测试创建支付会话API - 无效账单"""
        # 发送API请求
        response = client.post(
            "/api/v1/finance/payment-sessions/",
            json={
                "bill_id": 99999,
                "payment_method": "alipay",
                "timeout_minutes": 15
            },
            headers=self.auth_headers
        )
        
        # 验证响应
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    @patch('app.finance.payment_gateway.AlipayGateway.generate_qr_code_image')
    def test_get_qr_code_api(self, mock_qr_image, client):
        """测试获取二维码API"""
        mock_qr_image.return_value = "data:image/png;base64,test_image_data"
        
        # 先创建支付会话
        with patch('app.finance.payment_gateway.AlipayGateway.create_qr_payment') as mock_alipay:
            mock_alipay.return_value = {
                "qr_code": "https://qr.alipay.com/api_test",
                "out_trade_no": str(self.test_bill.id),
                "expires_at": datetime.now(UTC) + timedelta(minutes=15)
            }
            
            create_response = client.post(
                "/api/v1/finance/payment-sessions/",
                json={
                    "bill_id": self.test_bill.id,
                    "payment_method": "alipay",
                    "timeout_minutes": 15
                },
                headers=self.auth_headers
            )
            session_id = create_response.json()["id"]
        
        # 获取二维码
        response = client.get(
            f"/api/v1/finance/payment-sessions/{session_id}/qr-code",
            headers=self.auth_headers
        )
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert data["qr_code_image"] == "data:image/png;base64,test_image_data"
        assert data["payment_method"] == "alipay"
        assert data["amount"] == 200.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])