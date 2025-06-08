// frontend/js/modules/medicalRecords.js (已重构和修正)

import { showLoading, confirmDialog } from '../utils/ui.js';
import Modal from '../components/modal.js';
import Pagination from '../components/pagination.js';
import { formatDate, calculateAge } from '../utils/date.js';

// --- 1. 将所有模块内的全局变量和辅助函数移到顶层作用域 ---

let currentPatientId = null;
let currentRecordId = null;
let currentPatient = null;
let pagination = null;
// `signal` 不再设为全局，而是通过参数传递，避免模块间干扰

/**
 * 渲染模块主函数
 */
export default async function render(container, { signal, payload }) {
  container.innerHTML = `
    <div class="medical-records-module-wrapper">
      <div id="medical-records-module-content">
        <div class="data-table-container">
          <div class="medical-records-layout">
            <div class="patients-sidebar">
              <div class="sidebar-header">
                <div class="search-box">
                  <input type="text" id="patient-search" data-i18n-placeholder="search_patients_placeholder" placeholder="搜索患者...">
                </div>
              </div>
              <div class="patients-list" id="patients-list"></div>
              <div id="patients-pagination"></div>
            </div>
            
            <div class="resizer" id="resizer"></div>
            
            <div class="medical-record-editor">
              <div class="editor-content" id="editor-content">
                <div class="no-patient-selected">
                  <div class="placeholder-icon">📋</div>
                  <h3 data-i18n="select_patient">请选择患者</h3>
                  <p data-i18n="select_patient_help">从左侧列表中选择一个患者来查看或编辑病历</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- 绑定事件 ---
  const patientSearch = document.getElementById('patient-search');
  patientSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    renderPatientList(1, query, signal);
  }, { signal });

  document.getElementById('patients-list').addEventListener('click', (e) => handlePatientClick(e, signal), { signal });
  
  initResizer(signal);

  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
  
  // --- 使用 payload 初始化模块 ---
  const initialPatientId = payload?.patientId;
  if (initialPatientId) {
    await loadAndSelectPatient(initialPatientId, signal);
  } else {
    await renderPatientList(1, '', signal);
  }

  // --- 返回清理函数 ---
  return function cleanup() {
    console.log('Medical records module cleaned up');
    // AbortController 会自动清理所有通过 signal 绑定的事件
  };
}


// --- 2. 所有辅助函数现在都在模块作用域，而不是 render 函数内部 ---

/**
 * 加载并高亮显示指定的患者 (最终优化版)
 *
 * @param {string} patientId - 要选中的患者ID
 * @param {AbortSignal} signal - AbortController信号
 */
async function loadAndSelectPatient(patientId, signal) {
  const searchInput = document.getElementById('patient-search');
  
  // 1. 立即设置全局的 currentPatientId，这对于后续任何重绘时保持高亮至关重要。
  currentPatientId = patientId;

  // 2. 在左右两个面板都显示加载状态，提升用户体验。
  showLoading(document.getElementById('patients-list'), 3);
  showLoading(document.getElementById('editor-content'), 3);

  try {
    // 3. 通过API获取目标患者的完整信息，主要是为了他的姓名。
    const patient = await apiClient.patients.getById(patientId);
    if (!patient) {
      throw new Error(`ID为 ${patientId} 的患者不存在。`);
    }

    // 4. 将患者姓名填入搜索框，准备进行搜索。
    if (searchInput && patient.name) {
      searchInput.value = patient.name;
    }

    // 5. 使用患者姓名作为查询条件，渲染患者列表。
    //    这会把目标患者带到搜索结果的第一页。
    //    renderPatientList 内部会自动根据 currentPatientId 高亮正确的项。
    await renderPatientList(1, patient.name || '', signal);
    
    // 6. 渲染右侧的病历编辑区。
    await renderMedicalRecordEditor(patientId, signal);

  } catch (error) {
    if (signal?.aborted) return; // 如果模块已卸载，则不执行任何操作
    console.error(`加载并选择患者 ${patientId} 失败:`, error);
    const editorContent = document.getElementById('editor-content');
    editorContent.innerHTML = `<div class="error-message">加载患者信息失败: ${error.message}</div>`;
  }
}

/**
 * 处理左侧患者列表的点击事件
 */
function handlePatientClick(e, signal) {
  const patientItem = e.target.closest('.patient-item');
  if (patientItem && !patientItem.classList.contains('active')) {
    const patientId = patientItem.dataset.id;
    
    // 更新选中状态
    document.querySelectorAll('.patient-item').forEach(item => {
      item.classList.remove('active');
    });
    patientItem.classList.add('active');
    patientItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    currentPatientId = patientId; // 更新当前选中的患者ID
    
    // 渲染右侧病历编辑区
    renderMedicalRecordEditor(patientId, signal);
  }
}


/**
 * 渲染左侧患者列表
 */
async function renderPatientList(page = 1, query = '', signal) {
  const patientsContainer = document.getElementById('patients-list');
  const paginationContainer = document.getElementById('patients-pagination');
  if (!patientsContainer) return;

  showLoading(patientsContainer, 3);

  try {
    const response = await apiClient.patients.getAll(page, 10, query);
    const { items: patients, total } = response;
    const totalPages = Math.ceil(total / 10);

    if (patients.length === 0) {
      patientsContainer.innerHTML = `<div class="empty-state"><p>${query ? '没有找到匹配的患者' : '无患者记录'}</p></div>`;
      paginationContainer.innerHTML = '';
      return;
    }

    patientsContainer.innerHTML = patients.map(patient => `
      <div class="patient-item" data-id="${patient.id}">
        <div class="patient-info">
          <div class="patient-name">${patient.name || '未命名'}</div>
          <div class="patient-details">
            <span>${patient.gender === 'male' ? (window.getTranslation ? window.getTranslation('gender_male') : '男') : (window.getTranslation ? window.getTranslation('gender_female') : '女')}</span>
            <span>${patient.birth_date ? calculateAge(patient.birth_date) + (window.getTranslation ? window.getTranslation('age_suffix') : '岁') : ''}</span>
          </div>
        </div>
      </div>
    `).join('');

    // 保持当前选中项的高亮
    if (currentPatientId) {
        const activeItem = patientsContainer.querySelector(`.patient-item[data-id="${currentPatientId}"]`);
        if(activeItem) activeItem.classList.add('active');
    }

    // 渲染分页
    renderPagination(paginationContainer, page, totalPages, (newPage) => {
      renderPatientList(newPage, query, signal);
    });

  } catch (error) {
    if (signal?.aborted) return;
    console.error('加载患者列表失败', error);
    patientsContainer.innerHTML = `<div class="error-state"><h3>加载失败</h3><p>${error.message}</p></div>`;
  }
}

/**
 * 渲染分页组件
 */
function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  new Pagination({
    containerId: container.id,
    currentPage,
    totalPages,
    onPageChange
  }).render();
}

/**
 * 渲染右侧病历编辑器
 */
async function renderMedicalRecordEditor(patientId, signal) {
  const contentContainer = document.getElementById('editor-content');
  if (!contentContainer) return;

  showLoading(contentContainer, 3);

  try {
    const patient = await apiClient.patients.getById(patientId);
    currentPatient = patient;

    // 获取患者的最新病历，如果没有就为空
    const records = await apiClient.medicalRecords.getByPatientId(patientId, 1, 1);
    const latestRecord = (records && records.length > 0) ? records[0] : null;
    currentRecordId = latestRecord?.id;

    const currentUser = window.store.get('currentUser') || { id: null, full_name: '未知' };
    
    // --- 这里是包含了所有字段的完整HTML ---
    contentContainer.innerHTML = `
      <div class="medical-record-form-wrapper">
        <div class="patient-header">
          <h3>${patient.name}</h3>
          <p>${patient.gender === 'male' ? (window.getTranslation ? window.getTranslation('gender_male') : '男') : (window.getTranslation ? window.getTranslation('gender_female') : '女')}, ${calculateAge(patient.birth_date)}${window.getTranslation ? window.getTranslation('age_suffix') : '岁'}</p>
        </div>
        <form id="medical-record-form">
          <input type="hidden" id="record-id" value="${latestRecord?.id || ''}">
          <input type="hidden" id="patient-id" value="${patient.id}">
          <input type="hidden" id="doctor-id" value="${currentUser.id}">
          
          <div class="form-row">
            <div class="form-group">
              <label for="visit-date" data-i18n="visit_date">就诊日期</label>
              <input type="date" id="visit-date" value="${formatDate(latestRecord?.record_date || new Date())}" required>
            </div>
          </div>

          <div class="form-group">
            <label for="chief-complaint" data-i18n="chief_complaint">主诉</label>
            <textarea id="chief-complaint" rows="2" data-i18n-placeholder="chief_complaint_placeholder" placeholder="请描述患者的主要症状...">${latestRecord?.chief_complaint || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="present-illness" data-i18n="present_illness">现病史</label>
            <textarea id="present-illness" rows="3" data-i18n-placeholder="present_illness_placeholder" placeholder="请描述现病史...">${latestRecord?.present_illness || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="past-history" data-i18n="past_history">既往史</label>
            <textarea id="past-history" rows="2" data-i18n-placeholder="past_history_placeholder" placeholder="请描述既往病史...">${latestRecord?.past_history || ''}</textarea>
          </div>
          
          <fieldset>
            <legend data-i18n="vital_signs">生命体征</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="temperature" data-i18n="temperature">体温(°C)</label>
                <input type="number" id="temperature" step="0.1" data-i18n-placeholder="temperature_placeholder" placeholder="36.5" value="${latestRecord?.temperature || ''}">
              </div>
              <div class="form-group">
                <label for="pulse" data-i18n="pulse">脉搏(次/分)</label>
                <input type="number" id="pulse" data-i18n-placeholder="pulse_placeholder" placeholder="80" value="${latestRecord?.pulse || ''}">
              </div>
              <div class="form-group">
                <label for="respiratory-rate" data-i18n="respiratory_rate">呼吸(次/分)</label>
                <input type="number" id="respiratory-rate" data-i18n-placeholder="respiratory_rate_placeholder" placeholder="20" value="${latestRecord?.respiratory_rate || ''}">
              </div>
              <div class="form-group">
                <label for="blood-pressure" data-i18n="blood_pressure">血压(mmHg)</label>
                <input type="text" id="blood-pressure" data-i18n-placeholder="blood_pressure_placeholder" placeholder="120/80" value="${latestRecord?.blood_pressure || ''}">
              </div>
            </div>
          </fieldset>
          
          <div class="form-group">
            <label for="physical-examination" data-i18n="physical_examination">体格检查</label>
            <textarea id="physical-examination" rows="3" data-i18n-placeholder="physical_examination_placeholder" placeholder="请描述体格检查结果...">${latestRecord?.physical_examination || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="diagnosis" data-i18n="diagnosis">诊断</label>
            <textarea id="diagnosis" rows="2" data-i18n-placeholder="diagnosis_placeholder" placeholder="请输入诊断结果..." required>${latestRecord?.diagnosis || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="treatment-plan" data-i18n="treatment_plan">治疗方案</label>
            <textarea id="treatment-plan" rows="3" data-i18n-placeholder="treatment_plan_placeholder" placeholder="请描述治疗方案...">${latestRecord?.treatment_plan || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="prescription" data-i18n="prescription">处方</label>
            <textarea id="prescription" rows="3" data-i18n-placeholder="prescription_placeholder" placeholder="请输入处方信息...">${latestRecord?.prescription || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="notes" data-i18n="notes">备注</label>
            <textarea id="notes" rows="2" data-i18n-placeholder="notes_placeholder" placeholder="其他备注信息...">${latestRecord?.notes || ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存病历</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('medical-record-form');
    form.addEventListener('submit', (e) => handleMedicalRecordSubmit(e, signal), { signal });

  } catch (error) {
    if (signal?.aborted) return;
    console.error('加载病历编辑器失败', error);
    contentContainer.innerHTML = `<div class="error-message">加载病历失败: ${error.message}</div>`;
  }
}

/**
 * 处理病历表单提交
 */
async function handleMedicalRecordSubmit(e, signal) {
  e.preventDefault();
  
  const form = e.target;
  const recordId = form.querySelector('#record-id').value;
  const patientId = form.querySelector('#patient-id').value;

  // --- 从表单中获取所有字段的数据 ---
  const recordData = {
    patient_id: parseInt(patientId),
    doctor_id: parseInt(form.querySelector('#doctor-id').value) || null,
    record_date: form.querySelector('#visit-date').value,
    chief_complaint: form.querySelector('#chief-complaint').value.trim() || null,
    present_illness: form.querySelector('#present-illness').value.trim() || null,
    past_history: form.querySelector('#past-history').value.trim() || null,
    temperature: parseFloat(form.querySelector('#temperature').value) || null,
    pulse: parseInt(form.querySelector('#pulse').value) || null,
    respiratory_rate: parseInt(form.querySelector('#respiratory-rate').value) || null,
    blood_pressure: form.querySelector('#blood-pressure').value.trim() || null,
    physical_examination: form.querySelector('#physical-examination').value.trim() || null,
    diagnosis: form.querySelector('#diagnosis').value.trim() || null,
    treatment_plan: form.querySelector('#treatment-plan').value.trim() || null,
    prescription: form.querySelector('#prescription').value.trim() || null,
    notes: form.querySelector('#notes').value.trim() || null,
  };

  if (!recordData.record_date || !recordData.diagnosis) {
    window.showNotification('错误', '请填写就诊日期和诊断', 'error');
    return;
  }

  try {
    let savedRecord;
    if (recordId) {
      savedRecord = await apiClient.medicalRecords.update(recordId, recordData);
      window.showNotification('成功', '病历已更新', 'success');
    } else {
      savedRecord = await apiClient.medicalRecords.create(recordData);
      window.showNotification('成功', '病历已创建', 'success');
    }
    // 重新渲染，以确保数据同步
    await renderMedicalRecordEditor(patientId, signal);
  } catch (error) {
    if (signal?.aborted) return;
    console.error('保存病历失败', error);
    window.showNotification('错误', `保存失败: ${error.message}`, 'error');
  }
}

/**
 * 初始化拖拽调整功能
 */
function initResizer(signal) {
  const resizer = document.getElementById('resizer');
  const sidebar = document.querySelector('.patients-sidebar');
  if (!resizer || !sidebar) return;

  let isResizing = false;

  const onMouseDown = (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isResizing) return;
    const layout = resizer.closest('.medical-records-layout');
    const layoutRect = layout.getBoundingClientRect();
    let leftWidth = e.clientX - layoutRect.left;
    if (leftWidth < 200) leftWidth = 200; // 最小宽度
    if (leftWidth > layoutRect.width - 200) leftWidth = layoutRect.width - 200; // 最小宽度
    sidebar.style.width = `${leftWidth}px`;
  };

  const onMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  resizer.addEventListener('mousedown', onMouseDown, { signal });
  document.addEventListener('mousemove', onMouseMove, { signal });
  document.addEventListener('mouseup', onMouseUp, { signal });
}