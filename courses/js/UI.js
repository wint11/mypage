// UI.js

export function setupUI(callbacks) {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (prevBtn && callbacks.onPrev) {
        prevBtn.onclick = callbacks.onPrev;
    }
    if (nextBtn && callbacks.onNext) {
        nextBtn.onclick = callbacks.onNext;
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', callbacks.onBack || function () {
            window.location.href = '../../views/my-courses.html';
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn && callbacks.onExport) {
        exportBtn.addEventListener('click', callbacks.onExport);
    }

    const reportBtn = document.getElementById('report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', callbacks.onReport);
    }

    // 模拟测试按钮处理已移至独立模块
    setupSimulateButton(callbacks.onSimulate);
}

export function updateButtons(exerciseManager) {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (prevBtn) {
        prevBtn.disabled = !exerciseManager || exerciseManager.currentIndex === 0;
    }
    if (nextBtn && exerciseManager) {
        nextBtn.disabled = !exerciseManager.answeredCorrect ||
            (exerciseManager.currentIndex === exerciseManager.exercises.length - 1 && !exerciseManager.bufferedExercise);
    }
}

export function resetOptions(name) {
    const container = document.getElementById("exercise-container");
    const options = container.querySelectorAll(`input[name="${name}"]`);
    options.forEach(opt => {
        opt.disabled = false;
        opt.checked = false;
    });
}

/**
 * 设置模拟测试按钮
 * @param {Function} onSimulate - 模拟测试回调函数
 */
export function setupSimulateButton(onSimulate) {
    const simulateBtn = document.getElementById('simulate-btn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', onSimulate || function () {
            alert('模拟测试功能暂时不可用。');
        });
        
        // 添加按钮状态管理
        simulateBtn.setAttribute('data-bs-toggle', 'tooltip');
        simulateBtn.setAttribute('data-bs-placement', 'top');
        simulateBtn.setAttribute('title', '开始模拟测试，检验学习成果');
        
        // 初始化 Bootstrap tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(simulateBtn);
        }
    }
}