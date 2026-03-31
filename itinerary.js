/**
 * 行程规划模块
 * 负责活动管理、拖拽排序和冲突检测
 */

class ItineraryManager {
    constructor() {
        this.dataManager = window.dataManager;
        this.modalManager = window.modalManager;
        this.currentTrip = null;
        this.draggedElement = null;
        this.dragOverElement = null;
        this.conflictCheckEnabled = true;
    }

    // 设置当前旅行计划
    setCurrentTrip(trip) {
        this.currentTrip = trip;
    }

    // 获取当前旅行的所有活动
    getActivities() {
        if (!this.currentTrip || !this.currentTrip.itinerary) {
            return [];
        }
        return this.currentTrip.itinerary.map(activity => new Activity(activity));
    }

    // 按日期排序活动
    getActivitiesByDate(date = null) {
        const activities = this.getActivities();
        
        if (date) {
            return activities.filter(activity => activity.getDate() === date)
                           .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        }
        
        return activities.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    }

    // 按日期分组活动
    getActivitiesGroupedByDate() {
        const activities = this.getActivities();
        const grouped = {};
        
        activities.forEach(activity => {
            const date = activity.getDate();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(activity);
        });
        
        // 对每天的活动按时间排序
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        });
        
        return grouped;
    }

    // 添加活动
    addActivity(activityData) {
        if (!this.currentTrip) {
            Utils.showMessage('请先选择一个旅行计划', 'warning');
            return false;
        }

        const activity = new Activity(activityData);
        
        // 检查时间冲突
        if (this.conflictCheckEnabled && this.hasConflict(activity)) {
            const conflictResult = this.showConflictWarning(activity);
            if (!conflictResult.proceed) {
                return false;
            }
        }

        // 添加活动
        if (!this.currentTrip.itinerary) {
            this.currentTrip.itinerary = [];
        }
        
        this.currentTrip.itinerary.push(activity);
        this.saveTrip();
        this.renderItinerary();
        
        Utils.showMessage('活动添加成功！', 'success');
        return true;
    }

    // 更新活动
    updateActivity(activityId, updateData) {
        if (!this.currentTrip) return false;

        const activityIndex = this.currentTrip.itinerary.findIndex(a => a.id === activityId);
        if (activityIndex === -1) return false;

        const updatedActivity = new Activity({
            ...this.currentTrip.itinerary[activityIndex],
            ...updateData
        });

        // 检查时间冲突
        if (this.conflictCheckEnabled && this.hasConflict(updatedActivity, activityId)) {
            const conflictResult = this.showConflictWarning(updatedActivity);
            if (!conflictResult.proceed) {
                return false;
            }
        }

        this.currentTrip.itinerary[activityIndex] = updatedActivity;
        this.saveTrip();
        this.renderItinerary();
        
        Utils.showMessage('活动更新成功！', 'success');
        return true;
    }

    // 删除活动
    deleteActivity(activityId) {
        if (!this.currentTrip) return false;

        const activityIndex = this.currentTrip.itinerary.findIndex(a => a.id === activityId);
        if (activityIndex === -1) return false;

        this.currentTrip.itinerary.splice(activityIndex, 1);
        this.saveTrip();
        this.renderItinerary();
        
        Utils.showMessage('活动删除成功！', 'success');
        return true;
    }

    // 移动活动（拖拽排序）
    moveActivity(fromIndex, toIndex) {
        if (!this.currentTrip || !this.currentTrip.itinerary) return false;

        const activities = this.currentTrip.itinerary;
        if (fromIndex < 0 || fromIndex >= activities.length || 
            toIndex < 0 || toIndex >= activities.length) return false;

        // 重新排序时间
        const movedActivity = activities.splice(fromIndex, 1)[0];
        activities.splice(toIndex, 0, movedActivity);

        // 重新分配时间
        this.reassignTimes(activities);
        
        this.saveTrip();
        this.renderItinerary();
        
        Utils.showMessage('活动排序已更新！', 'success');
        return true;
    }

    // 重新分配活动的时间（保持顺序，调整时间）
    reassignTimes(activities) {
        const baseTime = new Date();
        const timeInterval = 2; // 每个活动间隔2小时

        activities.forEach((activity, index) => {
            const newDate = new Date(baseTime);
            newDate.setHours(newDate.getHours() + (index * timeInterval));
            activity.dateTime = newDate.toISOString();
        });
    }

    // 检查时间冲突
    hasConflict(activity, excludeId = null) {
        const activities = this.getActivities();
        
        return activities.some(otherActivity => {
            if (excludeId && otherActivity.id === excludeId) return false;
            return activity.isConflictWith(otherActivity);
        });
    }

    // 获取冲突的活动
    getConflictingActivities(activity, excludeId = null) {
        const activities = this.getActivities();
        
        return activities.filter(otherActivity => {
            if (excludeId && otherActivity.id === excludeId) return false;
            return activity.isConflictWith(otherActivity);
        });
    }

    // 显示冲突警告
    async showConflictWarning(activity) {
        const conflicts = this.getConflictingActivities(activity);
        const conflictText = conflicts.map(c => 
            `${Utils.formatDateTime(c.dateTime)} - ${c.name} (${c.location})`
        ).join('\n');

        return await this.modalManager.showConfirmModal(
            '时间冲突警告',
            `检测到以下时间冲突：\n${conflictText}\n\n是否继续添加？`,
            { title: '时间冲突检测' }
        );
    }

    // 渲染行程
    renderItinerary(container = null) {
        const itineraryContainer = container || document.getElementById('itineraryTimeline');
        if (!itineraryContainer || !this.currentTrip) {
            if (itineraryContainer) {
                itineraryContainer.innerHTML = '<p class="empty-message">请先选择一个旅行计划</p>';
            }
            return;
        }

        const groupedActivities = this.getActivitiesGroupedByDate();
        const dates = Object.keys(groupedActivities).sort();

        if (dates.length === 0) {
            itineraryContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>还没有安排任何活动</p>
                    <button class="btn btn-primary" onclick="showActivityModal()">添加活动</button>
                </div>
            `;
            return;
        }

        let html = '';
        
        dates.forEach(date => {
            const dayActivities = groupedActivities[date];
            const dayLabel = this.formatDayLabel(date);
            const dayStats = this.getDayStats(dayActivities);
            
            html += `
                <div class="itinerary-day" data-date="${date}">
                    <div class="day-header">
                        <h3>${dayLabel}</h3>
                        <div class="day-stats">
                            <span class="activity-count">${dayActivities.length} 个活动</span>
                            ${dayStats.hasConflict ? '<span class="conflict-badge">有冲突</span>' : ''}
                        </div>
                    </div>
                    <div class="day-activities" data-date="${date}">
                        ${dayActivities.map((activity, index) => this.renderActivityItem(activity, index, date)).join('')}
                    </div>
                </div>
            `;
        });

        itineraryContainer.innerHTML = html;
        this.bindDragEvents();
    }

    // 渲染单个活动项
    renderActivityItem(activity, index, date) {
        const conflicts = this.getConflictingActivities(activity);
        const hasConflict = conflicts.length > 0;
        const conflictInfo = hasConflict ? conflicts.map(c => c.name).join(', ') : '';

        return `
            <div class="timeline-item ${hasConflict ? 'has-conflict' : ''}" 
                 draggable="true" 
                 data-activity-id="${activity.id}" 
                 data-index="${index}">
                <div class="timeline-time">
                    <span class="time">${activity.getTime()}</span>
                    ${hasConflict ? '<span class="conflict-icon"><i class="fas fa-exclamation-triangle"></i></span>' : ''}
                </div>
                <div class="timeline-content">
                    <div class="activity-card">
                        <div class="activity-header">
                            <h4>${activity.name}</h4>
                            <div class="activity-actions">
                                <button onclick="itineraryManager.editActivity(${activity.id})" class="btn-icon">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="itineraryManager.deleteActivity(${activity.id})" class="btn-icon delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button onclick="itineraryManager.showLocationMap('${activity.location}')" class="btn-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </button>
                                ${hasConflict ? `<button onclick="itineraryManager.showConflictDetails('${activity.id}')" class="btn-icon warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </button>` : ''}
                            </div>
                        </div>
                        <div class="activity-info">
                            <span class="activity-type">
                                <i class="fas ${Constants.ACTIVITY_TYPES[activity.type].icon}"></i>
                                ${Constants.ACTIVITY_TYPES[activity.type].name}
                            </span>
                            ${activity.location ? `<span class="activity-location">
                                <i class="fas fa-map-marker-alt"></i> ${activity.location}
                            </span>` : ''}
                        </div>
                        ${activity.notes ? `<div class="activity-notes">${activity.notes}</div>` : ''}
                        ${hasConflict ? `<div class="conflict-info" title="${conflictInfo}">
                            <i class="fas fa-exclamation-triangle"></i> 与以下活动有冲突：${conflictInfo}
                        </div>` : ''}
                    </div>
                </div>
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
            </div>
        `;
    }

    // 绑定拖拽事件
    bindDragEvents() {
        const draggableItems = document.querySelectorAll('.timeline-item[draggable="true"]');
        
        draggableItems.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
            item.addEventListener('dragover', this.handleDragOver.bind(this));
            item.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    // 拖拽开始
    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    // 拖拽结束
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
        this.dragOverElement = null;
        
        // 移除所有拖拽样式
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    // 拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedElement && e.target.closest('.timeline-item')) {
            this.dragOverElement = e.target.closest('.timeline-item');
            this.dragOverElement.classList.add('drag-over');
        }
    }

    // 拖拽放下
    handleDrop(e) {
        e.preventDefault();
        
        if (!this.draggedElement || !this.dragOverElement) return;
        
        const fromIndex = parseInt(this.draggedElement.dataset.index);
        const toIndex = parseInt(this.dragOverElement.dataset.index);
        
        if (fromIndex !== toIndex) {
            this.moveActivity(fromIndex, toIndex);
        }
        
        this.dragOverElement.classList.remove('drag-over');
    }

    // 显示冲突详情
    showConflictDetails(activityId) {
        const activity = this.currentTrip.itinerary.find(a => a.id == activityId);
        if (!activity) return;
        
        const conflicts = this.getConflictingActivities(activity);
        const conflictList = conflicts.map(c => 
            `<li><strong>${c.name}</strong> - ${Utils.formatDateTime(c.dateTime)} (${c.location})</li>`
        ).join('');
        
        this.modalManager.showCustomModal(`
            <div class="modal-content">
                <div class="modal-header">
                    <h3>时间冲突详情</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="conflict-detail">
                        <h4>当前活动：${activity.name}</h4>
                        <p>时间：${Utils.formatDateTime(activity.dateTime)}</p>
                        <p>地点：${activity.location || '未设置'}</p>
                        
                        <h5>冲突活动：</h5>
                        <ul>${conflictList}</ul>
                        
                        <p class="conflict-suggestion">
                            <i class="fas fa-lightbulb"></i>
                            建议调整活动时间或地点以避免冲突
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `);
    }

    // 显示地点地图（集成地图API）
    showLocationMap(location) {
        if (!location) {
            Utils.showMessage('该活动没有设置地点', 'warning');
            return;
        }

        // 这里可以集成地图API，如高德地图或百度地图
        // 目前先显示简单的提示
        Utils.showMessage(`正在为您打开 ${location} 的地图导航`, 'info');
        
        // 可以在这里添加地图集成代码
        // 例如：window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(location)}`);
    }

    // 编辑活动
    editActivity(activityId) {
        const activity = this.currentTrip.itinerary.find(a => a.id == activityId);
        if (!activity) return;

        this.showActivityModal(activity);
    }

    // 显示活动添加/编辑模态框
    showActivityModal(activity = null) {
        const isEdit = !!activity;
        const modalTitle = isEdit ? '编辑活动' : '添加活动';
        
        const template = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="activityForm" class="form-horizontal">
                        <input type="hidden" name="id" value="${activity ? activity.id : ''}">
                        
                        <div class="form-group">
                            <label for="activityDateTime">时间：</label>
                            <input type="datetime-local" 
                                   id="activityDateTime" 
                                   name="dateTime" 
                                   value="${activity ? activity.dateTime.slice(0, 16) : ''}" 
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label for="activityName">活动名称：</label>
                            <input type="text" 
                                   id="activityName" 
                                   name="name" 
                                   value="${activity ? activity.name : ''}" 
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label for="activityLocation">地点：</label>
                            <input type="text" 
                                   id="activityLocation" 
                                   name="location" 
                                   value="${activity ? activity.location : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="activityType">类型：</label>
                            <select id="activityType" name="type" required>
                                ${Object.entries(Constants.ACTIVITY_TYPES).map(([key, type]) => 
                                    `<option value="${key}" ${activity && activity.type === key ? 'selected' : ''}>
                                        ${type.name}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="activityNotes">备注：</label>
                            <textarea id="activityNotes" 
                                      name="notes" 
                                      rows="3">${activity ? activity.notes : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">取消</button>
                    <button class="btn btn-primary" data-action="submit">${isEdit ? '更新' : '添加'}</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal(template).then(result => {
            if (result.success) {
                const formData = result.data;
                const activityData = {
                    dateTime: formData.dateTime,
                    name: formData.name,
                    location: formData.location,
                    type: formData.type,
                    notes: formData.notes
                };

                if (isEdit) {
                    this.updateActivity(activity.id, activityData);
                } else {
                    this.addActivity(activityData);
                }
            }
        });
    }

    // 获取每日统计
    getDayStats(activities) {
        const hasConflict = activities.some(activity => 
            this.getConflictingActivities(activity).length > 0
        );
        
        return {
            totalActivities: activities.length,
            hasConflict: hasConflict,
            conflictCount: activities.filter(activity => 
                this.getConflictingActivities(activity).length > 0
            ).length
        };
    }

    // 格式化日期标签
    formatDayLabel(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            return date.toLocaleDateString('zh-CN', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            });
        }
    }

    // 保存旅行计划
    saveTrip() {
        if (this.currentTrip) {
            this.dataManager.saveTrip(this.currentTrip);
        }
    }

    // 启用/禁用冲突检测
    toggleConflictCheck(enabled) {
        this.conflictCheckEnabled = enabled;
    }

    // 导出行程到日历
    exportToCalendar() {
        const activities = this.getActivities();
        if (activities.length === 0) {
            Utils.showMessage('没有可导出的活动', 'warning');
            return;
        }

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//旅行计划//行程导出//CN'
        ];

        activities.forEach(activity => {
            const startDate = new Date(activity.dateTime);
            const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 默认2小时
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${activity.id}@travel-planner`,
                `DTSTART:${this.formatDateForICS(startDate)}`,
                `DTEND:${this.formatDateForICS(endDate)}`,
                `SUMMARY:${activity.name}`,
                `DESCRIPTION:${activity.notes || ''}`,
                `LOCATION:${activity.location || ''}`,
                'END:VEVENT'
            );
        });

        icsContent.push('END:VCALENDAR');

        // 创建并下载文件
        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentTrip.name || '行程'}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('行程已导出为日历文件', 'success');
    }

    // 格式化ICS日期
    formatDateForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    // 搜索活动
    searchActivities(keyword) {
        const activities = this.getActivities();
        if (!keyword) return activities;
        
        const searchTerm = keyword.toLowerCase();
        return activities.filter(activity => 
            activity.name.toLowerCase().includes(searchTerm) ||
            activity.location.toLowerCase().includes(searchTerm) ||
            activity.notes.toLowerCase().includes(searchTerm)
        );
    }

    // 过滤活动
    filterActivities(filters) {
        let activities = this.getActivities();
        
        if (filters.date) {
            activities = activities.filter(activity => activity.getDate() === filters.date);
        }
        
        if (filters.type) {
            activities = activities.filter(activity => activity.type === filters.type);
        }
        
        if (filters.location) {
            activities = activities.filter(activity => 
                activity.location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }
        
        return activities;
    }
}

// 创建全局实例
window.itineraryManager = new ItineraryManager();