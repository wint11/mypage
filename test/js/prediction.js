// 聊天界面状态管理
const ChatState = {
    isTyping: false,
    messageHistory: [],
    currentChart: null,
    sidebarVisible: false
};

// 模拟数据
const mockData = {
    areas: {
        'A区': { probability: 0.23, trend: 'stable', currentTrash: 12 },
        'B区': { probability: 0.67, trend: 'increasing', currentTrash: 28 },
        'C区': { probability: 0.41, trend: 'decreasing', currentTrash: 18 }
    },
    weather: {
        temperature: 24,
        humidity: 65,
        windSpeed: 3.2,
        condition: '晴朗',
        forecast: '明天天气晴朗，适合户外活动'
    },
    crowd: {
        'A区': 142,
        'B区': 186,
        'C区': 98
    },
    historicalData: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: {
            'A区': [15, 18, 12, 20, 16, 25, 22],
            'B区': [28, 32, 25, 35, 30, 42, 38],
            'C区': [12, 15, 18, 14, 16, 20, 18]
        }
    }
};

// AI回复模板
const aiResponses = {
    areaPredict: {
        template: `🔮 **区域垃圾预测分析**\n\n根据我的分析，{area}在{time}的垃圾堆积概率为 **{probability}%**\n\n**分析依据：**\n• 🌤️ 天气因素：{weather}\n• 👥 人流密度：{crowd}人\n• 📊 历史趋势：{trend}\n\n**建议：** {suggestion}`,
        suggestions: {
            high: '建议增加清洁频次，重点关注该区域',
            medium: '保持正常清洁计划，适当增加巡查',
            low: '维持常规清洁即可'
        }
    },
    weatherImpact: {
        template: `🌤️ **天气影响分析**\n\n当前天气条件：{condition}，温度{temp}°C\n\n**对垃圾产生的影响：**\n• 晴朗天气会增加户外活动，垃圾产生量预计增加35%\n• B区作为主要活动区域，影响最为显著\n• 建议在天气良好的日子增加清洁频次\n\n**RAG检索结果：** 历史数据显示，晴朗天气下B区垃圾产生量比平时高出42%`
    },
    historicalTrend: {
        template: `📈 **历史趋势分析**\n\n过去7天垃圾分布情况：\n• **A区**：平均{avgA}kg/天，趋势{trendA}\n• **B区**：平均{avgB}kg/天，趋势{trendB}\n• **C区**：平均{avgC}kg/天，趋势{trendC}\n\n**关键发现：**\n• B区垃圾产生量持续上升\n• 周末垃圾量比工作日高出45%\n• 游乐设施周边是垃圾集中区域`
    },
    cleaningSuggestion: {
        template: `💡 **智能清洁建议**\n\n基于当前数据分析，今天的清洁建议：\n\n**优先级排序：**\n1. 🔴 **B区** - 高优先级（预计垃圾量28kg）\n2. 🟡 **C区** - 中优先级（预计垃圾量18kg）\n3. 🟢 **A区** - 低优先级（预计垃圾量12kg）\n\n**建议清洁时间：**\n• 上午10:00 - B区第一次清洁\n• 下午14:00 - 全区域巡查\n• 傍晚17:00 - B区重点清洁`
    }
};

// 初始化聊天界面
function initializeChatInterface() {
    initializeEventListeners();
    updateEnvironmentData();
    startDataUpdateTimer();
    
    // 自动调整输入框高度
    autoResizeTextarea();
}

// 初始化事件监听器
function initializeEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const quickBtns = document.querySelectorAll('.quick-btn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const toggleSidebar = document.getElementById('toggleSidebar');
    
    // 发送消息
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // 快捷按钮
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            messageInput.value = query;
            handleSendMessage();
        });
    });
    
    // 侧边栏切换
    sidebarToggle.addEventListener('click', toggleSidebarVisibility);
    toggleSidebar.addEventListener('click', toggleSidebarVisibility);
    
    // 点击侧边栏外部关闭
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        if (ChatState.sidebarVisible && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            toggleSidebarVisibility();
        }
    });
}

// 处理发送消息
function handleSendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || ChatState.isTyping) return;
    
    // 添加用户消息
    addMessage(message, 'user');
    messageInput.value = '';
    
    // 显示AI正在输入
    showTypingIndicator();
    
    // 模拟AI处理时间
    setTimeout(() => {
        hideTypingIndicator();
        processAIResponse(message);
    }, 1500 + Math.random() * 1000);
}

