#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
在线支付功能测试脚本
测试支付宝和微信支付的完整流程
"""

import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import patch, MagicMock
from urllib.parse import parse_qs, urlparse

from app.finance import models, schemas
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.user.models import User
from app.core.context import current_user_id
from app.finance.payment_gateway import AlipayGateway, WechatPayGateway
from app.finance import service


class TestOnlinePaymentSetup:
    """在线支付测试基础设置"""
    
    @pytest.fixture
    def test_patient(self, db: Session):
        """创建测试患者"""
        patient = patient_models.Patient(
            name="测试患者",
            gender="male",
            birth_date=date(1990, 1, 1),
            contact_number="13900000000",
            address="测试地址"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    @pytest.fixture
    def test_doctor(self, db: Session):
        """创建测试医生"""
        doctor = clinic_models.Doctor(
            name="李医生",
            specialty="内科",
            user_id=1
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        return doctor

    @pytest.fixture
    def test_medical_record(self, db: Session, test_patient, test_doctor):
        """创建测试病历"""
        record = patient_models.MedicalRecord(
            patient_id=test_patient.id,
            doctor_id=test_doctor.id,
            symptoms="头痛、发热",
            diagnosis="感冒",
            treatment_plan="休息、多喝水、服用感冒药",
            notes="患者症状轻微",
            record_date=datetime(2023, 12, 1)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @pytest.fixture
    def test_bill(self, db: Session, test_patient, test_medical_record, admin_user: User):
        """创建测试账单"""
        token = current_user_id.set(admin_user.id)
        
        try:
            test_date = datetime(2023, 12, 1)
            bill = models.Bill(
                invoice_number="PAY-TEST-001",
                bill_date=test_date,
                total_amount=Decimal("299.50"),
                status="unpaid",
                patient_id=test_patient.id,
                medical_record_id=test_medical_record.id,
                created_at=test_date,
                updated_at=test_date,
                created_by_id=admin_user.id,
                updated_by_id=admin_user.id
            )
            db.add(bill)
            db.commit()
            db.refresh(bill)
            
            # 创建账单明细
            items = [
                {
                    "item_name": "门诊挂号费",
                    "item_type": "consultation",
                    "quantity": 1,
                    "unit_price": Decimal("50.00"),
                    "subtotal": Decimal("50.00")
                },
                {
                    "item_name": "感冒灵颗粒",
                    "item_type": "drug",
                    "quantity": 2,
                    "unit_price": Decimal("24.75"),
                    "subtotal": Decimal("49.50")
                },
                {
                    "item_name": "血常规检查",
                    "item_type": "examination",
                    "quantity": 1,
                    "unit_price": Decimal("200.00"),
                    "subtotal": Decimal("200.00")
                }
            ]
            
            for item_data in items:
                bill_item = models.BillItem(
                    **item_data,
                    bill_id=bill.id,
                    created_at=test_date,
                    updated_at=test_date,
                    created_by_id=admin_user.id,
                    updated_by_id=admin_user.id
                )
                db.add(bill_item)
            
            db.commit()
            return bill
        finally:
            if token:
                current_user_id.reset(token)

    @pytest.fixture
    def auth_headers(self, client: TestClient, admin_user: User):
        """获取认证头"""
        login_response = client.post(
            "/api/v1/users/token",
            data={"username": admin_user.username, "password": "password123"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


class TestAlipayPayment(TestOnlinePaymentSetup):
    """支付宝支付测试"""
    
    def test_alipay_gateway_initialization(self):
        """测试支付宝网关初始化"""
        gateway = AlipayGateway()
        
        assert gateway.app_id is not None
        assert gateway.gateway_url == "https://openapi.alipaydev.com/gateway.do"
        assert "alipay" in gateway.notify_url
        assert "payment-success" in gateway.return_url
    
    def test_create_alipay_payment_url(self, db: Session, test_bill):
        """测试生成支付宝支付链接"""
        gateway = AlipayGateway()
        payment_url = gateway.create_payment_url(test_bill)
        
        # 验证URL格式
        assert payment_url.startswith("https://openapi.alipaydev.com/gateway.do?")
        
        # 解析URL参数
        parsed_url = urlparse(payment_url)
        params = parse_qs(parsed_url.query)
        
        # 验证关键参数
        assert params["method"][0] == "alipay.trade.page.pay"
        assert params["charset"][0] == "utf-8"
        assert params["sign_type"][0] == "RSA2"
        assert "sign" in params
        
        # 验证业务参数
        biz_content = json.loads(params["biz_content"][0])
        assert biz_content["out_trade_no"] == str(test_bill.id)
        assert biz_content["total_amount"] == str(test_bill.total_amount)
        assert "诊所账单支付" in biz_content["subject"]
        assert biz_content["product_code"] == "FAST_INSTANT_TRADE_PAY"
    
    def test_initiate_alipay_payment_api(self, client: TestClient, test_bill, auth_headers):
        """测试发起支付宝支付API"""
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "alipay"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "payment_url" in data
        assert data["bill_id"] == test_bill.id
        assert data["provider"] == "alipay"
        assert "alipaydev.com" in data["payment_url"]
    
    def test_initiate_payment_for_paid_bill_fails(self, client: TestClient, db: Session, test_bill, auth_headers):
        """测试对已支付账单发起支付失败"""
        # 将账单状态设为已支付
        test_bill.status = "paid"
        db.commit()
        
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "alipay"},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "已支付" in response.json()["detail"]
    
    def test_initiate_payment_for_void_bill_fails(self, client: TestClient, db: Session, test_bill, auth_headers):
        """测试对作废账单发起支付失败"""
        # 将账单状态设为作废
        test_bill.status = "void"
        db.commit()
        
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "alipay"},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "已作废" in response.json()["detail"]
    
    def test_initiate_payment_for_nonexistent_bill_fails(self, client: TestClient, auth_headers):
        """测试对不存在账单发起支付失败"""
        response = client.post(
            "/api/v1/finance/bills/99999/initiate-online-payment",
            json={"provider": "alipay"},
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "不存在" in response.json()["detail"]
    
    def test_invalid_payment_provider_fails(self, client: TestClient, test_bill, auth_headers):
        """测试无效支付提供商失败"""
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "invalid_provider"},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "不支持的支付提供商" in response.json()["detail"]
    
    def test_alipay_signature_verification(self):
        """测试支付宝签名验证"""
        gateway = AlipayGateway()
        
        # 模拟支付宝回调数据
        notification_data = {
            "out_trade_no": "123",
            "trade_no": "2023120122001234567890",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": "299.50",
            "buyer_email": "test@example.com",
            "sign_type": "RSA2",
            "sign": "mock_signature"
        }
        
        # 由于是简化版本的验签，这里应该返回True
        is_valid = gateway.verify_notification(notification_data.copy())
        assert is_valid is True
    
    @patch('app.finance.service.online_payment_service.process_alipay_notification')
    def test_alipay_webhook_success(self, mock_process, client: TestClient, db: Session):
        """测试支付宝回调成功处理"""
        # 模拟支付宝回调数据
        form_data = {
            "out_trade_no": "123",
            "trade_no": "2023120122001234567890",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": "299.50",
            "buyer_email": "test@example.com",
            "sign_type": "RSA2",
            "sign": "mock_signature"
        }
        
        response = client.post(
            "/api/v1/finance/webhooks/alipay",
            data=form_data
        )
        
        assert response.status_code == 200
        assert response.text == "success"
        mock_process.assert_called_once()
    
    def test_alipay_webhook_invalid_signature(self, client: TestClient):
        """测试支付宝回调签名验证失败"""
        with patch('app.finance.payment_gateway.alipay_gateway.verify_notification', return_value=False):
            form_data = {
                "out_trade_no": "123",
                "trade_no": "2023120122001234567890",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": "299.50",
                "sign_type": "RSA2",
                "sign": "invalid_signature"
            }
            
            response = client.post(
                "/api/v1/finance/webhooks/alipay",
                data=form_data
            )
            
            # 即使签名验证失败，也应该返回success避免重复通知
            assert response.status_code == 200
            assert response.text == "success"


class TestWechatPayment(TestOnlinePaymentSetup):
    """微信支付测试"""
    
    def test_wechat_gateway_initialization(self):
        """测试微信支付网关初始化"""
        gateway = WechatPayGateway()
        
        assert gateway.app_id is not None
        assert gateway.mch_id is not None
        assert gateway.api_key is not None
    
    def test_initiate_wechat_payment_not_implemented(self, client: TestClient, test_bill, auth_headers):
        """测试微信支付暂未实现"""
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "wechat_pay"},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "暂未实现" in response.json()["detail"]
    
    def test_wechat_webhook_placeholder(self, client: TestClient):
        """测试微信支付回调占位符"""
        response = client.post(
            "/api/v1/finance/webhooks/wechat",
            json={"test": "data"}
        )
        
        assert response.status_code == 200
        assert response.json() == {"status": "success"}


class TestPaymentNotificationProcessing(TestOnlinePaymentSetup):
    """支付通知处理测试"""
    
    def test_process_successful_alipay_notification(self, db: Session, test_bill, admin_user: User):
        """测试处理成功的支付宝通知"""
        token = current_user_id.set(admin_user.id)
        
        try:
            # 模拟支付成功通知数据
            notification_data = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567890",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": str(test_bill.total_amount),
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 10:30:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            # 处理通知
            service.online_payment_service.process_alipay_notification(db, notification_data)
            
            # 验证支付记录已创建
            payment = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id,
                models.Payment.payment_method == "alipay"
            ).first()
            
            assert payment is not None
            assert payment.amount == test_bill.total_amount
            assert payment.provider_transaction_id == "2023120122001234567890"
            
            # 验证账单状态已更新
            db.refresh(test_bill)
            assert test_bill.status == "paid"
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def test_process_partial_payment_notification(self, db: Session, test_bill, admin_user: User):
        """测试处理部分支付通知"""
        token = current_user_id.set(admin_user.id)
        
        try:
            # 模拟部分支付通知数据
            partial_amount = Decimal("150.00")
            notification_data = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567891",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": str(partial_amount),
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 10:30:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            # 处理通知
            service.online_payment_service.process_alipay_notification(db, notification_data)
            
            # 验证支付记录已创建
            payment = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id,
                models.Payment.amount == partial_amount
            ).first()
            
            assert payment is not None
            assert payment.provider_transaction_id == "2023120122001234567891"
            
            # 验证账单状态为部分支付
            db.refresh(test_bill)
            assert test_bill.status == "partially_paid"
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def test_process_failed_payment_notification(self, db: Session, test_bill, admin_user: User):
        """测试处理失败的支付通知"""
        token = current_user_id.set(admin_user.id)
        
        try:
            # 模拟支付失败通知数据
            notification_data = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567892",
                "trade_status": "TRADE_CLOSED",
                "total_amount": str(test_bill.total_amount),
                "buyer_email": "test@example.com",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            # 处理通知
            service.online_payment_service.process_alipay_notification(db, notification_data)
            
            # 验证没有创建支付记录
            payment = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id,
                models.Payment.provider_transaction_id == "2023120122001234567892"
            ).first()
            
            assert payment is None
            
            # 验证账单状态未改变
            db.refresh(test_bill)
            assert test_bill.status == "unpaid"
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def test_process_duplicate_notification(self, db: Session, test_bill, admin_user: User):
        """测试处理重复通知"""
        token = current_user_id.set(admin_user.id)
        
        try:
            # 模拟支付成功通知数据
            notification_data = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567893",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": str(test_bill.total_amount),
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 10:30:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            # 第一次处理通知
            service.online_payment_service.process_alipay_notification(db, notification_data)
            
            # 获取支付记录数量
            payment_count_before = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id
            ).count()
            
            # 第二次处理相同通知
            service.online_payment_service.process_alipay_notification(db, notification_data)
            
            # 验证没有创建重复的支付记录
            payment_count_after = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id
            ).count()
            
            assert payment_count_after == payment_count_before
            
        finally:
            if token:
                current_user_id.reset(token)


class TestPaymentSecurity(TestOnlinePaymentSetup):
    """支付安全测试"""
    
    def test_unauthorized_payment_initiation_fails(self, unauthenticated_client: TestClient, test_bill):
        """测试未授权发起支付失败"""
        response = unauthenticated_client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "alipay"}
        )
        
        assert response.status_code == 401
    
    def test_webhook_without_signature_verification(self, client: TestClient):
        """测试回调接口的安全性"""
        # 测试空数据
        response = client.post("/api/v1/finance/webhooks/alipay")
        assert response.status_code == 200  # 应该返回success避免重复通知
        
        # 测试恶意数据
        malicious_data = {
            "out_trade_no": "'; DROP TABLE bills; --",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": "-999999"
        }
        
        response = client.post(
            "/api/v1/finance/webhooks/alipay",
            data=malicious_data
        )
        assert response.status_code == 200
    
    def test_payment_amount_validation(self, client: TestClient, test_bill, auth_headers):
        """测试支付金额验证"""
        # 测试负数金额
        with patch('app.finance.payment_gateway.AlipayGateway.create_payment_url') as mock_create:
            mock_create.side_effect = ValueError("支付金额必须大于0")
            
            response = client.post(
                f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
                json={"provider": "alipay"},
                headers=auth_headers
            )
            
            # 应该在网关层面被拦截
            assert response.status_code == 400


class TestPaymentIntegration(TestOnlinePaymentSetup):
    """支付集成测试"""
    
    def test_complete_payment_workflow(self, client: TestClient, db: Session, test_bill, auth_headers, admin_user: User):
        """测试完整的支付流程"""
        # 1. 发起支付
        response = client.post(
            f"/api/v1/finance/bills/{test_bill.id}/initiate-online-payment",
            json={"provider": "alipay"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        payment_data = response.json()
        assert "payment_url" in payment_data
        
        # 2. 模拟用户完成支付后的回调
        token = current_user_id.set(admin_user.id)
        
        try:
            notification_data = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567894",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": str(test_bill.total_amount),
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 10:30:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            webhook_response = client.post(
                "/api/v1/finance/webhooks/alipay",
                data=notification_data
            )
            
            assert webhook_response.status_code == 200
            assert webhook_response.text == "success"
            
            # 3. 验证支付结果
            bill_response = client.get(
                f"/api/v1/finance/bills/{test_bill.id}",
                headers=auth_headers
            )
            
            assert bill_response.status_code == 200
            bill_data = bill_response.json()
            assert bill_data["status"] == "paid"
            assert len(bill_data["payments"]) == 1
            assert bill_data["payments"][0]["payment_method"] == "alipay"
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def test_multiple_partial_payments(self, client: TestClient, db: Session, test_bill, auth_headers, admin_user: User):
        """测试多次部分支付"""
        token = current_user_id.set(admin_user.id)
        
        try:
            # 第一次部分支付
            notification_data_1 = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567895",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": "100.00",
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 10:30:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            service.online_payment_service.process_alipay_notification(db, notification_data_1)
            
            # 验证部分支付状态
            db.refresh(test_bill)
            assert test_bill.status == "partially_paid"
            
            # 第二次部分支付
            notification_data_2 = {
                "out_trade_no": str(test_bill.id),
                "trade_no": "2023120122001234567896",
                "trade_status": "TRADE_SUCCESS",
                "total_amount": "199.50",
                "buyer_email": "test@example.com",
                "gmt_payment": "2023-12-01 11:00:00",
                "sign": "test_signature",
                "sign_type": "RSA2"
            }
            
            service.online_payment_service.process_alipay_notification(db, notification_data_2)
            
            # 验证完全支付状态
            db.refresh(test_bill)
            assert test_bill.status == "paid"
            
            # 验证支付记录
            payments = db.query(models.Payment).filter(
                models.Payment.bill_id == test_bill.id
            ).all()
            
            assert len(payments) == 2
            total_paid = sum(p.amount for p in payments)
            assert total_paid == test_bill.total_amount
            
        finally:
            if token:
                current_user_id.reset(token)


if __name__ == "__main__":
    # 运行测试
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--disable-warnings"
    ])