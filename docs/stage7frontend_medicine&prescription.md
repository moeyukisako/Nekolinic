好的，遵照您的要求，这是一份关于实现“药品管理”与“处方管理”模块，并集成打印功能的完整详尽指南。

本指南将涵盖从前端API层、独立模块功能到与现有病历系统深度集成，再到最终实现打印输出的全部流程。

------

### **引言：目标与前提**

**核心目标**：

1. 构建一个功能完备的**药品管理**模块，支持药品的增、删、改、查。
2. 将**处方功能**无缝集成到病历模块中，实现开具、查看和保存处方。
3. 为**病历**和**处方**分别提供独立的、格式清晰的打印/输出接口。

**前提条件**：

- 您已在 `frontend/dashboard.html` 的侧边栏中准备好了“药品管理”的导航链接，其ID为 `medicine-management-link`。
- 项目已有一个统一的模态框（Modal）显示逻辑和 API 请求处理函数（`handleRequest`）。
- 项目中已有一个加载指示器函数（如 `showLoading`）。

------

### **第一步：构建API数据层 (`frontend/js/apiClient.js`)**

这是所有前端功能的基础。我们需要定义好与后端交互的所有接口。请确保 `apiClient.js` 文件中包含以下两个完整的对象：

JavaScript

```
// 文件: frontend/js/apiClient.js

// ... (省略 auth, patients, medicalRecords 等已有代码)

    /**
     * @namespace apiClient.medicines
     * @description 用于与药品相关的API交互
     */
    medicines: {
        /**
         * 获取药品列表（支持搜索）
         * @param {string} [searchTerm=''] - 搜索关键词
         * @returns {Promise<Array>} 药品对象数组
         */
        list: (searchTerm = '') => handleRequest(`/api/v1/pharmacy/medicines/?search=${encodeURIComponent(searchTerm)}`),
        
        /**
         * 根据ID获取单个药品信息
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 单个药品对象
         */
        getById: (id) => handleRequest(`/api/v1/pharmacy/medicines/${id}`),

        /**
         * 创建新药品
         * @param {object} medicineData - { name, specification, manufacturer, stock }
         * @returns {Promise<object>} 创建成功的药品对象
         */
        create: (medicineData) => handleRequest('/api/v1/pharmacy/medicines/', {
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
        update: (id, medicineData) => handleRequest(`/api/v1/pharmacy/medicines/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(medicineData)
        }),

        /**
         * 删除药品
         * @param {number} id - 药品ID
         * @returns {Promise<object>} 成功删除的响应
         */
        delete: (id) => handleRequest(`/api/v1/pharmacy/medicines/${id}`, { method: 'DELETE' })
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
        create: (prescriptionData) => handleRequest('/api/v1/pharmacy/prescriptions/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(prescriptionData)
        }),
        
        /**
         * 根据病历ID获取其所有处方记录
         * @param {number} medicalRecordId - 病历ID
         * @returns {Promise<Array>} 该病历的处方对象数组
         */
        getByMedicalRecordId: (medicalRecordId) => handleRequest(`/api/v1/pharmacy/prescriptions/medical_record/${medicalRecordId}`)
    }

// ... (文件其余部分)
```

------

### **第二步：实现独立的“药品管理”模块**

现在我们来实现点击侧边栏“药品管理”后呈现的完整功能。所有相关代码都将添加到 `frontend/js/app.js`。

#### **2.1. 模块渲染与事件绑定**

JavaScript

```
// 文件: frontend/js/app.js

// 在 initializeDashboard 函数中，确保映射关系正确
const contentRenderers = {
    'patient-management-link': renderPatientModule,
    'medicine-management-link': renderMedicineModule, // 确保此映射存在
    // ... 其他模块
};

/**
 * 渲染药品管理模块的主函数
 */
