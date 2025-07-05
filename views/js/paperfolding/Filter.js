import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 筛选功能模块
 */
export class Filter {
  constructor() {
    this.config = new Config();
    this.filteredQuestions = [];
    this.currentFilter = 'all';
    this.currentSeed = null;
  }

  /**
   * 应用筛选
   */
  applyFilter(allQuestions, filterType, maxQuestions = 30) {
    console.log(`应用筛选: ${filterType}`);
    
    this.currentFilter = filterType;
    let filtered = [];
    
    if (filterType === 'all') {
      filtered = [...allQuestions];
    } else {
      // 按步数筛选
      const stepCount = parseInt(filterType);
      filtered = allQuestions.filter(q => {
        const steps = this.extractStepsFromPath(q.image_path);
        return steps === stepCount;
      });
    }
    
    console.log(`筛选后题目数量: ${filtered.length}`);
    
    // 确保不同形状的代表性
    filtered = this.ensureShapeRepresentation(filtered);
    
    // 使用种子随机打乱
    if (!this.currentSeed) {
      this.currentSeed = RandomUtils.generateRandomSeed();
    }
    filtered = RandomUtils.shuffleArrayWithSeed([...filtered], this.currentSeed);
    
    // 限制题目数量
    if (filtered.length > maxQuestions) {
      filtered = filtered.slice(0, maxQuestions);
    }
    
    this.filteredQuestions = filtered;
    
    // 保存到本地存储
    this.saveQuestionsToStorage();
    
    console.log(`最终题目数量: ${this.filteredQuestions.length}`);
    return this.filteredQuestions;
  }

  /**
   * 从路径中提取步数
   */
  extractStepsFromPath(imagePath) {
    const match = imagePath.match(/(\d+)step/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 确保不同形状的代表性
   */
  ensureShapeRepresentation(questions) {
    const shapeGroups = {};
    
    // 按形状分组
    questions.forEach(q => {
      const shape = this.extractShapeFromPath(q.image_path);
      if (!shapeGroups[shape]) {
        shapeGroups[shape] = [];
      }
      shapeGroups[shape].push(q);
    });
    
    // 从每个形状组中选择题目
    const result = [];
    const shapes = Object.keys(shapeGroups);
    const questionsPerShape = Math.ceil(questions.length / shapes.length);
    
    shapes.forEach(shape => {
      const shapeQuestions = shapeGroups[shape];
      const selected = shapeQuestions.slice(0, Math.min(questionsPerShape, shapeQuestions.length));
      result.push(...selected);
    });
    
    return result;
  }

  /**
   * 从路径中提取形状
   */
  extractShapeFromPath(imagePath) {
    const match = imagePath.match(/\/([^/]+)\//g);
    if (match && match.length >= 2) {
      return match[1].replace(/\//g, '');
    }
    return 'unknown';
  }

  /**
   * 初始化筛选器
   */
  initializeFilter(allQuestions) {
    // 尝试从本地存储加载
    const stored = this.loadQuestionsFromStorage();
    
    if (stored && stored.questions && stored.questions.length > 0 && stored.seed) {
      console.log('从本地存储加载题目');
      this.filteredQuestions = stored.questions;
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