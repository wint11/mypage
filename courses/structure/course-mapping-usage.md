# 统一课程配置系统使用说明

## 概述

为了解决课程配置分散在多个文件中的问题，我们创建了统一的课程配置系统。现在所有课程的映射关系都集中在 `course-mapping.json` 文件中管理。

## 文件结构

```
courses/
├── structure/
│   ├── course-mapping.json          # 统一课程配置文件
│   └── course-mapping-usage.md      # 本使用说明
├── js/
│   ├── course-mapping-loader.js     # 课程映射加载器
│   ├── course-loader.js             # 已更新使用统一配置
│   ├── CourseConfig.js              # 已更新使用统一配置
│   └── SimulateTest.js              # 已更新使用统一配置
```

## 核心文件说明

### 1. course-mapping.json

统一的课程配置文件，包含：
- `courses`: 完整的课程信息对象
- `mappings`: 各种映射关系（文件夹↔ID、文件夹↔名称等）

### 2. course-mapping-loader.js

课程映射加载器，提供以下功能：
- 异步加载课程配置
- 提供各种映射关系的获取方法
- 支持动态添加新课程
- 提供后备方案确保系统稳定性

## 如何添加新课程

### 方法一：直接修改 course-mapping.json

1. 在 `courses` 对象中添加新课程：
```json
"新课程文件夹名": {
  "id": "course11",
  "name": "新课程名称",
  "folder": "新课程文件夹名"
}
```

2. 在 `mappings` 的三个对象中添加对应映射：
```json
"folderToId": {
  "新课程文件夹名": "course11"
},
"idToFolder": {
  "course11": "新课程文件夹名"
},
"folderToName": {
  "新课程文件夹名": "新课程名称"
}
```

### 方法二：使用 JavaScript API 动态添加

```javascript
import { addNewCourse } from './course-mapping-loader.js';

// 添加新课程（会自动分配下一个可用的课程ID）
const success = await addNewCourse('新课程文件夹名', '新课程名称');
if (success) {
    console.log('课程添加成功');
}
```

## API 使用示例

### 基本用法

```javascript
import {
    getFolderToIdMapping,
    getIdToFolderMapping,
    getFolderToNameMapping,
    getAllCourses,
    getCourseByFolder,
    getCourseById
} from './course-mapping-loader.js';

// 获取文件夹名到课程ID的映射
const folderToId = await getFolderToIdMapping();
console.log(folderToId['gaodengshuxue']); // 输出: "course1"

// 获取课程ID到文件夹名的映射
const idToFolder = await getIdToFolderMapping();
console.log(idToFolder['course1']); // 输出: "gaodengshuxue"

// 获取文件夹名到课程名称的映射
const folderToName = await getFolderToNameMapping();
console.log(folderToName['gaodengshuxue']); // 输出: "高等数学"

// 获取所有课程信息
const allCourses = await getAllCourses();
console.log(allCourses);

// 根据文件夹名获取课程信息
const course = await getCourseByFolder('gaodengshuxue');
console.log(course); // 输出: { id: "course1", name: "高等数学", folder: "gaodengshuxue" }

// 根据课程ID获取课程信息
const courseById = await getCourseById('course1');
console.log(courseById); // 输出: { folder: "gaodengshuxue", id: "course1", name: "高等数学" }
```

### 在浏览器中使用

```javascript
// 课程映射加载器会自动添加到 window 对象
const folderToName = await window.courseMapping.getFolderToNameMapping();
console.log(folderToName['gaodengshuxue']);

// 添加新课程
const success = await window.courseMapping.addNewCourse('新课程', '新课程名称');
```

## 迁移说明

### 已更新的文件

1. **course-loader.js**
   - 移除硬编码的 `courseIdMapping`
   - 使用 `getIdToFolderMapping()` 异步加载映射

2. **CourseConfig.js**
   - 移除 `getCourseInfoByFolder` 中的硬编码映射
   - 使用 `getFolderToIdMapping()` 异步加载映射

3. **SimulateTest.js**
   - 移除硬编码的 `subjects` 对象
   - 使用 `getFolderToNameMapping()` 获取课程名称

### 向后兼容性

- 所有现有的API调用方式保持不变
- 如果统一配置文件加载失败，系统会自动使用内置的默认配置
- 现有课程的ID和文件夹名映射关系保持不变

## 优势

1. **集中管理**：所有课程配置集中在一个文件中
2. **易于维护**：添加新课程只需修改一个文件
3. **减少错误**：避免多处修改导致的不一致
4. **动态扩展**：支持运行时动态添加课程
5. **向后兼容**：不影响现有代码的使用
6. **容错性强**：提供默认配置作为后备方案

## 注意事项

1. 添加新课程时，确保课程ID的唯一性
2. 文件夹名应与实际的课程数据文件夹名一致
3. 修改配置文件后，建议清除浏览器缓存以确保更新生效
4. 在生产环境中，建议备份 `course-mapping.json` 文件

## 当前支持的课程

| 课程ID | 文件夹名 | 课程名称 |
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

## 故障排除

### 常见问题

1. **课程配置加载失败**
   - 检查 `course-mapping.json` 文件是否存在
   - 检查JSON格式是否正确
   - 查看浏览器控制台的错误信息

2. **新添加的课程不显示**
   - 确认已正确添加到配置文件中
   - 清除浏览器缓存
   - 检查文件夹名和课程ID是否正确

3. **API调用返回null**
   - 确认传入的参数（文件夹名或课程ID）是否正确
   - 检查配置文件中是否包含对应的映射关系

### 调试方法

```javascript
// 检查配置是否正确加载
const loader = window.courseMappingLoader;
const data = await loader.ensureLoaded();
console.log('配置数据:', data);

// 检查特定映射
const mapping = await getFolderToNameMapping();
console.log('文件夹到名称映射:', mapping);
```