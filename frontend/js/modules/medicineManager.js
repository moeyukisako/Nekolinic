import { showLoading, confirmDialog } from '../utils/ui.js';
import apiClient from '../apiClient.js';
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
    container.innerHTML = `
        <div class="medicine-module-wrapper">
            <div id="medicine-module-content">
                <div class="table-header-controls">
                    <div class="search-input-group">
                        <input type="text" id="medicine-search-input" data-i18n-placeholder="search_medicine_placeholder" placeholder="按药品名称、厂家搜索...">
                        <button id="add-medicine-btn" class="search-addon-btn" data-i18n="add_new_medicine">添加新药品</button>
                    </div>
                </div>
                <div class="data-table-container">
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-i18n="medicine_name">药品名称</th>
                                    <th data-i18n="specification">规格</th>
                                    <th data-i18n="manufacturer">生产厂家</th>
                                    <th data-i18n="current_stock">当前库存</th>
                                    <th class="actions-column" data-i18n="actions">操作</th>
                                </tr>
                            </thead>
                            <tbody id="medicine-table-body"></tbody>
                        </table>
                        <div id="pagination-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
  
  // 初始化加载数据
  await loadMedicines();

  // 绑定搜索输入框事件
  const searchInput = document.getElementById('medicine-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      loadMedicines(query);
    }, { signal });
  }

  // 绑定事件
  const addBtn = document.getElementById('add-medicine-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showMedicineFormModal(), { signal });
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
    const response = await apiClient.medicines.getAll({ page, limit: 10, search: searchTerm });
    const medicines = response.items || [];
    
    if (medicines.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center" data-i18n="no_medicine_found">未找到相关药品信息</td></tr>`;
      if (window.translatePage) {
        window.translatePage();
      }
      return;
    }

    // 渲染数据
    renderMedicineTable(medicines, tableBody);
    
    // 渲染分页
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
      if (response.total_pages > 1) {
        new Pagination({
          containerId: 'pagination-container',
          currentPage: page,
          totalPages: response.total_pages,
          onPageChange: (newPage) => loadMedicines(searchTerm, newPage)
        }).render();
      } else {
        paginationContainer.innerHTML = '';
      }
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
      <td>
        <a href="#" class="action-link edit" data-id="${med.id}" data-action="edit" data-i18n="edit">编辑</a>
        <a href="#" class="action-link delete" data-id="${med.id}" data-action="delete" data-i18n="delete">删除</a>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  // 翻译新添加的内容
  if (window.translatePage) {
    window.translatePage();
  }
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
  const title = isEdit ? (window.getTranslation ? window.getTranslation('edit_medicine') : '编辑药品') : (window.getTranslation ? window.getTranslation('add_new_medicine') : '添加新药品');
  
  const form = document.createElement('form');
  form.id = 'medicine-form';
  form.innerHTML = `
    <div class="form-group">
      <label for="medicine-name" data-i18n="medicine_name">药品名称</label>
      <input type="text" id="medicine-name" value="${medicine?.name || ''}" required>
    </div>
    <div class="form-group">
      <label for="medicine-code" data-i18n="medicine_code">药品代码</label>
      <input type="text" id="medicine-code" value="${medicine?.code || ''}" data-i18n-placeholder="auto_generate_placeholder" placeholder="留空自动生成">
    </div>
    <div class="form-group">
      <label for="medicine-specification" data-i18n="specification">规格</label>
      <input type="text" id="medicine-specification" value="${medicine?.specification || ''}">
    </div>
    <div class="form-group">
      <label for="medicine-manufacturer" data-i18n="manufacturer">生产厂家</label>
      <input type="text" id="medicine-manufacturer" value="${medicine?.manufacturer || ''}">
    </div>
    <div class="form-group">
      <label for="medicine-unit" data-i18n="unit">单位</label>
      <select id="medicine-unit">
        <option value="盒" ${medicine?.unit === '盒' ? 'selected' : ''} data-i18n="unit_box">盒</option>
        <option value="瓶" ${medicine?.unit === '瓶' ? 'selected' : ''} data-i18n="unit_bottle">瓶</option>
        <option value="片" ${medicine?.unit === '片' ? 'selected' : ''} data-i18n="unit_tablet">片</option>
        <option value="支" ${medicine?.unit === '支' ? 'selected' : ''} data-i18n="unit_tube">支</option>
        <option value="袋" ${medicine?.unit === '袋' ? 'selected' : ''} data-i18n="unit_bag">袋</option>
      </select>
    </div>
    <div class="form-group">
      <label for="medicine-unit-price" data-i18n="unit_price">单价（元）</label>
      <input type="number" id="medicine-unit-price" step="0.01" value="${medicine?.unit_price || 0}" required>
    </div>
    <div class="form-group">
      <label for="medicine-cost-price" data-i18n="cost_price">成本价（元）</label>
      <input type="number" id="medicine-cost-price" step="0.01" value="${medicine?.cost_price || 0}">
    </div>
    ${isEdit ? `<input type="hidden" id="medicine-id" value="${medicine?.id || ''}">` : ''}
  `;

  showNotification(isEdit ? '编辑药品' : '添加药品', '请在药品管理界面直接操作', 'info');
  // 可以在这里添加直接在页面中显示表单的逻辑
}

