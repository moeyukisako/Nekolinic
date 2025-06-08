#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
在线支付端到端测试脚本
模拟真实用户支付场景的完整流程测试
"""

import pytest
import json
import time
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import patch, MagicMock
from urllib.parse import parse_qs, urlparse
from typing import Dict, Any, List

from app.finance import models, schemas
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.pharmacy import models as pharmacy_models
from app.user.models import User
from app.core.context import current_user_id
from app.finance import service


class PaymentE2ETestSuite:
    """支付端到端测试套件"""
    
    def __init__(self, client: TestClient, db: Session, admin_user: User):
        self.client = client
        self.db = db
        self.admin_user = admin_user
        self.auth_headers = self._get_auth_headers()
        self.test_scenarios = []
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """获取认证头"""
        login_response = self.client.post(
            "/api/v1/users/token",
            data={"username": self.admin_user.username, "password": "password123"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def create_realistic_patient_scenario(self) -> Dict[str, Any]:
        """创建真实的患者就诊场景"""
        token = current_user_id.set(self.admin_user.id)
        
        try:
            # 1. 创建患者
            patient = patient_models.Patient(
                name="王小明",
                gender="male",
                birth_date=date(1985, 3, 15),
                contact_number="13912345678",
                address="上海市浦东新区张江高科技园区"
            )
            self.db.add(patient)
            self.db.commit()
            self.db.refresh(patient)
            
            # 2. 创建医生
            import uuid
            doctor_suffix = str(uuid.uuid4())[:8]
            doctor = clinic_models.Doctor(
                name=f"张医生_{doctor_suffix}",
                specialty="内科",
                phone=f"138000{doctor_suffix[:5]}",
                email=f"doctor.zhang.{doctor_suffix}@clinic.com"
            )
            self.db.add(doctor)
            self.db.commit()
            self.db.refresh(doctor)
            
            # 3. 创建药品
            medicines = [
                {
                    "name": "阿莫西林胶囊",
                    "code": f"AMX{doctor_suffix}",
                    "description": "抗生素类药物",
                    "specification": "0.25g*24粒",
                    "unit": "盒",
                    "unit_price": Decimal("28.50"),
                    "cost_price": Decimal("20.00")
                },
                {
                    "name": "布洛芬缓释胶囊",
                    "code": f"IBU{doctor_suffix}",
                    "description": "解热镇痛药",
                    "specification": "0.3g*20粒",
                    "unit": "盒",
                    "unit_price": Decimal("15.80"),
                    "cost_price": Decimal("12.00")
                },
                {
                    "name": "维生素C片",
                    "code": f"VTC{doctor_suffix}",
                    "description": "维生素补充剂",
                    "specification": "0.1g*100片",
                    "unit": "瓶",
                    "unit_price": Decimal("12.00"),
                    "cost_price": Decimal("8.00")
                }
            ]
            
            medicine_objects = []
            for med_data in medicines:
                medicine = pharmacy_models.Drug(
                    **med_data,
                    manufacturer="测试制药公司",
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    created_by_id=self.admin_user.id,
                    updated_by_id=self.admin_user.id
                )
                self.db.add(medicine)
                medicine_objects.append(medicine)
            
            self.db.commit()
            for med in medicine_objects:
                self.db.refresh(med)
                
            # 为每个药品添加库存
            from app.pharmacy.service import inventory_service
            
            # 设置当前用户上下文
            current_user_id.set(self.admin_user.id)
            
            for medicine in medicine_objects:
                inventory_service.add_stock(
                    db=self.db,
                    drug_id=medicine.id,
                    quantity=100,
                    notes="测试初始库存"
                )
            
            # 4. 创建病历
            medical_record = patient_models.MedicalRecord(
                patient_id=patient.id,
                doctor_id=doctor.id,
                chief_complaint="咳嗽、发热、头痛",
                present_illness="咳嗽、发热、头痛，持续3天",
                diagnosis="上呼吸道感染",
                treatment_plan="抗感染治疗，对症处理，多休息多饮水",
                notes="患者症状较轻，建议居家休息，如症状加重及时复诊",
                record_date=datetime.now(),
                temperature=38.2,
                blood_pressure="120/80",
                pulse=85,
                respiratory_rate=18,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by_id=self.admin_user.id,
                updated_by_id=self.admin_user.id
            )
            self.db.add(medical_record)
            self.db.commit()
            self.db.refresh(medical_record)
            
            # 创建处方
            prescription = pharmacy_models.Prescription(
                prescription_date=datetime.now(),
                dispensing_status="pending",
                medical_record_id=medical_record.id,
                doctor_id=doctor.id,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by_id=self.admin_user.id,
                updated_by_id=self.admin_user.id
            )
            self.db.add(prescription)
            self.db.flush()
            
            # 创建处方明细
            prescription_details = []
            for i, medicine in enumerate(medicine_objects):
                detail = pharmacy_models.PrescriptionDetail(
                    prescription_id=prescription.id,
                    drug_id=medicine.id,
                    quantity=2 if i == 0 else 1,  # 阿莫西林2盒，其他1盒
                    dosage="每次1粒" if "胶囊" in medicine.name else "每次2片",
                    frequency="每日3次" if i == 0 else "每日2次",
                    days=7,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    created_by_id=self.admin_user.id,
                    updated_by_id=self.admin_user.id
                )
                self.db.add(detail)
                prescription_details.append(detail)
            
            self.db.commit()
            for detail in prescription_details:
                self.db.refresh(detail)
            
            return {
                "patient": patient,
                "doctor": doctor,
                "medical_record": medical_record,
                "prescription": prescription,
                "prescription_details": prescription_details,
                "medicines": medicine_objects
            }
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def generate_bill_for_scenario(self, scenario: Dict[str, Any]) -> models.Bill:
        """为场景生成账单"""
        response = self.client.post(
            f"/api/v1/finance/billing/generate-from-record/{scenario['medical_record'].id}",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200, f"生成账单失败: {response.json()}"
        bill_data = response.json()
        
        # 获取完整的账单信息
        bill_response = self.client.get(
            f"/api/v1/finance/bills/{bill_data['id']}",
            headers=self.auth_headers
        )
        
        assert bill_response.status_code == 200
        return bill_response.json()


class TestPatientPaymentJourney:
    """患者支付流程测试"""
    
    @pytest.fixture
    def e2e_tester(self, client: TestClient, db: Session, admin_user: User):
        """端到端测试器"""
        return PaymentE2ETestSuite(client, db, admin_user)
    
    def test_complete_patient_visit_and_payment(self, e2e_tester: PaymentE2ETestSuite):
        """测试完整的患者就诊和支付流程"""
        # 1. 创建真实的就诊场景
        scenario = e2e_tester.create_realistic_patient_scenario()
        
        # 验证场景数据
        assert scenario["patient"].name == "王小明"
        assert scenario["doctor"].name.startswith("张医生_")
        assert scenario["medical_record"].diagnosis == "上呼吸道感染"
        assert len(scenario["prescription_details"]) == 3
        
        # 2. 生成账单
        bill = e2e_tester.generate_bill_for_scenario(scenario)
        
        # 验证账单内容
        assert bill["status"] == "unpaid"
        assert len(bill["items"]) >= 4  # 挂号费 + 3种药品
        assert Decimal(bill["total_amount"]) > 0
        
        # 验证账单明细
        item_names = [item["item_name"] for item in bill["items"]]
        assert any("诊疗费" in name for name in item_names), "缺少诊疗费"
        assert any("阿莫西林" in name for name in item_names), "缺少阿莫西林"
        assert any("布洛芬" in name for name in item_names), "缺少布洛芬"
        assert any("维生素C" in name for name in item_names), "缺少维生素C"
        
        print(f"\n=== 账单详情 ===")
        print(f"账单号: {bill['invoice_number']}")
        print(f"患者: {scenario['patient'].name}")
        print(f"总金额: ¥{bill['total_amount']}")
        print(f"账单明细:")
        for item in bill["items"]:
            print(f"  - {item['item_name']}: {item['quantity']}x¥{item['unit_price']} = ¥{item['subtotal']}")
        
        # 3. 发起支付宝支付
        payment_response = e2e_tester.client.post(
            f"/api/v1/finance/bills/{bill['id']}/initiate-online-payment",
        json={"provider": "alipay"},
            headers=e2e_tester.auth_headers
        )
        
        assert payment_response.status_code == 200
        payment_data = payment_response.json()
        
        # 验证支付链接
        assert "payment_url" in payment_data
        assert payment_data["provider"] == "alipay"
        assert "alipaydev.com" in payment_data["payment_url"]
        
        print(f"\n=== 支付信息 ===")
        print(f"支付方式: 支付宝")
        print(f"支付链接: {payment_data['payment_url'][:100]}...")
        
        # 4. 模拟用户完成支付 - 支付宝回调
        notification_data = {
            "out_trade_no": str(bill["id"]),
            "trade_no": "2023120122001234567890",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": bill["total_amount"],
            "buyer_email": "test@example.com",
            "buyer_id": "2088123456789012",
            "gmt_payment": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sign_type": "RSA2",
            "sign": "mock_signature_for_e2e_test"
        }
        
        webhook_response = e2e_tester.client.post(
            "/api/v1/finance/webhooks/alipay",
            data=notification_data
        )
        
        assert webhook_response.status_code == 200
        assert webhook_response.text == "success"
        
        print(f"\n=== 支付回调处理 ===")
        print(f"交易号: {notification_data['trade_no']}")
        print(f"支付状态: {notification_data['trade_status']}")
        print(f"支付时间: {notification_data['gmt_payment']}")
        
        # 5. 验证支付结果
        final_bill_response = e2e_tester.client.get(
            f"/api/v1/finance/bills/{bill['id']}",
            headers=e2e_tester.auth_headers
        )
        
        assert final_bill_response.status_code == 200
        final_bill = final_bill_response.json()
        
        # 验证账单状态已更新
        assert final_bill["status"] == "paid", f"账单状态未更新: {final_bill['status']}"
        assert len(final_bill["payments"]) == 1, f"支付记录数量错误: {len(final_bill['payments'])}"
        
        payment_record = final_bill["payments"][0]
        assert payment_record["payment_method"] == "alipay"
        assert Decimal(payment_record["amount"]) == Decimal(bill["total_amount"])
        
        print(f"\n=== 支付完成 ===")
        print(f"账单状态: {final_bill['status']}")
        print(f"支付金额: ¥{payment_record['amount']}")
        print(f"支付方式: {payment_record['payment_method']}")
        print(f"支付时间: {payment_record['payment_date']}")
        
        # 6. 验证库存更新（如果有药品）
        for prescription_detail in scenario["prescription_details"]:
            # 获取药品信息
            medicine_response = e2e_tester.client.get(
                f"/api/v1/pharmacy/drugs/{prescription_detail.drug_id}",
                headers=e2e_tester.auth_headers
            )
            
            # 获取库存信息
            stock_response = e2e_tester.client.get(
                f"/api/v1/pharmacy/inventory/drugs/{prescription_detail.drug_id}/stock",
                headers=e2e_tester.auth_headers
            )
            
            if medicine_response.status_code == 200 and stock_response.status_code == 200:
                medicine_data = medicine_response.json()
                stock_data = stock_response.json()
                # 库存应该减少了
                print(f"药品 {medicine_data['name']} 当前库存: {stock_data['current_stock']}")
    
    def test_partial_payment_scenario(self, e2e_tester: PaymentE2ETestSuite):
        """测试部分支付场景"""
        # 创建场景
        scenario = e2e_tester.create_realistic_patient_scenario()
        bill = e2e_tester.generate_bill_for_scenario(scenario)
        
        total_amount = Decimal(bill["total_amount"])
        first_payment = total_amount * Decimal("0.6")  # 支付60%
        second_payment = total_amount - first_payment   # 支付剩余40%
        
        print(f"\n=== 部分支付测试 ===")
        print(f"账单总额: ¥{total_amount}")
        print(f"第一次支付: ¥{first_payment}")
        print(f"第二次支付: ¥{second_payment}")
        
        # 第一次部分支付
        notification_data_1 = {
            "out_trade_no": str(bill["id"]),
            "trade_no": "2023120122001234567891",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": str(first_payment),
            "buyer_email": "test@example.com",
            "gmt_payment": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sign_type": "RSA2",
            "sign": "mock_signature_1"
        }
        
        webhook_response_1 = e2e_tester.client.post(
            "/api/v1/finance/webhooks/alipay",
            data=notification_data_1
        )
        
        assert webhook_response_1.status_code == 200
        
        # 验证部分支付状态
        bill_response_1 = e2e_tester.client.get(
            f"/api/v1/finance/bills/{bill['id']}",
            headers=e2e_tester.auth_headers
        )
        
        bill_after_first = bill_response_1.json()
        assert bill_after_first["status"] == "partially_paid"
        assert len(bill_after_first["payments"]) == 1
        
        print(f"第一次支付后状态: {bill_after_first['status']}")
        
        # 第二次支付完成剩余金额
        notification_data_2 = {
            "out_trade_no": str(bill["id"]),
            "trade_no": "2023120122001234567892",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": str(second_payment),
            "buyer_email": "test@example.com",
            "gmt_payment": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sign_type": "RSA2",
            "sign": "mock_signature_2"
        }
        
        webhook_response_2 = e2e_tester.client.post(
            "/api/v1/finance/webhooks/alipay",
            data=notification_data_2
        )
        
        assert webhook_response_2.status_code == 200
        
        # 验证完全支付状态
        bill_response_2 = e2e_tester.client.get(
            f"/api/v1/finance/bills/{bill['id']}",
            headers=e2e_tester.auth_headers
        )
        
        final_bill = bill_response_2.json()
        assert final_bill["status"] == "paid"
        assert len(final_bill["payments"]) == 2
        
        # 验证支付总额
        total_paid = sum(Decimal(payment["amount"]) for payment in final_bill["payments"])
        assert total_paid == total_amount
        
        print(f"最终状态: {final_bill['status']}")
        print(f"总支付金额: ¥{total_paid}")
    
    def test_payment_failure_and_retry(self, e2e_tester: PaymentE2ETestSuite):
        """测试支付失败和重试场景"""
        # 创建场景
        scenario = e2e_tester.create_realistic_patient_scenario()
        bill = e2e_tester.generate_bill_for_scenario(scenario)
        
        print(f"\n=== 支付失败和重试测试 ===")
        print(f"账单号: {bill['invoice_number']}")
        print(f"账单金额: ¥{bill['total_amount']}")
        
        # 1. 模拟支付失败
        failed_notification = {
            "out_trade_no": str(bill["id"]),
            "trade_no": "2023120122001234567893",
            "trade_status": "TRADE_CLOSED",  # 交易关闭
            "total_amount": bill["total_amount"],
            "buyer_email": "test@example.com",
            "sign_type": "RSA2",
            "sign": "mock_signature_failed"
        }
        
        webhook_response_failed = e2e_tester.client.post(
            "/api/v1/finance/webhooks/alipay",
            data=failed_notification
        )
        
        assert webhook_response_failed.status_code == 200
        
        # 验证账单状态未改变
        bill_response_after_fail = e2e_tester.client.get(
            f"/api/v1/finance/bills/{bill['id']}",
            headers=e2e_tester.auth_headers
        )
        
        bill_after_fail = bill_response_after_fail.json()
        assert bill_after_fail["status"] == "unpaid"
        assert len(bill_after_fail["payments"]) == 0
        
        print(f"支付失败后状态: {bill_after_fail['status']}")
        
        # 2. 重新发起支付
        retry_payment_response = e2e_tester.client.post(
            f"/api/v1/finance/bills/{bill['id']}/initiate-online-payment",
        json={"provider": "alipay"},
            headers=e2e_tester.auth_headers
        )
        
        assert retry_payment_response.status_code == 200
        retry_payment_data = retry_payment_response.json()
        
        print(f"重新发起支付成功")
        
        # 3. 模拟重试支付成功
        success_notification = {
            "out_trade_no": str(bill["id"]),
            "trade_no": "2023120122001234567894",
            "trade_status": "TRADE_SUCCESS",
            "total_amount": bill["total_amount"],
            "buyer_email": "test@example.com",
            "gmt_payment": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sign_type": "RSA2",
            "sign": "mock_signature_success"
        }
        
        webhook_response_success = e2e_tester.client.post(
            "/api/v1/finance/webhooks/alipay",
            data=success_notification
        )
        
        assert webhook_response_success.status_code == 200
        
        # 验证最终支付成功
        final_bill_response = e2e_tester.client.get(
            f"/api/v1/finance/bills/{bill['id']}",
            headers=e2e_tester.auth_headers
        )
        
        final_bill = final_bill_response.json()
        assert final_bill["status"] == "paid"
        assert len(final_bill["payments"]) == 1
        
        print(f"重试支付成功，最终状态: {final_bill['status']}")


class TestMultiPatientScenarios:
    """多患者场景测试"""
    
    @pytest.fixture
    def e2e_tester(self, client: TestClient, db: Session, admin_user: User):
        """端到端测试器"""
        return PaymentE2ETestSuite(client, db, admin_user)
    
    def test_concurrent_patient_payments(self, e2e_tester: PaymentE2ETestSuite):
        """测试并发患者支付"""
        import threading
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        # 创建多个患者场景
        scenarios = []
        bills = []
        
        for i in range(3):
            scenario = e2e_tester.create_realistic_patient_scenario()
            # 修改患者信息以区分
            scenario["patient"].name = f"患者{i+1}"
            scenario["patient"].contact_number = f"1391234567{i}"
            e2e_tester.db.commit()
            
            bill = e2e_tester.generate_bill_for_scenario(scenario)
            scenarios.append(scenario)
            bills.append(bill)
        
        print(f"\n=== 并发患者支付测试 ===")
        print(f"创建了{len(scenarios)}个患者场景")
        
        def process_patient_payment(index: int) -> Dict[str, Any]:
            """处理单个患者的支付流程"""
            scenario = scenarios[index]
            bill = bills[index]
            
            try:
                # 发起支付
                payment_response = e2e_tester.client.post(
                    f"/api/v1/finance/bills/{bill['id']}/initiate-online-payment",
        json={"provider": "alipay"},
                    headers=e2e_tester.auth_headers
                )
                
                if payment_response.status_code != 200:
                    return {"success": False, "error": "发起支付失败", "patient": scenario["patient"].name}
                
                # 模拟支付回调
                notification_data = {
                    "out_trade_no": str(bill["id"]),
                    "trade_no": f"202312012200123456789{index:03d}",
                    "trade_status": "TRADE_SUCCESS",
                    "total_amount": bill["total_amount"],
                    "buyer_email": "test@example.com",
                    "gmt_payment": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "sign_type": "RSA2",
                    "sign": f"mock_signature_{index}"
                }
                
                webhook_response = e2e_tester.client.post(
                    "/api/v1/finance/webhooks/alipay",
                    data=notification_data
                )
                
                if webhook_response.status_code != 200:
                    return {"success": False, "error": "回调处理失败", "patient": scenario["patient"].name}
                
                # 验证支付结果
                final_bill_response = e2e_tester.client.get(
                    f"/api/v1/finance/bills/{bill['id']}",
                    headers=e2e_tester.auth_headers
                )
                
                if final_bill_response.status_code != 200:
                    return {"success": False, "error": "获取账单失败", "patient": scenario["patient"].name}
                
                final_bill = final_bill_response.json()
                
                return {
                    "success": final_bill["status"] == "paid",
                    "patient": scenario["patient"].name,
                    "bill_id": bill["id"],
                    "amount": bill["total_amount"],
                    "status": final_bill["status"]
                }
                
            except Exception as e:
                return {"success": False, "error": str(e), "patient": scenario["patient"].name}
        
        # 并发执行支付流程
        results = []
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(process_patient_payment, i) for i in range(len(scenarios))]
            
            for future in as_completed(futures):
                results.append(future.result())
        
        # 分析结果
        successful_payments = [r for r in results if r["success"]]
        failed_payments = [r for r in results if not r["success"]]
        
        print(f"成功支付: {len(successful_payments)}")
        print(f"失败支付: {len(failed_payments)}")
        
        for result in successful_payments:
            print(f"  ✓ {result['patient']}: ¥{result['amount']} - {result['status']}")
        
        for result in failed_payments:
            print(f"  ✗ {result['patient']}: {result.get('error', '未知错误')}")
        
        # 断言所有支付都应该成功
        assert len(successful_payments) == len(scenarios), f"并发支付成功率: {len(successful_payments)}/{len(scenarios)}"


if __name__ == "__main__":
    # 运行端到端测试
    pytest.main([
        __file__,
        "-v",
        "-s",  # 显示print输出
        "--tb=short",
        "--disable-warnings"
    ])