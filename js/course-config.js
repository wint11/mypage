// js/course-config.js
// 课程配置映射
// 统一使用course.html模板，通过URL参数区分不同课程

// 课程名称映射表 - 只需要维护这个映射表即可
const courseNameMap = {
  "course1": "gaodengshuxue",
  "course2": "xianxingdaishu", 
  "course3": "gailvlun",
  "course4": "lisuan",
  "course5": "fubian",
  "course6": "weifenfangcheng",
  "course7": "caozuoxitong",
  "course8": "shujujiegou",
  "course9": "jisuanjiwangluo",
  "course10": "shujuku"
};

// 动态生成课程映射
function generateCourseMap() {
  const courseMap = {};
  for (const [courseId, courseName] of Object.entries(courseNameMap)) {
    courseMap[courseId] = `../courses/html/course.html?course=${courseName}`;
  }
  return courseMap;
}

// 生成课程映射
const courseMap = generateCourseMap();

// 添加新课程的辅助函数
function addCourse(courseId, courseName) {
  courseNameMap[courseId] = courseName;
  courseMap[courseId] = `../courses/html/course.html?course=${courseName}`;
}

// 获取所有课程列表
function getAllCourses() {
  return Object.keys(courseNameMap);
}

// 根据课程名称获取课程ID
function getCourseIdByName(courseName) {
  for (const [courseId, name] of Object.entries(courseNameMap)) {
    if (name === courseName) {
      return courseId;
    }
  }
  return null;
}

// 导出函数供其他模块使用
window.courseConfig = {
  courseMap,
  courseNameMap,
  addCourse,
  getAllCourses,
  getCourseIdByName,
  generateCourseMap
};
