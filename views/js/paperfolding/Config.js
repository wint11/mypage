/**
 * 纸张折叠测试配置管理模块
 */
export class Config {
  constructor() {
    // 问卷星配置 - 需要根据实际情况修改
    this.wenjuanxingConfig = {
      enabled: true, // 设置为true启用问卷星上传
      formUrl: 'https://www.wjx.cn/handler/jqemed.ashx?activity=h3Bs6Ay', // 问卷星表单提交URL
      activityId: 'h3Bs6Ay', // 问卷星活动ID
      debugMode: true, // 是否显示iframe用于调试
      fieldMapping: { // 字段映射，根据问卷星表单字段调整
        totalQuestions: 'totalQuestions',
        correctAnswers: 'correctAnswers', 
        accuracy: 'accuracy',
        timestamp: 'timestamp',
        testType: 'testType',
        testData: 'testData'
      }
    };
    
    // 图片缓存配置
    this.cacheConfig = {
      maxCacheSize: 100, // 最大缓存图片数量
      preloadRange: 5 // 预加载范围：前后5题
    };
    
    // 测试配置
    this.testConfig = {
      maxQuestionsPerFilter: 30, // 每个筛选条件最多显示的题目数
      questionsPerShape: 2, // 每种形状固定选择的题目数
      storageKeys: {
        questions: 'paperfolding_questions',
        seed: 'paperfolding_seed',
        answers: 'paperfolding_answers'
      }
    };
    
  // 数据路径配置
    this.baseDir = '/AAAI 2026';
    this.dataConfig = {
      jsonlPath: '/AAAI 2026/task1/task1_selected_algorithm2.jsonl',
      imagePath: '/AAAI 2026/task1/task1_selected_algorithm2/'
    };
  }
  
  /**
   * 获取问卷星配置
   */
  getWenjuanxingConfig() {
    return this.wenjuanxingConfig;
  }
  
  /**
   * 获取缓存配置
   */
  getCacheConfig() {
    return this.cacheConfig;
  }
  
  /**
   * 获取测试配置
   */
  getTestConfig() {
    return this.testConfig;
  }
  
  /**
   * 获取数据配置
   */
  getDataConfig() {
    return this.dataConfig;
  }
  
  /**
   * 获取数据文件路径
   */
  getDataPath() {
    return this.dataConfig.jsonlPath;
  }
  
  /**
   * 获取图片基础路径
   */
  getImageBasePath() {
    return this.dataConfig.imagePath;
  }

  getBaseDir() {
    return this.baseDir;
  }

  getTaskQuestionSetsPath(task) {
    return `${this.baseDir}/${task}/all_question_sets.json`;
  }

  getTaskImageBase(task) {
    if (task === 'task1') return `${this.baseDir}/task1/task1_selected_algorithm2/`;
    if (task === 'task2') return `${this.baseDir}/task2/task2_selected/`;
    if (task === 'task3') return `${this.baseDir}/task3/task3_selected/`;
    if (task === 'task4') return `${this.baseDir}/task4/task4_selected/`;
    if (task === 'task5') return `${this.baseDir}/task5/task5_selected/`;
    return `${this.baseDir}/task1/task1_selected_algorithm2/`;
  }

  getTaskJsonl(task) {
    if (task === 'task1') return `${this.baseDir}/task1/task1_selected_algorithm2.jsonl`;
    return this.getDataPath();
  }

  getTask2MergedJsonl() {
    return `${this.baseDir}/task2/task2_selected/merged_dataset_fixed_paths.jsonl`;
  }

  getTask2TestImagesBase() {
    return `${this.baseDir}/task2/test_images/`;
  }
  
  /**
   * 获取存储键名（带版本前缀）
   */
  getStorageKey(type, version = 'task1', suffix = '') {
    const baseKey = this.testConfig.storageKeys[type];
    if (!baseKey) {
      throw new Error(`Unknown storage key type: ${type}`);
    }
    
    let key = `${baseKey}_${version}`;
    if (suffix) {
      key += `_${suffix}`;
    }
    return key;
  }
}
