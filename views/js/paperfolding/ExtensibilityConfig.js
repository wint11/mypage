/**
 * 扩展性配置 - 定义系统的可扩展组件和配置选项
 * 这个文件提供了一个清晰的扩展点定义，使得添加新功能变得更加容易
 */

/**
 * 任务配置 - 定义可用的任务类型和其配置
 */
export const TASK_CONFIGS = {
  task1: {
    name: '任务一：基础折叠',
    description: '基础的纸张折叠认知测试',
    filterClass: 'Task1Filter',
    defaultQuestionCount: 20,
    timeLimit: null, // 无时间限制
    allowRegenerate: true,
    supportedFilters: ['all', 'answered', 'unanswered', 'marked']
  },
  task2: {
    name: '任务二：复杂折叠',
    description: '复杂的纸张折叠认知测试',
    filterClass: 'Task2Filter',
    defaultQuestionCount: 20,
    timeLimit: null,
    allowRegenerate: true,
    supportedFilters: ['all', 'answered', 'unanswered', 'marked']
  },
  task3: {
    name: '任务三：固定题目',
    description: '固定题目的纸张折叠测试',
    filterClass: 'Task3Filter',
    defaultQuestionCount: 10,
    timeLimit: null,
    allowRegenerate: false,
    supportedFilters: ['all', 'answered', 'unanswered']
  }
};

/**
 * 筛选器配置 - 定义可用的筛选器类型
 */
export const FILTER_CONFIGS = {
  all: {
    name: '全部题目',
    description: '显示所有题目',
    icon: '📋',
    priority: 1
  },
  answered: {
    name: '已答题目',
    description: '显示已回答的题目',
    icon: '✅',
    priority: 2
  },
  unanswered: {
    name: '未答题目',
    description: '显示未回答的题目',
    icon: '❓',
    priority: 3
  },
  marked: {
    name: '标记题目',
    description: '显示已标记的题目',
    icon: '⭐',
    priority: 4
  },
  difficult: {
    name: '困难题目',
    description: '显示标记为困难的题目',
    icon: '🔥',
    priority: 5
  }
};

/**
 * 事件钩子配置 - 定义系统中的事件钩子点
 */
export const EVENT_HOOKS = {
  // 初始化相关钩子
  beforeInit: 'before_init',
  afterInit: 'after_init',
  
  // 题目相关钩子
  beforeQuestionLoad: 'before_question_load',
  afterQuestionLoad: 'after_question_load',
  beforeQuestionDisplay: 'before_question_display',
  afterQuestionDisplay: 'after_question_display',
  
  // 答案相关钩子
  beforeAnswerSelect: 'before_answer_select',
  afterAnswerSelect: 'after_answer_select',
  
  // 筛选相关钩子
  beforeFilterApply: 'before_filter_apply',
  afterFilterApply: 'after_filter_apply',
  
  // 提交相关钩子
  beforeSubmit: 'before_submit',
  afterSubmit: 'after_submit'
};

/**
 * 插件配置 - 定义可加载的插件
 */
export const PLUGIN_CONFIGS = {
  analytics: {
    name: '数据分析插件',
    description: '提供详细的答题数据分析',
    enabled: false,
    loadPath: './plugins/AnalyticsPlugin.js',
    dependencies: []
  },
  timer: {
    name: '计时器插件',
    description: '为测试添加计时功能',
    enabled: false,
    loadPath: './plugins/TimerPlugin.js',
    dependencies: []
  },
  accessibility: {
    name: '无障碍插件',
    description: '提供无障碍访问支持',
    enabled: false,
    loadPath: './plugins/AccessibilityPlugin.js',
    dependencies: []
  }
};

/**
 * UI 主题配置
 */
export const THEME_CONFIGS = {
  default: {
    name: '默认主题',
    cssPath: './themes/default.css',
    variables: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      successColor: '#28a745',
      warningColor: '#ffc107',
      dangerColor: '#dc3545'
    }
  },
  dark: {
    name: '深色主题',
    cssPath: './themes/dark.css',
    variables: {
      primaryColor: '#0d6efd',
      secondaryColor: '#6c757d',
      backgroundColor: '#212529',
      textColor: '#ffffff'
    }
  }
};

/**
 * 扩展性管理器 - 提供扩展功能的管理接口
 */
export class ExtensibilityManager {
  constructor() {
    this.loadedPlugins = new Map();
    this.eventListeners = new Map();
    this.customFilters = new Map();
    this.customTasks = new Map();
  }

  /**
   * 注册自定义任务
   * @param {string} taskId - 任务ID
   * @param {Object} taskConfig - 任务配置
   */
  registerTask(taskId, taskConfig) {
    this.customTasks.set(taskId, {
      ...taskConfig,
      id: taskId,
      isCustom: true
    });
    console.log(`已注册自定义任务: ${taskId}`);
  }

  /**
   * 注册自定义筛选器
   * @param {string} filterId - 筛选器ID
   * @param {Object} filterConfig - 筛选器配置
   */
  registerFilter(filterId, filterConfig) {
    this.customFilters.set(filterId, {
      ...filterConfig,
      id: filterId,
      isCustom: true
    });
    console.log(`已注册自定义筛选器: ${filterId}`);
  }

  /**
   * 加载插件
   * @param {string} pluginId - 插件ID
   * @param {Object} pluginConfig - 插件配置
   */
  async loadPlugin(pluginId, pluginConfig = PLUGIN_CONFIGS[pluginId]) {
    if (!pluginConfig) {
      throw new Error(`未找到插件配置: ${pluginId}`);
    }

    try {
      const pluginModule = await import(pluginConfig.loadPath);
      const plugin = new pluginModule.default();
      
      if (typeof plugin.init === 'function') {
        await plugin.init();
      }
      
      this.loadedPlugins.set(pluginId, plugin);
      console.log(`插件加载成功: ${pluginId}`);
      
      return plugin;
    } catch (error) {
      console.error(`插件加载失败: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * 注册事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  async triggerEvent(eventName, data = {}) {
    const listeners = this.eventListeners.get(eventName) || [];
    
    for (const listener of listeners) {
      try {
        await listener(data);
      } catch (error) {
        console.error(`事件监听器执行失败: ${eventName}`, error);
      }
    }
  }

  /**
   * 获取所有可用任务（包括自定义任务）
   */
  getAllTasks() {
    const allTasks = { ...TASK_CONFIGS };
    
    for (const [taskId, taskConfig] of this.customTasks) {
      allTasks[taskId] = taskConfig;
    }
    
    return allTasks;
  }

  /**
   * 获取所有可用筛选器（包括自定义筛选器）
   */
  getAllFilters() {
    const allFilters = { ...FILTER_CONFIGS };
    
    for (const [filterId, filterConfig] of this.customFilters) {
      allFilters[filterId] = filterConfig;
    }
    
    return allFilters;
  }

  /**
   * 检查插件是否已加载
   * @param {string} pluginId - 插件ID
   */
  isPluginLoaded(pluginId) {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * 获取已加载的插件
   * @param {string} pluginId - 插件ID
   */
  getPlugin(pluginId) {
    return this.loadedPlugins.get(pluginId);
  }
}

// 创建全局扩展性管理器实例
export const extensibilityManager = new ExtensibilityManager();

// 将扩展性管理器添加到全局对象，方便调试和扩展
if (typeof window !== 'undefined') {
  window.PaperFoldingExtensibility = extensibilityManager;
}