/**
 * 国际化配置文件
 * 支持多语言切换功能
 */

// 语言配置对象
const translations = {
  'zh-CN': {
    // 通用
    'app_title': 'Nekolinic 诊所管理系统',
    'loading': '正在加载...',
    'save': '保存',
    'cancel': '取消',
    'confirm': '确定',
    'delete': '删除',
    'edit': '编辑',
    'add': '添加',
    'search': '搜索',
    'reset': '重置',
    'close': '关闭',
    'success': '成功',
    'error': '错误',
    'warning': '警告',
    'info': '信息',
    'yes': '是',
    'no': '否',
    'back': '返回',
    'next': '下一步',
    'previous': '上一步',
    'submit': '提交',
    'clear': '清空',
    'refresh': '刷新',
    'export': '导出',
    'import': '导入',
    'print': '打印',
    'view': '查看',
    'update': '更新',
    'create': '创建',
    'remove': '移除',
    'select': '选择',
    'all': '全部',
    'none': '无',
    'apply': '应用',
    'settings': '设置',
    'help': '帮助',
    'about': '关于',
    'logout': '退出登录',
    'login': '登录',
    'register': '注册',
    'profile': '个人资料',
    'change_password': '修改密码',
    'language': '语言',
    
    // 导航菜单
    'nav_dashboard': '状态',
    'nav_patients': '患者',
    'nav_appointments': '预约',
    'nav_medical_records': '病历',
    'nav_pharmacy': '药品',
    'nav_finance': '财务',
    'nav_reports': '报表',
    'nav_settings': '设置',
    
    // 仪表盘
    'dashboard_welcome': '欢迎使用 Nekolinic 诊所管理系统！',
    'dashboard_stats': '统计信息',
    'dashboard_recent': '最近活动',
    
    // 患者管理
    'patients_title': '患者管理',
    'patients_add': '添加新患者',
    'patients_search_placeholder': '按姓名搜索患者...',
    'patients_name': '姓名',
    'patients_gender': '性别',
    'patients_birth_date': '出生日期',
    'patients_phone': '电话',
    'patients_address': '地址',
    'patients_id_card': '身份证号',
    'patients_emergency_contact': '紧急联系人',
    'patients_emergency_phone': '紧急联系电话',
    'patients_medical_history': '病史',
    'patients_allergies': '过敏史',
    'patients_actions': '操作',
    'patients_edit': '编辑患者',
    'patients_delete': '删除患者',
    'patients_view': '查看详情',
    'patients_male': '男',
    'patients_female': '女',
    'patients_save_success': '患者信息已保存',
    'patients_save_error': '保存失败',
    'patients_delete_success': '患者记录已删除',
    'patients_delete_error': '删除失败',
    'patients_name_required': '患者姓名不能为空',
    'patients_phone_invalid': '请输入有效的手机号码',
    'patients_id_card_invalid': '请输入有效的身份证号',
    
    // 病历管理
    'medical_records_title': '病历管理',
    'medical_records_add': '添加病历',
    'medical_records_patient': '患者',
    'medical_records_date': '就诊日期',
    'medical_records_diagnosis': '诊断',
    'medical_records_symptoms': '症状',
    'medical_records_treatment': '治疗方案',
    'medical_records_prescription': '处方',
    'medical_records_notes': '备注',
    'medical_records_doctor': '医生',
    'medical_records_save_success': '病历已保存',
    'medical_records_save_error': '保存失败',
    'medical_records_required_fields': '请填写就诊日期和诊断',
    
    // 药品管理
    'medicines_title': '药品管理',
    'medicines_add': '添加药品',
    'medicines_search_placeholder': '按药品名称搜索...',
    'medicines_name': '药品名称',
    'medicines_specification': '规格',
    'medicines_unit': '单位',
    'medicines_price': '单价',
    'medicines_stock': '库存',
    'medicines_manufacturer': '生产厂家',
    'medicines_batch_number': '批号',
    'medicines_expiry_date': '有效期',
    'medicines_category': '分类',
    'medicines_description': '描述',
    'medicines_actions': '操作',
    'medicines_edit': '编辑药品',
    'medicines_delete': '删除药品',
    'medicines_save_success': '药品信息已保存',
    'medicines_save_error': '保存失败',
    'medicines_delete_success': '药品已删除',
    'medicines_delete_error': '删除失败',
    'medicines_name_required': '药品名称不能为空',
    'medicines_price_invalid': '请输入有效的单价',
    
    // 财务管理
    'finance_title': '财务管理',
    'finance_income': '收入',
    'finance_expense': '支出',
    'finance_balance': '余额',
    'finance_transactions': '交易记录',
    'finance_date': '日期',
    'finance_amount': '金额',
    'finance_type': '类型',
    'finance_description': '描述',
    
    // 报表管理
    'reports_title': '报表管理',
    'reports_generate': '生成报表',
    'reports_patient_statistics': '患者统计报表',
    'reports_financial_summary': '财务汇总报表',
    'reports_medicine_inventory': '药品库存报表',
    'reports_appointment_statistics': '预约统计报表',
    'reports_date_range': '日期范围',
    'reports_from': '从',
    'reports_to': '到',
    'reports_export_pdf': '导出PDF',
    'reports_export_excel': '导出Excel',
    'reports_generate_success': '报表生成完成',
    
    // 设置
    'settings_title': '系统设置',
    'settings_general': '常规设置',
    'settings_appearance': '外观设置',
    'settings_notifications': '通知设置',
    'settings_security': '安全设置',
    'settings_backup': '备份设置',
    'settings_about': '关于系统',
    'language_settings': '语言设置',
    'select_language': '选择语言',
    'chinese': '中文',
    'english': 'English',
    'japanese': '日本語',
    'system_preferences': '系统偏好',
    'auto_save': '自动保存',
    'show_tooltips': '显示提示',
    'system_actions': '系统操作',
    'reset_to_default': '重置为默认',
    'reset_help': '将所有设置恢复为默认值',
    'theme_settings': '主题设置',
    'select_theme': '选择主题',
    'light_theme': '浅色主题',
    'dark_theme': '深色主题',
    'auto_theme': '跟随系统',
    'background_settings': '背景设置',
    'local_image': '本地图片',
    'choose_image_file': '选择图片文件',
    'preset_backgrounds': '预设背景',
    'choose_color': '选择颜色',
    'apply_color': '应用颜色',
    'preset_colors': '纯色',
    'notification_preferences': '通知偏好',
    'desktop_notifications': '桌面通知',
    'sound_notifications': '声音通知',
    'email_notifications': '邮件通知',
    'notification_frequency': '通知频率',
    'immediate': '立即',
    'hourly': '每小时',
    'daily': '每天',
    'weekly': '每周',
    'password_security': '密码安全',
    'current_password': '当前密码',
    'new_password': '新密码',
    'confirm_password': '确认密码',
    'change_password_btn': '修改密码',
    'session_management': '会话管理',
    'session_timeout': '会话超时（分钟）',
    'auto_logout': '自动登出',
    'backup_options': '备份选项',
    'auto_backup': '自动备份',
    'backup_frequency': '备份频率',
    'backup_now': '立即备份',
    'restore_backup': '恢复备份',
    'system_info': '系统信息',
    'version': '版本',
    'build_date': '构建日期',
    'settings_clinic_name': '诊所名称',
    'settings_clinic_address': '诊所地址',
    'settings_clinic_phone': '诊所电话',
    'settings_clinic_email': '诊所邮箱',
    'settings_theme': '主题',
    'settings_background': '背景',
    'settings_background_color': '背景颜色',
    'settings_background_image': '背景图片',
    'settings_language_setting': '语言设置',
    'settings_user_profile': '用户资料',
    'settings_username': '用户名',
    'settings_email': '邮箱',
    'settings_phone': '手机号',
    'settings_current_password': '当前密码',
    'settings_new_password': '新密码',
    'settings_confirm_password': '确认密码',
    'settings_save_success': '设置已保存并应用',
    'settings_save_error': '保存设置失败',
    'settings_reset_success': '设置已重置为默认值',
    'settings_reset_error': '重置设置失败',
    'settings_background_applied': '背景设置已应用',
    'settings_background_color_saved': '背景颜色已成功应用并保存',
    'settings_background_image_saved': '背景图片已成功应用并保存',
    'settings_background_reset': '背景已重置',
    'settings_profile_updated': '个人信息已更新',
    'settings_password_changed': '密码已修改',
    'settings_email_invalid': '请输入有效的邮箱地址',
    'settings_phone_invalid': '请输入有效的手机号码',
    'settings_password_required': '请填写所有字段',
    'settings_password_mismatch': '新密码和确认密码不匹配',
    'settings_password_length': '新密码长度至少6位',
    'settings_file_invalid': '请选择有效的图片文件',
    'settings_file_size_limit': '图片文件大小不能超过10MB'
    
    // 预约管理
    'appointments_title': '预约管理',
    'appointments_add': '添加预约',
    'appointments_patient': '患者',
    'appointments_doctor': '医生',
    'appointments_date': '预约日期',
    'appointments_time': '预约时间',
    'appointments_status': '状态',
    'appointments_notes': '备注',
    'appointments_pending': '待确认',
    'appointments_confirmed': '已确认',
    'appointments_completed': '已完成',
    'appointments_cancelled': '已取消',
    
    // 分页
    'pagination_previous': '上一页',
    'pagination_next': '下一页',
    'pagination_first': '首页',
    'pagination_last': '末页',
    'pagination_page': '第',
    'pagination_of': '页，共',
    'pagination_pages': '页',
    'pagination_total': '总计',
    'pagination_items': '条记录',
    
    // 模态框
    'modal_confirm_delete': '确认删除',
    'modal_delete_message': '您确定要删除这条记录吗？此操作不可撤销。',
    'modal_unsaved_changes': '未保存的更改',
    'modal_unsaved_message': '您有未保存的更改，确定要离开吗？',
    
    // 表单验证
    'validation_required': '此字段为必填项',
    'validation_email': '请输入有效的邮箱地址',
    'validation_phone': '请输入有效的手机号码',
    'validation_number': '请输入有效的数字',
    'validation_date': '请输入有效的日期',
    'validation_min_length': '最少需要{0}个字符',
    'validation_max_length': '最多允许{0}个字符',
    
    // 错误消息
    'error_network': '网络连接错误，请检查网络设置',
    'error_server': '服务器错误，请稍后重试',
    'error_unauthorized': '未授权访问，请重新登录',
    'error_forbidden': '权限不足，无法执行此操作',
    'error_not_found': '请求的资源不存在',
    'error_timeout': '请求超时，请重试',
    'error_unknown': '未知错误，请联系管理员',
    
    // 成功消息
    'success_saved': '保存成功',
    'success_deleted': '删除成功',
    'success_updated': '更新成功',
    'success_created': '创建成功',
    'success_imported': '导入成功',
    'success_exported': '导出成功'
  },
  
  'en-US': {
    // Common
    'app_title': 'Nekolinic Clinic Management System',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'reset': 'Reset',
    'close': 'Close',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'info': 'Info',
    'yes': 'Yes',
    'no': 'No',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'submit': 'Submit',
    'clear': 'Clear',
    'refresh': 'Refresh',
    'export': 'Export',
    'import': 'Import',
    'print': 'Print',
    'view': 'View',
    'update': 'Update',
    'create': 'Create',
    'remove': 'Remove',
    'select': 'Select',
    'all': 'All',
    'none': 'None',
    'apply': 'Apply',
    'settings': 'Settings',
    'help': 'Help',
    'about': 'About',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    'profile': 'Profile',
    'change_password': 'Change Password',
    'language': 'Language',
    
    // Navigation
    'nav_dashboard': 'Dashboard',
    'nav_patients': 'Patients',
    'nav_appointments': 'Appointments',
    'nav_medical_records': 'Medical Records',
    'nav_pharmacy': 'Pharmacy',
    'nav_finance': 'Finance',
    'nav_reports': 'Reports',
    'nav_settings': 'Settings',
    
    // Dashboard
    'dashboard_welcome': 'Welcome to Nekolinic Clinic Management System!',
    'dashboard_stats': 'Statistics',
    'dashboard_recent': 'Recent Activities',
    
    // Patient Management
    'patients_title': 'Patient Management',
    'patients_add': 'Add New Patient',
    'patients_search_placeholder': 'Search patients by name...',
    'patients_name': 'Name',
    'patients_gender': 'Gender',
    'patients_birth_date': 'Birth Date',
    'patients_phone': 'Phone',
    'patients_address': 'Address',
    'patients_id_card': 'ID Card',
    'patients_emergency_contact': 'Emergency Contact',
    'patients_emergency_phone': 'Emergency Phone',
    'patients_medical_history': 'Medical History',
    'patients_allergies': 'Allergies',
    'patients_actions': 'Actions',
    'patients_edit': 'Edit Patient',
    'patients_delete': 'Delete Patient',
    'patients_view': 'View Details',
    'patients_male': 'Male',
    'patients_female': 'Female',
    'patients_save_success': 'Patient information saved',
    'patients_save_error': 'Save failed',
    'patients_delete_success': 'Patient record deleted',
    'patients_delete_error': 'Delete failed',
    'patients_name_required': 'Patient name cannot be empty',
    'patients_phone_invalid': 'Please enter a valid phone number',
    'patients_id_card_invalid': 'Please enter a valid ID card number',
    
    // Medical Records
    'medical_records_title': 'Medical Records',
    'medical_records_add': 'Add Medical Record',
    'medical_records_patient': 'Patient',
    'medical_records_date': 'Visit Date',
    'medical_records_diagnosis': 'Diagnosis',
    'medical_records_symptoms': 'Symptoms',
    'medical_records_treatment': 'Treatment',
    'medical_records_prescription': 'Prescription',
    'medical_records_notes': 'Notes',
    'medical_records_doctor': 'Doctor',
    'medical_records_save_success': 'Medical record saved',
    'medical_records_save_error': 'Save failed',
    'medical_records_required_fields': 'Please fill in visit date and diagnosis',
    
    // Medicine Management
    'medicines_title': 'Medicine Management',
    'medicines_add': 'Add Medicine',
    'medicines_search_placeholder': 'Search by medicine name...',
    'medicines_name': 'Medicine Name',
    'medicines_specification': 'Specification',
    'medicines_unit': 'Unit',
    'medicines_price': 'Price',
    'medicines_stock': 'Stock',
    'medicines_manufacturer': 'Manufacturer',
    'medicines_batch_number': 'Batch Number',
    'medicines_expiry_date': 'Expiry Date',
    'medicines_category': 'Category',
    'medicines_description': 'Description',
    'medicines_actions': 'Actions',
    'medicines_edit': 'Edit Medicine',
    'medicines_delete': 'Delete Medicine',
    'medicines_save_success': 'Medicine information saved',
    'medicines_save_error': 'Save failed',
    'medicines_delete_success': 'Medicine deleted',
    'medicines_delete_error': 'Delete failed',
    'medicines_name_required': 'Medicine name cannot be empty',
    'medicines_price_invalid': 'Please enter a valid price',
    
    // Finance Management
    'finance_title': 'Finance Management',
    'finance_income': 'Income',
    'finance_expense': 'Expense',
    'finance_balance': 'Balance',
    'finance_transactions': 'Transactions',
    'finance_date': 'Date',
    'finance_amount': 'Amount',
    'finance_type': 'Type',
    'finance_description': 'Description',
    
    // Reports
    'reports_title': 'Reports Management',
    'reports_generate': 'Generate Report',
    'reports_patient_statistics': 'Patient Statistics Report',
    'reports_financial_summary': 'Financial Summary Report',
    'reports_medicine_inventory': 'Medicine Inventory Report',
    'reports_appointment_statistics': 'Appointment Statistics Report',
    'reports_date_range': 'Date Range',
    'reports_from': 'From',
    'reports_to': 'To',
    'reports_export_pdf': 'Export PDF',
    'reports_export_excel': 'Export Excel',
    'reports_generate_success': 'Report generated successfully',
    
    // Settings
    'settings_title': 'System Settings',
    'settings_general': 'General Settings',
    'settings_appearance': 'Appearance Settings',
    'settings_notifications': 'Notification Settings',
    'settings_security': 'Security Settings',
    'settings_backup': 'Backup Settings',
    'settings_about': 'About System',
    'language_settings': 'Language Settings',
    'select_language': 'Select Language',
    'chinese': '中文',
    'english': 'English',
    'japanese': '日本語',
    'system_preferences': 'System Preferences',
    'auto_save': 'Auto Save',
    'show_tooltips': 'Show Tooltips',
    'system_actions': 'System Actions',
    'reset_to_default': 'Reset to Default',
    'reset_help': 'Reset all settings to default values',
    'theme_settings': 'Theme Settings',
    'select_theme': 'Select Theme',
    'light_theme': 'Light Theme',
    'dark_theme': 'Dark Theme',
    'auto_theme': 'Follow System',
    'background_settings': 'Background Settings',
    'local_image': 'Local Image',
    'choose_image_file': 'Choose Image File',
    'preset_backgrounds': 'Preset Backgrounds',
    'choose_color': 'Choose Color',
    'apply_color': 'Apply Color',
    'preset_colors': 'Solid Colors',
    'notification_preferences': 'Notification Preferences',
    'desktop_notifications': 'Desktop Notifications',
    'sound_notifications': 'Sound Notifications',
    'email_notifications': 'Email Notifications',
    'notification_frequency': 'Notification Frequency',
    'immediate': 'Immediate',
    'hourly': 'Hourly',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'password_security': 'Password Security',
    'current_password': 'Current Password',
    'new_password': 'New Password',
    'confirm_password': 'Confirm Password',
    'change_password_btn': 'Change Password',
    'session_management': 'Session Management',
    'session_timeout': 'Session Timeout (minutes)',
    'auto_logout': 'Auto Logout',
    'backup_options': 'Backup Options',
    'auto_backup': 'Auto Backup',
    'backup_frequency': 'Backup Frequency',
    'backup_now': 'Backup Now',
    'restore_backup': 'Restore Backup',
    'system_info': 'System Information',
    'version': 'Version',
    'build_date': 'Build Date',
    'settings_clinic_name': 'Clinic Name',
    'settings_clinic_address': 'Clinic Address',
    'settings_clinic_phone': 'Clinic Phone',
    'settings_clinic_email': 'Clinic Email',
    'settings_background': 'Background',
    'settings_background_color': 'Background Color',
    'settings_background_image': 'Background Image',
    'settings_language_setting': 'Language Settings',
    'settings_user_profile': 'User Profile',
    'settings_username': 'Username',
    'settings_email': 'Email',
    'settings_phone': 'Phone',
    'settings_save_success': 'Settings saved and applied',
    'settings_save_error': 'Failed to save settings',
    'settings_reset_success': 'Settings reset to default',
    'settings_reset_error': 'Failed to reset settings',
    'settings_background_applied': 'Background settings applied',
    'settings_background_color_saved': 'Background color applied and saved successfully',
    'settings_background_image_saved': 'Background image applied and saved successfully',
    'settings_background_reset': 'Background reset',
    'settings_profile_updated': 'Profile information updated',
    'settings_password_changed': 'Password changed',
    'settings_email_invalid': 'Please enter a valid email address',
    'settings_phone_invalid': 'Please enter a valid phone number',
    'settings_password_required': 'Please fill in all fields',
    'settings_password_mismatch': 'New password and confirm password do not match',
    'settings_password_length': 'New password must be at least 6 characters',
    'settings_file_invalid': 'Please select a valid image file',
    'settings_file_size_limit': 'Image file size cannot exceed 10MB'
    
    // Appointments
    'appointments_title': 'Appointment Management',
    'appointments_add': 'Add Appointment',
    'appointments_patient': 'Patient',
    'appointments_doctor': 'Doctor',
    'appointments_date': 'Appointment Date',
    'appointments_time': 'Appointment Time',
    'appointments_status': 'Status',
    'appointments_notes': 'Notes',
    'appointments_pending': 'Pending',
    'appointments_confirmed': 'Confirmed',
    'appointments_completed': 'Completed',
    'appointments_cancelled': 'Cancelled',
    
    // Pagination
    'pagination_previous': 'Previous',
    'pagination_next': 'Next',
    'pagination_first': 'First',
    'pagination_last': 'Last',
    'pagination_page': 'Page',
    'pagination_of': 'of',
    'pagination_pages': 'pages',
    'pagination_total': 'Total',
    'pagination_items': 'items',
    
    // Modals
    'modal_confirm_delete': 'Confirm Delete',
    'modal_delete_message': 'Are you sure you want to delete this record? This action cannot be undone.',
    'modal_unsaved_changes': 'Unsaved Changes',
    'modal_unsaved_message': 'You have unsaved changes. Are you sure you want to leave?',
    
    // Form Validation
    'validation_required': 'This field is required',
    'validation_email': 'Please enter a valid email address',
    'validation_phone': 'Please enter a valid phone number',
    'validation_number': 'Please enter a valid number',
    'validation_date': 'Please enter a valid date',
    'validation_min_length': 'Minimum {0} characters required',
    'validation_max_length': 'Maximum {0} characters allowed',
    
    // Error Messages
    'error_network': 'Network connection error, please check your network settings',
    'error_server': 'Server error, please try again later',
    'error_unauthorized': 'Unauthorized access, please login again',
    'error_forbidden': 'Insufficient permissions to perform this action',
    'error_not_found': 'Requested resource not found',
    'error_timeout': 'Request timeout, please try again',
    'error_unknown': 'Unknown error, please contact administrator',
    
    // Success Messages
    'success_saved': 'Saved successfully',
    'success_deleted': 'Deleted successfully',
    'success_updated': 'Updated successfully',
    'success_created': 'Created successfully',
    'success_imported': 'Imported successfully',
    'success_exported': 'Exported successfully'
  }
};

