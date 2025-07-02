// Dashboard JavaScript 功能文件

// 全局变量管理
const DashboardState = {
    isSystemActive: false,
    timers: new Map(),
    charts: new Map(),
    currentFlightPath: null
};

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // 初始化所有功能
    initPowerButton();
    initSliders();
    initModeSelection();
    initWorkChart();
    initRealTimeUpdates();
    initDeviceStatus();
    
    // 初始化视频播放器
    initVideoPlayer();
    
    // 初始化新功能按钮
    initControlButtons();
    
    // 初始化任务进度更新
    initTaskProgress();
    
    // 初始化地图
    initFlightMap();
    
    // 设置初始按钮状态
    updateControlButtonsState();
}

// 电源按钮功能
function initPowerButton() {
    const powerBtn = document.getElementById('powerBtn');
    const video = document.querySelector('.aerial-view video');
    
    powerBtn.addEventListener('click', function() {
        const isActive = !DashboardState.isSystemActive;
        DashboardState.isSystemActive = isActive;
        
        if (isActive) {
            powerBtn.classList.add('active');
            powerBtn.innerHTML = '<i class="fas fa-power-off"></i>';
            showNotification('系统启动中...', 'info');
            // 启动视频播放
            if (video) {
                video.play().catch(e => {
                    console.log('视频播放失败:', e);
                    showVideoPlayButton(video);
                });
            }
            setTimeout(() => {
                showNotification('系统已启动', 'success');
                startSystemMonitoring();
                
                // 更新控制按钮状态
                updateControlButtonsState();
                
                // 初始化地图（如果还没有初始化）
                if (!DashboardState.currentFlightPath) {
                    initFlightMap();
                }
            }, 1500);
        } else {
            // 如果有正在进行的任务，先停止
            if (DashboardState.currentTask !== TaskState.IDLE) {
                stopCleaningTask();
            }
            
            powerBtn.classList.remove('active');
            powerBtn.innerHTML = '<i class="fas fa-power-off"></i>';
            showNotification('系统已关闭', 'warning');
            // 暂停视频播放
            if (video) {
                video.pause();
            }
            stopSystemMonitoring();
            
            // 更新控制按钮状态
            updateControlButtonsState();
        }
    });
}

// 滑块控制功能
function initSliders() {
    const altitudeSlider = document.getElementById('altitude');
    const speedSlider = document.getElementById('speed');
    
    // 高度滑块
    altitudeSlider.addEventListener('input', function() {
        const value = this.value;
        const valueDisplay = this.parentNode.querySelector('.slider-value');
        valueDisplay.textContent = value + 'm';
        updateFlightParameters('altitude', value);
    });
    
    // 速度滑块
    speedSlider.addEventListener('input', function() {
        const value = this.value;
        const valueDisplay = this.parentNode.querySelector('.slider-value');
        valueDisplay.textContent = value + 'm/s';
        updateFlightParameters('speed', value);
    });
}

// 模式选择功能
function initModeSelection() {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const mode = this.id;
            updateOperationMode(mode);
            showNotification(`已切换到${mode === 'auto' ? '自动' : '手动'}模式`, 'info');
        });
    });
}

