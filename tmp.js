/**

 * 设置管理模块

 */


export default function renderSettingsModule(container, options = {}) {

  const { signal } = options;

 

  // 创建设置管理界面

  container.innerHTML = `

    <div class="settings-module-wrapper">

      <div class="settings-content">

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

         

          <!-- 设置操作按钮 -->

          <div class="settings-actions">

            <button class="btn btn-primary settings-save-btn" data-i18n="save_settings">保存设置</button>

            <button class="btn btn-secondary settings-reset-btn" data-i18n="reset_to_default">重置为默认</button>

          </div>

        </div>

       

        <div class="settings-main">

          <!-- 常规设置 -->

          <div id="general-section" class="settings-section active">

            <h3 data-i18n="settings_general">常规设置</h3>

            <div class="setting-group">

              <label class="setting-label" data-i18n="clinic_name">名称</label>

              <input type="text" class="modern-input" value="Nekolinic" data-i18n-placeholder="enter_clinic_name" placeholder="请输入名称">

              <small class="setting-help" data-i18n="clinic_name_help">显示在系统各处的名称</small>

            </div>

           

            <div class="setting-group">

              <label class="setting-label" data-i18n="language">语言</label>

              <select class="modern-select">

                <option value="zh-CN" selected data-i18n="chinese_simplified">简体中文</option>

                <option value="en-US" data-i18n="english">English</option>

              </select>

            </div>

           

            <div class="setting-group">

              <label class="setting-label" data-i18n="timezone_setting">时区设置</label>

              <select class="modern-select">

                <option value="Asia/Shanghai" selected data-i18n="china_standard_time">中国标准时间 (UTC+8)</option>

                <option value="UTC" data-i18n="utc_time">协调世界时 (UTC)</option>

              </select>

            </div>

           

            <!-- 用户账户管理 -->

            <div class="setting-group">

              <h4 class="setting-subtitle" data-i18n="settings_user_account_management">用户账户管理</h4>

              <div class="user-account-info">

                <div class="user-info-display">

                  <div class="user-avatar-large" id="settings-user-avatar">A</div>

                  <div class="user-details">

                    <div class="user-name" id="settings-user-name" data-i18n="settings_loading">加载中...</div>

                    <div class="user-role" id="settings-user-role" data-i18n="settings_loading">加载中...</div>

                  </div>

                </div>

                <div class="user-actions">

                  <button class="btn btn-outline" id="edit-profile-btn">

                    <i class="icon-user"></i>

                    <span data-i18n="settings_edit_profile">编辑个人信息</span>

                  </button>

                  <button class="btn btn-outline" id="change-password-btn">

                    <i class="icon-lock"></i>

                    <span data-i18n="settings_change_password">修改密码</span>

                  </button>

                  <button class="btn btn-danger" id="logout-settings-btn">

                    <i class="icon-logout"></i>

                    <span data-i18n="settings_logout">退出登录</span>

                  </button>

                </div>

              </div>

            </div>

          </div>

         

          <!-- 外观设置 -->

          <div id="appearance-section" class="settings-section">

            <h3>外观设置</h3>

            <div class="setting-group">

              <label class="setting-label">主题模式</label>

              <div class="radio-group">

                <label class="radio-label">

                  <input type="radio" name="theme" value="light" checked>

                  <span>浅色模式</span>

                </label>

                <label class="radio-label">

                  <input type="radio" name="theme" value="dark">

                  <span>深色模式</span>

                </label>

                <label class="radio-label">

                  <input type="radio" name="theme" value="auto">

                  <span>跟随系统</span>

                </label>

              </div>

            </div>

           

            <div class="setting-group">

              <label class="setting-label">背景设置</label>

              <button class="btn btn-outline" id="bg-settings-btn">

                <i class="fas fa-image"></i>

                打开背景设置

              </button>

              <small class="setting-help">自定义系统背景图片</small>

            </div>

          </div>

         

          <!-- 通知设置 -->

          <div id="notifications-section" class="settings-section">

            <h3>通知设置</h3>

            <div class="setting-group">

              <label class="setting-label">

                <input type="checkbox" checked>

                启用桌面通知

              </label>

              <small class="setting-help">允许系统发送桌面通知</small>

            </div>

           

            <div class="setting-group">

              <label class="setting-label">

                <input type="checkbox" checked>

                预约提醒

              </label>

              <small class="setting-help">在预约时间前发送提醒</small>

            </div>

           

            <div class="setting-group">

              <label class="setting-label">

                <input type="checkbox">

                药品过期提醒

              </label>

              <small class="setting-help">药品即将过期时发送提醒</small>

            </div>

          </div>

         

          <!-- 安全设置 -->

          <div id="security-section" class="settings-section">

            <h3>安全设置</h3>

            <div class="setting-group">

              <label class="setting-label">会话超时时间</label>

              <select class="form-control">

                <option value="30">30分钟</option>

                <option value="60" selected>1小时</option>

                <option value="120">2小时</option>

                <option value="480">8小时</option>

              </select>

              <small class="setting-help">无操作后自动退出登录的时间</small>

            </div>

           

            <div class="setting-group">

              <label class="setting-label">

                <input type="checkbox" checked>

                启用操作日志

              </label>

              <small class="setting-help">记录用户的重要操作</small>

            </div>

           

            <div class="setting-group">

              <button class="btn btn-primary">修改密码</button>

              <small class="setting-help">更改当前用户的登录密码</small>

            </div>

          </div>

         

          <!-- 备份设置 -->

          <div id="backup-section" class="settings-section">

            <h3>备份设置</h3>

            <div class="setting-group">

              <label class="setting-label">

                <input type="checkbox">

                启用自动备份

              </label>

              <small class="setting-help">定期自动备份系统数据</small>

            </div>

           

            <div class="setting-group">

              <label class="setting-label">备份频率</label>

              <select class="form-control">

                <option value="daily">每日</option>

                <option value="weekly" selected>每周</option>

                <option value="monthly">每月</option>

              </select>

            </div>

           

            <div class="setting-group">

              <div class="backup-actions">

                <button class="btn btn-primary">立即备份</button>

                <button class="btn btn-outline">恢复备份</button>

              </div>

            </div>

          </div>

         

          <!-- 关于系统 -->

          <div id="about-section" class="settings-section">

            <h3>关于系统</h3>

            <div class="about-info">

              <div class="about-logo">

                <h2 id="about-system-title">Nekolinic</h2>

                <p class="version">版本 1.0.0</p>

              </div>

             

              <div class="about-details">

                <p id="about-system-name"><strong>系统名称：</strong>Nekolinic管理系统</p>

                <p><strong>开发者：</strong>moeyukisako</p>

                <p><strong>版权信息：</strong>Copyright © 2025 moeyukisako. All rights reserved.</p>

                <p><strong>技术栈：</strong>FastAPI + SQLAlchemy + HTML5 + CSS3 + JavaScript</p>

              </div>

             

              <div class="about-actions">

                <button class="btn btn-outline">检查更新</button>

                <button class="btn btn-outline">用户手册</button>

                <button class="btn btn-outline">技术支持</button>

              </div>

            </div>

          </div>

        </div>

      </div>

     


    </div>

   

    <!-- 背景设置模态框 -->

    <div class="modal-custom" id="bg-settings-modal">

      <div class="modal-container">

        <div class="modal-header">

          <h3 class="modal-title">背景设置</h3>

          <button class="modal-close" id="bg-modal-close">&times;</button>

        </div>

        <div class="modal-body">

          <div class="bg-preview" id="bg-preview"></div>

          <div class="form-group">

            <label>本地图片</label>

            <div class="file-upload-container">

              <label for="bg-file-input" class="file-upload-btn">

                选择图片文件

                <input type="file" id="bg-file-input" accept="image/*" style="display:none">

              </label>

            </div>

          </div>

          <div class="form-group">

            <label>预设背景</label>

            <div class="local-backgrounds" id="local-backgrounds">

              <div class="loading-backgrounds">加载中...</div>

            </div>

          </div>

        </div>

        <div class="modal-footer">

          <button class="btn btn-secondary" id="reset-bg-btn">重置背景</button>

          <button class="btn btn-secondary" id="bg-modal-cancel">取消</button>

          <button class="btn btn-primary" id="bg-modal-confirm">确定</button>

        </div>

      </div>

    </div>

  `;

 

  // 绑定设置导航事件

  const navItems = container.querySelectorAll('.settings-nav-item');

  const sections = container.querySelectorAll('.settings-section');

 

  navItems.forEach(item => {

    item.addEventListener('click', (e) => {

      e.preventDefault();

      const sectionId = item.dataset.section;

     

      // 移除所有活动状态

      navItems.forEach(nav => nav.classList.remove('active'));

      sections.forEach(section => section.classList.remove('active'));

     

      // 添加当前活动状态

      item.classList.add('active');

      const targetSection = container.querySelector(`#${sectionId}-section`);

      if (targetSection) {

        targetSection.classList.add('active');

      }

    }, { signal });

  });

 

  // 绑定背景设置按钮

  const bgSettingsBtn = container.querySelector('#bg-settings-btn');

  if (bgSettingsBtn) {

    bgSettingsBtn.addEventListener('click', () => {

      // 打开背景设置模态框

      const bgModal = container.querySelector('#bg-settings-modal');

      if (bgModal) {

        bgModal.classList.add('active');

        // 初始化背景设置

        initBackgroundSettingsModal(container);

      }

    }, { signal });

  }

 

  // 绑定背景设置模态框事件

  initBackgroundModalEvents(container, signal);

 

  // 绑定用户账户管理按钮

  const editProfileBtn = container.querySelector('#edit-profile-btn');

  const changePasswordBtn = container.querySelector('#change-password-btn');

  const logoutSettingsBtn = container.querySelector('#logout-settings-btn');

 

  if (editProfileBtn) {

    editProfileBtn.addEventListener('click', () => {

      showEditProfileModal(container);

    }, { signal });

  }

 

  if (changePasswordBtn) {

    changePasswordBtn.addEventListener('click', () => {

      showChangePasswordModal(container);

    }, { signal });

  }

 

  if (logoutSettingsBtn) {

    logoutSettingsBtn.addEventListener('click', () => {

      showLogoutConfirmModal();

    }, { signal });

  }

 

  // 初始化用户信息显示

  initUserInfoDisplay(container);

 

  // 绑定语言选择器事件

  const languageSelect = container.querySelector('#general-section .modern-select:nth-of-type(1)');

  if (languageSelect) {

    languageSelect.addEventListener('change', (e) => {

      const newLanguage = e.target.value;

      if (window.setLanguage) {

        window.setLanguage(newLanguage);

        window.showNotification('成功', '语言已切换', 'success');

      }

    }, { signal });

  }

 

  // 加载常规设置

  loadGeneralSettings(container);

 

  // 立即应用已保存的设置

  const savedSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');

  if (savedSettings.clinicName) {

    applyGeneralSettings(savedSettings);

  }

 

  // 绑定保存设置按钮

  const saveBtn = container.querySelector('.settings-save-btn');

  if (saveBtn) {

    saveBtn.addEventListener('click', () => {

      saveGeneralSettings(container);

    }, { signal });

  }

 

  // 绑定重置设置按钮

  const resetBtn = container.querySelector('.settings-reset-btn');

  if (resetBtn) {

    resetBtn.addEventListener('click', () => {

      if (confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {

        resetGeneralSettings(container);

      }

    }, { signal });

  }

 

  // 翻译页面内容

  if (window.translatePage) {

    window.translatePage();

  }

 

  // 返回清理函数

  return () => {

    console.log('设置模块已卸载');

  };

}


/**

 * 初始化背景设置模态框事件

 */

function initBackgroundModalEvents(container, signal) {

  const bgModal = container.querySelector('#bg-settings-modal');

  const closeBtn = container.querySelector('#bg-modal-close');

  const cancelBtn = container.querySelector('#bg-modal-cancel');

  const confirmBtn = container.querySelector('#bg-modal-confirm');

  const resetBtn = container.querySelector('#reset-bg-btn');

  const fileInput = container.querySelector('#bg-file-input');

 

  // 关闭模态框事件

  if (closeBtn) {

    closeBtn.addEventListener('click', () => {

      bgModal.classList.remove('active');

    }, { signal });

  }

 

  if (cancelBtn) {

    cancelBtn.addEventListener('click', () => {

      bgModal.classList.remove('active');

    }, { signal });

  }

 

  // 确定按钮事件

  if (confirmBtn) {

    confirmBtn.addEventListener('click', () => {

      bgModal.classList.remove('active');

      window.showNotification('成功', '背景设置已应用', 'success');

    }, { signal });

  }

 

  // 重置背景事件

  if (resetBtn) {

    resetBtn.addEventListener('click', () => {

      resetBackground();

    }, { signal });

  }

 

  // 文件选择事件

  if (fileInput) {

    fileInput.addEventListener('change', (e) => {

      const file = e.target.files[0];

      if (file) {

        handleBackgroundImageUpload(file, container);

      }

    }, { signal });

  }

 

  // 点击模态框外部关闭

  if (bgModal) {

    bgModal.addEventListener('click', (e) => {

      if (e.target === bgModal) {

        bgModal.classList.remove('active');

      }

    }, { signal });

  }

}


/**

 * 初始化背景设置模态框内容

 */

function initBackgroundSettingsModal(container) {

  // 加载当前背景预览

  loadCurrentBackgroundPreview(container);

 

  // 加载预设背景

  loadLocalBackgrounds(container);

}


/**

 * 加载当前背景预览

 */

function loadCurrentBackgroundPreview(container) {

  const bgPreview = container.querySelector('#bg-preview');

  if (!bgPreview) return;

 

  // 获取当前背景设置

  const currentBg = document.documentElement.style.getPropertyValue('--bg-image');

  if (currentBg && currentBg !== 'none') {

    bgPreview.style.backgroundImage = currentBg;

  } else {

    bgPreview.style.backgroundImage = 'none';

    bgPreview.style.backgroundColor = '#f5f5f5';

  }

}


/**

 * 加载本地预设背景

 */

function loadLocalBackgrounds(container) {

  const localBackgrounds = container.querySelector('#local-backgrounds');

  if (!localBackgrounds) return;

 

  const backgrounds = [

    {name: '浅色背景', color: '#f5f5f5'},

    {name: '深色背景', color: '#333333'},

    {name: '蓝色背景', color: '#3498db'},

    {name: '绿色背景', color: '#2ecc71'},

    {name: '粉色背景', color: '#e91e63'}

  ];

 

  let html = '';

  backgrounds.forEach(bg => {

    html += `

      <div class="bg-thumbnail"

          style="background-color: ${bg.color}"

          data-color="${bg.color}"

          title="${bg.name}">

      </div>

    `;

  });

 

  localBackgrounds.innerHTML = html || '<div class="no-backgrounds">暂无预设背景</div>';

 

  // 添加点击事件

  container.querySelectorAll('.bg-thumbnail').forEach(thumb => {

    thumb.addEventListener('click', function() {

      const color = this.getAttribute('data-color');

      applyBackgroundColor(color, container);

     

      // 更新激活状态

      container.querySelectorAll('.bg-thumbnail').forEach(t => t.classList.remove('active'));

      this.classList.add('active');

    });

  });

}


/**

 * 应用背景颜色

 */

function applyBackgroundColor(color, container) {

  const bgContainer = document.querySelector('.bg-container');

  const bgPreview = container.querySelector('#bg-preview');

 

  document.documentElement.style.setProperty('--bg-image', 'none');

  document.documentElement.style.setProperty('--color-bg-primary', color);

  if (bgContainer) bgContainer.style.backgroundImage = 'none';

  if (bgPreview) {

    bgPreview.style.backgroundColor = color;

    bgPreview.style.backgroundImage = 'none';

  }

 

  // 保存到服务器

  if (window.apiClient) {

    window.apiClient.auth.updatePreferences({

      background_preference: `color:${color}`

    }).then(() => {

      window.showNotification('成功', '背景颜色已成功应用并保存', 'info');

    }).catch(err => {

      window.showNotification('错误', '保存背景颜色失败: ' + err.message, 'error');

    });

  }

}


/**

 * 处理背景图片上传

 */

function handleBackgroundImageUpload(file, container) {

  if (!file.type.startsWith('image/')) {

    window.showNotification('错误', '请选择有效的图片文件', 'error');

    return;

  }

 

  if (file.size > 10 * 1024 * 1024) {

    window.showNotification('错误', '图片文件大小不能超过10MB', 'error');

    return;

  }

 

  const reader = new FileReader();

  reader.onload = function(e) {

    const dataUrl = e.target.result;

   

    // 压缩图片

    compressImage(dataUrl, (compressedDataUrl) => {

      applyBackgroundImage(compressedDataUrl, container);

    });

  };

  reader.readAsDataURL(file);

}


/**

 * 应用背景图片

 */

function applyBackgroundImage(dataUrl, container) {

  const bgContainer = document.querySelector('.bg-container');

  const bgPreview = container.querySelector('#bg-preview');

 

  const backgroundUrl = dataUrl;

  document.documentElement.style.setProperty('--bg-image', `url(${backgroundUrl})`);

  if (bgContainer) {

    bgContainer.style.backgroundImage = `url(${backgroundUrl})`;

  }

  if (bgPreview) {

    bgPreview.style.backgroundImage = `url(${backgroundUrl})`;

    bgPreview.style.backgroundColor = 'transparent';

  }

 

  // 保存到服务器

  if (window.apiClient) {

    window.apiClient.auth.updatePreferences({

      background_preference: `image:${backgroundUrl}`

    }).then(() => {

      window.showNotification('成功', '背景图片已成功应用并保存', 'info');

    }).catch(err => {

      window.showNotification('错误', '保存背景图片失败: ' + err.message, 'error');

    });

  }

}


/**

 * 重置背景

 */

function resetBackground() {

  const bgContainer = document.querySelector('.bg-container');

 

  if (bgContainer) bgContainer.style.backgroundImage = 'none';

  document.documentElement.style.setProperty('--bg-image', 'none');

 

  // 保存到服务器

  if (window.apiClient) {

    window.apiClient.auth.updatePreferences({

      background_preference: null

    }).then(() => {

      window.showNotification('成功', '背景已重置', 'info');

    }).catch(err => {

      window.showNotification('错误', '重置背景设置失败: ' + err.message, 'error');

    });

  }

}


/**

 * 图片压缩函数

 */

function compressImage(dataUrl, callback, maxWidth = 8000, maxHeight = 6000, quality = 0.7) {

  const img = new Image();

  img.onload = function() {

    let width = img.width;

    let height = img.height;

   

    // 如果图片尺寸已经小于最大尺寸，直接返回

    if (width <= maxWidth && height <= maxHeight && dataUrl.length < 5242880) {

      callback(dataUrl);

      return;

    }

   

    // 计算新的尺寸，保持宽高比

    if (width > maxWidth) {

      height = Math.round(height * (maxWidth / width));

      width = maxWidth;

    }

   

    if (height > maxHeight) {

      width = Math.round(width * (maxHeight / height));

      height = maxHeight;

    }

   

    // 创建canvas绘制压缩后的图片

    const canvas = document.createElement('canvas');

    canvas.width = width;

    canvas.height = height;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0, width, height);

   

    // 转换为DataURL

    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

   

    // 如果压缩后仍然过大，继续压缩

    if (compressedDataUrl.length > 5242880) {

      compressImage(compressedDataUrl, callback, maxWidth, maxHeight, quality * 0.8);

    } else {

      callback(compressedDataUrl);

    }

  };

  img.onerror = function() {

    callback(dataUrl); // 加载失败时使用原始数据

  };

  img.src = dataUrl;

}


