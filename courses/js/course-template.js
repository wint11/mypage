// course-template.js
// 通用课程脚本模板

import { ExerciseManager } from './ExerciseManager.js';
import { setupUI } from './UI.js';
import { renderExercise } from './ExerciseRenderer.js';
import { preloadNextExercise } from './ExerciseGenerator.js';
import { exportToDocx } from './DocxExporter.js';
import { loadKnowledgePoints } from './KnowledgePointLoader.js';
import { getCourseConfig } from './CourseConfig.js';
import { generateLearningReport } from './ReportGenerator.js';

// 获取课程ID（从URL参数或其他方式）
function getCourseId() {
    // 从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const courseFromUrl = urlParams.get('course');
    if (courseFromUrl) return courseFromUrl;
    
    // 从文件名推断（兼容旧版本）
    const scriptName = document.currentScript?.src?.split('/').pop()?.replace('.js', '');
    if (scriptName && scriptName !== 'course-template') {
        return scriptName;
    }
    
    // 默认值
    return 'caozuoxitong';
}

// 初始化课程
export function initCourse(courseId) {
    const actualCourseId = courseId || getCourseId();
    const courseConfig = getCourseConfig(actualCourseId);
    
    if (!courseConfig) {
        console.error('未找到课程配置:', actualCourseId);
        return;
    }
    
    console.log('初始化课程:', actualCourseId, courseConfig.subject);
    
    // 初始化练习管理器
    const exerciseManager = new ExerciseManager(actualCourseId);
    
    // 将ExerciseManager实例注册到全局，供其他模块访问
    if (!window.courseExerciseManagers) {
        window.courseExerciseManagers = {};
    }
    window.courseExerciseManagers[actualCourseId] = exerciseManager;
    
    // 设置UI事件
    setupUI({
        onPrev: () => {
            if (exerciseManager.currentIndex > 0) {
                exerciseManager.currentIndex--;
                exerciseManager.answeredCorrect = exerciseManager.currentIndex < exerciseManager.exercises.length - 1;
                renderExercise(exerciseManager.currentIndex, exerciseManager, actualCourseId);
            }
        },
        onNext: () => {
            if (!exerciseManager.answeredCorrect) return;
            if (exerciseManager.currentIndex < exerciseManager.exercises.length - 1) {
                exerciseManager.currentIndex++;
                exerciseManager.answeredCorrect = false;
                renderExercise(exerciseManager.currentIndex, exerciseManager, actualCourseId);
                preloadNextExercise(actualCourseId);
            } else if (exerciseManager.bufferedExercise) {
                exerciseManager.addExercise(exerciseManager.bufferedExercise);
                exerciseManager.bufferedExercise = null;
                exerciseManager.currentIndex++;
                exerciseManager.answeredCorrect = false;
                renderExercise(exerciseManager.currentIndex, exerciseManager, actualCourseId);
                preloadNextExercise(actualCourseId);
            } else {
                alert('下一题正在生成中，请稍候。');
                document.getElementById('next-btn').disabled = true;
            }
        },
        onExport: () => exportToDocx(actualCourseId),
        onBack: () => window.location.href = '../../views/my-courses.html',
        onReport: () => {
            generateLearningReport(actualCourseId);
        },
        onSimulate: () => {
            // TODO: 实现模拟测试功能
            alert('模拟测试功能开发中...');
        }
    });
    
    // 加载知识点
    loadKnowledgePoints(actualCourseId);
    
    // 初始化第一题（如果没有练习）
    if (exerciseManager.exercises.length === 0) {
        console.log('没有现有练习，生成第一题');
        preloadNextExercise(actualCourseId).then(() => {
            if (exerciseManager.bufferedExercise) {
                exerciseManager.addExercise(exerciseManager.bufferedExercise);
                exerciseManager.bufferedExercise = null;
                exerciseManager.currentIndex = 0;
                exerciseManager.answeredCorrect = false;
                renderExercise(exerciseManager.currentIndex, exerciseManager, actualCourseId);
                // 预加载下一题
                preloadNextExercise(actualCourseId);
            }
        });
    } else {
        // 渲染当前练习
        renderExercise(exerciseManager.currentIndex, exerciseManager, actualCourseId);
        // 预加载下一题
        preloadNextExercise(actualCourseId);
    }
}

// 自动初始化（当作为模块导入时）
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initCourse();
    });
}