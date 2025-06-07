/**
 * 教师智能备课助手 - 模块化主应用
 */
class TeacherAssistantApp {
    constructor() {
        this.moduleManager = null;
        this.currentTool = null;
        this.loadingModal = null;
        this.toolTemplates = {};
        
        // API配置
        this.apiConfig = {
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            apiKey: '32c33497-91ee-48bb-ae39-f59eac806506',
            timeout: 30000
        };
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 初始化Bootstrap模态框
            this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
            
            // 初始化模块管理器
            this.moduleManager = new ModuleManager(this.apiConfig);
            
            // 注册所有模块
            this.registerModules();
            
            // 初始化所有模块
            await this.moduleManager.init();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载工具模板
            await this.loadToolTemplates();
            
            console.log('教师智能备课助手初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showAlert('应用初始化失败，请刷新页面重试', 'danger');
        }
    }

    /**
     * 注册所有功能模块
     */
    registerModules() {
        const modules = [
            { name: 'lesson-plan', class: LessonPlanModule },
            { name: 'exercise', class: ExerciseModule },
            { name: 'ppt', class: PPTModule },
            { name: 'video', class: VideoModule },
            { name: 'student-analysis', class: StudentAnalysisModule },
            { name: 'content-analysis', class: ContentAnalysisModule },
            { name: 'assessment', class: AssessmentModule },
            { name: 'knowledge-graph', class: KnowledgeGraphModule }
        ];

        modules.forEach(module => {
            console.log(`注册模块: ${module.name}`, module.class);
            if (typeof module.class === 'undefined') {
                console.error(`模块类 ${module.name} 未定义`);
                return;
            }
            this.moduleManager.registerModule(module.name, module.class);
        });
        
        console.log('所有模块注册完成');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 工具按钮点击事件
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                this.switchTool(toolName);
            });
        });

        // 全局加载状态事件
        document.addEventListener('showLoading', (e) => {
            if (e.detail.show) {
                this.loadingModal.show();
            } else {
                this.loadingModal.hide();
            }
        });

        // 全局警告提示事件
        document.addEventListener('showAlert', (e) => {
            this.showAlert(e.detail.message, e.detail.type);
        });
    }

    /**
     * 加载工具模板
     */
    async loadToolTemplates() {
        // 定义各个工具的HTML模板
        this.toolTemplates = {
            'lesson-plan': this.getLessonPlanTemplate(),
            'exercise': this.getExerciseTemplate(),
            'ppt': this.getPPTTemplate(),
            'video': this.getVideoTemplate(),
            'student-analysis': this.getStudentAnalysisTemplate(),
            'content-analysis': this.getContentAnalysisTemplate(),
            'assessment': this.getAssessmentTemplate(),
            'knowledge-graph': this.getKnowledgeGraphTemplate()
        };
    }

    /**
     * 切换工具
     */
    async switchTool(toolName) {
        try {
            // 更新按钮状态
            this.updateToolButtons(toolName);
            
            // 加载工具界面
            await this.loadToolInterface(toolName);
            
            // 切换到对应模块
            await this.moduleManager.switchModule(toolName);
            
            this.currentTool = toolName;
        } catch (error) {
            console.error(`切换到工具 ${toolName} 失败:`, error);
            this.showAlert('工具切换失败，请重试', 'danger');
        }
    }

    /**
     * 更新工具按钮状态
     */
    updateToolButtons(activeTool) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === activeTool) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 加载工具界面
     */
    async loadToolInterface(toolName) {
        const container = document.getElementById('tool-container');
        const template = this.toolTemplates[toolName];
        
        if (template) {
            // 隐藏欢迎页面
            const welcomeTool = document.getElementById('welcome-tool');
            if (welcomeTool) {
                welcomeTool.style.display = 'none';
            }
            
            // 清除现有内容
            const existingTools = container.querySelectorAll('.tool-content:not(#welcome-tool)');
            existingTools.forEach(tool => tool.remove());
            
            // 添加新工具界面
            container.insertAdjacentHTML('beforeend', template);
        }
    }

    /**
     * 显示警告提示
     */
    showAlert(message, type = 'info') {
        // 创建警告元素
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    // 以下是各个工具的HTML模板
    getLessonPlanTemplate() {
        return `
            <div id="lesson-plan-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-file-alt me-2"></i>智能教案生成</h4>
                    </div>
                    <div class="card-body">
                        <form id="lesson-plan-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="lesson-topic" class="form-label">课程主题</label>
                                        <input type="text" class="form-control" id="lesson-topic" placeholder="请输入课程主题">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="lesson-duration" class="form-label">课时长度</label>
                                        <select class="form-select" id="lesson-duration">
                                            <option value="40">40分钟</option>
                                            <option value="45">45分钟</option>
                                            <option value="50">50分钟</option>
                                            <option value="90">90分钟</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="lesson-objectives" class="form-label">教学目标</label>
                                <textarea class="form-control" id="lesson-objectives" rows="3" placeholder="请输入教学目标"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="lesson-key-points" class="form-label">重点内容</label>
                                        <textarea class="form-control" id="lesson-key-points" rows="3" placeholder="请输入重点内容"></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="lesson-difficulties" class="form-label">难点内容</label>
                                        <textarea class="form-control" id="lesson-difficulties" rows="3" placeholder="请输入难点内容"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="lesson-materials" class="form-label">教学材料</label>
                                <textarea class="form-control" id="lesson-materials" rows="2" placeholder="请输入教学材料和资源"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-lesson-plan">
                                    <i class="fas fa-magic me-2"></i>生成教案
                                </button>
                            </div>
                        </form>
                        
                        <div id="lesson-plan-result" class="mt-4" style="display: none;">
                            <h5>生成的教案</h5>
                            <div id="lesson-plan-content" class="border p-3 bg-light"></div>
                            <div id="lesson-plan-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success me-2" id="export-lesson-plan">
                                    <i class="fas fa-download me-2"></i>导出教案
                                </button>
                                <button class="btn btn-info" id="edit-lesson-plan">
                                    <i class="fas fa-edit me-2"></i>编辑教案
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getExerciseTemplate() {
        return `
            <div id="exercise-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-question-circle me-2"></i>题目生成器</h4>
                    </div>
                    <div class="card-body">
                        <form id="exercise-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="exercise-topic" class="form-label">题目主题</label>
                                        <input type="text" class="form-control" id="exercise-topic" placeholder="请输入题目主题">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="question-type" class="form-label">题目类型</label>
                                        <select class="form-select" id="question-type">
                                            <option value="choice">选择题</option>
                                            <option value="blank">填空题</option>
                                            <option value="short">简答题</option>
                                            <option value="essay">论述题</option>
                                            <option value="mixed">综合题型</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="question-count" class="form-label">题目数量</label>
                                        <select class="form-select" id="question-count">
                                            <option value="5">5题</option>
                                            <option value="10">10题</option>
                                            <option value="15">15题</option>
                                            <option value="20">20题</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="exercise-purpose" class="form-label">出题目的</label>
                                        <select class="form-select" id="exercise-purpose">
                                            <option value="practice">课堂练习</option>
                                            <option value="homework">课后作业</option>
                                            <option value="test">测验考试</option>
                                            <option value="review">复习巩固</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="knowledge-points" class="form-label">知识点要求</label>
                                <textarea class="form-control" id="knowledge-points" rows="3" placeholder="请输入需要考查的知识点"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-exercise">
                                    <i class="fas fa-magic me-2"></i>生成题目
                                </button>
                            </div>
                        </form>
                        
                        <div id="exercise-result" class="mt-4" style="display: none;">
                            <h5>生成的题目</h5>
                            <div id="exercise-content" class="border p-3 bg-light"></div>
                            <div id="exercise-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success me-2" id="export-exercise">
                                    <i class="fas fa-download me-2"></i>导出题目
                                </button>
                                <button class="btn btn-info" id="add-to-bank">
                                    <i class="fas fa-plus me-2"></i>加入题库
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPPTTemplate() {
        return `
            <div id="ppt-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-presentation me-2"></i>教学PPT生成</h4>
                    </div>
                    <div class="card-body">
                        <form id="ppt-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ppt-topic" class="form-label">PPT主题</label>
                                        <input type="text" class="form-control" id="ppt-topic" placeholder="请输入PPT主题">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="slide-count" class="form-label">幻灯片数量</label>
                                        <select class="form-select" id="slide-count">
                                            <option value="10">10张</option>
                                            <option value="15">15张</option>
                                            <option value="20">20张</option>
                                            <option value="25">25张</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ppt-style" class="form-label">PPT风格</label>
                                        <select class="form-select" id="ppt-style">
                                            <option value="simple">简洁风格</option>
                                            <option value="academic">学术风格</option>
                                            <option value="creative">创意风格</option>
                                            <option value="professional">专业风格</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="color-scheme" class="form-label">配色方案</label>
                                        <select class="form-select" id="color-scheme">
                                            <option value="blue">蓝色系</option>
                                            <option value="green">绿色系</option>
                                            <option value="orange">橙色系</option>
                                            <option value="purple">紫色系</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="ppt-content" class="form-label">主要内容</label>
                                <textarea class="form-control" id="ppt-content" rows="4" placeholder="请输入PPT的主要内容要点"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-ppt">
                                    <i class="fas fa-magic me-2"></i>生成PPT大纲
                                </button>
                            </div>
                        </form>
                        
                        <div id="ppt-result" class="mt-4" style="display: none;">
                            <h5>PPT大纲</h5>
                            <div id="ppt-outline" class="border p-3 bg-light"></div>
                            <div id="ppt-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-ppt">
                                    <i class="fas fa-download me-2"></i>导出大纲
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getVideoTemplate() {
        return `
            <div id="video-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-video me-2"></i>教学视频生成</h4>
                    </div>
                    <div class="card-body">
                        <form id="video-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="video-topic" class="form-label">视频主题</label>
                                        <input type="text" class="form-control" id="video-topic" placeholder="请输入视频主题">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="video-duration" class="form-label">视频时长</label>
                                        <select class="form-select" id="video-duration">
                                            <option value="5">5分钟</option>
                                            <option value="10">10分钟</option>
                                            <option value="15">15分钟</option>
                                            <option value="20">20分钟</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="video-type" class="form-label">视频类型</label>
                                        <select class="form-select" id="video-type">
                                            <option value="lecture">讲解型</option>
                                            <option value="demo">演示型</option>
                                            <option value="interactive">互动型</option>
                                            <option value="review">复习型</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="target-audience" class="form-label">目标观众</label>
                                        <select class="form-select" id="target-audience">
                                            <option value="students">学生</option>
                                            <option value="teachers">教师</option>
                                            <option value="parents">家长</option>
                                            <option value="general">通用</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="video-outline" class="form-label">内容大纲</label>
                                <textarea class="form-control" id="video-outline" rows="4" placeholder="请输入视频的内容大纲"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-video">
                                    <i class="fas fa-magic me-2"></i>生成视频脚本
                                </button>
                            </div>
                        </form>
                        
                        <div id="video-result" class="mt-4" style="display: none;">
                            <h5>视频脚本</h5>
                            <div id="video-script" class="border p-3 bg-light"></div>
                            <div id="video-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-video">
                                    <i class="fas fa-download me-2"></i>导出脚本
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStudentAnalysisTemplate() {
        return `
            <div id="student-analysis-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-chart-line me-2"></i>学情分析</h4>
                    </div>
                    <div class="card-body">
                        <form id="student-analysis-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="class-info" class="form-label">班级信息</label>
                                        <input type="text" class="form-control" id="class-info" placeholder="请输入班级信息">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="analysis-period" class="form-label">分析周期</label>
                                        <select class="form-select" id="analysis-period">
                                            <option value="week">一周</option>
                                            <option value="month">一个月</option>
                                            <option value="semester">一学期</option>
                                            <option value="year">一学年</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="analysis-focus" class="form-label">分析重点</label>
                                        <select class="form-select" id="analysis-focus">
                                            <option value="performance">学习成绩</option>
                                            <option value="behavior">学习行为</option>
                                            <option value="attitude">学习态度</option>
                                            <option value="comprehensive">综合分析</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="data-source" class="form-label">数据来源</label>
                                        <select class="form-select" id="data-source">
                                            <option value="test">测试成绩</option>
                                            <option value="homework">作业情况</option>
                                            <option value="participation">课堂参与</option>
                                            <option value="mixed">综合数据</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="student-data" class="form-label">学生数据</label>
                                <textarea class="form-control" id="student-data" rows="4" placeholder="请输入学生的相关数据（成绩、表现等）"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-analysis">
                                    <i class="fas fa-magic me-2"></i>生成分析报告
                                </button>
                            </div>
                        </form>
                        
                        <div id="analysis-result" class="mt-4" style="display: none;">
                            <h5>学情分析报告</h5>
                            <div id="analysis-content" class="border p-3 bg-light"></div>
                            <div id="analysis-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-analysis">
                                    <i class="fas fa-download me-2"></i>导出报告
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getContentAnalysisTemplate() {
        return `
            <div id="content-analysis-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-search me-2"></i>内容分析工具</h4>
                    </div>
                    <div class="card-body">
                        <form id="content-analysis-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="content-analysis-type" class="form-label">分析类型</label>
                                        <select class="form-select" id="content-analysis-type">
                                            <option value="difficulty">难度分析</option>
                                            <option value="knowledge">知识点分析</option>
                                            <option value="structure">结构分析</option>
                                            <option value="quality">质量评估</option>
                                            <option value="comprehensive">综合分析</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="content-output-format" class="form-label">输出格式</label>
                                        <select class="form-select" id="content-output-format">
                                            <option value="detailed">详细报告</option>
                                            <option value="summary">摘要总结</option>
                                            <option value="points">要点列表</option>
                                            <option value="chart">图表分析</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="content-text" class="form-label">待分析内容</label>
                                <textarea class="form-control" id="content-text" rows="6" placeholder="请输入需要分析的教学内容"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="content-focus" class="form-label">重点关注</label>
                                <input type="text" class="form-control" id="content-focus" placeholder="请输入重点关注的方面（可选）">
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="analyze-content">
                                    <i class="fas fa-magic me-2"></i>开始分析
                                </button>
                            </div>
                        </form>
                        
                        <div id="content-analysis-result" class="mt-4" style="display: none;">
                            <h5>分析结果</h5>
                            <div id="content-analysis-content" class="border p-3 bg-light"></div>
                            <div id="content-analysis-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-content-analysis">
                                    <i class="fas fa-download me-2"></i>导出分析
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAssessmentTemplate() {
        return `
            <div id="assessment-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-clipboard-check me-2"></i>评估方案</h4>
                    </div>
                    <div class="card-body">
                        <form id="assessment-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="assessment-type" class="form-label">评估类型</label>
                                        <select class="form-select" id="assessment-type">
                                            <option value="formative">形成性评估</option>
                                            <option value="summative">总结性评估</option>
                                            <option value="diagnostic">诊断性评估</option>
                                            <option value="authentic">真实性评估</option>
                                            <option value="peer">同伴评估</option>
                                            <option value="self">自我评估</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="assessment-methods" class="form-label">评估方法</label>
                                        <select class="form-select" id="assessment-methods">
                                            <option value="written">书面测试</option>
                                            <option value="oral">口头评估</option>
                                            <option value="practical">实践操作</option>
                                            <option value="portfolio">作品集评估</option>
                                            <option value="observation">观察记录</option>
                                            <option value="project">项目评估</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="assessment-timeframe" class="form-label">时间安排</label>
                                        <select class="form-select" id="assessment-timeframe">
                                            <option value="daily">日常评估</option>
                                            <option value="weekly">周期评估</option>
                                            <option value="monthly">月度评估</option>
                                            <option value="semester">学期评估</option>
                                            <option value="annual">年度评估</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="target-students" class="form-label">目标学生</label>
                                        <input type="text" class="form-control" id="target-students" placeholder="请输入目标学生群体">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="evaluation-goals" class="form-label">评估目标</label>
                                <textarea class="form-control" id="evaluation-goals" rows="4" placeholder="请输入评估的具体目标和要求"></textarea>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="generate-assessment">
                                    <i class="fas fa-magic me-2"></i>生成评估方案
                                </button>
                            </div>
                        </form>
                        
                        <div id="assessment-result" class="mt-4" style="display: none;">
                            <h5>评估方案</h5>
                            <div id="assessment-content" class="border p-3 bg-light"></div>
                            <div id="assessment-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-assessment">
                                    <i class="fas fa-download me-2"></i>导出方案
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getKnowledgeGraphTemplate() {
        return `
            <div id="knowledge-graph-tool" class="tool-content">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-project-diagram me-2"></i>知识图谱</h4>
                    </div>
                    <div class="card-body">
                        <form id="knowledge-graph-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="knowledge-domain" class="form-label">知识领域</label>
                                        <input type="text" class="form-control" id="knowledge-domain" placeholder="请输入知识领域">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="graph-type" class="form-label">图谱类型</label>
                                        <select class="form-select" id="graph-type">
                                            <option value="concept">概念图谱</option>
                                            <option value="hierarchical">层次图谱</option>
                                            <option value="network">网络图谱</option>
                                            <option value="timeline">时间线图谱</option>
                                            <option value="process">流程图谱</option>
                                            <option value="mind">思维导图</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="detail-level" class="form-label">详细程度</label>
                                        <select class="form-select" id="detail-level">
                                            <option value="basic">基础概览</option>
                                            <option value="detailed">详细分析</option>
                                            <option value="comprehensive">全面深入</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="graph-output-format" class="form-label">输出格式</label>
                                        <select class="form-select" id="graph-output-format">
                                            <option value="text">文本描述</option>
                                            <option value="mermaid">Mermaid图表</option>
                                            <option value="json">JSON数据</option>
                                            <option value="outline">大纲结构</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="focus-areas" class="form-label">重点关注领域</label>
                                <input type="text" class="form-control" id="focus-areas" placeholder="请输入重点关注的知识领域（可选）">
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="build-knowledge-graph">
                                    <i class="fas fa-magic me-2"></i>构建知识图谱
                                </button>
                            </div>
                        </form>
                        
                        <div id="knowledge-graph-result" class="mt-4" style="display: none;">
                            <h5>知识图谱</h5>
                            <div id="knowledge-graph-content" class="border p-3 bg-light"></div>
                            <div id="knowledge-graph-actions" class="mt-3" style="display: none;">
                                <button class="btn btn-success" id="export-knowledge-graph">
                                    <i class="fas fa-download me-2"></i>导出图谱
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', async () => {
    const app = new TeacherAssistantApp();
    await app.init();
});