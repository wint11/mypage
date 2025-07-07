import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 任务一题目筛选器
 * 负责题目的筛选、生成和管理
 */
export class Task1Filter {
  constructor() {
    this.config = new Config();
    this.filteredQuestions = [];
    this.currentFilter = 'all';
    this.currentSeed = null;
    this.baseQuestions = null; // 基础30题题库
  }

  /**
   * 应用筛选
   */
  applyFilter(allQuestions, filterType = 'all') {
    this.currentFilter = filterType;
    
    // 如果没有基础题库，先生成
    if (!this.baseQuestions) {
      this.baseQuestions = this.generateBaseQuestions(allQuestions);
    }
    
    // 根据筛选类型过滤题目
    if (filterType === 'all') {
      this.filteredQuestions = [...this.baseQuestions];
    } else {
      const steps = parseInt(filterType);
      this.filteredQuestions = this.baseQuestions.filter(q => 
        this.extractStepsFromPath(q.image_path) === steps
      );
    }
    
    console.log(`筛选结果: ${this.filteredQuestions.length} 题 (${filterType})`);
    
    // 保存到本地存储
    this.saveQuestionsToStorage();
    
    return this.filteredQuestions;
  }

  /**
   * 从路径中提取步数
   */
  extractStepsFromPath(imagePath) {
    // 从文件名中提取步数，如 circle_3_001.png -> 3
    const fileName = imagePath.split('/').pop() || '';
    const match = fileName.match(/_([345])_/);
    if (match) {
      return parseInt(match[1]);
    }
    return 3; // 默认3步
  }

  /**
   * 生成基础30题题库（3步、4步、5步各10题）
   */
  generateBaseQuestions(allQuestions) {
    console.log('生成基础30题题库');
    
    // 按步数分组
    const step3Questions = allQuestions.filter(q => this.extractStepsFromPath(q.image_path) === 3);
    const step4Questions = allQuestions.filter(q => this.extractStepsFromPath(q.image_path) === 4);
    const step5Questions = allQuestions.filter(q => this.extractStepsFromPath(q.image_path) === 5);
    
    console.log(`3步题目数量: ${step3Questions.length}`);
    console.log(`4步题目数量: ${step4Questions.length}`);
    console.log(`5步题目数量: ${step5Questions.length}`);
    
    // 从每种步数中选择10题，确保形状平衡
    const selected3 = this.selectQuestionsWithShapeBalance(step3Questions, 10);
    const selected4 = this.selectQuestionsWithShapeBalance(step4Questions, 10);
    const selected5 = this.selectQuestionsWithShapeBalance(step5Questions, 10);
    
    const baseQuestions = [...selected3, ...selected4, ...selected5];
    
    console.log(`基础题库生成完成: ${baseQuestions.length} 题`);
    console.log(`3步: ${selected3.length} 题, 4步: ${selected4.length} 题, 5步: ${selected5.length} 题`);
    
    return baseQuestions;
  }

  /**
   * 选择题目时确保形状平衡
   */
  selectQuestionsWithShapeBalance(questions, targetCount) {
    if (questions.length === 0) return [];
    if (questions.length <= targetCount) return [...questions];
    
    // 按形状分组
    const shapeGroups = {};
    questions.forEach(q => {
      const shape = this.extractShapeFromPath(q.image_path);
      if (!shapeGroups[shape]) {
        shapeGroups[shape] = [];
      }
      shapeGroups[shape].push(q);
    });
    
    const shapes = Object.keys(shapeGroups);
    const result = [];
    
    // 计算每个形状应该选择的题目数量
    const baseCount = Math.floor(targetCount / shapes.length);
    const remainder = targetCount % shapes.length;
    
    shapes.forEach((shape, index) => {
      const shapeQuestions = shapeGroups[shape];
      let count = baseCount;
      
      // 将余数分配给前几个形状
      if (index < remainder) {
        count += 1;
      }
      
      // 随机选择指定数量的题目
      const shuffled = RandomUtils.shuffleArrayWithSeed([...shapeQuestions], this.currentSeed + index);
      const selected = shuffled.slice(0, Math.min(count, shapeQuestions.length));
      result.push(...selected);
    });
    
    return result;
  }

