class ChecklistManager {
    constructor() {
        this.modalManager = window.modalManager || new ModalManager();
        this.storageManager = window.storageManager || new StorageManager();
        this.utils = window.utils || new Utils();
        
        // 初始化模板
        this.templates = this.getTravelTemplates();
        
        // 协作相关
        this.collaborationMode = false;
        this.currentShareCode = null;
        
        // 加载清单数据
        this.loadChecklistData();
    }

    // 获取旅行模板库
    getTravelTemplates() {
        return {
            海岛游: {
                name: '海岛游模板',
                description: '适用于海岛度假的完整清单',
                icon: 'fas fa-umbrella-beach',
                categories: {
                    luggage: [
                        { text: '泳装和比基尼', completed: false },
                        { text: '防晒霜 (SPF 50+)', completed: false },
                        { text: '太阳镜', completed: false },
                        { text: '遮阳帽', completed: false },
                        { text: '防水袋', completed: false },
                        { text: '防滑拖鞋', completed: false },
                        { text: '海滩毛巾', completed: false },
                        { text: '浮潜装备', completed: false }
                    ],
                    preparation: [
                        { text: '预订海岛酒店', completed: false },
                        { text: '购买旅游保险', completed: false },
                        { text: '办理签证（如需要）', completed: false },
                        { text: '查询天气情况', completed: false },
                        { text: '预订接机服务', completed: false },
                        { text: '下载离线地图', completed: false }
                    ],
                    important: [
                        { text: '护照有效期检查', completed: false },
                        { text: '紧急联系人信息', completed: false },
                        { text: '当地紧急电话', completed: false },
                        { text: '医院和药房位置', completed: false }
                    ]
                }
            },
            徒步登山: {
                name: '徒步登山模板',
                description: '适用于山地徒步和登山的专业清单',
                icon: 'fas fa-mountain',
                categories: {
                    luggage: [
                        { text: '专业徒步鞋', completed: false },
                        { text: '登山杖', completed: false },
                        { text: '背包（30-50L）', completed: false },
                        { text: '睡袋', completed: false },
                        { text: '防潮垫', completed: false },
                        { text: '头灯和电池', completed: false },
                        { text: '多功能刀具', completed: false },
                        { text: '水壶或水袋', completed: false },
                        { text: '能量棒和干粮', completed: false }
                    ],
                    preparation: [
                        { text: '研究路线和天气', completed: false },
                        { text: '告知家人朋友行程', completed: false },
                        { text: '购买户外保险', completed: false },
                        { text: '准备急救包', completed: false },
                        { text: '下载GPS轨迹', completed: false },
                        { text: '预订山小屋（如需要）', completed: false }
                    ],
                    important: [
                        { text: '紧急求救设备', completed: false },
                        { text: '卫星电话或对讲机', completed: false },
                        { text: '急救知识和技能', completed: false },
                        { text: '备用通讯方式', completed: false }
                    ]
                }
            },
            商务出差: {
                name: '商务出差模板',
                description: '适用于商务出行的专业清单',
                icon: 'fas fa-briefcase',
                categories: {
                    luggage: [
                        { text: '正装和衬衫', completed: false },
                        { text: '商务鞋', completed: false },
                        { text: '笔记本电脑', completed: false },
                        { text: '充电器和数据线', completed: false },
                        { text: '移动电源', completed: false },
                        { text: '名片和文件夹', completed: false },
                        { text: '洗漱用品', completed: false }
                    ],
                    preparation: [
                        { text: '确认会议安排', completed: false },
                        { text: '预订酒店和交通', completed: false },
                        { text: '准备演示材料', completed: false },
                        { text: '了解当地商务礼仪', completed: false },
                        { text: '办理电话国际漫游', completed: false },
                        { text: '准备商务礼品', completed: false }
                    ],
                    important: [
                        { text: '身份证和护照', completed: false },
                        { text: '商务保险', completed: false },
                        { text: '紧急联系人', completed: false },
                        { text: '公司紧急联系方式', completed: false }
                    ]
                }
            },
            城市观光: {
                name: '城市观光模板',
                description: '适用于城市旅游的经典清单',
                icon: 'fas fa-city',
                categories: {
                    luggage: [
                        { text: '舒适的步行鞋', completed: false },
                        { text: '轻便外套', completed: false },
                        { text: '相机或手机', completed: false },
                        { text: '充电宝', completed: false },
                        { text: '雨伞', completed: false },
                        { text: '购物袋', completed: false },
                        { text: '保温杯', completed: false }
                    ],
                    preparation: [
                        { text: '研究景点和交通', completed: false },
                        { text: '购买城市通票', completed: false },
                        { text: '预订热门餐厅', completed: false },
                        { text: '下载地铁APP', completed: false },
                        { text: '了解当地文化', completed: false },
                        { text: '制定游览路线', completed: false }
                    ],
                    important: [
                        { text: '重要证件', completed: false },
                        { text: '现金和银行卡', completed: false },
                        { text: '紧急联系方式', completed: false },
                        { text: '旅游保险', completed: false }
                    ]
                }
            },
            亲子旅行: {
                name: '亲子旅行模板',
                description: '适用于带孩子的家庭旅行清单',
                icon: 'fas fa-baby',
                categories: {
                    luggage: [
                        { text: '儿童换洗衣物', completed: false },
                        { text: '儿童洗护用品', completed: false },
                        { text: '儿童药品', completed: false },
                        { text: '安抚玩具', completed: false },
                        { text: '婴儿车或背带', completed: false },
                        { text: '儿童餐具', completed: false },
                        { text: '零食和奶粉', completed: false },
                        { text: '儿童书籍', completed: false }
                    ],
                    preparation: [
                        { text: '预订家庭房酒店', completed: false },
                        { text: '准备儿童证件', completed: false },
                        { text: '查询儿童友好景点', completed: false },
                        { text: '购买儿童保险', completed: false },
                        { text: '准备紧急医疗信息', completed: false },
                        { text: '联系当地儿科医院', completed: false }
                    ],
                    important: [
                        { text: '儿童疫苗接种证明', completed: false },
                        { text: '紧急联系人', completed: false },
                        { text: '当地儿童急救电话', completed: false },
                        { text: '医疗保险信息', completed: false }
                    ]
                }
            }
        };
    }

