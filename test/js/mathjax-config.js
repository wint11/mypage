/**
 * MathJax配置模块
 * 负责数学公式渲染的配置和初始化
 */

// MathJax 配置
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        packages: {'[+]': ['ams', 'amsmath', 'amssymb', 'newcommand', 'configmacros', 'action', 'autoload', 'base', 'cases']},
        macros: {
            // 常用数学符号
            R: '\\mathbb{R}',
            C: '\\mathbb{C}',
            N: '\\mathbb{N}',
            Z: '\\mathbb{Z}',
            Q: '\\mathbb{Q}'
        }
    },
    chtml: {
        scale: 1.0,
        minScale: 0.5,
        matchFontHeight: false,
        displayAlign: 'center',
        displayIndent: '0em',
        adaptiveCSS: true
    },
    svg: {
        scale: 1.0,
        minScale: 0.5,
        matchFontHeight: false,
        displayAlign: 'center',
        displayIndent: '0em',
        fontCache: 'local'
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
    },
    startup: {
        ready: () => {
            console.log('MathJax已加载，支持标准矩阵和方程组渲染');
            window.mathJaxReady = true;
            MathJax.startup.defaultReady();
        },
        pageReady: () => {
            console.log('MathJax页面就绪');
            return MathJax.startup.defaultPageReady();
        }
    }
};

// 全局标记MathJax加载状态
window.mathJaxReady = false;

// 等待MathJax加载完成后再定义工具类
window.addEventListener('load', function() {
    // 如果MathJax还没准备好，等待一下
    if (!window.mathJaxReady) {
        const checkInterval = setInterval(() => {
            if (window.mathJaxReady) {
                clearInterval(checkInterval);
                console.log('✅ MathJax工具类已就绪');
            }
        }, 100);
    }
});

/**
 * MathJax工具类
 * 提供MathJax相关的实用方法
 */
class MathJaxUtils {
    /**
     * 渲染指定元素中的数学公式
     * @param {HTMLElement} element - 要渲染的元素
     * @returns {Promise} 渲染完成的Promise
     */
    static async renderMath(element) {
        if (!window.MathJax) {
            throw new Error('MathJax未加载');
        }

        try {
            // MathJax 3.x 版本
            if (MathJax.typesetPromise) {
                await MathJax.typesetPromise([element]);
                console.log('✅ 使用MathJax typesetPromise方法渲染完成');
                return true;
            }
            // 其他版本尝试
            else if (MathJax.typeset) {
                MathJax.typeset([element]);
                console.log('✅ 使用MathJax typeset方法渲染完成');
                return true;
            }
            // 兼容旧版本
            else if (MathJax.Hub && MathJax.Hub.Queue) {
                return new Promise((resolve, reject) => {
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, element], () => {
                        console.log('✅ 使用MathJax Hub方法渲染完成');
                        resolve(true);
                    });
                });
            }
            else {
                console.warn('⚠️ MathJax API不兼容');
                return false;
            }
        } catch (error) {
            console.error('MathJax渲染过程中发生错误:', error);
            throw error;
        }
    }

    /**
     * 检查MathJax是否已准备就绪
     * @returns {boolean} 是否就绪
     */
    static isReady() {
        return window.MathJax && 
               (MathJax.typesetPromise || MathJax.typeset || (MathJax.Hub && MathJax.Hub.Queue));
    }

    /**
     * 等待MathJax加载完成
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<boolean>} 是否加载成功
     */
    static async waitForMathJax(timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timeout = 10000; // 10秒超时
            const startTime = Date.now();
            
            const checkReady = () => {
                if (window.mathJaxReady) {
                    console.log('✅ MathJax已就绪');
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    console.error('❌ MathJax加载超时');
                    reject(new Error('MathJax加载超时'));
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            checkReady();
        });
    }

    /**
     * 预处理LaTeX内容，修复常见问题
     * @param {string} content - 原始内容
     * @returns {string} 处理后的内容
     */
    static preprocessLatex(content) {
        // 修复双反斜杠问题
        content = content.replace(/(?<!\\)\\\\(?!\\)/g, '\\\\\\\\');
        
        // 修复常见的LaTeX命令
        content = content.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
        content = content.replace(/\\emph\{([^}]+)\}/g, '*$1*');
        
        return content;
    }
}

// 导出到全局
window.MathJaxUtils = MathJaxUtils;