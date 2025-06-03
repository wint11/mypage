const apiKey = '32c33497-91ee-48bb-ae39-f59eac806506';
const model = 'doubao-1-5-pro-256k-250115';
let exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
let currentIndex = exercises.length > 0 ? exercises.length - 1 : 0;
let bufferedExercise = null;
let answeredCorrect = false;
let isPreloading = false;

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const container = document.getElementById("exercise-container");

// 按钮事件绑定
prevBtn.onclick = () => {
    if (currentIndex > 0) {
        currentIndex--;
        answeredCorrect = currentIndex < exercises.length - 1;
        renderExercise(currentIndex);
        updateButtons();
    }
};

nextBtn.onclick = () => {
    if (!answeredCorrect) return;
    if (currentIndex < exercises.length - 1) {
        currentIndex++;
        answeredCorrect = false;
        renderExercise(currentIndex);
        updateButtons();
        preloadNextExercise();
    } else if (bufferedExercise) {
        exercises.push(bufferedExercise);
        localStorage.setItem('exercises', JSON.stringify(exercises));
        bufferedExercise = null;
        currentIndex++;
        answeredCorrect = false;
        renderExercise(currentIndex);
        updateButtons();
        preloadNextExercise();
    } else {
        alert('下一题正在生成中，请稍候。');
        nextBtn.disabled = true;
    }
};

document.getElementById('back-btn').addEventListener('click', function () {
    window.location.href = '../../views/my-courses.html';
});

