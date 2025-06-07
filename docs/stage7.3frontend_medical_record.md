好的，没问题。我们来制定一个更详尽、更具操作性的前端开发方案，确保您能顺利地将“病历管理”功能集成到现有的 `dashboard.html` 和 `app.js` 体系中。

这份方案将遵循您现有的**事件委托**和**动态渲染**模式，与“患者管理”模块保持代码风格和用户体验的高度一致。

------

### **前端详细开发方案：病历管理模块**

#### **1. 目标与用户流程**

1. **入口**：用户在“患者管理”界面，点击某位患者所在行末尾的“查看病历”按钮。

2. **跳转/渲染**：主内容区 (`.main-content`) 被清空，并渲染出指定患者的“病历管理”界面。界面标题明确标识当前正在为哪位患者管理病历。

3. 核心功能

   ：

   - 显示该患者的病历列表（分页显示）。
   - 提供“添加新病历”的入口。
   - 对列表中的每一条病历，提供“查看详情”、“编辑”和“删除”操作。

4. **操作方式**：所有操作（添加/编辑）均通过模态框（Modal）完成，风格与现有的患者模态框统一。

#### **2. `apiClient.js`：添加数据接口**

这是与后端通信的桥梁。我们需要为“病历（Medical Record）”和“生命体征（Vital Sign）”添加完整的CRUD方法。

**请在 `frontend/js/apiClient.js` 文件中，`patients` 对象的下方，添加 `medicalRecords` 对象：**

JavaScript

```
// frontend/js/apiClient.js

const apiClient = {
    // ... auth 对象 ...
    patients: {
        // ... 现有的患者API方法 ...
    },

    // --- (新增) 病历管理API ---
    medicalRecords: {
        /**
         * 根据患者ID获取病历列表（分页）
         * @param {number} patientId - 患者ID
         * @param {number} skip - 跳过的记录数
         * @param {number} limit - 每页记录数
         */
        getByPatientId: (patientId, skip = 0, limit = 15) => 
            authorizedFetch(`/patients/${patientId}/medical-records?skip=${skip}&limit=${limit}`),
        
        /**
         * 获取单个病历详情
         * @param {number} recordId - 病历ID
         */
        getById: (recordId) => authorizedFetch(`/medical-records/${recordId}`),

        /**
         * 创建新病历
         * @param {object} data - 病历数据, 包含 vital_sign 对象
         */
        create: (data) => authorizedFetch('/medical-records', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

        /**
         * 更新病历
         * @param {number} recordId - 病历ID
         * @param {object} data - 要更新的病历数据
         */
        update: (recordId, data) => authorizedFetch(`/medical-records/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

        /**
         * 删除病历
         * @param {number} recordId - 病历ID
         */
        delete: (recordId) => authorizedFetch(`/medical-records/${recordId}`, { method: 'DELETE' }),

        // --- (可选新增) 生命体征相关API ---
        // 如果需要单独更新生命体征，可以添加以下方法
        updateVitalSign: (vitalSignId, data) => authorizedFetch(`/vital-signs/${vitalSignId}`, {
             method: 'PUT',
             body: JSON.stringify(data)
        })
    }
};

window.apiClient = apiClient;
```

#### **3. `app.js`：核心逻辑与UI渲染**

这是工作量最大的部分。我们将按照功能块来逐步实现。

##### **3.1 菜单与入口联动**

首先，确保点击“患者管理”中的“查看病历”按钮能够触发正确的渲染函数。

**修改 `app.js`**:

JavaScript

```
// app.js

document.addEventListener('DOMContentLoaded', function() {
    // ...
    // 在主容器的事件委托中，添加对 "view-records" 的处理
    mainContentContainer.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;
        // ...

        switch (action) {
            // ... (现有的 case)

            // --- 新增 Case ---
            case 'view-records':
                // 调用渲染病历界面的函数，并传入患者ID
                renderMedicalRecordModule(mainContent, id);
                break;
        }
    });

    // ...
});
```

##### **3.2 渲染病历管理主界面**

创建一个 `renderMedicalRecordModule` 函数，它负责获取患者信息、渲染UI骨架、绑定事件。

**在 `app.js` 中新增以下函数**:

JavaScript

```
// app.js

// 全局变量，用于病历管理
let currentPatientForRecords = null;
let medicalRecordsCurrentPage = 0;
const medicalRecordsPageSize = 15; // 可自定义

