// frontend/js/modules/patientManager.js

import apiClient from '../apiClient.js';
import { showLoading, confirmDialog } from '../utils/ui.js';
import { formatDate, formatDateTime } from '../utils/date.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';

/**
 * 患者管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
    // 重置分页状态
    currentPage = 1;
    totalPages = 1;
    pagination = null;
    
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div id="patient-module-content">
                <div class="data-table-container">
                    <div class="table-header-controls">
                        <div class="search-input-group">
                            <input type="text" id="patient-search-input" data-i18n-placeholder="search_patients_placeholder" placeholder="按姓名搜索患者...">
                            <button id="add-patient-btn" class="search-addon-btn" data-i18n="add_new_patient">添加新患者</button>
                        </div>
                    </div>
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-i18n="patient_id">ID</th>
                                    <th data-i18n="patient_name">姓名</th>
                                    <th data-i18n="patient_gender">性别</th>
                                    <th data-i18n="patient_birth_date">出生日期</th>
                                    <th data-i18n="patient_phone">电话</th>
                                    <th data-i18n="actions">操作</th>
                                </tr>
                            </thead>
                            <tbody id="patient-table-body"></tbody>
                        </table>
                        <div id="patient-pagination-container" class="pagination-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 翻译页面内容
    if (window.translatePage) {
        window.translatePage();
    }

  // 绑定搜索功能
  const searchInput = document.getElementById('patient-search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      // 防抖处理
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadAndDisplayPatients(1, query);
      }, 300);
    }, { signal });
  }

  // 初始化加载数据
  await loadAndDisplayPatients(1, '');

  // 绑定事件
  const addBtn = document.getElementById('add-patient-btn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddPatientModal, { signal });
  }

  // 绑定表格事件
  const tableBody = document.getElementById('patient-table-body');
  if (tableBody) {
    tableBody.addEventListener('click', handleTableAction, { signal });
  }

  // 订阅事件
  const unsubscribe = window.eventBus.on('patient:updated', () => {
    loadAndDisplayPatients(1, '');
  });

  // 模块清理函数
  return function cleanup() {
    // 取消事件订阅
    unsubscribe();
    console.log('Patient module cleaned up');
  };
}

/**
 * 处理表格操作事件
 */
function handleTableAction(e) {
  // 使用 closest 方法确保找到正确的链接元素，避免点击文本节点的问题
  const target = e.target.closest('.action-link');
  if (!target || !target.dataset.action) return;
  
  e.preventDefault();
  
  const id = target.dataset.id;
  const name = target.dataset.name || '';
  const action = target.dataset.action;
  
  switch (action) {
    case 'edit':
      editPatient(id);
      break;
    case 'delete':
      deletePatient(id, name);
      break;
    case 'view':
      viewPatient(id);
      break;
    case 'view-records':
      // 直接调用全局的模块切换函数，并传递 patientId
      if (window.switchModule) {
        window.switchModule('病历', { patientId: id });
      } else {
        console.error('switchModule function is not available.');
      }
      break;
  }
}

// 分页状态
let currentPage = 1;
let totalPages = 1;
let pagination = null;

/**
 * 加载并显示患者数据
 * @param {number} page - 页码
 * @param {string} query - 搜索关键词
 */
