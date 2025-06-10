/**
 * UI控制器模块
 * 负责界面交互、消息显示和用户体验
 */

class UIController {
    constructor() {
        this.elements = {
            userFriendlyInput: null,
            jsonInput: null,
            output: null,
            parseInfo: null,
            pdfButton: null
        };
        this.initializeElements();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.elements.userFriendlyInput = document.getElementById('userFriendlyInput');
        this.elements.jsonInput = document.getElementById('jsonInput');
        this.elements.output = document.getElementById('output');
        this.elements.parseInfo = document.getElementById('parseInfo');
        this.elements.pdfButton = document.getElementById('pdfButton');
        
        console.log('✅ UI控制器初始化完成');
    }

    /**
     * 显示错误消息
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 错误消息
     */
    showError(container, message) {
        if (!container) return;
        container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }

    /**
     * 显示成功消息
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 成功消息
     */
    showSuccess(container, message) {
        if (!container) return;
        const currentContent = container.innerHTML;
        container.innerHTML = currentContent + `<div class="success-message">✅ ${message}</div>`;
    }

    /**
     * 显示警告消息
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 警告消息
     */
    showWarning(container, message) {
        if (!container) return;
        const currentContent = container.innerHTML;
        container.innerHTML = currentContent + `<div class="warning-message">⚠️ ${message}</div>`;
    }

    /**
     * 显示信息消息
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 信息消息
     */
    showInfo(container, message) {
        if (!container) return;
        const currentContent = container.innerHTML;
        container.innerHTML = currentContent + `<div class="info-message">ℹ️ ${message}</div>`;
    }

    /**
     * 清空容器内容
     * @param {HTMLElement} container - 容器元素
     */
    clearContainer(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * 设置按钮状态
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} enabled - 是否启用
     * @param {string} text - 按钮文本
     */
    setButtonState(button, enabled, text) {
        if (!button) return;
        
        button.disabled = !enabled;
        if (text) {
            button.innerHTML = text;
        }
    }

    /**
     * 启用PDF按钮
     */
    enablePDFButton() {
        this.setButtonState(this.elements.pdfButton, true, '📄 生成PDF下载');
    }

    /**
     * 禁用PDF按钮
     */
    disablePDFButton() {
        this.setButtonState(this.elements.pdfButton, false, '📄 生成PDF下载');
    }

    /**
     * 设置PDF按钮为加载状态
     */
    setPDFButtonLoading() {
        this.setButtonState(this.elements.pdfButton, false, '⏳ 生成中...');
    }

