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
        reportBtn.addEventListener('click', callbacks.onReport || function () {
            alert('正在加急开发ing。');
        });
    }

    const simulateBtn = document.getElementById('simulate-btn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', callbacks.onSimulate || function () {
            alert('正在加急开发ing。');
        });
    }
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