# 课程配置系统使用说明

## 概述

新的课程配置系统已经重构，现在只需要维护一个简单的课程名称映射表，就可以自动生成所有课程的URL映射。

## 主要改进

### 之前的问题
- 每添加一个新课程，都需要手动在 `courseMap` 中添加一行完整的URL配置
- 代码重复，维护困难
- 容易出错

### 现在的解决方案
- 只需要在 `courseNameMap` 中添加课程ID和课程名称的映射
- 系统自动生成完整的URL配置
- 提供了丰富的辅助函数

## 使用方法

### 1. 添加新课程

**方法一：直接修改映射表**
```javascript
// 在 courseNameMap 中添加新课程
const courseNameMap = {
  "course1": "gaodengshuxue",
  "course2": "xianxingdaishu",
  // ... 其他课程
  "course11": "xinzengkecheng",  // 新增课程
};
```

**方法二：使用辅助函数**
```javascript
// 动态添加新课程
window.courseConfig.addCourse("course11", "xinzengkecheng");
```

### 2. 获取课程信息

```javascript
// 获取所有课程ID列表
const allCourses = window.courseConfig.getAllCourses();
console.log(allCourses); // ["course1", "course2", ...]

// 根据课程名称获取课程ID
const courseId = window.courseConfig.getCourseIdByName("gaodengshuxue");
console.log(courseId); // "course1"

// 获取课程URL映射
const courseMap = window.courseConfig.courseMap;
console.log(courseMap["course1"]); // "../courses/html/course.html?course=gaodengshuxue"

// 获取课程名称映射
const courseNameMap = window.courseConfig.courseNameMap;
console.log(courseNameMap["course1"]); // "gaodengshuxue"
```

### 3. 重新生成映射

```javascript
// 如果需要重新生成课程映射（通常不需要手动调用）
const newCourseMap = window.courseConfig.generateCourseMap();
```

## 当前支持的课程

| 课程ID | 课程名称 | 中文名称 |
|--------|----------|----------|
| course1 | gaodengshuxue | 高等数学 |
| course2 | xianxingdaishu | 线性代数 |
| course3 | gailvlun | 概率论 |
| course4 | lisuan | 离散数学 |
| course5 | fubian | 复变函数 |
| course6 | weifenfangcheng | 微分方程 |
| course7 | caozuoxitong | 操作系统 |
| course8 | shujujiegou | 数据结构与算法 |
| course9 | jisuanjiwangluo | 计算机网络 |
| course10 | shujuku | 数据库系统 |

## 添加新课程的完整流程

1. **准备课程资料**
   - 在 `courses/data/` 目录下创建课程文件夹（如：`xinzengkecheng`）
   - 添加相关的知识点文件（.md格式）

2. **更新课程配置**
   - 在 `js/course-config.js` 的 `courseNameMap` 中添加新课程映射
   - 或者使用 `addCourse()` 函数动态添加

3. **更新其他配置文件**
   - 在 `views/data/courses.json` 中添加课程信息
   - 在 `courses/js/CourseConfig.js` 中添加课程配置

4. **测试**
   - 确保新课程可以正常访问
   - 检查课程页面是否正常加载

## 注意事项

1. **课程名称规范**：课程名称应该使用拼音小写，不包含特殊字符
2. **课程ID规范**：课程ID应该按照 `courseN` 的格式，其中N是递增的数字
3. **文件夹对应**：课程名称应该与 `courses/data/` 目录下的文件夹名称一致
4. **向后兼容**：现有的课程配置保持不变，确保系统稳定运行

## 优势

1. **简化维护**：只需要维护一个简单的映射表
2. **减少错误**：自动生成URL，避免手动输入错误
3. **易于扩展**：添加新课程只需要一行代码
4. **功能丰富**：提供多种辅助函数，方便其他模块使用
5. **向后兼容**：保持原有的 `courseMap` 接口不变