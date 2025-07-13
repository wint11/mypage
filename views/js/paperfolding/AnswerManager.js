/**
 * 答案管理器
 * 负责答案的选择、保存、加载和管理
 */
export class AnswerManager {
  constructor(questionManager = null) {
    this.userAnswers = {};
    this.startTime = null;
    this.currentVersion = 'A';
    this.questionManager = questionManager;
  }

  /**
   * 选择选项
   */
  selectOption(optionValue, questionId) {
    this.userAnswers[questionId] = optionValue;
    const currentTask = this.questionManager ? this.questionManager.getCurrentTask() : 'task1';
    this.saveAnswersToStorage(currentTask);
    
    console.log(`题目 ${questionId} 选择了选项: ${optionValue}`);
    return true;
  }

  /**
   * 一键随机选择选项
   */
  quickSelectOption(filteredQuestions, currentInviteCodeData) {
    // 检查是否为邀请码模式（非常规模式），如果是则拦截
    if (currentInviteCodeData && !currentInviteCodeData.isRegularMode) {
      alert('当前模式下该功能不可用');
      return { selectedCount: 0, totalCount: 0 };
    }
    
    if (filteredQuestions.length === 0) {
      return { selectedCount: 0, totalCount: 0 };
    }
    
    // 为所有题目随机选择答案
    const options = ['A', 'B', 'C', 'D'];
    let selectedCount = 0;
    
    for (let i = 0; i < filteredQuestions.length; i++) {
      const question = filteredQuestions[i];
      // 如果该题目还没有答案，则随机选择一个
      if (!this.userAnswers[question.id]) {
        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedOption = options[randomIndex];
        this.userAnswers[question.id] = selectedOption;
        selectedCount++;
      }
    }
    
    // 保存答案到本地存储
    const currentTask = this.questionManager ? this.questionManager.getCurrentTask() : 'task1';
    this.saveAnswersToStorage(currentTask);
    
    return { selectedCount, totalCount: filteredQuestions.length };
  }

  /**
   * 保存答案到本地存储
   */
  saveAnswersToStorage(currentTask = 'task1') {
    try {
      const data = {
        answers: this.userAnswers,
        startTime: this.startTime,
        version: this.currentVersion,
        timestamp: Date.now()
      };
      
      let answerKey = 'paperfolding_answers_task1';
      if (currentTask === 'task2') {
        answerKey = 'paperfolding_answers_task2';
      } else if (currentTask === 'task3') {
        answerKey = 'paperfolding_answers_task3';
      }
      
      localStorage.setItem(answerKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  }

  /**
   * 从本地存储加载答案
   */
  loadAnswersFromStorage(currentTask = 'task1') {
    try {
      let answerKey = 'paperfolding_answers_task1';
      if (currentTask === 'task2') {
        answerKey = 'paperfolding_answers_task2';
      } else if (currentTask === 'task3') {
        answerKey = 'paperfolding_answers_task3';
      }
      
      const stored = localStorage.getItem(answerKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.userAnswers = data.answers || {};
        this.startTime = data.startTime || null; // 不自动设置开始时间
        this.currentVersion = data.version || 'A';
        console.log('从本地存储加载答案');
        return true;
      }
    } catch (error) {
      console.error('加载答案失败:', error);
      this.clearStoredAnswers(currentTask);
    }
    
    // 没有存储数据时，重置状态但不设置开始时间
    this.userAnswers = {};
    this.startTime = null;
    this.currentVersion = 'A';
    return false;
  }

  /**
   * 清除存储的答案
   */
  clearStoredAnswers(currentTask = 'task1') {
    try {
      let answerKey = 'paperfolding_answers_task1';
      if (currentTask === 'task2') {
        answerKey = 'paperfolding_answers_task2';
      } else if (currentTask === 'task3') {
        answerKey = 'paperfolding_answers_task3';
      }
      
      localStorage.removeItem(answerKey);
      console.log('已清除存储的答案');
    } catch (error) {
      console.error('清除答案失败:', error);
    }
  }

  /**
   * 清除所有答案
   */
  clearAllAnswers() {
    this.userAnswers = {};
    this.startTime = null;
  }

  /**
   * 获取用户答案
   */
  getUserAnswers() {
    return this.userAnswers;
  }

  /**
   * 获取指定题目的答案
   */
  getAnswerForQuestion(questionId) {
    return this.userAnswers[questionId];
  }

  /**
   * 获取已回答题目数量
   */
  getAnsweredCount() {
    return Object.keys(this.userAnswers).length;
  }

  /**
   * 检查是否所有题目都已回答
   */
  isAllAnswered(totalQuestions) {
    return this.getAnsweredCount() === totalQuestions;
  }

  /**
   * 获取开始时间
   */
  getStartTime() {
    return this.startTime;
  }

  /**
   * 设置开始时间
   */
  setStartTime(time = null) {
    this.startTime = time || Date.now();
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * 设置当前版本
   */
  setCurrentVersion(version) {
    this.currentVersion = version;
  }

  /**
   * 切换版本时清除答案
   */
  switchVersion(version) {
    if (version === this.currentVersion) return false;
    
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('切换版本将清除当前答案，确定要继续吗？');
      if (!confirmed) return false;
    }
    
    this.currentVersion = version;
    this.clearAllAnswers();
    return true;
  }

  /**
   * 切换任务时的确认逻辑
   * 注意：实际的答案清除和加载现在由PaperFoldingTest管理
   */
  switchTask() {
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('切换任务将保存当前答案并加载新任务的答案，确定要继续吗？');
      if (!confirmed) return false;
    }
    
    // 不再在这里清除答案，由PaperFoldingTest统一管理
    return true;
  }
}