    /**
     * 显示解析信息（JSON模式）
     * @param {Object} data - JSON数据
     */
    displayParseInfo(data) {
        if (!this.elements.parseInfo) return;
        
        const info = {
            '数据类型': typeof data,
            '包含属性': Object.keys(data).join(', '),
            'Context长度': data.context ? data.context.length + ' 字符' : '未找到',
            '标题': data.title || '未设置',
            '作者': data.author || '未设置',
            '时间戳': data.timestamp || '未设置'
        };
        
        let infoHtml = '<h4>📊 JSON数据解析详情</h4><ul>';
        for (const [key, value] of Object.entries(info)) {
            infoHtml += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        infoHtml += '</ul>';
        
        this.elements.parseInfo.innerHTML = infoHtml;
    }

    /**
     * 显示Markdown信息
     * @param {Object} analysisResult - Markdown分析结果
     * @param {string} structure - 文档结构HTML
     * @param {Array} issues - 问题列表
     */
    displayMarkdownInfo(analysisResult, structure = '', issues = []) {
        if (!this.elements.parseInfo) return;
        
        let infoHtml = '<h4>📊 Markdown内容分析</h4><ul>';
        for (const [key, value] of Object.entries(analysisResult)) {
            infoHtml += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        infoHtml += '</ul>';
        
        // 添加文档结构
        if (structure) {
            infoHtml += structure;
        }
        
        // 添加问题提示
        if (issues.length > 0) {
            infoHtml += '<h5>⚠️ 检测到的问题</h5><ul>';
            issues.forEach(issue => {
                infoHtml += `<li class="warning-text">${issue}</li>`;
            });
            infoHtml += '</ul>';
        }
        
        this.elements.parseInfo.innerHTML = infoHtml;
    }

    /**
     * 获取用户友好输入内容
     * @returns {string} 输入内容
     */
    getUserFriendlyInput() {
        return this.elements.userFriendlyInput ? this.elements.userFriendlyInput.value.trim() : '';
    }

    /**
     * 获取JSON输入内容
     * @returns {string} JSON内容
     */
    getJSONInput() {
        return this.elements.jsonInput ? this.elements.jsonInput.value.trim() : '';
    }

    /**
     * 设置JSON输入内容
     * @param {string} content - JSON内容
     */
    setJSONInput(content) {
        if (this.elements.jsonInput) {
            this.elements.jsonInput.value = content;
        }
    }

    /**
     * 设置用户友好输入内容
     * @param {string} content - 输入内容
     */
    setUserFriendlyInput(content) {
        if (this.elements.userFriendlyInput) {
            this.elements.userFriendlyInput.value = content;
        }
    }

    /**
     * 设置输出内容
     * @param {string} content - HTML内容
     */
    setOutput(content) {
        if (this.elements.output) {
            this.elements.output.innerHTML = content;
        }
    }

    /**
     * 获取输出元素
     * @returns {HTMLElement} 输出元素
     */
    getOutputElement() {
        return this.elements.output;
    }

    /**
     * 显示加载状态
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 加载消息
     */
    showLoading(container, message = '加载中...') {
        if (!container) return;
        container.innerHTML = `
            <div class="loading-message">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>} 是否成功
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('复制失败:', error);
            // 降级方案
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackError) {
                console.error('降级复制也失败:', fallbackError);
                return false;
            }
        }
    }

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @returns {boolean} 用户选择
     */
    confirm(message) {
        return window.confirm(message);
    }

    /**
     * 显示提示框
     * @param {string} message - 提示消息
     */
    alert(message) {
        window.alert(message);
    }

    /**
     * 滚动到指定元素
     * @param {HTMLElement} element - 目标元素
     * @param {string} behavior - 滚动行为
     */
    scrollToElement(element, behavior = 'smooth') {
        if (element) {
            element.scrollIntoView({ behavior, block: 'start' });
        }
    }

    /**
     * 添加CSS样式
     * @param {string} css - CSS内容
     */
    addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * 初始化示例数据
     */
    initializeExampleData() {
        // 用户友好输入区域示例
        const userFriendlyExample = `# 矩阵运算示例

这是一个**标准Markdown**文档，包含数学公式。

## 基本矩阵

二阶矩阵：

$$\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix}$$

## 矩阵乘法

$$\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix} \\cdot \\begin{bmatrix}
5 & 6 \\\\
7 & 8
\\end{bmatrix} = \\begin{bmatrix}
19 & 22 \\\\
43 & 50
\\end{bmatrix}$$

> **提示**：使用标准的两个反斜杠 \\\\ 作为矩阵换行符。`;
        
        this.setUserFriendlyInput(userFriendlyExample);
        
        // JSON输入区域示例
        const jsonExample = {
            "title": "矩阵与方程组渲染测试",
            "context": "# 矩阵与方程组渲染测试\n\n本文档专门测试矩阵、方程组等复杂数学结构的渲染效果。\n\n## 1. 矩阵基本运算\n\n### 矩阵加法\n\n两个同型矩阵的加法：\n\n$$\\begin{bmatrix}\n1 & 2 \\\\\\\\\n3 & 4\n\\end{bmatrix} + \\begin{bmatrix}\n5 & 6 \\\\\\\\\n7 & 8\n\\end{bmatrix} = \\begin{bmatrix}\n6 & 8 \\\\\\\\\n10 & 12\n\\end{bmatrix}$$",
            "author": "数学渲染测试",
            "timestamp": new Date().toISOString(),
            "version": "2.0",
            "tags": ["矩阵", "方程组", "线性代数", "渲染测试"]
        };
        
        this.setJSONInput(JSON.stringify(jsonExample, null, 2));
    }
}

// 导出到全局
window.UIController = UIController;