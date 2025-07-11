# 视觉推理任务正确率分析报告

## 总体统计结果

| 类别 | 正确数 | 总数 | 正确率 |
|------|--------|------|--------|
| fold_1 | 1142 | 3904 | 29.25% |
| fold_2 | 2125 | 6400 | 33.20% |
| fold_3 | 2004 | 6400 | 31.31% |
| others | 654 | 2496 | 26.20% |

## 各模型详细结果

### 模型排名（按总体正确率）

| 排名 | 模型 | 总正确率 | 正确数/总数 |
|------|------|----------|-------------|
| 1 | doubao-seed-1-6-flash-250615 epoch1 | 41.67% | 250/600 |
| 2 | GLM-4.1V-Thinking-Flash epoch3 | 41.67% | 250/600 |
| 3 | GLM-4.1V-Thinking-Flash epoch2 | 41% | 246/600 |
| 4 | GLM-4.1V-Thinking-Flash epoch1 | 40.67% | 244/600 |
| 5 | doubao-seed-1-6-flash-250615 epoch2 | 40.17% | 241/600 |
| 6 | doubao-seed-1-6 epoch1 | 40% | 240/600 |
| 7 | doubao-seed-1-6-flash-250615 epoch3 | 39.83% | 239/600 |
| 8 | qwen2-vl-72b-instruct epoch2 | 34.67% | 208/600 |
| 9 | qwen2-vl-72b-instruct epoch3 | 33.67% | 202/600 |
| 10 | claude-3-7-sonnet-thinking epoch2 | 32.33% | 194/600 |
| 11 | qwen2.5-vl-72b-instruct epoch2 | 31.67% | 190/600 |
| 12 | qwen2.5-vl-72b-instruct epoch1 | 31.5% | 189/600 |
| 13 | qwen2.5-vl-72b-instruct epoch4 | 31.5% | 189/600 |
| 14 | qwen2.5-vl-72b-instruct epoch3 | 31.33% | 188/600 |
| 15 | claude-3-7-sonnet-thinking epoch3 | 31.17% | 187/600 |
| 16 | gemini-2.5-flash epoch2 | 29.83% | 179/600 |
| 17 | GPT-4o epoch2 | 29.83% | 179/600 |
| 18 | gemini-2.5-flash epoch1 | 29.5% | 177/600 |
| 19 | GPT-4o epoch1 | 28.5% | 171/600 |
| 20 | gemini-2.5-flash epoch3 | 27.67% | 166/600 |
| 21 | GPT-4o-mini epoch2 | 26.83% | 161/600 |
| 22 | qwen2-vl-72b-instruct epoch1 | 26.83% | 161/600 |
| 23 | claude-3-7-sonnet-thinking epoch1 | 26.5% | 159/600 |
| 24 | GPT-4o-mini epoch3 | 26.5% | 159/600 |
| 25 | GPT-4o epoch3 | 25.33% | 152/600 |
| 26 | GLM-4-plus epoch3 | 24.67% | 148/600 |
| 27 | GLM-4-plus epoch1 | 24.33% | 146/600 |
| 28 | GLM-4-plus epoch2 | 24.33% | 146/600 |
| 29 | GPT-4o-mini epoch1 | 24.33% | 146/600 |
| 30 | GLM-Z1-Airx epoch2 | 23.83% | 143/600 |
| 31 | GLM-Z1-Airx epoch3 | 23.33% | 140/600 |
| 32 | GLM-Z1-Airx epoch1 | 22.5% | 135/600 |

### 各类别最佳表现模型

| 类别 | 最佳模型 | 正确率 |
|------|----------|--------|
| fold_1 | doubao-seed-1-6-flash-250615 epoch2 | 41.8% |
| fold_2 | GLM-4.1V-Thinking-Flash epoch1 | 47% |
| fold_3 | GLM-4.1V-Thinking-Flash epoch3 | 48% |
| others | doubao-seed-1-6 epoch1 | 35.9% |

## 详细数据表格

