import Raven3DTest from './index.js';

// Check for file:// protocol
if (window.location.protocol === 'file:') {
    alert('⚠️ 警告：检测到您正在使用本地文件协议 (file://) 运行。\n\n由于浏览器安全限制，无法读取题目答案文件 (XML)，这将导致下载的结果中正确答案为 null。\n\n请使用本地服务器 (如 VS Code Live Server, python http.server) 或部署到 Web 服务器运行。');
    console.warn('Running via file:// protocol. Fetch requests will fail.');
}

const stemView = document.getElementById('stemView');
// const prevBtn = document.getElementById('prevBtn'); // Removed as not in HTML
// const nextBtn = document.getElementById('nextBtn'); // Removed as not in HTML
const prevBtnDesktop = document.getElementById('prevBtnDesktop');
const nextBtnDesktop = document.getElementById('nextBtnDesktop');
const jumpInput = document.getElementById('jumpInput');
const jumpBtn = document.getElementById('jumpBtn');
// const filterInfo = document.getElementById('filterInfo'); // Removed or Replaced
// const questionNumber = document.getElementById('questionNumber'); // Removed
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const options = document.querySelectorAll('.option-image-btn');
// const answerFeedback = document.getElementById('answerFeedback'); // Removed
const filterButtons = Array.from(document.querySelectorAll('.filter-buttons .btn'));
const test = new Raven3DTest();
let scale = 1;
// Track user answers
const userAnswers = {}; // { index: answer }
const submitBtn = document.getElementById('submitBtn');

// UI Elements for Selection
const difficultySelect = document.getElementById('difficultySelect');
const typeSelect = document.getElementById('typeSelect');
const taskSelect = document.getElementById('taskSelect');

// Task Metadata
const taskStructure = {
    'easy': {
        'Single': [
            { id: 'task1', name: 'Single-1-layer' },
            { id: 'task2', name: 'Single-2-layer' },
            { id: 'task3', name: 'Single-3-layer' }
        ],
        'Double': [
            { id: 'task4', name: 'Left-Right-1-layer' },
            { id: 'task5', name: 'Left-Right-2-layer' },
            { id: 'task6', name: 'Up-Down-1-layer' },
            { id: 'task7', name: 'Up-Down-2-layer' }
        ],
        'Triple': [
            { id: 'task8', name: 'Fixed-1-layer' },
            { id: 'task9', name: 'Fixed-2-layer' },
            { id: 'task10', name: 'Shuffle-1-layer' },
            { id: 'task11', name: 'Shuffle-2-layer' }
        ]
    },
    'hard': {
        'Single': [
            { id: 'task12', name: 'Single-1-layer' },
            { id: 'task13', name: 'Single-2-layer' },
            { id: 'task14', name: 'Single-3-layer' }
        ],
        'Double': [
            { id: 'task15', name: 'Left-Right-1-layer' },
            { id: 'task16', name: 'Left-Right-2-layer' },
            { id: 'task17', name: 'Up-Down-1-layer' },
            { id: 'task18', name: 'Up-Down-2-layer' }
        ],
        'Triple': [
            { id: 'task19', name: 'Fixed-1-layer' },
            { id: 'task20', name: 'Fixed-2-layer' },
            { id: 'task21', name: 'Shuffle-1-layer' },
            { id: 'task22', name: 'Shuffle-2-layer' }
        ]
    }
};

function updateTaskOptions() {
    const difficulty = difficultySelect.value;
    const type = typeSelect.value;
    const tasks = taskStructure[difficulty][type] || [];
    
    taskSelect.innerHTML = tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    
    // Trigger loading the first task in the list
    if (tasks.length > 0) {
            handleTaskChange();
    }
}

async function handleTaskChange() {
    const taskId = taskSelect.value;
    if (!taskId) return;
    
    // Clear user answers when switching task
    Object.keys(userAnswers).forEach(key => delete userAnswers[key]);

    await test.switchTask(taskId);
    update();
}

