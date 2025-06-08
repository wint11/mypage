/**
 * 教案生成模块
 */
class LessonPlanModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'lesson-plan';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        console.log('LessonPlanModule: 开始绑定事件');
        console.log('查找按钮: generate-lesson-plan', document.getElementById('generate-lesson-plan'));
        this.bindEventSafely('generate-lesson-plan', this.generateLessonPlan);
        this.bindEventSafely('export-lesson-plan', this.exportLessonPlan);
        this.bindEventSafely('edit-lesson-plan', this.editLessonPlan);
        console.log('LessonPlanModule: 事件绑定完成');
    }

    /**
     * 生成教案
     */
    async generateLessonPlan() {
        const topic = document.getElementById('lesson-topic').value.trim();
        const objectives = document.getElementById('lesson-objectives').value.trim();
        const keyPoints = document.getElementById('lesson-key-points').value.trim();
        const difficulties = document.getElementById('lesson-difficulties').value.trim();
        const materials = document.getElementById('lesson-materials').value.trim();
        const duration = document.getElementById('lesson-duration').value;
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!topic) {
            this.showAlert('请输入课程主题', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildLessonPlanPrompt({
                topic, objectives, keyPoints, difficulties, materials, duration, subject, grade
            });
            
            let lessonPlan;
            try {
                lessonPlan = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                lessonPlan = this.generateLocalLessonPlan({
                    topic, objectives, keyPoints, difficulties, materials, duration, subject, grade
                });
            }

            this.displayLessonPlan(lessonPlan);
        } catch (error) {
            console.error('教案生成失败:', error);
            this.showAlert('教案生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建教案生成提示词
     */
    buildLessonPlanPrompt(data) {
        return `请为以下课程生成详细的教案：

课程主题：${data.topic}
学科：${data.subject || '未指定'}
年级：${data.grade || '未指定'}
课时长度：${data.duration}分钟
教学目标：${data.objectives || '未指定'}
重点内容：${data.keyPoints || '未指定'}
难点内容：${data.difficulties || '未指定'}
教学材料：${data.materials || '未指定'}

请生成包含以下部分的完整教案：
1. 教学目标
2. 教学重点与难点
3. 教学准备
4. 教学过程（包括导入、新课讲授、练习巩固、课堂小结等环节）
5. 板书设计
6. 作业布置
7. 教学反思

请用Markdown格式输出，内容要详细具体。`;
    }

    /**
     * 生成本地教案模板
     */
    generateLocalLessonPlan(data) {
        return `# ${data.topic} 教案

## 基本信息
- **学科**: ${data.subject || '未指定'}
- **年级**: ${data.grade || '未指定'}
- **课时**: ${data.duration}分钟
- **授课教师**: [教师姓名]
- **授课时间**: [具体时间]

## 教学目标
${data.objectives || `
### 知识与技能
- 掌握${data.topic}的基本概念和原理
- 能够运用相关知识解决实际问题

### 过程与方法
- 通过观察、分析、讨论等方式理解${data.topic}
- 培养学生的逻辑思维和分析能力

### 情感态度与价值观
- 激发学生对学科的兴趣
- 培养学生的探究精神和合作意识`}

## 教学重点与难点
### 教学重点
${data.keyPoints || `- ${data.topic}的核心概念\n- 基本原理的理解和应用`}

### 教学难点
${data.difficulties || `- ${data.topic}的深层理解\n- 理论与实践的结合`}

## 教学准备
### 教师准备
- 多媒体课件
- 教学视频资料
- 相关案例材料

### 学生准备
${data.materials || `- 预习相关内容\n- 准备笔记本和文具`}

## 教学过程

### 一、导入新课（5分钟）
1. **复习回顾**
   - 回顾上节课的主要内容
   - 检查学生的预习情况

2. **情境导入**
   - 通过生活实例引入${data.topic}
   - 激发学生的学习兴趣

### 二、新课讲授（${Math.floor(data.duration * 0.6)}分钟）
1. **概念讲解**
   - 介绍${data.topic}的基本概念
   - 分析概念的内涵和外延

2. **原理阐述**
   - 详细讲解相关原理
   - 结合图表和实例说明

3. **方法指导**
   - 介绍解决问题的基本方法
   - 演示具体的操作步骤

### 三、练习巩固（${Math.floor(data.duration * 0.2)}分钟）
1. **课堂练习**
   - 设计针对性练习题
   - 学生独立完成基础练习

2. **小组讨论**
   - 分组讨论重难点问题
   - 各组汇报讨论结果

### 四、课堂小结（${Math.floor(data.duration * 0.1)}分钟）
1. **知识梳理**
   - 总结本节课的主要内容
   - 构建知识框架

2. **方法总结**
   - 归纳解题方法和技巧
   - 强调注意事项

## 板书设计
\`\`\`
${data.topic}

一、基本概念
   1. 定义
   2. 特点

二、主要原理
   1. 原理一
   2. 原理二

三、应用方法
   1. 步骤
   2. 注意事项
\`\`\`

## 作业布置
### 必做题
1. 完成教材第X页练习题1-5
2. 整理本节课的知识要点

### 选做题
1. 查阅相关资料，了解${data.topic}的发展历史
2. 思考${data.topic}在实际生活中的应用

## 教学反思
### 教学效果
- 学生对${data.topic}的理解程度
- 课堂参与度和积极性

### 改进建议
- 教学方法的优化
- 教学内容的调整
- 师生互动的改善

### 后续安排
- 下节课的教学重点
- 需要强化的知识点`;
    }

    /**
     * 显示教案
     */
    displayLessonPlan(lessonPlan) {
        const resultDiv = document.getElementById('lesson-plan-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(lessonPlan);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('lesson-plan-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出教案
     */
    exportLessonPlan() {
        const resultDiv = document.getElementById('lesson-plan-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成教案', 'warning');
            return;
        }

        const topic = document.getElementById('lesson-topic').value.trim() || '教案';
        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `${topic}_教案_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('教案导出成功', 'success');
    }

    /**
     * 编辑教案
     */
    editLessonPlan() {
        const resultDiv = document.getElementById('lesson-plan-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成教案', 'warning');
            return;
        }

        const content = resultDiv.textContent || resultDiv.innerText;
        this.createEditModal('编辑教案', content, (editedContent) => {
            resultDiv.innerHTML = this.markdownToHtml(editedContent);
            this.showAlert('教案编辑成功', 'success');
        });
    }

    /**
     * 创建编辑模态框
     */
    createEditModal(title, content, onSave) {
        const modalHtml = `
            <div class="modal fade" id="editModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <textarea class="form-control" id="editContent" rows="20">${content}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="saveEdit">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模态框
        const existingModal = document.getElementById('editModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();

        // 绑定保存事件
        document.getElementById('saveEdit').addEventListener('click', () => {
            const editedContent = document.getElementById('editContent').value;
            onSave(editedContent);
            modal.hide();
        });

        // 模态框关闭时移除DOM
        document.getElementById('editModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('editModal').remove();
        });
    }
}

// 导出教案生成模块
window.LessonPlanModule = LessonPlanModule;