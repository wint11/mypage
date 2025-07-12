import { Config } from './Config.js';
import { RandomUtils } from './RandomUtils.js';

/**
 * 任务二题目筛选器
 * 负责task2数据的筛选、生成和管理
 */
export class Task2Filter {
  constructor() {
    this.config = new Config();
    this.filteredQuestions = [];
    this.currentFilter = 'all';
    this.currentSeed = null;
    this.baseQuestions = null; // 基础题库
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
      // 任务二的筛选逻辑：3步对应fold_1，4步对应fold_2，5步(其它)对应other
      let targetFoldType;
      if (filterType === '3') {
        targetFoldType = 'fold_1';
      } else if (filterType === '4') {
        targetFoldType = 'fold_2';
      } else if (filterType === '5') {
        targetFoldType = 'other';
      } else {
        // 兼容旧的数字筛选
        const steps = parseInt(filterType);
        this.filteredQuestions = this.baseQuestions.filter(q => 
          this.extractStepsFromPath(q.image_path) === steps
        );
        console.log(`任务二筛选结果: ${this.filteredQuestions.length} 题 (${filterType})`);
        this.saveQuestionsToStorage();
        return this.filteredQuestions;
      }
      
      this.filteredQuestions = this.baseQuestions.filter(q => 
        this.extractFoldTypeFromPath(q.image_path) === targetFoldType
      );
    }
    
    console.log(`任务二筛选结果: ${this.filteredQuestions.length} 题 (${filterType})`);
    
    // 保存到本地存储
    this.saveQuestionsToStorage();
    
    return this.filteredQuestions;
  }

  /**
   * 从路径中提取步数（task2数据格式）
   */
  extractStepsFromPath(imagePath) {
    // task2的文件路径格式：fold_1/circle_036.png、fold_2/circle_036.png 或 other/circle_036.png
    if (imagePath.includes('fold_1/')) {
      return 1; // 1步折叠
    } else if (imagePath.includes('fold_2/')) {
      return 2; // 2步折叠
    } else if (imagePath.includes('other/')) {
      return 3; // other类型，视为3步
    }
    return 1; // 默认1步
  }

  /**
   * 从路径中提取fold类型（任务二新筛选逻辑）
   */
  extractFoldTypeFromPath(imagePath) {
    // task2的文件路径格式：fold_1/circle_036.png、fold_2/circle_036.png 或 other/circle_036.png
    if (imagePath.includes('fold_1/')) {
      return 'fold_1';
    } else if (imagePath.includes('fold_2/')) {
      return 'fold_2';
    } else if (imagePath.includes('other/')) {
      return 'other';
    }
    // 兼容新的task2数据格式（基于steps字段）
    if (imagePath.includes('circle-id_') && imagePath.includes('-fold_1-')) {
      return 'fold_1';
    } else if (imagePath.includes('circle-id_') && imagePath.includes('-fold_2-')) {
      return 'fold_2';
    }
    return 'fold_1'; // 默认fold_1
  }

  /**
   * 生成基础题库（根据task2数据特点）
   */
  generateBaseQuestions(allQuestions) {
    console.log('生成任务二基础题库');
    
    // 按fold类型分组
    const fold1Questions = allQuestions.filter(q => this.extractFoldTypeFromPath(q.image_path) === 'fold_1');
    const fold2Questions = allQuestions.filter(q => this.extractFoldTypeFromPath(q.image_path) === 'fold_2');
    const otherQuestions = allQuestions.filter(q => this.extractFoldTypeFromPath(q.image_path) === 'other');
    
    console.log(`任务二 - fold_1题目数量: ${fold1Questions.length}`);
    console.log(`任务二 - fold_2题目数量: ${fold2Questions.length}`);
    console.log(`任务二 - other类型题目数量: ${otherQuestions.length}`);
    
    // 从每种fold类型中选择题目，确保形状平衡
    const selectedFold1 = this.selectQuestionsWithShapeBalance(fold1Questions, Math.min(10, fold1Questions.length));
    const selectedFold2 = this.selectQuestionsWithShapeBalance(fold2Questions, Math.min(10, fold2Questions.length));
    const selectedOther = this.selectQuestionsWithShapeBalance(otherQuestions, Math.min(10, otherQuestions.length));
    
    const baseQuestions = [...selectedFold1, ...selectedFold2, ...selectedOther];
    
    console.log(`任务二基础题库生成完成: ${baseQuestions.length} 题`);
    console.log(`fold_1: ${selectedFold1.length} 题, fold_2: ${selectedFold2.length} 题, other: ${selectedOther.length} 题`);
    
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
   * 从路径中提取形状（task2数据格式）
   */
  extractShapeFromPath(imagePath) {
    // task2文件名格式：fold_1/circle_036.png -> circle
    const fileName = imagePath.split('/').pop() || '';
    if (fileName.startsWith('circle_')) {
      return 'circle';
    } else if (fileName.startsWith('Hexagon_')) {
      return 'Hexagon';
    } else if (fileName.startsWith('House_')) {
      return 'House';
    } else if (fileName.startsWith('Rectangle_')) {
      return 'Rectangle';
    } else if (fileName.startsWith('square_')) {
      return 'square';
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
      console.log('从本地存储加载任务二题目');
      this.filteredQuestions = stored.questions;
      this.baseQuestions = stored.baseQuestions;
      this.currentSeed = stored.seed;
      this.currentFilter = stored.filter || 'all';
      return this.filteredQuestions;
    } else {
      console.log('重新生成任务二题目');
      return this.regenerateQuestions(allQuestions);
    }
  }

  /**
   * 重新生成题目
   */
  regenerateQuestions(allQuestions, filterType = 'all') {
    console.log('重新生成任务二题目');
    
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
      localStorage.setItem('paperfolding_questions_task2', JSON.stringify(data));
      console.log('任务二题目已保存到本地存储');
    } catch (error) {
      console.error('保存任务二题目到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载题目
   */
  loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('paperfolding_questions_task2');
      if (stored) {
        const data = JSON.parse(stored);
        
        // 检查数据是否过期（24小时）
        const now = Date.now();
        const age = now - (data.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
          console.log('存储的任务二题目已过期，将重新生成');
          this.clearStoredQuestions();
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载任务二题目失败:', error);
      this.clearStoredQuestions();
    }
    return null;
  }

  /**
   * 清除存储的题目
   */
  clearStoredQuestions() {
    try {
      localStorage.removeItem('paperfolding_questions_task2');
      console.log('已清除存储的任务二题目');
    } catch (error) {
      console.error('清除存储的任务二题目失败:', error);
    }
  }

  /**
   * 更新筛选信息显示
   */
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      let filterText;
      if (this.currentFilter === 'all') {
        filterText = '全部题目';
      } else if (this.currentFilter === '3') {
        filterText = '3步折叠';
      } else if (this.currentFilter === '4') {
        filterText = '4步折叠';
      } else if (this.currentFilter === '5') {
        filterText = '其它折叠';
      } else {
        filterText = `${this.currentFilter}步折叠`;
      }
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
    statusDiv.innerHTML = '<i class="bi bi-arrow-clockwise"></i>任务二题目已重新生成！';
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