# 图片筛选和答案生成工具

## 概述

这个工具用于从大量图片中智能筛选指定数量的图片，并生成对应的答案文件。主要特点：

- **智能筛选**：按形状类型均匀分布选择图片
- **答案匹配**：确保每张筛选的图片都有对应的正确答案
- **重命名规范**：将复杂的原始文件名重命名为简洁格式
- **数据验证**：提供完整的验证机制确保数据质量

## 文件结构

```
paperfolding_new/
├── images_data/           # 原始图片文件夹
├── images_selected/       # 筛选后的图片文件夹
├── answer.jsonl          # 原始答案文件
├── answer_selected.jsonl # 筛选后的答案文件
├── image_selector.js     # 主要筛选脚本
├── verify_results.js     # 验证脚本
└── README.md            # 说明文档
```

## 使用方法

### 1. 运行图片筛选

```bash
node image_selector.js
```

这个脚本会：
- 从 `images_data` 文件夹中筛选1000张图片
- 每种形状（circle, hexagon, house, rectangle, square）各选择200张
- 将筛选的图片重命名并复制到 `images_selected` 文件夹
- 生成对应的 `answer_selected.jsonl` 答案文件

### 2. 验证结果

```bash
node verify_results.js
```

这个脚本会验证：
- 图片数量和答案数量是否一致
- 每种形状的分布是否正确
- 所有答案条目对应的图片文件是否存在

## 配置说明

在 `image_selector.js` 中可以修改以下配置：

```javascript
const config = {
    sourceDir: path.join(__dirname, 'images_data'),     // 原始图片目录
    selectedDir: path.join(__dirname, 'images_selected'), // 输出图片目录
    answerFile: path.join(__dirname, 'answer.jsonl'),    // 原始答案文件
    outputAnswerFile: path.join(__dirname, 'answer_selected.jsonl'), // 输出答案文件
    targetCount: 1000,  // 总目标数量
    shapeCounts: {      // 每种形状的数量
        circle: 200,
        hexagon: 200,
        house: 200,
        rectangle: 200,
        square: 200
    }
};
```

## 输出格式

### 图片文件命名
- 原始：`circle-id_0-fold_1-sample_0-candidate_4-answ_B.png`
- 重命名：`circle_001.png`

### 答案文件格式
```json
{"image":"circle_001.png","answer":"B"}
{"image":"circle_002.png","answer":"A"}
...
```

## 技术特点

1. **原子性操作**：图片选择和答案匹配在同一流程中完成
2. **错误处理**：完善的错误处理和警告机制
3. **数据完整性**：确保图片和答案的完美对应
4. **可验证性**：提供验证脚本确保数据质量
5. **简化流程**：移除了不必要的备份操作，提高效率

## 注意事项

- 确保 `images_data` 文件夹中有足够的图片文件
- 确保 `answer.jsonl` 文件存在且格式正确
- 运行前会自动创建必要的输出目录
- 每次运行会覆盖之前的筛选结果