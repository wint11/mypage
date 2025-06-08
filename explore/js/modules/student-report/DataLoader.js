/**
 * 学习分析报告 - 数据加载器模块
 * 负责从JSON文件或API加载学习报告数据
 */

class DataLoader {
  constructor() {
    this.dataUrl = '../data/student-report-data.json';
  }

  /**
   * 加载学习报告数据
   * @returns {Promise<Object>} 报告数据对象
   */
  async loadReportData() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }
      const data = await response.json();
      return this.validateData(data);
    } catch (error) {
      console.error('加载数据时出错:', error);
      throw new Error('数据加载失败，请检查网络连接或稍后重试');
    }
  }

  /**
   * 验证数据格式
   * @param {Object} data 原始数据
   * @returns {Object} 验证后的数据
   */
  validateData(data) {
    const requiredFields = ['overview', 'knowledgePoints', 'progressTrend', 'recommendations', 'achievements'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`数据格式错误: 缺少必需字段 ${field}`);
      }
    }

    // 验证overview字段
    const overviewFields = ['totalMastery', 'completedExercises', 'studyDays', 'averageScore'];
    for (const field of overviewFields) {
      if (data.overview[field] === undefined) {
        throw new Error(`数据格式错误: overview缺少字段 ${field}`);
      }
    }

    // 验证数组字段
    if (!Array.isArray(data.knowledgePoints) || data.knowledgePoints.length === 0) {
      throw new Error('数据格式错误: knowledgePoints必须是非空数组');
    }

    if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
      throw new Error('数据格式错误: recommendations必须是非空数组');
    }

    if (!Array.isArray(data.achievements) || data.achievements.length === 0) {
      throw new Error('数据格式错误: achievements必须是非空数组');
    }

    return data;
  }

  /**
   * 设置数据源URL
   * @param {string} url 新的数据源URL
   */
  setDataUrl(url) {
    this.dataUrl = url;
  }
}