// 当前语言设置
let currentLanguage = localStorage.getItem('language') || 'zh-CN';

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {Array} params - 参数数组，用于替换占位符
 * @returns {string} 翻译后的文本
 */
export function t(key, params = []) {
  const translation = translations[currentLanguage]?.[key] || translations['zh-CN']?.[key] || key;
  
  // 替换参数占位符 {0}, {1}, etc.
  if (params.length > 0) {
    return translation.replace(/\{(\d+)\}/g, (match, index) => {
      return params[parseInt(index)] || match;
    });
  }
  
  return translation;
}

/**
 * 设置当前语言
 * @param {string} language - 语言代码
 */
export function setLanguage(language) {
  if (translations[language]) {
    currentLanguage = language;
    localStorage.setItem('language', language);
    
    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language }
    }));
    
    return true;
  }
  return false;
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * 获取支持的语言列表
 * @returns {Array} 支持的语言列表
 */
export function getSupportedLanguages() {
  return [
    { code: 'zh-CN', name: '中文', nativeName: '中文' },
    { code: 'en-US', name: 'English', nativeName: 'English' }
  ];
}

/**
 * 翻译页面中所有带有 data-i18n 属性的元素
 */
export function translatePage() {
  // 翻译带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);
    
    if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
      element.placeholder = translation;
    } else if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else {
      element.textContent = translation;
    }
  });
  
  // 翻译带有 data-i18n-title 属性的元素的 title
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = t(key);
  });
  
  // 更新页面标题
  document.title = t('app_title');
  
  // 更新 HTML lang 属性
  document.documentElement.lang = currentLanguage;
}

/**
 * 初始化国际化系统
 */
export function initI18n() {
  // 监听语言变更事件
  window.addEventListener('languageChanged', () => {
    translatePage();
  });
  
  // 初始翻译页面
  translatePage();
}

// 导出默认对象
export default {
  t,
  setLanguage,
  getCurrentLanguage,
  getSupportedLanguages,
  translatePage,
  initI18n
};