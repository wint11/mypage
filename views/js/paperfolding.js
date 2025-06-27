// 纸张折叠测试 JavaScript
class PaperFoldingTest {
  constructor() {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.testCompleted = false;
    this.init();
  }

  async init() {
    try {
      await this.loadQuestions();
      this.setupEventListeners();
      this.displayQuestion();
      this.updateProgress();
      this.updateSubmitButton();
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

  displayQuestion() {
    if (this.questions.length === 0) return;
    
    const question = this.questions[this.currentQuestionIndex];
    
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
      img.src = `../paperfolding/images/${imagePath}`;
      img.alt = `题干图片 ${index + 1}`;
      img.onerror = () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
      };
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
      img.src = `../paperfolding/images/${options[option]}`;
      img.onerror = () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
      };
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
    
    // 保存用户答案
    this.userAnswers[this.currentQuestionIndex] = selectedOption;
    
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
    const userAnswer = this.userAnswers[this.currentQuestionIndex];
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
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
      this.updateProgress();
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.disabled = this.currentQuestionIndex === this.questions.length - 1;
  }

  updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    const current = this.currentQuestionIndex + 1;
    const total = this.questions.length;
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
    const question = this.questions[this.currentQuestionIndex];
    const userAnswer = this.userAnswers[this.currentQuestionIndex];
    
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