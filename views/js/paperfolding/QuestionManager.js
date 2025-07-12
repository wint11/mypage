/**
 * 题目管理器
 * 负责题目数据的加载、切换和管理
 */
export class QuestionManager {
  constructor(config, task1Filter, task2Filter, task3Filter) {
    this.config = config;
    this.task1Filter = task1Filter;
    this.task2Filter = task2Filter;
    this.task3Filter = task3Filter;
    this.allQuestions = [];
    this.currentTask = 'task2';
    this.currentInviteCodeData = null;
  }

  /**
   * 加载题目数据
   * @param {Object} inviteCodeData - 邀请码数据，包含inviteCode和setId
   */
  async loadQuestions(inviteCodeData) {
    try {
      if (!inviteCodeData) {
        throw new Error('邀请码数据无效');
      }
      
      // 检查是否为常规模式
      if (inviteCodeData.isRegularMode) {
        // 常规模式：根据当前任务加载对应的题库
        if (this.currentTask === 'task3') {
          // 加载task3数据 - 直接使用task3Filter的初始化方法
          await this.task3Filter.initializeFilter();
          // 默认选择第一个题目集
          this.task3Filter.selectQuestionSet(0);
          this.allQuestions = this.task3Filter.getFilteredQuestions();
        } else if (this.currentTask === 'task2') {
          // 加载task2数据
          await this.loadTask2Questions();
        } else {
          // 默认加载task1数据
          const response = await fetch('../task1/task1_selected_algorithm2.jsonl');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const text = await response.text();
          const lines = text.trim().split('\n');
          
          this.allQuestions = lines.map(line => {
            const question = JSON.parse(line);
            // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
            if (question.image) {
              question.image_path = this.config.getImageBasePath() + question.image;
            }
            return question;
          });
        }
        
        console.log(`常规模式：加载了${this.currentTask}题库，共 ${this.allQuestions.length} 道题目`);
      } else {
        // 邀请码模式：加载特定题目集
        await this.loadInviteCodeQuestions(inviteCodeData);
      }
      
      if (this.allQuestions.length === 0) {
        throw new Error('题目数据为空');
      }
      
      // 保存当前使用的邀请码信息
      this.currentInviteCodeData = inviteCodeData;
      
    } catch (error) {
      console.error('加载题目失败:', error);
      throw error;
    }
  }

