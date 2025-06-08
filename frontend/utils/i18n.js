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
    nav_finance: '财务',
    nav_reports: '报表',
    nav_settings: '设置',
    
    // 通用
    loading: '正在加载...',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    actions: '操作',
    
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
    patient_address: '住址',
    add_new_patient: '添加新患者',
    edit_patient_info: '编辑患者信息',
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
    no_medicine_found: '未找到相关药品信息',
    medicine_name_required: '药品名称不能为空',
    valid_unit_price_required: '请输入有效的单价',
    medicine_updated: '药品信息已更新',
    medicine_added: '药品已添加',
    operation_failed: '操作失败',
    get_medicine_failed: '获取药品信息失败',
    
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
    'settings_invalid_phone': '请输入有效的手机号码'
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
    nav_finance: 'Finance',
    nav_reports: 'Reports',
    nav_settings: 'Settings',
    
    // 通用
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    actions: 'Actions',
    
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
    patient_address: 'Address',
    add_new_patient: 'Add New Patient',
    edit_patient_info: 'Edit Patient Information',
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
    no_medicine_found: 'No medicine information found',
    medicine_name_required: 'Medicine name is required',
    valid_unit_price_required: 'Please enter a valid unit price',
    medicine_updated: 'Medicine information updated',
    medicine_added: 'Medicine added',
    operation_failed: 'Operation failed',
    get_medicine_failed: 'Failed to get medicine information',
    
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
    'settings_invalid_phone': 'Please enter a valid phone number'
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
 */
function setLanguage(language) {
  if (translations[language]) {
    currentLanguage = language;
    localStorage.setItem('language', language);
  }
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
  // 从本地存储获取语言设置
  const savedLanguage = localStorage.getItem('language');
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