  /**
   * 确保不同形状的代表性（保留原方法以兼容）
   */
  ensureShapeRepresentation(questions) {
    return this.selectQuestionsWithShapeBalance(questions, questions.length);
  }

  /**
   * 从路径中提取形状
   */
  extractShapeFromPath(imagePath) {
    // 从文件名中提取形状，如 circle_001.png -> circle
    const fileName = imagePath.split('/').pop() || '';
    const match = fileName.match(/^([a-zA-Z]+)_/);
    if (match) {
      return match[1];
    }
    return 'unknown';
  }

  /**
   * 初始化筛选器
   */
  initializeFilter(allQuestions) {
    // 尝试从本地存储加载
    const stored = this.loadQuestionsFromStorage();
    
    if (stored && stored.questions && stored.questions.length > 0 && stored.seed && stored.baseQuestions) {
      console.log('从本地存储加载题目');
      this.filteredQuestions = stored.questions;
      this.baseQuestions = stored.baseQuestions;
      this.currentSeed = stored.seed;
      this.currentFilter = stored.filter || 'all';
      return this.filteredQuestions;
    } else {
      console.log('重新生成题目');
      return this.regenerateQuestions(allQuestions);
    }
  }

  /**
   * 重新生成题目
   */
  regenerateQuestions(allQuestions, filterType = 'all') {
    console.log('重新生成题目');
    
    // 清除存储的数据
    this.clearStoredQuestions();
    
    // 清除基础题库，强制重新生成
    this.baseQuestions = null;
    
    // 生成新的种子
    this.currentSeed = RandomUtils.generateRandomSeed();
    
    // 应用筛选
    return this.applyFilter(allQuestions, filterType);
  }

  /**
   * 保存题目到本地存储
   */
  saveQuestionsToStorage() {
    const data = {
      questions: this.filteredQuestions,
      baseQuestions: this.baseQuestions,
      seed: this.currentSeed,
      filter: this.currentFilter,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.config.getStorageKey('questions'), JSON.stringify(data));
      console.log('题目已保存到本地存储');
    } catch (error) {
      console.error('保存题目到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载题目
   */
  loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem(this.config.getStorageKey('questions'));
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
          console.log('存储的题目已过期，将重新生成');
          this.clearStoredQuestions();
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载题目失败:', error);
      this.clearStoredQuestions();
    }
    return null;
  }

  /**
   * 清除存储的题目
   */
  clearStoredQuestions() {
    try {
      localStorage.removeItem(this.config.getStorageKey('questions'));
      console.log('已清除存储的题目');
    } catch (error) {
      console.error('清除存储的题目失败:', error);
    }
  }

  /**
   * 更新筛选信息显示
   */
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      const filterText = this.currentFilter === 'all' ? '全部题目' : `${this.currentFilter}步折叠`;
      filterInfo.textContent = `当前筛选: ${filterText} (${this.filteredQuestions.length}题)`;
    }
  }

  /**
   * 更新跳转输入框的最大值
   */
  updateJumpInputMax() {
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
      jumpInput.max = this.filteredQuestions.length;
      jumpInput.placeholder = `1-${this.filteredQuestions.length}`;
    }
  }

  /**
   * 显示重新生成成功提示
   */
  showRegenerateSuccess() {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    statusDiv.innerHTML = '<i class="bi bi-arrow-clockwise"></i>题目已重新生成！';
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  // Getters
  getFilteredQuestions() {
    return this.filteredQuestions;
  }

  getCurrentFilter() {
    return this.currentFilter;
  }

  getCurrentSeed() {
    return this.currentSeed;
  }
}