import { Raven3DConfig } from './Config.js';

/**
 * 题目管理器
 * 负责题目数据的加载、切换、筛选和管理
 */
export class QuestionManager {
  constructor(config) {
    this.config = config || new Raven3DConfig();
    this.allQuestions = [];      // 当前任务的所有题目
    this.activeQuestions = [];   // 根据邀请码筛选后的题目
    this.currentTask = 'task1';  // 默认任务
    this.tasks = this.config.tasks;
    this.inviteCode = null;      // 用户输入的邀请码
  }

  /**
   * 设置邀请码
   * @param {string} code 
   */
  setInviteCode(code) {
    this.inviteCode = code;
  }

  /**
   * 切换任务
   * @param {string} taskName - 任务名称 (e.g., 'task1')
   */
  async switchTask(taskName) {
    if (!this.tasks.includes(taskName)) {
      console.error(`Invalid task: ${taskName}`);
      return false;
    }
    
    this.currentTask = taskName;
    console.log(`Switching to ${taskName}...`);
    
    try {
      await this.loadQuestions(taskName);
      return true;
    } catch (error) {
      console.error(`Failed to load questions for ${taskName}:`, error);
      return false;
    }
  }

  /**
   * 加载题目数据
   * 直接根据 ICML 2026 的目录结构生成 250 道题目
   * @param {string} task - 任务名称
   */
  async loadQuestions(task) {
    this.allQuestions = [];
    const taskPath = this.config.getTaskPath(task);
    
    if (!taskPath) {
        console.error(`Task path not found for ${task}`);
        throw new Error(`Task path not found for ${task}`);
    }

    // 假设每个任务有 250 道题，索引从 0 到 249
    const totalQuestions = 250;

    for (let i = 0; i < totalQuestions; i++) {
        const questionDir = this.config.getQuestionPath(task, i);
        this.allQuestions.push({
            id: `${task}_${i}`,
            index: i,
            image_path: `${questionDir}/Panel_16.png`, // 假设图片名为 Panel_16.png
            xml_path: `${questionDir}/RAVEN_${i}_test.xml`,
            answer: null // 答案将在需要时异步加载
        });
    }
      
    console.log(`Loaded ${this.allQuestions.length} questions for ${task}`);
      
    // 加载完成后立即应用筛选
    this.applySubsetFilter();
  }

  /**
   * 异步获取题目答案
   * @param {object} question 
   */
  async getAnswer(question) {
    if (question.answer) return question.answer;

    try {
        // Encode URI to handle spaces in paths (e.g., "ICML 2026")
        const url = encodeURI(question.xml_path);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error loading answer for ${question.id}: ${response.status} ${response.statusText} at ${url}`);
            return null;
        }
        
        const text = await response.text();
        // Parse XML: <Data answer="E" />
        const match = text.match(/answer=["']([A-Z])["']/);
        if (match) {
            question.answer = match[1];
            return match[1];
        }
    } catch (e) {
        console.error(`Failed to load answer for question ${question.id}:`, e);
    }
    return null;
  }

  /**
   * 根据邀请码筛选题目
   * 规则：
   * 1. 'raven3d' -> regular mode (显示所有题目)
   * 2. 'SET01' - 'SET10' -> 将题目均分为10份，显示对应的那一份
   * 3. 其他 -> 显示所有题目 (或根据需求改为不显示/显示第一份)
   */
  applySubsetFilter() {
    if (!this.inviteCode || this.inviteCode.toLowerCase() === 'raven3d') {
        this.activeQuestions = this.allQuestions;
        console.log('Regular mode: showing all questions');
        return;
    }

    const match = this.inviteCode.match(/^SET(\d+)$/i);
    if (match) {
        const setId = parseInt(match[1], 10);
        
        // 仅处理 SET01 到 SET10
        if (setId >= 1 && setId <= 10) {
            const total = this.allQuestions.length;
            const subsetCount = 10;
            const partSize = Math.floor(total / subsetCount);
            
            // 计算起始和结束索引
            // SET01 -> index 0 to partSize
            // SET10 -> index 9*partSize to total (handle remainder)
            
            const start = (setId - 1) * partSize;
            // 对于最后一个集合，包含所有剩余的题目
            const end = (setId === subsetCount) ? total : start + partSize;

            this.activeQuestions = this.allQuestions.slice(start, end);
            console.log(`Subset mode (${this.inviteCode}): showing questions ${start + 1} to ${end} (Total: ${this.activeQuestions.length})`);
            return;
        }
    }

    // 默认行为：如果邀请码不匹配特定规则，显示全部
    console.warn(`Unknown invite code ${this.inviteCode}, showing all questions`);
    this.activeQuestions = this.allQuestions;
  }

  /**
   * 获取当前筛选后的题目
   */
  getAllQuestions() {
    return this.activeQuestions;
  }

  /**
   * 获取筛选后的题目数量
   */
  getQuestionCount() {
    return this.activeQuestions.length;
  }
}