// 初始化工作统计图表
function initWorkChart() {
    const ctx = document.getElementById('workChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
            datasets: [{
                label: '清洁效率',
                data: [20, 45, 60, 80, 75, 90, 85],
                borderColor: '#3a7bd5',
                backgroundColor: 'rgba(58, 123, 213, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
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
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
    
    // 存储图表实例
    DashboardState.charts.set('workChart', chart);
    
    // 清除旧定时器并设置新的
    clearTimer('chartUpdate');
    const timerId = setInterval(() => {
        if (DashboardState.isSystemActive) {
            updateChartData(chart);
        }
    }, 5000);
    DashboardState.timers.set('chartUpdate', timerId);
}

// 实时数据更新
function initRealTimeUpdates() {
    // 清除旧定时器
    clearTimer('realTimeUpdate');
    
    // 模拟实时数据更新
    const timerId = setInterval(() => {
        if (DashboardState.isSystemActive) {
            updateBatteryLevel();
            updateStatistics();
            updateSystemStatus();
        }
    }, 3000);
    DashboardState.timers.set('realTimeUpdate', timerId);
}

// 定时器管理工具函数
function clearTimer(name) {
    if (DashboardState.timers.has(name)) {
        clearInterval(DashboardState.timers.get(name));
        DashboardState.timers.delete(name);
    }
}

function clearAllTimers() {
    DashboardState.timers.forEach((timerId) => {
        clearInterval(timerId);
    });
    DashboardState.timers.clear();
}

// 设备状态监控
function initDeviceStatus() {
    const deviceStatuses = [
        { name: '主摄像头', status: 'success', text: '正常' },
        { name: '副摄像头', status: 'success', text: '正常' },
        { name: '激光雷达', status: 'success', text: '正常' },
        { name: 'GPS模块', status: 'success', text: '正常' },
        { name: '通信模块', status: 'warning', text: '警告' },
        { name: '垃圾收集器', status: 'success', text: '正常' }
    ];
    
    // 清除旧定时器
    clearTimer('deviceStatus');
    
    // 随机更新设备状态
    const timerId = setInterval(() => {
        if (DashboardState.isSystemActive) {
            updateDeviceStatuses(deviceStatuses);
        }
    }, 8000);
    DashboardState.timers.set('deviceStatus', timerId);
}

// 更新飞行参数
function updateFlightParameters(type, value) {
    console.log(`更新${type}参数:`, value);
    // 这里可以发送到后端API
}

// 更新操作模式
function updateOperationMode(mode) {
    console.log('切换操作模式:', mode);
    // 根据模式调整界面显示
    const controls = document.querySelector('.flight-controls');
    if (mode === 'auto') {
        controls.style.opacity = '0.6';
        controls.style.pointerEvents = 'none';
    } else {
        controls.style.opacity = '1';
        controls.style.pointerEvents = 'auto';
    }
}

// 更新电池电量
function updateBatteryLevel() {
    const batteryLevel = document.querySelector('.battery-level');
    const batteryText = document.querySelector('.battery-card h4');
    const timeText = document.querySelector('.battery-card .text-muted');
    
    if (batteryLevel && batteryText) {
        const currentLevel = parseInt(batteryLevel.style.width) || 80;
        const newLevel = Math.max(20, currentLevel + (Math.random() - 0.5) * 10);
        const roundedLevel = Math.round(newLevel);
        
        batteryLevel.style.width = roundedLevel + '%';
        batteryText.textContent = roundedLevel + '%';
        
        // 更新颜色
        if (roundedLevel > 60) {
            batteryLevel.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
            batteryText.className = 'mt-3 text-success';
        } else if (roundedLevel > 30) {
            batteryLevel.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            batteryText.className = 'mt-3 text-warning';
        } else {
            batteryLevel.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            batteryText.className = 'mt-3 text-danger';
        }
        
        // 更新剩余时间
        const remainingHours = Math.floor(roundedLevel / 40 * 2);
        const remainingMinutes = Math.floor((roundedLevel / 40 * 2 - remainingHours) * 60);
        timeText.textContent = `剩余工作时间: ${remainingHours}小时${remainingMinutes}分钟`;
    }
}

// 更新统计数据
function updateStatistics() {
    const detectedCount = document.querySelector('.stat-item h3');
    const accuracyRate = document.querySelectorAll('.stat-item h3')[1];
    
    if (detectedCount) {
        const current = parseInt(detectedCount.textContent) || 156;
        const newCount = current + Math.floor(Math.random() * 3);
        detectedCount.textContent = newCount;
    }
    
    if (accuracyRate) {
        const variations = ['87%', '89%', '91%', '88%', '90%'];
        const randomAccuracy = variations[Math.floor(Math.random() * variations.length)];
        accuracyRate.textContent = randomAccuracy;
    }
}

// 更新系统状态
function updateSystemStatus() {
    const statusValues = document.querySelectorAll('.status-value');
    
    if (statusValues.length >= 3) {
        // 更新电池电量
        const batteryLevels = ['82%', '85%', '87%', '84%', '86%'];
        statusValues[0].textContent = batteryLevels[Math.floor(Math.random() * batteryLevels.length)];
        
        // 更新信号强度
        const signalStrengths = ['良好', '优秀', '一般'];
        const signalClasses = ['text-success', 'text-primary', 'text-warning'];
        const randomSignal = Math.floor(Math.random() * signalStrengths.length);
        statusValues[1].textContent = signalStrengths[randomSignal];
        statusValues[1].className = 'status-value ' + signalClasses[randomSignal];
        
        // 更新温度
        const temperature = 23 + Math.floor(Math.random() * 5);
        statusValues[2].textContent = temperature + '°C';
    }
}

// 更新图表数据
function updateChartData(chart) {
    const newData = chart.data.datasets[0].data.map(value => {
        return Math.max(0, Math.min(100, value + (Math.random() - 0.5) * 20));
    });
    
    chart.data.datasets[0].data = newData;
    chart.update('none');
}

// 更新设备状态
function updateDeviceStatuses(statuses) {
    const statusRows = document.querySelectorAll('.status-row');
    
    statusRows.forEach((row, index) => {
        if (index < statuses.length) {
            const badge = row.querySelector('.badge');
            const randomStatuses = [
                { class: 'bg-success', text: '正常运行' },
                { class: 'bg-warning', text: '信号弱' },
                { class: 'bg-danger', text: '离线' },
                { class: 'bg-info', text: '维护中' }
            ];
            
            const randomStatus = randomStatuses[Math.floor(Math.random() * randomStatuses.length)];
            badge.className = 'badge ' + randomStatus.class;
            badge.textContent = randomStatus.text;
        }
    });
}

// 系统监控开始
function startSystemMonitoring() {
    console.log('开始系统监控...');
    DashboardState.isSystemActive = true;
    
    // 启动各种监控功能
    document.body.classList.add('system-active');
    
    // 启动实时数据更新
    initRealTimeUpdates();
    initDeviceStatus();
    
    // 启动地图无人机移动
    if (DashboardState.currentFlightPath) {
        startDroneMovement();
    }
}

// 系统监控停止
function stopSystemMonitoring() {
    console.log('停止系统监控...');
    DashboardState.isSystemActive = false;
    
    // 停止各种监控功能
    document.body.classList.remove('system-active');
    
    // 清除所有定时器
    clearAllTimers();
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 旧的启动清洁按钮功能已移除，使用新的状态管理系统

// 清洁动画效果
function startCleaningAnimation() {
    const aerialView = document.querySelector('.aerial-view');
    if (aerialView) {
        aerialView.style.animation = 'pulse 2s infinite';
    }
}

function stopCleaningAnimation() {
    const aerialView = document.querySelector('.aerial-view');
    if (aerialView) {
        aerialView.style.animation = 'none';
    }
}

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .notification {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .system-active .card {
        animation: glow 3s ease-in-out infinite alternate;
    }
    
    @keyframes glow {
        from { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        to { box-shadow: 0 4px 20px rgba(58, 123, 213, 0.3); }
    }
`;
document.head.appendChild(style);

// 视频播放控制
function initVideoPlayer() {
    const video = document.getElementById('droneVideo');
    if (video) {
        // 确保视频静音但不自动播放
        video.muted = true;
        video.loop = true;
        video.pause(); // 确保视频暂停
        
        // 视频加载错误处理
        video.addEventListener('error', function() {
            console.error('视频加载失败');
            showNotification('视频加载失败，请检查文件路径', 'warning');
        });
        
        // 视频加载成功
        video.addEventListener('loadeddata', function() {
            console.log('视频加载成功');
        });
    }
}

// 启动视频播放（仅在系统激活时）
function startVideoPlayback() {
    const video = document.getElementById('droneVideo');
    if (video && DashboardState.isSystemActive) {
        video.play().catch(error => {
            console.log('视频播放失败:', error);
            showNotification('视频播放失败', 'warning');
        });
    }
}

// 停止视频播放
function stopVideoPlayback() {
    const video = document.getElementById('droneVideo');
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}

// 显示视频播放按钮（当自动播放失败时）
function showVideoPlayButton(videoElement) {
    const video = videoElement || document.querySelector('.aerial-view video');
    const container = document.querySelector('.aerial-view');
    
    if (video && container) {
        // 移除已存在的播放按钮
        const existingBtn = container.querySelector('.video-play-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // 创建播放按钮
        const playButton = document.createElement('button');
        playButton.className = 'video-play-btn';
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        playButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 210, 255, 0.8);
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 10;
            transition: all 0.3s ease;
        `;
        
        // 点击播放按钮
        playButton.addEventListener('click', function() {
            video.play().then(() => {
                this.remove();
                showNotification('视频播放已开始', 'success');
                // 同时激活电源按钮
                const powerBtn = document.getElementById('powerBtn');
                if (powerBtn && !powerBtn.classList.contains('active')) {
                    powerBtn.click();
                }
            }).catch(e => {
                console.error('视频播放失败:', e);
                showNotification('视频播放失败，请检查文件', 'danger');
            });
        });
        
        container.appendChild(playButton);
    }
}

// 任务状态管理
const TaskState = {
    IDLE: 'idle',           // 空闲状态
    CLEANING: 'cleaning',   // 清洁中
    PAUSED: 'paused',      // 暂停
    RETURNING: 'returning'  // 返回基地
};

// 添加任务状态到全局状态
DashboardState.currentTask = TaskState.IDLE;

// 初始化控制按钮功能
function initControlButtons() {
    // 启动清洁按钮
    const startCleanBtn = document.getElementById('startCleanBtn');
    if (startCleanBtn) {
        startCleanBtn.addEventListener('click', function() {
            if (!DashboardState.isSystemActive) {
                showNotification('请先启动系统电源', 'warning');
                return;
            }
            
            if (DashboardState.currentTask === TaskState.IDLE || DashboardState.currentTask === TaskState.PAUSED) {
                startCleaningTask();
            } else if (DashboardState.currentTask === TaskState.CLEANING) {
                stopCleaningTask();
            }
        });
    }
    
    // 暂停任务按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            if (!DashboardState.isSystemActive) {
                showNotification('请先启动系统电源', 'warning');
                return;
            }
            
            if (DashboardState.currentTask === TaskState.CLEANING) {
                pauseCleaningTask();
            } else if (DashboardState.currentTask === TaskState.PAUSED) {
                resumeCleaningTask();
            } else {
                showNotification('当前没有可暂停的任务', 'info');
            }
        });
    }
    
    // 返回基地按钮
    const returnHomeBtn = document.getElementById('returnHomeBtn');
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', function() {
            if (!DashboardState.isSystemActive) {
                showNotification('请先启动系统电源', 'warning');
                return;
            }
            
            if (DashboardState.currentTask !== TaskState.RETURNING) {
                startReturnToBase();
            } else {
                showNotification('无人机已在返回基地中', 'info');
            }
        });
    }
}

