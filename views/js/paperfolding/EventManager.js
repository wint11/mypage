/**
 * 事件管理器 - 负责管理所有事件监听器
 */
export class EventManager {
  constructor(paperFoldingTest) {
    this.test = paperFoldingTest;
    this.debugUtils = window.PaperFoldingDebug || { log: console.log, warn: console.warn, error: console.error };
    this.debug = window.debug || { log: console.log, warn: console.warn, error: console.error };
  }

  /**
   * 设置所有事件监听器
   */
  setupAllEventListeners() {
    this.debug.log('EventManager: 开始设置所有事件监听器');
    
    try {
      this.setupAIAnalysisButton();
      this.setupRegenerateButton();
      this.setupOptionClickEvents();
      this.setupKeyboardNavigation();
      this.setupNavigationButtons();
      this.setupFilterButtons();
      this.setupTaskSwitchButtons();
      this.setupSubmitButton();
      this.setupDownloadButtons();
      this.setupOneClickSelectButtons();
      this.setupZoomEvents();
      
      this.debug.log('EventManager: 所有事件监听器设置完成');
    } catch (error) {
      this.debugUtils.logError('EventManager: 设置事件监听器失败', error, {
        testInstance: !!this.test,
        questionManager: !!this.test?.questionManager,
        uiManager: !!this.test?.uiManager
      });
      throw error;
    }
  }

  /**
   * 设置AI分析按钮
   */
  setupAIAnalysisButton() {
    const aiBtn = document.getElementById('aiAnalysisBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.test.currentInviteCodeData && !this.test.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        alert('AI分析功能开发中...');
      });
    }
  }

  /**
   * 设置重新生成按钮
   */
  setupRegenerateButton() {
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.test.currentInviteCodeData && !this.test.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        
        // 检查是否有已答题目
        const answeredCount = this.test.answerManager.getAnsweredCount();
        if (answeredCount > 0) {
          const confirmed = confirm(`重新生成题目将清除当前所有答案数据（已答题：${answeredCount}题），确定要继续吗？`);
          if (!confirmed) {
            return;
          }
        }
        
        // 清除当前任务的答案
        const currentTask = this.test.questionManager.getCurrentTask();
        this.test.answerManager.clearAllAnswers();
        this.test.answerManager.clearStoredAnswers(currentTask);
        console.log(`重新生成题目：已清除${currentTask}的答案`);
        
        this.test.questionManager.regenerateQuestions(() => {
          // 重新初始化UI
          this.test.initializeUI();
          
          // 确保题干区域也得到更新
          const filteredQuestions = this.test.questionManager.getFilteredQuestions();
          if (filteredQuestions.length > 0) {
            // 显示第一题，确保题干区域完全更新
            this.test.handleDisplayQuestion(0);
          }
          
          console.log('重新生成题目完成，UI已更新');
        });
      });
    }
  }

  /**
   * 设置选项点击事件
   */
  setupOptionClickEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.option')) {
        const option = e.target.closest('.option');
        const optionValue = option.dataset.option;
        this.test.handleSelectOption(optionValue);
      }
    });
  }

  /**
   * 设置键盘导航
   */
  setupKeyboardNavigation() {
    this.debug.log('EventManager: 设置键盘导航');
    
    document.addEventListener('keydown', (e) => {
      try {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        // 安全获取筛选后的问题
        const getQuestions = () => {
          try {
            return this.test.questionManager.getFilteredQuestions();
          } catch (error) {
            this.debugUtils.logError('获取筛选问题失败', error);
            return [];
          }
        };
        
        const questions = getQuestions();
        const currentIndex = this.test.navigationManager.getCurrentQuestionIndex();

        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            if (currentIndex > 0) {
              this.debug.log(`键盘导航: 上一题 (${currentIndex} -> ${currentIndex - 1})`);
              this.test.navigationManager.setCurrentQuestionIndex(currentIndex - 1);
              this.test.handleDisplayQuestion(currentIndex - 1);
            }
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            if (currentIndex < questions.length - 1) {
              this.debug.log(`键盘导航: 下一题 (${currentIndex} -> ${currentIndex + 1})`);
              this.test.navigationManager.setCurrentQuestionIndex(currentIndex + 1);
              this.test.handleDisplayQuestion(currentIndex + 1);
            }
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
            e.preventDefault();
            const optionIndex = parseInt(e.key) - 1;
            this.debug.log(`键盘导航: 选择选项 ${optionIndex + 1}`);
            this.test.handleSelectOption(optionIndex);
            break;
        }
      } catch (error) {
        this.debugUtils.logError('键盘导航事件处理失败', error, {
          key: e.key,
          target: e.target.tagName,
          currentIndex: this.test.navigationManager?.getCurrentQuestionIndex()
        });
      }
    });
  }

  /**
   * 设置导航按钮
   */
  setupNavigationButtons() {
    this.test.navigationManager.setupNavigationButtons(
      () => this.test.questionManager.getFilteredQuestions(),
      (index) => this.test.handleDisplayQuestion(index)
    );
  }

  /**
   * 设置筛选按钮
   */
  setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterType = e.target.dataset.filter;
        this.test.applyFilter(filterType);
      });
    });
  }

  /**
   * 设置任务切换按钮和下拉列表
   */
  setupTaskSwitchButtons() {
    // 处理按钮形式的任务切换（保持向后兼容）
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const task = e.target.dataset.version;
        this.handleTaskSwitch(task);
      });
    });
    
    // 处理下拉列表形式的任务切换
    const versionSelect = document.getElementById('versionSelect');
    if (versionSelect) {
      versionSelect.addEventListener('change', (e) => {
        const task = e.target.value;
        this.handleTaskSwitch(task);
      });
    }
  }
  
  /**
   * 处理任务切换逻辑
   */
  handleTaskSwitch(task) {
    const currentTask = this.test.questionManager.getCurrentTask();
    
    // 如果是同一个任务，不需要切换
    if (task === currentTask) {
      return;
    }
    
    // 检查是否有已答题目
    const answeredCount = this.test.answerManager.getAnsweredCount();
    if (answeredCount > 0) {
      const taskNames = {
        'task1': '任务一',
        'task2': '任务二', 
        'task3': '任务三'
      };
      const currentTaskName = taskNames[currentTask] || currentTask;
      const targetTaskName = taskNames[task] || task;
      
      const confirmed = confirm(`切换到${targetTaskName}将清除当前${currentTaskName}的答案数据（已答题：${answeredCount}题），确定要继续吗？`);
      if (!confirmed) {
        // 如果用户取消，恢复下拉列表的选择
        const versionSelect = document.getElementById('versionSelect');
        if (versionSelect) {
          versionSelect.value = currentTask;
        }
        return;
      }
    }
    
    this.test.switchTask(task);
  }

  /**
   * 设置提交按钮
   */
  setupSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.test.submitTest());
    }
  }

  /**
   * 设置下载按钮
   */
  setupDownloadButtons() {
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.test.currentInviteCodeData && !this.test.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        this.test.downloader.downloadQuestionImage(this.test.navigationManager.getCurrentQuestionIndex());
      });
    }

    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.test.currentInviteCodeData && !this.test.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        this.test.downloader.downloadAllQuestions(
          this.test.questionManager.getCurrentFilter().getFilteredQuestions(),
          this.test.questionManager.getCurrentFilter().getCurrentFilter(),
          (index) => this.test.handleDisplayQuestion(index)
        );
      });
    }
  }

  /**
   * 设置一键选择按钮
   */
  setupOneClickSelectButtons() {
    const quickSelectBtn = document.getElementById('quickSelectBtn');
    if (quickSelectBtn) {
      quickSelectBtn.addEventListener('click', () => {
        const result = this.test.answerManager.quickSelectOption(
          this.test.questionManager.getFilteredQuestions(),
          this.test.currentInviteCodeData
        );
        
        if (result.selectedCount > 0) {
          // 更新UI状态
          this.test.uiManager.updateSubmitButton(
            this.test.answerManager.getAnsweredCount(),
            this.test.questionManager.getFilteredQuestions().length
          );
          this.test.uiManager.updateProgress(
            this.test.navigationManager.getCurrentQuestionIndex(),
            this.test.questionManager.getFilteredQuestions().length,
            this.test.answerManager.getAnsweredCount()
          );
          
          // 立即更新当前题目的选项选中状态
          const currentIndex = this.test.navigationManager.getCurrentQuestionIndex();
          const filteredQuestions = this.test.questionManager.getFilteredQuestions();
          const currentQuestion = filteredQuestions[currentIndex];
          if (currentQuestion) {
            const userAnswers = this.test.answerManager.getUserAnswers();
            const selectedOption = userAnswers[currentQuestion.id];
            if (selectedOption) {
              this.test.uiManager.updateOptionSelection(selectedOption);
            }
          }
          
          this.test.uiManager.showQuickSelectAllFeedback(result.selectedCount, result.totalCount);
        }
      });
    }
  }

  /**
   * 设置缩放事件
   */
  setupZoomEvents() {
    this.test.zoomManager.setupZoomEventListeners();
  }
}