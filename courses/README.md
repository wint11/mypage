# 📚 课程模块 · Courses Module

本模块是整个学习平台的核心，提供了完整的课程学习体验，包括课程内容展示、练习题生成、学习进度跟踪等功能。采用模块化设计，支持多学科扩展。

## 🌟 功能特点

- 📖 **多学科支持**: 数学、计算机科学等多个学科
- 🧠 **智能练习**: AI驱动的练习题生成系统
- 📊 **进度跟踪**: 实时学习进度和成绩统计
- 🎯 **个性化学习**: 根据学习情况推荐内容
- 📱 **响应式设计**: 适配各种设备
- 🔧 **模块化架构**: 便于维护和扩展

## 📁 目录结构

```
courses/
├── css/                        # 样式文件
│   └── style.css              # 课程页面样式
├── data/                       # 课程数据文件
│   ├── caozuoxitong/          # 操作系统课程数据
│   ├── fubian/                # 复变函数课程数据
│   ├── gailvlun/              # 概率论课程数据
│   ├── gaodengshuxue/         # 高等数学课程数据
│   ├── lisuan/                # 离散数学课程数据
│   ├── weifenfangcheng/       # 微分方程课程数据
│   └── xianxingdaishu/        # 线性代数课程数据
├── html/                       # HTML模板
│   ├── course.html            # 统一课程模板
│   └── README.md              # HTML模板说明
├── js/                         # JavaScript模块
│   ├── CourseConfig.js        # 课程配置中心
│   ├── DocxExporter.js        # Word文档导出
│   ├── ExerciseGenerator.js   # 练习题生成器
│   ├── ExerciseManager.js     # 练习管理器
│   ├── ExerciseRenderer.js    # 练习题渲染器
│   ├── KnowledgePointLoader.js # 知识点加载器
│   ├── ReportGenerator.js     # 报告生成器
│   ├── UI.js                  # 用户界面模块
│   ├── course-loader.js       # 课程加载器
│   ├── course-template.js     # 课程模板脚本
│   ├── API配置说明.md         # API配置文档
│   └── README-模块化重构.md   # 模块化重构说明
└── structure/                  # 课程结构配置
    ├── caozuoxitong.json      # 操作系统课程结构
    ├── fubian.json            # 复变函数课程结构
    ├── gailvlun.json          # 概率论课程结构
    ├── gaodengshuxue.json     # 高等数学课程结构
    ├── lisuan.json            # 离散数学课程结构
    ├── weifenfangcheng.json   # 微分方程课程结构
    └── xianxingdaishu.json    # 线性代数课程结构
```

## 🎓 支持的课程

### 数学类课程

1. **高等数学** (`gaodengshuxue`)
   - 极限、导数、积分
   - 多元函数微积分
   - 无穷级数

2. **线性代数** (`xianxingdaishu`)
   - 矩阵运算
   - 线性方程组
   - 特征值与特征向量

3. **概率论** (`gailvlun`)
   - 概率基础
   - 随机变量
   - 统计推断

4. **复变函数** (`fubian`)
   - 复数与复函数
   - 解析函数
   - 留数定理

5. **微分方程** (`weifenfangcheng`)
   - 常微分方程
   - 偏微分方程
   - 数值解法

6. **离散数学** (`lisuan`)
   - 集合论
   - 图论
   - 组合数学

### 计算机类课程

7. **操作系统** (`caozuoxitong`)
   - 进程管理
   - 内存管理
   - 文件系统

## 🛠 技术架构

### 前端技术栈
- **HTML5**: 语义化标记
- **CSS3**: 响应式样式
- **JavaScript ES6+**: 模块化编程
- **Bootstrap 5**: UI框架
- **MathJax**: 数学公式渲染
- **Chart.js**: 数据可视化

### 核心模块说明

