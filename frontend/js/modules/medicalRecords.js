// frontend/js/modules/medicalRecords.js

import { showLoading, showNotification, confirmDialog } from '../utils/ui.js';
import Modal from '../components/modal.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';
import { formatDate, calculateAge } from '../utils/date.js';

// 全局变量
let currentPatientId = null;
let currentRecordId = null;
let currentPatient = null;
let pagination = null;
let signal = null;

// 全局事件监听器 - 在模块加载时就注册
window.eventBus.on('view:medical-records', ({ patientId }) => {
  if (patientId) {
    // 检查当前是否在病历模块
    const currentModule = window.store.get('currentModule');
    
    if (currentModule !== '病历') {
      // 如果不在病历模块，先切换到病历模块
      import('../main.js').then(({ switchModule }) => {
        switchModule('病历').then(() => {
          // 切换完成后，等待足够时间确保模块完全加载完成，然后选中患者
          setTimeout(() => {
            selectPatientInMedicalRecords(patientId);
          }, 500);
        });
      });
    } else {
      // 如果已经在病历模块，直接选中患者
      selectPatientInMedicalRecords(patientId);
    }
  }
});

/**
 * 病历管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal: moduleSignal }) {
  // 设置全局signal
  signal = moduleSignal;
  
  // 渲染模块基本结构 - 统一的模块包装器
  container.innerHTML = `
    <div class="medical-records-module-wrapper">
      <div id="medical-records-module-content">
        <div class="data-table-container">
          <div class="medical-records-layout">
            <!-- 左侧患者列表 -->
            <div class="patients-sidebar">
              <div class="sidebar-header">
                <div class="search-box">
                  <input type="text" id="patient-search" placeholder="搜索患者...">
                </div>
              </div>
              <div class="patients-list" id="patients-list">
                <!-- 患者列表将在这里动态加载 -->
              </div>
              <div id="patients-pagination"></div>
            </div>
            
            <!-- 可拖拽的分隔线 -->
            <div class="resizer" id="resizer"></div>
            
            <!-- 右侧病历编辑区 -->
            <div class="medical-record-editor">
              <div class="editor-content" id="editor-content">
                <div class="no-patient-selected">
                  <div class="placeholder-icon">📋</div>
                  <h3>请选择患者</h3>
                  <p>从左侧列表中选择一个患者来查看或编辑病历</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 初始化患者搜索
  const patientSearch = document.getElementById('patient-search');
  if (patientSearch) {
    patientSearch.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      loadPatients(1, query);
    }, { signal });
  }
  
  // 初始绑定患者列表事件
  bindPatientListEvents();
  
  // 初始化拖拽调整功能
  initResizer(signal);
  
// 绑定患者列表点击事件的函数
function bindPatientListEvents() {
  const patientsList = document.getElementById('patients-list');
  if (patientsList) {
    // 移除之前的事件监听器（如果存在）
    patientsList.removeEventListener('click', handlePatientClick);
    // 添加新的事件监听器
    patientsList.addEventListener('click', handlePatientClick, { signal });
  }
}

// 患者点击处理函数
function handlePatientClick(e) {
  const patientItem = e.target.closest('.patient-item');
  if (patientItem) {
    const patientId = patientItem.dataset.id;
    
    // 更新选中状态
    document.querySelectorAll('.patient-item').forEach(item => {
      item.classList.remove('active');
    });
    patientItem.classList.add('active');
    
    // 设置当前患者
    currentPatientId = patientId;
    
    // 直接渲染病历模块
    renderMedicalRecordModule(patientId, signal);
  }
}

// 加载患者列表的函数
async function loadPatients(page = 1, query = '') {
  await renderPatientList(page, query);
}

// 初始加载患者列表
await loadPatients();

/**
 * 在病历模块中选中指定患者的函数
 */
