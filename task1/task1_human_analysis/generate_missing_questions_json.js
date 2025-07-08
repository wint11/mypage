const fs = require('fs');
const path = require('path');

// 读取缺失题目列表
function readMissingQuestions() {
    const filePath = path.join(__dirname, 'human_test_supplement', 'missing_questions.csv');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // 跳过标题行
    const dataLines = lines.slice(1);
    
    const missingQuestions = [];
    dataLines.forEach(line => {
        const columns = line.split(',');
        if (columns.length >= 2) {
            const questionDesc = columns[1].trim().replace(/"/g, ''); // 移除引号
            missingQuestions.push(questionDesc);
        }
    });
    
    return missingQuestions;
}

// 读取算法答案文件
function readAlgorithmAnswers() {
    const filePath = path.join(__dirname, 'task1_selected_algorithm2.jsonl');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    const answers = {};
    lines.forEach(line => {
        try {
            const item = JSON.parse(line);
            answers[item.image] = item.answer;
        } catch (error) {
            console.warn(`解析行时出错: ${line}`);
        }
    });
    
    return answers;
}

// 生成缺失题目的JSON文件
function generateMissingQuestionsJson() {
    console.log('正在生成缺失题目的JSON文件...');
    
    // 读取缺失题目列表
    const missingQuestions = readMissingQuestions();
    console.log(`缺失题目数量: ${missingQuestions.length}`);
    
    // 读取算法答案
    const algorithmAnswers = readAlgorithmAnswers();
    console.log(`算法答案数量: ${Object.keys(algorithmAnswers).length}`);
    
    // 构建题目数据
    const questions = [];
    missingQuestions.forEach(questionImage => {
        if (algorithmAnswers[questionImage]) {
            questions.push({
                "image": questionImage,
                "answer": algorithmAnswers[questionImage]
            });
        } else {
            console.warn(`未找到题目 ${questionImage} 的答案`);
        }
    });
    
    // 按照all_question_sets.json的结构组织数据
    const questionSet = {
        "setId": 17,
        "questions": questions
    };
    
    // 确保输出目录存在
    const outputDir = path.join(__dirname, 'human_test_supplement');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存JSON文件
    const outputPath = path.join(outputDir, 'missing_questions_set17.json');
    fs.writeFileSync(outputPath, JSON.stringify(questionSet, null, 2), 'utf8');
    
    console.log(`\n=== 缺失题目JSON文件生成完成 ===`);
    console.log(`文件路径: ${outputPath}`);
    console.log(`Set ID: 17`);
    console.log(`题目数量: ${questions.length}`);
    
    // 显示统计信息
    const stats = {
        fold_1: { circle: 0, Hexagon: 0, House: 0, Rectangle: 0, square: 0 },
        fold_2: { circle: 0, Hexagon: 0, House: 0, Rectangle: 0, square: 0 },
        fold_3: { circle: 0, Hexagon: 0, House: 0, Rectangle: 0, square: 0 }
    };
    
    questions.forEach(question => {
        const parts = question.image.split('/');
        if (parts.length === 2) {
            const fold = parts[0];
            const filenameParts = parts[1].split('_');
            if (filenameParts.length >= 2) {
                const shape = filenameParts[0];
                if (stats[fold] && stats[fold][shape] !== undefined) {
                    stats[fold][shape]++;
                }
            }
        }
    });
    
    console.log('\n按类别分布:');
    Object.keys(stats).forEach(fold => {
        console.log(`\n${fold}:`);
        Object.keys(stats[fold]).forEach(shape => {
            const count = stats[fold][shape];
            if (count > 0) {
                console.log(`  ${shape}: ${count}题`);
            }
        });
    });
    
    // 显示前几个题目作为示例
    console.log('\n前5个题目示例:');
    questions.slice(0, 5).forEach((question, index) => {
        console.log(`${index + 1}. ${question.image} -> ${question.answer}`);
    });
    
    return {
        filePath: outputPath,
        questionCount: questions.length,
        setId: 17
    };
}

// 主函数
function main() {
    try {
        const result = generateMissingQuestionsJson();
        console.log('\n生成成功!');
    } catch (error) {
        console.error('生成过程中出现错误:', error.message);
    }
}

// 运行生成
main();