/**

 * 初始化用户信息显示

 */

function initUserInfoDisplay(container) {

  const userNameEl = container.querySelector('#settings-user-name');

  const userRoleEl = container.querySelector('#settings-user-role');

  const userAvatarEl = container.querySelector('#settings-user-avatar');

 

  // 从localStorage获取用户信息

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

 

  // 如果没有用户信息，显示默认信息而不是"加载中"

  if (userNameEl) {

    userNameEl.textContent = userInfo.username || window.getTranslation('settings_not_logged_in') || '未登录用户';

  }

 

  if (userRoleEl) {

    if (userInfo.role) {

      userRoleEl.textContent = userInfo.role === 'admin' ?

        (window.getTranslation('settings_admin') || '管理员') :

        (window.getTranslation('settings_user') || '用户');

    } else {

      userRoleEl.textContent = window.getTranslation('settings_guest') || '访客';

    }

  }

 

  if (userAvatarEl) {

    if (userInfo.username) {

      userAvatarEl.textContent = userInfo.username.charAt(0).toUpperCase();

    } else {

      userAvatarEl.textContent = '?';

    }

  }

}


/**

 * 显示编辑个人信息模态框

 */

function showEditProfileModal(container) {

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

 

  const modalHtml = `

    <div class="modal-custom active" id="edit-profile-modal">

      <div class="modal-content">

        <div class="modal-header">

          <h3 class="modal-title">${window.getTranslation('settings_edit_profile') || '编辑个人信息'}</h3>

          <button class="modal-close" onclick="this.closest('.modal-custom').remove()">&times;</button>

        </div>

        <div class="modal-body">

          <div class="form-group">

            <label data-i18n="settings_username">用户名</label>

            <div class="user-display-text">${userInfo.username || (window.getTranslation('settings_not_set') || '未设置')}</div>

            <small class="text-muted" data-i18n="settings_username_readonly">用户名不可修改</small>

          </div>

          <div class="form-group">

            <label data-i18n="settings_email">邮箱</label>

            <input type="email" class="form-control" id="edit-email" value="${userInfo.email || ''}" data-i18n-placeholder="settings_email_placeholder" placeholder="请输入邮箱">

          </div>

          <div class="form-group">

            <label data-i18n="settings_phone">手机号</label>

            <input type="tel" class="form-control" id="edit-phone" value="${userInfo.phone || ''}" data-i18n-placeholder="settings_phone_placeholder" placeholder="请输入手机号">

          </div>

        </div>

        <div class="modal-footer">

          <button class="btn btn-outline" onclick="this.closest('.modal-custom').remove()" data-i18n="cancel">取消</button>

          <button class="btn btn-primary" onclick="saveProfileChanges()" data-i18n="save">保存</button>

        </div>

      </div>

    </div>

  `;

 

  document.body.insertAdjacentHTML('beforeend', modalHtml);

 

  // 翻译模态框内容

  if (window.translatePage) {

    window.translatePage();

  }

}