async function selectPatientInMedicalRecords(patientId) {
  currentPatientId = patientId;
  
  // 如果当前模块已经渲染，直接更新
  const container = document.querySelector('.medical-records-module-wrapper');
  if (container) {
    // 使用全局signal，如果没有则传null
    renderMedicalRecordModule(patientId, signal);
    
    // 首先尝试在当前页面中找到患者
    let targetPatientItem = document.querySelector(`.patient-item[data-id="${patientId}"]`);
    
    if (!targetPatientItem) {
      // 如果在当前页面找不到患者，尝试通过搜索找到该患者
      try {
        const patient = await apiClient.patients.getById(patientId);
        if (patient) {
          // 使用患者姓名进行搜索
          const searchInput = document.getElementById('patient-search');
          if (searchInput) {
            searchInput.value = patient.name;
            // 触发搜索
            await renderPatientList(1, patient.name);
            // 搜索完成后再次尝试找到患者项
            targetPatientItem = document.querySelector(`.patient-item[data-id="${patientId}"]`);
          }
        }
      } catch (error) {
        console.error('获取患者信息失败:', error);
      }
    }
    
    // 在患者列表中标记选中项
    document.querySelectorAll('.patient-item').forEach(item => {
      if (item.dataset.id === patientId) {
        item.classList.add('active');
        // 滚动到选中的患者项
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        item.classList.remove('active');
      }
    });
    
    // 更新侧边栏导航状态（这里不需要手动更新，因为switchModule已经处理了）
    // document.querySelectorAll('.sidebar-item').forEach(item => {
    //   item.classList.remove('active');
    // });
    // document.querySelector('.sidebar-item[data-module="病历"]')?.classList.add('active');
  } else {
    // 如果模块还没有渲染，等待一段时间后重试
    setTimeout(() => {
      selectPatientInMedicalRecords(patientId);
    }, 200);
  }
}

/**
 * 渲染患者列表
 * @param {number} page - 页码
 * @param {string} query - 搜索关键词
 */
