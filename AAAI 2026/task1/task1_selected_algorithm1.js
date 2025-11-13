const fs = require('fs');
const path = require('path');

// 配置
const config = {
    sourceDir: path.join(__dirname, 'task1_image'),
    selectedDir: path.join(__dirname, 'task1_selected_algorithm1'),
    answerFile: path.join(__dirname, 'answer.jsonl'),
    outputAnswerFile: path.join(__dirname, 'task1_selected_algorithm1.jsonl'),
    targetCount: 1000,
    shapeCounts: {
        circle: 200,
        hexagon: 200,
        house: 200,
        rectangle: 200,
        square: 200
    }
};

// 创建目录
function createDirectories() {
    if (!fs.existsSync(config.selectedDir)) {
        fs.mkdirSync(config.selectedDir, { recursive: true });
    }
}

// 从文件名提取形状
function getShapeFromFilename(filename) {
    const shapeName = filename.split('-')[0].toLowerCase();
    return Object.keys(config.shapeCounts).includes(shapeName) ? shapeName : null;
}



// 读取答案文件
function loadAnswers() {
    console.log('读取答案文件...');
    const answers = new Map();
    
    try {
        const data = fs.readFileSync(config.answerFile, 'utf8');
        const lines = data.trim().split('\n');
        
        lines.forEach(line => {
            try {
                const item = JSON.parse(line);
                answers.set(item.image, item.answer);
            } catch (e) {
                console.warn(`解析答案行失败: ${line}`);
            }
        });
        
        console.log(`成功读取 ${answers.size} 个答案`);
    } catch (error) {
        console.error('读取答案文件失败:', error.message);
        process.exit(1);
    }
    
    return answers;
}

// 读取并分析图片
function analyzeImages() {
    console.log('开始分析图片...');
    
    const files = fs.readdirSync(config.sourceDir);
    const imagesByShape = {
        circle: [],
        hexagon: [],
        house: [],
        rectangle: [],
        square: []
    };
    
    files.forEach(file => {
        if (path.extname(file).toLowerCase() === '.png') {
            const shape = getShapeFromFilename(file);
            if (shape && imagesByShape[shape]) {
                imagesByShape[shape].push(file);
            }
        }
    });
    
    // 输出统计信息
    console.log('\n图片分析结果:');
    Object.keys(imagesByShape).forEach(shape => {
        console.log(`${shape}: ${imagesByShape[shape].length} 张`);
    });
    
    return imagesByShape;
}

// 随机选择图片并匹配答案
function selectImagesWithAnswers(imagesByShape, answers) {
    console.log('\n开始随机选择图片并匹配答案...');
    
    const selectedImages = [];
    const selectedAnswers = [];
    
    Object.keys(config.shapeCounts).forEach(shape => {
        const availableImages = imagesByShape[shape];
        const targetCount = config.shapeCounts[shape];
        
        if (availableImages.length < targetCount) {
            console.warn(`警告: ${shape} 类型图片不足，需要 ${targetCount} 张，实际只有 ${availableImages.length} 张`);
        }
        
        // 随机打乱数组
        const shuffled = [...availableImages].sort(() => Math.random() - 0.5);
        
        // 选择指定数量的图片
        const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
        
        selected.forEach((filename, index) => {
            const newName = `${shape}_${(index + 1).toString().padStart(3, '0')}.png`;
            
            // 查找对应的答案
            const answer = answers.get(filename);
            if (!answer) {
                console.warn(`警告: 找不到图片 ${filename} 的答案`);
            }
            
            selectedImages.push({
                originalName: filename,
                newName: newName,
                shape: shape
            });
            
            // 添加答案记录
            selectedAnswers.push({
                image: newName,
                answer: answer || 'UNKNOWN'
            });
        });
        
        console.log(`${shape}: 选择了 ${selected.length} 张图片`);
    });
    
    return { selectedImages, selectedAnswers };
}

// 复制选中的图片并生成答案文件
function copySelectedImagesAndGenerateAnswers(selectedImages, selectedAnswers) {
    console.log('\n开始复制选中的图片...');
    
    selectedImages.forEach(({ originalName, newName, shape }) => {
        const sourcePath = path.join(config.sourceDir, originalName);
        const destPath = path.join(config.selectedDir, newName);
        
        try {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`复制: ${originalName} -> ${newName}`);
        } catch (error) {
            console.error(`复制失败 ${originalName}:`, error.message);
        }
    });
    
    // 生成答案文件
    console.log('\n生成答案文件...');
    const answerLines = selectedAnswers.map(item => JSON.stringify(item)).join('\n');
    
    try {
        fs.writeFileSync(config.outputAnswerFile, answerLines, 'utf8');
        console.log(`答案文件已生成: ${config.outputAnswerFile}`);
    } catch (error) {
        console.error('生成答案文件失败:', error.message);
    }
    
    return selectedAnswers;
}

// 主函数
function main() {
    try {
        // 创建必要的目录
        createDirectories();
        
        // 读取答案文件
        const answers = loadAnswers();
        
        // 分析图片
        const imagesByShape = analyzeImages();
        
        // 随机选择图片并匹配答案
        const { selectedImages, selectedAnswers } = selectImagesWithAnswers(imagesByShape, answers);
        
        // 复制选中的图片并生成答案文件
        const answerData = copySelectedImagesAndGenerateAnswers(selectedImages, selectedAnswers);
        
        // 输出总结
        console.log('\n=== 任务完成 ===');
        console.log(`总共选择了 ${config.targetCount} 张图片`);
        console.log(`选择的文件已保存到: ${config.selectedDir}`);
        console.log(`答案文件已生成: ${config.outputAnswerFile}`);
        
        console.log('\n图片分布:');
        Object.entries(config.shapeCounts).forEach(([shape, count]) => {
            console.log(`${shape}: ${count} 张`);
        });
        
        console.log('\n答案分布:');
        const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
        answerData.forEach(item => {
            answerCounts[item.answer]++;
        });
        Object.entries(answerCounts).forEach(([answer, count]) => {
            console.log(`${answer}: ${count} 个`);
        });
        
    } catch (error) {
        console.error('执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();