/**

 * 显示修改密码模态框

 */

function showChangePasswordModal(container) {

  const modalHtml = `

    <div class="modal-custom active" id="change-password-modal">

      <div class="modal-content">

        <div class="modal-header">

          <h3 class="modal-title">${window.getTranslation('settings_change_password') || '修改密码'}</h3>

          <button class="modal-close" onclick="this.closest('.modal-custom').remove()">&times;</button>

        </div>

        <div class="modal-body">

          <div class="form-group">

            <label data-i18n="settings_current_password">当前密码</label>

            <input type="password" class="form-control" id="current-password" data-i18n-placeholder="settings_current_password_placeholder" placeholder="请输入当前密码">

          </div>

          <div class="form-group">

            <label data-i18n="settings_new_password">新密码</label>

            <input type="password" class="form-control" id="new-password" data-i18n-placeholder="settings_new_password_placeholder" placeholder="请输入新密码">

          </div>

          <div class="form-group">

            <label data-i18n="settings_confirm_password">确认新密码</label>

            <input type="password" class="form-control" id="confirm-password" data-i18n-placeholder="settings_confirm_password_placeholder" placeholder="请再次输入新密码">

          </div>

        </div>

        <div class="modal-footer">

          <button class="btn btn-outline" onclick="this.closest('.modal-custom').remove()" data-i18n="cancel">取消</button>

          <button class="btn btn-primary" onclick="savePasswordChanges()" data-i18n="settings_change_password">修改密码</button>

        </div>

      </div>

    </div>

  `;

 

  document.body.insertAdjacentHTML('beforeend', modalHtml);

 

  // 翻译模态框内容

  if (window.translatePage) {

    window.translatePage();

  }

}


