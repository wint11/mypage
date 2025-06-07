/**
 * 知识图谱模块
 */
class KnowledgeGraphModule extends BaseModule {
    constructor(config) {
        super(config);
        this.moduleName = 'knowledge-graph';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.bindEventSafely('build-knowledge-graph', this.buildKnowledgeGraph);
        this.bindEventSafely('export-knowledge-graph', this.exportKnowledgeGraph);
    }

    /**
     * 构建知识图谱
     */
    async buildKnowledgeGraph() {
        const knowledgeDomain = document.getElementById('knowledge-domain').value.trim();
        const graphType = document.getElementById('graph-type').value;
        const detailLevel = document.getElementById('detail-level').value;
        const focusAreas = document.getElementById('focus-areas').value.trim();
        const outputFormat = document.getElementById('graph-output-format').value;
        const subject = document.getElementById('subject-select').value;
        const grade = document.getElementById('grade-select').value;

        if (!knowledgeDomain) {
            this.showAlert('请输入知识领域', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const prompt = this.buildKnowledgeGraphPrompt({
                knowledgeDomain, graphType, detailLevel, focusAreas, 
                outputFormat, subject, grade
            });
            
            let knowledgeGraph;
            try {
                knowledgeGraph = await this.callAI(prompt);
            } catch (error) {
                console.warn('AI生成失败，使用本地模板:', error);
                knowledgeGraph = this.generateLocalKnowledgeGraph({
                    knowledgeDomain, graphType, detailLevel, focusAreas, 
                    outputFormat, subject, grade
                });
            }

            this.displayKnowledgeGraph(knowledgeGraph);
        } catch (error) {
            console.error('知识图谱构建失败:', error);
            this.showAlert('知识图谱构建失败，请重试', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建知识图谱提示词
     */
    buildKnowledgeGraphPrompt(data) {
        const typeMap = {
            'concept': '概念图谱',
            'hierarchical': '层次图谱',
            'network': '网络图谱',
            'timeline': '时间线图谱',
            'process': '流程图谱',
            'mind': '思维导图'
        };

        const levelMap = {
            'basic': '基础概览',
            'detailed': '详细分析',
            'comprehensive': '全面深入'
        };

        const formatMap = {
            'text': '文本描述',
            'mermaid': 'Mermaid图表',
            'json': 'JSON数据',
            'outline': '大纲结构'
        };

        return `请构建一个关于"${data.knowledgeDomain}"的${typeMap[data.graphType] || '知识图谱'}：

构建要求：
- 知识领域：${data.knowledgeDomain}
- 图谱类型：${typeMap[data.graphType] || '概念图谱'}
- 详细程度：${levelMap[data.detailLevel] || '详细分析'}
- 重点关注：${data.focusAreas || '核心概念和关系'}
- 输出格式：${formatMap[data.outputFormat] || '文本描述'}
- 学科：${data.subject || '未指定'}
- 年级：${data.grade || '未指定'}

请包含以下内容：
1. 核心概念识别和定义
2. 概念之间的关系分析
3. 知识层次结构
4. 重要知识点的详细说明
5. 学习路径建议
6. 相关资源推荐

用Markdown格式输出，如果选择Mermaid格式，请提供相应的图表代码。`;
    }

    /**
     * 生成本地知识图谱模板
     */
    generateLocalKnowledgeGraph(data) {
        const typeMap = {
            'concept': '概念图谱',
            'hierarchical': '层次图谱',
            'network': '网络图谱',
            'timeline': '时间线图谱',
            'process': '流程图谱',
            'mind': '思维导图'
        };

        const levelMap = {
            'basic': '基础概览',
            'detailed': '详细分析',
            'comprehensive': '全面深入'
        };

        const formatMap = {
            'text': '文本描述',
            'mermaid': 'Mermaid图表',
            'json': 'JSON数据',
            'outline': '大纲结构'
        };

        const currentDate = new Date().toLocaleDateString();
        const graphId = 'KG_' + Date.now().toString().slice(-6);

        let content = `# ${data.knowledgeDomain} - ${typeMap[data.graphType] || '知识图谱'}

## 图谱基本信息

| 项目 | 内容 |
|------|------|
| **图谱编号** | ${graphId} |
| **创建日期** | ${currentDate} |
| **知识领域** | ${data.knowledgeDomain} |
| **图谱类型** | ${typeMap[data.graphType] || '概念图谱'} |
| **详细程度** | ${levelMap[data.detailLevel] || '详细分析'} |
| **适用学科** | ${data.subject || '通用'} |
| **适用年级** | ${data.grade || '通用'} |
| **重点关注** | ${data.focusAreas || '核心概念和关系'} |
| **输出格式** | ${formatMap[data.outputFormat] || '文本描述'} |

---

## 一、知识图谱概览

### 1.1 领域简介
${this.generateDomainIntroduction(data.knowledgeDomain, data.subject)}

### 1.2 图谱特点
- **覆盖范围**: ${this.getGraphCoverage(data.detailLevel)}
- **知识深度**: ${this.getKnowledgeDepth(data.detailLevel, data.grade)}
- **关系复杂度**: ${this.getRelationshipComplexity(data.graphType)}
- **应用价值**: ${this.getApplicationValue(data.knowledgeDomain, data.subject)}

### 1.3 使用说明
${this.generateUsageInstructions(data.graphType, data.outputFormat)}

---

## 二、核心概念体系

### 2.1 一级概念 (核心概念)
${this.generatePrimaryConcepts(data.knowledgeDomain, data.subject, data.grade)}

### 2.2 二级概念 (重要概念)
${this.generateSecondaryConcepts(data.knowledgeDomain, data.subject, data.grade)}

### 2.3 三级概念 (具体概念)
${this.generateTertiaryConcepts(data.knowledgeDomain, data.subject, data.grade)}

---

## 三、概念关系分析

### 3.1 层次关系
${this.generateHierarchicalRelationships(data.knowledgeDomain, data.graphType)}

### 3.2 因果关系
${this.generateCausalRelationships(data.knowledgeDomain, data.subject)}

### 3.3 并列关系
${this.generateParallelRelationships(data.knowledgeDomain, data.subject)}

### 3.4 依赖关系
${this.generateDependencyRelationships(data.knowledgeDomain, data.subject)}

---

## 四、知识结构图谱

### 4.1 整体结构
${this.generateOverallStructure(data.knowledgeDomain, data.graphType)}

### 4.2 详细图谱
${this.generateDetailedGraph(data)}

---

## 五、重点知识详解

### 5.1 核心知识点
${this.generateCoreKnowledgeDetails(data.knowledgeDomain, data.subject, data.focusAreas)}

### 5.2 难点知识点
${this.generateDifficultKnowledgeDetails(data.knowledgeDomain, data.subject, data.grade)}

### 5.3 易混知识点
${this.generateConfusingKnowledgeDetails(data.knowledgeDomain, data.subject)}

---

## 六、学习路径设计

### 6.1 基础学习路径
${this.generateBasicLearningPath(data.knowledgeDomain, data.subject, data.grade)}

### 6.2 进阶学习路径
${this.generateAdvancedLearningPath(data.knowledgeDomain, data.subject, data.grade)}

### 6.3 个性化路径建议
${this.generatePersonalizedPathSuggestions(data.knowledgeDomain, data.grade)}

---

## 七、教学应用指导

### 7.1 教学重点
${this.generateTeachingFocus(data.knowledgeDomain, data.subject, data.grade)}

### 7.2 教学难点
${this.generateTeachingDifficulties(data.knowledgeDomain, data.subject, data.grade)}

### 7.3 教学策略
${this.generateTeachingStrategies(data.knowledgeDomain, data.graphType, data.subject)}

### 7.4 评估建议
${this.generateAssessmentSuggestions(data.knowledgeDomain, data.subject)}

---

## 八、相关资源推荐

### 8.1 基础资源
${this.generateBasicResources(data.knowledgeDomain, data.subject, data.grade)}

### 8.2 拓展资源
${this.generateExtendedResources(data.knowledgeDomain, data.subject)}

### 8.3 实践资源
${this.generatePracticalResources(data.knowledgeDomain, data.subject)}

### 8.4 在线资源
${this.generateOnlineResources(data.knowledgeDomain, data.subject)}

---

## 九、图谱维护与更新

### 9.1 维护原则
- **准确性**: 确保知识内容的准确性和时效性
- **完整性**: 保持知识体系的完整性和系统性
- **一致性**: 维护概念定义和关系的一致性
- **可用性**: 确保图谱的实用性和可操作性

### 9.2 更新机制
- **定期更新**: 根据学科发展定期更新内容
- **反馈更新**: 根据使用反馈优化图谱结构
- **版本管理**: 建立版本管理机制，记录更新历史
- **质量控制**: 建立质量控制流程，确保更新质量

### 9.3 扩展方向
- **深度扩展**: 增加知识点的深度和细节
- **广度扩展**: 扩大知识领域的覆盖范围
- **关系扩展**: 丰富概念之间的关系类型
- **应用扩展**: 增加实际应用场景和案例

---

## 十、使用效果评估

### 10.1 评估指标
- **理解效果**: 学生对知识体系的理解程度
- **记忆效果**: 学生对知识点的记忆效果
- **应用效果**: 学生运用知识解决问题的能力
- **兴趣效果**: 学生对学科的兴趣和积极性

### 10.2 评估方法
- **前后测试**: 通过前后测试评估学习效果
- **问卷调查**: 通过问卷了解学生的主观感受
- **观察记录**: 通过课堂观察记录学生的表现
- **作品分析**: 通过学生作品分析理解程度

### 10.3 改进建议
- **结构优化**: 根据使用效果优化图谱结构
- **内容调整**: 根据学习需求调整内容重点
- **方法改进**: 改进图谱的呈现和使用方法
- **工具升级**: 升级图谱制作和展示工具

---

*本知识图谱基于教育理论和学科特点构建，旨在帮助学生系统理解和掌握相关知识。在使用过程中，请根据实际教学需要进行适当调整和补充。*`;

        return content;
    }

    // 辅助生成方法
    generateDomainIntroduction(domain, subject) {
        const introductions = {
            'chinese': `${domain}是语文学科的重要组成部分，涉及语言文字的理解、运用和表达能力的培养。`,
            'math': `${domain}是数学学科的核心内容，包含数学概念、原理、方法和应用的系统性知识。`,
            'english': `${domain}是英语学科的关键领域，涵盖语言技能、文化知识和交际能力的综合发展。`,
            'physics': `${domain}是物理学科的重要分支，探索自然现象的规律和原理，培养科学思维。`,
            'chemistry': `${domain}是化学学科的核心内容，研究物质的组成、结构、性质和变化规律。`,
            'biology': `${domain}是生物学科的重要组成部分，探索生命现象和生物规律的科学知识。`
        };
        return introductions[subject] || `${domain}是该学科领域的重要知识体系，具有系统性和逻辑性的特点。`;
    }

    getGraphCoverage(level) {
        const coverage = {
            'basic': '覆盖核心概念和基本关系',
            'detailed': '覆盖主要概念和重要关系',
            'comprehensive': '全面覆盖相关概念和复杂关系'
        };
        return coverage[level] || '适度覆盖相关知识点';
    }

    getKnowledgeDepth(level, grade) {
        const depths = {
            'basic': '基础理解层次',
            'detailed': '深入理解层次',
            'comprehensive': '全面掌握层次'
        };
        return depths[level] || '适中理解层次';
    }

    getRelationshipComplexity(type) {
        const complexity = {
            'concept': '中等复杂度，重点关注概念关系',
            'hierarchical': '层次清晰，结构化程度高',
            'network': '高复杂度，网络关系丰富',
            'timeline': '时序性强，发展脉络清晰',
            'process': '流程性强，步骤关系明确',
            'mind': '发散性强，思维关联丰富'
        };
        return complexity[type] || '适中复杂度';
    }

    getApplicationValue(domain, subject) {
        return `在${subject || '相关学科'}教学中具有重要的指导价值，有助于学生系统理解${domain}的知识体系`;
    }

    generateUsageInstructions(type, format) {
        return `本图谱采用${type}结构，以${format}格式呈现。使用时请：
1. 从整体到局部，先理解总体结构
2. 关注概念之间的关系和联系
3. 结合具体学习内容进行深入理解
4. 根据学习进度调整使用重点`;
    }

    generatePrimaryConcepts(domain, subject, grade) {
        const concepts = this.generateConceptsByLevel(domain, subject, 'primary');
        return concepts.map((concept, index) => 
            `#### ${index + 1}. ${concept.name}\n**定义**: ${concept.definition}\n**重要性**: ${concept.importance}\n**应用**: ${concept.application}\n`
        ).join('\n');
    }

    generateSecondaryConcepts(domain, subject, grade) {
        const concepts = this.generateConceptsByLevel(domain, subject, 'secondary');
        return concepts.map((concept, index) => 
            `#### ${index + 1}. ${concept.name}\n**定义**: ${concept.definition}\n**关联**: ${concept.relation}\n`
        ).join('\n');
    }

    generateTertiaryConcepts(domain, subject, grade) {
        const concepts = this.generateConceptsByLevel(domain, subject, 'tertiary');
        return concepts.map((concept, index) => 
            `#### ${index + 1}. ${concept.name}\n**说明**: ${concept.description}\n`
        ).join('\n');
    }

    generateConceptsByLevel(domain, subject, level) {
        // 根据不同学科和层级生成概念
        const conceptTemplates = {
            primary: [
                { name: `${domain}核心概念A`, definition: '这是一个核心概念的定义', importance: '在整个知识体系中占据重要地位', application: '广泛应用于相关领域' },
                { name: `${domain}核心概念B`, definition: '这是另一个核心概念的定义', importance: '是理解其他概念的基础', application: '在实际问题中经常使用' },
                { name: `${domain}核心概念C`, definition: '这是第三个核心概念的定义', importance: '连接理论与实践的桥梁', application: '解决实际问题的关键' }
            ],
            secondary: [
                { name: `${domain}重要概念A`, definition: '这是一个重要概念的定义', relation: '与核心概念A密切相关' },
                { name: `${domain}重要概念B`, definition: '这是另一个重要概念的定义', relation: '是核心概念B的具体体现' },
                { name: `${domain}重要概念C`, definition: '这是第三个重要概念的定义', relation: '连接多个核心概念' }
            ],
            tertiary: [
                { name: `${domain}具体概念A`, description: '这是一个具体概念的详细说明' },
                { name: `${domain}具体概念B`, description: '这是另一个具体概念的详细说明' },
                { name: `${domain}具体概念C`, description: '这是第三个具体概念的详细说明' }
            ]
        };
        return conceptTemplates[level] || [];
    }

    generateHierarchicalRelationships(domain, type) {
        return `**上下级关系**:
- ${domain}总体概念 → 分类概念 → 具体概念
- 抽象层次 → 中间层次 → 具体层次

**包含关系**:
- 大概念包含小概念
- 整体包含部分
- 类别包含实例`;
    }

    generateCausalRelationships(domain, subject) {
        return `**因果链条**:
- 原因概念 → 结果概念
- 条件概念 → 结果概念
- 过程概念 → 结果概念

**影响关系**:
- 主要因素 → 次要因素
- 直接影响 → 间接影响
- 正向影响 → 负向影响`;
    }

    generateParallelRelationships(domain, subject) {
        return `**同级关系**:
- 同类概念之间的并列关系
- 同层次概念的对比关系
- 相似概念的区别关系

**对比关系**:
- 相似点与不同点
- 优势与劣势
- 适用条件的差异`;
    }

    generateDependencyRelationships(domain, subject) {
        return `**前置依赖**:
- 基础概念 → 高级概念
- 先修知识 → 后续知识
- 理论基础 → 实际应用

**相互依赖**:
- 概念之间的相互支撑
- 知识点的相互验证
- 技能的相互促进`;
    }

    generateOverallStructure(domain, type) {
        const structures = {
            'concept': `以概念为节点，关系为边的网络结构，突出概念之间的逻辑关系`,
            'hierarchical': `采用树状层次结构，从总体到具体，层次分明`,
            'network': `采用网络结构，节点之间存在多种复杂关系`,
            'timeline': `按时间顺序排列，展现知识的发展脉络`,
            'process': `按流程步骤组织，展现知识的操作过程`,
            'mind': `以中心主题为核心，向外发散的思维导图结构`
        };
        return structures[type] || '采用系统化的结构组织知识内容';
    }

    generateDetailedGraph(data) {
        if (data.outputFormat === 'mermaid') {
            return this.generateMermaidGraph(data);
        } else if (data.outputFormat === 'json') {
            return this.generateJSONGraph(data);
        } else if (data.outputFormat === 'outline') {
            return this.generateOutlineGraph(data);
        } else {
            return this.generateTextGraph(data);
        }
    }

    generateMermaidGraph(data) {
        const graphTypes = {
            'concept': 'graph TD',
            'hierarchical': 'graph TD',
            'network': 'graph LR',
            'timeline': 'graph LR',
            'process': 'flowchart TD',
            'mind': 'mindmap'
        };

        const graphType = graphTypes[data.graphType] || 'graph TD';
        
        return `\`\`\`mermaid
${graphType}
    A[${data.knowledgeDomain}] --> B[核心概念1]
    A --> C[核心概念2]
    A --> D[核心概念3]
    B --> E[子概念1.1]
    B --> F[子概念1.2]
    C --> G[子概念2.1]
    C --> H[子概念2.2]
    D --> I[子概念3.1]
    D --> J[子概念3.2]
    E --> K[具体内容1]
    F --> L[具体内容2]
    G --> M[具体内容3]
    H --> N[具体内容4]
    I --> O[具体内容5]
    J --> P[具体内容6]
\`\`\``;
    }

    generateJSONGraph(data) {
        const graphData = {
            "name": data.knowledgeDomain,
            "type": data.graphType,
            "level": data.detailLevel,
            "nodes": [
                {
                    "id": "root",
                    "name": data.knowledgeDomain,
                    "type": "root",
                    "level": 0
                },
                {
                    "id": "concept1",
                    "name": "核心概念1",
                    "type": "primary",
                    "level": 1,
                    "parent": "root"
                },
                {
                    "id": "concept2",
                    "name": "核心概念2",
                    "type": "primary",
                    "level": 1,
                    "parent": "root"
                },
                {
                    "id": "concept3",
                    "name": "核心概念3",
                    "type": "primary",
                    "level": 1,
                    "parent": "root"
                }
            ],
            "relationships": [
                {
                    "source": "root",
                    "target": "concept1",
                    "type": "contains"
                },
                {
                    "source": "root",
                    "target": "concept2",
                    "type": "contains"
                },
                {
                    "source": "root",
                    "target": "concept3",
                    "type": "contains"
                }
            ]
        };

        return `\`\`\`json
${JSON.stringify(graphData, null, 2)}
\`\`\``;
    }

    generateOutlineGraph(data) {
        return `# ${data.knowledgeDomain}

## I. 核心概念层
   A. 核心概念1
      1. 子概念1.1
         a. 具体内容1.1.1
         b. 具体内容1.1.2
      2. 子概念1.2
         a. 具体内容1.2.1
         b. 具体内容1.2.2
   
   B. 核心概念2
      1. 子概念2.1
         a. 具体内容2.1.1
         b. 具体内容2.1.2
      2. 子概念2.2
         a. 具体内容2.2.1
         b. 具体内容2.2.2

   C. 核心概念3
      1. 子概念3.1
         a. 具体内容3.1.1
         b. 具体内容3.1.2
      2. 子概念3.2
         a. 具体内容3.2.1
         b. 具体内容3.2.2

## II. 关系网络层
   A. 层次关系
   B. 因果关系
   C. 并列关系
   D. 依赖关系

## III. 应用实践层
   A. 理论应用
   B. 实践操作
   C. 问题解决
   D. 创新拓展`;
    }

    generateTextGraph(data) {
        return `**${data.knowledgeDomain}知识结构**

┌─ ${data.knowledgeDomain}
├─ 核心概念1
│  ├─ 子概念1.1
│  │  ├─ 具体内容1.1.1
│  │  └─ 具体内容1.1.2
│  └─ 子概念1.2
│     ├─ 具体内容1.2.1
│     └─ 具体内容1.2.2
├─ 核心概念2
│  ├─ 子概念2.1
│  │  ├─ 具体内容2.1.1
│  │  └─ 具体内容2.1.2
│  └─ 子概念2.2
│     ├─ 具体内容2.2.1
│     └─ 具体内容2.2.2
└─ 核心概念3
   ├─ 子概念3.1
   │  ├─ 具体内容3.1.1
   │  └─ 具体内容3.1.2
   └─ 子概念3.2
      ├─ 具体内容3.2.1
      └─ 具体内容3.2.2`;
    }

    // 其他生成方法的简化实现
    generateCoreKnowledgeDetails(domain, subject, focus) {
        return `**重点1**: ${domain}的基本概念和原理\n**重点2**: ${domain}的核心方法和技能\n**重点3**: ${domain}的实际应用和案例\n**重点4**: ${focus || '相关拓展知识'}`;
    }

    generateDifficultKnowledgeDetails(domain, subject, grade) {
        return `**难点1**: 抽象概念的理解和掌握\n**难点2**: 复杂关系的分析和应用\n**难点3**: 综合知识的整合和运用\n**难点4**: 创新思维的培养和发展`;
    }

    generateConfusingKnowledgeDetails(domain, subject) {
        return `**易混点1**: 相似概念的区别和联系\n**易混点2**: 相关方法的适用条件\n**易混点3**: 不同情境下的应用差异\n**易混点4**: 理论与实践的结合要点`;
    }

    generateBasicLearningPath(domain, subject, grade) {
        return `**第一阶段**: 基础概念学习 → 理解核心定义\n**第二阶段**: 关系理解 → 掌握概念联系\n**第三阶段**: 简单应用 → 基础问题解决\n**第四阶段**: 综合练习 → 知识整合运用`;
    }

    generateAdvancedLearningPath(domain, subject, grade) {
        return `**第一阶段**: 深度理解 → 概念本质把握\n**第二阶段**: 复杂应用 → 综合问题解决\n**第三阶段**: 创新拓展 → 知识迁移应用\n**第四阶段**: 实践创新 → 独立研究探索`;
    }

    generatePersonalizedPathSuggestions(domain, grade) {
        return `**基础薄弱型**: 加强基础概念学习，循序渐进\n**理解困难型**: 多用图表和实例，增强直观理解\n**应用不足型**: 增加实践练习，强化应用能力\n**创新导向型**: 提供拓展资源，鼓励探索创新`;
    }

    generateTeachingFocus(domain, subject, grade) {
        return `1. 核心概念的准确理解\n2. 概念之间关系的把握\n3. 知识的实际应用能力\n4. 系统思维的培养`;
    }

    generateTeachingDifficulties(domain, subject, grade) {
        return `1. 抽象概念的具体化教学\n2. 复杂关系的可视化呈现\n3. 知识迁移能力的培养\n4. 个体差异的有效应对`;
    }

    generateTeachingStrategies(domain, type, subject) {
        return `1. **可视化教学**: 利用图表、模型等直观工具\n2. **案例教学**: 结合实际案例增强理解\n3. **互动教学**: 通过讨论、合作促进学习\n4. **分层教学**: 根据学生水平分层指导`;
    }

    generateAssessmentSuggestions(domain, subject) {
        return `1. **概念理解评估**: 检查基本概念掌握情况\n2. **关系分析评估**: 评估概念关系理解程度\n3. **应用能力评估**: 检验知识应用能力\n4. **综合素养评估**: 评估整体学科素养`;
    }

    generateBasicResources(domain, subject, grade) {
        return `- 教科书相关章节\n- 基础练习题集\n- 概念解释视频\n- 入门学习指南`;
    }

    generateExtendedResources(domain, subject) {
        return `- 专业参考书籍\n- 学术研究论文\n- 在线课程资源\n- 专家讲座视频`;
    }

    generatePracticalResources(domain, subject) {
        return `- 实验操作指南\n- 案例分析材料\n- 实践项目模板\n- 应用软件工具`;
    }

    generateOnlineResources(domain, subject) {
        return `- 在线学习平台\n- 教育资源网站\n- 学科专业论坛\n- 移动学习应用`;
    }

    /**
     * 显示知识图谱
     */
    displayKnowledgeGraph(knowledgeGraph) {
        const resultDiv = document.getElementById('knowledge-graph-result');
        if (resultDiv) {
            resultDiv.innerHTML = this.markdownToHtml(knowledgeGraph);
            resultDiv.style.display = 'block';
            
            // 显示操作按钮
            const actionsDiv = document.getElementById('knowledge-graph-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'block';
            }
        }
    }

    /**
     * 导出知识图谱
     */
    exportKnowledgeGraph() {
        const resultDiv = document.getElementById('knowledge-graph-result');
        if (!resultDiv || resultDiv.style.display === 'none') {
            this.showAlert('请先构建知识图谱', 'warning');
            return;
        }

        const content = resultDiv.textContent || resultDiv.innerText;
        const filename = `知识图谱_${new Date().toLocaleDateString()}.txt`;
        
        this.downloadFile(content, filename);
        this.showAlert('知识图谱导出成功', 'success');
    }
}

// 导出知识图谱模块
window.KnowledgeGraphModule = KnowledgeGraphModule;