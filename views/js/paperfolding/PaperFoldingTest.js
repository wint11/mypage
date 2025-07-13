import { Config } from './Config.js';
import { ImageCache } from './ImageCache.js';
import { WenjuanxingUploader } from './WenjuanxingUploader.js';
import { Downloader } from './Downloader.js';
import { Filter } from './Filter.js';
import { Task1Filter } from './task1Filter.js';
import { Task2Filter } from './task2Filter.js';
import { Task3Filter } from './task3Filter.js';
import { RandomUtils } from './RandomUtils.js';
import { InstructionsPage } from './InstructionsPage.js';
import { QuestionManager } from './QuestionManager.js';
import { UIManager } from './UIManager.js';
import { NavigationManager } from './NavigationManager.js';
import { AnswerManager } from './AnswerManager.js';
import { ZoomManager } from './ZoomManager.js';
import { TestResultManager } from './TestResultManager.js';
import { EventManager } from './EventManager.js';
import { debugUtils, debug } from './DebugUtils.js';
import { extensibilityManager, EVENT_HOOKS } from './ExtensibilityConfig.js';
import { pluginLoader } from './PluginLoader.js';

/**
 * 纸折叠测试主类
 */
export class PaperFoldingTest {
  constructor() {
    // 初始化调试工具
    this.debugUtils = debugUtils;
    debug.mark('PaperFoldingTest_constructor_start');
    
    this.config = new Config();
    this.imageCache = new ImageCache(this.config);
    this.wenjuanxingUploader = new WenjuanxingUploader(this.config.getWenjuanxingConfig());
    this.downloader = new Downloader();
    this.filter = new Filter();
    this.task1Filter = new Task1Filter();
    this.task2Filter = new Task2Filter();
    this.task3Filter = new Task3Filter();
    this.instructionsPage = new InstructionsPage();

    // 初始化新的管理器
    this.questionManager = new QuestionManager(this.config, this.task1Filter, this.task2Filter, this.task3Filter);
    this.uiManager = new UIManager(this.imageCache);
    this.navigationManager = new NavigationManager(this.imageCache);
    this.answerManager = new AnswerManager(this.questionManager);
    this.zoomManager = new ZoomManager();
    this.testResultManager = new TestResultManager();
    this.eventManager = new EventManager(this);

    this.isInitialized = false;
    this.currentInviteCodeData = null; // 当前使用的邀请码数据

    this.setupInstructionsPage();
    
    debug.mark('PaperFoldingTest_constructor_end');
    debug.measure('PaperFoldingTest_constructor_start', 'PaperFoldingTest_constructor_end');
    debug.log('PaperFoldingTest 构造函数完成');
  }

  /**
   * 设置答题须知页面
   */
  setupInstructionsPage() {
    // 设置确认回调函数
    this.instructionsPage.setOnConfirmCallback((inviteCodeData) => {
      this.init(inviteCodeData);
    });

    console.log('答题须知页面已设置');
  }

