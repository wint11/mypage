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
    this.inviteCodes = []; // 存储邀请码数据
    
    this.init();
  }

  /**
   * 初始化答题须知页面
   */
  async init() {
    await this.loadInviteCodes();
    this.setupEventListeners();
    this.startCountdown();
  }

  /**
   * 加载邀请码数据
   */
  async loadInviteCodes() {
    try {
      const response = await fetch('data/invite_codes.jsonl');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      this.inviteCodes = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('解析邀请码数据失败:', line, e);
          return null;
        }
      }).filter(item => item !== null);
      
      console.log('邀请码数据加载成功:', this.inviteCodes.length, '个邀请码');
    } catch (error) {
      console.error('加载邀请码数据失败:', error);
      this.inviteCodes = [];
    }
  }

  /**
   * 验证邀请码
   * @param {string} inviteCode - 用户输入的邀请码
   * @returns {Object|null} 如果验证成功返回邀请码对象，否则返回null
   */
  validateInviteCode(inviteCode) {
    if (!inviteCode || !inviteCode.trim()) {
      return null;
    }
    
    const trimmedCode = inviteCode.trim();
    
    return this.inviteCodes.find(item => item.inviteCode === trimmedCode) || null;
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
    
    // 邀请码输入框事件监听
    const inviteCodeInput = document.getElementById('inviteCodeInput');
    if (inviteCodeInput) {
      // 输入时清除错误提示
      inviteCodeInput.addEventListener('input', () => {
        this.clearInviteCodeError();
      });
      
      // 回车键确认
      inviteCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
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
    // 获取邀请码输入框的值
    const inviteCodeInput = document.getElementById('inviteCodeInput');
    if (!inviteCodeInput) {
      console.error('找不到邀请码输入框');
      return;
    }
    
    const inviteCode = inviteCodeInput.value;
    const validatedCode = this.validateInviteCode(inviteCode);
    
    if (!validatedCode) {
      // 邀请码验证失败，显示错误提示
      this.showInviteCodeError('邀请码错误，请检查后重新输入');
      return;
    }
    
    console.log('邀请码验证成功:', validatedCode);
    
    // 清除可能存在的错误提示
    this.clearInviteCodeError();
    
    // 隐藏答题须知页面
    this.hide();
    
    // 显示主要内容
    this.showMainContent();
    
    // 执行回调函数，传递验证成功的邀请码信息
    if (this.onConfirmCallback && typeof this.onConfirmCallback === 'function') {
      this.onConfirmCallback(validatedCode);
    }
  }

  /**
   * 显示邀请码错误提示
   * @param {string} message - 错误消息
   */
  showInviteCodeError(message) {
    // 清除之前的错误提示
    this.clearInviteCodeError();
    
    const inviteCodeSection = document.querySelector('.invite-code-section');
    if (!inviteCodeSection) {
      console.error('找不到邀请码区域');
      return;
    }
    
    // 创建错误提示元素
    const errorElement = document.createElement('div');
    errorElement.className = 'invite-code-error';
    errorElement.textContent = message;
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '14px';
    errorElement.style.marginTop = '5px';
    
    // 添加到邀请码区域
    inviteCodeSection.appendChild(errorElement);
    
    // 给输入框添加错误样式
    const inviteCodeInput = document.getElementById('inviteCodeInput');
    if (inviteCodeInput) {
      inviteCodeInput.style.borderColor = '#dc3545';
      inviteCodeInput.focus();
    }
  }

  /**
   * 清除邀请码错误提示
   */
  clearInviteCodeError() {
    // 移除错误提示元素
    const errorElement = document.querySelector('.invite-code-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    // 恢复输入框样式
    const inviteCodeInput = document.getElementById('inviteCodeInput');
    if (inviteCodeInput) {
      inviteCodeInput.style.borderColor = '';
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