// 启动清洁任务
function startCleaningTask() {
    DashboardState.currentTask = TaskState.CLEANING;
    updateControlButtonsState();
    showNotification('清洁任务已启动', 'success');
    
    // 启动视频播放
    startVideoPlayback();
    
    // 启动无人机移动
    if (DashboardState.currentFlightPath) {
        startDroneMovement();
    }
    
    // 启动清洁动画
    startCleaningAnimation();
}

// 停止清洁任务
function stopCleaningTask() {
    DashboardState.currentTask = TaskState.IDLE;
    updateControlButtonsState();
    showNotification('清洁任务已停止', 'warning');
    
    // 停止视频播放
    stopVideoPlayback();
    
    // 清除无人机移动定时器
    clearTimer('droneMovement');
    
    // 停止清洁动画
    stopCleaningAnimation();
}

// 暂停清洁任务
function pauseCleaningTask() {
    DashboardState.currentTask = TaskState.PAUSED;
    updateControlButtonsState();
    showNotification('任务已暂停', 'warning');
    
    // 暂停视频
    const video = document.getElementById('droneVideo');
    if (video) video.pause();
    
    // 暂停无人机移动
    clearTimer('droneMovement');
}

// 恢复清洁任务
function resumeCleaningTask() {
    DashboardState.currentTask = TaskState.CLEANING;
    updateControlButtonsState();
    showNotification('任务已继续', 'info');
    
    // 恢复视频播放
    startVideoPlayback();
    
    // 恢复无人机移动
    if (DashboardState.currentFlightPath) {
        startDroneMovement();
    }
}

