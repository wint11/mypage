import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 任务四题目筛选器
 * 负责从task4\all_question_sets.json中加载和管理题目集
 */
export class Task4Filter {
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
    console.log('初始化任务四筛选器');
    
    // 尝试从本地存储加载
    const stored = this.loadQuestionsFromStorage();
    
    if (stored && stored.filteredQuestions && stored.filteredQuestions.length > 0 && stored.questionSets) {
      console.log('从本地存储加载任务四题目');
      this.filteredQuestions = stored.filteredQuestions;
      this.questionSets = stored.questionSets;
      this.currentSetIndex = stored.currentSetIndex || 0;
      this.currentQuestionSet = this.questionSets[this.currentSetIndex] || [];
      console.log(`从缓存加载完成: ${this.filteredQuestions.length} 题`);
      return this.filteredQuestions;
    } else {
      console.log('重新加载任务四题目集');
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
      // 加载题目集数据
      const response = await fetch('/task4/all_question_sets.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 适配JSON文件的实际结构：直接是题目集数组
      this.questionSets = Array.isArray(data) ? data.map(set => set.questions) : [];
      
      console.log(`任务四：成功加载 ${this.questionSets.length} 个题目集`);
      
      // 尝试加载上次选择的题目集索引
      const lastSelection = this.loadLastSelection();
      const setIndex = (lastSelection >= 0 && lastSelection < this.questionSets.length) ? lastSelection : 0;
      
      // 选择题目集
      if (this.questionSets.length > 0) {
        this.selectQuestionSet(setIndex);
      }
      
      return this.filteredQuestions;
    } catch (error) {
      console.error('加载任务四题目集失败:', error);
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
      
      // 转换题目格式以适配现有系统
      this.filteredQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task4/task4_selected/' + q.image,
        answer: q.answer,
        // 从路径中提取题目类型和难度
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        // 为题目添加唯一ID，使用实际的setId
        id: `task4_set${actualSetId}_${index + 1}`
      }));
      
      console.log(`任务四：选择题目集 ${targetSetIndex + 1}，包含 ${this.filteredQuestions.length} 题`);
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
    if (imagePath.includes('_2DTo3D_N/')) {
      return 'N'; // 折纸推理
    } else if (imagePath.includes('_2DTo3D_Y/')) {
      return 'Y'; // 3D投影推理
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
      // 显示当前题目集的所有题目
      return this.filteredQuestions;
    } else if (filterType === 'easy') {
      // 只显示简单题目
      this.filteredQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task4/task4_selected/' + q.image,
        answer: q.answer,
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        id: `task4_set${actualSetId}_easy_${index + 1}`
      })).filter(q => q.difficulty === 'easy');
    } else if (filterType === 'hard') {
      // 只显示困难题目
      this.filteredQuestions = this.currentQuestionSet.map((q, index) => ({
        image_path: '../task4/task4_selected/' + q.image,
        answer: q.answer,
        questionType: this.extractQuestionTypeFromPath(q.image),
        difficulty: this.extractDifficultyFromPath(q.image),
        id: `task4_set${actualSetId}_hard_${index + 1}`
      })).filter(q => q.difficulty === 'hard');
    }
    
    console.log(`任务四筛选结果: ${this.filteredQuestions.length} 题 (${filterType})`);
    
    // 保存到本地存储
    this.saveQuestionsToStorage();
    
    return this.filteredQuestions;
  }

  /**
   * 重新生成题目（重新选择题目集）
   */
  regenerateQuestions() {
    console.log('重新生成任务四题目');
    
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
      localStorage.setItem('paperfolding_questions_task4', JSON.stringify(data));
      console.log('任务四题目已保存到本地存储');
    } catch (error) {
      console.error('保存任务四题目到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载题目
   */
  loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('paperfolding_questions_task4');
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
          console.log('存储的任务四题目已过期，将重新生成');
          this.clearStoredQuestions();
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载任务四题目失败:', error);
      this.clearStoredQuestions();
    }
    return null;
  }

  /**
   * 清除存储的题目
   */
  clearStoredQuestions() {
    try {
      localStorage.removeItem('paperfolding_questions_task4');
      localStorage.removeItem('paperfolding_task4_last_selection');
      console.log('已清除存储的任务四题目');
    } catch (error) {
      console.error('清除存储的任务四题目失败:', error);
    }
  }

  /**
   * 保存上次选择的题目集索引
   */
  saveLastSelection(setIndex) {
    try {
      localStorage.setItem('paperfolding_task4_last_selection', setIndex.toString());
    } catch (error) {
      console.error('保存任务四题目集选择失败:', error);
    }
  }

  /**
   * 加载上次选择的题目集索引
   */
  loadLastSelection() {
    try {
      const stored = localStorage.getItem('paperfolding_task4_last_selection');
      return stored ? parseInt(stored) : 0;
    } catch (error) {
      console.error('加载任务四题目集选择失败:', error);
      return 0;
    }
  }

  /**
   * 显示重新生成成功提示
   */
  showRegenerateSuccess() {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    statusDiv.innerHTML = '<i class="bi bi-arrow-clockwise"></i>任务四题目集已重新选择！';
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  /**
   * 获取题目集选择器HTML
   */
  getQuestionSetSelectorHTML() {
    if (this.questionSets.length === 0) {
      return '';
    }
    
    let html = '<div class="question-set-selector mb-3">';
    html += '<label for="questionSetSelect" class="form-label">选择题目集:</label>';
    html += '<select id="questionSetSelect" class="form-select">';
    
    for (let i = 0; i < this.questionSets.length; i++) {
      const selected = i === this.currentSetIndex ? 'selected' : '';
      const setType = i < 10 ? 'N类型(折纸推理)' : 'Y类型(3D投影推理)';
      html += `<option value="${i}" ${selected}>题目集 ${i + 1} - ${setType} (${this.questionSets[i].length}题)</option>`;
    }
    
    html += '</select>';
    html += '</div>';
    
    return html;
  }

  /**
   * 绑定题目集选择器事件
   */
  bindQuestionSetSelector() {
    const selector = document.getElementById('questionSetSelect');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const setIndex = parseInt(e.target.value);
        this.selectQuestionSet(setIndex);
        
        // 触发题目更新事件
        const event = new CustomEvent('questionSetChanged', {
          detail: {
            setIndex: setIndex,
            questionCount: this.filteredQuestions.length
          }
        });
        document.dispatchEvent(event);
      });
    }
  }

  // Getters
  getFilteredQuestions() {
    return this.filteredQuestions;
  }

  getCurrentFilter() {
    return this.currentFilter;
  }

  getCurrentSeed() {
    return this.currentSeed;
  }

  getQuestionSets() {
    return this.questionSets;
  }

  getCurrentSetIndex() {
    return this.currentSetIndex;
  }
  
  /**
   * 更新筛选信息显示
   */
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      let filterText = '全部题目';
      if (this.currentFilter === 'N') {
        filterText = '折纸推理题目';
      } else if (this.currentFilter === 'Y') {
        filterText = '3D投影推理题目';
      } else if (this.currentFilter === 'easy') {
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