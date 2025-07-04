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
    this.filteredQuestions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.testCompleted = false;
    this.currentFilter = 'all';
    this.currentVersion = 'task1'; // 当前版本：task1, task2, task3
    this.imageCache = new Map(); // 图片缓存
    this.cacheAccessOrder = []; // LRU缓存访问顺序
    this.maxCacheSize = 100; // 最大缓存图片数量
    this.preloadRange = 5; // 预加载范围：前后5题
    this.loadingProgress = { loaded: 0, total: 0 }; // 加载进度
    this.randomSeed = null; // 随机种子
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
      const response = await fetch('../task1/task1_selected_algorithm2.jsonl');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      // 解析JSONL格式
      const lines = text.trim().split('\n');
      this.allQuestions = lines.map((line, index) => {
        const data = JSON.parse(line);
        const shape = this.extractShapeFromPath(data.image);
        
        // 调试信息：显示前10个题目的形状识别结果
        if (index < 10) {
          console.log(`题目 ${index + 1}: 路径=${data.image}, 识别形状=${shape}`);
        }
        
        return {
          id: index + 1,
          image: data.image,
          answer: data.answer,
          // 从图片路径提取形状类型和编号
          shape: shape,
          number: this.extractNumberFromPath(data.image)
        };
      });
      
      // 统计所有形状类型的分布
      const shapeStats = {};
      this.allQuestions.forEach(q => {
        shapeStats[q.shape] = (shapeStats[q.shape] || 0) + 1;
      });
      console.log('数据加载完成，所有题目的形状分布:', shapeStats);
      
      if (this.allQuestions.length === 0) {
        throw new Error('没有找到题目数据');
      }
      
      // 根据当前版本设置题目
      this.setQuestionsForVersion();
      
      console.log(`成功加载 ${this.questions.length} 道题目 (${this.currentVersion})`);
    } catch (error) {
      console.error('加载题目失败:', error);
      throw error;
    }
  }
  
  // 从图片路径提取形状类型
  extractShapeFromPath(imagePath) {
    const filename = imagePath.split('/').pop();
    
    // 处理新的路径格式：fold_1/circle_001.png
    if (filename.includes('circle_')) return 'circle';
    if (filename.includes('Hexagon_')) return 'hexagon';
    if (filename.includes('House_')) return 'house';
    if (filename.includes('Rectangle_')) return 'rectangle';
    if (filename.includes('square_')) return 'square';
    
    // 调试信息：输出无法识别的文件名
    console.warn('无法识别的形状类型:', filename, '完整路径:', imagePath);
    return 'unknown';
  }
  
  // 从图片路径提取编号
  extractNumberFromPath(imagePath) {
    const filename = imagePath.split('/').pop();
    const match = filename.match(/(\d+)\.png$/);
    return match ? parseInt(match[1]) : 0;
  }
  
  // 根据版本设置题目
  setQuestionsForVersion() {
    if (this.currentVersion === 'task1') {
      // 任务壹使用全部题目
      this.questions = [...this.allQuestions];
    } else if (this.currentVersion === 'task2') {
      // 任务贰暂时为空
      this.questions = [];
    } else if (this.currentVersion === 'task3') {
      // 任务叁暂时为空
      this.questions = [];
    }
    
    // 注意：userAnswers数组将在applyFilter后根据filteredQuestions重新初始化
    // 这里先初始化为空数组
    this.userAnswers = [];
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
        if (!e.target.disabled) {
          this.switchVersion(version);
        }
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

    // 重新生成题目按钮事件
    document.getElementById('regenerateBtn').addEventListener('click', () => {
      this.regenerateQuestions();
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
    const imagePath = currentQuestion.image;
    
    await this.preloadImage(imagePath);
    
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
        imagesToLoad.push(question.image);
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
      img.src = `../task1/task1_selected_algorithm2/${imagePath}`;
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
    
    // 显示完整题目图片
    this.displayQuestionImage(question.image);
    
    // 隐藏选项区域（因为现在是完整图片）
    this.hideOptionsArea();
    
    // 恢复用户之前的选择
    this.restoreUserSelection();
    
    // 更新导航按钮状态
    this.updateNavigationButtons();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
    
    // 清除答题反馈
    this.clearFeedback();
  }

  displayQuestionImage(imagePath) {
    const container = document.getElementById('stemImages');
    container.innerHTML = '';
    
    const img = document.createElement('img');
    img.alt = '题目图片';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
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
  }

  hideOptionsArea() {
    // 隐藏选项图片，但保留选项按钮用于答题
    ['A', 'B', 'C', 'D'].forEach(option => {
      const img = document.getElementById(`option${option}`);
      img.style.display = 'none';
    });
    
    // 可以考虑添加文字选项或者保持原有的选项区域用于答题
    const optionsContainer = document.querySelector('.options-container');
    if (optionsContainer) {
      optionsContainer.style.display = 'flex';
      // 为选项添加文字标签
      ['A', 'B', 'C', 'D'].forEach(option => {
        const optionDiv = document.querySelector(`[data-option="${option}"]`);
        if (optionDiv) {
          optionDiv.style.display = 'flex';
          optionDiv.style.alignItems = 'center';
          optionDiv.style.justifyContent = 'center';
          optionDiv.style.minHeight = '60px';
          optionDiv.style.border = '2px solid #ddd';
          optionDiv.style.borderRadius = '8px';
          optionDiv.style.cursor = 'pointer';
          optionDiv.style.backgroundColor = '#f8f9fa';
          
          // 清空内容并添加选项标签
          const img = optionDiv.querySelector('img');
          if (img) img.style.display = 'none';
          
          const label = optionDiv.querySelector('.option-label');
          if (label) {
            label.style.fontSize = '24px';
            label.style.fontWeight = 'bold';
            label.style.color = '#333';
          }
        }
      });
    }
  }

  selectOption(selectedOption) {
    if (this.testCompleted) return;
    
    // 清除之前的选择状态和反馈状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // 标记当前选择
    const optionElement = document.querySelector(`[data-option="${selectedOption}"]`);
    optionElement.classList.add('selected');
    
    // 直接使用当前筛选题目的索引保存答案
    this.userAnswers[this.currentQuestionIndex] = selectedOption;
    
    // 保存到localStorage
    this.saveAnswersToStorage();
    
    // 更新提交按钮状态
    this.updateSubmitButton();
  }

  saveAnswersToStorage() {
    const storageKey = `paperfolding_answers_${this.currentVersion}_filtered`;
    localStorage.setItem(storageKey, JSON.stringify(this.userAnswers));
    console.log('保存筛选题目答案到localStorage:', this.userAnswers.length, '题');
  }
  
  loadAnswersFromStorage() {
    const storageKey = `paperfolding_answers_${this.currentVersion}_filtered`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const answers = JSON.parse(saved);
        if (answers.length === this.filteredQuestions.length) {
          this.userAnswers = answers;
          console.log('从localStorage加载筛选题目答案:', answers.length, '题');
        } else {
          console.log('localStorage中答案数量不匹配，重新初始化');
          this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
        }
      } catch (e) {
        console.warn('无法加载保存的答案:', e);
        this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
      }
    } else {
      this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
    }
  }
  
  clearStoredAnswers() {
    const storageKey = `paperfolding_answers_${this.currentVersion}_filtered`;
    localStorage.removeItem(storageKey);
    this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
    console.log('清除localStorage中的筛选题目答案');
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
任务：${data.version}
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
    // 强制清除所有选项的选中状态，并添加视觉反馈
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
      // 添加清除动画效果
      option.style.transition = 'all 0.3s ease';
      option.style.transform = 'scale(0.98)';
      setTimeout(() => {
        option.style.transform = 'scale(1)';
      }, 150);
    });
    
    // 直接使用当前筛选题目的索引获取用户答案
    const userAnswer = this.userAnswers[this.currentQuestionIndex];
    
    // 如果有用户答案，则恢复选中状态
    if (userAnswer) {
      setTimeout(() => {
        const optionElement = document.querySelector(`[data-option="${userAnswer}"]`);
        if (optionElement) {
          optionElement.classList.add('selected');
          // 添加恢复选中的动画效果
          optionElement.style.transform = 'scale(1.05)';
          setTimeout(() => {
            optionElement.style.transform = 'scale(1)';
          }, 200);
        }
      }, 200);
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
    
    // 尝试保持当前题目的相对位置，如果超出范围则重置为0
    if (this.currentQuestionIndex >= this.filteredQuestions.length) {
      this.currentQuestionIndex = 0;
    }
    
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
        let images = [];
        
        // 检查数据结构类型
        if (question.stemImages && Array.isArray(question.stemImages)) {
          // 新的数据结构（有 stemImages 和 options）
          images = [
            ...question.stemImages,
            ...Object.values(question.options || {})
          ];
        } else if (question.image) {
          // 旧的数据结构（只有 image 字段）
          images = [question.image];
        }
        
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
    
    // 直接计算userAnswers数组中的已答题数量
    let filteredAnsweredCount = 0;
    for (let i = 0; i < this.userAnswers.length; i++) {
      if (this.userAnswers[i] !== null && this.userAnswers[i] !== undefined && this.userAnswers[i] !== '') {
        filteredAnsweredCount++;
      }
    }
    
    // 检查是否完成了当前筛选的所有题目
    const allFilteredAnswered = filteredAnsweredCount === this.filteredQuestions.length;
    
    // 只有完成当前筛选的所有题目才能提交，且必须至少有1道题
    submitBtn.disabled = !allFilteredAnswered || this.filteredQuestions.length === 0;
    
    if (allFilteredAnswered && this.filteredQuestions.length > 0) {
      submitBtn.textContent = '提交测试';
    } else {
      submitBtn.textContent = `已答题 ${filteredAnsweredCount}/${this.filteredQuestions.length} (需全部完成)`;
    }
    
    // 调试信息
    console.log(`筛选题目数: ${this.filteredQuestions.length}, 已答题数: ${filteredAnsweredCount}, userAnswers长度: ${this.userAnswers.length}`);
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
    // 修复：使用当前筛选后的索引获取用户答案
    const userAnswer = this.userAnswers[this.currentQuestionIndex];
    
    // 获取正确答案（兼容不同数据结构）
    const correctAnswer = question.correctAnswer || question.answer;
    
    // 清除之前的状态
    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // 显示用户选择和正确答案
    if (userAnswer) {
      const userOption = document.querySelector(`[data-option="${userAnswer}"]`);
      if (userOption) {
        if (userAnswer === correctAnswer) {
          userOption.classList.add('correct');
        } else {
          userOption.classList.add('incorrect');
        }
      }
    }
    
    // 显示正确答案
    if (correctAnswer) {
      const correctOption = document.querySelector(`[data-option="${correctAnswer}"]`);
      if (correctOption) {
        correctOption.classList.add('correct');
      }
    }
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
    
    console.log('=== 开始筛选过程 ===');
    console.log('筛选类型:', filterType);
    console.log('总题目数:', this.questions.length);
    
    // 根据筛选条件过滤题目
    if (filterType === 'all') {
      // 显示所有题目，确保每种形状类型都有代表
      const allQuestions = [];
      
      // 对每种折叠类型，按形状类型分组选择
      ['fold_1', 'fold_2', 'fold_3'].forEach(foldType => {
        console.log(`\n处理折叠类型: ${foldType}`);
        const foldQuestions = this.questions.filter(q => q.image.includes(`${foldType}/`));
        console.log(`${foldType} 总题目数:`, foldQuestions.length);
        
        // 按形状类型分组
        const shapeGroups = {};
        foldQuestions.forEach(q => {
          const shape = q.shape || 'unknown';
          if (!shapeGroups[shape]) {
            shapeGroups[shape] = [];
          }
          shapeGroups[shape].push(q);
        });
        
        console.log(`${foldType} 形状分组:`, Object.keys(shapeGroups).map(shape => `${shape}: ${shapeGroups[shape].length}`));
        
        // 确保每种形状类型都有代表，每种形状选择2道题
        const shapesPerFold = Object.keys(shapeGroups);
        const questionsPerShape = 2; // 每种形状固定选择2道题
        
        shapesPerFold.forEach(shape => {
          const shapeQuestions = shapeGroups[shape].slice(0, questionsPerShape);
          console.log(`从 ${shape} 选择了 ${shapeQuestions.length} 道题:`, shapeQuestions.map(q => q.image));
          allQuestions.push(...shapeQuestions);
        });
      });
      
      console.log('\n筛选前总题目数:', allQuestions.length);
      console.log('筛选前形状分布:', allQuestions.reduce((acc, q) => {
        const shape = q.shape || 'unknown';
        acc[shape] = (acc[shape] || 0) + 1;
        return acc;
      }, {}));
      
      // 使用基于种子的随机打乱算法
      if (this.randomSeed !== null) {
        this.filteredQuestions = this.shuffleArrayWithSeed(allQuestions, this.randomSeed);
      } else {
        this.filteredQuestions = allQuestions;
      }
      
      // 限制题目数量为30题
      if (this.filteredQuestions.length > 30) {
        this.filteredQuestions = this.filteredQuestions.slice(0, 30);
        console.log('题目数量超过30题，已截取前30题');
      }
    } else {
      const stepCount = parseInt(filterType);
      let foldType = '';
      if (stepCount === 3) {
        foldType = 'fold_1';
      } else if (stepCount === 4) {
        foldType = 'fold_2';
      } else if (stepCount === 5) {
        foldType = 'fold_3';
      }
      
      if (foldType) {
        const foldQuestions = this.questions.filter(question => question.image.includes(`${foldType}/`));
        
        // 按形状类型分组
        const shapeGroups = {};
        foldQuestions.forEach(q => {
          const shape = q.shape || 'unknown';
          if (!shapeGroups[shape]) {
            shapeGroups[shape] = [];
          }
          shapeGroups[shape].push(q);
        });
        
        // 从每种形状类型中选择题目，确保多样性
        const typeQuestions = [];
        const shapesInFold = Object.keys(shapeGroups);
        const questionsPerShape = 2; // 每种形状固定选择2道题
        
        shapesInFold.forEach(shape => {
          const shapeQuestions = shapeGroups[shape].slice(0, questionsPerShape);
          typeQuestions.push(...shapeQuestions);
        });
        
        // 使用基于种子的随机打乱算法
        if (this.randomSeed !== null) {
          this.filteredQuestions = this.shuffleArrayWithSeed(typeQuestions, this.randomSeed + stepCount);
        } else {
          this.filteredQuestions = typeQuestions;
        }
        
        // 限制题目数量为30题
        if (this.filteredQuestions.length > 30) {
          this.filteredQuestions = this.filteredQuestions.slice(0, 30);
          console.log('题目数量超过30题，已截取前30题');
        }
      } else {
        this.filteredQuestions = [];
      }
    }
    
    // 重置当前题目索引
    this.currentQuestionIndex = 0;
    
    // 重新初始化用户答案数组，只针对筛选后的题目
    this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
    
    // 从localStorage恢复答案（基于筛选后的题目）
    this.loadAnswersFromStorage();
    
    // 更新筛选信息
    this.updateFilterInfo();
    
    // 更新跳转输入框的最大值
    this.updateJumpInputMax();
    
    // 重新显示题目
    if (this.filteredQuestions.length > 0) {
      // 调试信息：显示筛选后的题目类型分布
      const shapeCount = {};
      this.filteredQuestions.forEach(q => {
        const shape = q.shape || 'unknown';
        shapeCount[shape] = (shapeCount[shape] || 0) + 1;
      });
      console.log(`筛选后的题目类型分布:`, shapeCount);
      console.log(`筛选后的前5道题目:`, this.filteredQuestions.slice(0, 5).map(q => ({ image: q.image, shape: q.shape })));
      
      // 保存筛选结果到localStorage
      localStorage.setItem('paperfolding_questions', JSON.stringify(this.filteredQuestions));
      localStorage.setItem('paperfolding_seed', this.randomSeed.toString());
      console.log('已保存筛选结果到localStorage:', this.filteredQuestions.length, '题，种子:', this.randomSeed);
      
      this.displayQuestion();
      this.updateProgress();
      this.updateSubmitButton();
      
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
    // 检查localStorage中是否已有题目数据
    const storedQuestions = localStorage.getItem('paperfolding_questions');
    const storedSeed = localStorage.getItem('paperfolding_seed');
    
    if (storedQuestions && storedSeed) {
      try {
        // 使用存储的题目数据
        this.filteredQuestions = JSON.parse(storedQuestions);
        this.randomSeed = parseInt(storedSeed);
        
        // 验证数据完整性
        if (this.filteredQuestions.length > 0 && this.filteredQuestions.length <= 30) {
          console.log('从localStorage加载题目数据:', this.filteredQuestions.length, '题，种子:', this.randomSeed);
          
          // 重置当前题目索引
          this.currentQuestionIndex = 0;
          
          // 重新初始化用户答案数组
          this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
          
          // 从localStorage恢复答案
          this.loadAnswersFromStorage();
          
          // 更新UI
          this.updateFilterInfo();
          this.updateJumpInputMax();
          
          if (this.filteredQuestions.length > 0) {
            this.displayQuestion();
            this.updateProgress();
            this.updateSubmitButton();
            
            // 预加载图片
            this.preloadCurrentQuestionImages().then(() => {
              this.preloadRangeImages();
            });
          }
          
          return; // 成功加载存储数据，直接返回
        }
      } catch (error) {
        console.warn('加载存储的题目数据失败:', error);
      }
    }
    
    // 如果没有存储数据或数据无效，重新生成题目
    console.log('localStorage中无有效题目数据，重新筛选30题');
    this.randomSeed = this.generateRandomSeed();
    this.applyFilter('all');
    console.log('重新生成题目数据，种子:', this.randomSeed);
  }

  // 生成随机种子
  generateRandomSeed() {
    return Math.floor(Math.random() * 1000000);
  }

  // 基于种子的伪随机数生成器
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // 基于种子的数组打乱算法
  shuffleArrayWithSeed(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280; // 线性同余生成器
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  // 清除存储的题目数据
  clearStoredQuestions() {
    localStorage.removeItem('paperfolding_questions');
    localStorage.removeItem('paperfolding_seed');
    console.log('已清除存储的题目数据');
  }

  // 重新生成题目（清除localStorage并重新随机）
  regenerateQuestions() {
    // 确认操作
    if (!confirm('确定要重新生成题目吗？这将清除当前的答题记录。')) {
      return;
    }
    
    // 清除所有相关的localStorage数据
    this.clearStoredQuestions();
    this.clearStoredAnswers();
    
    // 重新生成随机种子
    this.randomSeed = this.generateRandomSeed();
    
    // 重新筛选题目
    this.applyFilter('all');
    
    // 重置当前题目索引
    this.currentQuestionIndex = 0;
    
    // 重新初始化用户答案数组
    this.userAnswers = new Array(this.filteredQuestions.length).fill(null);
    
    // 更新UI
    this.displayQuestion();
    this.updateProgress();
    this.updateSubmitButton();
    
    // 重新开始图片预加载
    this.startImagePreloading();
    
    console.log('重新生成题目完成，新种子:', this.randomSeed, '题目数量:', this.filteredQuestions.length);
    
    // 显示成功提示
    this.showRegenerateSuccess();
  }
  
  // 显示重新生成成功提示
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
    statusDiv.innerHTML = '<i class="bi bi-arrow-clockwise"></i>题目重新生成成功！';
    document.body.appendChild(statusDiv);

    // 3秒后移除提示
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.parentNode.removeChild(statusDiv);
      }
    }, 3000);
  }

  // 获取测试结果
  getTestResults() {
    let correctCount = 0;
    const results = [];
    
    // 只计算当前筛选题目的结果
    this.filteredQuestions.forEach((question, filteredIndex) => {
      // 修复：使用筛选后的索引获取用户答案，因为userAnswers是按筛选后的顺序存储的
      const userAnswer = this.userAnswers[filteredIndex];
      // 兼容不同数据结构的正确答案字段
      const correctAnswer = question.correctAnswer || question.answer;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correctCount++;
      
      results.push({
        questionNumber: filteredIndex + 1,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
      });
    });
    
    return {
      totalQuestions: this.filteredQuestions.length,
      correctAnswers: correctCount,
      accuracy: this.filteredQuestions.length > 0 ? (correctCount / this.filteredQuestions.length * 100).toFixed(1) : '0.0',
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

      // 获取当前显示的img元素
      const stemImages = document.querySelectorAll('.stem-images img');
      const optionImages = document.querySelectorAll('.options-container img');
      
      // 找到第一个可见且有效的图片
      let targetImg = null;
      
      // 优先查找题干图片
      for (let img of stemImages) {
        if (img.src && !img.src.includes('data:image') && img.style.display !== 'none') {
          targetImg = img;
          break;
        }
      }
      
      // 如果没有题干图片，查找选项图片
      if (!targetImg) {
        for (let img of optionImages) {
          if (img.src && !img.src.includes('data:image') && img.style.display !== 'none') {
            targetImg = img;
            break;
          }
        }
      }
      
      if (!targetImg) {
        throw new Error('未找到可下载的图片');
      }

      // 等待图片加载完成
      await new Promise((resolve) => {
        if (targetImg.complete) {
          resolve();
        } else {
          targetImg.onload = resolve;
          targetImg.onerror = resolve;
        }
      });

      // 直接使用html2canvas截图该img元素
      const canvas = await html2canvas(targetImg, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `纸折叠图片_第${this.currentQuestionIndex + 1}题_${new Date().getTime()}.png`;
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
    statusDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i>图片下载成功！';
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

      // 获取当前筛选的题目数量
      const totalQuestions = this.filteredQuestions.length;
      const currentQuestionIndex = this.currentQuestionIndex;
      
      if (totalQuestions === 0) {
        throw new Error('没有可下载的题目');
      }
      
      // 创建进度提示
      const progressDiv = this.createProgressIndicator();
      document.body.appendChild(progressDiv);

      // 存储当前题目索引，稍后恢复
      const originalIndex = this.currentQuestionIndex;

      // 创建ZIP文件（使用JSZip库）
      const zip = new JSZip();
      const folder = zip.folder(`纸折叠题目_${this.currentFilter === 'all' ? '全部题目' : this.currentFilter + '步折叠'}_${new Date().toISOString().split('T')[0]}`);

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
          
          // 查找第一个可见且有效的img元素（只要题干图片）
          const stemImages = document.querySelectorAll('.stem-images img');
          let targetImg = null;
          
          // 优先选择题干图片
          for (const img of stemImages) {
            if (img.src && !img.src.includes('data:image') && img.offsetWidth > 0 && img.offsetHeight > 0) {
              targetImg = img;
              break;
            }
          }
          
          if (!targetImg) {
            console.warn(`第${i + 1}题：未找到可下载的题干图片`);
            continue;
          }

          // 等待图片加载完成
          await new Promise((resolve) => {
            if (targetImg.complete) {
              resolve();
            } else {
              targetImg.onload = resolve;
              targetImg.onerror = resolve;
            }
          });

          // 直接对img元素进行截图
          const canvas = await html2canvas(targetImg, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
          });

          // 将canvas转换为blob并添加到ZIP
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          folder.file(`第${String(i + 1).padStart(3, '0')}题图片.png`, blob);
          
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
      link.download = `纸折叠题目图片_${this.currentFilter === 'all' ? '全部题目' : this.currentFilter + '步折叠'}_${totalQuestions}题_${new Date().toISOString().split('T')[0]}.zip`;
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
  analyzeWithAI() {
    // 简单的alert提示，告知功能还在开发中
    alert('AI解答功能还在开发中，敬请期待！');
  }
}

// 页面加载完成后初始化测试
document.addEventListener('DOMContentLoaded', () => {
  window.paperFoldingTest = new PaperFoldingTest();
  window.paperFoldingTest.init(); // 调用初始化方法
  
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