// 大模型答题错误率分析器
class ModelAnalyzer {
    constructor() {
        this.experimentData = [];
        this.questionList = [];
        this.analysisResults = {};
        this.charts = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');

        // 拖拽上传
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.showFileStatus(files);
            this.handleFiles(files);
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.showFileStatus(files);
            this.handleFiles(files);
        });
    }

    showFileStatus(files) {
        const fileStatus = document.getElementById('fileStatus');
        if (files.length > 0) {
            const fileNames = files.map(f => f.name).join(', ');
            fileStatus.innerHTML = `✅ 已选择 ${files.length} 个文件: ${fileNames}`;
            fileStatus.style.display = 'block';
        } else {
            fileStatus.style.display = 'none';
        }
    }

    async handleFiles(files) {
        this.showProgress(true);
        this.updateProgress(0, '正在读取文件...');

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.updateProgress((i / files.length) * 50, `正在处理文件: ${file.name}`);
                
                const content = await this.readFile(file);
                
                if (file.name.includes('.jsonl') || file.name.includes('selected')) {
                    this.parseQuestionList(content);
                } else {
                    const records = this.parseExperimentFile(content, file.name);
                    this.experimentData.push(...records);
                }
            }
            
            this.updateProgress(100, '文件处理完成！');
            setTimeout(() => this.showProgress(false), 1000);
            
        } catch (error) {
            console.error('文件处理错误:', error);
            alert('文件处理出错: ' + error.message);
            this.showProgress(false);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    parseQuestionList(content) {
        try {
            const lines = content.trim().split('\n');
            this.questionList = lines.map(line => {
                const data = JSON.parse(line);
                return {
                    image: data.image,
                    answer: data.answer
                };
            });
            console.log(`加载了 ${this.questionList.length} 个题目`);
        } catch (error) {
            console.error('解析题目列表失败:', error);
        }
    }

    parseExperimentFile(content, filename) {
        try {
            const lines = content.trim().split('\n');
            let currentRecord = {};
            const records = [];
            
            for (const line of lines) {
                if (line.startsWith('题目:')) {
                    if (currentRecord.question) {
                        records.push({ ...currentRecord, filename });
                    }
                    currentRecord = {
                        question: line.substring(3).trim()
                    };
                } else if (line.startsWith('正确答案:')) {
                    currentRecord.correctAnswer = line.substring(5).trim();
                } else if (line.startsWith('预测答案:')) {
                    currentRecord.predictedAnswer = line.substring(5).trim();
                }
            }
            
            // 添加最后一条记录
            if (currentRecord.question) {
                records.push({ ...currentRecord, filename });
            }
            
            console.log(`从 ${filename} 解析了 ${records.length} 条记录`);
            return records;
        } catch (error) {
            console.error(`解析实验文件 ${filename} 失败:`, error);
            return [];
        }
    }

    analyzeData() {
        if (this.experimentData.length === 0) {
            alert('请先上传实验数据文件！');
            return;
        }

        this.showProgress(true);
        this.updateProgress(0, '开始分析数据...');

        setTimeout(() => {
            try {
                this.calculateStatistics();
                this.updateProgress(50, '生成可视化图表...');
                
                setTimeout(() => {
                    this.createVisualizations();
                    this.generateDetailTable();
                    this.updateProgress(100, '分析完成！');
                    
                    setTimeout(() => {
                        this.showProgress(false);
                        this.showResults();
                    }, 1000);
                }, 500);
                
            } catch (error) {
                console.error('数据分析错误:', error);
                alert('数据分析出错: ' + error.message);
                this.showProgress(false);
            }
        }, 100);
    }

    async analyzeDefaultData() {
        try {
            this.showProgress(true);
            this.updateProgress(0, '加载默认数据...');

            // 加载默认数据文件
            await this.loadDefaultData();
            
            // 计算统计数据
            this.calculateStatistics();
            
            this.updateProgress(50, '生成可视化图表...');
            
            setTimeout(() => {
                this.createVisualizations();
                this.generateDetailTable();
                this.updateProgress(100, '默认数据分析完成！');
                
                setTimeout(() => {
                    this.showProgress(false);
                    this.showResults();
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error('分析默认数据时出现错误:', error);
            alert('分析默认数据时出现错误: ' + error.message);
            this.showProgress(false);
        }
    }

    async loadDefaultData() {
        try {
            // 动态获取experiment_data目录下的所有.txt文件
            const response = await fetch('../experiment_data/');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = doc.querySelectorAll('a[href$=".txt"]');
            
            const defaultDataFiles = Array.from(links).map(link => {
                const href = link.getAttribute('href');
                // 只取文件名，避免路径重复
                const fileName = href.split('/').pop();
                return '../experiment_data/' + fileName;
            }).filter(href => href.endsWith('.txt'));
            
            // 如果无法动态获取文件列表，使用备用方案
            if (defaultDataFiles.length === 0) {
                // 备用：尝试常见的文件名模式
                const commonFiles = [
                    'GLM-4-plus epoch1.txt', 'GLM-4-plus epoch2.txt', 'GLM-4-plus epoch3.txt',
                    'GLM-4.1V-Thinking-Flash epoch1.txt', 'GLM-4.1V-Thinking-Flash epoch2.txt', 'GLM-4.1V-Thinking-Flash epoch3.txt',
                    'GLM-Z1-Airx epoch1.txt', 'GLM-Z1-Airx epoch2.txt', 'GLM-Z1-Airx epoch3.txt',
                    'GPT-4o epoch1.txt', 'GPT-4o epoch2.txt', 'GPT-4o epoch3.txt',
                    'GPT-4o-mini epoch1.txt', 'GPT-4o-mini epoch2.txt', 'GPT-4o-mini epoch3.txt',
                    'claude-3-7-sonnet-thinking epoch1.txt',
                    'doubao-seed-1-6-flash-250615 epoch1.txt', 'doubao-seed-1-6-flash-250615 epoch2.txt', 'doubao-seed-1-6-flash-250615 epoch3.txt',
                    'gemini-2.5-flash epoch1.txt', 'gemini-2.5-flash epoch2.txt',
                    'qwen2-vl-72b-instruct epoch1.txt', 'qwen2-vl-72b-instruct epoch2.txt', 'qwen2-vl-72b-instruct epoch3.txt',
                    'qwen2.5-vl-72b-instruct epoch1.txt', 'qwen2.5-vl-72b-instruct epoch2.txt', 'qwen2.5-vl-72b-instruct epoch3.txt', 'qwen2.5-vl-72b-instruct epoch4.txt'
                ];
                defaultDataFiles.push(...commonFiles.map(file => '../experiment_data/' + file));
            }
            
            this.experimentData = [];
            this.questionList = [];
            
            let loadedFiles = 0;
            
            for (const filePath of defaultDataFiles) {
                try {
                    const response = await fetch(filePath);
                    if (response.ok) {
                        const content = await response.text();
                        const data = this.parseExperimentFile(content, filePath);
                        this.experimentData.push(...data);
                        loadedFiles++;
                        this.updateProgress(20 + (loadedFiles / defaultDataFiles.length) * 30, `加载文件 ${loadedFiles}/${defaultDataFiles.length}...`);
                    }
                } catch (error) {
                    console.warn(`无法加载文件 ${filePath}:`, error);
                }
            }
            
            // 如果没有加载到任何文件，使用示例数据
            if (this.experimentData.length === 0) {
                console.warn('未找到默认数据文件，使用示例数据');
                this.experimentData = [
                    { question: "fold_1/House_001.png", correctAnswer: "1", predictedAnswer: "2", filename: "sample_data" },
                    { question: "fold_1/House_002.png", correctAnswer: "2", predictedAnswer: "2", filename: "sample_data" },
                    { question: "fold_1/House_003.png", correctAnswer: "3", predictedAnswer: "1", filename: "sample_data" },
                    { question: "fold_2/circle_001.png", correctAnswer: "1", predictedAnswer: "3", filename: "sample_data" },
                    { question: "fold_2/circle_002.png", correctAnswer: "2", predictedAnswer: "2", filename: "sample_data" },
                    { question: "fold_3/Rectangle_001.png", correctAnswer: "1", predictedAnswer: "2", filename: "sample_data" },
                    { question: "fold_3/Rectangle_002.png", correctAnswer: "3", predictedAnswer: "3", filename: "sample_data" },
                    { question: "fold_4/square_001.png", correctAnswer: "2", predictedAnswer: "1", filename: "sample_data" },
                    { question: "fold_5/Hexagon_001.png", correctAnswer: "1", predictedAnswer: "2", filename: "sample_data" },
                    { question: "fold_5/Hexagon_002.png", correctAnswer: "3", predictedAnswer: "3", filename: "sample_data" }
                ];
            }
            
            console.log('默认数据加载完成:', this.experimentData.length, '条记录');
            
        } catch (error) {
            console.error('加载默认数据时出错:', error);
            throw new Error('无法加载默认数据: ' + error.message);
        }
    }

    calculateStatistics() {
        const questionStats = {};
        
        // 统计每个题目的正确率和错误率
        for (const record of this.experimentData) {
            const question = record.question;
            
            if (!questionStats[question]) {
                questionStats[question] = {
                    correct: 0,
                    total: 0,
                    type: this.getQuestionType(question)
                };
            }
            
            questionStats[question].total++;
            
            if (record.correctAnswer === record.predictedAnswer) {
                questionStats[question].correct++;
            }
        }
        
        // 计算错误率和正确率
        const results = [];
        for (const [question, stats] of Object.entries(questionStats)) {
            const correctRate = stats.correct / stats.total;
            const errorRate = 1 - correctRate;
            
            results.push({
                question,
                errorRate,
                correctRate,
                total: stats.total,
                correct: stats.correct,
                incorrect: stats.total - stats.correct,
                type: stats.type
            });
        }
        
        // 排序
        results.sort((a, b) => b.errorRate - a.errorRate);
        
        this.analysisResults = {
            questionStats: results,
            totalQuestions: results.length,
            totalRecords: this.experimentData.length,
            averageErrorRate: results.reduce((sum, r) => sum + r.errorRate, 0) / results.length,
            averageCorrectRate: results.reduce((sum, r) => sum + r.correctRate, 0) / results.length
        };
        
        console.log('统计分析完成:', this.analysisResults);
    }

    getQuestionType(question) {
        const types = ['House', 'Hexagon', 'Rectangle', 'circle', 'square'];
        for (const type of types) {
            if (question.toLowerCase().includes(type.toLowerCase())) {
                return type;
            }
        }
        return 'Unknown';
    }

    createVisualizations() {
        this.createStatsCards();
        this.createErrorDistributionChart();
        this.createTopErrorsChart();
        this.createTopCorrectChart();
        this.createTypeAnalysisChart();
    }

    createStatsCards() {
        const statsGrid = document.getElementById('statsGrid');
        const stats = this.analysisResults;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalQuestions}</div>
                <div class="stat-label">总题目数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalRecords}</div>
                <div class="stat-label">总记录数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.averageErrorRate * 100).toFixed(1)}%</div>
                <div class="stat-label">平均错误率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.averageCorrectRate * 100).toFixed(1)}%</div>
                <div class="stat-label">平均正确率</div>
            </div>
        `;
    }

    createErrorDistributionChart() {
        const ctx = document.getElementById('errorDistChart').getContext('2d');
        
        // 创建错误率分布的直方图数据
        const bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const counts = new Array(bins.length - 1).fill(0);
        
        for (const result of this.analysisResults.questionStats) {
            for (let i = 0; i < bins.length - 1; i++) {
                if (result.errorRate >= bins[i] && result.errorRate < bins[i + 1]) {
                    counts[i]++;
                    break;
                }
            }
        }
        
        this.charts.errorDist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.slice(0, -1).map((bin, i) => `${(bin * 100).toFixed(0)}-${(bins[i + 1] * 100).toFixed(0)}%`),
                datasets: [{
                    label: '题目数量',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '题目数量'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '错误率区间'
                        }
                    }
                }
            }
        });
    }

    createTopErrorsChart() {
        const ctx = document.getElementById('topErrorsChart').getContext('2d');
        const top20 = this.analysisResults.questionStats.slice(0, 20);
        
        this.charts.topErrors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top20.map(r => r.question.length > 30 ? r.question.substring(0, 30) + '...' : r.question),
                datasets: [{
                    label: '错误率',
                    data: top20.map(r => (r.errorRate * 100).toFixed(1)),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '错误率 (%)'
                        }
                    }
                }
            }
        });
    }

    createTopCorrectChart() {
        const ctx = document.getElementById('topCorrectChart').getContext('2d');
        const top20Correct = [...this.analysisResults.questionStats]
            .sort((a, b) => b.correctRate - a.correctRate)
            .slice(0, 20);
        
        this.charts.topCorrect = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top20Correct.map(r => r.question.length > 30 ? r.question.substring(0, 30) + '...' : r.question),
                datasets: [{
                    label: '正确率',
                    data: top20Correct.map(r => (r.correctRate * 100).toFixed(1)),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '正确率 (%)'
                        }
                    }
                }
            }
        });
    }

    createTypeAnalysisChart() {
        const ctx = document.getElementById('typeAnalysisChart').getContext('2d');
        
        // 按类型统计
        const typeStats = {};
        for (const result of this.analysisResults.questionStats) {
            if (!typeStats[result.type]) {
                typeStats[result.type] = {
                    totalErrorRate: 0,
                    count: 0
                };
            }
            typeStats[result.type].totalErrorRate += result.errorRate;
            typeStats[result.type].count++;
        }
        
        const types = Object.keys(typeStats);
        const avgErrorRates = types.map(type => 
            (typeStats[type].totalErrorRate / typeStats[type].count * 100).toFixed(1)
        );
        
        this.charts.typeAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types,
                datasets: [{
                    label: '平均错误率 (%)',
                    data: avgErrorRates,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 205, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '平均错误率 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '题目类型'
                        }
                    }
                }
            }
        });
    }

    generateDetailTable() {
        const tbody = document.getElementById('detailTableBody');
        tbody.innerHTML = '';
        
        for (const result of this.analysisResults.questionStats) {
            const row = document.createElement('tr');
            
            // 根据错误率设置行的样式
            let rowClass = '';
            if (result.errorRate > 0.8) rowClass = 'error-rate-high';
            else if (result.errorRate > 0.5) rowClass = 'error-rate-medium';
            else rowClass = 'error-rate-low';
            
            row.className = rowClass;
            
            row.innerHTML = `
                <td title="${result.question}">${result.question.length > 50 ? result.question.substring(0, 50) + '...' : result.question}</td>
                <td>${(result.errorRate * 100).toFixed(1)}%</td>
                <td>${(result.correctRate * 100).toFixed(1)}%</td>
                <td>${result.total}</td>
                <td>${result.correct}</td>
                <td>${result.incorrect}</td>
                <td>${result.type}</td>
            `;
            
            tbody.appendChild(row);
        }
    }

    showProgress(show) {
        const progressBar = document.getElementById('progressBar');
        progressBar.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('progressText').textContent = '';
        }
    }

    updateProgress(percent, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = percent + '%';
        progressText.textContent = text;
    }

    showResults() {
        document.getElementById('results').style.display = 'block';
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }
}

// 全局函数
function analyzeData() {
    analyzer.analyzeData();
}

function analyzeDefaultData() {
    analyzer.analyzeDefaultData();
}

// 初始化分析器
const analyzer = new ModelAnalyzer();

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('大模型答题错误率分析系统已加载');
});