  /**
   * 初始化
   * @param {Object} inviteCodeData - 邀请码数据，包含inviteCode和setId
   */
  async init(inviteCodeData) {
    debug.mark('PaperFoldingTest_init_start');
    
    if (this.isInitialized) {
      debug.warn('测试已经初始化过了');
      return;
    }

    try {
      debug.log('开始初始化纸折叠测试...', inviteCodeData);
      this.currentInviteCodeData = inviteCodeData;
      
      // 初始化插件加载器
       await pluginLoader.init();
      
      // 触发初始化前事件钩子
      await extensibilityManager.triggerEvent(EVENT_HOOKS.beforeInit, {
        inviteCodeData,
        testInstance: this
      });

      // 检查组件健康状态
      const healthCheck = this.debugUtils.checkComponentHealth(this.questionManager, [
        'loadQuestions', 'getCurrentTask', 'getCurrentFilter', 'getAllQuestions'
      ]);
      
      if (!healthCheck.healthy) {
        throw new Error(`QuestionManager 组件检查失败: ${healthCheck.issues.join(', ')}`);
      }

      debug.mark('loadQuestions_start');
      await this.questionManager.loadQuestions(inviteCodeData);
      debug.mark('loadQuestions_end');
      debug.measure('loadQuestions_start', 'loadQuestions_end');
      
      debug.mark('setupEventListeners_start');
      this.eventManager.setupAllEventListeners();
      debug.mark('setupEventListeners_end');
      debug.measure('setupEventListeners_start', 'setupEventListeners_end');
      
      this.answerManager.loadAnswersFromStorage(this.questionManager.getCurrentTask());

      // 在邀请码模式下，强制清除筛选器缓存并重新初始化
      if (inviteCodeData) {
        if (this.questionManager.getCurrentTask() !== 'task3') {
          this.questionManager.getCurrentFilter().clearStoredQuestions();
          this.questionManager.getCurrentFilter().baseQuestions = null;
        }
        debug.log('邀请码模式：已清除筛选器缓存，强制重新生成');
      }

      // 初始化筛选器
      debug.mark('initializeFilter_start');
      if (this.questionManager.getCurrentTask() === 'task3') {
        // task3的initializeFilter已在loadQuestions中调用，但需要确保完成
        const filteredQuestions = this.questionManager.getCurrentFilter().getFilteredQuestions();
        if (!filteredQuestions || filteredQuestions.length === 0) {
          // 如果仍然没有题目，手动调用initializeFilter
          await this.questionManager.getCurrentFilter().initializeFilter();
        }
      } else {
        this.questionManager.getCurrentFilter().initializeFilter(this.questionManager.getAllQuestions());
      }
      debug.mark('initializeFilter_end');
      debug.measure('initializeFilter_start', 'initializeFilter_end');

      // 确保UI按钮状态与当前任务保持一致
      this.uiManager.syncTaskButtonState(this.questionManager.getCurrentTask());

      // 更新筛选按钮文字
      this.uiManager.updateFilterButtonTexts(this.questionManager.getCurrentTask());

      // 初始化UI显示
      debug.mark('initializeUI_start');
      this.initializeUI();
      debug.mark('initializeUI_end');
      debug.measure('initializeUI_start', 'initializeUI_end');

      // 设置开始时间（如果还没有的话）
      if (!this.answerManager.getStartTime()) {
        this.answerManager.setStartTime(Date.now());
        console.log('初始化时设置开始时间');
      }

      this.isInitialized = true;
      
      debug.mark('PaperFoldingTest_init_end');
      debug.measure('PaperFoldingTest_init_start', 'PaperFoldingTest_init_end');
      debug.log('纸折叠测试初始化完成');
      
      // 记录初始化状态
      const initState = {
        initialized: true, 
        task: this.questionManager.getCurrentTask(),
        questionCount: this.questionManager.getAllQuestions().length,
        filteredCount: this.questionManager.getFilteredQuestions().length
      };
      
      this.debugUtils.logStateChange('PaperFoldingTest', 
        { initialized: false }, 
        initState, 
        'init_complete'
      );
      
      // 触发初始化后事件钩子
      await extensibilityManager.triggerEvent(EVENT_HOOKS.afterInit, {
        testInstance: this,
        initState
      });
      
    } catch (error) {
      debug.mark('PaperFoldingTest_init_end');
      this.debugUtils.logError('初始化失败', error, {
        inviteCodeData,
        isInitialized: this.isInitialized,
        currentTask: this.questionManager?.getCurrentTask()
      });
      
      console.error('初始化失败:', error);
      this.uiManager.showError('初始化失败: ' + error.message);
      throw error; // 重新抛出错误以便上层处理
    }
  }

  /**
   * 初始化UI显示
   */
  initializeUI() {
    const filteredQuestions = this.questionManager.getFilteredQuestions();
    const currentIndex = 0;

    // 设置当前题目索引
    this.navigationManager.setCurrentQuestionIndex(currentIndex);

    // 显示第一题
    if (filteredQuestions.length > 0) {
      const question = filteredQuestions[currentIndex];
      this.uiManager.displayQuestion(currentIndex, question, filteredQuestions);
      this.uiManager.restoreUserSelection(currentIndex, this.answerManager.getUserAnswers(), question);
    }

    // 更新UI状态
    this.uiManager.updateProgress(
      currentIndex,
      filteredQuestions.length,
      this.answerManager.getAnsweredCount()
    );
    this.uiManager.updateNavigationButtons(currentIndex, filteredQuestions.length);
    this.uiManager.updateSubmitButton(
      this.answerManager.getAnsweredCount(),
      filteredQuestions.length
    );
    
    // 更新筛选按钮的高亮状态
    const currentFilter = this.questionManager.getCurrentFilter();
    if (currentFilter && currentFilter.currentFilter) {
      this.uiManager.updateFilterButtonState(currentFilter.currentFilter);
    }
    
    // 更新重新生成按钮状态（根据邀请码模式）
    this.uiManager.updateRegenerateButton(this.currentInviteCodeData);
    
    this.questionManager.getCurrentFilter().updateFilterInfo();
    this.questionManager.getCurrentFilter().updateJumpInputMax();

    // 开始预加载
    this.navigationManager.preloadCurrentQuestion(filteredQuestions);

    // 初始化缩放按钮状态
    this.zoomManager.updateZoomButtons();
  }

