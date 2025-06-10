/**
 * Markdown处理模块
 * 负责Markdown内容的解析、预处理和渲染
 */

class MarkdownProcessor {
    constructor() {
        this.initializeMarked();
    }

    /**
     * 初始化Marked.js配置
     */
    initializeMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: false
            });
            console.log('✅ Marked.js配置完成');
        } else {
            console.warn('⚠️ Marked.js未加载');
        }
    }

    /**
     * 预处理Markdown内容
     * @param {string} content - 原始Markdown内容
     * @returns {string} 处理后的内容
     */
    preprocessMarkdown(content) {
        // 处理包含特殊字符的加粗文本
        content = content.replace(/\*\*([^*]+(?:\([^)]*\)[^*]*)*)\*\*/g, '<strong>$1</strong>');
        
        // 处理LaTeX内容
        content = MathJaxUtils.preprocessLatex(content);
        
        // 处理换行
        content = content.replace(/\r\n/g, '\n');
        
        return content;
    }

    /**
     * 渲染Markdown内容为HTML
     * @param {string} content - Markdown内容
     * @returns {string} HTML内容
     */
    renderMarkdown(content) {
        if (typeof marked === 'undefined') {
            throw new Error('Marked.js未加载');
        }

        // 预处理内容
        const processedContent = this.preprocessMarkdown(content);
        
        // 渲染为HTML
        const html = marked.parse(processedContent);
        
        console.log('✅ Markdown渲染完成');
        return html;
    }

    /**
     * 分析Markdown内容
     * @param {string} content - Markdown内容
     * @returns {Object} 分析结果
     */
    analyzeMarkdown(content) {
        const lines = content.split('\n');
        const headings = content.match(/^#+\s+.+$/gm) || [];
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        const mathFormulas = {
            inline: content.match(/\$[^$]+\$/g) || [],
            block: content.match(/\$\$[\s\S]*?\$\$/g) || []
        };
        const links = content.match(/\[.*?\]\(.*?\)/g) || [];
        const images = content.match(/!\[.*?\]\(.*?\)/g) || [];
        const boldText = content.match(/\*\*[^*]+\*\*/g) || [];
        const italicText = content.match(/\*[^*]+\*/g) || [];
        
        return {
            '输入模式': 'Markdown直接输入',
            '内容长度': content.length + ' 字符',
            '行数': lines.length + ' 行',
            '标题数量': headings.length + ' 个',
            '代码块': codeBlocks.length + ' 个',
            '行内公式': mathFormulas.inline.length + ' 个',
            '块级公式': mathFormulas.block.length + ' 个',
            '链接': links.length + ' 个',
            '图片': images.length + ' 个',
            '加粗文本': boldText.length + ' 个',
            '斜体文本': italicText.length + ' 个',
            '处理时间': new Date().toLocaleString()
        };
    }

    /**
     * 生成文档结构
     * @param {string} content - Markdown内容
     * @returns {string} HTML格式的文档结构
     */
    generateDocumentStructure(content) {
        const headings = content.match(/^#+\s+.+$/gm) || [];
        
        if (headings.length === 0) {
            return '';
        }

        let structureHtml = '<h5>📋 文档结构</h5><ul>';
        headings.forEach(heading => {
            const level = heading.match(/^#+/)[0].length;
            const title = heading.replace(/^#+\s+/, '');
            const indent = '&nbsp;'.repeat((level - 1) * 4);
            structureHtml += `<li>${indent}${title}</li>`;
        });
        structureHtml += '</ul>';
        
        return structureHtml;
    }

    /**
     * 转换标准语法为渲染器格式
     * @param {string} content - 标准Markdown内容
     * @returns {Object} JSON格式的数据
     */
    convertToRendererFormat(content) {
        // 转换矩阵换行符：将标准的 \\ 转换为 \\\\
        let convertedContent = content.replace(/(?<!\\)\\\\(?!\\)/g, '\\\\\\\\');
        
        // 创建JSON格式
        return {
            "title": "用户输入文档",
            "context": convertedContent,
            "author": "用户",
            "timestamp": new Date().toISOString(),
            "mode": "converted"
        };
    }

    /**
     * 检测内容中的问题
     * @param {string} content - 内容
     * @returns {Array} 问题列表
     */
    detectIssues(content) {
        const issues = [];
        
        // 检测未闭合的数学公式
        const dollarSigns = (content.match(/\$/g) || []).length;
        if (dollarSigns % 2 !== 0) {
            issues.push('检测到未闭合的行内数学公式（$符号不匹配）');
        }
        
        // 检测未闭合的块级公式
        const doubleDollarStart = (content.match(/\$\$/g) || []).length;
        if (doubleDollarStart % 2 !== 0) {
            issues.push('检测到未闭合的块级数学公式（$$符号不匹配）');
        }
        
        // 检测可能的编码问题
        if (content.includes('â€™') || content.includes('â€œ') || content.includes('â€')) {
            issues.push('检测到可能的编码问题，建议检查特殊字符');
        }
        
        // 检测过长的行
        const lines = content.split('\n');
        const longLines = lines.filter(line => line.length > 200);
        if (longLines.length > 0) {
            issues.push(`检测到${longLines.length}行过长的内容，可能影响显示效果`);
        }
        
        return issues;
    }
}

// 导出到全局
window.MarkdownProcessor = MarkdownProcessor;