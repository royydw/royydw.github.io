/**
 * 智能推荐模块
 * 基于历史数据和算法提供旅行相关的智能推荐
 */
class AIRecommendationSystem {
    constructor(dataManager, weatherManager) {
        this.dataManager = dataManager;
        this.weatherManager = weatherManager;
        this.userPreferences = this.loadUserPreferences();
        this.poiDatabase = this.loadPOIDatabase();
    }

    // 加载用户偏好
    loadUserPreferences() {
        const defaultPrefs = {
            preferredActivityTypes: ['sightseeing', 'restaurant'],
            preferredTravelTime: 'morning', // morning, afternoon, evening
            preferredBudgetLevel: 'medium', // low, medium, high
            travelStyle: 'balanced' // balanced, adventurous, relaxed, shopping
        };
        return this.dataManager.storage.getData('userPreferences', defaultPrefs);
    }

    // 保存用户偏好
    saveUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        return this.dataManager.storage.setData('userPreferences', this.userPreferences);
    }

    // 加载POI数据库（兴趣点）
    loadPOIDatabase() {
        // 使用模拟数据，实际项目中可以从API获取
        const defaultPOIs = [
            { id: '1', name: '故宫博物院', type: 'sightseeing', location: '北京', popularity: 95, rating: 4.8, budgetLevel: 'medium' },
            { id: '2', name: '长城', type: 'sightseeing', location: '北京', popularity: 98, rating: 4.9, budgetLevel: 'low' },
            { id: '3', name: '颐和园', type: 'sightseeing', location: '北京', popularity: 90, rating: 4.7, budgetLevel: 'medium' },
            { id: '4', name: '外滩', type: 'sightseeing', location: '上海', popularity: 96, rating: 4.8, budgetLevel: 'low' },
            { id: '5', name: '东方明珠', type: 'sightseeing', location: '上海', popularity: 92, rating: 4.6, budgetLevel: 'medium' },
            { id: '6', name: '豫园', type: 'sightseeing', location: '上海', popularity: 88, rating: 4.5, budgetLevel: 'medium' },
            { id: '7', name: '西湖', type: 'sightseeing', location: '杭州', popularity: 97, rating: 4.9, budgetLevel: 'low' },
            { id: '8', name: '灵隐寺', type: 'sightseeing', location: '杭州', popularity: 91, rating: 4.7, budgetLevel: 'medium' },
            { id: '9', name: '三潭印月', type: 'sightseeing', location: '杭州', popularity: 89, rating: 4.6, budgetLevel: 'medium' },
            { id: '10', name: '成都大熊猫繁育研究基地', type: 'sightseeing', location: '成都', popularity: 94, rating: 4.8, budgetLevel: 'medium' },
            { id: '11', name: '宽窄巷子', type: 'sightseeing', location: '成都', popularity: 93, rating: 4.7, budgetLevel: 'low' },
            { id: '12', name: '锦里古街', type: 'sightseeing', location: '成都', popularity: 92, rating: 4.6, budgetLevel: 'low' },
            { id: '13', name: '三亚湾', type: 'sightseeing', location: '三亚', popularity: 95, rating: 4.8, budgetLevel: 'low' },
            { id: '14', name: '亚龙湾', type: 'sightseeing', location: '三亚', popularity: 96, rating: 4.9, budgetLevel: 'high' },
            { id: '15', name: '蜈支洲岛', type: 'sightseeing', location: '三亚', popularity: 94, rating: 4.8, budgetLevel: 'high' }
        ];
        return this.dataManager.storage.getData('poiDatabase', defaultPOIs);
    }

    // 更新POI数据库
    updatePOIDatabase(pois) {
        this.poiDatabase = pois;
        return this.dataManager.storage.setData('poiDatabase', pois);
    }

    // 基于历史数据推荐景点
    recommendPOIs(destination, tripType, days, preferences = null) {
        const prefs = preferences || this.userPreferences;
        
        // 筛选目标地点的POI
        let filteredPOIs = this.poiDatabase.filter(poi => poi.location === destination);
        
        // 根据用户偏好筛选
        if (prefs.preferredActivityTypes && prefs.preferredActivityTypes.length > 0) {
            filteredPOIs = filteredPOIs.filter(poi => prefs.preferredActivityTypes.includes(poi.type));
        }
        
        if (prefs.preferredBudgetLevel) {
            filteredPOIs = filteredPOIs.filter(poi => poi.budgetLevel === prefs.preferredBudgetLevel);
        }
        
        // 基于历史数据进行个性化排序
        const historyPOIs = this.getHistoricallyPreferredPOIs();
        filteredPOIs = this.rankPOIsByPreference(filteredPOIs, historyPOIs);
        
        // 根据旅行天数限制推荐数量
        const recommendedCount = Math.min(filteredPOIs.length, days * 3); // 每天推荐最多3个景点
        return filteredPOIs.slice(0, recommendedCount);
    }

    // 获取用户历史偏好的POI
    getHistoricallyPreferredPOIs() {
        const trips = this.dataManager.getTrips();
        const allActivities = [];
        
        trips.forEach(trip => {
            if (trip.itinerary && trip.itinerary.length > 0) {
                allActivities.push(...trip.itinerary);
            }
        });
        
        // 统计活动类型偏好
        const activityTypeCount = {};
        allActivities.forEach(activity => {
            activityTypeCount[activity.type] = (activityTypeCount[activity.type] || 0) + 1;
        });
        
        return { activityTypeCount, totalActivities: allActivities.length };
    }

    // 根据用户偏好对POI进行排序
    rankPOIsByPreference(pois, historyData) {
        return pois.sort((a, b) => {
            // 基础评分：流行度和评分的加权平均
            const baseScoreA = (a.popularity * 0.7 + a.rating * 10 * 0.3);
            const baseScoreB = (b.popularity * 0.7 + b.rating * 10 * 0.3);
            
            // 历史偏好加成
            let preferenceScoreA = 0;
            let preferenceScoreB = 0;
            
            if (historyData.activityTypeCount[a.type]) {
                preferenceScoreA = (historyData.activityTypeCount[a.type] / historyData.totalActivities) * 20;
            }
            
            if (historyData.activityTypeCount[b.type]) {
                preferenceScoreB = (historyData.activityTypeCount[b.type] / historyData.totalActivities) * 20;
            }
            
            return (baseScoreB + preferenceScoreB) - (baseScoreA + preferenceScoreA);
        });
    }

    // 智能生成行程路线
    async generateIntelligentItinerary(destination, startDate, endDate, preferences = null) {
        const prefs = preferences || this.userPreferences;
        const days = Utils.calculateDays(startDate, endDate);
        const recommendedPOIs = this.recommendPOIs(destination, prefs.travelStyle, days, prefs);
        
        // 生成每日行程
        const itinerary = [];
        const daysArray = this.getDateArray(startDate, endDate);
        
        // 为每天分配景点
        const poisPerDay = Math.ceil(recommendedPOIs.length / days);
        
        for (let dayIndex = 0; dayIndex < days; dayIndex++) {
            const dayPOIs = recommendedPOIs.slice(dayIndex * poisPerDay, (dayIndex + 1) * poisPerDay);
            const date = daysArray[dayIndex];
            
            // 根据天气调整行程
            const weather = await this.weatherManager.getWeather(destination, date);
            const dayItinerary = this.planDayItinerary(date, dayPOIs, weather, prefs);
            itinerary.push(...dayItinerary);
        }
        
        return itinerary;
    }

    // 规划单日行程
    planDayItinerary(date, pois, weather, preferences) {
        const itinerary = [];
        const dayTimeSlots = ['09:00', '11:30', '14:00', '16:30', '19:00'];
        
        // 根据天气调整活动顺序
        const outdoorPOIs = pois.filter(poi => poi.type === 'sightseeing');
        const indoorPOIs = pois.filter(poi => poi.type !== 'sightseeing');
        
        let orderedPOIs;
        if (weather && weather.current && weather.current.description.includes('雨')) {
            // 雨天优先室内活动
            orderedPOIs = [...indoorPOIs, ...outdoorPOIs];
        } else {
            // 晴天优先室外活动
            orderedPOIs = [...outdoorPOIs, ...indoorPOIs];
        }
        
        // 分配时间槽
        orderedPOIs.forEach((poi, index) => {
            if (index < dayTimeSlots.length) {
                const timeSlot = dayTimeSlots[index];
                const activity = {
                    id: Utils.generateId(),
                    dateTime: `${date}T${timeSlot}`,
                    name: poi.name,
                    location: poi.location,
                    type: poi.type,
                    notes: `推荐指数：${poi.rating}/5.0`,
                    recommended: true
                };
                itinerary.push(activity);
            }
        });
        
        return itinerary;
    }

    // 生成日期数组
    getDateArray(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    // 智能分配预算
    suggestBudgetAllocation(destination, totalBudget, days) {
        const historicalExpenses = this.getHistoricalExpensesByType();
        const defaultAllocation = {
            transport: 0.3,
            accommodation: 0.3,
            food: 0.2,
            sightseeing: 0.15,
            shopping: 0.05
        };
        
        // 根据历史消费习惯调整预算分配
        let allocation = { ...defaultAllocation };
        
        if (historicalExpenses && historicalExpenses.total > 0) {
            // 计算历史支出比例
            const ratios = {};
            let sum = 0;
            
            Object.keys(historicalExpenses.types).forEach(type => {
                ratios[type] = historicalExpenses.types[type] / historicalExpenses.total;
                sum += ratios[type];
            });
            
            // 归一化
            Object.keys(ratios).forEach(type => {
                ratios[type] = ratios[type] / sum;
                if (allocation[type]) {
                    // 加权平均历史比例和默认比例
                    allocation[type] = ratios[type] * 0.7 + allocation[type] * 0.3;
                }
            });
        }
        
        // 生成最终预算分配
        const budgetPlan = {};
        Object.keys(allocation).forEach(category => {
            budgetPlan[category] = Math.round(totalBudget * allocation[category]);
        });
        
        // 计算每日平均预算
        budgetPlan.dailyAverage = Math.round(totalBudget / days);
        budgetPlan.total = totalBudget;
        
        return budgetPlan;
    }

    // 获取历史支出数据
    getHistoricalExpensesByType() {
        const expenses = this.dataManager.getExpenses();
        const typeCounts = {};
        let total = 0;
        
        expenses.forEach(expense => {
            typeCounts[expense.type] = (typeCounts[expense.type] || 0) + expense.amount;
            total += expense.amount;
        });
        
        return { types: typeCounts, total };
    }

    // 基于天气调整行程建议
    async suggestWeatherAdjustments(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip || !trip.itinerary || trip.itinerary.length === 0) return [];
        
        const adjustments = [];
        
        // 按日期分组活动
        const activitiesByDate = {};
        trip.itinerary.forEach(activity => {
            const date = activity.getDate();
            if (!activitiesByDate[date]) {
                activitiesByDate[date] = [];
            }
            activitiesByDate[date].push(activity);
        });
        
        // 检查每一天的天气并提供建议
        for (const date in activitiesByDate) {
            const weather = await this.weatherManager.getWeather(trip.destination, date);
            if (weather && weather.current) {
                const dateAdjustments = this.getWeatherAdjustmentsForDate(
                    date,
                    activitiesByDate[date],
                    weather.current,
                    trip.destination
                );
                adjustments.push(...dateAdjustments);
            }
        }
        
        return adjustments;
    }

    // 获取单日天气调整建议
    getWeatherAdjustmentsForDate(date, activities, weather, destination) {
        const adjustments = [];
        
        // 检查是否有户外活动在雨天
        const outdoorActivities = activities.filter(a => a.type === 'sightseeing' || a.type === 'entertainment');
        
        if (outdoorActivities.length > 0 && weather.description.includes('雨')) {
            // 查找替代室内活动
            const indoorPOIs = this.poiDatabase.filter(poi => 
                poi.location === destination && 
                poi.type !== 'sightseeing' && 
                poi.type !== 'entertainment'
            );
            
            if (indoorPOIs.length > 0) {
                const alternatives = indoorPOIs.slice(0, 3).map(poi => poi.name).join('、');
                adjustments.push({
                    date,
                    type: 'weather',
                    severity: 'warning',
                    message: `当天有雨，建议将户外活动调整为室内活动，推荐：${alternatives}`,
                    affectedActivities: outdoorActivities.map(a => a.id)
                });
            }
        }
        
        // 高温警告
        if (weather.temperature > 30) {
            adjustments.push({
                date,
                type: 'weather',
                severity: 'info',
                message: `当天温度较高(${weather.temperature}°C)，建议携带防晒用品，避免长时间户外活动`,
                affectedActivities: activities.map(a => a.id)
            });
        }
        
        return adjustments;
    }

    // 交通智能规划建议
    suggestTransportation(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip || !trip.itinerary || trip.itinerary.length === 0) return null;
        
        const transportSuggestions = {
            overall: '建议使用公共交通出行，可购买当地交通卡享受优惠',
            dailySuggestions: []
        };
        
        // 按日期分析活动位置
        const activitiesByDate = {};
        trip.itinerary.forEach(activity => {
            const date = activity.getDate();
            if (!activitiesByDate[date]) {
                activitiesByDate[date] = [];
            }
            activitiesByDate[date].push(activity);
        });
        
        // 为每天提供交通建议
        for (const date in activitiesByDate) {
            const dayActivities = activitiesByDate[date];
            const locations = dayActivities.map(a => a.location).filter((loc, index, self) => self.indexOf(loc) === index);
            
            if (locations.length > 3) {
                transportSuggestions.dailySuggestions.push({
                    date,
                    suggestion: '当天活动地点较多，建议包车或使用打车软件，预计交通时间2-3小时',
                    estimatedCost: 150
                });
            } else if (locations.length > 1) {
                transportSuggestions.dailySuggestions.push({
                    date,
                    suggestion: '活动地点相对集中，建议使用公共交通或共享单车',
                    estimatedCost: 20
                });
            }
        }
        
        return transportSuggestions;
    }

    // 学习用户行为
    learnFromUserAction(actionType, data) {
        // 记录用户行为，用于改进推荐算法
        const userActions = this.dataManager.storage.getData('userActions', []);
        userActions.push({
            type: actionType,
            data,
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近1000条记录
        const recentActions = userActions.slice(-1000);
        this.dataManager.storage.setData('userActions', recentActions);
        
        // 更新用户偏好
        this.updateUserPreferencesFromActions(recentActions);
    }

    // 行程排期算法 - 自动安排合理行程
    autoScheduleItinerary(activities, constraints = {}) {
        // 约束条件默认值
        const defaultConstraints = {
            dailyStartTime: '09:00',
            dailyEndTime: '18:00',
            activityDuration: 2 * 60 * 60 * 1000, // 默认2小时
            maxActivitiesPerDay: 5,
            locationProximityThreshold: 10, // 公里
            priorityActivities: []
        };
        
        const actualConstraints = { ...defaultConstraints, ...constraints };
        
        // 1. 按优先级排序活动
        const prioritizedActivities = this.sortActivitiesByPriority(activities, actualConstraints.priorityActivities);
        
        // 2. 按位置聚类活动（使用K-means算法的简化版本）
        const locationClusters = this.clusterActivitiesByLocation(prioritizedActivities);
        
        // 3. 分配活动到日期和时间
        const scheduledActivities = this.assignActivitiesToSchedule(locationClusters, actualConstraints);
        
        // 4. 优化行程顺序（使用路径优化算法）
        const optimizedActivities = this.optimizePath(scheduledActivities);
        
        return optimizedActivities;
    }

    // 按优先级排序活动
    sortActivitiesByPriority(activities, priorityActivities) {
        return activities.sort((a, b) => {
            // 检查是否为优先活动
            const aIsPriority = priorityActivities.includes(a.id);
            const bIsPriority = priorityActivities.includes(b.id);
            
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            
            // 按类型优先级排序
            const typePriority = {
                'accommodation': 1,
                'transport': 2,
                'sightseeing': 3,
                'restaurant': 4,
                'shopping': 5,
                'entertainment': 6
            };
            
            const aPriority = typePriority[a.type] || 10;
            const bPriority = typePriority[b.type] || 10;
            
            if (aPriority !== bPriority) return aPriority - bPriority;
            
            // 按评分排序
            return (b.rating || 0) - (a.rating || 0);
        });
    }

    // 按位置聚类活动
    clusterActivitiesByLocation(activities) {
        const clusters = [];
        const clusteredActivityIds = new Set();
        
        // 简化的聚类算法：查找附近的活动
        activities.forEach((activity, index) => {
            if (clusteredActivityIds.has(activity.id)) return;
            
            const cluster = [activity];
            clusteredActivityIds.add(activity.id);
            
            // 查找附近的活动
            activities.slice(index + 1).forEach(otherActivity => {
                if (!clusteredActivityIds.has(otherActivity.id) && 
                    this.calculateDistance(activity.location, otherActivity.location) < 10) {
                    cluster.push(otherActivity);
                    clusteredActivityIds.add(otherActivity.id);
                }
            });
            
            clusters.push(cluster);
        });
        
        return clusters;
    }

    // 计算两个位置之间的距离（简化版本，实际应使用地图API）
    calculateDistance(location1, location2) {
        // 这里使用模拟距离，实际项目中应使用地图API计算真实距离
        // 例如：使用高德地图API的路径规划接口
        return Math.random() * 20; // 返回0-20公里之间的随机距离
    }

    // 将活动分配到日程表
    assignActivitiesToSchedule(clusters, constraints) {
        const scheduledActivities = [];
        let currentDate = new Date();
        let currentTime = new Date(`${currentDate.toISOString().split('T')[0]}T${constraints.dailyStartTime}`);
        let dailyActivityCount = 0;
        
        clusters.forEach(cluster => {
            cluster.forEach(activity => {
                // 如果当天活动已满，切换到下一天
                if (dailyActivityCount >= constraints.maxActivitiesPerDay) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    currentTime = new Date(`${currentDate.toISOString().split('T')[0]}T${constraints.dailyStartTime}`);
                    dailyActivityCount = 0;
                }
                
                // 设置活动时间
                activity.dateTime = currentTime.toISOString();
                
                // 更新当前时间
                currentTime.setTime(currentTime.getTime() + constraints.activityDuration);
                
                // 检查是否超过结束时间
                const endTime = new Date(`${currentDate.toISOString().split('T')[0]}T${constraints.dailyEndTime}`);
                if (currentTime > endTime) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    currentTime = new Date(`${currentDate.toISOString().split('T')[0]}T${constraints.dailyStartTime}`);
                    dailyActivityCount = 0;
                } else {
                    dailyActivityCount++;
                }
                
                scheduledActivities.push(activity);
            });
        });
        
        return scheduledActivities;
    }

    // 路径优化算法 - 最少时间路径
    optimizePath(activities) {
        if (activities.length <= 1) return activities;
        
        // 按日期分组活动
        const activitiesByDate = {};
        activities.forEach(activity => {
            const date = activity.dateTime.split('T')[0];
            if (!activitiesByDate[date]) {
                activitiesByDate[date] = [];
            }
            activitiesByDate[date].push(activity);
        });
        
        // 对每天的活动应用TSP路径优化
        const optimizedActivities = [];
        
        Object.entries(activitiesByDate).forEach(([date, dayActivities]) => {
            if (dayActivities.length <= 1) {
                optimizedActivities.push(...dayActivities);
                return;
            }
            
            // 使用贪心算法进行TSP路径优化
            const optimizedDayActivities = this.solveTSP(dayActivities);
            optimizedActivities.push(...optimizedDayActivities);
        });
        
        return optimizedActivities;
    }

    // 解决TSP问题（简化的贪心算法）
    solveTSP(activities) {
        if (activities.length <= 1) return activities;
        
        const optimized = [activities[0]];
        const remaining = [...activities.slice(1)];
        
        while (remaining.length > 0) {
            const lastActivity = optimized[optimized.length - 1];
            let closestActivity = null;
            let minDistance = Infinity;
            let closestIndex = -1;
            
            // 找到最近的活动
            remaining.forEach((activity, index) => {
                const distance = this.calculateDistance(lastActivity.location, activity.location);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestActivity = activity;
                    closestIndex = index;
                }
            });
            
            // 添加到优化列表
            if (closestActivity) {
                optimized.push(closestActivity);
                remaining.splice(closestIndex, 1);
            } else {
                // 如果找不到最近的活动（可能位置信息缺失），直接添加剩余活动
                optimized.push(...remaining);
                break;
            }
        }
        
        return optimized;
    }

    // 行程智能优化
    optimizeItinerary(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip || !trip.itinerary || trip.itinerary.length === 0) return null;
        
        // 创建活动副本
        const activities = trip.itinerary.map(activity => new Activity(activity));
        
        // 优化行程
        const optimizedActivities = this.autoScheduleItinerary(activities);
        
        // 更新旅行计划
        trip.itinerary = optimizedActivities;
        this.dataManager.saveTrip(trip);
        
        return {
            originalCount: activities.length,
            optimizedCount: optimizedActivities.length,
            optimizedItinerary: optimizedActivities
        };
    }

    // 获取行程优化建议
    getItineraryOptimizationSuggestions(tripId) {
        const trip = this.dataManager.getTrips().find(t => t.id === tripId);
        if (!trip || !trip.itinerary || trip.itinerary.length === 0) return [];
        
        const activities = trip.itinerary.map(activity => new Activity(activity));
        const suggestions = [];
        
        // 1. 检查活动时间冲突
        const conflicts = this.detectActivityConflicts(activities);
        if (conflicts.length > 0) {
            suggestions.push({
                type: 'conflict',
                message: `检测到${conflicts.length}个时间冲突，建议调整时间或地点`,
                severity: 'warning',
                conflicts: conflicts
            });
        }
        
        // 2. 检查活动分布
        const dailyDistribution = this.getDailyActivityDistribution(activities);
        const maxDailyActivities = Math.max(...Object.values(dailyDistribution));
        if (maxDailyActivities > 6) {
            suggestions.push({
                type: 'overload',
                message: `某一天安排了${maxDailyActivities}个活动，建议减少活动数量以获得更好的旅行体验`,
                severity: 'info',
                distribution: dailyDistribution
            });
        }
        
        // 3. 检查位置效率
        const locationEfficiency = this.evaluateLocationEfficiency(activities);
        if (locationEfficiency.averageDistance > 15) {
            suggestions.push({
                type: 'location',
                message: `活动地点之间平均距离${locationEfficiency.averageDistance.toFixed(1)}公里，建议优化行程顺序`,
                severity: 'info',
                efficiency: locationEfficiency
            });
        }
        
        return suggestions;
    }

    // 检测活动时间冲突
    detectActivityConflicts(activities) {
        const conflicts = [];
        
        for (let i = 0; i < activities.length; i++) {
            for (let j = i + 1; j < activities.length; j++) {
                if (activities[i].isConflictWith(activities[j])) {
                    conflicts.push({
                        activity1: activities[i],
                        activity2: activities[j],
                        date: activities[i].getDate()
                    });
                }
            }
        }
        
        return conflicts;
    }

    // 获取每日活动分布
    getDailyActivityDistribution(activities) {
        const distribution = {};
        
        activities.forEach(activity => {
            const date = activity.getDate();
            distribution[date] = (distribution[date] || 0) + 1;
        });
        
        return distribution;
    }

    // 评估位置效率
    evaluateLocationEfficiency(activities) {
        let totalDistance = 0;
        let segmentCount = 0;
        
        // 按日期分组
        const activitiesByDate = this.getDailyActivityDistribution(activities);
        
        // 计算每日行程距离
        Object.keys(activitiesByDate).forEach(date => {
            const dayActivities = activities.filter(a => a.getDate() === date);
            
            if (dayActivities.length > 1) {
                for (let i = 0; i < dayActivities.length - 1; i++) {
                    const distance = this.calculateDistance(dayActivities[i].location, dayActivities[i + 1].location);
                    totalDistance += distance;
                    segmentCount++;
                }
            }
        });
        
        const averageDistance = segmentCount > 0 ? totalDistance / segmentCount : 0;
        
        return {
            totalDistance: totalDistance,
            segmentCount: segmentCount,
            averageDistance: averageDistance
        };
    }

    // 从用户行为更新偏好
    updateUserPreferencesFromActions(actions) {
        // 分析最近行为，更新用户偏好
        const activityTypeCounts = {};
        const timeSlotCounts = {};
        
        actions.forEach(action => {
            if (action.type === 'activity_completed') {
                // 更新活动类型偏好
                const type = action.data.type;
                activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
                
                // 更新时间段偏好
                const hour = new Date(action.data.dateTime).getHours();
                let timeSlot;
                if (hour < 12) timeSlot = 'morning';
                else if (hour < 18) timeSlot = 'afternoon';
                else timeSlot = 'evening';
                timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
            }
        });
        
        // 更新用户偏好
        if (Object.keys(activityTypeCounts).length > 0) {
            // 获取最常进行的活动类型（前2个）
            const sortedTypes = Object.entries(activityTypeCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([type]) => type);
            
            this.userPreferences.preferredActivityTypes = sortedTypes.slice(0, 2);
        }
        
        if (Object.keys(timeSlotCounts).length > 0) {
            // 获取最偏好的时间段
            const sortedSlots = Object.entries(timeSlotCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([slot]) => slot);
            
            this.userPreferences.preferredTravelTime = sortedSlots[0];
        }
        
        // 保存更新后的偏好
        this.saveUserPreferences(this.userPreferences);
    }
}

// 创建全局实例
window.AIRecommendationSystem = AIRecommendationSystem;