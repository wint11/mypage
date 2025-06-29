// 纸张折叠测试 JavaScript
class PaperFoldingTest {
  constructor() {
    this.questions = [];
    this.filteredQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.testCompleted = false;
    this.currentFilter = 'all';
    this.imageCache = new Map(); // 图片缓存
    this.loadingProgress = { loaded: 0, total: 0 }; // 加载进度
    this.init();
  }

  async init() {
    try {
      await this.loadQuestions();
      this.initializeFilter();
      this.setupEventListeners();
      
      // 显示当前题目（使用占位符）
      this.displayQuestion();
      this.updateProgress();
      this.updateSubmitButton();
      
      // 开始预加载图片
      this.startImagePreloading();
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('加载题目数据失败，请刷新页面重试。');
    }
  }

  async loadQuestions() {
    try {
      const response = await fetch('../paperfolding/questions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.questions = data.questions || [];
      
      if (this.questions.length === 0) {
        throw new Error('没有找到题目数据');
      }
      
      // 初始化用户答案数组
      this.userAnswers = new Array(this.questions.length).fill(null);
      
      // 从localStorage恢复答案
      this.loadAnswersFromStorage();
      
      console.log(`成功加载 ${this.questions.length} 道题目`);
    } catch (error) {
      console.error('加载题目失败:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // 上一题按钮
    document.getElementById('prevBtn').addEventListener('click', () => {
      this.previousQuestion();
    });

    // 下一题按钮
    document.getElementById('nextBtn').addEventListener('click', () => {
      this.nextQuestion();
    });
    
    // 提交按钮
    document.getElementById('submitBtn').addEventListener('click', () => {
      this.submitTest();
    });
    
    // 筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);
      });
    });

