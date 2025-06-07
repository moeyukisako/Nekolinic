// frontend/js/modules/medicalRecords.js

import { showLoading, showNotification, confirmDialog } from '../utils/ui.js';
import Modal from '../components/modal.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';
import { formatDate, calculateAge } from '../utils/date.js';

/**
 * 病历管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
  // 当前选中的患者ID和病历ID
  let currentPatientId = null;
  let currentRecordId = null;
  
  // 渲染模块基本结构
  container.innerHTML = `
    <div class="medical-records-module">
      <div class="content-header">
        <h2>病历管理</h2>
      </div>
      
      <div class="medical-records-container">
        <div class="medical-records-sidebar">
          <div class="sidebar-header">
            <h3>患者列表</h3>
            <div id="medical-records-search-container"></div>
          </div>
          <div class="patients-list" id="medical-records-patients-list"></div>
          <div id="medical-records-pagination"></div>
        </div>
        
        <div class="medical-records-content" id="medical-records-content">
          <div class="placeholder-message">
            <p>请从左侧选择一位患者以查看或创建病历</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // 初始化搜索组件
  const searchBar = new SearchBar({
    containerId: 'medical-records-search-container',
    placeholder: '搜索患者...',
    showButton: false,
    onSearch: (query) => renderPatientList(1, query)
  }).render();

  // 加载患者列表
  await renderPatientList(1, '');
  
  // 监听患者列表点击事件
  const patientsList = document.getElementById('medical-records-patients-list');
  if (patientsList) {
    patientsList.addEventListener('click', (e) => {
      const patientItem = e.target.closest('.patient-item');
      if (patientItem) {
        const patientId = patientItem.dataset.id;
        
        // 移除其他患者的选中状态
        document.querySelectorAll('.patient-item').forEach(item => {
          item.classList.remove('active');
        });
        
        // 设置当前患者的选中状态
        patientItem.classList.add('active');
        
        // 加载该患者的病历
        currentPatientId = patientId;
        renderMedicalRecordModule(patientId);
      }
    }, { signal });
  }
  
  // 监听事件
  const unsubscribeViewRecord = window.eventBus.on('view:medical-records', ({ patientId }) => {
    if (patientId) {
      currentPatientId = patientId;
      renderMedicalRecordModule(patientId);
      
      // 在患者列表中标记选中项
      document.querySelectorAll('.patient-item').forEach(item => {
        if (item.dataset.id === patientId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });
  
  // 模块清理函数
  return function cleanup() {
    unsubscribeViewRecord();
    console.log('Medical records module cleaned up');
  };
}

/**
 * 渲染患者列表
 * @param {number} page - 页码
 * @param {string} query - 搜索关键词
 */
