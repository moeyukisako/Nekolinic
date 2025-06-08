#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
在线支付性能和压力测试脚本
测试支付系统在高并发和大量数据情况下的性能表现
"""

import pytest
import asyncio
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import patch
import statistics
from typing import List, Dict, Any

from app.finance import models, schemas
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.user.models import User
from app.core.context import current_user_id
from app.finance import service


class PaymentPerformanceTest:
    """支付性能测试基类"""
    
    def __init__(self, client: TestClient, db: Session, admin_user: User):
        self.client = client
        self.db = db
        self.admin_user = admin_user
        self.auth_headers = self._get_auth_headers()
        self.test_results = []
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """获取认证头"""
        login_response = self.client.post(
            "/api/v1/users/token",
            data={"username": self.admin_user.username, "password": "password123"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def create_test_data(self, count: int) -> List[models.Bill]:
        """批量创建测试数据"""
        token = current_user_id.set(self.admin_user.id)
        bills = []
        
        try:
            # 创建测试患者
            patient = patient_models.Patient(
                name=f"性能测试患者",
                gender="male",
                birth_date=date(1990, 1, 1),
                contact_number="13800138000",
                address="性能测试地址"
            )
            self.db.add(patient)
            self.db.commit()
            self.db.refresh(patient)
            
            # 创建测试医生
            doctor = clinic_models.Doctor(
                name="性能测试医生",
                specialty="内科",
                user_id=self.admin_user.id
            )
            self.db.add(doctor)
            self.db.commit()
            self.db.refresh(doctor)
            
            # 批量创建账单和对应的病历
            for i in range(count):
                # 为每个账单创建独立的病历记录
                record = patient_models.MedicalRecord(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    symptoms=f"性能测试症状-{i}",
                    diagnosis=f"性能测试诊断-{i}",
                    treatment_plan=f"性能测试治疗方案-{i}",
                    notes=f"性能测试备注-{i}",
                    record_date=datetime.now()
                )
                self.db.add(record)
                self.db.commit()
                self.db.refresh(record)
                
                bill = models.Bill(
                    invoice_number=f"PERF-TEST-{i:06d}",
                    bill_date=datetime.now(),
                    total_amount=Decimal(f"{100 + i % 500}.{i % 100:02d}"),
                    status="unpaid",
                    patient_id=patient.id,
                    medical_record_id=record.id,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    created_by_id=self.admin_user.id,
                    updated_by_id=self.admin_user.id
                )
                self.db.add(bill)
                bills.append(bill)
                
                # 每100条提交一次，避免内存过大
                if (i + 1) % 100 == 0:
                    self.db.commit()
                    for b in bills[-100:]:
                        self.db.refresh(b)
            
            self.db.commit()
            for bill in bills:
                self.db.refresh(bill)
            
            return bills
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def measure_response_time(self, func, *args, **kwargs) -> Dict[str, Any]:
        """测量响应时间"""
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            return {
                "success": True,
                "response_time": end_time - start_time,
                "result": result
            }
        except Exception as e:
            end_time = time.time()
            return {
                "success": False,
                "response_time": end_time - start_time,
                "error": str(e)
            }
    
    def analyze_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析测试结果"""
        successful_results = [r for r in results if r["success"]]
        failed_results = [r for r in results if not r["success"]]
        
        if not successful_results:
            return {
                "total_requests": len(results),
                "successful_requests": 0,
                "failed_requests": len(failed_results),
                "success_rate": 0.0,
                "errors": [r["error"] for r in failed_results]
            }
        
        response_times = [r["response_time"] for r in successful_results]
        
        return {
            "total_requests": len(results),
            "successful_requests": len(successful_results),
            "failed_requests": len(failed_results),
            "success_rate": len(successful_results) / len(results) * 100,
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "median_response_time": statistics.median(response_times),
            "p95_response_time": statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times),
            "p99_response_time": statistics.quantiles(response_times, n=100)[98] if len(response_times) > 100 else max(response_times),
            "errors": [r["error"] for r in failed_results]
        }