difficultySelect.addEventListener('change', updateTaskOptions);
typeSelect.addEventListener('change', updateTaskOptions);
taskSelect.addEventListener('change', handleTaskChange);

// Initial load
updateTaskOptions();

// UI Elements for Instructions
const instructionsPage = document.getElementById('instructionsPage');
const mainContent = document.querySelector('.main-content');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const confirmBtn = document.getElementById('confirmBtn');
const confirmText = document.getElementById('confirmText');

// Countdown Logic
let countdown = 5;
const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
        confirmText.textContent = `确认 (${countdown})`;
    } else {
        clearInterval(timer);
        confirmText.textContent = '确认';
        checkInput();
    }
}, 1000);

function checkInput() {
    if (countdown <= 0 && inviteCodeInput.value.trim().length > 0) {
        confirmBtn.disabled = false;
    } else {
        confirmBtn.disabled = true;
    }
}

inviteCodeInput.addEventListener('input', checkInput);

confirmBtn.addEventListener('click', async () => {
    const code = inviteCodeInput.value.trim();
    if (!code) return;

    confirmBtn.disabled = true;
    confirmText.textContent = '加载中...';

    try {
        // Note: init calls switchTask internally. We can rely on the default logic or force update.
        // But since our UI logic now drives task selection, we might want to let the UI set the task.
        // For now, init() sets a default. We should let updateTaskOptions handle the specific task.
        await test.init(code);
        
        // Sync UI with the task loaded by init (which defaults to task1)
        // Or better: Force UI to load the correct task based on current selections
        updateTaskOptions(); 
        
        instructionsPage.style.display = 'none';
        mainContent.style.display = 'block';
    } catch (e) {
        console.error(e);
        alert('初始化失败，请检查邀请码或网络连接');
        confirmBtn.disabled = false;
        confirmText.textContent = '确认';
        checkInput();
    }
});

function render(q, total, index){
    if (q && q.image_path) {
        // Set background image for stem view
        stemView.style.backgroundImage = `url("${q.image_path}")`;
        
        // Set background image for all options
        options.forEach(opt => {
            opt.style.backgroundImage = `url("${q.image_path}")`;
        });
    } else {
        stemView.style.backgroundImage = 'none';
        options.forEach(opt => {
            opt.style.backgroundImage = 'none';
        });
    }
    
    // stemImages.innerHTML = q ? `<img id="stemImg" src="${q.image_path}" />` : ''; // Removed
    // questionNumber.textContent = `第 ${index+1} 题`; // Removed
    progressText.textContent = `${index+1}/${total}`;
    progressFill.style.width = total?`${Math.round(((index+1)/total)*100)}%`: '0%';
    if(prevBtnDesktop) prevBtnDesktop.disabled = index===0;
    if(nextBtnDesktop) nextBtnDesktop.disabled = index>=total-1;
    jumpInput.max = total; jumpInput.placeholder = `1-${total}`;
    // filterInfo.textContent = `${total} 题`; // Element removed

    // Reset options
    options.forEach(o => {
        o.classList.remove('selected', 'correct', 'incorrect');
    });

    // Restore selection if answered
    // Use q.index (unique question ID) instead of UI index to ensure consistency with submission logic
    const savedAnswer = q ? userAnswers[q.index] : null;
    if (savedAnswer) {
        const opt = document.querySelector(`.option-image-btn[data-option="${savedAnswer}"]`);
        if (opt) opt.classList.add('selected');
    }

    // Update submit button
    const answeredCount = Object.keys(userAnswers).length;
    if(submitBtn) {
        if (answeredCount === total) {
            submitBtn.textContent = '提交答案';
            submitBtn.disabled = false;
            submitBtn.classList.add('enabled'); // Optional: Add a class for styling
        } else {
            submitBtn.textContent = `已答题 ${answeredCount}/${total}`;
            submitBtn.disabled = true;
            submitBtn.classList.remove('enabled');
        }
    }
}
function update(){ const q = test.current(); const total = test.getTotal(); const index = test.getIndex(); render(q,total,index); }

