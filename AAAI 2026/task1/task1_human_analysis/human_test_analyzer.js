const fs = require('fs');
const path = require('path');

// 读取merged_test_data.csv文件并分析数据
function analyzeHumanTestData() {
    const csvFilePath = path.join(__dirname, '不加多角的，只考虑单步.csv');
    // const csvFilePath = path.join(__dirname, 'merged_test_data.csv');
    
    let totalQuestions = 0;
    let totalCorrect = 0;
    let categoryStats = {
        'fold_1': { total: 0, correct: 0 },
        'fold_2': { total: 0, correct: 0 },
        'fold_3': { total: 0, correct: 0 }
    };
    let shapeStats = {
        'circle': { total: 0, correct: 0 },
        'square': { total: 0, correct: 0 },
        'Rectangle': { total: 0, correct: 0 },
        'Hexagon': { total: 0, correct: 0 },
        'House': { total: 0, correct: 0 }
    };
    let wrongQuestions = [];
    let allAnswers = [];
    let participantCount = new Set();
    
    console.log(`读取合并数据文件: ${csvFilePath}`);
    
    if (!fs.existsSync(csvFilePath)) {
        console.error('错误：找不到merged_test_data.csv文件');
        return null;
    }
    
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // 跳过标题行
    const dataLines = lines.slice(1);
    
    dataLines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length >= 8) {
            const participantId = parts[0].trim();
            const questionNum = parts[1].trim();
            const questionDesc = parts[2].trim();
            const foldCount = parts[3].trim();
            const shape = parts[4].trim();
            const correctAnswer = parts[5].trim();
            const userAnswer = parts[6].trim();
            const result = parts[7].trim();
            
            // 记录参与者
            participantCount.add(participantId);
            
            totalQuestions++;
            const isCorrect = result === '1';
            if (isCorrect) totalCorrect++;
            
            // 分析类别（fold_1, fold_2, fold_3）
            const foldMatch = questionDesc.match(/fold_(\d)/);
            if (foldMatch) {
                const foldType = `fold_${foldMatch[1]}`;
                categoryStats[foldType].total++;
                if (isCorrect) categoryStats[foldType].correct++;
            }
            
            // 分析图形类型
            if (shapeStats[shape]) {
                shapeStats[shape].total++;
                if (isCorrect) shapeStats[shape].correct++;
            }
            
            // 记录错误题目
            if (!isCorrect) {
                wrongQuestions.push({
                    participantId: participantId,
                    questionNum: questionNum,
                    questionDesc: questionDesc,
                    foldCount: foldCount,
                    shape: shape,
                    correctAnswer: correctAnswer,
                    userAnswer: userAnswer
                });
            }
            
            // 记录所有答案
            allAnswers.push({
                participantId: participantId,
                questionNum: questionNum,
                questionDesc: questionDesc,
                foldCount: foldCount,
                shape: shape,
                correctAnswer: correctAnswer,
                userAnswer: userAnswer,
                isCorrect: isCorrect
            });
        }
    });
    
    // 计算统计结果
    const overallErrorRate = ((totalQuestions - totalCorrect) / totalQuestions * 100).toFixed(2);
    
    console.log('\n=== 人类答题数据分析结果 ===');
    console.log(`总答题数: ${totalQuestions}`);
    console.log(`正确答题数: ${totalCorrect}`);
    console.log(`整体错误率: ${overallErrorRate}%`);
    
    console.log('\n=== 分类别错误率 ===');
    Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        if (stats.total > 0) {
            const errorRate = ((stats.total - stats.correct) / stats.total * 100).toFixed(2);
            console.log(`${category}: ${errorRate}% (${stats.total - stats.correct}/${stats.total})`);
        }
    });
    
    console.log('\n=== 分图形错误率 ===');
    Object.keys(shapeStats).forEach(shape => {
        const stats = shapeStats[shape];
        if (stats.total > 0) {
            const errorRate = ((stats.total - stats.correct) / stats.total * 100).toFixed(2);
            console.log(`${shape}: ${errorRate}% (${stats.total - stats.correct}/${stats.total})`);
        }
    });
    
    console.log('\n=== 错误题目统计 ===');
    console.log(`总错误题目数: ${wrongQuestions.length}`);
    
    // 按题目描述分组统计错误次数
    const errorByQuestion = {};
    wrongQuestions.forEach(wrong => {
        if (!errorByQuestion[wrong.questionDesc]) {
            errorByQuestion[wrong.questionDesc] = {
                count: 0,
                correctAnswer: wrong.correctAnswer,
                wrongAnswers: []
            };
        }
        errorByQuestion[wrong.questionDesc].count++;
        errorByQuestion[wrong.questionDesc].wrongAnswers.push(wrong.userAnswer);
    });
    
    // 按错误次数排序
    const sortedErrors = Object.entries(errorByQuestion)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20); // 显示前20个最容易出错的题目
    
    console.log('\n=== 最容易出错的题目（前20个）===');
    sortedErrors.forEach(([question, data], index) => {
        console.log(`${index + 1}. ${question}`);
        console.log(`   错误次数: ${data.count}, 正确答案: ${data.correctAnswer}`);
        console.log(`   错误答案分布: ${data.wrongAnswers.join(', ')}`);
        console.log('');
    });
    
    // 生成详细报告
    const report = {
        summary: {
            totalQuestions,
            totalCorrect,
            overallErrorRate: parseFloat(overallErrorRate),
            totalParticipants: participantCount.size
        },
        categoryErrorRates: {},
        shapeErrorRates: {},
        topWrongQuestions: sortedErrors.map(([question, data]) => ({
            question,
            errorCount: data.count,
            correctAnswer: data.correctAnswer,
            wrongAnswers: data.wrongAnswers
        })),
        allWrongQuestions: wrongQuestions
    };
    
    Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        if (stats.total > 0) {
            report.categoryErrorRates[category] = {
                errorRate: parseFloat(((stats.total - stats.correct) / stats.total * 100).toFixed(2)),
                total: stats.total,
                correct: stats.correct,
                wrong: stats.total - stats.correct
            };
        }
    });
    
    Object.keys(shapeStats).forEach(shape => {
        const stats = shapeStats[shape];
        if (stats.total > 0) {
            report.shapeErrorRates[shape] = {
                errorRate: parseFloat(((stats.total - stats.correct) / stats.total * 100).toFixed(2)),
                total: stats.total,
                correct: stats.correct,
                wrong: stats.total - stats.correct
            };
        }
    });
    
    // 保存详细报告
    fs.writeFileSync(
        path.join(__dirname, 'human_test_analysis_report.json'),
        JSON.stringify(report, null, 2),
        'utf-8'
    );
    
    console.log('\n详细分析报告已保存到: human_test_analysis_report.json');
    
    return report;
}

// 运行分析
if (require.main === module) {
    analyzeHumanTestData();
}

module.exports = { analyzeHumanTestData };