document.getElementById('export-btn').addEventListener('click', async () => {
    const { Document, Packer, Paragraph, TextRun } = window.docx;

    // 读取 localStorage 里的题目
    const exercises = JSON.parse(localStorage.getItem("exercises") || "[]");

    if (exercises.length === 0) {
        alert("题目为空！");
        return;
    }

    const paragraphs = [];

    // 标题
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "线性代数题目集",
                    bold: true,
                    size: 36, // 字号18磅
                    font: "宋体",
                }),
            ],
            spacing: { after: 300 },
            alignment: "center",
        })
    );

    // 遍历每个题目
    exercises.forEach((item, index) => {
        const lines = item.split("\n");
        const question = lines[0];
        const options = lines.filter(line => line.trim().startsWith("-"));
        const answerMatch = item.match(/【正确答案：(\d+)】/);
        const correctIndex = answerMatch ? parseInt(answerMatch[1]) : null;
        const explanationMatch = item.match(/解析[:：]([\s\S]*)$/);
        const explanation = explanationMatch ? explanationMatch[1].trim() : "无";

        // 题干
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${index + 1}. ${question}`,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 100 },
            })
        );

        // 选项
        options.forEach(opt => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: opt.trim(),
                            size: 24,
                            font: "宋体",
                        }),
                    ],
                    spacing: { after: 100 },
                })
            );
        });

        // 答案
        const answerText = `正确答案：${correctIndex !== null ? String.fromCharCode(65 + correctIndex) : "未知"}`;
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: answerText,
                        italics: true,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 100 },
            })
        );

        // 解析
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `解析：${explanation.split("\n")[0]}`,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 300 },
            })
        );
    });

    // 创建 Word 文档对象
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    // 导出为 blob
    const blob = await Packer.toBlob(doc);

    // 下载
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "线性代数题目集.docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById('report-btn').addEventListener('click', function () {
    alert('正在加急开发ing。');
});

document.getElementById('simulate-btn').addEventListener('click', function () {
    alert('正在加急开发ing。');
});

function updateButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = !answeredCorrect ||
        (currentIndex === exercises.length - 1 && !bufferedExercise);
}

function resetOptions(name) {
    const options = container.querySelectorAll(`input[name="${name}"]`);
    options.forEach(opt => {
        opt.disabled = false;
        opt.checked = false;
    });
}

// 替换 $$...$$ 为 <div class="math">...</div>
// 修改 processLaTeX 函数
function processLaTeX(content) {
    // 处理行间公式（保持换行）
    content = content.replace(/\$\$([\s\S]+?)\$\$/gs, (match, p1) => {
        return `<div class="math-display">${p1.trim()}</div>`;
    });

    // 新增处理行内多个矩阵的情况
    content = content.replace(/\\begin\{vmatrix\}([\s\S]+?)\\end\{vmatrix\}/g, (match, p1) => {
        return `$\\begin{vmatrix}${p1}\\end{vmatrix}$`;
    });

    return content;
}

function renderExercise(index) {
    const mdText = exercises[index];
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
        answeredCorrect = true;
        updateButtons();
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
        answeredCorrect = isCorrect;
        updateButtons();

        if (!isCorrect) {
            redoBtn.style.display = 'inline-block';
            resetBtn.style.display = 'inline-block';
        }

        viewExplanationBtn.style.display = 'inline-block';
    };

    redoBtn.onclick = () => {
        answeredCorrect = false;
        updateButtons();
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

async function preloadNextExercise() {
    if (isPreloading || bufferedExercise) return;
    isPreloading = true;

    const prompt = `
请生成一道线性代数单选题，可从以下几个知识点方向出发：
- 行列式与矩阵基础
- 向量空间与线性变换
- 特征值与特征向量
- 线性方程组的解法
- 二次型

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用“解析:”开头。

示例，一个标准的题目格式如下：

设矩阵 
\begin{align*}
A = \begin{bmatrix}1 & 2 \\\\ 3 & 4\end{bmatrix}
\end{align*}
矩阵 $B$ 满足 
\begin{align*}
AB = \begin{bmatrix}5 & 6 \\\\ 7 & 8\end{bmatrix}
\end{align*}
则矩阵 $B$ 为（ ）

- A. 
\begin{align*}
\begin{bmatrix}-2 & 1 \\\\ 3.5 & 1\end{bmatrix}
\end{align*}

- B. 
\begin{align*}
\begin{bmatrix}2 & -1 \\\\ -3.5 & 1\end{bmatrix}
\end{align*}

- C. 
\begin{align*}
\begin{bmatrix}-2 & -1 \\\\ 3.5 & -1\end{bmatrix}
\end{align*}

- D. 
\begin{align*}
\begin{bmatrix}2 & 1 \\\\ -3.5 & -1\end{bmatrix}
\end{align*}

【正确答案：0】

解析:
设有矩阵 
\begin{align*}
B=\begin{bmatrix}a & b \\\\ c & d\end{bmatrix}
\end{align*}
根据矩阵乘法规则得：
\begin{align*}
AB 
&= \begin{bmatrix}1 & 2 \\\\ 3 & 4\end{bmatrix}\begin{bmatrix}a & b \\\\ c & d\end{bmatrix} \\\\
&= \begin{bmatrix}a + 2c & b + 2d \\\\ 3a + 4c & 3b + 4d\end{bmatrix} \\\\
&= \begin{bmatrix}5 & 6 \\\\ 7 & 8\end{bmatrix}
\end{align*}
由此建立方程组求解即可得出答案。
`;

    try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "你是一个线性代数题目生成器，请严格使用markdown的语法返回。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });
        const data = await response.json();
        bufferedExercise = data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('预加载失败：', e);
        bufferedExercise = null;
    } finally {
        isPreloading = false;
        updateButtons();
    }
}

// 在文件顶部添加
const loadingDiv = document.createElement('div');
loadingDiv.id = 'loading-overlay';
loadingDiv.style.position = 'fixed';
loadingDiv.style.top = '0';
loadingDiv.style.left = '0';
loadingDiv.style.width = '100%';
loadingDiv.style.height = '100%';
loadingDiv.style.backgroundColor = 'rgba(255,255,255,0.8)';
loadingDiv.style.display = 'flex';
loadingDiv.style.justifyContent = 'center';
loadingDiv.style.alignItems = 'center';
loadingDiv.style.zIndex = '9999';
loadingDiv.innerHTML = '<div style="font-size: 1.5rem; color: #333;">资源正在加载ing，请耐心等候几秒钟</div>';
document.body.appendChild(loadingDiv);

// 修改init函数
async function init() {
    try {
        await loadKnowledgePoints();
        if (exercises.length === 0) {
            await preloadNextExercise();
            if (bufferedExercise) {
                exercises.push(bufferedExercise);
                bufferedExercise = null;
                localStorage.setItem('exercises', JSON.stringify(exercises));
            }
        }
        renderExercise(currentIndex);
        updateButtons();
        preloadNextExercise();
    } catch (e) {
        console.error('初始化失败:', e);
    } finally {
        // 加载完成后隐藏提示
        loadingDiv.style.display = 'none';
    }
}

// 在loadKnowledgePoints函数中添加错误处理
async function loadKnowledgePoints() {
    try {
        const response = await fetch('../structure/xianxingdaishu.json');
        const data = await response.json();
        const container = document.getElementById('knowledge-points');

        async function loadMarkdownFile(path) {
            try {
                const response = await fetch(`../data/xianxingdaishu/${path}.md`);
                if (!response.ok) throw new Error('文件未找到');
                return await response.text();
            } catch (e) {
                console.error('加载Markdown文件失败:', e);
                return '暂无详细内容';
            }
        }

        function renderChapters(chapters, parentElement) {
            // 创建模态框
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'knowledgeModal';
            modal.style.display = 'none';
            modal.style.position = 'fixed';
            modal.style.zIndex = '100';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.margin = '10vh auto';
            modalContent.style.padding = '20px';
            modalContent.style.width = '60%';
            modalContent.style.left = '8%';
            modalContent.style.borderRadius = '5px';
            modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            modalContent.style.transition = 'all 0.3s ease';
            modalContent.style.position = 'relative';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '15px';

            const modalTitle = document.createElement('h4');  // 改为h4标题
            modalTitle.className = 'modal-title';
            modalTitle.id = 'knowledgeModalTitle';
            modalTitle.style.fontSize = '1.8rem';  // 增大字体
            modalTitle.style.fontWeight = 'bold';  // 加粗字体
            modalTitle.style.color = '#333';  // 深色字体

            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-close';
            closeBtn.textContent = '×';
            closeBtn.style.fontSize = '1.5rem';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => modal.style.display = 'none';

            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'knowledgeModalContent';

            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';

            const closeFooterBtn = document.createElement('button');
            closeFooterBtn.className = 'btn btn-primary';
            closeFooterBtn.textContent = '我要优化';
            closeFooterBtn.onclick = () => {
                // 创建文件输入元素
                alert('请上传Markdown文件，当前版本的知识点内容仅支持Markdown格式。');
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.md';
                fileInput.style.display = 'none';

                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            // 读取文件内容并更新模态框
                            document.getElementById('knowledgeModalContent').innerHTML =
                                marked.parse(processLaTeX(event.target.result));

                            // 重新渲染数学公式
                            if (window.MathJax && MathJax.typesetPromise) {
                                MathJax.typesetClear();
                                MathJax.typesetPromise();
                            }
                        };
                        reader.readAsText(file);
                    }
                };

                // 触发文件选择
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            };
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalFooter.appendChild(closeFooterBtn);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            chapters.forEach(chapter => {
                const chapterDiv = document.createElement('div');
                chapterDiv.className = 'chapter mb-2';
                const chapterHeader = document.createElement('div');
                chapterHeader.className = 'chapter-header d-flex align-items-center';
                chapterHeader.innerHTML = marked.parseInline(chapter.name);
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'toggle-icon ms-2';
                toggleIcon.innerHTML = '▶';
                chapterHeader.prepend(toggleIcon);
                const sectionsDiv = document.createElement('div');
                sectionsDiv.className = 'sections ps-3';
                sectionsDiv.style.display = 'none';

                if (chapter.sections && chapter.sections.length > 0) {
                    chapter.sections.forEach(section => {
                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'section small text-muted mb-1';
                        sectionDiv.innerHTML = marked.parseInline(section.name);
                        sectionDiv.style.cursor = 'pointer';
                        sectionDiv.onclick = async () => {
                            const modal = document.getElementById('knowledgeModal');
                            document.getElementById('knowledgeModalTitle').textContent = section.name;

                            // 加载对应的markdown文件
                            const mdContent = await loadMarkdownFile(section.path || section.name);
                            // 修改这里：使用 processLaTeX 处理公式
                            document.getElementById('knowledgeModalContent').innerHTML =
                                marked.parse(processLaTeX(mdContent));

                            modal.style.display = 'block';

                            if (window.MathJax && MathJax.typesetPromise) {
                                MathJax.typesetClear();
                                MathJax.typesetPromise();
                            }
                        };
                        sectionsDiv.appendChild(sectionDiv);
                    });
                }
                chapterHeader.onclick = () => {
                    sectionsDiv.style.display = sectionsDiv.style.display === 'none' ? 'block' : 'none';
                    toggleIcon.innerHTML = sectionsDiv.style.display === 'none' ? '▶' : '▼';
                };
                chapterDiv.appendChild(chapterHeader);
                chapterDiv.appendChild(sectionsDiv);
                parentElement.appendChild(chapterDiv);
            });
        }

        renderChapters(data.chapters, container);

        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetClear();
            MathJax.typesetPromise();
        }
    } catch (e) {
        console.error('加载知识点失败:', e);
        loadingDiv.innerHTML = '<div style="font-size: 1.5rem; color: red;">资源加载失败，请刷新重试</div>';
    }
}

init();