async function renderPatientList(page = 1, query = '') {
  const patientsContainer = document.getElementById('patients-list');
  const paginationContainer = document.getElementById('patients-pagination');
  
  if (!patientsContainer) return;
  
  showLoading(patientsContainer, 3);
  
  try {
    const response = await apiClient.patients.getAll(page, 10, query);
    const patients = response.items || [];
    const total = response.total || 0;
    const totalPages = Math.ceil(total / 10);
    
    if (patients.length === 0) {
      patientsContainer.innerHTML = `
        <div class="empty-state">
          <p class="no-match-text">${query ? '没有找到匹配的患者' : '还没有添加任何患者'}</p>
        </div>
      `;
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
      return;
    }
    
    // 渲染患者列表
    patientsContainer.innerHTML = patients.map(patient => `
      <div class="patient-item" data-id="${patient.id}">
        <div class="patient-info">
          <div class="patient-name">${patient.name || '未命名患者'}</div>
          <div class="patient-details">
            <span class="patient-gender">${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</span>
            <span class="patient-age">${patient.birth_date ? calculateAge(patient.birth_date) + '岁' : ''}</span>
            <span class="patient-phone">${patient.phone || ''}</span>
          </div>
        </div>

      </div>
    `).join('');
    
    // 渲染分页
    if (paginationContainer && totalPages > 1) {
      renderPagination(paginationContainer, page, totalPages, (newPage) => {
        renderPatientList(newPage, query);
      });
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
    // 重新绑定患者列表事件（因为innerHTML会移除事件监听器）
    bindPatientListEvents();
    
  } catch (error) {
    console.error('加载患者列表失败', error);
    patientsContainer.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>无法加载患者列表: ${error.message}</p>
        <button class="btn btn-primary" onclick="renderPatientList(${page}, '${query}')">重试</button>
      </div>
    `;
  }
}

/**
 * 渲染分页组件
 * @param {HTMLElement} container - 分页容器
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 * @param {Function} onPageChange - 页码变化回调
 */
function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  const pagination = new Pagination({
    containerId: container.id,
    currentPage: currentPage,
    totalPages: totalPages,
    onPageChange: onPageChange
  });

  pagination.render();
}





// 处理病历表单提交
async function handleMedicalRecordSubmit(e, signal) {
    e.preventDefault();
    
    const form = document.getElementById('medical-record-form');
    if (!form) return;
    
    // 获取表单数据
    const recordId = document.getElementById('record-id')?.value;
    const patientId = document.getElementById('patient-id').value;
    const doctorId = document.getElementById('doctor-id').value;
    const visitDate = document.getElementById('visit-date').value;
    const chiefComplaint = document.getElementById('chief-complaint').value.trim();
    const presentIllness = document.getElementById('present-illness').value.trim();
    const pastHistory = document.getElementById('past-history').value.trim();
    const temperature = document.getElementById('temperature').value;
    const pulse = document.getElementById('pulse').value;
    const respiratoryRate = document.getElementById('respiratory-rate').value;
    const bloodPressure = document.getElementById('blood-pressure').value.trim();
    const physicalExamination = document.getElementById('physical-examination').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();
    const treatmentPlan = document.getElementById('treatment-plan').value.trim();
    const prescription = document.getElementById('prescription').value.trim();
    const notes = document.getElementById('notes').value.trim();
    
    // 验证必填字段
    if (!visitDate) {
      showNotification('请填写就诊日期', 'error');
      return;
    }
    
    // 构建数据对象
    const recordData = {
      patient_id: parseInt(patientId),
      doctor_id: parseInt(doctorId) || null,
      record_date: visitDate,
      chief_complaint: chiefComplaint || null,
      present_illness: presentIllness || null,
      past_history: pastHistory || null,
      temperature: temperature ? parseFloat(temperature) : null,
      pulse: pulse ? parseInt(pulse) : null,
      respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
      blood_pressure: bloodPressure || null,
      physical_examination: physicalExamination || null,
      diagnosis: diagnosis || null,
      treatment_plan: treatmentPlan || null,
      prescription: prescription || null,
      notes: notes || null
    };
    
    try {
      if (recordId) {
        // 更新现有病历
        await apiClient.medicalRecords.update(recordId, recordData);
        showNotification('病历已更新', 'success');
      } else {
        // 创建新病历
        const newRecord = await apiClient.medicalRecords.create(recordData);
        currentRecordId = newRecord.id;
        // 更新隐藏字段中的记录ID
        const recordIdInput = document.getElementById('record-id');
        if (!recordIdInput) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.id = 'record-id';
          hiddenInput.value = newRecord.id;
          form.appendChild(hiddenInput);
        } else {
          recordIdInput.value = newRecord.id;
        }
        showNotification('病历已保存', 'success');
      }      
      // 重新渲染病历模块以显示最新数据
      await renderMedicalRecordModule(currentPatientId, null);
      
      // 重新加载病历列表
      await loadPatientRecords(currentPatientId);
      
    } catch (error) {
      console.error('保存病历失败', error);
      showNotification(`保存病历失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 渲染病历模块
   * @param {string} patientId - 患者ID
   * @param {AbortSignal} signal - AbortController信号
   */
async function renderMedicalRecordModule(patientId, signal = null) {
  const contentContainer = document.getElementById('editor-content');
  if (!contentContainer || !patientId) return;
  
  showLoading(contentContainer, 3);
  
  try {
    // 获取患者信息
    const patient = await apiClient.patients.getById(patientId);
    currentPatient = patient;
    
    // 获取当前用户(医生)信息
    let currentUser;
    try {
      currentUser = await apiClient.auth.getCurrentUser();
    } catch (error) {
      console.error('获取当前用户信息失败', error);
      currentUser = { id: '', full_name: '未知医生' };
    }
    
    // 尝试获取患者的最新病历记录
    let latestRecord = null;
    try {
      const recordsResponse = await apiClient.medicalRecords.getByPatientId(patientId, 1, 1);
      // 后端直接返回数组，不是包含items的对象
      if (recordsResponse && recordsResponse.length > 0) {
        latestRecord = recordsResponse[0];
        console.log('获取到最新病历记录:', latestRecord);
      }
    } catch (error) {
      console.log('未找到现有病历记录，将创建新病历', error);
    }
    
    // 渲染病历表单
    contentContainer.innerHTML = `
      <div class="medical-record-form">
        <div class="patient-header">
          <h3>${patient.name || '未命名患者'}</h3>
          <div class="patient-basic-info">
            <span>${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</span>
            <span>${patient.birth_date ? `${calculateAge(patient.birth_date)}岁 (${patient.birth_date})` : ''}</span>
            <span>${patient.phone || ''}</span>
          </div>
        </div>
        
        <form id="medical-record-form">
          ${latestRecord ? `<input type="hidden" id="record-id" value="${latestRecord.id}">` : ''}
          <input type="hidden" id="patient-id" value="${patient.id}">
          <input type="hidden" id="doctor-id" value="${currentUser.id}">
          
          <div class="form-row">
            <div class="form-group">
              <label for="visit-date">就诊日期</label>
              <input type="date" id="visit-date" value="${formatDate(new Date())}" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="chief-complaint">主诉</label>
            <textarea id="chief-complaint" rows="2" placeholder="请描述患者的主要症状...">${latestRecord ? latestRecord.chief_complaint || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="present-illness">现病史</label>
            <textarea id="present-illness" rows="3" placeholder="请描述现病史...">${latestRecord ? latestRecord.present_illness || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="past-history">既往史</label>
            <textarea id="past-history" rows="2" placeholder="请描述既往病史...">${latestRecord ? latestRecord.past_history || '' : ''}</textarea>
          </div>
          
          <fieldset>
            <legend>生命体征</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="temperature">体温(°C)</label>
                <input type="number" id="temperature" step="0.1" placeholder="36.5" value="${latestRecord ? latestRecord.temperature || '' : ''}">
              </div>
              <div class="form-group">
                <label for="pulse">脉搏(次/分)</label>
                <input type="number" id="pulse" placeholder="80" value="${latestRecord ? latestRecord.pulse || '' : ''}">
              </div>
              <div class="form-group">
                <label for="respiratory-rate">呼吸频率(次/分)</label>
                <input type="number" id="respiratory-rate" placeholder="20" value="${latestRecord ? latestRecord.respiratory_rate || '' : ''}">
              </div>
              <div class="form-group">
                <label for="blood-pressure">血压(mmHg)</label>
                <input type="text" id="blood-pressure" placeholder="120/80" value="${latestRecord ? latestRecord.blood_pressure || '' : ''}">
              </div>
            </div>
          </fieldset>
          
          <div class="form-group">
            <label for="physical-examination">体格检查</label>
            <textarea id="physical-examination" rows="3" placeholder="请描述体格检查结果...">${latestRecord ? latestRecord.physical_examination || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="diagnosis">诊断</label>
            <textarea id="diagnosis" rows="2" placeholder="请输入诊断结果..." required>${latestRecord ? latestRecord.diagnosis || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="treatment-plan">治疗方案</label>
            <textarea id="treatment-plan" rows="3" placeholder="请描述治疗方案...">${latestRecord ? latestRecord.treatment_plan || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="prescription">处方</label>
            <textarea id="prescription" rows="3" placeholder="请输入处方信息...">${latestRecord ? latestRecord.prescription || '' : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="notes">备注</label>
            <textarea id="notes" rows="2" placeholder="其他备注信息...">${latestRecord ? latestRecord.notes || '' : ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存病历</button>
            <button type="button" class="btn btn-outline" id="clear-form-btn">清空表单</button>
          </div>
        </form>
      </div>
    `;
    
    // 绑定表单提交事件
    const form = document.getElementById('medical-record-form');
    if (form) {
      if (signal) {
        form.addEventListener('submit', (e) => handleMedicalRecordSubmit(e, signal), { signal });
      } else {
        form.addEventListener('submit', (e) => handleMedicalRecordSubmit(e, signal));
      }
    }
    
    // 绑定清空表单按钮
    const clearBtn = document.getElementById('clear-form-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空表单吗？')) {
          form.reset();
          document.getElementById('visit-date').value = formatDate(new Date());
        }
      }, signal ? { signal } : {});
    }
    
  } catch (error) {
    console.error('加载患者信息失败', error);
    contentContainer.innerHTML = `<div class="error-message">加载患者信息失败: ${error.message}</div>`;
  }
}

