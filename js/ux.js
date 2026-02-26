/**
 * 用户体验管理模块
 * 负责主题切换、动画效果和无障碍设计功能
 */
class UXManager {
    constructor(dataManager, modalManager) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.userPreferences = this.loadUserPreferences();
        this.init();
    }

    // 初始化
    init() {
        // 应用保存的主题和偏好设置
        this.applyTheme(this.userPreferences.theme);
        this.applyAccessibilitySettings(this.userPreferences.accessibility);
        
        // 绑定事件
        this.bindEvents();
        
        // 添加动画效果
        this.addAnimationClasses();
    }

    // 加载用户偏好设置
    loadUserPreferences() {
        const defaultPreferences = {
            theme: {
                mode: 'light',
                primaryColor: '#4CAF50',
                accentColor: '#FF9800'
            },
            accessibility: {
                fontSize: 'medium',
                highContrast: false,
                screenReaderSupport: true,
                keyboardNavigation: true
            },
            animations: {
                enabled: true,
                speed: 'normal'
            },
            layout: {
                compactView: false,
                sidebarCollapsed: false
            }
        };
        return this.dataManager.storage.getData('userPreferences', defaultPreferences);
    }

    // 保存用户偏好设置
    saveUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        this.dataManager.storage.setData('userPreferences', this.userPreferences);
        return this.userPreferences;
    }

    // 应用主题
    applyTheme(theme) {
        if (!theme) return;
        
        // 设置主题模式
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        document.documentElement.classList.add(`${theme.mode}-theme`);
        
        // 设置主题色
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--accent-color', theme.accentColor);
        
        // 更新主题切换按钮状态
        this.updateThemeToggle();
    }

    // 切换主题模式
    toggleTheme() {
        const currentMode = this.userPreferences.theme.mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        
        this.userPreferences.theme.mode = newMode;
        this.saveUserPreferences(this.userPreferences);
        this.applyTheme(this.userPreferences.theme);
        
        Utils.showMessage(`已切换到${newMode === 'light' ? '浅色' : '深色'}模式`, 'success');
    }

    // 更新主题切换按钮
    updateThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.userPreferences.theme.mode === 'light' ? 
                '<i class="fas fa-moon"></i> 深色模式' : 
                '<i class="fas fa-sun"></i> 浅色模式';
        }
    }

    // 设置主题颜色
    setThemeColor(colorType, color) {
        this.userPreferences.theme[colorType] = color;
        this.saveUserPreferences(this.userPreferences);
        this.applyTheme(this.userPreferences.theme);
    }

    // 应用无障碍设置
    applyAccessibilitySettings(settings) {
        if (!settings) return;
        
        // 设置字体大小
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${settings.fontSize}`);
        
        // 设置高对比度模式
        if (settings.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        
        // 设置键盘导航支持
        if (settings.keyboardNavigation) {
            document.documentElement.classList.add('keyboard-nav');
            this.setupKeyboardNavigation();
        } else {
            document.documentElement.classList.remove('keyboard-nav');
        }
    }

    // 设置无障碍选项
    setAccessibilityOption(option, value) {
        this.userPreferences.accessibility[option] = value;
        this.saveUserPreferences(this.userPreferences);
        this.applyAccessibilitySettings(this.userPreferences.accessibility);
    }

    // 设置字体大小
    setFontSize(size) {
        this.setAccessibilityOption('fontSize', size);
    }

    // 切换高对比度模式
    toggleHighContrast() {
        const newValue = !this.userPreferences.accessibility.highContrast;
        this.setAccessibilityOption('highContrast', newValue);
        Utils.showMessage(`已${newValue ? '开启' : '关闭'}高对比度模式`, 'success');
    }

    // 设置动画效果
    setAnimationEnabled(enabled) {
        this.userPreferences.animations.enabled = enabled;
        this.saveUserPreferences(this.userPreferences);
        
        if (enabled) {
            document.documentElement.classList.remove('no-animations');
        } else {
            document.documentElement.classList.add('no-animations');
        }
    }

    // 设置动画速度
    setAnimationSpeed(speed) {
        this.userPreferences.animations.speed = speed;
        this.saveUserPreferences(this.userPreferences);
        
        // 更新动画速度CSS变量
        let durationMultiplier = 1;
        switch (speed) {
            case 'slow': durationMultiplier = 1.5; break;
            case 'fast': durationMultiplier = 0.7; break;
            default: durationMultiplier = 1;
        }
        document.documentElement.style.setProperty('--animation-speed', durationMultiplier);
    }

    // 添加动画类
    addAnimationClasses() {
        // 为所有部分添加进入动画
        const sections = document.querySelectorAll('section, .section, .card, .modal');
        sections.forEach(section => {
            section.classList.add('fade-in');
        });
        
        // 为按钮添加悬停动画
        const buttons = document.querySelectorAll('button, .btn, .nav-btn');
        buttons.forEach(button => {
            button.classList.add('hover-effect');
        });
        
        // 为输入框添加焦点动画
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.add('focus-effect');
        });
    }

    // 显示加载动画
    showLoading(element) {
        if (!element) return;
        
        // 创建加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div>';
        
        // 显示加载覆盖层
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.appendChild(loadingIndicator);
        
        // 添加到元素
        element.style.position = 'relative';
        element.appendChild(loadingOverlay);
        
        return loadingOverlay;
    }

    // 隐藏加载动画
    hideLoading(element) {
        if (!element) return;
        
        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // 显示页面过渡动画
    showPageTransition(fromSection, toSection) {
        if (!fromSection || !toSection) return;
        
        // 添加离开动画
        fromSection.classList.add('fade-out');
        
        // 等待离开动画完成
        setTimeout(() => {
            // 隐藏旧页面
            fromSection.style.display = 'none';
            fromSection.classList.remove('fade-out');
            
            // 显示新页面
            toSection.style.display = 'block';
            toSection.classList.add('fade-in');
            
            // 移除进入动画
            setTimeout(() => {
                toSection.classList.remove('fade-in');
            }, 500);
        }, 300);
    }

    // 设置键盘导航
    setupKeyboardNavigation() {
        // 移除现有的键盘事件监听器
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        
        // 添加键盘事件监听器
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }

    // 处理键盘导航
    handleKeyboardNavigation(event) {
        // Tab键处理
        if (event.key === 'Tab') {
            this.handleTabNavigation(event);
        }
        
        // 箭头键处理
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            this.handleArrowNavigation(event);
        }
        
        // Enter键处理
        if (event.key === 'Enter') {
            this.handleEnterNavigation(event);
        }
        
        // Escape键处理
        if (event.key === 'Escape') {
            this.handleEscapeNavigation(event);
        }
    }

    // 处理Tab键导航
    handleTabNavigation(event) {
        // 添加焦点指示器
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])' 
        );
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('keyboard-focus');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('keyboard-focus');
            });
        });
    }

    // 处理箭头键导航
    handleArrowNavigation(event) {
        // 主要用于导航菜单和列表
        const activeElement = document.activeElement;
        
        if (activeElement.closest('.nav-menu') || activeElement.closest('.list')) {
            event.preventDefault();
            const siblings = Array.from(activeElement.parentElement.children);
            const currentIndex = siblings.indexOf(activeElement);
            let newIndex;
            
            switch (event.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    newIndex = (currentIndex - 1 + siblings.length) % siblings.length;
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    newIndex = (currentIndex + 1) % siblings.length;
                    break;
                default:
                    return;
            }
            
            siblings[newIndex].focus();
        }
    }

    // 处理Enter键导航
    handleEnterNavigation(event) {
        // 模拟点击当前聚焦元素
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') {
            activeElement.click();
        }
    }

    // 处理Escape键导航
    handleEscapeNavigation(event) {
        // 关闭模态框或弹出菜单
        const openModal = document.querySelector('.modal.active');
        if (openModal) {
            const closeBtn = openModal.querySelector('[data-action="cancel"], [data-action="close"], .modal-close');
            if (closeBtn) {
                closeBtn.click();
            }
        }
        
        // 关闭下拉菜单
        const openDropdown = document.querySelector('.dropdown.open');
        if (openDropdown) {
            openDropdown.classList.remove('open');
        }
    }

    // 添加ARIA标签以支持屏幕阅读器
    addARIALabels() {
        // 为导航项添加ARIA标签
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            if (!btn.hasAttribute('aria-label')) {
                btn.setAttribute('aria-label', btn.textContent.trim());
            }
        });
        
        // 为卡片添加ARIA标签
        const cards = document.querySelectorAll('.card, .activity-card, .expense-card');
        cards.forEach(card => {
            if (!card.hasAttribute('aria-labelledby')) {
                const title = card.querySelector('h3, h4, .card-title');
                if (title && !title.id) {
                    title.id = `card-title-${Utils.generateId()}`;
                }
                if (title) {
                    card.setAttribute('aria-labelledby', title.id);
                }
            }
        });
        
        // 为表单元素添加ARIA标签
        const formElements = document.querySelectorAll('input, textarea, select');
        formElements.forEach(element => {
            if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
                const label = document.querySelector(`label[for="${element.id}"]`);
                if (label) {
                    element.setAttribute('aria-labelledby', label.id);
                }
            }
        });
    }

    // 显示用户偏好设置面板
    showPreferencesPanel() {
        const modalContent = `
            <div class="preferences-modal">
                <div class="modal-header">
                    <h3>用户偏好设置</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- 主题设置 -->
                    <div class="preferences-section">
                        <h4>主题设置</h4>
                        
                        <div class="preference-item">
                            <label for="themeMode">主题模式：</label>
                            <div class="theme-toggle">
                                <button 
                                    id="themeMode" 
                                    class="btn ${this.userPreferences.theme.mode === 'light' ? 'btn-primary' : 'btn-secondary'}"
                                    onclick="uxManager.toggleTheme()"
                                >
                                    ${this.userPreferences.theme.mode === 'light' ? '<i class="fas fa-moon"></i> 深色模式' : '<i class="fas fa-sun"></i> 浅色模式'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="preference-item">
                            <label for="primaryColor">主色调：</label>
                            <div class="color-picker">
                                <input 
                                    type="color" 
                                    id="primaryColor" 
                                    value="${this.userPreferences.theme.primaryColor}"
                                    onchange="uxManager.setThemeColor('primaryColor', this.value)"
                                >
                                <span>${this.userPreferences.theme.primaryColor}</span>
                            </div>
                        </div>
                        
                        <div class="preference-item">
                            <label for="accentColor">强调色：</label>
                            <div class="color-picker">
                                <input 
                                    type="color" 
                                    id="accentColor" 
                                    value="${this.userPreferences.theme.accentColor}"
                                    onchange="uxManager.setThemeColor('accentColor', this.value)"
                                >
                                <span>${this.userPreferences.theme.accentColor}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 无障碍设置 -->
                    <div class="preferences-section">
                        <h4>无障碍设置</h4>
                        
                        <div class="preference-item">
                            <label for="fontSize">字体大小：</label>
                            <select 
                                id="fontSize"
                                value="${this.userPreferences.accessibility.fontSize}"
                                onchange="uxManager.setFontSize(this.value)"
                            >
                                <option value="small" ${this.userPreferences.accessibility.fontSize === 'small' ? 'selected' : ''}>小</option>
                                <option value="medium" ${this.userPreferences.accessibility.fontSize === 'medium' ? 'selected' : ''}>中</option>
                                <option value="large" ${this.userPreferences.accessibility.fontSize === 'large' ? 'selected' : ''}>大</option>
                                <option value="xlarge" ${this.userPreferences.accessibility.fontSize === 'xlarge' ? 'selected' : ''}>特大</option>
                            </select>
                        </div>
                        
                        <div class="preference-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="highContrast"
                                    ${this.userPreferences.accessibility.highContrast ? 'checked' : ''}
                                    onchange="uxManager.toggleHighContrast()"
                                >
                                高对比度模式
                            </label>
                        </div>
                        
                        <div class="preference-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="screenReaderSupport"
                                    ${this.userPreferences.accessibility.screenReaderSupport ? 'checked' : ''}
                                    onchange="uxManager.setAccessibilityOption('screenReaderSupport', this.checked)"
                                >
                                屏幕阅读器支持
                            </label>
                        </div>
                        
                        <div class="preference-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="keyboardNavigation"
                                    ${this.userPreferences.accessibility.keyboardNavigation ? 'checked' : ''}
                                    onchange="uxManager.setAccessibilityOption('keyboardNavigation', this.checked)"
                                >
                                键盘导航支持
                            </label>
                        </div>
                    </div>
                    
                    <!-- 动画设置 -->
                    <div class="preferences-section">
                        <h4>动画设置</h4>
                        
                        <div class="preference-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="animationsEnabled"
                                    ${this.userPreferences.animations.enabled ? 'checked' : ''}
                                    onchange="uxManager.setAnimationEnabled(this.checked)"
                                >
                                启用动画效果
                            </label>
                        </div>
                        
                        <div class="preference-item">
                            <label for="animationSpeed">动画速度：</label>
                            <select 
                                id="animationSpeed"
                                value="${this.userPreferences.animations.speed}"
                                onchange="uxManager.setAnimationSpeed(this.value)"
                            >
                                <option value="slow" ${this.userPreferences.animations.speed === 'slow' ? 'selected' : ''}>慢</option>
                                <option value="normal" ${this.userPreferences.animations.speed === 'normal' ? 'selected' : ''}>正常</option>
                                <option value="fast" ${this.userPreferences.animations.speed === 'fast' ? 'selected' : ''}>快</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- 布局设置 -->
                    <div class="preferences-section">
                        <h4>布局设置</h4>
                        
                        <div class="preference-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="compactView"
                                    ${this.userPreferences.layout.compactView ? 'checked' : ''}
                                    onchange="uxManager.toggleCompactView()"
                                >
                                紧凑视图
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                    <button class="btn btn-primary" onclick="uxManager.resetPreferences()">重置为默认</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('用户偏好设置', modalContent, { width: '700px' });
    }

    // 切换紧凑视图
    toggleCompactView() {
        const newValue = !this.userPreferences.layout.compactView;
        this.userPreferences.layout.compactView = newValue;
        this.saveUserPreferences(this.userPreferences);
        
        if (newValue) {
            document.documentElement.classList.add('compact-view');
        } else {
            document.documentElement.classList.remove('compact-view');
        }
        
        Utils.showMessage(`已${newValue ? '开启' : '关闭'}紧凑视图`, 'success');
    }

    // 重置为默认偏好设置
    resetPreferences() {
        const defaultPreferences = {
            theme: {
                mode: 'light',
                primaryColor: '#4CAF50',
                accentColor: '#FF9800'
            },
            accessibility: {
                fontSize: 'medium',
                highContrast: false,
                screenReaderSupport: true,
                keyboardNavigation: true
            },
            animations: {
                enabled: true,
                speed: 'normal'
            },
            layout: {
                compactView: false,
                sidebarCollapsed: false
            }
        };
        
        this.saveUserPreferences(defaultPreferences);
        this.applyTheme(defaultPreferences.theme);
        this.applyAccessibilitySettings(defaultPreferences.accessibility);
        this.setAnimationEnabled(defaultPreferences.animations.enabled);
        this.setAnimationSpeed(defaultPreferences.animations.speed);
        
        Utils.showMessage('已重置为默认设置', 'success');
        this.showPreferencesPanel(); // 刷新面板
    }

    // 绑定事件
    bindEvents() {
        // 主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // 偏好设置按钮
        const preferencesBtn = document.getElementById('preferencesBtn');
        if (preferencesBtn) {
            preferencesBtn.addEventListener('click', () => this.showPreferencesPanel());
        }
        
        // 页面显示/隐藏事件
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'opacity') {
                    section.classList.remove('fade-in', 'fade-out');
                }
            });
        });
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('.dropdown.open');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });
        });
    }

    // 添加加载动画到指定元素
    addLoadingIndicator(element) {
        if (!element) return;
        
        const loadingHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <span class="loading-text">加载中...</span>
            </div>
        `;
        
        element.innerHTML = loadingHTML;
    }

    // 添加骨架屏
    addSkeletonLoader(element, type = 'card') {
        if (!element) return;
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'card':
                skeletonHTML = `
                    <div class="skeleton-card">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                `;
                break;
                
            case 'list':
                skeletonHTML = `
                    <div class="skeleton-list">
                        <div class="skeleton-item">
                            <div class="skeleton-circle"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                        <div class="skeleton-item">
                            <div class="skeleton-circle"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                        <div class="skeleton-item">
                            <div class="skeleton-circle"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'table':
                skeletonHTML = `
                    <div class="skeleton-table">
                        <div class="skeleton-table-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                        </div>
                        <div class="skeleton-table-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                        </div>
                        <div class="skeleton-table-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                        </div>
                    </div>
                `;
                break;
        }
        
        element.innerHTML = skeletonHTML;
    }
}

// 创建全局实例
let uxManager;