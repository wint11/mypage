# 纸折叠测试模块化版本使用说明

## 文件修改说明

已将 `views/paperfolding.html` 文件修改为使用模块化版本：

### 原始版本
```html
<script src="js/paperfolding.js"></script>
```

### 模块化版本
```html
<!-- 使用模块化版本 -->
<script type="module">
  import PaperFoldingTest from './js/paperfolding/index.js';
  
  // 等待DOM加载完成后初始化
  document.addEventListener('DOMContentLoaded', () => {
    // 初始化纸折叠测试
    const paperFoldingTest = new PaperFoldingTest();
    
    // 将实例暴露到全局作用域以便调试
    window.paperFoldingTest = paperFoldingTest;
    
    // 暴露调试方法
    window.checkCacheStatus = () => paperFoldingTest.checkCacheStatus();
    window.clearImageCache = () => paperFoldingTest.clearImageCache();
    
    console.log('纸折叠测试模块化版本已初始化');
  });
</script>
```

## 功能特性

### 1. 模块化架构
- **Config.js** - 配置管理
- **ImageCache.js** - 图片缓存
- **WenjuanxingUploader.js** - 问卷星上传
- **Downloader.js** - 下载功能
- **Filter.js** - 筛选功能
- **RandomUtils.js** - 随机工具
- **PaperFoldingTest.js** - 主测试类

### 2. 调试功能
在浏览器控制台中可以使用以下调试命令：

```javascript
// 检查缓存状态
checkCacheStatus()

// 清除图片缓存
clearImageCache()

// 访问主实例
window.paperFoldingTest
```

### 3. 兼容性
- 需要支持ES6模块的现代浏览器
- 保持与原版本完全相同的功能
- 所有UI交互和数据处理逻辑不变

## 验证方法

1. **功能验证**
   - 打开 `views/paperfolding.html`
   - 检查题目是否正常加载
   - 测试筛选、导航、下载等功能
   - 验证答题和提交流程

2. **控制台验证**
   - 打开浏览器开发者工具
   - 查看控制台是否显示 "纸折叠测试模块化版本已初始化"
   - 测试调试命令是否正常工作

3. **性能验证**
   - 检查图片缓存是否正常工作
   - 验证页面加载速度
   - 测试内存使用情况

## 回退方案

如果需要回退到原始版本，只需将 HTML 文件中的 script 标签改回：

```html
<script src="js/paperfolding.js"></script>
```

原始的 `paperfolding.js` 文件保持完全不变，可以随时切换使用。

## 注意事项

1. **服务器要求**：由于使用了ES6模块，需要通过HTTP服务器访问，不能直接打开HTML文件

2. **路径问题**：确保所有模块文件路径正确，特别是相对路径的引用

3. **依赖库**：html2canvas 和 JSZip 库仍然通过CDN加载，确保网络连接正常

4. **浏览器支持**：建议使用Chrome、Firefox、Safari等现代浏览器