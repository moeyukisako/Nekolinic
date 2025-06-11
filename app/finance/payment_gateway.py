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
from urllib.parse import urlencode, quote_plus
from datetime import datetime, timedelta, UTC
import qrcode
import io
import base64
import requests
import logging
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

from app.core.config import settings
from . import models

# 配置日志
logger = logging.getLogger(__name__)


class AlipayGateway:
    """支付宝支付网关"""
    
    def __init__(self, app_id: str = None, private_key: str = None, gateway_url: str = None, 
                 notify_url: str = None, return_url: str = None, alipay_public_key: str = None):
        self.app_id = app_id or settings.ALIPAY_APP_ID
        self.app_private_key = (private_key or settings.ALIPAY_APP_PRIVATE_KEY_STRING).replace("\\n", "\n")
        self.alipay_public_key = (alipay_public_key or settings.ALIPAY_PUBLIC_KEY_STRING).replace("\\n", "\n")
        self.gateway_url = gateway_url or "https://openapi.alipaydev.com/gateway.do"  # 沙箱环境
        # 生产环境使用: https://openapi.alipay.com/gateway.do
        self.notify_url = notify_url or f"{settings.APP_BACKEND_URL}/api/v1/finance/webhooks/alipay"
        self.return_url = return_url or f"{settings.APP_FRONTEND_URL}/payment-success"
    
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
        try:
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
                "biz_content": json.dumps(biz_content, separators=(',', ':'), ensure_ascii=False)
            }
            
            # 生成签名
            params['sign'] = self._generate_sign(params)
            
            # 调用支付宝API
            response = requests.post(
                self.gateway_url,
                data=params,
                timeout=30,
                headers={'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'}
            )
            
            if response.status_code != 200:
                logger.error(f"支付宝API调用失败，状态码: {response.status_code}")
                raise ValueError(f"支付宝API调用失败: HTTP {response.status_code}")
            
            # 解析响应
            result = response.json()
            
            # 检查响应格式
            if 'alipay_trade_precreate_response' not in result:
                logger.error(f"支付宝API响应格式错误: {result}")
                raise ValueError("支付宝API响应格式错误")
            
            api_response = result['alipay_trade_precreate_response']
            
            # 检查业务结果
            if api_response.get('code') != '10000':
                error_msg = api_response.get('sub_msg', api_response.get('msg', '未知错误'))
                logger.error(f"支付宝预下单失败: {error_msg}")
                raise ValueError(f"支付宝预下单失败: {error_msg}")
            
            # 验证响应签名
            if 'sign' in result:
                if not self._verify_sign(api_response, result['sign']):
                    logger.error("支付宝响应签名验证失败")
                    raise ValueError("支付宝响应签名验证失败")
            
            # 获取二维码内容
            qr_code = api_response.get('qr_code')
            if not qr_code:
                logger.error("支付宝API未返回二维码")
                raise ValueError("支付宝API未返回二维码")
            
            # 计算过期时间
            expires_at = datetime.now(UTC) + timedelta(minutes=timeout_minutes)
            
            logger.info(f"支付宝预下单成功，订单号: {bill.id}")
            
            return {
                "qr_code": qr_code,
                "out_trade_no": str(bill.id),
                "expires_at": expires_at,
                "timeout_minutes": timeout_minutes
            }
            
        except requests.RequestException as e:
            logger.error(f"支付宝API网络请求失败: {e}")
            raise ValueError(f"支付宝API网络请求失败: {e}")
        except Exception as e:
            logger.error(f"创建支付宝二维码失败: {e}")
            raise ValueError(f"创建支付宝二维码失败: {e}")
    
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
        try:
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
                "biz_content": json.dumps(biz_content, separators=(',', ':'), ensure_ascii=False)
            }
            
            # 生成签名
            params['sign'] = self._generate_sign(params)
            
            # 调用支付宝API
            response = requests.post(
                self.gateway_url,
                data=params,
                timeout=30,
                headers={'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'}
            )
            
            if response.status_code != 200:
                logger.error(f"支付宝查询API调用失败，状态码: {response.status_code}")
                raise ValueError(f"支付宝查询API调用失败: HTTP {response.status_code}")
            
            # 解析响应
            result = response.json()
            
            # 检查响应格式
            if 'alipay_trade_query_response' not in result:
                logger.error(f"支付宝查询API响应格式错误: {result}")
                raise ValueError("支付宝查询API响应格式错误")
            
            api_response = result['alipay_trade_query_response']
            
            # 检查业务结果
            if api_response.get('code') == '40004':  # 交易不存在
                return {
                    "trade_status": "TRADE_NOT_EXIST",
                    "out_trade_no": out_trade_no,
                    "trade_no": None,
                    "total_amount": "0.00"
                }
            elif api_response.get('code') != '10000':
                error_msg = api_response.get('sub_msg', api_response.get('msg', '未知错误'))
                logger.error(f"支付宝查询失败: {error_msg}")
                raise ValueError(f"支付宝查询失败: {error_msg}")
            
            # 验证响应签名
            if 'sign' in result:
                if not self._verify_sign(api_response, result['sign']):
                    logger.error("支付宝查询响应签名验证失败")
                    raise ValueError("支付宝查询响应签名验证失败")
            
            # 返回标准化的状态信息
            return {
                "trade_status": api_response.get('trade_status', 'UNKNOWN'),
                "out_trade_no": api_response.get('out_trade_no', out_trade_no),
                "trade_no": api_response.get('trade_no'),
                "total_amount": api_response.get('total_amount', '0.00'),
                "buyer_pay_amount": api_response.get('buyer_pay_amount'),
                "gmt_payment": api_response.get('gmt_payment'),
                "point_amount": api_response.get('point_amount'),
                "invoice_amount": api_response.get('invoice_amount')
            }
            
        except requests.RequestException as e:
            logger.error(f"支付宝查询API网络请求失败: {e}")
            raise ValueError(f"支付宝查询API网络请求失败: {e}")
        except Exception as e:
            logger.error(f"查询支付宝支付状态失败: {e}")
            raise ValueError(f"查询支付宝支付状态失败: {e}")
    
    def verify_notification(self, data: Dict[str, Any]) -> bool:
        """验证支付宝异步通知签名
        
        Args:
            data: 通知数据
            
        Returns:
            验证结果
        """
        try:
            # 检查必要字段
            if 'sign' not in data or 'sign_type' not in data:
                logger.error("支付宝通知缺少签名信息")
                return False
            
            # 检查签名类型
            if data['sign_type'] != 'RSA2':
                logger.error(f"不支持的签名类型: {data['sign_type']}")
                return False
            
            # 提取签名
            sign = data.pop('sign')
            sign_type = data.pop('sign_type')
            
            # 构建待验证字符串
            # 1. 过滤空值参数
            filtered_data = {k: v for k, v in data.items() if v != '' and v is not None}
            
            # 2. 按参数名ASCII码从小到大排序
            sorted_items = sorted(filtered_data.items())
            
            # 3. 使用&连接参数
            sign_string = '&'.join([f"{k}={v}" for k, v in sorted_items])
            
            logger.info(f"支付宝通知验签字符串: {sign_string}")
            
            # 验证签名
            is_valid = self._verify_sign_string(sign_string, sign)
            
            if is_valid:
                logger.info("支付宝异步通知签名验证成功")
            else:
                logger.error("支付宝异步通知签名验证失败")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"验证支付宝异步通知签名时发生错误: {e}")
            return False
    
    def _verify_sign_string(self, sign_string: str, sign: str) -> bool:
        """验证签名字符串
        
        Args:
            sign_string: 待验证的字符串
            sign: 签名
            
        Returns:
            验证结果
        """
        try:
            from Crypto.PublicKey import RSA
            from Crypto.Signature import pkcs1_15
            from Crypto.Hash import SHA256
            import base64
            
            # 加载支付宝公钥
            if not self.alipay_public_key:
                logger.error("支付宝公钥未配置")
                return False
            
            # 格式化公钥
            public_key_content = self.alipay_public_key
            if not public_key_content.startswith('-----BEGIN PUBLIC KEY-----'):
                public_key_content = f"-----BEGIN PUBLIC KEY-----\n{public_key_content}\n-----END PUBLIC KEY-----"
            
            # 导入公钥
            public_key = RSA.import_key(public_key_content)
            
            # 计算哈希
            hash_obj = SHA256.new(sign_string.encode('utf-8'))
            
            # 解码签名
            signature = base64.b64decode(sign)
            
            # 验证签名
            pkcs1_15.new(public_key).verify(hash_obj, signature)
            return True
            
        except Exception as e:
            logger.error(f"RSA签名验证失败: {e}")
            return False
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """生成RSA2签名"""
        try:
            # 排序参数并过滤空值
            sorted_items = sorted([(k, v) for k, v in params.items() if v is not None and v != ''])
            
            # 构建待签名字符串
            unsigned_string = "&".join([f"{k}={v}" for k, v in sorted_items])
            
            # 使用RSA私钥进行签名
            private_key = RSA.import_key(self.app_private_key)
            hash_obj = SHA256.new(unsigned_string.encode('utf-8'))
            signature = pkcs1_15.new(private_key).sign(hash_obj)
            
            # 返回Base64编码的签名
            return base64.b64encode(signature).decode('utf-8')
            
        except Exception as e:
            logger.error(f"生成支付宝签名失败: {e}")
            raise ValueError(f"签名生成失败: {e}")
    
    def _verify_sign(self, params: Dict[str, Any], sign: str) -> bool:
        """验证支付宝签名"""
        try:
            # 移除sign和sign_type参数
            verify_params = {k: v for k, v in params.items() if k not in ['sign', 'sign_type']}
            
            # 排序参数并过滤空值
            sorted_items = sorted([(k, v) for k, v in verify_params.items() if v is not None and v != ''])
            
            # 构建待验签字符串
            unsigned_string = "&".join([f"{k}={v}" for k, v in sorted_items])
            
            # 使用支付宝公钥验证签名
            public_key = RSA.import_key(self.alipay_public_key)
            hash_obj = SHA256.new(unsigned_string.encode('utf-8'))
            signature = base64.b64decode(sign)
            
            pkcs1_15.new(public_key).verify(hash_obj, signature)
            return True
            
        except Exception as e:
            logger.error(f"验证支付宝签名失败: {e}")
            return False


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