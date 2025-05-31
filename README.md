# 📚 课程学习平台 · Course Learning Platform

本项目是一个基于 HTML、Bootstrap 和 Firebase 构建的多课程学习平台，支持课程卡片展示、章节入口跳转与练习题功能模块，适用于数学类课程或其他学科的在线自学场景。

## 🌟 项目特点

- 🎨 响应式课程卡片设计，适配各类设备；
- 📁 每门课程支持独立页面和练习配置文件；
- 🧠 可扩展的习题系统，便于多学科接入；
- 🛠 模块化结构，便于维护和部署；
- 🔐 支持 Firebase 用户认证（可选）；

---

## 🧱 目录结构

```plaintext
.
启元慧学/
├─ assets/                      # 首页背景图资源
│  ├─ index-background1.jpg
│  ├─ index-background2.jpg
│  └─ index-background3.jpg
├─ components/                  # 公共组件（HTML 片段）
│  ├─ footer.html               
│  └─ nav.html                  
├─ courses/                     # 课程页面与数据 JS 映射
│  ├─ js/
│  │  ├─ fubian.js              
│  │  ├─ gailvlun.js            
│  │  ├─ gaodengshuxue.js       
│  │  ├─ lisuan.js              
│  │  ├─ weifenfangcheng.js     
│  │  └─ xianxingdaishu.js      
│  ├─ fubian.html               
│  ├─ gailvlun.html             
│  ├─ gaodengshuxue.html        
│  ├─ lisuan.html               
│  ├─ weifenfangcheng.html      
│  └─ xianxingdaishu.html       
├─ css/                         # 样式文件
│  ├─ components.css            # 自定义组件样式
│  ├─ home.css                  # 首页样式
│  └─ variables.css             # CSS 变量定义
├─ data/                        # 课程配置 JSON 数据
│  ├─ fubian.json               
│  ├─ gailvlun.json             
│  ├─ gaodengshuxue.json        
│  ├─ lisuan.json               
│  ├─ weifenfangcheng.json      
│  └─ xianxingdaishu.json       
├─ js/                          # JavaScript 脚本
│  ├─ components-loader.js      # 加载公共组件（导航/页脚）
│  ├─ components-loader-detail.js # 细节加载器
│  ├─ course-config.js          # 课程跳转路径配置
│  └─ tex-svg.js                # LaTeX 渲染支持
├─ views/                       # 子页面视图（用户功能模块）
│  ├─ discover.html             
│  ├─ feedback.html             
│  ├─ login.html                
│  ├─ my-courses.html           
│  ├─ profile.html              
│  └─ settings.html             
├─ firebase-config.js           # Firebase 初始化配置
├─ index.html                   # 首页入口
└─ README.md                    # 项目说明文档
````

---

## 🚀 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/yourusername/course-learning-platform.git
cd course-learning-platform
```

### 2️⃣ 本地预览（推荐使用 VSCode Live Server）

* 安装 Live Server 插件；
* 在 `index.html` 右键 → "Open with Live Server"；
* 或使用 Python 简易服务器：

```bash
python -m http.server
```

然后访问 `http://localhost:8000` 即可查看效果。

---

## ⚙️ 自定义配置

### 添加新课程

1. 在 `courses/你的分类/` 目录中创建新课程页面，如 `离散数学.html`；
2. 在 `index.html` 中添加课程卡片 HTML；
3. 在 `js/course-config.js` 中添加跳转配置；
4. 可选：创建对应的习题配置 JSON 文件，放入 `config/` 目录。

```js
// course-config.js 示例
const courseMap = {
  "高等数学": "courses/math/高等数学.html",
  "线性代数": "courses/math/线性代数.html",
  ...
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

* HTML + CSS + JavaScript
* Bootstrap 5
* FontAwesome 图标库
* Firebase（可选）

---

## 📌 TODO（进阶计划）

* [ ] 增加课程搜索功能
* [ ] 添加学习进度记录功能
* [ ] 引入 Vue 重构项目结构
* [ ] 接入 Markdown 渲染支持课程内容展示

---

## 📝 授权 License

本项目遵循 MIT 许可证开源，欢迎修改和扩展。