if(prevBtnDesktop) prevBtnDesktop.addEventListener('click', ()=>{ test.prev(); update(); });
if(nextBtnDesktop) nextBtnDesktop.addEventListener('click', ()=>{ test.next(); update(); });
jumpBtn.addEventListener('click', ()=>{ const n = parseInt(jumpInput.value||'1',10); test.jump(n-1); update(); });
// Zoom controls removed from HTML, keeping JS logic or commenting out to avoid errors if elements missing
if(zoomInBtn) zoomInBtn.addEventListener('click', ()=>{ if(!stemView) return; scale = Math.min(2, scale+0.1); stemView.style.transform = `scale(${scale})`; stemView.style.transformOrigin = 'center'; });
if(zoomOutBtn) zoomOutBtn.addEventListener('click', ()=>{ if(!stemView) return; scale = Math.max(0.5, scale-0.1); stemView.style.transform = `scale(${scale})`; stemView.style.transformOrigin = 'center'; });
filterButtons.forEach(b=>{ b.addEventListener('click', ()=>{ const t = b.getAttribute('data-filter'); test.applyFilter(t); update(); }); });

// Submit Button Logic
if (submitBtn) {
    // Elements for Modal
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));
    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    const submitStats = document.getElementById('submitStats');

    submitBtn.addEventListener('click', async () => {
        // Show modal instead of immediate download
        submitModal.show();
        
        // Optional: Calculate and show stats in modal before download
        // Since we are generating the results anyway, we can peek at them here
        /*
        const questions = test.questionManager.getAllQuestions();
        let correctCount = 0;
        for (const q of questions) {
             const userAnswer = userAnswers[q.index];
             let correctAnswer = q.answer;
             if (!correctAnswer) correctAnswer = await test.questionManager.getAnswer(q);
             if (userAnswer === correctAnswer) correctCount++;
        }
        submitStats.style.display = 'block';
        submitStats.textContent = `正确率: ${correctCount}/${questions.length} (${Math.round(correctCount/questions.length*100)}%)`;
        */
       // Uncomment above block if user wants stats shown in modal
    });

    confirmSubmitBtn.addEventListener('click', async () => {
        const questions = test.questionManager.getAllQuestions(); // Get all active questions
        const results = [];

        for (const q of questions) {
            const userAnswer = userAnswers[q.index] || null; // Use original index from tracking
            
            // Ensure we have the correct answer loaded
            let correctAnswer = q.answer;
            if (!correctAnswer) {
                correctAnswer = await test.questionManager.getAnswer(q);
            }

            results.push({
                image: q.image_path,
                correct_answer: correctAnswer,
                user_answer: userAnswer
            });
        }

        // Generate JSONL string
        const jsonlContent = results.map(r => JSON.stringify(r)).join('\n');

        // Construct filename: Difficulty-Type-TaskSet-InviteCode.jsonl
        const difficulty = difficultySelect.value;
        const type = typeSelect.value;
        const taskSet = taskSelect.options[taskSelect.selectedIndex].text; // Use task name
        const inviteCode = inviteCodeInput.value.trim() || 'NoCode';
        
        const filename = `${difficulty}-${type}-${taskSet}-${inviteCode}.jsonl`;

        // Create download link
        const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Close modal
        submitModal.hide();
    });
}


// Option Click Handling
options.forEach(opt => {
    opt.addEventListener('click', async () => {
        // Remove previous selection
        options.forEach(o => o.classList.remove('selected'));
        
        // Select clicked
        opt.classList.add('selected');
        const selectedAnswer = opt.getAttribute('data-option');
        
        // Save answer
        // Use unique question index instead of UI index
        const currentQ = test.getCurrentQuestion();
        if (currentQ) {
            userAnswers[currentQ.index] = selectedAnswer;
        }

        // Update submit button text
        // Call render to update button state consistently
        const total = test.getTotal();
        const currentIndex = test.getIndex();
        render(currentQ, total, currentIndex);
    });
});
