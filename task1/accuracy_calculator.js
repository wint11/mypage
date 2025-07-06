const fs = require('fs');
const path = require('path');

/**
 * 分析实验数据并计算准确率
 */
class AccuracyCalculator {
    constructor() {
        this.results = [];
    }

    /**
     * 解析单个数据文件
     * @param {string} filePath 文件路径
     * @returns {Array} 解析后的题目数据
     */
    parseFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = [];
        
        // 按题目分割
        const sections = content.split('==================================================');
        
        for (const section of sections) {
            if (section.trim() === '') continue;
            
            const lines = section.trim().split('\n');
            let correctAnswer = null;
            let predictedAnswer = null;
            let questionTitle = null;
            
            for (const line of lines) {
                if (line.startsWith('题目:')) {
                    questionTitle = line.replace('题目:', '').trim();
                } else if (line.startsWith('正确答案:')) {
                    correctAnswer = line.replace('正确答案:', '').trim();
                } else if (line.startsWith('预测答案:')) {
                    predictedAnswer = line.replace('预测答案:', '').trim();
                }
            }
            
            if (correctAnswer && predictedAnswer && questionTitle) {
                questions.push({
                    title: questionTitle,
                    correct: correctAnswer,
                    predicted: predictedAnswer,
                    isCorrect: correctAnswer === predictedAnswer
                });
            }
        }
        
        return questions;
    }

    /**
     * 计算准确率统计
     * @param {Array} questions 题目数据
     * @param {string} fileName 文件名
     */
    calculateAccuracy(questions, fileName) {
        const totalQuestions = questions.length;
        const correctCount = questions.filter(q => q.isCorrect).length;
        const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(2) : 0;
        
        console.log(`\n=== ${fileName} ===`);
        console.log(`总题目数: ${totalQuestions}`);
        console.log(`正确题目数: ${correctCount}`);
        console.log(`错误题目数: ${totalQuestions - correctCount}`);
        console.log(`总体准确率: ${accuracy}%`);
        
        // 按每200道题分阶段统计
        const stages = Math.ceil(totalQuestions / 200);
        console.log(`\n分阶段统计 (每200道题为一个阶段):`);
        
        for (let i = 0; i < stages; i++) {
            const startIndex = i * 200;
            const endIndex = Math.min((i + 1) * 200, totalQuestions);
            const stageQuestions = questions.slice(startIndex, endIndex);
            const stageCorrect = stageQuestions.filter(q => q.isCorrect).length;
            const stageTotal = stageQuestions.length;
            const stageAccuracy = stageTotal > 0 ? (stageCorrect / stageTotal * 100).toFixed(2) : 0;
            
            console.log(`  阶段 ${i + 1} (题目 ${startIndex + 1}-${endIndex}): ${stageCorrect}/${stageTotal} = ${stageAccuracy}%`);
        }
        
        return {
            fileName,
            totalQuestions,
            correctCount,
            accuracy: parseFloat(accuracy),
            stages: Array.from({length: stages}, (_, i) => {
                const startIndex = i * 200;
                const endIndex = Math.min((i + 1) * 200, totalQuestions);
                const stageQuestions = questions.slice(startIndex, endIndex);
                const stageCorrect = stageQuestions.filter(q => q.isCorrect).length;
                const stageTotal = stageQuestions.length;
                const stageAccuracy = stageTotal > 0 ? (stageCorrect / stageTotal * 100) : 0;
                
                return {
                    stage: i + 1,
                    range: `${startIndex + 1}-${endIndex}`,
                    correct: stageCorrect,
                    total: stageTotal,
                    accuracy: parseFloat(stageAccuracy.toFixed(2))
                };
            })
        };
    }

    /**
     * 分析所有数据文件
     */
    analyzeAll() {
        const dataDir = path.join(__dirname, 'experiment_data');
        const files = [
            'gemini-2.5-flash epoch2.txt',
        ];
        
        console.log('开始分析实验数据...');
        console.log('=' .repeat(60));
        
        let allQuestions = [];
        
        for (const fileName of files) {
            const filePath = path.join(dataDir, fileName);
            
            if (!fs.existsSync(filePath)) {
                console.error(`文件不存在: ${filePath}`);
                continue;
            }
            
            console.log(`\n正在处理文件: ${fileName}`);
            const questions = this.parseFile(filePath);
            const result = this.calculateAccuracy(questions, fileName);
            this.results.push(result);
            allQuestions = allQuestions.concat(questions);
        }
        
        // 计算总体统计
        if (allQuestions.length > 0) {
            console.log('\n' + '=' .repeat(60));
            console.log('=== 总体统计 ===');
            const totalResult = this.calculateAccuracy(allQuestions, '总体数据');
            this.results.push(totalResult);
        }
        
        // 生成详细报告
        this.generateReport();
    }

    /**
     * 生成详细报告
     */
    generateReport() {
        const reportContent = this.generateReportContent();
        const reportPath = path.join(__dirname, 'accuracy_report.txt');
        
        fs.writeFileSync(reportPath, reportContent, 'utf-8');
        console.log(`\n详细报告已保存到: ${reportPath}`);
    }

    /**
     * 生成报告内容
     */
    generateReportContent() {
        let content = '实验数据准确率分析报告\n';
        content += '=' .repeat(50) + '\n\n';
        content += `生成时间: ${new Date().toLocaleString()}\n\n`;
        
        for (const result of this.results) {
            content += `=== ${result.fileName} ===\n`;
            content += `总题目数: ${result.totalQuestions}\n`;
            content += `正确题目数: ${result.correctCount}\n`;
            content += `错误题目数: ${result.totalQuestions - result.correctCount}\n`;
            content += `总体准确率: ${result.accuracy}%\n\n`;
            
            if (result.stages && result.stages.length > 0) {
                content += '分阶段统计:\n';
                for (const stage of result.stages) {
                    content += `  阶段 ${stage.stage} (题目 ${stage.range}): ${stage.correct}/${stage.total} = ${stage.accuracy}%\n`;
                }
                content += '\n';
            }
        }
        
        return content;
    }
}

// 执行分析
if (require.main === module) {
    const calculator = new AccuracyCalculator();
    calculator.analyzeAll();
}

module.exports = AccuracyCalculator;