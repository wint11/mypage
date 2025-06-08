# 📊 探索功能模块 · Explore Module

本模块提供了学习分析报告和教师智能备课助手两个核心功能，采用模块化设计，便于维护和扩展。

## 🌟 功能特点

- 📈 **学习分析报告**: 可视化学习数据，提供个性化学习建议
- 🎓 **教师智能备课助手**: AI驱动的备课工具，支持课程计划和练习题生成
- 🎨 **响应式设计**: 适配各种设备屏幕
- 🧩 **模块化架构**: CSS和JS采用模块化设计，便于维护

## 📁 目录结构

```
explore/
├── css/                           # 样式文件
│   ├── modules/                   # CSS模块化文件
│   │   ├── student-report-*.css   # 学习报告样式模块
│   │   └── teacher-assistant-*.css # 教师助手样式模块
│   ├── student-report-modular.css # 学习报告样式入口
│   ├── teacher-assistant-modular.css # 教师助手样式入口
│   └── README-teacher-assistant.md # 教师助手CSS模块化说明
├── data/                          # 数据文件
│   └── student-report-data.json   # 学习报告示例数据
├── html/                          # HTML页面
│   ├── student-report.html        # 学习分析报告页面
│   └── teacher-assistant.html     # 教师智能备课助手页面
└── js/                            # JavaScript文件
    ├── modules/                   # JS模块化文件（待开发）
    ├── student-report.js          # 学习报告脚本
    └── teacher-assistant.js       # 教师助手脚本
```

## 🚀 功能模块

### 📊 学习分析报告 (Student Report)

**文件**: `html/student-report.html`

**功能特点**:
- 📈 学习进度可视化展示
- 🎯 知识点掌握情况分析
- 🏆 成就系统和滚动展示
- 📋 个性化学习建议
- 📱 响应式设计，支持移动端

**样式模块**:
- `student-report-base.css` - 基础样式和变量
- `student-report-components.css` - 组件样式
- `student-report-achievements.css` - 成就系统样式
- `student-report-animations.css` - 动画效果
- `student-report-responsive.css` - 响应式设计
- `student-report-tooltips.css` - 工具提示
- `student-report-accessibility.css` - 无障碍支持

### 🎓 教师智能备课助手 (Teacher Assistant)

**文件**: `html/teacher-assistant.html`

**功能特点**:
- 📝 AI驱动的课程计划生成
- 📚 智能练习题生成
- 🎯 多种题型支持（选择题、填空题、解答题）
- 💾 内容导出功能
- 🎨 现代化用户界面

**样式模块**:
- `teacher-assistant-base.css` - 基础样式
- `teacher-assistant-forms.css` - 表单和按钮
- `teacher-assistant-panels.css` - 功能面板
- `teacher-assistant-animations.css` - 动画效果
- `teacher-assistant-alerts.css` - 消息提示
- `teacher-assistant-responsive.css` - 响应式设计
- `teacher-assistant-print.css` - 打印样式

## 🛠 技术栈

- **前端框架**: Bootstrap 5
- **图标库**: Font Awesome 6
- **图表库**: Chart.js
- **样式**: 模块化CSS
- **脚本**: 原生JavaScript
- **响应式**: Bootstrap Grid + 自定义媒体查询

## 📱 响应式支持

- **桌面端**: ≥992px - 完整功能展示
- **平板端**: 768px-991px - 适配中等屏幕
- **手机端**: ≤767px - 移动端优化

## 🎨 设计特点

- **现代化UI**: 采用卡片式设计和渐变效果
- **动画交互**: 丰富的CSS动画和过渡效果
- **色彩搭配**: 专业的蓝色主题配色
- **无障碍**: 支持键盘导航和屏幕阅读器

## 🔧 开发说明

### 本地开发

1. 直接在浏览器中打开HTML文件
2. 或使用本地服务器（推荐）:
   ```bash
   # 使用Python
   python -m http.server 8000
   
   # 使用Node.js
   npx serve .
   ```

### 样式开发

- 样式采用模块化设计，修改时请编辑对应的模块文件
- 入口文件会自动导入所有模块
- 支持按需引入特定模块

### 数据配置

- 学习报告数据存储在 `data/student-report-data.json`
- 可根据实际需求修改数据结构和内容

## 🚀 未来规划

- [ ] JavaScript模块化重构
- [ ] 添加更多图表类型
- [ ] 集成真实的AI API
- [ ] 添加数据持久化
- [ ] 支持多语言
- [ ] 添加主题切换功能

## 📄 相关文档

- [教师助手CSS模块化说明](css/README-teacher-assistant.md)
- [学习报告CSS模块化说明](css/README.md)

---

💡 **提示**: 这些功能模块展示了现代Web应用的最佳实践，包括模块化设计、响应式布局和无障碍支持。