# 支付宝集成配置指南

## 1. 申请支付宝开发者账号

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 注册开发者账号并完成实名认证
3. 创建应用（选择"网页&移动应用"）

## 2. 获取必要的配置信息

### 2.1 应用信息
- **APPID**: 在应用详情页面可以找到
- **应用私钥**: 需要生成RSA2密钥对
- **支付宝公钥**: 上传应用公钥后，支付宝会提供对应的公钥

### 2.2 生成RSA2密钥对

#### 方法1: 使用支付宝提供的密钥生成工具
1. 下载 [支付宝开放平台开发助手](https://opendocs.alipay.com/common/02kipl)
2. 选择"RSA2(SHA256)密钥"生成密钥对
3. 保存应用私钥（用于签名）
4. 将应用公钥上传到支付宝开放平台

#### 方法2: 使用OpenSSL命令行工具
```bash
# 生成私钥
openssl genrsa -out app_private_key.pem 2048

# 从私钥生成公钥
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

## 3. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```env
# 支付宝配置
ALIPAY_APP_ID=你的应用APPID
ALIPAY_APP_PRIVATE_KEY_STRING=-----BEGIN RSA PRIVATE KEY-----\n你的应用私钥内容\n-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY_STRING=-----BEGIN PUBLIC KEY-----\n支付宝公钥内容\n-----END PUBLIC KEY-----

# 应用URL配置（用于回调）
APP_FRONTEND_URL=http://localhost:3000
APP_BACKEND_URL=http://localhost:8000
```

## 4. 沙箱环境测试

### 4.1 获取沙箱账号
1. 在支付宝开放平台进入"开发信息"页面
2. 查看"沙箱信息"获取沙箱账号
3. 下载"沙箱版支付宝"APP进行测试

### 4.2 沙箱配置
- 网关地址: `https://openapi.alipaydev.com/gateway.do`
- 使用沙箱环境的APPID和密钥

## 5. 生产环境配置

### 5.1 应用上线
1. 完成应用开发并通过自测
2. 提交应用审核
3. 审核通过后签约相关产品

### 5.2 生产环境参数
- 网关地址: `https://openapi.alipay.com/gateway.do`
- 使用正式环境的APPID和密钥

## 6. 需要开通的产品功能

- **当面付**: 用于生成支付二维码
- **手机网站支付**: 用于移动端支付
- **电脑网站支付**: 用于PC端支付

## 7. 回调地址配置

确保以下回调地址可以被支付宝访问：
- 异步通知地址: `{你的域名}/api/v1/finance/webhooks/alipay`
- 同步返回地址: `{你的前端域名}/payment-success`

## 8. 安全注意事项

1. **私钥安全**: 应用私钥绝对不能泄露，建议使用环境变量存储
2. **签名验证**: 必须验证支付宝返回数据的签名
3. **HTTPS**: 生产环境必须使用HTTPS
4. **IP白名单**: 建议配置IP白名单限制回调访问

## 9. 常见问题

### 9.1 签名错误
- 检查私钥格式是否正确
- 确认参数编码为UTF-8
- 验证参数排序和拼接规则

### 9.2 回调接收不到
- 检查回调地址是否可以公网访问
- 确认回调地址配置正确
- 查看服务器日志排查问题

### 9.3 测试账号问题
- 使用沙箱版支付宝APP
- 确认沙箱买家账号余额充足
- 检查沙箱环境配置

## 10. 技术支持

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [API参考文档](https://opendocs.alipay.com/apis/)
- [开发者社区](https://forum.alipay.com/)