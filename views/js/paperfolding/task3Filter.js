import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 任务三题目筛选器
 * 负责从task3\all_question_sets.json中加载和管理题目集
 */
export class Task3Filter {
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
    console.log('初始化任务三筛选器');
    
    // 尝试从本地存储加载
    const stored = this.loadQuestionsFromStorage();
    
    if (stored && stored.filteredQuestions && stored.filteredQuestions.length > 0 && stored.questionSets) {
      console.log('从本地存储加载任务三题目');
      this.filteredQuestions = stored.filteredQuestions;
      this.questionSets = stored.questionSets;
      this.currentSetIndex = stored.currentSetIndex || 0;
      this.currentQuestionSet = this.questionSets[this.currentSetIndex] || [];
      console.log(`从缓存加载完成: ${this.filteredQuestions.length} 题`);
      return this.filteredQuestions;
    } else {
      console.log('重新加载任务三题目集');
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
      const response = await fetch('/task3/all_question_sets.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 适配JSON文件的实际结构：直接是题目集数组
      this.questionSets = Array.isArray(data) ? data.map(set => set.questions) : [];
      
      console.log(`任务三：成功加载 ${this.questionSets.length} 个题目集`);
      
      // 尝试加载上次选择的题目集索引
      const lastSelection = this.loadLastSelection();
      const setIndex = (lastSelection >= 0 && lastSelection < this.questionSets.length) ? lastSelection : 0;
      
      // 选择题目集
      if (this.questionSets.length > 0) {
        this.selectQuestionSet(setIndex);
      }
      
      return this.filteredQuestions;
    } catch (error) {
      console.error('加载任务三题目集失败:', error);
      this.questionSets = [];
      this.filteredQuestions = [];
      return [];
    }
  }

  /**
   * 选择指定的题目集
   */
  selectQuestionSet(setIndex) {
    if (setIndex >= 0 && setIndex < this.questionSets.length) {
      this.currentSetIndex = setIndex;
      this.currentQuestionSet = this.questionSets[setIndex];
      
      // 转换数据格式以兼容现有系统
      this.filteredQuestions = this.currentQuestionSet.map((item, index) => ({
        id: `task3_set${setIndex + 1}_${index + 1}`, // 为题目添加唯一ID
        image_path: '/task3/task3_selected/' + item.image,
        question: '', // 任务三没有题干文字
        options: ['A', 'B', 'C', 'D'], // 固定选项
        correct_answer: item.answer
      }));
      
      console.log(`任务三：选择题目集 ${setIndex + 1}，包含 ${this.filteredQuestions.length} 题`);
      
      // 保存当前选择和题目数据到本地存储
      this.saveCurrentSelection();
      this.saveQuestionsToStorage();
      
      return this.filteredQuestions;
    }
    return [];
  }

  /**
   * 应用筛选
   */
  applyFilter(allQuestions, filterType = 'all') {
    this.currentFilter = filterType;
    
    // 任务三现在只支持"全部题目"，显示当前选中的题目集
    if (filterType === 'all') {
      // 如果还没有选择题目集，默认选择第一个
      if (!this.filteredQuestions || this.filteredQuestions.length === 0) {
        this.selectQuestionSet(this.currentSetIndex);
      }
    }
    // 移除对其他筛选类型的支持，因为任务三不再需要筛选功能
    
    // 确保显示正确的题目集索引
    const actualSetIndex = this.currentSetIndex + 1;
    console.log(`任务三筛选结果: ${this.filteredQuestions.length} 题 (题目集 ${actualSetIndex})`);
    
    return this.filteredQuestions;
  }

  /**
   * 获取下一个题目集
   */
  getNextQuestionSet() {
    const nextIndex = (this.currentSetIndex + 1) % this.questionSets.length;
    return this.selectQuestionSet(nextIndex);
  }

  /**
   * 获取上一个题目集
   */
  getPreviousQuestionSet() {
    const prevIndex = this.currentSetIndex === 0 ? this.questionSets.length - 1 : this.currentSetIndex - 1;
    return this.selectQuestionSet(prevIndex);
  }

