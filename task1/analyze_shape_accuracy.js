const fs = require('fs');
const path = require('path');

// 读取CSV文件并分析形状准确率
function analyzeShapeAccuracy() {
    const csvPath = path.join(__dirname, 'task1_human_analysis', 'merged_test_data.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error('CSV文件不存在:', csvPath);
        return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // 跳过标题行
    const dataLines = lines.slice(1);
    
    // 初始化统计数据
    const shapeStats = {
        circle: { correct: 0, total: 0 },
        Hexagon: { correct: 0, total: 0 },
        House: { correct: 0, total: 0 },
        Rectangle: { correct: 0, total: 0 },
        square: { correct: 0, total: 0 }
    };
    
    // 处理每一行数据
    dataLines.forEach(line => {
        const columns = line.split(',');
        if (columns.length >= 8) {
            const shape = columns[4]; // 形状列
            const result = parseInt(columns[7]); // 结果列 (1=正确，0=错误)
            
            if (shapeStats[shape]) {
                shapeStats[shape].total++;
                if (result === 1) {
                    shapeStats[shape].correct++;
                }
            }
        }
    });
    
    // 计算准确率并输出结果
    console.log('\n=== 五种形状准确率分析 ===\n');
    
    const results = [];
    for (const [shape, stats] of Object.entries(shapeStats)) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(2) : '0.00';
        const result = {
            shape: shape,
            correct: stats.correct,
            total: stats.total,
            accuracy: parseFloat(accuracy)
        };
        results.push(result);
        
        console.log(`${shape}:`);
        console.log(`  正确答案数: ${stats.correct}`);
        console.log(`  总题目数: ${stats.total}`);
        console.log(`  准确率: ${accuracy}%`);
        console.log('');
    }
    
    // 按准确率排序
    results.sort((a, b) => b.accuracy - a.accuracy);
    
    console.log('=== 按准确率排序 ===\n');
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.shape}: ${result.accuracy}% (${result.correct}/${result.total})`);
    });
    
    // 计算总体准确率
    const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(2) : '0.00';
    
    console.log(`\n=== 总体统计 ===`);
    console.log(`总正确答案数: ${totalCorrect}`);
    console.log(`总题目数: ${totalQuestions}`);
    console.log(`总体准确率: ${overallAccuracy}%`);
    
    // 保存结果到文件
    const outputPath = path.join(__dirname, 'shape_accuracy_results.txt');
    let output = '五种形状准确率分析结果\n';
    output += '========================\n\n';
    
    results.forEach((result, index) => {
        output += `${index + 1}. ${result.shape}\n`;
        output += `   正确答案数: ${result.correct}\n`;
        output += `   总题目数: ${result.total}\n`;
        output += `   准确率: ${result.accuracy}%\n\n`;
    });
    
    output += `总体统计:\n`;
    output += `总正确答案数: ${totalCorrect}\n`;
    output += `总题目数: ${totalQuestions}\n`;
    output += `总体准确率: ${overallAccuracy}%\n`;
    
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`\n结果已保存到: ${outputPath}`);
    
    return results;
}

// 运行分析
if (require.main === module) {
    analyzeShapeAccuracy();
}

module.exports = { analyzeShapeAccuracy };