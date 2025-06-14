// frontend/js/modules/settingsManager.js

import apiClient from '../apiClient.js';
import { confirmModal } from '../utils/ui.js';
console.log('✅ settingsManager.js: 模块已成功解析，apiClient 已导入。');

/**
 * 设置管理模块
 */
export default function renderSettingsModule(container, options = {}) {
  console.log('🚀 settingsManager.js: renderSettingsModule 函数开始执行。');
  const { signal } = options;
  
  // 创建设置管理界面
  container.innerHTML = `
    <div class="settings-module-wrapper">
      <div id="settings-module-content">
        <div class="settings-sidebar">
          <div class="settings-nav">
            <a href="#general" class="settings-nav-item active" data-section="general">
              <i class="fas fa-cog"></i>
              <span data-i18n="settings_general">常规设置</span>
            </a>
            <a href="#appearance" class="settings-nav-item" data-section="appearance">
              <i class="fas fa-palette"></i>
              <span data-i18n="settings_appearance">外观设置</span>
            </a>
            <a href="#notifications" class="settings-nav-item" data-section="notifications">
              <i class="fas fa-bell"></i>
              <span data-i18n="settings_notifications">通知设置</span>
            </a>
            <a href="#security" class="settings-nav-item" data-section="security">
              <i class="fas fa-shield-alt"></i>
              <span data-i18n="settings_security">安全设置</span>
            </a>
            <a href="#backup" class="settings-nav-item" data-section="backup">
              <i class="fas fa-database"></i>
              <span data-i18n="settings_backup">备份设置</span>
            </a>
            <a href="#about" class="settings-nav-item" data-section="about">
              <i class="fas fa-info-circle"></i>
              <span data-i18n="settings_about">关于系统</span>
            </a>
          </div>
        </div>
        
        <div class="settings-main">
          <div class="settings-section active" id="general-section">
            <h2 data-i18n="settings_general">常规设置</h2>
            
            <div class="settings-group">
              <h3 data-i18n="language_settings">语言设置</h3>
              <div class="form-group">
                <label for="language-select" data-i18n="select_language">选择语言</label>
                <select id="language-select" class="form-control">
                  <option value="zh-CN" data-i18n="chinese">中文</option>
                  <option value="en-US" data-i18n="english">English</option>
                  <option value="ja-JP" data-i18n="japanese">日本語</option>
                </select>
              </div>
            </div>
            
            <div class="settings-group">
              <h3 data-i18n="system_preferences">系统偏好</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="auto-save" checked>
                  <span data-i18n="auto_save">自动保存</span>
                  <div class="switch"></div>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="show-tooltips" checked>
                  <span data-i18n="show_tooltips">显示提示</span>
                  <div class="switch"></div>
                </label>
              </div>
            </div>
            
            <div class="settings-group">
              <h3 data-i18n="system_actions">系统操作</h3>
              <div class="form-group">
                <button class="btn btn-secondary settings-reset-btn" data-i18n="reset_to_default">重置为默认</button>
                <p class="help-text" data-i18n="reset_help">将所有设置恢复为默认值</p>
              </div>
            </div>
          </div>
          
          <div class="settings-section" id="appearance-section">
            <h2 data-i18n="settings_appearance">外观设置</h2>
            
            <div class="settings-group">
              <h3 data-i18n="theme_settings">主题设置</h3>
              <div class="form-group">
                <label for="theme-select" data-i18n="select_theme">选择主题</label>
                <select id="theme-select" class="form-control">
                  <option value="light" data-i18n="light_theme">浅色主题</option>
                  <option value="dark" data-i18n="dark_theme">深色主题</option>
                  <option value="auto" data-i18n="auto_theme">跟随系统</option>
                </select>
              </div>
            </div>
            
         <div class="settings-group">
           <h3 data-i18n="background_settings">背景设置</h3>
              <div class="bg-preview-container">
                <div class="bg-preview" id="settings-bg-preview"></div>
              </div>
              <div class="form-group">
                <label data-i18n="local_image">本地图片</label>
                <div class="file-upload-container">
                  <label for="settings-bg-file-input" class="file-upload-btn">
                    <span data-i18n="choose_image_file">选择图片文件</span>
                    <input type="file" id="settings-bg-file-input" accept="image/*" style="display:none">
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label data-i18n="preset_backgrounds">预设背景</label>
                <div class="local-backgrounds" id="settings-local-backgrounds">
                  <div class="loading-backgrounds" data-i18n="loading">加载中...</div>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary btn-sm" id="settings-reset-bg-btn" data-i18n="reset_background">重置背景</button>
              </div>
            </div>
          </div>
          
          <div class="settings-section" id="notifications-section">
            <h2 data-i18n="settings_notifications">通知设置</h2>
            
            <div class="settings-group">
              <h3 data-i18n="notification_preferences">通知偏好</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="desktop-notifications" checked>
                  <span data-i18n="desktop_notifications">桌面通知</span>
                  <div class="switch"></div>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="sound-notifications" checked>
                  <span data-i18n="sound_notifications">声音通知</span>
                  <div class="switch"></div>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="email-notifications">
                  <span data-i18n="email_notifications">邮件通知</span>
                  <div class="switch"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div class="settings-section" id="security-section">
            <h2 data-i18n="settings_security">安全设置</h2>
            
            <div class="settings-group">
              <h3 data-i18n="password_settings">密码设置</h3>
              <div class="form-group">
                <label for="current-password" data-i18n="current_password">当前密码</label>
                <input type="password" id="current-password" class="form-control">
              </div>
              <div class="form-group">
                <label for="new-password" data-i18n="new_password">新密码</label>
                <input type="password" id="new-password" class="form-control">
              </div>
              <div class="form-group">
                <label for="confirm-password" data-i18n="confirm_password">确认密码</label>
                <input type="password" id="confirm-password" class="form-control">
              </div>
              <button class="btn btn-primary" id="change-password-btn" data-i18n="change_password">修改密码</button>
            </div>
            
            <div class="settings-group">
              <h3 data-i18n="session_settings">会话设置</h3>
              <div class="form-group">
                <label for="session-timeout" data-i18n="session_timeout">会话超时（分钟）</label>
                <input type="number" id="session-timeout" class="form-control" value="30" min="5" max="480">
              </div>
            </div>
          </div>
          
          <div class="settings-section" id="backup-section">
            <h2 data-i18n="settings_backup">备份设置</h2>
            
            <div class="settings-group">
              <h3 data-i18n="backup_options">备份选项</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="auto-backup" checked>
                  <span data-i18n="auto_backup">自动备份</span>
                </label>
              </div>
              <div class="form-group">
                <label for="backup-frequency" data-i18n="backup_frequency">备份频率</label>
                <select id="backup-frequency" class="form-control">
                  <option value="daily" data-i18n="daily">每日</option>
                  <option value="weekly" data-i18n="weekly">每周</option>
                  <option value="monthly" data-i18n="monthly">每月</option>
                </select>
              </div>
              <div class="backup-actions">
                <button class="btn btn-primary" id="backup-now-btn" data-i18n="backup_now">立即备份</button>
                <button class="btn btn-secondary" id="restore-backup-btn" data-i18n="restore_backup">恢复备份</button>
              </div>
            </div>
          </div>
          
          <div class="settings-section" id="about-section">
            <h2 data-i18n="settings_about">关于系统</h2>
            
            <div class="settings-group">
              <h3 data-i18n="system_info">系统信息</h3>
              <div class="info-item">
                <span class="info-label" data-i18n="system_name">系统名称：</span>
                <span class="info-value">Nekolinic 轻量级医疗系统</span>
              </div>
              <div class="info-item">
                <span class="info-label" data-i18n="version">版本：</span>
                <span class="info-value">alpha0.1.3</span>
              </div>
              <div class="info-item">
                <span class="info-label" data-i18n="build_date">构建日期：</span>
                <span class="info-value">2025-06-12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 初始化设置功能
  initializeSettings(container, signal);
}

/**
 * 初始化设置功能
 */
// 更新语言选择器函数
function updateLanguageSelector() {
  const container = document.querySelector('.settings-module-wrapper');
  if (!container) return;
  
  const languageSelect = container.querySelector('#language-select');
  if (languageSelect && window.getCurrentLanguage) {
    const currentLang = window.getCurrentLanguage();
    languageSelect.value = currentLang;
    console.log('Language selector updated to:', currentLang);
  }
}

function initializeSettings(container, signal) {
  // 导航切换
  const navItems = container.querySelectorAll('.settings-nav-item');
  const sections = container.querySelectorAll('.settings-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 移除所有活动状态
      navItems.forEach(nav => nav.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      // 添加当前活动状态
      item.classList.add('active');
      const sectionId = item.dataset.section + '-section';
      const targetSection = container.querySelector(`#${sectionId}`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // 确保语言选择器显示正确的当前语言
      updateLanguageSelector();
    });
  });
  
  // 监听语言变更事件
  window.addEventListener('languageChanged', function(event) {
    updateLanguageSelector();
  });
  
  // 监听页面显示事件（当从其他页面返回时）
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      updateLanguageSelector();
    }
  });
  
  // 语言切换
  const languageSelect = container.querySelector('#language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
      const selectedLanguage = e.target.value;
      try {
        if (window.setLanguage) {
          window.setLanguage(selectedLanguage);
        }
        
        // 立即设置语言选择器的值
        languageSelect.value = selectedLanguage;
        
        // 立即翻译页面
        if (window.translatePage) {
          window.translatePage();
        }
        
        // 强制重新翻译设置容器内的所有元素
        setTimeout(() => {
          const settingsContainer = document.querySelector('.settings-module-wrapper');
          if (settingsContainer) {
            const elementsWithI18n = settingsContainer.querySelectorAll('[data-i18n]');
            elementsWithI18n.forEach(element => {
              const key = element.getAttribute('data-i18n');
              if (key && window.translations && window.translations[selectedLanguage] && window.translations[selectedLanguage][key]) {
                element.textContent = window.translations[selectedLanguage][key];
              }
            });
          }
          
          // 再次确保语言选择器显示正确的值
          languageSelect.value = selectedLanguage;
          
          // 触发自定义事件，通知其他组件语言已更改
          window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: selectedLanguage } }));
          
          // 在语言切换完成后显示成功消息
        const message = window.getTranslation ? window.getTranslation('language_changed_success', '语言切换成功') : '语言切换成功';
        window.showNotification(message, 'success');
        }, 100);
      } catch (error) {
        console.error('Language change failed:', error);
        const errorMessage = window.getTranslation ? window.getTranslation('language_change_failed', '语言切换失败') : '语言切换失败';
        window.showNotification(errorMessage, 'error');
      }
    });
  }
  
  // 主题切换
  const themeSelect = container.querySelector('#theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const selectedTheme = e.target.value;
      applyTheme(selectedTheme);
      
      // 保存主题设置到服务器
      try {
        await apiClient.request('/api/v1/users/settings', {
          method: 'PUT',
          body: JSON.stringify({
            theme: selectedTheme
          })
        });
        
        const message = window.getTranslation ? window.getTranslation('theme_saved', '主题设置已保存') : '主题设置已保存';
        window.showNotification(message, 'success');
      } catch (error) {
        console.error('保存主题设置失败:', error);
        const errorMessage = window.getTranslation ? window.getTranslation('theme_save_failed', '保存主题设置失败') : '保存主题设置失败';
        window.showNotification(errorMessage, 'error');
      }
    });
  }
  
  // 背景设置功能
  initBackgroundSettingsInSettings(container);
  
  // 密码修改
  const changePasswordBtn = container.querySelector('#change-password-btn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      handlePasswordChange(container);
    });
  }
  
  // 备份操作
  const backupNowBtn = container.querySelector('#backup-now-btn');
  const restoreBackupBtn = container.querySelector('#restore-backup-btn');
  
  if (backupNowBtn) {
    backupNowBtn.addEventListener('click', () => {
      handleBackupNow();
    });
  }
  
  if (restoreBackupBtn) {
    restoreBackupBtn.addEventListener('click', () => {
      handleRestoreBackup();
    });
  }
  
  // 重置设置
  const resetBtn = container.querySelector('.settings-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetToDefault(container);
    });
  }
  
  // 为所有设置项添加修改即保存功能
  addAutoSaveListeners(container);
  
  // 加载当前设置
  loadCurrentSettings(container);
  
  // 初始化时更新语言选择器
  updateLanguageSelector();
  
  // 翻译页面内容
  if (window.translatePage) {
    window.translatePage();
  }
}

