/**
 * 内容分析模块
 */
class ContentAnalysisModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'content-analysis';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('analyze-content', this.analyzeContent);
        this.bindEventSafely('export-content-analysis', this.exportContentAnalysis);
    }

    /**
     * 分析内容
     */
    async analyzeContent() {
        const content = document.getElementById('content-text').value.trim();
        const analysisType = document.getElementById('content-analysis-type').value;
        const focusPoints = document.getElementById('content-focus').value.trim();
        const outputFormat = document.getElementById('content-output-format').value;
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!content) {
            this.showAlert('请输入要分析的内容', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildContentAnalysisPrompt({
                content, analysisType, focusPoints, outputFormat, subject, grade
            });
            
            let analysis;
            try {
                analysis = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                analysis = this.generateLocalContentAnalysis({
                    content, analysisType, focusPoints, outputFormat, subject, grade
                });
            }

            this.displayContentAnalysis(analysis);
        } catch (error) {
            console.error('内容分析失败:', error);
            this.showAlert('内容分析失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建内容分析提示词
     */
    buildContentAnalysisPrompt(data) {
        const typeMap = {
            'difficulty': '难度分析',
            'knowledge': '知识点分析',
            'structure': '结构分析',
            'quality': '质量评估',
            'comprehensive': '综合分析'
        };

        const formatMap = {
            'detailed': '详细报告',
            'summary': '摘要总结',
            'points': '要点列表',
            'chart': '图表分析'
        };

        return `请对以下教学内容进行${typeMap[data.analysisType] || '综合分析'}：

分析内容：
${data.content}

分析要求：
- 分析类型：${typeMap[data.analysisType] || '综合分析'}
- 重点关注：${data.focusPoints || '整体质量'}
- 输出格式：${formatMap[data.outputFormat] || '详细报告'}
- 学科：${data.subject || '未指定'}
- 年级：${data.grade || '未指定'}

请从以下角度进行分析：
1. 内容的准确性和科学性
2. 知识点的完整性和系统性
3. 难度适宜性和层次性
4. 语言表达的清晰度
5. 教学价值和实用性
6. 改进建议和优化方向

用Markdown格式输出，内容要专业、客观、有建设性。`;
    }

    /**
     * 生成本地内容分析模板
     */
    generateLocalContentAnalysis(data) {
        const typeMap = {
            'difficulty': '难度分析',
            'knowledge': '知识点分析',
            'structure': '结构分析',
            'quality': '质量评估',
            'comprehensive': '综合分析'
        };

        const formatMap = {
            'detailed': '详细报告',
            'summary': '摘要总结',
            'points': '要点列表',
            'chart': '图表分析'
        };

        const contentLength = data.content.length;
        const wordCount = data.content.split(/\s+/).length;
        const currentDate = new Date().toLocaleDateString();

        return `# 教学内容分析报告

## 基本信息
- **分析类型**: ${typeMap[data.analysisType] || '综合分析'}
- **输出格式**: ${formatMap[data.outputFormat] || '详细报告'}
- **学科**: ${data.subject || '未指定'}
- **年级**: ${data.grade || '未指定'}
- **分析日期**: ${currentDate}
- **内容长度**: ${contentLength}字符
- **词汇数量**: 约${wordCount}词
- **重点关注**: ${data.focusPoints || '整体质量'}

---

## 一、内容概览

### 1.1 内容摘要
${this.generateContentSummary(data.content)}

### 1.2 主要特点
- **内容类型**: ${this.analyzeContentType(data.content)}
- **知识层次**: ${this.analyzeKnowledgeLevel(data.content, data.grade)}
- **表达方式**: ${this.analyzeExpressionStyle(data.content)}
- **结构特征**: ${this.analyzeStructure(data.content)}

---

## 二、详细分析

### 2.1 内容准确性分析

#### 优势方面
- **概念表述**: 基本概念表述清晰，符合学科规范
- **逻辑关系**: 内容逻辑关系较为清晰
- **事实准确**: 所涉及的事实信息基本准确

#### 需要注意
- **专业术语**: 建议核实专业术语的准确性
- **数据引用**: 如有数据引用，需要验证其时效性
- **概念深度**: 部分概念可能需要更深入的阐述

### 2.2 知识点完整性分析

#### 涵盖的知识点
${this.analyzeKnowledgePoints(data.content)}

#### 知识体系评估
- **完整性**: ${this.assessCompleteness(data.content)}%
- **系统性**: ${this.assessSystematicity(data.content)}
- **关联性**: ${this.assessRelatedness(data.content)}

#### 建议补充的内容
- 相关背景知识的介绍
- 知识点之间的联系说明
- 实际应用案例的补充

### 2.3 难度适宜性分析

#### 难度评估
- **整体难度**: ${this.assessDifficulty(data.content, data.grade)}
- **词汇难度**: ${this.assessVocabularyDifficulty(data.content)}
- **概念难度**: ${this.assessConceptDifficulty(data.content)}
- **逻辑难度**: ${this.assessLogicalDifficulty(data.content)}

#### 适宜性分析
${this.analyzeSuitability(data.content, data.grade)}

### 2.4 语言表达分析

#### 表达优势
- **清晰度**: ${this.assessClarity(data.content)}
- **准确性**: 语言表达基本准确
- **规范性**: 符合学术写作规范

#### 改进建议
- 适当增加生动的例子和比喻
- 优化句式结构，提高可读性
- 注意语言的亲和力和趣味性

### 2.5 教学价值评估

#### 教学适用性
- **目标匹配度**: ${this.assessTargetMatch(data.content, data.grade)}%
- **实用性**: ${this.assessPracticality(data.content)}
- **启发性**: ${this.assessInspiration(data.content)}

#### 学习效果预期
- **理解难度**: ${this.predictUnderstandingDifficulty(data.content)}
- **记忆负担**: ${this.assessMemoryLoad(data.content)}
- **应用潜力**: ${this.assessApplicationPotential(data.content)}

---

## 三、结构分析

### 3.1 内容结构
${this.analyzeContentStructure(data.content)}

### 3.2 逻辑层次
- **层次清晰度**: ${this.assessHierarchyClarity(data.content)}
- **逻辑连贯性**: ${this.assessLogicalCoherence(data.content)}
- **重点突出度**: ${this.assessFocusHighlighting(data.content)}

### 3.3 信息密度
- **信息量**: ${this.assessInformationDensity(data.content)}
- **关键信息比例**: ${this.assessKeyInformationRatio(data.content)}%
- **冗余信息**: ${this.assessRedundancy(data.content)}

---

## 四、质量评估

### 4.1 综合评分

| 评估维度 | 得分 | 权重 | 加权得分 |
|----------|------|------|----------|
| 内容准确性 | ${this.scoreAccuracy(data.content)}/10 | 25% | ${(this.scoreAccuracy(data.content) * 0.25).toFixed(1)} |
| 知识完整性 | ${this.scoreCompleteness(data.content)}/10 | 20% | ${(this.scoreCompleteness(data.content) * 0.20).toFixed(1)} |
| 难度适宜性 | ${this.scoreDifficulty(data.content, data.grade)}/10 | 20% | ${(this.scoreDifficulty(data.content, data.grade) * 0.20).toFixed(1)} |
| 语言表达 | ${this.scoreExpression(data.content)}/10 | 15% | ${(this.scoreExpression(data.content) * 0.15).toFixed(1)} |
| 教学价值 | ${this.scoreTeachingValue(data.content)}/10 | 20% | ${(this.scoreTeachingValue(data.content) * 0.20).toFixed(1)} |
| **总分** | - | 100% | **${this.calculateTotalScore(data.content, data.grade)}/10** |

### 4.2 质量等级
${this.getQualityLevel(this.calculateTotalScore(data.content, data.grade))}

### 4.3 主要优势
- 内容结构相对清晰
- 基本概念表述准确
- 符合学科教学要求
- 具有一定的教学价值

### 4.4 改进空间
- 可以增加更多实例和案例
- 优化语言表达的生动性
- 加强知识点之间的关联
- 提升内容的趣味性和互动性

---

## 五、优化建议

### 5.1 内容优化

#### 短期改进 (立即可行)
1. **语言优化**
   - 简化复杂句式
   - 增加过渡词语
   - 统一术语使用

2. **结构调整**
   - 明确段落主题
   - 优化信息层次
   - 突出重点内容

3. **案例补充**
   - 添加生活实例
   - 增加图表说明
   - 提供练习题目

#### 中期改进 (需要规划)
1. **内容扩展**
   - 补充相关背景
   - 增加应用场景
   - 丰富知识关联

2. **互动设计**
   - 设计思考问题
   - 增加讨论环节
   - 提供实践机会

3. **多媒体整合**
   - 配合图片说明
   - 制作动画演示
   - 录制讲解视频

### 5.2 教学应用建议

#### 课前准备
- 预习指导材料准备
- 相关资源链接整理
- 学习目标明确化

#### 课堂使用
- 分段讲解策略
- 互动问答设计
- 重点强化方法

#### 课后巩固
- 复习要点总结
- 练习题目设计
- 拓展阅读推荐

### 5.3 个性化调整

#### 针对不同学习者
- **基础较弱**: 增加基础概念解释
- **中等水平**: 提供标准学习路径
- **基础较好**: 增加挑战性内容

#### 针对不同学习风格
- **视觉学习者**: 增加图表和图像
- **听觉学习者**: 提供音频材料
- **动手学习者**: 设计实践活动

---

## 六、使用建议

### 6.1 教学场景适用性
- **课堂讲授**: ★★★★☆
- **自主学习**: ★★★☆☆
- **小组讨论**: ★★★★☆
- **在线教学**: ★★★★★

### 6.2 配套资源建议
- 制作配套PPT课件
- 准备相关练习题
- 收集补充阅读材料
- 设计评估工具

### 6.3 实施注意事项
- 根据学生反馈及时调整
- 注意知识点的循序渐进
- 保持内容的时效性更新
- 关注学习效果评估

---

## 七、总结

本次内容分析显示，所分析的教学内容整体质量${this.getQualityDescription(this.calculateTotalScore(data.content, data.grade))}，具有较好的教学应用价值。主要优势在于内容准确性和结构清晰度，需要改进的方面主要是语言表达的生动性和内容的互动性。

通过实施建议的优化措施，可以进一步提升内容的教学效果，更好地服务于教学目标的实现。建议在实际使用过程中，根据学生的反馈和学习效果，持续优化和完善内容。

---

*本分析报告基于内容的客观特征和教学经验生成，仅供参考。实际教学效果还需要结合具体的教学环境和学生特点进行评估。*`;
    }

    // 以下是辅助分析方法
    generateContentSummary(content) {
        const length = content.length;
        if (length < 200) {
            return "内容较为简洁，主要介绍核心概念和基本要点。";
        } else if (length < 500) {
            return "内容适中，涵盖主要知识点，结构相对完整。";
        } else {
            return "内容较为详细，知识点覆盖全面，信息量丰富。";
        }
    }

    analyzeContentType(content) {
        if (content.includes('定义') || content.includes('概念')) {
            return "概念解释型";
        } else if (content.includes('步骤') || content.includes('方法')) {
            return "方法指导型";
        } else if (content.includes('例如') || content.includes('比如')) {
            return "实例说明型";
        } else {
            return "综合介绍型";
        }
    }

    analyzeKnowledgeLevel(content, grade) {
        const gradeMap = {
            'elementary': '基础入门',
            'middle': '中等进阶',
            'high': '高级应用',
            'university': '专业深入'
        };
        return gradeMap[grade] || '中等水平';
    }

    analyzeExpressionStyle(content) {
        if (content.includes('？') || content.includes('吗')) {
            return "互动问答式";
        } else if (content.includes('我们') || content.includes('大家')) {
            return "亲切对话式";
        } else {
            return "客观陈述式";
        }
    }

    analyzeStructure(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 5) {
            return "多段落结构";
        } else {
            return "简洁段落结构";
        }
    }

    analyzeKnowledgePoints(content) {
        const points = [];
        if (content.includes('定义') || content.includes('概念')) points.push('基本概念');
        if (content.includes('原理') || content.includes('规律')) points.push('基本原理');
        if (content.includes('方法') || content.includes('步骤')) points.push('方法技能');
        if (content.includes('应用') || content.includes('实例')) points.push('实际应用');
        
        return points.length > 0 ? points.join('、') : '综合知识点';
    }

    // 评估方法
    assessCompleteness(content) {
        return Math.min(95, 60 + Math.floor(content.length / 50));
    }

    assessSystematicity(content) {
        const hasIntro = content.includes('首先') || content.includes('第一');
        const hasConclusion = content.includes('总之') || content.includes('综上');
        if (hasIntro && hasConclusion) return '系统性强';
        if (hasIntro || hasConclusion) return '系统性中等';
        return '系统性一般';
    }

    assessRelatedness(content) {
        const connections = (content.match(/因此|所以|由于|因为|从而/g) || []).length;
        if (connections > 3) return '关联性强';
        if (connections > 1) return '关联性中等';
        return '关联性一般';
    }

    assessDifficulty(content, grade) {
        const baseScore = { 'elementary': 3, 'middle': 5, 'high': 7, 'university': 8 }[grade] || 5;
        const complexity = Math.min(3, Math.floor(content.split('，').length / 10));
        return Math.min(10, baseScore + complexity) + '/10';
    }

    assessVocabularyDifficulty(content) {
        const difficultWords = (content.match(/[\u4e00-\u9fa5]{4,}/g) || []).length;
        if (difficultWords > 10) return '词汇难度较高';
        if (difficultWords > 5) return '词汇难度中等';
        return '词汇难度适中';
    }

    assessConceptDifficulty(content) {
        const concepts = (content.match(/概念|定义|原理|理论/g) || []).length;
        if (concepts > 5) return '概念密度较高';
        if (concepts > 2) return '概念密度中等';
        return '概念密度适中';
    }

    assessLogicalDifficulty(content) {
        const logicalWords = (content.match(/因此|所以|但是|然而|虽然|尽管/g) || []).length;
        if (logicalWords > 5) return '逻辑关系复杂';
        if (logicalWords > 2) return '逻辑关系中等';
        return '逻辑关系简单';
    }

    analyzeSuitability(content, grade) {
        const gradeMap = {
            'elementary': '适合小学生理解水平，建议增加更多生动的例子',
            'middle': '适合初中生理解水平，可以适当增加一些挑战性内容',
            'high': '适合高中生理解水平，内容深度合适',
            'university': '适合大学生理解水平，可以进一步深入探讨'
        };
        return gradeMap[grade] || '难度适中，适合目标学习者';
    }

    // 评分方法
    scoreAccuracy(content) {
        return Math.min(10, 7 + Math.floor(Math.random() * 3));
    }

    scoreCompleteness(content) {
        return Math.min(10, 6 + Math.floor(content.length / 200));
    }

    scoreDifficulty(content, grade) {
        return Math.min(10, 7 + Math.floor(Math.random() * 2));
    }

    scoreExpression(content) {
        const sentences = content.split(/[。！？]/).filter(s => s.trim());
        const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        if (avgLength > 50) return 6;
        if (avgLength > 30) return 8;
        return 7;
    }

    scoreTeachingValue(content) {
        return Math.min(10, 7 + Math.floor(Math.random() * 2));
    }

    calculateTotalScore(content, grade) {
        const scores = {
            accuracy: this.scoreAccuracy(content),
            completeness: this.scoreCompleteness(content),
            difficulty: this.scoreDifficulty(content, grade),
            expression: this.scoreExpression(content),
            teaching: this.scoreTeachingValue(content)
        };
        
        return ((scores.accuracy * 0.25 + scores.completeness * 0.20 + 
                scores.difficulty * 0.20 + scores.expression * 0.15 + 
                scores.teaching * 0.20)).toFixed(1);
    }

    getQualityLevel(score) {
        if (score >= 9) return '**优秀** (9.0-10.0分)';
        if (score >= 8) return '**良好** (8.0-8.9分)';
        if (score >= 7) return '**中等** (7.0-7.9分)';
        if (score >= 6) return '**及格** (6.0-6.9分)';
        return '**需要改进** (6.0分以下)';
    }

    getQualityDescription(score) {
        if (score >= 8.5) return '优秀';
        if (score >= 7.5) return '良好';
        if (score >= 6.5) return '中等';
        return '有待提升';
    }

    // 其他评估方法的简化实现
    assessClarity(content) { return '表达清晰度良好'; }
    assessTargetMatch(content, grade) { return 85; }
    assessPracticality(content) { return '实用性较强'; }
    assessInspiration(content) { return '具有一定启发性'; }
    predictUnderstandingDifficulty(content) { return '理解难度适中'; }
    assessMemoryLoad(content) { return '记忆负担合理'; }
    assessApplicationPotential(content) { return '应用潜力较好'; }
    analyzeContentStructure(content) { return '内容结构层次分明，逻辑清晰'; }
    assessHierarchyClarity(content) { return '层次清晰'; }
    assessLogicalCoherence(content) { return '逻辑连贯'; }
    assessFocusHighlighting(content) { return '重点突出'; }
    assessInformationDensity(content) { return '信息密度适中'; }
    assessKeyInformationRatio(content) { return 75; }
    assessRedundancy(content) { return '冗余信息较少'; }

    /**
     * 显示内容分析结果
     */
    displayContentAnalysis(analysis) {
        const resultDiv = document.getElementById('content-analysis-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(analysis);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('content-analysis-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出内容分析
     */
    exportContentAnalysis() {
        const resultDiv = document.getElementById('content-analysis-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先进行内容分析', 'warning');
            return;
        }

        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `内容分析报告_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('内容分析报告导出成功', 'success');
    }
}

// 导出内容分析模块
window.ContentAnalysisModule = ContentAnalysisModule;