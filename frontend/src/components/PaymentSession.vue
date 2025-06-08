<template>
  <div class="payment-session">
    <!-- 支付方式选择 -->
    <div v-if="!session" class="payment-method-selection">
      <h3>选择支付方式</h3>
      <div class="payment-methods">
        <button 
          v-for="method in paymentMethods" 
          :key="method.value"
          @click="createSession(method.value)"
          :disabled="loading"
          class="payment-method-btn"
          :class="{ 'loading': loading }"
        >
          <i :class="method.icon"></i>
          <span>{{ method.label }}</span>
        </button>
      </div>
    </div>

    <!-- 二维码显示 -->
    <div v-if="session && !paymentCompleted" class="qr-code-section">
      <div class="payment-header">
        <h3>请使用{{ getPaymentMethodName(session.payment_method) }}扫码支付</h3>
        <div class="amount">￥{{ session.amount.toFixed(2) }}</div>
      </div>

      <div class="qr-code-container">
        <div v-if="qrCodeLoading" class="qr-loading">
          <div class="spinner"></div>
          <p>正在生成二维码...</p>
        </div>
        <div v-else-if="qrCodeImage" class="qr-code">
          <img :src="qrCodeImage" alt="支付二维码" />
        </div>
        <div v-else class="qr-error">
          <p>二维码生成失败，请重试</p>
          <button @click="loadQRCode" class="retry-btn">重新生成</button>
        </div>
      </div>

      <div class="payment-info">
        <div class="info-item">
          <span class="label">订单号：</span>
          <span class="value">{{ session.bill_id }}</span>
        </div>
        <div class="info-item">
          <span class="label">过期时间：</span>
          <span class="value" :class="{ 'expired': session.is_expired }">
            {{ formatExpireTime(session.expires_at) }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">状态：</span>
          <span class="value" :class="`status-${session.status.toLowerCase()}`">
            {{ getStatusText(session.status) }}
          </span>
        </div>
      </div>

      <div class="countdown" v-if="!session.is_expired">
        <div class="countdown-text">剩余时间：{{ countdownText }}</div>
        <div class="countdown-bar">
          <div class="countdown-progress" :style="{ width: countdownPercent + '%' }"></div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="checkPaymentStatus" :disabled="statusChecking" class="check-btn">
          <i class="fas fa-sync" :class="{ 'fa-spin': statusChecking }"></i>
          {{ statusChecking ? '检查中...' : '检查支付状态' }}
        </button>
        <button @click="cancelSession" :disabled="cancelling" class="cancel-btn">
          {{ cancelling ? '取消中...' : '取消支付' }}
        </button>
      </div>
    </div>

    <!-- 支付成功 -->
    <div v-if="paymentCompleted" class="payment-success">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3>支付成功！</h3>
      <p>订单 #{{ billId }} 已完成支付</p>
      <button @click="$emit('payment-completed')" class="continue-btn">
        继续
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button @click="clearError" class="close-error">×</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { paymentSessionApi } from '@/api/paymentSession'

export default {
  name: 'PaymentSession',
  props: {
    billId: {
      type: Number,
      required: true
    }
  },
  emits: ['payment-completed', 'payment-cancelled'],
  setup(props, { emit }) {
    // 响应式数据
    const session = ref(null)
    const qrCodeImage = ref('')
    const loading = ref(false)
    const qrCodeLoading = ref(false)
    const statusChecking = ref(false)
    const cancelling = ref(false)
    const paymentCompleted = ref(false)
    const error = ref('')
    
    // 倒计时相关
    const countdown = ref(0)
    const countdownInterval = ref(null)
    const statusCheckInterval = ref(null)
    
    // 支付方式配置
    const paymentMethods = [
      {
        value: 'ALIPAY',
        label: '支付宝',
        icon: 'fab fa-alipay'
      },
      {
        value: 'WECHAT',
        label: '微信支付',
        icon: 'fab fa-weixin'
      }
    ]
    
    // 计算属性
    const countdownText = computed(() => {
      const minutes = Math.floor(countdown.value / 60)
      const seconds = countdown.value % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })
    
    const countdownPercent = computed(() => {
      if (!session.value) return 0
      const totalSeconds = session.value.timeout_minutes * 60
      return (countdown.value / totalSeconds) * 100
    })
    
    // 方法
    const createSession = async (paymentMethod) => {
      loading.value = true
      error.value = ''
      
      try {
        const response = await paymentSessionApi.createSession({
          bill_id: props.billId,
          payment_method: paymentMethod,
          timeout_minutes: 15
        })
        
        session.value = response.data
        await loadQRCode()
        startCountdown()
        startStatusCheck()
        
      } catch (err) {
        error.value = err.response?.data?.detail || '创建支付会话失败'
      } finally {
        loading.value = false
      }
    }
    
    const loadQRCode = async () => {
      if (!session.value) return
      
      qrCodeLoading.value = true
      try {
        const response = await paymentSessionApi.getQRCode(session.value.id)
        qrCodeImage.value = response.data.qr_code_image
      } catch (err) {
        error.value = '获取二维码失败'
      } finally {
        qrCodeLoading.value = false
      }
    }
    
    const checkPaymentStatus = async () => {
      if (!session.value) return
      
      statusChecking.value = true
      try {
        const response = await paymentSessionApi.checkStatus(session.value.id)
        const status = response.data
        
        session.value = { ...session.value, ...status }
        
        if (status.status === 'COMPLETED') {
          paymentCompleted.value = true
          stopIntervals()
          emit('payment-completed')
        } else if (status.status === 'EXPIRED' || status.status === 'CANCELLED') {
          stopIntervals()
        }
        
      } catch (err) {
        error.value = '检查支付状态失败'
      } finally {
        statusChecking.value = false
      }
    }
    
    const cancelSession = async () => {
      if (!session.value) return
      
      cancelling.value = true
      try {
        await paymentSessionApi.cancelSession(session.value.id)
        stopIntervals()
        emit('payment-cancelled')
      } catch (err) {
        error.value = '取消支付失败'
      } finally {
        cancelling.value = false
      }
    }
    
    const startCountdown = () => {
      if (!session.value) return
      
      const expiresAt = new Date(session.value.expires_at)
      const updateCountdown = () => {
        const now = new Date()
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000))
        countdown.value = diff
        
        if (diff === 0) {
          session.value.is_expired = true
          stopIntervals()
        }
      }
      
      updateCountdown()
      countdownInterval.value = setInterval(updateCountdown, 1000)
    }
    
    const startStatusCheck = () => {
      statusCheckInterval.value = setInterval(() => {
        if (!statusChecking.value) {
          checkPaymentStatus()
        }
      }, 3000) // 每3秒检查一次
    }
    
    const stopIntervals = () => {
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
        countdownInterval.value = null
      }
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value)
        statusCheckInterval.value = null
      }
    }
    
    const clearError = () => {
      error.value = ''
    }
    
    const getPaymentMethodName = (method) => {
      const methodMap = {
        'ALIPAY': '支付宝',
        'WECHAT': '微信支付'
      }
      return methodMap[method] || method
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'PENDING': '等待支付',
        'COMPLETED': '支付成功',
        'EXPIRED': '已过期',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status
    }
    
    const formatExpireTime = (timeStr) => {
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN')
    }
    
    // 生命周期
    onUnmounted(() => {
      stopIntervals()
    })
    
    return {
      session,
      qrCodeImage,
      loading,
      qrCodeLoading,
      statusChecking,
      cancelling,
      paymentCompleted,
      error,
      paymentMethods,
      countdownText,
      countdownPercent,
      createSession,
      loadQRCode,
      checkPaymentStatus,
      cancelSession,
      clearError,
      getPaymentMethodName,
      getStatusText,
      formatExpireTime
    }
  }
}
</script>