// 添加消息到聊天界面
function addMessage(content, sender, includeChart = false, chartData = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const currentTime = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const senderName = sender === 'user' ? '您' : '巡洁者AI助手';
    const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="sender-name">${senderName}</span>
                <span class="message-time">${currentTime}</span>
            </div>
            <div class="message-text">
                ${formatMessageContent(content)}
            </div>
            ${includeChart ? createChartContainer(chartData) : ''}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // 如果包含图表，渲染图表
    if (includeChart && chartData) {
        setTimeout(() => {
            renderInlineChart(messageDiv.querySelector('.inline-chart'), chartData);
        }, 100);
    }
    
    // 保存到历史记录
    ChatState.messageHistory.push({
        content,
        sender,
        timestamp: new Date(),
        includeChart,
        chartData
    });
}

// 格式化消息内容
function formatMessageContent(content) {
    // 处理Markdown格式
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/•/g, '&bull;');
}

// 创建图表容器
function createChartContainer(chartData) {
    return `
        <div class="chart-container mt-3">
            <div class="chart-title">${chartData.title}</div>
            <canvas class="inline-chart"></canvas>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="showFullChart('${chartData.type}')">
                <i class="fas fa-expand"></i> 查看详细图表
            </button>
        </div>
    `;
}

// 显示正在输入指示器
function showTypingIndicator() {
    if (ChatState.isTyping) return;
    
    ChatState.isTyping = true;
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-message';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    ChatState.isTyping = false;
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) {
        typingMessage.remove();
    }
}

// 处理AI响应
function processAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    let response = '';
    let includeChart = false;
    let chartData = null;
    
    if (message.includes('预测') && (message.includes('区域') || message.includes('区'))) {
        response = generateAreaPredictionResponse(message);
        includeChart = true;
        chartData = {
            type: 'areaPrediction',
            title: '区域垃圾堆积概率对比',
            data: mockData.areas
        };
    } else if (message.includes('天气') || message.includes('影响')) {
        response = generateWeatherImpactResponse();
    } else if (message.includes('历史') || message.includes('趋势')) {
        response = generateHistoricalTrendResponse();
        includeChart = true;
        chartData = {
            type: 'historicalTrend',
            title: '过去7天垃圾分布趋势',
            data: mockData.historicalData
        };
    } else if (message.includes('建议') || message.includes('清洁')) {
        response = generateCleaningSuggestionResponse();
    } else {
        response = generateDefaultResponse(message);
    }
    
    addMessage(response, 'ai', includeChart, chartData);
}

// 生成区域预测响应
function generateAreaPredictionResponse(message) {
    let targetArea = 'B区';
    let time = '明天中午';
    
    // 解析用户消息中的区域和时间
    if (message.includes('a区') || message.includes('A区')) targetArea = 'A区';
    if (message.includes('c区') || message.includes('C区')) targetArea = 'C区';
    if (message.includes('傍晚')) time = '明天傍晚';
    if (message.includes('周末')) time = '本周末';
    
    const areaData = mockData.areas[targetArea];
    const probability = Math.round(areaData.probability * 100);
    const crowd = mockData.crowd[targetArea];
    
    let suggestion = aiResponses.areaPredict.suggestions.medium;
    if (probability > 60) suggestion = aiResponses.areaPredict.suggestions.high;
    if (probability < 30) suggestion = aiResponses.areaPredict.suggestions.low;
    
    return aiResponses.areaPredict.template
        .replace('{area}', targetArea)
        .replace('{time}', time)
        .replace('{probability}', probability)
        .replace('{weather}', mockData.weather.forecast)
        .replace('{crowd}', crowd)
        .replace('{trend}', areaData.trend === 'increasing' ? '上升趋势' : 
                areaData.trend === 'decreasing' ? '下降趋势' : '稳定')
        .replace('{suggestion}', suggestion);
}

// 生成天气影响响应
function generateWeatherImpactResponse() {
    return aiResponses.weatherImpact.template
        .replace('{condition}', mockData.weather.condition)
        .replace('{temp}', mockData.weather.temperature);
}

// 生成历史趋势响应
function generateHistoricalTrendResponse() {
    const avgA = Math.round(mockData.historicalData.datasets['A区'].reduce((a, b) => a + b) / 7);
    const avgB = Math.round(mockData.historicalData.datasets['B区'].reduce((a, b) => a + b) / 7);
    const avgC = Math.round(mockData.historicalData.datasets['C区'].reduce((a, b) => a + b) / 7);
    
    return aiResponses.historicalTrend.template
        .replace('{avgA}', avgA)
        .replace('{avgB}', avgB)
        .replace('{avgC}', avgC)
        .replace('{trendA}', '稳定')
        .replace('{trendB}', '上升')
        .replace('{trendC}', '下降');
}

// 生成清洁建议响应
function generateCleaningSuggestionResponse() {
    return aiResponses.cleaningSuggestion.template;
}

// 生成默认响应
function generateDefaultResponse(message) {
    const responses = [
        '🤔 我理解您的问题。基于当前的数据分析，我建议您可以更具体地询问关于区域预测、天气影响或清洁建议的问题。',
        '💡 您可以尝试问我：\n• "预测明天B区的垃圾情况"\n• "分析天气对垃圾产生的影响"\n• "查看历史趋势数据"\n• "给出清洁建议"',
        '🔍 我正在分析您的问题。如果您需要特定区域的预测分析，请告诉我具体的区域和时间。'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 渲染内联图表
function renderInlineChart(canvas, chartData) {
    if (!canvas || !chartData) return;
    
    // 设置canvas尺寸
    canvas.style.width = '100%';
    canvas.style.height = '200px';
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    
    if (chartData.type === 'areaPrediction') {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData.data),
                datasets: [{
                    label: '垃圾堆积概率 (%)',
                    data: Object.values(chartData.data).map(area => Math.round(area.probability * 100)),
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    } else if (chartData.type === 'historicalTrend') {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.data.labels,
                datasets: Object.keys(chartData.data.datasets).map((area, index) => ({
                    label: area,
                    data: chartData.data.datasets[area],
                    borderColor: ['#667eea', '#f093fb', '#4facfe'][index],
                    backgroundColor: ['rgba(102, 126, 234, 0.1)', 'rgba(240, 147, 251, 0.1)', 'rgba(79, 172, 254, 0.1)'][index],
                    tension: 0.4,
                    fill: true
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        });
    }
}

// 显示完整图表
function showFullChart(chartType) {
    const modal = new bootstrap.Modal(document.getElementById('chartModal'));
    const modalTitle = document.getElementById('chartModalTitle');
    const modalChart = document.getElementById('modalChart');
    
    modalTitle.textContent = chartType === 'areaPrediction' ? '区域垃圾堆积概率详细分析' : '历史趋势详细分析';
    
    modal.show();
    
    // 渲染详细图表
    setTimeout(() => {
        // 设置模态框canvas尺寸
        modalChart.style.width = '100%';
        modalChart.style.height = '300px';
        modalChart.width = modalChart.offsetWidth;
        modalChart.height = 300;
        
        const ctx = modalChart.getContext('2d');
        if (ChatState.currentChart) {
            ChatState.currentChart.destroy();
        }
        
        if (chartType === 'areaPrediction') {
            ChatState.currentChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(mockData.areas),
                    datasets: [{
                        data: Object.values(mockData.areas).map(area => Math.round(area.probability * 100)),
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 206, 86, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }, 300);
}

// 切换侧边栏显示
function toggleSidebarVisibility() {
    const sidebar = document.getElementById('sidebar');
    ChatState.sidebarVisible = !ChatState.sidebarVisible;
    
    if (ChatState.sidebarVisible) {
        sidebar.classList.add('show');
    } else {
        sidebar.classList.remove('show');
    }
}

// 自动调整输入框高度
function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// 滚动到底部
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 更新环境数据
function updateEnvironmentData() {
    // 模拟实时数据更新
    const envItems = document.querySelectorAll('.env-item strong');
    if (envItems.length >= 5) {
        envItems[0].textContent = `${mockData.weather.temperature + (Math.random() - 0.5)}°C`;
        envItems[1].textContent = `${mockData.weather.humidity + Math.round((Math.random() - 0.5) * 10)}%`;
        envItems[2].textContent = `${(mockData.weather.windSpeed + (Math.random() - 0.5)).toFixed(1)}m/s`;
        envItems[3].textContent = `${mockData.crowd['A区'] + Math.round((Math.random() - 0.5) * 20)}人`;
        envItems[4].textContent = `${mockData.crowd['B区'] + Math.round((Math.random() - 0.5) * 20)}人`;
    }
}

// 启动数据更新定时器
function startDataUpdateTimer() {
    // 每30秒更新一次环境数据
    setInterval(updateEnvironmentData, 30000);
    
    // 每5秒更新一次模型延迟显示
    setInterval(() => {
        const latencySpan = document.querySelector('.model-metrics .text-info');
        if (latencySpan) {
            const latency = 100 + Math.round(Math.random() * 50);
            latencySpan.textContent = `${latency}ms`;
        }
    }, 5000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeChatInterface);

// 导出函数供全局使用
window.showFullChart = showFullChart;