import { showLoading, confirmDialog, createModal, confirmModal } from '../utils/ui.js';
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
                    </div>
                    <div class="header-actions">
                        <button id="add-medicine-btn" class="btn btn-primary" data-i18n="add_new_medicine">添加新药品</button>
                        <button id="bulk-stock-btn" class="btn btn-secondary" data-i18n="bulk_stock">批量入库</button>
                        <button id="low-stock-btn" class="btn btn-secondary" data-i18n="low_stock">低库存提醒</button>
                    </div>
                </div>
                <div class="data-table-container">
                    <div class="card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-i18n="medicine_name">药品名称</th>
                                    <th data-i18n="specification">规格</th>
                                    <th data-i18n="unit">单位</th>
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

  // 绑定批量入库按钮事件
  const bulkStockBtn = document.getElementById('bulk-stock-btn');
  if (bulkStockBtn) {
    bulkStockBtn.addEventListener('click', () => showBulkStockModal(), { signal });
  }

  // 绑定低库存提醒按钮事件
  const lowStockBtn = document.getElementById('low-stock-btn');
  if (lowStockBtn) {
    lowStockBtn.addEventListener('click', () => showLowStockModal(), { signal });
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
 * 获取单位对应的翻译键
 * @param {string} unit - 单位
 * @returns {string} 翻译键后缀
 */
function getUnitKey(unit) {
  const unitMap = {
    '盒': 'box',
    '瓶': 'bottle', 
    '片': 'tablet',
    '支': 'tube',
    '袋': 'bag'
  };
  return unitMap[unit] || 'box';
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
      <td>${med.specification || (window.getTranslation ? window.getTranslation('not_available') : 'N/A')}</td>
      <td>${med.unit ? (window.getTranslation ? window.getTranslation(`unit_${getUnitKey(med.unit)}`) || med.unit : med.unit) : (window.getTranslation ? window.getTranslation('not_available') : 'N/A')}</td>
      <td>${med.manufacturer || (window.getTranslation ? window.getTranslation('not_available') : 'N/A')}</td>
      <td>${med.stock}${med.unit ? (window.getTranslation ? window.getTranslation(`unit_${getUnitKey(med.unit)}`) || med.unit : med.unit) : ''}</td>
      <td>
        <a href="#" class="action-link edit" data-id="${med.id}" data-action="edit" data-i18n="edit">编辑</a>
        <a href="#" class="action-link stock" data-id="${med.id}" data-action="add-stock" data-i18n="add_stock">入库</a>
        <a href="#" class="action-link history" data-id="${med.id}" data-action="stock-history" data-i18n="stock_history">库存历史</a>
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
    case 'add-stock':
      showAddStockModal(id);
      break;
    case 'stock-history':
      showStockHistoryModal(id);
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
      <label for="medicine-unit" data-i18n="unit">单位 *</label>
      <select id="medicine-unit" required>
        <option value="" ${!medicine?.unit ? 'selected' : ''} data-i18n="select_unit">请选择单位</option>
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

  // 创建模态框
  const modalInstance = createModal(title, form, {
    size: 'lg',
    footerButtons: [
      { text: '取消', class: 'btn-secondary', action: 'cancel' },
      { text: isEdit ? '更新' : '添加', class: 'btn-primary', action: 'submit' }
    ],
    onButtonClick: async (action, modal) => {
      if (action === 'submit') {
        const success = await handleMedicineFormSubmit(isEdit, medicine);
        if (success) {
          modalInstance.hide();
        }
      } else if (action === 'cancel') {
        modalInstance.hide();
      }
    }
  });

  // 显示模态框
  modalInstance.show();

  // 翻译模态框内容
  if (window.translatePage) {
    window.translatePage();
  }
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
  
  if (!unitSelect.value) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      window.getTranslation ? window.getTranslation('unit_required') : '请选择药品单位',
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
  const confirmed = await confirmModal(
    window.getTranslation ? window.getTranslation('confirm_delete') : '确认删除',
    window.getTranslation ? window.getTranslation('confirm_delete_medicine') : '确定要删除这个药品吗？此操作不可恢复。', {
    confirmText: window.getTranslation ? window.getTranslation('delete') : '删除',
    confirmClass: 'btn-danger',
    cancelText: window.getTranslation ? window.getTranslation('cancel') : '取消'
  });
  
  if (confirmed) {
    try {
      await apiClient.medicines.delete(id);
      window.showNotification(window.getTranslation ? window.getTranslation('medicine_deleted') : '药品已删除', 'success');
      window.eventBus.emit('medicine:updated');
    } catch (error) {
      window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('delete_failed') : '删除失败'}: ${error.message}`,
      'error'
    );
    }
  }
}

/**
 * 显示入库模态框
 */
async function showAddStockModal(medicineId) {
  try {
    // 获取药品信息
    const medicine = await apiClient.medicines.getById(medicineId);
    
    const form = document.createElement('form');
    form.id = 'add-stock-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="stock-medicine-name" data-i18n="medicine_name">药品名称</label>
        <input type="text" id="stock-medicine-name" value="${medicine.name}" readonly class="form-control-plaintext">
      </div>
      <div class="form-group">
        <label for="stock-current" data-i18n="current_stock">当前库存</label>
        <input type="text" id="stock-current" value="${medicine.stock}${medicine.unit ? (window.getTranslation ? window.getTranslation(`unit_${getUnitKey(medicine.unit)}`) || medicine.unit : medicine.unit) : ''}" readonly class="form-control-plaintext">
      </div>
      <div class="form-group">
        <label for="stock-quantity" data-i18n="add_quantity">入库数量</label>
        <input type="number" id="stock-quantity" min="1" step="1" required class="form-control">
      </div>
      <div class="form-group">
        <label for="stock-notes" data-i18n="notes">备注</label>
        <textarea id="stock-notes" rows="3" class="form-control" data-i18n-placeholder="stock_notes_placeholder" placeholder="入库原因、供应商等信息"></textarea>
      </div>
      <input type="hidden" id="stock-medicine-id" value="${medicineId}">
    `;

    // 创建模态框
    const modalInstance = createModal(
      window.getTranslation ? window.getTranslation('add_stock') : '药品入库',
      form,
      {
        size: 'lg',
        footerButtons: [
          { text: window.getTranslation ? window.getTranslation('cancel') : '取消', class: 'btn-secondary', action: 'cancel' },
          { text: window.getTranslation ? window.getTranslation('confirm_stock_in') : '确认入库', class: 'btn-primary', action: 'submit' }
        ],
        onButtonClick: async (action, modal) => {
          if (action === 'submit') {
            const success = await handleAddStockSubmit();
            if (success) {
              modalInstance.hide();
            }
          } else if (action === 'cancel') {
            modalInstance.hide();
          }
        }
      }
    );

    // 显示模态框
    modalInstance.show();

    // 翻译模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
  } catch (error) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('get_medicine_failed') : '获取药品信息失败'}: ${error.message}`,
      'error'
    );
  }
}

/**
 * 处理入库表单提交
 */
async function handleAddStockSubmit() {
  const form = document.getElementById('add-stock-form');
  if (!form) return false;
  
  const medicineIdInput = document.getElementById('stock-medicine-id');
  const quantityInput = document.getElementById('stock-quantity');
  const notesInput = document.getElementById('stock-notes');
  
  if (!quantityInput.value || parseInt(quantityInput.value) <= 0) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      window.getTranslation ? window.getTranslation('valid_quantity_required') : '请输入有效的入库数量',
      'error'
    );
    return false;
  }
  
  const stockData = {
    drug_id: parseInt(medicineIdInput.value),
    quantity: parseInt(quantityInput.value),
    notes: notesInput.value.trim() || null
  };
  
  try {
    await apiClient.medicines.addStock(stockData);
    window.showNotification(
      window.getTranslation ? window.getTranslation('success') : '成功',
      window.getTranslation ? window.getTranslation('stock_added') : '入库成功',
      'success'
    );
    
    // 触发更新事件
    window.eventBus.emit('medicine:updated');
    
    return true; // 允许模态框关闭
  } catch (error) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('stock_in_failed') : '入库失败'}: ${error.message}`,
      'error'
    );
    return false; // 阻止模态框关闭
  }
}

