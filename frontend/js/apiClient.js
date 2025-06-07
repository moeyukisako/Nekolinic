// frontend/js/apiClient.js (最终正确版本)


const API_BASE_URL = '/api/v1';


// 存储当前用户信息

let currentUser = null;


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

            alert('登录会话已过期，请重新登录。');

            localStorage.removeItem('accessToken');

            window.location.href = '/index.html'; // 修改为 index.html

            throw new Error('认证失败 (401)');

        }


        if (response.status === 204) { // No Content

            return null;

        }


        const responseData = await response.json();


        if (!response.ok) {

            throw new Error(responseData.detail || `请求失败 (${response.status})`);

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

            const response = await fetch(`${API_BASE_URL}/users/login`, {

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

            return data;

        },

        logout: () => {

            localStorage.removeItem('accessToken');

            currentUser = null;

            window.location.href = '/index.html'; // 修改为 index.html

        },

        getCurrentUser: () => apiRequest('/users/me'),

        updatePreferences: (data) => apiRequest('/users/me/preferences', {

            method: 'PUT',

            body: JSON.stringify(data)

        })

    },


    // 患者相关 (使用 page/per_page)

    patients: {

        getAll: (page = 1, per_page = 15, query = '') => {

            const params = new URLSearchParams({ page, per_page });

            if (query) params.append('query', query);

            return apiRequest(`/patients/?${params.toString()}`);

        },

        search: (query, page = 1, per_page = 15) => {

            return apiClient.patients.getAll(page, per_page, query);

        },

        getById: (id) => apiRequest(`/patients/${id}`),

        create: (data) => apiRequest('/patients/', { method: 'POST', body: JSON.stringify(data) }),

        update: (id, data) => apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

        delete: (id) => apiRequest(`/patients/${id}`, { method: 'DELETE' })

    },

    

    // --- 病历管理API ---
    medicalRecords: {
        getAll: (options = {}) => {
            const { page = 1, limit = 10, search = '' } = options;
            const params = new URLSearchParams({ page, per_page: limit });
            if (search) params.append('search', search);
            return apiRequest(`/patients/medical-records/?${params.toString()}`);
        },
        getByPatientId: (patientId, page = 1, per_page = 10) => {
            const params = new URLSearchParams({ page, per_page });
            return apiRequest(`/patients/${patientId}/medical-records/?${params.toString()}`);
        },
        getById: (recordId) => apiRequest(`/patients/medical-records/${recordId}`),

        /**
         * 创建一个新的病历
         * @param {object} recordData 包含所有必需字段的病历对象 (patient_id, doctor_id, record_date, etc.)
         */
        create: (recordData) => {
            const patientId = recordData.patient_id;
            if (!patientId) {
                throw new Error("创建病历时，数据中必须提供 patient_id");
            }
            return apiRequest(`/patients/${patientId}/medical-records/`, {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
        },

        update: (recordId, data) => apiRequest(`/patients/medical-records/${recordId}`, { 

            method: 'PUT', 

            body: JSON.stringify(data) 

        }),

        delete: (recordId) => apiRequest(`/patients/medical-records/${recordId}`, { 

            method: 'DELETE' 

        })

    },

    

    // 财务相关

    finance: {

        getBills: () => apiRequest('/finance/bills'),

        getBillById: (id) => apiRequest(`/finance/bills/${id}`),

        createPayment: (data) => apiRequest('/finance/payments', {

            method: 'POST',

            body: JSON.stringify(data)

        })

    },

    

    // 药房相关
    medicines: {
        /**
         * 获取所有药品（支持分页和搜索）
         * @param {object} options - { page, limit, search }
         * @returns {Promise<object>} 包含medicines数组和分页信息的对象
         */
        getAll: (options = {}) => {
            const { page = 1, limit = 10, search = '' } = options;
            const params = new URLSearchParams({ page, per_page: limit });
            if (search) params.append('search', search);
            return apiRequest(`/pharmacy/medicines/?${params.toString()}`);
        },
        /**
         * 获取药品列表（支持搜索）
         * @param {string} [searchTerm=''] - 搜索关键词
         * @returns {Promise<Array>} 药品对象数组
         */
        list: (searchTerm = '') => apiRequest(`/pharmacy/medicines/?search=${encodeURIComponent(searchTerm)}`),
        
        /**
         * 根据ID获取单个药品信息
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 单个药品对象
         */
        getById: (id) => apiRequest(`/pharmacy/medicines/${id}`),

        /**
         * 创建新药品
         * @param {object} medicineData - { name, specification, manufacturer, stock }
         * @returns {Promise<object>} 创建成功的药品对象
         */
        create: (medicineData) => apiRequest('/pharmacy/medicines/', {
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
        update: (id, medicineData) => apiRequest(`/pharmacy/medicines/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(medicineData)
        }),

        /**
         * 删除药品
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 成功删除的响应
         */
        delete: (id) => apiRequest(`/pharmacy/medicines/${id}`, { method: 'DELETE' })
    },

    /**
     * @namespace apiClient.prescriptions
     * @description 用于与处方相关的API交互
     */
    prescriptions: {
        /**
         * 为指定病历创建一条处方记录
         * @param {object} prescriptionData - { medical_record_id, medicine_id, dosage, frequency, notes }
         * @returns {Promise<object>} 创建成功的处方对象
         */
        create: (prescriptionData) => apiRequest('/pharmacy/prescriptions/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(prescriptionData)
        }),
        
        /**
         * 根据病历ID获取其所有处方记录
         * @param {number} medicalRecordId - 病历ID
         * @returns {Promise<Array>} 该病历的处方对象数组
         */
        getByMedicalRecordId: (medicalRecordId) => apiRequest(`/pharmacy/prescriptions/medical_record/${medicalRecordId}`),
        
        /**
         * 获取所有处方
         * @returns {Promise<Array>} 处方对象数组
         */
        getAll: () => apiRequest('/pharmacy/prescriptions/'),
        
        /**
         * 删除指定处方
         * @param {number} id - 处方ID
         * @returns {Promise<object>} 成功删除的响应
         */
        delete: (id) => apiRequest(`/pharmacy/prescriptions/${id}`, { method: 'DELETE' })
    },

    // 报告相关
    reports: {
        getFinancialSummary: (startDate, endDate) => apiRequest('/reports/financial-summary', {
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