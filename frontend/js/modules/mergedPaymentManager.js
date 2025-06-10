/**
 * 合并支付管理模块
 * 支持多账单合并支付功能
 */

class MergedPaymentManager {
    constructor() {
        this.selectedBills = new Set();
        this.currentSession = null;
        this.paymentStatusInterval = null;
        this.qrCodeElement = null;
    }

    /**
     * 渲染合并支付界面
     */
    async renderMergedPaymentInterface(patientId) {
        const container = document.createElement('div');
        container.className = 'merged-payment-container';
        container.innerHTML = `
            <div class="merged-payment-header">
                <h2 data-i18n="merged_payment.title">合并支付</h2>
                <button class="btn btn-secondary back-btn" data-i18n="merged_payment.back_to_list">返回账单列表</button>
            </div>
            
            <!-- 聚合支付卡片 -->
            <div class="payment-card aggregated-card">
                <div class="card-icon">
                    <i class="fas fa-credit-card"></i>
                </div>
                <div class="card-content">
                    <h3 data-i18n="merged_payment.payment_card_title">聚合支付</h3>
                    <p data-i18n="merged_payment.payment_card_desc">支持多账单合并支付，提升支付效率</p>
                    <div class="payment-methods">
                        <span data-i18n="merged_payment.payment_methods_supported">支持的支付方式:</span>
                        <div class="method-icons">
                            <i class="fab fa-alipay" title="支付宝"></i>
                            <i class="fab fa-weixin" title="微信支付"></i>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary quick-pay-btn" data-i18n="merged_payment.quick_payment">快速支付</button>
                </div>
            </div>

            <!-- 账单选择区域 -->
            <div class="bill-selection-area">
                <div class="selection-header">
                    <h3 data-i18n="merged_payment.select_bills">选择账单</h3>
                    <div class="selection-controls">
                        <button class="btn btn-sm btn-outline-primary select-all-btn" data-i18n="merged_payment.select_all">全选</button>
                        <button class="btn btn-sm btn-outline-secondary deselect-all-btn" data-i18n="merged_payment.deselect_all">取消全选</button>
                    </div>
                </div>
                
                <div class="bills-loading" style="display: none;">
                    <div class="spinner-border" role="status"></div>
                    <span data-i18n="finance.loading">加载中...</span>
                </div>
                
                <div class="bills-list"></div>
            </div>

            <!-- 支付摘要 -->
            <div class="payment-summary">
                <div class="summary-content">
                    <div class="selected-info">
                        <span class="selected-count" data-i18n="merged_payment.selected_count">已选择 0 个账单</span>
                        <span class="total-amount">¥0.00</span>
                    </div>
                    <button class="btn btn-success proceed-payment-btn" disabled data-i18n="merged_payment.confirm_payment">确认支付</button>
                </div>
            </div>

            <!-- 支付方式选择模态框 -->
            <div class="modal fade" id="paymentMethodModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" data-i18n="merged_payment.payment_method">支付方式</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="payment-methods-grid">
                                <div class="payment-method" data-method="alipay">
                                    <i class="fab fa-alipay"></i>
                                    <span data-i18n="merged_payment.alipay">支付宝</span>
                                </div>
                                <div class="payment-method" data-method="wechat">
                                    <i class="fab fa-weixin"></i>
                                    <span data-i18n="merged_payment.wechat">微信支付</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 支付状态模态框 -->
            <div class="modal fade" id="paymentStatusModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" data-i18n="merged_payment.title">合并支付</h5>
                        </div>
                        <div class="modal-body">
                            <div class="payment-status-content">
                                <!-- 动态内容 -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary cancel-payment-btn" data-i18n="merged_payment.cancel_payment">取消支付</button>
                            <button type="button" class="btn btn-primary refresh-status-btn" data-i18n="merged_payment.refresh_status">刷新状态</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(container, patientId);
        await this.loadUnpaidBills(container, patientId);
        
        return container;
    }

    /**
     * 绑定事件处理器
     */
    bindEvents(container, patientId) {
        // 返回按钮
        container.querySelector('.back-btn').addEventListener('click', () => {
            this.goBackToBillList();
        });

        // 快速支付按钮
        container.querySelector('.quick-pay-btn').addEventListener('click', () => {
            this.showQuickPayOptions(patientId);
        });

        // 全选/取消全选
        container.querySelector('.select-all-btn').addEventListener('click', () => {
            this.selectAllBills(container);
        });
        
        container.querySelector('.deselect-all-btn').addEventListener('click', () => {
            this.deselectAllBills(container);
        });

        // 确认支付按钮
        container.querySelector('.proceed-payment-btn').addEventListener('click', () => {
            this.showPaymentMethodModal();
        });

        // 支付方式选择
        container.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                const paymentMethod = method.dataset.method;
                this.initiatePayment(paymentMethod);
            });
        });

        // 取消支付
        container.querySelector('.cancel-payment-btn').addEventListener('click', () => {
            this.cancelPayment();
        });

        // 刷新状态
        container.querySelector('.refresh-status-btn').addEventListener('click', () => {
            this.refreshPaymentStatus();
        });
    }

    /**
     * 加载未支付账单
     */
    async loadUnpaidBills(container, patientId) {
        const loadingElement = container.querySelector('.bills-loading');
        const billsListElement = container.querySelector('.bills-list');
        
        loadingElement.style.display = 'flex';
        
        try {
            const response = await fetch(`/api/finance/merged-payments/patients/${patientId}/unpaid-bills`);
            const data = await response.json();
            
            if (data.success) {
                this.renderBillsList(billsListElement, data.bills);
            } else {
                this.showError(data.message || '加载账单失败');
            }
        } catch (error) {
            console.error('加载账单失败:', error);
            this.showError('网络错误，请重试');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 渲染账单列表
     */
    renderBillsList(container, bills) {
        if (!bills || bills.length === 0) {
            container.innerHTML = `
                <div class="no-bills-message">
                    <i class="fas fa-file-invoice"></i>
                    <p>该患者暂无未支付账单</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bills.map(bill => `
            <div class="bill-item" data-bill-id="${bill.id}">
                <div class="bill-checkbox">
                    <input type="checkbox" id="bill-${bill.id}" class="bill-select">
                    <label for="bill-${bill.id}"></label>
                </div>
                <div class="bill-info">
                    <div class="bill-header">
                        <span class="bill-invoice">${bill.invoice_number}</span>
                        <span class="bill-amount">¥${bill.total_amount.toFixed(2)}</span>
                    </div>
                    <div class="bill-details">
                        <span class="bill-date">${new Date(bill.created_at).toLocaleDateString()}</span>
                        <span class="bill-status status-${bill.status}">${this.getStatusText(bill.status)}</span>
                    </div>
                    <div class="bill-description">
                        ${bill.description || '医疗费用'}
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定账单选择事件
        container.querySelectorAll('.bill-select').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleBillSelection(e.target);
            });
        });
    }

    /**
     * 处理账单选择
     */
    handleBillSelection(checkbox) {
        const billId = parseInt(checkbox.id.replace('bill-', ''));
        const billItem = checkbox.closest('.bill-item');
        const amount = parseFloat(billItem.querySelector('.bill-amount').textContent.replace('¥', ''));

        if (checkbox.checked) {
            this.selectedBills.add({ id: billId, amount });
            billItem.classList.add('selected');
        } else {
            this.selectedBills.delete([...this.selectedBills].find(bill => bill.id === billId));
            billItem.classList.remove('selected');
        }

        this.updatePaymentSummary();
    }

    /**
     * 更新支付摘要
     */
    updatePaymentSummary() {
        const container = document.querySelector('.merged-payment-container');
        const selectedCount = this.selectedBills.size;
        const totalAmount = [...this.selectedBills].reduce((sum, bill) => sum + bill.amount, 0);

        const selectedCountElement = container.querySelector('.selected-count');
        const totalAmountElement = container.querySelector('.total-amount');
        const proceedButton = container.querySelector('.proceed-payment-btn');

        selectedCountElement.textContent = getTranslation('merged_payment.selected_count').replace('{count}', selectedCount);
        totalAmountElement.textContent = `¥${totalAmount.toFixed(2)}`;
        
        proceedButton.disabled = selectedCount === 0;
        proceedButton.classList.toggle('btn-success', selectedCount > 0);
        proceedButton.classList.toggle('btn-secondary', selectedCount === 0);
    }

    /**
     * 全选账单
     */
    selectAllBills(container) {
        const checkboxes = container.querySelectorAll('.bill-select');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                this.handleBillSelection(checkbox);
            }
        });
    }

    /**
     * 取消全选
     */
    deselectAllBills(container) {
        const checkboxes = container.querySelectorAll('.bill-select');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                this.handleBillSelection(checkbox);
            }
        });
    }

    /**
     * 显示支付方式模态框
     */
    showPaymentMethodModal() {
        if (this.selectedBills.size === 0) {
            this.showError(getTranslation('merged_payment.no_bills_selected'));
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('paymentMethodModal'));
        modal.show();
    }

    /**
     * 发起支付
     */
    async initiatePayment(paymentMethod) {
        if (this.selectedBills.size === 0) {
            this.showError(getTranslation('merged_payment.no_bills_selected'));
            return;
        }

        // 关闭支付方式选择模态框
        const methodModal = bootstrap.Modal.getInstance(document.getElementById('paymentMethodModal'));
        methodModal.hide();

        // 显示支付状态模态框
        this.showPaymentStatusModal('creating');

        try {
            const billIds = [...this.selectedBills].map(bill => bill.id);
            const response = await fetch('/api/finance/merged-payments/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bill_ids: billIds,
                    payment_method: paymentMethod
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentSession = data.session;
                this.showPaymentStatusModal('waiting', data.session);
                this.startPaymentStatusPolling();
            } else {
                this.showPaymentStatusModal('failed', null, data.message);
            }
        } catch (error) {
            console.error('创建支付会话失败:', error);
            this.showPaymentStatusModal('failed', null, '网络错误，请重试');
        }
    }

    /**
     * 显示支付状态模态框
     */
    showPaymentStatusModal(status, session = null, errorMessage = null) {
        const modal = document.getElementById('paymentStatusModal');
        const content = modal.querySelector('.payment-status-content');
        const cancelBtn = modal.querySelector('.cancel-payment-btn');
        const refreshBtn = modal.querySelector('.refresh-status-btn');

        let contentHtml = '';

        switch (status) {
            case 'creating':
                contentHtml = `
                    <div class="payment-status creating">
                        <div class="status-icon">
                            <div class="spinner-border text-primary" role="status"></div>
                        </div>
                        <h4 data-i18n="merged_payment.creating">正在创建支付会话...</h4>
                        <p>请稍候，正在为您准备支付信息</p>
                    </div>
                `;
                cancelBtn.style.display = 'inline-block';
                refreshBtn.style.display = 'none';
                break;

            case 'waiting':
                contentHtml = `
                    <div class="payment-status waiting">
                        <div class="qr-code-section">
                            <div class="qr-code-container">
                                <div id="qr-code"></div>
                            </div>
                            <p data-i18n="merged_payment.scan_to_pay">请使用手机扫码支付</p>
                        </div>
                        <div class="payment-info">
                            <div class="info-item">
                                <span data-i18n="merged_payment.total_amount">合计金额:</span>
                                <strong>¥${session.total_amount.toFixed(2)}</strong>
                            </div>
                            <div class="info-item">
                                <span data-i18n="merged_payment.session_id">支付会话ID:</span>
                                <code>${session.session_id}</code>
                            </div>
                            <div class="info-item">
                                <span data-i18n="merged_payment.timeout">支付超时时间:</span>
                                <span>${session.timeout_minutes} <span data-i18n="merged_payment.minutes">分钟</span></span>
                            </div>
                        </div>
                        <div class="status-indicator">
                            <div class="pulse-dot"></div>
                            <span data-i18n="merged_payment.waiting_payment">等待支付...</span>
                        </div>
                    </div>
                `;
                cancelBtn.style.display = 'inline-block';
                refreshBtn.style.display = 'inline-block';
                break;

            case 'success':
                contentHtml = `
                    <div class="payment-status success">
                        <div class="status-icon">
                            <i class="fas fa-check-circle text-success"></i>
                        </div>
                        <h4 data-i18n="merged_payment.payment_success">支付成功</h4>
                        <p>您的支付已完成，账单状态已更新</p>
                        <div class="success-details">
                            <div class="info-item">
                                <span data-i18n="merged_payment.transaction_id">交易号:</span>
                                <code>${session?.transaction_id || 'N/A'}</code>
                            </div>
                            <div class="info-item">
                                <span data-i18n="merged_payment.processed_bills">已处理账单:</span>
                                <span>${this.selectedBills.size}个</span>
                            </div>
                        </div>
                    </div>
                `;
                cancelBtn.style.display = 'none';
                refreshBtn.style.display = 'none';
                break;

            case 'failed':
                contentHtml = `
                    <div class="payment-status failed">
                        <div class="status-icon">
                            <i class="fas fa-times-circle text-danger"></i>
                        </div>
                        <h4 data-i18n="merged_payment.payment_failed">支付失败</h4>
                        <p>${errorMessage || '支付过程中发生错误，请重试'}</p>
                    </div>
                `;
                cancelBtn.style.display = 'inline-block';
                refreshBtn.style.display = 'none';
                break;
        }

        content.innerHTML = contentHtml;
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        // 如果是等待支付状态，生成二维码
        if (status === 'waiting' && session?.qr_code_url) {
            this.generateQRCode(session.qr_code_url);
        }
    }

    /**
     * 生成二维码
     */
    generateQRCode(url) {
        const qrCodeContainer = document.getElementById('qr-code');
        if (qrCodeContainer && typeof QRCode !== 'undefined') {
            qrCodeContainer.innerHTML = '';
            this.qrCodeElement = new QRCode(qrCodeContainer, {
                text: url,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff'
            });
        }
    }

    /**
     * 开始支付状态轮询
     */
    startPaymentStatusPolling() {
        if (this.paymentStatusInterval) {
            clearInterval(this.paymentStatusInterval);
        }

        this.paymentStatusInterval = setInterval(async () => {
            await this.checkPaymentStatus();
        }, 3000); // 每3秒检查一次
    }

    /**
     * 检查支付状态
     */
    async checkPaymentStatus() {
        if (!this.currentSession) return;

        try {
            const response = await fetch(`/api/finance/merged-payments/sessions/${this.currentSession.session_id}`);
            const data = await response.json();

            if (data.success) {
                const session = data.session;
                
                if (session.status === 'COMPLETED') {
                    this.stopPaymentStatusPolling();
                    this.showPaymentStatusModal('success', session);
                    // 3秒后自动关闭并刷新页面
                    setTimeout(() => {
                        this.closePaymentModal();
                        this.goBackToBillList();
                    }, 3000);
                } else if (session.status === 'FAILED' || session.status === 'EXPIRED') {
                    this.stopPaymentStatusPolling();
                    this.showPaymentStatusModal('failed', session, '支付超时或失败');
                }
            }
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    }

    /**
     * 停止支付状态轮询
     */
    stopPaymentStatusPolling() {
        if (this.paymentStatusInterval) {
            clearInterval(this.paymentStatusInterval);
            this.paymentStatusInterval = null;
        }
    }

    /**
     * 刷新支付状态
     */
    async refreshPaymentStatus() {
        await this.checkPaymentStatus();
    }

    /**
     * 取消支付
     */
    cancelPayment() {
        this.stopPaymentStatusPolling();
        this.currentSession = null;
        this.closePaymentModal();
    }

    /**
     * 关闭支付模态框
     */
    closePaymentModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentStatusModal'));
        if (modal) {
            modal.hide();
        }
    }

    /**
     * 返回账单列表
     */
    goBackToBillList() {
        // 触发返回事件，由父组件处理
        const event = new CustomEvent('mergedPaymentBack');
        document.dispatchEvent(event);
    }

    /**
     * 显示快速支付选项
     */
    showQuickPayOptions(patientId) {
        // 自动选择所有账单并显示支付方式
        const container = document.querySelector('.merged-payment-container');
        this.selectAllBills(container);
        
        if (this.selectedBills.size > 0) {
            this.showPaymentMethodModal();
        } else {
            this.showError('没有可支付的账单');
        }
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'PENDING': getTranslation('finance.status.PENDING'),
            'PAID': getTranslation('finance.status.PAID'),
            'CANCELLED': getTranslation('finance.status.CANCELLED'),
            'REFUNDED': getTranslation('finance.status.REFUNDED')
        };
        return statusMap[status] || status;
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 使用现有的通知系统
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stopPaymentStatusPolling();
        this.selectedBills.clear();
        this.currentSession = null;
        this.qrCodeElement = null;
    }
}

// 导出模块
export { MergedPaymentManager };
window.MergedPaymentManager = MergedPaymentManager;