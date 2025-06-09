// CourseConfig.js
// 所有课程的配置信息，包括prompt、标题等
// 基于 views/data/courses.json 的课程数据结构

import { getFolderToIdMapping } from './course-mapping-loader.js';

// 课程数据缓存
let coursesJsonData = null;
let folderToIdMapping = null;

// 从courses.json加载课程数据
export async function loadCoursesJsonData() {
    if (coursesJsonData) return coursesJsonData;
    
    try {
        const response = await fetch('../../views/data/courses.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        coursesJsonData = await response.json();
        console.log(coursesJsonData);
        console.log('CourseConfig: 课程JSON数据加载成功');
        return coursesJsonData;
    } catch (error) {
        console.error('CourseConfig: 加载courses.json失败:', error);
        return null;
    }
}

// 根据课程ID获取课程信息
export function getCourseInfoById(courseId) {
    if (!coursesJsonData) return null;
    return coursesJsonData.courses.find(course => course.id === courseId);
}

// 根据文件夹名获取课程信息
export async function getCourseInfoByFolder(folderName) {
    // 加载映射数据
    if (!folderToIdMapping) {
        folderToIdMapping = await getFolderToIdMapping();
    }
    
    const courseId = folderToIdMapping[folderName];
    return courseId ? getCourseInfoById(courseId) : null;
}

export const courseConfigs = {
    gaodengshuxue: {
        title: '高等数学题目集',
        subject: '高等数学',
        knowledgePoints: [
            '函数与极限',
            '导数与微分',
            '积分学',
            '微分方程',
            '级数理论',
            '多元函数微积分'
        ],
        prompt: `
请生成一道高等数学单选题，可从以下几个知识点方向出发：
- 函数与极限
- 导数与微分
- 积分学
- 微分方程
- 级数理论
- 多元函数微积分

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

求函数 $f(x) = x^2 + 2x + 1$ 在点 $x = 1$ 处的导数值为（ ）

- A. 2
- B. 3
- C. 4
- D. 5

【正确答案：2】

解析：$f'(x) = 2x + 2$，所以 $f'(1) = 2 \\cdot 1 + 2 = 4$。
        `
    },
    
    xianxingdaishu: {
        title: '线性代数题目集',
        subject: '线性代数',
        knowledgePoints: [
            '行列式与矩阵基础',
            '向量空间与线性变换',
            '特征值与特征向量',
            '线性方程组的解法',
            '二次型'
        ],
        prompt: `
请生成一道线性代数单选题，可从以下几个知识点方向出发：
- 行列式与矩阵基础
- 向量空间与线性变换
- 特征值与特征向量
- 线性方程组的解法
- 二次型

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

设矩阵 
\\begin{align*}
A = \\begin{bmatrix}1 & 2 \\\\\\\\ 3 & 4\\end{bmatrix}
\\end{align*}
矩阵 $B$ 满足 
\\begin{align*}
AB = \\begin{bmatrix}5 & 6 \\\\\\\\ 7 & 8\\end{bmatrix}
\\end{align*}
则矩阵 $B$ 为（ ）

- A. 
\\begin{align*}
\\begin{bmatrix}-2 & 1 \\\\\\\\ 3.5 & 1\\end{bmatrix}
\\end{align*}

- B. 
\\begin{align*}
\\begin{bmatrix}2 & -1 \\\\\\\\ -3.5 & 1\\end{bmatrix}
\\end{align*}

- C. 
\\begin{align*}
\\begin{bmatrix}-2 & -1 \\\\\\\\ 3.5 & -1\\end{bmatrix}
\\end{align*}

- D. 
\\begin{align*}
\\begin{bmatrix}1 & 2 \\\\\\\\ 3 & 4\\end{bmatrix}
\\end{align*}

【正确答案：0】

解析：由 $AB = C$ 可得 $B = A^{-1}C$，计算矩阵 $A$ 的逆矩阵，然后与 $C$ 相乘即可得到答案。
        `
    },
    
    gailvlun: {
        title: '概率论题目集',
        subject: '概率论',
        knowledgePoints: [
            '概率基础理论',
            '随机变量及其分布',
            '多维随机变量',
            '数字特征',
            '大数定律与中心极限定理',
            '数理统计基础'
        ],
        prompt: `
请生成一道概率论单选题，可从以下几个知识点方向出发：
- 概率基础理论
- 随机变量及其分布
- 多维随机变量
- 数字特征
- 大数定律与中心极限定理
- 数理统计基础

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

设随机变量 $X$ 服从正态分布 $N(0, 1)$，则 $P(X > 1.96)$ 约等于（ ）

- A. 0.025
- B. 0.05
- C. 0.975
- D. 0.95

【正确答案：0】

解析：由于 $X \\sim N(0,1)$，查标准正态分布表可知 $\\Phi(1.96) = 0.975$，所以 $P(X > 1.96) = 1 - 0.975 = 0.025$。
        `
    },
    
    lisuan: {
        title: '离散数学题目集',
        subject: '离散数学',
        knowledgePoints: [
            '集合论与逻辑',
            '关系与函数',
            '图论基础',
            '树与网络',
            '组合数学',
            '代数结构'
        ],
        prompt: `
请生成一道离散数学单选题，可从以下几个知识点方向出发：
- 集合论与逻辑
- 关系与函数
- 图论基础
- 树与网络
- 组合数学
- 代数结构

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

设集合 $A = \\{1, 2, 3\\}$，$B = \\{2, 3, 4\\}$，则 $A \\cap B$ 等于（ ）

- A. $\\{1, 2, 3, 4\\}$
- B. $\\{2, 3\\}$
- C. $\\{1\\}$
- D. $\\{4\\}$

【正确答案：1】

解析：集合的交集是两个集合中共同的元素，$A$ 和 $B$ 的共同元素是 2 和 3，所以 $A \\cap B = \\{2, 3\\}$。
        `
    },
    
    fubian: {
        title: '复变函数题目集',
        subject: '复变函数',
        knowledgePoints: [
            '复数与复平面',
            '解析函数',
            '复积分',
            '级数理论',
            '留数定理',
            '保形映射'
        ],
        prompt: `
请生成一道复变函数单选题，可从以下几个知识点方向出发：
- 复数与复平面
- 解析函数
- 复积分
- 级数理论
- 留数定理
- 保形映射

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

复数 $z = 3 + 4i$ 的模长为（ ）

- A. 3
- B. 4
- C. 5
- D. 7

【正确答案：2】

解析：复数 $z = a + bi$ 的模长为 $|z| = \\sqrt{a^2 + b^2}$，所以 $|3 + 4i| = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$。
        `
    },
    
    weifenfangcheng: {
        title: '微分方程题目集',
        subject: '微分方程',
        knowledgePoints: [
            '一阶微分方程',
            '高阶线性微分方程',
            '微分方程组',
            '偏微分方程基础',
            '特殊函数',
            '数值解法'
        ],
        prompt: `
请生成一道微分方程单选题，可从以下几个知识点方向出发：
- 一阶微分方程
- 高阶线性微分方程
- 微分方程组
- 偏微分方程基础
- 特殊函数
- 数值解法

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

微分方程 $\\frac{dy}{dx} = 2x$ 的通解为（ ）

- A. $y = x^2$
- B. $y = x^2 + C$
- C. $y = 2x + C$
- D. $y = x + C$

【正确答案：1】

解析：对等式两边积分得 $y = \\int 2x dx = x^2 + C$，其中 $C$ 为任意常数。
        `
    },
    
    caozuoxitong: {
        title: '操作系统题目集',
        subject: '操作系统',
        knowledgePoints: [
            '操作系统概述',
            '进程管理',
            '内存管理',
            '文件系统',
            '设备管理',
            '系统安全'
        ],
        prompt: `
请生成一道操作系统单选题，可从以下几个知识点方向出发：
- 操作系统概述
- 进程管理
- 内存管理
- 文件系统
- 设备管理
- 系统安全

使用 markdown 格式，要求：

1. 简单的单行公式采用 $ 符号包含，例如：$a = b^2$。
2. 如果是长公式或矩阵、方程组需要使用标准 LaTeX 环境，并且设置合理的换行，例如：
- $$\\begin{align*}...\\end{align*}$$
- $$\\begin{cases}...\\end{cases}$$
3. 所有的换行符请一次性输出4个，以免出现转义情况，确保在 markdown 中正确显示。
4. 选项和题干不在同一行，换行用无序列表（- 选项文本）形式列出。
5. 答案请在末尾用 【正确答案：数字】 标明正确选项的序号（从0开始）。
6. 题目末尾请给出详细解析，解析用"解析:"开头。

示例，一个标准的题目格式如下：

在操作系统中，进程的状态不包括（ ）

- A. 就绪状态
- B. 运行状态
- C. 阻塞状态
- D. 编译状态

【正确答案：3】

解析：进程的基本状态包括就绪状态、运行状态和阻塞状态，编译状态不是进程的状态。
        `
    }
};

// 获取课程配置（增强版，结合courses.json数据）
export async function getCourseConfig(courseId) {
    // 确保courses.json数据已加载
    await loadCoursesJsonData();
    
    const baseConfig = courseConfigs[courseId];
    if (!baseConfig) return null;
    
    // 获取courses.json中的课程信息
    const courseInfo = getCourseInfoByFolder(courseId);
    
    // 合并配置
    if (courseInfo) {
        return {
            ...baseConfig,
            // 从courses.json添加的信息
            courseId: courseInfo.id,
            originalTitle: courseInfo.title,
            description: courseInfo.description,
            category: courseInfo.category,
            difficulty: courseInfo.difficulty,
            hours: courseInfo.hours,
            status: courseInfo.status,
            tags: courseInfo.tags,
            instructor: courseInfo.instructor,
            created_at: courseInfo.created_at,
            updated_at: courseInfo.updated_at
        };
    }
    
    return baseConfig;
}

// 获取课程配置（同步版本，用于向后兼容）
export function getCourseConfigSync(courseId) {
    return courseConfigs[courseId] || null;
}

// 获取所有课程列表
export function getAllCourses() {
    return Object.keys(courseConfigs);
}

// 获取课程分类信息
export function getCourseCategories() {
    if (!coursesJsonData) return [];
    return coursesJsonData.categories || [];
}

// 获取难度等级信息
export function getDifficultyLevels() {
    if (!coursesJsonData) return [];
    return coursesJsonData.difficulty_levels || [];
}

// 根据分类获取课程
export function getCoursesByCategory(category) {
    if (!coursesJsonData) return [];
    return coursesJsonData.courses.filter(course => course.category === category);
}

// 根据难度获取课程
export function getCoursesByDifficulty(difficulty) {
    if (!coursesJsonData) return [];
    return coursesJsonData.courses.filter(course => course.difficulty === difficulty);
}

// 搜索课程
export function searchCourses(query) {
    if (!coursesJsonData || !query) return [];
    
    const lowerQuery = query.toLowerCase();
    return coursesJsonData.courses.filter(course => 
        course.title.toLowerCase().includes(lowerQuery) ||
        course.description.toLowerCase().includes(lowerQuery) ||
        course.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        course.instructor.toLowerCase().includes(lowerQuery)
    );
}