const fs = require('fs');
const path = require('path');

// 生成分析报告
function generateAnalysisReport() {
    const resultsPath = path.join(__dirname, 'accuracy_results.json');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    let report = '# 视觉推理任务正确率分析报告\n\n';
    
    // 1. 总体统计
    const overallStats = {
        fold_1: { correct: 0, total: 0 },
        fold_2: { correct: 0, total: 0 },
        fold_3: { correct: 0, total: 0 },
        others: { correct: 0, total: 0 }
    };
    
    for (const fileResults of Object.values(results)) {
        for (const [category, stats] of Object.entries(fileResults)) {
            overallStats[category].correct += parseInt(stats.correct);
            overallStats[category].total += parseInt(stats.total);
        }
    }
    
    report += '## 总体统计结果\n\n';
    report += '| 类别 | 正确数 | 总数 | 正确率 |\n';
    report += '|------|--------|------|--------|\n';
    
    for (const [category, stats] of Object.entries(overallStats)) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(2) : '0.00';
        report += `| ${category} | ${stats.correct} | ${stats.total} | ${accuracy}% |\n`;
    }
    
    // 2. 各模型详细结果
    report += '\n## 各模型详细结果\n\n';
    
    const modelResults = [];
    for (const [filename, fileResults] of Object.entries(results)) {
        const modelName = filename.replace('.txt', '');
        let totalCorrect = 0;
        let totalQuestions = 0;
        
        for (const stats of Object.values(fileResults)) {
            totalCorrect += parseInt(stats.correct);
            totalQuestions += parseInt(stats.total);
        }
        
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(2) : '0.00';
        
        modelResults.push({
            model: modelName,
            totalCorrect,
            totalQuestions,
            overallAccuracy: parseFloat(overallAccuracy),
            details: fileResults
        });
    }
    
    // 按总体正确率排序
    modelResults.sort((a, b) => b.overallAccuracy - a.overallAccuracy);
    
    report += '### 模型排名（按总体正确率）\n\n';
    report += '| 排名 | 模型 | 总正确率 | 正确数/总数 |\n';
    report += '|------|------|----------|-------------|\n';
    
    modelResults.forEach((result, index) => {
        report += `| ${index + 1} | ${result.model} | ${result.overallAccuracy}% | ${result.totalCorrect}/${result.totalQuestions} |\n`;
    });
    
    // 3. 各类别最佳模型
    report += '\n### 各类别最佳表现模型\n\n';
    
    const categoryBest = {
        fold_1: { model: '', accuracy: 0 },
        fold_2: { model: '', accuracy: 0 },
        fold_3: { model: '', accuracy: 0 },
        others: { model: '', accuracy: 0 }
    };
    
    for (const [filename, fileResults] of Object.entries(results)) {
        const modelName = filename.replace('.txt', '');
        for (const [category, stats] of Object.entries(fileResults)) {
            const accuracy = parseFloat(stats.accuracy);
            if (accuracy > categoryBest[category].accuracy) {
                categoryBest[category].model = modelName;
                categoryBest[category].accuracy = accuracy;
            }
        }
    }
    
    report += '| 类别 | 最佳模型 | 正确率 |\n';
    report += '|------|----------|--------|\n';
    
    for (const [category, best] of Object.entries(categoryBest)) {
        report += `| ${category} | ${best.model} | ${best.accuracy}% |\n`;
    }
    
    // 4. 详细数据表格
    report += '\n## 详细数据表格\n\n';
    report += '| 模型 | fold_1 | fold_2 | fold_3 | others | 总体 |\n';
    report += '|------|--------|--------|--------|--------|------|\n';
    
    for (const result of modelResults) {
        const fold1 = result.details.fold_1.accuracy;
        const fold2 = result.details.fold_2.accuracy;
        const fold3 = result.details.fold_3.accuracy;
        const others = result.details.others.accuracy;
        report += `| ${result.model} | ${fold1}% | ${fold2}% | ${fold3}% | ${others}% | ${result.overallAccuracy}% |\n`;
    }
    
    // 5. 统计分析
    report += '\n## 统计分析\n\n';
    
    // 计算各类别平均正确率
    const categoryAverages = {};
    for (const category of ['fold_1', 'fold_2', 'fold_3', 'others']) {
        let sum = 0;
        let count = 0;
        for (const fileResults of Object.values(results)) {
            sum += parseFloat(fileResults[category].accuracy);
            count++;
        }
        categoryAverages[category] = (sum / count).toFixed(2);
    }
    
    report += '### 各类别平均正确率\n\n';
    for (const [category, avg] of Object.entries(categoryAverages)) {
        report += `- **${category}**: ${avg}%\n`;
    }
    
    // 找出表现最好和最差的类别
    const sortedCategories = Object.entries(categoryAverages)
        .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
    
    report += `\n### 关键发现\n\n`;
    report += `- **表现最好的类别**: ${sortedCategories[0][0]} (平均正确率: ${sortedCategories[0][1]}%)\n`;
    report += `- **表现最差的类别**: ${sortedCategories[sortedCategories.length-1][0]} (平均正确率: ${sortedCategories[sortedCategories.length-1][1]}%)\n`;
    report += `- **总体最佳模型**: ${modelResults[0].model} (${modelResults[0].overallAccuracy}%)\n`;
    report += `- **总体最差模型**: ${modelResults[modelResults.length-1].model} (${modelResults[modelResults.length-1].overallAccuracy}%)\n`;
    
    // 保存报告
    const reportPath = path.join(__dirname, 'analysis_report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`分析报告已保存到: ${reportPath}`);
    
    return report;
}

// 生成CSV格式的数据
function generateCSV() {
    const resultsPath = path.join(__dirname, 'accuracy_results.json');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    let csv = 'Model,fold_1_correct,fold_1_total,fold_1_accuracy,fold_2_correct,fold_2_total,fold_2_accuracy,fold_3_correct,fold_3_total,fold_3_accuracy,others_correct,others_total,others_accuracy,total_correct,total_questions,overall_accuracy\n';
    
    for (const [filename, fileResults] of Object.entries(results)) {
        const modelName = filename.replace('.txt', '');
        let totalCorrect = 0;
        let totalQuestions = 0;
        
        for (const stats of Object.values(fileResults)) {
            totalCorrect += parseInt(stats.correct);
            totalQuestions += parseInt(stats.total);
        }
        
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(2) : '0.00';
        
        csv += `${modelName},`;
        csv += `${fileResults.fold_1.correct},${fileResults.fold_1.total},${fileResults.fold_1.accuracy},`;
        csv += `${fileResults.fold_2.correct},${fileResults.fold_2.total},${fileResults.fold_2.accuracy},`;
        csv += `${fileResults.fold_3.correct},${fileResults.fold_3.total},${fileResults.fold_3.accuracy},`;
        csv += `${fileResults.others.correct},${fileResults.others.total},${fileResults.others.accuracy},`;
        csv += `${totalCorrect},${totalQuestions},${overallAccuracy}\n`;
    }
    
    const csvPath = path.join(__dirname, 'accuracy_results.csv');
    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`CSV数据已保存到: ${csvPath}`);
}

// 主函数
function main() {
    console.log('生成分析报告...');
    generateAnalysisReport();
    
    console.log('生成CSV数据...');
    generateCSV();
    
    console.log('分析完成！');
}

if (require.main === module) {
    main();
}

module.exports = {
    generateAnalysisReport,
    generateCSV,
    main
};