/**
 * PDF预览功能模块
 * 提供处方和病历的PDF预览功能
 */

import { showNotification } from '../utils/ui.js';

/**
 * 预览处方PDF
 * @param {number} prescriptionId - 处方ID
 */
window.previewPrescriptionPDF = async function(prescriptionId) {
    if (!prescriptionId) {
        if (window.showNotification) {
            window.showNotification('PDF预览失败', '处方ID无效', 'error');
        } else {
            alert('处方ID无效');
        }
        return;
    }

    try {
        // 显示加载通知
        if (window.showNotification) {
            window.showNotification('正在生成PDF预览...', 'info');
        }
        
        // 获取当前语言设置
        const currentLanguage = window.configManager ? window.configManager.get('language', 'zh-CN') : 'zh-CN';
        
        // 调用后端API生成PDF
        const response = await fetch(`/api/v1/reports/prescription/${prescriptionId}/pdf?language=${currentLanguage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 获取PDF数据
        const blob = await response.blob();
        
        // 获取翻译文本
        const prescriptionText = window.getTranslation ? window.getTranslation('prescription_form', '处方') : '处方';
        
        // 创建PDF预览模态框
        showPDFPreviewModal(blob, `${prescriptionText} #${prescriptionId}`);
        
    } catch (error) {
        console.error('预览处方PDF失败:', error);
        if (window.showNotification) {
            window.showNotification('PDF预览失败', `预览处方PDF失败: ${error.message}`, 'error');
        } else {
            alert(`预览处方PDF失败: ${error.message}`);
        }
    }
};

/**
 * 预览病历PDF
 * @param {number} recordId - 病历ID
 */
window.previewMedicalRecordPDF = async function(recordId) {
    if (!recordId || recordId === 'null') {
        if (window.showNotification) {
            window.showNotification('PDF预览失败', '请先保存病历后再预览PDF', 'warning');
        } else {
            alert('请先保存病历后再预览PDF');
        }
        return;
    }

    try {
        // 显示加载通知
        if (window.showNotification) {
            window.showNotification('正在生成PDF预览...', 'info');
        }
        
        // 获取当前语言设置
        const currentLanguage = window.configManager ? window.configManager.get('language', 'zh-CN') : 'zh-CN';
        
        // 调用后端API生成PDF
        const response = await fetch(`/api/v1/reports/medical-record/${recordId}/pdf?language=${currentLanguage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 获取PDF数据
        const blob = await response.blob();
        
        // 获取翻译文本
        const medicalRecordText = window.getTranslation ? window.getTranslation('medical_record_info', '病历') : '病历';
        
        // 创建PDF预览模态框
        showPDFPreviewModal(blob, `${medicalRecordText} #${recordId}`);
        
    } catch (error) {
        console.error('预览病历PDF失败:', error);
        if (window.showNotification) {
            window.showNotification('PDF预览失败', `预览病历PDF失败: ${error.message}`, 'error');
        } else {
            alert(`预览病历PDF失败: ${error.message}`);
        }
    }
};

/**
 * 显示PDF预览模态框
 * @param {Blob} pdfBlob - PDF文件数据
 * @param {string} title - 模态框标题
 */
function showPDFPreviewModal(pdfBlob, title) {
    // 创建PDF URL
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // 获取翻译文本
    const pdfPreviewTitle = window.getTranslation ? window.getTranslation('pdf_preview_title', 'PDF预览') : 'PDF预览';
    const downloadPdfText = window.getTranslation ? window.getTranslation('download_pdf', '下载PDF') : '下载PDF';
    const printText = window.getTranslation ? window.getTranslation('print_pdf', '打印') : '打印';
    const closeText = window.getTranslation ? window.getTranslation('close', '关闭') : '关闭';
    
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal-overlay" id="pdf-preview-modal">
            <div class="modal-content pdf-preview-modal">
                <div class="modal-header">
                    <h3>${title} - ${pdfPreviewTitle}</h3>
                    <button class="modal-close" onclick="closePDFPreviewModal()">&times;</button>
                </div>
                <div class="modal-body pdf-preview-body">
                    <div class="pdf-toolbar">
                        <button type="button" class="btn btn-primary" onclick="downloadPDF('${pdfUrl}', '${title}.pdf')">
                            <i class="fas fa-download"></i> ${downloadPdfText}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="printPDF('${pdfUrl}')">
                            <i class="fas fa-print"></i> ${printText}
                        </button>
                    </div>
                    <div class="pdf-viewer">
                        <iframe src="${pdfUrl}" width="100%" height="600px" frameborder="0"></iframe>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePDFPreviewModal()">${closeText}</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = document.getElementById('pdf-preview-modal');
    modal.classList.add('active');
    
    // 添加ESC键关闭功能
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closePDFPreviewModal();
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // 存储清理函数
    modal._cleanup = () => {
        document.removeEventListener('keydown', handleEscape);
        URL.revokeObjectURL(pdfUrl);
    };
}

/**
 * 关闭PDF预览模态框
 */
window.closePDFPreviewModal = function() {
    const modal = document.getElementById('pdf-preview-modal');
    if (modal) {
        // 执行清理
        if (modal._cleanup) {
            modal._cleanup();
        }
        modal.remove();
    }
};

/**
 * 下载PDF文件
 * @param {string} pdfUrl - PDF URL
 * @param {string} filename - 文件名
 */
window.downloadPDF = function(pdfUrl, filename) {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * 打印PDF文件
 * @param {string} pdfUrl - PDF URL
 */
window.printPDF = function(pdfUrl) {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
        printWindow.onload = function() {
            printWindow.print();
        };
    } else {
        Modal.notification('无法打开打印窗口，请检查浏览器弹窗设置', 'warning', '打印失败');
    }
};

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        previewPrescriptionPDF: window.previewPrescriptionPDF,
        previewMedicalRecordPDF: window.previewMedicalRecordPDF,
        closePDFPreviewModal: window.closePDFPreviewModal,
        downloadPDF: window.downloadPDF,
        printPDF: window.printPDF
    };
}