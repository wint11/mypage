// ExerciseRenderer.js
import { updateButtons, resetOptions } from './UI.js';

// 替换 $$...$$ 为 <div class="math">...</div>
// 修改 processLaTeX 函数
export function processLaTeX(content) {
    // 处理行间公式（保持换行）
    content = content.replace(/\$\$([\s\S]+?)\$\$/gs, (match, p1) => {
        return `<div class="math-display">${p1.trim()}</div>`;
    });

    // 新增处理行内多个矩阵的情况
    content = content.replace(/\\begin\{vmatrix\}([\s\S]+?)\\end\{vmatrix\}/g, (match, p1) => {
        return `$\begin{vmatrix}${p1}\end{vmatrix}$`;
    });

    return content;
}

export function renderExercise(index, exerciseManager, courseId) {
    if (!exerciseManager || !exerciseManager.exercises || index >= exerciseManager.exercises.length) {
        console.error('Invalid exercise manager or index');
        return;
    }
    
    const exercises = exerciseManager.exercises;
    const mdText = exercises[index];
    const container = document.getElementById("exercise-container");
    container.innerHTML = "";

    const block = document.createElement("div");
    block.className = "question-block";

    const answerMatch = mdText.match(/【正确答案：(\d+)】/);
    const correctAnswerIndex = answerMatch ? parseInt(answerMatch[1], 10) : null;
    // 支持“解析:”和“解析：”两种情况
    const explanationMatch = mdText.match(/解析[:：]([\s\S]*)$/);
    const explanationMd = explanationMatch ? explanationMatch[1].trim() : "无解析";
    const mdWithoutAnswer = mdText.replace(/【正确答案：\d+】/, '').replace(/解析[:：][\s\S]*$/, '').trim();

    const isReviewingAnsweredQuestion = index < exercises.length - 1;
    if (isReviewingAnsweredQuestion) {
        exerciseManager.answeredCorrect = true;
        updateButtons(exerciseManager);
    }

    const optionLines = mdWithoutAnswer.split('\n').filter(line => line.trim().startsWith('- '));
    const questionText = mdWithoutAnswer.split('\n').filter(line => !line.trim().startsWith('- ')).join('\n');

    block.innerHTML = `<h5>题目 ${index + 1}：</h5>` + marked.parse(processLaTeX(questionText));

    const optionsDiv = document.createElement('div');
    optionLines.forEach((line, i) => {
        const optText = line.replace(/^- /, '').trim();
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check';

        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'radio';
        input.name = `q${index}`;
        input.id = `q${index}opt${i}`;
        input.value = i;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.setAttribute('for', `q${index}opt${i}`);
        label.innerHTML = marked.parse(processLaTeX(optText));

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        optionsDiv.appendChild(wrapper);

        if (isReviewingAnsweredQuestion && i === correctAnswerIndex) {
            input.checked = true;
            input.disabled = true;
            label.classList.add('correct');
        } else if (isReviewingAnsweredQuestion) {
            input.disabled = true;
        }
    });

    block.appendChild(optionsDiv);

    const checkBtn = document.createElement('button');
    checkBtn.className = "btn btn-outline-success mt-3";
    checkBtn.textContent = "检查答案";

    const redoBtn = document.createElement('button');
    redoBtn.className = "btn btn-outline-warning mt-3 ms-2";
    redoBtn.textContent = "再做一次";
    redoBtn.style.display = "none";

    const resetBtn = document.createElement('button');
    resetBtn.className = "btn btn-outline-secondary mt-3 ms-2";
    resetBtn.textContent = "重新选择";
    resetBtn.style.display = "none";

    const viewExplanationBtn = document.createElement('button');
    viewExplanationBtn.className = "btn btn-outline-info mt-3 ms-2";
    viewExplanationBtn.textContent = "查看解析";
    viewExplanationBtn.style.display = "none";

    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'mt-3';
    explanationDiv.style.display = 'none';

    if (isReviewingAnsweredQuestion) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'correct mt-3 result-message';
        resultDiv.textContent = "✅ 正确";
        block.appendChild(resultDiv);
        explanationDiv.innerHTML = "<strong>解析：</strong>" + marked.parse(processLaTeX(explanationMd));
        explanationDiv.style.display = 'block';
        viewExplanationBtn.textContent = "收起解析";
        viewExplanationBtn.style.display = 'inline-block';
        checkBtn.disabled = true;
    }

    checkBtn.onclick = () => {
        const selected = block.querySelector(`input[name="q${index}"]:checked`);
        if (!selected) return alert("请选择一个选项！");
        const userChoice = parseInt(selected.value, 10);
        const isCorrect = userChoice === correctAnswerIndex;

        let resultDiv = block.querySelector('.result-message');
        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.className = 'result-message mt-3';
            block.appendChild(resultDiv);
        }

        resultDiv.className = isCorrect ? 'correct mt-3 result-message' : 'incorrect mt-3 result-message';
        resultDiv.textContent = isCorrect ? "✅ 正确" : "❌ 错误";

        checkBtn.disabled = true;
        block.querySelectorAll(`input[name="q${index}"]`).forEach(i => i.disabled = true);
        exerciseManager.answeredCorrect = isCorrect;
        updateButtons(exerciseManager);

        if (!isCorrect) {
            redoBtn.style.display = 'inline-block';
            resetBtn.style.display = 'inline-block';
        }

        viewExplanationBtn.style.display = 'inline-block';
    };

    redoBtn.onclick = () => {
        exerciseManager.answeredCorrect = false;
        updateButtons(exerciseManager);
        resetOptions(`q${index}`);
        checkBtn.disabled = false;
        block.querySelector('.result-message')?.remove();
        redoBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        viewExplanationBtn.style.display = 'none';
        explanationDiv.style.display = 'none';
    };

    resetBtn.onclick = () => {
        resetOptions(`q${index}`);
        checkBtn.disabled = false;
        redoBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        viewExplanationBtn.style.display = 'none';
        explanationDiv.style.display = 'none';
        block.querySelector('.result-message')?.remove();
    };

    viewExplanationBtn.onclick = () => {
        if (explanationDiv.style.display === 'none') {
            explanationDiv.innerHTML = "<strong>解析：</strong>" + marked.parse(processLaTeX(explanationMd));
            MathJax.typesetClear();
            MathJax.typesetPromise();
            explanationDiv.style.display = 'block';
            viewExplanationBtn.textContent = "收起解析";
        } else {
            explanationDiv.style.display = 'none';
            viewExplanationBtn.textContent = "查看解析";
        }
    };

    block.appendChild(checkBtn);
    block.appendChild(redoBtn);
    block.appendChild(resetBtn);
    block.appendChild(viewExplanationBtn);
    block.appendChild(explanationDiv);
    container.appendChild(block);

    // 最终刷新 MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetClear();
        MathJax.typesetPromise();
    }
}