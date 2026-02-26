// 证件管理模块 - 管理护照、签证等证件的到期提醒
class DocumentManager {
    constructor(dataManager, modalManager) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.documents = this.loadDocuments();
        this.reminderDays = [30, 15, 7, 3, 1]; // 到期前提醒天数
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 定期检查到期提醒
        setInterval(() => {
            this.checkExpiryReminders();
        }, 24 * 60 * 60 * 1000); // 每天检查一次
    }

    // 加载证件数据
    loadDocuments() {
        return this.dataManager.getData('travel_documents', []);
    }

    // 保存证件数据
    saveDocuments() {
        this.dataManager.setData('travel_documents', this.documents);
    }

    // 添加证件
    addDocument(documentData) {
        const newDocument = {
            id: Date.now(),
            name: documentData.name,
            type: documentData.type,
            number: documentData.number,
            issueDate: documentData.issueDate,
            expiryDate: documentData.expiryDate,
            country: documentData.country,
            notes: documentData.notes || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            reminders: []
        };

        this.documents.push(newDocument);
        this.saveDocuments();
        return newDocument;
    }

    // 更新证件
    updateDocument(id, updateData) {
        const index = this.documents.findIndex(doc => doc.id === id);
        if (index !== -1) {
            Object.assign(this.documents[index], updateData);
            this.saveDocuments();
            return this.documents[index];
        }
        return null;
    }

    // 删除证件
    deleteDocument(id) {
        this.documents = this.documents.filter(doc => doc.id !== id);
        this.saveDocuments();
    }

    // 获取所有证件
    getAllDocuments() {
        return this.documents;
    }

    // 根据类型获取证件
    getDocumentsByType(type) {
        return this.documents.filter(doc => doc.type === type);
    }

    // 获取即将到期的证件
    getExpiringDocuments(days = 30) {
        const today = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() + days);

        return this.documents.filter(doc => {
            const expiryDate = new Date(doc.expiryDate);
            return expiryDate >= today && expiryDate <= cutoffDate && doc.status === 'active';
        });
    }

    // 获取已过期的证件
    getExpiredDocuments() {
        const today = new Date();
        return this.documents.filter(doc => {
            const expiryDate = new Date(doc.expiryDate);
            return expiryDate < today && doc.status === 'active';
        });
    }

    // 检查到期提醒
    checkExpiryReminders() {
        const today = new Date();
        const expiringDocs = this.getExpiringDocuments(30);
        
        expiringDocs.forEach(doc => {
            const expiryDate = new Date(doc.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            // 检查是否需要提醒
            if (this.reminderDays.includes(daysUntilExpiry) && 
                !doc.reminders.includes(daysUntilExpiry)) {
                this.sendExpiryReminder(doc, daysUntilExpiry);
                doc.reminders.push(daysUntilExpiry);
                this.saveDocuments();
            }
        });
    }

    // 发送到期提醒
    sendExpiryReminder(document, daysUntilExpiry) {
        const urgencyLevel = this.getUrgencyLevel(daysUntilExpiry);
        const urgencyClass = urgencyLevel.class;
        const urgencyText = urgencyLevel.text;

        const reminderHTML = `
            <div class="document-reminder ${urgencyClass}">
                <div class="reminder-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>证件到期提醒</h4>
                </div>
                <div class="reminder-content">
                    <p><strong>${document.name}</strong> 将在 <strong>${daysUntilExpiry} 天后</strong> 到期</p>
                    <div class="document-details">
                        <div class="detail-item">
                            <span class="label">证件类型:</span>
                            <span class="value">${this.getDocumentTypeName(document.type)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">证件号码:</span>
                            <span class="value">${document.number}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">到期日期:</span>
                            <span class="value">${this.formatDate(document.expiryDate)}</span>
                        </div>
                        ${document.country ? `
                        <div class="detail-item">
                            <span class="label">国家/地区:</span>
                            <span class="value">${document.country}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="reminder-actions">
                    <button onclick="documentManager.renewDocument(${document.id})" class="btn-primary">
                        <i class="fas fa-sync-alt"></i> 更新证件
                    </button>
                    <button onclick="documentManager.markReminderRead(${document.id}, ${daysUntilExpiry})" class="btn-secondary">
                        <i class="fas fa-check"></i> 已知晓
                    </button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('证件到期提醒', reminderHTML);
    }

    // 获取紧急程度
    getUrgencyLevel(daysUntilExpiry) {
        if (daysUntilExpiry <= 7) {
            return { class: 'urgent', text: '紧急' };
        } else if (daysUntilExpiry <= 15) {
            return { class: 'warning', text: '重要' };
        } else {
            return { class: 'info', text: '提醒' };
        }
    }

    // 更新证件（续签）
    renewDocument(id) {
        const document = this.documents.find(doc => doc.id === id);
        if (!document) return;

        const renewalHTML = `
            <div class="document-renewal">
                <h4>更新 ${document.name}</h4>
                <form onsubmit="documentManager.processRenewal(event, ${id})" class="modal-form">
                    <div class="form-group">
                        <label>新到期日期</label>
                        <input type="date" id="newExpiryDate" required>
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea id="renewalNotes" placeholder="更新说明..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="documentManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">确认更新</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('更新证件', renewalHTML);
    }

    // 处理续签
    processRenewal(event, id) {
        event.preventDefault();
        
        const newExpiryDate = document.getElementById('newExpiryDate').value;
        const renewalNotes = document.getElementById('renewalNotes').value;
        
        if (!newExpiryDate) {
            alert('请选择新的到期日期');
            return;
        }

        const document = this.documents.find(doc => doc.id === id);
        if (document) {
            // 记录更新历史
            document.history = document.history || [];
            document.history.push({
                action: 'renewal',
                oldExpiryDate: document.expiryDate,
                newExpiryDate: newExpiryDate,
                notes: renewalNotes,
                date: new Date().toISOString()
            });

            // 更新证件
            document.expiryDate = newExpiryDate;
            document.reminders = []; // 重置提醒
            document.status = 'active';
            if (renewalNotes) {
                document.notes = (document.notes || '') + '\n' + renewalNotes;
            }

            this.saveDocuments();
            this.closeModal();
            
            alert('证件更新成功！');
            this.renderDocumentsList();
        }
    }

    // 标记提醒为已读
    markReminderRead(id, daysUntilExpiry) {
        const document = this.documents.find(doc => doc.id === id);
        if (document) {
            const index = document.reminders.indexOf(daysUntilExpiry);
            if (index > -1) {
                document.reminders.splice(index, 1);
                this.saveDocuments();
            }
        }
        this.closeModal();
    }

    // 关闭模态框
    closeModal() {
        this.modalManager.closeModal();
    }

    // 显示添加证件表单
    showAddDocumentForm() {
        const formHTML = `
            <div class="document-form">
                <h4>添加新证件</h4>
                <form onsubmit="documentManager.processAddDocument(event)" class="modal-form">
                    <div class="form-group">
                        <label>证件名称</label>
                        <input type="text" id="docName" placeholder="例如：中国护照" required>
                    </div>
                    <div class="form-group">
                        <label>证件类型</label>
                        <select id="docType" required>
                            <option value="">请选择类型</option>
                            <option value="passport">护照</option>
                            <option value="visa">签证</option>
                            <option value="id_card">身份证</option>
                            <option value="driver_license">驾照</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>证件号码</label>
                        <input type="text" id="docNumber" placeholder="证件号码" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>签发日期</label>
                            <input type="date" id="issueDate">
                        </div>
                        <div class="form-group">
                            <label>到期日期</label>
                            <input type="date" id="expiryDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>国家/地区</label>
                        <input type="text" id="docCountry" placeholder="签发国家或地区">
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea id="docNotes" placeholder="其他说明..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="documentManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">添加证件</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('添加证件', formHTML);
    }

    // 处理添加证件
    processAddDocument(event) {
        event.preventDefault();

        const documentData = {
            name: document.getElementById('docName').value,
            type: document.getElementById('docType').value,
            number: document.getElementById('docNumber').value,
            issueDate: document.getElementById('issueDate').value,
            expiryDate: document.getElementById('expiryDate').value,
            country: document.getElementById('docCountry').value,
            notes: document.getElementById('docNotes').value
        };

        this.addDocument(documentData);
        this.closeModal();
        this.renderDocumentsList();
        alert('证件添加成功！');
    }

    // 渲染证件列表
    renderDocumentsList(containerId = 'documentsList') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.documents.length === 0) {
            container.innerHTML = `
                <div class="empty-documents">
                    <i class="fas fa-id-card"></i>
                    <h4>还没有添加任何证件</h4>
                    <p>添加您的护照、签证等证件，获得到期提醒服务</p>
                    <button onclick="documentManager.showAddDocumentForm()" class="btn-primary">
                        <i class="fas fa-plus"></i> 添加证件
                    </button>
                </div>
            `;
            return;
        }

        const today = new Date();
        const documentsHTML = this.documents.map(doc => {
            const expiryDate = new Date(doc.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            const status = this.getDocumentStatus(doc, daysUntilExpiry);

            return `
                <div class="document-card ${status.class}">
                    <div class="document-header">
                        <div class="document-info">
                            <h4>${doc.name}</h4>
                            <span class="document-type">${this.getDocumentTypeName(doc.type)}</span>
                        </div>
                        <div class="document-actions">
                            <button onclick="documentManager.editDocument(${doc.id})" class="btn-icon">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="documentManager.deleteDocument(${doc.id})" class="btn-icon delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="document-details">
                        <div class="detail-row">
                            <span class="label">证件号码:</span>
                            <span class="value">${doc.number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">到期日期:</span>
                            <span class="value">${this.formatDate(doc.expiryDate)}</span>
                        </div>
                        ${doc.country ? `
                        <div class="detail-row">
                            <span class="label">国家/地区:</span>
                            <span class="value">${doc.country}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="label">状态:</span>
                            <span class="value status-${status.class}">${status.text}</span>
                        </div>
                    </div>
                    ${daysUntilExpiry <= 30 && daysUntilExpiry >= 0 ? `
                    <div class="expiry-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${daysUntilExpiry}天后到期</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = documentsHTML;
    }

    // 获取证件状态
    getDocumentStatus(document, daysUntilExpiry) {
        if (daysUntilExpiry < 0) {
            return { class: 'expired', text: '已过期' };
        } else if (daysUntilExpiry <= 7) {
            return { class: 'urgent', text: '即将过期' };
        } else if (daysUntilExpiry <= 30) {
            return { class: 'warning', text: '即将到期' };
        } else {
            return { class: 'valid', text: '有效' };
        }
    }

    // 获取证件类型名称
    getDocumentTypeName(type) {
        const types = {
            passport: '护照',
            visa: '签证',
            id_card: '身份证',
            driver_license: '驾照',
            other: '其他'
        };
        return types[type] || type;
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    // 编辑证件
    editDocument(id) {
        const document = this.documents.find(doc => doc.id === id);
        if (!document) return;

        const editHTML = `
            <div class="document-form">
                <h4>编辑证件</h4>
                <form onsubmit="documentManager.processEditDocument(event, ${id})" class="modal-form">
                    <div class="form-group">
                        <label>证件名称</label>
                        <input type="text" id="editDocName" value="${document.name}" required>
                    </div>
                    <div class="form-group">
                        <label>证件类型</label>
                        <select id="editDocType" required>
                            <option value="passport" ${document.type === 'passport' ? 'selected' : ''}>护照</option>
                            <option value="visa" ${document.type === 'visa' ? 'selected' : ''}>签证</option>
                            <option value="id_card" ${document.type === 'id_card' ? 'selected' : ''}>身份证</option>
                            <option value="driver_license" ${document.type === 'driver_license' ? 'selected' : ''}>驾照</option>
                            <option value="other" ${document.type === 'other' ? 'selected' : ''}>其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>证件号码</label>
                        <input type="text" id="editDocNumber" value="${document.number}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>签发日期</label>
                            <input type="date" id="editIssueDate" value="${document.issueDate}">
                        </div>
                        <div class="form-group">
                            <label>到期日期</label>
                            <input type="date" id="editExpiryDate" value="${document.expiryDate}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>国家/地区</label>
                        <input type="text" id="editDocCountry" value="${document.country}">
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea id="editDocNotes">${document.notes}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="documentManager.closeModal()" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">保存更改</button>
                    </div>
                </form>
            </div>
        `;

        this.modalManager.showCustomModal('编辑证件', editHTML);
    }

    // 处理编辑证件
    processEditDocument(event, id) {
        event.preventDefault();

        const updateData = {
            name: document.getElementById('editDocName').value,
            type: document.getElementById('editDocType').value,
            number: document.getElementById('editDocNumber').value,
            issueDate: document.getElementById('editIssueDate').value,
            expiryDate: document.getElementById('editExpiryDate').value,
            country: document.getElementById('editDocCountry').value,
            notes: document.getElementById('editDocNotes').value
        };

        this.updateDocument(id, updateData);
        this.closeModal();
        this.renderDocumentsList();
        alert('证件信息更新成功！');
    }

    // 删除证件确认
    deleteDocument(id) {
        if (confirm('确定要删除这个证件吗？此操作无法撤销。')) {
            this.documents = this.documents.filter(doc => doc.id !== id);
            this.saveDocuments();
            this.renderDocumentsList();
            alert('证件删除成功！');
        }
    }
}

// 全局证件管理器实例
let documentManager;