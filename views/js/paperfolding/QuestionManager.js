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
    this.currentTask = 'task1'; // 默认任务设置为task1，与HTML中的active按钮保持一致
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
        if (this.currentTask === 'task4') {
          // task4暂未实现，显示提示信息
          throw new Error('任务肆功能正在开发中，敬请期待！');
        } else if (this.currentTask === 'task3') {
          // 加载task3数据 - 直接使用task3Filter的初始化方法
          const filteredQuestions = await this.task3Filter.initializeFilter();
          // initializeFilter已经确保题目被正确加载，直接使用返回的结果
          this.allQuestions = filteredQuestions || [];
          console.log(`task3加载完成: ${this.allQuestions.length} 题`);
          
          // 如果仍然没有题目，尝试手动选择第一个题目集
          if (this.allQuestions.length === 0) {
            console.log('task3筛选器未返回题目，手动选择第一个题目集');
            this.allQuestions = this.task3Filter.selectQuestionSet(0) || [];
          }
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
          
          this.allQuestions = lines.map((line, index) => {
            const question = JSON.parse(line);
            // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
            if (question.image) {
              question.image_path = this.config.getImageBasePath() + question.image;
            }
            // 为题目添加唯一ID
            question.id = `task1_${index + 1}`;
            return question;
          });
        }
        
        console.log(`常规模式：加载了${this.currentTask}题库，共 ${this.allQuestions.length} 道题目`);
      } else {
        // 邀请码模式：自动检测并设置正确的任务类型
        await this.detectAndSetTaskForInviteCode(inviteCodeData);
        // 加载特定题目集
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
   * 检测并设置邀请码对应的任务类型
   */
  async detectAndSetTaskForInviteCode(inviteCodeData) {
    if (!inviteCodeData || !inviteCodeData.setId) {
      console.log('Invalid invite code data');
      return false;
    }

    // 邀请码只映射到setId，不指定具体任务
    // 当用户切换任务时，会根据当前任务和setId加载对应的题目集
    console.log(`Invite code maps to setId: ${inviteCodeData.setId}`);
    
    // 保持当前任务状态，不强制重置为task1
    // 如果当前任务未设置，则默认为task1
    if (!this.currentTask) {
      this.currentTask = 'task1';
    }
    console.log(`Current task maintained as: ${this.currentTask}`);
    return true;
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
    if (this.currentTask === 'task4') {
      throw new Error('任务肆功能正在开发中，敬请期待！');
    } else if (this.currentTask === 'task3') {
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
    this.allQuestions = targetQuestionSet.questions.map((question, index) => {
      // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
      if (question.image) {
        // 根据当前任务设置正确的图片基础路径
        if (this.currentTask === 'task4') {
          // task4暂未实现
          question.image_path = '../task4/task4_selected/' + question.image;
        } else if (this.currentTask === 'task3') {
          // task3的图片路径，数据文件中已包含fold/前缀
          question.image_path = '../task3/task3_selected/' + question.image;
        } else if (this.currentTask === 'task2') {
          // task2的图片路径需要根据实际情况调整
          question.image_path = '../task2/task2_selected/' + question.image;
        } else {
          question.image_path = this.config.getImageBasePath() + question.image;
        }
      }
      // 为题目添加唯一ID（如果还没有的话）
      if (!question.id) {
        question.id = `${this.currentTask}_set${inviteCodeData.setId}_${index + 1}`;
      }
      return question;
    });
    
    console.log(`邀请码模式：加载了题目集${inviteCodeData.setId}，共 ${this.allQuestions.length} 道题目`);
    
    // 如果是task3，需要将数据保存到localStorage并设置questionSets
    if (this.currentTask === 'task3') {
      const task3Filter = this.getCurrentFilter();
      if (task3Filter) {
        // 邀请码模式下，需要先初始化所有题目集，然后选择对应的题目集
        await task3Filter.initializeFilter(this.allQuestions);
        
        // 根据setId选择对应的题目集（setId从1开始，数组索引从0开始）
        const targetSetIndex = inviteCodeData.setId - 1;
        if (targetSetIndex >= 0 && targetSetIndex < task3Filter.questionSets.length) {
          task3Filter.selectQuestionSet(targetSetIndex);
          console.log(`邀请码模式：已选择题目集${inviteCodeData.setId}（索引${targetSetIndex}）并保存到localStorage`);
        } else {
          console.warn(`邀请码setId ${inviteCodeData.setId} 超出范围，使用默认题目集1`);
          task3Filter.selectQuestionSet(0);
        }
      }
    }
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
      // 清除task3题目缓存和选择缓存
      localStorage.removeItem('paperfolding_questions_task3');
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
   * 清除当前任务的localStorage缓存
   */
  clearCurrentTaskCache() {
    try {
      if (this.currentTask === 'task1') {
        localStorage.removeItem('paperfolding_questions_task1');
        localStorage.removeItem('paperfolding_answers_task1');
        console.log('已清除task1的localStorage缓存');
      } else if (this.currentTask === 'task2') {
        localStorage.removeItem('paperfolding_questions_task2');
        localStorage.removeItem('paperfolding_answers_task2');
        console.log('已清除task2的localStorage缓存');
      } else if (this.currentTask === 'task3') {
        localStorage.removeItem('paperfolding_questions_task3');
        localStorage.removeItem('paperfolding_task3_selection');
        localStorage.removeItem('paperfolding_answers_task3');
        console.log('已清除task3的localStorage缓存');
      }
    } catch (error) {
      console.warn('清除当前任务localStorage缓存失败:', error);
    }
  }

  /**
   * 加载task2题目数据
   */
  async loadTask2Questions() {
    try {
      // 从merged_dataset_fixed_paths.jsonl文件加载题目数据
      const response = await fetch('../task2/task2_selected/merged_dataset_fixed_paths.jsonl');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.trim().split('\n');
      this.allQuestions = [];
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          try {
            const questionData = JSON.parse(line);
            
            // 从图片路径中提取折叠步数和形状信息
             const imagePath = questionData.image;
             let steps = 3; // 默认3步
             let shape = 'unknown';
             let foldType = 'fold_1'; // 默认fold_1类型
             
             // 解析图片路径获取步数信息和fold类型
             if (imagePath.includes('fold_1/')) {
               steps = 3;
               foldType = 'fold_1';
             } else if (imagePath.includes('fold_2/')) {
               steps = 4;
               foldType = 'fold_2';
             } else {
               // 如果不包含fold_1或fold_2路径，则认为是other类型
               // 这些题目来自other.jsonl，应该被归类为'other'类型
               steps = 'other';
               foldType = 'other';
             }
             
             // 解析形状信息
             if (imagePath.includes('circle')) {
               shape = 'circle';
             } else if (imagePath.includes('square')) {
               shape = 'square';
             } else if (imagePath.includes('Rectangle')) {
               shape = 'rectangle';
             } else if (imagePath.includes('Hexagon')) {
               shape = 'hexagon';
             } else if (imagePath.includes('House')) {
               shape = 'house';
             }
             
             this.allQuestions.push({
               id: `task2_${index + 1}`, // 为题目添加唯一ID
               image: questionData.image,
               image_path: `../task2/task2_selected/${questionData.image}`,
               answer: questionData.answer,
               steps: steps,
               shape: shape,
               foldType: foldType
             });
          } catch (parseError) {
            console.warn('解析题目数据失败:', parseError, line);
          }
        }
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
        id: `task2_sample_${i}`, // 为示例题目添加唯一ID
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
    
    console.log(`任务切换: ${this.currentTask} -> ${task}`);
    this.currentTask = task;
    
    // 重新加载题目数据
    try {
      await this.loadQuestions(this.currentInviteCodeData);
      
      // 在切换任务时，强制清除筛选器缓存并重新初始化
      if (this.currentTask !== 'task3') {
        // 清除筛选器缓存
        if (this.getCurrentFilter().clearStoredQuestions) {
          this.getCurrentFilter().clearStoredQuestions();
        }
        if (this.getCurrentFilter().baseQuestions !== undefined) {
          this.getCurrentFilter().baseQuestions = null;
        }
        console.log('任务切换：已清除筛选器缓存，强制重新生成');
        
        // 重新初始化筛选器
        await this.getCurrentFilter().initializeFilter(this.allQuestions);
        
        // 应用默认筛选器（显示全部题目）
        this.getCurrentFilter().applyFilter(this.allQuestions, 'all');
      } else {
        console.log('任务切换到task3：题目已在loadQuestions中初始化');
      }
      
      console.log(`任务切换成功: ${task}, 加载了 ${this.allQuestions.length} 道题目`);
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
    if (this.currentTask === 'task4') {
      // task4暂未实现，返回task1筛选器作为默认
      return this.task1Filter;
    } else if (this.currentTask === 'task3') {
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

  /**
   * 获取筛选后的题目
   */
  getFilteredQuestions() {
    return this.getCurrentFilter().getFilteredQuestions();
  }

  /**
   * 随机加载一个题目集（常规模式）
   */
  async loadRandomQuestionSet() {
    try {
      // 根据当前任务确定题目集文件路径
      let questionSetsPath;
      if (this.currentTask === 'task4') {
        throw new Error('任务肆功能正在开发中，敬请期待！');
      } else if (this.currentTask === 'task3') {
        questionSetsPath = '../task3/all_question_sets.json';
      } else if (this.currentTask === 'task2') {
        questionSetsPath = '../task2/all_question_sets.json';
      } else {
        questionSetsPath = '../task1/all_question_sets.json';
      }
      
      // 加载所有题目集
      const response = await fetch(questionSetsPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const allQuestionSets = await response.json();
      
      if (!allQuestionSets || allQuestionSets.length === 0) {
        throw new Error('没有可用的题目集');
      }
      
      // 随机选择一个题目集
      const randomIndex = Math.floor(Math.random() * allQuestionSets.length);
      const selectedQuestionSet = allQuestionSets[randomIndex];
      
      console.log(`随机选择了题目集 ${selectedQuestionSet.setId}，共 ${selectedQuestionSet.questions.length} 道题目`);
      
      // 转换题目数据格式
      this.allQuestions = selectedQuestionSet.questions.map((question, index) => {
        // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
        if (question.image) {
          // 根据当前任务设置正确的图片基础路径
          if (this.currentTask === 'task4') {
            question.image_path = '../task4/task4_selected/' + question.image;
          } else if (this.currentTask === 'task3') {
            question.image_path = '../task3/task3_selected/' + question.image;
          } else if (this.currentTask === 'task2') {
            question.image_path = '../task2/task2_selected/' + question.image;
          } else {
            question.image_path = this.config.getImageBasePath() + question.image;
          }
        }
        // 为题目添加唯一ID（如果还没有的话）
        if (!question.id) {
          question.id = `${this.currentTask}_random_set${selectedQuestionSet.setId}_${index + 1}`;
        }
        return question;
      });
      
      console.log(`常规模式随机加载完成：题目集${selectedQuestionSet.setId}，共 ${this.allQuestions.length} 道题目`);
      
    } catch (error) {
      console.error('随机加载题目集失败:', error);
      throw error;
    }
  }

  /**
   * 重新生成题目
   */
  async regenerateQuestions(callback) {
    console.log('开始重新生成题目，清除当前任务缓存...');
    
    // 清除localStorage中的当前任务相关缓存
    this.clearCurrentTaskCache();
    
    // 清除筛选器缓存
    const currentFilter = this.getCurrentFilter();
    if (currentFilter.clearStoredQuestions) {
      currentFilter.clearStoredQuestions();
    }
    if (currentFilter.baseQuestions !== undefined) {
      currentFilter.baseQuestions = null;
    }
    
    // 检查是否为邀请码模式（非常规模式）
    if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
      console.log('邀请码模式：重新加载题目集');
      try {
        // 重新加载邀请码对应的题目集
        await this.loadQuestions(this.currentInviteCodeData);
        
        // 强制重新初始化筛选器
        if (this.currentTask !== 'task3') {
          await currentFilter.initializeFilter(this.allQuestions);
        }
        
        // 应用默认筛选器（显示全部题目）
        currentFilter.applyFilter(this.allQuestions, 'all');
        
        console.log(`邀请码模式重新生成完成: ${this.allQuestions.length} 道题目`);
      } catch (error) {
        console.error('邀请码模式重新生成题目失败:', error);
        // 如果重新加载失败，回退到原有逻辑
        currentFilter.regenerateQuestions(this.allQuestions);
      }
    } else {
      // 常规模式：随机选择一个新的题目集
      console.log('常规模式：随机选择新题目集');
      try {
        if (this.currentTask === 'task3') {
          // task3使用自己的regenerateQuestions方法来处理题目集选择
          await currentFilter.regenerateQuestions(this.allQuestions);
          // task3Filter会自动更新this.allQuestions，所以我们需要获取更新后的题目
          this.allQuestions = currentFilter.getFilteredQuestions();
        } else {
          await this.loadRandomQuestionSet();
          
          // 强制重新初始化筛选器
          await currentFilter.initializeFilter(this.allQuestions);
          
          // 应用默认筛选器（显示全部题目）
          currentFilter.applyFilter(this.allQuestions, 'all');
        }
        
        console.log(`常规模式重新生成完成: ${this.allQuestions.length} 道题目`);
      } catch (error) {
        console.error('常规模式随机选择题目集失败:', error);
        // 如果随机选择失败，回退到原有逻辑
        currentFilter.regenerateQuestions(this.allQuestions);
      }
    }
    
    console.log('重新生成题目完成，所有缓存已清除');
    
    if (callback) {
      callback();
    }
  }
}