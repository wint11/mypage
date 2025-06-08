// ExerciseGenerator.js
// 题目生成模块

import { exercises, currentIndex, bufferedExercise, isPreloading, setBufferedExercise, setIsPreloading, addExercise, incrementCurrentIndex } from './ExerciseManager.js';
import { updateButtons } from './UI.js';
import { getCourseConfig, getCourseConfigSync, loadCoursesJsonData } from './CourseConfig.js';

// API配置 - 需要配置有效的API密钥
const apiKey = '32c33497-91ee-48bb-ae39-f59eac806506'; // 请替换为有效的API密钥
const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const model = 'doubao-1-5-pro-256k-250115';

// 模拟题目数据（用于开发和测试）
const mockExercises = {
    'caozuoxitong': '以下哪种页面置换算法理论上最优但无法实际实现？\n\n- A. FIFO（先进先出）\n- B. LRU（最近最少使用）\n- C. OPT（最佳置换）\n- D. Clock（时钟置换）\n\n【正确答案：2】\n\n解析：\nOPT（Optimal Page Replacement）算法选择未来最久不会被访问的页面进行替换，因此缺页率最低，是最优策略。然而，该算法需要预知程序未来的访问序列，这在现实中无法实现，因此被称为"理想算法"。',
    'xianxingdaishu': '矩阵 $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$ 的行列式值是多少？\n\n- A. -2\n- B. -1\n- C. 1\n- D. 2\n\n【正确答案：0】\n\n解析：\n二阶矩阵的行列式计算公式为 $|A| = ad - bc$。对于矩阵 $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$，有 $|A| = 1 \\times 4 - 2 \\times 3 = 4 - 6 = -2$。',
    'gaodengshuxue': '函数 $f(x) = x^2 + 2x + 1$ 在点 $x = 1$ 处的导数值是多少？\n\n- A. 2\n- B. 3\n- C. 4\n- D. 5\n\n【正确答案：2】\n\n解析：\n$f(x) = x^2 + 2x + 1$ 的导数为 $f\'(x) = 2x + 2$。在 $x = 1$ 处，$f\'(1) = 2 \\times 1 + 2 = 4$。',
    'gailvlun': '抛掷一枚公平硬币3次，恰好出现2次正面的概率是多少？\n\n- A. 1/8\n- B. 1/4\n- C. 3/8\n- D. 1/2\n\n【正确答案：2】\n\n解析：\n这是一个二项分布问题。抛掷3次硬币，恰好2次正面的概率为 $C_3^2 \\times (\\frac{1}{2})^2 \\times (\\frac{1}{2})^1 = 3 \\times \\frac{1}{4} \\times \\frac{1}{2} = \\frac{3}{8}$。',
    'lisuan': '二进制数 1101 转换为十进制数是多少？\n\n- A. 11\n- B. 12\n- C. 13\n- D. 14\n\n【正确答案：2】\n\n解析：\n二进制转十进制：$1101_2 = 1 \\times 2^3 + 1 \\times 2^2 + 0 \\times 2^1 + 1 \\times 2^0 = 8 + 4 + 0 + 1 = 13$。',
    'weifenfangcheng': '微分方程 $\\frac{dy}{dx} = 2x$ 的通解是什么？\n\n- A. $y = x^2$\n- B. $y = x^2 + C$\n- C. $y = 2x + C$\n- D. $y = 2x^2 + C$\n\n【正确答案：1】\n\n解析：\n对 $\\frac{dy}{dx} = 2x$ 两边积分得：$y = \\int 2x dx = x^2 + C$，其中 $C$ 是积分常数。',
    'fubian': '复数 $z = 3 + 4i$ 的模长是多少？\n\n- A. 3\n- B. 4\n- C. 5\n- D. 7\n\n【正确答案：2】\n\n解析：\n复数 $z = a + bi$ 的模长公式为 $|z| = \\sqrt{a^2 + b^2}$。对于 $z = 3 + 4i$，有 $|z| = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$。'
};

// 预加载下一题
export async function preloadNextExercise(courseId = 'caozuoxitong') {
    // 获取当前课程的ExerciseManager实例
    const exerciseManager = window.courseExerciseManagers?.[courseId];
    
    // 检查是否正在预加载或已有缓冲题目
    const currentIsPreloading = exerciseManager ? exerciseManager.getIsPreloading() : isPreloading;
    const currentBufferedExercise = exerciseManager ? exerciseManager.getBufferedExercise() : bufferedExercise;
    
    if (currentIsPreloading || currentBufferedExercise) return;
    
    // 设置预加载状态
    if (exerciseManager) {
        exerciseManager.setIsPreloading(true);
    } else {
        setIsPreloading(true);
    }

    // 确保课程数据已加载
    await loadCoursesJsonData();
    
    const courseConfig = await getCourseConfig(courseId);
    if (!courseConfig) {
        console.error('未找到课程配置:', courseId);
        // 尝试使用同步版本作为后备
        const fallbackConfig = getCourseConfigSync(courseId);
        if (!fallbackConfig) {
            console.error('同步配置也未找到:', courseId);
            if (exerciseManager) {
                exerciseManager.setIsPreloading(false);
            } else {
                setIsPreloading(false);
            }
            return;
        }
        console.warn('使用后备配置:', courseId);
        // 使用后备配置继续
        courseConfig = fallbackConfig;
    }

    // 检查API密钥是否配置
    if (apiKey === 'YOUR_API_KEY_HERE' || !apiKey) {
        console.warn('API密钥未配置，使用模拟数据');
        // 使用模拟数据
        const mockExercise = mockExercises[courseId] || mockExercises['caozuoxitong'];
        setTimeout(() => {
            // 获取当前课程的ExerciseManager实例
            const exerciseManager = window.courseExerciseManagers?.[courseId];
            if (exerciseManager) {
                exerciseManager.setBufferedExercise(mockExercise);
                exerciseManager.setIsPreloading(false);
            } else {
                setBufferedExercise(mockExercise);
                setIsPreloading(false);
            }
            // 更新按钮状态
            updateButtons(exerciseManager);
            console.log('模拟题目加载完成');
        }, 1000); // 模拟网络延迟
        return;
    }

    const prompt = courseConfig.prompt;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: `你是一个${courseConfig.subject}题目生成器，请严格使用markdown的语法返回。` },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || null;
        
        // 获取当前课程的ExerciseManager实例
        const exerciseManager = window.courseExerciseManagers?.[courseId];
        if (exerciseManager) {
            exerciseManager.setBufferedExercise(content);
        } else {
            setBufferedExercise(content);
        }
        console.log('AI题目生成成功');
    } catch (e) {
        console.error('AI题目生成失败，使用模拟数据：', e.message);
        // 如果API调用失败，回退到模拟数据
        const mockExercise = mockExercises[courseId] || mockExercises['caozuoxitong'];
        
        // 获取当前课程的ExerciseManager实例
        const exerciseManagerFallback = window.courseExerciseManagers?.[courseId];
        if (exerciseManagerFallback) {
            exerciseManagerFallback.setBufferedExercise(mockExercise);
        } else {
            setBufferedExercise(mockExercise);
        }
    } finally {
        // 获取当前课程的ExerciseManager实例
        const exerciseManagerFinal = window.courseExerciseManagers?.[courseId];
        if (exerciseManagerFinal) {
            exerciseManagerFinal.setIsPreloading(false);
        } else {
            setIsPreloading(false);
        }
        // 更新按钮状态
        updateButtons(exerciseManagerFinal);
    }
}