    // 显示模板库
    showTemplateLibrary() {
        const templateList = Object.entries(this.templates).map(([key, template]) => `
            <div class="template-card" onclick="checklistManager.importTemplate('${key}')">
                <div class="template-icon">
                    <i class="${template.icon}"></i>
                </div>
                <div class="template-info">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                </div>
                <div class="template-action">
                    <button class="btn-primary">一键导入</button>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="template-library">
                <div class="template-header">
                    <h3><i class="fas fa-th-large"></i> 旅行清单模板库</h3>
                    <p>选择适合的模板，一键导入完整的旅行清单</p>
                </div>
                <div class="template-list">
                    ${templateList}
                </div>
                <div class="template-actions">
                    <button class="btn-secondary" onclick="checklistManager.createCustomTemplate()">
                        <i class="fas fa-plus"></i> 创建自定义模板
                    </button>
                    <button class="btn-secondary" onclick="checklistManager.showMyTemplates()">
                        <i class="fas fa-star"></i> 我的模板
                    </button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('模板库', html);
    }

    // 导入模板
    async importTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) return;

        const result = await this.modalManager.showConfirmModal(
            '导入模板',
            `确定要导入"${template.name}"吗？这将添加模板中的所有项目到您的清单中。`,
            { title: '确认导入' }
        );

        if (result) {
            // 合并模板到当前清单
            const currentData = this.storageManager.getData('travelChecklists', {
                luggage: [],
                preparation: [],
                important: []
            });

            // 深度合并，避免重复项目
            Object.keys(template.categories).forEach(category => {
                const templateItems = template.categories[category];
                const currentItems = currentData[category] || [];
                
                templateItems.forEach(templateItem => {
                    const exists = currentItems.some(item => item.text === templateItem.text);
                    if (!exists) {
                        currentItems.push({...templateItem});
                    }
                });
                
                currentData[category] = currentItems;
            });

            // 保存数据
            this.storageManager.setData('travelChecklists', currentData);
            
            // 刷新显示
            this.refreshChecklistDisplay();
            
            this.modalManager.closeModal();
            this.utils.showMessage(`成功导入"${template.name}"模板！`, 'success');
        }
    }

    // 创建自定义模板
    createCustomTemplate() {
        const html = `
            <div class="custom-template-form">
                <div class="form-group">
                    <label>模板名称</label>
                    <input type="text" id="templateName" placeholder="例如：我的海岛游模板" required>
                </div>
                <div class="form-group">
                    <label>模板描述</label>
                    <input type="text" id="templateDescription" placeholder="简要描述这个模板的用途">
                </div>
                <div class="template-categories">
                    <h4>行李打包</h4>
                    <div id="templateLuggage" class="template-items">
                        <input type="text" placeholder="添加物品项" onkeypress="if(event.key==='Enter'){event.preventDefault(); checklistManager.addTemplateItem('luggage', this.value); this.value='';}">
                    </div>
                    
                    <h4>行前准备</h4>
                    <div id="templatePreparation" class="template-items">
                        <input type="text" placeholder="添加准备事项" onkeypress="if(event.key==='Enter'){event.preventDefault(); checklistManager.addTemplateItem('preparation', this.value); this.value='';}">
                    </div>
                    
                    <h4>重要事项</h4>
                    <div id="templateImportant" class="template-items">
                        <input type="text" placeholder="添加重要事项" onkeypress="if(event.key==='Enter'){event.preventDefault(); checklistManager.addTemplateItem('important', this.value); this.value='';}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="checklistManager.modalManager.closeModal()">取消</button>
                    <button type="button" class="btn-primary" onclick="checklistManager.saveCustomTemplate()">保存模板</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('创建自定义模板', html);
    }

    // 添加模板项目
    addTemplateItem(category, text) {
        if (!text.trim()) return;
        
        const container = document.getElementById(`template${category.charAt(0).toUpperCase() + category.slice(1)}`);
        const item = document.createElement('div');
        item.className = 'template-item';
        item.innerHTML = `
            <span>${text}</span>
            <button type="button" onclick="this.parentNode.remove()">×</button>
        `;
        container.insertBefore(item, container.lastElementChild);
    }

    // 保存自定义模板
    saveCustomTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const description = document.getElementById('templateDescription').value.trim();
        
        if (!name) {
            this.utils.showMessage('请输入模板名称', 'error');
            return;
        }

        // 收集模板数据
        const templateData = {
            name: name,
            description: description || '自定义旅行清单模板',
            icon: 'fas fa-heart',
            categories: {
                luggage: [],
                preparation: [],
                important: []
            }
        };

        // 收集各类别项目
        ['luggage', 'preparation', 'important'].forEach(category => {
            const container = document.getElementById(`template${category.charAt(0).toUpperCase() + category.slice(1)}`);
            const items = container.querySelectorAll('.template-item span');
            items.forEach(item => {
                templateData.categories[category].push({
                    text: item.textContent,
                    completed: false
                });
            });
        });

        // 保存到本地存储
        const customTemplates = this.storageManager.getData('custom_templates', {});
        const templateKey = 'custom_' + Date.now();
        customTemplates[templateKey] = templateData;
        this.storageManager.setData('custom_templates', customTemplates);

        this.modalManager.closeModal();
        this.utils.showMessage('自定义模板保存成功！', 'success');
    }

