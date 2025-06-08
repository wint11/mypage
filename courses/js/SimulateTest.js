// 模拟测试模块

import { getCourseConfig } from './CourseConfig.js';
import { renderExercise, processLaTeX } from './ExerciseRenderer.js';
import { updateButtons } from './UI.js';

/**
 * 模拟测试类
 */
export class SimulateTest {
    constructor(courseId) {
        this.courseId = courseId;
        this.courseConfig = getCourseConfig(courseId);
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.endTime = null;
        this.timeLimit = 60; // 默认60分钟
        this.timer = null;
        this.isActive = false;
    }

    /**
     * 开始模拟测试
     * @param {number} questionCount - 题目数量
     * @param {number} timeLimit - 时间限制（分钟）
     */
    async start(questionCount = 10, timeLimit = 60) {
        this.timeLimit = timeLimit;
        this.isActive = true;
        this.startTime = new Date();
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        // 显示模拟测试界面
        this.showTestInterface();
        
        // 生成测试题目
        await this.generateQuestions(questionCount);
        
        // 开始计时
        this.startTimer();
        
        // 显示第一题
        this.showQuestion(0);
    }

    /**
     * 生成测试题目（并发生成提高速度）
     */
    async generateQuestions(count) {
        this.questions = [];
        
        // 定义题型分布（确保多样性）
        const typeDistribution = this.getQuestionTypeDistribution(count);
        
        console.log(`开始并发生成${count}道题目...`);
        
        // 创建所有AI生成任务
        const aiTasks = typeDistribution.map((questionType, index) => 
            this.generateAIQuestionWithFallback(questionType, index + 1)
        );
        
        try {
            // 并发执行所有AI生成任务
            const results = await Promise.allSettled(aiTasks);
            
            // 处理结果
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    this.questions.push(result.value);
                } else {
                    console.warn(`第${index + 1}题AI生成失败，使用题库数据:`, result.reason);
                    this.questions.push(this.generateMockQuestion(index + 1));
                }
            });
            
            console.log(`题目生成完成，共${this.questions.length}道题目`);
            
        } catch (error) {
            console.error('批量生成题目失败:', error);
            // 如果批量生成完全失败，使用题库生成所有题目
            this.questions = [];
            for (let i = 0; i < count; i++) {
                this.questions.push(this.generateMockQuestion(i + 1));
            }
        }
        
        // 将生成的题目存储到localStorage
        this.saveQuestionsToLocalStorage();
    }
    
    /**
     * 获取课程的知识点列表
     */
    async getKnowledgePointsForSubject(courseId) {
        try {
            // 从courses/structure目录读取课程结构文件
            const response = await fetch(`../structure/${courseId}.json`);
            if (!response.ok) {
                throw new Error(`无法加载课程结构文件: ${courseId}.json`);
            }
            
            const courseData = await response.json();
            const knowledgePoints = [];
            
            // 遍历所有章节和小节，提取知识点名称
            if (courseData.chapters && Array.isArray(courseData.chapters)) {
                courseData.chapters.forEach(chapter => {
                    // 添加章节名称作为知识点
                    knowledgePoints.push(chapter.name);
                    
                    // 添加小节名称作为具体知识点
                    if (chapter.sections && Array.isArray(chapter.sections)) {
                        chapter.sections.forEach(section => {
                            knowledgePoints.push(section.name);
                        });
                    }
                });
            }
            
            return knowledgePoints.length > 0 ? knowledgePoints : this.getFallbackKnowledgePoints(courseId);
        } catch (error) {
            console.warn('读取课程结构文件失败，使用备用知识点:', error);
            return this.getFallbackKnowledgePoints(courseId);
        }
    }
    
    /**
     * 获取备用知识点列表（当无法读取结构文件时使用）
     */
    getFallbackKnowledgePoints(courseId) {
        const fallbackMap = {
            'gaodengshuxue': [
                '函数与极限',
                '导数与微分',
                '微分中值定理与导数应用',
                '不定积分',
                '定积分及其应用',
                '多元函数微分学',
                '重积分'
            ],
            'xianxingdaishu': [
                '矩阵的基本运算',
                '行列式',
                '线性方程组',
                '向量空间',
                '特征值与特征向量',
                '二次型'
            ],
            'gailuntongjixue': [
                '随机事件与概率',
                '随机变量及其分布',
                '数字特征',
                '大数定律与中心极限定理',
                '参数估计',
                '假设检验'
            ]
        };
        
        return fallbackMap[courseId] || fallbackMap['gaodengshuxue'];
    }
    
    /**
     * 将题目保存到localStorage
     */
    saveQuestionsToLocalStorage() {
        try {
            const questionsData = {
                questions: this.questions,
                timestamp: new Date().toISOString(),
                course: this.courseConfig.subject,
                questionCount: this.questions.length
            };
            
            const storageKey = `simulate_test_${this.courseConfig.subject}_${Date.now()}`;
            localStorage.setItem(storageKey, JSON.stringify(questionsData));
            localStorage.setItem('latest_simulate_test', storageKey);
            
            console.log(`题目已保存到localStorage，键名: ${storageKey}`);
            
            // 清理旧的测试数据（保留最近5次）
            this.cleanupOldTestData();
            
        } catch (error) {
            console.error('保存题目到localStorage失败:', error);
        }
    }
    
    /**
     * 清理旧的测试数据
     */
    cleanupOldTestData() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith('simulate_test_')
            ).sort((a, b) => {
                // 提取时间戳进行数值比较
                const timestampA = parseInt(a.split('_').pop());
                const timestampB = parseInt(b.split('_').pop());
                return timestampB - timestampA; // 降序排列，最新的在前
            });
            
            // 保留最近5次测试，删除其余的
            if (keys.length > 5) {
                const keysToDelete = keys.slice(5);
                keysToDelete.forEach(key => {
                    localStorage.removeItem(key);
                    console.log(`已删除旧测试数据: ${key}`);
                });
            }
        } catch (error) {
            console.error('清理旧测试数据失败:', error);
        }
    }
    
    /**
     * 带降级机制的AI题目生成
     */
    async generateAIQuestionWithFallback(questionType, index) {
        try {
            const aiQuestion = await this.generateAIQuestion(questionType, index);
            if (aiQuestion) {
                return aiQuestion;
            } else {
                // AI返回null，使用题库
                return this.generateQuestionFromBank(questionType);
            }
        } catch (error) {
            console.warn(`第${index}题AI生成异常:`, error);
            // AI生成异常，使用题库
            return this.generateQuestionFromBank(questionType);
        }
    }
    
    /**
     * 获取题型分布
     */
    getQuestionTypeDistribution(count) {
        const types = ['single', 'multiple', 'judgment', 'fill'];
        const distribution = [];
        
        // 确保每种题型至少有一题（如果题目数量足够）
        if (count >= 4) {
            types.forEach(type => distribution.push(type));
            
            // 剩余题目随机分配
            for (let i = 4; i < count; i++) {
                const randomType = types[Math.floor(Math.random() * types.length)];
                distribution.push(randomType);
            }
        } else {
            // 题目数量不足4题时，随机选择
            for (let i = 0; i < count; i++) {
                const randomType = types[Math.floor(Math.random() * types.length)];
                distribution.push(randomType);
            }
        }
        
        // 打乱顺序
        return this.shuffleArray(distribution);
    }
    
    /**
     * 打乱数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * 使用AI生成题目
     */
    async generateAIQuestion(questionType, index) {
        const apiKey = '32c33497-91ee-48bb-ae39-f59eac806506';
        const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        const model = 'doubao-1-5-pro-256k-250115';
        
        // 检查API密钥
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return null;
        }
        
        const subjects = {
            'gaodengshuxue': '高等数学',
            'xianxingdaishu': '线性代数',
            'gailvlun': '概率论',
            'lisuan': '离散数学',
            'fubian': '复变函数',
            'weifenfangcheng': '微分方程',
            'caozuoxitong': '操作系统'
        };
        
        const subject = subjects[this.courseId] || '高等数学';
        
        // 获取课程的具体知识点
        const knowledgePoints = await this.getKnowledgePointsForSubject(this.courseId);
        const randomKnowledgePoint = knowledgePoints[Math.floor(Math.random() * knowledgePoints.length)];
        
        const prompts = {
            'single': `请生成一道${subject}的单选题，要求：
1. 难度：大学本科水平，具有一定挑战性
2. 知识点：重点考查"${randomKnowledgePoint}"相关内容
3. 题目特点：需要理解概念、运用公式或进行推理计算
4. 避免过于简单的记忆性题目

请严格按照以下JSON格式返回：
{
  "question": "题目内容（包含必要的数学公式或图形描述）",
  "options": [
    {"text": "选项A内容", "value": "A"},
    {"text": "选项B内容", "value": "B"},
    {"text": "选项C内容", "value": "C"},
    {"text": "选项D内容", "value": "D"}
  ],
  "correctAnswer": "正确答案字母",
  "explanation": "详细解析，包含解题步骤和关键知识点",
  "difficulty": "medium",
  "knowledgePoint": "${randomKnowledgePoint}"
}`,
            'multiple': `请生成一道${subject}的多选题，要求：
1. 难度：大学本科水平，需要综合分析
2. 知识点：重点考查"${randomKnowledgePoint}"相关内容
3. 题目特点：考查多个相关概念或性质的理解
4. 正确答案：2-3个选项正确

请严格按照以下JSON格式返回：
{
  "question": "题目内容（多选题，包含复杂情境）",
  "options": [
    {"text": "选项A内容", "value": "A"},
    {"text": "选项B内容", "value": "B"},
    {"text": "选项C内容", "value": "C"},
    {"text": "选项D内容", "value": "D"}
  ],
  "correctAnswer": ["A", "C"],
  "explanation": "详细解析，逐项分析正误原因",
  "difficulty": "hard",
  "knowledgePoint": "${randomKnowledgePoint}"
}`,
            'judgment': `请生成一道${subject}的判断题，要求：
1. 难度：大学本科水平，需要深入理解
2. 知识点：重点考查"${randomKnowledgePoint}"相关内容
3. 题目特点：涉及定理条件、性质判断或概念辨析
4. 避免显而易见的简单判断

请严格按照以下JSON格式返回：
{
  "question": "判断题内容（涉及深层概念理解）",
  "correctAnswer": "T或F",
  "explanation": "详细解析，说明判断依据和相关理论",
  "difficulty": "medium",
  "knowledgePoint": "${randomKnowledgePoint}"
}`,
            'fill': `请生成一道${subject}的填空题，要求：
1. 难度：大学本科水平，需要计算或推导
2. 知识点：重点考查"${randomKnowledgePoint}"相关内容
3. 题目特点：需要运用公式、定理或进行数值计算
4. 提供4个有迷惑性的选项

请严格按照以下JSON格式返回：
{
  "question": "题目内容，用______表示空白处（包含具体计算情境）",
  "options": [
    {"text": "选项A内容", "value": "A"},
    {"text": "选项B内容", "value": "B"},
    {"text": "选项C内容", "value": "C"},
    {"text": "选项D内容", "value": "D"}
  ],
  "correctAnswer": "正确答案字母",
  "explanation": "详细解析，包含完整计算过程",
  "difficulty": "medium",
  "knowledgePoint": "${randomKnowledgePoint}"
}`
        };
        
        try {
            // 创建带超时的fetch请求
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: `你是一个${subject}题目生成器，请严格按照要求的JSON格式返回，不要添加任何其他内容。` },
                        { role: "user", content: prompts[questionType] }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // 清除超时定时器
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('AI返回内容为空');
            }
            
            // 清理和解析AI返回的JSON
            let cleanContent = content.trim();
            
            // 移除可能的markdown代码块标记
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            
            // 尝试提取JSON部分（如果AI返回了额外的文本）
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }
            
            // 记录原始内容用于调试
            console.log('AI返回的原始内容:', content.substring(0, 300) + '...');
            console.log('清理后的JSON内容:', cleanContent.substring(0, 300) + '...');
            
            let questionData;
            try {
                questionData = JSON.parse(cleanContent);
            } catch (parseError) {
                console.error('JSON解析失败，尝试修复常见问题:', parseError.message);
                
                // 尝试修复常见的JSON格式问题
                let fixedContent = cleanContent
                    .replace(/,\s*}/g, '}') // 移除对象尾随逗号
                    .replace(/,\s*]/g, ']') // 移除数组尾随逗号
                    .replace(/\\(?!["\\/bfnrt])/g, '\\\\') // 修复无效的转义字符
                    .replace(/"([^"]*?)\\"([^"]*?)"/g, '"$1\\\"$2"'); // 修复字符串内的引号转义
                
                console.log('修复后的JSON内容:', fixedContent.substring(0, 300) + '...');
                questionData = JSON.parse(fixedContent);
            }
            
            // 转换为标准格式
            if (questionType === 'judgment') {
                return {
                    question: questionData.question,
                    options: [
                        { text: '正确', value: 'T' },
                        { text: '错误', value: 'F' }
                    ],
                    correctAnswer: [questionData.correctAnswer],
                    type: 'single',
                    explanation: questionData.explanation
                };
            } else if (questionType === 'multiple') {
                return {
                    question: questionData.question,
                    options: questionData.options,
                    correctAnswer: questionData.correctAnswer,
                    type: 'multiple',
                    explanation: questionData.explanation
                };
            } else {
                return {
                    question: questionData.question,
                    options: questionData.options,
                    correctAnswer: [questionData.correctAnswer],
                    type: 'single',
                    explanation: questionData.explanation
                };
            }
            
        } catch (error) {
            // 处理不同类型的错误
            if (error.name === 'AbortError') {
                console.warn(`第${index}题AI生成超时30秒）`);
            } else {
                console.warn('AI生成题目失败:', error);
                console.warn('错误详情:', {
                    message: error.message,
                    stack: error.stack,
                    content: typeof content !== 'undefined' ? content?.substring(0, 200) + '...' : 'undefined'
                });
            }
            return null;
        }
    }
    
    /**
      * 从题库生成指定类型的题目
      */
     generateQuestionFromBank(questionType) {
         switch (questionType) {
             case 'single':
                 return this.generateSingleChoiceQuestion('', 1);
             case 'multiple':
                 return this.generateMultipleChoiceQuestion('', 1);
             case 'judgment':
                 return this.generateJudgmentQuestion('', 1);
             case 'fill':
                 return this.generateFillBlankQuestion('', 1);
             default:
                 return this.generateSingleChoiceQuestion('', 1);
         }
     }

    /**
     * 生成模拟题目（当API不可用时）
     */
    generateMockQuestion(index) {
        const questionTypes = ['single', 'multiple', 'judgment', 'fill'];
        const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        
        const subjects = {
            'gaodengshuxue': '高等数学',
            'xianxingdaishu': '线性代数',
            'gailvlun': '概率论',
            'lisuan': '离散数学',
            'fubian': '复变函数',
            'weifenfangcheng': '微分方程',
            'caozuoxitong': '操作系统'
        };
        
        const subject = subjects[this.courseId] || '数学';
        
        // 根据题型生成不同的题目
        switch (randomType) {
            case 'single':
                return this.generateSingleChoiceQuestion(subject, index);
            case 'multiple':
                return this.generateMultipleChoiceQuestion(subject, index);
            case 'judgment':
                return this.generateJudgmentQuestion(subject, index);
            case 'fill':
                return this.generateFillBlankQuestion(subject, index);
            default:
                return this.generateSingleChoiceQuestion(subject, index);
        }
    }
    
    /**
     * 生成单选题
     */
    generateSingleChoiceQuestion(subject, index) {
        const questions = this.getSingleChoiceQuestions(this.courseId);
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: [randomQuestion.correctAnswer],
            type: 'single',
            explanation: randomQuestion.explanation
        };
    }
    
    /**
     * 生成多选题
     */
    generateMultipleChoiceQuestion(subject, index) {
        const questions = this.getMultipleChoiceQuestions(this.courseId);
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer,
            type: 'multiple',
            explanation: randomQuestion.explanation
        };
    }
    
    /**
     * 生成判断题
     */
    generateJudgmentQuestion(subject, index) {
        const questions = this.getJudgmentQuestions(this.courseId);
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return {
            question: randomQuestion.question,
            options: [
                { text: '正确', value: 'T' },
                { text: '错误', value: 'F' }
            ],
            correctAnswer: [randomQuestion.correctAnswer],
            type: 'single',
            explanation: randomQuestion.explanation
        };
    }
    
    /**
     * 生成填空题
     */
    generateFillBlankQuestion(subject, index) {
        const questions = this.getFillBlankQuestions(this.courseId);
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer,
            type: 'single',
            explanation: randomQuestion.explanation
        };
    }

    /**
     * 获取单选题题库
     */
    getSingleChoiceQuestions(courseId) {
        const questionBank = {
            'gaodengshuxue': [
                {
                    question: '函数 f(x) = x² + 2x + 1 在点 x = 1 处的导数值是多少？',
                    options: [
                        { text: '2', value: 'A' },
                        { text: '3', value: 'B' },
                        { text: '4', value: 'C' },
                        { text: '5', value: 'D' }
                    ],
                    correctAnswer: 'C',
                    explanation: 'f\'(x) = 2x + 2，在 x = 1 处，f\'(1) = 2×1 + 2 = 4'
                },
                {
                    question: '极限 lim(x→0) (sin x)/x 的值是？',
                    options: [
                        { text: '0', value: 'A' },
                        { text: '1', value: 'B' },
                        { text: '∞', value: 'C' },
                        { text: '不存在', value: 'D' }
                    ],
                    correctAnswer: 'B',
                    explanation: '这是一个重要极限，lim(x→0) (sin x)/x = 1'
                }
            ],
            'xianxingdaishu': [
                {
                    question: '矩阵 A = [[1,2],[3,4]] 的行列式值是？',
                    options: [
                        { text: '-2', value: 'A' },
                        { text: '-1', value: 'B' },
                        { text: '1', value: 'C' },
                        { text: '2', value: 'D' }
                    ],
                    correctAnswer: 'A',
                    explanation: '|A| = 1×4 - 2×3 = 4 - 6 = -2'
                }
            ],
            'caozuoxitong': [
                {
                    question: '以下哪种页面置换算法理论上最优但无法实际实现？',
                    options: [
                        { text: 'FIFO（先进先出）', value: 'A' },
                        { text: 'LRU（最近最少使用）', value: 'B' },
                        { text: 'OPT（最佳置换）', value: 'C' },
                        { text: 'Clock（时钟置换）', value: 'D' }
                    ],
                    correctAnswer: 'C',
                    explanation: 'OPT算法需要预知程序未来的访问序列，在现实中无法实现'
                }
            ]
        };
        
        return questionBank[courseId] || questionBank['gaodengshuxue'];
    }
    
    /**
     * 获取多选题题库
     */
    getMultipleChoiceQuestions(courseId) {
        const questionBank = {
            'gaodengshuxue': [
                {
                    question: '以下哪些函数在 x = 0 处连续？（多选）',
                    options: [
                        { text: 'f(x) = x²', value: 'A' },
                        { text: 'f(x) = |x|', value: 'B' },
                        { text: 'f(x) = 1/x', value: 'C' },
                        { text: 'f(x) = sin(x)', value: 'D' }
                    ],
                    correctAnswer: ['A', 'B', 'D'],
                    explanation: 'x²、|x|、sin(x) 在 x = 0 处都连续，而 1/x 在 x = 0 处不连续'
                }
            ],
            'caozuoxitong': [
                {
                    question: '进程调度算法包括哪些？（多选）',
                    options: [
                        { text: '先来先服务（FCFS）', value: 'A' },
                        { text: '短作业优先（SJF）', value: 'B' },
                        { text: '时间片轮转（RR）', value: 'C' },
                        { text: '优先级调度', value: 'D' }
                    ],
                    correctAnswer: ['A', 'B', 'C', 'D'],
                    explanation: '这些都是常见的进程调度算法'
                }
            ]
        };
        
        return questionBank[courseId] || questionBank['gaodengshuxue'];
    }
    
    /**
     * 获取判断题题库
     */
    getJudgmentQuestions(courseId) {
        const questionBank = {
            'gaodengshuxue': [
                {
                    question: '连续函数一定可导。',
                    correctAnswer: 'F',
                    explanation: '连续函数不一定可导，如 f(x) = |x| 在 x = 0 处连续但不可导'
                },
                {
                    question: '可导函数一定连续。',
                    correctAnswer: 'T',
                    explanation: '这是微分学的基本定理：可导必连续'
                }
            ],
            'caozuoxitong': [
                {
                    question: '死锁的四个必要条件中，破坏任意一个都可以预防死锁。',
                    correctAnswer: 'T',
                    explanation: '死锁的四个必要条件：互斥、占有并等待、不可抢占、循环等待。破坏任意一个都可以预防死锁'
                }
            ]
        };
        
        return questionBank[courseId] || questionBank['gaodengshuxue'];
    }
    
    /**
     * 获取填空题题库
     */
    getFillBlankQuestions(courseId) {
        const questionBank = {
            'gaodengshuxue': [
                {
                    question: '函数 f(x) = x³ 的二阶导数是 ______',
                    options: [
                        { text: '3x', value: 'A' },
                        { text: '6x', value: 'B' },
                        { text: '3x²', value: 'C' },
                        { text: 'x²', value: 'D' }
                    ],
                    correctAnswer: ['B'],
                    explanation: 'f\'(x) = 3x²，f\'\'(x) = 6x'
                }
            ],
            'caozuoxitong': [
                {
                    question: '在分页存储管理中，逻辑地址到物理地址的转换是通过 ______ 实现的',
                    options: [
                        { text: '段表', value: 'A' },
                        { text: '页表', value: 'B' },
                        { text: '目录表', value: 'C' },
                        { text: '索引表', value: 'D' }
                    ],
                    correctAnswer: ['B'],
                    explanation: '分页存储管理通过页表实现逻辑地址到物理地址的转换'
                }
            ]
        };
        
        return questionBank[courseId] || questionBank['gaodengshuxue'];
    }
    
    /**
     * 显示测试界面
     */
    showTestInterface() {
        // 隐藏练习模式的导航按钮
        const practiceNavigation = document.getElementById('navigation-buttons');
        if (practiceNavigation) {
            practiceNavigation.style.display = 'none';
        }
        
        const container = document.getElementById('exercise-container');
        container.innerHTML = `
            <div class="simulate-test-container">
                <div class="test-header">
                    <div class="test-info">
                        <h3>模拟测试 - ${this.courseConfig.subject}</h3>
                        <div class="test-progress">
                            <span id="question-progress">题目: 0/0</span>
                            <span id="time-remaining" class="ms-3">剩余时间: ${this.timeLimit}:00</span>
                        </div>
                    </div>
                    <div class="test-actions">
                        <button class="btn btn-warning btn-sm" id="pause-test">暂停</button>
                        <button class="btn btn-danger btn-sm" id="end-test">结束测试</button>
                    </div>
                </div>
                <div id="test-question-container" class="mt-4">
                    <div class="text-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">正在生成题目...</span>
                        </div>
                        <p class="mt-2">正在生成测试题目，请稍候...</p>
                    </div>
                </div>
                <div class="test-navigation mt-4">
                    <button class="btn btn-secondary" id="prev-question" disabled>上一题</button>
                    <button class="btn btn-primary ms-2" id="next-question" disabled>下一题</button>
                    <button class="btn btn-success ms-2" id="submit-test" style="display: none;">提交测试</button>
                </div>
            </div>
        `;
        
        // 绑定事件
        this.bindTestEvents();
    }

    /**
     * 绑定测试界面事件
     */
    bindTestEvents() {
        // 暂停测试
        document.getElementById('pause-test')?.addEventListener('click', () => {
            this.pauseTest();
        });
        
        // 结束测试
        document.getElementById('end-test')?.addEventListener('click', () => {
            if (confirm('确定要结束测试吗？')) {
                this.endTest();
            }
        });
        
        // 上一题
        document.getElementById('prev-question')?.addEventListener('click', () => {
            this.showPreviousQuestion();
        });
        
        // 下一题
        document.getElementById('next-question')?.addEventListener('click', () => {
            this.showNextQuestion();
        });
        
        // 提交测试
        document.getElementById('submit-test')?.addEventListener('click', () => {
            if (confirm('确定要提交测试吗？提交后将无法修改答案。')) {
                this.endTest();
            }
        });
    }

    /**
     * 显示指定题目
     */
    showQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        this.currentQuestionIndex = index;
        const question = this.questions[index];
        
        // 更新进度
        document.getElementById('question-progress').textContent = 
            `题目: ${index + 1}/${this.questions.length}`;
        
        // 渲染题目
        const questionContainer = document.getElementById('test-question-container');
        questionContainer.innerHTML = `
            <div class="question-wrapper">
                <div class="question-header">
                    <h5>第 ${index + 1} 题</h5>
                </div>
                <div class="question-content">
                    <div class="question-text">${marked.parse(processLaTeX(question.question))}</div>
                    <div class="options-container">
                        ${this.renderOptions(question, index)}
                    </div>
                </div>
            </div>
        `;
        
        // 恢复之前的答案
        this.restoreAnswer(index);
        
        // 更新导航按钮
        this.updateNavigationButtons();
        
        // 绑定选项事件
        this.bindOptionEvents(index);
        
        // 渲染数学公式
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetClear();
            MathJax.typesetPromise();
        }
    }

    /**
     * 渲染选项
     */
    renderOptions(question, questionIndex) {
        const inputType = question.type === 'multiple' ? 'checkbox' : 'radio';
        const inputName = `test-question-${questionIndex}`;
        
        return question.options.map((option, optionIndex) => `
            <div class="form-check option-row" data-question="${questionIndex}" data-option="${optionIndex}">
                <input class="form-check-input" type="${inputType}" 
                       name="${inputName}" id="${inputName}-${optionIndex}" 
                       value="${option.value}">
                <label class="form-check-label" for="${inputName}-${optionIndex}">
                    ${marked.parse(processLaTeX(option.text))}
                </label>
            </div>
        `).join('');
    }

    /**
     * 绑定选项事件
     */
    bindOptionEvents(questionIndex) {
        const inputs = document.querySelectorAll(`input[name="test-question-${questionIndex}"]`);
        const optionRows = document.querySelectorAll(`.option-row[data-question="${questionIndex}"]`);
        
        // 绑定输入框变化事件
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveAnswer(questionIndex);
            });
        });
        
        // 绑定整行点击事件
        optionRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // 如果点击的是输入框本身，不需要额外处理
                if (e.target.type === 'radio' || e.target.type === 'checkbox') {
                    return;
                }
                
                const optionIndex = row.dataset.option;
                const input = row.querySelector(`input[name="test-question-${questionIndex}"]`);
                
                if (input) {
                    if (input.type === 'radio') {
                        // 单选：直接选中
                        input.checked = true;
                    } else if (input.type === 'checkbox') {
                        // 多选：切换状态
                        input.checked = !input.checked;
                    }
                    
                    // 触发change事件以保存答案
                    input.dispatchEvent(new Event('change'));
                }
            });
            
            // 添加鼠标悬停效果
            row.style.cursor = 'pointer';
        });
    }

    /**
     * 保存答案
     */
    saveAnswer(questionIndex) {
        const inputs = document.querySelectorAll(`input[name="test-question-${questionIndex}"]:checked`);
        const answer = Array.from(inputs).map(input => input.value);
        this.answers[questionIndex] = answer;
        
        // 启用下一题按钮（如果有答案选择）
        const nextBtn = document.getElementById('next-question');
        if (nextBtn && answer.length > 0) {
            nextBtn.disabled = false;
        }
    }

    /**
     * 恢复答案
     */
    restoreAnswer(questionIndex) {
        if (this.answers[questionIndex]) {
            const savedAnswer = this.answers[questionIndex];
            savedAnswer.forEach(value => {
                const input = document.querySelector(`input[name="test-question-${questionIndex}"][value="${value}"]`);
                if (input) {
                    input.checked = true;
                }
            });
        }
    }

    /**
     * 更新导航按钮
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-test');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }
        
        if (nextBtn && submitBtn) {
            const isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
            nextBtn.style.display = isLastQuestion ? 'none' : 'inline-block';
            submitBtn.style.display = isLastQuestion ? 'inline-block' : 'none';
            
            // 检查当前题目是否有答案，决定是否启用下一题按钮
            if (!isLastQuestion) {
                const hasAnswer = this.answers[this.currentQuestionIndex] && 
                                this.answers[this.currentQuestionIndex].length > 0;
                nextBtn.disabled = !hasAnswer;
            }
        }
    }

    /**
     * 显示上一题
     */
    showPreviousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    }

    /**
     * 显示下一题
     */
    showNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    }

    /**
     * 开始计时
     */
    startTimer() {
        this.timer = setInterval(() => {
            // 检查测试是否仍然活跃
            if (!this.isActive) {
                clearInterval(this.timer);
                this.timer = null;
                return;
            }
            
            const elapsed = Math.floor((new Date() - this.startTime) / 1000);
            const remaining = this.timeLimit * 60 - elapsed;
            
            if (remaining <= 0) {
                this.endTest();
                return;
            }
            
            // 检查DOM元素是否存在
            const timeElement = document.getElementById('time-remaining');
            if (!timeElement) {
                // DOM元素不存在，清理计时器
                clearInterval(this.timer);
                this.timer = null;
                return;
            }
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timeElement.textContent = 
                `剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // 时间不足时警告
            if (remaining <= 300) { // 5分钟
                timeElement.classList.add('text-danger');
            }
        }, 1000);
    }

    /**
     * 暂停测试
     */
    pauseTest() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        const modal = this.showPauseModal();
        modal.show();
    }

    /**
     * 显示暂停模态框
     */
    showPauseModal() {
        const modalHtml = `
            <div class="modal fade" id="pauseModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">测试已暂停</h5>
                        </div>
                        <div class="modal-body">
                            <p>测试已暂停，点击继续按钮恢复测试。</p>
                            <p class="text-muted">暂停期间计时器已停止。</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="resume-test">继续测试</button>
                            <button type="button" class="btn btn-danger" id="quit-test">退出测试</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('pauseModal');
        const modal = typeof bootstrap !== 'undefined' && bootstrap.Modal ? 
            new bootstrap.Modal(modalElement) : 
            { show: () => modalElement.style.display = 'block', hide: () => modalElement.remove() };
        
        // 绑定事件
        document.getElementById('resume-test').addEventListener('click', () => {
            modal.hide();
            this.startTimer();
        });
        
        document.getElementById('quit-test').addEventListener('click', () => {
            modal.hide();
            this.endTest();
        });
        
        return modal;
    }

    /**
     * 结束测试
     */
    endTest() {
        this.isActive = false;
        this.endTime = new Date();
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 恢复练习模式的导航按钮
        const exerciseNavigation = document.getElementById('navigation-buttons');
        if (exerciseNavigation) {
            exerciseNavigation.style.display = 'block';
        }
        
        // 计算成绩
        const result = this.calculateResult();
        
        // 显示结果
        this.showResult(result);
    }

    /**
     * 计算测试结果
     */
    calculateResult() {
        let correctCount = 0;
        const details = [];
        
        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index] || [];
            const correctAnswer = question.correctAnswer || [];
            
            const isCorrect = this.compareAnswers(userAnswer, correctAnswer);
            if (isCorrect) {
                correctCount++;
            }
            
            details.push({
                questionIndex: index,
                question: question.question,
                userAnswer,
                correctAnswer,
                isCorrect,
                explanation: question.explanation
            });
        });
        
        const score = Math.round((correctCount / this.questions.length) * 100);
        const duration = Math.floor((this.endTime - this.startTime) / 1000);
        
        return {
            score,
            correctCount,
            totalCount: this.questions.length,
            duration,
            details
        };
    }

    /**
     * 比较答案
     */
    compareAnswers(userAnswer, correctAnswer) {
        if (userAnswer.length !== correctAnswer.length) {
            return false;
        }
        
        const sortedUser = [...userAnswer].sort();
        const sortedCorrect = [...correctAnswer].sort();
        
        return sortedUser.every((answer, index) => answer === sortedCorrect[index]);
    }

    /**
     * 显示测试结果
     */
    showResult(result) {
        const container = document.getElementById('exercise-container');
        const minutes = Math.floor(result.duration / 60);
        const seconds = result.duration % 60;
        
        let gradeText = '';
        let gradeClass = '';
        if (result.score >= 90) {
            gradeText = '优秀';
            gradeClass = 'text-success';
        } else if (result.score >= 80) {
            gradeText = '良好';
            gradeClass = 'text-info';
        } else if (result.score >= 70) {
            gradeText = '中等';
            gradeClass = 'text-warning';
        } else if (result.score >= 60) {
            gradeText = '及格';
            gradeClass = 'text-secondary';
        } else {
            gradeText = '不及格';
            gradeClass = 'text-danger';
        }
        
        container.innerHTML = `
            <div class="test-result-container">
                <div class="result-header text-center">
                    <h3>测试完成</h3>
                    <div class="score-display">
                        <div class="score-circle ${gradeClass}">
                            <span class="score-number">${result.score}</span>
                            <span class="score-label">分</span>
                        </div>
                        <p class="grade ${gradeClass}">${gradeText}</p>
                    </div>
                </div>
                
                <div class="result-summary">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <h5>正确题数</h5>
                                <p class="stat-value">${result.correctCount}/${result.totalCount}</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <h5>用时</h5>
                                <p class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <h5>正确率</h5>
                                <p class="stat-value">${Math.round((result.correctCount / result.totalCount) * 100)}%</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <h5>平均用时</h5>
                                <p class="stat-value">${Math.round(result.duration / result.totalCount)}秒/题</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="result-actions text-center mt-4">
                    <button class="btn btn-primary me-2" id="view-details">查看详情</button>
                    <button class="btn btn-success me-2" id="restart-test">重新测试</button>
                    <button class="btn btn-secondary" id="back-to-practice">返回练习</button>
                </div>
                
                <div id="result-details" class="mt-4" style="display: none;">
                    ${this.renderResultDetails(result.details)}
                </div>
            </div>
        `;
        
        // 绑定结果页面事件
        this.bindResultEvents(result);
    }

    /**
     * 渲染结果详情
     */
    renderResultDetails(details) {
        return `
            <div class="result-details">
                <h4>答题详情</h4>
                ${details.map((detail, index) => `
                    <div class="detail-item ${detail.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="detail-header">
                            <span class="question-number">第 ${index + 1} 题</span>
                            <span class="result-icon">
                                ${detail.isCorrect ? '✓' : '✗'}
                            </span>
                        </div>
                        <div class="detail-content">
                            <div class="question-text">${marked.parse(processLaTeX(detail.question))}</div>
                            <p><strong>你的答案:</strong> ${detail.userAnswer.join(', ') || '未作答'}</p>
                            <p><strong>正确答案:</strong> ${detail.correctAnswer.join(', ')}</p>
                            ${detail.explanation ? `<div class="explanation"><strong>解析:</strong> ${marked.parse(processLaTeX(detail.explanation))}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 绑定结果页面事件
     */
    bindResultEvents(result) {
        // 查看详情
        document.getElementById('view-details')?.addEventListener('click', () => {
            const detailsDiv = document.getElementById('result-details');
            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
            
            // 如果显示详情，渲染数学公式
            if (detailsDiv.style.display === 'block' && window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetClear();
                MathJax.typesetPromise();
            }
        });
        
        // 重新测试
        document.getElementById('restart-test')?.addEventListener('click', () => {
            this.showTestSetup();
        });
        
        // 返回练习
        document.getElementById('back-to-practice')?.addEventListener('click', () => {
            location.reload();
        });
    }

    /**
     * 显示测试设置界面
     */
    showTestSetup() {
        const container = document.getElementById('exercise-container');
        container.innerHTML = `
            <div class="test-setup-container">
                <div class="setup-header text-center">
                    <h3>模拟测试设置</h3>
                    <p class="text-muted">请设置测试参数</p>
                </div>
                
                <div class="setup-form">
                    <div class="row justify-content-center">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="question-count" class="form-label">题目数量</label>
                                <select class="form-select" id="question-count">
                                    <option value="5">5题 (快速测试)</option>
                                    <option value="10" selected>10题 (标准测试)</option>
                                    <option value="15">15题 (深度测试)</option>
                                    <option value="20">20题 (完整测试)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="time-limit" class="form-label">时间限制</label>
                                <select class="form-select" id="time-limit">
                                    <option value="30">30分钟</option>
                                    <option value="45">45分钟</option>
                                    <option value="60" selected>60分钟</option>
                                    <option value="90">90分钟</option>
                                    <option value="120">120分钟</option>
                                </select>
                            </div>
                            
                            <div class="mb-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="random-order" checked>
                                    <label class="form-check-label" for="random-order">
                                        随机题目顺序
                                    </label>
                                </div>
                            </div>
                            
                            <div class="text-center">
                                <button class="btn btn-primary btn-lg" id="start-test">开始测试</button>
                                <button class="btn btn-secondary btn-lg ms-2" id="cancel-test">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定设置页面事件
        document.getElementById('start-test')?.addEventListener('click', () => {
            const questionCount = parseInt(document.getElementById('question-count').value);
            const timeLimit = parseInt(document.getElementById('time-limit').value);
            this.start(questionCount, timeLimit);
        });
        
        document.getElementById('cancel-test')?.addEventListener('click', () => {
            location.reload();
        });
    }
}

/**
 * 启动模拟测试
 * @param {string} courseId - 课程ID
 */
export function startSimulateTest(courseId) {
    const simulateTest = new SimulateTest(courseId);
    simulateTest.showTestSetup();
    return simulateTest;
}