async function loadAndDisplayPatients(page = 1, query = '') {
  const tableBody = document.getElementById('patient-table-body');
  if (!tableBody) return;
  
  // 确保page参数是有效的数字
  const validPage = parseInt(page) || 1;
  
  // 显示加载状态
  showLoading(tableBody, 5);
  
  try {
    // 获取患者数据
    const response = await apiClient.patients.getAll(validPage, 10, query);
    const patients = response.items || [];
    
    if (patients.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center" data-i18n="no_patients_found">未找到患者记录</td></tr>`;
      if (window.translatePage) {
        window.translatePage();
      }
      return;
    }
    
    // 渲染患者表格
    tableBody.innerHTML = '';
    
    patients.forEach(patient => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${patient.id}</td>
        <td>${patient.name || '-'}</td>
        <td>${patient.gender === 'male' ? (window.getTranslation ? window.getTranslation('gender_male') : '男') : patient.gender === 'female' ? (window.getTranslation ? window.getTranslation('gender_female') : '女') : (window.getTranslation ? window.getTranslation('gender_other') : '其他')}</td>
        <td>${patient.birth_date ? formatDate(patient.birth_date) : '-'}</td>
        <td>${patient.contact_number || '-'}</td>
        <td>
          <a href="#" class="action-link view" data-action="view" data-id="${patient.id}" data-i18n="action_view">查看</a>
          <a href="#" class="action-link edit" data-action="edit" data-id="${patient.id}" data-i18n="action_edit">编辑</a>
          <a href="#" class="action-link" data-action="view-records" data-id="${patient.id}" data-i18n="action_medical_records">病历</a>
          <a href="#" class="action-link delete" data-action="delete" data-id="${patient.id}" data-name="${patient.name || ''}" data-i18n="action_delete">删除</a>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // 更新分页信息
    currentPage = validPage;
    const total = response.total || 0;
    totalPages = Math.ceil(total / 10);
    
    // 渲染分页组件
    renderPagination(query);
    
  } catch (error) {
    console.error('加载患者数据失败', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">${window.getTranslation ? window.getTranslation('loading_failed') : '加载失败'}: ${error.message}</td></tr>`;
  }
}

/**
 * 渲染分页组件
 * @param {string} query - 搜索关键词
 */
function renderPagination(query = '') {
  const paginationContainer = document.getElementById('patient-pagination-container');
  if (!paginationContainer) return;
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  // 创建或更新分页组件
  if (!pagination) {
    pagination = new Pagination({
      containerId: 'patient-pagination-container',
      currentPage: currentPage,
      totalPages: totalPages,
      onPageChange: (page) => {
        loadAndDisplayPatients(page, query);
      }
    });
  } else {
    pagination.update({
      currentPage: currentPage,
      totalPages: totalPages
    });
  }
  
  pagination.render();
}

/**
 * 显示添加患者模态框
 */
function showAddPatientModal() {
  showNotification('添加患者', '请在患者管理界面直接添加新患者', 'info');
  // 可以在这里添加直接在页面中显示表单的逻辑
}

/**
 * 编辑患者信息
 * @param {string} id - 患者ID
 */
async function editPatient(id) {
  try {
    const patient = await apiClient.patients.getById(id);
    
    const form = document.createElement('form');
    form.id = 'patient-form';
    form.innerHTML = `
      <input type="hidden" id="patient-id" value="${patient.id}">
      <div class="form-group">
        <label for="patient-name" data-i18n="patient_name">姓名</label>
        <input type="text" id="patient-name" value="${patient.name || ''}" required>
      </div>
      <div class="form-group">
        <label for="patient-gender" data-i18n="patient_gender">性别</label>
        <select id="patient-gender">
          <option value="male" ${patient.gender === 'male' ? 'selected' : ''} data-i18n="gender_male">男</option>
          <option value="female" ${patient.gender === 'female' ? 'selected' : ''} data-i18n="gender_female">女</option>
          <option value="other" ${patient.gender === 'other' ? 'selected' : ''} data-i18n="gender_other">其他</option>
        </select>
      </div>
      <div class="form-group">
        <label for="patient-birth-date" data-i18n="patient_birth_date">出生日期</label>
        <input type="date" id="patient-birth-date" value="${patient.birth_date || ''}">
      </div>
      <div class="form-group">
        <label for="patient-contact-number" data-i18n="patient_phone">联系电话</label>
        <input type="tel" id="patient-contact-number" value="${patient.contact_number || ''}">
      </div>
      <div class="form-group">
        <label for="patient-address" data-i18n="patient_address">住址</label>
        <textarea id="patient-address" rows="2">${patient.address || ''}</textarea>
      </div>
    `;

    showNotification('编辑患者', '请在患者管理界面直接编辑患者信息', 'info');
    // 可以在这里添加直接在页面中显示编辑表单的逻辑
    
  } catch (error) {
    window.showNotification(window.getTranslation ? window.getTranslation('error') : '错误', `${window.getTranslation ? window.getTranslation('get_patient_info_failed') : '获取患者信息失败'}: ${error.message}`, 'error');
  }
}

/**
 * 处理患者表单提交
 * @param {boolean} isEdit - 是否是编辑模式
 */
async function handlePatientFormSubmit(isEdit) {
  const form = document.getElementById('patient-form');
  if (!form) return;
  
  const nameInput = document.getElementById('patient-name');
  const genderSelect = document.getElementById('patient-gender');
  const birthDateInput = document.getElementById('patient-birth-date');
  const contactNumberInput = document.getElementById('patient-contact-number');
  const addressTextarea = document.getElementById('patient-address');
  const idInput = isEdit ? document.getElementById('patient-id') : null;
  
  if (!nameInput.value.trim()) {
    window.showNotification(window.getTranslation ? window.getTranslation('error') : '错误', window.getTranslation ? window.getTranslation('patient_name_required') : '患者姓名不能为空', 'error');
    return false; // 阻止模态框关闭
  }
  
  const patientData = {
    name: nameInput.value.trim(),
    gender: genderSelect.value,
    birth_date: birthDateInput.value || null,
    contact_number: contactNumberInput.value.trim(),
    address: addressTextarea.value.trim()
  };
  
  try {
    if (isEdit && idInput) {
      await apiClient.patients.update(idInput.value, patientData);
      window.showNotification('成功', '患者信息已更新', 'success');
    } else {
      await apiClient.patients.create(patientData);
      window.showNotification('成功', '新患者已添加', 'success');
    }
    
    // 触发更新事件
    window.eventBus.emit('patient:updated');
    
    return true; // 允许模态框关闭
  } catch (error) {
    window.showNotification('错误', `保存失败: ${error.message}`, 'error');
    return false; // 阻止模态框关闭
  }
}

/**
 * 删除患者
 * @param {string} id - 患者ID
 * @param {string} name - 患者姓名
 */
async function deletePatient(id, name) {
  const message = `确定要删除患者 "${name || id}" 吗？此操作不可恢复，且将删除与该患者相关的所有记录。`;
  const confirmed = await confirmDialog('确认删除', message);
  
  if (confirmed) {
    try {
      await apiClient.patients.delete(id);
      window.showNotification('成功', '患者记录已删除', 'success');
      window.eventBus.emit('patient:updated');
    } catch (error) {
      window.showNotification('错误', `删除失败: ${error.message}`, 'error');
    }
  }
}

/**
 * 查看患者详情
 * @param {string} id - 患者ID
 */
async function viewPatient(id) {
  try {
    const patient = await apiClient.patients.getById(id);
    
    const content = document.createElement('div');
    content.className = 'patient-detail-view';
    content.innerHTML = `
      <table class="patient-detail-table">
        <tbody>
          <tr>
            <th>姓名</th>
            <td>${patient.name || '-'}</td>
          </tr>
          <tr>
            <th>性别</th>
            <td>${patient.gender === 'male' ? (window.getTranslation ? window.getTranslation('gender_male') : '男') : patient.gender === 'female' ? (window.getTranslation ? window.getTranslation('gender_female') : '女') : (window.getTranslation ? window.getTranslation('gender_other') : '其他')}</td>
          </tr>
          <tr>
            <th>出生日期</th>
            <td>${patient.birth_date ? formatDate(patient.birth_date) : '-'}</td>
          </tr>
          <tr>
            <th>联系电话</th>
            <td>${patient.contact_number || '-'}</td>
          </tr>
          <tr>
            <th>住址</th>
            <td>${patient.address || '-'}</td>
          </tr>
          <tr>
            <th>创建时间</th>
            <td>${patient.created_at ? formatDateTime(patient.created_at) : '-'}</td>
          </tr>
        </tbody>
      </table>
    `;

    showNotification('患者详情', '患者信息已在主界面显示', 'info');
    // 可以在这里添加直接在页面中显示详情的逻辑
    
  } catch (error) {
    window.showNotification(window.getTranslation ? window.getTranslation('error') : '错误', `${window.getTranslation ? window.getTranslation('get_patient_info_failed') : '获取患者信息失败'}: ${error.message}`, 'error');
  }
}