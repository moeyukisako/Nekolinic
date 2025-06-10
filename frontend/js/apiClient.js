// frontend/js/apiClient.js (最终正确版本)


const API_BASE_URL = 'http://localhost:8000';


// 存储当前用户信息

let currentUser = null;

// 防止重复处理401错误的标志
let isHandling401 = false;

// 封装一个能处理错误的、统一的fetch函数

async function apiRequest(endpoint, options = {}) {

    const token = localStorage.getItem('accessToken');

    const headers = {

        'Content-Type': 'application/json',

        ...(options.headers || {}),

    };

    if (token) {

        headers['Authorization'] = `Bearer ${token}`;

    }


    const config = { ...options, headers };


    try {

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);


        if (response.status === 401) {
            // 防止并发请求重复处理401错误
            if (isHandling401) {
                // 等待一段时间后再抛出错误，避免并发请求立即失败
                await new Promise(resolve => setTimeout(resolve, 200));
                throw new Error('认证失败 (401)');
            }
            
            isHandling401 = true;
            
            // 检查当前页面是否为index.html，避免循环alert
            const currentPage = window.location.pathname;
            const isIndexPage = currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/');
            
            // 清除token
            localStorage.removeItem('accessToken');
            
            // 只在非index页面显示提示和重定向
            if (!isIndexPage) {
                if (window.showNotification) {
                    window.showNotification(
                        window.getTranslation ? window.getTranslation('session_expired', '登录会话已过期') : '登录会话已过期',
                        window.getTranslation ? window.getTranslation('please_login_again', '请重新登录') : '请重新登录',
                        'warning'
                    );
                } else {
                    alert('登录会话已过期，请重新登录。');
                }
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 300); // 增加延迟时间
            }
            
            // 延迟重置标志，确保其他并发请求有时间处理
            setTimeout(() => {
                isHandling401 = false;
            }, 500);
            
            throw new Error('认证失败 (401)');
        }


        if (response.status === 204) { // No Content

            return null;

        }


        const responseData = await response.json();


        if (!response.ok) {
            let errorMessage = `请求失败 (${response.status})`;
            
            if (responseData.detail) {
                if (Array.isArray(responseData.detail)) {
                    // 处理验证错误数组
                    errorMessage = responseData.detail.map(err => {
                        if (typeof err === 'object' && err.msg) {
                            return `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`;
                        }
                        return String(err);
                    }).join('; ');
                } else if (typeof responseData.detail === 'object') {
                    // 处理对象类型的错误
                    errorMessage = JSON.stringify(responseData.detail);
                } else {
                    // 处理字符串类型的错误
                    errorMessage = responseData.detail;
                }
            }
            
            throw new Error(errorMessage);
        }

        

        return responseData;

    } catch (error) {

        console.error(`API请求错误: ${error.message}`);

        throw error; // 继续抛出错误，让调用方可以catch

    }

}


// API功能模块

