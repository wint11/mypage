// 学习报告生成模块

import { getCourseConfig } from './CourseConfig.js';

// AI API配置
const AI_API_CONFIG = {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-1-5-pro-256k-250115',
    apiKey: '32c33497-91ee-48bb-ae39-f59eac806506' // 需要用户配置实际的API密钥
};

// 生成学习报告的prompt模板
function generateReportPrompt(courseTitle, exerciseData, userChoices) {
    return `你是一位专业的教育评估专家。请根据以下学生的练习数据，分析学生在「${courseTitle}」课程中的知识点掌握情况，并生成一份详细的学习报告。

练习数据：
${exerciseData.map((exercise, index) => {
    const lines = exercise.split('\n');
    const options = lines.filter(line => line.trim().startsWith('-'));
    const answerMatch = exercise.match(/【正确答案：(\d+)】/);
    const explanationMatch = exercise.match(/解析[:：]([\s\S]*)$/);
    
    // 提取题目内容（排除选项、答案和解析）
    const questionLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('-') && 
               !trimmed.includes('【正确答案：') && 
               !trimmed.startsWith('解析:') && 
               !trimmed.startsWith('解析：') &&
               trimmed.length > 0;
    });
    const question = questionLines.join('\n');
    
    const correctIndex = answerMatch ? parseInt(answerMatch[1]) : null;
    const userChoice = userChoices[index];
    const explanation = explanationMatch ? explanationMatch[1].trim() : '无解析';
    
    return `题目${index + 1}：
${question}

选项：
${options.join('\n')}

正确答案：${correctIndex !== null ? String.fromCharCode(65 + correctIndex) : '未知'}
学生选择：${userChoice !== null && userChoice !== undefined ? String.fromCharCode(65 + userChoice) : '未作答'}
答题结果：${userChoice === correctIndex ? '正确' : '错误'}
解析：${explanation}`;
}).join('\n\n' + '='.repeat(50) + '\n\n')}

请从以下几个维度进行分析：
1. 总体表现：正确率统计和整体评价
2. 知识点掌握情况：分析学生在不同知识点上的表现
3. 错误分析：分析常见错误类型和原因
4. 学习建议：针对薄弱环节提出具体的学习建议
5. 后续学习计划：建议下一步的学习重点

请用中文回答，格式要清晰易读，适合作为学习报告展示给学生。`;
}

// 调用AI API生成报告
async function callAIAPI(prompt) {
    try {
        const response = await fetch(AI_API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_API_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI API调用失败:', error);
        throw error;
    }
}

// 生成简单的本地报告（当API不可用时的备选方案）
function generateLocalReport(courseTitle, exerciseData, userChoices) {
    const totalQuestions = exerciseData.length;
    const answeredQuestions = userChoices.filter(choice => choice !== null && choice !== undefined).length;
    const correctAnswers = exerciseData.filter((exercise, index) => {
        const answerMatch = exercise.match(/【正确答案：(\d+)】/);
        const correctIndex = answerMatch ? parseInt(answerMatch[1]) : null;
        return userChoices[index] === correctIndex;
    }).length;
    
    const accuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions * 100).toFixed(1) : 0;
    
    return `# ${courseTitle} 学习报告

## 总体表现
- 总题目数：${totalQuestions}
- 已作答题目：${answeredQuestions}
- 正确题目：${correctAnswers}
- 正确率：${accuracy}%

## 表现评价
${accuracy >= 80 ? '🎉 表现优秀！您对该课程的知识点掌握得很好。' : 
  accuracy >= 60 ? '👍 表现良好！还有一些知识点需要加强。' : 
  '💪 需要努力！建议重新学习相关知识点。'}

## 学习建议
${accuracy < 60 ? 
  '- 建议重新阅读课程材料\n- 多做练习题巩固知识点\n- 可以寻求老师或同学的帮助' :
  accuracy < 80 ?
  '- 针对错误的题目重点复习\n- 加强薄弱知识点的练习\n- 保持当前的学习节奏' :
  '- 继续保持良好的学习状态\n- 可以尝试更有挑战性的题目\n- 帮助其他同学共同进步'
}

## 后续计划
建议继续练习，特别关注错误率较高的知识点。定期回顾已学内容，确保知识的巩固和深化。

---
*报告生成时间：${new Date().toLocaleString()}*`;
}

