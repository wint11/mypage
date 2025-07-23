import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 任务五题目筛选器
 * 负责从task5\all_question_sets.json中加载和管理题目集
 * 修复了task4中的路径问题，使用统一的相对路径格式
 */
export class Task5Filter {
  constructor() {
    this.config = new Config();
    this.questionSets = []; // 所有题目集
    this.currentQuestionSet = []; // 当前选中的题目集
    this.currentSetIndex = 0; // 当前题目集索引
    this.filteredQuestions = [];
    this.currentFilter = 'all';
    this.currentSeed = null;
  }

  /**
   * 初始化筛选器，加载题目集数据
   */
  async initializeFilter() {
    console.log('初始化任务五筛选器');
    
    // 尝试从本地存储加载
    const stored = this.loadQuestionsFromStorage();
    
    if (stored && stored.filteredQuestions && stored.filteredQuestions.length > 0 && stored.questionSets) {
      console.log('从本地存储加载任务五题目');
      this.filteredQuestions = stored.filteredQuestions;
      this.questionSets = stored.questionSets;
      this.currentSetIndex = stored.currentSetIndex || 0;
      this.currentQuestionSet = this.questionSets[this.currentSetIndex] || [];
      console.log(`从缓存加载完成: ${this.filteredQuestions.length} 题`);
      return this.filteredQuestions;
    } else {
      console.log('重新加载任务五题目集');
      const result = await this.loadFromServer();
      console.log(`从服务器加载完成: ${this.filteredQuestions.length} 题`);
      return result;
    }
  }

  /**
   * 从服务器加载题目集数据
   */
  async loadFromServer() {
    try {
      // 加载题目集数据 - 使用相对路径，与task2、task3保持一致
      const response = await fetch('../task5/all_question_sets.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 适配JSON文件的实际结构：直接是题目集数组
      this.questionSets = Array.isArray(data) ? data.map(set => set.questions) : [];
      
      console.log(`任务五：成功加载 ${this.questionSets.length} 个题目集`);
      
      // 尝试加载上次选择的题目集索引
      const lastSelection = this.loadLastSelection();
      const setIndex = (lastSelection >= 0 && lastSelection < this.questionSets.length) ? lastSelection : 0;
      
      // 选择题目集
      if (this.questionSets.length > 0) {
        this.selectQuestionSet(setIndex);
      }
      
      return this.filteredQuestions;
    } catch (error) {
      console.error('加载任务五题目集失败:', error);
      this.filteredQuestions = [];
      return this.filteredQuestions;
    }
  }

  /**
   * 选择题目集
   */
  selectQuestionSet(setIndex) {
    // 尝试从QuestionManager中获取邀请码数据
    let actualSetId = setIndex + 1; // 默认值
    let targetSetIndex = setIndex; // 默认使用传入的索引
    
    try {
      const questionManager = window.paperFoldingTest?.questionManager;
      if (questionManager && questionManager.currentInviteCodeData && questionManager.currentInviteCodeData.setId) {
        actualSetId = questionManager.currentInviteCodeData.setId;
        console.log(`使用邀请码中的setId: ${actualSetId}`);
        
        // 根据邀请码中的setId计算出对应的题目集索引
        targetSetIndex = actualSetId - 1; // setId从1开始，索引从0开始
        console.log(`根据setId计算的题目集索引: ${targetSetIndex}`);
        
        // 确保索引在有效范围内
        if (targetSetIndex < 0 || targetSetIndex >= this.questionSets.length) {
          console.warn(`计算的题目集索引 ${targetSetIndex} 超出范围，使用默认索引 ${setIndex}`);
          targetSetIndex = setIndex;
        }
      }
    } catch (error) {
      console.warn('获取邀请码setId失败，使用默认值', error);
    }
    
    // 使用计算出的targetSetIndex选择题目集
    if (targetSetIndex >= 0 && targetSetIndex < this.questionSets.length) {
      this.currentSetIndex = targetSetIndex;
      this.currentQuestionSet = this.questionSets[targetSetIndex];
      
      // 转换题目格式以适配现有系统 - 修复路径问题，使用与task2、task3一致的相对路径
      this.filteredQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task5/task5_selected/' + q.image,
        answer: q.answer,
        // 从路径中提取题目类型和难度
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        // 为题目添加唯一ID，使用实际的setId
        id: `task5_set${actualSetId}_${index + 1}`
      }));
      
