/**
 * 导航管理器
 * 负责题目导航
 */
export class NavigationManager {
  constructor() {
    this.currentIndex = 0;
    this.totalQuestions = 0;
  }

  setTotal(total) {
    this.totalQuestions = total;
    // 重置索引或保持在合法范围内
    if (this.currentIndex >= total) {
      this.currentIndex = Math.max(0, total - 1);
    }
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  next() {
    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  jump(index) {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }
}