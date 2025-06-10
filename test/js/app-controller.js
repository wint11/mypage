/**
 * 主应用控制器
 * 整合所有模块，提供统一的API接口
 */

class AppController {
    constructor() {
        this.ui = null;
        this.markdownProcessor = null;
        this.pdfGenerator = null;
        this.mathJaxUtils = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🚀 开始初始化PDF渲染器应用...');
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化各个模块
            this.ui = new UIController();
            this.markdownProcessor = new MarkdownProcessor();
            this.pdfGenerator = new PDFGenerator();
            this.mathJaxUtils = MathJaxUtils; // 使用静态类
            
            // 等待MathJax加载完成
            await this.mathJaxUtils.waitForMathJax();
            
            // 绑定事件
            this.bindEvents();
            
            // 初始化示例数据
            this.ui.initializeExampleData();
            
            this.isInitialized = true;
            console.log('✅ PDF渲染器应用初始化完成');
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            if (this.ui) {
                this.ui.showError(document.body, '应用初始化失败: ' + error.message);
            }
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 转换并渲染按钮
        const convertBtn = document.getElementById('convertButton');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convertAndRender());
        }

        // 复制转换结果按钮
        const copyConvertedBtn = document.getElementById('copyConvertedButton');
        if (copyConvertedBtn) {
            copyConvertedBtn.addEventListener('click', () => this.copyConverted());
        }

        // 渲染按钮
        const renderBtn = document.getElementById('renderButton');
        if (renderBtn) {
            renderBtn.addEventListener('click', () => this.renderContent());
        }

        // PDF生成按钮
        const pdfBtn = document.getElementById('pdfButton');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.generatePDF());
        }

        console.log('✅ 事件绑定完成');
    }

    /**
     * 转换标准语法并渲染
     */
    async convertAndRender() {
        try {
            const userInput = this.ui.getUserFriendlyInput();
            
            if (!userInput.trim()) {
                this.ui.showError(this.ui.getOutputElement(), '请输入要转换的内容');
                return;
            }
            
            console.log('📝 用户输入:', userInput);
            
            // 转换为渲染器格式
            const convertedData = this.markdownProcessor.convertToRendererFormat(userInput);
            console.log('🔄 转换后数据:', convertedData);
            
            // 更新JSON输入区域
            this.ui.setJSONInput(JSON.stringify(convertedData, null, 2));
            
            // 自动渲染
            await this.renderContent();
            
            this.ui.showSuccess(this.ui.getOutputElement(), '转换并渲染完成');
            
        } catch (error) {
            console.error('转换失败:', error);
            this.ui.showError(this.ui.getOutputElement(), '转换失败: ' + error.message);
        }
    }

    /**
     * 复制转换结果
     */
    async copyConverted() {
        try {
            const jsonContent = this.ui.getJSONInput();
            
            if (!jsonContent) {
                this.ui.alert('没有可复制的内容');
                return;
            }
            
            const success = await this.ui.copyToClipboard(jsonContent);
            
            if (success) {
                this.ui.showSuccess(this.ui.getOutputElement(), '转换结果已复制到剪贴板');
            } else {
                this.ui.showError(this.ui.getOutputElement(), '复制失败，请手动复制');
            }
            
        } catch (error) {
            console.error('复制失败:', error);
            this.ui.showError(this.ui.getOutputElement(), '复制失败: ' + error.message);
        }
    }

    /**
     * 渲染内容
     */
    async renderContent() {
        try {
            const jsonInput = this.ui.getJSONInput();
            const outputElement = this.ui.getOutputElement();
            
            if (!jsonInput) {
                this.ui.showError(outputElement, '请输入JSON数据或使用标准输入区域');
                return;
            }
            
            // 显示加载状态
            this.ui.showLoading(outputElement, '正在渲染内容...');
            this.ui.disablePDFButton();
            
            // 解析JSON数据
            let data;
            try {
                data = JSON.parse(jsonInput);
            } catch (parseError) {
                throw new Error('JSON格式错误: ' + parseError.message);
            }
            
            // 检查数据结构
            if (!data.context) {
                throw new Error('JSON数据中缺少context字段');
            }
            
            console.log('📝 输入内容:', data.context);
            
            // 预处理Markdown内容
            const processedContent = this.markdownProcessor.preprocessMarkdown(data.context);
            console.log('🔄 预处理后内容:', processedContent);
            
            // 渲染Markdown为HTML
            const htmlContent = this.markdownProcessor.renderMarkdown(processedContent);
            console.log('🎨 渲染后HTML:', htmlContent);
            
            // 检查渲染结果是否为空
            if (!htmlContent || !htmlContent.trim()) {
                this.ui.showError(outputElement, '渲染结果为空，请检查输入内容格式');
                return;
            }
            
            // 设置输出内容
            this.ui.setOutput(htmlContent);
            
            // 渲染数学公式
            await this.mathJaxUtils.renderMath(outputElement);
            
            // 显示解析信息
            this.ui.displayParseInfo(data);
            
            // 分析Markdown内容
            const analysis = this.markdownProcessor.analyzeMarkdown(data.context);
            const structure = this.markdownProcessor.generateDocumentStructure(data.context);
            const issues = this.markdownProcessor.detectIssues(data.context);
            
            this.ui.displayMarkdownInfo(analysis, structure, issues);
            
            // 启用PDF按钮
            this.ui.enablePDFButton();
            
            this.ui.showSuccess(outputElement, '渲染完成');
            
        } catch (error) {
            console.error('渲染失败:', error);
            this.ui.showError(this.ui.getOutputElement(), '渲染失败: ' + error.message);
            this.ui.disablePDFButton();
        }
    }

    /**
     * 生成PDF
     */
    async generatePDF() {
        try {
            const outputElement = this.ui.getOutputElement();
            
            if (!outputElement || !outputElement.innerHTML.trim()) {
                this.ui.showError(outputElement, '没有可生成PDF的内容，请先渲染内容');
                return;
            }
            
            // 验证内容是否适合PDF生成
            if (!this.pdfGenerator.validateContent(outputElement)) {
                this.ui.showWarning(outputElement, 'PDF内容可能存在问题，但将继续生成');
            }
            
            // 设置按钮为加载状态
            this.ui.setPDFButtonLoading();
            
            // 生成PDF
            const success = await this.pdfGenerator.generatePDF(outputElement);
            
            if (success) {
                this.ui.showSuccess(outputElement, 'PDF生成成功并已开始下载');
            } else {
                this.ui.showError(outputElement, 'PDF生成失败');
            }
            
        } catch (error) {
            console.error('PDF生成失败:', error);
            this.ui.showError(this.ui.getOutputElement(), 'PDF生成失败: ' + error.message);
        } finally {
            // 恢复按钮状态
            this.ui.enablePDFButton();
        }
    }

    /**
     * 预览PDF（不下载）
     */
    async previewPDF() {
        try {
            const outputElement = this.ui.getOutputElement();
            
            if (!outputElement || !outputElement.innerHTML.trim()) {
                this.ui.showError(outputElement, '没有可预览的内容，请先渲染内容');
                return;
            }
            
            this.ui.setPDFButtonLoading();
            
            const blob = await this.pdfGenerator.previewPDF(outputElement);
            
            if (blob) {
                // 在新窗口中打开PDF预览
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                
                this.ui.showSuccess(outputElement, 'PDF预览已在新窗口中打开');
                
                // 清理URL对象
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            } else {
                this.ui.showError(outputElement, 'PDF预览生成失败');
            }
            
        } catch (error) {
            console.error('PDF预览失败:', error);
            this.ui.showError(this.ui.getOutputElement(), 'PDF预览失败: ' + error.message);
        } finally {
            this.ui.enablePDFButton();
        }
    }

    /**
     * 重置应用状态
     */
    reset() {
        try {
            this.ui.setUserFriendlyInput('');
            this.ui.setJSONInput('');
            this.ui.setOutput('');
            this.ui.clearContainer(this.ui.elements.parseInfo);
            this.ui.disablePDFButton();
            
            this.ui.showInfo(this.ui.getOutputElement(), '应用状态已重置');
            
        } catch (error) {
            console.error('重置失败:', error);
            this.ui.showError(this.ui.getOutputElement(), '重置失败: ' + error.message);
        }
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态信息
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            mathJaxReady: this.mathJaxUtils ? this.mathJaxUtils.isReady() : false,
            pdfGeneratorStatus: this.pdfGenerator ? this.pdfGenerator.getStatus() : null,
            hasContent: this.ui ? !!this.ui.getOutputElement()?.innerHTML.trim() : false
        };
    }

    /**
     * 导出配置
     * @returns {Object} 当前配置
     */
    exportConfig() {
        return {
            userInput: this.ui ? this.ui.getUserFriendlyInput() : '',
            jsonInput: this.ui ? this.ui.getJSONInput() : '',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * 导入配置
     * @param {Object} config - 配置对象
     */
    importConfig(config) {
        try {
            if (config.userInput && this.ui) {
                this.ui.setUserFriendlyInput(config.userInput);
            }
            
            if (config.jsonInput && this.ui) {
                this.ui.setJSONInput(config.jsonInput);
            }
            
            this.ui.showSuccess(this.ui.getOutputElement(), '配置导入成功');
            
        } catch (error) {
            console.error('配置导入失败:', error);
            this.ui.showError(this.ui.getOutputElement(), '配置导入失败: ' + error.message);
        }
    }
}

// 全局应用实例
let app = null;

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new AppController();
        window.app = app; // 导出到全局
    });
} else {
    app = new AppController();
    window.app = app;
}

// 导出到全局
window.AppController = AppController;