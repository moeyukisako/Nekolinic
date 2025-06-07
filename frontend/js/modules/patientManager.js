// frontend/js/modules/patientManager.js

import { showLoading, showNotification, confirmDialog } from '../utils/ui.js';
import { formatDate, formatDateTime } from '../utils/date.js';
import Modal from '../components/modal.js';
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
    container.innerHTML = `
        <div class="patient-module-wrapper">
            <div id="patient-module-content">
                <div class="header-bar">
                    <button id="add-patient-btn" class="btn btn-primary">添加新患者</button>
                </div>
                <div class="search-bar">
                    <input type="text" id="patient-search-input" placeholder="按姓名搜索患者...">
                </div>
                <div class="data-table-container">
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>姓名</th>
                                    <th>性别</th>
                                    <th>出生日期</th>
                                    <th>电话</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="patient-table-body"></tbody>
                        </table>
                        <div id="patient-pagination-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // 初始化搜索组件
  const searchBar = new SearchBar({
    containerId: 'patient-search-container',
    placeholder: '搜索患者姓名、电话号码...',
    onSearch: (query) => loadAndDisplayPatients(1, query)
  }).render();

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
  const target = e.target;
  if (!target.dataset.action) return;
  
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
      window.eventBus.emit('view:medical-records', { patientId: id });
      break;
  }
}

/**
 * 加载并显示患者列表
 * @param {number} page - 页码
 * @param {string} query - 搜索关键词
 */
async function loadAndDisplayPatients(page = 1, query = '') {
  const tableBody = document.getElementById('patient-table-body');
  if (!tableBody) return;
  
  // 显示加载状态
  showLoading(tableBody, 5);
  
  try {
    // 获取患者数据
    const response = await apiClient.patients.getAll(page, 10, query);
    const patients = response.items || [];
    const totalPages = response.total_pages || 1;
    
    if (patients.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">未找到患者记录</td></tr>';
      return;
    }
    
    // 渲染患者表格
    tableBody.innerHTML = '';
    
    patients.forEach(patient => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${patient.id}</td>
        <td>${patient.name || '-'}</td>
        <td>${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</td>
        <td>${patient.birth_date ? formatDate(patient.birth_date) : '-'}</td>
        <td>${patient.contact_number || '-'}</td>
        <td>
          <a href="#" class="action-link view" data-action="view" data-id="${patient.id}">查看</a>
          <a href="#" class="action-link edit" data-action="edit" data-id="${patient.id}">编辑</a>
          <a href="#" class="action-link" data-action="view-records" data-id="${patient.id}">病历</a>
          <a href="#" class="action-link delete" data-action="delete" data-id="${patient.id}" data-name="${patient.name || ''}">删除</a>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // 渲染分页
    const paginationContainer = document.getElementById('patient-pagination-container');
    if (paginationContainer && totalPages > 1) {
      new Pagination({
        containerId: 'patient-pagination-container',
        currentPage: page,
        totalPages: totalPages,
        onPageChange: (newPage) => loadAndDisplayPatients(newPage, query)
      }).render();
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
  } catch (error) {
    console.error('加载患者数据失败', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">加载失败: ${error.message}</td></tr>`;
  }
}

/**
 * 显示添加患者模态框
 */
function showAddPatientModal() {
  const form = document.createElement('form');
  form.id = 'patient-form';
  form.innerHTML = `
    <div class="form-group">
      <label for="patient-name">姓名</label>
      <input type="text" id="patient-name" required>
    </div>
    <div class="form-group">
      <label for="patient-gender">性别</label>
      <select id="patient-gender">
        <option value="male">男</option>
        <option value="female">女</option>
        <option value="other">其他</option>
      </select>
    </div>
    <div class="form-group">
      <label for="patient-birth-date">出生日期</label>
      <input type="date" id="patient-birth-date">
    </div>
    <div class="form-group">
      <label for="patient-contact-number">联系电话</label>
      <input type="tel" id="patient-contact-number">
    </div>
    <div class="form-group">
      <label for="patient-address">住址</label>
      <textarea id="patient-address" rows="2"></textarea>
    </div>
  `;

  const modal = new Modal({
    title: '添加新患者',
    content: form,
    onConfirm: () => handlePatientFormSubmit(false)
  }).render();
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
        <label for="patient-name">姓名</label>
        <input type="text" id="patient-name" value="${patient.name || ''}" required>
      </div>
      <div class="form-group">
        <label for="patient-gender">性别</label>
        <select id="patient-gender">
          <option value="male" ${patient.gender === 'male' ? 'selected' : ''}>男</option>
          <option value="female" ${patient.gender === 'female' ? 'selected' : ''}>女</option>
          <option value="other" ${patient.gender === 'other' ? 'selected' : ''}>其他</option>
        </select>
      </div>
      <div class="form-group">
        <label for="patient-birth-date">出生日期</label>
        <input type="date" id="patient-birth-date" value="${patient.birth_date || ''}">
      </div>
      <div class="form-group">
        <label for="patient-contact-number">联系电话</label>
        <input type="tel" id="patient-contact-number" value="${patient.contact_number || ''}">
      </div>
      <div class="form-group">
        <label for="patient-address">住址</label>
        <textarea id="patient-address" rows="2">${patient.address || ''}</textarea>
      </div>
    `;

    const modal = new Modal({
      title: '编辑患者信息',
      content: form,
      onConfirm: () => handlePatientFormSubmit(true)
    }).render();
    
  } catch (error) {
    showNotification('错误', `获取患者信息失败: ${error.message}`, 'error');
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
    showNotification('错误', '患者姓名不能为空', 'error');
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
      showNotification('成功', '患者信息已更新', 'success');
    } else {
      await apiClient.patients.create(patientData);
      showNotification('成功', '新患者已添加', 'success');
    }
    
    // 触发更新事件
    window.eventBus.emit('patient:updated');
    
    return true; // 允许模态框关闭
  } catch (error) {
    showNotification('错误', `保存失败: ${error.message}`, 'error');
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
      showNotification('成功', '患者记录已删除', 'success');
      window.eventBus.emit('patient:updated');
    } catch (error) {
      showNotification('错误', `删除失败: ${error.message}`, 'error');
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
    content.className = 'patient-detail';
    content.innerHTML = `
      <div class="patient-info">
        <div class="info-row">
          <div class="info-label">姓名:</div>
          <div class="info-value">${patient.name || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">性别:</div>
          <div class="info-value">${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '其他'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">出生日期:</div>
          <div class="info-value">${patient.birth_date ? formatDate(patient.birth_date) : '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">联系电话:</div>
          <div class="info-value">${patient.contact_number || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">住址:</div>
          <div class="info-value">${patient.address || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">创建时间:</div>
          <div class="info-value">${patient.created_at ? formatDateTime(patient.created_at) : '-'}</div>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '患者详情',
      content: content,
      showFooter: false,
    }).render();
    
  } catch (error) {
    showNotification('错误', `获取患者信息失败: ${error.message}`, 'error');
  }
}