// 返回基地
function startReturnToBase() {
    DashboardState.currentTask = TaskState.RETURNING;
    updateControlButtonsState();
    showNotification('无人机正在返回基地...', 'info');
    
    // 清除当前任务的定时器
    clearTimer('droneMovement');
    
    // 模拟返回基地过程
    setTimeout(() => {
        DashboardState.currentTask = TaskState.IDLE;
        updateControlButtonsState();
        showNotification('无人机已返回基地', 'success');
        stopVideoPlayback();
    }, 5000);
}

// 更新控制按钮状态
function updateControlButtonsState() {
    const startBtn = document.getElementById('startCleanBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const returnBtn = document.getElementById('returnHomeBtn');
    
    if (startBtn) {
        switch (DashboardState.currentTask) {
            case TaskState.IDLE:
                startBtn.textContent = '启动清洁';
                startBtn.className = 'btn btn-success';
                startBtn.disabled = false;
                break;
            case TaskState.CLEANING:
                startBtn.textContent = '停止清洁';
                startBtn.className = 'btn btn-danger';
                startBtn.disabled = false;
                break;
            case TaskState.PAUSED:
                startBtn.textContent = '停止清洁';
                startBtn.className = 'btn btn-danger';
                startBtn.disabled = false;
                break;
            case TaskState.RETURNING:
                startBtn.textContent = '返回中...';
                startBtn.className = 'btn btn-secondary';
                startBtn.disabled = true;
                break;
        }
    }
    
    if (pauseBtn) {
        switch (DashboardState.currentTask) {
            case TaskState.IDLE:
                pauseBtn.textContent = '暂停任务';
                pauseBtn.className = 'btn btn-warning';
                pauseBtn.disabled = true;
                break;
            case TaskState.CLEANING:
                pauseBtn.textContent = '暂停任务';
                pauseBtn.className = 'btn btn-warning';
                pauseBtn.disabled = false;
                break;
            case TaskState.PAUSED:
                pauseBtn.textContent = '继续任务';
                pauseBtn.className = 'btn btn-info';
                pauseBtn.disabled = false;
                break;
            case TaskState.RETURNING:
                pauseBtn.textContent = '暂停任务';
                pauseBtn.className = 'btn btn-secondary';
                pauseBtn.disabled = true;
                break;
        }
    }
    
    if (returnBtn) {
        switch (DashboardState.currentTask) {
            case TaskState.RETURNING:
                returnBtn.textContent = '返回中...';
                returnBtn.className = 'btn btn-secondary';
                returnBtn.disabled = true;
                break;
            default:
                returnBtn.textContent = '返回基地';
                returnBtn.className = 'btn btn-primary';
                returnBtn.disabled = false;
                break;
        }
    }
}

// 初始化任务进度更新
function initTaskProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    
    if (progressBar && progressText) {
        // 模拟任务进度更新
        setInterval(() => {
            const currentProgress = parseInt(progressBar.style.width) || 0;
            const newProgress = Math.min(100, currentProgress + Math.random() * 2);
            
            progressBar.style.width = newProgress + '%';
            progressText.textContent = Math.round(newProgress) + '%';
            
            // 根据进度改变颜色
            if (newProgress < 30) {
                progressBar.className = 'progress-bar bg-danger';
            } else if (newProgress < 70) {
                progressBar.className = 'progress-bar bg-warning';
            } else {
                progressBar.className = 'progress-bar bg-success';
            }
        }, 2000);
    }
}

