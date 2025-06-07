// courses/js/course-loader.js
// 动态课程加载器

// 课程配置映射
const courseConfig = {
    'gaodengshuxue': {
        title: '高等数学 - 无限习题链',
        sidebarTitle: '高等数学知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'xianxingdaishu': {
        title: '线性代数 - 无限习题链',
        sidebarTitle: '线性代数知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'gailvlun': {
        title: '概率论 - 无限习题链',
        sidebarTitle: '概率论知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'lisuan': {
        title: '离散数学 - 无限习题链',
        sidebarTitle: '离散数学知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'fubian': {
        title: '复变函数 - 无限习题链',
        sidebarTitle: '复变函数知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'weifenfangcheng': {
        title: '微分方程 - 无限习题链',
        sidebarTitle: '微分方程知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    },
    'caozuoxitong': {
        title: '操作系统 - 无限习题链',
        sidebarTitle: '操作系统知识点',
        scriptPath: '../js/course-template.js',
        isModule: true
    }
};

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

// 初始化页面
async function initializePage() {
    const courseId = getUrlParameter('course');
    
    if (!courseId || !courseConfig[courseId]) {
        console.error('无效的课程ID:', courseId);
        document.title = '课程未找到 - 无限习题链';
        document.getElementById('page-title').textContent = '课程未找到 - 无限习题链';
        document.getElementById('sidebar-title').textContent = '课程未找到';
        return;
    }
    
    const config = courseConfig[courseId];
    
    // 设置页面标题和侧边栏标题
    document.title = config.title;
    document.getElementById('page-title').textContent = config.title;
    document.getElementById('sidebar-title').textContent = config.sidebarTitle;
    
    try {
        // 动态加载通用课程模板
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { initCourse } from '../js/course-template.js';
            initCourse('${courseId}');
        `;
        document.head.appendChild(script);
        console.log(`课程 ${courseId} 加载成功`);
    } catch (error) {
        console.error(`加载课程脚本失败:`, error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePage);