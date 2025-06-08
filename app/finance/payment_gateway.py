# app/finance/payment_gateway.py
"""
支付网关服务
处理与第三方支付平台的交互
"""

from typing import Dict, Any, Optional
from decimal import Decimal
import hashlib
import json
import time
from urllib.parse import urlencode
from datetime import datetime, timedelta, UTC
import qrcode
import io
import base64

from app.core.config import settings
from . import models


class AlipayGateway:
    """支付宝支付网关"""
    
    def __init__(self):
        self.app_id = settings.ALIPAY_APP_ID
        self.app_private_key = settings.ALIPAY_APP_PRIVATE_KEY_STRING.replace("\\n", "\n")
        self.alipay_public_key = settings.ALIPAY_PUBLIC_KEY_STRING.replace("\\n", "\n")
        self.gateway_url = "https://openapi.alipaydev.com/gateway.do"  # 沙箱环境
        # 生产环境使用: https://openapi.alipay.com/gateway.do
        self.notify_url = f"{settings.APP_BACKEND_URL}/api/v1/finance/webhooks/alipay"
        self.return_url = f"{settings.APP_FRONTEND_URL}/payment-success"
    
    def create_payment_url(self, bill: models.Bill) -> str:
        """为账单生成支付宝支付链接"""
        # 构建请求参数
        biz_content = {
            "out_trade_no": str(bill.id),  # 使用账单ID作为商户订单号
            "total_amount": str(bill.total_amount),
            "subject": f"诊所账单支付 - #{bill.id}",
            "product_code": "FAST_INSTANT_TRADE_PAY"
        }
        
        params = {
            "app_id": self.app_id,
            "method": "alipay.trade.page.pay",
            "charset": "utf-8",
            "sign_type": "RSA2",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "notify_url": self.notify_url,
            "return_url": f"{self.return_url}?invoice_id={bill.id}",
            "biz_content": json.dumps(biz_content, separators=(',', ':'))
        }
        
        # 生成签名
        sign = self._generate_sign(params)
        params["sign"] = sign
        
        # 构建完整的支付URL
        query_string = urlencode(params)
        return f"{self.gateway_url}?{query_string}"
    
    def create_qr_payment(self, bill: models.Bill, timeout_minutes: int = 15) -> Dict[str, Any]:
        """创建支付宝当面付二维码
        
        Args:
            bill: 账单对象
            timeout_minutes: 二维码有效期（分钟）
            
        Returns:
            包含二维码信息的字典
        """
        # 构建请求参数
        biz_content = {
            "out_trade_no": str(bill.id),  # 使用账单ID作为商户订单号
            "total_amount": str(bill.total_amount),
            "subject": f"诊所账单支付 - #{bill.id}",
            "timeout_express": f"{timeout_minutes}m",  # 设置超时时间
            "store_id": "NEKOLINIC_001",  # 门店编号
            "operator_id": "CASHIER_001"  # 收银员编号
        }
        
        params = {
            "app_id": self.app_id,
            "method": "alipay.trade.precreate",  # 当面付预下单接口
            "charset": "utf-8",
            "sign_type": "RSA2",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "notify_url": self.notify_url,
            "biz_content": json.dumps(biz_content, separators=(',', ':'))
        }
        
        # 简化的签名生成（实际应用中需要使用正确的RSA签名）
        sign_string = urlencode(sorted(params.items()))
        params['sign'] = hashlib.md5(sign_string.encode()).hexdigest()
        
        # 模拟支付宝API响应（实际应用中需要调用真实API）
        qr_code_url = f"https://qr.alipay.com/{bill.id}_{int(time.time())}"
        
        # 计算过期时间
        expires_at = datetime.now(UTC) + timedelta(minutes=timeout_minutes)
        
        return {
            "qr_code": qr_code_url,
            "out_trade_no": str(bill.id),
            "expires_at": expires_at,
            "timeout_minutes": timeout_minutes
        }
    
    def generate_qr_code_image(self, qr_content: str) -> str:
        """生成二维码图片的Base64编码
        
        Args:
            qr_content: 二维码内容
            
        Returns:
            Base64编码的PNG图片数据
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 转换为Base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def query_payment_status(self, out_trade_no: str) -> Dict[str, Any]:
        """查询支付状态
        
        Args:
            out_trade_no: 商户订单号
            
        Returns:
            支付状态信息
        """
        # 构建查询参数
        biz_content = {
            "out_trade_no": out_trade_no
        }
        
        params = {
            "app_id": self.app_id,
            "method": "alipay.trade.query",
            "charset": "utf-8",
            "sign_type": "RSA2",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "biz_content": json.dumps(biz_content, separators=(',', ':'))
        }
        
        # 简化的签名生成
        sign_string = urlencode(sorted(params.items()))
        params['sign'] = hashlib.md5(sign_string.encode()).hexdigest()
        
        # 模拟API响应（实际应用中需要调用真实API）
        return {
            "trade_status": "WAIT_BUYER_PAY",  # 等待买家付款
            "out_trade_no": out_trade_no,
            "trade_no": None,
            "total_amount": "0.00"
        }
    
    def verify_notification(self, data: Dict[str, Any]) -> bool:
        """验证支付宝异步通知的签名"""
        try:
            # 提取签名
            sign = data.pop("sign", "")
            sign_type = data.pop("sign_type", "")
            
            if sign_type != "RSA2":
                return False
            
            # 构建待验签字符串
            sorted_items = sorted(data.items())
            unsigned_string = "&".join([f"{k}={v}" for k, v in sorted_items if v])
            
            # 验证签名 (这里简化处理，实际应使用RSA验签)
            # 在真实环境中，需要使用支付宝公钥进行RSA验签
            return True  # 简化处理，实际项目中需要实现真正的RSA验签
            
        except Exception as e:
            print(f"验证支付宝通知签名失败: {e}")
            return False
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """生成签名 (简化版本)"""
        # 排序参数
        sorted_items = sorted(params.items())
        # 构建待签名字符串
        unsigned_string = "&".join([f"{k}={v}" for k, v in sorted_items if v])
        
        # 这里简化处理，实际应使用RSA私钥签名
        # 在真实环境中，需要使用应用私钥进行RSA签名
        return hashlib.md5(unsigned_string.encode('utf-8')).hexdigest()


class WechatPayGateway:
    """微信支付网关"""
    
    def __init__(self):
        self.app_id = settings.WECHAT_APP_ID
        self.mch_id = settings.WECHAT_MCH_ID
        self.api_key = settings.WECHAT_API_KEY
        self.notify_url = f"{settings.APP_BACKEND_URL}/api/v1/finance/webhooks/wechat"
        self.gateway_url = "https://api.mch.weixin.qq.com/pay/unifiedorder"
    
    def create_payment_qr(self, bill: models.Bill) -> str:
        """为账单生成微信支付二维码 (预留)"""
        # TODO: 实现微信支付二维码生成逻辑
        raise ValueError("微信支付暂未实现")
    
    def create_qr_payment(self, bill: models.Bill, timeout_minutes: int = 15) -> Dict[str, Any]:
        """创建微信Native支付二维码
        
        Args:
            bill: 账单对象
            timeout_minutes: 二维码有效期（分钟）
            
        Returns:
            包含二维码信息的字典
        """
        # 构建请求参数
        params = {
            "appid": self.app_id,
            "mch_id": self.mch_id,
            "nonce_str": str(int(time.time())),
            "body": f"诊所账单支付 - #{bill.id}",
            "out_trade_no": str(bill.id),
            "total_fee": int(bill.total_amount * 100),  # 微信支付金额单位为分
            "spbill_create_ip": "127.0.0.1",
            "notify_url": self.notify_url,
            "trade_type": "NATIVE",  # Native支付
            "time_expire": (datetime.now(UTC) + timedelta(minutes=timeout_minutes)).strftime("%Y%m%d%H%M%S")
        }
        
        # 简化的签名生成（实际应用中需要使用正确的签名算法）
        sign_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
        params['sign'] = hashlib.md5(f"{sign_string}&key={self.api_key}".encode()).hexdigest().upper()
        
        # 模拟微信API响应（实际应用中需要调用真实API）
        qr_code_url = f"weixin://wxpay/bizpayurl?pr={bill.id}_{int(time.time())}"
        
        # 计算过期时间
        expires_at = datetime.now(UTC) + timedelta(minutes=timeout_minutes)
        
        return {
            "qr_code": qr_code_url,
            "out_trade_no": str(bill.id),
            "expires_at": expires_at,
            "timeout_minutes": timeout_minutes
        }
    
    def generate_qr_code_image(self, qr_content: str) -> str:
        """生成二维码图片的Base64编码
        
        Args:
            qr_content: 二维码内容
            
        Returns:
            Base64编码的PNG图片数据
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 转换为Base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def query_payment_status(self, out_trade_no: str) -> Dict[str, Any]:
        """查询支付状态
        
        Args:
            out_trade_no: 商户订单号
            
        Returns:
            支付状态信息
        """
        # 构建查询参数
        params = {
            "appid": self.app_id,
            "mch_id": self.mch_id,
            "out_trade_no": out_trade_no,
            "nonce_str": str(int(time.time()))
        }
        
        # 简化的签名生成
        sign_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
        params['sign'] = hashlib.md5(f"{sign_string}&key={self.api_key}".encode()).hexdigest().upper()
        
        # 模拟API响应（实际应用中需要调用真实API）
        return {
            "trade_state": "NOTPAY",  # 未支付
            "out_trade_no": out_trade_no,
            "transaction_id": None,
            "total_fee": 0
        }
    
    def verify_notification(self, data: Dict[str, Any]) -> bool:
        """验证微信支付异步通知的签名 (预留)"""
        # TODO: 实现微信支付通知验证逻辑
        pass


# 实例化网关
alipay_gateway = AlipayGateway()
wechat_gateway = WechatPayGateway()