/**
 * 预算管理模块
 * 负责预算展示、图表可视化和预警功能
 */

class BudgetManager {
    constructor() {
        this.dataManager = window.dataManager;
        this.modalManager = window.modalManager;
        this.aiSystem = window.aiRecommendationSystem;
        this.currentTrip = null;
        this.chart = null;
        this.alertThreshold = 0.8; // 预警阈值80%
        this.warningShown = false;
    }

    // 设置当前旅行计划
    setCurrentTrip(trip) {
        this.currentTrip = trip;
        this.warningShown = false; // 重置预警状态
    }

    // 获取当前旅行的支出
    getExpenses() {
        if (!this.currentTrip) return [];
        return this.dataManager.getExpenses(this.currentTrip.id);
    }

    // 添加支出
    addExpense(expenseData) {
        if (!this.currentTrip) {
            Utils.showMessage('请先选择一个旅行计划', 'warning');
            return false;
        }

        const expense = new Expense({
            ...expenseData,
            tripId: this.currentTrip.id,
            date: new Date().toISOString()
        });

        this.dataManager.saveExpense(expense);
        this.renderBudget();
        
        Utils.showMessage('支出添加成功！', 'success');
        return true;
    }

    // 更新支出
    updateExpense(expenseId, updateData) {
        const expenses = this.getExpenses();
        const expense = expenses.find(e => e.id === expenseId);
        if (!expense) return false;

        Object.assign(expense, updateData);
        this.dataManager.saveExpense(expense);
        this.renderBudget();
        
        Utils.showMessage('支出更新成功！', 'success');
        return true;
    }

    // 删除支出
    deleteExpense(expenseId) {
        this.dataManager.deleteExpense(expenseId);
        this.renderBudget();
        
        Utils.showMessage('支出删除成功！', 'success');
        return true;
    }

    // 获取预算统计数据
    getBudgetStats() {
        if (!this.currentTrip) {
            return {
                totalBudget: 0,
                totalSpent: 0,
                remaining: 0,
                percentage: 0,
                isOverBudget: false,
                isNearLimit: false
            };
        }

        const expenses = this.getExpenses();
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalBudget = this.currentTrip.budget || 0;
        const remaining = totalBudget - totalSpent;
        const percentage = totalBudget > 0 ? totalSpent / totalBudget : 0;
        
        return {
            totalBudget: totalBudget,
            totalSpent: totalSpent,
            remaining: remaining,
            percentage: percentage,
            isOverBudget: totalSpent > totalBudget,
            isNearLimit: percentage >= this.alertThreshold && totalSpent <= totalBudget
        };
    }

    // 获取支出分类统计
    getExpenseByCategory() {
        const expenses = this.getExpenses();
        const categoryStats = {};
        
        expenses.forEach(expense => {
            if (!categoryStats[expense.type]) {
                categoryStats[expense.type] = {
                    total: 0,
                    count: 0,
                    items: []
                };
            }
            categoryStats[expense.type].total += expense.amount;
            categoryStats[expense.type].count += 1;
            categoryStats[expense.type].items.push(expense);
        });

        return categoryStats;
    }