// 停止所有操作
function stopAllOperations() {
    console.log('执行紧急停止...');
    // 停止所有运行中的任务
    const powerBtn = document.getElementById('powerBtn');
    if (powerBtn && powerBtn.classList.contains('active')) {
        powerBtn.click();
    }
}

// 开始返航
function startReturnHome() {
    console.log('开始返航程序...');
    // 设置返航模式
    const autoMode = document.getElementById('auto');
    if (autoMode) {
        autoMode.checked = true;
        updateOperationMode('auto');
    }
}

// 开始清洁动画
function startCleaningAnimation() {
    console.log('开始清洁动画...');
    const powerBtn = document.getElementById('powerBtn');
    if (powerBtn && !powerBtn.classList.contains('active')) {
        powerBtn.click();
    }
    
    // 更新任务进度
    const progressBar = document.getElementById('taskProgress');
    if (progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                showNotification('清洁任务完成！', 'success');
            }
            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
        }, 1000);
    }
}

// 停止清洁动画
function stopCleaningAnimation() {
    console.log('停止清洁动画...');
    // 重置进度条
    const progressBar = document.getElementById('taskProgress');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
    }
}

// 拍照功能
function capturePhoto() {
    console.log('拍照功能执行...');
    // 模拟拍照效果
    const aerialView = document.querySelector('.aerial-view');
    if (aerialView) {
        aerialView.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            aerialView.style.filter = 'none';
        }, 200);
    }
}