/**

 * 保存个人信息修改

 */

window.saveProfileChanges = function() {

  const email = document.getElementById('edit-email').value;

  const phone = document.getElementById('edit-phone').value;

 

  // 简单的邮箱格式验证

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

    window.showNotification(

      window.getTranslation('error') || '错误',

      window.getTranslation('settings_invalid_email') || '请输入有效的邮箱地址',

      'error'

    );

    return;

  }

 

  // 简单的手机号格式验证

  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {

    window.showNotification(

      window.getTranslation('error') || '错误',

      window.getTranslation('settings_invalid_phone') || '请输入有效的手机号码',

      'error'

    );

    return;

  }

 

  // 更新本地存储的用户信息

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  userInfo.email = email;

  userInfo.phone = phone;

  localStorage.setItem('user', JSON.stringify(userInfo));

 

  window.showNotification(

    window.getTranslation('success') || '成功',

    window.getTranslation('settings_profile_updated') || '个人信息已更新',

    'success'

  );

  document.getElementById('edit-profile-modal').remove();

 

  // 实际项目中可以调用API保存用户信息

  // if (window.apiClient && window.apiClient.user) {

  //   window.apiClient.user.updateProfile({ email, phone })

  //     .then(() => {

  //       window.showNotification(

  //         window.getTranslation('success') || '成功',

  //         window.getTranslation('settings_profile_updated') || '个人信息已更新',

  //         'success'

  //       );

  //       document.getElementById('edit-profile-modal').remove();

  //     })

  //     .catch(err => {

  //       showNotification('错误', '更新失败: ' + err.message, 'error');

  //     });

  // }

};


