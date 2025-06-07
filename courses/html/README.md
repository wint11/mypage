# HTML模板重构说明

## 概述

为了消除HTML文件中的重复代码，我们将原来的7个独立HTML文件重构为一个统一的模板系统。

## 新的文件结构

### 核心文件
- `course.html` - 统一的HTML模板
- `../js/course-loader.js` - 动态课程加载器

### 原有文件（可选择保留或删除）
- `caozuoxitong.html`
- `fubian.html`
- `gailvlun.html`
- `gaodengshuxue.html`
- `lisuan.html`
- `weifenfangcheng.html`
- `xianxingdaishu.html`

## 工作原理

1. **统一入口**: 所有课程都通过 `course.html` 访问
2. **URL参数**: 通过 `?course=课程ID` 参数区分不同课程
3. **动态加载**: `course-loader.js` 根据URL参数动态设置页面标题、侧边栏标题并加载对应的JS脚本

## 课程ID映射

| 课程名称 | 课程ID | 访问URL |
|---------|--------|--------|
| 高等数学 | gaodengshuxue | course.html?course=gaodengshuxue |
| 线性代数 | xianxingdaishu | course.html?course=xianxingdaishu |
| 概率论 | gailvlun | course.html?course=gailvlun |
| 离散数学 | lisuan | course.html?course=lisuan |
| 复变函数 | fubian | course.html?course=fubian |
| 微分方程 | weifenfangcheng | course.html?course=weifenfangcheng |
| 操作系统 | caozuoxitong | course.html?course=caozuoxitong |

## 配置更新

`../../js/course-config.js` 已更新为指向新的模板系统：

```javascript
const courseMap = {
  "course1": "../courses/html/course.html?course=gaodengshuxue",
  "course2": "../courses/html/course.html?course=xianxingdaishu",
  // ... 其他课程
};
```

## 优势

1. **消除重复**: 7个几乎相同的HTML文件合并为1个模板
2. **易于维护**: 只需修改一个模板文件即可影响所有课程
3. **动态配置**: 通过配置文件轻松添加新课程
4. **向后兼容**: 原有的JS脚本无需修改

## 迁移建议

1. **测试**: 确认所有课程在新模板下正常工作
2. **备份**: 保留原有HTML文件作为备份
3. **清理**: 测试无误后可删除原有的重复HTML文件

## 添加新课程

要添加新课程，只需：

1. 在 `course-loader.js` 的 `courseConfig` 中添加新课程配置
2. 在 `course-config.js` 中添加新的映射
3. 创建对应的JS脚本文件

无需创建新的HTML文件！