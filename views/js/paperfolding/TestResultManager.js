/**
 * 测试结果管理器
 * 负责测试结果的计算、显示和导出
 */
export class TestResultManager {
  constructor() {
    this.testResults = null;
  }

  /**
   * 提交测试
   */
  submitTest(userAnswers, filteredQuestions, startTime, currentTask, currentVersion) {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = filteredQuestions.length;
    
    // 强制要求30题全部完成才能提交
    if (answeredCount < totalQuestions) {
      const unansweredCount = totalQuestions - answeredCount;
      alert(
        `测试要求必须完成全部 ${totalQuestions} 题才可以提交！\n\n` +
        `您还有 ${unansweredCount} 题未作答，请完成所有题目后再提交。`
      );
      return false;
    }
    
    // 计算测试结果
    this.testResults = this.calculateResults(
      userAnswers, 
      filteredQuestions, 
      startTime, 
      currentTask, 
      currentVersion
    );
    
    // 显示结果
    this.displayResults();
    
    return true;
  }

  /**
   * 计算测试结果
   */
  calculateResults(userAnswers, filteredQuestions, startTime, currentTask, currentVersion) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalQuestions = filteredQuestions.length;
    const answeredCount = Object.keys(userAnswers).length;
    
    // 计算正确答案数和详细结果
    let correctCount = 0;
    const detailedResults = [];
    
    filteredQuestions.forEach((question, index) => {
      // 用户答案按题目ID存储，不是按索引
      const questionId = question.id || `q_${index + 1}`;
      const userAnswer = userAnswers[questionId] || userAnswers[index]; // 兼容两种存储方式
      const correctAnswer = question.correct_answer || question.answer; // 支持两种答案字段名
      const isCorrect = correctAnswer && userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      detailedResults.push({
        questionIndex: index + 1,
        questionId: questionId,
        questionDescription: question.image_path || question.image || '无描述',
        userAnswer: userAnswer || '未作答',
        correctAnswer: correctAnswer || '无标准答案',
        isCorrect: isCorrect,
        isAnswered: !!userAnswer,
        result: isCorrect ? '正确' : '错误'
      });
    });
    
    // 计算准确率（只计算有标准答案的题目）
    const questionsWithAnswers = filteredQuestions.filter(q => q.correct_answer || q.answer);
    console.log('准确率计算调试:', {
      questionsWithAnswers: questionsWithAnswers.length,
      correctCount,
      filteredQuestions: filteredQuestions.length,
      sampleQuestion: filteredQuestions[0],
      userAnswersKeys: Object.keys(userAnswers),
      sampleUserAnswer: userAnswers[Object.keys(userAnswers)[0]]
    });
    const accuracy = questionsWithAnswers.length > 0 ? (correctCount / questionsWithAnswers.length * 100).toFixed(2) : 0;
    const completionRate = totalQuestions > 0 ? (answeredCount / totalQuestions * 100).toFixed(2) : 0;
    
