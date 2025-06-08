# 📚 课程学习平台 · Course Learning Platform

本项目是一个基于 HTML、Bootstrap 和 Firebase 构建的多课程学习平台，支持课程卡片展示、章节入口跳转与练习题功能模块，适用于数学类课程或其他学科的在线自学场景。

## 🌟 项目特点

- 🎨 **响应式设计**: 课程卡片和界面适配各类设备
- 📚 **模块化架构**: 课程、探索、用户功能完全模块化
- 🧠 **智能学习**: AI驱动的练习题生成和学习分析
- 📊 **数据可视化**: 学习进度和成就系统可视化展示
- 🎓 **教师工具**: 智能备课助手和课程管理功能
- 🔐 **用户系统**: 基于Firebase的完整用户认证和管理
- 🛠 **易于扩展**: 支持快速添加新课程和功能模块
- 📱 **PWA支持**: 渐进式Web应用，支持离线使用

---

## 🧱 目录结构

```plaintext
启元慧学/
├─ assets/                      # 首页背景图资源
│  ├─ index-background1.jpg
│  ├─ index-background2.jpg
│  └─ index-background3.jpg
├─ components/                  # 公共组件（HTML 片段）
│  ├─ footer.html               
│  └─ nav.html                  
├─ courses/                     # 课程模块（已模块化重构）
│  ├─ css/                      # 课程样式
│  ├─ data/                     # 课程数据文件
│  ├─ html/                     # 统一HTML模板
│  ├─ js/                       # 模块化JavaScript
│  ├─ structure/                # 课程结构配置
│  └─ README.md                 # 课程模块说明
├─ css/                         # 全局样式文件
│  ├─ components.css            # 自定义组件样式
│  ├─ home.css                  # 首页样式
│  └─ variables.css             # CSS 变量定义
├─ explore/                     # 探索功能模块
│  ├─ css/                      # 模块化样式文件
│  ├─ data/                     # 示例数据
│  ├─ html/                     # 功能页面
│  ├─ js/                       # 功能脚本
│  └─ README.md                 # 探索模块说明       
├─ js/                          # 全局JavaScript脚本
│  ├─ components-loader.js      # 加载公共组件（导航/页脚）
│  ├─ components-loader-explore.js # 探索模块组件加载器
│  ├─ components-loader-views.js # 视图模块组件加载器
│  ├─ course-config.js          # 课程跳转路径配置
│  └─ tex-svg.js                # LaTeX 渲染支持
├─ views/                       # 用户功能模块
│  ├─ css/                      # 视图样式
│  ├─ js/                       # 视图脚本
│  ├─ explore.html              # 探索功能入口
│  ├─ feedback.html             # 用户反馈
│  ├─ login.html                # 用户登录
│  ├─ my-courses.html           # 我的课程
│  ├─ profile.html              # 个人资料
│  ├─ settings.html             # 系统设置
│  └─ README.md                 # 用户模块说明
├─ webfonts/                    # 字体文件
├─ firebase-config.js           # Firebase 初始化配置
├─ index.html                   # 首页入口
└─ README.md                    # 项目说明文档
````

---

## 🚀 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/wint11/mypage.git
cd mypage
```

### 2️⃣ 本地预览（推荐使用 VSCode Live Server）

* 安装 Live Server 插件；
* 在 `index.html` 右键 → "Open with Live Server"；
* 或使用 Python 简易服务器：

```bash
python -m http.server
```

然后访问 `http://localhost:8080` 即可查看效果。

---

## ⚙️ 自定义配置

### 添加新课程

1. 在 `courses/` 目录中创建新课程页面，如 `离散数学.html`；
2. 在 `my-courses.html` 中添加课程卡片 HTML；
3. 在 `js/course-config.js` 中添加跳转配置；
4. 可选：创建对应的习题配置 JSON 文件，放入 `data/` 目录。

```js
// course-config.js 示例
const courseMap = {
  "course1": "../courses/gaodengshuxue.html",
  "course2": "../courses/xianxingdaishu.html",
  "course3": "../courses/gailvlun.html",
  "course4": "../courses/lisuan.html",
  "course5": "../courses/fubian.html",
  "course6": "../courses/weifenfangcheng.html"
};

```

---

## 🔐 Firebase 配置（可选）

如需启用用户登录、个性化保存等功能：

1. 在 Firebase 控制台创建项目；
2. 启用 Firebase Authentication；
3. 替换 `firebase-config.js` 中的配置参数。

---

## ✨ 技术栈

### 前端技术
* **HTML5** - 语义化标记和现代Web标准
* **CSS3** - 模块化样式和响应式设计
* **JavaScript ES6+** - 模块化编程和现代语法
* **Bootstrap 5** - 响应式UI框架
* **Font Awesome 6** - 图标库

### 数据可视化
* **Chart.js** - 图表和数据可视化
* **MathJax** - 数学公式渲染

### 后端服务
* **Firebase** - 用户认证和数据存储
* **AI API** - 智能内容生成（可配置）

### 开发工具
* **模块化设计** - CSS和JS完全模块化
* **响应式布局** - 移动端优先设计
* **PWA技术** - 渐进式Web应用

---

## 📋 TODO

### 功能增强
- [ ] 添加更多学科课程内容
- [ ] 完善AI智能推荐系统
- [ ] 增强学习分析报告功能
- [ ] 添加协作学习功能
- [ ] 集成语音识别和TTS

### 技术优化
- [ ] 实现Service Worker缓存策略
- [ ] 优化首屏加载性能
- [ ] 添加单元测试覆盖
- [ ] 实现CI/CD自动化部署
- [ ] 增强安全性和数据保护

### 用户体验
- [ ] 完善无障碍访问支持
- [ ] 添加多语言国际化
- [ ] 优化移动端交互体验
- [ ] 增加个性化主题设置
- [ ] 实现离线学习模式

---

## 📝 授权 License

本项目遵循 MIT 许可证开源，欢迎修改和扩展。


