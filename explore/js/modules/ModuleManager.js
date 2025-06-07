/**
 * 模块管理器 - 负责管理所有功能模块的加载和初始化
 */
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
        this.config = {
            apiConfig: {
                baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                apiKey: '32c33497-91ee-48bb-ae39-f59eac806506',
                model: 'doubao-1-5-pro-256k-250115'
            }
        };
    }

    /**
     * 注册模块
     * @param {string} name 模块名称
     * @param {Object} moduleClass 模块类
     */
    registerModule(name, moduleClass) {
        this.modules.set(name, moduleClass);
    }

    /**
     * 初始化所有模块
     */
    async init() {
        // 初始化所有已注册的模块
        for (const [name, ModuleClass] of this.modules) {
            try {
                console.log(`开始初始化模块: ${name}`, ModuleClass);
                const moduleInstance = new ModuleClass(this.config);
                console.log(`模块实例创建成功: ${name}`, moduleInstance);
                console.log(`模块实例方法检查:`, {
                    hasActivate: typeof moduleInstance.activate === 'function',
                    hasDeactivate: typeof moduleInstance.deactivate === 'function',
                    hasInit: typeof moduleInstance.init === 'function'
                });
                await moduleInstance.init();
                this.modules.set(name, moduleInstance);
                console.log(`模块 ${name} 初始化成功`);
            } catch (error) {
                console.error(`模块 ${name} 初始化失败:`, error);
            }
        }
    }



    /**
     * 切换到指定模块
     * @param {string} moduleName 模块名称
     */
    switchModule(moduleName) {
        console.log(`切换到模块: ${moduleName}`);
        
        // 停用当前模块
        if (this.currentModule && typeof this.currentModule.deactivate === 'function') {
            console.log(`停用当前模块: ${this.currentModule.moduleName}`);
            this.currentModule.deactivate();
        }

        // 激活新模块
        const module = this.modules.get(moduleName);
        if (module) {
            console.log(`激活模块: ${moduleName}`, module);
            this.currentModule = module;
            if (typeof module.activate === 'function') {
                module.activate();
            } else {
                console.error(`模块 ${moduleName} 没有 activate 方法`);
            }
        } else {
            console.error(`模块 ${moduleName} 未找到`);
        }
    }

    /**
     * 获取模块实例
     * @param {string} name 模块名称
     * @returns {Object} 模块实例
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * 获取当前激活的模块
     * @returns {Object} 当前模块实例
     */
    getCurrentModule() {
        return this.modules.get(this.currentModule);
    }
}

// 导出模块管理器
window.ModuleManager = ModuleManager;