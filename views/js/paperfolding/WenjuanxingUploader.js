/**
 * 问卷星上传模块
 */
export class WenjuanxingUploader {
  constructor(config) {
    this.config = config;
  }

  /**
   * 上传数据到问卷星
   */
  uploadToWenjuanxing(results) {
    try {
      // 检查问卷星配置
      if (!this.config.enabled) {
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
      
      if (!this.config.activityId) {
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
  
  /**
   * 显示上传状态的辅助方法
   */
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
  
  /**
   * 准备提交数据的辅助方法
   */
  prepareSubmitData(results) {
    return {
      totalQuestions: results.totalQuestions,
      correctAnswers: results.correctAnswers,
      accuracy: results.accuracy,
      timestamp: new Date().toISOString(),
      testType: '折纸游戏测试',
      version: results.version || 'task1',
      details: results.results.map(r => ({
        question: r.questionNumber,
        userAnswer: r.userAnswer || '未答',
        correct: r.isCorrect
      }))
    };
  }
   
  /**
   * 创建隐藏表单直接提交到问卷星
   */
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
      form.action = this.config.formUrl;
      form.target = 'wjx-submit-frame'; // 提交到隐藏iframe
      form.style.display = 'none';
      
      // 根据配置映射字段
      const fields = {};
      if (this.config.activityId) {
        fields['activity'] = this.config.activityId;
      }
      
      // 使用字段映射配置
      Object.keys(this.config.fieldMapping).forEach(key => {
        const mappedField = this.config.fieldMapping[key];
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

  /**
   * 创建问卷星iframe并尝试自动填写表单
   */
  createWenjuanxingIframe(data) {
    console.log('创建问卷星iframe...');
    
    // 由于跨域限制，直接在新窗口打开问卷星并显示数据
    this.openWenjuanxingWithData(data);
  }
  
  /**
   * 在新窗口打开问卷星并显示填写数据
   */
  openWenjuanxingWithData(data) {
    const activityId = this.config.activityId;
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
    if (this.config.debugMode) {
      console.log('问卷星填写数据:', data);
    }
  }
  
  /**
   * 显示填写说明
   */
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
    
    // 只在控制台输出说明，不创建重复的模态框
    console.log('问卷星填写说明:', instructions);
    
    // 显示简单的状态提示
    this.showUploadStatus('问卷星窗口即将打开，请手动填写数据', '#28a745');
  }
}