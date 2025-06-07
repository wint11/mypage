/**
 * 基础模块类 - 所有功能模块的基类
 */
class BaseModule {
    constructor(config = {}) {
        this.config = config;
        this.apiConfig = config.apiConfig || {};
        this.isInitialized = false;
        this.isActive = false;
    }

    /**
     * 模块初始化 - 子类需要重写此方法
     */
    async init() {
        this.bindEvents();
        this.isInitialized = true;
    }

    /**
     * 绑定事件 - 子类需要重写此方法
     */
    bindEvents() {
        // 子类实现具体的事件绑定逻辑
    }

    /**
     * 激活模块 - 当模块被选中时调用
     */
    /**
     * 激活模块
     */
    activate() {
        console.log(`激活模块: ${this.moduleName}`);
        this.isActive = true;
        this.onActivate();
        console.log(`开始绑定事件: ${this.moduleName}`);
        this.bindEvents();
        console.log(`事件绑定完成: ${this.moduleName}`);
    }

    /**
     * 停用模块 - 当模块被切换时调用
     */
    deactivate() {
        this.isActive = false;
        this.onDeactivate();
    }

    /**
     * 模块激活时的回调 - 子类可以重写
     */
    onActivate() {
        // 子类可以重写此方法
    }

    /**
     * 模块停用时的回调 - 子类可以重写
     */
    onDeactivate() {
        // 子类可以重写此方法
    }

    /**
     * 安全绑定事件
     * @param {string} elementId 元素ID
     * @param {Function} handler 事件处理函数
     * @param {string} eventType 事件类型，默认为'click'
     */
    bindEventSafely(elementId, handler, eventType = 'click') {
        console.log(`尝试绑定事件: ${elementId}`);
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`找到元素 ${elementId}，绑定${eventType}事件`);
            element.addEventListener(eventType, handler.bind(this));
            console.log(`事件绑定成功: ${elementId}`);
        } else {
            console.warn(`元素 ${elementId} 未找到`);
        }
    }

    /**
     * 获取表单数据
     * @param {string} formId 表单ID或选择器
     * @returns {Object} 表单数据对象
     */
    getFormData(formId) {
        const form = typeof formId === 'string' ? document.getElementById(formId) || document.querySelector(formId) : formId;
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    /**
     * 显示加载状态
     * @param {boolean} show 是否显示
     */
    showLoading(show = true) {
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            if (show) {
                const modal = new bootstrap.Modal(loadingModal);
                modal.show();
            } else {
                const modal = bootstrap.Modal.getInstance(loadingModal);
                if (modal) {
                    modal.hide();
                }
            }
        }
    }

    /**
     * 显示警告提示
     * @param {string} message 提示消息
     * @param {string} type 提示类型 (success, warning, danger, info)
     */
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || document.body;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alertDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * 调用AI API
     * @param {string} prompt 提示词
     * @returns {Promise<string>} AI响应
     */
    async callAI(prompt) {
        try {
            const response = await fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.apiConfig.model,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI API调用失败:', error);
            throw error;
        }
    }

    /**
     * Markdown转HTML
     * @param {string} markdown Markdown文本
     * @returns {string} HTML文本
     */
    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\*\*(.*)\*\*$/gim, '<strong>$1</strong>')
            .replace(/^\*(.*)\*$/gim, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');
    }

    /**
     * 下载文件
     * @param {string} content 文件内容
     * @param {string} filename 文件名
     * @param {string} mimeType MIME类型
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 导出基础模块类
window.BaseModule = BaseModule;