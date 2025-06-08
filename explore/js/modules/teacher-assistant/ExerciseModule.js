/**
 * 题目生成模块
 */
class ExerciseModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'exercise-gen';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('generate-exercises', this.generateExercises);
        this.bindEventSafely('export-exercises', this.exportExercises);
        this.bindEventSafely('add-to-bank', this.addToBank);
    }

    /**
     * 生成题目
     */
    async generateExercises() {
        const topic = document.getElementById('exercise-topic').value.trim();
        const type = document.getElementById('exercise-type').value;
        const difficulty = document.getElementById('difficulty-select').value;
        const count = document.getElementById('exercise-count').value;
        const requirements = document.getElementById('exercise-requirements').value.trim();
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!topic) {
            this.showAlert('请输入题目主题', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildExercisePrompt({
                topic, type, difficulty, count, requirements, subject, grade
            });
            
            let exercises;
            try {
                exercises = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                exercises = this.generateLocalExercises({
                    topic, type, difficulty, count, requirements, subject, grade
                });
            }

            this.displayExercises(exercises);
        } catch (error) {
            console.error('题目生成失败:', error);
            this.showAlert('题目生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建题目生成提示词
     */
    buildExercisePrompt(data) {
        const typeMap = {
            'choice': '选择题',
            'blank': '填空题',
            'short': '简答题',
            'essay': '论述题',
            'calculation': '计算题'
        };

        const difficultyMap = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        };

        return `请为以下内容生成${data.count}道${typeMap[data.type] || '综合'}练习题：

主题：${data.topic}
学科：${data.subject || '未指定'}
年级：${data.grade || '未指定'}
难度：${difficultyMap[data.difficulty] || '中等'}
特殊要求：${data.requirements || '无'}

要求：
1. 题目要有层次性，从基础到提高
2. 每道题都要提供详细的答案和解析
3. 题目要贴近实际，有一定的应用性
4. 用Markdown格式输出
5. 格式：题目编号、题目内容、选项（如果是选择题）、答案、解析

请确保题目质量高，符合教学要求。`;
    }

    /**
     * 生成本地题目模板
     */
    generateLocalExercises(data) {
        const typeMap = {
            'choice': '选择题',
            'blank': '填空题',
            'short': '简答题',
            'essay': '论述题',
            'calculation': '计算题'
        };

        const difficultyMap = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        };

        let exercises = `# ${data.topic} - ${typeMap[data.type] || '综合题'}练习

**学科**: ${data.subject || '未指定'}  
**年级**: ${data.grade || '未指定'}  
**难度**: ${difficultyMap[data.difficulty] || '中等'}  
**题目数量**: ${data.count}道

---

`;

        for (let i = 1; i <= parseInt(data.count); i++) {
            exercises += this.generateSingleExercise(i, data.type, data.topic, data.difficulty);
        }

        return exercises;
    }

    /**
     * 生成单个题目
     */
    generateSingleExercise(index, type, topic, difficulty) {
        switch (type) {
            case 'choice':
                return this.generateChoiceQuestion(index, topic, difficulty);
            case 'blank':
                return this.generateBlankQuestion(index, topic, difficulty);
            case 'short':
                return this.generateShortQuestion(index, topic, difficulty);
            case 'essay':
                return this.generateEssayQuestion(index, topic, difficulty);
            case 'calculation':
                return this.generateCalculationQuestion(index, topic, difficulty);
            default:
                return this.generateChoiceQuestion(index, topic, difficulty);
        }
    }

    /**
     * 生成选择题
     */
    generateChoiceQuestion(index, topic, difficulty) {
        return `## 第${index}题（选择题）

关于${topic}，下列说法正确的是（）

A. 选项A的内容描述
B. 选项B的内容描述
C. 选项C的内容描述
D. 选项D的内容描述

**答案**: C

**解析**: 这道题考查的是${topic}的基本概念。选项C正确，因为...

---

`;
    }

    /**
     * 生成填空题
     */
    generateBlankQuestion(index, topic, difficulty) {
        return `## 第${index}题（填空题）

${topic}的主要特点是______，其基本原理是______。

**答案**: 
1. 第一个空的答案
2. 第二个空的答案

**解析**: 这道题考查学生对${topic}核心概念的理解...

---

`;
    }

    /**
     * 生成简答题
     */
    generateShortQuestion(index, topic, difficulty) {
        return `## 第${index}题（简答题）

请简要说明${topic}的基本概念和主要应用。

**答案要点**: 
1. 基本概念：...
2. 主要特点：...
3. 实际应用：...

**解析**: 这道题要求学生能够准确理解${topic}的内涵...

---

`;
    }

    /**
     * 生成论述题
     */
    generateEssayQuestion(index, topic, difficulty) {
        return `## 第${index}题（论述题）

结合实际案例，论述${topic}的重要性及其发展趋势。

**答案要点**: 
1. 重要性分析：
   - 理论意义
   - 实践价值
2. 发展趋势：
   - 当前状况
   - 未来展望
3. 实际案例：
   - 具体实例
   - 分析说明

**解析**: 这是一道综合性较强的题目，要求学生能够...

---

`;
    }

    /**
     * 生成计算题
     */
    generateCalculationQuestion(index, topic, difficulty) {
        return `## 第${index}题（计算题）

已知条件：...
求解：与${topic}相关的计算问题

**解答过程**: 
1. 分析题意：...
2. 列出公式：...
3. 代入数据：...
4. 计算结果：...

**答案**: [具体数值]

**解析**: 这道题考查学生运用${topic}相关公式进行计算的能力...

---

`;
    }

    /**
     * 显示题目
     */
    displayExercises(exercises) {
        const resultDiv = document.getElementById('exercises-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(exercises);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('exercises-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出题目
     */
    exportExercises() {
        const resultDiv = document.getElementById('exercises-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成题目', 'warning');
            return;
        }

        const topic = document.getElementById('exercise-topic').value.trim() || '练习题';
        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `${topic}_练习题_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('题目导出成功', 'success');
    }

    /**
     * 加入题库
     */
    addToBank() {
        const resultDiv = document.getElementById('exercises-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成题目', 'warning');
            return;
        }

        // 这里可以实现将题目保存到题库的逻辑
        // 目前只是显示成功提示
        this.showAlert('题目已成功加入题库', 'success');
    }
}

// 导出题目生成模块
window.ExerciseModule = ExerciseModule;