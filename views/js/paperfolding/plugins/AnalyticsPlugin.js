/**
 * 数据分析插件 - 提供详细的答题数据分析功能
 * 这是一个示例插件，展示如何扩展系统功能
 */

export default class AnalyticsPlugin {
  constructor(options = {}) {
    this.options = {
      enableRealTimeAnalysis: true,
      trackUserBehavior: true,
      generateReports: true,
      ...options
    };
    
    this.analytics = {
      sessionStart: null,
      questionViews: new Map(),
      answerChanges: [],
      filterUsage: new Map(),
      navigationPatterns: [],
      performanceMetrics: {
        averageResponseTime: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        timeSpentPerQuestion: new Map()
      }
    };
    
    this.currentQuestionStartTime = null;
  }

  /**
   * 插件初始化
   */
  async init() {
    console.log('📊 数据分析插件初始化');
    
    this.analytics.sessionStart = new Date();
    
    // 注册事件监听器
    this.registerEventListeners();
    
    // 创建分析面板
    if (this.options.enableRealTimeAnalysis) {
      this.createAnalyticsPanel();
    }
    
    // 开始性能监控
    this.startPerformanceMonitoring();
  }

  /**
   * 注册事件监听器
   */
  registerEventListeners() {
    const { extensibilityManager, EVENT_HOOKS } = window.PaperFoldingExtensibility || {};
    
    if (!extensibilityManager) {
      console.warn('扩展性管理器未找到，分析插件功能受限');
      return;
    }

    // 监听初始化事件
    extensibilityManager.addEventListener(EVENT_HOOKS.afterInit, (data) => {
      this.onTestInit(data);
    });

    // 监听题目显示事件
    extensibilityManager.addEventListener(EVENT_HOOKS.beforeQuestionDisplay, (data) => {
      this.onQuestionDisplay(data);
    });

    // 监听答案选择事件
    extensibilityManager.addEventListener(EVENT_HOOKS.beforeAnswerSelect, (data) => {
      this.onBeforeAnswerSelect(data);
    });

    extensibilityManager.addEventListener(EVENT_HOOKS.afterAnswerSelect, (data) => {
      this.onAfterAnswerSelect(data);
    });

    // 监听筛选事件
    extensibilityManager.addEventListener(EVENT_HOOKS.afterFilterApply, (data) => {
      this.onFilterApply(data);
    });

    // 监听提交事件
    extensibilityManager.addEventListener(EVENT_HOOKS.beforeSubmit, (data) => {
      this.onTestSubmit(data);
    });
  }

  /**
   * 测试初始化事件处理
   */
  onTestInit(data) {
    console.log('📊 分析：测试初始化', data);
    
    this.analytics.performanceMetrics.totalQuestions = data.initState.questionCount;
    this.updateAnalyticsDisplay();
  }

  /**
   * 题目显示事件处理
   */
  onQuestionDisplay(data) {
    const questionId = data.question?.id;
    if (!questionId) return;

    // 记录题目查看次数
    const viewCount = this.analytics.questionViews.get(questionId) || 0;
    this.analytics.questionViews.set(questionId, viewCount + 1);

    // 记录导航模式
    this.analytics.navigationPatterns.push({
      questionId,
      timestamp: new Date(),
      index: data.questionIndex
    });

    // 开始计时
    this.currentQuestionStartTime = performance.now();

    this.updateAnalyticsDisplay();
  }

  /**
   * 答案选择前事件处理
   */
  onBeforeAnswerSelect(data) {
    // 记录答案变更
    if (data.previousAnswer !== undefined) {
      this.analytics.answerChanges.push({
        questionId: data.questionId,
        from: data.previousAnswer,
        to: data.optionValue,
        timestamp: new Date()
      });
    }
  }

  /**
   * 答案选择后事件处理
   */
  onAfterAnswerSelect(data) {
    // 计算响应时间
    if (this.currentQuestionStartTime) {
      const responseTime = performance.now() - this.currentQuestionStartTime;
      this.analytics.performanceMetrics.timeSpentPerQuestion.set(
        data.questionId, 
        responseTime
      );
      
      // 更新平均响应时间
      this.updateAverageResponseTime();
    }

    this.updateAnalyticsDisplay();
  }

  /**
   * 筛选应用事件处理
   */
  onFilterApply(data) {
    const filterCount = this.analytics.filterUsage.get(data.filterType) || 0;
    this.analytics.filterUsage.set(data.filterType, filterCount + 1);
    
    console.log(`📊 分析：筛选器使用 - ${data.filterType}，题目数量：${data.beforeCount} → ${data.afterCount}`);
    
    this.updateAnalyticsDisplay();
  }

  /**
   * 测试提交事件处理
   */
  onTestSubmit(data) {
    console.log('📊 分析：测试提交', this.generateReport());
    
    if (this.options.generateReports) {
      this.downloadReport();
    }
  }

