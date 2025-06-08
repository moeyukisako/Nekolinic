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
              <span>常规设置</span>
            </a>
            <a href="#appearance" class="settings-nav-item" data-section="appearance">
              <i class="fas fa-palette"></i>
              <span>外观设置</span>
            </a>
            <a href="#notifications" class="settings-nav-item" data-section="notifications">
              <i class="fas fa-bell"></i>
              <span>通知设置</span>
            </a>
            <a href="#security" class="settings-nav-item" data-section="security">
              <i class="fas fa-shield-alt"></i>
              <span>安全设置</span>
            </a>
            <a href="#backup" class="settings-nav-item" data-section="backup">
              <i class="fas fa-database"></i>
              <span>备份设置</span>
            </a>
            <a href="#about" class="settings-nav-item" data-section="about">
              <i class="fas fa-info-circle"></i>
              <span>关于系统</span>
            </a>
          </div>
          
          <!-- 设置操作按钮 -->
          <div class="settings-actions">
            <button class="btn btn-primary settings-save-btn">保存设置</button>
            <button class="btn btn-secondary settings-reset-btn">重置为默认</button>
          </div>
        </div>
        
        <div class="settings-main">
          <!-- 常规设置 -->
          <div id="general-section" class="settings-section active">
            <h3>常规设置</h3>
            <div class="setting-group">
              <label class="setting-label">诊所名称</label>
              <input type="text" class="form-control" value="Nekolinic 诊所" placeholder="请输入诊所名称">
              <small class="setting-help">显示在系统各处的诊所名称</small>
            </div>
            
            <div class="setting-group">
              <label class="setting-label">默认语言</label>
              <select class="form-control">
                <option value="zh-CN" selected>简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div class="setting-group">
              <label class="setting-label">时区设置</label>
              <select class="form-control">
                <option value="Asia/Shanghai" selected>中国标准时间 (UTC+8)</option>
                <option value="UTC">协调世界时 (UTC)</option>
              </select>
            </div>
            
            <!-- 用户账户管理 -->
            <div class="setting-group">
              <h4 class="setting-subtitle">用户账户管理</h4>
              <div class="user-account-info">
                <div class="user-info-display">
                  <div class="user-avatar-large" id="settings-user-avatar">A</div>
                  <div class="user-details">
                    <div class="user-name" id="settings-user-name">加载中...</div>
                    <div class="user-role" id="settings-user-role">加载中...</div>
                  </div>
                </div>
                <div class="user-actions">
                  <button class="btn btn-outline" id="edit-profile-btn">
                    <i class="icon-user"></i>
                    编辑个人信息
                  </button>
                  <button class="btn btn-outline" id="change-password-btn">
                    <i class="icon-lock"></i>
                    修改密码
                  </button>
                  <button class="btn btn-danger" id="logout-settings-btn">
                    <i class="icon-logout"></i>
                    退出登录
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
                <h2>Nekolinic</h2>
                <p class="version">版本 1.0.0</p>
              </div>
              
              <div class="about-details">
                <p><strong>系统名称：</strong>Nekolinic 诊所管理系统</p>
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
      if (confirm('确定要退出登录吗？')) {
        if (window.apiClient && window.apiClient.auth) {
          window.apiClient.auth.logout();
        } else {
          // 清除本地存储的认证信息
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 跳转到登录页
          window.location.href = '/frontend/index.html';
        }
      }
    }, { signal });
  }
  
  // 初始化用户信息显示
  initUserInfoDisplay(container);
  
  // 绑定保存设置按钮
  const saveBtn = container.querySelector('.settings-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showNotification('成功', '设置已保存', 'success');
    }, { signal });
  }
  
  // 绑定重置设置按钮
  const resetBtn = container.querySelector('.settings-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
        showNotification('成功', '设置已重置为默认值', 'success');
      }
    }, { signal });
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
      showNotification('成功', '背景设置已应用', 'success');
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
      showNotification('成功', '背景颜色已成功应用并保存', 'info');
    }).catch(err => {
      showNotification('错误', '保存背景颜色失败: ' + err.message, 'error');
    });
  }
}

