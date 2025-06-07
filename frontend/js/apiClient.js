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

            window.location.href = '/login.html'; // 跳转到登录页

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

            window.location.href = '/login.html';

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

        getByPatientId: (patientId, page = 1, per_page = 10) => {

            const params = new URLSearchParams({ page, per_page });

            return apiRequest(`/clinics/patients/${patientId}/medical_records/?${params.toString()}`);

        },

        getById: (recordId) => apiRequest(`/clinics/medical_records/${recordId}`),

        create: (recordData) => {

            const clinicId = 1; // 临时方案

            return apiRequest(`/clinics/${clinicId}/medical_records/`, {

                method: 'POST',

                body: JSON.stringify(recordData)

            });

        },

        update: (recordId, data) => apiRequest(`/clinics/medical_records/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),

        delete: (recordId) => apiRequest(`/clinics/medical_records/${recordId}`, { method: 'DELETE' })

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

    pharmacy: {

        getMedicines: () => apiRequest('/pharmacy/medicines'),

        getMedicineById: (id) => apiRequest(`/pharmacy/medicines/${id}`),

        getPrescriptions: () => apiRequest('/pharmacy/prescriptions'),

        getPrescriptionById: (id) => apiRequest(`/pharmacy/prescriptions/${id}`),

        createPrescription: (data) => apiRequest('/pharmacy/prescriptions', {

            method: 'POST',

            body: JSON.stringify(data)

        })

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

    }

};


// 确保在所有脚本中都能访问到

window.apiClient = apiClient; 