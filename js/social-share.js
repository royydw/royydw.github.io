/**
 * 社交分享模块
 * 负责多人协作、攻略社区、一键分享和数据导出功能
 */
class SocialShareManager {
    constructor(dataManager, modalManager) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.currentUser = this.loadCurrentUser();
        this.collaborationRequests = this.loadCollaborationRequests();
        this.guideCommunity = this.loadGuideCommunity();
    }

    // 加载当前用户信息
    loadCurrentUser() {
        const defaultUser = {
            id: Utils.generateId(),
            name: '旅行者',
            avatar: '',
            email: '',
            createdTrips: [],
            collaboratedTrips: []
        };
        return this.dataManager.storage.getData('currentUser', defaultUser);
    }

    // 保存当前用户信息
    saveCurrentUser(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
        this.dataManager.storage.setData('currentUser', this.currentUser);
        return this.currentUser;
    }

    // 加载协作请求
    loadCollaborationRequests() {
        return this.dataManager.storage.getData('collaborationRequests', []);
    }

    // 保存协作请求
    saveCollaborationRequests(requests) {
        this.collaborationRequests = requests;
        this.dataManager.storage.setData('collaborationRequests', requests);
        return requests;
    }

    // 加载攻略社区数据
    loadGuideCommunity() {
        const defaultGuides = [
            {
                id: '1',
                title: '北京三日游攻略',
                author: '旅行达人A',
                destination: '北京',
                days: 3,
                content: '第一天：故宫 - 天安门 - 王府井；第二天：长城 - 颐和园；第三天：南锣鼓巷 - 什刹海',
                images: [],
                likes: 125,
                comments: [],
                createdAt: new Date().toISOString(),
                tags: ['文化', '历史', '美食']
            },
            {
                id: '2',
                title: '上海迪士尼攻略',
                author: '迪士尼迷B',
                destination: '上海',
                days: 2,
                content: '建议提前一小时到达，先玩热门项目：飞跃地平线、创极速光轮、七个小矮人矿山车',
                images: [],
                likes: 203,
                comments: [],
                createdAt: new Date().toISOString(),
                tags: ['主题乐园', '亲子', '娱乐']
            }
        ];
        return this.dataManager.storage.getData('guideCommunity', defaultGuides);
    }

    // 保存攻略社区数据
    saveGuideCommunity(guides) {
        this.guideCommunity = guides;
        this.dataManager.storage.setData('guideCommunity', guides);
        return guides;
    }

    // 邀请朋友协作
    inviteCollaborator(tripId, email, role = 'editor') {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return false;
        }

        // 检查是否已经是协作者
        if (trip.collaborators && trip.collaborators.some(c => c.email === email)) {
            Utils.showMessage('该用户已经是协作者', 'warning');
            return false;
        }

        // 创建协作请求
        const request = {
            id: Utils.generateId(),
            tripId: tripId,
            tripName: trip.name,
            destination: trip.destination,
            inviter: this.currentUser.name,
            inviteeEmail: email,
            role: role,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.collaborationRequests.push(request);
        this.saveCollaborationRequests(this.collaborationRequests);

        // 添加到旅行计划的协作者列表
        if (!trip.collaborators) {
            trip.collaborators = [];
        }
        trip.collaborators.push({
            email: email,
            role: role,
            joinedAt: null,
            status: 'pending'
        });

        this.dataManager.saveTrip(trip);
        Utils.showMessage('邀请已发送', 'success');
        return true;
    }

    // 接受协作邀请
    acceptCollaborationRequest(requestId) {
        const request = this.collaborationRequests.find(r => r.id === requestId);
        if (!request) {
            Utils.showMessage('协作请求不存在', 'error');
            return false;
        }

        // 更新请求状态
        request.status = 'accepted';
        request.acceptedAt = new Date().toISOString();
        this.saveCollaborationRequests(this.collaborationRequests);

        // 更新旅行计划的协作者状态
        const trip = this.dataManager.getTrips().find(t => t.id === request.tripId);
        if (trip && trip.collaborators) {
            const collaborator = trip.collaborators.find(c => c.email === request.inviteeEmail);
            if (collaborator) {
                collaborator.status = 'accepted';
                collaborator.joinedAt = new Date().toISOString();
                this.dataManager.saveTrip(trip);
            }
        }

        // 更新用户的协作旅行列表
        if (!this.currentUser.collaboratedTrips.includes(request.tripId)) {
            this.currentUser.collaboratedTrips.push(request.tripId);
            this.saveCurrentUser(this.currentUser);
        }

        Utils.showMessage('您已成功加入协作', 'success');
        return true;
    }

    // 拒绝协作邀请
    rejectCollaborationRequest(requestId) {
        const requestIndex = this.collaborationRequests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            Utils.showMessage('协作请求不存在', 'error');
            return false;
        }

        const request = this.collaborationRequests[requestIndex];
        
        // 更新请求状态
        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        this.saveCollaborationRequests(this.collaborationRequests);

        // 从旅行计划的协作者列表中移除
        const trip = this.dataManager.getTrips().find(t => t.id === request.tripId);
        if (trip && trip.collaborators) {
            trip.collaborators = trip.collaborators.filter(c => c.email !== request.inviteeEmail);
            this.dataManager.saveTrip(trip);
        }

        Utils.showMessage('您已拒绝协作邀请', 'info');
        return true;
    }

    // 获取用户的协作请求
    getUserCollaborationRequests() {
        return this.collaborationRequests.filter(request => 
            request.inviteeEmail === this.currentUser.email
        );
    }

    // 获取旅行计划的协作者
    getTripCollaborators(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip || !trip.collaborators) {
            return [];
        }
        return trip.collaborators;
    }

    // 分享攻略到社区
    shareGuideToCommunity(guideData) {
        const guide = {
            id: Utils.generateId(),
            title: guideData.title,
            author: this.currentUser.name,
            authorId: this.currentUser.id,
            destination: guideData.destination,
            days: guideData.days,
            content: guideData.content,
            images: guideData.images || [],
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: guideData.tags || [],
            isFeatured: false
        };

        this.guideCommunity.unshift(guide);
        this.saveGuideCommunity(this.guideCommunity);

        Utils.showMessage('攻略分享成功！', 'success');
        return guide;
    }

    // 获取攻略社区内容
    getGuideCommunityContent(filters = {}) {
        let guides = [...this.guideCommunity];

        // 应用过滤条件
        if (filters.destination) {
            guides = guides.filter(guide => 
                guide.destination.includes(filters.destination)
            );
        }

        if (filters.tags && filters.tags.length > 0) {
            guides = guides.filter(guide => 
                guide.tags.some(tag => filters.tags.includes(tag))
            );
        }

        // 排序
        if (filters.sortBy === 'likes') {
            guides.sort((a, b) => b.likes - a.likes);
        } else if (filters.sortBy === 'newest') {
            guides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return guides;
    }

    // 点赞攻略
    likeGuide(guideId) {
        const guide = this.guideCommunity.find(g => g.id === guideId);
        if (!guide) {
            Utils.showMessage('攻略不存在', 'error');
            return false;
        }

        // 检查是否已经点赞
        const likes = this.dataManager.storage.getData('guideLikes', {});
        if (likes[guideId] && likes[guideId].includes(this.currentUser.id)) {
            Utils.showMessage('您已经点赞过该攻略', 'warning');
            return false;
        }

        // 添加点赞记录
        if (!likes[guideId]) {
            likes[guideId] = [];
        }
        likes[guideId].push(this.currentUser.id);
        this.dataManager.storage.setData('guideLikes', likes);

        // 更新攻略点赞数
        guide.likes += 1;
        guide.updatedAt = new Date().toISOString();
        this.saveGuideCommunity(this.guideCommunity);

        Utils.showMessage('点赞成功！', 'success');
        return true;
    }

    // 评论攻略
    commentGuide(guideId, commentContent) {
        const guide = this.guideCommunity.find(g => g.id === guideId);
        if (!guide) {
            Utils.showMessage('攻略不存在', 'error');
            return false;
        }

        const comment = {
            id: Utils.generateId(),
            author: this.currentUser.name,
            authorId: this.currentUser.id,
            content: commentContent,
            createdAt: new Date().toISOString(),
            replies: []
        };

        guide.comments.push(comment);
        guide.updatedAt = new Date().toISOString();
        this.saveGuideCommunity(this.guideCommunity);

        Utils.showMessage('评论成功！', 'success');
        return true;
    }

    // 生成行程海报
    generateItineraryPoster(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return null;
        }

        // 生成海报HTML
        const posterHTML = `
            <div class="itinerary-poster">
                <div class="poster-header">
                    <h1>${trip.name}</h1>
                    <p>${trip.destination} | ${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)}</p>
                </div>
                <div class="poster-content">
                    <div class="trip-info">
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>天数：${trip.getDays()}天</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-wallet"></i>
                            <span>预算：${Utils.formatCurrency(trip.budget)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>目的地：${trip.destination}</span>
                        </div>
                    </div>
                    ${trip.itinerary && trip.itinerary.length > 0 ? `
                        <div class="itinerary-preview">
                            <h3>行程预览</h3>
                            ${trip.itinerary.slice(0, 3).map(activity => `
                                <div class="activity-item">
                                    <i class="fas ${Constants.ACTIVITY_TYPES[activity.type]?.icon || 'fa-calendar-alt'}"></i>
                                    <div class="activity-info">
                                        <h4>${activity.name}</h4>
                                        <p>${Utils.formatDateTime(activity.dateTime)} | ${activity.location}</p>
                                    </div>
                                </div>
                            `).join('')}
                            ${trip.itinerary.length > 3 ? `<p class="more-activities">... 共${trip.itinerary.length}个活动</p>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="poster-footer">
                    <p>生成于 ${new Date().toLocaleString('zh-CN')}</p>
                    <div class="share-info">
                        <i class="fas fa-share-alt"></i>
                        <span>分享自拾光旅册</span>
                    </div>
                </div>
            </div>
        `;

        return posterHTML;
    }

    // 导出行程为PDF
    exportItineraryToPDF(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return false;
        }

        // 生成PDF内容（简化版，实际项目中应使用jsPDF等库）
        let pdfContent = `旅行计划：${trip.name}\n`;
        pdfContent += `目的地：${trip.destination}\n`;
        pdfContent += `时间：${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)}\n`;
        pdfContent += `天数：${trip.getDays()}天\n`;
        pdfContent += `预算：${Utils.formatCurrency(trip.budget)}\n\n`;

        if (trip.itinerary && trip.itinerary.length > 0) {
            pdfContent += `行程安排：\n`;
            trip.itinerary.forEach((activity, index) => {
                pdfContent += `${index + 1}. ${Utils.formatDateTime(activity.dateTime)} - ${activity.name}\n`;
                pdfContent += `   地点：${activity.location || '未设置'}\n`;
                pdfContent += `   类型：${Constants.ACTIVITY_TYPES[activity.type]?.name || activity.type}\n`;
                if (activity.notes) {
                    pdfContent += `   备注：${activity.notes}\n`;
                }
                pdfContent += `\n`;
            });
        }

        // 下载为文本文件（实际项目中应使用jsPDF生成PDF）
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trip.name}_行程单.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('行程单已导出', 'success');
        return true;
    }

    // 导出预算为Excel
    exportBudgetToExcel(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return false;
        }

        const expenses = this.dataManager.getExpenses(tripId);
        if (expenses.length === 0) {
            Utils.showMessage('没有可导出的预算数据', 'warning');
            return false;
        }

        // 生成CSV内容（Excel兼容）
        let csvContent = '类型,描述,金额,日期\n';
        expenses.forEach(expense => {
            const typeName = Constants.EXPENSE_TYPES[expense.type]?.name || expense.type;
            csvContent += `${typeName},${expense.description},${expense.amount},${Utils.formatDate(expense.date)}\n`;
        });

        // 统计信息
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        csvContent += `\n总计,支出总额,${totalSpent},\n`;
        csvContent += `,预算总额,${trip.budget},\n`;
        csvContent += `,剩余预算,${trip.budget - totalSpent},\n`;

        // 下载为CSV文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trip.name}_预算表.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('预算表已导出', 'success');
        return true;
    }

    // 显示协作邀请模态框
    showCollaborationInviteModal(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return;
        }

        const modalContent = `
            <div class="collaboration-invite-modal">
                <div class="modal-header">
                    <h3>邀请好友协作</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>旅行计划：${trip.name}</h4>
                    <p>目的地：${trip.destination}</p>
                    <p>时间：${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)}</p>
                    
                    <form id="collaborationForm">
                        <div class="form-group">
                            <label for="collaboratorEmail">好友邮箱：</label>
                            <input type="email" id="collaboratorEmail" required placeholder="请输入好友的邮箱地址">
                        </div>
                        
                        <div class="form-group">
                            <label for="collaboratorRole">权限：</label>
                            <select id="collaboratorRole">
                                <option value="editor">编辑 - 可修改行程</option>
                                <option value="viewer">查看 - 仅可查看</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="inviteMessage">邀请留言：</label>
                            <textarea id="inviteMessage" rows="3" placeholder="可选：给好友的留言"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">取消</button>
                    <button class="btn btn-primary" onclick="socialShareManager.handleInviteSubmit('${tripId}')">发送邀请</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('邀请好友协作', modalContent);
    }

    // 处理邀请提交
    handleInviteSubmit(tripId) {
        const email = document.getElementById('collaboratorEmail').value;
        const role = document.getElementById('collaboratorRole').value;
        // const message = document.getElementById('inviteMessage').value;

        if (!email) {
            Utils.showMessage('请输入邮箱地址', 'warning');
            return;
        }

        this.inviteCollaborator(tripId, email, role);
        this.modalManager.closeModal();
    }

    // 显示攻略社区界面
    showGuideCommunity() {
        const guides = this.getGuideCommunityContent({ sortBy: 'newest' });

        const modalContent = `
            <div class="guide-community-modal">
                <div class="modal-header">
                    <h3>攻略社区</h3>
                    <button class="btn btn-primary" onclick="socialShareManager.showCreateGuideModal()">
                        <i class="fas fa-plus"></i> 分享攻略
                    </button>
                </div>
                <div class="modal-body">
                    <div class="guide-filters">
                        <input type="text" id="destinationFilter" placeholder="搜索目的地">
                        <select id="sortByFilter">
                            <option value="newest">最新发布</option>
                            <option value="likes">最多点赞</option>
                        </select>
                        <button class="btn btn-sm btn-info" onclick="socialShareManager.filterGuides()">搜索</button>
                    </div>
                    
                    <div class="guides-list">
                        ${guides.map(guide => this.renderGuideCard(guide)).join('')}
                    </div>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('攻略社区', modalContent, { width: '900px' });
    }

    // 渲染攻略卡片
    renderGuideCard(guide) {
        return `
            <div class="guide-card" data-guide-id="${guide.id}">
                <div class="guide-header">
                    <h4>${guide.title}</h4>
                    <div class="guide-meta">
                        <span class="guide-author">${guide.author}</span>
                        <span class="guide-date">${Utils.formatDate(guide.createdAt)}</span>
                        <span class="guide-destination">${guide.destination}</span>
                    </div>
                </div>
                <div class="guide-content">
                    <p>${guide.content.substring(0, 150)}${guide.content.length > 150 ? '...' : ''}</p>
                </div>
                <div class="guide-footer">
                    <div class="guide-tags">
                        ${guide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="guide-actions">
                        <button class="btn-icon" onclick="socialShareManager.likeGuide('${guide.id}')">
                            <i class="fas fa-heart"></i>
                            <span>${guide.likes}</span>
                        </button>
                        <button class="btn-icon" onclick="socialShareManager.showGuideDetail('${guide.id}')">
                            <i class="fas fa-comment"></i>
                            <span>${guide.comments.length}</span>
                        </button>
                        <button class="btn-icon" onclick="socialShareManager.shareGuide('${guide.id}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 显示攻略详情
    showGuideDetail(guideId) {
        const guide = this.guideCommunity.find(g => g.id === guideId);
        if (!guide) {
            Utils.showMessage('攻略不存在', 'error');
            return;
        }

        const modalContent = `
            <div class="guide-detail-modal">
                <div class="modal-header">
                    <h3>${guide.title}</h3>
                    <button class="btn btn-sm btn-primary" onclick="socialShareManager.showCreateGuideModal(${JSON.stringify(guide)})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                </div>
                <div class="modal-body">
                    <div class="guide-info">
                        <div class="guide-author">
                            <i class="fas fa-user"></i>
                            <span>${guide.author}</span>
                        </div>
                        <div class="guide-meta">
                            <span>${Utils.formatDate(guide.createdAt)}</span>
                            <span>${guide.destination} | ${guide.days}天</span>
                        </div>
                        <div class="guide-tags">
                            ${guide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="guide-content">
                        <p>${guide.content.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div class="guide-actions">
                        <button class="btn btn-secondary" onclick="socialShareManager.likeGuide('${guide.id}')">
                            <i class="fas fa-heart"></i> 点赞 (${guide.likes})
                        </button>
                        <button class="btn btn-info" onclick="socialShareManager.showCommentSection('${guide.id}')">
                            <i class="fas fa-comment"></i> 评论 (${guide.comments.length})
                        </button>
                        <button class="btn btn-success" onclick="socialShareManager.shareGuide('${guide.id}')">
                            <i class="fas fa-share-alt"></i> 分享
                        </button>
                    </div>
                    
                    <div class="guide-comments">
                        <h4>评论区</h4>
                        ${guide.comments.map(comment => this.renderComment(comment)).join('')}
                        ${guide.comments.length === 0 ? '<p class="no-comments">暂无评论</p>' : ''}
                        
                        <div class="add-comment">
                            <input type="text" id="newComment" placeholder="写下您的评论..." maxlength="200">
                            <button class="btn btn-primary" onclick="socialShareManager.addComment('${guide.id}')">发送</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="close">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal(guide.title, modalContent, { width: '800px' });
    }

    // 渲染评论
    renderComment(comment) {
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${Utils.formatDateTime(comment.createdAt)}</span>
                </div>
                <div class="comment-content">
                    <p>${comment.content}</p>
                </div>
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => this.renderComment(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 添加评论
    addComment(guideId) {
        const content = document.getElementById('newComment').value;
        if (!content.trim()) {
            Utils.showMessage('请输入评论内容', 'warning');
            return;
        }

        this.commentGuide(guideId, content);
        this.showGuideDetail(guideId); // 重新加载详情
    }

    // 过滤攻略
    filterGuides() {
        const destination = document.getElementById('destinationFilter').value;
        const sortBy = document.getElementById('sortByFilter').value;
        
        const filters = {
            destination: destination,
            sortBy: sortBy
        };
        
        const filteredGuides = this.getGuideCommunityContent(filters);
        const guidesList = document.querySelector('.guides-list');
        
        if (guidesList) {
            guidesList.innerHTML = filteredGuides.map(guide => this.renderGuideCard(guide)).join('');
        }
    }

    // 分享攻略
    shareGuide(guideId) {
        const guide = this.guideCommunity.find(g => g.id === guideId);
        if (!guide) {
            Utils.showMessage('攻略不存在', 'error');
            return;
        }

        // 生成分享链接（模拟）
        const shareUrl = `https://travel-planner.com/guide/${guideId}`;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(shareUrl).then(() => {
            Utils.showMessage('分享链接已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('无法复制链接:', err);
            Utils.showMessage('复制失败，请手动复制链接', 'error');
        });
    }

    // 显示创建攻略模态框
    showCreateGuideModal(guideData = null) {
        const isEdit = !!guideData;
        const modalContent = `
            <div class="create-guide-modal">
                <div class="modal-header">
                    <h3>${isEdit ? '编辑攻略' : '分享新攻略'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="guideForm">
                        <div class="form-group">
                            <label for="guideTitle">标题：</label>
                            <input type="text" id="guideTitle" required value="${guideData?.title || ''}" placeholder="请输入攻略标题">
                        </div>
                        
                        <div class="form-group">
                            <label for="guideDestination">目的地：</label>
                            <input type="text" id="guideDestination" required value="${guideData?.destination || ''}" placeholder="请输入目的地">
                        </div>
                        
                        <div class="form-group">
                            <label for="guideDays">天数：</label>
                            <input type="number" id="guideDays" min="1" max="30" required value="${guideData?.days || 3}">
                        </div>
                        
                        <div class="form-group">
                            <label for="guideTags">标签：</label>
                            <input type="text" id="guideTags" value="${guideData?.tags?.join(', ') || ''}" placeholder="多个标签用逗号分隔，如：文化,美食,历史">
                        </div>
                        
                        <div class="form-group">
                            <label for="guideContent">攻略内容：</label>
                            <textarea id="guideContent" rows="8" required placeholder="请详细描述您的旅行攻略，包括行程安排、美食推荐、住宿建议等">${guideData?.content || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="guideImages">上传图片：</label>
                            <input type="file" id="guideImages" accept="image/*" multiple>
                            <small>可选：上传攻略相关图片</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">取消</button>
                    <button class="btn btn-primary" onclick="socialShareManager.handleGuideSubmit(${isEdit ? JSON.stringify(guideData) : null})">${isEdit ? '保存修改' : '发布攻略'}</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal(isEdit ? '编辑攻略' : '分享新攻略', modalContent, { width: '700px' });
    }

    // 处理攻略提交
    handleGuideSubmit(guideData = null) {
        const title = document.getElementById('guideTitle').value;
        const destination = document.getElementById('guideDestination').value;
        const days = parseInt(document.getElementById('guideDays').value);
        const tags = document.getElementById('guideTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const content = document.getElementById('guideContent').value;
        // const images = document.getElementById('guideImages').files;

        if (!title || !destination || !content) {
            Utils.showMessage('请填写必填字段', 'warning');
            return;
        }

        const guideDataToSave = {
            title: title,
            destination: destination,
            days: days,
            tags: tags,
            content: content,
            images: []
        };

        if (guideData) {
            // 编辑现有攻略
            const guide = this.guideCommunity.find(g => g.id === guideData.id);
            if (guide) {
                Object.assign(guide, guideDataToSave);
                guide.updatedAt = new Date().toISOString();
                this.saveGuideCommunity(this.guideCommunity);
                Utils.showMessage('攻略已更新', 'success');
            }
        } else {
            // 发布新攻略
            this.shareGuideToCommunity(guideDataToSave);
        }

        this.modalManager.closeModal();
        this.showGuideCommunity(); // 刷新社区界面
    }

    // 显示分享选项
    showShareOptions(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip) {
            Utils.showMessage('旅行计划不存在', 'error');
            return;
        }

        const modalContent = `
            <div class="share-options-modal">
                <div class="modal-header">
                    <h3>分享旅行计划</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>旅行计划：${trip.name}</h4>
                    <p>目的地：${trip.destination}</p>
                    <p>时间：${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)}</p>
                    
                    <div class="share-options-grid">
                        <div class="share-option" onclick="socialShareManager.showCreateGuideModal(${JSON.stringify({ title: trip.name, destination: trip.destination, content: this.generateGuideContentFromTrip(trip) })})">
                            <div class="share-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="share-info">
                                <h5>分享到攻略社区</h5>
                                <p>将您的行程分享给其他旅行者</p>
                            </div>
                        </div>
                        
                        <div class="share-option" onclick="socialShareManager.showCollaborationInviteModal('${tripId}')">
                            <div class="share-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="share-info">
                                <h5>邀请好友协作</h5>
                                <p>邀请朋友共同规划行程</p>
                            </div>
                        </div>
                        
                        <div class="share-option" onclick="socialShareManager.generateItineraryPoster('${tripId}')">
                            <div class="share-icon">
                                <i class="fas fa-image"></i>
                            </div>
                            <div class="share-info">
                                <h5>生成行程海报</h5>
                                <p>创建美观的行程分享海报</p>
                            </div>
                        </div>
                        
                        <div class="share-option" onclick="socialShareManager.exportItineraryToPDF('${tripId}')">
                            <div class="share-icon">
                                <i class="fas fa-file-pdf"></i>
                            </div>
                            <div class="share-info">
                                <h5>导出PDF行程单</h5>
                                <p>生成PDF格式的行程安排</p>
                            </div>
                        </div>
                        
                        <div class="share-option" onclick="socialShareManager.exportBudgetToExcel('${tripId}')">
                            <div class="share-icon">
                                <i class="fas fa-file-excel"></i>
                            </div>
                            <div class="share-info">
                                <h5>导出Excel预算表</h5>
                                <p>生成Excel格式的预算明细</p>
                            </div>
                        </div>
                        
                        <div class="share-option" onclick="socialShareManager.generateShareLink('${tripId}')">
                            <div class="share-icon">
                                <i class="fas fa-share-alt"></i>
                            </div>
                            <div class="share-info">
                                <h5>生成分享链接</h5>
                                <p>分享行程的网页链接</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('分享旅行计划', modalContent);
    }

    // 从旅行计划生成攻略内容
    generateGuideContentFromTrip(trip) {
        let content = `# ${trip.name}\n\n`;
        content += `**目的地**：${trip.destination}\n\n`;
        content += `**旅行时间**：${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)} (共${trip.getDays()}天)\n\n`;
        
        if (trip.itinerary && trip.itinerary.length > 0) {
            content += `## 行程安排\n\n`;
            
            // 按日期分组
            const activitiesByDate = {};
            trip.itinerary.forEach(activity => {
                const date = activity.getDate();
                if (!activitiesByDate[date]) {
                    activitiesByDate[date] = [];
                }
                activitiesByDate[date].push(activity);
            });
            
            let day = 1;
            Object.entries(activitiesByDate).forEach(([date, activities]) => {
                content += `### 第${day}天 (${Utils.formatDate(date)})\n\n`;
                activities.forEach(activity => {
                    content += `- ${Utils.formatTime(activity.dateTime)}：${activity.name}\n`;
                    content += `  ${activity.location || ''}\n`;
                    if (activity.notes) {
                        content += `  ${activity.notes}\n`;
                    }
                });
                content += `\n`;
                day++;
            });
        }
        
        return content;
    }

    // 生成分享链接
    generateShareLink(tripId) {
        // 模拟分享链接生成
        const shareUrl = `https://travel-planner.com/trip/${tripId}`;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(shareUrl).then(() => {
            Utils.showMessage('分享链接已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('无法复制链接:', err);
            Utils.showMessage('复制失败，请手动复制链接', 'error');
        });
    }
}

// 创建全局实例
let socialShareManager;