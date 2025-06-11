#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
支付宝集成测试脚本

使用方法:
1. 确保已安装所有依赖: pip install -r requirements.txt
2. 配置 .env 文件中的支付宝参数
3. 运行测试: python test_alipay_integration.py
"""

import os
import sys
import json
from datetime import datetime
from decimal import Decimal

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.finance.payment_gateway import AlipayGateway
from app.finance import models

def test_alipay_config():
    """测试支付宝配置"""
    print("=== 支付宝配置测试 ===")
    
    # 检查必要的配置项
    config_items = [
        ('ALIPAY_APP_ID', settings.ALIPAY_APP_ID),
        ('ALIPAY_APP_PRIVATE_KEY_STRING', settings.ALIPAY_APP_PRIVATE_KEY_STRING[:50] + '...'),
        ('ALIPAY_PUBLIC_KEY_STRING', settings.ALIPAY_PUBLIC_KEY_STRING[:50] + '...'),
    ]
    
    for name, value in config_items:
        if value and value != f"your_{name.lower()}":
            print(f"✓ {name}: 已配置")
        else:
            print(f"✗ {name}: 未配置或使用默认值")
            return False
    
    return True

def test_alipay_gateway_init():
    """测试支付宝网关初始化"""
    print("\n=== 支付宝网关初始化测试 ===")
    
    try:
        gateway = AlipayGateway()
        print(f"✓ 网关初始化成功")
        print(f"  - APP ID: {gateway.app_id}")
        print(f"  - 网关URL: {gateway.gateway_url}")
        print(f"  - 通知URL: {gateway.notify_url}")
        print(f"  - 返回URL: {gateway.return_url}")
        return gateway
    except Exception as e:
        print(f"✗ 网关初始化失败: {e}")
        return None

def test_sign_generation(gateway):
    """测试签名生成"""
    print("\n=== 签名生成测试 ===")
    
    try:
        # 测试参数
        test_params = {
            "app_id": gateway.app_id,
            "method": "alipay.trade.precreate",
            "charset": "utf-8",
            "sign_type": "RSA2",
            "timestamp": "2023-01-01 12:00:00",
            "version": "1.0",
            "biz_content": '{"out_trade_no":"test123","total_amount":"0.01","subject":"测试订单"}'
        }
        
        sign = gateway._generate_sign(test_params)
        print(f"✓ 签名生成成功")
        print(f"  - 签名长度: {len(sign)}")
        print(f"  - 签名前缀: {sign[:20]}...")
        return True
    except Exception as e:
        print(f"✗ 签名生成失败: {e}")
        return False

def test_qr_payment_creation(gateway):
    """测试二维码支付创建"""
    print("\n=== 二维码支付创建测试 ===")
    
    try:
        # 创建测试账单
        test_bill = type('TestBill', (), {
            'id': 'test_bill_123',
            'amount': Decimal('0.01'),  # 1分钱用于测试
            'description': '支付宝集成测试订单',
            'patient_name': '测试患者',
            'created_at': datetime.now()
        })()
        
        # 创建二维码支付
        result = gateway.create_qr_payment(test_bill)
        
        print(f"✓ 二维码支付创建成功")
        print(f"  - 订单号: {result.get('out_trade_no')}")
        print(f"  - 二维码内容: {result.get('qr_code')[:50]}...")
        print(f"  - 支付金额: {result.get('total_amount')}")
        
        return result
    except Exception as e:
        print(f"✗ 二维码支付创建失败: {e}")
        print(f"  错误详情: {str(e)}")
        return None

def test_payment_query(gateway, out_trade_no):
    """测试支付状态查询"""
    print("\n=== 支付状态查询测试 ===")
    
    try:
        result = gateway.query_payment_status(out_trade_no)
        
        print(f"✓ 支付状态查询成功")
        print(f"  - 交易状态: {result.get('trade_status')}")
        print(f"  - 订单号: {result.get('out_trade_no')}")
        print(f"  - 支付宝交易号: {result.get('trade_no', '未生成')}")
        print(f"  - 订单金额: {result.get('total_amount')}")
        
        return result
    except Exception as e:
        print(f"✗ 支付状态查询失败: {e}")
        return None

def test_notification_verification(gateway):
    """测试异步通知验证"""
    print("\n=== 异步通知验证测试 ===")
    
    # 模拟支付宝异步通知数据
    test_notification = {
        "gmt_create": "2023-01-01 12:00:00",
        "charset": "utf-8",
        "gmt_payment": "2023-01-01 12:01:00",
        "notify_time": "2023-01-01 12:01:30",
        "subject": "测试订单",
        "sign": "test_signature",
        "buyer_id": "2088000000000000",
        "invoice_amount": "0.01",
        "version": "1.0",
        "notify_id": "test_notify_id",
        "fund_bill_list": '[{"amount":"0.01","fundChannel":"ALIPAYACCOUNT"}]',
        "notify_type": "trade_status_sync",
        "out_trade_no": "test_order_123",
        "total_amount": "0.01",
        "trade_status": "TRADE_SUCCESS",
        "trade_no": "2023010122001000000000000000",
        "auth_app_id": gateway.app_id,
        "receipt_amount": "0.01",
        "point_amount": "0.00",
        "app_id": gateway.app_id,
        "buyer_pay_amount": "0.01",
        "sign_type": "RSA2",
        "seller_id": "2088000000000000"
    }
    
    try:
        # 注意：这个测试会失败，因为我们使用的是模拟签名
        # 在实际环境中，需要使用真实的支付宝通知数据
        is_valid = gateway.verify_notification(test_notification.copy())
        
        if is_valid:
            print(f"✓ 异步通知验证成功")
        else:
            print(f"⚠ 异步通知验证失败（预期结果，因为使用模拟数据）")
            print(f"  在实际环境中，请使用真实的支付宝通知数据进行测试")
        
        return is_valid
    except Exception as e:
        print(f"✗ 异步通知验证出错: {e}")
        return False

def main():
    """主测试函数"""
    print("支付宝集成测试开始...\n")
    
    # 1. 测试配置
    if not test_alipay_config():
        print("\n❌ 配置测试失败，请检查 .env 文件中的支付宝配置")
        print("参考 alipay_config_example.md 文件进行配置")
        return
    
    # 2. 测试网关初始化
    gateway = test_alipay_gateway_init()
    if not gateway:
        print("\n❌ 网关初始化失败")
        return
    
    # 3. 测试签名生成
    if not test_sign_generation(gateway):
        print("\n❌ 签名生成测试失败")
        return
    
    # 4. 测试二维码支付创建
    payment_result = test_qr_payment_creation(gateway)
    if not payment_result:
        print("\n❌ 二维码支付创建测试失败")
        print("\n可能的原因:")
        print("1. 网络连接问题")
        print("2. 支付宝配置错误")
        print("3. 沙箱环境未正确配置")
        return
    
    # 5. 测试支付状态查询
    out_trade_no = payment_result.get('out_trade_no')
    if out_trade_no:
        test_payment_query(gateway, out_trade_no)
    
    # 6. 测试异步通知验证
    test_notification_verification(gateway)
    
    print("\n=== 测试总结 ===")
    print("✅ 支付宝集成基础功能测试完成")
    print("\n下一步:")
    print("1. 使用沙箱版支付宝APP扫描生成的二维码进行支付测试")
    print("2. 检查异步通知回调是否正常接收")
    print("3. 验证支付状态查询功能")
    print("4. 完成测试后，配置生产环境参数")

if __name__ == "__main__":
    main()