/**
 * 处理背景图片上传
 */
function handleBackgroundImageUpload(file, container) {
  if (!file.type.startsWith('image/')) {
    showNotification('错误', '请选择有效的图片文件', 'error');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    showNotification('错误', '图片文件大小不能超过10MB', 'error');
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
      showNotification('成功', '背景图片已成功应用并保存', 'info');
    }).catch(err => {
      showNotification('错误', '保存背景图片失败: ' + err.message, 'error');
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
      showNotification('成功', '背景已重置', 'info');
    }).catch(err => {
      showNotification('错误', '重置背景设置失败: ' + err.message, 'error');
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
  
  if (userNameEl && userInfo.username) {
    userNameEl.textContent = userInfo.username;
  }
  
  if (userRoleEl && userInfo.role) {
    userRoleEl.textContent = userInfo.role === 'admin' ? '管理员' : '用户';
  }
  
  if (userAvatarEl && userInfo.username) {
    userAvatarEl.textContent = userInfo.username.charAt(0).toUpperCase();
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
          <h3 class="modal-title">编辑个人信息</h3>
          <button class="modal-close" onclick="this.closest('.modal-custom').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" class="form-control" id="edit-username" value="${userInfo.username || ''}" readonly>
            <small class="text-muted">用户名不可修改</small>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" class="form-control" id="edit-email" value="${userInfo.email || ''}" placeholder="请输入邮箱">
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input type="tel" class="form-control" id="edit-phone" value="${userInfo.phone || ''}" placeholder="请输入手机号">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-custom').remove()">取消</button>
          <button class="btn btn-primary" onclick="saveProfileChanges()">保存</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 显示修改密码模态框
 */
function showChangePasswordModal(container) {
  const modalHtml = `
    <div class="modal-custom active" id="change-password-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">修改密码</h3>
          <button class="modal-close" onclick="this.closest('.modal-custom').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>当前密码</label>
            <input type="password" class="form-control" id="current-password" placeholder="请输入当前密码">
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input type="password" class="form-control" id="new-password" placeholder="请输入新密码">
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input type="password" class="form-control" id="confirm-password" placeholder="请再次输入新密码">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-custom').remove()">取消</button>
          <button class="btn btn-primary" onclick="savePasswordChanges()">修改密码</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 保存个人信息修改
 */
window.saveProfileChanges = function() {
  const email = document.getElementById('edit-email').value;
  const phone = document.getElementById('edit-phone').value;
  
  // 这里可以调用API保存用户信息
  if (window.apiClient && window.apiClient.user) {
    window.apiClient.user.updateProfile({ email, phone })
      .then(() => {
        showNotification('成功', '个人信息已更新', 'success');
        document.getElementById('edit-profile-modal').remove();
        // 更新本地存储的用户信息
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        userInfo.email = email;
        userInfo.phone = phone;
        localStorage.setItem('user', JSON.stringify(userInfo));
      })
      .catch(err => {
        showNotification('错误', '更新失败: ' + err.message, 'error');
      });
  } else {
    showNotification('成功', '个人信息已更新', 'success');
    document.getElementById('edit-profile-modal').remove();
  }
};

/**
 * 保存密码修改
 */
window.savePasswordChanges = function() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('错误', '请填写所有字段', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('错误', '新密码和确认密码不匹配', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('错误', '新密码长度至少6位', 'error');
    return;
  }
  
  // 这里可以调用API修改密码
  if (window.apiClient && window.apiClient.user) {
    window.apiClient.user.changePassword({ currentPassword, newPassword })
      .then(() => {
        showNotification('成功', '密码已修改', 'success');
        document.getElementById('change-password-modal').remove();
      })
      .catch(err => {
        showNotification('错误', '修改失败: ' + err.message, 'error');
      });
  } else {
    showNotification('成功', '密码已修改', 'success');
    document.getElementById('change-password-modal').remove();
  }
};

// 显示通知的辅助函数
function showNotification(title, message, type = 'info') {
  // 这里可以调用全局的通知系统
  if (window.showNotification) {
    window.showNotification(title, message, type);
  } else {
    alert(`${title}: ${message}`);
  }
}