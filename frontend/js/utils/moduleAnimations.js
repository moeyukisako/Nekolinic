// frontend/js/utils/moduleAnimations.js

/**
 * 模块动画工具类
 * 提供统一的动画效果，应用于所有模块
 * 与功能性代码解耦，专注于视觉效果
 */
class ModuleAnimations {
    constructor() {
        this.animationClasses = {
            fadeIn: 'module-fade-in',
            slideIn: 'module-slide-in',
            fadeInUp: 'module-fade-in-up',
            scaleIn: 'module-scale-in',
            slideInLeft: 'module-slide-in-left',
            slideInRight: 'module-slide-in-right'
        };
        
        this.initialized = false;
        this.init();
    }
    
    /**
     * 初始化动画系统
     */
    init() {
        if (this.initialized) return;
        
        this.injectAnimationStyles();
        this.setupIntersectionObserver();
        this.initialized = true;
        
        console.log('✅ ModuleAnimations: 动画系统已初始化');
    }
    
    /**
     * 注入动画CSS样式
     */
    injectAnimationStyles() {
        const styleId = 'module-animations-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* 模块动画基础样式 */
            .module-animation-container {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .module-animation-container.animated {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* 淡入动画 */
            .module-fade-in {
                opacity: 0;
                animation: moduleFadeIn 0.6s ease-out forwards;
            }
            
            @keyframes moduleFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* 滑入动画 */
            .module-slide-in {
                opacity: 0;
                transform: translateY(-20px);
                animation: moduleSlideIn 0.6s ease-out forwards;
            }
            
            @keyframes moduleSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* 向上淡入动画 */
            .module-fade-in-up {
                opacity: 0;
                transform: translateY(30px);
                animation: moduleFadeInUp 0.6s ease-out forwards;
            }
            
            @keyframes moduleFadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* 缩放淡入动画 */
            .module-scale-in {
                opacity: 0;
                transform: scale(0.9);
                animation: moduleScaleIn 0.6s ease-out forwards;
            }
            
            @keyframes moduleScaleIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            /* 从左滑入动画 */
            .module-slide-in-left {
                opacity: 0;
                transform: translateX(-30px);
                animation: moduleSlideInLeft 0.6s ease-out forwards;
            }
            
            @keyframes moduleSlideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            /* 从右滑入动画 */
            .module-slide-in-right {
                opacity: 0;
                transform: translateX(30px);
                animation: moduleSlideInRight 0.6s ease-out forwards;
            }
            
            @keyframes moduleSlideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            /* 导航切换动画 */
            .module-nav-item {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .module-nav-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.6s;
            }
            
            .module-nav-item:hover::before {
                left: 100%;
            }
            
            .module-nav-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .module-nav-item.active {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* 内容区域切换动画 */
            .module-content-section {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                display: none;
            }
            
            .module-content-section.active {
                opacity: 1;
                transform: translateY(0);
                display: block;
                animation: moduleContentFadeIn 0.6s ease-out;
            }
            
            @keyframes moduleContentFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* 卡片悬停动画 */
            .module-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .module-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            /* 按钮动画 */
            .module-btn {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .module-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }
            
            .module-btn:hover::before {
                width: 300px;
                height: 300px;
            }
            
            .module-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            /* 表单元素动画 */
            .module-form-group {
                transition: all 0.3s ease;
            }
            
            .module-form-group:hover {
                transform: translateY(-1px);
            }
            
            .module-form-control {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .module-form-control:focus {
                transform: scale(1.02);
                box-shadow: 0 0 0 3px rgba(57, 197, 187, 0.1);
            }
            
            /* 延迟动画类 */
            .module-delay-1 { animation-delay: 0.1s; }
            .module-delay-2 { animation-delay: 0.2s; }
            .module-delay-3 { animation-delay: 0.3s; }
            .module-delay-4 { animation-delay: 0.4s; }
            .module-delay-5 { animation-delay: 0.5s; }
            
            /* 响应式动画调整 */
            @media (prefers-reduced-motion: reduce) {
                .module-animation-container,
                .module-fade-in,
                .module-slide-in,
                .module-fade-in-up,
                .module-scale-in,
                .module-slide-in-left,
                .module-slide-in-right,
                .module-nav-item,
                .module-content-section,
                .module-card,
                .module-btn,
                .module-form-group,
                .module-form-control {
                    animation: none !important;
                    transition: none !important;
                }
            }
            
            @media (max-width: 768px) {
                .module-animation-container,
                .module-content-section {
                    animation-duration: 0.4s;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 设置交叉观察器，用于滚动时触发动画
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) return;
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }
    
    /**
     * 为模块容器添加动画
     * @param {HTMLElement} container - 模块容器
     * @param {string} animationType - 动画类型
     * @param {number} delay - 延迟时间（毫秒）
     */
    animateModule(container, animationType = 'fadeInUp', delay = 0) {
        if (!container) return;
        
        const animationClass = this.animationClasses[animationType] || this.animationClasses.fadeInUp;
        
        // 添加基础动画容器类
        container.classList.add('module-animation-container');
        
        // 延迟添加动画类
        setTimeout(() => {
            container.classList.add(animationClass);
            
            // 如果支持交叉观察器，则观察该元素
            if (this.observer) {
                this.observer.observe(container);
            } else {
                // 降级处理：直接添加动画类
                container.classList.add('animated');
            }
        }, delay);
    }
    
    /**
     * 为导航项添加动画效果
     * @param {NodeList|Array} navItems - 导航项列表
     */
    animateNavItems(navItems) {
        if (!navItems || !navItems.length) return;
        
        navItems.forEach((item, index) => {
            item.classList.add('module-nav-item');
            
            // 添加延迟动画
            if (index < 5) {
                item.classList.add(`module-delay-${index + 1}`);
            }
        });
    }
    
    /**
     * 为内容区域添加切换动画
     * @param {NodeList|Array} sections - 内容区域列表
     */
    animateContentSections(sections) {
        if (!sections || !sections.length) return;
        
        sections.forEach(section => {
            section.classList.add('module-content-section');
        });
    }
    
    /**
     * 为卡片添加悬停动画
     * @param {NodeList|Array} cards - 卡片列表
     */
    animateCards(cards) {
        if (!cards || !cards.length) return;
        
        cards.forEach(card => {
            card.classList.add('module-card');
        });
    }
    
    /**
     * 为按钮添加动画效果
     * @param {NodeList|Array} buttons - 按钮列表
     */
    animateButtons(buttons) {
        if (!buttons || !buttons.length) return;
        
        buttons.forEach(button => {
            button.classList.add('module-btn');
        });
    }
    
    /**
     * 为表单元素添加动画效果
     * @param {HTMLElement} formContainer - 表单容器
     */
    animateForm(formContainer) {
        if (!formContainer) return;
        
        const formGroups = formContainer.querySelectorAll('.form-group, .settings-group');
        const formControls = formContainer.querySelectorAll('input, select, textarea');
        
        formGroups.forEach(group => {
            group.classList.add('module-form-group');
        });
        
        formControls.forEach(control => {
            control.classList.add('module-form-control');
        });
    }
    
    /**
     * 为整个模块应用完整的动画套件
     * @param {HTMLElement} moduleContainer - 模块容器
     * @param {Object} options - 配置选项
     */
    applyModuleAnimations(moduleContainer, options = {}) {
        if (!moduleContainer) return;
        
        const {
            animationType = 'fadeInUp',
            delay = 0,
            animateNav = true,
            animateContent = true,
            animateCards = true,
            animateButtons = true,
            animateForms = true
        } = options;
        
        // 为主容器添加动画
        this.animateModule(moduleContainer, animationType, delay);
        
        // 为导航项添加动画
        if (animateNav) {
            const navItems = moduleContainer.querySelectorAll('.sidebar-item, .nav-item, .settings-nav-item, .tab-item');
            this.animateNavItems(navItems);
        }
        
        // 为内容区域添加动画
        if (animateContent) {
            const sections = moduleContainer.querySelectorAll('.content-section, .settings-section, .tab-content');
            this.animateContentSections(sections);
        }
        
        // 为卡片添加动画
        if (animateCards) {
            const cards = moduleContainer.querySelectorAll('.card, .settings-group, .dashboard-card, .patient-card');
            this.animateCards(cards);
        }
        
        // 为按钮添加动画
        if (animateButtons) {
            const buttons = moduleContainer.querySelectorAll('.btn, button');
            this.animateButtons(buttons);
        }
        
        // 为表单添加动画
        if (animateForms) {
            this.animateForm(moduleContainer);
        }
        
        console.log(`✅ ModuleAnimations: 已为模块应用动画效果`);
    }
    
    /**
     * 移除动画类（用于清理）
     * @param {HTMLElement} element - 要清理的元素
     */
    removeAnimations(element) {
        if (!element) return;
        
        const animationClasses = [
            'module-animation-container',
            'animated',
            ...Object.values(this.animationClasses),
            'module-nav-item',
            'module-content-section',
            'module-card',
            'module-btn',
            'module-form-group',
            'module-form-control',
            'module-delay-1',
            'module-delay-2',
            'module-delay-3',
            'module-delay-4',
            'module-delay-5'
        ];
        
        element.classList.remove(...animationClasses);
        
        // 停止观察该元素
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }
    
    /**
     * 销毁动画系统
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const styleElement = document.getElementById('module-animations-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        this.initialized = false;
        console.log('🗑️ ModuleAnimations: 动画系统已销毁');
    }
}

// 创建全局实例
const moduleAnimations = new ModuleAnimations();
window.moduleAnimations = moduleAnimations;

// 自动初始化
const initAnimations = () => {
    try {
        moduleAnimations.init();
        console.log('✅ 模块动画系统初始化成功');
    } catch (error) {
        console.error('❌ 模块动画系统初始化失败:', error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    // 延迟初始化，确保其他脚本已加载
    setTimeout(initAnimations, 100);
}

// 导出类和实例
export default ModuleAnimations;
export { ModuleAnimations };

console.log('✅ moduleAnimations.js: 模块动画工具已加载');