async function renderPatientList(page = 1, query = '') {
  const patientsList = document.getElementById('medical-records-patients-list');
  const paginationContainer = document.getElementById('medical-records-pagination');
  
  if (!patientsList) return;
  
  showLoading(patientsList, 3);
  
  try {
    const response = await apiClient.patients.getAll(page, 10, query);
    const patients = response.items || [];
    const totalPages = response.total_pages || 1;
    
    if (patients.length === 0) {
      patientsList.innerHTML = '<div class="no-data">未找到患者</div>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }
    
    let html = '';
    
    patients.forEach(patient => {
      html += `
        <div class="patient-item" data-id="${patient.id}">
          <div class="patient-name">${patient.name || '未命名患者'}</div>
          <div class="patient-info">
            <span>${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</span>
            <span>${patient.birth_date ? `${calculateAge(patient.birth_date)}岁` : ''}</span>
          </div>
        </div>
      `;
    });
    
    patientsList.innerHTML = html;
    
    // 渲染分页
    if (paginationContainer && totalPages > 1) {
      new Pagination({
        containerId: 'medical-records-pagination',
        currentPage: page,
        totalPages: totalPages,
        onPageChange: (newPage) => renderPatientList(newPage, query)
      }).render();
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
  } catch (error) {
    console.error('加载患者列表失败', error);
    patientsList.innerHTML = `<div class="error-message">加载患者列表失败: ${error.message}</div>`;
  }
}

/**
 * 渲染病历模块
 * @param {string} patientId - 患者ID 
 */
async function renderMedicalRecordModule(patientId) {
  const contentContainer = document.getElementById('medical-records-content');
  if (!contentContainer || !patientId) return;
  
  showLoading(contentContainer, 3);
  
  try {
    // 获取患者信息
    const patient = await apiClient.patients.getById(patientId);
    
    // 渲染病历内容区
    contentContainer.innerHTML = `
      <div class="patient-header">
        <div class="patient-basic-info">
          <h3>${patient.name || '未命名患者'}</h3>
          <div class="patient-meta">
            <span>${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</span>
            <span>${patient.birth_date ? `${calculateAge(patient.birth_date)}岁 (${patient.birth_date})` : ''}</span>
            <span>${patient.phone || ''}</span>
          </div>
        </div>
        <div class="patient-actions">
          <button class="btn btn-primary" id="add-record-btn">新建病历</button>
        </div>
      </div>
      
      <div class="records-list-header">
        <h4>病历列表</h4>
      </div>
      
      <div class="records-list" id="records-list"></div>
      <div id="records-pagination"></div>
    `;
    
    // 绑定新建病历按钮
    document.getElementById('add-record-btn').addEventListener('click', () => {
      showMedicalRecordForm(patient);
    });
    
    // 加载病历列表
    await loadPatientRecords(patientId);
    
  } catch (error) {
    console.error('加载患者信息失败', error);
    contentContainer.innerHTML = `<div class="error-message">加载患者信息失败: ${error.message}</div>`;
  }
}

/**
 * 加载患者病历列表
 * @param {string} patientId - 患者ID
 * @param {number} page - 页码
 */
async function loadPatientRecords(patientId, page = 1) {
  const recordsList = document.getElementById('records-list');
  const paginationContainer = document.getElementById('records-pagination');
  
  if (!recordsList || !patientId) return;
  
  showLoading(recordsList, 3);
  
  try {
    // 获取病历列表
    const response = await apiClient.medicalRecords.getByPatientId(patientId, page);
    const records = response.items || [];
    const totalPages = response.total_pages || 1;
    
    if (records.length === 0) {
      recordsList.innerHTML = '<div class="no-data">该患者暂无病历记录</div>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }
    
    let html = '';
    
    records.forEach(record => {
      const recordDate = new Date(record.record_date);
      const formattedDate = formatDate(recordDate);
      
      html += `
        <div class="record-item" data-id="${record.id}">
          <div class="record-header">
            <div class="record-date">${formattedDate}</div>
            <div class="record-doctor">医生: ${record.doctor_name || '未记录'}</div>
          </div>
          <div class="record-summary">${record.chief_complaint || '未记录主诉'}</div>
          <div class="record-actions">
            <button class="btn btn-sm" data-action="view" data-id="${record.id}">查看</button>
            <button class="btn btn-sm" data-action="edit" data-id="${record.id}">编辑</button>
            <button class="btn btn-sm" data-action="print" data-id="${record.id}">打印</button>
            <button class="btn btn-sm" data-action="prescription" data-id="${record.id}">处方</button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${record.id}">删除</button>
          </div>
        </div>
      `;
    });
    
    recordsList.innerHTML = html;
    
    // 添加病历操作事件
    recordsList.addEventListener('click', handleRecordAction);
    
    // 渲染分页
    if (paginationContainer && totalPages > 1) {
      new Pagination({
        containerId: 'records-pagination',
        currentPage: page,
        totalPages: totalPages,
        onPageChange: (newPage) => loadPatientRecords(patientId, newPage)
      }).render();
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
  } catch (error) {
    console.error('加载病历记录失败', error);
    recordsList.innerHTML = `<div class="error-message">加载病历记录失败: ${error.message}</div>`;
  }
}

/**
 * 处理病历操作事件
 * @param {Event} e - 事件对象
 */
function handleRecordAction(e) {
  const target = e.target;
  if (!target.dataset.action) return;
  
  const recordId = target.dataset.id;
  const action = target.dataset.action;
  
  switch (action) {
    case 'view':
      viewMedicalRecord(recordId);
      break;
    case 'edit':
      editMedicalRecord(recordId);
      break;
    case 'print':
      printMedicalRecord(recordId);
      break;
    case 'prescription':
      managePrescription(recordId);
      break;
    case 'delete':
      deleteMedicalRecord(recordId);
      break;
  }
}

/**
 * 显示病历表单
 * @param {Object} patient - 患者对象
 * @param {Object} record - 病历对象(编辑模式)
 */
async function showMedicalRecordForm(patient, record = null) {
  const isEdit = !!record;
  const title = isEdit ? '编辑病历' : '新建病历';
  
  // 获取当前用户(医生)信息
  let currentUser;
  try {
    currentUser = await apiClient.auth.getCurrentUser();
  } catch (error) {
    console.error('获取当前用户信息失败', error);
    currentUser = { id: '', full_name: '未知医生' };
  }
  
  const form = document.createElement('div');
  form.className = 'medical-record-form';
  form.innerHTML = `
    <form id="medical-record-form">
      ${isEdit ? `<input type="hidden" id="record-id" value="${record.id}">` : ''}
      <input type="hidden" id="patient-id" value="${patient.id}">
      <input type="hidden" id="doctor-id" value="${currentUser.id}">
      
      <div class="form-group">
        <label for="record-date">就诊日期</label>
        <input type="date" id="record-date" value="${isEdit ? record.record_date : formatDate(new Date())}" required>
      </div>
      
      <div class="form-group">
        <label for="chief-complaint">主诉</label>
        <textarea id="chief-complaint" rows="2" required>${isEdit ? record.chief_complaint || '' : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="present-illness">现病史</label>
        <textarea id="present-illness" rows="3">${isEdit ? record.present_illness || '' : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="past-history">既往史</label>
        <textarea id="past-history" rows="2">${isEdit ? record.past_history || '' : ''}</textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group form-group-half">
          <label for="temperature">体温(°C)</label>
          <input type="number" id="temperature" step="0.1" value="${isEdit ? record.temperature || '' : ''}">
        </div>
        <div class="form-group form-group-half">
          <label for="pulse">脉搏(次/分)</label>
          <input type="number" id="pulse" value="${isEdit ? record.pulse || '' : ''}">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group form-group-half">
          <label for="respiratory-rate">呼吸频率(次/分)</label>
          <input type="number" id="respiratory-rate" value="${isEdit ? record.respiratory_rate || '' : ''}">
        </div>
        <div class="form-group form-group-half">
          <label for="blood-pressure">血压(mmHg)</label>
          <input type="text" id="blood-pressure" value="${isEdit ? record.blood_pressure || '' : ''}">
        </div>
      </div>
      
      <div class="form-group">
        <label for="examination">体格检查</label>
        <textarea id="examination" rows="3">${isEdit ? record.examination || '' : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="diagnosis">诊断</label>
        <textarea id="diagnosis" rows="2" required>${isEdit ? record.diagnosis || '' : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="treatment-plan">治疗方案</label>
        <textarea id="treatment-plan" rows="3">${isEdit ? record.treatment_plan || '' : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="notes">备注</label>
        <textarea id="notes" rows="2">${isEdit ? record.notes || '' : ''}</textarea>
      </div>
    </form>
  `;

  const modal = new Modal({
    title: title,
    content: form,
    size: 'large',
    confirmText: '保存病历',
    onConfirm: () => handleMedicalRecordFormSubmit(isEdit)
  }).render();
}

/**
 * 处理病历表单提交
 * @param {boolean} isEdit - 是否是编辑模式
 */
async function handleMedicalRecordFormSubmit(isEdit) {
  const form = document.getElementById('medical-record-form');
  if (!form) return false;
  
  // 获取表单数据
  const patientId = document.getElementById('patient-id').value;
  const doctorId = document.getElementById('doctor-id').value;
  const recordDate = document.getElementById('record-date').value;
  const chiefComplaint = document.getElementById('chief-complaint').value.trim();
  const presentIllness = document.getElementById('present-illness').value.trim();
  const pastHistory = document.getElementById('past-history').value.trim();
  const temperature = document.getElementById('temperature').value;
  const pulse = document.getElementById('pulse').value;
  const respiratoryRate = document.getElementById('respiratory-rate').value;
  const bloodPressure = document.getElementById('blood-pressure').value.trim();
  const examination = document.getElementById('examination').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const treatmentPlan = document.getElementById('treatment-plan').value.trim();
  const notes = document.getElementById('notes').value.trim();
  
  // 验证必填字段
  if (!recordDate || !chiefComplaint || !diagnosis) {
    showNotification('错误', '请填写就诊日期、主诉和诊断', 'error');
    return false;
  }
  
  // 构建数据对象
  const recordData = {
    patient_id: patientId,
    doctor_id: doctorId,
    record_date: recordDate,
    chief_complaint: chiefComplaint,
    present_illness: presentIllness || null,
    past_history: pastHistory || null,
    temperature: temperature ? parseFloat(temperature) : null,
    pulse: pulse ? parseInt(pulse) : null,
    respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
    blood_pressure: bloodPressure || null,
    examination: examination || null,
    diagnosis: diagnosis,
    treatment_plan: treatmentPlan || null,
    notes: notes || null
  };
  
  try {
    if (isEdit) {
      const recordId = document.getElementById('record-id').value;
      await apiClient.medicalRecords.update(recordId, recordData);
      showNotification('成功', '病历已更新', 'success');
    } else {
      await apiClient.medicalRecords.create(recordData);
      showNotification('成功', '病历已创建', 'success');
    }
    
    // 重新加载病历列表
    await loadPatientRecords(patientId);
    
    return true; // 允许模态框关闭
  } catch (error) {
    showNotification('错误', `保存病历失败: ${error.message}`, 'error');
    return false; // 阻止模态框关闭
  }
}

/**
 * 查看病历
 * @param {string} recordId - 病历ID
 */
async function viewMedicalRecord(recordId) {
  try {
    const record = await apiClient.medicalRecords.getById(recordId);
    const patient = await apiClient.patients.getById(record.patient_id);
    
    const content = document.createElement('div');
    content.className = 'medical-record-view';
    content.innerHTML = `
      <div class="patient-info-header">
        <h4>${patient.name || '未命名患者'}</h4>
        <div>${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'} | ${calculateAge(patient.birth_date)}岁</div>
      </div>
      <div class="record-info-header">
        <div>就诊日期: ${formatDate(record.record_date)}</div>
        <div>医生: ${record.doctor_name || '未记录'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">主诉:</div>
        <div class="section-content">${record.chief_complaint || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">现病史:</div>
        <div class="section-content">${record.present_illness || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">既往史:</div>
        <div class="section-content">${record.past_history || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">体征:</div>
        <div class="section-content">
          ${record.temperature ? `体温: ${record.temperature}°C` : ''}
          ${record.pulse ? `脉搏: ${record.pulse}次/分` : ''}
          ${record.respiratory_rate ? `呼吸: ${record.respiratory_rate}次/分` : ''}
          ${record.blood_pressure ? `血压: ${record.blood_pressure}mmHg` : ''}
          ${(!record.temperature && !record.pulse && !record.respiratory_rate && !record.blood_pressure) ? '无记录' : ''}
        </div>
      </div>
      <div class="record-section">
        <div class="section-label">体格检查:</div>
        <div class="section-content">${record.examination || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">诊断:</div>
        <div class="section-content">${record.diagnosis || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">治疗方案:</div>
        <div class="section-content">${record.treatment_plan || '无'}</div>
      </div>
      <div class="record-section">
        <div class="section-label">备注:</div>
        <div class="section-content">${record.notes || '无'}</div>
      </div>
    `;

    const modal = new Modal({
      title: '病历详情',
      content: content,
      size: 'large',
      showFooter: true,
      confirmText: '编辑',
      cancelText: '关闭',
      onConfirm: () => {
        modal.close();
        editMedicalRecord(recordId);
        return false;
      }
    }).render();
    
  } catch (error) {
    showNotification('错误', `获取病历详情失败: ${error.message}`, 'error');
  }
}

/**
 * 编辑病历
 * @param {string} recordId - 病历ID
 */
async function editMedicalRecord(recordId) {
  try {
    const record = await apiClient.medicalRecords.getById(recordId);
    const patient = await apiClient.patients.getById(record.patient_id);
    showMedicalRecordForm(patient, record);
  } catch (error) {
    showNotification('错误', `获取病历信息失败: ${error.message}`, 'error');
  }
}

/**
 * 删除病历
 * @param {string} recordId - 病历ID
 */
async function deleteMedicalRecord(recordId) {
  const confirmed = await confirmDialog('确认删除', '确定要删除此病历记录？此操作不可恢复。');
  
  if (confirmed) {
    try {
      const record = await apiClient.medicalRecords.getById(recordId);
      const patientId = record.patient_id;
      
      await apiClient.medicalRecords.delete(recordId);
      showNotification('成功', '病历已删除', 'success');
      
      // 重新加载病历列表
      await loadPatientRecords(patientId);
    } catch (error) {
      showNotification('错误', `删除失败: ${error.message}`, 'error');
    }
  }
}

/**
 * 打印病历
 * @param {string} recordId - 病历ID
 */
async function printMedicalRecord(recordId) {
  try {
    // 通知事件总线
    window.eventBus.emit('print:medical-record', { recordId });
    
    // 打开打印窗口
    window.open(`/print-medical-record.html?id=${recordId}`, '_blank');
  } catch (error) {
    showNotification('错误', `打印准备失败: ${error.message}`, 'error');
  }
}

/**
 * 管理处方
 * @param {string} recordId - 病历ID
 */
function managePrescription(recordId) {
  // 通知事件总线
  window.eventBus.emit('manage:prescription', { recordId });
}