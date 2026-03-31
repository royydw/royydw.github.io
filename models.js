/**
 * 数据模型模块
 * 定义各种数据结构和管理类
 */

// 旅行计划数据模型
class Trip {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.name = data.name || '';
        this.destination = data.destination || '';
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.description = data.description || '';
        this.budget = data.budget || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.itinerary = data.itinerary || [];
        this.memories = data.memories || [];
        this.documents = data.documents || [];
    }

    getDays() {
        return Utils.calculateDays(this.startDate, this.endDate);
    }

    isActive() {
        const now = new Date();
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        return now >= start && now <= end;
    }

    isUpcoming() {
        const now = new Date();
        const start = new Date(this.startDate);
        return start > now;
    }

    isCompleted() {
        const now = new Date();
        const end = new Date(this.endDate);
        return end < now;
    }
}

// 活动数据模型
class Activity {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.dateTime = data.dateTime || '';
        this.name = data.name || '';
        this.location = data.location || '';
        this.type = data.type || 'sightseeing';
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    getDate() {
        return this.dateTime.split('T')[0];
    }

    getTime() {
        return this.dateTime.split('T')[1] || '';
    }

    isConflictWith(otherActivity) {
        if (this.location !== otherActivity.location) return false;
        
        const thisDate = new Date(this.dateTime);
        const otherDate = new Date(otherActivity.dateTime);
        const timeDiff = Math.abs(thisDate.getTime() - otherDate.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // 如果两个活动在同一个地点，且时间差小于2小时，认为有冲突
        return hoursDiff < 2;
    }
}

// 支出数据模型
class Expense {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.tripId = data.tripId || '';
        this.type = data.type || 'other';
        this.amount = data.amount || 0;
        this.description = data.description || '';
        this.date = data.date || new Date().toISOString();
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    getDate() {
        return this.date.split('T')[0];
    }
}

// 清单项目数据模型
class ChecklistItem {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.text = data.text || '';
        this.completed = data.completed || false;
        this.category = data.category || 'luggage';
        this.priority = data.priority || 'normal'; // high, normal, low
        this.createdAt = data.createdAt || new Date().toISOString();
        this.completedAt = data.completedAt || null;
    }

    toggle() {
        this.completed = !this.completed;
        this.completedAt = this.completed ? new Date().toISOString() : null;
    }
}

// 回忆数据模型
class Memory {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.tripId = data.tripId || '';
        this.title = data.title || '';
        this.content = data.content || '';
        this.photos = data.photos || [];
        this.date = data.date || new Date().toISOString();
        this.location = data.location || '';
        this.mood = data.mood || 'happy'; // happy, excited, relaxed, nostalgic
        this.createdAt = data.createdAt || new Date().toISOString();
    }
}

// 证件数据模型
class Document {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.type = data.type || 'passport'; // passport, visa, id_card, driver_license
        this.number = data.number || '';
        this.name = data.name || '';
        this.issueDate = data.issueDate || '';
        this.expiryDate = data.expiryDate || '';
        this.notes = data.notes || '';
        this.reminder = data.reminder || true;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    getDaysUntilExpiry() {
        if (!this.expiryDate) return Infinity;
        const now = new Date();
        const expiry = new Date(this.expiryDate);
        const timeDiff = expiry.getTime() - now.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    isExpiringSoon(days = 30) {
        return this.getDaysUntilExpiry() <= days;
    }

    isExpired() {
        return this.getDaysUntilExpiry() < 0;
    }
}

// 数据管理类
class DataManager {
    constructor() {
        this.storage = window.storageManager;
    }

    // 旅行计划管理
    getTrips() {
        return this.storage.getData(this.storage.keys.trips, []).map(trip => new Trip(trip));
    }

    saveTrip(trip) {
        const trips = this.getTrips();
        const index = trips.findIndex(t => t.id === trip.id);
        if (index >= 0) {
            trips[index] = trip;
        } else {
            trips.push(trip);
        }
        return this.storage.setData(this.storage.keys.trips, trips);
    }

    deleteTrip(tripId) {
        const trips = this.getTrips().filter(trip => trip.id !== tripId);
        return this.storage.setData(this.storage.keys.trips, trips);
    }

    // 支出管理
    getExpenses(tripId = null) {
        const expenses = this.storage.getData(this.storage.keys.expenses, []);
        if (tripId) {
            return expenses.filter(expense => expense.tripId === tripId).map(expense => new Expense(expense));
        }
        return expenses.map(expense => new Expense(expense));
    }

    saveExpense(expense) {
        const expenses = this.getExpenses();
        const index = expenses.findIndex(e => e.id === expense.id);
        if (index >= 0) {
            expenses[index] = expense;
        } else {
            expenses.push(expense);
        }
        return this.storage.setData(this.storage.keys.expenses, expenses);
    }

    deleteExpense(expenseId) {
        const expenses = this.getExpenses().filter(expense => expense.id !== expenseId);
        return this.storage.setData(this.storage.keys.expenses, expenses);
    }