/**
 * 应用主题
 */
function applyTheme(theme) {
  // 使用配置管理器保存主题设置
  if (window.configManager && window.configManager.initialized) {
    window.configManager.set('theme', theme, true);
  } else {
    // 降级到原有方式
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (theme !== 'auto') {
      document.body.classList.add(`theme-${theme}`);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
    
    // 保存到localStorage
    try {
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      settings['theme-select'] = theme;
      localStorage.setItem('userSettings', JSON.stringify(settings));
      console.log(`主题已保存: ${theme}`);
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  }
}

/**
 * 应用背景
 */
function applyBackground(bgType) {
  // 如果configManager已初始化，则使用configManager来处理背景
  if (window.configManager && window.configManager.initialized) {
    // 不直接修改body class，让configManager处理背景
    console.log('Background management delegated to configManager');
    return;
  }
  
  // 只有在configManager未初始化时才使用传统方式
  document.body.className = document.body.className.replace(/bg-\w+/g, '');
  document.body.classList.add(`bg-${bgType}`);
}

/**
 * 处理密码修改
 */
async function handlePasswordChange(container) {
  const currentPassword = container.querySelector('#current-password').value;
  const newPassword = container.querySelector('#new-password').value;
  const confirmPassword = container.querySelector('#confirm-password').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('请填写所有密码字段', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('新密码和确认密码不匹配', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('新密码长度至少为6位', 'error');
    return;
  }
  
  try {
    const response = await apiClient.request('/api/v1/users/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    // 如果请求成功（没有抛出异常），则认为密码修改成功
    showNotification('密码修改成功', 'success');
    // 清空密码字段
    container.querySelector('#current-password').value = '';
    container.querySelector('#new-password').value = '';
    container.querySelector('#confirm-password').value = '';
  } catch (error) {
    console.error('密码修改错误:', error);
    const errorMessage = window.getTranslation ? window.getTranslation('password_change_failed', '密码修改失败，请稍后重试') : '密码修改失败，请稍后重试';
        window.showNotification(errorMessage, 'error');
  }
}

/**
 * 处理立即备份
 */
async function handleBackupNow() {
  try {
    const message = window.getTranslation ? window.getTranslation('creating_backup', '正在创建备份...') : '正在创建备份...';
        window.showNotification(message, 'info');
    
    const response = await apiClient.request('/api/v1/system/backup', {
      method: 'POST'
    });
    
    if (response.success) {
      const successMessage = window.getTranslation ? window.getTranslation('backup_created_success', '备份创建成功') : '备份创建成功';
        window.showNotification(successMessage, 'success');
    } else {
      window.showNotification(response.message || '备份创建失败', 'error');
    }
  } catch (error) {
    console.error('备份错误:', error);
    const errorMessage = window.getTranslation ? window.getTranslation('backup_creation_failed', '备份创建失败，请稍后重试') : '备份创建失败，请稍后重试';
        window.showNotification(errorMessage, 'error');
  }
}

/**
 * 处理恢复备份
 */
async function handleRestoreBackup() {
  try {
    // 首先获取备份列表
    const response = await apiClient.request('/api/v1/system/backups');
    
    if (!response.success || !response.backups || response.backups.length === 0) {
      const message = window.getTranslation ? window.getTranslation('no_backups_available', '没有可用的备份文件') : '没有可用的备份文件';
      window.showNotification(message, 'warning');
      return;
    }
    
    // 显示备份选择模态框
    showBackupSelectionModal(response.backups);
    
  } catch (error) {
    console.error('获取备份列表错误:', error);
    const errorMessage = window.getTranslation ? window.getTranslation('get_backups_failed', '获取备份列表失败') : '获取备份列表失败';
    window.showNotification(errorMessage, 'error');
  }
}

/**
 * 显示备份选择模态框
 */
function showBackupSelectionModal(backups) {
  // 创建模态框HTML
  const modalHtml = `
    <div id="backup-selection-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${window.getTranslation ? window.getTranslation('select_backup_to_restore', '选择要恢复的备份') : '选择要恢复的备份'}</h3>
          <button class="modal-close" onclick="closeBackupSelectionModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="backup-list">
            ${backups.map(backup => `
              <div class="backup-item" data-backup-id="${backup.backup_id}">
                <div class="backup-info">
                  <div class="backup-name">${backup.backup_path ? backup.backup_path.split(/[\\/]/).pop() : backup.backup_id}</div>
                  <div class="backup-date">${new Date(backup.created_at).toLocaleString()}</div>
                  <div class="backup-size">${formatFileSize(backup.size)}</div>
                </div>
                <button class="btn btn-primary" onclick="restoreSelectedBackup('${backup.backup_id}')">
                  ${window.getTranslation ? window.getTranslation('restore', '恢复') : '恢复'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 添加到页面
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 关闭备份选择模态框
 */
function closeBackupSelectionModal() {
  const modal = document.getElementById('backup-selection-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * 恢复选定的备份
 */
async function restoreSelectedBackup(backupId) {
  const title = window.getTranslation ? window.getTranslation('confirm_restore_backup_title', '确认恢复备份') : '确认恢复备份';
  const message = window.getTranslation ? window.getTranslation('confirm_restore_backup', '确定要恢复此备份吗？这将覆盖当前数据。') : '确定要恢复此备份吗？这将覆盖当前数据。';
  
  const confirmed = await confirmModal(title, message, {
    confirmText: window.getTranslation ? window.getTranslation('confirm', '确认') : '确认',
    cancelText: window.getTranslation ? window.getTranslation('cancel', '取消') : '取消',
    confirmClass: 'btn-danger'
  });
  
  if (!confirmed) {
    return;
  }
  
  try {
    // 关闭选择模态框
    closeBackupSelectionModal();
    
    const message = window.getTranslation ? window.getTranslation('restoring_backup', '正在恢复备份...') : '正在恢复备份...';
    window.showNotification(message, 'info');
    
    const response = await apiClient.request(`/api/v1/system/restore/${backupId}`, {
      method: 'POST'
    });
    
    if (response.success) {
      const successMessage = window.getTranslation ? window.getTranslation('backup_restored_success', '备份恢复成功') : '备份恢复成功';
      window.showNotification(successMessage, 'success');
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      window.showNotification(response.message || '备份恢复失败', 'error');
    }
  } catch (error) {
    console.error('恢复错误:', error);
    const errorMessage = window.getTranslation ? window.getTranslation('backup_restore_failed', '备份恢复失败，请稍后重试') : '备份恢复失败，请稍后重试';
    window.showNotification(errorMessage, 'error');
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 将函数暴露到全局作用域
window.closeBackupSelectionModal = closeBackupSelectionModal;
window.restoreSelectedBackup = restoreSelectedBackup;

/**
 * 保存所有设置
 */
async function saveAllSettings(container) {
  try {
    const settings = {
      language: container.querySelector('#language-select')?.value,
      theme: container.querySelector('#theme-select')?.value,
      autoSave: container.querySelector('#auto-save')?.checked,
      showTooltips: container.querySelector('#show-tooltips')?.checked,
      desktopNotifications: container.querySelector('#desktop-notifications')?.checked,
      soundNotifications: container.querySelector('#sound-notifications')?.checked,
      emailNotifications: container.querySelector('#email-notifications')?.checked,
      sessionTimeout: container.querySelector('#session-timeout')?.value,
      autoBackup: container.querySelector('#auto-backup')?.checked,
      backupFrequency: container.querySelector('#backup-frequency')?.value
    };
    
    const response = await apiClient.request('/api/v1/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    
    if (response.success) {
      const successMessage = window.getTranslation ? window.getTranslation('settings_saved_success', '设置保存成功') : '设置保存成功';
        window.showNotification(successMessage, 'success');
    } else {
      window.showNotification(response.message || '设置保存失败', 'error');
    }
  } catch (error) {
    console.error('保存设置错误:', error);
    const errorMessage = window.getTranslation ? window.getTranslation('settings_save_failed', '设置保存失败，请稍后重试') : '设置保存失败，请稍后重试';
        window.showNotification(errorMessage, 'error');
  }
}

/**
 * 重置为默认设置
 */
async function resetToDefault(container) {
  const confirmed = await new Promise(resolve => {
        if (window.showNotification) {
            const message = window.getTranslation ? window.getTranslation('confirm_reset_settings', '确定要重置所有设置为默认值吗？') : '确定要重置所有设置为默认值吗？';
        const title = window.getTranslation ? window.getTranslation('confirm_reset_settings_title', '确认重置设置') : '确认重置设置';
        window.showNotification(message, 'confirm', title, resolve);
        } else {
            // 使用confirmModal替代showNotification进行确认操作
                resolve(true);
        }
    });
    
    if (!confirmed) {
        return;
    }
  
  // 重置表单值
  const languageSelect = container.querySelector('#language-select');
  const themeSelect = container.querySelector('#theme-select');
  const autoSave = container.querySelector('#auto-save');
  const showTooltips = container.querySelector('#show-tooltips');
  const desktopNotifications = container.querySelector('#desktop-notifications');
  const soundNotifications = container.querySelector('#sound-notifications');
  const emailNotifications = container.querySelector('#email-notifications');
  const sessionTimeout = container.querySelector('#session-timeout');
  const autoBackup = container.querySelector('#auto-backup');
  const backupFrequency = container.querySelector('#backup-frequency');
  
  if (languageSelect) {
    const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'zh-CN';
    languageSelect.value = currentLang;
  }
  if (themeSelect) themeSelect.value = 'light';
  if (autoSave) autoSave.checked = true;
  if (showTooltips) showTooltips.checked = true;
  if (desktopNotifications) desktopNotifications.checked = true;
  if (soundNotifications) soundNotifications.checked = true;
  if (emailNotifications) emailNotifications.checked = false;
  if (sessionTimeout) sessionTimeout.value = '30';
  if (autoBackup) autoBackup.checked = true;
  if (backupFrequency) backupFrequency.value = 'daily';
  
  // 清除localStorage中的设置
  localStorage.removeItem('userSettings');
  
  // 应用默认主题和背景
  applyTheme('light');
  applyBackground('default');
  
  const successMessage = window.getTranslation ? window.getTranslation('settings_reset_success', '设置已重置为默认值') : '设置已重置为默认值';
        window.showNotification(successMessage, 'success');
}

/**
 * 加载当前设置
 */
async function loadCurrentSettings(container) {
  try {
    let settings = {};
    
    // 优先使用配置管理器
    if (window.configManager && window.configManager.initialized) {
      settings = {
        theme: window.configManager.get('theme'),
        language: window.configManager.get('language'),
        autoSave: window.configManager.get('preferences.autoSave'),
        showTooltips: window.configManager.get('preferences.showTooltips'),
        desktopNotifications: window.configManager.get('notifications.desktop'),
        soundNotifications: window.configManager.get('notifications.sound'),
        emailNotifications: window.configManager.get('notifications.email'),
        sessionTimeout: window.configManager.get('preferences.sessionTimeout'),
        autoBackup: window.configManager.get('backup.autoBackup'),
        backupFrequency: window.configManager.get('backup.frequency')
      };
    } else {
      // 降级到API调用
      const response = await apiClient.request('/api/v1/users/settings');
      if (response.success && response.data) {
        settings = response.data;
      }
    }
    
    // 应用设置到表单
    const languageSelect = container.querySelector('#language-select');
    const themeSelect = container.querySelector('#theme-select');
    const autoSave = container.querySelector('#auto-save');
    const showTooltips = container.querySelector('#show-tooltips');
    const desktopNotifications = container.querySelector('#desktop-notifications');
    const soundNotifications = container.querySelector('#sound-notifications');
    const emailNotifications = container.querySelector('#email-notifications');
    const sessionTimeout = container.querySelector('#session-timeout');
    const autoBackup = container.querySelector('#auto-backup');
    const backupFrequency = container.querySelector('#backup-frequency');
    
    // 语言设置：优先使用当前国际化系统的语言
    if (languageSelect && window.getCurrentLanguage) {
      const currentLang = window.getCurrentLanguage();
      languageSelect.value = currentLang;
      console.log('Language selector set to current language:', currentLang);
    }
    if (themeSelect && settings.theme) themeSelect.value = settings.theme;
    if (autoSave && typeof settings.autoSave === 'boolean') autoSave.checked = settings.autoSave;
    if (showTooltips && typeof settings.showTooltips === 'boolean') showTooltips.checked = settings.showTooltips;
    if (desktopNotifications && typeof settings.desktopNotifications === 'boolean') desktopNotifications.checked = settings.desktopNotifications;
    if (soundNotifications && typeof settings.soundNotifications === 'boolean') soundNotifications.checked = settings.soundNotifications;
    if (emailNotifications && typeof settings.emailNotifications === 'boolean') emailNotifications.checked = settings.emailNotifications;
    if (sessionTimeout && settings.sessionTimeout) sessionTimeout.value = settings.sessionTimeout;
    if (autoBackup && typeof settings.autoBackup === 'boolean') autoBackup.checked = settings.autoBackup;
    if (backupFrequency && settings.backupFrequency) backupFrequency.value = settings.backupFrequency;
    
    // 应用主题和背景
    if (settings.theme) applyTheme(settings.theme);
    if (settings.background) applyBackground(settings.background);
    
  } catch (error) {
    console.error('加载设置错误:', error);
    // 使用默认设置，确保语言选择器显示当前语言
    const languageSelect = container.querySelector('#language-select');
    if (languageSelect && window.getCurrentLanguage) {
      const currentLang = window.getCurrentLanguage();
      languageSelect.value = currentLang;
      console.log('Language selector set to current language (fallback):', currentLang);
    }
  }
  
  // 确保在设置加载完成后再次更新语言选择器
  setTimeout(() => {
    updateLanguageSelector();
  }, 100);
  
  // 添加自动保存监听器
  addAutoSaveListeners(container);
}

/**
 * 初始化设置页面中的背景设置功能
 */
function initBackgroundSettingsInSettings(container) {
  const bgPreview = container.querySelector('#settings-bg-preview');
  const fileInput = container.querySelector('#settings-bg-file-input');
  const resetBtn = container.querySelector('#settings-reset-bg-btn');
  const localBackgrounds = container.querySelector('#settings-local-backgrounds');
  
  // 加载用户当前背景设置
  loadUserBackgroundSettingInSettings(container);
  
  // 文件上传处理
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const imageUrl = e.target.result;
          
          // 压缩图片
          compressImageInSettings(imageUrl, function(compressedImageUrl) {
            const fileName = `bg_${Date.now()}.jpg`;
            
            // 应用背景到UI
            const bgContainer = document.querySelector('.bg-container');
            if (bgContainer) {
              bgContainer.style.backgroundImage = `url(${compressedImageUrl})`;
            }
            if (bgPreview) bgPreview.style.backgroundImage = `url(${compressedImageUrl})`;
            
            // 保存到服务器
            if (typeof apiClient !== 'undefined') {
              apiClient.request('/api/v1/users/me/background-image', {
                method: 'POST',
                body: JSON.stringify({
                  image_data: compressedImageUrl,
                  filename: fileName
                })
              }).then(user => {
                document.documentElement.style.setProperty('--bg-image', `url(${user.background_preference})`);
                const successMessage = window.getTranslation ? window.getTranslation('background_applied_success', '背景图片已成功应用并保存') : '背景图片已成功应用并保存';
        window.showNotification(successMessage, 'success');
              }).catch(err => {
                const errorMessage = window.getTranslation ? window.getTranslation('background_save_failed', '保存背景图片失败') : '保存背景图片失败';
        window.showNotification(errorMessage + ': ' + err.message, 'error');
              });
            }
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // 重置背景
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetBackgroundInSettings(container);
    });
  }
  
  // 加载预设背景
  loadLocalBackgroundsInSettings(container);
}

/**
 * 加载用户背景设置（设置页面版本）
 */
async function loadUserBackgroundSettingInSettings(container) {
  try {
    let user = window.currentUser;
    
    if (!user && typeof apiClient !== 'undefined') {
      user = await apiClient.auth.getCurrentUser();
      window.currentUser = user;
    }
    
    const bgContainer = document.querySelector('.bg-container');
    const bgPreview = container.querySelector('#settings-bg-preview');
    
    if (user && user.background_preference) {
      let backgroundUrl = user.background_preference;
      
      if (backgroundUrl.startsWith('color:')) {
        const color = backgroundUrl.replace('color:', '');
        document.documentElement.style.setProperty('--bg-image', 'none');
        document.body.style.backgroundColor = color;
      } else if (backgroundUrl.startsWith('image:')) {
        backgroundUrl = backgroundUrl.replace('image:', '');
        document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);
        document.body.style.backgroundColor = '';
      } else {
        document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);
        document.body.style.backgroundColor = '';
      }
      
      if (bgContainer && !backgroundUrl.startsWith('color:')) {
        bgContainer.style.backgroundImage = `url(${backgroundUrl.replace('image:', '')})`;
      }
      if (bgPreview && !backgroundUrl.startsWith('color:')) {
        bgPreview.style.backgroundImage = `url(${backgroundUrl.replace('image:', '')})`;
      }
    } else {
      const defaultBg = 'url(../assets/backgrounds/default_background.jpg)';
      document.documentElement.style.setProperty('--bg-image', defaultBg);
      document.body.style.backgroundColor = '';
      
      if (bgContainer) {
        bgContainer.style.backgroundImage = defaultBg;
      }
      if (bgPreview) bgPreview.style.backgroundImage = defaultBg;
    }
  } catch (err) {
    console.error('加载用户背景设置失败:', err);
  }
}

/**
 * 重置背景（设置页面版本）
 */
function resetBackgroundInSettings(container) {
  const bgContainer = document.querySelector('.bg-container');
  const bgPreview = container.querySelector('#settings-bg-preview');
  const fileInput = container.querySelector('#settings-bg-file-input');
  
  if (bgContainer) bgContainer.style.backgroundImage = 'none';
  document.documentElement.style.setProperty('--bg-image', 'none');
  if (bgPreview) bgPreview.style.backgroundImage = 'none';
  
  // 清除所有缩略图激活状态
  const thumbnails = container.querySelectorAll('.bg-thumbnail');
  thumbnails.forEach(thumb => thumb.classList.remove('active'));
  
  // 清除文件输入
  if (fileInput) fileInput.value = '';
  
  // 保存到服务器
  if (typeof apiClient !== 'undefined') {
    apiClient.auth.updatePreferences({
      background_preference: null
    }).then(() => {
      const successMessage = window.getTranslation ? window.getTranslation('background_reset_success', '背景已重置') : '背景已重置';
        window.showNotification(successMessage, 'success');
    }).catch(err => {
      const errorMessage = window.getTranslation ? window.getTranslation('background_reset_failed', '重置背景设置失败') : '重置背景设置失败';
        window.showNotification(errorMessage + ': ' + err.message, 'error');
    });
  }
}

/**
 * 加载预设背景（设置页面版本）
 */
function loadLocalBackgroundsInSettings(container) {
  const localBackgrounds = container.querySelector('#settings-local-backgrounds');
  if (!localBackgrounds) return;
  
  // 创建RGB调色盘
  const html = `
    <div class="color-picker-container">
      <div class="color-picker-section">
        <label for="settings-color-picker" data-i18n="choose_color">选择颜色</label>
        <div class="color-input-group">
          <input type="color" id="settings-color-picker" value="#3498db" class="color-picker">
          <input type="text" id="settings-color-input" value="#3498db" class="color-input" placeholder="#000000">
          <button type="button" id="settings-apply-color" class="btn btn-primary btn-sm" data-i18n="apply_color">应用颜色</button>
        </div>
      </div>
      <div class="preset-colors-section">
        <label data-i18n="preset_colors">纯色</label>
        <div class="preset-colors">
          <div class="preset-color" style="background-color: #f5f5f5" data-color="#f5f5f5" title="浅色"></div>
          <div class="preset-color" style="background-color: #333333" data-color="#333333" title="深色"></div>
          <div class="preset-color" style="background-color: #3498db" data-color="#3498db" title="蓝色"></div>
          <div class="preset-color" style="background-color: #2ecc71" data-color="#2ecc71" title="绿色"></div>
          <div class="preset-color" style="background-color: #e91e63" data-color="#e91e63" title="粉色"></div>
          <div class="preset-color" style="background-color: #f39c12" data-color="#f39c12" title="橙色"></div>
          <div class="preset-color" style="background-color: #9b59b6" data-color="#9b59b6" title="紫色"></div>
          <div class="preset-color" style="background-color: #e74c3c" data-color="#e74c3c" title="红色"></div>
        </div>
      </div>
    </div>
  `;
  
  localBackgrounds.innerHTML = html;
  
  // 获取元素
  const colorPicker = container.querySelector('#settings-color-picker');
  const colorInput = container.querySelector('#settings-color-input');
  const applyColorBtn = container.querySelector('#settings-apply-color');
  const presetColors = container.querySelectorAll('.preset-color');
  
  // 颜色选择器事件
  if (colorPicker) {
    colorPicker.addEventListener('input', function() {
      if (colorInput) {
        colorInput.value = this.value;
      }
    });
  }
  
  // 颜色输入框事件
  if (colorInput) {
    colorInput.addEventListener('input', function() {
      const color = this.value;
      if (/^#[0-9A-F]{6}$/i.test(color) && colorPicker) {
        colorPicker.value = color;
      }
    });
    
    colorInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        applySelectedColor(container, this.value);
      }
    });
  }
  
  // 应用颜色按钮事件
  if (applyColorBtn) {
    applyColorBtn.addEventListener('click', function() {
      const color = colorInput ? colorInput.value : colorPicker.value;
      applySelectedColor(container, color);
    });
  }
  
  // 预设颜色点击事件
  presetColors.forEach(preset => {
    preset.addEventListener('click', function() {
      const color = this.dataset.color;
      if (color) {
        // 更新颜色选择器和输入框
        if (colorPicker) colorPicker.value = color;
        if (colorInput) colorInput.value = color;
        
        // 移除其他预设颜色的激活状态
        presetColors.forEach(p => p.classList.remove('active'));
        // 激活当前预设颜色
        this.classList.add('active');
        
        // 应用颜色
        applySelectedColor(container, color);
      }
    });
  });
}

/**
 * 应用选中的颜色
 */
function applySelectedColor(container, color) {
  // 验证颜色格式
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    const errorMessage = window.getTranslation ? window.getTranslation('invalid_color_code', '请输入有效的颜色代码（如：#3498db）') : '请输入有效的颜色代码（如：#3498db）';
        window.showNotification(errorMessage, 'error');
    return;
  }
  
  // 应用颜色背景
  const bgContainer = document.querySelector('.bg-container');
  const bgPreview = container.querySelector('#settings-bg-preview');
  
  if (bgContainer) bgContainer.style.backgroundImage = 'none';
  document.documentElement.style.setProperty('--bg-image', 'none');
  document.body.style.backgroundColor = color;
  if (bgPreview) {
    bgPreview.style.backgroundImage = 'none';
    bgPreview.style.backgroundColor = color;
  }
  
  // 保存到服务器
  if (typeof apiClient !== 'undefined') {
    apiClient.auth.updatePreferences({
      background_preference: `color:${color}`
    }).then(() => {
      const successMessage = window.getTranslation ? window.getTranslation('background_color_applied', '背景颜色已应用') : '背景颜色已应用';
        window.showNotification(successMessage, 'success');
    }).catch(err => {
      const errorMessage = window.getTranslation ? window.getTranslation('background_settings_save_failed', '保存背景设置失败') : '保存背景设置失败';
        window.showNotification(errorMessage + ': ' + err.message, 'error');
    });
  }
}

/**
 * 压缩图片（设置页面版本）
 */
function compressImageInSettings(imageUrl, callback) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = function() {
    // 设置最大尺寸
    const maxWidth = 1920;
    const maxHeight = 1080;
    
    let { width, height } = img;
    
    // 计算新尺寸
    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 绘制并压缩
    ctx.drawImage(img, 0, 0, width, height);
    const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    callback(compressedImageUrl);
  };
  
  img.src = imageUrl;
}

/**
 * 为所有设置项添加修改即保存功能
 */
function addAutoSaveListeners(container) {
  // 监听所有输入框、选择框、复选框的变化
  const inputs = container.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const eventType = input.type === 'checkbox' ? 'change' : 'input';
    
    input.addEventListener(eventType, () => {
      // 延迟保存，避免频繁保存
      clearTimeout(input.saveTimeout);
      input.saveTimeout = setTimeout(() => {
        saveIndividualSetting(input);
      }, 500);
    });
  });
}

/**
 * 保存单个设置项
 */
async function saveIndividualSetting(input) {
  const settingKey = input.id || input.name;
  let settingValue;
  
  if (input.type === 'checkbox') {
    settingValue = input.checked;
  } else {
    settingValue = input.value;
  }
  
  try {
    // 优先使用配置管理器
    if (window.configManager && window.configManager.initialized) {
      // 映射前端字段到配置管理器字段
      const configMapping = {
        'theme-select': 'theme',
        'language-select': 'language',
        'auto-save': 'preferences.autoSave',
        'show-tooltips': 'preferences.showTooltips',
        'desktop-notifications': 'notifications.desktop',
        'sound-notifications': 'notifications.sound',
        'email-notifications': 'notifications.email',
        'session-timeout': 'preferences.sessionTimeout',
        'auto-backup': 'backup.autoBackup',
        'backup-frequency': 'backup.frequency'
      };
      
      const configKey = configMapping[settingKey] || settingKey;
      await window.configManager.set(configKey, settingValue, true);
      
    } else {
      // 降级到原有方式
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      settings[settingKey] = settingValue;
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // 同时保存到服务器
      const serverSettings = {};
      const fieldMapping = {
        'theme-select': 'theme',
        'language-select': 'language',
        'auto-save': 'autoSave',
        'show-tooltips': 'showTooltips',
        'desktop-notifications': 'desktopNotifications',
        'sound-notifications': 'soundNotifications',
        'email-notifications': 'emailNotifications',
        'session-timeout': 'sessionTimeout',
        'auto-backup': 'autoBackup',
        'backup-frequency': 'backupFrequency'
      };
      
      const serverKey = fieldMapping[settingKey] || settingKey;
      serverSettings[serverKey] = settingValue;
      
      const response = await apiClient.request('/api/v1/users/settings', {
        method: 'PUT',
        body: JSON.stringify(serverSettings)
      });
      
      if (response && window.showNotification) {
        const message = window.getTranslation ? window.getTranslation('settings_saved_auto', '设置已自动保存') : '设置已自动保存';
        window.showNotification(message, 'success');
      }
    }
    
    console.log(`设置已保存: ${settingKey} = ${settingValue}`);
  } catch (error) {
    console.error('保存设置失败:', error);
    // 只有在确实是服务器错误时才显示错误通知
    // 网络错误或认证错误不显示设置保存失败的通知
    if (window.showNotification && !error.message.includes('401') && !error.message.includes('网络')) {
      const errorMessage = window.getTranslation ? window.getTranslation('settings_save_failed_general', '保存设置失败') : '保存设置失败';
        window.showNotification(errorMessage, 'error');
    }
  }
}

/**
 * 调整会话超时的spinner按钮处理函数
 */
window.adjustSessionTimeout = function(delta) {
  const input = document.getElementById('session-timeout');
  const currentValue = parseInt(input.value) || 30;
  const newValue = Math.max(5, Math.min(480, currentValue + delta)); // 范围 5-480分钟
  input.value = newValue;
};