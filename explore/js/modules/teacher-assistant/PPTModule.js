/**
 * PPT生成模块
 */
class PPTModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'ppt-gen';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('generate-ppt', this.generatePPT);
        this.bindEventSafely('export-ppt', this.exportPPT);
    }

    /**
     * 生成PPT大纲
     */
    async generatePPT() {
        const topic = document.getElementById('ppt-topic').value.trim();
        const audience = document.getElementById('ppt-audience').value.trim();
        const duration = document.getElementById('ppt-duration').value;
        const style = document.getElementById('ppt-style').value;
        const objectives = document.getElementById('ppt-objectives').value.trim();
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!topic) {
            this.showAlert('请输入PPT主题', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildPPTPrompt({
                topic, audience, duration, style, objectives, subject, grade
            });
            
            let pptOutline;
            try {
                pptOutline = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                pptOutline = this.generateLocalPPT({
                    topic, audience, duration, style, objectives, subject, grade
                });
            }

            this.displayPPT(pptOutline);
        } catch (error) {
            console.error('PPT生成失败:', error);
            this.showAlert('PPT生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建PPT生成提示词
     */
    buildPPTPrompt(data) {
        const styleMap = {
            'simple': '简洁风格',
            'business': '商务风格',
            'academic': '学术风格',
            'creative': '创意风格'
        };

        return `请为以下内容设计一个完整的PPT大纲和内容：

主题：${data.topic}
目标受众：${data.audience || '学生'}
演讲时长：${data.duration}分钟
设计风格：${styleMap[data.style] || '简洁风格'}
教学目标：${data.objectives || '未指定'}
学科：${data.subject || '未指定'}
年级：${data.grade || '未指定'}

要求：
1. 设计合理的PPT结构，包括封面、目录、正文、总结等
2. 每页PPT要有明确的标题和要点
3. 内容要层次分明，逻辑清晰
4. 适合${data.duration}分钟的演讲时长
5. 包含适当的互动环节
6. 提供每页的设计建议（颜色、字体、图片等）
7. 用Markdown格式输出

请确保PPT内容丰富，适合教学使用。`;
    }

    /**
     * 生成本地PPT模板
     */
    generateLocalPPT(data) {
        const styleMap = {
            'simple': '简洁风格',
            'business': '商务风格',
            'academic': '学术风格',
            'creative': '创意风格'
        };

        const slideCount = Math.max(8, Math.floor(parseInt(data.duration) / 3)); // 大约每3分钟一页

        return `# ${data.topic} - 教学PPT设计方案

## 基本信息
- **主题**: ${data.topic}
- **目标受众**: ${data.audience || '学生'}
- **演讲时长**: ${data.duration}分钟
- **设计风格**: ${styleMap[data.style] || '简洁风格'}
- **预计页数**: ${slideCount}页
- **学科**: ${data.subject || '未指定'}
- **年级**: ${data.grade || '未指定'}

---

## PPT结构大纲

### 第1页：封面页
**标题**: ${data.topic}
**内容要点**:
- 课程名称
- 授课教师
- 授课时间
- 学校/班级信息

**设计建议**:
- 使用主题色彩
- 简洁大方的字体
- 可添加相关背景图片

---

### 第2页：课程目录
**标题**: 本节课内容
**内容要点**:
- 学习目标
- 主要内容
- 重点难点
- 课堂安排

**设计建议**:
- 使用项目符号
- 清晰的层次结构
- 适当的间距

---

### 第3页：学习目标
**标题**: 学习目标
**内容要点**:
${data.objectives || `- 掌握${data.topic}的基本概念\n- 理解相关原理和方法\n- 能够运用知识解决实际问题\n- 培养分析和思考能力`}

**设计建议**:
- 使用醒目的图标
- 分点列出，便于理解
- 可使用不同颜色区分

---

### 第4页：知识回顾
**标题**: 知识回顾
**内容要点**:
- 回顾相关基础知识
- 与本节课的联系
- 为新知识做铺垫

**设计建议**:
- 使用思维导图形式
- 突出关键概念
- 建立知识联系

---

### 第5页：核心概念
**标题**: ${data.topic} - 核心概念
**内容要点**:
- 基本定义
- 主要特征
- 重要性质
- 应用范围

**设计建议**:
- 使用图表说明
- 重点内容高亮
- 配合实例说明

---

### 第6页：原理解析
**标题**: 原理解析
**内容要点**:
- 基本原理阐述
- 推导过程
- 关键步骤说明
- 注意事项

**设计建议**:
- 分步骤展示
- 使用动画效果
- 配合图示说明

---

### 第7页：实例分析
**标题**: 实例分析
**内容要点**:
- 典型例题
- 解题思路
- 方法技巧
- 常见错误

**设计建议**:
- 步骤清晰明了
- 重点标记
- 对比展示

---

### 第8页：课堂练习
**标题**: 课堂练习
**内容要点**:
- 基础练习题
- 提高练习题
- 小组讨论
- 互动环节

**设计建议**:
- 题目分层次
- 留出思考时间
- 鼓励参与

---

${slideCount > 8 ? this.generateAdditionalSlides(slideCount - 8, data.topic) : ''}

### 第${slideCount - 1}页：课堂小结
**标题**: 课堂小结
**内容要点**:
- 知识要点回顾
- 方法技巧总结
- 重难点强调
- 知识体系构建

**设计建议**:
- 使用思维导图
- 突出重点
- 系统性总结

---

### 第${slideCount}页：作业布置
**标题**: 课后作业
**内容要点**:
- 必做作业
- 选做作业
- 预习要求
- 思考题

**设计建议**:
- 分类清晰
- 难度适中
- 时间安排合理

---

## 设计规范

### 色彩搭配
- **主色调**: 根据学科特点选择（如数学用蓝色，语文用绿色）
- **辅助色**: 与主色调协调的颜色
- **强调色**: 用于突出重点内容

### 字体规范
- **标题字体**: 微软雅黑，24-32pt
- **正文字体**: 微软雅黑，18-22pt
- **注释字体**: 微软雅黑，14-16pt

### 布局原则
- 保持页面简洁
- 合理使用留白
- 内容层次分明
- 视觉重点突出

### 动画建议
- 适度使用动画效果
- 避免过于花哨
- 服务于内容展示
- 控制动画时间

## 互动环节设计

1. **提问互动**: 在关键知识点后设置问题
2. **小组讨论**: 安排2-3次小组讨论
3. **实时反馈**: 使用投票或举手等方式
4. **案例分析**: 结合实际案例进行分析

## 时间分配建议

- **导入**: ${Math.floor(parseInt(data.duration) * 0.1)}分钟
- **新课**: ${Math.floor(parseInt(data.duration) * 0.6)}分钟
- **练习**: ${Math.floor(parseInt(data.duration) * 0.2)}分钟
- **总结**: ${Math.floor(parseInt(data.duration) * 0.1)}分钟`;
    }

    /**
     * 生成额外的幻灯片
     */
    generateAdditionalSlides(count, topic) {
        let slides = '';
        for (let i = 1; i <= count; i++) {
            const slideNum = 8 + i;
            slides += `### 第${slideNum}页：拓展内容${i}
**标题**: ${topic} - 深入探讨
**内容要点**:
- 相关拓展知识
- 实际应用案例
- 前沿发展动态
- 思考与讨论

**设计建议**:
- 内容丰富有趣
- 激发学习兴趣
- 培养探究精神

---

`;
        }
        return slides;
    }

    /**
     * 显示PPT内容
     */
    displayPPT(pptContent) {
        const resultDiv = document.getElementById('ppt-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(pptContent);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('ppt-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出PPT大纲
     */
    exportPPT() {
        const resultDiv = document.getElementById('ppt-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成PPT大纲', 'warning');
            return;
        }

        const topic = document.getElementById('ppt-topic').value.trim() || 'PPT大纲';
        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `${topic}_PPT大纲_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('PPT大纲导出成功', 'success');
    }
}

// 导出PPT生成模块
window.PPTModule = PPTModule;