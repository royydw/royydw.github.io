/**
 * 模态框管理模块
 * 负责模态框的显示、隐藏和事件处理
 */

class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.overlay = null;
        this.init();
    }

    // 初始化
    init() {
        this.createOverlay();
        this.bindGlobalEvents();
    }

    // 创建遮罩层
    createOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(this.overlay);
    }

    // 绑定全局事件
    bindGlobalEvents() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                this.closeLastModal();
            }
        });

        // 点击遮罩层关闭模态框
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeLastModal();
            }
        });

        // 窗口大小变化时重新定位模态框
        window.addEventListener('resize', () => {
            this.positionActiveModals();
        });
    }

    // 显示模态框
    show(modalElement, options = {}) {
        if (!modalElement) return false;

        const {
            closable = true,
            overlayClosable = true,
            keyboardClosable = true,
            duration = 300
        } = options;

        // 添加到活动模态框列表
        this.activeModals.add(modalElement);
        
        // 设置模态框属性
        modalElement.dataset.closable = closable;
        modalElement.dataset.overlayClosable = overlayClosable;
        modalElement.dataset.keyboardClosable = keyboardClosable;
        
        // 显示遮罩层
        this.showOverlay();
        
        // 显示模态框
        modalElement.style.display = 'flex';
        modalElement.style.zIndex = '9999';
        modalElement.style.opacity = '0';
        modalElement.style.transform = 'translateY(-20px) scale(0.95)';
        
        // 动画显示
        setTimeout(() => {
            modalElement.style.opacity = '1';
            modalElement.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // 定位模态框
        this.positionModal(modalElement);

        // 绑定关闭事件
        if (closable) {
            this.bindModalCloseEvents(modalElement);
        }

        // 焦点管理
        this.focusManager(modalElement);

        // 触发显示事件
        modalElement.dispatchEvent(new CustomEvent('modal:show', {
            bubbles: true,
            detail: { modal: modalElement }
        }));

        return true;
    }

    // 关闭模态框
    close(modalElement) {
        if (!modalElement || !this.activeModals.has(modalElement)) return false;

        // 动画关闭
        modalElement.style.opacity = '0';
        modalElement.style.transform = 'translateY(-20px) scale(0.95)';
        
        setTimeout(() => {
            modalElement.style.display = 'none';
            modalElement.style.opacity = '';
            modalElement.style.transform = '';
        }, 300);

        // 从活动模态框列表移除
        this.activeModals.delete(modalElement);

        // 触发关闭事件
        modalElement.dispatchEvent(new CustomEvent('modal:hide', {
            bubbles: true,
            detail: { modal: modalElement }
        }));

        // 如果没有活动模态框，隐藏遮罩层
        if (this.activeModals.size === 0) {
            this.hideOverlay();
        }

        // 恢复焦点
        this.restoreFocus(modalElement);

        return true;
    }

    // 关闭最后一个模态框
    closeLastModal() {
        const lastModal = Array.from(this.activeModals).pop();
        if (lastModal) {
            this.close(lastModal);
        }
    }

    // 关闭所有模态框
    closeAll() {
        const modals = Array.from(this.activeModals);
        modals.forEach(modal => this.close(modal));
    }

    // 显示遮罩层
    showOverlay() {
        this.overlay.style.visibility = 'visible';
        this.overlay.style.opacity = '1';
    }

    // 隐藏遮罩层
    hideOverlay() {
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.visibility = 'hidden';
        }, 300);
    }

    // 定位模态框
    positionModal(modalElement) {
        const modalContent = modalElement.querySelector('.modal-content');
        if (!modalContent) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;

        // 计算居中位置
        const left = (viewportWidth - modalWidth) / 2;
        const top = Math.max(20, (viewportHeight - modalHeight) / 2);

        modalElement.style.left = `${Math.max(0, left)}px`;
        modalElement.style.top = `${Math.max(0, top)}px`;
    }

    // 重新定位所有活动模态框
    positionActiveModals() {
        this.activeModals.forEach(modal => this.positionModal(modal));
    }

    // 绑定模态框关闭事件
    bindModalCloseEvents(modalElement) {
        const closeButtons = modalElement.querySelectorAll('.modal-close, .btn-close, [data-dismiss="modal"]');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.close(modalElement);
            });
        });
    }

    // 焦点管理
    focusManager(modalElement) {
        // 记录当前焦点元素
        this.previousFocus = document.activeElement;
        
        // 聚焦到模态框
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    // 恢复焦点
    restoreFocus(modalElement) {
        if (this.previousFocus && document.body.contains(this.previousFocus)) {
            this.previousFocus.focus();
        }
    }

    // 创建确认模态框
    showConfirmModal(title, message, options = {}) {
        return new Promise((resolve) => {
            const modalId = `confirm-${Date.now()}`;
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close">取消</button>
                        <button class="btn btn-primary confirm-action">确定</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.show(modal);

            // 绑定确认事件
            const confirmButton = modal.querySelector('.confirm-action');
            const cancelButton = modal.querySelector('.btn-secondary');
            
            const cleanup = () => {
                this.close(modal);
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            };

            confirmButton.addEventListener('click', () => {
                resolve(true);
                cleanup();
            });

            cancelButton.addEventListener('click', () => {
                resolve(false);
                cleanup();
            });
        });
    }

    // 创建自定义模态框
    showCustomModal(template, options = {}) {
        return new Promise((resolve) => {
            const modalId = `custom-${Date.now()}`;
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = template;

            document.body.appendChild(modal);
            this.show(modal);

            // 绑定提交和取消事件
            const submitButton = modal.querySelector('[data-action="submit"]');
            const cancelButton = modal.querySelector('[data-action="cancel"]');
            
            if (submitButton) {
                submitButton.addEventListener('click', () => {
                    const formData = this.getFormData(modal);
                    resolve({ success: true, data: formData, modal });
                    this.close(modal);
                    setTimeout(() => {
                        if (modal.parentNode) {
                            modal.parentNode.removeChild(modal);
                        }
                    }, 300);
                });
            }

            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    resolve({ success: false, modal });
                    this.close(modal);
                    setTimeout(() => {
                        if (modal.parentNode) {
                            modal.parentNode.removeChild(modal);
                        }
                    }, 300);
                });
            }
        });
    }

    // 获取表单数据
    getFormData(modal) {
        const formData = {};
        const inputs = modal.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const name = input.name || input.id;
            if (name) {
                formData[name] = input.value;
            }
        });
        
        return formData;
    }

    // 检查是否有活动模态框
    hasActiveModals() {
        return this.activeModals.size > 0;
    }

    // 获取活动模态框数量
    getActiveModalCount() {
        return this.activeModals.size;
    }

    // 销毁
    destroy() {
        this.closeAll();
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// 创建全局实例
window.modalManager = new ModalManager();