// 地图初始化功能
function initFlightMap() {
    // 检查Leaflet是否已加载
    if (typeof L === 'undefined') {
        console.error('Leaflet地图库未加载');
        showNotification('地图加载失败，请检查网络连接', 'warning');
        return;
    }
    
    try {
        // 创建地图实例（以杭州余杭区为中心）
        const map = L.map('flightMap').setView([30.4186, 120.0045], 13);
        
        // 添加地图瓦片层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // 定义飞行路线坐标点（杭州余杭区范围内）
        const flightPath = [
            [30.4186, 120.0045],  // 起点：余杭区中心
            [30.4250, 120.0120],  // 路径点1：向东北
            [30.4300, 120.0200],  // 路径点2：继续东北
            [30.4350, 120.0280],  // 路径点3：余杭区东北部
            [30.4400, 120.0360],  // 路径点4：进一步东北
            [30.4450, 120.0440]   // 终点：余杭区边界
        ];
        
        // 存储飞行路径到全局状态
        DashboardState.currentFlightPath = {
            map: map,
            path: flightPath,
            currentIndex: 0,
            marker: null,
            polyline: null,
            completedPolylines: []
        };
        
        // 绘制飞行路线
        const polyline = L.polyline(flightPath, {
            color: '#00d2ff',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 5'
        }).addTo(map);
        DashboardState.currentFlightPath.polyline = polyline;
        
        // 添加起点标记
        L.marker(flightPath[0], {
            icon: L.divIcon({
                className: 'custom-marker start-marker',
                html: '<i class="fas fa-play-circle" style="color: #28a745; font-size: 20px;"></i>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map).bindPopup('起飞点');
        
        // 添加终点标记
        L.marker(flightPath[flightPath.length - 1], {
            icon: L.divIcon({
                className: 'custom-marker end-marker',
                html: '<i class="fas fa-flag-checkered" style="color: #dc3545; font-size: 20px;"></i>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map).bindPopup('目标点');
        
        // 添加当前位置标记（动态移动）
        let currentMarker = L.marker(flightPath[0], {
            icon: L.divIcon({
                className: 'custom-marker drone-marker',
                html: '<i class="fas fa-helicopter" style="color: #007bff; font-size: 18px; animation: pulse 2s infinite;"></i>',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            })
        }).addTo(map).bindPopup('无人机当前位置');
        DashboardState.currentFlightPath.marker = currentMarker;
        
        // 添加垃圾点标记
        addTrashMarkers(map);
        
        // 调整地图视图以显示完整路线
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
        
        console.log('地图初始化成功');
        showNotification('飞行地图加载完成', 'success');
        
    } catch (error) {
        console.error('地图初始化失败:', error);
        showNotification('地图初始化失败', 'danger');
    }
}

// 启动无人机移动
function startDroneMovement() {
    if (!DashboardState.currentFlightPath) return;
    
    clearTimer('droneMovement');
    
    const timerId = setInterval(() => {
        if (!DashboardState.isSystemActive) return;
        
        const flightData = DashboardState.currentFlightPath;
        if (flightData.currentIndex < flightData.path.length - 1) {
            flightData.currentIndex++;
            flightData.marker.setLatLng(flightData.path[flightData.currentIndex]);
            
            // 更新地图中心
            flightData.map.panTo(flightData.path[flightData.currentIndex]);
            
            // 添加已飞行路径
            const completedPath = flightData.path.slice(0, flightData.currentIndex + 1);
            const completedPolyline = L.polyline(completedPath, {
                color: '#28a745',
                weight: 6,
                opacity: 1
            }).addTo(flightData.map);
            flightData.completedPolylines.push(completedPolyline);
        } else {
            clearTimer('droneMovement');
            showNotification('飞行路线完成！', 'success');
        }
    }, 10000);
    
    DashboardState.timers.set('droneMovement', timerId);
}

// 添加垃圾点标记
function addTrashMarkers(map) {
    const trashPoints = [
        {lat: 30.4200, lng: 120.0080, type: '塑料瓶'},
        {lat: 30.4270, lng: 120.0150, type: '纸张'},
        {lat: 30.4320, lng: 120.0230, type: '食物残渣'},
        {lat: 30.4380, lng: 120.0320, type: '金属罐'}
    ];
    
    trashPoints.forEach(point => {
        const trashIcon = L.divIcon({
            className: 'trash-marker',
            html: `<div class="trash-icon" title="${point.type}" style="font-size: 16px;">🗑️</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        L.marker([point.lat, point.lng], {icon: trashIcon})
            .addTo(map)
            .bindPopup(`垃圾类型: ${point.type}`);
    });
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // 添加到页面
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// 错误处理
function handleError(error, context = '') {
    console.error(`错误 ${context}:`, error);
    showNotification(`系统错误: ${error.message || error}`, 'danger');
}

// 性能监控
function monitorPerformance() {
    // 监控内存使用
    if (performance.memory) {
        const memoryInfo = performance.memory;
        if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
            showNotification('内存使用率过高，建议刷新页面', 'warning');
        }
    }
    
    // 监控定时器数量
    if (DashboardState.timers.size > 10) {
        console.warn('定时器数量过多:', DashboardState.timers.size);
    }
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    clearAllTimers();
    
    // 清理图表
    DashboardState.charts.forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    DashboardState.charts.clear();
});

// 定期性能监控
setInterval(monitorPerformance, 30000); // 每30秒检查一次

// 页面加载完成后的初始化
console.log('仪表板已初始化完成');
showNotification('仪表板系统已就绪', 'info');