  /**
   * 处理选项选择
   */
  async handleSelectOption(optionValue) {
    const currentIndex = this.navigationManager.getCurrentQuestionIndex();
    const questions = this.questionManager.getFilteredQuestions();
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
      console.error('当前题目不存在');
      return;
    }
    
    // 触发选择答案前事件钩子
    const beforeSelectData = {
      questionId: currentQuestion.id,
      questionIndex: currentIndex,
      optionValue,
      previousAnswer: this.answerManager.getUserAnswers()[currentQuestion.id]
    };
    
    await extensibilityManager.triggerEvent(EVENT_HOOKS.beforeAnswerSelect, beforeSelectData);

    this.answerManager.selectOption(optionValue, currentQuestion.id);

    // 立即更新选项UI状态
    this.uiManager.updateOptionSelection(optionValue);

    // 更新UI状态
    this.uiManager.updateSubmitButton(
      this.answerManager.getAnsweredCount(),
      this.questionManager.getFilteredQuestions().length
    );
    this.uiManager.updateProgress(
      currentIndex,
      this.questionManager.getFilteredQuestions().length,
      this.answerManager.getAnsweredCount()
    );
    
    // 触发选择答案后事件钩子
    await extensibilityManager.triggerEvent(EVENT_HOOKS.afterAnswerSelect, {
      ...beforeSelectData,
      newAnswer: optionValue,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理题目显示
   */
  handleDisplayQuestion(index) {
    const filteredQuestions = this.questionManager.getFilteredQuestions();
    if (index < 0 || index >= filteredQuestions.length) return;

    this.navigationManager.setCurrentQuestionIndex(index);
    const question = filteredQuestions[index];

    // 显示题目
    this.uiManager.displayQuestion(index, question, filteredQuestions);
    this.uiManager.restoreUserSelection(index, this.answerManager.getUserAnswers(), question);

    // 更新UI状态
    this.uiManager.updateProgress(
      index,
      filteredQuestions.length,
      this.answerManager.getAnsweredCount()
    );
    this.uiManager.updateNavigationButtons(index, filteredQuestions.length);
    this.uiManager.updateSubmitButton(
      this.answerManager.getAnsweredCount(),
      filteredQuestions.length
    );

    // 预加载相邻题目
    this.navigationManager.preloadAdjacentQuestions(filteredQuestions);
  }



  /**
   * 清除反馈信息
   */
  clearFeedback() {
    const feedbackDiv = document.getElementById('feedback');
    if (feedbackDiv) {
      feedbackDiv.innerHTML = '';
      feedbackDiv.style.display = 'none';
    }
  }

  /**
   * 应用筛选器
   * @param {string} filterType - 筛选器类型
   */
  async applyFilter(filterType) {
    debug.mark('applyFilter_start');
    debug.log('应用筛选器:', filterType);
    
    const beforeCount = this.questionManager.getFilteredQuestions().length;
    
    // 触发筛选前事件钩子
    await extensibilityManager.triggerEvent(EVENT_HOOKS.beforeFilterApply, {
      filterType,
      currentCount: beforeCount,
      currentTask: this.questionManager.getCurrentTask()
    });
    
    this.questionManager.getCurrentFilter().applyFilter(this.questionManager.getAllQuestions(), filterType);
    
    const afterCount = this.questionManager.getFilteredQuestions().length;
    
    // 更新筛选按钮的高亮状态
    this.uiManager.updateFilterButtonState(filterType);
    
    this.debugUtils.logStateChange('Filter', 
      { type: 'previous', count: beforeCount }, 
      { type: filterType, count: afterCount }, 
      'filter_applied'
    );
    
    this.handleDisplayQuestion(0);
    
    // 触发筛选后事件钩子
    await extensibilityManager.triggerEvent(EVENT_HOOKS.afterFilterApply, {
      filterType,
      beforeCount,
      afterCount,
      filteredQuestions: this.questionManager.getFilteredQuestions()
    });
    
    debug.mark('applyFilter_end');
    debug.measure('applyFilter_start', 'applyFilter_end');
    debug.log(`筛选完成: ${beforeCount} -> ${afterCount} 题目`);
  }

  /**
   * 切换任务
   */
  async switchTask(task) {
    try {
      console.log(`开始切换任务到: ${task}`);
      
      // 先更新按钮状态，避免用户重复点击
      this.uiManager.syncTaskButtonState(task);
      
      // 在切换任务前，先保存当前任务的答案到localStorage
      const previousTask = this.questionManager.getCurrentTask();
      if (previousTask !== task) {
        this.answerManager.saveAnswersToStorage(previousTask);
        console.log(`已保存 ${previousTask} 的答案数据`);
      }
      
      const success = await this.questionManager.switchTask(task, () => this.initializeUI());
      if (success) {
        
        // 清除当前答案管理器中的答案（内存中的）
        this.answerManager.clearAllAnswers();
        
        // 加载新task对应的答案（从localStorage）
        const hasStoredData = this.answerManager.loadAnswersFromStorage(task);
        
        // 如果没有存储的数据或者没有开始时间，设置新的开始时间
        if (!hasStoredData || !this.answerManager.getStartTime()) {
          this.answerManager.setStartTime(Date.now());
          console.log(`为任务 ${task} 设置新的开始时间`);
        }
        
        // 更新筛选按钮文字
        this.uiManager.updateFilterButtonTexts(task);
        
        // 重置筛选器状态为"全部题目"
        this.uiManager.updateFilterButtonState('all');
        
        // 重置到第一题
        this.navigationManager.setCurrentQuestionIndex(0);
        
        // 清除之前的答案选择状态
        document.querySelectorAll('.option').forEach(option => {
          option.classList.remove('selected');
        });
        
        // 如果切换到task3，自动执行重新生成题目
        if (task === 'task3') {
          console.log('切换到task3，自动重新生成题目');
          this.questionManager.regenerateQuestions(() => this.initializeUI());
        } else {
          // 重新初始化UI
          this.initializeUI();
        }
        
        console.log(`任务切换成功: ${task}，已加载对应的答案数据`);
      } else {
        console.log(`任务切换取消或失败: ${task}`);
      }
    } catch (error) {
      console.error('任务切换失败:', error);
      alert('任务切换失败，请重试');
      
      // 恢复之前的按钮状态
      this.uiManager.syncTaskButtonState(this.questionManager.getCurrentTask());
    }
  }

  /**
   * 提交测试
   */
  async submitTest() {
    debug.mark('submitTest_start');
    debug.log('开始提交测试');
    
    const testData = {
      answers: this.answerManager.getUserAnswers(),
      questions: this.questionManager.getFilteredQuestions(),
      startTime: this.answerManager.getStartTime(),
      task: this.questionManager.getCurrentTask(),
      version: this.answerManager.getCurrentVersion(),
      answeredCount: this.answerManager.getAnsweredCount(),
      totalQuestions: this.questionManager.getFilteredQuestions().length
    };
    
    debug.log('提交数据:', testData);
    
    // 触发提交前事件钩子
    await extensibilityManager.triggerEvent(EVENT_HOOKS.beforeSubmit, {
      testData,
      testInstance: this
    });
    
    this.debugUtils.logStateChange('Test', 
      { status: 'in_progress' }, 
      { status: 'submitting', ...testData }, 
      'test_submit'
    );
    
    this.testResultManager.submitTest(
      testData.answers,
      testData.questions,
      testData.startTime,
      testData.task,
      testData.version
    );
    
    // 触发提交后事件钩子
    await extensibilityManager.triggerEvent(EVENT_HOOKS.afterSubmit, {
      testData,
      submitTime: new Date().toISOString()
    });
    
    debug.mark('submitTest_end');
    debug.measure('submitTest_start', 'submitTest_end');
    debug.log('测试提交完成');
  }
}