    // 清单管理
    getChecklists() {
        const defaultChecklists = {
            luggage: [
                new ChecklistItem({ id: 1, text: "护照和签证", completed: false, category: 'luggage' }),
                new ChecklistItem({ id: 2, text: "现金和银行卡", completed: false, category: 'luggage' }),
                new ChecklistItem({ id: 3, text: "衣物", completed: false, category: 'luggage' }),
                new ChecklistItem({ id: 4, text: "洗漱用品", completed: false, category: 'luggage' })
            ],
            preparation: [
                new ChecklistItem({ id: 1, text: "购买机票", completed: false, category: 'preparation' }),
                new ChecklistItem({ id: 2, text: "预订酒店", completed: false, category: 'preparation' }),
                new ChecklistItem({ id: 3, text: "办理签证", completed: false, category: 'preparation' }),
                new ChecklistItem({ id: 4, text: "购买保险", completed: false, category: 'preparation' })
            ],
            important: [
                new ChecklistItem({ id: 1, text: "备份重要文件", completed: false, category: 'important' }),
                new ChecklistItem({ id: 2, text: "告知家人行程", completed: false, category: 'important' }),
                new ChecklistItem({ id: 3, text: "设置手机漫游", completed: false, category: 'important' }),
                new ChecklistItem({ id: 4, text: "检查天气预报", completed: false, category: 'important' })
            ]
        };

        const data = this.storage.getData(this.storage.keys.checklists, defaultChecklists);
        const result = {};
        
        Object.keys(defaultChecklists).forEach(category => {
            result[category] = (data[category] || []).map(item => new ChecklistItem(item));
        });
        
        return result;
    }

    saveChecklists(checklists) {
        return this.storage.setData(this.storage.keys.checklists, checklists);
    }

    // 回忆管理
    getMemories(tripId = null) {
        const memories = this.storage.getData(this.storage.keys.memories, []);
        if (tripId) {
            return memories.filter(memory => memory.tripId === tripId).map(memory => new Memory(memory));
        }
        return memories.map(memory => new Memory(memory));
    }

    saveMemory(memory) {
        const memories = this.getMemories();
        const index = memories.findIndex(m => m.id === memory.id);
        if (index >= 0) {
            memories[index] = memory;
        } else {
            memories.push(memory);
        }
        return this.storage.setData(this.storage.keys.memories, memories);
    }

    deleteMemory(memoryId) {
        const memories = this.getMemories().filter(memory => memory.id !== memoryId);
        return this.storage.setData(this.storage.keys.memories, memories);
    }

    // 证件管理
    getDocuments() {
        return this.storage.getData(this.storage.keys.documents, []).map(doc => new Document(doc));
    }

    saveDocument(document) {
        const documents = this.getDocuments();
        const index = documents.findIndex(d => d.id === document.id);
        if (index >= 0) {
            documents[index] = document;
        } else {
            documents.push(document);
        }
        return this.storage.setData(this.storage.keys.documents, documents);
    }

    deleteDocument(documentId) {
        const documents = this.getDocuments().filter(doc => doc.id !== documentId);
        return this.storage.setData(this.storage.keys.documents, documents);
    }

    // 数据统计
    getStatistics() {
        const trips = this.getTrips();
        const expenses = this.getExpenses();
        const memories = this.getMemories();
        
        return {
            totalTrips: trips.length,
            activeTrips: trips.filter(trip => trip.isActive()).length,
            completedTrips: trips.filter(trip => trip.isCompleted()).length,
            totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
            totalMemories: memories.length,
            averageTripBudget: trips.length > 0 ? trips.reduce((sum, trip) => sum + trip.budget, 0) / trips.length : 0
        };
    }
}

// 常量定义
const Constants = {
    // 活动类型
    ACTIVITY_TYPES: {
        sightseeing: { name: '观光', icon: 'fa-camera' },
        restaurant: { name: '美食', icon: 'fa-utensils' },
        accommodation: { name: '住宿', icon: 'fa-bed' },
        transport: { name: '交通', icon: 'fa-car' },
        shopping: { name: '购物', icon: 'fa-shopping-bag' },
        entertainment: { name: '娱乐', icon: 'fa-music' }
    },

    // 支出类型
    EXPENSE_TYPES: {
        transport: { name: '交通', icon: 'fa-plane' },
        accommodation: { name: '住宿', icon: 'fa-bed' },
        food: { name: '餐饮', icon: 'fa-utensils' },
        sightseeing: { name: '景点', icon: 'fa-camera' },
        shopping: { name: '购物', icon: 'fa-shopping-bag' },
        other: { name: '其他', icon: 'fa-ellipsis-h' }
    },

    // 证件类型
    DOCUMENT_TYPES: {
        passport: { name: '护照', icon: 'fa-passport' },
        visa: { name: '签证', icon: 'fa-stamp' },
        id_card: { name: '身份证', icon: 'fa-id-card' },
        driver_license: { name: '驾照', icon: 'fa-car' }
    },

    // 清单分类
    CHECKLIST_CATEGORIES: {
        luggage: { name: '行李打包', icon: 'fa-suitcase' },
        preparation: { name: '行前准备', icon: 'fa-tasks' },
        important: { name: '重要事项', icon: 'fa-clipboard-list' }
    },

    // 心情选项
    MOOD_OPTIONS: {
        happy: { name: '开心', icon: 'fa-smile' },
        excited: { name: '兴奋', icon: 'fa-star' },
        relaxed: { name: '放松', icon: 'fa-leaf' },
        nostalgic: { name: '怀念', icon: 'fa-heart' }
    }
};

// 创建全局实例
window.DataManager = DataManager;
window.Trip = Trip;
window.Activity = Activity;
window.Expense = Expense;
window.ChecklistItem = ChecklistItem;
window.Memory = Memory;
window.Document = Document;
window.Constants = Constants;