/**
 * 调整库存数量的spinner按钮处理函数
 */
window.adjustStockQuantity = function(delta) {
  const input = document.getElementById('stock-quantity');
  const currentValue = parseInt(input.value) || 1;
  const newValue = Math.max(1, currentValue + delta); // 最小值为1
  input.value = newValue;
};

/**
 * 显示库存历史模态框
 */
async function showStockHistoryModal(medicineId) {
  try {
    // 获取药品信息和库存历史
    const [medicine, historyResponse] = await Promise.all([
      apiClient.medicines.getById(medicineId),
      apiClient.medicines.getStockHistory(medicineId, { page: 1, limit: 20 })
    ]);
    
    const history = Array.isArray(historyResponse) ? historyResponse : (historyResponse.items || []);
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="stock-history-header">
        <h6><span data-i18n="medicine_name">药品名称</span>: <span class="text-primary">${medicine.name}</span></h6>
        <p><span data-i18n="current_stock">当前库存</span>: <span class="badge bg-info">${medicine.stock} ${medicine.unit ? (window.getTranslation ? window.getTranslation(`unit_${getUnitKey(medicine.unit)}`) || medicine.unit : medicine.unit) : ''}</span></p>
      </div>
      <div class="stock-history-table">
        <table class="table table-striped">
          <thead>
            <tr>
              <th data-i18n="transaction_type">操作类型</th>
              <th data-i18n="quantity_change">数量变化</th>
              <th data-i18n="notes">备注</th>
              <th data-i18n="operation_time">操作时间</th>
            </tr>
          </thead>
          <tbody>
            ${history.length > 0 ? history.map(item => `
              <tr>
                <td>
                  <span class="badge ${
                    item.transaction_type === 'IN' || item.transaction_type === 'stock_in' ? 'bg-success' : 
                    item.transaction_type === 'OUT' || item.transaction_type === 'stock_out' ? 'bg-warning' : 'bg-secondary'
                  }">
                    ${getTransactionTypeText(item.transaction_type)}
                  </span>
                </td>
                <td class="${
                  item.quantity_change > 0 ? 'text-success' : 'text-danger'
                }">
                  ${item.quantity_change > 0 ? '+' : ''}${item.quantity_change}
                </td>
                <td>${item.notes || '-'}</td>
                <td>${new Date(item.transaction_time).toLocaleString()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="4" class="text-center text-muted" data-i18n="no_stock_history">暂无库存变动记录</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

    // 创建模态框
    const modalInstance = createModal(
      `${window.getTranslation ? window.getTranslation('stock_history') : '库存历史'} - ${medicine.name}`,
      content,
      {
        size: 'xl',
        footerButtons: [
          { text: '关闭', class: 'btn-secondary', action: 'close' }
        ]
      }
    );

    // 显示模态框
    modalInstance.show();

    // 翻译模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
  } catch (error) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('get_stock_history_failed') : '获取库存历史失败'}: ${error.message}`,
      'error'
    );
  }
}

/**
 * 显示批量入库模态框
 */
async function showBulkStockModal() {
  // 移除现有模态框
  const existingModal = document.getElementById('bulk-stock-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modalHtml = `
    <div class="modal fade" id="bulk-stock-modal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" data-i18n="bulk_stock">批量入库</h5>
            <button type="button" class="btn-close" onclick="closeBulkStockModal()"></button>
          </div>
          <div class="modal-body">
            <form id="bulk-stock-form">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 data-i18n="stock_details">入库明细</h6>
                  <button type="button" id="add-stock-item-btn" class="btn btn-sm btn-outline-primary" data-i18n="add_medicine">添加药品</button>
                </div>
                <div id="stock-items-container">
                  <!-- 入库明细将通过添加按钮动态生成 -->
                </div>
              </div>
              
              <div class="form-group">
                <label for="bulk-notes" data-i18n="notes">备注</label>
                <textarea id="bulk-notes" class="form-control" rows="3" data-i18n-placeholder="bulk_stock_notes_placeholder" placeholder="批量入库备注信息..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeBulkStockModal()" data-i18n="cancel">取消</button>
            <button type="button" class="btn btn-primary" onclick="saveBulkStock()" data-i18n="save">保存</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  const modal = document.getElementById('bulk-stock-modal');
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
  
  await initBulkStockModal();
}

/**
 * 初始化批量入库模态框
 */
async function initBulkStockModal() {
  try {
    // 绑定添加明细按钮
    document.getElementById('add-stock-item-btn').addEventListener('click', addStockItem);
    
    // 初始化时添加一个入库明细项
    await addStockItem();
    
  } catch (error) {
    console.error('初始化批量入库模态框失败:', error);
    window.showNotification(`${window.getTranslation ? window.getTranslation('init_bulk_stock_failed') : '初始化批量入库表单失败'}: ${error.message}`, 'error');
  }
}

/**
 * 添加入库明细项
 */
async function addStockItem() {
  const container = document.getElementById('stock-items-container');
  
  // 创建入库明细项容器
  const stockItem = document.createElement('div');
  stockItem.className = 'stock-item';
  
  // 第一行：药品选择、数量、进价、删除按钮
  const firstRow = document.createElement('div');
  firstRow.className = 'form-row';
  
  // 药品选择组
  const drugGroup = document.createElement('div');
  drugGroup.className = 'form-group drug-group';
  const drugLabel = document.createElement('label');
  drugLabel.textContent = window.getTranslation ? window.getTranslation('medicine_name') : '药品';
  const drugSelect = document.createElement('select');
  drugSelect.className = 'drug-select form-control';
  drugSelect.required = true;
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = window.getTranslation ? window.getTranslation('select_medicine') : '请选择药品';
  drugSelect.appendChild(defaultOption);
  drugGroup.appendChild(drugLabel);
  drugGroup.appendChild(drugSelect);
  
  // 数量组
  const quantityGroup = document.createElement('div');
  quantityGroup.className = 'form-group quantity-group';
  const quantityLabel = document.createElement('label');
  quantityLabel.textContent = window.getTranslation ? window.getTranslation('quantity') : '数量';
  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.className = 'quantity-input form-control';
  quantityInput.min = '1';
  quantityInput.value = '1';
  quantityInput.placeholder = window.getTranslation ? window.getTranslation('quantity') : '数量';
  quantityInput.required = true;
  quantityGroup.appendChild(quantityLabel);
  quantityGroup.appendChild(quantityInput);
  
  // 进价组
  const costPriceGroup = document.createElement('div');
  costPriceGroup.className = 'form-group cost-price-group';
  const costPriceLabel = document.createElement('label');
  costPriceLabel.textContent = window.getTranslation ? window.getTranslation('cost_price') : '进价';
  const costPriceInput = document.createElement('input');
  costPriceInput.type = 'number';
  costPriceInput.className = 'cost-price-input form-control';
  costPriceInput.min = '0';
  costPriceInput.step = '0.01';
  costPriceInput.placeholder = window.getTranslation ? window.getTranslation('cost_price_optional') : '进价（可选）';
  costPriceGroup.appendChild(costPriceLabel);
  costPriceGroup.appendChild(costPriceInput);
  
  // 删除按钮组
  const deleteGroup = document.createElement('div');
  deleteGroup.className = 'form-group';
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-sm btn-danger remove-stock-item-btn';
  deleteBtn.textContent = window.getTranslation ? window.getTranslation('delete') : '删除';
  deleteGroup.appendChild(deleteBtn);
  
  firstRow.appendChild(drugGroup);
  firstRow.appendChild(quantityGroup);
  firstRow.appendChild(costPriceGroup);
  firstRow.appendChild(deleteGroup);
  
  // 第二行：备注
  const secondRow = document.createElement('div');
  secondRow.className = 'form-row';
  
  // 备注组
  const notesGroup = document.createElement('div');
  notesGroup.className = 'form-group notes-group';
  const notesLabel = document.createElement('label');
  notesLabel.textContent = window.getTranslation ? window.getTranslation('notes') : '备注';
  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.className = 'notes-input form-control';
  notesInput.placeholder = window.getTranslation ? window.getTranslation('medicine_stock_notes_optional') : '该药品入库备注（可选）';
  notesGroup.appendChild(notesLabel);
  notesGroup.appendChild(notesInput);
  
  secondRow.appendChild(notesGroup);
  
  // 组装完整的明细项
  stockItem.appendChild(firstRow);
  stockItem.appendChild(secondRow);
  
  // 添加到容器
  container.appendChild(stockItem);
  
  // 为新添加的药品选择框填充选项
  try {
    const medicinesResponse = await apiClient.medicines.getAll();
    const medicines = Array.isArray(medicinesResponse) ? medicinesResponse : medicinesResponse.items || [];
    
    const newSelect = container.lastElementChild.querySelector('.drug-select');
    medicines.forEach(medicine => {
      const option = document.createElement('option');
      option.value = medicine.id;
      option.textContent = `${medicine.name} (${medicine.specification || ''})`;
      newSelect.appendChild(option);
    });
  } catch (error) {
    console.error('加载药品数据失败:', error);
  }
  
  bindRemoveStockItemButtons();
}

/**
 * 绑定删除入库明细按钮
 */
function bindRemoveStockItemButtons() {
  const removeButtons = document.querySelectorAll('.remove-stock-item-btn');
  removeButtons.forEach(button => {
    button.onclick = function() {
      const stockItem = this.closest('.stock-item');
      const container = document.getElementById('stock-items-container');
      
      // 至少保留一个明细项
      if (container.children.length > 1) {
        stockItem.remove();
      } else {
        if (window.showModalNotification) {
          window.showModalNotification(window.getTranslation ? window.getTranslation('keep_at_least_one_item') : '至少需要保留一个入库明细项', 'warning');
        } else {
          window.showNotification(window.getTranslation ? window.getTranslation('keep_at_least_one_item') : '至少需要保留一个入库明细项', 'warning');
        }
      }
    };
  });
}

/**
 * 关闭批量入库模态框
 */
function closeBulkStockModal() {
  const modal = document.getElementById('bulk-stock-modal');
  if (modal) {
    const bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
    // 延迟移除DOM元素
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * 保存批量入库
 */
async function saveBulkStock() {
  try {
    const stockItems = [];
    const stockItemElements = document.querySelectorAll('.stock-item');
    
    // 验证并收集所有入库明细
    for (const itemElement of stockItemElements) {
      const drugSelect = itemElement.querySelector('.drug-select');
      const quantityInput = itemElement.querySelector('.quantity-input');
      const costPriceInput = itemElement.querySelector('.cost-price-input');
      const notesInput = itemElement.querySelector('.notes-input');
      
      if (!drugSelect.value) {
        window.showNotification(window.getTranslation ? window.getTranslation('select_medicine') : '请选择药品', 'error');
        return;
      }
      
      if (!quantityInput.value || quantityInput.value <= 0) {
        window.showNotification(window.getTranslation ? window.getTranslation('valid_quantity_required') : '请输入有效的数量', 'error');
        return;
      }
      
      const stockItem = {
        drug_id: parseInt(drugSelect.value),
        quantity: parseInt(quantityInput.value)
      };
      
      if (costPriceInput.value) {
        stockItem.cost_price = parseFloat(costPriceInput.value);
      }
      
      if (notesInput.value.trim()) {
        stockItem.notes = notesInput.value.trim();
      }
      
      stockItems.push(stockItem);
    }
    
    if (stockItems.length === 0) {
      window.showNotification(window.getTranslation ? window.getTranslation('add_at_least_one_item') : '请至少添加一个入库明细', 'error');
      return;
    }
    
    const bulkNotes = document.getElementById('bulk-notes').value.trim();
    const bulkStockData = {
      items: stockItems
    };
    
    if (bulkNotes) {
      bulkStockData.notes = bulkNotes;
    }
    
    // 调用API进行批量入库
    await apiClient.medicines.bulkAddStock(bulkStockData);
    
    window.showNotification(
      window.getTranslation ? window.getTranslation('success') : '成功',
      `${window.getTranslation ? window.getTranslation('bulk_stock_success') : '批量入库成功'}，${window.getTranslation ? window.getTranslation('total_items') : '共入库'} ${stockItems.length} ${window.getTranslation ? window.getTranslation('medicines') : '种药品'}`,
      'success'
    );
    
    closeBulkStockModal();
    
    // 刷新药品列表
    if (typeof loadMedicines === 'function') {
      await loadMedicines();
    }
    
  } catch (error) {
    console.error('批量入库失败:', error);
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('bulk_stock_failed') : '批量入库失败'}: ${error.message}`,
      'error'
    );
  }
}

// 将函数暴露到全局作用域
window.closeBulkStockModal = closeBulkStockModal;
window.saveBulkStock = saveBulkStock;

/**
 * 显示低库存提醒模态框
 */
async function showLowStockModal() {
  try {
    const lowStockMedicines = await apiClient.getLowStockMedicines();
    
    if (lowStockMedicines.length === 0) {
      window.showNotification(
        window.getTranslation ? window.getTranslation('info') : '信息',
        window.getTranslation ? window.getTranslation('no_low_stock_medicines') : '当前没有低库存药品',
        'info'
      );
      return;
    }

    const modalHtml = `
      <div class="modal fade" id="lowStockModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-i18n="low_stock_alert">低库存提醒</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th data-i18n="medicine_name">药品名称</th>
                      <th data-i18n="specification">规格</th>
                      <th data-i18n="manufacturer">生产厂家</th>
                      <th data-i18n="current_stock">当前库存</th>
                      <th data-i18n="actions">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowStockMedicines.map(med => `
                      <tr>
                        <td>${med.name}</td>
                        <td>${med.specification || (window.getTranslation ? window.getTranslation('not_available') : 'N/A')}</td>
        <td>${med.manufacturer || (window.getTranslation ? window.getTranslation('not_available') : 'N/A')}</td>
                        <td class="text-danger fw-bold">${med.stock}${med.unit ? (window.getTranslation ? window.getTranslation(`unit_${getUnitKey(med.unit)}`) || med.unit : med.unit) : ''}</td>
                        <td>
                          <button class="btn btn-sm btn-primary" onclick="showAddStockModal(${med.id})" data-i18n="add_stock">入库</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="close">关闭</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除已存在的模态框
    const existingModal = document.getElementById('lowStockModal');
    if (existingModal) {
      existingModal.remove();
    }

    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 创建并显示模态框
    const modalElement = document.getElementById('lowStockModal');
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    // 翻译模态框内容
    if (window.translatePage) {
      window.translatePage();
    }
  } catch (error) {
    window.showNotification(
      window.getTranslation ? window.getTranslation('error') : '错误',
      `${window.getTranslation ? window.getTranslation('get_low_stock_failed') : '获取低库存药品失败'}: ${error.message}`,
      'error'
    );
  }
}

/**
 * 获取交易类型的显示文本
 */
function getTransactionTypeText(type) {
  const typeMap = {
    'IN': window.getTranslation ? window.getTranslation('stock_in') : '入库',
    'OUT': window.getTranslation ? window.getTranslation('stock_out') : '出库',
    'ADJUSTMENT': window.getTranslation ? window.getTranslation('adjustment') : '调整',
    'stock_in': window.getTranslation ? window.getTranslation('stock_in') : '入库',
    'stock_out': window.getTranslation ? window.getTranslation('stock_out') : '出库',
    'adjustment': window.getTranslation ? window.getTranslation('adjustment') : '调整'
  };
  return typeMap[type] || type;
}