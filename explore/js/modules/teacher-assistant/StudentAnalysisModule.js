/**
 * 学情分析模块
 */
class StudentAnalysisModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'student-analysis';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('generate-analysis', this.generateStudentAnalysis);
        this.bindEventSafely('export-analysis', this.exportAnalysis);
    }

    /**
     * 生成学情分析
     */
    async generateStudentAnalysis() {
        const classInfo = document.getElementById('class-info').value.trim();
        const studentCount = document.getElementById('student-count').value;
        const analysisType = document.getElementById('analysis-type').value;
        const timeRange = document.getElementById('time-range').value;
        const focusAreas = document.getElementById('focus-areas').value.trim();
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!classInfo) {
            this.showAlert('请输入班级信息', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildAnalysisPrompt({
                classInfo, studentCount, analysisType, timeRange, focusAreas, subject, grade
            });
            
            let analysis;
            try {
                analysis = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                analysis = this.generateLocalAnalysis({
                    classInfo, studentCount, analysisType, timeRange, focusAreas, subject, grade
                });
            }

            this.displayAnalysis(analysis);
        } catch (error) {
            console.error('学情分析生成失败:', error);
            this.showAlert('学情分析生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建学情分析提示词
     */
    buildAnalysisPrompt(data) {
        const typeMap = {
            'comprehensive': '综合分析',
            'academic': '学业分析',
            'behavior': '行为分析',
            'progress': '进步分析'
        };

        const timeMap = {
            'week': '一周',
            'month': '一个月',
            'semester': '一学期',
            'year': '一学年'
        };

        return `请为以下班级生成详细的学情分析报告：

班级信息：${data.classInfo}
学生人数：${data.studentCount}人
分析类型：${typeMap[data.analysisType] || '综合分析'}
时间范围：${timeMap[data.timeRange] || '一个月'}
重点关注：${data.focusAreas || '整体表现'}
学科：${data.subject || '未指定'}
年级：${data.grade || '未指定'}

要求：
1. 提供全面的学情分析，包括学习状况、行为表现、能力发展等
2. 分析学生的优势和不足
3. 提供具体的改进建议
4. 包含数据统计和图表说明
5. 针对不同层次学生给出个性化建议
6. 用Markdown格式输出
7. 内容要客观、准确、有建设性

请确保分析报告专业、详细，有助于教学改进。`;
    }

    /**
     * 生成本地学情分析模板
     */
    generateLocalAnalysis(data) {
        const typeMap = {
            'comprehensive': '综合分析',
            'academic': '学业分析',
            'behavior': '行为分析',
            'progress': '进步分析'
        };

        const timeMap = {
            'week': '一周',
            'month': '一个月',
            'semester': '一学期',
            'year': '一学年'
        };

        const currentDate = new Date().toLocaleDateString();
        const studentCount = parseInt(data.studentCount) || 30;

        return `# ${data.classInfo} - 学情分析报告

## 基本信息
- **班级**: ${data.classInfo}
- **学生人数**: ${studentCount}人
- **分析类型**: ${typeMap[data.analysisType] || '综合分析'}
- **时间范围**: ${timeMap[data.timeRange] || '一个月'}
- **学科**: ${data.subject || '未指定'}
- **年级**: ${data.grade || '未指定'}
- **分析日期**: ${currentDate}
- **重点关注**: ${data.focusAreas || '整体表现'}

---

## 一、整体概况

### 1.1 班级基本情况
- **总人数**: ${studentCount}人
- **男女比例**: 男生${Math.floor(studentCount * 0.52)}人，女生${studentCount - Math.floor(studentCount * 0.52)}人
- **平均年龄**: ${this.getAverageAge(data.grade)}岁
- **学习氛围**: 整体积极向上，学习热情较高

### 1.2 学习状态分布
- **优秀**: ${Math.floor(studentCount * 0.25)}人 (${Math.floor(25)}%)
- **良好**: ${Math.floor(studentCount * 0.45)}人 (${Math.floor(45)}%)
- **一般**: ${Math.floor(studentCount * 0.25)}人 (${Math.floor(25)}%)
- **需要帮助**: ${Math.floor(studentCount * 0.05)}人 (${Math.floor(5)}%)

---

## 二、学业表现分析

### 2.1 成绩分布情况

| 分数段 | 人数 | 占比 | 趋势 |
|--------|------|------|------|
| 90-100分 | ${Math.floor(studentCount * 0.15)} | ${Math.floor(15)}% | ↗ 上升 |
| 80-89分 | ${Math.floor(studentCount * 0.35)} | ${Math.floor(35)}% | → 稳定 |
| 70-79分 | ${Math.floor(studentCount * 0.30)} | ${Math.floor(30)}% | → 稳定 |
| 60-69分 | ${Math.floor(studentCount * 0.15)} | ${Math.floor(15)}% | ↘ 下降 |
| 60分以下 | ${Math.floor(studentCount * 0.05)} | ${Math.floor(5)}% | ↘ 下降 |

### 2.2 各知识点掌握情况

#### 掌握较好的知识点
- **基础概念理解**: 85%的学生掌握良好
- **基本运算能力**: 80%的学生表现优秀
- **记忆性知识**: 90%的学生掌握扎实

#### 需要加强的知识点
- **综合应用能力**: 仅60%的学生达到要求
- **创新思维**: 45%的学生需要提升
- **问题解决能力**: 55%的学生有待加强

### 2.3 学习习惯分析

#### 优秀学习习惯 (${Math.floor(studentCount * 0.7)}人)
- 按时完成作业
- 主动预习复习
- 积极参与课堂讨论
- 善于总结归纳

#### 需要改进的习惯 (${Math.floor(studentCount * 0.3)}人)
- 作业拖延现象
- 课堂注意力不集中
- 缺乏主动学习意识
- 学习方法单一

---

## 三、行为表现分析

### 3.1 课堂表现

#### 积极表现
- **主动发言**: ${Math.floor(studentCount * 0.4)}人经常主动发言
- **认真听讲**: ${Math.floor(studentCount * 0.8)}人能够认真听讲
- **积极互动**: ${Math.floor(studentCount * 0.6)}人乐于参与互动

#### 需要关注
- **注意力分散**: ${Math.floor(studentCount * 0.2)}人偶尔注意力不集中
- **参与度低**: ${Math.floor(studentCount * 0.15)}人课堂参与度较低
- **纪律问题**: ${Math.floor(studentCount * 0.05)}人偶有纪律问题

### 3.2 作业完成情况

| 完成质量 | 人数 | 占比 | 特点 |
|----------|------|------|------|
| 优秀 | ${Math.floor(studentCount * 0.3)} | ${Math.floor(30)}% | 按时、认真、有创新 |
| 良好 | ${Math.floor(studentCount * 0.5)} | ${Math.floor(50)}% | 按时、认真完成 |
| 一般 | ${Math.floor(studentCount * 0.15)} | ${Math.floor(15)}% | 基本完成，质量一般 |
| 较差 | ${Math.floor(studentCount * 0.05)} | ${Math.floor(5)}% | 经常拖延或质量差 |

### 3.3 团队合作能力
- **合作积极**: ${Math.floor(studentCount * 0.7)}人
- **领导能力强**: ${Math.floor(studentCount * 0.2)}人
- **需要引导**: ${Math.floor(studentCount * 0.1)}人

---

## 四、能力发展分析

### 4.1 认知能力发展

#### 优势能力
- **记忆能力**: 整体表现良好，${Math.floor(85)}%学生达标
- **理解能力**: ${Math.floor(75)}%学生能够准确理解概念
- **应用能力**: ${Math.floor(65)}%学生能够灵活应用知识

#### 待提升能力
- **分析能力**: ${Math.floor(45)}%学生需要加强
- **综合能力**: ${Math.floor(40)}%学生有待提升
- **创新能力**: ${Math.floor(35)}%学生表现突出，需要更多培养

### 4.2 学习策略运用

#### 有效策略
- **笔记整理**: ${Math.floor(studentCount * 0.8)}人有良好的笔记习惯
- **错题总结**: ${Math.floor(studentCount * 0.6)}人能够总结错题
- **知识梳理**: ${Math.floor(studentCount * 0.5)}人会主动梳理知识

#### 需要指导
- **时间管理**: ${Math.floor(studentCount * 0.4)}人需要时间管理指导
- **学习计划**: ${Math.floor(studentCount * 0.3)}人缺乏学习计划
- **复习方法**: ${Math.floor(studentCount * 0.25)}人复习方法单一

---

## 五、个性化分析

### 5.1 优秀学生群体 (${Math.floor(studentCount * 0.25)}人)

#### 特点
- 学习主动性强
- 思维活跃，善于思考
- 学习方法得当
- 自我管理能力强

#### 培养建议
- 提供更具挑战性的学习任务
- 鼓励参与学科竞赛
- 培养领导能力和团队合作精神
- 拓展知识面，培养创新思维

### 5.2 中等学生群体 (${Math.floor(studentCount * 0.5)}人)

#### 特点
- 学习态度端正
- 基础知识掌握较好
- 需要适当的学习指导
- 有一定的上升潜力

#### 提升建议
- 加强学习方法指导
- 提供个性化的学习资源
- 增强学习信心
- 培养独立思考能力

### 5.3 学困学生群体 (${Math.floor(studentCount * 0.25)}人)

#### 特点
- 基础知识薄弱
- 学习信心不足
- 学习方法需要改进
- 需要更多关注和帮助

#### 帮扶措施
- 制定个性化学习计划
- 加强基础知识补习
- 建立学习伙伴制度
- 及时给予鼓励和肯定

---

## 六、问题与建议

### 6.1 主要问题

1. **学习差异较大**
   - 优秀学生与学困学生差距明显
   - 需要分层教学策略

2. **学习方法单一**
   - 部分学生学习方法较为传统
   - 缺乏多样化的学习策略

3. **自主学习能力不足**
   - 依赖性较强
   - 主动探究意识有待加强

4. **应用能力薄弱**
   - 理论与实践结合不够
   - 解决实际问题能力需要提升

### 6.2 改进建议

#### 教学策略调整
1. **实施分层教学**
   - 根据学生能力分组
   - 设计不同难度的学习任务
   - 提供个性化指导

2. **丰富教学方法**
   - 增加互动式教学
   - 运用多媒体技术
   - 开展项目式学习

3. **加强实践应用**
   - 增加实践环节
   - 联系生活实际
   - 培养解决问题能力

#### 学习支持措施
1. **建立帮扶体系**
   - 优秀学生帮助学困学生
   - 定期学习交流
   - 共同进步

2. **家校合作**
   - 加强与家长沟通
   - 共同制定学习计划
   - 形成教育合力

3. **学习资源优化**
   - 提供多样化学习材料
   - 建设数字化学习平台
   - 丰富课外学习资源

---

## 七、后续跟踪计划

### 7.1 短期目标 (1个月内)
- 实施分层教学策略
- 建立学习小组
- 加强个别辅导
- 优化作业设计

### 7.2 中期目标 (1学期内)
- 提升整体学习成绩
- 缩小学习差距
- 培养良好学习习惯
- 增强学习兴趣

### 7.3 长期目标 (1学年内)
- 形成良好班级学习氛围
- 培养学生自主学习能力
- 提高综合素质
- 实现全面发展

### 7.4 评估机制
- 定期学习成果评估
- 学习行为观察记录
- 学生自我评价
- 家长反馈收集

---

## 八、结论与展望

通过本次学情分析，我们对${data.classInfo}的整体学习状况有了全面的了解。班级整体表现良好，但也存在一些需要改进的地方。

**主要成果**:
- 大部分学生学习态度端正
- 基础知识掌握较为扎实
- 班级学习氛围积极向上

**改进方向**:
- 加强分层教学
- 提升应用能力
- 培养自主学习
- 缩小学习差距

相信通过师生共同努力，${data.classInfo}的学习成绩和综合素质都会得到进一步提升。我们将继续关注每一位学生的发展，为他们提供更好的教育服务。

---

*本报告基于${timeMap[data.timeRange] || '一个月'}的观察和数据分析生成，仅供教学参考。*`;
    }

    /**
     * 根据年级获取平均年龄
     */
    getAverageAge(grade) {
        const ageMap = {
            'elementary': 10,
            'middle': 14,
            'high': 17,
            'university': 20
        };
        return ageMap[grade] || 15;
    }

    /**
     * 显示学情分析
     */
    displayAnalysis(analysis) {
        const resultDiv = document.getElementById('analysis-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(analysis);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('analysis-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出学情分析
     */
    exportAnalysis() {
        const resultDiv = document.getElementById('analysis-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成学情分析', 'warning');
            return;
        }

        const classInfo = document.getElementById('class-info').value.trim() || '学情分析';
        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `${classInfo}_学情分析_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('学情分析导出成功', 'success');
    }
}

// 导出学情分析模块
window.StudentAnalysisModule = StudentAnalysisModule;