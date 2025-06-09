/**
 * 课程映射加载器
 * 统一管理所有课程的映射关系
 */

class CourseMappingLoader {
    constructor() {
        this.mappingData = null;
        this.isLoaded = false;
    }

    /**
     * 异步加载课程映射数据
     */
    async loadMappingData() {
        if (this.isLoaded) {
            return this.mappingData;
        }

        try {
            const response = await fetch('../structure/course-mapping.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.mappingData = await response.json();
            this.isLoaded = true;
            console.log('课程映射数据加载成功');
            return this.mappingData;
        } catch (error) {
            console.error('加载课程映射数据失败:', error);
            // 返回默认的映射数据作为后备
            return this.getDefaultMappingData();
        }
    }

    /**
     * 获取默认的映射数据（后备方案）
     */
    getDefaultMappingData() {
        return {
            courses: {
                'gaodengshuxue': { id: 'course1', name: '高等数学', folder: 'gaodengshuxue' },
                'xianxingdaishu': { id: 'course2', name: '线性代数', folder: 'xianxingdaishu' },
                'gailvlun': { id: 'course3', name: '概率论', folder: 'gailvlun' },
                'lisuan': { id: 'course4', name: '离散数学', folder: 'lisuan' },
                'fubian': { id: 'course5', name: '复变函数', folder: 'fubian' },
                'weifenfangcheng': { id: 'course6', name: '微分方程', folder: 'weifenfangcheng' },
                'caozuoxitong': { id: 'course7', name: '操作系统', folder: 'caozuoxitong' },
                'shujujiegou': { id: 'course8', name: '数据结构与算法', folder: 'shujujiegou' },
                'jisuanjiwangluo': { id: 'course9', name: '计算机网络', folder: 'jisuanjiwangluo' },
                'shujuku': { id: 'course10', name: '数据库系统', folder: 'shujuku' }
            },
            mappings: {
                folderToId: {
                    'gaodengshuxue': 'course1',
                    'xianxingdaishu': 'course2',
                    'gailvlun': 'course3',
                    'lisuan': 'course4',
                    'fubian': 'course5',
                    'weifenfangcheng': 'course6',
                    'caozuoxitong': 'course7',
                    'shujujiegou': 'course8',
                    'jisuanjiwangluo': 'course9',
                    'shujuku': 'course10'
                },
                idToFolder: {
                    'course1': 'gaodengshuxue',
                    'course2': 'xianxingdaishu',
                    'course3': 'gailvlun',
                    'course4': 'lisuan',
                    'course5': 'fubian',
                    'course6': 'weifenfangcheng',
                    'course7': 'caozuoxitong',
                    'course8': 'shujujiegou',
                    'course9': 'jisuanjiwangluo',
                    'course10': 'shujuku'
                },
                folderToName: {
                    'gaodengshuxue': '高等数学',
                    'xianxingdaishu': '线性代数',
                    'gailvlun': '概率论',
                    'lisuan': '离散数学',
                    'fubian': '复变函数',
                    'weifenfangcheng': '微分方程',
                    'caozuoxitong': '操作系统',
                    'shujujiegou': '数据结构与算法',
                    'jisuanjiwangluo': '计算机网络',
                    'shujuku': '数据库系统'
                }
            }
        };
    }

    /**
     * 确保映射数据已加载
     */
    async ensureLoaded() {
        if (!this.isLoaded) {
            await this.loadMappingData();
        }
        return this.mappingData;
    }

    /**
     * 根据文件夹名获取课程ID
     */
    async getFolderToIdMapping() {
        await this.ensureLoaded();
        return this.mappingData.mappings.folderToId;
    }

    /**
     * 根据课程ID获取文件夹名
     */
    async getIdToFolderMapping() {
        await this.ensureLoaded();
        return this.mappingData.mappings.idToFolder;
    }

    /**
     * 根据文件夹名获取课程名称
     */
    async getFolderToNameMapping() {
        await this.ensureLoaded();
        return this.mappingData.mappings.folderToName;
    }

    /**
     * 获取所有课程信息
     */
    async getAllCourses() {
        await this.ensureLoaded();
        return this.mappingData.courses;
    }

    /**
     * 根据文件夹名获取课程信息
     */
    async getCourseByFolder(folderName) {
        await this.ensureLoaded();
        return this.mappingData.courses[folderName] || null;
    }

    /**
     * 根据课程ID获取课程信息
     */
    async getCourseById(courseId) {
        await this.ensureLoaded();
        const courses = this.mappingData.courses;
        for (const [folder, course] of Object.entries(courses)) {
            if (course.id === courseId) {
                return { folder, ...course };
            }
        }
        return null;
    }

    /**
     * 添加新课程（动态添加）
     */
    addCourse(folderName, courseId, courseName) {
        if (!this.mappingData) {
            console.error('映射数据未加载，无法添加课程');
            return false;
        }

        // 添加到courses对象
        this.mappingData.courses[folderName] = {
            id: courseId,
            name: courseName,
            folder: folderName
        };

        // 添加到映射对象
        this.mappingData.mappings.folderToId[folderName] = courseId;
        this.mappingData.mappings.idToFolder[courseId] = folderName;
        this.mappingData.mappings.folderToName[folderName] = courseName;

        console.log(`课程添加成功: ${folderName} -> ${courseId} (${courseName})`);
        return true;
    }

    /**
     * 获取下一个可用的课程ID
     */
    async getNextCourseId() {
        await this.ensureLoaded();
        const existingIds = Object.values(this.mappingData.mappings.idToFolder);
        const numbers = existingIds
            .filter(id => id.startsWith('course'))
            .map(id => parseInt(id.replace('course', '')))
            .filter(num => !isNaN(num));
        
        const maxNumber = Math.max(...numbers, 0);
        return `course${maxNumber + 1}`;
    }
}

// 创建全局实例
const courseMappingLoader = new CourseMappingLoader();

// 导出便捷函数
export async function getFolderToIdMapping() {
    return await courseMappingLoader.getFolderToIdMapping();
}

export async function getIdToFolderMapping() {
    return await courseMappingLoader.getIdToFolderMapping();
}

export async function getFolderToNameMapping() {
    return await courseMappingLoader.getFolderToNameMapping();
}

export async function getAllCourses() {
    return await courseMappingLoader.getAllCourses();
}

export async function getCourseByFolder(folderName) {
    return await courseMappingLoader.getCourseByFolder(folderName);
}

export async function getCourseById(courseId) {
    return await courseMappingLoader.getCourseById(courseId);
}

export async function addNewCourse(folderName, courseName) {
    const nextId = await courseMappingLoader.getNextCourseId();
    return courseMappingLoader.addCourse(folderName, nextId, courseName);
}

export { courseMappingLoader };

// 如果在浏览器环境中，也添加到window对象
if (typeof window !== 'undefined') {
    window.courseMappingLoader = courseMappingLoader;
    window.courseMapping = {
        getFolderToIdMapping,
        getIdToFolderMapping,
        getFolderToNameMapping,
        getAllCourses,
        getCourseByFolder,
        getCourseById,
        addNewCourse
    };
}