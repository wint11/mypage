# 纸折叠测试模块化结构

本文件夹包含了从原始 `paperfolding.js` 文件模块化拆分出来的各个功能模块。

## 模块结构

### 核心模块

- **`PaperFoldingTest.js`** - 主测试类，整合所有功能模块
- **`index.js`** - 模块入口文件，导出所有模块

### 功能模块

- **`Config.js`** - 配置管理模块
  - 问卷星配置
  - 图片缓存配置
  - 测试参数配置
  - 数据路径配置

- **`ImageCache.js`** - 图片缓存模块
  - LRU缓存机制
  - 图片预加载
  - 缓存管理和清理

- **`WenjuanxingUploader.js`** - 问卷星上传模块
  - 测试结果上传
  - 表单数据准备
  - 上传状态显示

- **`Downloader.js`** - 下载功能模块
  - 单题图片下载
  - 批量图片下载
  - 进度显示

- **`Filter.js`** - 筛选功能模块
  - 题目筛选和分组
  - 随机打乱
  - 本地存储管理

- **`RandomUtils.js`** - 随机工具模块
  - 种子随机数生成
  - 数组随机打乱

## 使用方法

### 方法一：使用主类（推荐）

```javascript
// 导入主类
import PaperFoldingTest from './paperfolding/index.js';

// 初始化测试
const test = new PaperFoldingTest();
```

### 方法二：按需导入模块

```javascript
// 导入特定模块
import { Config, ImageCache, Filter } from './paperfolding/index.js';

// 使用特定功能
const config = new Config();
const cache = new ImageCache();
const filter = new Filter();
```

### 方法三：导入单个模块

```javascript
// 直接导入单个模块
import { Config } from './paperfolding/Config.js';
import { ImageCache } from './paperfolding/ImageCache.js';
```

## 模块依赖关系

```
PaperFoldingTest (主类)
├── Config
├── ImageCache
├── WenjuanxingUploader
├── Downloader
├── Filter
│   ├── Config
│   └── RandomUtils
└── RandomUtils
```

## 特性

- **模块化设计** - 每个功能独立封装，便于维护和扩展
- **ES6模块** - 使用现代JavaScript模块系统
- **依赖注入** - 模块间通过构造函数注入依赖
- **配置集中** - 所有配置统一管理
- **缓存优化** - 智能图片缓存机制
- **本地存储** - 答案和题目状态持久化
- **错误处理** - 完善的错误处理和用户反馈

## 兼容性

- 支持现代浏览器（ES6+）
- 需要支持ES6模块的环境
- 依赖外部库：html2canvas、JSZip

## 注意事项

1. 原始 `paperfolding.js` 文件保持不变
2. 新的模块化结构完全独立
3. 可以根据需要选择使用原始文件或模块化版本
4. 模块化版本提供了更好的代码组织和维护性