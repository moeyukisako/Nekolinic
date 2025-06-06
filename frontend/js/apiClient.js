// API 客户端 - 封装所有API请求并处理授权
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/v1' 
    : '/api/v1';

// 存储当前用户信息
let currentUser = null;

// 封装一个能处理错误的fetch函数
async function authorizedFetch(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${url}`, { 
        ...options, 
        headers 
    });

    if (response.status === 401) {
        // Token失效或未登录
        alert('您的登录已过期，请重新登录。');
        localStorage.removeItem('accessToken');
        window.location.href = '/index.html'; // 跳转到首页
        throw new Error('认证失败');
    }

    if (response.status === 403) {
        // 权限不足
        alert('您没有执行此操作的权限。');
        throw new Error('权限不足');
    }

    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.detail || '操作失败');
        } catch (e) {
            throw new Error(`请求失败 (${response.status})`);
        }
    }

    // 对于204 No Content等成功但无返回体的响应
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// API功能模块
const apiClient = {
    // 认证相关
    auth: {
        // 登录
        login: async (username, password) => {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(`${API_BASE_URL}/users/token`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '登录失败');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.access_token);
            return data;
        },

        // 获取当前用户信息
        getCurrentUser: async () => {
            if (!currentUser) {
                currentUser = await authorizedFetch('/users/me');
            }
            return currentUser;
        },

        // 登出
        logout: () => {
            localStorage.removeItem('accessToken');
            currentUser = null;
            window.location.href = '/index.html';
        }
    },

    // 患者相关
    patients: {
        getAll: () => authorizedFetch('/patients'),
        getById: (id) => authorizedFetch(`/patients/${id}`),
        create: (data) => authorizedFetch('/patients', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        update: (id, data) => authorizedFetch(`/patients/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        }),
        delete: (id) => authorizedFetch(`/patients/${id}`, { method: 'DELETE' }),
        
        // 患者病历相关
        getMedicalRecords: (patientId) => authorizedFetch(`/patients/${patientId}/medical-records`),
        createMedicalRecord: (patientId, data) => authorizedFetch(`/patients/${patientId}/medical-records`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    
    // 财务相关
    finance: {
        getBills: () => authorizedFetch('/finance/bills'),
        getBillById: (id) => authorizedFetch(`/finance/bills/${id}`),
        createPayment: (data) => authorizedFetch('/finance/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    
    // 药房相关
    pharmacy: {
        getMedicines: () => authorizedFetch('/pharmacy/medicines'),
        getMedicineById: (id) => authorizedFetch(`/pharmacy/medicines/${id}`),
        getPrescriptions: () => authorizedFetch('/pharmacy/prescriptions'),
        getPrescriptionById: (id) => authorizedFetch(`/pharmacy/prescriptions/${id}`),
        createPrescription: (data) => authorizedFetch('/pharmacy/prescriptions', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    
    // 报告相关
    reports: {
        getFinancialSummary: (startDate, endDate) => authorizedFetch('/reports/financial-summary', {
            method: 'POST',
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        })
    }
};

// 导出API客户端
window.apiClient = apiClient; 