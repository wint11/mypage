const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 解析CSV行数据的通用函数
function parseCSVLines(lines) {
    // 检测文件格式
    const isFormat2 = lines[0] && lines[0].startsWith('#');
    
    let dataLines;
    let metadata = {};
    
    if (isFormat2) {
        // 格式2：有注释行
        const headerIndex = lines.findIndex(line => line.startsWith('题目编号'));
        dataLines = lines.slice(headerIndex + 1);
        
        // 提取元数据
        for (let i = 0; i < headerIndex; i++) {
            const line = lines[i];
            if (line.includes('测试时间:')) {
                metadata.testTime = line.split(':').slice(1).join(':').trim();
            }
            if (line.includes('总题数:')) {
                metadata.totalQuestions = parseInt(line.split(':')[1].trim());
            }
            if (line.includes('准确率:')) {
                metadata.accuracy = line.split(':')[1].trim();
            }
        }
    } else {
        // 格式1：简单格式
        const headerIndex = lines.findIndex(line => line.startsWith('题目编号'));
        const summaryIndex = lines.findIndex(line => line.startsWith('汇总信息'));
        
        if (summaryIndex > 0) {
            dataLines = lines.slice(headerIndex + 1, summaryIndex);
            // 提取汇总信息
            for (let i = summaryIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('总题数')) {
                    metadata.totalQuestions = parseInt(line.split(',')[1]);
                }
                if (line.includes('准确率')) {
                    metadata.accuracy = line.split(',')[1];
                }
                if (line.includes('测试时间')) {
                    metadata.testTime = line.split(',')[1];
                }
            }
        } else {
            dataLines = lines.slice(headerIndex + 1);
        }
    }
    
    // 解析数据行
    const questions = [];
    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        // 使用更智能的CSV解析，处理带引号的字段
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());
        
        if (parts.length < 5) continue;
        
        const questionNum = parseInt(parts[0]);
        if (isNaN(questionNum)) continue; // 跳过无效的题目编号
        
        let description = parts[1];
        const correctAnswer = parts[2];
        const userAnswer = parts[3];
        const result = parts[4];
        
        // 清理描述字段（去除引号）
        description = description.replace(/"/g, '');
        
        // 确定难度 - 根据图片路径中的easy/hard分类
        let difficulty = 'unknown';
        if (description.includes('/easy/')) {
            difficulty = 'easy';
        } else if (description.includes('/hard/')) {
            difficulty = 'hard';
        }
        
        // 确定类型 - 根据路径中的Y/N标识分类
        let promptType = 'unknown';
        if (description.includes('_3DTo2D_Y') || description.includes('_2DTo3D_Y')) {
            promptType = 'Y';
        } else if (description.includes('_3DTo2D_N') || description.includes('_2DTo3D_N')) {
            promptType = 'N';
        }
        
        // 确定类别 - 根据图片路径中的形状名称分类
        let category = 'other';
        if (description.includes('circle_')) {
            category = 'circle';
        } else if (description.includes('Hexagon_')) {
            category = 'hexagon';
        } else if (description.includes('House_')) {
            category = 'house';
        } else if (description.includes('Rectangle_')) {
            category = 'rectangle';
        } else if (description.includes('square_')) {
            category = 'square';
        }
        
        questions.push({
            questionNum,
            description,
            correctAnswer,
            userAnswer,
            result: result.includes('正确'),
            category,
            difficulty,
            promptType
        });
    }
    
    return { questions, metadata };
}

// 读取CSV文件并解析
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    return parseCSVLines(lines);
}

// 读取XLSX文件并解析
function parseXLSX(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 过滤空行并转换为CSV格式的字符串数组
    const lines = jsonData
        .filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== ''))
        .map(row => row.map(cell => cell === undefined ? '' : String(cell)).join(','));
    
    return parseCSVLines(lines);
}