async function renderMedicalRecordModule(container, patientId) {
    if (!container || !patientId) return;

    try {
        // 获取当前患者信息，用于显示标题
        currentPatientForRecords = await window.apiClient.patients.getById(patientId);
    } catch (error) {
        container.innerHTML = `<h1>错误</h1><p>无法加载患者信息: ${error.message}</p>`;
        return;
    }
    
    // 渲染UI骨架，与患者管理模块高度相似
    container.innerHTML = `
        <div id="medical-record-module-container">
            <div class="header-bar">
                <h1>病历管理: ${currentPatientForRecords.name}</h1>
                <button data-action="add-record" class="btn btn-primary">添加新病历</button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>病历ID</th>
                            <th>就诊日期</th>
                            <th>主诉症状</th>
                            <th>诊断结果</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="record-table-body"></tbody>
                </table>
                <div id="record-pagination-container" class="pagination-container">
                    </div>
            </div>

            <div id="record-modal" class="modal">
                <div class="modal-content large"> <span class="close-btn" data-action="close-record-modal">&times;</span>
                    <h2 id="record-modal-title">添加新病历</h2>
                    <form id="record-form">
                        <input type="hidden" id="record-id">
                        <fieldset>
                            <legend>基本信息</legend>
                            <div class="form-group">
                                <label for="record-date">就诊日期</label>
                                <input type="datetime-local" id="record-date" required>
                            </div>
                            <div class="form-group">
                                <label for="record-symptoms">主诉症状</label>
                                <textarea id="record-symptoms" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="record-diagnosis">诊断结果</label>
                                <textarea id="record-diagnosis" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="record-treatment">治疗方案</label>
                                <textarea id="record-treatment" rows="3"></textarea>
                            </div>
                             <div class="form-group">
                                <label for="record-notes">备注</label>
                                <textarea id="record-notes" rows="2"></textarea>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>生命体征</legend>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="vital-temp">体温 (°C)</label>
                                    <input type="number" step="0.1" id="vital-temp" placeholder="例如 36.5">
                                </div>
                                <div class="form-group">
                                    <label for="vital-hr">心率 (次/分)</label>
                                    <input type="number" id="vital-hr" placeholder="例如 75">
                                </div>
                                <div class="form-group">
                                    <label for="vital-bp">血压 (mmHg)</label>
                                    <input type="text" id="vital-bp" placeholder="例如 120/80">
                                </div>
                                <div class="form-group">
                                    <label for="vital-rr">呼吸频率 (次/分)</label>
                                    <input type="number" id="vital-rr" placeholder="例如 18">
                                </div>
                                <div class="form-group">
                                    <label for="vital-sat">血氧饱和度 (%)</label>
                                    <input type="number" step="0.1" id="vital-sat" placeholder="例如 98.5">
                                </div>
                            </div>
                        </fieldset>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存</button>
                            <button type="button" class="btn btn-secondary" data-action="close-record-modal">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 绑定事件监听器
    setupMedicalRecordEventListeners();

    // 初始加载第一页病历数据
    medicalRecordsCurrentPage = 0;
    loadAndDisplayRecords(patientId);
}
```

##### **3.3 事件处理与数据加载**

创建独立的函数来处理事件绑定、数据加载和分页渲染。

**在 `app.js` 中新增以下函数**:

JavaScript

```
// app.js

function setupMedicalRecordEventListeners() {
    const container = document.getElementById('medical-record-module-container');
    if (!container) return;

    // 使用事件委托
    container.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const recordId = target.dataset.id;

        switch (action) {
            case 'add-record':
                showAddRecordModal();
                break;
            case 'edit-record':
                showEditRecordModal(recordId);
                break;
            case 'delete-record':
                deleteRecord(recordId);
                break;
            case 'close-record-modal':
                hideRecordModal();
                break;
            case 'change-record-page':
                const page = parseInt(target.dataset.page, 10);
                goToRecordPage(page);
                break;
        }
    });

    // 表单提交
    const recordForm = document.getElementById('record-form');
    if (recordForm) {
        recordForm.addEventListener('submit', handleRecordFormSubmit);
    }
}

async function loadAndDisplayRecords(patientId) {
    const tableBody = document.getElementById('record-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">正在加载病历...</td></tr>';

    try {
        const skip = medicalRecordsCurrentPage * medicalRecordsPageSize;
        const response = await window.apiClient.medicalRecords.getByPatientId(patientId, skip, medicalRecordsPageSize);
        
        tableBody.innerHTML = '';
        if (response.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">该患者暂无病历记录。</td></tr>';
            return;
        }

        response.items.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.id}</td>
                <td>${new Date(record.record_date).toLocaleString()}</td>
                <td>${(record.symptoms || '').substring(0, 20)}...</td>
                <td>${(record.diagnosis || '').substring(0, 20)}...</td>
                <td>
                    <button class="btn btn-secondary" data-action="edit-record" data-id="${record.id}">编辑</button>
                    <button class="btn btn-danger" data-action="delete-record" data-id="${record.id}">删除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // 调用分页渲染函数
        renderRecordPagination(response.total, medicalRecordsCurrentPage, medicalRecordsPageSize);

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">加载病历失败: ${error.message}</td></tr>`;
    }
}

