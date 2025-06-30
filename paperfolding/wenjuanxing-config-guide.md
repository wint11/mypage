# 问卷星上传功能配置指南

## 概述
折纸游戏现在支持将测试结果上传到问卷星平台。通过iframe嵌入和自动填表的方式，将用户的测试结果自动提交到问卷星平台，支持以下数据：
- 总题数
- 正确答案数
- 准确率
- 测试时间戳
- 测试类型和版本
- 详细答题结果

## 工作原理

1. **iframe嵌入**：创建隐藏的iframe加载问卷星页面
2. **自动填表**：通过DOM操作自动填写表单字段
3. **智能匹配**：根据字段名称、ID、placeholder等自动匹配数据
4. **自动提交**：填写完成后自动点击提交按钮

## 配置步骤

### 1. 启用功能

在 `paperfolding.js` 中找到 `wenjuanxingConfig` 配置对象，设置：

```javascript
wenjuanxingConfig: {
  enabled: true, // 启用上传功能
  activityId: 'h3Bs6Ay', // 问卷星活动ID
  debugMode: false, // 是否显示iframe用于调试
  // ... 其他配置
}
```

### 2. 获取问卷星活动ID

从用户提供的问卷星嵌入代码中提取活动ID：

```html
<script type='text/javascript' src='https://www.wjx.cn/handler/jqemed.ashx?activity=h3Bs6Ay&width=750&source=iframe'></script>
```

在这个例子中，活动ID是 `h3Bs6Ay`。

### 3. 配置参数说明

```javascript
wenjuanxingConfig: {
  enabled: true, // 是否启用问卷星上传功能
  formUrl: 'https://www.wjx.cn/handler/jqemed.ashx?activity=h3Bs6Ay', // 自动生成的表单URL
  activityId: 'h3Bs6Ay', // 从嵌入代码中提取的活动ID
  debugMode: false, // 设置为true可以显示iframe观察填表过程
  // ...
}
```

### 4. 调试模式

如果需要观察自动填表过程，可以启用调试模式：

```javascript
wenjuanxingConfig: {
  // ... 其他配置
  debugMode: true // 显示iframe窗口
}
```

启用调试模式后，iframe将显示在页面上，你可以观察自动填表的整个过程。

### 3. 字段映射说明

系统会自动尝试匹配以下字段到问卷星表单：

```javascript
// 自动字段映射
const fieldMappings = {
  // 总题数
  'q1': data.totalQuestions.toString(),
  'totalQuestions': data.totalQuestions.toString(),
  '总题数': data.totalQuestions.toString(),
  
  // 正确答案数
  'q2': data.correctAnswers.toString(),
  'correctAnswers': data.correctAnswers.toString(),
  '正确答案数': data.correctAnswers.toString(),
  
  // 准确率
  'q3': data.accuracy + '%',
  'accuracy': data.accuracy + '%',
  '准确率': data.accuracy + '%',
  
  // 测试类型
  'q4': data.testType,
  'testType': data.testType,
  '测试类型': data.testType,
  
  // 版本
  'q5': data.version,
  'version': data.version,
  '版本': data.version,
  
  // 详细结果
  'q6': JSON.stringify(data.details),
  'details': JSON.stringify(data.details),
  '详细结果': JSON.stringify(data.details)
};
```

系统会根据以下规则自动匹配字段：
1. **精确匹配**：字段名称或ID完全匹配
2. **模糊匹配**：字段名称包含关键词
3. **占位符匹配**：根据placeholder文本匹配
4. **索引匹配**：按照字段出现顺序分配数据

### 5. 使用方法

配置完成后，使用非常简单：

1. 用户完成折纸测试
2. 点击"上传到问卷星"按钮
3. 系统自动创建iframe并填写表单
4. 数据自动提交到问卷星

### 6. 调试和监控

#### 启用调试模式
```javascript
wenjuanxingConfig: {
  // ... 其他配置
  debugMode: true // 显示iframe窗口观察填表过程
}
```

#### 查看控制台日志
系统会输出详细的调试信息：
- iframe加载状态
- 表单字段发现情况
- 数据填写过程
- 提交结果

### 7. 注意事项

#### 跨域限制
- 由于浏览器安全策略，某些操作可能受到跨域限制
- 如果遇到跨域问题，请确保问卷星允许iframe嵌入
- 调试模式可以帮助观察实际的填表过程

#### 表单兼容性
- 系统会自动适配不同的问卷星表单结构
- 支持文本框、数字框、文本域等常见表单元素
- 自动处理单选框和复选框

#### 数据格式
系统会自动提交以下数据：
- 总题数（数字）
- 正确答案数（数字）
- 准确率（百分比）
- 测试类型（文本）
- 版本信息（文本）
- 详细结果（JSON字符串）

## 故障排除

### 常见问题

**问题1：iframe无法加载**
- 检查活动ID是否正确
- 确认问卷星链接是否有效
- 检查网络连接

**问题2：表单字段未找到**
- 启用调试模式观察iframe内容
- 检查问卷星表单是否包含输入字段
- 确认表单加载完成

**问题3：数据未正确填写**
- 查看控制台日志了解字段匹配情况
- 检查字段名称和类型
- 确认数据格式正确

### 调试建议

1. **启用调试模式**：设置 `debugMode: true` 观察填表过程
2. **查看控制台**：观察详细的日志输出
3. **检查网络**：确认iframe能够正常加载问卷星页面

## 安全注意事项

1. **不要在代码中硬编码敏感信息**
2. **定期检查问卷星后台的数据安全设置**
3. **考虑添加数据加密或签名验证**

## 完整配置示例

```javascript
// 在 paperfolding.js 中的完整配置
this.wenjuanxingConfig = {
  enabled: true, // 启用上传功能
  formUrl: 'https://www.wjx.cn/handler/jqemed.ashx?activity=h3Bs6Ay',
  activityId: 'h3Bs6Ay', // 从嵌入代码中提取
  debugMode: false, // 生产环境设为false，调试时设为true
  fieldMapping: {
    // 保持默认配置即可，系统会自动匹配
    totalQuestions: 'totalQuestions',
    correctAnswers: 'correctAnswers',
    accuracy: 'accuracy',
    timestamp: 'timestamp',
    testType: 'testType',
    version: 'version',
    testData: 'testData'
  }
};
```

---

**注意**：问卷星的API和表单结构可能会发生变化，请根据最新的官方文档进行调整。