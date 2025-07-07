import { Config } from './Config.js';
import { ImageCache } from './ImageCache.js';
import { WenjuanxingUploader } from './WenjuanxingUploader.js';
import { Downloader } from './Downloader.js';
import { Filter } from './Filter.js';
import { Task1Filter } from './task1Filter.js';
import { Task2Filter } from './task2Filter.js';
import { RandomUtils } from './RandomUtils.js';
import { InstructionsPage } from './InstructionsPage.js';

/**
 * 纸折叠测试主类
 */
export class PaperFoldingTest {
  constructor() {
    this.config = new Config();
    this.imageCache = new ImageCache(this.config);
    this.wenjuanxingUploader = new WenjuanxingUploader(this.config.getWenjuanxingConfig());
    this.downloader = new Downloader();
    this.filter = new Filter();
    this.task1Filter = new Task1Filter();
    this.task2Filter = new Task2Filter();
    this.instructionsPage = new InstructionsPage();
    
    this.allQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.startTime = null;
    this.currentVersion = 'A';
    this.currentTask = 'task1'; // 当前任务
    this.isInitialized = false;
    this.currentInviteCodeData = null; // 当前使用的邀请码数据
    
    this.setupInstructionsPage();
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
    if (this.isInitialized) {
      console.log('测试已经初始化过了');
      return;
    }
    
    try {
      console.log('开始初始化纸折叠测试...', inviteCodeData);
      
      await this.loadQuestions(inviteCodeData);
      this.setupEventListeners();
      this.loadAnswersFromStorage();
      
      // 初始化筛选器
      this.getCurrentFilter().initializeFilter(this.allQuestions);
      
      this.displayQuestion(0);
      this.updateProgress();
      this.updateNavigationButtons();
      this.updateSubmitButton();
      this.getCurrentFilter().updateFilterInfo();
      this.getCurrentFilter().updateJumpInputMax();
      
      // 开始预加载
      this.preloadCurrentQuestion();
      
      // 记录开始时间
      this.startTime = new Date();
      
      this.isInitialized = true;
      console.log('纸折叠测试初始化完成');
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败: ' + error.message);
    }
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
        if (this.currentTask === 'task2') {
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
        if (!inviteCodeData.setId) {
          throw new Error('邀请码数据无效：缺少setId');
        }
        
        // 清除localStorage中的相关缓存，确保使用新的题目集
        try {
          // 清除task1题目缓存
          localStorage.removeItem('paperfolding_questions_task1');
          // 清除task2题目缓存
          localStorage.removeItem('paperfolding_questions_task2');
          // 清除答案缓存
          localStorage.removeItem('paperfolding_answers_task1');
          localStorage.removeItem('paperfolding_answers_task2');
          console.log('已清除localStorage中的题目和答案缓存');
        } catch (error) {
          console.warn('清除localStorage缓存失败:', error);
        }
        
        // 加载所有题目集数据
        const response = await fetch('../task1/all_question_sets.json');
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
            question.image_path = this.config.getImageBasePath() + question.image;
          }
          return question;
        });
        
        console.log(`邀请码模式：加载了题目集${inviteCodeData.setId}，共 ${this.allQuestions.length} 道题目`);
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
   * 获取当前筛选器
   */
  getCurrentFilter() {
    if (this.currentTask === 'task2') {
      return this.task2Filter;
    } else {
      return this.task1Filter;
    }
  }
  
  /**
   * 切换任务
   */
  async switchTask(task) {
    if (task === this.currentTask) return;
    
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('切换任务将清除当前答案，确定要继续吗？');
      if (!confirmed) return;
    }
    
    this.currentTask = task;
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    
    // 更新UI
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.version === task);
    });
    
    // 重新加载题目数据
    try {
      await this.loadQuestions(this.currentInviteCodeData);
      
      // 重新初始化筛选器
      this.getCurrentFilter().initializeFilter(this.allQuestions);
      
      // 重新显示题目
      this.displayQuestion(0);
      this.updateProgress();
      this.updateNavigationButtons();
      this.updateSubmitButton();
      this.getCurrentFilter().updateFilterInfo();
      this.getCurrentFilter().updateJumpInputMax();
      
      // 显示状态消息
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
      `;
      statusDiv.textContent = `已切换到${task === 'task2' ? '任务贰' : '任务壹'}`;
      document.body.appendChild(statusDiv);
      
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.parentNode.removeChild(statusDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error('切换任务失败:', error);
      alert('切换任务失败，请重试');
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // AI分析按钮
    const aiBtn = document.getElementById('aiAnalysisBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => this.analyzeWithAI());
    }

    // 重新生成按钮
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => this.regenerateQuestions());
    }

    // 选项点击事件
    document.addEventListener('click', (e) => {
      if (e.target.closest('.option')) {
        const option = e.target.closest('.option');
        const optionValue = option.dataset.option;
        this.selectOption(optionValue);
      }
    });

    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previousQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextQuestion();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          this.selectOption(e.key);
          break;
      }
    });

    // 导航按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousQuestion());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
    if (jumpBtn) jumpBtn.addEventListener('click', () => this.jumpToQuestion());

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterType = e.target.dataset.filter;
        this.applyFilter(filterType);
      });
    });

    // 任务切换
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const task = e.target.dataset.version;
        this.switchTask(task);
      });
    });

    // 提交按钮
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitTest());
    }

    // 下载按钮
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        this.downloader.downloadQuestionImage(this.currentQuestionIndex);
      });
    }
    
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        // 检查是否为邀请码模式（非常规模式），如果是则拦截
        if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
          alert('当前模式下该功能不可用');
          return;
        }
        this.downloader.downloadAllQuestions(
          this.getCurrentFilter().getFilteredQuestions(),
          this.getCurrentFilter().getCurrentFilter(),
          (index) => this.displayQuestion(index)
        );
      });
    }
    
    // 一键选择按钮
    const quickSelectBtn = document.getElementById('quickSelectBtn');
    if (quickSelectBtn) {
      quickSelectBtn.addEventListener('click', () => {
        this.quickSelectOption();
      });
    }
  }

  /**
   * 预加载当前题目
   */
  preloadCurrentQuestion() {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    if (filteredQuestions.length === 0) return;
    
    const currentQuestion = filteredQuestions[this.currentQuestionIndex];
    if (currentQuestion) {
      this.imageCache.preloadImage(currentQuestion.image_path);
    }
    
    // 预加载相邻题目
    this.preloadAdjacentQuestions();
  }

  /**
   * 预加载指定范围的题目
   */
  preloadRange(startIndex, endIndex) {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    const imagesToPreload = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < filteredQuestions.length) {
        imagesToPreload.push(filteredQuestions[i].image_path);
      }
    }
    
    this.imageCache.preloadImages(imagesToPreload);
  }

  /**
   * 预加载相邻题目
   */
  preloadAdjacentQuestions() {
    const preloadRange = 2;
    const startIndex = Math.max(0, this.currentQuestionIndex - preloadRange);
    const endIndex = Math.min(
      this.getCurrentFilter().getFilteredQuestions().length - 1,
      this.currentQuestionIndex + preloadRange
    );
    
    this.preloadRange(startIndex, endIndex);
  }

  /**
   * 显示题目
   */
  displayQuestion(index) {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    if (index < 0 || index >= filteredQuestions.length) return;
    
    this.currentQuestionIndex = index;
    const question = filteredQuestions[index];
    
    // 更新题目编号
    const questionNumber = document.getElementById('questionNumber');
    if (questionNumber) {
      questionNumber.textContent = `第 ${index + 1} 题`;
    }
    
    // 显示题目图片
    this.displayQuestionImage(question.image_path);
    
    // 显示选项区域
    this.showOptionArea();
    
    // 恢复用户选择
    this.restoreUserSelection(index);
    
    // 更新UI
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    
    // 预加载当前题目
    this.preloadCurrentQuestion();
    
    // 记录开始时间
    if (!this.startTime) {
      this.startTime = Date.now();
    }
  }

  /**
   * 显示题目图片
   */
  displayQuestionImage(imagePath) {
    const stemImages = document.querySelector('.stem-images');
    if (stemImages) {
      // 检查缓存
      const cachedImage = this.imageCache.getCachedImage(imagePath);
      if (cachedImage) {
        stemImages.innerHTML = `<img src="${cachedImage}" alt="题目图片" style="max-width: 100%; height: auto;">`;
      } else {
        // 显示加载状态
        stemImages.innerHTML = '<div class="loading-placeholder">加载中...</div>';
        
        // 异步加载图片
        this.imageCache.preloadImage(imagePath).then((imageSrc) => {
          stemImages.innerHTML = `<img src="${imageSrc}" alt="题目图片" style="max-width: 100%; height: auto;">`;
        }).catch(error => {
          console.error('加载图片失败:', error);
          stemImages.innerHTML = '<div class="error-placeholder">图片加载失败</div>';
        });
      }
    }
  }

  /**
   * 显示选项区域
   */
  showOptionArea() {
    const optionsContainer = document.querySelector('.options-container');
    if (optionsContainer) {
      optionsContainer.style.display = 'flex';
      
      // 清空选项图片并确保选项标签可见
      const optionImages = optionsContainer.querySelectorAll('img');
      optionImages.forEach(img => {
        img.src = '';
        img.style.display = 'none';
      });
      
      // 确保选项标签可见
      const optionLabels = optionsContainer.querySelectorAll('.option-label');
      optionLabels.forEach(label => {
        label.style.display = 'block';
      });
    }
  }

  /**
   * 选择选项
   */
  selectOption(optionValue) {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    if (this.currentQuestionIndex >= filteredQuestions.length) return;
    
    this.userAnswers[this.currentQuestionIndex] = optionValue;
    this.saveAnswersToStorage();
    
    // 更新UI显示
    this.restoreUserSelection(this.currentQuestionIndex);
    this.updateSubmitButton();
    
    console.log(`题目 ${this.currentQuestionIndex + 1} 选择了选项: ${optionValue}`);
  }

  /**
   * 一键随机选择选项
   */
  quickSelectOption() {
    // 检查是否为邀请码模式（非常规模式），如果是则拦截
    if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
      alert('当前模式下该功能不可用');
      return;
    }
    
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    if (filteredQuestions.length === 0) return;
    
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
    
    // 更新当前题目的UI显示
    this.restoreUserSelection(this.currentQuestionIndex);
    this.updateSubmitButton();
    
    // 显示提示信息
    this.showQuickSelectAllFeedback(selectedCount, filteredQuestions.length);
  }

  /**
   * 显示一键选择反馈
   */
  showQuickSelectFeedback(selectedOption) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      animation: slideInRight 0.3s ease;
    `;
    feedbackDiv.innerHTML = `<i class="bi bi-lightning-fill"></i> 已随机选择选项 ${selectedOption}`;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedbackDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (feedbackDiv.parentNode) {
        feedbackDiv.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
          feedbackDiv.remove();
          style.remove();
        }, 300);
      }
    }, 3000);
  }

  /**
   * 显示一键选择全部题目的反馈
   */
  showQuickSelectAllFeedback(selectedCount, totalCount) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
      animation: slideInRight 0.4s ease;
      border-left: 4px solid #fff;
    `;
    
    let message;
    if (selectedCount === 0) {
      message = `<i class="bi bi-check-circle-fill"></i> 所有 ${totalCount} 道题已完成！`;
    } else {
      message = `<i class="bi bi-lightning-fill"></i> 已为 ${selectedCount} 道题随机选择答案<br><small style="opacity: 0.9;">总共 ${totalCount} 道题</small>`;
    }
    
    feedbackDiv.innerHTML = message;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedbackDiv);
    
    // 4秒后自动移除
    setTimeout(() => {
      if (feedbackDiv.parentNode) {
        feedbackDiv.style.animation = 'slideInRight 0.4s ease reverse';
        setTimeout(() => {
          feedbackDiv.remove();
          style.remove();
        }, 400);
      }
    }, 4000);
  }

  /**
   * 保存答案到本地存储
   */
  saveAnswersToStorage() {
    try {
      const data = {
        answers: this.userAnswers,
        currentIndex: this.currentQuestionIndex,
        startTime: this.startTime,
        version: this.currentVersion,
        timestamp: Date.now()
      };
      const answerKey = this.currentTask === 'task1' ? 'paperfolding_answers_task1' : 'paperfolding_answers_task2';
      localStorage.setItem(answerKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  }

  /**
   * 从本地存储加载答案
   */
  loadAnswersFromStorage() {
    try {
      const answerKey = this.currentTask === 'task1' ? 'paperfolding_answers_task1' : 'paperfolding_answers_task2';
      const stored = localStorage.getItem(answerKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.userAnswers = data.answers || {};
        this.currentQuestionIndex = data.currentIndex || 0;
        this.startTime = data.startTime || Date.now();
        this.currentVersion = data.version || 'A';
        console.log('从本地存储加载答案');
      }
    } catch (error) {
      console.error('加载答案失败:', error);
      this.clearStoredAnswers();
    }
  }

  /**
   * 清除存储的答案
   */
  clearStoredAnswers() {
    try {
      const answerKey = this.currentTask === 'task1' ? 'paperfolding_answers_task1' : 'paperfolding_answers_task2';
      localStorage.removeItem(answerKey);
      console.log('已清除存储的答案');
    } catch (error) {
      console.error('清除答案失败:', error);
    }
  }

  /**
   * 恢复用户选择
   */
  restoreUserSelection(questionIndex) {
    const userAnswer = this.userAnswers[questionIndex];
    
    // 清除所有选项的选中状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // 如果有用户答案，恢复选中状态
    if (userAnswer) {
      const selectedOption = document.querySelector(`[data-option="${userAnswer}"]`);
      if (selectedOption) {
        selectedOption.classList.add('selected');
      }
    }
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
   * 上一题
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.displayQuestion(this.currentQuestionIndex - 1);
    }
  }

  /**
   * 下一题
   */
  nextQuestion() {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    if (this.currentQuestionIndex < filteredQuestions.length - 1) {
      this.displayQuestion(this.currentQuestionIndex + 1);
    }
  }

  /**
   * 跳转到指定题目
   */
  jumpToQuestion() {
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
      const targetIndex = parseInt(jumpInput.value) - 1;
      const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
      
      if (targetIndex >= 0 && targetIndex < filteredQuestions.length) {
        this.displayQuestion(targetIndex);
        jumpInput.value = '';
      } else {
        alert(`请输入 1 到 ${filteredQuestions.length} 之间的数字`);
      }
    }
  }

  /**
   * 切换版本
   */
  switchVersion(version) {
    if (version === this.currentVersion) return;
    
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('切换版本将清除当前答案，确定要继续吗？');
      if (!confirmed) return;
    }
    
    this.currentVersion = version;
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    
    // 更新UI
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.version === version);
    });
    
    // 重新筛选题目
     this.getCurrentFilter().applyFilter();
    
    this.displayQuestion(0);
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.getCurrentFilter().updateFilterInfo();
    this.getCurrentFilter().updateJumpInputMax();
    
    // 显示状态消息
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
    `;
    statusDiv.textContent = `已切换到版本 ${version}`;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  /**
   * 更新导航按钮状态
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    
    if (prevBtn) {
      prevBtn.disabled = this.currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentQuestionIndex === filteredQuestions.length - 1;
    }
  }

  /**
   * 更新进度显示
   */
  updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    
    if (progressText) {
      progressText.textContent = `${this.currentQuestionIndex + 1} / ${filteredQuestions.length}`;
    }
    
    if (progressBar) {
      const percentage = ((this.currentQuestionIndex + 1) / filteredQuestions.length) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * 更新提交按钮状态
   */
  updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
      const answeredCount = Object.keys(this.userAnswers).length;
      const allAnswered = answeredCount === filteredQuestions.length;
      
      submitBtn.disabled = !allAnswered;
      submitBtn.textContent = allAnswered ? 
        `提交测试 (${answeredCount}/${filteredQuestions.length})` : 
        `继续答题 (${answeredCount}/${filteredQuestions.length})`;
    }
  }

  /**
   * 提交测试
   */
  submitTest() {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    const answeredCount = Object.keys(this.userAnswers).length;
    
    if (answeredCount < filteredQuestions.length) {
      alert(`还有 ${filteredQuestions.length - answeredCount} 道题未完成，请继续答题。`);
      return;
    }
    
    // 计算结果
    const results = this.getTestResults();
    
    // 显示结果
    this.showTestResults(results);
    
    // 上传到问卷星 (已禁用)
    // this.wenjuanxingUploader.uploadToWenjuanxing(results);
    
    // 清除存储的答案
    this.clearStoredAnswers();
  }

  /**
   * 显示测试结果
   */
  showTestResults(results) {
    // 禁用所有选项
    document.querySelectorAll('.option').forEach(option => {
      option.style.pointerEvents = 'none';
      option.style.opacity = '0.6';
    });
    
    // 显示正确答案
    this.showCorrectAnswers();
    
    // 创建结果模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
      <div style="position: relative;">
        <button id="closeResultBtn" style="position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;" title="关闭">
          ×
        </button>
        <h2 style="color: #28a745; margin-bottom: 20px;">
          <i class="bi bi-check-circle-fill"></i> 测试完成！
        </h2>
        <div style="font-size: 18px; margin-bottom: 15px;">
          <strong>准确率: ${results.accuracy}%</strong>
        </div>
        <div style="margin-bottom: 20px; color: #666;">
          总题数: ${results.totalQuestions} 题<br>
          正确: ${results.correctAnswers} 题<br>
          用时: ${results.timeSpent}
        </div>
        <div style="text-align: center;">
          <button id="downloadExcelBtn" class="btn btn-outline-success">
            <i class="bi bi-download"></i> 下载答题数据
          </button>
        </div>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 绑定关闭事件
    document.getElementById('closeResultBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // 绑定下载Excel事件
    document.getElementById('downloadExcelBtn').addEventListener('click', () => {
      this.downloadAnswerDataAsExcel(results);
    });
    
    // 点击模态框背景也可以关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 显示正确答案
   */
  showCorrectAnswers() {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    
    filteredQuestions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const correctAnswer = question.answer;
      
      // 这里需要根据实际的UI结构来显示正确答案
      // 由于这是图片题目，可能需要在图片上标注或在其他地方显示
      console.log(`题目 ${index + 1}: 用户答案=${userAnswer}, 正确答案=${correctAnswer}`);
    });
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 6px;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * 应用筛选
   */
  applyFilter(filterType) {
    // 更新筛选按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });
    
    // 应用筛选
    this.getCurrentFilter().applyFilter(this.allQuestions, filterType);
    
    // 重置到第一题
    this.currentQuestionIndex = 0;
    this.displayQuestion(0);
    
    // 更新UI
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.getCurrentFilter().updateFilterInfo();
    this.getCurrentFilter().updateJumpInputMax();
    
    // 开始预加载
    this.preloadCurrentQuestion();
  }

  /**
   * 重新生成题目
   */
  regenerateQuestions() {
    // 检查是否为邀请码模式（非常规模式），如果是则拦截
    if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
      alert('当前模式下该功能不可用');
      return;
    }
    
    const hasAnswers = Object.keys(this.userAnswers).length > 0;
    if (hasAnswers) {
      const confirmed = confirm('重新生成将清除当前答案，确定要继续吗？');
      if (!confirmed) return;
    }
    
    // 清除所有数据
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    this.startTime = null;
    
    // 清除存储
    this.clearStoredAnswers();
    
    // 重新生成题目
    this.getCurrentFilter().regenerateQuestions(this.allQuestions, this.getCurrentFilter().getCurrentFilter());
    
    // 重置UI
    this.displayQuestion(0);
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.getCurrentFilter().updateFilterInfo();
    this.getCurrentFilter().updateJumpInputMax();
    
    // 重新开始预加载
    this.preloadCurrentQuestion();
    
    // 显示成功提示
    this.getCurrentFilter().showRegenerateSuccess();
  }

  /**
   * 获取测试结果
   */
  getTestResults() {
    const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
    let correctCount = 0;
    const results = [];
    
    filteredQuestions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const correctAnswer = question.answer;
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      results.push({
        questionNumber: index + 1,
        userAnswer: userAnswer || '未答',
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
      });
    });
    
    const accuracy = Math.round((correctCount / filteredQuestions.length) * 100);
    const timeSpent = this.startTime ? this.formatTime(Date.now() - this.startTime) : '未知';
    
    return {
      totalQuestions: filteredQuestions.length,
      correctAnswers: correctCount,
      accuracy: accuracy,
      timeSpent: timeSpent,
      answers: this.userAnswers,
      version: this.currentVersion,
      filter: this.getCurrentFilter().getCurrentFilter(),
      seed: this.getCurrentFilter().getCurrentSeed(),
      results: results
    };
  }

  /**
   * 格式化时间
   */
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  }

  /**
   * AI分析
   */
  analyzeWithAI() {
    // 检查是否为邀请码模式（非常规模式），如果是则拦截
    if (this.currentInviteCodeData && !this.currentInviteCodeData.isRegularMode) {
      alert('当前模式下该功能不可用');
      return;
    }
    
    alert('AI分析功能开发中...');
  }

  /**
   * 下载答题数据为Excel文件
   */
  downloadAnswerDataAsExcel(results) {
    try {
      const filteredQuestions = this.getCurrentFilter().getFilteredQuestions();
      
      // 创建CSV数据（Excel可以打开CSV文件）
      let csvContent = '\uFEFF'; // BOM for UTF-8
      csvContent += '题目编号,题目描述,正确答案,用户答案,答题结果\n';
      
      filteredQuestions.forEach((question, index) => {
        const userAnswer = this.userAnswers[index] || '未答';
        const correctAnswer = question.answer;
        const isCorrect = userAnswer === correctAnswer ? '正确' : '错误';
        const questionDesc = question.image || `第${index + 1}题`;
        
        // 转义CSV中的特殊字符
        const escapeCsvField = (field) => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        };
        
        csvContent += `${escapeCsvField(index + 1)},${escapeCsvField(questionDesc)},${escapeCsvField(correctAnswer)},${escapeCsvField(userAnswer)},${escapeCsvField(isCorrect)}\n`;
      });
      
      // 添加汇总信息
      csvContent += '\n汇总信息\n';
      csvContent += `总题数,${results.totalQuestions}\n`;
      csvContent += `正确题数,${results.correctAnswers}\n`;
      csvContent += `准确率,${results.accuracy}%\n`;
      csvContent += `用时,${results.timeSpent}\n`;
      csvContent += `测试版本,${this.currentVersion}\n`;
      csvContent += `测试时间,${new Date().toLocaleString()}\n`;
      
      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `纸折叠测试答题数据_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示下载成功提示
      const downloadBtn = document.getElementById('downloadExcelBtn');
      if (downloadBtn) {
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="bi bi-check"></i> 下载成功';
        downloadBtn.style.background = '#28a745';
        downloadBtn.style.color = 'white';
        setTimeout(() => {
          downloadBtn.innerHTML = originalText;
          downloadBtn.style.background = '';
          downloadBtn.style.color = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('下载Excel文件失败:', error);
      alert('下载失败，请稍后重试');
    }
  }

  // 调试方法
  checkCacheStatus() {
    return this.imageCache.getCacheStatus();
  }

  clearImageCache() {
    this.imageCache.clearCache();
    console.log('图片缓存已清除');
  }
}