    // 选项点击事件
    document.querySelectorAll('.option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectOption(e.currentTarget.dataset.option);
      });
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.previousQuestion();
          break;
        case 'ArrowRight':
          this.nextQuestion();
          break;
        case 'a':
        case 'A':
          this.selectOption('A');
          break;
        case 'b':
        case 'B':
          this.selectOption('B');
          break;
        case 'c':
        case 'C':
          this.selectOption('C');
          break;
        case 'd':
        case 'D':
          this.selectOption('D');
          break;
      }
    });
  }

  // 开始图片预加载
  startImagePreloading() {
    // 收集所有需要加载的图片路径
    const allImagePaths = new Set();
    
    this.questions.forEach(question => {
      // 添加题干图片
      question.stemImages.forEach(imagePath => {
        allImagePaths.add(imagePath);
      });
      
      // 添加选项图片
      Object.values(question.options).forEach(imagePath => {
        allImagePaths.add(imagePath);
      });
    });
    
    this.loadingProgress.total = allImagePaths.size;
    this.loadingProgress.loaded = 0;
    
    // 优先加载当前题目的图片
    this.preloadCurrentQuestionImages().then(() => {
      // 然后预加载其他图片
      this.preloadRemainingImages(allImagePaths);
    });
  }
  
  // 预加载当前题目的图片
  async preloadCurrentQuestionImages() {
    if (this.filteredQuestions.length === 0) return;
    
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const currentImages = [
      ...currentQuestion.stemImages,
      ...Object.values(currentQuestion.options)
    ];
    
    const promises = currentImages.map(imagePath => this.preloadImage(imagePath));
    await Promise.all(promises);
    
    // 当前题目图片加载完成后，立即更新显示
    this.displayQuestion();
  }
  
  // 预加载剩余图片
  async preloadRemainingImages(allImagePaths) {
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const currentImages = new Set([
      ...currentQuestion.stemImages,
      ...Object.values(currentQuestion.options)
    ]);
    
    // 过滤掉已经加载的当前题目图片
    const remainingImages = Array.from(allImagePaths).filter(path => !currentImages.has(path));
    
    // 批量预加载，每次加载5张图片
    const batchSize = 5;
    for (let i = 0; i < remainingImages.length; i += batchSize) {
      const batch = remainingImages.slice(i, i + batchSize);
      const promises = batch.map(imagePath => this.preloadImage(imagePath));
      await Promise.all(promises);
      
      // 可以在这里更新加载进度
      this.updateLoadingProgress();
    }
  }
  
  // 预加载单个图片
  preloadImage(imagePath) {
    return new Promise((resolve) => {
      if (this.imageCache.has(imagePath)) {
        resolve(this.imageCache.get(imagePath));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(imagePath, img.src);
        this.loadingProgress.loaded++;
        resolve(img.src);
      };
      img.onerror = () => {
        // 使用默认占位符
        const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.imageCache.set(imagePath, placeholderSrc);
        this.loadingProgress.loaded++;
        resolve(placeholderSrc);
      };
      img.src = `../paperfolding/images/${imagePath}`;
    });
  }
  
  // 更新加载进度
  updateLoadingProgress() {
    const percentage = Math.round((this.loadingProgress.loaded / this.loadingProgress.total) * 100);
    // 可以在这里显示加载进度，比如在控制台或UI中
    console.log(`图片加载进度: ${this.loadingProgress.loaded}/${this.loadingProgress.total} (${percentage}%)`);
  }

  displayQuestion() {
    if (this.filteredQuestions.length === 0) {
      this.showError('没有符合筛选条件的题目');
      return;
    }
    
    const question = this.filteredQuestions[this.currentQuestionIndex];
    
    // 显示题干图片
    this.displayStemImages(question.stemImages);
    
    // 显示选项图片
    this.displayOptions(question.options);
    
    // 恢复用户之前的选择
    this.restoreUserSelection();
    
    // 更新导航按钮状态
    this.updateNavigationButtons();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
    
    // 清除答题反馈
    this.clearFeedback();
  }

  displayStemImages(stemImages) {
    const container = document.getElementById('stemImages');
    container.innerHTML = '';
    
    stemImages.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.alt = `题干图片 ${index + 1}`;
      
      // 使用缓存的图片或占位符
      if (this.imageCache.has(imagePath)) {
        img.src = this.imageCache.get(imagePath);
      } else {
        // 如果缓存中没有，使用占位符并异步加载
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.preloadImage(imagePath).then(src => {
          img.src = src;
        });
      }
      
      container.appendChild(img);
      
      // 添加箭头（除了最后一张图片）
      if (index < stemImages.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'fold-arrow';
        arrow.innerHTML = '→';
        container.appendChild(arrow);
      }
    });
  }

  displayOptions(options) {
    ['A', 'B', 'C', 'D'].forEach(option => {
      const img = document.getElementById(`option${option}`);
      const imagePath = options[option];
      
      // 使用缓存的图片或占位符
      if (this.imageCache.has(imagePath)) {
        img.src = this.imageCache.get(imagePath);
      } else {
        // 如果缓存中没有，使用占位符并异步加载
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.preloadImage(imagePath).then(src => {
          img.src = src;
        });
      }
    });
  }

  selectOption(selectedOption) {
    if (this.testCompleted) return;
    
    // 清除之前的选择状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // 标记当前选择
    const optionElement = document.querySelector(`[data-option="${selectedOption}"]`);
    optionElement.classList.add('selected');
    
    // 获取当前题目在原始数组中的索引
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === currentQuestion);
    
    // 保存用户答案到原始数组对应位置
    this.userAnswers[originalIndex] = selectedOption;
    
    // 保存到localStorage
    this.saveAnswersToStorage();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
  }

  saveAnswersToStorage() {
    localStorage.setItem('paperfolding_answers', JSON.stringify(this.userAnswers));
  }
  
  loadAnswersFromStorage() {
    const saved = localStorage.getItem('paperfolding_answers');
    if (saved) {
      try {
        const answers = JSON.parse(saved);
        if (answers.length === this.questions.length) {
          this.userAnswers = answers;
        }
      } catch (e) {
        console.warn('无法加载保存的答案:', e);
      }
    }
  }
  
  clearStoredAnswers() {
    localStorage.removeItem('paperfolding_answers');
  }

  restoreUserSelection() {
    // 获取当前题目在原始数组中的索引
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === currentQuestion);
    const userAnswer = this.userAnswers[originalIndex];
    
    if (userAnswer) {
      // 只恢复视觉状态，不触发选择逻辑
      document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
      });
      const optionElement = document.querySelector(`[data-option="${userAnswer}"]`);
      if (optionElement) {
        optionElement.classList.add('selected');
      }
    }
  }

  clearFeedback() {
    const feedbackElement = document.getElementById('answerFeedback');
    feedbackElement.textContent = '';
    feedbackElement.className = 'answer-feedback';
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载前一题的图片（如果存在且未缓存）
      this.preloadAdjacentQuestions();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载下一题的图片（如果存在且未缓存）
      this.preloadAdjacentQuestions();
    }
  }
  
  // 预加载相邻题目的图片
  preloadAdjacentQuestions() {
    const adjacentIndexes = [];
    
    // 添加前一题索引
    if (this.currentQuestionIndex > 0) {
      adjacentIndexes.push(this.currentQuestionIndex - 1);
    }
    
    // 添加后一题索引
    if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
      adjacentIndexes.push(this.currentQuestionIndex + 1);
    }
    
    // 预加载相邻题目的图片
    adjacentIndexes.forEach(index => {
      const question = this.filteredQuestions[index];
      const images = [
        ...question.stemImages,
        ...Object.values(question.options)
      ];
      
      images.forEach(imagePath => {
        if (!this.imageCache.has(imagePath)) {
          this.preloadImage(imagePath);
        }
      });
    });
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.disabled = this.currentQuestionIndex === this.filteredQuestions.length - 1;
  }

  updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    const current = this.currentQuestionIndex + 1;
    const total = this.filteredQuestions.length;
    const percentage = (current / total) * 100;
    
    progressText.textContent = `${current}/${total}`;
    progressFill.style.width = `${percentage}%`;
  }
  
  updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const answeredCount = this.userAnswers.filter(answer => answer !== null).length;
    const allAnswered = answeredCount === this.questions.length;
    
    submitBtn.disabled = !allAnswered;
    submitBtn.textContent = allAnswered ? '提交测试' : `已答题 ${answeredCount}/${this.questions.length}`;
  }
  
  submitTest() {
    if (this.testCompleted) return;
    
    const results = this.getTestResults();
    this.testCompleted = true;
    
    // 显示结果
    this.showTestResults(results);
    
    // 清除存储的答案
    this.clearStoredAnswers();
  }
  
  showTestResults(results) {
    const feedbackElement = document.getElementById('answerFeedback');
    const accuracy = parseFloat(results.accuracy);
    
    let message = `测试完成！\n正确率：${results.accuracy}% (${results.correctAnswers}/${results.totalQuestions})`;
    let className = 'answer-feedback ';
    
    // if (accuracy >= 80) {
    //   message += '\n🎉 优秀！';
    //   className += 'excellent';
    // } else if (accuracy >= 60) {
    //   message += '\n👍 良好！';
    //   className += 'good';
    // } else {
    //   message += '\n💪 继续努力！';
    //   className += 'needs-improvement';
    // }
    
    feedbackElement.textContent = message;
    feedbackElement.className = className;
    
    // 禁用所有选项
    document.querySelectorAll('.option').forEach(option => {
      option.style.pointerEvents = 'none';
      option.style.opacity = '0.7';
    });
    
    // 显示正确答案
    this.showCorrectAnswers();
  }
  
  showCorrectAnswers() {
    const question = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === question);
    const userAnswer = this.userAnswers[originalIndex];
    
    // 清除之前的状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // 显示用户选择和正确答案
    if (userAnswer) {
      const userOption = document.querySelector(`[data-option="${userAnswer}"]`);
      if (userAnswer === question.correctAnswer) {
        userOption.classList.add('correct');
      } else {
        userOption.classList.add('incorrect');
      }
    }
    
    // 显示正确答案
    const correctOption = document.querySelector(`[data-option="${question.correctAnswer}"]`);
    correctOption.classList.add('correct');
  }

  showError(message) {
    const container = document.querySelector('.test-container');
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ 加载错误</h2>
        <p style="color: #666; font-size: 1.1rem;">${message}</p>
        <button onclick="location.reload()" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 20px;
        ">重新加载</button>
      </div>
    `;
  }

  // 筛选功能
  applyFilter(filterType) {
    this.currentFilter = filterType;
    
    // 更新筛选按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === filterType) {
        btn.classList.add('active');
      }
    });
    
    // 根据筛选条件过滤题目
    if (filterType === 'all') {
      this.filteredQuestions = [...this.questions];
    } else {
      const stepCount = parseInt(filterType);
      this.filteredQuestions = this.questions.filter(question => 
        question.stemImages.length === stepCount
      );
    }
    
    // 重置当前题目索引
    this.currentQuestionIndex = 0;
    
    // 更新筛选信息
    this.updateFilterInfo();
    
    // 重新显示题目
    if (this.filteredQuestions.length > 0) {
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载当前筛选后的第一题图片（如果还没有缓存）
      this.preloadCurrentQuestionImages();
    } else {
      this.showError(`没有找到${filterType === 'all' ? '任何' : filterType + '步折叠的'}题目`);
    }
  }
  
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      let infoText = '';
      if (this.currentFilter === 'all') {
        infoText = `显示全部 ${this.filteredQuestions.length} 道题目`;
      } else {
        infoText = `显示 ${this.currentFilter}步折叠 ${this.filteredQuestions.length} 道题目`;
      }
      filterInfo.textContent = infoText;
    }
  }
  
  initializeFilter() {
    // 初始化时显示所有题目
    this.filteredQuestions = [...this.questions];
    this.updateFilterInfo();
  }

  // 获取测试结果
  getTestResults() {
    let correctCount = 0;
    const results = [];
    
    this.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      results.push({
        questionNumber: index + 1,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
      });
    });
    
    return {
      totalQuestions: this.questions.length,
      correctAnswers: correctCount,
      accuracy: (correctCount / this.questions.length * 100).toFixed(1),
      results: results
    };
  }
}

// 页面加载完成后初始化测试
document.addEventListener('DOMContentLoaded', () => {
  window.paperFoldingTest = new PaperFoldingTest();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaperFoldingTest;
}