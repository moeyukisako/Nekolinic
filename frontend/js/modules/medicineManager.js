import { showLoading, showNotification, confirmDialog } from '../utils/ui.js';
import Modal from '../components/modal.js';
import Pagination from '../components/pagination.js';
import SearchBar from '../components/searchBar.js';

/**
 * 药品管理模块
 * @param {HTMLElement} container - 内容容器
 * @param {Object} options - 选项对象
 * @param {AbortSignal} options.signal - AbortController信号用于清理
 * @returns {Function} 清理函数
 */
export default async function render(container, { signal }) {
  // 渲染模块基本结构
  container.innerHTML = `
    <div class="medicine-module">
      <div class="content-header">
        <h2>药品管理</h2>
        <button id="add-medicine-btn" class="btn btn-primary">添加新药品</button>
      </div>
      <div id="search-container"></div>
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
      <div id="pagination-container"></div>
    </div>
  `;

  // 初始化搜索组件
  const searchBar = new SearchBar({
    containerId: 'search-container',
    placeholder: '按药品名称、厂家搜索...',
    onSearch: (query) => loadMedicines(query)
  }).render();

  // 初始化加载数据
  await loadMedicines();

  // 绑定事件
  const addBtn = document.getElementById('add-medicine-btn');
  if (addBtn) {
    addBtn.addEventListener('click', showMedicineFormModal, { signal });
  }

  // 绑定表格事件
  const tableBody = document.getElementById('medicine-table-body');
  if (tableBody) {
    tableBody.addEventListener('click', handleTableAction, { signal });
  }

  // 订阅事件
  const unsubscribe = window.eventBus.on('medicine:updated', () => {
    loadMedicines();
  });

  // 模块清理函数
  return function cleanup() {
    // 取消事件订阅
    unsubscribe();
    console.log('Medicine module cleaned up');
  };
}

/**
 * 加载药品列表
 */
async function loadMedicines(searchTerm = '', page = 1) {
  const tableBody = document.getElementById('medicine-table-body');
  if (!tableBody) return;

  // 显示加载状态
  showLoading(tableBody, 5);

  try {
    // 获取药品数据
    const response = await apiClient.medicines.getAll(page, 10, searchTerm);
    const medicines = response.items || [];
    
    if (medicines.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">未找到相关药品信息</td></tr>';
      return;
    }

    // 渲染数据
    renderMedicineTable(medicines, tableBody);
    
    // 渲染分页
    if (response.total_pages > 1) {
      new Pagination({
        containerId: 'pagination-container',
        currentPage: page,
        totalPages: response.total_pages,
        onPageChange: (newPage) => loadMedicines(searchTerm, newPage)
      }).render();
    }
  } catch (error) {
    console.error('加载药品列表失败:', error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center">加载失败: ${error.message}</td></tr>`;
  }
}

/**
 * 渲染药品表格
 */
function renderMedicineTable(medicines, tableBody) {
  tableBody.innerHTML = '';
  
  medicines.forEach(med => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${med.name}</td>
      <td>${med.specification || 'N/A'}</td>
      <td>${med.manufacturer || 'N/A'}</td>
      <td>${med.stock}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-edit" data-id="${med.id}" data-action="edit">编辑</button>
        <button class="btn btn-sm btn-danger" data-id="${med.id}" data-action="delete">删除</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * 处理表格操作事件
 */
function handleTableAction(e) {
  const target = e.target;
  if (!target.dataset.action) return;
  
  const id = target.dataset.id;
  const action = target.dataset.action;
  
  switch (action) {
    case 'edit':
      editMedicine(id);
      break;
    case 'delete':
      deleteMedicine(id);
      break;
  }
}

/**
 * 显示添加药品模态框
 */
function showMedicineFormModal(medicine = null) {
  const isEdit = !!medicine;
  const title = isEdit ? '编辑药品' : '添加新药品';
  
  const form = document.createElement('form');
  form.id = 'medicine-form';
  form.innerHTML = `
    <div class="form-group">
      <label for="medicine-name">药品名称</label>
      <input type="text" id="medicine-name" value="${medicine?.name || ''}" required>
    </div>
    <div class="form-group">
      <label for="medicine-specification">规格</label>
      <input type="text" id="medicine-specification" value="${medicine?.specification || ''}">
    </div>
    <div class="form-group">
      <label for="medicine-manufacturer">生产厂家</label>
      <input type="text" id="medicine-manufacturer" value="${medicine?.manufacturer || ''}">
    </div>
    <div class="form-group">
      <label for="medicine-stock">库存</label>
      <input type="number" id="medicine-stock" value="${medicine?.stock || 0}" required>
    </div>
    ${isEdit ? `<input type="hidden" id="medicine-id" value="${medicine.id}">` : ''}
  `;

  const modal = new Modal({
    title: title,
    content: form,
    onConfirm: () => handleMedicineFormSubmit(isEdit)
  }).render();
}

/**
 * 处理药品表单提交
 */
async function handleMedicineFormSubmit(isEdit) {
  const form = document.getElementById('medicine-form');
  if (!form) return;
  
  const nameInput = document.getElementById('medicine-name');
  const specInput = document.getElementById('medicine-specification');
  const manufInput = document.getElementById('medicine-manufacturer');
  const stockInput = document.getElementById('medicine-stock');
  const idInput = document.getElementById('medicine-id');
  
  if (!nameInput.value.trim()) {
    showNotification('错误', '药品名称不能为空', 'error');
    return;
  }
  
  const medicineData = {
    name: nameInput.value.trim(),
    specification: specInput.value.trim(),
    manufacturer: manufInput.value.trim(),
    stock: parseInt(stockInput.value) || 0
  };
  
  try {
    if (isEdit && idInput) {
      await apiClient.medicines.update(idInput.value, medicineData);
      showNotification('成功', '药品信息已更新', 'success');
    } else {
      await apiClient.medicines.create(medicineData);
      showNotification('成功', '药品已添加', 'success');
    }
    
    // 触发更新事件
    window.eventBus.emit('medicine:updated');
    
    return true; // 允许模态框关闭
  } catch (error) {
    showNotification('错误', `操作失败: ${error.message}`, 'error');
    return false; // 阻止模态框关闭
  }
}

/**
 * 编辑药品
 */
async function editMedicine(id) {
  try {
    const medicine = await apiClient.medicines.getById(id);
    showMedicineFormModal(medicine);
  } catch (error) {
    showNotification('错误', `获取药品信息失败: ${error.message}`, 'error');
  }
}

/**
 * 删除药品
 */
async function deleteMedicine(id) {
  const confirmed = await confirmDialog('确认删除', '确定要删除这个药品吗？此操作不可恢复。');
  
  if (confirmed) {
    try {
      await apiClient.medicines.delete(id);
      showNotification('成功', '药品已删除', 'success');
      window.eventBus.emit('medicine:updated');
    } catch (error) {
      showNotification('错误', `删除失败: ${error.message}`, 'error');
    }
  }
} 