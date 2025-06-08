# 全局JavaScript模块

本目录包含项目的全局JavaScript文件，提供核心功能和公共服务。

## 📁 目录结构

```
js/
├── bootstrap.bundle.min.js      # Bootstrap JavaScript组件（压缩版）
├── components-loader.js         # 通用组件加载器
├── components-loader-explore.js # 探索模块组件加载器
├── components-loader-views.js   # 视图模块组件加载器
├── course-config.js             # 课程配置和路由管理
├── firebase-app-compat.js       # Firebase应用核心（兼容版）
├── firebase-auth-compat.js      # Firebase认证服务（兼容版）
├── marked.min.js                # Markdown解析器（压缩版）
├── tex-svg.js                   # LaTeX数学公式渲染
└── README.md                    # 本说明文档
```

## 🔧 核心模块说明

### 组件加载器系列

#### `components-loader.js` - 通用组件加载器
- **功能**: 动态加载导航栏和页脚组件
- **适用**: 首页和通用页面
- **特性**:
  - 异步加载HTML组件
  - 错误处理和重试机制
  - DOM就绪状态检测

```javascript
// 使用示例
loadComponents({
  nav: 'components/nav.html',
  footer: 'components/footer.html'
});
```

#### `components-loader-explore.js` - 探索模块专用
- **功能**: 为探索功能页面加载特定组件
- **特性**:
  - 探索模块导航适配
  - 学习分析工具集成
  - 教师助手界面支持

#### `components-loader-views.js` - 视图模块专用
- **功能**: 为用户功能页面加载组件
- **特性**:
  - 用户认证状态检测
  - 个性化导航菜单
  - 权限控制集成

### 配置和路由

#### `course-config.js` - 课程配置管理
- **功能**: 课程路由和配置中心
- **特性**:
  - 课程ID到路径的映射
  - 动态路由生成
  - 课程元数据管理

```javascript
// 配置示例
const courseConfig = {
  'math-basic': {
    title: '基础数学',
    path: 'courses/html/math-basic.html',
    category: 'mathematics'
  }
};
```

### 第三方库集成

#### `bootstrap.bundle.min.js` - Bootstrap组件
- **版本**: Bootstrap 5.x
- **包含**: 所有JavaScript组件和Popper.js
- **功能**: 模态框、下拉菜单、工具提示等

#### `marked.min.js` - Markdown解析
- **功能**: 将Markdown文本转换为HTML
- **用途**: 课程内容渲染、文档显示
- **特性**: 支持GFM（GitHub Flavored Markdown）

#### `tex-svg.js` - 数学公式渲染
- **功能**: LaTeX数学公式转SVG渲染
- **集成**: MathJax或KaTeX引擎
- **用途**: 数学课程公式显示

### Firebase服务

#### `firebase-app-compat.js` - Firebase核心
- **功能**: Firebase应用初始化
- **版本**: 兼容版本（v8 API）
- **配置**: 项目配置和服务初始化

#### `firebase-auth-compat.js` - 认证服务
- **功能**: 用户认证和授权
- **特性**:
  - 邮箱/密码登录
  - 第三方登录（Google、GitHub等）
  - 用户状态管理
  - 权限控制

## 🚀 使用指南

### 基础页面集成

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>页面标题</title>
    <!-- CSS文件 -->
</head>
<body>
    <!-- 页面内容 -->
    
    <!-- 基础JavaScript库 -->
    <script src="js/bootstrap.bundle.min.js"></script>
    <script src="js/marked.min.js"></script>
    
    <!-- 组件加载器 -->
    <script src="js/components-loader.js"></script>
    
    <!-- 页面特定脚本 -->
    <script>
        // 页面初始化代码
    </script>
</body>
</html>
```

### 课程页面集成

```html
<!-- 课程页面需要额外的脚本 -->
<script src="js/tex-svg.js"></script>
<script src="js/course-config.js"></script>
```

### 用户功能页面集成

```html
<!-- 需要认证的页面 -->
<script src="js/firebase-app-compat.js"></script>
<script src="js/firebase-auth-compat.js"></script>
<script src="js/components-loader-views.js"></script>
```

## 📱 模块化设计

### 依赖关系

```
bootstrap.bundle.min.js (基础)
├── components-loader.js
├── components-loader-explore.js
└── components-loader-views.js

firebase-app-compat.js (基础)
└── firebase-auth-compat.js

course-config.js (独立)
marked.min.js (独立)
tex-svg.js (独立)
```

### 加载策略

1. **关键路径**: 优先加载Bootstrap和组件加载器
2. **按需加载**: 根据页面功能加载特定模块
3. **延迟加载**: 非关键功能可以延迟加载
4. **缓存优化**: 利用浏览器缓存减少重复加载

## 🔧 开发指南

### 添加新模块

1. **创建模块文件**:
```javascript
// 新模块示例: feature-module.js
(function() {
    'use strict';
    
    // 模块私有变量
    let moduleState = {};
    
    // 公共API
    window.FeatureModule = {
        init: function(config) {
            // 初始化逻辑
        },
        
        method: function() {
            // 功能方法
        }
    };
    
    // 自动初始化（可选）
    document.addEventListener('DOMContentLoaded', function() {
        if (window.FeatureModule.autoInit !== false) {
            window.FeatureModule.init();
        }
    });
})();
```

2. **更新依赖关系**: 在相关页面中引入新模块
3. **添加文档**: 更新本README文件

### 代码规范

- **ES5兼容**: 保持与旧浏览器的兼容性
- **严格模式**: 使用 `'use strict'`
- **命名空间**: 避免全局变量污染
- **错误处理**: 添加适当的错误处理逻辑
- **注释文档**: 为复杂逻辑添加注释

### 性能优化

- **代码压缩**: 生产环境使用压缩版本
- **模块拆分**: 按功能拆分避免单文件过大
- **懒加载**: 非关键功能延迟加载
- **缓存策略**: 设置合适的HTTP缓存头

## 🔗 相关文档

- [项目主文档](../README.md)
- [组件文档](../components/README.md)
- [课程模块](../courses/README.md)
- [探索模块](../explore/README.md)
- [用户模块](../views/README.md)
- [Bootstrap文档](https://getbootstrap.com/docs/5.3/getting-started/javascript/)
- [Firebase文档](https://firebase.google.com/docs/web/setup)