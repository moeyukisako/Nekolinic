// 国际化翻译文件
const translations = {
  'zh-CN': {
    // 应用标题
    app_title: 'Nekolinic 诊所管理系统',
    
    // 导航菜单
    nav_dashboard: '状态',
    nav_patients: '患者',
    nav_appointments: '预约',
    nav_medical_records: '病历',
    nav_pharmacy: '药品',
    nav_prescriptions: '处方',
    nav_finance: '财务',
    nav_reports: '报表',
    nav_settings: '设置',
    
    // 通用
    loading: '正在加载...',
    save: '保存',
    cancel: '取消',
    close: '关闭',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    actions: '操作',
    created_time: '创建时间',
    
    // 仪表盘
    dashboard: '仪表板',
    welcome: '欢迎',
    overview: '概览',
    welcome_to_nekolinic: '欢迎使用 Nekolinic 系统',
    select_module_from_menu: '请从左侧菜单选择一个模块开始操作',
    dashboard_welcome: '欢迎使用 Nekolinic 诊所管理系统！',
    
    // 患者管理
    patient_id: 'ID',
    patient_name: '姓名',
    patient_gender: '性别',
    patient_birth_date: '出生日期',
    patient_phone: '电话',
    patient_contact: '联系电话',
    patient_address: '住址',
    add_new_patient: '添加新患者',
    edit_patient_info: '编辑患者信息',
    patient_details: '患者详情',
    search_patients_placeholder: '按姓名搜索患者...',
    no_patients_found: '未找到患者记录',
    loading_failed: '加载失败',
    get_patient_info_failed: '获取患者信息失败',
    patient_name_required: '患者姓名不能为空',
    
    // 性别
    gender_male: '男',
    gender_female: '女',
    gender_other: '其他',
    
    // 年龄
    age_suffix: '岁',
    
    // 操作
    action_view: '查看',
    action_edit: '编辑',
    action_delete: '删除',
    action_medical_records: '病历',
    
    // 病历管理
    visit_date: '就诊日期',
    chief_complaint: '主诉',
    chief_complaint_placeholder: '请描述患者的主要症状...',
    present_illness: '现病史',
    present_illness_placeholder: '请描述现病史...',
    past_history: '既往史',
    past_history_placeholder: '请描述既往病史...',
    vital_signs: '生命体征',
    temperature: '体温(°C)',
    temperature_placeholder: '36.5',
    pulse: '脉搏(次/分)',
    pulse_placeholder: '80',
    respiratory_rate: '呼吸(次/分)',
    respiratory_rate_placeholder: '20',
    blood_pressure: '血压(mmHg)',
    blood_pressure_placeholder: '120/80',
    physical_examination: '体格检查',
    physical_examination_placeholder: '请描述体格检查结果...',
    diagnosis: '诊断',
    diagnosis_placeholder: '请输入诊断结果...',
    treatment_plan: '治疗方案',
    treatment_plan_placeholder: '请描述治疗方案...',
    prescription: '处方',
    prescription_placeholder: '请输入处方信息...',
    notes: '备注',
    notes_placeholder: '其他备注信息...',
    
    // 设置
    settings_general: '常规设置',
    settings_appearance: '外观设置',
    settings_notifications: '通知设置',
    settings_security: '安全设置',
    settings_backup: '备份设置',
    settings_about: '关于系统',
    save_settings: '保存设置',
    reset_to_default: '重置为默认',
    clinic_name: '名称',
    enter_clinic_name: '请输入名称',
    clinic_name_help: '显示在系统各处的名称',
    language: '语言',
    chinese_simplified: '简体中文',
    english: 'English',
    timezone_setting: '时区设置',
    china_standard_time: '中国标准时间 (UTC+8)',
    utc_time: '协调世界时 (UTC)',
    
    // 病历管理
    select_patient: '请选择患者',
    select_patient_help: '从左侧列表中选择一个患者来查看或编辑病历',
    
    // 药品管理
    add_new_medicine: '添加新药品',
    edit_medicine: '编辑药品',
    medicine_name: '药品名称',
    medicine_code: '药品代码',
    specification: '规格',
    manufacturer: '生产厂家',
    current_stock: '当前库存',
    unit: '单位',
    unit_price: '单价（元）',
    cost_price: '成本价（元）',
    unit_box: '盒',
    unit_bottle: '瓶',
    unit_tablet: '片',
    unit_tube: '支',
    unit_bag: '袋',
    auto_generate_placeholder: '留空自动生成',
    search_medicine_placeholder: '按药品名称、厂家搜索...',
    
    // 处方管理
    prescription_id: '处方编号',
    prescription_date: '开具日期',
    dispensing_status: '发药状态',
    add_new_prescription: '开具新处方',
    search_prescription_placeholder: '按患者姓名、医生姓名搜索...',
    prescription_details: '处方明细',
    dispense: '发药',
    patient: '患者',
    doctor: '医生',
    no_medicine_found: '未找到相关药品信息',
    medicine_name_required: '药品名称不能为空',
    valid_unit_price_required: '请输入有效的单价',
    medicine_updated: '药品信息已更新',
    medicine_added: '药品已添加',
    operation_failed: '操作失败',
    get_medicine_failed: '获取药品信息失败',
    select_patient: '请选择患者',
    select_doctor: '请选择医生',
    add_medication: '添加药品',
    prescription_notes_placeholder: '处方备注信息...',
    modal_title: '标题',
    close: '关闭',
    cancel: '取消',
    confirm: '确认',
    medication_details: '药品明细'
    
    // 财务管理
    today_income: '今日收入',
    monthly_income: '本月收入',
    pending_bills: '待收账单',
    total_income: '总收入',
    billing_management: '账单管理',
    income_statistics: '收入统计',
    expense_management: '支出管理',
    billing_list: '账单列表',
    no_billing_data: '暂无账单数据',
    income_chart_developing: '收入统计图表开发中...',
    expense_feature_developing: '支出管理功能开发中...',
    
    // 报告管理
    patient_statistics_report: '患者统计报表',
    patient_statistics_desc: '患者数量、年龄分布、就诊频次等统计',
    medical_record_statistics_report: '病历统计报表',
    medical_record_statistics_desc: '病历数量、疾病分类、治疗效果等统计',
    medicine_statistics_report: '药品统计报表',
    medicine_statistics_desc: '药品库存、使用量、过期提醒等统计',
    finance_statistics_report: '财务统计报表',
    finance_statistics_desc: '收入支出、利润分析、账单统计等',
    appointment_statistics_report: '预约统计报表',
    appointment_statistics_desc: '预约数量、时间分布、取消率等统计',
    workload_statistics_report: '工作量统计报表',
    workload_statistics_desc: '医生工作量、科室效率、时间分析等',
    generate_report: '生成报表',
    report_history: '报表历史',
    clear_history: '清理历史',
    report_name: '报表名称',
    generation_time: '生成时间',
    file_size: '文件大小',
    status: '状态',
    no_report_history: '暂无报表历史',
    
    // 通知消息
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    
    // 用户账户管理
    'settings_profile_updated': '个人信息已更新',
    'settings_user_account_management': '用户账户管理',
    'settings_loading': '加载中...',
    'settings_edit_profile': '编辑个人信息',
    'settings_change_password': '修改密码',
    'settings_logout': '退出登录',
    'settings_not_logged_in': '未登录用户',
    'settings_admin': '管理员',
    'settings_user': '用户',
    'settings_guest': '访客',
    'settings_not_set': '未设置',
    'settings_username_readonly': '用户名不可修改',
    'settings_email': '邮箱',
    'settings_phone': '手机号',
    'settings_email_placeholder': '请输入邮箱',
    'settings_phone_placeholder': '请输入手机号',
    'settings_current_password': '当前密码',
    'settings_new_password': '新密码',
    'settings_confirm_password': '确认新密码',
    'settings_current_password_placeholder': '请输入当前密码',
    'settings_new_password_placeholder': '请输入新密码',
    'settings_confirm_password_placeholder': '请再次输入新密码',
    'settings_invalid_email': '请输入有效的邮箱地址',
    'settings_invalid_phone': '请输入有效的手机号码',
    'system_actions': '系统操作',
    'reset_help': '将所有设置恢复为默认值',
    'language_settings': '语言设置',
    'select_language': '选择语言',
    'chinese': '中文',
    'english': 'English',
    'japanese': '日本語',
    'system_preferences': '系统偏好',
    'auto_save': '自动保存',
    'show_tooltips': '显示提示',
    'theme_settings': '主题设置',
    'select_theme': '选择主题',
    'light_theme': '浅色主题',
    'dark_theme': '深色主题',
    'auto_theme': '跟随系统',
    'background_settings': '背景设置',
    'local_image': '本地图片',
    'choose_image_file': '选择图片文件',
    'preset_backgrounds': '预设背景',
    'reset_background': '重置背景',
    'notification_preferences': '通知偏好',
    'desktop_notifications': '桌面通知',
    'sound_notifications': '声音通知',
    'email_notifications': '邮件通知',
    'password_settings': '密码设置',
    'current_password': '当前密码',
    'new_password': '新密码',
    'confirm_password': '确认密码',
    'change_password': '修改密码',
    'session_settings': '会话设置',
    'session_timeout': '会话超时（分钟）',
    'backup_options': '备份选项',
    'auto_backup': '自动备份',
    'backup_frequency': '备份频率',
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月',
    'backup_now': '立即备份',
    'restore_backup': '恢复备份',
    'system_info': '系统信息',
    'system_name': '系统名称',
    'version': '版本',
    'build_date': '构建日期',
    'choose_color': '选择颜色',
    'apply_color': '应用颜色',
    'preset_colors': '预设颜色',
    'settings_saved_auto': '设置已自动保存',
    'language_changed_success': '语言切换成功',
    'language_change_failed': '语言切换失败',
    'theme_saved': '主题设置已保存'
  },
  
  'en-US': {
    // 应用标题
    app_title: 'Nekolinic Clinic Management System',
    
    // 导航菜单
    nav_dashboard: 'Dashboard',
    nav_patients: 'Patients',
    nav_appointments: 'Appointments',
    nav_medical_records: 'Medical Records',
    nav_pharmacy: 'Pharmacy',
    nav_prescriptions: 'Prescriptions',
    nav_finance: 'Finance',
    nav_reports: 'Reports',
    nav_settings: 'Settings',
    
    // 通用
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    actions: 'Actions',
    created_time: 'Created Time',
    
    // 仪表盘
    dashboard: 'Dashboard',
    welcome: 'Welcome',
    overview: 'Overview',
    welcome_to_nekolinic: 'Welcome to Nekolinic System',
    select_module_from_menu: 'Please select a module from the left menu to start',
    dashboard_welcome: 'Welcome to Nekolinic Clinic Management System!',
    
    // 患者管理
    patient_id: 'ID',
    patient_name: 'Name',
    patient_gender: 'Gender',
    patient_birth_date: 'Birth Date',
    patient_phone: 'Phone',
    patient_contact: 'Contact Phone',
    patient_address: 'Address',
    add_new_patient: 'Add New Patient',
    edit_patient_info: 'Edit Patient Information',
    patient_details: 'Patient Details',
    search_patients_placeholder: 'Search patients by name...',
    no_patients_found: 'No patient records found',
    loading_failed: 'Loading failed',
    get_patient_info_failed: 'Failed to get patient information',
    patient_name_required: 'Patient name is required',
    
    // 性别
    gender_male: 'Male',
    gender_female: 'Female',
    gender_other: 'Other',
    
    // 年龄
    age_suffix: ' years old',
    
    // 操作
    action_view: 'View',
    action_edit: 'Edit',
    action_delete: 'Delete',
    action_medical_records: 'Medical Records',
    
    // 病历管理
    visit_date: 'Visit Date',
    chief_complaint: 'Chief Complaint',
    chief_complaint_placeholder: 'Please describe the patient\'s main symptoms...',
    present_illness: 'Present Illness',
    present_illness_placeholder: 'Please describe the present illness...',
    past_history: 'Past History',
    past_history_placeholder: 'Please describe the past medical history...',
    vital_signs: 'Vital Signs',
    temperature: 'Temperature(°C)',
    temperature_placeholder: '36.5',
    pulse: 'Pulse(bpm)',
    pulse_placeholder: '80',
    respiratory_rate: 'Respiratory Rate(bpm)',
    respiratory_rate_placeholder: '20',
    blood_pressure: 'Blood Pressure(mmHg)',
    blood_pressure_placeholder: '120/80',
    physical_examination: 'Physical Examination',
    physical_examination_placeholder: 'Please describe the physical examination results...',
    diagnosis: 'Diagnosis',
    diagnosis_placeholder: 'Please enter the diagnosis...',
    treatment_plan: 'Treatment Plan',
    treatment_plan_placeholder: 'Please describe the treatment plan...',
    prescription: 'Prescription',
    prescription_placeholder: 'Please enter prescription information...',
    notes: 'Notes',
    notes_placeholder: 'Other notes...',
    
    // 设置
    settings_general: 'General Settings',
    settings_appearance: 'Appearance Settings',
    settings_notifications: 'Notification Settings',
    settings_security: 'Security Settings',
    settings_backup: 'Backup Settings',
    settings_about: 'About System',
    save_settings: 'Save Settings',
    reset_to_default: 'Reset to Default',
    clinic_name: 'Clinic Name',
    enter_clinic_name: 'Enter clinic name',
    clinic_name_help: 'Name displayed throughout the system',
    language: 'Language',
    chinese_simplified: '简体中文',
    english: 'English',
    timezone_setting: 'Timezone Setting',
    china_standard_time: 'China Standard Time (UTC+8)',
    utc_time: 'Coordinated Universal Time (UTC)',
    
    // 病历管理
    select_patient: 'Please Select a Patient',
    select_patient_help: 'Select a patient from the left list to view or edit medical records',
    
    // 药品管理
    add_new_medicine: 'Add New Medicine',
    edit_medicine: 'Edit Medicine',
    medicine_name: 'Medicine Name',
    medicine_code: 'Medicine Code',
    specification: 'Specification',
    manufacturer: 'Manufacturer',
    current_stock: 'Current Stock',
    unit: 'Unit',
    unit_price: 'Unit Price (¥)',
    cost_price: 'Cost Price (¥)',
    unit_box: 'Box',
    unit_bottle: 'Bottle',
    unit_tablet: 'Tablet',
    unit_tube: 'Tube',
    unit_bag: 'Bag',
    auto_generate_placeholder: 'Leave blank to auto-generate',
    search_medicine_placeholder: 'Search by medicine name, manufacturer...',
    
    // 处方管理
    prescription_id: 'Prescription ID',
    prescription_date: 'Prescription Date',
    dispensing_status: 'Dispensing Status',
    add_new_prescription: 'Create New Prescription',
    search_prescription_placeholder: 'Search by patient name, doctor name...',
    prescription_details: 'Prescription Details',
    dispense: 'Dispense',
    patient: 'Patient',
    doctor: 'Doctor',
    no_medicine_found: 'No medicine information found',
    medicine_name_required: 'Medicine name is required',
    valid_unit_price_required: 'Please enter a valid unit price',
    medicine_updated: 'Medicine information updated',
    medicine_added: 'Medicine added',
    operation_failed: 'Operation failed',
    get_medicine_failed: 'Failed to get medicine information',
    select_patient: 'Please select a patient',
    select_doctor: 'Please select a doctor',
    add_medication: 'Add Medication',
    prescription_notes_placeholder: 'Prescription notes...',
    modal_title: 'Title',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    medication_details: 'Medication Details'
    
    // 财务管理
    today_income: 'Today\'s Income',
    monthly_income: 'Monthly Income',
    pending_bills: 'Pending Bills',
    total_income: 'Total Income',
    billing_management: 'Billing Management',
    income_statistics: 'Income Statistics',
    expense_management: 'Expense Management',
    billing_list: 'Billing List',
    no_billing_data: 'No billing data',
    income_chart_developing: 'Income statistics chart under development...',
    expense_feature_developing: 'Expense management feature under development...',
    
    // 报告管理
    patient_statistics_report: 'Patient Statistics Report',
    patient_statistics_desc: 'Patient count, age distribution, visit frequency statistics',
    medical_record_statistics_report: 'Medical Record Statistics Report',
    medical_record_statistics_desc: 'Medical record count, disease classification, treatment effectiveness statistics',
    medicine_statistics_report: 'Medicine Statistics Report',
    medicine_statistics_desc: 'Medicine inventory, usage, expiration reminder statistics',
    finance_statistics_report: 'Finance Statistics Report',
    finance_statistics_desc: 'Income and expenses, profit analysis, billing statistics',
    appointment_statistics_report: 'Appointment Statistics Report',
    appointment_statistics_desc: 'Appointment count, time distribution, cancellation rate statistics',
    workload_statistics_report: 'Workload Statistics Report',
    workload_statistics_desc: 'Doctor workload, department efficiency, time analysis',
    generate_report: 'Generate Report',
    report_history: 'Report History',
    clear_history: 'Clear History',
    report_name: 'Report Name',
    generation_time: 'Generation Time',
    file_size: 'File Size',
    status: 'Status',
    no_report_history: 'No report history',
    
    // 通知消息
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    
    // 用户账户管理
    'settings_profile_updated': 'Profile information updated',
    'settings_user_account_management': 'User Account Management',
    'settings_loading': 'Loading...',
    'settings_edit_profile': 'Edit Profile',
    'settings_change_password': 'Change Password',
    'settings_logout': 'Logout',
    'settings_not_logged_in': 'Not logged in',
    'settings_admin': 'Administrator',
    'settings_user': 'User',
    'settings_guest': 'Guest',
    'settings_not_set': 'Not set',
    'settings_username_readonly': 'Username cannot be modified',
    'settings_email': 'Email',
    'settings_phone': 'Phone',
    'settings_email_placeholder': 'Please enter email',
    'settings_phone_placeholder': 'Please enter phone number',
    'settings_current_password': 'Current Password',
    'settings_new_password': 'New Password',
    'settings_confirm_password': 'Confirm Password',
    'settings_current_password_placeholder': 'Please enter current password',
    'settings_new_password_placeholder': 'Please enter new password',
    'settings_confirm_password_placeholder': 'Please enter new password again',
    'settings_invalid_email': 'Please enter a valid email address',
    'settings_invalid_phone': 'Please enter a valid phone number',
    'system_actions': 'System Actions',
    'reset_help': 'Reset all settings to default values',
    'language_settings': 'Language Settings',
    'select_language': 'Select Language',
    'chinese': '中文',
    'english': 'English',
    'japanese': '日本語',
    'system_preferences': 'System Preferences',
    'auto_save': 'Auto Save',
    'show_tooltips': 'Show Tooltips',
    'theme_settings': 'Theme Settings',
    'select_theme': 'Select Theme',
    'light_theme': 'Light Theme',
    'dark_theme': 'Dark Theme',
    'auto_theme': 'Follow System',
    'background_settings': 'Background Settings',
    'local_image': 'Local Image',
    'choose_image_file': 'Choose Image File',
    'preset_backgrounds': 'Preset Backgrounds',
    'reset_background': 'Reset Background',
    'notification_preferences': 'Notification Preferences',
    'desktop_notifications': 'Desktop Notifications',
    'sound_notifications': 'Sound Notifications',
    'email_notifications': 'Email Notifications',
    'password_settings': 'Password Settings',
    'current_password': 'Current Password',
    'new_password': 'New Password',
    'confirm_password': 'Confirm Password',
    'change_password': 'Change Password',
    'session_settings': 'Session Settings',
    'session_timeout': 'Session Timeout (minutes)',
    'backup_options': 'Backup Options',
    'auto_backup': 'Auto Backup',
    'backup_frequency': 'Backup Frequency',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'backup_now': 'Backup Now',
    'restore_backup': 'Restore Backup',
    'system_info': 'System Information',
    'system_name': 'System Name',
    'version': 'Version',
    'build_date': 'Build Date',
    'choose_color': 'Choose Color',
    'apply_color': 'Apply Color',
    'preset_colors': 'Preset Colors',
    'settings_saved_auto': 'Settings saved automatically',
    'language_changed_success': 'Language changed successfully',
    'language_change_failed': 'Language change failed',
    'theme_saved': 'Theme settings saved'
  }
};