#### 1. 课程配置中心 (CourseConfig.js)
```javascript
// 获取课程配置
const config = getCourseConfig('gaodengshuxue');
console.log(config.title); // "高等数学"
```

#### 2. 练习管理器 (ExerciseManager.js)
```javascript
// 创建练习管理器实例
const manager = new ExerciseManager('gaodengshuxue');
manager.addExercise(exerciseData);
```

#### 3. 练习题生成器 (ExerciseGenerator.js)
```javascript
// 生成练习题
const generator = new ExerciseGenerator();
generator.generateExercises('gaodengshuxue', options);
```

## 📊 数据结构

### 课程结构配置
```json
{
  "courseId": "gaodengshuxue",
  "title": "高等数学",
  "chapters": [
    {
      "id": "chapter1",
      "title": "函数与极限",
      "sections": [
        {
          "id": "section1",
          "title": "函数的概念",
          "knowledgePoints": ["函数定义", "函数性质"]
        }
      ]
    }
  ]
}
```

### 练习题数据
```json
{
  "id": "exercise1",
  "type": "choice",
  "question": "题目内容",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "answer": "A",
  "explanation": "解题思路",
  "difficulty": "medium",
  "knowledgePoints": ["相关知识点"]
}
```

## 🚀 使用指南

### 访问课程

1. **统一入口**: 所有课程通过 `html/course.html` 访问
2. **URL参数**: 使用 `?course=课程ID` 区分不同课程
3. **示例**: `course.html?course=gaodengshuxue`

### 添加新课程

1. **创建课程结构**: 在 `structure/` 目录添加课程配置JSON
2. **添加课程数据**: 在 `data/` 目录创建课程数据文件夹
3. **更新配置**: 在 `js/CourseConfig.js` 中添加课程配置
4. **更新导航**: 在主页面添加课程入口链接

### 自定义练习题

1. **编辑数据文件**: 修改 `data/课程名/` 目录下的JSON文件
2. **使用生成器**: 通过AI生成器创建新题目
3. **批量导入**: 支持Excel/CSV格式批量导入

## 🎨 界面特点

- **现代化设计**: 卡片式布局，清晰的视觉层次
- **响应式布局**: 自适应各种屏幕尺寸
- **交互友好**: 丰富的动画效果和反馈
- **无障碍支持**: 键盘导航和屏幕阅读器支持

## 📱 响应式支持

- **桌面端** (≥1200px): 三栏布局，完整功能
- **平板端** (768px-1199px): 两栏布局，侧边栏可折叠
- **手机端** (≤767px): 单栏布局，底部导航

## 🔧 开发指南

### 本地开发

```bash
# 启动本地服务器
python -m http.server 8000
# 或使用Node.js
npx serve .

# 访问课程页面
http://localhost:8000/courses/html/course.html?course=gaodengshuxue
```

### 模块开发

1. **遵循模块化原则**: 每个功能独立成模块
2. **统一接口规范**: 使用标准的API接口
3. **错误处理**: 完善的错误捕获和处理
4. **性能优化**: 懒加载和缓存策略

### 测试建议

- **功能测试**: 各模块功能完整性
- **兼容性测试**: 多浏览器支持
- **性能测试**: 加载速度和响应时间
- **用户体验测试**: 界面友好性和易用性

## 🚀 未来规划

- [ ] **AI增强**: 更智能的题目生成和推荐
- [ ] **多媒体支持**: 视频、音频内容集成
- [ ] **协作学习**: 学习小组和讨论功能
- [ ] **离线支持**: PWA和离线缓存
- [ ] **多语言**: 国际化支持
- [ ] **API开放**: 第三方集成接口

## 📚 相关文档

- [HTML模板说明](html/README.md)
- [JavaScript模块化重构](js/README-模块化重构.md)
- [API配置说明](js/API配置说明.md)

---

💡 **提示**: 本模块采用现代Web开发最佳实践，支持快速扩展新课程和功能。建议在开发时遵循模块化设计原则。