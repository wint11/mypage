# 全局样式模块

本目录包含项目的全局CSS样式文件，提供统一的视觉设计规范和样式基础。

## 📁 目录结构

```
css/
├── all.min.css                 # Font Awesome图标样式（压缩版）
├── bootstrap-icons.css          # Bootstrap图标库样式
├── bootstrap.min.css            # Bootstrap框架样式（压缩版）
├── components.css               # 公共组件样式
├── home.css                     # 首页专用样式
├── variables.css                # CSS变量和主题配置
└── README.md                    # 本说明文档
```

## 🎨 样式文件说明

### 框架样式
- **`bootstrap.min.css`**: Bootstrap 5框架的核心样式
- **`bootstrap-icons.css`**: Bootstrap官方图标库
- **`all.min.css`**: Font Awesome 6图标库完整样式

### 项目样式
- **`variables.css`**: 项目的CSS自定义属性和主题变量
- **`components.css`**: 导航栏、页脚等公共组件样式
- **`home.css`**: 首页特定的样式定义

## 🔧 样式架构

### CSS变量系统 (`variables.css`)
定义了项目的设计令牌：

```css
:root {
  /* 主题色彩 */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  
  /* 字体系统 */
  --font-family-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;
  
  /* 间距系统 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  
  /* 阴影系统 */
  --shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --shadow-md: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);
}
```

### 组件样式 (`components.css`)
包含公共组件的样式定义：
- 导航栏样式和响应式行为
- 页脚布局和视觉设计
- 按钮和表单元素的自定义样式
- 卡片和容器组件样式

### 首页样式 (`home.css`)
专门为首页设计的样式：
- 英雄区域和背景设计
- 课程卡片网格布局
- 特色展示区域样式
- 首页特有的动画效果

## 📱 响应式设计

项目采用移动端优先的响应式设计策略：

```css
/* 移动端优先 */
.container {
  padding: var(--spacing-sm);
}

/* 平板端适配 */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
}

/* 桌面端适配 */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-lg);
  }
}
```

## 🎯 设计规范

### 色彩系统
- **主色调**: 蓝色系，体现专业和信任
- **辅助色**: 灰色系，用于文本和边框
- **功能色**: 绿色（成功）、黄色（警告）、红色（错误）
- **中性色**: 白色和各种灰度，用于背景和分割

### 字体系统
- **主字体**: 系统默认无衬线字体栈
- **标题字体**: 加粗的主字体
- **代码字体**: 等宽字体用于代码显示
- **字号层级**: 基于1.25倍比例的字号系统

### 间距系统
- **基础单位**: 4px (0.25rem)
- **间距比例**: 4px, 8px, 16px, 24px, 48px
- **组件间距**: 统一使用预定义的间距变量

## 🔄 样式加载顺序

推荐的CSS文件加载顺序：

```html
<!-- 1. 框架样式 -->
<link rel="stylesheet" href="css/bootstrap.min.css">
<link rel="stylesheet" href="css/bootstrap-icons.css">
<link rel="stylesheet" href="css/all.min.css">

<!-- 2. 项目基础样式 -->
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/components.css">

<!-- 3. 页面特定样式 -->
<link rel="stylesheet" href="css/home.css">
```

## 🛠 开发指南

### 添加新样式
1. **全局样式**: 添加到 `components.css`
2. **页面样式**: 创建独立的CSS文件
3. **变量定义**: 在 `variables.css` 中定义新的CSS变量
4. **响应式**: 使用移动端优先的媒体查询

### 样式命名规范
- **BEM方法论**: 使用块-元素-修饰符命名
- **语义化**: 使用描述性的类名
- **前缀**: 项目特定样式使用 `qy-` 前缀

```css
/* 好的命名示例 */
.qy-course-card { }
.qy-course-card__title { }
.qy-course-card--featured { }

/* 避免的命名 */
.blue-box { }
.mt-10 { }
.card1 { }
```

### 性能优化
- **CSS压缩**: 生产环境使用压缩版本
- **关键路径**: 内联关键CSS减少渲染阻塞
- **懒加载**: 非关键样式延迟加载
- **缓存策略**: 设置合适的缓存头

## 🔗 相关文档

- [项目主文档](../README.md)
- [组件文档](../components/README.md)
- [Bootstrap文档](https://getbootstrap.com/docs/5.3/)
- [Font Awesome文档](https://fontawesome.com/docs)