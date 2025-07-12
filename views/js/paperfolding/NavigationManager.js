/**
 * 导航管理器
 * 负责题目导航、跳转和预加载功能
 */
export class NavigationManager {
  constructor(imageCache) {
    this.imageCache = imageCache;
    this.currentQuestionIndex = 0;
  }

  /**
   * 上一题
   */
  previousQuestion(filteredQuestions, onDisplayQuestion) {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      onDisplayQuestion(this.currentQuestionIndex);
      return true;
    }
    return false;
  }

  /**
   * 下一题
   */
  nextQuestion(filteredQuestions, onDisplayQuestion) {
    if (this.currentQuestionIndex < filteredQuestions.length - 1) {
      this.currentQuestionIndex++;
      onDisplayQuestion(this.currentQuestionIndex);
      return true;
    }
    return false;
  }

  /**
   * 跳转到指定题目
   */
  jumpToQuestion(filteredQuestions, onDisplayQuestion) {
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
      const targetIndex = parseInt(jumpInput.value) - 1;
      
      if (targetIndex >= 0 && targetIndex < filteredQuestions.length) {
        this.currentQuestionIndex = targetIndex;
        onDisplayQuestion(targetIndex);
        jumpInput.value = '';
        return true;
      } else {
        alert(`请输入 1 到 ${filteredQuestions.length} 之间的数字`);
        return false;
      }
    }
    return false;
  }

  /**
   * 预加载当前题目
   */
  preloadCurrentQuestion(filteredQuestions) {
    if (filteredQuestions.length === 0) return;
    
    const currentQuestion = filteredQuestions[this.currentQuestionIndex];
    if (currentQuestion) {
      this.imageCache.preloadImage(currentQuestion.image_path);
    }
    
    // 预加载相邻题目
    this.preloadAdjacentQuestions(filteredQuestions);
  }

  /**
   * 预加载指定范围的题目
   */
  preloadRange(startIndex, endIndex, filteredQuestions) {
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
  preloadAdjacentQuestions(filteredQuestions) {
    const preloadRange = 2;
    const startIndex = Math.max(0, this.currentQuestionIndex - preloadRange);
    const endIndex = Math.min(
      filteredQuestions.length - 1,
      this.currentQuestionIndex + preloadRange
    );
    
    this.preloadRange(startIndex, endIndex, filteredQuestions);
  }

  /**
   * 设置键盘导航事件监听器
   */
  setupKeyboardNavigation(filteredQuestions, onDisplayQuestion, onSelectOption) {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previousQuestion(filteredQuestions, onDisplayQuestion);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextQuestion(filteredQuestions, onDisplayQuestion);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          onSelectOption(e.key);
          break;
      }
    });
  }

  /**
   * 设置导航按钮事件监听器
   */
  setupNavigationButtons(filteredQuestions, onDisplayQuestion) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousQuestion(filteredQuestions, onDisplayQuestion);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextQuestion(filteredQuestions, onDisplayQuestion);
      });
    }
    
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        this.jumpToQuestion(filteredQuestions, onDisplayQuestion);
      });
    }
  }

  /**
   * 获取当前题目索引
   */
  getCurrentQuestionIndex() {
    return this.currentQuestionIndex;
  }

  /**
   * 设置当前题目索引
   */
  setCurrentQuestionIndex(index) {
    this.currentQuestionIndex = index;
  }

  /**
   * 重置到第一题
   */
  resetToFirstQuestion() {
    this.currentQuestionIndex = 0;
  }
}