/**

 * 保存密码修改

 */

window.savePasswordChanges = function() {

  const currentPassword = document.getElementById('current-password').value;

  const newPassword = document.getElementById('new-password').value;

  const confirmPassword = document.getElementById('confirm-password').value;

 

  if (!currentPassword || !newPassword || !confirmPassword) {

    window.showNotification('错误', '请填写所有字段', 'error');

    return;

  }

 

  if (newPassword !== confirmPassword) {

    window.showNotification('错误', '新密码和确认密码不匹配', 'error');

    return;

  }

 

  if (newPassword.length < 6) {

    window.showNotification('错误', '新密码长度至少6位', 'error');

    return;

  }

 

  // 模拟保存密码功能

  window.showNotification('成功', '密码已修改', 'success');

  document.getElementById('change-password-modal').remove();

 

  // 实际项目中可以调用API修改密码

  // if (window.apiClient && window.apiClient.user) {

  //   window.apiClient.user.changePassword({ currentPassword, newPassword })

  //     .then(() => {

  //       window.showNotification('成功', '密码已修改', 'success');

  //       document.getElementById('change-password-modal').remove();

  //     })

  //     .catch(err => {

  //       showNotification('错误', '修改失败: ' + err.message, 'error');

  //     });

  // }

};


/**

 * 显示退出登录确认模态框

 */