    // 显示我的模板
    showMyTemplates() {
        const customTemplates = this.storageManager.getData('custom_templates', {});
        const templatesList = Object.entries(customTemplates).map(([key, template]) => `
            <div class="template-card">
                <div class="template-icon">
                    <i class="${template.icon}"></i>
                </div>
                <div class="template-info">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                </div>
                <div class="template-actions">
                    <button class="btn-primary" onclick="checklistManager.importCustomTemplate('${key}')">导入</button>
                    <button class="btn-secondary" onclick="checklistManager.deleteCustomTemplate('${key}')">删除</button>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="my-templates">
                <div class="template-header">
                    <h3><i class="fas fa-star"></i> 我的模板</h3>
                    <p>管理您创建的自定义模板</p>
                </div>
                <div class="template-list">
                    ${templatesList || '<p class="no-templates">暂无自定义模板</p>'}
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('我的模板', html);
    }

    // 导入自定义模板
    importCustomTemplate(templateKey) {
        const customTemplates = this.storageManager.getData('custom_templates', {});
        const template = customTemplates[templateKey];
        if (!template) return;

        this.importTemplateFromData(template);
        this.modalManager.closeModal();
    }

    // 从数据导入模板
    importTemplateFromData(template) {
        const result = this.modalManager.showConfirmModal(
            '导入模板',
            `确定要导入"${template.name}"吗？`,
            { title: '确认导入' }
        );

        if (result) {
            const currentData = this.storageManager.getData('travelChecklists', {
                luggage: [],
                preparation: [],
                important: []
            });

            Object.keys(template.categories).forEach(category => {
                const templateItems = template.categories[category];
                const currentItems = currentData[category] || [];
                
                templateItems.forEach(templateItem => {
                    const exists = currentItems.some(item => item.text === templateItem.text);
                    if (!exists) {
                        currentItems.push({...templateItem});
                    }
                });
                
                currentData[category] = currentItems;
            });

            this.storageManager.setData('travelChecklists', currentData);
            this.refreshChecklistDisplay();
            this.utils.showMessage(`成功导入"${template.name}"模板！`, 'success');
        }
    }

    // 删除自定义模板
    deleteCustomTemplate(templateKey) {
        const result = this.modalManager.showConfirmModal(
            '删除模板',
            '确定要删除这个自定义模板吗？此操作不可撤销。',
            { title: '确认删除', confirmText: '删除', cancelText: '取消' }
        );

        if (result) {
            const customTemplates = this.storageManager.getData('custom_templates', {});
            delete customTemplates[templateKey];
            this.storageManager.setData('custom_templates', customTemplates);
            
            this.modalManager.closeModal();
            this.utils.showMessage('模板已删除', 'success');
            
            // 重新显示我的模板
            this.showMyTemplates();
        }
    }

    // 生成清单分享链接
    generateShareLink() {
        const checklistData = this.storageManager.getData('travelChecklists', {
            luggage: [],
            preparation: [],
            important: []
        });

        // 生成唯一的分享码
        const shareCode = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // 保存分享数据（简化版本，实际应用中应该发送到服务器）
        const shareData = {
            code: shareCode,
            data: checklistData,
            timestamp: Date.now(),
            title: '旅行清单分享'
        };

        this.storageManager.setData(`share_${shareCode}`, shareData);
        this.currentShareCode = shareCode;

        // 生成分享链接
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareCode}`;
        
        this.modalManager.showCustomModal('分享清单', `
            <div class="share-modal">
                <div class="share-info">
                    <i class="fas fa-share-alt"></i>
                    <h3>清单分享成功！</h3>
                    <p>其他人可以通过以下链接查看和编辑这个清单：</p>
                </div>
                <div class="share-link">
                    <input type="text" value="${shareUrl}" readonly onclick="this.select()">
                    <button class="btn-primary" onclick="checklistManager.copyShareLink('${shareUrl}')">
                        <i class="fas fa-copy"></i> 复制链接
                    </button>
                </div>
                <div class="share-options">
                    <label>
                        <input type="checkbox" id="collaborationMode" onchange="checklistManager.toggleCollaboration(this.checked)">
                        允许协作编辑
                    </label>
                </div>
            </div>
        `);
    }

    // 复制分享链接
    async copyShareLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.utils.showMessage('分享链接已复制到剪贴板！', 'success');
        } catch (err) {
            this.utils.showMessage('复制失败，请手动复制链接', 'error');
        }
    }

    // 切换协作模式
    toggleCollaboration(enabled) {
        this.collaborationMode = enabled;
        this.utils.showMessage(
            enabled ? '协作模式已开启' : '协作模式已关闭', 
            'success'
        );
    }

    // 加载分享的清单
    loadSharedChecklist(shareCode) {
        const shareData = this.storageManager.getData(`share_${shareCode}`, null);
        if (!shareData) {
            this.utils.showMessage('分享链接无效或已过期', 'error');
            return false;
        }

        // 检查链接是否过期（7天）
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (shareData.timestamp < weekAgo) {
            this.utils.showMessage('分享链接已过期', 'error');
            return false;
        }

        // 询问是否导入
        this.modalManager.showConfirmModal(
            '导入分享清单',
            `检测到分享的清单"${shareData.title}"，是否导入到您的清单中？`,
            { title: '导入清单' }
        ).then(result => {
            if (result) {
                this.storageManager.setData('travelChecklists', shareData.data);
                this.refreshChecklistDisplay();
                this.utils.showMessage('分享清单导入成功！', 'success');
            }
        });

        return true;
    }

    // 加载清单数据
    loadChecklistData() {
        const data = this.storageManager.getData('travelChecklists', {
            luggage: [],
            preparation: [],
            important: []
        });
        
        this.checklistData = data;
        this.refreshChecklistDisplay();
    }

    // 刷新清单显示
    refreshChecklistDisplay() {
        ['luggage', 'preparation', 'important'].forEach(category => {
            const container = document.getElementById(`${category}List`);
            const progressElement = document.getElementById(`${category}Progress`);
            
            if (container && this.checklistData[category]) {
                container.innerHTML = this.checklistData[category].map((item, index) => `
                    <div class="checklist-item ${item.completed ? 'completed' : ''}">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} 
                               onchange="checklistManager.toggleItem('${category}', ${index})">
                        <span>${item.text}</span>
                        <button onclick="checklistManager.removeItem('${category}', ${index})" class="remove-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }

            // 更新进度显示
            if (progressElement) {
                const items = this.checklistData[category] || [];
                const completed = items.filter(item => item.completed).length;
                const total = items.length;
                progressElement.textContent = `${completed}/${total}`;
                
                // 添加进度样式
                const progressContainer = progressElement.parentNode;
                if (progressContainer && progressContainer.classList.contains('category-header')) {
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    progressContainer.style.setProperty('--progress', `${percentage}%`);
                }
            }
        });
    }

    // 添加清单项目
    addItem(category, text) {
        if (!text.trim()) return;

        const item = {
            text: text.trim(),
            completed: false
        };

        this.checklistData[category].push(item);
        this.storageManager.setData('travelChecklists', this.checklistData);
        this.refreshChecklistDisplay();

        // 清空输入框
        const input = document.getElementById(`${category}Input`);
        if (input) input.value = '';
    }

    // 切换项目完成状态
    toggleItem(category, index) {
        if (this.checklistData[category][index]) {
            this.checklistData[category][index].completed = !this.checklistData[category][index].completed;
            this.storageManager.setData('travelChecklists', this.checklistData);
            this.refreshChecklistDisplay();
        }
    }

    // 删除项目
    removeItem(category, index) {
        this.checklistData[category].splice(index, 1);
        this.storageManager.setData('travelChecklists', this.checklistData);
        this.refreshChecklistDisplay();
    }

    // 获取清单统计
    getChecklistStats() {
        const stats = {
            total: 0,
            completed: 0,
            percentage: 0
        };

        Object.keys(this.checklistData).forEach(category => {
            const items = this.checklistData[category];
            stats.total += items.length;
            stats.completed += items.filter(item => item.completed).length;
        });

        stats.percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return stats;
    }
}

// 全局函数，供HTML调用
function showTemplateLibrary() {
    if (window.checklistManager) {
        window.checklistManager.showTemplateLibrary();
    }
}

function generateChecklistShareLink() {
    if (window.checklistManager) {
        window.checklistManager.generateShareLink();
    }
}

function addChecklistItem(event, category) {
    event.preventDefault();
    const input = document.getElementById(`${category}Input`);
    if (input && window.checklistManager) {
        window.checklistManager.addItem(category, input.value);
    }
}

// 初始化清单管理器
document.addEventListener('DOMContentLoaded', function() {
    window.checklistManager = new ChecklistManager();
    
    // 检查URL参数中的分享码
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('share');
    if (shareCode && window.checklistManager) {
        window.checklistManager.loadSharedChecklist(shareCode);
    }
});