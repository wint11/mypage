// KnowledgePointLoader.js
import { processLaTeX } from './ExerciseRenderer.js';

export async function loadKnowledgePoints(courseId = 'caozuoxitong') {
    const loadingDiv = document.getElementById('loading-overlay');
    try {
        const response = await fetch(`../structure/${courseId}.json`);
        const data = await response.json();
        const container = document.getElementById('knowledge-points');

        async function loadMarkdownFile(path) {
            try {
                const response = await fetch(`../data/${courseId}/${path}.md`);
                if (!response.ok) throw new Error('文件未找到');
                return await response.text();
            } catch (e) {
                console.error('加载Markdown文件失败:', e);
                return '暂无详细内容';
            }
        }

        function renderChapters(chapters, parentElement) {
            // 创建模态框
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'knowledgeModal';
            modal.style.display = 'none';
            modal.style.position = 'fixed';
            modal.style.zIndex = '100';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.margin = '10vh auto';
            modalContent.style.padding = '20px';
            modalContent.style.width = '60%';
            modalContent.style.left = '8%';
            modalContent.style.borderRadius = '5px';
            modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            modalContent.style.transition = 'all 0.3s ease';
            modalContent.style.position = 'relative';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '15px';

            const modalTitle = document.createElement('h4');  // 改为h4标题
            modalTitle.className = 'modal-title';
            modalTitle.id = 'knowledgeModalTitle';
            modalTitle.style.fontSize = '1.8rem';  // 增大字体
            modalTitle.style.fontWeight = 'bold';  // 加粗字体
            modalTitle.style.color = '#333';  // 深色字体

            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-close';
            closeBtn.textContent = '×';
            closeBtn.style.fontSize = '1.5rem';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => modal.style.display = 'none';

            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'knowledgeModalContent';

            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';

            const closeFooterBtn = document.createElement('button');
            closeFooterBtn.className = 'btn btn-primary';
            closeFooterBtn.textContent = '我要优化';
            closeFooterBtn.onclick = () => {
                // 创建文件输入元素
                alert('请上传Markdown文件，当前版本的知识点内容仅支持Markdown格式。');
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.md';
                fileInput.style.display = 'none';

                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            // 读取文件内容并更新模态框
                            document.getElementById('knowledgeModalContent').innerHTML = marked.parse(processLaTeX(event.target.result));

                            // 重新渲染数学公式
                            if (window.MathJax && MathJax.typesetPromise) {
                                MathJax.typesetClear();
                                MathJax.typesetPromise();
                            }
                        };
                        reader.readAsText(file);
                    }
                };

                // 触发文件选择
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            };
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalFooter.appendChild(closeFooterBtn);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            chapters.forEach(chapter => {
                const chapterDiv = document.createElement('div');
                chapterDiv.className = 'chapter mb-2';
                const chapterHeader = document.createElement('div');
                chapterHeader.className = 'chapter-header d-flex align-items-center';
                chapterHeader.innerHTML = marked.parseInline(chapter.name);
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'toggle-icon ms-2';
                toggleIcon.innerHTML = '▶';
                chapterHeader.prepend(toggleIcon);
                const sectionsDiv = document.createElement('div');
                sectionsDiv.className = 'sections ps-3';
                sectionsDiv.style.display = 'none';

                if (chapter.sections && chapter.sections.length > 0) {
                    chapter.sections.forEach(section => {
                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'section small text-muted mb-1';
                        sectionDiv.innerHTML = marked.parseInline(section.name);
                        sectionDiv.style.cursor = 'pointer';
                        sectionDiv.onclick = async () => {
                            const modal = document.getElementById('knowledgeModal');
                            document.getElementById('knowledgeModalTitle').textContent = section.name;

                            // 加载对应的markdown文件
                            const mdContent = await loadMarkdownFile(section.path || section.name);
                            // 修改这里：使用 processLaTeX 处理公式
                            document.getElementById('knowledgeModalContent').innerHTML = marked.parse(processLaTeX(mdContent));

                            modal.style.display = 'block';

                            if (window.MathJax && MathJax.typesetPromise) {
                                MathJax.typesetClear();
                                MathJax.typesetPromise();
                            }
                        };
                        sectionsDiv.appendChild(sectionDiv);
                    });
                }
                chapterHeader.onclick = () => {
                    sectionsDiv.style.display = sectionsDiv.style.display === 'none' ? 'block' : 'none';
                    toggleIcon.innerHTML = sectionsDiv.style.display === 'none' ? '▶' : '▼';
                };
                chapterDiv.appendChild(chapterHeader);
                chapterDiv.appendChild(sectionsDiv);
                parentElement.appendChild(chapterDiv);
            });
        }

        renderChapters(data.chapters, container);

        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetClear();
            MathJax.typesetPromise();
        }
    } catch (e) {
        console.error('加载知识点失败:', e);
        loadingDiv.innerHTML = '<div style="font-size: 1.5rem; color: red;">资源加载失败，请刷新重试</div>';
    }
}