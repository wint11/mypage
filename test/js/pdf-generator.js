/**
 * PDF生成模块
 * 负责将渲染内容转换为PDF文件
 */

class PDFGenerator {
    constructor() {
        this.defaultOptions = {
            margin: 10,
            filename: 'document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                width: 800,
                height: 600
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
    }

    /**
     * 生成PDF文件名
     * @param {string} title - 文档标题
     * @returns {string} 文件名
     */
    generateFileName(title = '渲染结果') {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
        return `${cleanTitle}_${timestamp}.pdf`;
    }

    /**
     * 创建PDF优化样式
     * @returns {HTMLStyleElement} 样式元素
     */
    createPDFStyles() {
        const pdfStyles = document.createElement('style');
        pdfStyles.textContent = `
            .pdf-optimized {
                font-family: 'Times New Roman', serif !important;
                font-size: 14px !important;
                line-height: 1.6 !important;
                color: #000 !important;
                background: white !important;
                padding: 20px !important;
                border: none !important;
                box-shadow: none !important;
                max-width: none !important;
            }
            .pdf-optimized h1, .pdf-optimized h2, .pdf-optimized h3 {
                color: #000 !important;
                page-break-after: avoid !important;
                margin-top: 1em !important;
                margin-bottom: 0.5em !important;
            }
            .pdf-optimized h1 {
                font-size: 24px !important;
                border-bottom: 2px solid #000 !important;
                padding-bottom: 10px !important;
            }
            .pdf-optimized h2 {
                font-size: 20px !important;
                border-bottom: 1px solid #666 !important;
                padding-bottom: 5px !important;
            }
            .pdf-optimized h3 {
                font-size: 18px !important;
            }
            .pdf-optimized p {
                margin: 0.8em 0 !important;
                text-align: justify !important;
            }
            .pdf-optimized mjx-container {
                font-size: 16px !important;
                margin: 0.5em 0 !important;
            }
            .pdf-optimized mjx-container[display="true"] {
                margin: 1em 0 !important;
                page-break-inside: avoid !important;
                text-align: center !important;
            }
            .pdf-optimized table {
                page-break-inside: avoid !important;
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 1em 0 !important;
            }
            .pdf-optimized th, .pdf-optimized td {
                border: 1px solid #000 !important;
                padding: 8px !important;
                text-align: left !important;
            }
            .pdf-optimized th {
                background-color: #f0f0f0 !important;
                font-weight: bold !important;
            }
            .pdf-optimized pre {
                page-break-inside: avoid !important;
                background: #f8f8f8 !important;
                border: 1px solid #ddd !important;
                padding: 10px !important;
                border-radius: 4px !important;
                overflow-x: auto !important;
                font-family: 'Courier New', monospace !important;
                font-size: 12px !important;
            }
            .pdf-optimized code {
                background-color: #f0f0f0 !important;
                padding: 2px 4px !important;
                border-radius: 2px !important;
                font-family: 'Courier New', monospace !important;
                font-size: 12px !important;
            }
            .pdf-optimized blockquote {
                border-left: 4px solid #666 !important;
                margin: 1em 0 !important;
                padding: 0.5em 1em !important;
                background-color: #f9f9f9 !important;
                font-style: italic !important;
            }
            .pdf-optimized ul, .pdf-optimized ol {
                margin: 0.8em 0 !important;
                padding-left: 2em !important;
            }
            .pdf-optimized li {
                margin: 0.3em 0 !important;
            }
            .pdf-optimized strong, .pdf-optimized b {
                font-weight: bold !important;
                color: #000 !important;
            }
            .pdf-optimized em, .pdf-optimized i {
                font-style: italic !important;
            }
            @media print {
                .pdf-optimized {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
            }
            @page {
                margin: 0.5in;
                size: A4;
            }
        `;
        return pdfStyles;
    }

    /**
     * 准备PDF内容
     * @param {HTMLElement} sourceElement - 源元素
     * @returns {HTMLElement} 准备好的容器
     */
    preparePDFContent(sourceElement) {
        console.log('📄 准备PDF内容，源元素:', sourceElement);
        console.log('📄 源元素HTML长度:', sourceElement.innerHTML.length);
        console.log('📄 源元素内容预览:', sourceElement.innerHTML.substring(0, 200) + '...');
        
        // 克隆内容以避免影响原始内容
        const clonedContent = sourceElement.cloneNode(true);
        
        // 移除成功消息和其他非内容元素
        const successMessages = clonedContent.querySelectorAll('.success-message, .error-message, .info-message');
        successMessages.forEach(msg => msg.remove());
        
        console.log('📄 清理后内容长度:', clonedContent.innerHTML.length);
        console.log('📄 清理后内容预览:', clonedContent.innerHTML.substring(0, 200) + '...');
        
        // 检查MathJax元素是否正确克隆
        const originalMathElements = sourceElement.querySelectorAll('mjx-container, .MathJax');
        const clonedMathElements = clonedContent.querySelectorAll('mjx-container, .MathJax');
        console.log('📄 原始MathJax元素数量:', originalMathElements.length);
        console.log('📄 克隆MathJax元素数量:', clonedMathElements.length);
        
        // 添加PDF优化类
        clonedContent.classList.add('pdf-optimized');
        
        // 创建临时容器
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(this.createPDFStyles());
        tempContainer.appendChild(clonedContent);
        
        console.log('📄 最终容器HTML长度:', tempContainer.innerHTML.length);
        
        return tempContainer;
    }

    /**
     * 生成PDF
     * @param {HTMLElement} element - 要转换的元素
     * @param {Object} options - 配置选项
     * @returns {Promise} 生成结果
     */
    async generatePDF(element, options = {}) {
        if (typeof html2pdf === 'undefined') {
            throw new Error('html2pdf.js未加载');
        }

        if (!element || !element.innerHTML.trim()) {
            throw new Error('没有可生成PDF的内容');
        }

        // 合并配置选项
        const finalOptions = {
            ...this.defaultOptions,
            ...options,
            filename: options.filename || this.generateFileName()
        };

        // 准备PDF内容
        const pdfContent = this.preparePDFContent(element);
        
        // 添加到DOM中进行测试（临时）
        document.body.appendChild(pdfContent);
        pdfContent.style.position = 'absolute';
        pdfContent.style.top = '0px';
        pdfContent.style.left = '0px';
        pdfContent.style.zIndex = '9999';
        pdfContent.style.backgroundColor = 'white';
        pdfContent.style.border = '2px solid red';
        pdfContent.style.padding = '20px';
        
        console.log('📄 准备传递给html2pdf的内容:', pdfContent);
        console.log('📄 临时元素实际HTML:', pdfContent.innerHTML);
        console.log('📄 临时元素计算样式:', window.getComputedStyle(pdfContent));
        console.log('📄 html2pdf配置:', finalOptions);
        
        // 等待一下让用户看到临时元素
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // 尝试不同的生成方法
            console.log('📄 尝试方法1: 使用临时元素生成PDF');
            console.log('📄 临时元素内容预览:', pdfContent.innerHTML.substring(0, 200));
            
            // 方法1: 使用准备好的内容
            let result;
            try {
                // 先生成 canvas 查看内容
                const canvas = await html2canvas(pdfContent, finalOptions.html2canvas);
                console.log('📄 Canvas 生成成功:', canvas.width, 'x', canvas.height);
                
                // 检查 canvas 是否有内容
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasContent = imageData.data.some(pixel => pixel !== 255 && pixel !== 0);
                console.log('📄 Canvas 是否有内容:', hasContent);
                
                if (hasContent) {
                    result = await html2pdf().set(finalOptions).from(pdfContent).save();
                    console.log('✅ 方法1成功生成PDF');
                } else {
                    throw new Error('Canvas 内容为空');
                }
            } catch (error) {
                console.log('📄 方法1失败:', error.message, '尝试方法2: 直接使用源元素');
                result = null;
            }
            
            // 如果方法1失败，尝试方法2
            if (!result) {
                try {
                    console.log('📄 尝试方法2: 使用浏览器打印功能');
                    
                    // 创建新窗口用于打印
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>PDF Export</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .math { font-family: 'Times New Roman', serif; }
                                @media print {
                                    body { margin: 0; }
                                    .no-print { display: none; }
                                }
                            </style>
                        </head>
                        <body>
                            ${pdfContent.innerHTML}
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    
                    // 延迟执行打印，让内容加载完成
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 1000);
                    
                    console.log('✅ 方法2: 打印窗口已打开');
                    result = true;
                } catch (error) {
                    console.log('📄 方法2失败:', error.message, '尝试方法3: 创建简单测试内容');
                    result = null;
                }
            }
            
            // 如果方法2也失败，尝试方法3: 最简单的测试
            if (!result) {
                try {
                    console.log('📄 尝试方法3: 使用纯文本内容');
                    
                    const testDiv = document.createElement('div');
                    testDiv.innerHTML = `
                        <div style="padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">PDF 生成测试报告</h1>
                            
                            <h2 style="color: #e74c3c; margin-top: 30px;">测试内容</h2>
                            <p>这是一个 PDF 生成功能的测试文档。如果您能看到这个内容，说明基本的 PDF 生成功能是正常的。</p>
                            
                            <h3 style="color: #27ae60;">功能特性</h3>
                            <ul>
                                <li>支持 HTML 转 PDF</li>
                                <li>支持中文字符显示</li>
                                <li>支持基本的 CSS 样式</li>
                                <li>支持数学公式渲染</li>
                            </ul>
                            
                            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <strong>数学公式示例:</strong><br>
                                E = mc²<br>
                                a² + b² = c²<br>
                                ∫ f(x)dx = F(x) + C
                            </div>
                            
                            <p style="margin-top: 30px; font-style: italic; color: #6c757d;">
                                生成时间: ${new Date().toLocaleString()}
                            </p>
                        </div>
                    `;
                    
                    document.body.appendChild(testDiv);
                    
                    // 使用最简单的配置
                    const simpleOptions = {
                        margin: [10, 10, 10, 10],
                        filename: finalOptions.filename,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { 
                            scale: 1,
                            backgroundColor: '#ffffff',
                            useCORS: true,
                            logging: false
                        },
                        jsPDF: { 
                            unit: 'mm', 
                            format: 'a4', 
                            orientation: 'portrait',
                            compress: true
                        }
                    };
                    
                    console.log('📄 使用配置:', simpleOptions);
                    result = await html2pdf().set(simpleOptions).from(testDiv).save();
                    console.log('✅ 方法3成功生成测试PDF');
                    
                    document.body.removeChild(testDiv);
                } catch (error) {
                    console.error('❌ 方法3也失败了:', error);
                    throw error;
                }
            }
            
            console.log('✅ PDF生成完成:', finalOptions.filename);
            
            // 清理临时元素
            if (document.body.contains(pdfContent)) {
                document.body.removeChild(pdfContent);
            }
            return {
                success: true,
                filename: finalOptions.filename
            };
        } catch (error) {
            console.error('PDF生成失败:', error);
            // 清理临时元素
            if (document.body.contains(pdfContent)) {
                document.body.removeChild(pdfContent);
            }
            throw new Error(`PDF生成失败: ${error.message}`);
        }
    }

    /**
     * 预览PDF（不下载）
     * @param {HTMLElement} element - 要转换的元素
     * @param {Object} options - 配置选项
     * @returns {Promise<Blob>} PDF Blob对象
     */
    async previewPDF(element, options = {}) {
        if (typeof html2pdf === 'undefined') {
            throw new Error('html2pdf.js未加载');
        }

        if (!element || !element.innerHTML.trim()) {
            throw new Error('没有可生成PDF的内容');
        }

        // 合并配置选项（不包含filename）
        const finalOptions = {
            ...this.defaultOptions,
            ...options
        };
        delete finalOptions.filename;

        // 准备PDF内容
        const pdfContent = this.preparePDFContent(element);

        try {
            // 生成PDF Blob
            const pdfBlob = await html2pdf().set(finalOptions).from(pdfContent).outputPdf('blob');
            console.log('✅ PDF预览生成完成');
            return pdfBlob;
        } catch (error) {
            console.error('PDF预览生成失败:', error);
            throw new Error(`PDF预览生成失败: ${error.message}`);
        }
    }

    /**
     * 获取PDF生成状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            html2pdfLoaded: typeof html2pdf !== 'undefined',
            ready: typeof html2pdf !== 'undefined'
        };
    }

    /**
     * 验证内容是否适合PDF生成
     * @param {HTMLElement} element - 要检查的元素
     * @returns {Object} 验证结果
     */
    validateContent(element) {
        const issues = [];
        const warnings = [];
        
        if (!element) {
            issues.push('元素不存在');
            return { valid: false, issues, warnings };
        }
        
        if (!element.innerHTML.trim()) {
            issues.push('元素内容为空');
            return { valid: false, issues, warnings };
        }
        
        // 检查内容大小
        const contentLength = element.innerHTML.length;
        if (contentLength > 1000000) { // 1MB
            warnings.push('内容较大，PDF生成可能需要较长时间');
        }
        
        // 检查图片
        const images = element.querySelectorAll('img');
        if (images.length > 10) {
            warnings.push('包含较多图片，可能影响PDF生成速度');
        }
        
        // 检查数学公式
        const mathElements = element.querySelectorAll('mjx-container, .MathJax');
        if (mathElements.length > 50) {
            warnings.push('包含大量数学公式，建议分页处理');
        }
        
        return {
            valid: issues.length === 0,
            issues,
            warnings,
            stats: {
                contentLength,
                imageCount: images.length,
                mathCount: mathElements.length
            }
        };
    }
}

// 导出到全局
window.PDFGenerator = PDFGenerator;