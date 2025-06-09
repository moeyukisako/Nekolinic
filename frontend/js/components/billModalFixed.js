/**
 * 简化的账单模态框组件
 * 基于debug_bill_simple.html中的SimpleBillModal实现
 * 适用于正式环境
 */

class BillModalFixed {
    constructor(options = {}) {
        this.options = {
            patientName: options.patientName || '测试患者',
            patientId: options.patientId || 'TEST-001',
            recordId: options.recordId || 'REC-001',
            doctorName: options.doctorName || '测试医生',
            onConfirm: options.onConfirm || null,
            onCancel: options.onCancel || null,
            ...options
        };
        this.modal = null;
        this.items = [];
        this.currentModal = null;
        this.billData = {
            id: null, // 将由后端生成
            invoice_number: this.generateInvoiceNumber(),
            bill_date: new Date().toISOString(),
            total_amount: 0,
            status: 'UNPAID',
            patient_id: this.options.patientId,
            medical_record_id: this.options.recordId,
            payment_method: null,
            provider_transaction_id: null
        };
    }
    
    generateBillId() {
        // 临时显示ID，实际ID由后端数据库生成
        return 'BILL-' + Date.now().toString().slice(-8);
    }
    
    generateInvoiceNumber() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0') + 
                       now.getSeconds().toString().padStart(2, '0');
        return `INV-${dateStr}-${timeStr}`;
    }
    
    getCurrentDateTime() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               now.getDate().toString().padStart(2, '0') + ' ' + 
               now.getHours().toString().padStart(2, '0') + ':' + 
               now.getMinutes().toString().padStart(2, '0') + ':' + 
               now.getSeconds().toString().padStart(2, '0');
    }
    
    createModal() {
        console.log('开始创建模态框DOM结构');
        
        // 导入i18n翻译函数
        const t = window.getTranslation || ((key) => key);
        
        const modalHTML = `
            <style>
                .loading-spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .bill-loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--color-bg-primary, rgba(255, 255, 255, 0.9));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    border-radius: 8px;
                }
                
                .theme-dark .bill-loading-overlay,
                [data-theme="dark"] .bill-loading-overlay {
                    background: var(--color-bg-primary, rgba(30, 30, 30, 0.9));
                }
                
                .bill-loading-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    color: var(--color-text-primary, #222831);
                }
                
                .theme-dark .bill-loading-content,
                [data-theme="dark"] .bill-loading-content {
                    color: var(--color-text-primary, #cccccc);
                }
                
                .bill-loading-content i {
                    font-size: 24px;
                    color: var(--color-bar-primary, #39c5bb);
                }
                
                .theme-dark .bill-loading-content i,
                [data-theme="dark"] .bill-loading-content i {
                    color: var(--color-bar-primary, #b30074);
                }
                
                .bill-loading-content span {
                    font-size: 16px;
                    font-weight: 500;
                }
                
                .bill-modal {
                    position: relative;
                }
                
                .bill-modal-dialog {
                    background: var(--color-bg-card, white);
                    color: var(--color-text-primary, #222831);
                    border: 1px solid var(--color-border, #dcdcdc);
                }
                
                .theme-dark .bill-modal-dialog,
                [data-theme="dark"] .bill-modal-dialog {
                    background: var(--color-bg-card, #2d2d30);
                    color: var(--color-text-primary, #cccccc);
                    border-color: var(--color-border, #3e3e42);
                }
                
                .bill-info {
                    background: var(--color-bg-primary, #f8f9fa) !important;
                }
                
                .theme-dark .bill-info,
                [data-theme="dark"] .bill-info {
                    background: var(--color-bg-primary, #1e1e1e) !important;
                }
                
                .bill-modal-header {
                    border-bottom-color: var(--color-border, #dee2e6) !important;
                }
                
                .theme-dark .bill-modal-header,
                [data-theme="dark"] .bill-modal-header {
                    border-bottom-color: var(--color-border, #3e3e42) !important;
                }
                
                .bill-modal-footer {
                    border-top-color: var(--color-border, #dee2e6) !important;
                }
                
                .theme-dark .bill-modal-footer,
                [data-theme="dark"] .bill-modal-footer {
                    border-top-color: var(--color-border, #3e3e42) !important;
                }
                
                .bill-items-table th,
                .bill-items-table td {
                    border-color: var(--color-border, #dee2e6) !important;
                }
                
                .theme-dark .bill-items-table th,
                .theme-dark .bill-items-table td,
                [data-theme="dark"] .bill-items-table th,
                [data-theme="dark"] .bill-items-table td {
                    border-color: var(--color-border, #3e3e42) !important;
                }
                
                .bill-items-table th {
                    background: var(--color-bg-primary, #f8f9fa) !important;
                }
                
                .theme-dark .bill-items-table th,
                [data-theme="dark"] .bill-items-table th {
                    background: var(--color-bg-primary, #1e1e1e) !important;
                }
            </style>
            <div class="bill-modal" id="billModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050;">
                <div class="bill-modal-dialog" style="border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="bill-modal-header" style="padding: 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                        <h5>${t('bill_modal_title')} - ${this.options.patientName}</h5>
                        <button type="button" class="btn btn-secondary" onclick="window.billModalInstance && window.billModalInstance.close()" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #6c757d; color: white;">×</button>
                    </div>
                    <div class="bill-modal-body" style="padding: 20px;">
                        <div class="bill-info" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <div class="row" style="display: flex; margin-bottom: 15px;">
                                <div class="col-md-6" style="flex: 1; padding-right: 10px;">
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('bill_id')}:</span>
                                        <span id="billId" style="color: #6c757d; font-family: monospace;">${this.generateBillId()}</span>
                                    </div>
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('invoice_number')}:</span>
                                        <span id="invoiceNumber" style="color: #6c757d; font-family: monospace;">${this.generateInvoiceNumber()}</span>
                                    </div>
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('generation_time')}:</span>
                                        <span id="billDate" style="color: #6c757d;">${this.getCurrentDateTime()}</span>
                                    </div>
                                </div>
                                <div class="col-md-6" style="flex: 1; padding-left: 10px;">
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('patient_name')}:</span>
                                        <span>${this.options.patientName}</span>
                                    </div>
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('medical_record_id')}:</span>
                                        <span style="color: #6c757d; font-family: monospace;">${this.options.recordId}</span>
                                    </div>
                                    <div class="bill-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 500;">${t('bill_status')}:</span>
                                        <span style="color: #ffc107; font-weight: 500;">${t('bill_status_unpaid')}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="bill-total-section" style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px;">
                                <div class="bill-info-row" style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 18px; font-weight: 600;">${t('total_amount')}:</span>
                                    <span class="total-amount" id="totalAmount" style="font-size: 24px; font-weight: bold; color: #28a745;">¥0.00</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3" style="margin-bottom: 1rem;">
                            <button type="button" class="btn btn-primary add-item-btn" onclick="window.billModalInstance && window.billModalInstance.addItem()" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;">${t('add_item')}</button>
                        </div>
                        
                        <table class="bill-items-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_name')}</th>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_type')}</th>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_quantity')}</th>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_unit_price')}</th>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_subtotal')}</th>
                                    <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; background: #f8f9fa; font-weight: 600;">${t('item_actions')}</th>
                                </tr>
                            </thead>
                            <tbody id="billItemsBody">
                                <!-- 动态添加的项目行 -->
                            </tbody>
                        </table>
                    </div>
                    <div class="bill-modal-footer" style="padding: 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn btn-secondary" onclick="window.billModalInstance && window.billModalInstance.handleCancel()" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #6c757d; color: white;">${t('cancel')}</button>
                        <button type="button" class="btn btn-primary" id="confirmBillBtn" onclick="window.billModalInstance && window.billModalInstance.handleConfirm()" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;">${t('generate_bill')}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('billModal');
        console.log('模态框DOM结构创建完成');
        
        // 设置全局实例引用
        window.billModalInstance = this;
        
        // 添加默认项目
        this.addDefaultItem();
    }
    
    addDefaultItem() {
        console.log('添加默认项目');
        setTimeout(() => {
            this.addItem({
                name: '诊疗费',
                type: 'consultation',
                quantity: 1,
                price: 150.00
            });
        }, 100);
    }
    
    addItem(itemData = {}) {
        const t = window.getTranslation || ((key) => key);
        const tbody = document.getElementById('billItemsBody');
        if (!tbody) {
            console.error(t('console_table_body_not_found'));
            return;
        }
        
        const itemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        const item = {
            id: itemId,
            name: itemData.name || '',
            type: itemData.type || '',
            quantity: itemData.quantity || 1,
            price: itemData.price || 0
        };
        
        const row = document.createElement('tr');
        row.id = itemId;
        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" class="form-control" value="${item.name}" placeholder="${t('item_name_placeholder')}"
                       onchange="window.billModalInstance && window.billModalInstance.updateItemData('${itemId}', 'name', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <select class="form-control" onchange="window.billModalInstance && window.billModalInstance.updateItemData('${itemId}', 'type', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    <option value="">${t('select_type')}</option>
                    <option value="consultation" ${item.type === 'consultation' ? 'selected' : ''}>${t('consultation')}</option>
                    <option value="drug" ${item.type === 'drug' ? 'selected' : ''}>${t('drug')}</option>
                    <option value="treatment" ${item.type === 'treatment' ? 'selected' : ''}>${t('treatment')}</option>
                    <option value="examination" ${item.type === 'examination' ? 'selected' : ''}>${t('examination')}</option>
                    <option value="other" ${item.type === 'other' ? 'selected' : ''}>${t('other')}</option>
                </select>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="number" class="form-control" value="${item.quantity}" min="1" placeholder="${t('quantity_placeholder')}"
                       onchange="window.billModalInstance && window.billModalInstance.updateItemData('${itemId}', 'quantity', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="number" class="form-control" value="${item.price}" min="0" step="0.01" placeholder="${t('unit_price_placeholder')}"
                       onchange="window.billModalInstance && window.billModalInstance.updateItemData('${itemId}', 'price', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <span id="subtotal-${itemId}">${t('subtotal_prefix')}${(item.quantity * item.price).toFixed(2)}</span>
            </td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
                <button type="button" class="btn btn-danger" onclick="window.billModalInstance && window.billModalInstance.removeItem('${itemId}')" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #dc3545; color: white;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        this.items.push(item);
        
        console.log(`${t('console_item_added')}: ${item.name || t('console_unnamed')} (ID: ${itemId})`);
        this.updateTotal();
    }
    
    updateItemData(itemId, field, value) {
        const t = window.getTranslation || ((key) => key);
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item[field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
            
            // 更新小计显示
            const subtotalElement = document.getElementById(`subtotal-${itemId}`);
            if (subtotalElement) {
                subtotalElement.textContent = `${t('subtotal_prefix')}${(item.quantity * item.price).toFixed(2)}`;
            }
            
            console.log(`${t('console_item_data_updated')}: ${field} = ${value}`);
            this.updateTotal();
        }
    }
    
    removeItem(itemId) {
        const t = window.getTranslation || ((key) => key);
        const row = document.getElementById(itemId);
        if (row) {
            row.remove();
            this.items = this.items.filter(item => item.id !== itemId);
            this.updateTotal();
            console.log(`${t('console_item_removed')}: ${itemId}`);
        }
    }
    
    updateTotal() {
        const t = window.getTranslation || ((key) => key);
        const total = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.textContent = `¥${total.toFixed(2)}`;
        }
        console.log(`${t('console_total_updated')}: ¥${total.toFixed(2)}`);
    }
    
    show(patientData = {}) {
        const t = window.getTranslation || ((key) => key);
        this.patientData = patientData;
        
        // 更新患者信息显示
        this.updatePatientInfo();
        
        // 显示模态框
        this.createModal();
        console.log(t('console_modal_shown'));
    }
    
    updatePatientInfo() {
        // 如果有新的患者数据，更新选项
        if (this.patientData && Object.keys(this.patientData).length > 0) {
            this.options = {
                ...this.options,
                ...this.patientData
            };
        }
    }
    
    close() {
        const t = window.getTranslation || ((key) => key);
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            window.billModalInstance = null;
            console.log(t('console_modal_hidden'));
        }
    }
    
    handleConfirm() {
        const t = window.getTranslation || ((key) => key);
        console.log(t('console_start_confirm'));
        
        // 验证数据
        if (this.items.length === 0) {
            alert(t('alert_add_at_least_one_item'));
            return;
        }
        
        // 验证每个项目的必填字段
        for (let item of this.items) {
            if (!item.name || !item.type || item.quantity <= 0 || item.price <= 0) {
                alert(t('alert_complete_all_items'));
                return;
            }
        }
        
        // 显示loading状态
        this.showLoading();
        
        // 模拟异步操作
        setTimeout(() => {
            const billData = this.prepareBillData();
            console.log(t('console_bill_data_prepared'), billData);
            
            if (this.options.onConfirm) {
                this.options.onConfirm(billData);
            }
            
            this.hideLoading();
            this.close();
            
            // 显示成功消息
            alert(t('alert_bill_generated_success'));
        }, 2000);
    }
    
    prepareBillData() {
        // 计算总金额
        const totalAmount = this.items.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);
        
        // 更新账单基本信息
        this.billData.total_amount = totalAmount;
        this.billData.bill_date = new Date().toISOString();
        
        // 准备账单明细数据
        const billItems = this.items.map(item => ({
            item_name: item.name,
            item_type: item.type,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price),
            subtotal: parseFloat((item.quantity * item.price).toFixed(2))
        }));
        
        // 返回完整的账单数据结构
        return {
            bill: {
                invoice_number: this.billData.invoice_number,
                bill_date: this.billData.bill_date,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                status: this.billData.status,
                patient_id: this.options.patientId,
                medical_record_id: this.options.recordId,
                payment_method: this.billData.payment_method,
                provider_transaction_id: this.billData.provider_transaction_id
            },
            items: billItems,
            summary: {
                patient_name: this.options.patientName,
                record_id: this.options.recordId,
                total_items: billItems.length,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                invoice_number: this.billData.invoice_number,
                bill_date: this.getCurrentDateTime()
            }
        };
    }
    
    handleCancel() {
        if (this.options.onCancel && typeof this.options.onCancel === 'function') {
            this.options.onCancel();
        }
        this.close();
    }
    
    showLoading() {
        const t = window.getTranslation || ((key) => key);
        const confirmBtn = this.modal.querySelector('.btn-primary:last-child');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class="fas fa-spinner loading-spinner"></i> ${t('loading_button_text')}`;
        }
        
        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'billLoadingOverlay';
        overlay.className = 'bill-loading-overlay';
        overlay.innerHTML = `
            <div class="bill-loading-content">
                <i class="fas fa-spinner loading-spinner"></i>
                <span>${t('loading_overlay_text')}</span>
            </div>
        `;
        
        const modalDialog = this.modal.querySelector('.bill-modal-dialog');
        modalDialog.style.position = 'relative';
        modalDialog.appendChild(overlay);
    }
    
    hideLoading() {
        const t = window.getTranslation || ((key) => key);
        const confirmBtn = this.modal.querySelector('.btn-primary:last-child');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = t('generate_bill');
        }
        
        const loadingOverlay = this.modal.querySelector('.bill-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
    
    getBillData() {
        return {
            patientId: this.options.patientId,
            patientName: this.options.patientName,
            recordId: this.options.recordId,
            doctorName: this.options.doctorName,
            items: this.items,
            totalAmount: this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
            generatedAt: new Date().toISOString()
        };
    }
}

// 支持ES6模块导出
export default BillModalFixed;

// 支持全局变量导出（兼容非模块环境）
if (typeof window !== 'undefined') {
    window.BillModalFixed = BillModalFixed;
}