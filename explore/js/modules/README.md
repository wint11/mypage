# 模块化架构说明

## 目录结构

本目录采用按功能分组的模块化架构，每个功能页面都有独立的模块目录：

```
modules/
├── teacher-assistant/     # 智能备课助手相关模块
│   ├── ModuleManager.js   # 模块管理器
│   ├── BaseModule.js      # 基础模块类
│   ├── LessonPlanModule.js # 教案生成模块
│   ├── ExerciseModule.js   # 习题生成模块
│   ├── PPTModule.js        # PPT生成模块
│   ├── VideoModule.js      # 视频生成模块
│   ├── AssessmentModule.js # 评估模块
│   ├── ContentAnalysisModule.js # 内容分析模块
│   ├── KnowledgeGraphModule.js  # 知识图谱模块
│   └── StudentAnalysisModule.js # 学生分析模块
│
├── student-report/        # 学习分析报告相关模块
│   ├── DataLoader.js      # 数据加载器
│   └── ReportRenderer.js  # 报告渲染器
│
└── README.md             # 本说明文件
```

## 设计原则

### 1. 功能隔离
- 每个功能页面的模块独立存放
- 避免不同功能间的模块混淆
- 便于团队协作开发

### 2. 模块复用
- 通用功能可以提取为共享模块
- 特定功能保持在各自目录中
- 支持跨功能的模块引用

### 3. 扩展性
- 新增功能时创建新的子目录
- 保持现有功能的独立性
- 支持渐进式功能开发

## 使用方式

### 在HTML中引用模块

```html
<!-- 智能备课助手页面 -->
<script src="../js/modules/teacher-assistant/BaseModule.js"></script>
<script src="../js/modules/teacher-assistant/ModuleManager.js"></script>
<!-- 其他模块... -->

<!-- 学习分析报告页面 -->
<script src="../js/modules/student-report/DataLoader.js"></script>
<script src="../js/modules/student-report/ReportRenderer.js"></script>
```

### 添加新功能

1. 在 `modules/` 下创建新的功能目录
2. 将相关模块文件放入该目录
3. 在对应的HTML文件中引用模块
4. 更新本README文件

## 注意事项

- 模块间的依赖关系要清晰明确
- 避免循环依赖
- 保持模块的单一职责原则
- 定期重构和优化模块结构