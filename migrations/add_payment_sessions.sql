-- 添加支付会话功能的数据库迁移
-- 创建时间: 2024-01-01
-- 描述: 为客户被扫支付功能添加支付会话表和相关字段

-- 1. 添加新的枚举类型
CREATE TYPE payment_mode AS ENUM ('CASHIER_SCAN', 'CUSTOMER_SCAN');
CREATE TYPE payment_session_status AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- 2. 修改现有的payment_method枚举（如果需要）
-- ALTER TYPE payment_method ADD VALUE 'ALIPAY' AFTER 'CASH';
-- ALTER TYPE payment_method ADD VALUE 'WECHAT' AFTER 'ALIPAY';

-- 3. 为payments表添加新字段
ALTER TABLE payments ADD COLUMN payment_mode payment_mode DEFAULT 'CASHIER_SCAN';
ALTER TABLE payments ADD COLUMN qr_code_url TEXT;
ALTER TABLE payments ADD COLUMN qr_code_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. 创建支付会话表
CREATE TABLE payment_sessions (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    qr_code_content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status payment_session_status NOT NULL DEFAULT 'PENDING',
    prepay_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    timeout_minutes INTEGER NOT NULL DEFAULT 15,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- 5. 创建索引
CREATE INDEX idx_payment_sessions_bill_id ON payment_sessions(bill_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_expires_at ON payment_sessions(expires_at);
CREATE INDEX idx_payment_sessions_created_at ON payment_sessions(created_at);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_sessions_updated_at
    BEFORE UPDATE ON payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_sessions_updated_at();

-- 7. 添加约束
ALTER TABLE payment_sessions ADD CONSTRAINT chk_payment_sessions_amount_positive 
    CHECK (amount > 0);
ALTER TABLE payment_sessions ADD CONSTRAINT chk_payment_sessions_timeout_range 
    CHECK (timeout_minutes >= 5 AND timeout_minutes <= 60);
ALTER TABLE payment_sessions ADD CONSTRAINT chk_payment_sessions_expires_future 
    CHECK (expires_at > created_at);

-- 8. 添加注释
COMMENT ON TABLE payment_sessions IS '支付会话表，用于客户被扫支付功能';
COMMENT ON COLUMN payment_sessions.bill_id IS '关联的账单ID';
COMMENT ON COLUMN payment_sessions.payment_method IS '支付方式（支付宝、微信等）';
COMMENT ON COLUMN payment_sessions.qr_code_content IS '二维码内容（支付链接）';
COMMENT ON COLUMN payment_sessions.expires_at IS '二维码过期时间';
COMMENT ON COLUMN payment_sessions.status IS '会话状态';
COMMENT ON COLUMN payment_sessions.prepay_id IS '第三方支付预支付ID';
COMMENT ON COLUMN payment_sessions.amount IS '支付金额';
COMMENT ON COLUMN payment_sessions.timeout_minutes IS '超时时间（分钟）';

COMMENT ON COLUMN payments.payment_mode IS '支付模式（收银员扫码或客户扫码）';
COMMENT ON COLUMN payments.qr_code_url IS '二维码URL（客户扫码支付时使用）';
COMMENT ON COLUMN payments.qr_code_expires_at IS '二维码过期时间';

-- 9. 插入示例数据（可选）
-- INSERT INTO payment_sessions (bill_id, payment_method, qr_code_content, expires_at, amount, created_by, updated_by)
-- VALUES (1, 'ALIPAY', 'https://qr.alipay.com/test123', CURRENT_TIMESTAMP + INTERVAL '15 minutes', 100.00, 1, 1);

-- 10. 权限设置（根据实际需要调整）
-- GRANT SELECT, INSERT, UPDATE, DELETE ON payment_sessions TO app_user;
-- GRANT USAGE, SELECT ON SEQUENCE payment_sessions_id_seq TO app_user;