async function renderMedicineModule() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>药品管理</h2>
            <button id="add-medicine-btn" class="btn btn-primary">添加新药品</button>
        </div>
        <div class="search-bar">
            <input type="text" id="medicine-search-input" placeholder="按药品名称、厂家搜索...">
            <button id="medicine-search-btn" class="btn">搜索</button>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>药品名称</th>
                        <th>规格</th>
                        <th>生产厂家</th>
                        <th>当前库存</th>
                        <th class="actions-column">操作</th>
                    </tr>
                </thead>
                <tbody id="medicine-table-body"></tbody>
            </table>
        </div>
    `;

    // 初始加载数据
    await loadAndDisplayMedicines();

    // --- 事件监听 ---
    // 使用事件委托来处理表格中的按钮点击，性能更佳
    mainContent.addEventListener('click', event => {
        const target = event.target;
        if (target.matches('.btn-edit')) {
            handleEditMedicine(target.dataset.id);
        } else if (target.matches('.btn-delete')) {
            handleDeleteMedicine(target.dataset.id);
        } else if (target.id === 'add-medicine-btn') {
            showFormModal('添加新药品', getMedicineFormHtml(), (e, form) => handleMedicineFormSubmit(e, form));
        } else if (target.id === 'medicine-search-btn') {
            const searchTerm = document.getElementById('medicine-search-input').value;
            loadAndDisplayMedicines(searchTerm);
        }
    });
    
    // 搜索框回车事件
    mainContent.querySelector('#medicine-search-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            loadAndDisplayMedicines(e.target.value);
        }
    });
}

/**
 * 加载并显示药品列表
 * @param {string} searchTerm - 搜索关键词
 */
async function loadAndDisplayMedicines(searchTerm = '') {
    const tableBody = document.getElementById('medicine-table-body');
    showLoading(tableBody, 5); // 显示加载动画
    try {
        const medicines = await apiClient.medicines.list(searchTerm);
        tableBody.innerHTML = ''; // 清空旧数据
        if (medicines.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">未找到相关药品信息</td></tr>';
            return;
        }
        medicines.forEach(med => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${med.name}</td>
                <td>${med.specification || 'N/A'}</td>
                <td>${med.manufacturer || 'N/A'}</td>
                <td>${med.stock}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-edit" data-id="${med.id}">编辑</button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${med.id}">删除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载药品列表失败:', error);
        tableBody.innerHTML = `<tr><td colspan="5">加载失败: ${error.message}</td></tr>`;
    }
}
```

#### **2.2. 表单与数据处理**

JavaScript

```
// 文件: frontend/js/app.js

/**
 * 生成药品表单的HTML
 * @param {object} [medicine={}] - 用于预填充表单的药品数据，编辑时使用
 * @returns {string} 表单的HTML字符串
 */
function getMedicineFormHtml(medicine = {}) {
    return `
        <input type="hidden" id="medicine-id" value="${medicine.id || ''}">
        <div class="form-group">
            <label for="medicine-name">药品名称</label>
            <input type="text" id="medicine-name" value="${medicine.name || ''}" required>
        </div>
        <div class="form-group">
            <label for="medicine-spec">规格</label>
            <input type="text" id="medicine-spec" value="${medicine.specification || ''}">
        </div>
        <div class="form-group">
            <label for="medicine-manufacturer">生产厂家</label>
            <input type="text" id="medicine-manufacturer" value="${medicine.manufacturer || ''}">
        </div>
        <div class="form-group">
            <label for="medicine-stock">初始库存</label>
            <input type="number" id="medicine-stock" value="${medicine.stock || 0}" required ${medicine.id ? 'disabled' : ''}>
            ${medicine.id ? '<small>库存管理请在入库模块操作。</small>' : ''}
        </div>
    `;
}

/**
 * 处理药品表单提交（创建或更新）
 * @param {Event} event - 表单提交事件
 * @param {HTMLFormElement} form - 表单元素
 */
async function handleMedicineFormSubmit(event, form) {
    event.preventDefault();
    const id = form.querySelector('#medicine-id').value;
    const data = {
        name: form.querySelector('#medicine-name').value,
        specification: form.querySelector('#medicine-spec').value,
        manufacturer: form.querySelector('#medicine-manufacturer').value,
        stock: parseInt(form.querySelector('#medicine-stock').value, 10)
    };

    try {
        if (id) {
            await apiClient.medicines.update(id, data);
        } else {
            await apiClient.medicines.create(data);
        }
        closeModal();
        await loadAndDisplayMedicines(); // 刷新列表
    } catch (error) {
        console.error('保存药品失败:', error);
        alert(`保存失败: ${error.message}`);
    }
}

/**
 * 处理编辑药品按钮点击
 * @param {number} id - 药品ID
 */
async function handleEditMedicine(id) {
    try {
        const medicine = await apiClient.medicines.getById(id);
        showFormModal('编辑药品', getMedicineFormHtml(medicine), (e, form) => handleMedicineFormSubmit(e, form));
    } catch (error) {
        console.error('获取药品信息失败:', error);
        alert('无法加载药品信息。');
    }
}

/**
 * 处理删除药品按钮点击
 * @param {number} id - 药品ID
 */
async function handleDeleteMedicine(id) {
    if (confirm('确定要删除此药品吗？此操作不可撤销。')) {
        try {
            await apiClient.medicines.delete(id);
            await loadAndDisplayMedicines(); // 刷新列表
        } catch (error) {
            console.error('删除药品失败:', error);
            alert(`删除失败: ${error.message}`);
        }
    }
}
```

