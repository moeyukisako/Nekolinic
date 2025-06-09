/**
 * 配置管理器 - 统一管理用户设置
 * 支持本地配置文件、localStorage和服务器同步
 */
class ConfigManager {
  constructor() {
    this.configPath = '/config/settings.json';
    // 修正: 确保键名一致
    this.localStorageKey = 'userSettings'; 
    this.config = {};
    this.initialized = false;
  }

  /**
   * 初始化配置管理器
   */
  async init() {
    try {
      // 1. 加载默认配置文件
      await this.loadDefaultConfig();
      
      // 2. 合并localStorage中的设置
      this.mergeLocalStorageConfig();
      
      // 3. 从服务器加载用户设置 (会覆盖本地和默认)
      await this.loadServerConfig();
      
      this.initialized = true;
      console.log('配置管理器初始化完成:', this.config);
      
      // 4. 应用最终合并的配置
      // applyConfig 内部会处理主题、背景和语言的初始设置
      this.applyConfig();
      
      // 修正: 移除这里多余且错误的 setLanguage 调用，避免无限刷新
      
    } catch (error) {
      console.error('配置管理器初始化失败:', error);
      // 如果初始化失败，使用内置的默认配置并应用它
      this.useDefaultConfig();
      this.applyConfig();
    }
  }

