// frontend/js/modules/medicalRecords.js

import apiClient from '../apiClient.js';
import { showLoading, confirmDialog } from '../utils/ui.js';
import Pagination from '../components/pagination.js';
import Modal from '../components/modal.js';
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
          <div class="patient-info">
            <h3>${patient.name}</h3>
          </div>
          <div class="patient-actions">
            <button type="button" class="btn btn-primary generate-bill-btn" onclick="showGenerateBillModal(${patient.id}, '${patient.name}', ${latestRecord?.id || 'null'})">
              <i class="fas fa-file-invoice"></i> 生成账单
            </button>
          </div>
        </div>
        <form id="medical-record-form">
          <input type="hidden" id="record-id" value="${latestRecord?.id || ''}">
          <input type="hidden" id="patient-id" value="${patient.id}">
          <input type="hidden" id="doctor-id" value="${currentUser.id}">
          
          <div class="form-row">
            <div class="form-group">
              <label for="visit-date" data-i18n="visit_date">就诊日期</label>
              <input type="date" id="visit-date" value="${formatDate(latestRecord?.record_date || new Date())}" data-i18n-title="visit_date" required>
            </div>
          </div>

          <div class="form-group">
            <label for="chief-complaint" data-i18n="chief_complaint">主诉</label>
            <textarea id="chief-complaint" rows="2" data-i18n-placeholder="chief_complaint_placeholder" data-i18n-title="chief_complaint">${latestRecord?.chief_complaint || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="present-illness" data-i18n="present_illness">现病史</label>
            <textarea id="present-illness" rows="3" data-i18n-placeholder="present_illness_placeholder" data-i18n-title="present_illness">${latestRecord?.present_illness || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="past-history" data-i18n="past_history">既往史</label>
            <textarea id="past-history" rows="2" data-i18n-placeholder="past_history_placeholder" data-i18n-title="past_history">${latestRecord?.past_history || ''}</textarea>
          </div>
          
          <fieldset>
            <legend data-i18n="vital_signs">生命体征</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="temperature" data-i18n="temperature">体温(°C)</label>
                <input type="number" id="temperature" step="0.1" data-i18n-placeholder="temperature_placeholder" data-i18n-title="temperature" value="${latestRecord?.temperature || ''}">
              </div>
              <div class="form-group">
                <label for="pulse" data-i18n="pulse">脉搏(次/分)</label>
                <input type="number" id="pulse" data-i18n-placeholder="pulse_placeholder" data-i18n-title="pulse" value="${latestRecord?.pulse || ''}">
              </div>
              <div class="form-group">
                <label for="respiratory-rate" data-i18n="respiratory_rate">呼吸(次/分)</label>
                <input type="number" id="respiratory-rate" data-i18n-placeholder="respiratory_rate_placeholder" data-i18n-title="respiratory_rate" value="${latestRecord?.respiratory_rate || ''}">
              </div>
              <div class="form-group">
                <label for="blood-pressure" data-i18n="blood_pressure">血压(mmHg)</label>
                <input type="text" id="blood-pressure" data-i18n-placeholder="blood_pressure_placeholder" data-i18n-title="blood_pressure" value="${latestRecord?.blood_pressure || ''}">
              </div>
            </div>
          </fieldset>
          
          <div class="form-group">
            <label for="physical-examination" data-i18n="physical_examination">体格检查</label>
            <textarea id="physical-examination" rows="3" data-i18n-placeholder="physical_examination_placeholder" data-i18n-title="physical_examination">${latestRecord?.physical_examination || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="diagnosis" data-i18n="diagnosis">诊断</label>
            <textarea id="diagnosis" rows="2" data-i18n-placeholder="diagnosis_placeholder" data-i18n-title="diagnosis" required>${latestRecord?.diagnosis || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="treatment-plan" data-i18n="treatment_plan">治疗方案</label>
            <textarea id="treatment-plan" rows="3" data-i18n-placeholder="treatment_plan_placeholder" data-i18n-title="treatment_plan">${latestRecord?.treatment_plan || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="prescription" data-i18n="prescription">处方</label>
            <textarea id="prescription" rows="3" data-i18n-placeholder="prescription_placeholder" data-i18n-title="prescription">${latestRecord?.prescription || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="notes" data-i18n="notes">备注</label>
            <textarea id="notes" rows="2" data-i18n-placeholder="notes_placeholder" data-i18n-title="notes">${latestRecord?.notes || ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" data-i18n="save_medical_record">保存病历</button>
          </div>
        </form>
      </div>
    `;

    // 应用翻译
    if (window.translatePage) {
      window.translatePage();
    }

    const form = document.getElementById('medical-record-form');
    form.addEventListener('submit', (e) => handleMedicalRecordSubmit(e, signal), { signal });

  } catch (error) {
    if (signal?.aborted) return;
    console.error(window.getTranslation ? window.getTranslation('loading_medical_record_failed') : '加载病历编辑器失败', error);
    contentContainer.innerHTML = `<div class="error-message">${window.getTranslation ? window.getTranslation('loading_medical_record_error') : '加载病历失败'}: ${error.message}</div>`;
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
    window.showNotification(window.getTranslation ? window.getTranslation('please_fill_required_fields') : '请填写就诊日期和诊断', 'error');
    return;
  }

  try {
    let savedRecord;
    if (recordId) {
      savedRecord = await apiClient.medicalRecords.update(recordId, recordData);
      window.showNotification(window.getTranslation ? window.getTranslation('medical_record_updated') : '病历已更新', 'success');
    } else {
      savedRecord = await apiClient.medicalRecords.create(recordData);
      window.showNotification(window.getTranslation ? window.getTranslation('medical_record_created') : '病历已创建', 'success');
    }
    // 重新渲染，以确保数据同步
    await renderMedicalRecordEditor(patientId, signal);
  } catch (error) {
    if (signal?.aborted) return;
    console.error(window.getTranslation ? window.getTranslation('save_medical_record_failed') : '保存病历失败', error);
    window.showNotification(window.getTranslation ? window.getTranslation('error') : '错误', `${window.getTranslation ? window.getTranslation('save_failed') : '保存失败'}: ${error.message}`, 'error');
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

/**
 * 显示生成账单的Modal
 */
window.showGenerateBillModal = function(patientId, patientName, recordId) {
  const modalContent = createBillModalContent(patientId, patientName, recordId);
  
  const modal = new Modal({
    title: '生成账单',
    content: modalContent,
    size: 'large',
    showFooter: true,
    confirmText: '生成账单',
    cancelText: '取消',
    onConfirm: async () => {
      return await handleGenerateBill(patientId, recordId);
    }
  });
  
  modal.render();
  
  // 等待模态框完全显示后再添加事件监听器和默认项目
  // Modal组件在render()后会有10ms延迟添加active类，我们需要等待这个过程完成
  setTimeout(() => {
    // 确保模态框已经有active类（完全显示）
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      console.log('Active modal found, setting up event listeners...');
      
      // 添加事件委托来处理所有按钮和输入框事件
      activeModal.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'add-bill-item') {
          console.log('Add bill item button clicked');
          addBillItem();
        } else if (action === 'remove-bill-item') {
          console.log('Remove bill item button clicked');
          removeBillItem(e.target);
        }
      });
      
      activeModal.addEventListener('change', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'calculate-subtotal') {
          console.log('Calculate subtotal triggered');
          calculateItemSubtotal(e.target);
        }
      });
      
      console.log('Event listeners added to modal');
      
      // 查找容器并添加默认项目
      const container = activeModal.querySelector('#bill-items-tbody');
      if (container) {
        console.log('Container found in active modal, adding default bill item...');
        addBillItem();
        // 设置默认的诊疗费
        setTimeout(() => {
          const firstRow = activeModal.querySelector('.bill-detail-item');
          if (firstRow) {
            firstRow.querySelector('.item-name').value = '诊疗费';
            firstRow.querySelector('.item-type').value = 'consultation';
            firstRow.querySelector('.item-quantity').value = '1';
            firstRow.querySelector('.item-price').value = '150.00';
            // 触发计算
            calculateItemSubtotal(firstRow.querySelector('.item-price'));
            console.log('Default bill item added and configured successfully');
          } else {
            console.error('First row not found after adding bill item');
          }
        }, 50);
      } else {
        console.error('bill-items-tbody container not found in active modal');
        // 调试信息
        const allTbodies = activeModal.querySelectorAll('tbody');
        console.log('Available tbody elements in modal:', allTbodies.length);
        const allIds = activeModal.querySelectorAll('*[id]');
        console.log('Available elements with IDs in modal:', Array.from(allIds).map(el => el.id));
      }
    } else {
      console.error('No active modal found');
      const allModals = document.querySelectorAll('.modal');
      console.log('Available modals:', allModals.length);
    }
  }, 50); // 等待50ms，确保active类已添加
};

/**
 * 创建账单Modal的内容
 */
function createBillModalContent(patientId, patientName, recordId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const billId = 'BILL-' + Date.now();
  const invoiceId = 'INV-' + Date.now();
  
  return `
    <div class="bill-modal-content">
      <div class="bill-basic-info">
        <h4>账单基础信息</h4>
        <div class="form-row">
          <div class="form-group">
            <label>账单ID</label>
            <div class="readonly-field">${billId}</div>
          </div>
          <div class="form-group">
            <label>发票ID</label>
            <div class="readonly-field">${invoiceId}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>账单生成时间</label>
            <div class="readonly-field">${currentDate}</div>
          </div>
          <div class="form-group">
            <label>患者姓名</label>
            <div class="readonly-field">${patientName}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>病历ID</label>
            <div class="readonly-field">${recordId || '无'}</div>
          </div>
          <div class="form-group">
            <label>总金额</label>
            <div class="readonly-field total-amount">¥0.00</div>
          </div>
        </div>
      </div>
      
      <div class="bill-items-section">
        <h4>账单明细</h4>
        <div class="bill-items-header">
          <button type="button" class="btn btn-secondary add-item-btn" data-action="add-bill-item">
            <i class="fas fa-plus"></i> 添加收费项目
          </button>
        </div>
        <div class="bill-items-container">
          <table class="bill-items-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>项目类型</th>
                <th>数量</th>
                <th>单价</th>
                <th>小计</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="bill-items-tbody">
              <!-- 动态添加的账单项目 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * 添加账单项目
 */
window.addBillItem = function() {
  console.log('addBillItem function called');
  let container = document.getElementById('bill-items-tbody');
  
  if (!container) {
    console.error('bill-items-tbody container not found!');
    // 尝试查找所有可能的容器
    const allTbodies = document.querySelectorAll('tbody');
    console.log('Available tbody elements:', allTbodies);
    
    // 尝试在模态框中查找
    const modal = document.querySelector('.modal.active');
    if (modal) {
      container = modal.querySelector('#bill-items-tbody');
      console.log('Searching in active modal, found container:', !!container);
    }
    
    if (!container) {
      console.error('Still no container found, aborting addBillItem');
      return;
    }
  }
  
  console.log('Container found, creating bill item...');
  
  // 创建账单明细项
  const detailItem = document.createElement('tr');
  detailItem.className = 'bill-detail-item';
  
  detailItem.innerHTML = `
    <td>
      <input type="text" class="form-control item-name" placeholder="请输入项目名称" required>
    </td>
    <td>
      <select class="form-control item-type" required>
        <option value="">请选择类型</option>
        <option value="consultation">问诊</option>
        <option value="medicine">药物</option>
        <option value="treatment">治疗</option>
        <option value="examination">检查</option>
        <option value="other">其他</option>
      </select>
    </td>
    <td>
      <input type="number" class="form-control item-quantity" min="1" value="1" data-action="calculate-subtotal" required>
    </td>
    <td>
      <input type="number" class="form-control item-price" min="0" step="0.01" placeholder="0.00" data-action="calculate-subtotal" required>
    </td>
    <td>
      <span class="item-subtotal">¥0.00</span>
    </td>
    <td>
      <button type="button" class="btn btn-danger btn-sm" data-action="remove-bill-item">
        <i class="fas fa-trash"></i> 删除
      </button>
    </td>
  `;
  
  container.appendChild(detailItem);
  console.log('Bill item added successfully to container');
};

/**
 * 移除账单项目
 */
window.removeBillItem = function(button) {
  const row = button.closest('tr');
  row.remove();
  calculateTotalAmount();
};

/**
 * 调整数量的spinner按钮处理函数
 */
window.adjustQuantity = function(button, delta) {
  const input = button.parentElement.querySelector('.item-quantity');
  const currentValue = parseInt(input.value) || 1;
  const newValue = Math.max(1, currentValue + delta); // 最小值为1
  input.value = newValue;
  calculateItemSubtotal(input);
};

/**
 * 调整生命体征的spinner按钮处理函数
 */
window.adjustVitalSign = function(fieldId, delta) {
  const input = document.getElementById(fieldId);
  const currentValue = parseFloat(input.value) || 0;
  let newValue = currentValue + delta;
  
  // 设置合理的范围限制
  if (fieldId === 'temperature') {
    newValue = Math.max(30, Math.min(45, newValue)); // 体温范围 30-45°C
    newValue = Math.round(newValue * 10) / 10; // 保留一位小数
  } else if (fieldId === 'pulse') {
    newValue = Math.max(30, Math.min(200, newValue)); // 脉搏范围 30-200次/分
    newValue = Math.round(newValue);
  } else if (fieldId === 'respiratory-rate') {
    newValue = Math.max(5, Math.min(60, newValue)); // 呼吸范围 5-60次/分
    newValue = Math.round(newValue);
  }
  
  input.value = newValue;
};

/**
 * 计算单个项目的小计
 */
window.calculateItemSubtotal = function(input) {
  const row = input.closest('tr');
  const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
  const price = parseFloat(row.querySelector('.item-price').value) || 0;
  const subtotal = quantity * price;
  
  row.querySelector('.item-subtotal').textContent = `¥${subtotal.toFixed(2)}`;
  calculateTotalAmount();
};

/**
 * 计算总金额
 */
function calculateTotalAmount() {
  const subtotals = document.querySelectorAll('.item-subtotal');
  let total = 0;
  
  subtotals.forEach(subtotalEl => {
    const subtotalText = subtotalEl.textContent.replace('¥', '');
    total += parseFloat(subtotalText) || 0;
  });
  
  let totalAmountEl = document.querySelector('.total-amount');
  
  // 如果在主页面找不到，尝试在活动的模态框中查找
  if (!totalAmountEl) {
    const modal = document.querySelector('.modal.active');
    if (modal) {
      totalAmountEl = modal.querySelector('.total-amount');
    }
  }
  
  if (totalAmountEl) {
    totalAmountEl.textContent = `¥${total.toFixed(2)}`;
    console.log('Total amount updated:', total.toFixed(2));
  } else {
    console.error('Total amount element not found');
  }
}

/**
 * 处理生成账单
 */
async function handleGenerateBill(patientId, recordId) {
  try {
    // 收集用户在模态框中输入的账单明细数据
    const billItems = [];
    const billItemRows = document.querySelectorAll('.bill-detail-item');
    
    // 如果用户没有添加任何账单明细，使用后端默认生成
    if (billItemRows.length === 0) {
      const result = await apiClient.finance.generateBillFromRecord(recordId);
      Modal.notification(`账单已生成并保存，账单ID: ${result.id}`, 'success', '账单生成成功');
      return true;
    }
    
    // 验证并收集用户输入的账单明细
    let hasValidItems = false;
    for (const row of billItemRows) {
      const itemName = row.querySelector('.item-name')?.value?.trim();
      const itemType = row.querySelector('.item-type')?.value;
      const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
      const unitPrice = parseFloat(row.querySelector('.item-price')?.value) || 0;
      
      if (itemName && itemType && quantity > 0 && unitPrice >= 0) {
        billItems.push({
          item_name: itemName,
          item_type: itemType,
          quantity: quantity,
          unit_price: unitPrice,
          subtotal: quantity * unitPrice
        });
        hasValidItems = true;
      }
    }
    
    if (!hasValidItems) {
      Modal.notification('请至少添加一个有效的收费项目', 'warning', '输入验证失败');
      return false;
    }
    
    // 计算总金额
    const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 生成发票号和账单日期
     const currentDate = new Date().toISOString();
     // 使用更精确的时间戳和随机数避免重复
     const invoiceNumber = 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
     
     // 构建账单数据（包含账单明细）
     const billData = {
       patient_id: parseInt(patientId),
       medical_record_id: recordId ? parseInt(recordId) : null,
       invoice_number: invoiceNumber,
       bill_date: currentDate,
       total_amount: totalAmount,
       items: billItems
     };
    
    // 调用创建账单API
    const result = await apiClient.finance.createBill(billData);
    
    Modal.notification(`账单已生成并保存，账单ID: ${result.id}，总金额: ¥${totalAmount.toFixed(2)}`, 'success', '账单生成成功');
    return true;
    
  } catch (error) {
    console.error('生成账单失败:', error);
    Modal.notification('生成账单失败: ' + error.message, 'error', '账单生成失败');
    return false;
  }
}