// 分析准确率
function analyzeAccuracy(allData) {
    const categories = ['circle', 'hexagon', 'house', 'rectangle', 'square'];
    const difficulties = ['easy', 'hard'];
    const promptTypes = ['Y', 'N'];
    const results = {
        overall: { total: 0, correct: 0, accuracy: 0 },
        byDifficulty: {},
        byCategory: {},
        byPromptType: {},
        byDifficultyAndPromptType: {}
    };
    
    // 初始化难度统计
    difficulties.forEach(diff => {
        results.byDifficulty[diff] = { total: 0, correct: 0, accuracy: 0 };
    });
    
    // 初始化类别统计
    categories.forEach(cat => {
        results.byCategory[cat] = { total: 0, correct: 0, accuracy: 0 };
    });
    
    // 初始化Prompt类型统计
    promptTypes.forEach(type => {
        results.byPromptType[type] = { total: 0, correct: 0, accuracy: 0 };
    });
    
    // 初始化难度和Prompt类型组合统计
    difficulties.forEach(diff => {
        results.byDifficultyAndPromptType[diff] = {};
        promptTypes.forEach(type => {
            results.byDifficultyAndPromptType[diff][type] = { total: 0, correct: 0, accuracy: 0 };
        });
    });
    
    // 统计所有数据
    allData.forEach(fileData => {
        fileData.questions.forEach(q => {
            results.overall.total++;
            if (q.result) results.overall.correct++;
            
            // 按难度统计
            if (q.difficulty === 'easy' || q.difficulty === 'hard') {
                results.byDifficulty[q.difficulty].total++;
                if (q.result) results.byDifficulty[q.difficulty].correct++;
            }
            
            // 按类别统计
            if (results.byCategory[q.category]) {
                results.byCategory[q.category].total++;
                if (q.result) results.byCategory[q.category].correct++;
            }
            
            // 按Prompt类型统计
            if (q.promptType === 'Y' || q.promptType === 'N') {
                results.byPromptType[q.promptType].total++;
                if (q.result) results.byPromptType[q.promptType].correct++;
            }
            
            // 按难度和Prompt类型组合统计
            if ((q.difficulty === 'easy' || q.difficulty === 'hard') && 
                (q.promptType === 'Y' || q.promptType === 'N')) {
                results.byDifficultyAndPromptType[q.difficulty][q.promptType].total++;
                if (q.result) results.byDifficultyAndPromptType[q.difficulty][q.promptType].correct++;
            }
        });
    });
    
    // 计算准确率
    results.overall.accuracy = results.overall.total > 0 ? 
        (results.overall.correct / results.overall.total * 100).toFixed(2) : 0;
    
    // 计算难度准确率
    difficulties.forEach(diff => {
        const diffData = results.byDifficulty[diff];
        diffData.accuracy = diffData.total > 0 ? 
            (diffData.correct / diffData.total * 100).toFixed(2) : 0;
    });
    
    // 计算类别准确率
    categories.forEach(cat => {
        const catData = results.byCategory[cat];
        catData.accuracy = catData.total > 0 ? 
            (catData.correct / catData.total * 100).toFixed(2) : 0;
    });
    
    // 计算Prompt类型准确率
    promptTypes.forEach(type => {
        const typeData = results.byPromptType[type];
        typeData.accuracy = typeData.total > 0 ? 
            (typeData.correct / typeData.total * 100).toFixed(2) : 0;
    });
    
    // 计算难度和Prompt类型组合准确率
    difficulties.forEach(diff => {
        promptTypes.forEach(type => {
            const comboData = results.byDifficultyAndPromptType[diff][type];
            comboData.accuracy = comboData.total > 0 ? 
                (comboData.correct / comboData.total * 100).toFixed(2) : 0;
        });
    });
    
    return results;
}

// 生成完整的600道题CSV文件
function generateCompleteCSV(allData, outputPath) {
    const allQuestions = [];
    
    // 收集所有题目
    allData.forEach((fileData, fileIndex) => {
        fileData.questions.forEach(q => {
            allQuestions.push({
                ...q,
                fileIndex,
                fileName: fileData.fileName
            });
        });
    });
    
    // 按题目编号排序
    allQuestions.sort((a, b) => a.questionNum - b.questionNum);
    
    // 生成CSV内容
    let csvContent = '题目编号,题目描述,难度,类别,Prompt类型,正确答案,用户答案,答题结果,来源文件\n';
    
    allQuestions.forEach(q => {
        csvContent += `${q.questionNum},"${q.description}",${q.difficulty},${q.category},${q.promptType},${q.correctAnswer},${q.userAnswer},${q.result ? '正确' : '错误'},${q.fileName}\n`;
    });
    
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`完整CSV文件已生成: ${outputPath}`);
    console.log(`总题目数: ${allQuestions.length}`);
}