/**
 * 处理药品表单提交
 */
async function handleMedicineFormSubmit(isEdit, medicine = null) {
  const form = document.getElementById('medicine-form');
  if (!form) return false;
  
  const nameInput = document.getElementById('medicine-name');
  const codeInput = document.getElementById('medicine-code');
  const specInput = document.getElementById('medicine-specification');
  const manufInput = document.getElementById('medicine-manufacturer');
  const unitSelect = document.getElementById('medicine-unit');
  const unitPriceInput = document.getElementById('medicine-unit-price');
  const costPriceInput = document.getElementById('medicine-cost-price');
  const idInput = document.getElementById('medicine-id');
  
  if (!nameInput.value.trim()) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      window.getTranslation ? window.getTranslation('medicine_name_required') : '药品名称不能为空',
      'error'
    );
    return false;
  }
  
  if (!unitPriceInput.value || parseFloat(unitPriceInput.value) < 0) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      window.getTranslation ? window.getTranslation('valid_unit_price_required') : '请输入有效的单价',
      'error'
    );
    return false;
  }
  
  const medicineData = {
    name: nameInput.value.trim(),
    code: codeInput.value.trim() || nameInput.value.trim().replace(/\s+/g, '_').toUpperCase(),
    description: null,
    specification: specInput.value.trim() || null,
    manufacturer: manufInput.value.trim() || null,
    unit: unitSelect.value,
    unit_price: parseFloat(unitPriceInput.value),
    cost_price: parseFloat(costPriceInput.value) || null
  };
  
  try {
    if (isEdit) {
      // 编辑模式：更新现有药品
      const medicineId = medicine?.id || (idInput ? idInput.value : null);
      if (!medicineId || medicineId === '' || medicineId === 'undefined') {
        throw new Error('无法获取有效的药品ID，请重新打开编辑窗口');
      }
      await apiClient.medicines.update(medicineId, medicineData);
      window.showNotification(
        window.getTranslation ? window.getTranslation('success') : '成功',
        window.getTranslation ? window.getTranslation('medicine_updated') : '药品信息已更新',
        'success'
      );
    } else {
      // 添加模式：创建新药品
      await apiClient.medicines.create(medicineData);
      window.showNotification(
        window.getTranslation ? window.getTranslation('success') : '成功',
        window.getTranslation ? window.getTranslation('medicine_added') : '药品已添加',
        'success'
      );
    }
    
    // 触发更新事件
    window.eventBus.emit('medicine:updated');
    
    return true; // 允许模态框关闭
  } catch (error) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('operation_failed') : '操作失败'}: ${error.message}`,
      'error'
    );
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
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('get_medicine_failed') : '获取药品信息失败'}: ${error.message}`,
      'error'
    );
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
      window.showNotification('成功', '药品已删除', 'success');
      window.eventBus.emit('medicine:updated');
    } catch (error) {
      window.showNotification('错误', `删除失败: ${error.message}`, 'error');
    }
  }
}