  /**
   * 加载默认配置文件
   */
  async loadDefaultConfig() {
    try {
      const response = await fetch(this.configPath);
      if (response.ok) {
        this.config = await response.json();
      } else {
        throw new Error(`无法加载默认配置文件: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('加载默认配置失败，使用内置默认配置:', error);
      this.useDefaultConfig();
    }
  }

  /**
   * 使用内置默认配置
   */
  useDefaultConfig() {
    this.config = {
      theme: 'auto',
      language: 'zh-CN',
      background: { type: 'default', url: '', brightness: 1.0, blur: 0 },
      notifications: { desktop: true, sound: true, email: false },
      preferences: { autoSave: true, showTooltips: true, sessionTimeout: 30 },
      backup: { autoBackup: false, frequency: 'daily' }
    };
  }

  /**
   * 合并localStorage中的配置
   */
  mergeLocalStorageConfig() {
    try {
      const localSettings = localStorage.getItem(this.localStorageKey);
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        // 使用深度合并，确保嵌套对象也能正确合并
        this.config = this.deepMerge(this.config, parsedSettings);
      }
    } catch (error) {
      console.warn('合并localStorage配置失败:', error);
    }
  }

  /**
   * 从服务器加载用户配置
   */
  async loadServerConfig() {
    // 检查 apiClient 是否存在且用户已登录 (通过token判断)
    if (window.apiClient && localStorage.getItem('accessToken')) {
        try {
            const response = await window.apiClient.request('/api/v1/users/settings');
            if (response.success && response.data) {
                const serverConfig = this.convertServerToClientConfig(response.data);
                this.config = this.deepMerge(this.config, serverConfig);
            }
        } catch (error) {
            // 如果是401等认证错误，则静默失败，因为用户可能未登录
            if (error.status !== 401) {
                console.warn('从服务器加载配置失败:', error);
            }
        }
    }
  }

  /**
   * 转换服务器配置到客户端格式
   */
  convertServerToClientConfig(serverConfig) {
    // ... (此部分无需修改)
    return {
      theme: serverConfig.theme || this.config.theme,
      language: serverConfig.language || this.config.language,
      notifications: {
        desktop: serverConfig.desktopNotifications ?? this.config.notifications.desktop,
        sound: serverConfig.soundNotifications ?? this.config.notifications.sound,
        email: serverConfig.emailNotifications ?? this.config.notifications.email
      },
      preferences: {
        autoSave: serverConfig.autoSave ?? this.config.preferences.autoSave,
        showTooltips: serverConfig.showTooltips ?? this.config.preferences.showTooltips,
        sessionTimeout: serverConfig.sessionTimeout || this.config.preferences.sessionTimeout
      },
      backup: {
        autoBackup: serverConfig.autoBackup ?? this.config.backup.autoBackup,
        frequency: serverConfig.backupFrequency || this.config.backup.frequency
      }
    };
  }

  /**
   * 转换客户端配置到服务器格式
   */
  convertClientToServerConfig(clientConfig) {
    // ... (此部分无需修改)
    return {
      theme: clientConfig.theme,
      language: clientConfig.language,
      desktopNotifications: clientConfig.notifications?.desktop,
      soundNotifications: clientConfig.notifications?.sound,
      emailNotifications: clientConfig.notifications?.email,
      autoSave: clientConfig.preferences?.autoSave,
      showTooltips: clientConfig.preferences?.showTooltips,
      sessionTimeout: clientConfig.preferences?.sessionTimeout,
      autoBackup: clientConfig.backup?.autoBackup,
      backupFrequency: clientConfig.backup?.frequency
    };
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    return value;
  }
  
  /**
   * 修正: 一个健壮的、支持嵌套的 set 方法
   * @param {string} key - 配置项的键 (e.g., 'language', 'background.blur')
   * @param {*} value - 配置项的值
   * @param {boolean} immediate - 是否立即应用设置
   */
  async set(key, value, immediate = false) {
      // 使用辅助函数安全地设置嵌套属性
      this._setProperty(this.config, key, value);

      // 如果是主题设置且需要立即应用，则立即应用主题
      if (immediate && key === 'theme') {
        this.applyTheme(value);
      }

      // 将完整的配置对象保存到 localStorage
      this.saveToLocalStorage();

      // 将完整的配置对象保存到服务器
      await this.saveToServer();
  }

  // 辅助方法：用于设置对象的嵌套属性
  _setProperty(obj, path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const parent = keys.reduce((acc, currentKey) => {
          if (typeof acc[currentKey] === 'undefined') {
              acc[currentKey] = {};
          }
          return acc[currentKey];
      }, obj);
      parent[lastKey] = value;
  }

  /**
   * 保存到localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('保存到localStorage失败:', error);
    }
  }

  /**
   * 保存到服务器
   */
  async saveToServer() {
    if (window.apiClient && localStorage.getItem('accessToken')) {
        try {
            const serverConfig = this.convertClientToServerConfig(this.config);
            await window.apiClient.request('/api/v1/users/settings', {
                method: 'PUT',
                body: JSON.stringify(serverConfig)
            });
        } catch (error) {
            console.error('保存到服务器失败:', error);
        }
    }
  }

  /**
   * 应用所有当前配置
   */
  applyConfig() {
    if (!this.initialized) return;
    
    this.applyTheme(this.get('theme', 'auto'));
    
    const background = this.get('background');
    if (background) {
      this.applyBackground(background);
    }
    
    const language = this.get('language');
    if (language && window.setLanguage) {
      // 调用 setLanguage，并传入 true 跳过保存，避免在初始化时发生循环调用
      window.setLanguage(language, true); 
    }
  }

  /**
   * 应用主题
   */
  applyTheme(theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (theme !== 'auto') {
      document.body.classList.add(`theme-${theme}`);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
  }

  /**
   * 应用背景设置
   */
  applyBackground(backgroundConfig) {
    // ... (此部分无需修改)
    const url = backgroundConfig.url;
    const brightness = backgroundConfig.brightness || 1;
    const blur = backgroundConfig.blur || 0;

    const bgContainer = document.querySelector('.bg-container');
    if(bgContainer) {
        if (url) {
            bgContainer.style.backgroundImage = `url('${url}')`;
            bgContainer.style.filter = `brightness(${brightness}) blur(${blur}px)`;
            bgContainer.style.display = 'block';
        } else {
            bgContainer.style.backgroundImage = 'none';
        }
    }
  }

  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    // ... (此部分无需修改)
    const result = { ...target };
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = this.deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
      }
    }
    return result;
  }
}

// 创建并导出全局实例
const configManager = new ConfigManager();
window.configManager = configManager;

export default configManager;