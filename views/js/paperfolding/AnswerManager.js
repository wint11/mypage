/**
 * 答案管理器
 * 负责答案的选择、保存、加载和管理
 */
export class AnswerManager {
  constructor() {
    this.userAnswers = {};
    this.startTime = null;
    this.currentVersion = 'A';
  }

  /**
   * 选择选项
   */
  selectOption(optionValue, questionIndex) {
    this.userAnswers[questionIndex] = optionValue;
    this.saveAnswersToStorage();
    
    console.log(`题目 ${questionIndex + 1} 选择了选项: ${optionValue}`);
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
      // 如果该题目还没有答案，则随机选择一个
      if (!this.userAnswers[i]) {
        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedOption = options[randomIndex];
        this.userAnswers[i] = selectedOption;
        selectedCount++;
      }
    }
    
    // 保存答案到本地存储
    this.saveAnswersToStorage();
    
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
        this.startTime = data.startTime || Date.now();
        this.currentVersion = data.version || 'A';
        console.log('从本地存储加载答案');
        return true;
      }
    } catch (error) {
      console.error('加载答案失败:', error);
      this.clearStoredAnswers(currentTask);
    }
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
  getAnswerForQuestion(questionIndex) {
    return this.userAnswers[questionIndex];
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
   * 切换任务时清除答案
   */
  switchTask() {
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('切换任务将清除当前答案，确定要继续吗？');
      if (!confirmed) return false;
    }
    
    this.clearAllAnswers();
    return true;
  }
}