  /**
   * 随机选择一个题目集
   */
  getRandomQuestionSet() {
    if (this.questionSets.length === 0) return [];
    
    const randomIndex = Math.floor(Math.random() * this.questionSets.length);
    return this.selectQuestionSet(randomIndex);
  }

  /**
   * 从路径中提取形状
   */
  extractShapeFromPath(imagePath) {
    // 任务三的文件名格式：fold/circle_001.png -> circle
    const fileName = imagePath.split('/').pop() || '';
    const match = fileName.match(/^([a-zA-Z]+)_/);
    if (match) {
      return match[1];
    }
    return 'unknown';
  }

  /**
   * 保存当前选择到本地存储
   */
  saveCurrentSelection() {
    const data = {
      currentSetIndex: this.currentSetIndex,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('paperfolding_task3_selection', JSON.stringify(data));
      console.log('任务三当前选择已保存到本地存储');
    } catch (error) {
      console.error('保存任务三选择到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载上次选择
   */
  loadLastSelection() {
    try {
      const stored = localStorage.getItem('paperfolding_task3_selection');
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age <= maxAge && data.currentSetIndex !== undefined) {
          return data.currentSetIndex;
        }
      }
    } catch (error) {
      console.error('从本地存储加载任务三选择失败:', error);
    }
    return 0; // 默认返回第一个题目集
  }

  /**
   * 清除存储的选择
   */
  clearStoredSelection() {
    try {
      localStorage.removeItem('paperfolding_task3_selection');
      console.log('已清除存储的任务三选择');
    } catch (error) {
      console.error('清除存储的任务三选择失败:', error);
    }
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
      localStorage.setItem('paperfolding_questions_task3', JSON.stringify(data));
      console.log('task3题目数据已保存到localStorage');
    } catch (error) {
      console.error('localStorage保存失败:', error);
    }
  }

  /**
   * 从本地存储加载题目
   */
  loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('paperfolding_questions_task3');
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
          console.log('存储的任务三题目已过期，将重新生成');
          this.clearStoredQuestions();
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载任务三题目失败:', error);
      this.clearStoredQuestions();
    }
    return null;
  }

  /**
   * 清除存储的题目
   */
  clearStoredQuestions() {
    try {
      localStorage.removeItem('paperfolding_questions_task3');
      localStorage.removeItem('paperfolding_task3_selection'); // 同时清除选择缓存
      console.log('已清除存储的任务三题目');
    } catch (error) {
      console.error('清除存储的任务三题目失败:', error);
    }
  }

  /**
   * 重新生成题目
   */
  async regenerateQuestions(allQuestions, filterType = 'all') {
    console.log('重新生成任务三题目');
    
    // 清除存储的数据
    this.clearStoredQuestions();
    
    // 重新从服务器加载
    const result = await this.loadFromServer();
    
    // 加载完成后，随机选择一个新的题目集并保存到localStorage
    if (this.questionSets.length > 0) {
      this.getRandomQuestionSet(); // 这个方法会自动调用saveQuestionsToStorage
      console.log(`task3重新生成完成，已选择题目集 ${this.currentSetIndex + 1}，已保存到localStorage`);
    }
    
    return result;
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
    statusDiv.innerHTML = '<i class="bi bi-arrow-clockwise"></i>任务三题目已重新生成！';
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  /**
   * 更新筛选信息显示
   */
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      filterInfo.textContent = `当前筛选: 题目集 ${this.currentSetIndex + 1} (${this.filteredQuestions.length}题)`;
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

  /**
   * 显示题目集切换成功提示
   */
  showSetChangeSuccess() {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
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
    statusDiv.innerHTML = `<i class="bi bi-collection"></i>已切换到第 ${this.currentSetIndex + 1} 套题目！`;
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
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

  getQuestionSetsCount() {
    return this.questionSets.length;
  }

  getCurrentSetIndex() {
    return this.currentSetIndex;
  }

  getCurrentQuestionSet() {
    return this.currentQuestionSet;
  }
}