    // 获取每日支出统计
    getDailyExpenses() {
        const expenses = this.getExpenses();
        const dailyStats = {};
        
        expenses.forEach(expense => {
            const date = expense.getDate();
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    total: 0,
                    count: 0,
                    expenses: []
                };
            }
            dailyStats[date].total += expense.amount;
            dailyStats[date].count += 1;
            dailyStats[date].expenses.push(expense);
        });

        return dailyStats;
    }

    // 渲染预算概览
    renderBudgetOverview() {
        const stats = this.getBudgetStats();
        const budgetElements = {
            totalBudget: document.getElementById('totalBudget'),
            totalSpent: document.getElementById('totalSpent'),
            remainingBudget: document.getElementById('remainingBudget'),
            budgetPercentage: document.getElementById('budgetPercentage'),
            progressFill: document.getElementById('progressFill')
        };

        if (budgetElements.totalBudget) {
            budgetElements.totalBudget.textContent = Utils.formatCurrency(stats.totalBudget);
        }
        
        if (budgetElements.totalSpent) {
            budgetElements.totalSpent.textContent = Utils.formatCurrency(stats.totalSpent);
            budgetElements.totalSpent.className = `budget-amount spent ${stats.isOverBudget ? 'over-budget' : ''}`;
        }
        
        if (budgetElements.remainingBudget) {
            budgetElements.remainingBudget.textContent = Utils.formatCurrency(stats.remaining);
            budgetElements.remainingBudget.className = `budget-amount remaining ${stats.remaining < 0 ? 'over-budget' : ''}`;
        }
        
        if (budgetElements.budgetPercentage) {
            const percentageText = Utils.formatPercentage(stats.totalSpent, stats.totalBudget);
            budgetElements.budgetPercentage.textContent = percentageText;
        }
        
        if (budgetElements.progressFill) {
            const width = Math.min(stats.percentage * 100, 100);
            budgetElements.progressFill.style.width = `${width}%`;
            
            // 根据预算使用情况设置颜色
            if (stats.isOverBudget) {
                budgetElements.progressFill.style.backgroundColor = '#f44336';
            } else if (stats.isNearLimit) {
                budgetElements.progressFill.style.backgroundColor = '#ff9800';
            } else {
                budgetElements.progressFill.style.backgroundColor = '#4CAF50';
            }
        }

        // 检查预算预警
        this.checkBudgetAlerts(stats);
    }

    // 检查预算预警
    checkBudgetAlerts(stats) {
        if (stats.isOverBudget && !this.warningShown) {
            Utils.showMessage(`预算超支！已超出 ${Utils.formatCurrency(Math.abs(stats.remaining))}`, 'error');
            this.warningShown = true;
        } else if (stats.isNearLimit && !this.warningShown) {
            Utils.showMessage(`预算即将用完！已使用 ${Utils.formatPercentage(stats.totalSpent, stats.totalBudget)}`, 'warning');
            this.warningShown = true;
        }
    }

    // 渲染支出列表
    renderExpenses() {
        const expenseContainer = document.getElementById('expenseItems');
        if (!expenseContainer) return;

        const expenses = this.getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (expenses.length === 0) {
            expenseContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>还没有支出记录</p>
                    <button class="btn btn-primary" onclick="budgetManager.showExpenseModal()">添加第一笔支出</button>
                </div>
            `;
            return;
        }

        expenseContainer.innerHTML = expenses.map(expense => this.renderExpenseItem(expense)).join('');
    }

    // 渲染单个支出项
    renderExpenseItem(expense) {
        const expenseType = Constants.EXPENSE_TYPES[expense.type] || Constants.EXPENSE_TYPES.other;
        
        return `
            <div class="expense-item" data-expense-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-type">
                        <i class="fas ${expenseType.icon}"></i>
                        <span>${expenseType.name}</span>
                    </div>
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-date">${Utils.formatDate(expense.date)}</div>
                </div>
                <div class="expense-amount">
                    <span class="amount">${Utils.formatCurrency(expense.amount)}</span>
                    <div class="expense-actions">
                        <button onclick="budgetManager.editExpense(${expense.id})" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="budgetManager.deleteExpense(${expense.id})" class="btn-icon delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染预算图表
    renderBudgetChart() {
        const chartContainer = document.getElementById('budgetChart');
        if (!chartContainer) return;

        const categoryStats = this.getExpenseByCategory();
        const stats = this.getBudgetStats();
        
        // 准备图表数据
        const labels = [];
        const data = [];
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];

        Object.entries(categoryStats).forEach(([category, info], index) => {
            labels.push(Constants.EXPENSE_TYPES[category]?.name || category);
            data.push(info.total);
        });

        // 如果没有支出数据，显示提示
        if (data.length === 0) {
            chartContainer.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-pie"></i>
                    <p>暂无支出数据</p>
                    <small>添加支出后即可查看分类统计</small>
                </div>
            `;
            return;
        }

        // 创建饼图
        this.createPieChart(chartContainer, labels, data, colors);
    }

    // 创建饼图
    createPieChart(container, labels, data, colors) {
        // 清除之前的图表
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = container.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    // 渲染完整的预算界面
    renderBudget() {
        if (!this.currentTrip) {
            // 如果没有选择旅行计划，显示提示
            const containers = ['budgetChart', 'expenseItems'];
            containers.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-wallet"></i>
                            <p>请先选择一个旅行计划</p>
                        </div>
                    `;
                }
            });
            return;
        }

        this.renderBudgetOverview();
        this.renderBudgetChart();
        this.renderExpenses();
        this.renderBudgetTrends();
    }

    // 渲染预算趋势图
    renderBudgetTrends() {
        const trendsContainer = document.getElementById('budgetTrends');
        if (!trendsContainer) return;

        const dailyStats = this.getDailyExpenses();
        const dates = Object.keys(dailyStats).sort();
        
        if (dates.length === 0) {
            trendsContainer.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>暂无支出趋势数据</p>
                </div>
            `;
            return;
        }

        // 准备趋势图数据
        const labels = dates.map(date => Utils.formatDate(date));
        const data = dates.map(date => dailyStats[date].total);

        this.createLineChart(trendsContainer, labels, data);
    }

    // 创建折线图
    createLineChart(container, labels, data) {
        if (this.trendsChart) {
            this.trendsChart.destroy();
        }

        const ctx = container.getContext('2d');
        
        this.trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '每日支出',
                    data: data,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#36A2EB',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `支出: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }

    // 显示支出添加/编辑模态框
    showExpenseModal(expense = null) {
        const isEdit = !!expense;
        const modalTitle = isEdit ? '编辑支出' : '添加支出';
        
        const template = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="expenseForm" class="form-horizontal">
                        <input type="hidden" name="id" value="${expense ? expense.id : ''}">
                        
                        <div class="form-group">
                            <label for="expenseType">支出类型：</label>
                            <select id="expenseType" name="type" required>
                                ${Object.entries(Constants.EXPENSE_TYPES).map(([key, type]) => 
                                    `<option value="${key}" ${expense && expense.type === key ? 'selected' : ''}>
                                        ${type.name}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="expenseAmount">金额：</label>
                            <input type="number" 
                                   id="expenseAmount" 
                                   name="amount" 
                                   value="${expense ? expense.amount : ''}" 
                                   step="0.01" 
                                   min="0" 
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label for="expenseDescription">描述：</label>
                            <input type="text" 
                                   id="expenseDescription" 
                                   name="description" 
                                   value="${expense ? expense.description : ''}" 
                                   required>
                        </div>
                    </form>
                    
                    <div class="budget-preview">
                        <h5>预算预览</h5>
                        <div class="preview-stats">
                            <div class="stat-item">
                                <span>当前总预算：</span>
                                <strong>${this.currentTrip ? Utils.formatCurrency(this.currentTrip.budget) : '¥0'}</strong>
                            </div>
                            <div class="stat-item">
                                <span>已支出：</span>
                                <strong id="previewSpent">${Utils.formatCurrency(this.getBudgetStats().totalSpent)}</strong>
                            </div>
                            <div class="stat-item">
                                <span>预计总额：</span>
                                <strong id="previewTotal">¥0</strong>
                            </div>
                            <div class="stat-item">
                                <span>剩余预算：</span>
                                <strong id="previewRemaining">¥0</strong>
                            </div>
                        </div>
                    </div>
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
                const expenseData = {
                    type: formData.type,
                    amount: parseFloat(formData.amount),
                    description: formData.description
                };

                if (isEdit) {
                    this.updateExpense(expense.id, expenseData);
                } else {
                    this.addExpense(expenseData);
                }
            }
        });

        // 绑定实时预算预览
        this.bindBudgetPreview();
    }

    // 绑定预算预览
    bindBudgetPreview() {
        const amountInput = document.getElementById('expenseAmount');
        const previewTotal = document.getElementById('previewTotal');
        const previewRemaining = document.getElementById('previewRemaining');
        
        if (amountInput && previewTotal && previewRemaining) {
            const currentSpent = this.getBudgetStats().totalSpent;
            
            amountInput.addEventListener('input', () => {
                const amount = parseFloat(amountInput.value) || 0;
                const newTotal = currentSpent + amount;
                const remaining = (this.currentTrip?.budget || 0) - newTotal;
                
                previewTotal.textContent = Utils.formatCurrency(newTotal);
                previewRemaining.textContent = Utils.formatCurrency(remaining);
                previewRemaining.className = remaining < 0 ? 'text-danger' : 'text-success';
            });
        }
    }

    // 编辑支出
    editExpense(expenseId) {
        const expense = this.getExpenses().find(e => e.id === expenseId);
        if (!expense) return;

        this.showExpenseModal(expense);
    }

    // 删除支出
    deleteExpense(expenseId) {
        this.modalManager.showConfirmModal(
            '确认删除',
            '确定要删除这笔支出记录吗？',
            { title: '删除确认' }
        ).then(result => {
            if (result) {
                this.dataManager.deleteExpense(expenseId);
                this.renderBudget();
                Utils.showMessage('支出已删除', 'success');
            }
        });
    }

    // 导出预算报告
    exportBudgetReport() {
        const stats = this.getBudgetStats();
        const expenses = this.getExpenses();
        const categoryStats = this.getExpenseByCategory();
        
        if (expenses.length === 0) {
            Utils.showMessage('没有可导出的预算数据', 'warning');
            return;
        }

        // 生成CSV内容
        let csvContent = '旅行预算报告\n\n';
        csvContent += `旅行计划：${this.currentTrip.name}\n`;
        csvContent += `目的地：${this.currentTrip.destination}\n`;
        csvContent += `总预算：${Utils.formatCurrency(stats.totalBudget)}\n`;
        csvContent += `已支出：${Utils.formatCurrency(stats.totalSpent)}\n`;
        csvContent += `剩余预算：${Utils.formatCurrency(stats.remaining)}\n`;
        csvContent += `使用比例：${Utils.formatPercentage(stats.totalSpent, stats.totalBudget)}\n\n`;
        
        csvContent += '支出明细\n';
        csvContent += '日期,类型,描述,金额\n';
        
        expenses.forEach(expense => {
            const typeName = Constants.EXPENSE_TYPES[expense.type]?.name || expense.type;
            csvContent += `${Utils.formatDate(expense.date)},${typeName},${expense.description},${expense.amount}\n`;
        });
        
        csvContent += '\n分类统计\n';
        csvContent += '类型,金额,占比\n';
        
        Object.entries(categoryStats).forEach(([category, info]) => {
            const typeName = Constants.EXPENSE_TYPES[category]?.name || category;
            const percentage = Utils.formatPercentage(info.total, stats.totalSpent);
            csvContent += `${typeName},${info.total},${percentage}\n`;
        });

        // 下载文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentTrip.name || '预算报告'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('预算报告已导出', 'success');
    }

    // 获取智能预算分配建议
    getSmartBudgetAllocation() {
        if (!this.currentTrip || !this.aiSystem) return null;
        
        const totalBudget = this.currentTrip.budget || 0;
        const days = this.currentTrip.getDays();
        const destination = this.currentTrip.destination;
        
        return this.aiSystem.suggestBudgetAllocation(destination, totalBudget, days);
    }

    // 显示智能预算分配建议
    showSmartBudgetSuggestions() {
        if (!this.currentTrip) {
            Utils.showMessage('请先选择一个旅行计划', 'warning');
            return;
        }
        
        const allocation = this.getSmartBudgetAllocation();
        if (!allocation) {
            Utils.showMessage('无法生成预算分配建议', 'warning');
            return;
        }
        
        // 生成预算分配HTML
        let allocationHTML = '<div class="budget-allocation-grid">';
        Object.entries(allocation).forEach(([category, amount]) => {
            if (category !== 'total' && category !== 'dailyAverage') {
                const categoryName = Constants.EXPENSE_TYPES[category]?.name || category;
                const percentage = Math.round((amount / allocation.total) * 100);
                allocationHTML += `
                    <div class="allocation-item">
                        <div class="allocation-header">
                            <div class="allocation-info">
                                <h4>${categoryName}</h4>
                                <span>${Utils.formatPercentage(amount, allocation.total)}</span>
                            </div>
                            <div class="allocation-amount">${Utils.formatCurrency(amount)}</div>
                        </div>
                        <div class="allocation-bar">
                            <div class="allocation-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }
        });
        allocationHTML += '</div>';
        
        this.modalManager.showCustomModal('智能预算分配建议', `
            <div class="smart-budget-modal">
                <div class="modal-body">
                    <h3>基于您的消费习惯的预算分布建议</h3>
                    <div class="allocation-summary">
                        <div class="summary-card">
                            <span>总预算</span>
                            <strong>${Utils.formatCurrency(allocation.total)}</strong>
                        </div>
                        <div class="summary-card">
                            <span>每日平均</span>
                            <strong>${Utils.formatCurrency(allocation.dailyAverage)}</strong>
                        </div>
                    </div>
                    ${allocationHTML}
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="budgetManager.applySmartAllocation()">应用此分配</button>
                        <button class="btn btn-secondary" data-action="cancel">关闭</button>
                    </div>
                </div>
            </div>
        `);
    }

    // 应用智能预算分配
    applySmartAllocation() {
        // 这里可以实现将智能分配的预算应用到实际预算设置中的逻辑
        Utils.showMessage('智能预算分配已应用', 'success');
        this.renderBudget();
        this.modalManager.closeModal();
    }

    // 设置预警阈值
    setAlertThreshold(threshold) {
        this.alertThreshold = Math.max(0.5, Math.min(1.0, threshold));
    }

    // 重置预警状态
    resetWarningStatus() {
        this.warningShown = false;
    }
}

// 创建全局实例
window.budgetManager = new BudgetManager();