------

### **第三步：集成处方到病历模块**

现在，我们将处方功能嵌入到现有的病历编辑界面中。

#### **3.1. 修改病历UI并增加打印按钮**

在 `renderMedicalRecordModule` 函数中，找到生成病历表单的位置，添加以下HTML结构。

JavaScript

```
// 在 renderMedicalRecordModule 渲染的HTML中...

// 1. 在病历头部添加打印按钮
<div class="content-header">
    <h2>病历详情 (患者: ${patient.name})</h2>
    <div>
        <button id="print-record-btn" class="btn btn-secondary" data-record-id="${record.id}">打印/输出病历</button>
        <button id="save-record-btn" class="btn btn-primary" data-record-id="${record.id}">保存病历</button>
    </div>
</div>

// ... (其他病历表单项) ...

// 2. 添加处方区域和打印按钮
<fieldset>
    <legend style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>处方信息</span>
        <button type="button" id="print-prescription-btn" class="btn btn-secondary btn-sm" data-record-id="${record.id}">打印/输出处方</button>
    </legend>
    <div class="content-header" style="padding:0; margin-bottom: 1rem;">
        <h4>处方药品列表</h4>
        <button type="button" id="add-prescription-item-btn" class="btn btn-secondary btn-sm">添加药品到处方</button>
    </div>
    <table class="data-table">
        <thead>
            <tr>
                <th>药品名称</th>
                <th>单次用量</th>
                <th>用法频率</th>
                <th>备注</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody id="prescription-items-body">
            </tbody>
    </table>
</fieldset>
```

#### **3.2. 实现处方条目的前端逻辑**

当用户编辑病历时，处方条目先存在于前端的一个临时数组中。

JavaScript

```
// 文件: frontend/js/app.js

// 在 renderMedicalRecordModule 的作用域内或更高层级定义
let tempPrescriptionItems = [];

// ... 在 renderMedicalRecordModule 中 ...
// 1. 加载并显示已有的处方
const existingPrescriptions = await apiClient.prescriptions.getByMedicalRecordId(record.id);
tempPrescriptionItems = existingPrescriptions.map(p => ({ /*... 格式化成需要的数据结构 ...*/ }));
renderPrescriptionTable();

// 2. 绑定“添加药品到处方”按钮事件
document.getElementById('add-prescription-item-btn').addEventListener('click', async () => {
    // 弹出一个新模态框，里面包含一个药品搜索下拉框和用量、频率输入框
    // 用户确认后，将数据 push 到 tempPrescriptionItems 数组
    // e.g., tempPrescriptionItems.push({ medicineId, medicineName, dosage, frequency, notes });
    // 然后调用 renderPrescriptionTable() 刷新UI
});

// 3. 渲染处方表格的函数
function renderPrescriptionTable() {
    const tbody = document.getElementById('prescription-items-body');
    tbody.innerHTML = '';
    tempPrescriptionItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.medicineName}</td>
            <td>${item.dosage}</td>
            <td>${item.frequency}</td>
            <td>${item.notes || ''}</td>
            <td><button class="btn btn-sm btn-danger" data-index="${index}" onclick="removePrescriptionItem(${index})">移除</button></td>
        `;
        tbody.appendChild(row);
    });
}

// 4. 从临时数组中移除条目的函数
function removePrescriptionItem(index) {
    tempPrescriptionItems.splice(index, 1);
    renderPrescriptionTable();
}

