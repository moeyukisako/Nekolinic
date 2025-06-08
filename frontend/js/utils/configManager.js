/**
 * 配置管理器 - 统一管理用户设置
 * 支持本地配置文件、localStorage和服务器同步
 */

class ConfigManager {
  constructor() {
    this.configPath = '/config/settings.json';
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
      
      // 3. 从服务器加载用户设置
      await this.loadServerConfig();
      
      this.initialized = true;
      console.log('配置管理器初始化完成:', this.config);
      
      // 应用配置
      this.applyConfig();
      
    } catch (error) {
      console.error('配置管理器初始化失败:', error);
      // 使用默认配置
      this.useDefaultConfig();
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
        throw new Error('无法加载默认配置文件');
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
      background: {
        type: 'default',
        url: '',
        brightness: 1.0,
        blur: 0
      },
      notifications: {
        desktop: true,
        sound: true,
        email: false
      },
      preferences: {
        autoSave: true,
        showTooltips: true,
        sessionTimeout: 30
      },
      backup: {
        autoBackup: false,
        frequency: 'daily'
      }
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
    try {
      if (window.apiClient) {
        const response = await window.apiClient.request('/api/v1/users/settings');
        if (response.success && response.data) {
          // 转换服务器字段到前端字段
          const serverConfig = this.convertServerToClientConfig(response.data);
          this.config = this.deepMerge(this.config, serverConfig);
        }
      }
    } catch (error) {
      console.warn('从服务器加载配置失败:', error);
    }
  }

  /**
   * 转换服务器配置到客户端格式
   */
  convertServerToClientConfig(serverConfig) {
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
   * 设置配置值
   */
  async set(key, value, saveToServer = true) {
    const keys = key.split('.');
    let target = this.config;
    
    // 导航到目标对象
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    // 设置值
    target[keys[keys.length - 1]] = value;
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 保存到服务器
    if (saveToServer) {
      await this.saveToServer();
    }
    
    // 应用配置变更
    this.applyConfigChange(key, value);
    
    console.log(`配置已更新: ${key} = ${value}`);
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
    try {
      if (window.apiClient) {
        const serverConfig = this.convertClientToServerConfig(this.config);
        await window.apiClient.request('/api/v1/users/settings', {
          method: 'PUT',
          body: JSON.stringify(serverConfig)
        });
        
        if (window.showNotification) {
          const message = window.getTranslation?.('settings_saved_auto', '设置已自动保存') || '设置已自动保存';
          window.showNotification(message, 'success');
        }
      }
    } catch (error) {
      console.error('保存到服务器失败:', error);
      if (window.showNotification) {
        window.showNotification('保存设置失败', 'error');
      }
    }
  }

  /**
   * 应用配置
   */
  applyConfig() {
    // 应用主题
    this.applyTheme(this.config.theme);
    
    // 应用背景
    if (this.config.background) {
      this.applyBackground(this.config.background);
    }
  }

  /**
   * 应用配置变更
   */
  applyConfigChange(key, value) {
    if (key === 'theme') {
      this.applyTheme(value);
    } else if (key.startsWith('background.')) {
      this.applyBackground(this.config.background);
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
    if (backgroundConfig.url) {
      document.documentElement.style.setProperty('--bg-image', `url(${backgroundConfig.url})`);
      document.documentElement.style.setProperty('--bg-brightness', backgroundConfig.brightness || 1);
      document.documentElement.style.setProperty('--bg-blur', `${backgroundConfig.blur || 0}px`);
      
      const bgContainer = document.querySelector('.bg-container');
      if (bgContainer) {
        bgContainer.style.backgroundImage = `url(${backgroundConfig.url})`;
      }
    }
  }

  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 重置配置到默认值
   */
  async reset() {
    this.useDefaultConfig();
    this.saveToLocalStorage();
    await this.saveToServer();
    this.applyConfig();
    
    if (window.showNotification) {
      window.showNotification('设置已重置为默认值', 'success');
    }
  }

  /**
   * 导出配置
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  async import(configJson) {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.deepMerge(this.config, importedConfig);
      this.saveToLocalStorage();
      await this.saveToServer();
      this.applyConfig();
      
      if (window.showNotification) {
        window.showNotification('配置导入成功', 'success');
      }
    } catch (error) {
      console.error('导入配置失败:', error);
      if (window.showNotification) {
        window.showNotification('配置导入失败', 'error');
      }
    }
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager();

// 导出配置管理器
export default configManager;

// 同时挂载到window对象供其他脚本使用
window.configManager = configManager;