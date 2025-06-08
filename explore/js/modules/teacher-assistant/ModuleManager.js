/**
 * 智能备课助手 - 模块管理器
 * 负责管理各个功能模块的加载和协调
 */

class ModuleManager {
  constructor() {
    this.modules = new Map();
    this.activeModule = null;
  }

  /**
   * 注册模块
   * @param {string} name 模块名称
   * @param {Object} module 模块实例
   */
  registerModule(name, module) {
    this.modules.set(name, module);
  }

  /**
   * 获取模块
   * @param {string} name 模块名称
   * @returns {Object} 模块实例
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * 激活模块
   * @param {string} name 模块名称
   */
  activateModule(name) {
    const module = this.modules.get(name);
    if (module) {
      if (this.activeModule) {
        this.activeModule.deactivate();
      }
      this.activeModule = module;
      module.activate();
    }
  }

  /**
   * 初始化模块管理器
   */
  async init() {
    try {
      console.log('初始化模块管理器...');
      await this.initializeModules();
      console.log('模块管理器初始化完成');
    } catch (error) {
      console.error('模块管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 切换模块
   * @param {string} moduleName 模块名称
   */
  async switchModule(moduleName) {
    try {
      const module = this.modules.get(moduleName);
      if (!module) {
        throw new Error(`模块 ${moduleName} 不存在`);
      }

      // 如果有当前激活的模块，先停用它
      if (this.activeModule && this.activeModule !== module) {
        if (this.activeModule.deactivate) {
          await this.activeModule.deactivate();
        }
      }

      // 激活新模块
      this.activeModule = module;
      if (module.activate) {
        await module.activate();
      }

      console.log(`已切换到模块: ${moduleName}`);
    } catch (error) {
      console.error(`切换模块 ${moduleName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取当前激活的模块
   * @returns {Object} 当前激活的模块
   */
  getCurrentModule() {
    return this.activeModule;
  }

  /**
   * 初始化所有模块
   */
  async initializeModules() {
    const initPromises = [];
    
    this.modules.forEach(module => {
      if (module.initialize) {
        const result = module.initialize();
        if (result instanceof Promise) {
          initPromises.push(result);
        }
      }
    });
    
    if (initPromises.length > 0) {
      await Promise.all(initPromises);
    }
  }
}