/**
 * UI管理器
 * 负责界面显示、更新和用户交互
 */
export class UIManager {
  constructor(imageCache) {
    this.imageCache = imageCache;
    this.currentQuestionIndex = 0;
  }

  /**
   * 显示题目
   */
  displayQuestion(index, question, filteredQuestions) {
    this.currentQuestionIndex = index;
    
    // 更新题目编号
    const questionNumber = document.getElementById('questionNumber');
    if (questionNumber) {
      questionNumber.textContent = `第 ${index + 1} 题`;
    }
    
    // 显示题目图片
    this.displayQuestionImage(question.image_path);
    
    // 显示选项区域
    this.showOptionArea();
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
   * 恢复用户选择
   */
  restoreUserSelection(questionIndex, userAnswers, currentQuestion) {
    const userAnswer = userAnswers[currentQuestion.id];
    
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
   * 更新选项选择状态
   */
  updateOptionSelection(optionValue) {
    // 清除所有选项的选中状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // 设置当前选项为选中状态
    const selectedOption = document.querySelector(`[data-option="${optionValue}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  }

  /**
   * 更新导航按钮状态
   */
  updateNavigationButtons(currentIndex, totalQuestions) {
    // 移动端按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    // 桌面端按钮
    const prevBtnDesktop = document.getElementById('prevBtnDesktop');
    const nextBtnDesktop = document.getElementById('nextBtnDesktop');
    
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    
    // 更新移动端按钮状态
    if (prevBtn) {
      prevBtn.disabled = isFirstQuestion;
    }
    
    if (nextBtn) {
      nextBtn.disabled = isLastQuestion;
    }
    
    // 更新桌面端按钮状态
    if (prevBtnDesktop) {
      prevBtnDesktop.disabled = isFirstQuestion;
    }
    
    if (nextBtnDesktop) {
      nextBtnDesktop.disabled = isLastQuestion;
    }
  }

  /**
   * 更新进度显示
   */
  updateProgress(currentIndex, totalQuestions) {
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    
    if (progressText) {
      progressText.textContent = `${currentIndex + 1} / ${totalQuestions}`;
    }
    
    if (progressBar) {
      const percentage = ((currentIndex + 1) / totalQuestions) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * 更新提交按钮状态
   */
  updateSubmitButton(answeredCount, totalQuestions) {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      const allAnswered = answeredCount === totalQuestions;
      
      // 允许用户在回答至少一题后提交测试
      submitBtn.disabled = answeredCount === 0;
      submitBtn.textContent = allAnswered ? 
        `提交测试 (${answeredCount}/${totalQuestions})` : 
        `提交测试 (${answeredCount}/${totalQuestions})`;
    }
  }

  /**
   * 同步任务按钮和下拉列表状态
   */
  syncTaskButtonState(currentTask) {
    // 同步按钮状态（保持向后兼容）
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.version === currentTask);
    });
    
    // 同步下拉列表状态
    const versionSelect = document.getElementById('versionSelect');
    if (versionSelect) {
      versionSelect.value = currentTask;
    }
  }

  /**
   * 更新筛选按钮文字
   */
  updateFilterButtonTexts(currentTask) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (currentTask === 'task1') {
      filterButtons.forEach(btn => {
        btn.style.display = 'inline-block';
        const filterType = btn.dataset.filter;
        if (filterType === 'all') {
          btn.textContent = '全部题目';
        } else if (filterType === '3') {
          btn.textContent = '3步折叠';
        } else if (filterType === '4') {
          btn.textContent = '4步折叠';
        } else if (filterType === '5') {
          btn.textContent = '5步折叠';
        }
      });
    } else if (currentTask === 'task2') {
      filterButtons.forEach(btn => {
        btn.style.display = 'inline-block';
        const filterType = btn.dataset.filter;
        if (filterType === 'all') {
          btn.textContent = '全部题目';
        } else if (filterType === '3') {
          btn.textContent = '3步折叠';
        } else if (filterType === '4') {
          btn.textContent = '4步折叠';
        } else if (filterType === '5') {
          btn.textContent = '其它折叠';
        }
      });
    } else if (currentTask === 'task3') {
      filterButtons.forEach(btn => {
        const filterType = btn.dataset.filter;
        if (filterType === 'all') {
          btn.textContent = '全部题目';
          btn.style.display = 'inline-block';
        } else {
          btn.style.display = 'none';
        }
      });
    }
    console.log(`筛选按钮文字已更新为当前任务: ${currentTask}`);
  }

  /**
   * 更新筛选按钮状态
   */
  updateFilterButtonState(filterType) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
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
   * 显示状态消息
   */
  showStatusMessage(message, type = 'info', duration = 3000) {
    const statusDiv = document.createElement('div');
    let backgroundColor = '#007bff';
    
    switch(type) {
      case 'success':
        backgroundColor = '#28a745';
        break;
      case 'warning':
        backgroundColor = '#ffc107';
        break;
      case 'error':
        backgroundColor = '#dc3545';
        break;
    }
    
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, duration);
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
   * 更新重新生成按钮状态
   */
  updateRegenerateButton(inviteCodeData) {
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
      // 检查是否为邀请码模式（非常规模式）
      const isInviteCodeMode = inviteCodeData && !inviteCodeData.isRegularMode;
      
      if (isInviteCodeMode) {
        // 邀请码模式下禁用按钮并设置灰色样式
        regenerateBtn.disabled = true;
        regenerateBtn.style.opacity = '0.5';
        regenerateBtn.style.cursor = 'not-allowed';
        regenerateBtn.title = '邀请码模式下该功能不可用';
      } else {
        // 常规模式下恢复按钮正常状态
        regenerateBtn.disabled = false;
        regenerateBtn.style.opacity = '1';
        regenerateBtn.style.cursor = 'pointer';
        regenerateBtn.title = '';
      }
    }
  }
}