function renderRecordPagination(totalItems, currentPage, pageSize) {
    const container = document.getElementById('record-pagination-container');
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / pageSize);
    // 此处可以复用您在患者管理中已写好的分页HTML生成逻辑
    // 确保按钮的 data-action="change-record-page"
    let paginationHTML = `<span>共 ${totalItems} 条记录</span>`;
    // ... 生成分页按钮的逻辑 ...
    container.innerHTML = paginationHTML;
}

function goToRecordPage(page) {
    medicalRecordsCurrentPage = page;
    loadAndDisplayRecords(currentPatientForRecords.id);
}
```

##### **3.4 实现模态框的逻辑**

最后，实现添加、编辑、保存病历的函数。

**在 `app.js` 中新增以下函数**:

JavaScript

```
// app.js

function showAddRecordModal() {
    document.getElementById('record-form').reset();
    document.getElementById('record-id').value = '';
    document.getElementById('record-modal-title').textContent = '添加新病历';
    document.getElementById('record-modal').style.display = 'block';
}

async function showEditRecordModal(recordId) {
    document.getElementById('record-form').reset();
    try {
        const record = await window.apiClient.medicalRecords.getById(recordId);
        
        document.getElementById('record-id').value = record.id;
        document.getElementById('record-modal-title').textContent = '编辑病历';
        
        // 填充表单
        document.getElementById('record-date').value = new Date(record.record_date).toISOString().slice(0, 16);
        document.getElementById('record-symptoms').value = record.symptoms || '';
        document.getElementById('record-diagnosis').value = record.diagnosis || '';
        document.getElementById('record-treatment').value = record.treatment_plan || '';
        document.getElementById('record-notes').value = record.notes || '';

        if (record.vital_sign) {
            document.getElementById('vital-temp').value = record.vital_sign.temperature || '';
            document.getElementById('vital-hr').value = record.vital_sign.heart_rate || '';
            document.getElementById('vital-bp').value = record.vital_sign.blood_pressure || '';
            document.getElementById('vital-rr').value = record.vital_sign.respiratory_rate || '';
            document.getElementById('vital-sat').value = record.vital_sign.oxygen_saturation || '';
        }
        
        document.getElementById('record-modal').style.display = 'block';
    } catch (error) {
        alert('加载病历信息失败: ' + error.message);
    }
}

function hideRecordModal() {
    document.getElementById('record-modal').style.display = 'none';
}

async function handleRecordFormSubmit(event) {
    event.preventDefault();
    const recordId = document.getElementById('record-id').value;

    const recordData = {
        patient_id: currentPatientForRecords.id,
        doctor_id: 1, // 临时的医生ID，后续应从当前登录用户获取
        record_date: new Date(document.getElementById('record-date').value).toISOString(),
        symptoms: document.getElementById('record-symptoms').value,
        diagnosis: document.getElementById('record-diagnosis').value,
        treatment_plan: document.getElementById('record-treatment').value,
        notes: document.getElementById('record-notes').value,
        vital_sign: { // 将生命体征作为嵌套对象
            temperature: parseFloat(document.getElementById('vital-temp').value) || null,
            heart_rate: parseInt(document.getElementById('vital-hr').value, 10) || null,
            blood_pressure: document.getElementById('vital-bp').value,
            respiratory_rate: parseInt(document.getElementById('vital-rr').value, 10) || null,
            oxygen_saturation: parseFloat(document.getElementById('vital-sat').value) || null,
        }
    };
    
    try {
        if (recordId) {
            // 更新逻辑 (注意：这里的后端Schema可能需要调整以支持嵌套更新)
            await window.apiClient.medicalRecords.update(recordId, recordData);
        } else {
            // 创建新病历
            await window.apiClient.medicalRecords.create(recordData);
        }
        alert('病历保存成功！');
        hideRecordModal();
        loadAndDisplayRecords(currentPatientForRecords.id);
    } catch (error) {
        alert('保存失败: ' + error.message);
    }
}

async function deleteRecord(recordId) {
    if (confirm('确定要删除这条病历吗？')) {
        try {
            await window.apiClient.medicalRecords.delete(recordId);
            alert('删除成功！');
            loadAndDisplayRecords(currentPatientForRecords.id);
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }
}
```

#### **4. CSS 样式 (可选)**

为了让病历模态框有足够的空间，您可以在 `style.css` 中增加一个 `large` 样式。

CSS

```
/* frontend/css/style.css */

.modal-content.large {
    max-width: 800px; /* 或者您认为合适的宽度 */
}

.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.form-row .form-group {
    flex: 1 1 150px; /* 基础宽度150px，可自动伸缩 */
}

fieldset {
    border: 1px solid #ddd;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
}

legend {
    padding: 0 0.5rem;
    font-weight: bold;
    color: var(--color-primary);
}
```

这份详细的方案为您规划了从API接口、UI渲染到事件处理的每一步，确保新功能能够平稳、高效地集成到您现有的高质量项目框架中。