const apiClient = {

    // 认证相关

    auth: {

        login: async (username, password) => {

            const body = JSON.stringify({ username, password });

            const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: body

            });


            if (!response.ok) {

                const errorData = await response.json().catch(() => ({}));

                throw new Error(errorData.detail || '登录失败，请检查用户名或密码');

            }

            const data = await response.json();

            localStorage.setItem('accessToken', data.access_token);
            
            // 重置401处理标志
            isHandling401 = false;

            return data;

        },

        logout: () => {

            localStorage.removeItem('accessToken');

            currentUser = null;

            window.location.href = '/index.html'; // 修改为 index.html

        },

        getCurrentUser: () => apiRequest('/api/v1/users/me'),
        updatePreferences: (data) => apiRequest('/api/v1/users/me/preferences', {

            method: 'PUT',

            body: JSON.stringify(data)

        })

    },


    // 患者相关 (使用 page/per_page)

    patients: {

        getAll: (page = 1, per_page = 15, query = '') => {
            // 确保参数是有效的数字
            const validPage = parseInt(page) || 1;
            const validPerPage = parseInt(per_page) || 15;
            
            const params = new URLSearchParams({ 
                skip: (validPage - 1) * validPerPage, 
                limit: validPerPage 
            });
            if (query) params.append('name', query);
            return apiRequest(`/api/v1/patients/?${params.toString()}`);
        },

        search: (query, page = 1, per_page = 15) => {

            return apiClient.patients.getAll(page, per_page, query);

        },

        getById: (id) => apiRequest(`/api/v1/patients/${id}`),

        create: (data) => apiRequest('/api/v1/patients/', { method: 'POST', body: JSON.stringify(data) }),

        update: (id, data) => apiRequest(`/api/v1/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

        delete: (id) => apiRequest(`/api/v1/patients/${id}`, { method: 'DELETE' })

    },

    

    // --- 病历管理API ---
    medicalRecords: {
        getAll: (options = {}) => {
            const { page = 1, limit = 10, search = '' } = options;
            const params = new URLSearchParams({ page, per_page: limit });
            if (search) params.append('search', search);
            return apiRequest(`/api/v1/patients/medical-records/?${params.toString()}`);
        },
        
        // 获取指定患者的所有病历
        getMedicalRecords: (patientId) => {
            return apiRequest(`/api/v1/patients/${patientId}/medical-records`);
        },
        
        getByPatientId: (patientId, page = 1, per_page = 10) => {
            const params = new URLSearchParams({ page, per_page });
            return apiRequest(`/api/v1/patients/${patientId}/medical-records/?${params.toString()}`);
        },
        getById: (recordId) => apiRequest(`/api/v1/patients/medical-records/${recordId}`),

        /**
         * 创建一个新的病历
         * @param {object} recordData 包含所有必需字段的病历对象 (patient_id, doctor_id, record_date, etc.)
         */
        create: (recordData) => {
            return apiRequest('/api/v1/clinic/medical-records/', {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
        },
        
        // 为指定患者创建病历
        createMedicalRecord: (recordData) => {
            return apiRequest('/api/v1/clinic/medical-records/', {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
        },

        update: (recordId, data) => apiRequest(`/api/v1/patients/medical-records/${recordId}`, { 

            method: 'PUT', 

            body: JSON.stringify(data) 

        }),

        delete: (recordId) => apiRequest(`/api/v1/patients/medical-records/${recordId}`, { 

            method: 'DELETE' 

        })

    },

    

    // 财务相关
    finance: {
        getBills: (params = {}) => {
            const { skip = 0, limit = 20 } = params;
            return apiRequest(`/api/v1/finance/bills/?skip=${skip}&limit=${limit}`);
        },
        getBillById: (id) => apiRequest(`/api/v1/finance/bills/${id}`),
        deleteBill: (id) => apiRequest(`/api/v1/finance/bills/${id}`, {
            method: 'DELETE'
        }),
        createPayment: (data) => apiRequest('/api/v1/finance/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        generateBillFromRecord: (medicalRecordId) => apiRequest(`/api/v1/finance/billing/generate-from-record/${medicalRecordId}`, {
            method: 'POST'
        }),
        createBill: (billData) => apiRequest('/api/v1/finance/bills', {
            method: 'POST',
            body: JSON.stringify(billData)
        }),
        // 获取患者未支付账单
        getPatientUnpaidBills: (patientId) => {
            return apiRequest(`/api/v1/finance/merged-payments/patients/${patientId}/unpaid-bills`);
        },
        // 创建合并支付会话
        createMergedPaymentSession: (data) => apiRequest('/api/v1/finance/merged-payments/sessions', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        // 获取合并支付会话状态
        getMergedPaymentSessionStatus: (sessionId) => apiRequest(`/api/v1/finance/merged-payments/sessions/${sessionId}/status`)
    },
    
    // 药房相关
    medicines: {
        /**
         * 获取所有药品（支持分页和搜索）
         * @param {object} options - { page, limit, search }
         * @returns {Promise<object>} 包含medicines数组和分页信息的对象
         */
        getAll: async (options = {}) => {
            const { page = 1, limit = 10, search = '' } = options;
            const skip = (page - 1) * limit;
            const params = new URLSearchParams({ skip, limit });
            if (search) params.append('search', search);
            const response = await apiRequest(`/api/v1/pharmacy/medicines/?${params.toString()}`);
            
            // 后端现在返回正确的分页格式，直接返回
            return {
                items: response.items,
                total_pages: Math.ceil(response.total / limit) || 1,
                current_page: page,
                total_items: response.total
            };
        },
        /**
         * 获取药品列表（支持搜索）
         * @param {string} [searchTerm=''] - 搜索关键词
         * @returns {Promise<Array>} 药品对象数组
         */
        list: (searchTerm = '') => apiRequest(`/api/v1/pharmacy/medicines/?search=${encodeURIComponent(searchTerm)}`),
        
        /**
         * 根据ID获取单个药品信息
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 单个药品对象
         */
        getById: (id) => apiRequest(`/api/v1/pharmacy/medicines/${id}`),

        /**
         * 创建新药品
         * @param {object} medicineData - { name, specification, manufacturer, stock }
         * @returns {Promise<object>} 创建成功的药品对象
         */
        create: (medicineData) => apiRequest('/api/v1/pharmacy/medicines/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(medicineData)
        }),

        /**
         * 更新药品信息
         * @param {number} id - 药品ID
         * @param {object} medicineData - 更新的药品数据
         * @returns {Promise<object>} 更新成功的药品对象
         */
        update: (id, medicineData) => apiRequest(`/api/v1/pharmacy/medicines/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(medicineData)
        }),

        /**
         * 删除药品
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 成功删除的响应
         */
        delete: (id) => apiRequest(`/api/v1/pharmacy/medicines/${id}`, { method: 'DELETE' }),

        /**
         * 获取药品当前库存
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 库存信息
         */
        getStock: (id) => apiRequest(`/api/v1/pharmacy/inventory/drugs/${id}/stock`),

        /**
         * 获取药品库存变动历史
         * @param {number} id - 药品ID
         * @param {object} options - { page, limit }
         * @returns {Promise<object>} 库存变动历史
         */
        getStockHistory: (id, options = {}) => {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;
            const params = new URLSearchParams({ skip, limit });
            return apiRequest(`/api/v1/pharmacy/inventory/drugs/${id}/history?${params.toString()}`);
        },

        /**
         * 药品入库
         * @param {object} stockData - { drug_id, quantity, notes }
         * @returns {Promise<object>} 入库结果
         */
        addStock: (stockData) => apiRequest('/api/v1/pharmacy/inventory/stock-in', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(stockData)
        }),

        /**
         * 批量药品入库
         * @param {object} bulkStockData - { items: [{ drug_id, quantity, cost_price, notes }], notes }
         * @returns {Promise<Array>} 批量入库结果
         */
        bulkAddStock: (bulkStockData) => apiRequest('/api/v1/pharmacy/inventory/bulk-stock-in', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bulkStockData)
        }),

        /**
         * 获取库存低于阈值的药品
         * @returns {Promise<Array>} 低库存药品列表
         */
        getLowStock: () => apiRequest('/api/v1/pharmacy/inventory/low-stock')
    },

    /**
     * @namespace apiClient.prescriptions
     * @description 用于与处方相关的API交互
     */
    prescriptions: {
        /**
         * 为指定病历创建一条处方记录
         * @param {object} prescriptionData - { medical_record_id, prescription_date, details: [{ drug_id, quantity, dosage, frequency, notes }] }
         * @returns {Promise<object>} 创建成功的处方对象
         */
        create: (prescriptionData) => apiRequest('/api/v1/pharmacy/prescriptions/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescriptionData)
        }),
        /**
         * 根据病历ID获取其所有处方记录
         * @param {number} medicalRecordId - 病历ID
         * @returns {Promise<Array>} 该病历的处方对象数组
         */
        getByMedicalRecordId: (medicalRecordId) => apiRequest(`/api/v1/pharmacy/prescriptions/medical_record/${medicalRecordId}`),
        /**
         * 获取所有处方
         * @returns {Promise<Array>} 处方对象数组
         */
        getAll: () => apiRequest('/api/v1/pharmacy/prescriptions/'),
        /**
         * 根据ID获取单个处方详情
         * @param {number} id - 处方ID
         * @returns {Promise<object>} 处方对象
         */
        getById: (id) => apiRequest(`/api/v1/pharmacy/prescriptions/${id}`),
        /**
         * 更新处方
         * @param {number} id - 处方ID
         * @param {object} prescriptionData - 更新的处方数据
         * @returns {Promise<object>} 更新后的处方对象
         */
        update: (id, prescriptionData) => apiRequest(`/api/v1/pharmacy/prescriptions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescriptionData)
        }),
        /**
         * 发药操作
         * @param {number} prescriptionId - 处方ID
         * @param {string} notes - 发药备注
         * @returns {Promise<object>} 发药结果
         */
        dispense: (prescriptionId, notes = '') => apiRequest('/api/v1/pharmacy/dispense/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prescription_id: prescriptionId, notes })
        }),
        /**
         * 删除指定处方
         * @param {number} id - 处方ID
         * @returns {Promise<void>}
         */
        delete: (id) => apiRequest(`/api/v1/pharmacy/prescriptions/${id}`, { method: 'DELETE' })
    },

    // 报告相关
    reports: {
        getFinancialSummary: (startDate, endDate) => apiRequest('/api/v1/reports/financial-summary', {
            method: 'POST',
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        })
    },

    // 通用请求方法
    request: (endpoint, options = {}) => apiRequest(endpoint, options)
};

// 确保在所有脚本中都能访问到
window.apiClient = apiClient;

// ES6模块导出
export default apiClient;