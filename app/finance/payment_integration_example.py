#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
支付集成示例
演示如何使用支付宝和微信支付SDK
"""

# 标准包导入 - 支付宝SDK
from alipay.aop.api.AlipayClientConfig import AlipayClientConfig
from alipay.aop.api.DefaultAlipayClient import DefaultAlipayClient
from alipay.aop.api.request.AlipayTradePagePayRequest import AlipayTradePagePayRequest
from alipay.aop.api.request.AlipayTradeQueryRequest import AlipayTradeQueryRequest

# 标准包导入 - 微信支付SDK
from wechatpayv3 import WeChatPay, WeChatPayType


class PaymentService:
    """支付服务类"""
    
    def __init__(self):
        self.alipay_client = None
        self.wechat_client = None
    
    def init_alipay(self, app_id, private_key, alipay_public_key, debug=True):
        """初始化支付宝客户端"""
        alipay_client_config = AlipayClientConfig()
        alipay_client_config.server_url = 'https://openapi.alipaydev.com/gateway.do' if debug else 'https://openapi.alipay.com/gateway.do'
        alipay_client_config.app_id = app_id
        alipay_client_config.app_private_key = private_key
        alipay_client_config.alipay_public_key = alipay_public_key
        
        self.alipay_client = DefaultAlipayClient(alipay_client_config=alipay_client_config)
        return self.alipay_client
    
    def init_wechat(self, mchid, private_key, cert_serial_no, apiv3_key, appid):
        """初始化微信支付客户端"""
        self.wechat_client = WeChatPay(
            wechatpay_type=WeChatPayType.NATIVE,
            mchid=mchid,
            private_key=private_key,
            cert_serial_no=cert_serial_no,
            apiv3_key=apiv3_key,
            appid=appid,
            notify_url="https://your-domain.com/notify",  # 回调地址
        )
        return self.wechat_client
    
    def create_alipay_order(self, out_trade_no, total_amount, subject, body=None):
        """创建支付宝订单"""
        if not self.alipay_client:
            raise ValueError("支付宝客户端未初始化")
        
        request = AlipayTradePagePayRequest()
        request.notify_url = "https://your-domain.com/notify"
        request.return_url = "https://your-domain.com/return"
        
        biz_content = {
            "out_trade_no": out_trade_no,
            "total_amount": str(total_amount),
            "subject": subject,
            "body": body or subject,
            "product_code": "FAST_INSTANT_TRADE_PAY"
        }
        request.biz_content = biz_content
        
        response = self.alipay_client.page_execute(request, http_method="GET")
        return response
    
    def create_wechat_order(self, out_trade_no, total, description):
        """创建微信支付订单"""
        if not self.wechat_client:
            raise ValueError("微信支付客户端未初始化")
        
        code, message = self.wechat_client.pay(
            description=description,
            out_trade_no=out_trade_no,
            amount={'total': total, 'currency': 'CNY'}
        )
        return code, message
    
    def query_alipay_order(self, out_trade_no):
        """查询支付宝订单状态"""
        if not self.alipay_client:
            raise ValueError("支付宝客户端未初始化")
        
        request = AlipayTradeQueryRequest()
        request.biz_content = {"out_trade_no": out_trade_no}
        
        response = self.alipay_client.execute(request)
        return response
    
    def verify_alipay_callback(self, data, signature):
        """验证支付宝回调"""
        if not self.alipay_client:
            raise ValueError("支付宝客户端未初始化")
        
        # 这里需要根据实际的SDK方法进行验证
        # 具体实现需要参考支付宝SDK文档
        return True  # 示例返回
    
    def verify_wechat_callback(self, headers, body):
        """验证微信支付回调"""
        if not self.wechat_client:
            raise ValueError("微信支付客户端未初始化")
        
        return self.wechat_client.callback(headers, body)


# 使用示例
if __name__ == "__main__":
    payment_service = PaymentService()
    
    # 支付宝配置示例（需要替换为实际配置）
    alipay_config = {
        'app_id': 'your_app_id',
        'private_key': 'your_private_key',
        'alipay_public_key': 'alipay_public_key',
        'debug': True  # 沙箱模式
    }
    
    # 微信支付配置示例（需要替换为实际配置）
    wechat_config = {
        'mchid': 'your_mchid',
        'private_key': 'your_private_key',
        'cert_serial_no': 'your_cert_serial_no',
        'apiv3_key': 'your_apiv3_key',
        'appid': 'your_appid'
    }
    
    print("支付集成示例已创建")
    print("请根据实际配置修改相关参数")
    print("支付宝SDK版本: alipay-sdk-python")
    print("微信支付SDK版本: wechatpayv3")
    print("所有库已通过标准方式安装和导入")