  /**
   * 更新平均响应时间
   */
  updateAverageResponseTime() {
    const times = Array.from(this.analytics.performanceMetrics.timeSpentPerQuestion.values());
    if (times.length > 0) {
      this.analytics.performanceMetrics.averageResponseTime = 
        times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  }

  /**
   * 创建分析面板
   */
  createAnalyticsPanel() {
    const panel = document.createElement('div');
    panel.id = 'analytics-panel';
    panel.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        font-size: 12px;
        max-height: 400px;
        overflow-y: auto;
      ">
        <h4 style="margin: 0 0 10px 0; color: #333;">📊 实时分析</h4>
        <div id="analytics-content">
          <p>正在收集数据...</p>
        </div>
        <button id="toggle-analytics" style="
          margin-top: 10px;
          padding: 5px 10px;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">隐藏面板</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 添加切换功能
    document.getElementById('toggle-analytics').addEventListener('click', () => {
      const content = document.getElementById('analytics-content');
      const button = document.getElementById('toggle-analytics');
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '隐藏面板';
      } else {
        content.style.display = 'none';
        button.textContent = '显示面板';
      }
    });
  }

  /**
   * 更新分析显示
   */
  updateAnalyticsDisplay() {
    const content = document.getElementById('analytics-content');
    if (!content) return;

    const sessionDuration = new Date() - this.analytics.sessionStart;
    const answeredQuestions = this.analytics.performanceMetrics.timeSpentPerQuestion.size;
    const averageTime = Math.round(this.analytics.performanceMetrics.averageResponseTime / 1000);
    
    content.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>会话时长：</strong> ${Math.round(sessionDuration / 1000)}秒
      </div>
      <div style="margin-bottom: 8px;">
        <strong>已答题目：</strong> ${answeredQuestions}/${this.analytics.performanceMetrics.totalQuestions}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>平均响应时间：</strong> ${averageTime}秒
      </div>
      <div style="margin-bottom: 8px;">
        <strong>题目查看次数：</strong> ${this.analytics.questionViews.size}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>答案修改次数：</strong> ${this.analytics.answerChanges.length}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>筛选器使用：</strong>
        <ul style="margin: 5px 0; padding-left: 15px;">
          ${Array.from(this.analytics.filterUsage.entries())
            .map(([filter, count]) => `<li>${filter}: ${count}次</li>`)
            .join('')}
        </ul>
      </div>
    `;
  }

  /**
   * 生成分析报告
   */
  generateReport() {
    const sessionDuration = new Date() - this.analytics.sessionStart;
    
    return {
      sessionInfo: {
        startTime: this.analytics.sessionStart,
        duration: sessionDuration,
        endTime: new Date()
      },
      performance: {
        totalQuestions: this.analytics.performanceMetrics.totalQuestions,
        answeredQuestions: this.analytics.performanceMetrics.timeSpentPerQuestion.size,
        averageResponseTime: this.analytics.performanceMetrics.averageResponseTime,
        completionRate: (this.analytics.performanceMetrics.timeSpentPerQuestion.size / this.analytics.performanceMetrics.totalQuestions * 100).toFixed(2) + '%'
      },
      behavior: {
        questionViews: Object.fromEntries(this.analytics.questionViews),
        answerChanges: this.analytics.answerChanges,
        filterUsage: Object.fromEntries(this.analytics.filterUsage),
        navigationPatterns: this.analytics.navigationPatterns
      },
      insights: this.generateInsights()
    };
  }

  /**
   * 生成洞察分析
   */
  generateInsights() {
    const insights = [];
    
    // 分析响应时间
    const avgTime = this.analytics.performanceMetrics.averageResponseTime / 1000;
    if (avgTime > 30) {
      insights.push('用户平均响应时间较长，可能需要简化题目或提供更多帮助');
    } else if (avgTime < 5) {
      insights.push('用户响应很快，可能需要增加题目难度');
    }
    
    // 分析答案修改
    if (this.analytics.answerChanges.length > 5) {
      insights.push('用户频繁修改答案，可能对题目理解存在困难');
    }
    
    // 分析题目查看模式
    const multipleViews = Array.from(this.analytics.questionViews.values())
      .filter(count => count > 1).length;
    if (multipleViews > 3) {
      insights.push('用户经常重复查看题目，建议优化题目表述');
    }
    
    return insights;
  }

  /**
   * 下载分析报告
   */
  downloadReport() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper-folding-analytics-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 分析报告已下载');
  }

  /**
   * 开始性能监控
   */
  startPerformanceMonitoring() {
    // 监控内存使用
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('📊 内存使用率过高，建议优化');
        }
      }, 30000); // 每30秒检查一次
    }
    
    // 监控页面性能
    window.addEventListener('beforeunload', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log('📊 页面性能指标:', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      });
    });
  }

  /**
   * 获取实时统计数据
   */
  getRealTimeStats() {
    return {
      sessionDuration: new Date() - this.analytics.sessionStart,
      answeredQuestions: this.analytics.performanceMetrics.timeSpentPerQuestion.size,
      totalQuestions: this.analytics.performanceMetrics.totalQuestions,
      averageResponseTime: this.analytics.performanceMetrics.averageResponseTime,
      answerChanges: this.analytics.answerChanges.length,
      filterUsage: Object.fromEntries(this.analytics.filterUsage)
    };
  }

  /**
   * 清理插件资源
   */
  destroy() {
    const panel = document.getElementById('analytics-panel');
    if (panel) {
      panel.remove();
    }
    
    console.log('📊 数据分析插件已清理');
  }
}