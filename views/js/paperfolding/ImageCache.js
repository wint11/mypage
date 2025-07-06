/**
 * 图片缓存管理模块
 */
export class ImageCache {
  constructor(config) {
    this.imageCache = new Map(); // 图片缓存
    this.cacheAccessOrder = []; // LRU缓存访问顺序
    const cacheConfig = config.getCacheConfig();
    const dataConfig = config.getDataConfig();
    this.maxCacheSize = cacheConfig.maxCacheSize || 100; // 最大缓存图片数量
    this.preloadRange = cacheConfig.preloadRange || 5; // 预加载范围：前后5题
    this.loadingProgress = { loaded: 0, total: 0 }; // 加载进度
    this.imagePath = dataConfig.imagePath || '../task1/task1_selected_algorithm2/';
  }

  /**
   * 预加载单个图片
   */
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
      img.src = `${this.imagePath}${imagePath}`;
    });
  }
  
  /**
   * 设置缓存项
   */
  setCacheItem(imagePath, src) {
    // 如果缓存已满，先清理最久未使用的项
    if (this.imageCache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }
    
    this.imageCache.set(imagePath, src);
    this.updateCacheAccess(imagePath);
  }
  
  /**
   * 更新缓存访问顺序
   */
  updateCacheAccess(imagePath) {
    // 移除旧的访问记录
    const index = this.cacheAccessOrder.indexOf(imagePath);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    
    // 添加到最新位置
    this.cacheAccessOrder.push(imagePath);
  }
  
  /**
   * 清理缓存
   */
  cleanupCache() {
    while (this.imageCache.size > this.maxCacheSize) {
      this.evictLeastUsed();
    }
  }
  
  /**
   * 获取缓存状态信息
   */
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
  
  /**
   * 手动清理缓存（调试用）
   */
  clearCache() {
    this.imageCache.clear();
    this.cacheAccessOrder = [];
    console.log('缓存已手动清空');
  }
  
  /**
   * 淘汰最久未使用的缓存项
   */
  evictLeastUsed() {
    if (this.cacheAccessOrder.length === 0) return;
    
    const leastUsedPath = this.cacheAccessOrder.shift();
    this.imageCache.delete(leastUsedPath);
  }

  /**
   * 获取缓存的图片
   */
  getCachedImage(imagePath) {
    if (this.imageCache.has(imagePath)) {
      this.updateCacheAccess(imagePath);
      return this.imageCache.get(imagePath);
    }
    return null;
  }

  /**
   * 检查图片是否已缓存
   */
  isCached(imagePath) {
    return this.imageCache.has(imagePath);
  }

  /**
   * 批量预加载图片
   */
  async batchPreload(imagePaths, batchSize = 3) {
    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      const promises = batch.map(imagePath => this.preloadImage(imagePath));
      await Promise.all(promises);
      
      // 检查缓存大小并清理
      this.cleanupCache();
    }
  }

  /**
   * 预加载指定范围内的题目图片
   */
  async preloadRangeImages(questions, currentIndex) {
    const start = Math.max(0, currentIndex - this.preloadRange);
    const end = Math.min(questions.length, currentIndex + this.preloadRange + 1);
    
    const imagesToLoad = [];
    
    for (let i = start; i < end; i++) {
      if (i !== currentIndex) {
        const question = questions[i];
        if (question.image) {
          imagesToLoad.push(question.image);
        }
      }
    }
    
    await this.batchPreload(imagesToLoad);
  }

  /**
   * 预加载图片数组（兼容方法）
   */
  async preloadImages(imagePaths) {
    return this.batchPreload(imagePaths);
  }
}