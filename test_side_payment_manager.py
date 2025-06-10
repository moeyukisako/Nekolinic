#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
聚合支付模块测试用例
测试 sidePaymentManager 的前后端功能集成
"""

import pytest
import requests
import json
from datetime import datetime, timedelta
from decimal import Decimal

# 测试配置
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

# 测试用户凭据
TEST_USER = {
    "username": "admin",
    "password": "password"
}

class TestSidePaymentManager:
    """聚合支付模块测试类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_patient_id = None
        self.test_bills = []
        
    def setup(self):
        """测试前置设置"""
        print("\n=== 开始聚合支付模块测试 ===")
        
        # 1. 登录获取token
        self.login()
        
        # 2. 创建测试患者
        if not self.create_test_patient():
            raise Exception("创建患者失败")
        
        # 3. 创建测试账单
        self.create_test_bills()
        
    def login(self):
        """用户登录"""
        print("\n1. 测试用户登录...")
        
        login_data = {
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
        
        response = self.session.post(
            f"{API_BASE}/users/login",
            json=login_data
        )
        
        if response.status_code == 200:
            result = response.json()
            self.token = result.get("access_token")
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            print(f"✓ 登录成功，获取token: {self.token[:20]}...")
        else:
            print(f"✗ 登录失败: {response.status_code} - {response.text}")
            raise Exception("登录失败")
            
    def create_test_patient(self):
        """创建测试患者"""
        print("\n2. 创建测试患者...")
        
        try:
            patient_data = {
                "name": "测试患者-聚合支付",
                "gender": "male",
                "birth_date": "1990-01-01",
                "contact_number": "13800138000",
                "address": "测试地址123号"
            }
            
            response = self.session.post(
                f"{API_BASE}/patients",
                json=patient_data
            )
            
            print(f"发送请求到: {API_BASE}/patients")
            print(f"请求数据: {patient_data}")
            print(f"响应状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 201:
                result = response.json()
                self.test_patient_id = result["id"]
                print(f"✓ 创建测试患者成功，ID: {self.test_patient_id}")
            else:
                print(f"✗ 创建患者失败: {response.status_code} - {response.text}")
                print(f"请求头: {self.session.headers}")
                return False
        except Exception as e:
            print(f"✗ 创建患者异常: {str(e)}")
            return False
        
        return True
            
    def create_test_bills(self):
        """创建测试账单"""
        print("\n3. 创建测试账单...")
        
        # 创建多个测试账单
        bill_data_list = [
            {
                "patient_id": self.test_patient_id,
                "amount": "100.50",
                "description": "挂号费",
                "type": "registration"
            },
            {
                "patient_id": self.test_patient_id,
                "amount": "250.00",
                "description": "检查费",
                "type": "examination"
            },
            {
                "patient_id": self.test_patient_id,
                "amount": "89.90",
                "description": "药费",
                "type": "medicine"
            }
        ]
        
        for i, bill_data in enumerate(bill_data_list, 1):
            response = self.session.post(
                f"{API_BASE}/finance/bills",
                json=bill_data
            )
            
            if response.status_code == 201:
                result = response.json()
                self.test_bills.append(result)
                print(f"✓ 创建测试账单{i}成功，ID: {result['id']}, 金额: ¥{result['amount']}")
            else:
                print(f"✗ 创建账单{i}失败: {response.status_code} - {response.text}")
                
        print(f"总计创建 {len(self.test_bills)} 个测试账单")
        
    def test_patient_search(self):
        """测试患者搜索功能"""
        print("\n4. 测试患者搜索功能...")
        
        # 测试按姓名搜索
        search_query = "测试患者"
        response = self.session.get(
            f"{API_BASE}/patients",
            params={"name": search_query, "limit": 10}
        )
        
        if response.status_code == 200:
            result = response.json()
            patients = result.get("items", [])
            
            # 检查是否找到测试患者
            found_patient = None
            for patient in patients:
                if patient["id"] == self.test_patient_id:
                    found_patient = patient
                    break
                    
            if found_patient:
                print(f"✓ 患者搜索成功，找到患者: {found_patient['name']} (ID: {found_patient['id']})")
                return True
            else:
                print(f"✗ 未找到测试患者，搜索结果: {len(patients)} 个患者")
                return False
        else:
            print(f"✗ 患者搜索失败: {response.status_code} - {response.text}")
            return False
            
    def test_get_unpaid_bills(self):
        """测试获取患者未支付账单"""
        print("\n5. 测试获取患者未支付账单...")
        
        response = self.session.get(
            f"{API_BASE}/finance/patients/{self.test_patient_id}/unpaid-bills"
        )
        
        if response.status_code == 200:
            bills = response.json()
            print(f"✓ 获取未支付账单成功，共 {len(bills)} 个账单")
            
            total_amount = sum(float(bill.get("amount", 0)) for bill in bills)
            print(f"  总金额: ¥{total_amount:.2f}")
            
            # 验证账单详情
            for bill in bills:
                print(f"  - 账单ID: {bill['id']}, 金额: ¥{bill['amount']}, 描述: {bill.get('description', '无')}")
                
            return bills
        else:
            print(f"✗ 获取未支付账单失败: {response.status_code} - {response.text}")
            return []
            
    def test_create_merged_payment_session(self, bills):
        """测试创建合并支付会话"""
        print("\n6. 测试创建合并支付会话...")
        
        if not bills:
            print("✗ 没有可用的账单创建支付会话")
            return None
            
        # 选择前两个账单进行合并支付
        selected_bills = bills[:2]
        bill_ids = [bill["id"] for bill in selected_bills]
        total_amount = sum(float(bill["amount"]) for bill in selected_bills)
        
        session_data = {
            "billIds": bill_ids,
            "totalAmount": total_amount,
            "patientId": self.test_patient_id
        }
        
        response = self.session.post(
            f"{API_BASE}/finance/sessions",
            json=session_data
        )
        
        if response.status_code == 201:
            result = response.json()
            session_id = result.get("session_id")
            print(f"✓ 创建合并支付会话成功")
            print(f"  会话ID: {session_id}")
            print(f"  总金额: ¥{result.get('total_amount', 0):.2f}")
            print(f"  包含账单: {len(bill_ids)} 个")
            
            # 检查是否有二维码
            if "qr_code" in result:
                print(f"  二维码: {result['qr_code'][:50]}...")
            else:
                print("  注意: 未生成二维码")
                
            return result
        else:
            print(f"✗ 创建合并支付会话失败: {response.status_code} - {response.text}")
            return None
            
    def test_get_payment_session_status(self, session):
        """测试获取支付会话状态"""
        print("\n7. 测试获取支付会话状态...")
        
        if not session:
            print("✗ 没有可用的支付会话")
            return False
            
        session_id = session.get("session_id")
        response = self.session.get(
            f"{API_BASE}/finance/sessions/{session_id}"
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 获取支付会话状态成功")
            print(f"  会话ID: {result.get('session_id')}")
            print(f"  状态: {result.get('status')}")
            print(f"  总金额: ¥{result.get('total_amount', 0):.2f}")
            print(f"  创建时间: {result.get('created_at')}")
            
            return True
        else:
            print(f"✗ 获取支付会话状态失败: {response.status_code} - {response.text}")
            return False
            
    def test_frontend_integration(self):
        """测试前端集成"""
        print("\n8. 测试前端集成...")
        
        # 访问前端页面
        try:
            response = requests.get(f"{BASE_URL}/frontend/dashboard.html")
            if response.status_code == 200:
                print("✓ 前端页面访问正常")
                
                # 检查是否包含聚合支付模块相关内容
                content = response.text
                if "sidePaymentManager" in content or "聚合支付" in content:
                    print("✓ 前端页面包含聚合支付模块")
                else:
                    print("! 前端页面可能未包含聚合支付模块")
                    
                return True
            else:
                print(f"✗ 前端页面访问失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ 前端页面访问异常: {e}")
            return False
            
    def cleanup(self):
        """清理测试数据"""
        print("\n9. 清理测试数据...")
        
        # 删除测试账单
        for bill in self.test_bills:
            try:
                response = self.session.delete(f"{API_BASE}/finance/bills/{bill['id']}")
                if response.status_code in [200, 204]:
                    print(f"✓ 删除测试账单 {bill['id']} 成功")
                else:
                    print(f"! 删除测试账单 {bill['id']} 失败: {response.status_code}")
            except Exception as e:
                print(f"! 删除测试账单 {bill['id']} 异常: {e}")
                
        # 删除测试患者
        if self.test_patient_id:
            try:
                response = self.session.delete(f"{API_BASE}/patients/{self.test_patient_id}")
                if response.status_code in [200, 204]:
                    print(f"✓ 删除测试患者 {self.test_patient_id} 成功")
                else:
                    print(f"! 删除测试患者 {self.test_patient_id} 失败: {response.status_code}")
            except Exception as e:
                print(f"! 删除测试患者 {self.test_patient_id} 异常: {e}")
                
    def run_all_tests(self):
        """运行所有测试"""
        try:
            # 设置测试环境
            self.setup()
            
            # 执行测试用例
            test_results = {
                "patient_search": self.test_patient_search(),
                "get_unpaid_bills": False,
                "create_payment_session": False,
                "get_payment_status": False,
                "frontend_integration": self.test_frontend_integration()
            }
            
            # 测试获取未支付账单
            bills = self.test_get_unpaid_bills()
            test_results["get_unpaid_bills"] = len(bills) > 0
            
            # 测试创建支付会话
            if bills:
                session = self.test_create_merged_payment_session(bills)
                test_results["create_payment_session"] = session is not None
                
                # 测试获取支付状态
                if session:
                    test_results["get_payment_status"] = self.test_get_payment_session_status(session)
                    
            # 输出测试结果
            print("\n=== 测试结果汇总 ===")
            passed = 0
            total = len(test_results)
            
            for test_name, result in test_results.items():
                status = "✓ 通过" if result else "✗ 失败"
                print(f"{test_name}: {status}")
                if result:
                    passed += 1
                    
            print(f"\n总计: {passed}/{total} 个测试通过")
            
            if passed == total:
                print("🎉 所有测试通过！聚合支付模块功能正常。")
            else:
                print(f"⚠️  有 {total - passed} 个测试失败，请检查相关功能。")
                
        except Exception as e:
            print(f"\n❌ 测试执行异常: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            # 清理测试数据
            self.cleanup()
            print("\n=== 聚合支付模块测试完成 ===")

def main():
    """主函数"""
    print("聚合支付模块功能测试")
    print("=" * 50)
    
    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print(f"✓ 服务器运行正常: {BASE_URL}")
        else:
            print(f"⚠️  服务器响应异常: {response.status_code}")
    except Exception as e:
        print(f"❌ 无法连接到服务器: {e}")
        print(f"请确保服务器在 {BASE_URL} 上运行")
        return
        
    # 运行测试
    tester = TestSidePaymentManager()
    tester.run_all_tests()

if __name__ == "__main__":
    main()