/**
 * 学习分析报告主控制器
 * 负责数据加载和页面初始化
 */

class StudentReportController {
  constructor() {
    this.reportData = null;
    this.progressChart = null;
    this.dataLoader = new DataLoader();
    this.renderer = new ReportRenderer();
  }

  /**
   * 初始化报告页面
   */
  async init() {
    try {
      await this.loadData();
      this.renderReport();
    } catch (error) {
      console.error('初始化报告时出错:', error);
      this.showErrorMessage('页面初始化失败，请刷新页面重试');
    }
  }

  /**
   * 加载报告数据
   */
  async loadData() {
    this.reportData = await this.dataLoader.loadReportData();
  }

  /**
   * 渲染整个报告
   */
  renderReport() {
    if (!this.reportData) return;
    
    this.renderer.setData(this.reportData);
    this.renderer.renderOverview();
    this.renderer.renderKnowledgePoints();
    this.renderer.renderProgressChart();
    this.renderer.renderRecommendations();
    this.renderer.renderAchievements();
  }

  /**
   * 显示错误信息
   */
  showErrorMessage(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger text-center';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${message}
    `;
    container.insertBefore(errorDiv, container.firstChild);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  const controller = new StudentReportController();
  controller.init();
});