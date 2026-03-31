/**
 * 本地存储管理模块
 * 负责数据的持久化存储和读取
 */

class StorageManager {
    constructor() {
        this.keys = {
            trips: 'travelTrips',
            expenses: 'travelExpenses',
            checklists: 'travelChecklists',
            memories: 'travelMemories',
            documents: 'travelDocuments',
            photos: 'travelPhotos'
        };
    }

    // 获取数据
    getData(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    // 保存数据
    setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
            return false;
        }
    }

    // 清除数据
    clearData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error clearing ${key} from localStorage:`, error);
            return false;
        }
    }

    // 清除所有数据
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data from localStorage:', error);
            return false;
        }
    }

    // 导出数据
    exportData() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.getData(key);
        });
        return data;
    }

    // 导入数据
    importData(data) {
        try {
            Object.entries(this.keys).forEach(([name, key]) => {
                if (data[name] !== undefined) {
                    this.setData(key, data[name]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// 创建全局实例
window.storageManager = new StorageManager();