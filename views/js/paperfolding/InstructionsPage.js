/**
 * 答题须知页面模块
 * 处理答题须知页面的显示、倒计时和确认逻辑
 */
export class InstructionsPage {
  constructor() {
    this.countdownTime = 5; // 倒计时秒数
    this.currentCount = this.countdownTime;
    this.countdownTimer = null;
    this.onConfirmCallback = null;
    
    this.init();
  }

  /**
   * 初始化答题须知页面
   */
  init() {
    this.setupEventListeners();
    this.startCountdown();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!confirmBtn.disabled) {
          this.handleConfirm();
        }
      });
    }
  }

  /**
   * 开始倒计时
   */
  startCountdown() {
    const confirmBtn = document.getElementById('confirmBtn');
    const confirmText = document.getElementById('confirmText');
    
    if (!confirmBtn || !confirmText) {
      console.error('找不到确认按钮或文本元素');
      return;
    }

    // 初始状态
    confirmBtn.disabled = true;
    confirmText.textContent = `确认 (${this.currentCount})`;

    // 开始倒计时
    this.countdownTimer = setInterval(() => {
      this.currentCount--;
      
      if (this.currentCount > 0) {
        confirmText.textContent = `确认 (${this.currentCount})`;
      } else {
        // 倒计时结束，启用按钮
        confirmText.textContent = '确认';
        confirmBtn.disabled = false;
        confirmBtn.classList.add('enabled');
        
        // 清除定时器
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        
        console.log('倒计时结束，确认按钮已启用');
      }
    }, 1000);
  }

  /**
   * 处理确认按钮点击
   */
  handleConfirm() {
    console.log('用户确认答题须知');
    
    // 隐藏答题须知页面
    this.hide();
    
    // 显示主要内容
    this.showMainContent();
    
    // 执行回调函数
    if (this.onConfirmCallback && typeof this.onConfirmCallback === 'function') {
      this.onConfirmCallback();
    }
  }

  /**
   * 隐藏答题须知页面
   */
  hide() {
    const instructionsPage = document.getElementById('instructionsPage');
    if (instructionsPage) {
      instructionsPage.style.display = 'none';
    }
  }

  /**
   * 显示主要内容
   */
  showMainContent() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.display = 'flex';
    }
  }

  /**
   * 设置确认回调函数
   * @param {Function} callback - 确认后执行的回调函数
   */
  setOnConfirmCallback(callback) {
    this.onConfirmCallback = callback;
  }

  /**
   * 重置倒计时
   */
  resetCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.currentCount = this.countdownTime;
    this.startCountdown();
  }

  /**
   * 销毁实例，清理资源
   */
  destroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /**
   * 检查是否已确认
   * @returns {boolean} 是否已确认
   */
  isConfirmed() {
    const instructionsPage = document.getElementById('instructionsPage');
    return !instructionsPage || instructionsPage.style.display === 'none';
  }

  /**
   * 强制显示答题须知页面（用于重新显示）
   */
  show() {
    const instructionsPage = document.getElementById('instructionsPage');
    const mainContent = document.querySelector('.main-content');
    
    if (instructionsPage) {
      instructionsPage.style.display = 'flex';
    }
    
    if (mainContent) {
      mainContent.style.display = 'none';
    }
    
    // 重置倒计时
    this.resetCountdown();
  }
}