// 当前语言
let currentLanguage = 'zh-CN';

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {string} fallback - 备用文本
 * @returns {string} 翻译后的文本
 */
function getTranslation(key, fallback = key) {
  const langData = translations[currentLanguage];
  return langData && langData[key] ? langData[key] : fallback;
}

/**
 * 设置当前语言
 * @param {string} language - 语言代码
 * @param {boolean} skipConfigSave - 是否跳过保存到配置管理器（避免循环调用）
 */
function setLanguage(language, skipConfigSave = false) {
  if (translations[language]) {
    currentLanguage = language;
    localStorage.setItem('language', language);
    
    // 保存到配置管理器（除非明确跳过）
    if (!skipConfigSave && window.configManager) {
      window.configManager.set('language', language);
    }
    
    // 立即翻译页面
    translatePage();
    
    // 更新HTML lang属性
    document.documentElement.lang = language;
    
    // 触发语言切换事件
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: language }
    }));
    
    return true;
   }
   return false;
 }

 /**
  * 获取当前语言
  * @returns {string} 当前语言代码
  */
 function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * 翻译页面中所有带有 data-i18n 属性的元素
 */
function translatePage() {
  // 翻译文本内容
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);
    if (translation !== key) {
      element.textContent = translation;
    }
  });
  
  // 翻译占位符
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = getTranslation(key);
    if (translation !== key) {
      element.placeholder = translation;
    }
  });
  
  // 翻译标题
  const titleElements = document.querySelectorAll('[data-i18n-title]');
  titleElements.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = getTranslation(key);
    if (translation !== key) {
      element.title = translation;
    }
  });
}

/**
 * 初始化国际化系统
 */
function initI18n() {
  // 优先从配置管理器获取语言设置
  let savedLanguage = null;
  if (window.configManager && window.configManager.initialized) {
    savedLanguage = window.configManager.get('language');
  }
  
  // 如果配置管理器未初始化或没有语言设置，从本地存储获取
  if (!savedLanguage) {
    savedLanguage = localStorage.getItem('language');
  }
  
  if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
  }
  
  // 翻译页面
  translatePage();
}

// 将函数暴露到全局作用域
window.getTranslation = getTranslation;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.translatePage = translatePage;
window.initI18n = initI18n;