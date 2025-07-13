/**
 * 调试工具类
 * 提供便捷的调试方法和开发工具
 * 
 * 主要功能：
 * - 性能监控
 * - 状态检查
 * - 错误追踪
 * - 开发模式工具
 */
export class DebugUtils {
  constructor() {
    this.isDebugMode = this.checkDebugMode();
    this.performanceMarks = new Map();
    this.errorLog = [];
    this.stateHistory = [];
    
    if (this.isDebugMode) {
      this.enableDebugMode();
    }
  }

  /**
   * 检查是否为调试模式
   */
  checkDebugMode() {
    return localStorage.getItem('paperfolding_debug') === 'true' || 
           window.location.search.includes('debug=true') ||
           window.location.hostname === 'localhost';
  }

  /**
   * 启用调试模式
   */
  enableDebugMode() {
    console.log('🔧 纸折叠测试调试模式已启用');
    
    // 添加全局调试对象
    window.PaperFoldingDebug = {
      utils: this,
      enableDebug: () => this.setDebugMode(true),
      disableDebug: () => this.setDebugMode(false),
      getState: () => this.getCurrentState(),
      clearErrors: () => this.clearErrorLog(),
      exportLogs: () => this.exportDebugLogs()
    };
    
    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
      this.logError('Uncaught Error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // 监听Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason);
    });
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;
    localStorage.setItem('paperfolding_debug', enabled.toString());
    
    if (enabled) {
      this.enableDebugMode();
    } else {
      delete window.PaperFoldingDebug;
    }
  }

  /**
   * 记录性能标记
   */
  markPerformance(name, data = {}) {
    if (!this.isDebugMode) return;
    
    const timestamp = performance.now();
    this.performanceMarks.set(name, {
      timestamp,
      data,
      time: new Date().toISOString()
    });
    
    console.log(`⏱️ Performance Mark: ${name}`, { timestamp, data });
  }

  /**
   * 测量性能间隔
   */
  measurePerformance(startMark, endMark) {
    if (!this.isDebugMode) return null;
    
    const start = this.performanceMarks.get(startMark);
    const end = this.performanceMarks.get(endMark);
    
    if (!start || !end) {
      console.warn(`⚠️ Performance marks not found: ${startMark} or ${endMark}`);
      return null;
    }
    
    const duration = end.timestamp - start.timestamp;
    console.log(`📊 Performance Measure: ${startMark} → ${endMark}: ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  /**
   * 记录错误
   */
  logError(type, error, context = {}) {
    const errorEntry = {
      type,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    this.errorLog.push(errorEntry);
    
    if (this.isDebugMode) {
      console.error(`🚨 ${type}:`, errorEntry);
    }
    
    // 保持错误日志大小
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-50);
    }
  }

  /**
   * 记录状态变化
   */
  logStateChange(component, oldState, newState, action = '') {
    if (!this.isDebugMode) return;
    
    const stateEntry = {
      component,
      oldState: JSON.parse(JSON.stringify(oldState)),
      newState: JSON.parse(JSON.stringify(newState)),
      action,
      timestamp: new Date().toISOString()
    };
    
    this.stateHistory.push(stateEntry);
    
    console.log(`🔄 State Change [${component}]:`, stateEntry);
    
    // 保持状态历史大小
    if (this.stateHistory.length > 50) {
      this.stateHistory = this.stateHistory.slice(-25);
    }
  }

  /**
   * 获取当前系统状态
   */
  getCurrentState() {
    return {
      debugMode: this.isDebugMode,
      errorCount: this.errorLog.length,
      stateChanges: this.stateHistory.length,
      performanceMarks: Array.from(this.performanceMarks.keys()),
      localStorage: this.getLocalStorageInfo(),
      memory: this.getMemoryInfo(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取本地存储信息
   */
  getLocalStorageInfo() {
    const info = {
      keys: [],
      totalSize: 0
    };
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('paperfolding_')) {
          const value = localStorage.getItem(key);
          info.keys.push({
            key,
            size: value ? value.length : 0
          });
          info.totalSize += value ? value.length : 0;
        }
      }
    } catch (error) {
      this.logError('LocalStorage Access Error', error);
    }
    
    return info;
  }

  /**
   * 获取内存信息
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
    console.log('🧹 Error log cleared');
  }

  /**
   * 导出调试日志
   */
  exportDebugLogs() {
    const debugData = {
      state: this.getCurrentState(),
      errors: this.errorLog,
      stateHistory: this.stateHistory,
      performanceMarks: Object.fromEntries(this.performanceMarks),
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperfolding-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📁 Debug logs exported');
  }

  /**
   * 检查组件状态
   */
  checkComponentHealth(component, expectedMethods = []) {
    if (!this.isDebugMode) return { healthy: true, issues: [] };
    
    const issues = [];
    
    // 检查组件是否存在
    if (!component) {
      issues.push('Component is null or undefined');
      return { healthy: false, issues };
    }
    
    // 检查必需的方法
    expectedMethods.forEach(method => {
      if (typeof component[method] !== 'function') {
        issues.push(`Missing method: ${method}`);
      }
    });
    
    const healthy = issues.length === 0;
    
    if (!healthy) {
      console.warn(`🏥 Component Health Check Failed:`, { component, issues });
    }
    
    return { healthy, issues };
  }

  /**
   * 创建性能监控装饰器
   */
  createPerformanceDecorator(name) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = function(...args) {
        const startMark = `${name}_${propertyKey}_start`;
        const endMark = `${name}_${propertyKey}_end`;
        
        this.debugUtils?.markPerformance(startMark);
        
        try {
          const result = originalMethod.apply(this, args);
          
          if (result instanceof Promise) {
            return result.finally(() => {
              this.debugUtils?.markPerformance(endMark);
              this.debugUtils?.measurePerformance(startMark, endMark);
            });
          } else {
            this.debugUtils?.markPerformance(endMark);
            this.debugUtils?.measurePerformance(startMark, endMark);
            return result;
          }
        } catch (error) {
          this.debugUtils?.logError(`Method Error: ${name}.${propertyKey}`, error);
          throw error;
        }
      };
      
      return descriptor;
    };
  }
}

// 创建全局调试实例
export const debugUtils = new DebugUtils();

// 导出便捷方法
export const debug = {
  log: (...args) => debugUtils.isDebugMode && console.log('🔍', ...args),
  warn: (...args) => debugUtils.isDebugMode && console.warn('⚠️', ...args),
  error: (...args) => debugUtils.logError('Debug Error', args[0], { args: args.slice(1) }),
  mark: (name, data) => debugUtils.markPerformance(name, data),
  measure: (start, end) => debugUtils.measurePerformance(start, end),
  state: (component, old, new_, action) => debugUtils.logStateChange(component, old, new_, action)
};