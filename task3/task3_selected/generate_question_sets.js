const fs = require('fs');
const path = require('path');

// 读取题目数据
function loadQuestions() {
    const filePath = path.join(__dirname, 'fold.jsonl');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => JSON.parse(line));
}

// 按形状分类题目
function categorizeQuestions(questions) {
    const categories = {
        fold: { circle: [], Hexagon: [], House: [], Rectangle: [], square: [] }
    };

    questions.forEach(question => {
        const imagePath = question.image;
        const parts = imagePath.split('/');
        const filename = parts[1];
        
        // 提取形状类型
        let shape;
        if (filename.startsWith('circle_')) {
            shape = 'circle';
        } else if (filename.startsWith('Hexagon_')) {
            shape = 'Hexagon';
        } else if (filename.startsWith('House_')) {
            shape = 'House';
        } else if (filename.startsWith('Rectangle_')) {
            shape = 'Rectangle';
        } else if (filename.startsWith('square_')) {
            shape = 'square';
        }

        if (shape) {
            categories.fold[shape].push(question);
        }
    });

    return categories;
}

// 洗牌算法
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 生成20份题目集
function generateQuestionSets(categories) {
    const questionSets = [];
    const shapes = ['circle', 'Hexagon', 'House', 'Rectangle', 'square'];
    
    // 为每种形状创建洗牌后的题目列表
    const shuffledCategories = {};
    shapes.forEach(shape => {
        shuffledCategories[shape] = shuffle(categories.fold[shape]);
    });
    
    // 跟踪每个类别已使用的题目数量
    const usedCounts = {};
    shapes.forEach(shape => {
        usedCounts[shape] = 0;
    });
    
    // 生成20份题目集
    for (let setIndex = 0; setIndex < 20; setIndex++) {
        const questionSet = {
            setId: setIndex + 1,
            questions: []
        };
        
        // 为每种形状选择6题（总共30题）
        shapes.forEach(shape => {
            // 为当前形状选择6题
            for (let i = 0; i < 6; i++) {
                const questionIndex = usedCounts[shape];
                if (questionIndex < shuffledCategories[shape].length) {
                    questionSet.questions.push(shuffledCategories[shape][questionIndex]);
                    usedCounts[shape]++;
                } else {
                    console.error(`Not enough questions for ${shape}`);
                }
            }
        });
        
        // 洗牌题目顺序
        questionSet.questions = shuffle(questionSet.questions);
        questionSets.push(questionSet);
    }
    
    return questionSets;
}

// 验证生成的题目集
function validateQuestionSets(questionSets) {
    console.log('验证题目集...');
    
    // 检查总题目数
    const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);
    console.log(`总题目数: ${totalQuestions} (期望: 600)`);
    
    // 检查每份题目集的结构
    questionSets.forEach((set, index) => {
        console.log(`\n题目集 ${index + 1}:`);
        console.log(`  总题数: ${set.questions.length}`);
        
        // 按形状统计
        const shapeCounts = { circle: 0, Hexagon: 0, House: 0, Rectangle: 0, square: 0 };
        
        set.questions.forEach(question => {
            const parts = question.image.split('/');
            const filename = parts[1];
            
            let shape;
            if (filename.startsWith('circle_')) shape = 'circle';
            else if (filename.startsWith('Hexagon_')) shape = 'Hexagon';
            else if (filename.startsWith('House_')) shape = 'House';
            else if (filename.startsWith('Rectangle_')) shape = 'Rectangle';
            else if (filename.startsWith('square_')) shape = 'square';
            
            if (shape) {
                shapeCounts[shape]++;
            }
        });
        
        console.log(`  形状分布: circle=${shapeCounts.circle}, Hexagon=${shapeCounts.Hexagon}, House=${shapeCounts.House}, Rectangle=${shapeCounts.Rectangle}, square=${shapeCounts.square}`);
    });
    
    // 检查题目重复
    const allUsedQuestions = new Set();
    let duplicateCount = 0;
    
    questionSets.forEach(set => {
        set.questions.forEach(question => {
            if (allUsedQuestions.has(question.image)) {
                duplicateCount++;
                console.log(`重复题目: ${question.image}`);
            } else {
                allUsedQuestions.add(question.image);
            }
        });
    });
    
    console.log(`\n重复题目数: ${duplicateCount}`);
    console.log(`唯一题目数: ${allUsedQuestions.size}`);
}

// 保存题目集到JSON文件
function saveQuestionSets(questionSets) {
    // 只保存包含所有题目集的文件
    const allSetsPath = path.join(__dirname, 'all_question_sets.json');
    fs.writeFileSync(allSetsPath, JSON.stringify(questionSets, null, 2), 'utf8');
    console.log('已保存: all_question_sets.json');
}

// 主函数
function main() {
    try {
        console.log('开始生成题目集...');
        
        // 加载题目
        const questions = loadQuestions();
        console.log(`加载了 ${questions.length} 道题目`);
        
        // 分类题目
        const categories = categorizeQuestions(questions);
        console.log('题目分类完成');
        
        // 验证分类结果
        const shapes = ['circle', 'Hexagon', 'House', 'Rectangle', 'square'];
        
        console.log('\nfold:');
        shapes.forEach(shape => {
            console.log(`  ${shape}: ${categories.fold[shape].length} 题`);
        });
        
        // 生成题目集
        const questionSets = generateQuestionSets(categories);
        console.log(`\n生成了 ${questionSets.length} 份题目集`);
        
        // 验证题目集
        validateQuestionSets(questionSets);
        
        // 保存题目集
        console.log('\n保存题目集...');
        saveQuestionSets(questionSets);
        
        console.log('\n题目集生成完成！');
        
    } catch (error) {
        console.error('生成题目集时出错:', error);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    loadQuestions,
    categorizeQuestions,
    generateQuestionSets,
    validateQuestionSets,
    saveQuestionSets
};