function showLogoutConfirmModal() {

  const modalHtml = `

    <div class="modal-custom active" id="logout-confirm-modal">

      <div class="modal-content">

        <div class="modal-header">

          <h3 class="modal-title">确认退出</h3>

          <button class="modal-close" onclick="this.closest('.modal-custom').remove()">&times;</button>

        </div>

        <div class="modal-body">

          <p>确定要退出登录吗？</p>

        </div>

        <div class="modal-footer">

          <button class="btn btn-outline" onclick="this.closest('.modal-custom').remove()">取消</button>

          <button class="btn btn-danger" onclick="confirmLogout()">退出登录</button>

        </div>

      </div>

    </div>

  `;

 

  document.body.insertAdjacentHTML('beforeend', modalHtml);

}


/**

 * 确认退出登录

 */

window.confirmLogout = function() {

  // 关闭模态框

  const modal = document.getElementById('logout-confirm-modal');

  if (modal) {

    modal.remove();

  }

 

  // 执行退出登录

  if (window.apiClient && window.apiClient.auth) {

    window.apiClient.auth.logout();

  } else {

    // 清除本地存储的认证信息

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    // 跳转到登录页

    window.location.href = '/frontend/index.html';

  }

};


/**

 * 保存常规设置

 */

function saveGeneralSettings(container) {

  try {

    // 获取设置值

    const nameInput = container.querySelector('#general-section .modern-input');

    const languageSelect = container.querySelector('#general-section .modern-select:nth-of-type(1)');

    const timezoneSelect = container.querySelector('#general-section .modern-select:nth-of-type(2)');

   

    const settings = {

      clinicName: nameInput ? nameInput.value : 'Nekolinic',

      language: languageSelect ? languageSelect.value : 'zh-CN',

      timezone: timezoneSelect ? timezoneSelect.value : 'Asia/Shanghai',

      lastUpdated: new Date().toISOString()

    };

   

    // 保存到localStorage

    localStorage.setItem('generalSettings', JSON.stringify(settings));

   

    // 应用设置

    applyGeneralSettings(settings);

   

    window.showNotification('成功', '设置已保存并应用', 'success');

  } catch (error) {

    console.error('保存设置失败:', error);

    window.showNotification('错误', '保存设置失败', 'error');

  }

}


