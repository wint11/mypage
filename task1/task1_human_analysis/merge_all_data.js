const fs = require('fs');
const path = require('path');

// 读取所有CSV文件并合并数据
function mergeAllTestData() {
    const testDataDir = path.join(__dirname, '../task1_human_test');
    const files = fs.readdirSync(testDataDir).filter(file => file.endsWith('.csv'));
    
    const allData = [];
    
    files.forEach(file => {
        const filePath = path.join(testDataDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        // 提取参与者ID（从文件名中）
        const match = file.match(/-(\d+)\.csv$/);
        const participantId = match ? match[1] : 'unknown';
        
        // 找到数据开始的行（跳过标题行）
        let dataStartIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('题目编号,题目描述,正确答案,用户答案,答题结果')) {
                dataStartIndex = i + 1;
                break;
            }
        }
        
        if (dataStartIndex === -1) return;
        
        // 处理每一行答题数据
        for (let i = dataStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.includes('总题数') || line.includes('正确题数')) break;
            
            const parts = line.split(',');
            if (parts.length >= 5) {
                const questionNum = parts[0];
                const questionDesc = parts[1];
                const correctAnswer = parts[2];
                const userAnswer = parts[3];
                const result = parts[4];
                
                // 从题目描述中提取折叠次数和形状（格式如：fold_3/Rectangle_005.png）
                let foldCount = 'unknown';
                let shape = 'unknown';
                
                if (questionDesc.includes('fold_1/')) foldCount = '1';
                else if (questionDesc.includes('fold_2/')) foldCount = '2';
                else if (questionDesc.includes('fold_3/')) foldCount = '3';
                
                if (questionDesc.includes('circle_')) shape = 'circle';
                else if (questionDesc.includes('square_')) shape = 'square';
                else if (questionDesc.includes('Rectangle_')) shape = 'Rectangle';
                else if (questionDesc.includes('Hexagon_')) shape = 'Hexagon';
                else if (questionDesc.includes('House_')) shape = 'House';
                
                allData.push({
                    participantId,
                    questionNum: parseInt(questionNum),
                    questionDesc,
                    foldCount,
                    shape,
                    correctAnswer,
                    userAnswer,
                    result: result === '正确' ? 1 : 0
                });
            }
        }
    });
    
    // 排序：按题目描述排序
    allData.sort((a, b) => {
        return a.questionDesc.localeCompare(b.questionDesc);
    });
    
    return allData;
}

// 生成CSV文件
function generateMergedCSV() {
    const allData = mergeAllTestData();
    
    // CSV标题行
    const headers = [
        '参与者ID',
        '题目编号', 
        '题目描述',
        '折叠次数',
        '形状',
        '正确答案',
        '用户答案',
        '结果(1=正确,0=错误)'
    ];
    
    // 生成CSV内容
    let csvContent = headers.join(',') + '\n';
    
    allData.forEach(row => {
        const csvRow = [
            row.participantId,
            row.questionNum,
            `"${row.questionDesc}"`, // 用引号包围，防止逗号问题
            row.foldCount,
            row.shape,
            row.correctAnswer,
            row.userAnswer,
            row.result
        ];
        csvContent += csvRow.join(',') + '\n';
    });
    
    // 保存文件
    const outputPath = path.join(__dirname, 'merged_test_data.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    
    console.log(`合并完成！共处理 ${allData.length} 条答题记录`);
    console.log(`文件已保存到: ${outputPath}`);
    
    // 生成统计信息
    const participants = new Set(allData.map(d => d.participantId)).size;
    const totalQuestions = allData.length;
    const correctAnswers = allData.filter(d => d.result === 1).length;
    
    console.log(`\n统计信息:`);
    console.log(`参与者数量: ${participants}`);
    console.log(`总答题数: ${totalQuestions}`);
    console.log(`正确答题数: ${correctAnswers}`);
    console.log(`总体正确率: ${(correctAnswers / totalQuestions * 100).toFixed(1)}%`);
}

// 执行合并
generateMergedCSV();