      console.log(`任务五：选择题目集 ${targetSetIndex + 1}，包含 ${this.filteredQuestions.length} 题`);
      console.log(`题目类型分布:`, this.getQuestionTypeDistribution());
      
      // 保存选择和题目到本地存储
      this.saveLastSelection(targetSetIndex);
      this.saveQuestionsToStorage();
    }
  }

  /**
   * 从路径中提取题目类型
   */
  extractQuestionTypeFromPath(imagePath) {
    if (imagePath.includes('_3DTo2D_N/')) {
      return 'N'; // 3D到2D推理
    } else if (imagePath.includes('_3DTo2D_Y/')) {
      return 'Y'; // 3D到2D投影推理
    }
    return 'unknown';
  }

  /**
   * 从路径中提取难度
   */
  extractDifficultyFromPath(imagePath) {
    if (imagePath.includes('/easy/')) {
      return 'easy';
    } else if (imagePath.includes('/hard/')) {
      return 'hard';
    }
    return 'unknown';
  }

  /**
   * 获取题目类型分布统计
   */
  getQuestionTypeDistribution() {
    const distribution = {
      N_easy: 0,
      N_hard: 0,
      Y_easy: 0,
      Y_hard: 0
    };
    
    this.filteredQuestions.forEach(q => {
      const type = q.questionType;
      const difficulty = q.difficulty;
      const key = `${type}_${difficulty}`;
      if (distribution.hasOwnProperty(key)) {
        distribution[key]++;
      }
    });
    
    return distribution;
  }

  /**
   * 应用筛选
   */
  applyFilter(allQuestions, filterType = 'all') {
    this.currentFilter = filterType;
    
    // 获取实际的setId（从邀请码中获取）
    let actualSetId = this.currentSetIndex + 1; // 默认值
    
    // 尝试从QuestionManager中获取邀请码数据
    try {
      const questionManager = window.paperFoldingTest?.questionManager;
      if (questionManager && questionManager.currentInviteCodeData && questionManager.currentInviteCodeData.setId) {
        actualSetId = questionManager.currentInviteCodeData.setId;
        console.log(`筛选时使用邀请码中的setId: ${actualSetId}`);
      }
    } catch (error) {
      console.warn('获取邀请码setId失败，使用默认值', error);
    }
    
    if (filterType === 'all') {
      // 显示当前题目集的所有题目 - 重新生成完整的题目列表
      this.filteredQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task5/task5_selected/' + q.image,
        answer: q.answer,
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        id: `task5_set${actualSetId}_${index + 1}`
      }));
    } else if (filterType === 'easy') {
      // 只显示简单题目 - 保持原始索引
      const allQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task5/task5_selected/' + q.image,
        answer: q.answer,
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        id: `task5_set${actualSetId}_${index + 1}`,
        originalIndex: index
      }));
      this.filteredQuestions = allQuestions.filter(q => q.difficulty === 'easy');
    } else if (filterType === 'hard') {
      // 只显示困难题目 - 保持原始索引
      const allQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task5/task5_selected/' + q.image,
        answer: q.answer,
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        id: `task5_set${actualSetId}_${index + 1}`,
        originalIndex: index
      }));
      this.filteredQuestions = allQuestions.filter(q => q.difficulty === 'hard');
    }
    
    console.log(`任务五筛选结果: ${this.filteredQuestions.length} 题 (${filterType})`);
    
    // 保存到本地存储
    this.saveQuestionsToStorage();
    
    return this.filteredQuestions;
  }

  /**
   * 重新生成题目（重新选择题目集）
   */
  regenerateQuestions() {
    console.log('重新生成任务五题目');
    
    // 清除存储的数据
    this.clearStoredQuestions();
    
    // 随机选择一个题目集
    if (this.questionSets.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.questionSets.length);
      this.selectQuestionSet(randomIndex);
      this.showRegenerateSuccess();
    }
    
    return this.filteredQuestions;
  }

  /**
   * 保存题目到本地存储
   */
  saveQuestionsToStorage() {
    const data = {
      filteredQuestions: this.filteredQuestions,
      questionSets: this.questionSets,
      currentSetIndex: this.currentSetIndex,
      currentFilter: this.currentFilter,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('paperfolding_questions_task5', JSON.stringify(data));
      console.log('任务五题目已保存到本地存储');
    } catch (error) {
      console.error('保存任务五题目到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载题目
   */
  loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('paperfolding_questions_task5');
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
          console.log('任务五本地存储数据已过期，将重新加载');
          this.clearStoredQuestions();
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载任务五题目失败:', error);
      this.clearStoredQuestions();
    }
    return null;
  }

  /**
   * 清除存储的题目数据
   */
  clearStoredQuestions() {
    try {
      localStorage.removeItem('paperfolding_questions_task5');
      localStorage.removeItem('paperfolding_last_selection_task5');
      console.log('已清除任务五本地存储数据');
    } catch (error) {
      console.error('清除任务五本地存储数据失败:', error);
    }
  }

  /**
   * 保存上次选择的题目集索引
   */
  saveLastSelection(setIndex) {
    try {
      localStorage.setItem('paperfolding_last_selection_task5', setIndex.toString());
    } catch (error) {
      console.error('保存任务五上次选择失败:', error);
    }
  }

  /**
   * 加载上次选择的题目集索引
   */
  loadLastSelection() {
    try {
      const stored = localStorage.getItem('paperfolding_last_selection_task5');
      if (stored) {
        const index = parseInt(stored, 10);
        return isNaN(index) ? -1 : index;
      }
    } catch (error) {
      console.error('加载任务五上次选择失败:', error);
    }
    return -1;
  }

  /**
   * 显示重新生成成功消息
   */
  showRegenerateSuccess() {
    // 创建提示消息
    const message = document.createElement('div');
    message.textContent = '题目已重新生成！';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(message);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  /**
   * 获取当前筛选器类型
   */
  getCurrentFilter() {
    return this.currentFilter;
  }

  /**
   * 获取筛选后的题目
   */
  getFilteredQuestions() {
    return this.filteredQuestions;
  }

  /**
   * 获取题目总数
   */
  getTotalQuestions() {
    return this.filteredQuestions.length;
  }

  /**
   * 强制清除缓存（用于邀请码模式）
   */
  forceClearCache() {
    console.log('强制清除任务五缓存');
    this.clearStoredQuestions();
    this.filteredQuestions = [];
    this.questionSets = [];
    this.currentQuestionSet = [];
    this.currentSetIndex = 0;
    this.currentFilter = 'all';
  }

  /**
   * 更新筛选信息显示
   */
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      let filterText = '全部题目';
      if (this.currentFilter === 'easy') {
        filterText = '简单难度题目';
      } else if (this.currentFilter === 'hard') {
        filterText = '困难难度题目';
      }
      
      filterInfo.textContent = `当前筛选: ${filterText} (${this.filteredQuestions.length}题)`;
    }
  }

  /**
   * 更新跳转输入框的最大值
   */
  updateJumpInputMax() {
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
      jumpInput.max = this.filteredQuestions.length;
      jumpInput.placeholder = `1-${this.filteredQuestions.length}`;
    }
  }
}