/**

 * 应用常规设置

 */

function applyGeneralSettings(settings) {

  // 更新页面标题

  const pageTitle = document.querySelector('title');

  if (pageTitle) {

    pageTitle.textContent = `${settings.clinicName}管理系统`;

  }

 

  // 更新导航栏标题（特殊处理：在Nekolinic.前面添加诊所名称）

  const navbarTitle = document.querySelector('#navbar-title, .navbar-brand');

  if (navbarTitle) {

    const statusMessage = navbarTitle.querySelector('#status-message');

    const statusText = statusMessage ? statusMessage.textContent : '';

   

    // 如果诊所名称是 'Nekolinic.' 则不显示前缀，直接显示 'Nekolinic. 设置'

    if (settings.clinicName === 'Nekolinic.') {

      navbarTitle.innerHTML = `Nekolinic. 设置<span id="status-message" class="status-message">${statusText}</span>`;

    } else if (settings.clinicName && settings.clinicName !== 'Nekolinic 诊所' && settings.clinicName !== 'Nekolinic') {

      navbarTitle.innerHTML = `${settings.clinicName} - Nekolinic. 设置<span id="status-message" class="status-message">${statusText}</span>`;

    } else {

      navbarTitle.innerHTML = `Nekolinic. 设置<span id="status-message" class="status-message">${statusText}</span>`;

    }

  }

 

  // 更新欢迎页面中的系统名称

  const welcomeText = document.querySelector('.welcome-content p');

  if (welcomeText && welcomeText.textContent.includes('Nekolinic')) {

    welcomeText.textContent = `欢迎使用 ${settings.clinicName}管理系统！`;

  }

 

  // 更新仪表板模块中的系统名称

  const dashboardTitle = document.querySelector('.dashboard-content h1');

  if (dashboardTitle && dashboardTitle.textContent.includes('Nekolinic')) {

    dashboardTitle.textContent = `欢迎使用 ${settings.clinicName}系统`;

  }

 

  // 更新关于页面中的系统信息

  const aboutSystemName = document.querySelector('#about-system-name');

  if (aboutSystemName) {

    aboutSystemName.innerHTML = `<strong>系统名称：</strong>${settings.clinicName}管理系统`;

  }

 

  const aboutSystemTitle = document.querySelector('#about-system-title');

  if (aboutSystemTitle) {

    aboutSystemTitle.textContent = settings.clinicName;

  }

 

  // 保存诊所名称到全局变量供其他模块使用

  window.clinicName = settings.clinicName;

 

  // 应用语言设置

  if (settings.language !== document.documentElement.lang) {

    document.documentElement.lang = settings.language;

    // 这里可以添加更多语言切换逻辑

  }

 

  // 应用时区设置

  if (settings.timezone) {

    // 保存时区设置供其他模块使用

    window.currentTimezone = settings.timezone;

  }

}


