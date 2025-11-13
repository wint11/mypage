const fs = require('fs');
const path = require('path');

// 读取others.txt文件，获取需要归类到others的题目列表
function loadOthersQuestions() {
    const othersPath = path.join(__dirname, 'others.txt');
    const content = fs.readFileSync(othersPath, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    return new Set(lines);
}

// 解析单个实验数据文件
function parseExperimentFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const questions = [];
    
    // 按照分隔符分割题目
    const sections = content.split('==================================================');
    
    for (const section of sections) {
        const lines = section.trim().split('\n');
        if (lines.length < 3) continue;
        
        let questionName = '';
        let correctAnswer = '';
        let predictedAnswer = '';
        
        for (const line of lines) {
            if (line.startsWith('题目: ')) {
                questionName = line.substring(3).trim();
            } else if (line.startsWith('正确答案: ')) {
                correctAnswer = line.substring(5).trim();
            } else if (line.startsWith('预测答案: ')) {
                predictedAnswer = line.substring(5).trim();
            }
        }
        
        if (questionName && correctAnswer && predictedAnswer) {
            questions.push({
                name: questionName,
                correct: correctAnswer,
                predicted: predictedAnswer
            });
        }
    }
    
    return questions;
}

// 分类题目
function categorizeQuestion(questionName, othersSet) {
    // 检查是否在others列表中
    if (othersSet.has(questionName)) {
        return 'others';
    }
    
    // 根据题目名称前缀分类
    if (questionName.startsWith('fold_1/')) {
        return 'fold_1';
    } else if (questionName.startsWith('fold_2/')) {
        return 'fold_2';
    } else if (questionName.startsWith('fold_3/')) {
        return 'fold_3';
    } else {
        return 'others';
    }
}

// 计算正确率统计
function calculateAccuracy(questions, othersSet) {
    const stats = {
        fold_1: { correct: 0, total: 0 },
        fold_2: { correct: 0, total: 0 },
        fold_3: { correct: 0, total: 0 },
        others: { correct: 0, total: 0 }
    };
    
    for (const question of questions) {
        const category = categorizeQuestion(question.name, othersSet);
        stats[category].total++;
        
        // 检查答案是否正确（忽略None和空值）
        if (question.predicted !== 'None' && 
            question.predicted !== '' && 
            question.predicted === question.correct) {
            stats[category].correct++;
        }
    }
    
    // 计算正确率
    const result = {};
    for (const [category, data] of Object.entries(stats)) {
        result[category] = {
            correct: data.correct,
            total: data.total,
            accuracy: data.total > 0 ? (data.correct / data.total * 100).toFixed(2) : '0.00'
        };
    }
    
    return result;
}

// 主函数
function main() {
    const experimentDataDir = path.join(__dirname, '..', 'experiment_data');
    const othersSet = loadOthersQuestions();
    
    // 获取所有实验数据文件
    const files = fs.readdirSync(experimentDataDir).filter(file => file.endsWith('.txt'));
    
    const allResults = {};
    
    for (const file of files) {
        console.log(`处理文件: ${file}`);
        const filePath = path.join(experimentDataDir, file);
        const questions = parseExperimentFile(filePath);
        const accuracy = calculateAccuracy(questions, othersSet);
        
        allResults[file] = accuracy;
        
        console.log(`${file} 统计结果:`);
        for (const [category, stats] of Object.entries(accuracy)) {
            console.log(`  ${category}: ${stats.correct}/${stats.total} (${stats.accuracy}%)`);
        }
        console.log('');
    }
    
    // 保存结果到JSON文件
    const outputPath = path.join(__dirname, 'accuracy_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`结果已保存到: ${outputPath}`);
    
    // 计算总体统计
    const overallStats = {
        fold_1: { correct: 0, total: 0 },
        fold_2: { correct: 0, total: 0 },
        fold_3: { correct: 0, total: 0 },
        others: { correct: 0, total: 0 }
    };
    
    for (const fileResults of Object.values(allResults)) {
        for (const [category, stats] of Object.entries(fileResults)) {
            overallStats[category].correct += parseInt(stats.correct);
            overallStats[category].total += parseInt(stats.total);
        }
    }
    
    console.log('\n总体统计结果:');
    for (const [category, stats] of Object.entries(overallStats)) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(2) : '0.00';
        console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%)`);
    }
}

// 运行程序
if (require.main === module) {
    main();
}

module.exports = {
    loadOthersQuestions,
    parseExperimentFile,
    categorizeQuestion,
    calculateAccuracy,
    main
};