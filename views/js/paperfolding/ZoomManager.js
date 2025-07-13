/**
 * 缩放管理器
 * 负责题目区域的缩放功能
 */
export class ZoomManager {
  constructor() {
    this.currentZoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
    this.zoomStep = 0.1;
  }

  /**
   * 放大
   */
  zoomIn() {
    if (this.currentZoom < this.maxZoom) {
      this.currentZoom = Math.min(this.maxZoom, this.currentZoom + this.zoomStep);
      this.applyZoom();
      this.updateZoomButtons();
      return true;
    }
    return false;
  }

  /**
   * 缩小
   */
  zoomOut() {
    if (this.currentZoom > this.minZoom) {
      this.currentZoom = Math.max(this.minZoom, this.currentZoom - this.zoomStep);
      this.applyZoom();
      this.updateZoomButtons();
      return true;
    }
    return false;
  }

  /**
   * 重置缩放
   */
  resetZoom() {
    this.currentZoom = 1.0;
    this.applyZoom();
    this.updateZoomButtons();
  }

  /**
   * 应用缩放
   */
  applyZoom() {
    // 缩放题干图片
    const stemImages = document.querySelectorAll('#stemImages img');
    stemImages.forEach(img => {
      img.style.transform = `scale(${this.currentZoom})`;
      img.style.transformOrigin = 'center';
    });
    
    // 缩放选项图片
    const optionImages = document.querySelectorAll('.option img');
    optionImages.forEach(img => {
      img.style.transform = `scale(${this.currentZoom})`;
      img.style.transformOrigin = 'center';
    });
  }

  /**
   * 更新缩放按钮状态
   */
  updateZoomButtons() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const zoomDisplay = document.getElementById('zoomDisplay');
    
    if (zoomInBtn) {
      zoomInBtn.disabled = this.currentZoom >= this.maxZoom;
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.disabled = this.currentZoom <= this.minZoom;
    }
    
    if (zoomResetBtn) {
      zoomResetBtn.disabled = this.currentZoom === 1.0;
    }
    
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }
  }

  /**
   * 设置缩放事件监听器
   */
  setupZoomEventListeners() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoomIn();
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoomOut();
      });
    }
    
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.resetZoom();
      });
    }
    
    // 鼠标滚轮缩放
    const questionContent = document.querySelector('.question-content');
    if (questionContent) {
      questionContent.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          if (e.deltaY < 0) {
            this.zoomIn();
          } else {
            this.zoomOut();
          }
        }
      });
    }
  }

  /**
   * 获取当前缩放比例
   */
  getCurrentZoom() {
    return this.currentZoom;
  }

  /**
   * 设置缩放比例
   */
  setZoom(zoom) {
    if (zoom >= this.minZoom && zoom <= this.maxZoom) {
      this.currentZoom = zoom;
      this.applyZoom();
      this.updateZoomButtons();
      return true;
    }
    return false;
  }

  /**
   * 获取缩放范围
   */
  getZoomRange() {
    return {
      min: this.minZoom,
      max: this.maxZoom,
      step: this.zoomStep
    };
  }

  /**
   * 设置缩放范围
   */
  setZoomRange(min, max, step = 0.1) {
    this.minZoom = min;
    this.maxZoom = max;
    this.zoomStep = step;
    
    // 确保当前缩放在新范围内
    if (this.currentZoom < this.minZoom) {
      this.currentZoom = this.minZoom;
      this.applyZoom();
    } else if (this.currentZoom > this.maxZoom) {
      this.currentZoom = this.maxZoom;
      this.applyZoom();
    }
    
    this.updateZoomButtons();
  }

  /**
   * 初始化缩放功能
   */
  initialize() {
    this.setupZoomEventListeners();
    this.updateZoomButtons();
    this.applyZoom();
  }
}