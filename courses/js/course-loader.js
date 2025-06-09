// courses/js/course-loader.js
// 动态课程加载器
import { getIdToFolderMapping } from './course-mapping-loader.js';

// 课程数据缓存
let coursesData = null;
let courseConfigMap = {};
let courseIdMapping = null; // 将从统一配置文件中加载

// 加载课程数据
async function loadCoursesData() {
    if (coursesData) return coursesData;
    
    try {
        // 先加载课程映射数据
        if (!courseIdMapping) {
            courseIdMapping = await getIdToFolderMapping();
        }
        
        const response = await fetch('../../views/data/courses.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        coursesData = await response.json();
        
        // 构建课程配置映射
        coursesData.courses.forEach(course => {
            const folderName = courseIdMapping[course.id];
            if (folderName) {
                courseConfigMap[folderName] = {
                    id: course.id,
                    title: `${course.title} - 无限习题链`,
                    sidebarTitle: `${course.title}知识点`,
                    originalTitle: course.title,
                    description: course.description,
                    category: course.category,
                    difficulty: course.difficulty,
                    hours: course.hours,
                    tags: course.tags,
                    instructor: course.instructor,
                    scriptPath: '../js/course-template.js'
                };
            }
        });
        
        console.log('课程数据加载成功:', coursesData);
        return coursesData;
    } catch (error) {
        console.error('加载课程数据失败:', error);
        // 使用默认配置作为后备
        return getDefaultCourseConfig();
    }
}

// 获取默认课程配置（后备方案）
function getDefaultCourseConfig() {
    return {
        'gaodengshuxue': {
            title: '高等数学 - 无限习题链',
            sidebarTitle: '高等数学知识点',
            scriptPath: '../js/course-template.js',
        },
        'xianxingdaishu': {
            title: '线性代数 - 无限习题链',
            sidebarTitle: '线性代数知识点',
            scriptPath: '../js/course-template.js',
        },
        'gailvlun': {
            title: '概率论 - 无限习题链',
            sidebarTitle: '概率论知识点',
            scriptPath: '../js/course-template.js',
        },
        'lisuan': {
            title: '离散数学 - 无限习题链',
            sidebarTitle: '离散数学知识点',
            scriptPath: '../js/course-template.js',
        },
        'fubian': {
            title: '复变函数 - 无限习题链',
            sidebarTitle: '复变函数知识点',
            scriptPath: '../js/course-template.js',
        },
        'weifenfangcheng': {
            title: '微分方程 - 无限习题链',
            sidebarTitle: '微分方程知识点',
            scriptPath: '../js/course-template.js',
        },
        'caozuoxitong': {
            title: '操作系统 - 无限习题链',
            sidebarTitle: '操作系统知识点',
            scriptPath: '../js/course-template.js',
        }
    };
}

// 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 动态加载脚本
function loadScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        if (isModule) {
            script.type = 'module';
        }
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// 获取课程配置
function getCourseConfig(courseId) {
    return courseConfigMap[courseId] || null;
}

// 初始化页面
async function initializePage() {
    const courseId = getUrlParameter('course');
    
    // 先加载课程数据
    await loadCoursesData();
    
    if (!courseId) {
        console.error('未提供课程ID');
        document.title = '课程未找到 - 无限习题链';
        document.getElementById('page-title').textContent = '课程未找到 - 无限习题链';
        document.getElementById('sidebar-title').textContent = '课程未找到';
        return;
    }
    
    const config = getCourseConfig(courseId);
    
    if (!config) {
        console.error('无效的课程ID:', courseId);
        document.title = '课程未找到 - 无限习题链';
        document.getElementById('page-title').textContent = '课程未找到 - 无限习题链';
        document.getElementById('sidebar-title').textContent = '课程未找到';
        
        // 显示可用的课程列表
        const availableCourses = Object.keys(courseConfigMap);
        if (availableCourses.length > 0) {
            console.log('可用的课程ID:', availableCourses);
            const courseList = availableCourses.map(id => {
                const cfg = courseConfigMap[id];
                return `${id} (${cfg.originalTitle || cfg.title})`;
            }).join(', ');
            
            const errorElement = document.getElementById('page-title');
            if (errorElement) {
                errorElement.innerHTML = `
                    <div class="alert alert-warning">
                        <h4>课程未找到</h4>
                        <p>课程ID "${courseId}" 不存在。</p>
                        <p><strong>可用的课程:</strong> ${courseList}</p>
                        <p>请检查URL中的course参数。</p>
                    </div>
                `;
            }
        }
        return;
    }
    
    // 设置页面标题和侧边栏标题
    document.title = config.title;
    document.getElementById('page-title').textContent = config.title;
    document.getElementById('sidebar-title').textContent = config.sidebarTitle;
    
    // 添加课程描述和元信息
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && config.description) {
        const metaInfo = document.createElement('div');
        metaInfo.className = 'course-meta mt-2';
        metaInfo.innerHTML = `
            <p class="text-muted mb-1">${config.description}</p>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <span class="badge bg-primary">${config.category === 'math' ? '数学类' : config.category === 'computer' ? '计算机类' : config.category}</span>
                <span class="badge bg-secondary">难度: ${config.difficulty}/5</span>
                <span class="badge bg-info">${config.hours}学时</span>
                <span class="text-muted">授课教师: ${config.instructor}</span>
            </div>
        `;
        pageTitle.appendChild(metaInfo);
    }
    
    try {
        // 动态加载通用课程模板
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { initCourse } from '../js/course-template.js';
            initCourse('${courseId}').catch(error => {
                console.error('初始化课程失败:', error);
            });
        `;
        document.head.appendChild(script);
        console.log(`课程 ${courseId} 加载成功`, config);
    } catch (error) {
        console.error(`加载课程脚本失败:`, error);
    }
}

// 导出函数供其他模块使用
window.courseLoader = {
    loadCoursesData,
    getCourseConfig,
    getCoursesData: () => coursesData,
    getCourseConfigMap: () => courseConfigMap
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePage);