/**
 * 实用工具扩展模块
 * 负责货币换算、语言助手、紧急求助和健康提醒功能
 */
class ToolsManager {
    constructor(dataManager, modalManager) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.currentUser = this.loadCurrentUser();
        this.exchangeRates = this.loadExchangeRates();
        this.languagePhrases = this.loadLanguagePhrases();
        this.embassies = this.loadEmbassies();
    }

    // 加载当前用户信息
    loadCurrentUser() {
        const defaultUser = {
            id: Utils.generateId(),
            name: '旅行者',
            avatar: '',
            email: '',
            preferredCurrency: 'CNY',
            preferredLanguage: 'zh'
        };
        return this.dataManager.storage.getData('currentUser', defaultUser);
    }

    // 保存当前用户信息
    saveCurrentUser(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
        this.dataManager.storage.setData('currentUser', this.currentUser);
        return this.currentUser;
    }

    // 加载汇率数据
    loadExchangeRates() {
        const defaultRates = {
            base: 'USD',
            rates: {
                USD: 1.0,
                CNY: 7.12,
                EUR: 0.91,
                GBP: 0.78,
                JPY: 148.23,
                KRW: 1320.50,
                SGD: 1.35,
                AUD: 1.54
            },
            updatedAt: new Date().toISOString()
        };
        return this.dataManager.storage.getData('exchangeRates', defaultRates);
    }

    // 保存汇率数据
    saveExchangeRates(rates) {
        this.exchangeRates = rates;
        this.dataManager.storage.setData('exchangeRates', rates);
        return rates;
    }

    // 获取实时汇率（模拟API调用）
    async fetchExchangeRates(baseCurrency = 'USD') {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 生成模拟汇率数据
        const rates = {
            base: baseCurrency,
            rates: {
                USD: 1.0,
                CNY: 7.10 + Math.random() * 0.10,
                EUR: 0.90 + Math.random() * 0.05,
                GBP: 0.77 + Math.random() * 0.05,
                JPY: 148.00 + Math.random() * 5.00,
                KRW: 1320.00 + Math.random() * 20.00,
                SGD: 1.34 + Math.random() * 0.03,
                AUD: 1.53 + Math.random() * 0.05
            },
            updatedAt: new Date().toISOString()
        };
        
        // 保存到本地存储
        this.saveExchangeRates(rates);
        return rates;
    }

    // 货币换算
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        // 如果汇率数据超过1小时，更新数据
        const lastUpdated = new Date(this.exchangeRates.updatedAt);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) {
            this.fetchExchangeRates(this.exchangeRates.base);
        }

        // 将金额转换为基础货币（USD）
        const amountInBase = fromCurrency === this.exchangeRates.base 
            ? amount 
            : amount / this.exchangeRates.rates[fromCurrency];
        
        // 转换为目标货币
        const convertedAmount = toCurrency === this.exchangeRates.base 
            ? amountInBase 
            : amountInBase * this.exchangeRates.rates[toCurrency];
        
        return Math.round(convertedAmount * 100) / 100;
    }

    // 显示货币换算工具
    showCurrencyConverter() {
        const currencies = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD', 'AUD'];
        const currencyNames = {
            CNY: '人民币 (CNY)',
            USD: '美元 (USD)',
            EUR: '欧元 (EUR)',
            GBP: '英镑 (GBP)',
            JPY: '日元 (JPY)',
            KRW: '韩元 (KRW)',
            SGD: '新加坡元 (SGD)',
            AUD: '澳大利亚元 (AUD)'
        };

        const modalContent = `
            <div class="currency-converter-modal">
                <div class="modal-header">
                    <h3>货币换算</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="converter-content">
                        <div class="converter-row">
                            <div class="input-group">
                                <label for="fromAmount">金额：</label>
                                <input type="number" id="fromAmount" value="100" min="0" step="0.01">
                            </div>
                            <div class="currency-group">
                                <label for="fromCurrency">从：</label>
                                <select id="fromCurrency">
                                    ${currencies.map(curr => `
                                        <option value="${curr}" ${curr === this.currentUser.preferredCurrency ? 'selected' : ''}>
                                            ${currencyNames[curr]}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="converter-arrow">
                            <button id="swapCurrencies" class="btn-icon"><i class="fas fa-exchange-alt"></i></button>
                        </div>
                        
                        <div class="converter-row">
                            <div class="input-group">
                                <label for="toAmount">结果：</label>
                                <input type="number" id="toAmount" disabled>
                            </div>
                            <div class="currency-group">
                                <label for="toCurrency">到：</label>
                                <select id="toCurrency">
                                    ${currencies.map(curr => `
                                        <option value="${curr}" ${curr === (this.currentUser.preferredCurrency === 'CNY' ? 'USD' : 'CNY') ? 'selected' : ''}>
                                            ${currencyNames[curr]}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="rate-info">
                            <p id="exchangeRateInfo">
                                汇率最后更新：${new Date(this.exchangeRates.updatedAt).toLocaleString('zh-CN')}
                            </p>
                            <button id="refreshRates" class="btn btn-sm btn-info">
                                <i class="fas fa-sync-alt"></i> 更新汇率
                            </button>
                        </div>
                    </div>
                    
                    <div class="favorites-section">
                        <h4>常用换算</h4>
                        <div class="favorite-conversions">
                            <button class="btn btn-secondary btn-sm" onclick="toolsManager.convertQuickly(100, 'CNY', 'USD')">100 CNY → USD</button>
                            <button class="btn btn-secondary btn-sm" onclick="toolsManager.convertQuickly(100, 'USD', 'CNY')">100 USD → CNY</button>
                            <button class="btn btn-secondary btn-sm" onclick="toolsManager.convertQuickly(100, 'EUR', 'CNY')">100 EUR → CNY</button>
                            <button class="btn btn-secondary btn-sm" onclick="toolsManager.convertQuickly(1000, 'JPY', 'CNY')">1000 JPY → CNY</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('货币换算', modalContent);
        
        // 绑定事件
        this.bindCurrencyConverterEvents();
        // 初始计算
        this.calculateConversion();
    }

    // 绑定货币换算器事件
    bindCurrencyConverterEvents() {
        const fromAmount = document.getElementById('fromAmount');
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        const swapBtn = document.getElementById('swapCurrencies');
        const refreshBtn = document.getElementById('refreshRates');

        // 输入变化事件
        fromAmount.addEventListener('input', () => this.calculateConversion());
        fromCurrency.addEventListener('change', () => this.calculateConversion());
        toCurrency.addEventListener('change', () => this.calculateConversion());

        // 交换货币
        swapBtn.addEventListener('click', () => {
            const tempValue = fromCurrency.value;
            fromCurrency.value = toCurrency.value;
            toCurrency.value = tempValue;
            this.calculateConversion();
        });

        // 刷新汇率
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 更新中...';
            refreshBtn.disabled = true;
            
            try {
                await this.fetchExchangeRates();
                this.calculateConversion();
                const rateInfo = document.getElementById('exchangeRateInfo');
                rateInfo.textContent = `汇率最后更新：${new Date(this.exchangeRates.updatedAt).toLocaleString('zh-CN')}`;
                Utils.showMessage('汇率已更新', 'success');
            } catch (error) {
                console.error('更新汇率失败:', error);
                Utils.showMessage('更新汇率失败', 'error');
            } finally {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 更新汇率';
                refreshBtn.disabled = false;
            }
        });
    }

    // 计算货币换算
    calculateConversion() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const toAmount = document.getElementById('toAmount');

        const result = this.convertCurrency(fromAmount, fromCurrency, toCurrency);
        toAmount.value = result;
    }

    // 快速换算
    convertQuickly(amount, from, to) {
        const fromAmount = document.getElementById('fromAmount');
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');

        fromAmount.value = amount;
        fromCurrency.value = from;
        toCurrency.value = to;
        this.calculateConversion();
    }

    // 加载常用短语
    loadLanguagePhrases() {
        return {
            zh: {
                greetings: ['你好', '再见', '谢谢', '不客气'],
                directions: ['请问，...在哪里？', '去...怎么走？', '地铁站在哪里？', '公交车站在哪里？'],
                dining: ['我要一份...', '这个多少钱？', '请给我菜单', '可以刷卡吗？'],
                accommodation: ['我有预订', '房间钥匙', '请问早餐在哪里？', '可以延长退房时间吗？'],
                emergencies: ['救命！', '我需要帮助', '我迷路了', '请叫救护车']
            },
            en: {
                greetings: ['Hello', 'Goodbye', 'Thank you', 'You are welcome'],
                directions: ['Excuse me, where is...?', 'How to get to...?', 'Where is the subway station?', 'Where is the bus stop?'],
                dining: ['I would like...', 'How much is this?', 'Menu, please', 'Can I pay by card?'],
                accommodation: ['I have a reservation', 'Room key', 'Where is breakfast?', 'Can I extend checkout time?'],
                emergencies: ['Help!', 'I need help', 'I am lost', 'Please call an ambulance']
            },
            ja: {
                greetings: ['こんにちは', 'さようなら', 'ありがとう', 'どういたしまして'],
                directions: ['すみません、...はどこですか？', '...への行き方は？', '地下鉄の駅はどこですか？', 'バス停はどこですか？'],
                dining: ['...をお願いします', 'これはいくらですか？', 'メニューをお願いします', 'カードで払えますか？'],
                accommodation: ['予約があります', '部屋の鍵', '朝食はどこですか？', 'チェックアウト時間を延ばせますか？'],
                emergencies: ['助けて！', '助けが必要です', '迷子になりました', '救急車を呼んでください']
            },
            ko: {
                greetings: ['안녕하세요', '안녕히 계세요', '감사합니다', '천만에요'],
                directions: ['죄송합니다, ... 어디예요?', '... 어떻게 가요?', '지하철 역은 어디예요?', '버스 정류장은 어디예요?'],
                dining: ['... 주세요', '이것은 얼마예요?', '메뉴 주세요', '카드로 결제할 수 있나요?'],
                accommodation: ['예약했어요', '방 열쇠', '아침 식사는 어디예요?', '체크아웃 시간을 늘릴 수 있나요?'],
                emergencies: ['도와주세요!', '도움이 필요해요', '길을 잃었어요', '응급차를 불러 주세요']
            }
        };
    }

    // 显示语言助手
    showLanguageAssistant() {
        const languages = [
            { code: 'zh', name: '中文' },
            { code: 'en', name: 'English' },
            { code: 'ja', name: '日本語' },
            { code: 'ko', name: '한국어' }
        ];
        
        const categories = [
            { key: 'greetings', name: '问候语' },
            { key: 'directions', name: '问路' },
            { key: 'dining', name: '用餐' },
            { key: 'accommodation', name: '住宿' },
            { key: 'emergencies', name: '紧急情况' }
        ];

        const modalContent = `
            <div class="language-assistant-modal">
                <div class="modal-header">
                    <h3>语言助手</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="language-selection">
                        <div class="language-group">
                            <label for="sourceLanguage">源语言：</label>
                            <select id="sourceLanguage">
                                ${languages.map(lang => `
                                    <option value="${lang.code}" ${lang.code === this.currentUser.preferredLanguage ? 'selected' : ''}>
                                        ${lang.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="language-group">
                            <label for="targetLanguage">目标语言：</label>
                            <select id="targetLanguage">
                                ${languages.map(lang => `
                                    <option value="${lang.code}" ${lang.code === (this.currentUser.preferredLanguage === 'zh' ? 'en' : 'zh') ? 'selected' : ''}>
                                        ${lang.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="phrase-categories">
                        <h4>常用短语分类：</h4>
                        <div class="category-buttons">
                            ${categories.map(cat => `
                                <button class="btn btn-secondary btn-sm" onclick="toolsManager.showPhrasesByCategory('${cat.key}')">
                                    ${cat.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="phrase-list" id="phraseList">
                        ${this.renderPhrases('greetings')}
                    </div>
                    
                    <div class="custom-translation">
                        <h4>自定义翻译：</h4>
                        <div class="translation-input">
                            <textarea id="customText" placeholder="请输入要翻译的文本..." rows="3"></textarea>
                            <button class="btn btn-primary" onclick="toolsManager.translateCustomText()">翻译</button>
                        </div>
                        <div class="translation-result" id="translationResult"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('语言助手', modalContent);
    }

    // 按分类显示短语
    showPhrasesByCategory(category) {
        const phraseList = document.getElementById('phraseList');
        if (phraseList) {
            phraseList.innerHTML = this.renderPhrases(category);
        }
    }

    // 渲染短语列表
    renderPhrases(category) {
        const sourceLang = document.getElementById('sourceLanguage').value;
        const targetLang = document.getElementById('targetLanguage').value;
        
        const sourcePhrases = this.languagePhrases[sourceLang][category];
        const targetPhrases = this.languagePhrases[targetLang][category];
        
        return `
            <div class="phrases">
                ${sourcePhrases.map((phrase, index) => `
                    <div class="phrase-item">
                        <div class="source-phrase">${phrase}</div>
                        <div class="target-phrase">${targetPhrases[index]}</div>
                        <button class="btn-icon" onclick="this.classList.toggle('favorite');" title="收藏">
                            <i class="far fa-star"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 翻译自定义文本
    translateCustomText() {
        const customText = document.getElementById('customText').value;
        const sourceLang = document.getElementById('sourceLanguage').value;
        const targetLang = document.getElementById('targetLanguage').value;
        const resultDiv = document.getElementById('translationResult');
        
        if (!customText.trim()) {
            resultDiv.innerHTML = '<p class="error">请输入要翻译的文本</p>';
            return;
        }
        
        // 模拟翻译（实际项目中应调用翻译API）
        resultDiv.innerHTML = '<p class="loading">翻译中...</p>';
        
        setTimeout(() => {
            // 简单模拟翻译结果
            let translation = customText;
            
            // 一些简单的翻译规则
            if (sourceLang === 'zh' && targetLang === 'en') {
                translation = this.simpleChineseToEnglish(customText);
            } else if (sourceLang === 'en' && targetLang === 'zh') {
                translation = this.simpleEnglishToChinese(customText);
            }
            
            resultDiv.innerHTML = `
                <div class="translation-item">
                    <div class="original-text">${customText}</div>
                    <div class="translated-text">${translation}</div>
                </div>
            `;
        }, 1000);
    }

    // 简单中译英（仅示例）
    simpleChineseToEnglish(text) {
        const translations = {
            '你好': 'Hello',
            '谢谢': 'Thank you',
            '再见': 'Goodbye',
            '对不起': 'Sorry',
            '请问': 'Excuse me',
            '多少钱': 'How much',
            '帮助': 'Help'
        };
        
        return translations[text] || `[翻译: ${text}]`;
    }

    // 简单英译中（仅示例）
    simpleEnglishToChinese(text) {
        const translations = {
            'Hello': '你好',
            'Thank you': '谢谢',
            'Goodbye': '再见',
            'Sorry': '对不起',
            'Excuse me': '请问',
            'How much': '多少钱',
            'Help': '帮助'
        };
        
        return translations[text] || `[翻译: ${text}]`;
    }

    // 加载使领馆数据
    loadEmbassies() {
        return [
            { country: '美国', embassy: '美国驻华大使馆', phone: '+86-10-8531-3000', address: '北京市朝阳区安家楼路55号' },
            { country: '英国', embassy: '英国驻华大使馆', phone: '+86-10-5192-4000', address: '北京市朝阳区光华路11号' },
            { country: '日本', embassy: '日本驻华大使馆', phone: '+86-10-8531-9800', address: '北京市朝阳区亮马桥东街1号' },
            { country: '韩国', embassy: '大韩民国驻华大使馆', phone: '+86-10-6532-0200', address: '北京市朝阳区光华路10号' },
            { country: '德国', embassy: '德国驻华大使馆', phone: '+86-10-8532-9000', address: '北京市朝阳区东直门外大街17号' },
            { country: '法国', embassy: '法国驻华大使馆', phone: '+86-10-8532-8080', address: '北京市朝阳区三里屯东三街3号' },
            { country: '澳大利亚', embassy: '澳大利亚驻华大使馆', phone: '+86-10-5140-4111', address: '北京市朝阳区东直门外大街21号' },
            { country: '加拿大', embassy: '加拿大驻华大使馆', phone: '+86-10-5139-4000', address: '北京市朝阳区东直门外大街19号' }
        ];
    }

    // 显示紧急求助
    showEmergencyAssistance() {
        const modalContent = `
            <div class="emergency-assistance-modal">
                <div class="modal-header">
                    <h3>紧急求助</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="emergency-content">
                        <div class="emergency-contacts">
                            <h4>全球紧急电话</h4>
                            <div class="contact-list">
                                <div class="contact-item">
                                    <span class="contact-label">报警电话：</span>
                                    <span class="contact-value">110</span>
                                    <button class="btn-icon call-btn" title="拨打电话"><i class="fas fa-phone"></i></button>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-label">急救电话：</span>
                                    <span class="contact-value">120</span>
                                    <button class="btn-icon call-btn" title="拨打电话"><i class="fas fa-phone"></i></button>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-label">消防电话：</span>
                                    <span class="contact-value">119</span>
                                    <button class="btn-icon call-btn" title="拨打电话"><i class="fas fa-phone"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="embassy-contacts">
                            <h4>中国驻外使领馆</h4>
                            <div class="search-box">
                                <input type="text" id="embassySearch" placeholder="搜索国家...">
                            </div>
                            <div class="embassy-list" id="embassyList">
                                ${this.embassies.map(embassy => `
                                    <div class="embassy-item">
                                        <div class="embassy-name">${embassy.country} - ${embassy.embassy}</div>
                                        <div class="embassy-phone">电话：${embassy.phone}</div>
                                        <div class="embassy-address">地址：${embassy.address}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="emergency-tips">
                            <h4>紧急情况小贴士</h4>
                            <ul>
                                <li>保持冷静，清楚说明您的位置和情况</li>
                                <li>准备好您的身份证明和旅行证件</li>
                                <li>如果语言不通，可以使用翻译应用辅助沟通</li>
                                <li>记录好当地的紧急联系方式</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('紧急求助', modalContent);
        
        // 绑定搜索事件
        const searchInput = document.getElementById('embassySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchEmbassies(e.target.value);
            });
        }
    }

    // 搜索使领馆
    searchEmbassies(keyword) {
        const embassyList = document.getElementById('embassyList');
        if (!embassyList) return;
        
        const filteredEmbassies = this.embassies.filter(embassy => 
            embassy.country.includes(keyword) || embassy.embassy.includes(keyword)
        );
        
        embassyList.innerHTML = filteredEmbassies.map(embassy => `
            <div class="embassy-item">
                <div class="embassy-name">${embassy.country} - ${embassy.embassy}</div>
                <div class="embassy-phone">电话：${embassy.phone}</div>
                <div class="embassy-address">地址：${embassy.address}</div>
            </div>
        `).join('');
    }

    // 显示健康提醒
    showHealthReminders() {
        const modalContent = `
            <div class="health-reminders-modal">
                <div class="modal-header">
                    <h3>健康提醒</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="health-content">
                        <div class="jet-lag-calculator">
                            <h4>时差调整计算器</h4>
                            <div class="calculator-content">
                                <div class="input-group">
                                    <label for="departureCity">出发城市：</label>
                                    <input type="text" id="departureCity" placeholder="例如：北京">
                                </div>
                                <div class="input-group">
                                    <label for="departureTime">出发时间：</label>
                                    <input type="datetime-local" id="departureTime">
                                </div>
                                <div class="input-group">
                                    <label for="arrivalCity">到达城市：</label>
                                    <input type="text" id="arrivalCity" placeholder="例如：纽约">
                                </div>
                                <div class="input-group">
                                    <label for="timeDifference">时差（小时）：</label>
                                    <input type="number" id="timeDifference" value="12" min="-12" max="12">
                                </div>
                                <button class="btn btn-primary" onclick="toolsManager.calculateJetLag()">计算时差</button>
                                <div class="jet-lag-result" id="jetLagResult"></div>
                            </div>
                        </div>
                        
                        <div class="altitude-sickness">
                            <h4>高原反应预警</h4>
                            <div class="altitude-content">
                                <div class="input-group">
                                    <label for="destinationAltitude">目的地海拔（米）：</label>
                                    <input type="number" id="destinationAltitude" value="3000" min="0" step="100">
                                </div>
                                <button class="btn btn-primary" onclick="toolsManager.checkAltitudeSickness()">检查风险</button>
                                <div class="altitude-result" id="altitudeResult"></div>
                            </div>
                        </div>
                        
                        <div class="health-tips">
                            <h4>旅行健康小贴士</h4>
                            <div class="tips-grid">
                                <div class="tip-item">
                                    <div class="tip-icon">
                                        <i class="fas fa-sun"></i>
                                    </div>
                                    <div class="tip-content">
                                        <h5>防晒</h5>
                                        <p>在户外活动时，使用SPF30以上的防晒霜，并戴帽子和太阳镜</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">
                                        <i class="fas fa-tint"></i>
                                    </div>
                                    <div class="tip-content">
                                        <h5>补水</h5>
                                        <p>保持充足的水分摄入，尤其是在炎热或高海拔地区</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">
                                        <i class="fas fa-utensils"></i>
                                    </div>
                                    <div class="tip-content">
                                        <h5>饮食安全</h5>
                                        <p>避免食用生的或未煮熟的食物，饮用瓶装水</p>
                                    </div>
                                </div>
                                <div class="tip-item">
                                    <div class="tip-icon">
                                        <i class="fas fa-shield-virus"></i>
                                    </div>
                                    <div class="tip-content">
                                        <h5>卫生习惯</h5>
                                        <p>经常洗手，使用洗手液或消毒湿巾</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('健康提醒', modalContent);
    }

    // 计算时差
    calculateJetLag() {
        const departureCity = document.getElementById('departureCity').value;
        const departureTime = document.getElementById('departureTime').value;
        const arrivalCity = document.getElementById('arrivalCity').value;
        const timeDifference = parseFloat(document.getElementById('timeDifference').value);
        const resultDiv = document.getElementById('jetLagResult');
        
        if (!departureCity || !arrivalCity) {
            resultDiv.innerHTML = '<p class="error">请填写出发和到达城市</p>';
            return;
        }
        
        // 计算到达时间
        const depDateTime = new Date(departureTime);
        const arrDateTime = new Date(depDateTime.getTime() + timeDifference * 60 * 60 * 1000);
        
        // 生成时差调整建议
        const suggestions = this.generateJetLagSuggestions(timeDifference);
        
        resultDiv.innerHTML = `
            <div class="jet-lag-info">
                <div class="info-row">
                    <span class="label">出发城市：</span>
                    <span class="value">${departureCity}</span>
                </div>
                <div class="info-row">
                    <span class="label">出发时间：</span>
                    <span class="value">${depDateTime.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">到达城市：</span>
                    <span class="value">${arrivalCity}</span>
                </div>
                <div class="info-row">
                    <span class="label">到达时间：</span>
                    <span class="value">${arrDateTime.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">时差：</span>
                    <span class="value">${timeDifference > 0 ? '+' : ''}${timeDifference} 小时</span>
                </div>
                <div class="suggestions">
                    <h5>时差调整建议：</h5>
                    <ul>
                        ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // 生成时差调整建议
    generateJetLagSuggestions(timeDifference) {
        const suggestions = [];
        const absDiff = Math.abs(timeDifference);
        
        if (absDiff > 0) {
            if (timeDifference > 0) {
                suggestions.push('提前适应目的地时区的作息时间，每天提前1-2小时睡觉和起床');
                suggestions.push('在飞行过程中多喝水，避免酒精和咖啡因');
                suggestions.push('到达后尽快暴露在阳光下，帮助调整生物钟');
            } else {
                suggestions.push('提前适应目的地时区的作息时间，每天推迟1-2小时睡觉和起床');
                suggestions.push('在飞行过程中保持充足的睡眠');
                suggestions.push('到达后避免在白天睡觉，尽量晚上再休息');
            }
            
            if (absDiff > 6) {
                suggestions.push('考虑在出发前3-4天开始调整作息时间');
                suggestions.push('使用褪黑素等辅助药物（请在医生指导下使用）');
            }
            
            suggestions.push('到达后第一天避免安排过多活动，给身体时间适应');
        }
        
        return suggestions;
    }

    // 检查高原反应
    checkAltitudeSickness() {
        const altitude = parseInt(document.getElementById('destinationAltitude').value);
        const resultDiv = document.getElementById('altitudeResult');
        
        let riskLevel = '低';
        let riskColor = 'success';
        let symptoms = [];
        let preventionTips = [];
        
        if (altitude < 2500) {
            riskLevel = '低';
            riskColor = 'success';
            symptoms = ['一般不会出现高原反应'];
            preventionTips = ['保持正常作息，避免过度劳累'];
        } else if (altitude >= 2500 && altitude < 3500) {
            riskLevel = '中';
            riskColor = 'warning';
            symptoms = ['头痛、头晕、乏力、失眠、恶心、呕吐'];
            preventionTips = [
                '慢慢上升，避免快速到达高海拔地区',
                '保持充足的水分摄入',
                '避免剧烈运动',
                '避免饮酒和吸烟'
            ];
        } else if (altitude >= 3500 && altitude < 5000) {
            riskLevel = '高';
            riskColor = 'danger';
            symptoms = ['严重头痛、呼吸困难、咳嗽、胸痛、意识模糊'];
            preventionTips = [
                '提前服用抗高原反应药物（如红景天）',
                '保持缓慢上升的节奏，每天上升不超过1000米',
                '如果出现严重症状，立即下降海拔',
                '考虑携带氧气罐'
            ];
        } else {
            riskLevel = '极高';
            riskColor = 'danger';
            symptoms = ['高原肺水肿、高原脑水肿等严重症状'];
            preventionTips = [
                '必须在专业指导下进行高海拔活动',
                '携带足够的氧气和急救药品',
                '做好紧急撤离的准备',
                '确保有可靠的通讯设备'
            ];
        }
        
        resultDiv.innerHTML = `
            <div class="altitude-info">
                <div class="risk-level">
                    <span class="label">风险等级：</span>
                    <span class="value ${riskColor}">${riskLevel}</span>
                </div>
                <div class="symptoms">
                    <h5>可能的症状：</h5>
                    <ul>
                        ${symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                    </ul>
                </div>
                <div class="prevention">
                    <h5>预防措施：</h5>
                    <ul>
                        ${preventionTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // 显示工具主菜单
    showToolsMenu() {
        const modalContent = `
            <div class="tools-menu-modal">
                <div class="modal-header">
                    <h3>实用工具</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="tools-grid">
                        <div class="tool-item" onclick="toolsManager.showCurrencyConverter()">
                            <div class="tool-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="tool-info">
                                <h4>货币换算</h4>
                                <p>实时汇率计算</p>
                            </div>
                        </div>
                        
                        <div class="tool-item" onclick="toolsManager.showLanguageAssistant()">
                            <div class="tool-icon">
                                <i class="fas fa-language"></i>
                            </div>
                            <div class="tool-info">
                                <h4>语言助手</h4>
                                <p>常用短语翻译</p>
                            </div>
                        </div>
                        
                        <div class="tool-item" onclick="toolsManager.showEmergencyAssistance()">
                            <div class="tool-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="tool-info">
                                <h4>紧急求助</h4>
                                <p>一键联系使领馆</p>
                            </div>
                        </div>
                        
                        <div class="tool-item" onclick="toolsManager.showHealthReminders()">
                            <div class="tool-icon">
                                <i class="fas fa-heartbeat"></i>
                            </div>
                            <div class="tool-info">
                                <h4>健康提醒</h4>
                                <p>时差调整、高原反应预警</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tools-help">
                        <h4>使用说明</h4>
                        <p>这些实用工具可以帮助您在旅行中解决各种问题。点击上方的工具图标即可使用对应的功能。</p>
                        <p>您的使用数据将保存在本地，不会上传到任何服务器。</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">关闭</button>
                </div>
            </div>
        `;

        this.modalManager.showCustomModal('实用工具', modalContent);
    }
}

// 创建全局实例
let toolsManager;