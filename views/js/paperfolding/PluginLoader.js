/**
 * 插件加载器 - 负责动态加载和管理插件
 * 提供插件的生命周期管理和依赖解析
 */

import { extensibilityManager, PLUGIN_CONFIGS } from './ExtensibilityConfig.js';

export class PluginLoader {
  constructor() {
    this.loadedPlugins = new Map();
    this.pluginInstances = new Map();
    this.loadingPromises = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * 初始化插件加载器
   */
  async init() {
    console.log('🔌 插件加载器初始化');
    
    // 从配置中加载启用的插件
    await this.loadEnabledPlugins();
    
    // 设置插件热重载（开发模式）
    if (this.isDevelopmentMode()) {
      this.setupHotReload();
    }
  }

  /**
   * 加载启用的插件
   */
  async loadEnabledPlugins() {
    const enabledPlugins = Object.entries(PLUGIN_CONFIGS)
      .filter(([_, config]) => config.enabled)
      .map(([id, config]) => ({ id, ...config }));

    console.log(`🔌 发现 ${enabledPlugins.length} 个启用的插件`);

    // 解析依赖关系
    const loadOrder = this.resolveDependencies(enabledPlugins);
    
    // 按依赖顺序加载插件
    for (const pluginId of loadOrder) {
      try {
        await this.loadPlugin(pluginId);
      } catch (error) {
        console.error(`🔌 插件加载失败: ${pluginId}`, error);
      }
    }
  }

  /**
   * 解析插件依赖关系
   * @param {Array} plugins - 插件列表
   * @returns {Array} 按依赖顺序排列的插件ID列表
   */
  resolveDependencies(plugins) {
    const graph = new Map();
    const visited = new Set();
    const visiting = new Set();
    const result = [];

    // 构建依赖图
    plugins.forEach(plugin => {
      graph.set(plugin.id, plugin.dependencies || []);
    });

    // 深度优先搜索进行拓扑排序
    const dfs = (pluginId) => {
      if (visiting.has(pluginId)) {
        throw new Error(`检测到循环依赖: ${pluginId}`);
      }
      
      if (visited.has(pluginId)) {
        return;
      }

      visiting.add(pluginId);
      
      const dependencies = graph.get(pluginId) || [];
      dependencies.forEach(dep => {
        if (graph.has(dep)) {
          dfs(dep);
        }
      });

      visiting.delete(pluginId);
      visited.add(pluginId);
      result.push(pluginId);
    };

    plugins.forEach(plugin => {
      if (!visited.has(plugin.id)) {
        dfs(plugin.id);
      }
    });

    return result;
  }

  /**
   * 加载单个插件
   * @param {string} pluginId - 插件ID
   * @param {Object} customConfig - 自定义配置
   */
  async loadPlugin(pluginId, customConfig = null) {
    // 避免重复加载
    if (this.loadingPromises.has(pluginId)) {
      return await this.loadingPromises.get(pluginId);
    }

    const loadPromise = this._loadPluginInternal(pluginId, customConfig);
    this.loadingPromises.set(pluginId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(pluginId);
      return result;
    } catch (error) {
      this.loadingPromises.delete(pluginId);
      throw error;
    }
  }

  /**
   * 内部插件加载实现
   */
  async _loadPluginInternal(pluginId, customConfig) {
    if (this.pluginInstances.has(pluginId)) {
      console.log(`🔌 插件已加载: ${pluginId}`);
      return this.pluginInstances.get(pluginId);
    }

    const config = customConfig || PLUGIN_CONFIGS[pluginId];
    if (!config) {
      throw new Error(`未找到插件配置: ${pluginId}`);
    }

    console.log(`🔌 正在加载插件: ${pluginId}`);

    try {
      // 检查依赖
      await this.checkDependencies(config.dependencies || []);

      // 动态导入插件模块
      const module = await import(config.loadPath);
      const PluginClass = module.default;

      if (!PluginClass) {
        throw new Error(`插件模块没有默认导出: ${pluginId}`);
      }

      // 创建插件实例
      const pluginInstance = new PluginClass(config.options || {});

      // 初始化插件
      if (typeof pluginInstance.init === 'function') {
        await pluginInstance.init();
      }

      // 注册插件到扩展性管理器
      extensibilityManager.loadedPlugins.set(pluginId, pluginInstance);
      this.pluginInstances.set(pluginId, pluginInstance);

      console.log(`✅ 插件加载成功: ${pluginId}`);
      
      // 触发插件加载事件
      this.emitPluginEvent('plugin:loaded', { pluginId, instance: pluginInstance });

      return pluginInstance;
    } catch (error) {
      console.error(`❌ 插件加载失败: ${pluginId}`, error);
      
      // 触发插件加载失败事件
      this.emitPluginEvent('plugin:load-failed', { pluginId, error });
      
      throw error;
    }
  }

  /**
   * 检查插件依赖
   */
  async checkDependencies(dependencies) {
    for (const dep of dependencies) {
      if (!this.pluginInstances.has(dep)) {
        // 尝试加载依赖插件
        if (PLUGIN_CONFIGS[dep]) {
          await this.loadPlugin(dep);
        } else {
          throw new Error(`缺少依赖插件: ${dep}`);
        }
      }
    }
  }

  /**
   * 卸载插件
   * @param {string} pluginId - 插件ID
   */
  async unloadPlugin(pluginId) {
    const instance = this.pluginInstances.get(pluginId);
    if (!instance) {
      console.warn(`🔌 插件未加载: ${pluginId}`);
      return;
    }

    try {
      // 检查是否有其他插件依赖此插件
      const dependents = this.findDependents(pluginId);
      if (dependents.length > 0) {
        throw new Error(`无法卸载插件 ${pluginId}，以下插件依赖它: ${dependents.join(', ')}`);
      }

      // 调用插件的清理方法
      if (typeof instance.destroy === 'function') {
        await instance.destroy();
      }

      // 从管理器中移除
      this.pluginInstances.delete(pluginId);
      extensibilityManager.loadedPlugins.delete(pluginId);

      console.log(`🔌 插件已卸载: ${pluginId}`);
      
      // 触发插件卸载事件
      this.emitPluginEvent('plugin:unloaded', { pluginId });
      
    } catch (error) {
      console.error(`🔌 插件卸载失败: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * 查找依赖指定插件的其他插件
   */
  findDependents(pluginId) {
    const dependents = [];
    
    for (const [id, config] of Object.entries(PLUGIN_CONFIGS)) {
      if (config.dependencies && config.dependencies.includes(pluginId)) {
        if (this.pluginInstances.has(id)) {
          dependents.push(id);
        }
      }
    }
    
    return dependents;
  }

  /**
   * 重新加载插件
   * @param {string} pluginId - 插件ID
   */
  async reloadPlugin(pluginId) {
    console.log(`🔌 重新加载插件: ${pluginId}`);
    
    try {
      await this.unloadPlugin(pluginId);
      await this.loadPlugin(pluginId);
      
      console.log(`✅ 插件重新加载成功: ${pluginId}`);
    } catch (error) {
      console.error(`❌ 插件重新加载失败: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * 获取插件实例
   * @param {string} pluginId - 插件ID
   */
  getPlugin(pluginId) {
    return this.pluginInstances.get(pluginId);
  }

  /**
   * 获取所有已加载的插件
   */
  getAllPlugins() {
    return Array.from(this.pluginInstances.entries()).map(([id, instance]) => ({
      id,
      instance,
      config: PLUGIN_CONFIGS[id]
    }));
  }

  /**
   * 检查插件是否已加载
   * @param {string} pluginId - 插件ID
   */
  isPluginLoaded(pluginId) {
    return this.pluginInstances.has(pluginId);
  }

  /**
   * 设置插件热重载（开发模式）
   */
  setupHotReload() {
    if (!this.isDevelopmentMode()) return;

    console.log('🔌 启用插件热重载');
    
    // 监听键盘快捷键 Ctrl+Shift+R 重新加载所有插件
    document.addEventListener('keydown', async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('🔌 手动触发插件重新加载');
        await this.reloadAllPlugins();
      }
    });

    // 添加开发者工具面板 - 已禁用
    // this.createDeveloperPanel();
  }

  /**
   * 重新加载所有插件
   */
  async reloadAllPlugins() {
    const pluginIds = Array.from(this.pluginInstances.keys());
    
    for (const pluginId of pluginIds) {
      try {
        await this.reloadPlugin(pluginId);
      } catch (error) {
        console.error(`🔌 重新加载插件失败: ${pluginId}`, error);
      }
    }
  }

  /**
   * 创建开发者面板
   */
  createDeveloperPanel() {
    const panel = document.createElement('div');
    panel.id = 'plugin-developer-panel';
    panel.innerHTML = `
      <div style="
        position: fixed;
        bottom: 10px;
        left: 10px;
        width: 250px;
        background: #2d3748;
        color: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 1001;
        font-size: 12px;
        font-family: monospace;
      ">
        <h4 style="margin: 0 0 10px 0; color: #63b3ed;">🔌 插件开发面板</h4>
        <div id="plugin-list" style="margin-bottom: 10px;"></div>
        <button id="reload-all-plugins" style="
          padding: 5px 10px;
          border: none;
          background: #4299e1;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">重新加载所有</button>
        <button id="toggle-plugin-panel" style="
          padding: 5px 10px;
          border: none;
          background: #718096;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">隐藏</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 更新插件列表
    this.updateDeveloperPanel();
    
    // 绑定事件
    document.getElementById('reload-all-plugins').addEventListener('click', () => {
      this.reloadAllPlugins();
    });
    
    document.getElementById('toggle-plugin-panel').addEventListener('click', () => {
      const list = document.getElementById('plugin-list');
      const button = document.getElementById('toggle-plugin-panel');
      
      if (list.style.display === 'none') {
        list.style.display = 'block';
        button.textContent = '隐藏';
      } else {
        list.style.display = 'none';
        button.textContent = '显示';
      }
    });
  }

  /**
   * 更新开发者面板
   */
  updateDeveloperPanel() {
    const list = document.getElementById('plugin-list');
    if (!list) return;

    const plugins = this.getAllPlugins();
    list.innerHTML = plugins.map(({ id, config }) => `
      <div style="margin-bottom: 5px; padding: 5px; background: #4a5568; border-radius: 4px;">
        <div style="font-weight: bold; color: #68d391;">${id}</div>
        <div style="font-size: 10px; color: #a0aec0;">${config?.name || '未知插件'}</div>
        <button onclick="window.pluginLoader.reloadPlugin('${id}')" style="
          font-size: 10px;
          padding: 2px 6px;
          border: none;
          background: #ed8936;
          color: white;
          border-radius: 2px;
          cursor: pointer;
          margin-top: 3px;
        ">重新加载</button>
      </div>
    `).join('');
  }

  /**
   * 触发插件事件
   */
  emitPluginEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * 检查是否为开发模式
   */
  isDevelopmentMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.search.includes('dev=true') ||
           localStorage.getItem('plugin-dev-mode') === 'true';
  }

  /**
   * 获取插件统计信息
   */
  getStats() {
    return {
      totalPlugins: Object.keys(PLUGIN_CONFIGS).length,
      loadedPlugins: this.pluginInstances.size,
      enabledPlugins: Object.values(PLUGIN_CONFIGS).filter(config => config.enabled).length,
      loadedPluginIds: Array.from(this.pluginInstances.keys())
    };
  }

  /**
   * 清理插件加载器
   */
  async destroy() {
    console.log('🔌 清理插件加载器');
    
    // 卸载所有插件
    const pluginIds = Array.from(this.pluginInstances.keys());
    for (const pluginId of pluginIds) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`🔌 清理插件失败: ${pluginId}`, error);
      }
    }
    
    // 移除开发者面板
    const panel = document.getElementById('plugin-developer-panel');
    if (panel) {
      panel.remove();
    }
  }
}

// 创建全局插件加载器实例
export const pluginLoader = new PluginLoader();

// 将插件加载器添加到全局对象，方便调试
if (typeof window !== 'undefined') {
  window.pluginLoader = pluginLoader;
}