class TestPaymentConcurrency:
    """支付并发测试"""
    
    @pytest.fixture
    def performance_tester(self, client: TestClient, db: Session, admin_user: User):
        """性能测试器"""
        return PaymentPerformanceTest(client, db, admin_user)
    
    def test_concurrent_payment_initiation(self, performance_tester: PaymentPerformanceTest):
        """测试并发发起支付"""
        # 创建测试数据
        bills = performance_tester.create_test_data(50)
        
        def initiate_payment(bill_id: int) -> Dict[str, Any]:
            """发起支付的函数"""
            response = performance_tester.client.post(
                f"/api/v1/finance/bills/{bill_id}/initiate-online-payment",
            json={"provider": "alipay"},
                headers=performance_tester.auth_headers
            )
            return {
                "status_code": response.status_code,
                "response_data": response.json() if response.status_code == 200 else None
            }
        
        # 并发测试
        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(
                    performance_tester.measure_response_time,
                    initiate_payment,
                    bill.id
                )
                for bill in bills[:20]  # 测试20个并发请求
            ]
            
            for future in as_completed(futures):
                results.append(future.result())
        
        # 分析结果
        analysis = performance_tester.analyze_results(results)
        
        print(f"\n=== 并发支付发起测试结果 ===")
        print(f"总请求数: {analysis['total_requests']}")
        print(f"成功请求数: {analysis['successful_requests']}")
        print(f"失败请求数: {analysis['failed_requests']}")
        print(f"成功率: {analysis['success_rate']:.2f}%")
        print(f"平均响应时间: {analysis['avg_response_time']:.3f}s")
        print(f"最小响应时间: {analysis['min_response_time']:.3f}s")
        print(f"最大响应时间: {analysis['max_response_time']:.3f}s")
        print(f"P95响应时间: {analysis['p95_response_time']:.3f}s")
        
        # 断言性能要求
        assert analysis['success_rate'] >= 95.0, f"成功率过低: {analysis['success_rate']:.2f}%"
        assert analysis['avg_response_time'] <= 2.0, f"平均响应时间过长: {analysis['avg_response_time']:.3f}s"
        assert analysis['p95_response_time'] <= 5.0, f"P95响应时间过长: {analysis['p95_response_time']:.3f}s"
    
    def test_concurrent_webhook_processing(self, performance_tester: PaymentPerformanceTest):
        """测试并发处理支付回调"""
        # 创建测试数据
        bills = performance_tester.create_test_data(30)
        
        def process_webhook(bill_id: int, trade_no: str) -> Dict[str, Any]:
            """处理支付回调的函数"""
            form_data = {
                "out_trade_no": str(bill_id),
                "trade_no": trade_no,
                "trade_status": "TRADE_SUCCESS",
                "total_amount": "100.00",
                "buyer_email": "test@example.com",
                "sign_type": "RSA2",
                "sign": "mock_signature"
            }
            
            response = performance_tester.client.post(
                "/api/v1/finance/webhooks/alipay",
                data=form_data
            )
            return {
                "status_code": response.status_code,
                "response_text": response.text
            }
        
        # 并发测试
        results = []
        with ThreadPoolExecutor(max_workers=15) as executor:
            futures = [
                executor.submit(
                    performance_tester.measure_response_time,
                    process_webhook,
                    bill.id,
                    f"202312012200123456789{i:03d}"
                )
                for i, bill in enumerate(bills[:15])  # 测试15个并发回调
            ]
            
            for future in as_completed(futures):
                results.append(future.result())
        
        # 分析结果
        analysis = performance_tester.analyze_results(results)
        
        print(f"\n=== 并发回调处理测试结果 ===")
        print(f"总请求数: {analysis['total_requests']}")
        print(f"成功请求数: {analysis['successful_requests']}")
        print(f"失败请求数: {analysis['failed_requests']}")
        print(f"成功率: {analysis['success_rate']:.2f}%")
        print(f"平均响应时间: {analysis['avg_response_time']:.3f}s")
        print(f"最大响应时间: {analysis['max_response_time']:.3f}s")
        
        # 断言性能要求
        assert analysis['success_rate'] >= 98.0, f"回调处理成功率过低: {analysis['success_rate']:.2f}%"
        assert analysis['avg_response_time'] <= 1.0, f"回调处理平均响应时间过长: {analysis['avg_response_time']:.3f}s"


