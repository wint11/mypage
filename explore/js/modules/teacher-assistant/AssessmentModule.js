/**
 * 评估方案模块
 */
class AssessmentModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'assessment';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('generate-assessment', this.generateAssessment);
        this.bindEventSafely('export-assessment', this.exportAssessment);
    }

    /**
     * 生成评估方案
     */
    async generateAssessment() {
        const assessmentType = document.getElementById('assessment-type').value;
        const evaluationGoals = document.getElementById('evaluation-goals').value.trim();
        const assessmentMethods = document.getElementById('assessment-methods').value;
        const timeFrame = document.getElementById('assessment-timeframe').value;
        const targetStudents = document.getElementById('target-students').value.trim();
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!evaluationGoals) {
            this.showAlert('请输入评估目标', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildAssessmentPrompt({
                assessmentType, evaluationGoals, assessmentMethods, 
                timeFrame, targetStudents, subject, grade
            });
            
            let assessment;
            try {
                assessment = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                assessment = this.generateLocalAssessment({
                    assessmentType, evaluationGoals, assessmentMethods, 
                    timeFrame, targetStudents, subject, grade
                });
            }

            this.displayAssessment(assessment);
        } catch (error) {
            console.error('评估方案生成失败:', error);
            this.showAlert('评估方案生成失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建评估方案提示词
     */
    buildAssessmentPrompt(data) {
        const typeMap = {
            'formative': '形成性评估',
            'summative': '总结性评估',
            'diagnostic': '诊断性评估',
            'authentic': '真实性评估',
            'peer': '同伴评估',
            'self': '自我评估'
        };

        const methodMap = {
            'written': '书面测试',
            'oral': '口头评估',
            'practical': '实践操作',
            'portfolio': '作品集评估',
            'observation': '观察记录',
            'project': '项目评估'
        };

        return `请设计一个${typeMap[data.assessmentType] || '综合评估'}方案：

评估要求：
- 评估类型：${typeMap[data.assessmentType] || '综合评估'}
- 评估目标：${data.evaluationGoals}
- 评估方法：${methodMap[data.assessmentMethods] || '多元化评估'}
- 时间安排：${data.timeFrame || '灵活安排'}
- 目标学生：${data.targetStudents || '全体学生'}
- 学科：${data.subject || '未指定'}
- 年级：${data.grade || '未指定'}

请包含以下内容：
1. 评估目标和标准
2. 评估内容和范围
3. 评估方法和工具
4. 评估流程和时间安排
5. 评分标准和等级
6. 反馈机制和改进建议
7. 实施注意事项

用Markdown格式输出，内容要科学、实用、可操作。`;
    }

    /**
     * 生成本地评估方案模板
     */
    generateLocalAssessment(data) {
        const typeMap = {
            'formative': '形成性评估',
            'summative': '总结性评估',
            'diagnostic': '诊断性评估',
            'authentic': '真实性评估',
            'peer': '同伴评估',
            'self': '自我评估'
        };

        const methodMap = {
            'written': '书面测试',
            'oral': '口头评估',
            'practical': '实践操作',
            'portfolio': '作品集评估',
            'observation': '观察记录',
            'project': '项目评估'
        };

        const timeFrameMap = {
            'daily': '日常评估',
            'weekly': '周期评估',
            'monthly': '月度评估',
            'semester': '学期评估',
            'annual': '年度评估'
        };

        const currentDate = new Date().toLocaleDateString();
        const assessmentId = 'ASSESS_' + Date.now().toString().slice(-6);

        return `# ${typeMap[data.assessmentType] || '综合评估'}方案

## 方案基本信息

| 项目 | 内容 |
|------|------|
| **方案编号** | ${assessmentId} |
| **制定日期** | ${currentDate} |
| **评估类型** | ${typeMap[data.assessmentType] || '综合评估'} |
| **适用学科** | ${data.subject || '通用'} |
| **适用年级** | ${data.grade || '通用'} |
| **评估方法** | ${methodMap[data.assessmentMethods] || '多元化评估'} |
| **时间安排** | ${timeFrameMap[data.timeFrame] || '灵活安排'} |
| **目标群体** | ${data.targetStudents || '全体学生'} |

---

## 一、评估目标与标准

### 1.1 总体目标
${data.evaluationGoals}

### 1.2 具体目标

#### 知识目标
- **基础知识掌握**: 评估学生对核心概念和基本原理的理解程度
- **知识应用能力**: 评估学生运用所学知识解决实际问题的能力
- **知识迁移能力**: 评估学生将知识应用到新情境的能力

#### 技能目标
- **基本技能**: 评估学生掌握学科基本技能的熟练程度
- **综合技能**: 评估学生综合运用多种技能的能力
- **创新技能**: 评估学生的创新思维和实践能力

#### 情感态度目标
- **学习兴趣**: 评估学生对学科的兴趣和积极性
- **学习态度**: 评估学生的学习态度和学习习惯
- **合作精神**: 评估学生的团队合作和沟通能力

### 1.3 评估标准

#### 评估维度
1. **准确性** (30%): 答案或表现的正确程度
2. **完整性** (25%): 内容的全面性和系统性
3. **创新性** (20%): 思维的独特性和创造性
4. **表达能力** (15%): 语言表达的清晰度和逻辑性
5. **参与度** (10%): 学习过程中的积极参与程度

#### 等级标准
- **优秀 (A)**: 90-100分，全面达到或超越评估目标
- **良好 (B)**: 80-89分，较好达到评估目标
- **中等 (C)**: 70-79分，基本达到评估目标
- **及格 (D)**: 60-69分，部分达到评估目标
- **不及格 (F)**: 60分以下，未达到评估目标

---

## 二、评估内容与范围

### 2.1 评估内容框架

#### 核心内容 (60%)
${this.generateCoreContent(data.subject, data.grade)}

#### 拓展内容 (25%)
${this.generateExtendedContent(data.subject, data.grade)}

#### 综合应用 (15%)
${this.generateApplicationContent(data.subject, data.grade)}

### 2.2 评估范围

#### 知识范围
- **必修内容**: 课程标准规定的核心知识点
- **选修内容**: 根据学生兴趣和能力的拓展内容
- **实践内容**: 理论联系实际的应用性内容

#### 能力范围
- **认知能力**: 记忆、理解、应用、分析、综合、评价
- **实践能力**: 操作技能、实验技能、创新技能
- **社会能力**: 沟通合作、批判思维、问题解决

### 2.3 重点难点

#### 评估重点
${this.generateAssessmentFocus(data.subject, data.evaluationGoals)}

#### 评估难点
${this.generateAssessmentChallenges(data.subject, data.grade)}

---

## 三、评估方法与工具

### 3.1 主要评估方法

#### ${methodMap[data.assessmentMethods] || '多元化评估'}
${this.generateMethodDescription(data.assessmentMethods)}

### 3.2 评估工具设计

#### 评估工具清单
${this.generateAssessmentTools(data.assessmentMethods, data.assessmentType)}

#### 工具使用说明
${this.generateToolInstructions(data.assessmentMethods)}

### 3.3 技术支持

#### 评估平台
- **在线评估系统**: 支持多种题型的在线测试
- **作品展示平台**: 学生作品的上传和展示
- **数据分析工具**: 评估结果的统计和分析

#### 辅助工具
- **评分量表**: 标准化的评分工具
- **观察记录表**: 课堂表现的记录工具
- **自评互评表**: 学生自我评估和同伴评估工具

---

## 四、评估流程与时间安排

### 4.1 评估流程

#### 准备阶段 (1-2周)
1. **方案制定**: 确定评估目标、内容和方法
2. **工具准备**: 设计和制作评估工具
3. **培训准备**: 对评估人员进行培训
4. **学生准备**: 向学生说明评估要求和标准

#### 实施阶段 (${this.getImplementationDuration(data.timeFrame)})
1. **前期评估**: ${this.getPreAssessmentDescription(data.assessmentType)}
2. **过程评估**: ${this.getProcessAssessmentDescription(data.assessmentType)}
3. **结果评估**: ${this.getResultAssessmentDescription(data.assessmentType)}

#### 总结阶段 (1周)
1. **数据收集**: 整理和汇总评估数据
2. **结果分析**: 分析评估结果和趋势
3. **反馈提供**: 向学生和家长提供反馈
4. **改进建议**: 提出教学改进建议

### 4.2 时间安排表

| 阶段 | 时间 | 主要任务 | 责任人 |
|------|------|----------|--------|
| 准备阶段 | 第1-2周 | 方案制定、工具准备 | 教师团队 |
| 实施阶段 | ${this.getImplementationSchedule(data.timeFrame)} | 具体评估活动 | 全体师生 |
| 总结阶段 | 最后1周 | 数据分析、反馈提供 | 教师团队 |

### 4.3 关键节点

#### 重要时间点
- **方案确定**: 评估开始前2周
- **工具测试**: 评估开始前1周
- **正式评估**: 按计划时间执行
- **结果反馈**: 评估结束后1周内

#### 质量控制点
- **工具有效性检验**: 确保评估工具的科学性
- **过程监控**: 确保评估过程的规范性
- **结果审核**: 确保评估结果的准确性

---

## 五、评分标准与等级

### 5.1 详细评分标准

#### 知识掌握评分标准

| 等级 | 分数范围 | 标准描述 | 具体表现 |
|------|----------|----------|----------|
| 优秀 | 90-100 | 全面掌握，深入理解 | 能够准确阐述概念，灵活运用知识 |
| 良好 | 80-89 | 较好掌握，理解清晰 | 能够正确理解概念，基本运用知识 |
| 中等 | 70-79 | 基本掌握，理解一般 | 能够识别概念，简单运用知识 |
| 及格 | 60-69 | 部分掌握，理解模糊 | 能够记忆概念，但运用困难 |
| 不及格 | <60 | 掌握不足，理解错误 | 概念模糊，无法正确运用 |

#### 技能应用评分标准

| 等级 | 分数范围 | 标准描述 | 具体表现 |
|------|----------|----------|----------|
| 优秀 | 90-100 | 熟练掌握，创新应用 | 操作规范，方法创新，效果显著 |
| 良好 | 80-89 | 较好掌握，正确应用 | 操作正确，方法得当，效果良好 |
| 中等 | 70-79 | 基本掌握，简单应用 | 操作基本正确，方法一般 |
| 及格 | 60-69 | 部分掌握，应用困难 | 操作不够熟练，需要指导 |
| 不及格 | <60 | 掌握不足，无法应用 | 操作错误，无法独立完成 |

### 5.2 综合评价等级

#### 等级划分
- **A级 (优秀)**: 综合表现突出，全面达到评估目标
- **B级 (良好)**: 综合表现较好，较好达到评估目标
- **C级 (中等)**: 综合表现一般，基本达到评估目标
- **D级 (及格)**: 综合表现较差，部分达到评估目标
- **F级 (不及格)**: 综合表现不足，未达到评估目标

#### 等级描述
${this.generateGradeDescriptions(data.subject, data.grade)}

### 5.3 特殊情况处理

#### 缺考处理
- **病假缺考**: 安排补考，按正常标准评分
- **事假缺考**: 根据情况决定是否补考
- **无故缺考**: 按不及格处理

#### 作弊处理
- **轻微作弊**: 警告并重新评估
- **严重作弊**: 本次评估成绩无效
- **协助作弊**: 相关人员一并处理

---

## 六、反馈机制与改进建议

### 6.1 反馈机制

#### 即时反馈
- **课堂反馈**: 在评估过程中及时给予指导
- **作业反馈**: 对作业和练习及时批改和评价
- **互动反馈**: 通过问答和讨论给予反馈

#### 定期反馈
- **周反馈**: 每周总结学习情况和进步
- **月反馈**: 每月分析学习成果和问题
- **学期反馈**: 学期末综合评价和建议

#### 个性化反馈
- **优势分析**: 指出学生的优势和特长
- **问题诊断**: 分析学习中的问题和困难
- **改进建议**: 提供具体的改进方法和策略

### 6.2 反馈内容

#### 学习成果反馈
- **知识掌握情况**: 各知识点的掌握程度
- **技能发展水平**: 各项技能的发展状况
- **学习进步情况**: 与之前相比的进步程度

#### 学习过程反馈
- **学习态度**: 学习的积极性和主动性
- **学习方法**: 学习方法的有效性
- **学习习惯**: 学习习惯的养成情况

### 6.3 改进建议

#### 对学生的建议
${this.generateStudentImprovementSuggestions(data.subject, data.grade)}

#### 对教师的建议
${this.generateTeacherImprovementSuggestions(data.assessmentType, data.assessmentMethods)}

#### 对课程的建议
${this.generateCurriculumImprovementSuggestions(data.subject, data.evaluationGoals)}

---

## 七、实施注意事项

### 7.1 实施原则

#### 科学性原则
- **目标明确**: 评估目标清晰、具体、可测量
- **方法科学**: 评估方法科学、合理、有效
- **标准统一**: 评估标准统一、公正、透明

#### 发展性原则
- **关注过程**: 重视学习过程的评估
- **促进发展**: 通过评估促进学生发展
- **持续改进**: 根据评估结果持续改进

#### 多元化原则
- **方法多样**: 采用多种评估方法
- **主体多元**: 教师、学生、家长共同参与
- **内容全面**: 评估内容全面、综合

### 7.2 质量保障

#### 评估质量控制
- **工具验证**: 确保评估工具的信度和效度
- **过程监控**: 监控评估过程的规范性
- **结果审核**: 审核评估结果的准确性

#### 评估人员要求
- **专业素养**: 具备相应的专业知识和技能
- **评估能力**: 掌握评估方法和技术
- **职业道德**: 遵守评估的职业道德规范

### 7.3 风险防控

#### 常见风险
- **评估偏差**: 主观因素导致的评估偏差
- **技术故障**: 评估工具或系统的技术问题
- **时间冲突**: 评估时间与其他活动的冲突

#### 防控措施
- **培训准备**: 对评估人员进行充分培训
- **技术测试**: 提前测试评估工具和系统
- **应急预案**: 制定应急处理预案

### 7.4 伦理考虑

#### 隐私保护
- **数据安全**: 保护学生评估数据的安全
- **信息保密**: 对评估信息严格保密
- **权利尊重**: 尊重学生的各项权利

#### 公平公正
- **机会均等**: 为所有学生提供公平的评估机会
- **标准统一**: 对所有学生采用统一的评估标准
- **过程透明**: 评估过程公开透明

---

## 八、预期效果与评价

### 8.1 预期效果

#### 对学生的影响
- **学习动机**: 提高学生的学习积极性和主动性
- **学习能力**: 促进学生学习能力的发展
- **自我认知**: 帮助学生更好地认识自己

#### 对教学的影响
- **教学改进**: 为教学改进提供依据
- **课程优化**: 为课程优化提供参考
- **质量提升**: 促进教学质量的提升

### 8.2 效果评价

#### 评价指标
- **参与度**: 学生参与评估的积极性
- **满意度**: 师生对评估的满意程度
- **有效性**: 评估对教学改进的有效性

#### 评价方法
- **问卷调查**: 通过问卷了解师生的反馈
- **访谈调研**: 通过访谈深入了解情况
- **数据分析**: 通过数据分析评估效果

### 8.3 持续改进

#### 改进机制
- **定期评估**: 定期评估方案的实施效果
- **反馈收集**: 收集各方面的反馈意见
- **方案调整**: 根据反馈调整评估方案

#### 改进重点
- **方法优化**: 不断优化评估方法
- **工具完善**: 持续完善评估工具
- **流程改进**: 改进评估流程和管理

---

## 九、附录

### 9.1 评估工具模板

#### 评估量表模板
\`\`\`
评估项目：_________________
评估对象：_________________
评估时间：_________________

评估内容 | 优秀(4) | 良好(3) | 中等(2) | 及格(1) | 得分
---------|---------|---------|---------|---------|-----
知识掌握 |         |         |         |         |    
技能应用 |         |         |         |         |    
学习态度 |         |         |         |         |    
参与程度 |         |         |         |         |    
总分     |         |         |         |         |    

评估意见：
_________________________________

评估人：_____________ 日期：_______
\`\`\`

#### 观察记录表模板
\`\`\`
观察对象：_________________
观察时间：_________________
观察情境：_________________

观察要点：
1. 学习态度：________________
2. 参与程度：________________
3. 合作表现：________________
4. 问题解决：________________
5. 创新表现：________________

具体记录：
_________________________________
_________________________________

观察结论：
_________________________________

观察人：_____________ 日期：_______
\`\`\`

### 9.2 实施检查清单

#### 准备阶段检查
- [ ] 评估目标明确
- [ ] 评估内容确定
- [ ] 评估方法选择
- [ ] 评估工具准备
- [ ] 人员培训完成
- [ ] 学生说明完成

#### 实施阶段检查
- [ ] 评估环境准备
- [ ] 评估工具到位
- [ ] 评估人员就位
- [ ] 评估过程记录
- [ ] 突发情况处理
- [ ] 质量监控执行

#### 总结阶段检查
- [ ] 数据收集完整
- [ ] 结果分析准确
- [ ] 反馈及时提供
- [ ] 改进建议明确
- [ ] 档案整理完成
- [ ] 经验总结形成

### 9.3 相关政策文件

#### 参考依据
- 《教育部关于推进教育评价改革的指导意见》
- 《中小学教育质量综合评价指标框架》
- 《学生综合素质评价实施办法》
- 相关学科课程标准

#### 制度保障
- 学校评估管理制度
- 教师评估工作规范
- 学生评估权益保护制度
- 评估质量监控制度

---

**方案制定人**: _______________  
**审核人**: _______________  
**批准人**: _______________  
**制定日期**: ${currentDate}  
**生效日期**: _______________  
**修订日期**: _______________  

---

*本评估方案基于教育评价理论和实践经验制定，在实施过程中应根据实际情况进行适当调整和完善。*`;
    }

    // 辅助生成方法
    generateCoreContent(subject, grade) {
        const subjectMap = {
            'chinese': '语文核心素养：语言文字运用、思维发展、审美鉴赏、文化传承',
            'math': '数学核心素养：数学抽象、逻辑推理、数学建模、数学运算',
            'english': '英语核心素养：语言能力、文化意识、思维品质、学习能力',
            'physics': '物理核心素养：物理观念、科学思维、科学探究、科学态度',
            'chemistry': '化学核心素养：宏观辨识、微观探析、变化观念、实验探究',
            'biology': '生物核心素养：生命观念、科学思维、科学探究、社会责任'
        };
        return subjectMap[subject] || '学科核心知识点和基本技能的掌握情况';
    }

    generateExtendedContent(subject, grade) {
        return '跨学科知识整合、创新思维培养、实践能力发展、综合素质提升';
    }

    generateApplicationContent(subject, grade) {
        return '理论联系实际、问题解决能力、创新实践能力、社会适应能力';
    }

    generateAssessmentFocus(subject, goals) {
        return `重点评估学生在${goals}方面的表现，特别关注核心概念的理解和应用能力`;
    }

    generateAssessmentChallenges(subject, grade) {
        return '评估的客观性和公正性、个体差异的处理、评估结果的有效性';
    }

    generateMethodDescription(method) {
        const descriptions = {
            'written': '通过书面测试评估学生的知识掌握和应用能力，包括选择题、填空题、简答题、论述题等多种题型',
            'oral': '通过口头表达评估学生的语言能力和思维过程，包括口试、演讲、讨论、答辩等形式',
            'practical': '通过实际操作评估学生的实践能力和技能水平，包括实验、制作、演示、操作等活动',
            'portfolio': '通过作品集评估学生的学习过程和成果，包括作业、项目、作品、反思等材料',
            'observation': '通过观察记录评估学生的学习行为和表现，包括课堂表现、合作能力、学习态度等',
            'project': '通过项目评估学生的综合能力和创新能力，包括研究项目、设计项目、实践项目等'
        };
        return descriptions[method] || '采用多元化的评估方法，全面评估学生的学习情况';
    }

    generateAssessmentTools(method, type) {
        const tools = {
            'written': '- 标准化测试卷\n- 开放性问题\n- 案例分析题\n- 综合应用题',
            'oral': '- 口试评分表\n- 演讲评价量表\n- 讨论参与记录\n- 答辩评估标准',
            'practical': '- 操作技能评分表\n- 实验报告评价\n- 作品质量评估\n- 过程观察记录',
            'portfolio': '- 作品集评价标准\n- 学习反思评估\n- 进步轨迹分析\n- 自我评价表',
            'observation': '- 行为观察表\n- 课堂表现记录\n- 合作能力评估\n- 学习态度量表',
            'project': '- 项目评价标准\n- 成果展示评估\n- 过程管理评价\n- 团队合作评估'
        };
        return tools[method] || '- 综合评估工具\n- 多维度评价表\n- 过程记录表\n- 结果分析表';
    }

    generateToolInstructions(method) {
        return `使用${method}评估工具时，应注意评估标准的一致性、评估过程的规范性、评估结果的客观性。评估人员应经过专门培训，熟悉评估工具的使用方法和评分标准。`;
    }

    getImplementationDuration(timeFrame) {
        const durations = {
            'daily': '每日进行',
            'weekly': '1-2周',
            'monthly': '2-4周',
            'semester': '整个学期',
            'annual': '整个学年'
        };
        return durations[timeFrame] || '根据实际情况安排';
    }

    getPreAssessmentDescription(type) {
        return '了解学生的基础水平和学习需求，为后续评估提供参考';
    }

    getProcessAssessmentDescription(type) {
        return '持续监控学生的学习过程，及时发现问题并提供指导';
    }

    getResultAssessmentDescription(type) {
        return '全面评估学生的学习成果，形成综合性的评价结论';
    }

    getImplementationSchedule(timeFrame) {
        const schedules = {
            'daily': '每日第3-8周',
            'weekly': '第3-6周',
            'monthly': '第3-10周',
            'semester': '第3-16周',
            'annual': '全学年'
        };
        return schedules[timeFrame] || '第3-8周';
    }

    generateGradeDescriptions(subject, grade) {
        return `**A级**: 全面掌握学科核心知识，能够创新性地运用所学知识解决复杂问题
**B级**: 较好掌握学科核心知识，能够正确运用所学知识解决一般问题
**C级**: 基本掌握学科核心知识，能够在指导下运用所学知识解决简单问题
**D级**: 部分掌握学科核心知识，在解决问题时需要较多指导和帮助
**F级**: 未能掌握学科核心知识，无法独立运用所学知识解决问题`;
    }

    generateStudentImprovementSuggestions(subject, grade) {
        return `1. **加强基础**: 巩固基础知识，提高基本技能
2. **拓展思维**: 培养批判性思维和创新思维
3. **实践应用**: 多参与实践活动，提高应用能力
4. **自主学习**: 培养自主学习能力和学习策略
5. **合作交流**: 积极参与合作学习和交流讨论`;
    }

    generateTeacherImprovementSuggestions(type, method) {
        return `1. **评估素养**: 提高评估理论水平和实践能力
2. **方法创新**: 探索多元化的评估方法和工具
3. **反馈技巧**: 提高反馈的及时性和有效性
4. **数据分析**: 加强评估数据的分析和应用
5. **专业发展**: 持续学习评估新理念和新技术`;
    }

    generateCurriculumImprovementSuggestions(subject, goals) {
        return `1. **目标优化**: 明确课程目标，与评估目标保持一致
2. **内容更新**: 及时更新课程内容，保持时代性
3. **方法改进**: 改进教学方法，提高教学效果
4. **资源整合**: 整合教学资源，丰富学习体验
5. **评估融合**: 将评估融入教学过程，实现教评一体`;
    }

    /**
     * 显示评估方案
     */
    displayAssessment(assessment) {
        const resultDiv = document.getElementById('assessment-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(assessment);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('assessment-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出评估方案
     */
    exportAssessment() {
        const resultDiv = document.getElementById('assessment-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先生成评估方案', 'warning');
            return;
        }

        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `评估方案_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('评估方案导出成功', 'success');
    }
}

// 导出评估方案模块
window.AssessmentModule = AssessmentModule;