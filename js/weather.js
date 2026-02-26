// 天气模块 - 管理天气数据获取和显示
class WeatherManager {
    constructor(dataManager, modalManager) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.apiKey = 'your_openweather_api_key'; // 需要替换为实际的API密钥
        this.cache = new Map(); // 缓存天气数据
        this.cacheTimeout = 30 * 60 * 1000; // 30分钟缓存
    }

    // 获取城市天气信息
    async getWeather(city, date = null) {
        try {
            // 构建缓存键
            const cacheKey = `${city}_${date || 'current'}`;
            
            // 检查缓存
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            // 如果是当前天气
            if (!date || this.isToday(date)) {
                const weather = await this.getCurrentWeather(city);
                this.cache.set(cacheKey, {
                    data: weather,
                    timestamp: Date.now()
                });
                return weather;
            }

            // 如果是未来日期的天气预报
            const forecast = await this.getForecast(city);
            this.cache.set(cacheKey, {
                data: forecast,
                timestamp: Date.now()
            });
            return forecast;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            return null;
        }
    }

    // 获取当前天气
    async getCurrentWeather(city) {
        try {
            // 使用模拟数据（实际项目中替换为真实API调用）
            const mockWeather = this.generateMockWeather(city);
            return {
                city: city,
                current: {
                    temperature: mockWeather.temperature,
                    description: mockWeather.description,
                    humidity: mockWeather.humidity,
                    windSpeed: mockWeather.windSpeed,
                    icon: mockWeather.icon
                }
            };
        } catch (error) {
            console.error('获取当前天气失败:', error);
            return null;
        }
    }

    // 获取天气预报
    async getForecast(city) {
        try {
            // 使用模拟数据（实际项目中替换为真实API调用）
            const mockForecast = this.generateMockForecast(city);
            return {
                city: city,
                forecast: mockForecast
            };
        } catch (error) {
            console.error('获取天气预报失败:', error);
            return null;
        }
    }

    // 生成模拟天气数据
    generateMockWeather(city) {
        const weatherTypes = [
            { description: '晴朗', icon: 'fas fa-sun', temp: [15, 25] },
            { description: '多云', icon: 'fas fa-cloud-sun', temp: [12, 22] },
            { description: '阴天', icon: 'fas fa-cloud', temp: [8, 18] },
            { description: '小雨', icon: 'fas fa-cloud-rain', temp: [5, 15] },
            { description: '中雨', icon: 'fas fa-cloud-showers-heavy', temp: [3, 12] }
        ];

        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        const temp = Math.floor(Math.random() * (randomWeather.temp[1] - randomWeather.temp[0]) + randomWeather.temp[0]);

        return {
            temperature: temp,
            description: randomWeather.description,
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
            icon: randomWeather.icon
        };
    }

    // 生成模拟预报数据
    generateMockForecast(city) {
        const forecast = [];
        const weatherTypes = [
            { description: '晴朗', icon: 'fas fa-sun' },
            { description: '多云', icon: 'fas fa-cloud-sun' },
            { description: '阴天', icon: 'fas fa-cloud' },
            { description: '小雨', icon: 'fas fa-cloud-rain' }
        ];

        for (let i = 0; i < 7; i++) {
            const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            const temp = Math.floor(Math.random() * 15) + 10; // 10-25度
            
            forecast.push({
                date: this.getDateString(i),
                day: this.getDayName(i),
                temperature: temp,
                description: randomWeather.description,
                icon: randomWeather.icon,
                humidity: Math.floor(Math.random() * 40) + 40,
                windSpeed: Math.floor(Math.random() * 15) + 5
            });
        }

        return forecast;
    }

    // 获取日期字符串
    getDateString(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    }

    // 获取星期几
    getDayName(daysFromNow) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return days[date.getDay()];
    }

    // 判断是否为今天
    isToday(dateString) {
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    }

    // 在行程规划中显示天气信息
    async displayWeatherInPlanner(city, date) {
        const weatherInfo = document.getElementById('weatherInfo');
        if (!weatherInfo) return;

        const weather = await this.getWeather(city, date);
        if (!weather) {
            weatherInfo.innerHTML = '<div class="weather-error">天气信息获取失败</div>';
            return;
        }

        let weatherHTML = '';
        
        if (weather.current) {
            // 当前天气
            weatherHTML = `
                <div class="current-weather">
                    <div class="weather-icon">
                        <i class="${weather.current.icon}"></i>
                    </div>
                    <div class="weather-details">
                        <div class="temperature">${weather.current.temperature}°C</div>
                        <div class="description">${weather.current.description}</div>
                        <div class="weather-meta">
                            <span><i class="fas fa-tint"></i> ${weather.current.humidity}%</span>
                            <span><i class="fas fa-wind"></i> ${weather.current.windSpeed}km/h</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (weather.forecast) {
            // 预报天气
            weatherHTML = `
                <div class="forecast-weather">
                    <div class="forecast-title">
                        <i class="fas fa-calendar-alt"></i>
                        7天天气预报
                    </div>
                    <div class="forecast-list">
                        ${weather.forecast.slice(0, 5).map(day => `
                            <div class="forecast-day">
                                <div class="forecast-date">${day.day}</div>
                                <div class="forecast-icon">
                                    <i class="${day.icon}"></i>
                                </div>
                                <div class="forecast-temp">${day.temperature}°C</div>
                                <div class="forecast-desc">${day.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        weatherInfo.innerHTML = weatherHTML;
    }

    // 获取活动建议
    getActivitySuggestions(weather, activityType) {
        if (!weather || !weather.current) return [];

        const temp = weather.current.temperature;
        const description = weather.current.description;
        const suggestions = [];

        // 根据温度给出建议
        if (temp > 25) {
            suggestions.push('天气较热，建议穿着轻便透气的衣物');
            if (activityType === 'sightseeing') {
                suggestions.push('适合游览室内景点，避开中午时段的户外活动');
            }
        } else if (temp < 10) {
            suggestions.push('天气较冷，建议穿着保暖衣物');
            if (activityType === 'sightseeing') {
                suggestions.push('适合参观博物馆等室内场所');
            }
        }

        // 根据天气状况给出建议
        if (description.includes('雨')) {
            suggestions.push('建议携带雨具，注意防雨');
            if (activityType === 'sightseeing') {
                suggestions.push('适合参观室内景点或商场');
            }
        } else if (description === '晴朗') {
            suggestions.push('天气晴朗，适合户外活动');
            if (activityType === 'sightseeing') {
                suggestions.push('是拍照和游览景点的好时机');
            }
        }

        return suggestions;
    }

    // 显示天气建议模态框
    showWeatherSuggestions(activityData, weather) {
        const suggestions = this.getActivitySuggestions(weather, activityData.type);
        if (suggestions.length === 0) return;

        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <i class="fas fa-lightbulb"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');

        this.modalManager.showCustomModal('天气建议', `
            <div class="weather-suggestions">
                <div class="weather-summary">
                    <h4>${activityData.location} - ${activityData.date}</h4>
                    <div class="weather-condition">
                        <i class="${weather.current.icon}"></i>
                        <span>${weather.current.temperature}°C ${weather.current.description}</span>
                    </div>
                </div>
                <div class="suggestions-list">
                    <h5>活动建议：</h5>
                    ${suggestionsHTML}
                </div>
            </div>
        `);
    }

    // 保存天气设置
    saveWeatherSettings(settings) {
        this.dataManager.setData('weather_settings', settings);
    }

    // 获取天气设置
    getWeatherSettings() {
        return this.dataManager.getData('weather_settings', {
            enabled: true,
            showSuggestions: true,
            autoRefresh: false
        });
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }
}

// 全局天气管理器实例
let weatherManager;