// 主要的报告生成函数
export async function generateLearningReport(courseId) {
    try {
        // 获取课程配置
        const courseConfig = await getCourseConfig(courseId);
        if (!courseConfig) {
            throw new Error('未找到课程配置');
        }
        
        // 获取课程标题，优先使用subject，然后是title，最后使用courseId作为回退
        const courseTitle = courseConfig.subject || courseConfig.title || courseId || '未知课程';
        
        // 获取练习管理器实例
        const exerciseManager = window.courseExerciseManagers?.[courseId];
        if (!exerciseManager) {
            throw new Error('未找到课程练习数据');
        }
        
        const exercises = exerciseManager.exercises;
        const userChoices = exerciseManager.userChoices;
        
        if (exercises.length === 0) {
            throw new Error('没有练习数据可供分析');
        }
        
        // 显示加载状态
        const loadingMessage = '正在生成学习报告，请稍候...';
        showReportModal(loadingMessage, true);
        
        let reportContent;
        
        // 检查API密钥是否配置
        if (AI_API_CONFIG.apiKey === 'YOUR_API_KEY_HERE' || !AI_API_CONFIG.apiKey) {
            console.warn('AI API密钥未配置，使用本地报告生成');
            reportContent = generateLocalReport(courseTitle, exercises, userChoices);
        } else {
            try {
                // 生成AI分析prompt
                const prompt = generateReportPrompt(courseTitle, exercises, userChoices);
                
                // 调用AI API
                reportContent = await callAIAPI(prompt);
            } catch (apiError) {
                console.warn('AI API调用失败，使用本地报告生成:', apiError);
                reportContent = generateLocalReport(courseTitle, exercises, userChoices);
            }
        }
        
        // 显示报告
        showReportModal(reportContent, false);
        
    } catch (error) {
        console.error('生成学习报告失败:', error);
        showReportModal(`生成报告时出现错误：${error.message}`, false, true);
    }
}

// 显示报告模态框
function showReportModal(content, isLoading = false, isError = false) {
    // 保存当前焦点元素
    const previouslyFocusedElement = document.activeElement;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('reportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框HTML
    const modalHTML = `
        <div class="modal fade" id="reportModal" tabindex="-1" aria-labelledby="reportModalLabel">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="reportModalLabel">
                            ${isLoading ? '生成报告中...' : isError ? '错误' : '学习报告'}
                        </h5>
                        ${!isLoading ? '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${isLoading ? 
                            '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>' :
                            `<div class="report-content">${isError ? content : marked.parse(content)}</div>`
                        }
                    </div>
                    ${!isLoading ? 
                        '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button></div>' : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 获取模态框元素
    const modalElement = document.getElementById('reportModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // 模态框显示后的处理
    modalElement.addEventListener('shown.bs.modal', function () {
        // 确保模态框获得焦点
        if (!isLoading) {
            const closeButton = this.querySelector('.btn-close');
            if (closeButton) {
                closeButton.focus();
            }
        }
    });
    
    // 模态框关闭时的处理
     modalElement.addEventListener('hidden.bs.modal', function () {
         // 移除模态框元素
         this.remove();
         
         // 强制清理Bootstrap模态框的副作用
         document.body.classList.remove('modal-open');
         const backdrop = document.querySelector('.modal-backdrop');
         if (backdrop) {
             backdrop.remove();
         }
         
         // 恢复body的样式
         document.body.style.overflow = '';
         document.body.style.paddingRight = '';
         
         // 恢复之前的焦点
         setTimeout(() => {
             try {
                 if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
                     // 确保元素仍然存在于DOM中
                     if (document.contains(previouslyFocusedElement)) {
                         previouslyFocusedElement.focus();
                     } else {
                         // 如果原元素不存在，尝试找到报告按钮
                         const reportBtn = document.getElementById('report-btn');
                         if (reportBtn) {
                             reportBtn.focus();
                         } else {
                             document.body.focus();
                         }
                     }
                 } else {
                     // 默认将焦点设置到报告按钮
                     const reportBtn = document.getElementById('report-btn');
                     if (reportBtn) {
                         reportBtn.focus();
                     }
                 }
             } catch (e) {
                 console.warn('焦点恢复失败:', e);
                 // 最后的备选方案
                 const reportBtn = document.getElementById('report-btn');
                 if (reportBtn) {
                     reportBtn.focus();
                 }
             }
         }, 150);
     });
    
    // 显示模态框
    modal.show();
}

// 导出配置函数（供用户配置API密钥）
export function configureAIAPI(apiKey, apiUrl = null, model = null) {
    AI_API_CONFIG.apiKey = apiKey;
    if (apiUrl) AI_API_CONFIG.url = apiUrl;
    if (model) AI_API_CONFIG.model = model;
    
    console.log('AI API配置已更新');
}