/**

  * 加载常规设置

  */

 function loadGeneralSettings(container) {

   try {

     const savedSettings = localStorage.getItem('generalSettings');

     if (savedSettings) {

       const settings = JSON.parse(savedSettings);

       

       // 填充表单

       const nameInput = container.querySelector('#general-section .modern-input');

       const languageSelect = container.querySelector('#general-section .modern-select:nth-of-type(1)');

       const timezoneSelect = container.querySelector('#general-section .modern-select:nth-of-type(2)');

       

       if (nameInput) nameInput.value = settings.clinicName || 'Nekolinic';

       if (languageSelect) languageSelect.value = settings.language || 'zh-CN';

       if (timezoneSelect) timezoneSelect.value = settings.timezone || 'Asia/Shanghai';

       

       // 应用设置

       applyGeneralSettings(settings);

     }

   } catch (error) {

     console.error('加载设置失败:', error);

   }

 }

 

 /**

  * 重置常规设置

  */

 function resetGeneralSettings(container) {

   try {

     // 默认设置

     const defaultSettings = {

       clinicName: 'Nekolinic',

       language: 'zh-CN',

       timezone: 'Asia/Shanghai',

       lastUpdated: new Date().toISOString()

     };

     

     // 清除localStorage中的设置

     localStorage.removeItem('generalSettings');

     

     // 重置表单

     const nameInput = container.querySelector('#general-section .modern-input');

     const languageSelect = container.querySelector('#general-section .modern-select:nth-of-type(1)');

     const timezoneSelect = container.querySelector('#general-section .modern-select:nth-of-type(2)');

     

     if (nameInput) nameInput.value = defaultSettings.clinicName;

     if (languageSelect) languageSelect.value = defaultSettings.language;

     if (timezoneSelect) timezoneSelect.value = defaultSettings.timezone;

     

     // 应用默认设置

     applyGeneralSettings(defaultSettings);

     

     window.showNotification('成功', '设置已重置为默认值', 'success');

   } catch (error) {

     console.error('重置设置失败:', error);

     window.showNotification('错误', '重置设置失败', 'error');

   }

 }


// 显示通知的辅助函数

function showNotification(title, message, type = 'info') {

  // 这里可以调用全局的通知系统

  if (window.showNotification) {

    window.showNotification(title, message, type);

  } else {

    alert(`${title}: ${message}`);

  }

}


// 导出模块

export { renderSettingsModule as default }; 