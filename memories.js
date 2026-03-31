// 旅行回忆模块 - 管理照片、日记和旅行统计
class MemoryManager {
    constructor(storageManager, modalManager) {
        this.storageManager = storageManager;
        this.modalManager = modalManager;
        this.memories = this.loadMemories();
        this.photos = this.loadPhotos();
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 监听文件上传
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.accept.includes('image')) {
                this.handlePhotoUpload(e);
            }
        });
    }

    // 加载回忆数据
    loadMemories() {
        return this.storageManager.getData('travelMemories', []);
    }

    // 保存回忆数据
    saveMemories() {
        this.storageManager.setData('travelMemories', this.memories);
    }

    // 加载照片数据
    loadPhotos() {
        return this.storageManager.getData('travelPhotos', []);
    }

    // 保存照片数据
    savePhotos() {
        this.storageManager.setData('travelPhotos', this.photos);
    }

    // 添加新回忆
    addMemory(memoryData) {
        const newMemory = {
            id: Date.now(),
            tripId: memoryData.tripId,
            title: memoryData.title,
            content: memoryData.content,
            date: memoryData.date,
            location: memoryData.location || '',
            mood: memoryData.mood || 'happy',
            photos: memoryData.photos || [],
            weather: memoryData.weather || '',
            companions: memoryData.companions || [],
            tags: memoryData.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.memories.unshift(newMemory);
        this.saveMemories();
        return newMemory;
    }

    // 更新回忆
    updateMemory(id, updateData) {
        const index = this.memories.findIndex(memory => memory.id === id);
        if (index !== -1) {
            Object.assign(this.memories[index], {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            this.saveMemories();
            return this.memories[index];
        }
        return null;
    }

    // 删除回忆
    deleteMemory(id) {
        this.memories = this.memories.filter(memory => memory.id !== id);
        this.saveMemories();
    }

    // 获取所有回忆
    getAllMemories() {
        return this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 根据旅行ID获取回忆
    getMemoriesByTrip(tripId) {
        return this.memories.filter(memory => memory.tripId === tripId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 获取回忆统计
    getMemoryStats() {
        const totalMemories = this.memories.length;
        const totalPhotos = this.photos.length;
        const totalWords = this.memories.reduce((sum, memory) => {
            return sum + (memory.content ? memory.content.length : 0);
        }, 0);
        
        const moodCounts = this.memories.reduce((counts, memory) => {
            counts[memory.mood] = (counts[memory.mood] || 0) + 1;
            return counts;
        }, {});

        const locationCounts = this.memories.reduce((counts, memory) => {
            if (memory.location) {
                counts[memory.location] = (counts[memory.location] || 0) + 1;
            }
            return counts;
        }, {});

        return {
            totalMemories,
            totalPhotos,
            totalWords,
            moodCounts,
            locationCounts,
            averageWordsPerMemory: totalMemories > 0 ? Math.round(totalWords / totalMemories) : 0
        };
    }

    // 处理照片上传
    handlePhotoUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const memoryId = event.target.dataset.memoryId;
        const tripId = event.target.dataset.tripId;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                this.processPhotoUpload(file, memoryId, tripId);
            }
        });
    }

    // 处理单个照片上传
    processPhotoUpload(file, memoryId = null, tripId = null) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const photoData = {
                id: Date.now() + Math.random(),
                memoryId: memoryId,
                tripId: tripId,
                name: file.name,
                url: e.target.result,
                description: '',
                location: '',
                date: new Date().toISOString(),
                tags: [],
                uploadedAt: new Date().toISOString()
            };

            this.photos.unshift(photoData);
            this.savePhotos();

            // 如果关联到回忆，添加到回忆的照片列表
            if (memoryId) {
                const memory = this.memories.find(m => m.id == memoryId);
                if (memory) {
                    memory.photos.push(photoData.id);
                    this.updateMemory(memoryId, { photos: memory.photos });
                }
            }

            // 更新界面
            this.renderMemoriesGallery();
            this.updatePhotoStats();
        };

        reader.readAsDataURL(file);
    }

    // 显示添加回忆表单
    showAddMemoryForm(tripId = null) {
        const formHTML = `
            <div class="memory-form">
                <h4>记录旅行回忆</h4>
                <form onsubmit="memoryManager.processAddMemory(event, '${tripId || ''}')" class="modal-form">
                    <div class="form-group">
                        <label>回忆标题</label>
                        <input type="text" id="memoryTitle" placeholder="给这段回忆起个标题..." required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>日期</label>
                            <input type="date" id="memoryDate" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>心情</label>
                            <select id="memoryMood">
                                <option value="happy">😊 开心</option>
                                <option value="excited">🤩 兴奋</option>
                                <option value="peaceful">😌 平静</option>
                                <option value="surprised">😲 惊喜</option>
                                <option value="nostalgic">😔 怀念</option>
                                <option value="adventurous">🗺️ 冒险</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>地点</label>
                        <input type="text" id="memoryLocation" placeholder="发生了什么有趣的事？">
                    </div>
                    <div class="form-group">
                        <label>回忆内容</label>
                        <textarea id="memoryContent" rows="6" placeholder="详细记录这次旅行的感受和见闻..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>天气</label>
                        <input type="text" id="memoryWeather" placeholder="例如：晴朗、阴天、雨天">
                    </div>
                    <div class="form-group">
                        <label>同伴</label>
                        <input type="text" id="memoryCompanions" placeholder="和谁一起？（用逗号分隔）">
                    </div>
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="memoryTags" placeholder="用标签标记这段回忆（用逗号分隔）">
                    </div>
                    <div class="form-group">
                        <label>照片</label>
                        <input type="file" id="memoryPhotos" accept="image/*" multiple data-memory-id="" data-trip-id="${tripId || ''}">
                        <small class="form-help">支持选择多张照片</small>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="memoryManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">保存回忆</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('添加旅行回忆', formHTML);
    }

    // 处理添加回忆
    processAddMemory(event, tripId) {
        event.preventDefault();

        const memoryData = {
            tripId: tripId || null,
            title: document.getElementById('memoryTitle').value,
            date: document.getElementById('memoryDate').value,
            mood: document.getElementById('memoryMood').value,
            location: document.getElementById('memoryLocation').value,
            content: document.getElementById('memoryContent').value,
            weather: document.getElementById('memoryWeather').value,
            companions: document.getElementById('memoryCompanions').value.split(',').map(s => s.trim()).filter(s => s),
            tags: document.getElementById('memoryTags').value.split(',').map(s => s.trim()).filter(s => s),
            photos: []
        };

        const newMemory = this.addMemory(memoryData);

        // 检查是否有选择的照片
        const photoInput = document.getElementById('memoryPhotos');
        if (photoInput && photoInput.files && photoInput.files.length > 0) {
            // 设置照片上传的memoryId
            photoInput.dataset.memoryId = newMemory.id;
            // 触发上传事件
            this.handlePhotoUpload({ target: photoInput });
        }

        this.closeModal();
        this.renderMemoriesList();
        this.renderMemoriesGallery();
        this.updatePhotoStats();
        alert('回忆保存成功！');
    }

    // 显示编辑回忆表单
    showEditMemoryForm(id) {
        const memory = this.memories.find(m => m.id === id);
        if (!memory) return;

        const editHTML = `
            <div class="memory-form">
                <h4>编辑回忆</h4>
                <form onsubmit="memoryManager.processEditMemory(event, ${id})" class="modal-form">
                    <div class="form-group">
                        <label>回忆标题</label>
                        <input type="text" id="editMemoryTitle" value="${memory.title}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>日期</label>
                            <input type="date" id="editMemoryDate" value="${memory.date}" required>
                        </div>
                        <div class="form-group">
                            <label>心情</label>
                            <select id="editMemoryMood">
                                <option value="happy" ${memory.mood === 'happy' ? 'selected' : ''}>😊 开心</option>
                                <option value="excited" ${memory.mood === 'excited' ? 'selected' : ''}>🤩 兴奋</option>
                                <option value="peaceful" ${memory.mood === 'peaceful' ? 'selected' : ''}>😌 平静</option>
                                <option value="surprised" ${memory.mood === 'surprised' ? 'selected' : ''}>😲 惊喜</option>
                                <option value="nostalgic" ${memory.mood === 'nostalgic' ? 'selected' : ''}>😔 怀念</option>
                                <option value="adventurous" ${memory.mood === 'adventurous' ? 'selected' : ''}>🗺️ 冒险</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>地点</label>
                        <input type="text" id="editMemoryLocation" value="${memory.location}">
                    </div>
                    <div class="form-group">
                        <label>回忆内容</label>
                        <textarea id="editMemoryContent" rows="6">${memory.content}</textarea>
                    </div>
                    <div class="form-group">
                        <label>天气</label>
                        <input type="text" id="editMemoryWeather" value="${memory.weather}">
                    </div>
                    <div class="form-group">
                        <label>同伴</label>
                        <input type="text" id="editMemoryCompanions" value="${memory.companions.join(', ')}">
                    </div>
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="editMemoryTags" value="${memory.tags.join(', ')}">
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="memoryManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">保存更改</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('编辑回忆', editHTML);
    }

    // 处理编辑回忆
    processEditMemory(event, id) {
        event.preventDefault();

        const updateData = {
            title: document.getElementById('editMemoryTitle').value,
            date: document.getElementById('editMemoryDate').value,
            mood: document.getElementById('editMemoryMood').value,
            location: document.getElementById('editMemoryLocation').value,
            content: document.getElementById('editMemoryContent').value,
            weather: document.getElementById('editMemoryWeather').value,
            companions: document.getElementById('editMemoryCompanions').value.split(',').map(s => s.trim()).filter(s => s),
            tags: document.getElementById('editMemoryTags').value.split(',').map(s => s.trim()).filter(s => s)
        };

        this.updateMemory(id, updateData);
        this.closeModal();
        this.renderMemoriesList();
        alert('回忆更新成功！');
    }

    // 渲染回忆列表
    renderMemoriesList(containerId = 'memoriesList') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.memories.length === 0) {
            container.innerHTML = `
                <div class="empty-memories">
                    <i class="fas fa-heart"></i>
                    <h4>还没有记录任何回忆</h4>
                    <p>开始记录您的旅行故事，留下美好瞬间</p>
                    <button onclick="memoryManager.showAddMemoryForm()" class="btn-primary">
                        <i class="fas fa-plus"></i> 记录回忆
                    </button>
                </div>
            `;
            return;
        }

        const memoriesHTML = this.memories.map(memory => {
            const moodEmoji = this.getMoodEmoji(memory.mood);
            const photoCount = memory.photos ? memory.photos.length : 0;

            return `
                <div class="memory-card" data-id="${memory.id}">
                    <div class="memory-header">
                        <div class="memory-info">
                            <h4>${memory.title}</h4>
                            <div class="memory-meta">
                                <span class="memory-date">
                                    <i class="fas fa-calendar"></i>
                                    ${this.formatDate(memory.date)}
                                </span>
                                ${memory.location ? `
                                <span class="memory-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${memory.location}
                                </span>
                                ` : ''}
                                <span class="memory-mood">
                                    ${moodEmoji} ${this.getMoodText(memory.mood)}
                                </span>
                            </div>
                        </div>
                        <div class="memory-actions">
                            <button onclick="memoryManager.showEditMemoryForm(${memory.id})" class="btn-icon">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="memoryManager.deleteMemory(${memory.id})" class="btn-icon delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${memory.content ? `
                    <div class="memory-content">
                        <p>${this.truncateText(memory.content, 200)}</p>
                    </div>
                    ` : ''}
                    
                    <div class="memory-details">
                        ${memory.weather ? `
                        <div class="memory-detail">
                            <i class="fas fa-cloud-sun"></i>
                            <span>${memory.weather}</span>
                        </div>
                        ` : ''}
                        
                        ${memory.companions && memory.companions.length > 0 ? `
                        <div class="memory-detail">
                            <i class="fas fa-users"></i>
                            <span>与 ${memory.companions.join(', ')}</span>
                        </div>
                        ` : ''}
                        
                        ${photoCount > 0 ? `
                        <div class="memory-detail">
                            <i class="fas fa-camera"></i>
                            <span>${photoCount} 张照片</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${memory.tags && memory.tags.length > 0 ? `
                    <div class="memory-tags">
                        ${memory.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = memoriesHTML;
    }

    // 渲染照片画廊
    renderMemoriesGallery(containerId = 'memoriesGallery') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.photos.length === 0) {
            container.innerHTML = `
                <div class="empty-photos">
                    <i class="fas fa-camera"></i>
                    <h4>还没有上传照片</h4>
                    <p>上传您的旅行照片，打造专属相册</p>
                </div>
            `;
            return;
        }

        const photosHTML = this.photos.map(photo => `
            <div class="photo-item" data-id="${photo.id}">
                <div class="photo-container">
                    <img src="${photo.url}" alt="${photo.name}" onclick="memoryManager.viewPhoto(${photo.id})">
                    <div class="photo-overlay">
                        <button onclick="memoryManager.viewPhoto(${photo.id})" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="memoryManager.editPhoto(${photo.id})" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="memoryManager.deletePhoto(${photo.id})" class="btn-icon delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${photo.description ? `
                <div class="photo-description">
                    <p>${photo.description}</p>
                </div>
                ` : ''}
            </div>
        `).join('');

        container.innerHTML = `
            <div class="photos-grid">
                ${photosHTML}
            </div>
        `;
    }

    // 渲染统计信息
    renderMemoryStats(containerId = 'memoryStats') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stats = this.getMemoryStats();
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="stat-info">
                        <h4>回忆总数</h4>
                        <span>${stats.totalMemories}</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <div class="stat-info">
                        <h4>照片总数</h4>
                        <span>${stats.totalPhotos}</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-pen-fancy"></i>
                    </div>
                    <div class="stat-info">
                        <h4>记录字数</h4>
                        <span>${stats.totalWords.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h4>平均字数</h4>
                        <span>${stats.averageWordsPerMemory}</span>
                    </div>
                </div>
            </div>
            
            ${Object.keys(stats.moodCounts).length > 0 ? `
            <div class="mood-analysis">
                <h4>心情分析</h4>
                <div class="mood-stats">
                    ${Object.entries(stats.moodCounts).map(([mood, count]) => `
                        <div class="mood-stat">
                            <span class="mood-emoji">${this.getMoodEmoji(mood)}</span>
                            <span class="mood-name">${this.getMoodText(mood)}</span>
                            <span class="mood-count">${count}次</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
    }

    // 查看照片
    viewPhoto(id) {
        const photo = this.photos.find(p => p.id === id);
        if (!photo) return;

        const viewerHTML = `
            <div class="photo-viewer">
                <div class="photo-viewer-content">
                    <img src="${photo.url}" alt="${photo.name}">
                    <div class="photo-info">
                        <h4>${photo.name}</h4>
                        ${photo.description ? `<p>${photo.description}</p>` : ''}
                        <div class="photo-meta">
                            ${photo.location ? `<span><i class="fas fa-map-marker-alt"></i> ${photo.location}</span>` : ''}
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(photo.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="photo-viewer-actions">
                    <button onclick="memoryManager.closeModal()" class="btn-secondary">关闭</button>
                    <button onclick="memoryManager.editPhoto(${photo.id})" class="btn-primary">编辑</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('照片预览', viewerHTML);
    }

    // 编辑照片
    editPhoto(id) {
        const photo = this.photos.find(p => p.id === id);
        if (!photo) return;

        const editHTML = `
            <div class="photo-edit-form">
                <h4>编辑照片信息</h4>
                <form onsubmit="memoryManager.processEditPhoto(event, ${id})" class="modal-form">
                    <div class="form-group">
                        <label>照片描述</label>
                        <textarea id="editPhotoDescription" rows="3" placeholder="描述这张照片...">${photo.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>拍摄地点</label>
                        <input type="text" id="editPhotoLocation" value="${photo.location}" placeholder="拍摄地点">
                    </div>
                    <div class="form-group">
                        <label>拍摄日期</label>
                        <input type="date" id="editPhotoDate" value="${photo.date.split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="editPhotoTags" value="${photo.tags.join(', ')}" placeholder="用逗号分隔标签">
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="memoryManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">保存更改</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('编辑照片', editHTML);
    }

    // 处理编辑照片
    processEditPhoto(event, id) {
        event.preventDefault();

        const updateData = {
            description: document.getElementById('editPhotoDescription').value,
            location: document.getElementById('editPhotoLocation').value,
            date: document.getElementById('editPhotoDate').value,
            tags: document.getElementById('editPhotoTags').value.split(',').map(s => s.trim()).filter(s => s)
        };

        const index = this.photos.findIndex(p => p.id === id);
        if (index !== -1) {
            Object.assign(this.photos[index], updateData);
            this.savePhotos();
        }

        this.closeModal();
        this.renderMemoriesGallery();
        alert('照片信息更新成功！');
    }

    // 删除照片
    deletePhoto(id) {
        if (confirm('确定要删除这张照片吗？')) {
            this.photos = this.photos.filter(p => p.id !== id);
            this.savePhotos();
            this.renderMemoriesGallery();
            this.updatePhotoStats();
        }
    }

    // 更新照片统计
    updatePhotoStats() {
        const statsElements = {
            totalPhotos: document.getElementById('totalPhotos')
        };
        
        if (statsElements.totalPhotos) {
            statsElements.totalPhotos.textContent = this.photos.length;
        }
    }

    // 获取心情表情
    getMoodEmoji(mood) {
        const emojis = {
            happy: '😊',
            excited: '🤩',
            peaceful: '😌',
            surprised: '😲',
            nostalgic: '😔',
            adventurous: '🗺️'
        };
        return emojis[mood] || '😊';
    }

    // 获取心情文本
    getMoodText(mood) {
        const texts = {
            happy: '开心',
            excited: '兴奋',
            peaceful: '平静',
            surprised: '惊喜',
            nostalgic: '怀念',
            adventurous: '冒险'
        };
        return texts[mood] || '开心';
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    // 截断文本
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 关闭模态框
    closeModal() {
        this.modalManager.closeLastModal();
    }

    // 过滤回忆
    filterMemories() {
        // 这里可以实现回忆的过滤功能
        // 目前只是重新渲染照片画廊
        this.renderMemoriesGallery();
    }
}

// 创建全局实例
let memoryManager;