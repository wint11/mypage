// 纸张折叠测试 JavaScript
class PaperFoldingTest {
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
    
    this.allQuestions = [];
    this.allQuestions = []; // 存储完整题目数据
    this.filteredQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.testCompleted = false;
    this.currentFilter = 'all';
    this.currentVersion = 'full'; // 当前版本：demo 或 full
    this.imageCache = new Map(); // 图片缓存
    this.cacheAccessOrder = []; // LRU缓存访问顺序
    this.maxCacheSize = 100; // 最大缓存图片数量
    this.preloadRange = 5; // 预加载范围：前后5题
    this.loadingProgress = { loaded: 0, total: 0 }; // 加载进度
    this.init();
  }

  async init() {
    try {
      await this.loadQuestions();
      this.initializeFilter();
      this.setupEventListeners();
      
      // 显示当前题目（使用占位符）
      this.displayQuestion();
      this.updateProgress();
      this.updateSubmitButton();
      
      // 开始预加载图片
      this.startImagePreloading();
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('加载题目数据失败，请刷新页面重试。');
    }
  }

  async loadQuestions() {
    try {
      const response = await fetch('../paperfolding/questions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.allQuestions = data.questions || [];
      
      if (this.allQuestions.length === 0) {
        throw new Error('没有找到题目数据');
      }
      
      // 根据当前版本设置题目
      this.setQuestionsForVersion();
      
      console.log(`成功加载 ${this.questions.length} 道题目 (${this.currentVersion}版)`);
    } catch (error) {
      console.error('加载题目失败:', error);
      throw error;
    }
  }
  
  // 根据版本设置题目
  setQuestionsForVersion() {
    if (this.currentVersion === 'demo') {
      // Demo版只取前3题
      this.questions = this.allQuestions.slice(0, 50);
    } else {
      // 完整版使用全部题目
      this.questions = [...this.allQuestions];
    }
    
    // 重新初始化用户答案数组
    this.userAnswers = new Array(this.questions.length).fill(null);
    
    // 从localStorage恢复答案
    this.loadAnswersFromStorage();
  }

  setupEventListeners() {
    // 上一题按钮
    document.getElementById('prevBtn').addEventListener('click', () => {
      this.previousQuestion();
    });

    // 下一题按钮
    document.getElementById('nextBtn').addEventListener('click', () => {
      this.nextQuestion();
    });
    
    // 提交按钮
    document.getElementById('submitBtn').addEventListener('click', () => {
      this.submitTest();
    });
    
    // 版本切换按钮事件
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const version = e.target.dataset.version;
        this.switchVersion(version);
      });
    });
    
    // 筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);
      });
    });

    // 跳转按钮事件
    document.getElementById('jumpBtn').addEventListener('click', () => {
      this.jumpToQuestion();
    });

    // 跳转输入框回车事件
    document.getElementById('jumpInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.jumpToQuestion();
      }
    });

    // 下载按钮事件
    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.downloadQuestionImage();
    });

    // 下载全部按钮事件
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
      this.downloadAllQuestions();
    });

    // AI解答按钮事件
    document.getElementById('aiAnalyzeBtn').addEventListener('click', () => {
      this.analyzeWithAI();
    });

    // 复制AI回答按钮事件
    document.getElementById('copyAiResponse').addEventListener('click', () => {
      this.copyAIResponse();
    });

    // 选项点击事件
    document.querySelectorAll('.option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectOption(e.currentTarget.dataset.option);
      });
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.previousQuestion();
          break;
        case 'ArrowRight':
          this.nextQuestion();
          break;
        case 'a':
        case 'A':
          this.selectOption('A');
          break;
        case 'b':
        case 'B':
          this.selectOption('B');
          break;
        case 'c':
        case 'C':
          this.selectOption('C');
          break;
        case 'd':
        case 'D':
          this.selectOption('D');
          break;
      }
    });
  }

  // 开始图片预加载
  startImagePreloading() {
    // 优先加载当前题目的图片
    this.preloadCurrentQuestionImages().then(() => {
      // 然后预加载前后范围内的题目图片
      this.preloadRangeImages();
    });
  }
  
  // 预加载当前题目的图片
  async preloadCurrentQuestionImages() {
    if (this.filteredQuestions.length === 0) return;
    
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const currentImages = [
      ...currentQuestion.stemImages,
      ...Object.values(currentQuestion.options)
    ];
    
    const promises = currentImages.map(imagePath => this.preloadImage(imagePath));
    await Promise.all(promises);
    
    // 当前题目图片加载完成后，立即更新显示
    this.displayQuestion();
  }
  
  // 预加载指定范围内的题目图片
  async preloadRangeImages() {
    const start = Math.max(0, this.currentQuestionIndex - this.preloadRange);
    const end = Math.min(this.filteredQuestions.length, this.currentQuestionIndex + this.preloadRange + 1);
    
    const imagesToLoad = [];
    
    for (let i = start; i < end; i++) {
      if (i !== this.currentQuestionIndex) {
        const question = this.filteredQuestions[i];
        const questionImages = [
          ...question.stemImages,
          ...Object.values(question.options)
        ];
        imagesToLoad.push(...questionImages);
      }
    }
    
    // 批量预加载，每次加载3张图片
    const batchSize = 3;
    for (let i = 0; i < imagesToLoad.length; i += batchSize) {
      const batch = imagesToLoad.slice(i, i + batchSize);
      const promises = batch.map(imagePath => this.preloadImage(imagePath));
      await Promise.all(promises);
      
      // 检查缓存大小并清理
      this.cleanupCache();
    }
  }
  
  // 预加载单个图片
  preloadImage(imagePath) {
    return new Promise((resolve) => {
      if (this.imageCache.has(imagePath)) {
        // 更新LRU访问顺序
        this.updateCacheAccess(imagePath);
        resolve(this.imageCache.get(imagePath));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        this.setCacheItem(imagePath, img.src);
        resolve(img.src);
      };
      img.onerror = () => {
        // 使用默认占位符
        const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.setCacheItem(imagePath, placeholderSrc);
        resolve(placeholderSrc);
      };
      img.src = `../paperfolding/images/${imagePath}`;
    });
  }
  
  // 设置缓存项
  setCacheItem(imagePath, src) {
    // 如果缓存已满，先清理最久未使用的项
    if (this.imageCache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }
    
    this.imageCache.set(imagePath, src);
    this.updateCacheAccess(imagePath);
    
    
  }
  
  // 更新缓存访问顺序
  updateCacheAccess(imagePath) {
    // 移除旧的访问记录
    const index = this.cacheAccessOrder.indexOf(imagePath);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    
    // 添加到最新位置
    this.cacheAccessOrder.push(imagePath);
  }
  
  // 清理缓存
  cleanupCache() {
    while (this.imageCache.size > this.maxCacheSize) {
      this.evictLeastUsed();
    }
  }
  
  // 获取缓存状态信息
  getCacheStatus() {
    return {
      size: this.imageCache.size,
      maxSize: this.maxCacheSize,
      usage: `${this.imageCache.size}/${this.maxCacheSize}`,
      usagePercentage: Math.round((this.imageCache.size / this.maxCacheSize) * 100),
      accessOrder: [...this.cacheAccessOrder],
      cachedImages: Array.from(this.imageCache.keys())
    };
  }
  
  // 手动清理缓存（调试用）
  clearCache() {
    this.imageCache.clear();
    this.cacheAccessOrder = [];
    console.log('缓存已手动清空');
  }
  
  // 淘汰最久未使用的缓存项
  evictLeastUsed() {
    if (this.cacheAccessOrder.length === 0) return;
    
    const leastUsedPath = this.cacheAccessOrder.shift();
    this.imageCache.delete(leastUsedPath);
  }

  displayQuestion() {
    if (this.filteredQuestions.length === 0) {
      this.showError('没有符合筛选条件的题目');
      return;
    }
    
    const question = this.filteredQuestions[this.currentQuestionIndex];
    
    // 显示题干图片
    this.displayStemImages(question.stemImages);
    
    // 显示选项图片
    this.displayOptions(question.options);
    
    // 恢复用户之前的选择
    this.restoreUserSelection();
    
    // 更新导航按钮状态
    this.updateNavigationButtons();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
    
    // 清除答题反馈
    this.clearFeedback();
  }

  displayStemImages(stemImages) {
    const container = document.getElementById('stemImages');
    container.innerHTML = '';
    
    stemImages.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.alt = `题干图片 ${index + 1}`;
      
      // 使用缓存的图片或占位符
      if (this.imageCache.has(imagePath)) {
        img.src = this.imageCache.get(imagePath);
        // 更新LRU访问顺序
        this.updateCacheAccess(imagePath);
      } else {
        // 如果缓存中没有，使用占位符并异步加载
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.preloadImage(imagePath).then(src => {
          img.src = src;
        });
      }
      
      container.appendChild(img);
      
      // 添加箭头（除了最后一张图片）
      if (index < stemImages.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'fold-arrow';
        arrow.innerHTML = '→';
        container.appendChild(arrow);
      }
    });
  }

  displayOptions(options) {
    ['A', 'B', 'C', 'D'].forEach(option => {
      const img = document.getElementById(`option${option}`);
      const imagePath = options[option];
      
      // 使用缓存的图片或占位符
      if (this.imageCache.has(imagePath)) {
        img.src = this.imageCache.get(imagePath);
        // 更新LRU访问顺序
        this.updateCacheAccess(imagePath);
      } else {
        // 如果缓存中没有，使用占位符并异步加载
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        this.preloadImage(imagePath).then(src => {
          img.src = src;
        });
      }
    });
  }

  selectOption(selectedOption) {
    if (this.testCompleted) return;
    
    // 清除之前的选择状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // 标记当前选择
    const optionElement = document.querySelector(`[data-option="${selectedOption}"]`);
    optionElement.classList.add('selected');
    
    // 获取当前题目在原始数组中的索引
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === currentQuestion);
    
    // 保存用户答案到原始数组对应位置
    this.userAnswers[originalIndex] = selectedOption;
    
    // 保存到localStorage
    this.saveAnswersToStorage();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
  }

  saveAnswersToStorage() {
    const storageKey = `paperfolding_answers_${this.currentVersion}`;
    localStorage.setItem(storageKey, JSON.stringify(this.userAnswers));
  }
  
  loadAnswersFromStorage() {
    const storageKey = `paperfolding_answers_${this.currentVersion}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const answers = JSON.parse(saved);
        if (answers.length === this.questions.length) {
          this.userAnswers = answers;
        }
      } catch (e) {
        console.warn('无法加载保存的答案:', e);
      }
    }
  }
  
  clearStoredAnswers() {
    const storageKey = `paperfolding_answers_${this.currentVersion}`;
    localStorage.removeItem(storageKey);
  }

  // 上传数据到问卷星
  uploadToWenjuanxing(results) {
    try {
      // 检查问卷星配置
      if (!this.wenjuanxingConfig.enabled) {
        this.showUploadStatus('问卷星上传功能未启用', '#FF9800', {
          details: [
            '要启用问卷星上传功能，请：',
            '1. 在代码中设置 wenjuanxingConfig.enabled = true',
            '2. 配置有效的问卷星活动ID',
            '3. 设置正确的字段映射',
            '数据已输出到控制台供参考'
          ]
        });
        console.log('准备上传到问卷星的数据:', this.prepareSubmitData(results));
        return;
      }
      
      if (!this.wenjuanxingConfig.activityId) {
        this.showUploadStatus('问卷星活动ID未配置', '#f44336', {
          details: [
            '请在代码中配置以下参数：',
            '1. wenjuanxingConfig.activityId: 问卷星活动ID（如：h3Bs6Ay）',
            '2. wenjuanxingConfig.debugMode: 是否显示iframe调试（可选）',
            '详细配置说明请参考 wenjuanxing-config-guide.md 文件'
          ]
        });
        return;
      }
      
      // 显示上传状态
      this.showUploadStatus('正在准备问卷星数据...', '#4CAF50');
      
      // 准备要提交的数据
       const submitData = this.prepareSubmitData(results);
       
       // 打开问卷星并显示填写说明
       this.createWenjuanxingIframe(submitData);
       
       // 显示完成状态
       this.showUploadStatus('问卷星已打开，请手动填写数据', '#2196F3', {
         details: [
           '由于浏览器跨域限制，无法自动填写问卷星表单',
           '已为您打开问卷星页面和填写说明',
           '请根据提示手动填写相关数据',
           '如需复制数据，请点击填写说明中的"复制数据"按钮'
         ]
       });
       
    } catch (error) {
      console.error('问卷星上传过程出错:', error);
      this.showUploadStatus('上传功能配置错误', '#f44336');
    }
  }
  
  // 显示上传状态的辅助方法
  showUploadStatus(message, backgroundColor, options = {}) {
    // 移除现有的状态提示
    const existingStatus = document.getElementById('upload-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'upload-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 300px;
    `;
    
    if (options.details && options.details.length > 0) {
      statusDiv.innerHTML = `
        <div>${message}</div>
        ${options.details.map(detail => `<div style="font-size: 12px; margin-top: 3px;">${detail}</div>`).join('')}
      `;
    } else {
      statusDiv.textContent = message;
    }
    
    document.body.appendChild(statusDiv);
    
    // 自动移除状态提示
    const removeDelay = options.details ? 8000 : 3000;
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, removeDelay);
  }
  
  // 准备提交数据的辅助方法
  prepareSubmitData(results) {
    return {
      totalQuestions: results.totalQuestions,
      correctAnswers: results.correctAnswers,
      accuracy: results.accuracy,
      timestamp: new Date().toISOString(),
      testType: '折纸游戏测试',
      version: this.currentVersion,
      details: results.results.map(r => ({
        question: r.questionNumber,
        userAnswer: r.userAnswer || '未答',
        correct: r.isCorrect
      }))
    };
  }
   
   // 创建隐藏表单直接提交到问卷星
    // 配置说明：
    // 1. 需要替换下面的action URL为有效的问卷星表单提交地址
    // 2. 需要根据实际问卷星表单字段调整fields对象
    // 3. 需要处理跨域问题（问卷星需要允许跨域提交）
    // 4. 建议添加提交成功/失败的回调验证
    submitFormToWenjuanxing(data) {
       try {
         // 创建隐藏的iframe用于表单提交
         const iframe = document.createElement('iframe');
         iframe.name = 'wjx-submit-frame';
         iframe.style.display = 'none';
         iframe.style.width = '0';
         iframe.style.height = '0';
         iframe.style.border = 'none';
         document.body.appendChild(iframe);
         
         // 创建隐藏的表单
         const form = document.createElement('form');
         form.method = 'POST';
         form.action = this.wenjuanxingConfig.formUrl;
         form.target = 'wjx-submit-frame'; // 提交到隐藏iframe
         form.style.display = 'none';
         
         // 根据配置映射字段
         const fields = {};
         if (this.wenjuanxingConfig.activityId) {
           fields['activity'] = this.wenjuanxingConfig.activityId;
         }
         
         // 使用字段映射配置
         Object.keys(this.wenjuanxingConfig.fieldMapping).forEach(key => {
           const mappedField = this.wenjuanxingConfig.fieldMapping[key];
           if (data[key] !== undefined) {
             fields[mappedField] = key === 'testData' ? JSON.stringify(data) : data[key];
           }
         });
        
        // 为每个字段创建input元素
        Object.keys(fields).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        });
        
        // 添加到页面并提交
        document.body.appendChild(form);
        
        // 延迟提交，确保表单已添加到DOM
        setTimeout(() => {
          form.submit();
          console.log('表单已提交到问卷星:', data);
          
          // 提交后清理
          setTimeout(() => {
            if (form.parentNode) {
              form.parentNode.removeChild(form);
            }
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }, 100);
        
      } catch (error) {
        console.warn('表单提交失败:', error);
      }
    }
   
   // 创建问卷星iframe并尝试自动填写表单
  createWenjuanxingIframe(data) {
    console.log('创建问卷星iframe...');
    
    // 由于跨域限制，直接在新窗口打开问卷星并显示数据
    this.openWenjuanxingWithData(data);
  }
  
  // 在新窗口打开问卷星并显示填写数据
  openWenjuanxingWithData(data) {
    const activityId = this.wenjuanxingConfig.activityId;
    const wjxUrl = `https://www.wjx.cn/vm/${activityId}.aspx`;
    
    // 立即显示填写提示和数据
    this.showFillInstructions(data);
    
    // 延迟3秒后在新窗口打开问卷星，让用户有时间查看填写说明
    setTimeout(() => {
      const wjxWindow = window.open(wjxUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (wjxWindow) {
        console.log('问卷星已在新窗口打开');
      } else {
        console.error('无法打开问卷星窗口，可能被浏览器阻止了弹窗');
        this.showUploadStatus('问卷星窗口被阻止，请允许弹窗后重试', '#f44336');
      }
    }, 3000);
    
    // 如果启用调试模式，显示详细数据
    if (this.wenjuanxingConfig.debugMode) {
      console.log('问卷星填写数据:', data);
    }
  }
  
  // 显示填写说明
  showFillInstructions(data) {
    const instructions = `
问卷星自动填写数据：

准确率：${data.accuracy}%
总题数：${data.totalQuestions}
正确答案数：${data.correctAnswers}
测试类型：${data.testType}
版本：${data.version}
测试时间：${data.timestamp}

请在打开的问卷星窗口中手动填写上述数据。
    `;
    
    // 创建一个模态框显示填写说明
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    content.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">问卷星填写说明</h3>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace;">${instructions}</pre>
      <div style="text-align: center; margin-top: 20px;">
        <button id="copyDataBtn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer;">复制数据</button>
        <button id="closeInstructionsBtn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 复制数据到剪贴板
    content.querySelector('#copyDataBtn').onclick = () => {
      const dataText = `准确率：${data.accuracy}%\n总题数：${data.totalQuestions}\n正确答案数：${data.correctAnswers}`;
      navigator.clipboard.writeText(dataText).then(() => {
        alert('数据已复制到剪贴板');
      }).catch(() => {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = dataText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('数据已复制到剪贴板');
      });
    };
    
    // 关闭说明
    content.querySelector('#closeInstructionsBtn').onclick = () => {
      document.body.removeChild(modal);
    };
    
    // 点击背景关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  }
  

  


  restoreUserSelection() {
    // 获取当前题目在原始数组中的索引
    const currentQuestion = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === currentQuestion);
    const userAnswer = this.userAnswers[originalIndex];
    
    // 先清除所有选项的选中状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // 如果有用户答案，则恢复选中状态
    if (userAnswer) {
      const optionElement = document.querySelector(`[data-option="${userAnswer}"]`);
      if (optionElement) {
        optionElement.classList.add('selected');
      }
    }
  }

  clearFeedback() {
    const feedbackElement = document.getElementById('answerFeedback');
    feedbackElement.textContent = '';
    feedbackElement.className = 'answer-feedback';
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载前一题的图片（如果存在且未缓存）
      this.preloadAdjacentQuestions();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载下一题的图片（如果存在且未缓存）
      this.preloadAdjacentQuestions();
    }
  }

  jumpToQuestion() {
    const jumpInput = document.getElementById('jumpInput');
    const questionNumber = parseInt(jumpInput.value);
    
    // 验证输入的题号
    if (isNaN(questionNumber) || questionNumber < 1 || questionNumber > this.filteredQuestions.length) {
      alert(`请输入有效的题号（1-${this.filteredQuestions.length}）`);
      jumpInput.value = '';
      return;
    }
    
    // 跳转到指定题目（题号从1开始，数组索引从0开始）
    this.currentQuestionIndex = questionNumber - 1;
    this.displayQuestion();
    this.updateProgress();
    
    // 预加载相邻题目的图片
    this.preloadAdjacentQuestions();
    
    // 清空输入框
    jumpInput.value = '';
    
    // 显示跳转成功提示
    const answerFeedback = document.getElementById('answerFeedback');
    answerFeedback.textContent = `已跳转到第 ${questionNumber} 题`;
    answerFeedback.className = 'answer-feedback success';
    
    // 3秒后清除提示
    setTimeout(() => {
      if (answerFeedback.textContent.includes('已跳转到')) {
        answerFeedback.textContent = '';
        answerFeedback.className = 'answer-feedback';
      }
    }, 3000);
  }
  
  // 切换版本
  switchVersion(version) {
    if (this.currentVersion === version) {
      return; // 如果已经是当前版本，不需要切换
    }
    
    // 确认切换（如果用户已经开始答题）
    const hasAnswered = this.userAnswers.some(answer => answer !== null);
    if (hasAnswered) {
      const confirmSwitch = confirm(`切换版本将清空当前答题进度，确定要切换到${version === 'demo' ? 'Demo版' : '完整版'}吗？`);
      if (!confirmSwitch) {
        return;
      }
    }
    
    // 更新版本
    this.currentVersion = version;
    
    // 更新按钮状态
    document.querySelectorAll('.version-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.version === version) {
        btn.classList.add('active');
      }
    });
    
    // 重新设置题目
    this.setQuestionsForVersion();
    
    // 重置当前题目索引
    this.currentQuestionIndex = 0;
    
    // 重新应用筛选
    this.applyFilter(this.currentFilter);
    
    // 显示当前题目
    this.displayQuestion();
    this.updateProgress();
    this.updateSubmitButton();
    this.updateJumpInputMax();
    
    // 清空答题反馈
    const answerFeedback = document.getElementById('answerFeedback');
    answerFeedback.textContent = '';
    answerFeedback.className = 'answer-feedback';
    
    // 显示切换成功提示
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    statusDiv.textContent = `已切换到${version === 'demo' ? 'Demo版 (50题)' : '完整版 (230题)'}`;
    document.body.appendChild(statusDiv);
    
    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
    
    console.log(`已切换到${version}版，共${this.questions.length}道题目`);
  }
  
  // 预加载相邻题目的图片
  preloadAdjacentQuestions() {
    const start = Math.max(0, this.currentQuestionIndex - this.preloadRange);
    const end = Math.min(this.filteredQuestions.length, this.currentQuestionIndex + this.preloadRange + 1);
    
    // 预加载范围内的题目图片
    for (let i = start; i < end; i++) {
      if (i !== this.currentQuestionIndex) {
        const question = this.filteredQuestions[i];
        const images = [
          ...question.stemImages,
          ...Object.values(question.options)
        ];
        
        images.forEach(imagePath => {
          if (!this.imageCache.has(imagePath)) {
            this.preloadImage(imagePath);
          }
        });
      }
    }
    
    // 检查缓存大小并清理
    this.cleanupCache();
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.disabled = this.currentQuestionIndex === this.filteredQuestions.length - 1;
  }

  updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    const current = this.currentQuestionIndex + 1;
    const total = this.filteredQuestions.length;
    const percentage = (current / total) * 100;
    
    progressText.textContent = `${current}/${total}`;
    progressFill.style.width = `${percentage}%`;
  }
  
  updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const answeredCount = this.userAnswers.filter(answer => answer !== null).length;
    const allAnswered = answeredCount === this.questions.length;
    
    submitBtn.disabled = !allAnswered;
    submitBtn.textContent = allAnswered ? '提交测试' : `已答题 ${answeredCount}/${this.questions.length}`;
  }
  
  submitTest() {
    if (this.testCompleted) return;
    
    const results = this.getTestResults();
    this.testCompleted = true;
    
    // 显示结果
    this.showTestResults(results);
    
    // 上传数据到问卷星
    this.uploadToWenjuanxing(results);
    
    // 清除存储的答案
    this.clearStoredAnswers();
  }
  
  showTestResults(results) {
    const feedbackElement = document.getElementById('answerFeedback');
    const accuracy = parseFloat(results.accuracy);
    
    let message = `测试完成！\n正确率：${results.accuracy}% (${results.correctAnswers}/${results.totalQuestions})`;
    let className = 'answer-feedback ';
    
    feedbackElement.textContent = message;
    feedbackElement.className = className;
    
    // 禁用所有选项
    document.querySelectorAll('.option').forEach(option => {
      option.style.pointerEvents = 'none';
      option.style.opacity = '0.7';
    });
    
    // 显示正确答案
    this.showCorrectAnswers();
  }
  
  showCorrectAnswers() {
    const question = this.filteredQuestions[this.currentQuestionIndex];
    const originalIndex = this.questions.findIndex(q => q === question);
    const userAnswer = this.userAnswers[originalIndex];
    
    // 清除之前的状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // 显示用户选择和正确答案
    if (userAnswer) {
      const userOption = document.querySelector(`[data-option="${userAnswer}"]`);
      if (userAnswer === question.correctAnswer) {
        userOption.classList.add('correct');
      } else {
        userOption.classList.add('incorrect');
      }
    }
    
    // 显示正确答案
    const correctOption = document.querySelector(`[data-option="${question.correctAnswer}"]`);
    correctOption.classList.add('correct');
  }

  showError(message) {
    const container = document.querySelector('.test-container');
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ 加载错误</h2>
        <p style="color: #666; font-size: 1.1rem;">${message}</p>
        <button onclick="location.reload()" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 20px;
        ">重新加载</button>
      </div>
    `;
  }

  // 筛选功能
  applyFilter(filterType) {
    this.currentFilter = filterType;
    
    // 更新筛选按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === filterType) {
        btn.classList.add('active');
      }
    });
    
    // 根据筛选条件过滤题目
    if (filterType === 'all') {
      this.filteredQuestions = [...this.questions];
    } else {
      const stepCount = parseInt(filterType);
      this.filteredQuestions = this.questions.filter(question => 
        question.stemImages.length === stepCount
      );
    }
    
    // 重置当前题目索引
    this.currentQuestionIndex = 0;
    
    // 更新筛选信息
    this.updateFilterInfo();
    
    // 更新跳转输入框的最大值
    this.updateJumpInputMax();
    
    // 重新显示题目
    if (this.filteredQuestions.length > 0) {
      this.displayQuestion();
      this.updateProgress();
      
      // 预加载当前筛选后的第一题图片（如果还没有缓存）
      this.preloadCurrentQuestionImages().then(() => {
        // 预加载范围内的题目
        this.preloadRangeImages();
      });
    } else {
      this.showError(`没有找到${filterType === 'all' ? '任何' : filterType + '步折叠的'}题目`);
    }
  }
  
  updateFilterInfo() {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
      let infoText = '';
      if (this.currentFilter === 'all') {
        infoText = `显示全部 ${this.filteredQuestions.length} 道题目`;
      } else {
        infoText = `显示 ${this.currentFilter}步折叠 ${this.filteredQuestions.length} 道题目`;
      }
      filterInfo.textContent = infoText;
    }
  }

  updateJumpInputMax() {
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
      jumpInput.max = this.filteredQuestions.length;
      jumpInput.placeholder = `1-${this.filteredQuestions.length}`;
    }
  }
  
  initializeFilter() {
    // 初始化时显示所有题目
    this.filteredQuestions = [...this.questions];
    this.updateFilterInfo();
    this.updateJumpInputMax();
  }

  // 获取测试结果
  getTestResults() {
    let correctCount = 0;
    const results = [];
    
    this.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      results.push({
        questionNumber: index + 1,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
      });
    });
    
    return {
      totalQuestions: this.questions.length,
      correctAnswers: correctCount,
      accuracy: (correctCount / this.questions.length * 100).toFixed(1),
      results: results
    };
  }

  // 下载题目截图
  async downloadQuestionImage() {
    try {
      // 显示加载状态
      const downloadBtn = document.getElementById('downloadBtn');
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 生成中...';
      downloadBtn.disabled = true;

      // 获取question-content元素
      const questionContent = document.querySelector('.question-content');
      if (!questionContent) {
        throw new Error('未找到题目内容区域');
      }

      // 等待图片加载完成
      const images = questionContent.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve; // 即使图片加载失败也继续
          }
        });
      }));

      // 使用html2canvas截图
      const canvas = await html2canvas(questionContent, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: questionContent.offsetWidth,
        height: questionContent.offsetHeight
      });

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `纸折叠题目_第${this.currentQuestionIndex + 1}题_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 显示成功提示
      this.showDownloadSuccess();

    } catch (error) {
      console.error('下载失败:', error);
      this.showDownloadError(error.message);
    } finally {
      // 恢复按钮状态
      const downloadBtn = document.getElementById('downloadBtn');
      downloadBtn.innerHTML = '<i class="bi bi-download"></i> 下载题目';
      downloadBtn.disabled = false;
    }
  }

  // 显示下载成功提示
  showDownloadSuccess() {
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
    statusDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i>题目截图下载成功！';
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  // 显示下载错误提示
  showDownloadError(message) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
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
    statusDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i>下载失败: ${message}`;
    document.body.appendChild(statusDiv);

    // 5秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 5000);
  }

  // 下载所有题目截图
  async downloadAllQuestions() {
    try {
      // 显示加载状态
      const downloadAllBtn = document.getElementById('downloadAllBtn');
      const originalText = downloadAllBtn.innerHTML;
      downloadAllBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 生成中...';
      downloadAllBtn.disabled = true;

      // 获取当前版本的题目数量
      const totalQuestions = this.questions.length;
      const currentQuestionIndex = this.currentQuestionIndex;
      
      // 创建进度提示
      const progressDiv = this.createProgressIndicator();
      document.body.appendChild(progressDiv);

      // 存储当前题目索引，稍后恢复
      const originalIndex = this.currentQuestionIndex;

      // 创建ZIP文件（使用JSZip库）
      const zip = new JSZip();
      const folder = zip.folder(`纸折叠题目_${this.currentVersion === 'demo' ? 'Demo版' : '完整版'}_${new Date().toISOString().split('T')[0]}`);

      // 逐个截图并添加到ZIP
      for (let i = 0; i < totalQuestions; i++) {
        try {
          // 更新进度
          this.updateProgressIndicator(progressDiv, i + 1, totalQuestions);
          
          // 切换到当前题目
          this.currentQuestionIndex = i;
          this.displayQuestion();
          
          // 等待一小段时间确保页面渲染完成
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 获取question-content元素
          const questionContent = document.querySelector('.question-content');
          if (!questionContent) {
            console.warn(`第${i + 1}题：未找到题目内容区域`);
            continue;
          }

          // 等待图片加载完成
          const images = questionContent.querySelectorAll('img');
          await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            });
          }));

          // 使用html2canvas截图
          const canvas = await html2canvas(questionContent, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: questionContent.offsetWidth,
            height: questionContent.offsetHeight
          });

          // 将canvas转换为blob并添加到ZIP
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          folder.file(`第${String(i + 1).padStart(3, '0')}题.png`, blob);
          
        } catch (error) {
          console.error(`第${i + 1}题截图失败:`, error);
          // 继续处理下一题
        }
      }

      // 恢复原始题目
      this.currentQuestionIndex = originalIndex;
      this.displayQuestion();

      // 生成ZIP文件并下载
      this.updateProgressIndicator(progressDiv, totalQuestions, totalQuestions, '正在生成压缩包...');
      const zipBlob = await zip.generateAsync({type: 'blob'});
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `纸折叠题目_${this.currentVersion === 'demo' ? 'Demo版' : '完整版'}_${new Date().toISOString().split('T')[0]}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(link.href);

      // 移除进度提示
      document.body.removeChild(progressDiv);

      // 显示成功提示
      this.showDownloadAllSuccess(totalQuestions);

    } catch (error) {
      console.error('批量下载失败:', error);
      this.showDownloadError(`批量下载失败: ${error.message}`);
    } finally {
      // 恢复按钮状态
      const downloadAllBtn = document.getElementById('downloadAllBtn');
      downloadAllBtn.innerHTML = '<i class="bi bi-cloud-download"></i> 下载全部';
      downloadAllBtn.disabled = false;
    }
  }

  // 创建进度指示器
  createProgressIndicator() {
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      text-align: center;
      min-width: 300px;
      border: 2px solid #28a745;
    `;
    progressDiv.innerHTML = `
      <div style="margin-bottom: 15px; font-size: 16px; font-weight: bold; color: #333;">
        <i class="bi bi-cloud-download" style="margin-right: 8px; color: #28a745;"></i>
        正在批量下载题目
      </div>
      <div style="margin-bottom: 10px; color: #666; font-size: 14px;" id="progressText">准备中...</div>
      <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
        <div id="progressBar" style="height: 100%; background: linear-gradient(90deg, #28a745, #20c997); width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <div style="margin-top: 15px; font-size: 12px; color: #999;">请勿关闭页面，下载完成后会自动保存</div>
    `;
    return progressDiv;
  }

  // 更新进度指示器
  updateProgressIndicator(progressDiv, current, total, customText = null) {
    const progressText = progressDiv.querySelector('#progressText');
    const progressBar = progressDiv.querySelector('#progressBar');
    
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
    
    if (customText) {
      progressText.textContent = customText;
    } else {
      progressText.textContent = `正在处理第 ${current} 题，共 ${total} 题 (${percentage}%)`;
    }
  }

  // 显示批量下载成功提示
  showDownloadAllSuccess(count) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 350px;
    `;
    statusDiv.innerHTML = `
      <i class="bi bi-check-circle-fill" style="font-size: 18px;"></i>
      <div>
        <div style="font-weight: bold; margin-bottom: 2px;">批量下载完成！</div>
        <div style="font-size: 12px; opacity: 0.9;">已成功下载 ${count} 道题目</div>
      </div>
    `;
    document.body.appendChild(statusDiv);

    // 5秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 5000);
  }

  // AI解答功能
  async analyzeWithAI() {
    const aiBtn = document.getElementById('aiAnalyzeBtn');
    const modal = new bootstrap.Modal(document.getElementById('aiModal'));
    const loadingIndicator = document.getElementById('aiLoadingIndicator');
    const responseContent = document.getElementById('aiResponseContent');
    const copyBtn = document.getElementById('copyAiResponse');

    // 禁用按钮并显示加载状态
    aiBtn.disabled = true;
    aiBtn.innerHTML = '<i class="bi bi-hourglass-split"></i><span>分析中...</span>';

    // 显示模态框和加载指示器
    modal.show();
    loadingIndicator.style.display = 'block';
    responseContent.style.display = 'none';
    copyBtn.style.display = 'none';

    try {
      // 获取当前题目内容
      const questionData = this.extractQuestionContent();
      
      // 调用AI分析
      const aiResponse = await this.callAIAPI(questionData);
      
      // 渲染markdown内容
      const renderedContent = this.renderMarkdown(aiResponse);
      
      // 显示结果
      responseContent.innerHTML = renderedContent;
      loadingIndicator.style.display = 'none';
      responseContent.style.display = 'block';
      copyBtn.style.display = 'inline-block';
      
      // 存储原始响应用于复制
      this.lastAIResponse = aiResponse;
      
    } catch (error) {
      console.error('AI分析失败:', error);
      this.showAIError(error.message);
      loadingIndicator.style.display = 'none';
    } finally {
      // 恢复按钮状态
      aiBtn.disabled = false;
      aiBtn.innerHTML = '<i class="bi bi-robot"></i><span>AI解答</span>';
    }
  }

  // 提取当前题目内容
  extractQuestionContent() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      throw new Error('无法获取当前题目信息');
    }

    const questionContainer = document.querySelector('.question-content');
    if (!questionContainer) {
      throw new Error('无法找到题目容器');
    }

    // 获取题干描述
    const stemDescription = `这是一道纸折叠测试题。题目编号：${currentQuestion.id}，折叠步数：${currentQuestion.steps}步。`;
    
    // 获取题干图片信息
    const stemImages = document.querySelectorAll('#stemImages img');
    const stemImageInfo = Array.from(stemImages).map((img, index) => 
      `步骤${index + 1}: ${img.alt || '折叠步骤图'}`
    ).join('\n');

    // 获取选项信息
    const options = ['A', 'B', 'C', 'D'];
    const optionInfo = options.map(option => {
      const optionImg = document.getElementById(`option${option}`);
      return `选项${option}: ${optionImg?.alt || '选项图片'}`;
    }).join('\n');

    return {
      questionId: currentQuestion.id,
      steps: currentQuestion.steps,
      description: stemDescription,
      stemImages: stemImageInfo,
      options: optionInfo,
      correctAnswer: currentQuestion.answer
    };
  }

  // 调用AI API
  async callAIAPI(questionData) {
    // 构建提示词
    const prompt = `请分析这道纸折叠测试题：

${questionData.description}

折叠步骤：
${questionData.stemImages}

选项：
${questionData.options}

请提供详细的解题思路和分析过程，包括：
1. 题目理解
2. 折叠过程分析
3. 逻辑推理步骤
4. 答案选择理由

请用markdown格式回答，使用清晰的标题和列表结构。`;

    // 这里应该调用实际的AI API
    // 目前返回一个模拟响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`# 纸折叠测试题解析

## 题目理解

这是一道${questionData.steps}步折叠的空间推理题。需要根据给定的折叠步骤，推断最终展开后的图案。

## 解题思路

### 1. 分析折叠过程
- 仔细观察每个折叠步骤
- 理解纸张的折叠方向和位置
- 注意折叠后形成的层次关系

### 2. 推理展开结果
- 从最后一步开始逆向思考
- 考虑每次展开时图案的对称性
- 注意孔洞或图案的位置变化

### 3. 验证答案
- 将推理结果与各选项对比
- 检查对称性和图案分布
- 确认最符合逻辑的选项

## 解题要点

- **空间想象能力**：需要在脑海中模拟折叠和展开过程
- **对称性原理**：折叠产生的图案通常具有对称性
- **层次分析**：理解折叠层数对最终图案的影响

## 建议

1. 多练习类似题目提高空间想象能力
2. 可以用实际纸张模拟折叠过程
3. 注意观察图案的细节和位置关系

*注：具体答案需要结合实际图像进行详细分析。*`);
      }, 2000); // 模拟API调用延迟
    });
  }

  // 渲染Markdown内容
  renderMarkdown(markdownText) {
    // 简单的markdown渲染，可以根据需要使用更完整的markdown库
    let html = markdownText
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 代码
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 列表项
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // 包装列表
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // 包装段落
    if (!html.startsWith('<h') && !html.startsWith('<ul')) {
      html = '<p>' + html + '</p>';
    }

    return html;
  }

  // 复制AI回答
  copyAIResponse() {
    if (this.lastAIResponse) {
      navigator.clipboard.writeText(this.lastAIResponse).then(() => {
        this.showCopySuccess();
      }).catch(err => {
        console.error('复制失败:', err);
        this.showCopyError();
      });
    }
  }

  // 显示AI错误
  showAIError(message) {
    const responseContent = document.getElementById('aiResponseContent');
    responseContent.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>分析失败</strong><br>
        ${message}
      </div>
    `;
    responseContent.style.display = 'block';
  }

  // 显示复制成功提示
  showCopySuccess() {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      z-index: 10001;
      font-size: 14px;
    `;
    toast.textContent = '内容已复制到剪贴板';
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // 显示复制错误提示
  showCopyError() {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      z-index: 10001;
      font-size: 14px;
    `;
    toast.textContent = '复制失败，请手动复制';
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// 页面加载完成后初始化测试
document.addEventListener('DOMContentLoaded', () => {
  window.paperFoldingTest = new PaperFoldingTest();
  
  // 添加全局调试方法
  window.checkCacheStatus = () => {
    const status = window.paperFoldingTest.getCacheStatus();
    console.log('=== 图片缓存状态 ===');
    console.log(`缓存使用: ${status.usage} (${status.usagePercentage}%)`);
    console.log(`已缓存图片数量: ${status.size}`);
    console.log('最近访问顺序:', status.accessOrder.slice(-10)); // 显示最近10个
    console.log('所有缓存图片:', status.cachedImages);
    return status;
  };
  
  window.clearImageCache = () => {
    window.paperFoldingTest.clearCache();
    console.log('图片缓存已清空');
  };
  
  console.log('调试方法已加载:');
  console.log('- checkCacheStatus(): 查看缓存状态');
  console.log('- clearImageCache(): 清空缓存');
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaperFoldingTest;
}