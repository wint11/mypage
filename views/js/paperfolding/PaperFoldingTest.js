import { Config } from './Config.js';
import { ImageCache } from './ImageCache.js';
import { WenjuanxingUploader } from './WenjuanxingUploader.js';
import { Downloader } from './Downloader.js';
import { Filter } from './Filter.js';
import { RandomUtils } from './RandomUtils.js';
import { InstructionsPage } from './InstructionsPage.js';

/**
 * 纸折叠测试主类
 */
export class PaperFoldingTest {
  constructor() {
    this.config = new Config();
    this.imageCache = new ImageCache(this.config);
    this.wenjuanxingUploader = new WenjuanxingUploader();
    this.downloader = new Downloader();
    this.filter = new Filter();
    this.instructionsPage = new InstructionsPage();
    
    this.allQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.startTime = null;
    this.currentVersion = 'A';
    this.isInitialized = false;
    
    this.setupInstructionsPage();
  }

  /**
   * 设置答题须知页面
   */
  setupInstructionsPage() {
    // 设置确认回调函数
    this.instructionsPage.setOnConfirmCallback(() => {
      this.init();
    });
    
    console.log('答题须知页面已设置');
  }

  /**
   * 初始化
   */
  async init() {
    if (this.isInitialized) {
      console.log('测试已经初始化过了');
      return;
    }
    
    try {
      console.log('开始初始化纸折叠测试...');
      
      await this.loadQuestions();
      this.setupEventListeners();
      this.loadAnswersFromStorage();
      
      // 初始化筛选器
      this.filter.initializeFilter(this.allQuestions);
      
      this.displayQuestion(0);
      this.updateProgress();
      this.updateNavigationButtons();
      this.updateSubmitButton();
      this.filter.updateFilterInfo();
      this.filter.updateJumpInputMax();
      
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
   */
  async loadQuestions() {
    try {
      const response = await fetch(this.config.getDataPath());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      this.allQuestions = lines.map(line => {
        try {
          const question = JSON.parse(line);
          // 转换数据格式：将 'image' 字段转换为 'image_path' 并添加完整路径
          if (question.image) {
            question.image_path = this.config.getImageBasePath() + question.image;
          }
          return question;
        } catch (e) {
          console.warn('解析题目数据失败:', line);
          return null;
        }
      }).filter(q => q !== null);
      
      console.log(`加载了 ${this.allQuestions.length} 道题目`);
      
      if (this.allQuestions.length === 0) {
        throw new Error('没有找到有效的题目数据');
      }
    } catch (error) {
      console.error('加载题目失败:', error);
      throw error;
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

    // 版本切换
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const version = e.target.dataset.version;
        this.switchVersion(version);
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
        this.downloader.downloadQuestionImage(this.currentQuestionIndex);
      });
    }
    
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        this.downloader.downloadAllQuestions(
          this.filter.getFilteredQuestions(),
          this.filter.getCurrentFilter(),
          (index) => this.displayQuestion(index)
        );
      });
    }
  }

  /**
   * 预加载当前题目
   */
  preloadCurrentQuestion() {
    const filteredQuestions = this.filter.getFilteredQuestions();
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
    const filteredQuestions = this.filter.getFilteredQuestions();
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
      this.filter.getFilteredQuestions().length - 1,
      this.currentQuestionIndex + preloadRange
    );
    
    this.preloadRange(startIndex, endIndex);
  }

  /**
   * 显示题目
   */
  displayQuestion(index) {
    const filteredQuestions = this.filter.getFilteredQuestions();
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
    
    // 隐藏选项区域（因为这是图片题目）
    this.hideOptionArea();
    
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
   * 隐藏选项区域
   */
  hideOptionArea() {
    const optionsContainer = document.querySelector('.options-container');
    if (optionsContainer) {
      optionsContainer.style.display = 'none';
    }
  }

  /**
   * 选择选项
   */
  selectOption(optionValue) {
    const filteredQuestions = this.filter.getFilteredQuestions();
    if (this.currentQuestionIndex >= filteredQuestions.length) return;
    
    this.userAnswers[this.currentQuestionIndex] = optionValue;
    this.saveAnswersToStorage();
    
    // 更新UI显示
    this.restoreUserSelection(this.currentQuestionIndex);
    this.updateSubmitButton();
    
    console.log(`题目 ${this.currentQuestionIndex + 1} 选择了选项: ${optionValue}`);
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
      localStorage.setItem(this.config.getStorageKey('answers'), JSON.stringify(data));
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  }

  /**
   * 从本地存储加载答案
   */
  loadAnswersFromStorage() {
    try {
      const stored = localStorage.getItem(this.config.getStorageKey('answers'));
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
      localStorage.removeItem(this.config.getStorageKey('answers'));
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
    const filteredQuestions = this.filter.getFilteredQuestions();
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
      const filteredQuestions = this.filter.getFilteredQuestions();
      
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
    this.filter.applyFilter(this.allQuestions, this.filter.getCurrentFilter());
    
    this.displayQuestion(0);
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.filter.updateFilterInfo();
    this.filter.updateJumpInputMax();
    
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
    const filteredQuestions = this.filter.getFilteredQuestions();
    
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
    const filteredQuestions = this.filter.getFilteredQuestions();
    
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
      const filteredQuestions = this.filter.getFilteredQuestions();
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
    const filteredQuestions = this.filter.getFilteredQuestions();
    const answeredCount = Object.keys(this.userAnswers).length;
    
    if (answeredCount < filteredQuestions.length) {
      alert(`还有 ${filteredQuestions.length - answeredCount} 道题未完成，请继续答题。`);
      return;
    }
    
    // 计算结果
    const results = this.getTestResults();
    
    // 显示结果
    this.showTestResults(results);
    
    // 上传到问卷星
    this.wenjuanxingUploader.uploadToWenjuanxing(results);
    
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
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="copyResultBtn" class="btn btn-outline-primary">
          <i class="bi bi-clipboard"></i> 复制数据
        </button>
        <button id="closeResultBtn" class="btn btn-primary">
          关闭
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('copyResultBtn').addEventListener('click', () => {
      const resultText = `纸折叠测试结果\n准确率: ${results.accuracy}%\n总题数: ${results.totalQuestions}\n正确: ${results.correctAnswers}\n用时: ${results.timeSpent}`;
      navigator.clipboard.writeText(resultText).then(() => {
        alert('结果已复制到剪贴板');
      });
    });
    
    document.getElementById('closeResultBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  /**
   * 显示正确答案
   */
  showCorrectAnswers() {
    const filteredQuestions = this.filter.getFilteredQuestions();
    
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
    this.filter.applyFilter(this.allQuestions, filterType);
    
    // 重置到第一题
    this.currentQuestionIndex = 0;
    this.displayQuestion(0);
    
    // 更新UI
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.filter.updateFilterInfo();
    this.filter.updateJumpInputMax();
    
    // 开始预加载
    this.preloadCurrentQuestion();
  }

  /**
   * 重新生成题目
   */
  regenerateQuestions() {
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
    this.filter.regenerateQuestions(this.allQuestions, this.filter.getCurrentFilter());
    
    // 重置UI
    this.displayQuestion(0);
    this.updateProgress();
    this.updateNavigationButtons();
    this.updateSubmitButton();
    this.filter.updateFilterInfo();
    this.filter.updateJumpInputMax();
    
    // 重新开始预加载
    this.preloadCurrentQuestion();
    
    // 显示成功提示
    this.filter.showRegenerateSuccess();
  }

  /**
   * 获取测试结果
   */
  getTestResults() {
    const filteredQuestions = this.filter.getFilteredQuestions();
    let correctCount = 0;
    
    filteredQuestions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const correctAnswer = question.answer;
      
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
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
      filter: this.filter.getCurrentFilter(),
      seed: this.filter.getCurrentSeed()
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
   * AI分析（占位符）
   */
  analyzeWithAI() {
    alert('AI分析功能开发中...');
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