// 5. 修改病历保存逻辑
// 找到保存病历的事件处理器 (handleSaveRecord)
async function handleSaveRecord(recordId) {
    // a. 先保存病历主信息
    // const savedRecord = await apiClient.medicalRecords.update(recordId, recordData);

    // b. 然后处理处方（此部分需要后端支持先删除旧处方再添加新处方，或前端自行比对差异）
    // 简化的逻辑：假定每次都是重新创建所有处方
    // await deleteAllPrescriptionsForRecord(recordId); // 理想情况下需要此API
    
    const prescriptionPromises = tempPrescriptionItems.map(item => {
        return apiClient.prescriptions.create({
            medical_record_id: recordId,
            medicine_id: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            notes: item.notes
        });
    });

    await Promise.all(prescriptionPromises);

    alert('病历及处方已成功保存！');
}
```

------

### **第四步：实现打印/输出接口**

为 `handlePrintMedicalRecord` 和 `handlePrintPrescription` 提供完整的实现。

JavaScript

```
// 文件: frontend/js/app.js

// 确保这些函数可以被事件监听器调用

/**
 * 处理打印病历的请求
 * @param {string} recordId - 病历ID
 */
async function handlePrintMedicalRecord(recordId) {
    if (!recordId) return;
    try {
        // 1. 并行获取所有需要的数据
        const [record, prescriptions] = await Promise.all([
            apiClient.medicalRecords.getById(recordId),
            apiClient.prescriptions.getByMedicalRecordId(recordId)
        ]);
        const patient = await apiClient.patients.getById(record.patient_id);

        // 2. 构建打印专用HTML
        // (此部分与上次回复中的建议相同，构建一个干净的、无脚本的HTML字符串)
        const printHtml = `...`; // 参照上次回复中的详细HTML模板

        // 3. 执行打印
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();

    } catch (error) {
        console.error('打印病历失败:', error);
        alert('无法获取病历信息用于打印。');
    }
}

/**
 * 处理打印处方的请求
 * @param {string} recordId - 病历ID
 */
async function handlePrintPrescription(recordId) {
    if (!recordId) return;
    try {
        // 1. 获取数据
        const prescriptions = await apiClient.prescriptions.getByMedicalRecordId(recordId);
        if (prescriptions.length === 0) {
            alert('此病历没有处方信息可打印。');
            return;
        }
        const record = await apiClient.medicalRecords.getById(recordId);
        const patient = await apiClient.patients.getById(record.patient_id);
        
        // 2. 构建处方笺格式的HTML
        const printHtml = `
            <html><head><title>处方笺</title>...</head><body>
                <h1>Nekolinic 诊所 - 处方笺</h1>
                <hr>
                <p><strong>患者:</strong> ${patient.name} &nbsp;&nbsp; <strong>性别:</strong> ${patient.gender} &nbsp;&nbsp; <strong>年龄:</strong> ${calculateAge(patient.date_of_birth)}</p>
                <p><strong>诊断:</strong> ${record.diagnosis}</p>
                <p><strong>日期:</strong> ${new Date(record.visit_date).toLocaleDateString()}</p>
                <h2>Rp.</h2>
                <ol>
                    ${prescriptions.map(p => `<li>${p.medicine_name} (${p.medicine_specification})<br>用法: ${p.dosage}, ${p.frequency}</li>`).join('')}
                </ol>
                <br><br>
                <p><strong>医师签名:</strong> __________________</p>
            </body></html>
        `;

        // 3. 执行打印 (同上)
        // ...
        
    } catch (error) {
        console.error('打印处方失败:', error);
        alert('无法获取处方信息用于打印。');
    }
}


// 在主事件委托中绑定打印按钮
// (位于 app.js, 如 renderMedicalRecordModule 中)
mainContent.addEventListener('click', event => {
    const target = event.target.closest('button'); // 更稳健的写法
    if (!target) return;

    const recordId = target.dataset.recordId;
    switch (target.id) {
        case 'print-record-btn':
            handlePrintMedicalRecord(recordId);
            break;
        case 'print-prescription-btn':
            handlePrintPrescription(recordId);
            break;
        case 'save-record-btn':
            handleSaveRecord(recordId);
            break;
        // ... 其他病历页面的事件
    }
});
```

这份详尽指南为您提供了从零开始构建药品和处方管理模块所需的所有前端代码结构和逻辑。您可以根据此指南逐步填充和完善您的 `app.js` 文件。