// 主函数
function main() {
    const testDir = path.join(__dirname, 'human_test');
    const files = fs.readdirSync(testDir).filter(file => file.endsWith('.csv') || file.endsWith('.xlsx'));
    
    console.log(`找到 ${files.length} 个文件`);
    
    const allData = [];
    
    // 处理每个文件
    files.forEach(file => {
        const filePath = path.join(testDir, file);
        console.log(`处理文件: ${file}`);
        
        try {
            let data;
            if (file.endsWith('.csv')) {
                data = parseCSV(filePath);
            } else if (file.endsWith('.xlsx')) {
                data = parseXLSX(filePath);
            }
            
            data.fileName = file;
            allData.push(data);
            console.log(`  - 题目数: ${data.questions.length}`);
            console.log(`  - 准确率: ${data.metadata.accuracy || '未知'}`);
        } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error.message);
        }
    });
    
    // 分析准确率
    const results = analyzeAccuracy(allData);
    
    // 输出结果
    console.log('\n=== 准确率分析结果 ===');
    console.log(`总体准确率 (Overall): ${results.overall.correct}/${results.overall.total} = ${results.overall.accuracy}%`);
    console.log('\n各难度准确率:');
    Object.entries(results.byDifficulty).forEach(([difficulty, data]) => {
        console.log(`  ${difficulty}: ${data.correct}/${data.total} = ${data.accuracy}%`);
    });
    console.log('\n各类别准确率:');
    Object.entries(results.byCategory).forEach(([category, data]) => {
        console.log(`  ${category}: ${data.correct}/${data.total} = ${data.accuracy}%`);
    });
    console.log('\n各Prompt类型准确率:');
    Object.entries(results.byPromptType).forEach(([type, data]) => {
        console.log(`  ${type}: ${data.correct}/${data.total} = ${data.accuracy}%`);
    });
    console.log('\n各难度和Prompt类型组合准确率:');
    Object.entries(results.byDifficultyAndPromptType).forEach(([difficulty, diffData]) => {
        Object.entries(diffData).forEach(([type, data]) => {
            console.log(`  ${difficulty}-${type}: ${data.correct}/${data.total} = ${data.accuracy}%`);
        });
    });
    
    // 生成完整CSV文件
    const outputPath = path.join(__dirname, 'complete_test_results.csv');
    generateCompleteCSV(allData, outputPath);
    
    // 生成统计报告CSV
    const reportPath = path.join(__dirname, 'accuracy_report.csv');
    let reportContent = '类型,类别,正确题数,总题数,准确率\n';
    reportContent += `总体,overall,${results.overall.correct},${results.overall.total},${results.overall.accuracy}%\n`;
    
    // 添加难度统计
    Object.entries(results.byDifficulty).forEach(([difficulty, data]) => {
        reportContent += `难度,${difficulty},${data.correct},${data.total},${data.accuracy}%\n`;
    });
    
    // 添加类别统计
    Object.entries(results.byCategory).forEach(([category, data]) => {
        reportContent += `类别,${category},${data.correct},${data.total},${data.accuracy}%\n`;
    });
    
    // 添加Prompt类型统计
    Object.entries(results.byPromptType).forEach(([type, data]) => {
        reportContent += `Prompt类型,${type},${data.correct},${data.total},${data.accuracy}%\n`;
    });
    
    // 添加难度和Prompt类型组合统计
    Object.entries(results.byDifficultyAndPromptType).forEach(([difficulty, diffData]) => {
        Object.entries(diffData).forEach(([type, data]) => {
            reportContent += `组合,${difficulty}-${type},${data.correct},${data.total},${data.accuracy}%\n`;
        });
    });
    
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`\n统计报告已生成: ${reportPath}`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { parseCSV, parseXLSX, parseCSVLines, analyzeAccuracy, generateCompleteCSV };