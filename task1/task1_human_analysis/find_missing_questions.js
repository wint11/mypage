const fs = require('fs');
const path = require('path');

// 读取所有题目集合
function readAllQuestionSets() {
    const filePath = path.join(__dirname, 'all_question_sets.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// 读取合并的测试数据
function readMergedTestData() {
    const filePath = path.join(__dirname, 'task1_human_analysis', 'merged_test_data.csv');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // 跳过标题行
    const dataLines = lines.slice(1);
    
    const questions = new Set();
    dataLines.forEach(line => {
        const columns = line.split(',');
        if (columns.length >= 3) {
            const questionDesc = columns[2].trim().replace(/"/g, ''); // 移除引号
            questions.add(questionDesc);
        }
    });
    
    return questions;
}

// 分析缺失的题目
function findMissingQuestions() {
    console.log('正在分析缺失的题目...');
    
    // 读取所有题目集合
    const allQuestionSets = readAllQuestionSets();
    
    // 收集所有题目
    const allQuestions = new Set();
    allQuestionSets.forEach(set => {
        set.questions.forEach(question => {
            allQuestions.add(question.image);
        });
    });
    
    console.log(`总题目数量: ${allQuestions.size}`);
    
    // 读取已测试的题目
    const testedQuestions = readMergedTestData();
    console.log(`已测试题目数量: ${testedQuestions.size}`);
    
    // 找出缺失的题目
    const missingQuestions = [];
    allQuestions.forEach(question => {
        if (!testedQuestions.has(question)) {
            missingQuestions.push(question);
        }
    });
    
    console.log(`缺失题目数量: ${missingQuestions.length}`);
    
    // 按折叠次数和形状分类
    const missingByCategory = {
        fold_1: { circle: [], Hexagon: [], House: [], Rectangle: [], square: [] },
        fold_2: { circle: [], Hexagon: [], House: [], Rectangle: [], square: [] },
        fold_3: { circle: [], Hexagon: [], House: [], Rectangle: [], square: [] }
    };
    
    missingQuestions.forEach(question => {
        const parts = question.split('/');
        if (parts.length === 2) {
            const fold = parts[0];
            const filenameParts = parts[1].split('_');
            if (filenameParts.length >= 2) {
                const shape = filenameParts[0];
                if (missingByCategory[fold] && missingByCategory[fold][shape]) {
                    missingByCategory[fold][shape].push(question);
                }
            }
        }
    });
    
    return {
        total: missingQuestions.length,
        questions: missingQuestions.sort(),
        byCategory: missingByCategory
    };
}

// 生成缺失题目报告
function generateMissingQuestionsReport(missingData) {
    const outputDir = path.join(__dirname, 'human_test_supplement');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 生成详细报告
    let report = '缺失题目分析报告\n';
    report += '==================\n\n';
    report += `总缺失题目数量: ${missingData.total}\n\n`;
    
    report += '按类别分布:\n';
    report += '-----------\n';
    
    Object.keys(missingData.byCategory).forEach(fold => {
        report += `\n${fold}:\n`;
        Object.keys(missingData.byCategory[fold]).forEach(shape => {
            const count = missingData.byCategory[fold][shape].length;
            if (count > 0) {
                report += `  ${shape}: ${count}题\n`;
            }
        });
    });
    
    report += '\n\n完整缺失题目列表:\n';
    report += '----------------\n';
    missingData.questions.forEach((question, index) => {
        report += `${index + 1}. ${question}\n`;
    });
    
    // 保存报告
    const reportPath = path.join(outputDir, 'missing_questions_report.txt');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    // 生成CSV格式的缺失题目列表
    let csvContent = 'Question Number,Question Description,Fold Count,Shape\n';
    missingData.questions.forEach((question, index) => {
        const parts = question.split('/');
        if (parts.length === 2) {
            const fold = parts[0];
            const filenameParts = parts[1].split('_');
            if (filenameParts.length >= 2) {
                const shape = filenameParts[0];
                const foldCount = fold.replace('fold_', '');
                csvContent += `${index + 1},"${question}",${foldCount},${shape}\n`;
            }
        }
    });
    
    const csvPath = path.join(outputDir, 'missing_questions.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    // 生成JSON格式的详细数据
    const jsonPath = path.join(outputDir, 'missing_questions_summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(missingData, null, 2), 'utf8');
    
    console.log(`\n报告已生成:`);
    console.log(`- 详细报告: ${reportPath}`);
    console.log(`- CSV列表: ${csvPath}`);
    console.log(`- JSON数据: ${jsonPath}`);
}

// 主函数
function main() {
    try {
        const missingData = findMissingQuestions();
        generateMissingQuestionsReport(missingData);
        
        console.log('\n=== 缺失题目分析完成 ===');
        console.log(`总缺失题目数量: ${missingData.total}`);
        
        // 显示按类别的统计
        console.log('\n按类别分布:');
        Object.keys(missingData.byCategory).forEach(fold => {
            console.log(`\n${fold}:`);
            Object.keys(missingData.byCategory[fold]).forEach(shape => {
                const count = missingData.byCategory[fold][shape].length;
                if (count > 0) {
                    console.log(`  ${shape}: ${count}题`);
                }
            });
        });
        
    } catch (error) {
        console.error('分析过程中出现错误:', error.message);
    }
}

// 运行分析
main();