<style scoped>
.payment-session {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.payment-method-selection h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.payment-methods {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.payment-method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.payment-method-btn:hover {
  border-color: #1890ff;
  transform: translateY(-2px);
}

.payment-method-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.payment-method-btn i {
  font-size: 32px;
  margin-bottom: 8px;
  color: #1890ff;
}

.payment-header {
  text-align: center;
  margin-bottom: 20px;
}

.payment-header h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.amount {
  font-size: 24px;
  font-weight: bold;
  color: #f5222d;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  min-height: 200px;
  align-items: center;
}

.qr-loading {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qr-code img {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.qr-error {
  text-align: center;
}

.retry-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.payment-info {
  margin: 20px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  color: #666;
}

.value {
  font-weight: 500;
}

.value.expired {
  color: #f5222d;
}

.status-pending {
  color: #fa8c16;
}

.status-completed {
  color: #52c41a;
}

.status-expired {
  color: #f5222d;
}

.status-cancelled {
  color: #8c8c8c;
}

.countdown {
  margin: 20px 0;
}

.countdown-text {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fa8c16;
  margin-bottom: 10px;
}

.countdown-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.countdown-progress {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #fa8c16, #f5222d);
  transition: width 1s ease;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.check-btn, .cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.check-btn {
  background: #1890ff;
  color: white;
}

.check-btn:hover {
  background: #40a9ff;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #d9d9d9;
}

.payment-success {
  text-align: center;
  padding: 40px 20px;
}

.success-icon i {
  font-size: 64px;
  color: #52c41a;
  margin-bottom: 20px;
}

.payment-success h3 {
  color: #52c41a;
  margin-bottom: 10px;
}

.continue-btn {
  padding: 12px 24px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 20px;
}

.error-message {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #f5222d;
  margin-top: 15px;
}

.error-message i {
  margin-right: 8px;
}

.close-error {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #f5222d;
}
</style>