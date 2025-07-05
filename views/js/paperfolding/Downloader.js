/**
 * 下载功能模块
 */
export class Downloader {
  constructor() {
    // 确保JSZip库可用
    this.isJSZipAvailable = typeof JSZip !== 'undefined';
  }

  /**
   * 下载当前题目截图
   */
  async downloadQuestionImage(currentQuestionIndex) {
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
      link.download = `纸折叠图片_第${currentQuestionIndex + 1}题_${new Date().getTime()}.png`;
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

  /**
   * 下载所有题目截图
   */
  async downloadAllQuestions(filteredQuestions, currentFilter, displayQuestionCallback) {
    if (!this.isJSZipAvailable) {
      this.showDownloadError('JSZip库未加载，无法批量下载');
      return;
    }

    try {
      // 显示加载状态
      const downloadAllBtn = document.getElementById('downloadAllBtn');
      const originalText = downloadAllBtn.innerHTML;
      downloadAllBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 生成中...';
      downloadAllBtn.disabled = true;

      // 获取当前筛选的题目数量
      const totalQuestions = filteredQuestions.length;
      
      if (totalQuestions === 0) {
        throw new Error('没有可下载的题目');
      }
      
      // 创建进度提示
      const progressDiv = this.createProgressIndicator();
      document.body.appendChild(progressDiv);

      // 创建ZIP文件（使用JSZip库）
      const zip = new JSZip();
      const folder = zip.folder(`纸折叠题目_${currentFilter === 'all' ? '全部题目' : currentFilter + '步折叠'}_${new Date().toISOString().split('T')[0]}`);

      // 逐个截图并添加到ZIP
      for (let i = 0; i < totalQuestions; i++) {
        try {
          // 更新进度
          this.updateProgressIndicator(progressDiv, i + 1, totalQuestions);
          
          // 切换到当前题目
          await displayQuestionCallback(i);
          
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

      // 生成ZIP文件并下载
      this.updateProgressIndicator(progressDiv, totalQuestions, totalQuestions, '正在生成压缩包...');
      const zipBlob = await zip.generateAsync({type: 'blob'});
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `纸折叠题目图片_${currentFilter === 'all' ? '全部题目' : currentFilter + '步折叠'}_${totalQuestions}题_${new Date().toISOString().split('T')[0]}.zip`;
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

  /**
   * 创建进度指示器
   */
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

  /**
   * 更新进度指示器
   */
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

  /**
   * 显示下载成功提示
   */
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

  /**
   * 显示下载错误提示
   */
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

  /**
   * 显示批量下载成功提示
   */
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
}