  /**
   * 加载邀请码模式的题目
   */
  async loadInviteCodeQuestions(inviteCodeData) {
    if (!inviteCodeData.setId) {
      throw new Error('邀请码数据无效：缺少setId');
    }
    
    // 清除localStorage中的相关缓存，确保使用新的题目集
    this.clearLocalStorageCache();
    
    // 根据当前任务确定题目集文件路径
    let questionSetsPath;
    if (this.currentTask === 'task3') {
      questionSetsPath = '../task3/all_question_sets.json';
    } else if (this.currentTask === 'task2') {
      questionSetsPath = '../task2/all_question_sets.json';
    } else {
      questionSetsPath = '../task1/all_question_sets.json';
    }
    
    // 加载对应任务的题目集数据
    const response = await fetch(questionSetsPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const allQuestionSets = await response.json();
    
    // 根据setId找到对应的题目集
    const targetQuestionSet = allQuestionSets.find(set => set.setId === inviteCodeData.setId);
    if (!targetQuestionSet) {
      throw new Error(`找不到setId为${inviteCodeData.setId}的题目集`);
    }
    
    // 转换题目数据格式
    this.allQuestions = targetQuestionSet.questions.map(question => {
      // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
      if (question.image) {
        // 根据当前任务设置正确的图片基础路径
        if (this.currentTask === 'task3') {
          // task3的图片路径
          question.image_path = '../task3/task3_selected/' + question.image;
        } else if (this.currentTask === 'task2') {
          // task2的图片路径需要根据实际情况调整
          question.image_path = '../task2/task2_selected/' + question.image;
        } else {
          question.image_path = this.config.getImageBasePath() + question.image;
        }
      }
      return question;
    });
    
    console.log(`邀请码模式：加载了题目集${inviteCodeData.setId}，共 ${this.allQuestions.length} 道题目`);
  }

  /**
   * 清除localStorage缓存
   */
  clearLocalStorageCache() {
    try {
      // 清除task1题目缓存
      localStorage.removeItem('paperfolding_questions_task1');
      // 清除task2题目缓存
      localStorage.removeItem('paperfolding_questions_task2');
      // 清除task3题目缓存
      localStorage.removeItem('paperfolding_task3_selection');
      // 清除答案缓存
      localStorage.removeItem('paperfolding_answers_task1');
      localStorage.removeItem('paperfolding_answers_task2');
      localStorage.removeItem('paperfolding_answers_task3');
      console.log('已清除localStorage中的题目和答案缓存');
    } catch (error) {
      console.warn('清除localStorage缓存失败:', error);
    }
  }

  /**
   * 加载task2题目数据
   */
  async loadTask2Questions() {
    try {
      // 基于实际文件命名模式构造题目数据
      // 文件名格式: circle-id_X-fold_Y-sample_0-candidate_4-answ_Z.png
      this.allQuestions = [];
      
      // 根据实际文件列表构造题目
      const knownFiles = [
        // 1折题目 (fold_1)
        { id: 0, fold: 1, answer: 'C' }, { id: 1, fold: 1, answer: 'C' }, { id: 2, fold: 1, answer: 'C' },
        { id: 3, fold: 1, answer: 'A' }, { id: 4, fold: 1, answer: 'D' }, { id: 5, fold: 1, answer: 'B' },
        { id: 6, fold: 1, answer: 'C' }, { id: 7, fold: 1, answer: 'A' }, { id: 8, fold: 1, answer: 'C' },
        { id: 9, fold: 1, answer: 'A' }, { id: 10, fold: 1, answer: 'B' }, { id: 11, fold: 1, answer: 'C' },
        { id: 12, fold: 1, answer: 'B' }, { id: 13, fold: 1, answer: 'B' }, { id: 14, fold: 1, answer: 'A' },
        { id: 15, fold: 1, answer: 'A' }, { id: 16, fold: 1, answer: 'A' },
        
        // 2折题目 (fold_2)
        { id: 17, fold: 2, answer: 'A' }, { id: 18, fold: 2, answer: 'C' }, { id: 19, fold: 2, answer: 'B' },
        { id: 20, fold: 2, answer: 'D' }, { id: 21, fold: 2, answer: 'B' }, { id: 22, fold: 2, answer: 'A' },
        { id: 23, fold: 2, answer: 'D' }, { id: 24, fold: 2, answer: 'D' }, { id: 25, fold: 2, answer: 'D' },
        { id: 26, fold: 2, answer: 'A' }, { id: 27, fold: 2, answer: 'A' }, { id: 28, fold: 2, answer: 'D' },
        { id: 29, fold: 2, answer: 'D' }, { id: 30, fold: 2, answer: 'B' }, { id: 31, fold: 2, answer: 'C' },
        { id: 32, fold: 2, answer: 'A' }, { id: 33, fold: 2, answer: 'A' }
      ];
      
      knownFiles.forEach(file => {
        const imageName = `circle-id_${file.id}-fold_${file.fold}-sample_0-candidate_4-answ_${file.answer}.png`;
        const imagePath = `../task2/test_images/${imageName}`;
        
        this.allQuestions.push({
          image: imageName,
          image_path: imagePath,
          answer: file.answer,
          steps: file.fold + 2, // fold_1 对应 3步, fold_2 对应 4步
          shape: 'circle'
        });
      });
      
      console.log(`Task2数据加载完成: ${this.allQuestions.length} 题`);
    } catch (error) {
      console.error('加载task2数据失败:', error);
      // 如果加载失败，创建一些示例数据
      this.allQuestions = this.createTask2SampleData();
    }
  }
  
  /**
   * 创建task2示例数据
   */
  createTask2SampleData() {
    const sampleQuestions = [];
    const shapes = ['circle', 'square', 'triangle'];
    const steps = [3, 4, 5];
    
    for (let i = 1; i <= 30; i++) {
      const shape = shapes[i % shapes.length];
      const step = steps[i % steps.length];
      const questionId = String(i).padStart(3, '0');
      const imageName = `${shape}-id_${step}_${questionId}.png`;
      
      sampleQuestions.push({
        image: imageName,
        image_path: `../task2/test_images/${imageName}`,
        answer: ['A', 'B', 'C', 'D'][i % 4],
        steps: step,
        shape: shape
      });
    }
    
    console.log(`创建task2示例数据: ${sampleQuestions.length} 题`);
    return sampleQuestions;
  }

  /**
   * 切换任务
   */
  async switchTask(task, onClearAnswers) {
    if (task === this.currentTask) return false;
    
    this.currentTask = task;
    
    // 重新加载题目数据
    try {
      await this.loadQuestions(this.currentInviteCodeData);
      
      // 在切换任务时，强制清除筛选器缓存并重新初始化
      if (this.currentTask !== 'task3') {
        this.getCurrentFilter().clearStoredQuestions();
        this.getCurrentFilter().baseQuestions = null;
        console.log('任务切换：已清除筛选器缓存，强制重新生成');
        
        // 重新初始化筛选器
        this.getCurrentFilter().initializeFilter(this.allQuestions);
      } else {
        console.log('任务切换到task3：题目已在loadQuestions中初始化');
      }
      
      return true;
    } catch (error) {
      console.error('切换任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前筛选器
   */
  getCurrentFilter() {
    if (this.currentTask === 'task3') {
      return this.task3Filter;
    } else if (this.currentTask === 'task2') {
      return this.task2Filter;
    } else {
      return this.task1Filter;
    }
  }

  /**
   * 获取所有题目
   */
  getAllQuestions() {
    return this.allQuestions;
  }

  /**
   * 获取当前任务
   */
  getCurrentTask() {
    return this.currentTask;
  }

  /**
   * 获取当前邀请码数据
   */
  getCurrentInviteCodeData() {
    return this.currentInviteCodeData;
  }
}