# 客户被扫支付实现方案

## 概述

客户被扫支付是指商户生成二维码，客户使用支付宝或微信扫码完成支付的模式。这种模式适用于线下门诊场景，提供更好的用户体验。

## 技术方案

### 1. 支付流程设计

```
1. 医生开具处方 → 2. 系统生成账单 → 3. 生成支付二维码 → 4. 患者扫码支付 → 5. 接收支付回调 → 6. 更新订单状态
```

### 2. 核心功能模块

#### 2.1 支付宝当面付（Face to Face）
- **API接口**: `alipay.trade.precreate`
- **功能**: 生成支付二维码
- **返回**: 二维码字符串，用于生成QR码图片

#### 2.2 微信Native支付
- **API接口**: 微信支付Native API
- **功能**: 生成支付二维码
- **返回**: 二维码链接

### 3. 数据库设计扩展

#### 3.1 支付订单表扩展
```sql
ALTER TABLE payments ADD COLUMN qr_code_url VARCHAR(500);
ALTER TABLE payments ADD COLUMN qr_code_expires_at DATETIME;
ALTER TABLE payments ADD COLUMN payment_mode ENUM('redirect', 'qr_code') DEFAULT 'redirect';
```

#### 3.2 新增支付会话表
```sql
CREATE TABLE payment_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    payment_method ENUM('alipay', 'wechat') NOT NULL,
    qr_code_content TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    status ENUM('pending', 'paid', 'expired', 'cancelled') DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id)
);
```

### 4. API接口设计

#### 4.1 生成支付二维码
```
POST /api/v1/finance/bills/{bill_id}/qr-payment
{
    "payment_method": "alipay",  // alipay | wechat
    "timeout_minutes": 15       // 二维码有效期（分钟）
}

Response:
{
    "qr_code_content": "https://qr.alipay.com/...",
    "qr_code_image_url": "/api/v1/finance/qr-codes/{session_id}.png",
    "expires_at": "2024-01-15T10:30:00Z",
    "session_id": "abc123"
}
```

#### 4.2 查询支付状态
```
GET /api/v1/finance/payment-sessions/{session_id}/status

Response:
{
    "status": "pending",  // pending | paid | expired | cancelled
    "bill_id": 123,
    "payment_method": "alipay",
    "expires_at": "2024-01-15T10:30:00Z"
}
```

#### 4.3 生成二维码图片
```
GET /api/v1/finance/qr-codes/{session_id}.png

Response: PNG图片数据
```

### 5. 前端界面设计

#### 5.1 支付方式选择页面
- 显示账单信息
- 提供支付方式选择（支付宝/微信）
- 跳转到二维码展示页面

#### 5.2 二维码展示页面
- 显示二维码图片
- 显示支付金额和订单信息
- 实时轮询支付状态
- 显示倒计时（二维码有效期）
- 提供刷新二维码功能

#### 5.3 支付结果页面
- 支付成功/失败提示
- 订单详情展示
- 返回首页按钮

### 6. 实现步骤

#### 阶段一：基础架构搭建
1. ✅ 安装支付SDK（已完成）
2. ✅ 配置支付参数（已完成）
3. 🔄 扩展数据库模型
4. 🔄 实现支付网关服务

#### 阶段二：支付宝当面付实现
1. 🔄 实现支付宝预下单接口
2. 🔄 实现二维码生成服务
3. 🔄 实现支付状态查询
4. 🔄 完善支付回调处理

#### 阶段三：微信Native支付实现
1. ⏳ 申请微信支付商户号
2. ⏳ 实现微信预下单接口
3. ⏳ 集成微信支付回调

#### 阶段四：前端界面开发
1. ⏳ 支付方式选择组件
2. ⏳ 二维码展示组件
3. ⏳ 支付状态轮询逻辑
4. ⏳ 支付结果页面

#### 阶段五：测试与优化
1. ⏳ 单元测试
2. ⏳ 集成测试
3. ⏳ 性能优化
4. ⏳ 安全加固

### 7. 安全考虑

#### 7.1 签名验证
- 所有支付请求必须进行签名验证
- 使用RSA2算法确保数据安全

#### 7.2 防重放攻击
- 添加时间戳验证
- 实现幂等性控制

#### 7.3 敏感信息保护
- 私钥安全存储
- 支付密钥定期轮换

### 8. 监控与日志

#### 8.1 支付监控
- 支付成功率监控
- 支付响应时间监控
- 异常支付告警

#### 8.2 日志记录
- 支付请求日志
- 回调处理日志
- 错误异常日志

### 9. 配置要求

#### 9.1 支付宝配置
```python
# 需要在支付宝开放平台申请
ALIPAY_APP_ID = "your_app_id"
ALIPAY_APP_PRIVATE_KEY = "your_private_key"
ALIPAY_PUBLIC_KEY = "alipay_public_key"
ALIPAY_GATEWAY_URL = "https://openapi.alipay.com/gateway.do"  # 生产环境
```

#### 9.2 微信支付配置
```python
# 需要申请微信支付商户号
WECHAT_APP_ID = "your_app_id"
WECHAT_MCH_ID = "your_mch_id"
WECHAT_API_KEY = "your_api_key"
WECHAT_CERT_PATH = "path/to/cert.pem"
WECHAT_KEY_PATH = "path/to/key.pem"
```

### 10. 下一步行动

1. **立即执行**：扩展数据库模型，添加支付会话表
2. **优先实现**：支付宝当面付功能（相对简单，文档完善）
3. **申请资质**：支付宝开放平台应用审核
4. **并行开发**：前端二维码展示界面
5. **后续规划**：微信支付集成（需要商户资质）

### 11. 风险评估

#### 11.1 技术风险
- **低风险**：支付宝SDK集成（文档完善，社区支持好）
- **中风险**：微信支付集成（需要商户资质，审核周期长）
- **低风险**：二维码生成（成熟技术）

#### 11.2 业务风险
- **中风险**：支付资质申请（需要营业执照等材料）
- **低风险**：用户体验（二维码支付是成熟模式）

#### 11.3 安全风险
- **中风险**：支付密钥管理（需要严格的安全措施）
- **低风险**：数据传输安全（HTTPS + 签名验证）

---

**总结**：客户被扫支付是一个相对成熟的技术方案，主要挑战在于支付资质的申请和安全措施的实施。建议优先实现支付宝当面付功能，作为MVP版本快速验证业务需求。