    return {
      task: currentTask,
      version: currentVersion,
      totalQuestions,
      answeredCount,
      correctCount,
      questionsWithAnswers: questionsWithAnswers.length,
      accuracy: parseFloat(accuracy),
      completionRate: parseFloat(completionRate),
      totalTime,
      averageTimePerQuestion: answeredCount > 0 ? Math.round(totalTime / answeredCount) : 0,
      startTime,
      endTime,
      detailedResults,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 显示测试结果
   */
  displayResults() {
    if (!this.testResults) return;
    
    const { 
      totalQuestions, 
      answeredCount, 
      correctCount, 
      accuracy, 
      completionRate, 
      totalTime, 
      averageTimePerQuestion 
    } = this.testResults;
    
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);
    const avgMinutes = Math.floor(averageTimePerQuestion / 60000);
    const avgSeconds = Math.floor((averageTimePerQuestion % 60000) / 1000);
    
    const resultHTML = `
      <div class="test-results">
        <div class="result-stats">
          <div class="row">
            <div class="col-md-6">
              <div class="stat-item">
                <span class="stat-label">总题数：</span>
                <span class="stat-value">${totalQuestions}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已答题数：</span>
                <span class="stat-value">${answeredCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">完成率：</span>
                <span class="stat-value text-info">${completionRate}%</span>
              </div>
            </div>
            <div class="col-md-6">
              ${correctCount >= 0 && this.testResults.questionsWithAnswers > 0 ? `
              <div class="stat-item">
                <span class="stat-label">正确题数：</span>
                <span class="stat-value">${correctCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">有答案题数：</span>
                <span class="stat-value">${this.testResults.questionsWithAnswers}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">准确率：</span>
                <span class="stat-value text-success">${accuracy}%</span>
              </div>
              ` : '<div class="text-muted">本测试无标准答案</div>'}
              <div class="stat-item">
                <span class="stat-label">总用时：</span>
                <span class="stat-value">${minutes}分${seconds}秒</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均用时：</span>
                <span class="stat-value">${avgMinutes}分${avgSeconds}秒/题</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        .test-results .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .test-results .stat-label {
          font-weight: 500;
          color: #666;
        }
        .test-results .stat-value {
          font-weight: bold;
          color: #333;
        }
      </style>
    `;
    
    // 显示模态框
    const modalBody = document.getElementById('testResultModalBody');
    if (modalBody) {
      modalBody.innerHTML = resultHTML;
      
      // 显示模态框
      const modal = new bootstrap.Modal(document.getElementById('testResultModal'));
      modal.show();
      
      // 绑定按钮事件
      this.setupResultButtons();
    }
  }

  /**
   * 设置结果页面按钮事件
   */
  setupResultButtons() {
    const downloadBtn = document.getElementById('downloadExcelBtn');
    const restartBtn = document.getElementById('restartTestBtn');
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadExcelReport();
      });
    }
    
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (confirm('确定要重新开始测试吗？这将清除所有答案。')) {
          location.reload();
        }
      });
    }
  }

  /**
   * 下载CSV报告
   */
  downloadExcelReport() {
    if (!this.testResults) {
      alert('没有测试结果可以下载');
      return;
    }
    
    try {
      // 生成CSV内容
      const csvContent = this.generateCSVContent();
      
      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `纸折叠测试答题数据_${this.testResults.task}_${timestamp}.csv`;
      
      // 创建下载链接
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      console.log('CSV报告下载成功');
    } catch (error) {
      console.error('下载CSV报告失败:', error);
      alert('下载失败，请检查浏览器是否支持文件下载功能');
    }
  }

  /**
   * 生成CSV内容
   */
  generateCSVContent() {
    const results = this.testResults;
    
    // CSV头部信息
    let csvContent = '\uFEFF'; // BOM for UTF-8
    csvContent += '# 纸折叠测试结果报告\n';
    csvContent += `# 任务: ${results.task}\n`;
    csvContent += `# 测试时间: ${new Date(results.startTime).toLocaleString()} - ${new Date(results.endTime).toLocaleString()}\n`;
    csvContent += `# 总题数: ${results.totalQuestions}\n`;
    csvContent += `# 已答题数: ${results.answeredCount}\n`;
    csvContent += `# 完成率: ${results.completionRate}%\n`;
    csvContent += `# 正确题数: ${results.correctCount}\n`;
    csvContent += `# 有标准答案题数: ${results.questionsWithAnswers}\n`;
    csvContent += `# 准确率: ${results.accuracy}%\n`;
    csvContent += `# 总用时: ${this.formatTime(results.totalTime)}\n`;
    csvContent += `# 平均用时: ${this.formatTime(results.averageTimePerQuestion)}\n`;
    csvContent += '\n';
    
    // CSV表头
    csvContent += '题目编号,题目描述,正确答案,用户答案,答题结果\n';
    
    // CSV数据行
    results.detailedResults.forEach(result => {
      const row = [
        result.questionIndex,
        `"${result.questionDescription}"`, // 用引号包围，防止逗号问题
        result.correctAnswer,
        result.userAnswer,
        result.result
      ];
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  }

  /**
   * 格式化时间
   */
  formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  }

  /**
   * 获取测试结果
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * 清除测试结果
   */
  clearTestResults() {
    this.testResults = null;
  }

  /**
   * 保存测试结果到本地存储
   */
  saveResultsToStorage() {
    if (this.testResults) {
      try {
        localStorage.setItem('paperfolding_test_results', JSON.stringify(this.testResults));
      } catch (error) {
        console.error('保存测试结果失败:', error);
      }
    }
  }

  /**
   * 从本地存储加载测试结果
   */
  loadResultsFromStorage() {
    try {
      const stored = localStorage.getItem('paperfolding_test_results');
      if (stored) {
        this.testResults = JSON.parse(stored);
        return true;
      }
    } catch (error) {
      console.error('加载测试结果失败:', error);
    }
    return false;
  }
}