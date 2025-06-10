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

// 课程配置缓存
let courseConfigsCache = null;

// 异步加载课程配置
export async function loadCourseConfigs() {
    if (courseConfigsCache) {
        return courseConfigsCache;
    }
    
    try {
        const response = await fetch('../structure/course-configs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        courseConfigsCache = await response.json();
        return courseConfigsCache;
    } catch (error) {
        console.error('加载课程配置失败:', error);
        // 返回空对象作为备选方案
        return {};
    }
}



// 为了向后兼容，保留同步的 courseConfigs 导出
// 注意：这将在首次调用 loadCourseConfigs() 后才有数据
export const courseConfigs = new Proxy({}, {
    get(target, prop) {
        if (courseConfigsCache && courseConfigsCache[prop]) {
            return courseConfigsCache[prop];
        }
        console.warn(`课程配置 '${prop}' 未找到。请确保先调用 loadCourseConfigs()。`);
        return undefined;
    },
    has(target, prop) {
        return courseConfigsCache && prop in courseConfigsCache;
    },
    ownKeys(target) {
        return courseConfigsCache ? Object.keys(courseConfigsCache) : [];
    }
});

// 获取课程配置（增强版，结合courses.json数据）
export async function getCourseConfig(courseId) {
    // 确保courses.json数据已加载
    await loadCoursesJsonData();
    
    // 使用新的异步加载方式获取配置
    const configs = await loadCourseConfigs();
    const baseConfig = configs[courseId];
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
    if (courseConfigsCache && courseConfigsCache[courseId]) {
        return courseConfigsCache[courseId];
    }
    console.warn(`课程配置 '${courseId}' 未找到。请确保先调用 loadCourseConfigs()。`);
    return null;
}

// 获取所有课程列表
export function getAllCourses() {
    return courseConfigsCache ? Object.keys(courseConfigsCache) : [];
}

// 获取所有课程列表（异步版本）
export async function getAllCoursesAsync() {
    const configs = await loadCourseConfigs();
    return Object.keys(configs);
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