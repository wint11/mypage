/**
 * 报告渲染器模块
 * 负责将数据渲染到页面上
 */

class ReportRenderer {
  constructor() {
    this.data = null;
    this.progressChart = null;
  }

  /**
   * 设置数据
   * @param {Object} data 报告数据
   */
  setData(data) {
    this.data = data;
  }

  /**
   * 渲染学习概览
   */
  renderOverview() {
    if (!this.data || !this.data.overview) return;

    const overview = this.data.overview;
    
    // 更新数值
    this.updateElement('total-mastery', `${overview.totalMastery}%`);
    this.updateElement('completed-exercises', overview.completedExercises);
    this.updateElement('study-days', overview.studyDays);
    this.updateElement('average-score', overview.averageScore);
  }

  /**
   * 渲染知识点掌握情况
   */
  renderKnowledgePoints() {
    if (!this.data || !this.data.knowledgePoints) return;

    const container = document.getElementById('knowledge-points-container');
    if (!container) return;

    container.innerHTML = '';

    this.data.knowledgePoints.forEach(point => {
      const pointElement = document.createElement('div');
      pointElement.className = 'knowledge-item';
      
      pointElement.innerHTML = `
        <div>
          <strong>${point.name}</strong>
          <div class="text-muted small">${point.status}</div>
        </div>
        <span class="badge ${point.badgeClass} tooltip-custom" data-tooltip="掌握程度: ${point.mastery}%">${point.mastery}%</span>
      `;
      
      container.appendChild(pointElement);
    });
  }

  /**
   * 渲染学习进度图表
   */
  renderProgressChart() {
    if (!this.data || !this.data.progressTrend) return;

    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // 销毁现有图表
    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const trend = this.data.progressTrend;
    
    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{
          label: '学习进度',
          data: trend.data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  /**
   * 渲染学习建议
   */
  renderRecommendations() {
    if (!this.data || !this.data.recommendations) return;

    const container = document.getElementById('recommendations-container');
    if (!container) return;

    container.innerHTML = '';

    this.data.recommendations.forEach(rec => {
      const recElement = document.createElement('div');
      recElement.className = 'recommendation-item';
      
      recElement.innerHTML = `
        <div class="d-flex align-items-start">
          <i class="${rec.icon} me-3 mt-1" style="color: #ff6b6b;"></i>
          <div>
            <h6 class="mb-1">${rec.title}</h6>
            <p class="mb-0 text-muted">${rec.content}</p>
          </div>
        </div>
      `;
      
      container.appendChild(recElement);
    });
  }

  /**
   * 渲染学习成就
   */
  renderAchievements() {
    if (!this.data || !this.data.achievements) return;

    const container = document.getElementById('achievements-container');
    if (!container) return;

    // 创建滚动容器
    container.innerHTML = `
      <div class="achievements-scroll-container">
        <div class="achievements-scroll-track">
          ${this.data.achievements.map(achievement => `
            <div class="achievement-item ${achievement.achieved ? 'achieved' : 'not-achieved'}">
              <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
              </div>
              <div class="achievement-info">
                <h6 class="achievement-title">${achievement.title}</h6>
                <small class="achievement-desc">${achievement.description}</small>
              </div>
              <div class="achievement-status">
                ${achievement.achieved ? 
                  '<span class="badge bg-success"><i class="fas fa-check"></i> 已获得</span>' : 
                  '<span class="badge bg-secondary"><i class="fas fa-lock"></i> 未获得</span>'
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 更新元素内容
   * @param {string} id 元素ID
   * @param {string} content 内容
   */
  updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  /**
   * 根据掌握程度获取徽章样式类
   * @param {number} mastery 掌握程度百分比
   * @returns {string} CSS类名
   */
  getMasteryBadgeClass(mastery) {
    if (mastery >= 90) return 'bg-success';
    if (mastery >= 70) return 'bg-primary';
    if (mastery >= 50) return 'bg-warning';
    return 'bg-danger';
  }
}