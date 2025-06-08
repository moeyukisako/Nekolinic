/**
 * 支付会话API模块
 * 提供客户被扫支付相关的API接口
 */

import request from '@/utils/request'

/**
 * 支付会话API类
 */
export const paymentSessionApi = {
  /**
   * 创建支付会话
   * @param {Object} data - 创建支付会话的数据
   * @param {number} data.bill_id - 账单ID
   * @param {string} data.payment_method - 支付方式 (ALIPAY, WECHAT)
   * @param {number} data.timeout_minutes - 超时时间（分钟）
   * @returns {Promise} API响应
   */
  createSession(data) {
    return request({
      url: '/api/v1/finance/payment-sessions/',
      method: 'post',
      data
    })
  },

  /**
   * 获取支付会话信息
   * @param {number} sessionId - 会话ID
   * @returns {Promise} API响应
   */
  getSession(sessionId) {
    return request({
      url: `/api/v1/finance/payment-sessions/${sessionId}`,
      method: 'get'
    })
  },

  /**
   * 获取支付二维码
   * @param {number} sessionId - 会话ID
   * @returns {Promise} API响应
   */
  getQRCode(sessionId) {
    return request({
      url: `/api/v1/finance/payment-sessions/${sessionId}/qr-code`,
      method: 'get'
    })
  },

  /**
   * 检查支付状态
   * @param {number} sessionId - 会话ID
   * @returns {Promise} API响应
   */
  checkStatus(sessionId) {
    return request({
      url: `/api/v1/finance/payment-sessions/${sessionId}/status`,
      method: 'get'
    })
  },

  /**
   * 取消支付会话
   * @param {number} sessionId - 会话ID
   * @returns {Promise} API响应
   */
  cancelSession(sessionId) {
    return request({
      url: `/api/v1/finance/payment-sessions/${sessionId}`,
      method: 'delete'
    })
  },

  /**
   * 清理过期的支付会话
   * @returns {Promise} API响应
   */
  cleanupExpiredSessions() {
    return request({
      url: '/api/v1/finance/payment-sessions/cleanup-expired',
      method: 'post'
    })
  }
}

/**
 * 支付会话状态枚举
 */
export const PaymentSessionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
}

/**
 * 支付方式枚举
 */
export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  ALIPAY: 'ALIPAY',
  WECHAT: 'WECHAT',
  INSURANCE: 'INSURANCE'
}

/**
 * 支付模式枚举
 */
export const PaymentMode = {
  CASHIER_SCAN: 'CASHIER_SCAN',
  CUSTOMER_SCAN: 'CUSTOMER_SCAN'
}

/**
 * 支付会话工具函数
 */
export const paymentSessionUtils = {
  /**
   * 获取支付方式的显示名称
   * @param {string} method - 支付方式
   * @returns {string} 显示名称
   */
  getPaymentMethodName(method) {
    const methodMap = {
      [PaymentMethod.CASH]: '现金',
      [PaymentMethod.CARD]: '银行卡',
      [PaymentMethod.ALIPAY]: '支付宝',
      [PaymentMethod.WECHAT]: '微信支付',
      [PaymentMethod.INSURANCE]: '医保'
    }
    return methodMap[method] || method
  },

  /**
   * 获取支付会话状态的显示名称
   * @param {string} status - 支付会话状态
   * @returns {string} 显示名称
   */
  getStatusName(status) {
    const statusMap = {
      [PaymentSessionStatus.PENDING]: '等待支付',
      [PaymentSessionStatus.COMPLETED]: '支付成功',
      [PaymentSessionStatus.EXPIRED]: '已过期',
      [PaymentSessionStatus.CANCELLED]: '已取消'
    }
    return statusMap[status] || status
  },

  /**
   * 获取支付会话状态的颜色类名
   * @param {string} status - 支付会话状态
   * @returns {string} 颜色类名
   */
  getStatusColor(status) {
    const colorMap = {
      [PaymentSessionStatus.PENDING]: 'warning',
      [PaymentSessionStatus.COMPLETED]: 'success',
      [PaymentSessionStatus.EXPIRED]: 'error',
      [PaymentSessionStatus.CANCELLED]: 'default'
    }
    return colorMap[status] || 'default'
  },

  /**
   * 检查支付会话是否已过期
   * @param {string} expiresAt - 过期时间字符串
   * @returns {boolean} 是否已过期
   */
  isExpired(expiresAt) {
    return new Date(expiresAt) <= new Date()
  },

  /**
   * 格式化剩余时间
   * @param {string} expiresAt - 过期时间字符串
   * @returns {string} 格式化的剩余时间
   */
  formatRemainingTime(expiresAt) {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = Math.max(0, Math.floor((expires - now) / 1000))
    
    if (diff === 0) {
      return '已过期'
    }
    
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },

  /**
   * 计算倒计时百分比
   * @param {string} expiresAt - 过期时间字符串
   * @param {number} timeoutMinutes - 总超时时间（分钟）
   * @returns {number} 百分比 (0-100)
   */
  getCountdownPercent(expiresAt, timeoutMinutes) {
    const now = new Date()
    const expires = new Date(expiresAt)
    const totalMs = timeoutMinutes * 60 * 1000
    const remainingMs = Math.max(0, expires - now)
    
    return (remainingMs / totalMs) * 100
  },

  /**
   * 验证支付会话数据
   * @param {Object} sessionData - 支付会话数据
   * @returns {Object} 验证结果
   */
  validateSessionData(sessionData) {
    const errors = []
    
    if (!sessionData.bill_id || sessionData.bill_id <= 0) {
      errors.push('账单ID无效')
    }
    
    if (!sessionData.payment_method || !Object.values(PaymentMethod).includes(sessionData.payment_method)) {
      errors.push('支付方式无效')
    }
    
    if (!sessionData.timeout_minutes || sessionData.timeout_minutes < 5 || sessionData.timeout_minutes > 60) {
      errors.push('超时时间必须在5-60分钟之间')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 支付会话事件类型
 */
export const PaymentSessionEvents = {
  CREATED: 'payment-session-created',
  COMPLETED: 'payment-session-completed',
  EXPIRED: 'payment-session-expired',
  CANCELLED: 'payment-session-cancelled',
  STATUS_CHANGED: 'payment-session-status-changed'
}

/**
 * 支付会话配置
 */
export const paymentSessionConfig = {
  // 默认超时时间（分钟）
  defaultTimeoutMinutes: 15,
  
  // 最小超时时间（分钟）
  minTimeoutMinutes: 5,
  
  // 最大超时时间（分钟）
  maxTimeoutMinutes: 60,
  
  // 状态检查间隔（毫秒）
  statusCheckInterval: 3000,
  
  // 倒计时更新间隔（毫秒）
  countdownUpdateInterval: 1000,
  
  // 支持的支付方式
  supportedPaymentMethods: [PaymentMethod.ALIPAY, PaymentMethod.WECHAT]
}

export default paymentSessionApi