/**
 * 加载患者选项到下拉框
 */
async function loadPatientOptions() {
  const patientSelect = document.getElementById('patient-select');
  if (!patientSelect) return;
  
  try {
    const response = await apiClient.patients.getAll(1, 100); // 获取前100个患者
    const patients = response.items || [];
    
    // 清空现有选项（保留默认选项）
    patientSelect.innerHTML = '<option value="">请选择患者</option>';
    
    // 添加患者选项
    patients.forEach(patient => {
      const option = document.createElement('option');
      option.value = patient.id;
      option.textContent = `${patient.name} (ID: ${patient.id})`;
      patientSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('加载患者列表失败:', error);
    showNotification('错误', '加载患者列表失败', 'error');
  }
}

/**
 * 加载并显示病历记录
 * @param {string} patientId - 患者ID
 * @param {number} page - 页码
 */
async function loadAndDisplayMedicalRecords(patientId, page = 1) {
  const tableBody = document.getElementById('medical-records-table-body');
  const paginationContainer = document.getElementById('medical-records-pagination-container');
  
  if (!tableBody || !patientId) return;
  
  try {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading">加载中...</td></tr>';
    
    const response = await apiClient.medicalRecords.getByPatientId(patientId, page, 10);
    const records = response.items || [];
    const totalPages = response.total_pages || 1;
    
    if (records.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="no-data">该患者暂无病历记录</td></tr>';
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
      return;
    }
    
    // 渲染病历表格
    const html = records.map(record => {
      const date = record.record_date ? formatDate(record.record_date) : '未知';
      return `
        <tr>
          <td>${date}</td>
          <td>${record.symptoms || '无'}</td>
          <td>${record.diagnosis || '无'}</td>
          <td>${record.treatment_plan || '无'}</td>
          <td>
            <a href="#" class="action-link action-view" data-action="view" data-id="${record.id}">查看</a>
            <a href="#" class="action-link action-edit" data-action="edit" data-id="${record.id}">编辑</a>
            <a href="#" class="action-link action-delete" data-action="delete" data-id="${record.id}">删除</a>
          </td>
        </tr>
      `;
    }).join('');
    
    tableBody.innerHTML = html;
    
    // 渲染分页
    if (paginationContainer && totalPages > 1) {
      new Pagination({
        containerId: 'medical-records-pagination-container',
        currentPage: page,
        totalPages: totalPages,
        onPageChange: (newPage) => loadAndDisplayMedicalRecords(patientId, newPage)
      }).render();
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
  } catch (error) {
    console.error('加载病历记录失败', error);
    tableBody.innerHTML = `<tr><td colspan="7" class="error-message">加载病历记录失败: ${error.message}</td></tr>`;
  }
}

/**
 * 加载患者病历列表
 * @param {string} patientId - 患者ID
 * @param {number} page - 页码
 * @param {AbortSignal} signal - AbortController信号
 */
async function loadPatientRecords(patientId, page = 1, signal = null) {
  const recordsList = document.getElementById('records-list');
  const paginationContainer = document.getElementById('records-pagination');
  
  if (!recordsList || !patientId) return;
  
  showLoading(recordsList, 3);
  
  try {
    // 获取病历列表
    const response = await apiClient.medicalRecords.getByPatientId(patientId, page);
    // 后端直接返回数组，不是分页对象
    const records = Array.isArray(response) ? response : [];
    const totalPages = 1; // 暂时设为1，因为后端没有返回分页信息
    
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
            <a href="#" class="action-link view" data-action="view" data-id="${record.id}">查看</a>
            <a href="#" class="action-link edit" data-action="edit" data-id="${record.id}">编辑</a>
            <a href="#" class="action-link" data-action="print" data-id="${record.id}">打印</a>
            <a href="#" class="action-link" data-action="prescription" data-id="${record.id}">处方</a>
            <a href="#" class="action-link delete" data-action="delete" data-id="${record.id}">删除</a>
          </div>
        </div>
      `;
    });
    
    recordsList.innerHTML = html;
    
    // 添加病历操作事件
    if (signal) {
      recordsList.addEventListener('click', handleRecordAction, { signal });
    } else {
      recordsList.addEventListener('click', handleRecordAction);
    }
    
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
 * 处理表格操作事件
 * @param {Event} e - 事件对象
 */
function handleTableAction(e) {
  const target = e.target;
  if (!target.dataset.action) return;
  
  e.preventDefault();
  
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
 * 处理病历操作事件 (保留兼容性)
 * @param {Event} e - 事件对象
 */
function handleRecordAction(e) {
  handleTableAction(e);
}

/**
 * 显示新建病历模态框
 */
function showAddMedicalRecordModal() {
  showMedicalRecordForm(null);
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
    
    // 重新渲染病历模块以显示最新数据
    await renderMedicalRecordModule(patientId, null);
    
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
 * 保存处方
 * @param {string} recordId - 病历ID
 */
async function savePrescriptions(recordId) {
  try {
    // 为每个处方项目创建处方记录
    const prescriptionPromises = window.tempPrescriptionItems.map(item => {
      // 如果已经有ID，则不需要创建
      if (item.id) return Promise.resolve();
      
      return apiClient.prescriptions.create({
        medical_record_id: recordId,
        medicine_id: item.medicineId,
        dosage: item.dosage,
        frequency: item.frequency,
        notes: item.notes
      });
    });
    
    await Promise.all(prescriptionPromises);
    
    // 重新加载处方列表
    await loadPrescriptions(recordId);
    
    return true;
  } catch (error) {
    console.error('保存处方失败:', error);
    showNotification('错误', `保存处方失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 打印病历
 * @param {string} recordId - 病历ID
 */
async function printMedicalRecord(recordId) {
  if (!recordId) {
    showNotification('错误', '缺少病历ID', 'error');
    return;
  }
  
  try {
    // 并行获取所有需要的数据
    const [record, prescriptions] = await Promise.all([
      apiClient.medicalRecords.getById(recordId),
      apiClient.prescriptions.getByMedicalRecordId(recordId)
    ]);
    
    const patient = await apiClient.patients.getById(record.patient_id);
    
    // 计算年龄
    const calculateAge = (birthDate) => {
      if (!birthDate) return '未知';
      const birth = new Date(birthDate);
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };
    
    const patientAge = calculateAge(patient.birth_date);
    
    // 构建打印用的HTML
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>病历记录 - ${patient.name}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 8px; text-align: left; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          @media print {
            body { margin: 0; padding: 15px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Nekolinic诊所 - 病历记录</div>
          <p>就诊时间: ${new Date(record.record_date).toLocaleString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">患者信息</div>
          <p>姓名: ${patient.name} | 性别: ${patient.gender || '未记录'} | 年龄: ${patientAge}岁</p>
        </div>
        
        <div class="section">
          <div class="section-title">既往病史</div>
          <p>${patient.past_medical_history || '无'}</p>
        </div>
        
        <div class="section">
          <div class="section-title">主诉与症状</div>
          <p>${record.symptoms || '无记录'}</p>
        </div>
        
        <div class="section">
          <div class="section-title">诊断</div>
          <p>${record.diagnosis || '无记录'}</p>
        </div>
        
        <div class="section">
          <div class="section-title">处置意见</div>
          <p>${record.treatment_plan || '无记录'}</p>
        </div>
        
        ${prescriptions.length > 0 ? `
        <div class="section">
          <div class="section-title">处方信息</div>
          <table>
            <thead>
              <tr>
                <th>药品名称</th>
                <th>用量</th>
                <th>频率</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              ${prescriptions.map(p => `
                <tr>
                  <td>${p.medicine_name}</td>
                  <td>${p.dosage}</td>
                  <td>${p.frequency}</td>
                  <td>${p.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="footer">
          <div>医师签名: _________________</div>
          <div>日期: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <button onclick="window.print();" style="margin-top: 20px;">打印</button>
      </body>
      </html>
    `;
    
    // 打开新窗口并打印
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    
  } catch (error) {
    console.error('准备打印病历失败:', error);
    showNotification('错误', `获取病历信息失败: ${error.message}`, 'error');
  }
}

/**
 * 打印处方
 * @param {string} recordId - 病历ID
 */
async function printPrescription(recordId) {
  if (!recordId) {
    showNotification('错误', '缺少病历ID', 'error');
    return;
  }
  
  try {
    // 获取数据
    const prescriptions = await apiClient.prescriptions.getByMedicalRecordId(recordId);
    
    if (prescriptions.length === 0) {
      showNotification('提示', '此病历没有处方信息可打印', 'info');
      return;
    }
    
    const record = await apiClient.medicalRecords.getById(recordId);
    const patient = await apiClient.patients.getById(record.patient_id);
    
    // 计算年龄
    const calculateAge = (birthDate) => {
      if (!birthDate) return '未知';
      const birth = new Date(birthDate);
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };
    
    const patientAge = calculateAge(patient.birth_date);
    
    // 构建处方笺格式的HTML
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>处方笺 - ${patient.name}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .info-section { margin-bottom: 15px; }
          .prescription-list { margin: 20px 0; }
          .prescription-item { margin-bottom: 10px; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          .line { border-bottom: 1px solid #000; margin: 5px 0; }
          @media print {
            body { margin: 0; padding: 15px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Nekolinic 诊所 - 处方笺</div>
          <div class="line"></div>
        </div>
        
        <div class="info-section">
          <p><strong>患者:</strong> ${patient.name} &nbsp;&nbsp; <strong>性别:</strong> ${patient.gender || '未记录'} &nbsp;&nbsp; <strong>年龄:</strong> ${patientAge}岁</p>
          <p><strong>诊断:</strong> ${record.diagnosis || '无记录'}</p>
          <p><strong>日期:</strong> ${new Date(record.record_date).toLocaleDateString()}</p>
        </div>
        
        <h2>Rp.</h2>
        <ol class="prescription-list">
          ${prescriptions.map(p => `
            <li class="prescription-item">
              ${p.medicine_name} ${p.medicine_specification ? `(${p.medicine_specification})` : ''}
              <br>
              用法: ${p.dosage}, ${p.frequency}
              ${p.notes ? `<br>备注: ${p.notes}` : ''}
            </li>
          `).join('')}
        </ol>
        
        <div class="footer">
          <div><strong>医师签名:</strong> __________________</div>
          <div><strong>日期:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
        
        <button onclick="window.print();" style="margin-top: 20px;">打印</button>
      </body>
      </html>
    `;
    
    // 打开新窗口并打印
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    
  } catch (error) {
    console.error('准备打印处方失败:', error);
    showNotification('错误', `获取处方信息失败: ${error.message}`, 'error');
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

/**
 * 初始化拖拽调整功能
 * @param {AbortSignal} signal - AbortController信号用于清理
 */
function initResizer(signal) {
  const resizer = document.getElementById('resizer');
  const sidebar = document.querySelector('.patients-sidebar');
  const editor = document.querySelector('.medical-record-editor');
  const layout = document.querySelector('.medical-records-layout');
  
  if (!resizer || !sidebar || !editor || !layout) return;
  
  let isResizing = false;
  
  // 鼠标按下开始拖拽
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, { signal });
  
  // 鼠标移动调整大小
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const layoutRect = layout.getBoundingClientRect();
    const offsetX = e.clientX - layoutRect.left;
    const layoutWidth = layoutRect.width;
    
    // 计算左侧区域的百分比，限制在20%-80%之间
    let leftPercent = (offsetX / layoutWidth) * 100;
    leftPercent = Math.max(20, Math.min(80, leftPercent));
    
    // 设置左右区域的宽度
    sidebar.style.width = `${leftPercent}%`;
    editor.style.width = `${100 - leftPercent}%`;
  }, { signal });
  
  // 鼠标松开结束拖拽
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, { signal });
  
  // 鼠标离开窗口也结束拖拽
  document.addEventListener('mouseleave', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, { signal });
}

  // 模块清理函数
  return function cleanup() {
    console.log('Medical records module cleaned up');
  };
}