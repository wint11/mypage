/**
 * 视频生成模块
 */
class VideoModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'video-gen';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('generate-video', this.generateVideo);
        this.bindEventSafely('export-video-script', this.exportVideoScript);
    }

    /**
     * 生成教学视频脚本
     */
    async generateVideo() {
        const topic = document.getElementById('video-topic').value.trim();
        const duration = document.getElementById('video-duration').value;
        const style = document.getElementById('video-style').value;
        const audience = document.getElementById('video-audience').value.trim();
        const objectives = document.getElementById('video-objectives').value.trim();
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!topic) {
            this.showAlert('请输入视频主题', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildVideoPrompt({
                topic, duration, style, audience, objectives, subject, grade
            });
            
            let videoScript;
            try {
                videoScript = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                videoScript = this.generateLocalVideo({
                    topic, duration, style, audience, objectives, subject, grade
                });
            }

            this.displayVideo(videoScript);
        } catch (error) {
            console.error('视频脚本生成失败:', error);
            this.showAlert('视频脚本生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建视频生成提示词
     */
    buildVideoPrompt(data) {
        const styleMap = {
            'lecture': '讲座式',
            'interactive': '互动式',
            'animation': '动画式',
            'demonstration': '演示式'
        };

        return `请为以下内容设计一个完整的教学视频脚本：

主题：${data.topic}
视频时长：${data.duration}分钟
视频风格：${styleMap[data.style] || '讲座式'}
目标受众：${data.audience || '学生'}
教学目标：${data.objectives || '未指定'}
学科：${data.subject || '未指定'}
年级：${data.grade || '未指定'}

要求：
1. 设计完整的视频结构，包括开场、正文、总结等
2. 每个时间段要有明确的内容安排
3. 包含详细的解说词
4. 标注需要的视觉元素（图片、动画、图表等）
5. 设计互动环节和提问时机
6. 考虑数字人的表情和动作建议
7. 用Markdown格式输出
8. 包含时间轴和分镜头脚本

请确保视频内容生动有趣，适合在线教学使用。`;
    }

    /**
     * 生成本地视频模板
     */
    generateLocalVideo(data) {
        const styleMap = {
            'lecture': '讲座式',
            'interactive': '互动式',
            'animation': '动画式',
            'demonstration': '演示式'
        };

        const duration = parseInt(data.duration);
        const segments = this.calculateVideoSegments(duration);

        return `# ${data.topic} - 教学视频制作脚本

## 视频基本信息
- **主题**: ${data.topic}
- **时长**: ${data.duration}分钟
- **风格**: ${styleMap[data.style] || '讲座式'}
- **目标受众**: ${data.audience || '学生'}
- **学科**: ${data.subject || '未指定'}
- **年级**: ${data.grade || '未指定'}
- **制作日期**: ${new Date().toLocaleDateString()}

## 教学目标
${data.objectives || `- 掌握${data.topic}的基本概念和原理\n- 理解相关知识点的应用方法\n- 培养学生的分析和思考能力\n- 激发学生的学习兴趣`}

---

## 视频结构时间轴

| 时间段 | 内容模块 | 主要内容 | 时长 |
|--------|----------|----------|------|
| 00:00-${this.formatTime(segments.intro)} | 开场介绍 | 问候、主题介绍、学习目标 | ${segments.intro}分钟 |
| ${this.formatTime(segments.intro)}-${this.formatTime(segments.intro + segments.review)} | 知识回顾 | 相关基础知识回顾 | ${segments.review}分钟 |
| ${this.formatTime(segments.intro + segments.review)}-${this.formatTime(segments.intro + segments.review + segments.main)} | 核心内容 | 主要知识点讲解 | ${segments.main}分钟 |
| ${this.formatTime(segments.intro + segments.review + segments.main)}-${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)} | 实例演示 | 例题讲解和练习 | ${segments.practice}分钟 |
| ${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)}-${this.formatTime(duration)} | 总结回顾 | 知识总结和作业布置 | ${segments.summary}分钟 |

---

## 详细分镜头脚本

### 第一段：开场介绍 (00:00-${this.formatTime(segments.intro)})

**镜头1**: 数字人正面特写
- **时间**: 00:00-00:30
- **数字人动作**: 微笑点头，友好手势
- **解说词**: 
  "同学们好！欢迎来到今天的课程。我是你们的AI老师，今天我们要一起学习${data.topic}。这是一个非常有趣且重要的知识点，相信通过今天的学习，大家会有很大的收获。"
- **视觉元素**: 
  - 背景：简洁的教室场景
  - 文字：课程标题"${data.topic}"
  - 音效：轻松的背景音乐

**镜头2**: 学习目标展示
- **时间**: 00:30-${this.formatTime(segments.intro)}
- **数字人动作**: 指向屏幕，解释手势
- **解说词**: 
  "首先，让我们来看看今天的学习目标。通过本节课的学习，我们要达到以下几个目标..."
- **视觉元素**: 
  - 学习目标列表动画展示
  - 重点词汇高亮
  - 图标配合说明

---

### 第二段：知识回顾 (${this.formatTime(segments.intro)}-${this.formatTime(segments.intro + segments.review)})

**镜头3**: 知识回顾
- **时间**: ${this.formatTime(segments.intro)}-${this.formatTime(segments.intro + segments.review)}
- **数字人动作**: 思考手势，回忆表情
- **解说词**: 
  "在学习新知识之前，我们先来回顾一下相关的基础知识。还记得我们之前学过的...吗？这些知识与今天要学的${data.topic}有着密切的联系。"
- **视觉元素**: 
  - 思维导图展示
  - 知识点连线动画
  - 复习要点提示

---

### 第三段：核心内容讲解 (${this.formatTime(segments.intro + segments.review)}-${this.formatTime(segments.intro + segments.review + segments.main)})

**镜头4**: 概念介绍
- **时间**: ${this.formatTime(segments.intro + segments.review)}-${this.formatTime(segments.intro + segments.review + Math.floor(segments.main/3))}
- **数字人动作**: 解释手势，强调表情
- **解说词**: 
  "现在我们来学习${data.topic}的基本概念。${data.topic}是指...它的主要特点包括..."
- **视觉元素**: 
  - 概念定义文字展示
  - 关键词高亮动画
  - 相关图片或图表

**镜头5**: 原理解析
- **时间**: ${this.formatTime(segments.intro + segments.review + Math.floor(segments.main/3))}-${this.formatTime(segments.intro + segments.review + Math.floor(segments.main*2/3))}
- **数字人动作**: 分析手势，逐步解释
- **解说词**: 
  "接下来我们深入了解${data.topic}的基本原理。首先...然后...最后..."
- **视觉元素**: 
  - 原理图解动画
  - 步骤分解展示
  - 流程图或示意图

**镜头6**: 应用说明
- **时间**: ${this.formatTime(segments.intro + segments.review + Math.floor(segments.main*2/3))}-${this.formatTime(segments.intro + segments.review + segments.main)}
- **数字人动作**: 举例手势，应用说明
- **解说词**: 
  "${data.topic}在实际生活中有很多应用。比如...这些应用帮助我们..."
- **视觉元素**: 
  - 实际应用案例
  - 生活场景图片
  - 应用效果展示

---

### 第四段：实例演示 (${this.formatTime(segments.intro + segments.review + segments.main)}-${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)})

**镜头7**: 例题讲解
- **时间**: ${this.formatTime(segments.intro + segments.review + segments.main)}-${this.formatTime(segments.intro + segments.review + segments.main + Math.floor(segments.practice/2))}
- **数字人动作**: 解题手势，步骤说明
- **解说词**: 
  "现在我们通过一个具体的例子来加深理解。请看这道题目...我们应该这样分析..."
- **视觉元素**: 
  - 题目文字展示
  - 解题步骤动画
  - 关键步骤标注

**镜头8**: 互动练习
- **时间**: ${this.formatTime(segments.intro + segments.review + segments.main + Math.floor(segments.practice/2))}-${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)}
- **数字人动作**: 鼓励手势，等待表情
- **解说词**: 
  "现在轮到你们来试试了！请暂停视频，思考一下这个问题...准备好了吗？我们来看看答案。"
- **视觉元素**: 
  - 练习题目展示
  - 思考时间倒计时
  - 答案揭示动画

---

### 第五段：总结回顾 (${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)}-${this.formatTime(duration)})

**镜头9**: 知识总结
- **时间**: ${this.formatTime(segments.intro + segments.review + segments.main + segments.practice)}-${this.formatTime(duration - 1)}
- **数字人动作**: 总结手势，回顾表情
- **解说词**: 
  "让我们来总结一下今天学到的内容。${data.topic}的要点包括...希望大家能够牢记这些知识点。"
- **视觉元素**: 
  - 知识点总结图表
  - 重点内容回顾
  - 知识框架展示

**镜头10**: 结束语
- **时间**: ${this.formatTime(duration - 1)}-${this.formatTime(duration)}
- **数字人动作**: 告别手势，鼓励表情
- **解说词**: 
  "今天的课程就到这里。记得完成课后作业，有问题随时可以重复观看视频。下节课我们将学习...期待与大家再次见面！"
- **视觉元素**: 
  - 作业提醒
  - 下节课预告
  - 结束画面

---

## 技术制作要求

### 数字人设置
- **形象**: 专业教师形象，亲和力强
- **服装**: 正式但不失亲切的教师装扮
- **表情**: 丰富的面部表情，配合教学内容
- **手势**: 自然的教学手势，增强表达效果

### 视觉设计
- **背景**: 简洁的虚拟教室或学习环境
- **色彩**: 以蓝色、绿色等学习友好色调为主
- **字体**: 清晰易读的字体，适当大小
- **动画**: 流畅的转场和内容展示动画

### 音频要求
- **语速**: 适中，便于理解
- **音质**: 清晰无杂音
- **背景音乐**: 轻柔的学习氛围音乐
- **音效**: 适当的提示音效

### 互动设计
- **暂停提示**: 在需要思考的地方提示暂停
- **重点标注**: 重要内容的视觉强调
- **进度提示**: 学习进度的可视化显示

## 后期制作建议

1. **剪辑要点**
   - 保持节奏感，避免拖沓
   - 合理使用特效和转场
   - 确保音画同步

2. **质量控制**
   - 多次审核内容准确性
   - 检查技术质量
   - 测试用户体验

3. **优化建议**
   - 根据反馈调整内容
   - 优化视觉效果
   - 完善互动设计`;
    }

    /**
     * 计算视频各段时长
     */
    calculateVideoSegments(totalDuration) {
        return {
            intro: Math.max(1, Math.floor(totalDuration * 0.1)),
            review: Math.max(1, Math.floor(totalDuration * 0.15)),
            main: Math.max(2, Math.floor(totalDuration * 0.5)),
            practice: Math.max(1, Math.floor(totalDuration * 0.15)),
            summary: Math.max(1, Math.floor(totalDuration * 0.1))
        };
    }

    /**
     * 格式化时间显示
     */
    formatTime(minutes) {
        const mins = Math.floor(minutes);
        const secs = Math.floor((minutes - mins) * 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 显示视频脚本
     */
    displayVideo(videoScript) {
        const resultDiv = document.getElementById('video-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(videoScript);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('video-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出视频脚本
     */
    exportVideoScript() {
        const resultDiv = document.getElementById('video-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成视频脚本', 'warning');
            return;
        }

        const topic = document.getElementById('video-topic').value.trim() || '教学视频';
        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `${topic}_视频脚本_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('视频脚本导出成功', 'success');
    }
}

// 导出视频生成模块
window.VideoModule = VideoModule;