class TestPaymentLoad:
    """支付负载测试"""
    
    @pytest.fixture
    def performance_tester(self, client: TestClient, db: Session, admin_user: User):
        """性能测试器"""
        return PaymentPerformanceTest(client, db, admin_user)
    
    def test_large_volume_payment_processing(self, performance_tester: PaymentPerformanceTest):
        """测试大量支付处理"""
        # 创建大量测试数据
        bills = performance_tester.create_test_data(100)
        
        # 模拟大量支付通知处理
        token = current_user_id.set(performance_tester.admin_user.id)
        
        try:
            start_time = time.time()
            processed_count = 0
            
            for i, bill in enumerate(bills):
                notification_data = {
                    "out_trade_no": str(bill.id),
                    "trade_no": f"202312012200123456789{i:06d}",
                    "trade_status": "TRADE_SUCCESS",
                    "total_amount": str(bill.total_amount),
                    "buyer_email": "test@example.com",
                    "gmt_payment": "2023-12-01 10:30:00",
                    "sign": "test_signature",
                    "sign_type": "RSA2"
                }
                
                try:
                    service.online_payment_service.process_alipay_notification(
                        performance_tester.db, notification_data
                    )
                    processed_count += 1
                except Exception as e:
                    print(f"处理第{i}个通知失败: {e}")
                
                # 每10个提交一次数据库事务
                if (i + 1) % 10 == 0:
                    performance_tester.db.commit()
            
            end_time = time.time()
            total_time = end_time - start_time
            
            print(f"\n=== 大量支付处理测试结果 ===")
            print(f"总处理数量: {len(bills)}")
            print(f"成功处理数量: {processed_count}")
            print(f"处理成功率: {processed_count / len(bills) * 100:.2f}%")
            print(f"总处理时间: {total_time:.3f}s")
            print(f"平均处理时间: {total_time / len(bills):.3f}s/笔")
            print(f"处理吞吐量: {processed_count / total_time:.2f}笔/秒")
            
            # 验证处理结果
            payment_count = performance_tester.db.query(models.Payment).filter(
                models.Payment.payment_method == "alipay"
            ).count()
            
            assert payment_count == processed_count, f"支付记录数量不匹配: {payment_count} != {processed_count}"
            assert processed_count / len(bills) >= 0.95, f"处理成功率过低: {processed_count / len(bills) * 100:.2f}%"
            assert total_time / len(bills) <= 0.1, f"平均处理时间过长: {total_time / len(bills):.3f}s/笔"
            
        finally:
            if token:
                current_user_id.reset(token)
    
    def test_memory_usage_under_load(self, performance_tester: PaymentPerformanceTest):
        """测试负载下的内存使用情况"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 创建大量测试数据
        bills = performance_tester.create_test_data(200)
        
        # 执行大量操作
        for i in range(50):
            # 发起支付
            try:
                response = performance_tester.client.post(
                    f"/api/v1/finance/bills/{bills[i % len(bills)].id}/initiate-online-payment",
            json={"provider": "alipay"},
                    headers=performance_tester.auth_headers
                )
            except Exception:
                pass
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        print(f"\n=== 内存使用测试结果 ===")
        print(f"初始内存使用: {initial_memory:.2f} MB")
        print(f"最终内存使用: {final_memory:.2f} MB")
        print(f"内存增长: {memory_increase:.2f} MB")
        
        # 内存增长不应超过100MB
        assert memory_increase <= 100, f"内存增长过多: {memory_increase:.2f} MB"


class TestPaymentStress:
    """支付压力测试"""
    
    @pytest.fixture
    def performance_tester(self, client: TestClient, db: Session, admin_user: User):
        """性能测试器"""
        return PaymentPerformanceTest(client, db, admin_user)
    
    def test_sustained_load(self, performance_tester: PaymentPerformanceTest):
        """测试持续负载"""
        # 创建测试数据
        bills = performance_tester.create_test_data(20)
        
        # 持续负载测试 - 30秒
        duration = 30  # 秒
        start_time = time.time()
        request_count = 0
        success_count = 0
        
        while time.time() - start_time < duration:
            bill = bills[request_count % len(bills)]
            
            try:
                response = performance_tester.client.post(
                    f"/api/v1/finance/bills/{bill.id}/initiate-online-payment",
            json={"provider": "alipay"},
                    headers=performance_tester.auth_headers
                )
                if response.status_code == 200:
                    success_count += 1
            except Exception:
                pass
            
            request_count += 1
            time.sleep(0.1)  # 100ms间隔
        
        actual_duration = time.time() - start_time
        
        print(f"\n=== 持续负载测试结果 ===")
        print(f"测试持续时间: {actual_duration:.2f}s")
        print(f"总请求数: {request_count}")
        print(f"成功请求数: {success_count}")
        print(f"成功率: {success_count / request_count * 100:.2f}%")
        print(f"平均QPS: {request_count / actual_duration:.2f}")
        print(f"成功QPS: {success_count / actual_duration:.2f}")
        
        # 断言性能要求
        assert success_count / request_count >= 0.9, f"持续负载下成功率过低: {success_count / request_count * 100:.2f}%"
        assert request_count / actual_duration >= 5, f"QPS过低: {request_count / actual_duration:.2f}"
    
    def test_burst_load(self, performance_tester: PaymentPerformanceTest):
        """测试突发负载"""
        # 创建测试数据
        bills = performance_tester.create_test_data(50)
        
        # 突发负载测试 - 短时间内大量请求
        def burst_request(bill_id: int) -> bool:
            """突发请求函数"""
            try:
                response = performance_tester.client.post(
                    f"/api/v1/finance/bills/{bill_id}/initiate-online-payment",
            json={"provider": "alipay"},
                    headers=performance_tester.auth_headers
                )
                return response.status_code == 200
            except Exception:
                return False
        
        # 使用线程池模拟突发负载
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [
                executor.submit(burst_request, bill.id)
                for bill in bills[:30]  # 30个突发请求
            ]
            
            results = [future.result() for future in as_completed(futures)]
        
        end_time = time.time()
        duration = end_time - start_time
        success_count = sum(results)
        
        print(f"\n=== 突发负载测试结果 ===")
        print(f"突发请求数: {len(results)}")
        print(f"成功请求数: {success_count}")
        print(f"成功率: {success_count / len(results) * 100:.2f}%")
        print(f"突发处理时间: {duration:.3f}s")
        print(f"突发QPS: {len(results) / duration:.2f}")
        
        # 断言性能要求
        assert success_count / len(results) >= 0.8, f"突发负载下成功率过低: {success_count / len(results) * 100:.2f}%"
        assert duration <= 10, f"突发负载处理时间过长: {duration:.3f}s"


if __name__ == "__main__":
    # 运行性能测试
    pytest.main([
        __file__,
        "-v",
        "-s",  # 显示print输出
        "--tb=short",
        "--disable-warnings"
    ])