| 模型 | fold_1 | fold_2 | fold_3 | others | 总体 |
|------|--------|--------|--------|--------|------|
| doubao-seed-1-6-flash-250615 epoch1 | 40.98% | 45.50% | 43.50% | 28.21% | 41.67% |
| GLM-4.1V-Thinking-Flash epoch3 | 37.70% | 45.50% | 48.00% | 21.79% | 41.67% |
| GLM-4.1V-Thinking-Flash epoch2 | 36.89% | 46.50% | 45.00% | 23.08% | 41% |
| GLM-4.1V-Thinking-Flash epoch1 | 34.43% | 47.00% | 44.50% | 24.36% | 40.67% |
| doubao-seed-1-6-flash-250615 epoch2 | 41.80% | 41.50% | 41.00% | 32.05% | 40.17% |
| doubao-seed-1-6 epoch1 | 31.97% | 42.50% | 44.00% | 35.90% | 40% |
| doubao-seed-1-6-flash-250615 epoch3 | 36.89% | 41.00% | 45.00% | 28.21% | 39.83% |
| qwen2-vl-72b-instruct epoch2 | 30.33% | 42.50% | 34.00% | 23.08% | 34.67% |
| qwen2-vl-72b-instruct epoch3 | 33.61% | 39.00% | 31.00% | 26.92% | 33.67% |
| claude-3-7-sonnet-thinking epoch2 | 23.77% | 37.50% | 33.00% | 30.77% | 32.33% |
| qwen2.5-vl-72b-instruct epoch2 | 33.61% | 35.00% | 31.00% | 21.79% | 31.67% |
| qwen2.5-vl-72b-instruct epoch1 | 32.79% | 35.00% | 31.00% | 21.79% | 31.5% |
| qwen2.5-vl-72b-instruct epoch4 | 32.79% | 35.00% | 31.00% | 21.79% | 31.5% |
| qwen2.5-vl-72b-instruct epoch3 | 32.79% | 34.50% | 31.00% | 21.79% | 31.33% |
| claude-3-7-sonnet-thinking epoch3 | 31.97% | 33.00% | 31.00% | 25.64% | 31.17% |
| gemini-2.5-flash epoch2 | 27.87% | 34.00% | 27.50% | 28.21% | 29.83% |
| GPT-4o epoch2 | 31.97% | 31.00% | 28.50% | 26.92% | 29.83% |
| gemini-2.5-flash epoch1 | 26.23% | 31.50% | 28.50% | 32.05% | 29.5% |
| GPT-4o epoch1 | 29.51% | 29.00% | 26.00% | 32.05% | 28.5% |
| gemini-2.5-flash epoch3 | 27.05% | 31.50% | 24.00% | 28.21% | 27.67% |
| GPT-4o-mini epoch2 | 30.33% | 29.00% | 25.50% | 19.23% | 26.83% |
| qwen2-vl-72b-instruct epoch1 | 26.23% | 26.00% | 29.00% | 24.36% | 26.83% |
| claude-3-7-sonnet-thinking epoch1 | 26.23% | 27.50% | 26.00% | 25.64% | 26.5% |
| GPT-4o-mini epoch3 | 27.87% | 26.50% | 29.00% | 17.95% | 26.5% |
| GPT-4o epoch3 | 23.77% | 26.00% | 25.00% | 26.92% | 25.33% |
| GLM-4-plus epoch3 | 20.49% | 25.00% | 24.00% | 32.05% | 24.67% |
| GLM-4-plus epoch1 | 19.67% | 24.50% | 24.50% | 30.77% | 24.33% |
| GLM-4-plus epoch2 | 19.67% | 24.50% | 24.50% | 30.77% | 24.33% |
| GPT-4o-mini epoch1 | 21.31% | 25.50% | 25.00% | 24.36% | 24.33% |
| GLM-Z1-Airx epoch2 | 24.59% | 26.00% | 22.50% | 20.51% | 23.83% |
| GLM-Z1-Airx epoch3 | 23.77% | 21.00% | 26.00% | 21.79% | 23.33% |
| GLM-Z1-Airx epoch1 | 17.21% | 23.00% | 22.50% | 29.49% | 22.5% |

## 统计分析

### 各类别平均正确率

- **fold_1**: 29.25%
- **fold_2**: 33.20%
- **fold_3**: 31.31%
- **others**: 26.20%

### 关键发现

- **表现最好的类别**: fold_2 (平均正确率: 33.20%)
- **表现最差的类别**: others (平均正确率: 26.20%)
- **总体最佳模型**: doubao-seed-1-6-flash-250615 epoch1 (41.67%)
- **总体最差模型**: GLM-Z1-Airx epoch1 (22.5%)
