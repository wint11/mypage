# 课程JavaScript模块化重构说明

## 概述

本次重构将原本分散在多个课程JavaScript文件中的重复代码进行了模块化整合，消除了代码重复，提高了可维护性和扩展性。

## 新的文件结构

### 核心模块

1. **CourseConfig.js** - 课程配置中心
   - 存储所有课程的配置信息（标题、主题、知识点、prompt等）
   - 提供 `getCourseConfig(courseId)` 函数获取课程配置

2. **ExerciseManager.js** - 练习管理模块
   - 新增 `ExerciseManager` 类，支持多课程独立管理
   - 保留原有的全局函数以保持向后兼容
   - 每个课程的练习数据独立存储在localStorage中

3. **ExerciseGenerator.js** - 题目生成模块
   - 支持根据 `courseId` 动态获取对应的prompt
   - 使用 `getCourseConfig()` 获取课程配置

4. **ExerciseRenderer.js** - 题目渲染模块
   - 更新为支持传入 `exerciseManager` 实例
   - 移除对全局状态的依赖

5. **UI.js** - 用户界面模块
   - 增强了按钮状态管理
   - 支持更灵活的回调函数配置

6. **DocxExporter.js** - Word文档导出模块
   - 支持根据课程配置动态设置文档标题
   - 接受 `courseId` 参数

7. **course-template.js** - 通用课程模板
   - 统一的课程初始化逻辑
   - 自动检测课程ID（从URL参数或文件名）
   - 整合所有模块的功能

### 模板系统

8. **course.html** - 通用HTML模板
   - 替代所有重复的课程HTML文件
   - 通过URL参数动态加载不同课程

9. **course-loader.js** - 课程加载器
   - 根据URL参数动态设置页面标题和侧边栏
   - 加载通用课程模板脚本

## 使用方法

### 1. 添加新课程

在 `CourseConfig.js` 中添加新的课程配置：

```javascript
export const courseConfigs = {
    // 现有课程...
    'new_course': {
        subject: '新课程',
        title: '新课程题目集',
        topics: ['主题1', '主题2'],
        knowledgePoints: ['知识点1', '知识点2'],
        prompt: '生成新课程题目的prompt...'
    }
};
```

在 `course-config.js` 中添加课程链接：

```javascript
const courseMap = {
    // 现有课程...
    'new_course': 'courses/html/course.html?course=new_course'
};
```

### 2. 课程访问方式

- **新方式**：`courses/html/course.html?course=课程ID`
- **兼容旧方式**：原有的HTML文件仍然可用

### 3. 模块导入示例

```javascript
import { ExerciseManager } from './ExerciseManager.js';
import { getCourseConfig } from './CourseConfig.js';
import { initCourse } from './course-template.js';

// 初始化特定课程
const exerciseManager = new ExerciseManager('gaodengshuxue');
const config = getCourseConfig('gaodengshuxue');

// 或使用通用模板
initCourse('gaodengshuxue');
```

## 重构优势

1. **消除代码重复**：原本7个课程文件中的重复代码被整合到统一模块中
2. **提高可维护性**：修改功能只需更新对应模块，自动应用到所有课程
3. **增强扩展性**：添加新课程只需配置，无需编写重复代码
4. **模块化设计**：每个模块职责单一，便于测试和调试
5. **向后兼容**：保留原有接口，不影响现有功能
6. **独立存储**：每个课程的练习数据独立存储，避免冲突

## 迁移建议

1. **保留原文件**：暂时保留原有的课程JavaScript文件作为备份
2. **逐步迁移**：可以逐个课程测试新系统的稳定性
3. **数据迁移**：如需要，可以编写脚本将旧的localStorage数据迁移到新格式
4. **测试验证**：确保所有课程功能正常后，可考虑删除重复文件

## 注意事项

- 新系统使用课程ID作为localStorage的key前缀，确保数据隔离
- URL参数 `course` 用于指定课程ID
- 所有模块都支持ES6模块导入/导出
- 保持了原有的用户界面和交互逻辑