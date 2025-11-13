const fs = require('fs');
const path = require('path');

// 读取题目数据
function loadQuestions() {
    const filePath = path.join(__dirname, 'merged_answer.jsonl');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => JSON.parse(line));
}

// 按类型和难度分类题目
function categorizeQuestions(questions) {
    const categories = {
        _3DTo2D_N: { easy: [], hard: [] },
        _3DTo2D_Y: { easy: [], hard: [] }
    };

    questions.forEach(question => {
        const imagePath = question.image;
        const parts = imagePath.split('/');
        
        // 判断类型：_3DTo2D_N 或 _3DTo2D_Y
        let type;
        if (imagePath.includes('_3DTo2D_N/')) {
            type = '_3DTo2D_N';
        } else if (imagePath.includes('_3DTo2D_Y/')) {
            type = '_3DTo2D_Y';
        }
        
        // 判断难度：easy 或 hard
        let difficulty;
        if (imagePath.includes('/easy/')) {
            difficulty = 'easy';
        } else if (imagePath.includes('/hard/')) {
            difficulty = 'hard';
        }

        if (type && difficulty && categories[type] && categories[type][difficulty]) {
            categories[type][difficulty].push(question);
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
    const types = ['_3DTo2D_N', '_3DTo2D_Y'];
    const difficulties = ['easy', 'hard'];
    
    // 为每个类型的每种难度创建洗牌后的题目列表
    const shuffledCategories = {};
    types.forEach(type => {
        shuffledCategories[type] = {};
        difficulties.forEach(difficulty => {
            shuffledCategories[type][difficulty] = shuffle(categories[type][difficulty]);
        });
    });
    
    // 跟踪每个类别已使用的题目数量
    const usedCounts = {};
    types.forEach(type => {
        usedCounts[type] = {};
        difficulties.forEach(difficulty => {
            usedCounts[type][difficulty] = 0;
        });
    });
    
    // 生成20份题目集
    for (let setIndex = 0; setIndex < 20; setIndex++) {
        const questionSet = {
            setId: setIndex + 1,
            questions: []
        };
        
        // 前10个题目集从_3DTo2D_N中选，后10个从_3DTo2D_Y中选
        const currentType = setIndex < 10 ? '_3DTo2D_N' : '_3DTo2D_Y';
        
        // 每个题目集30道题：15道easy，15道hard
        difficulties.forEach(difficulty => {
            for (let i = 0; i < 15; i++) {
                const questionIndex = usedCounts[currentType][difficulty];
                if (questionIndex < shuffledCategories[currentType][difficulty].length) {
                    questionSet.questions.push(shuffledCategories[currentType][difficulty][questionIndex]);
                    usedCounts[currentType][difficulty]++;
                } else {
                    console.error(`Not enough questions for ${currentType}/${difficulty}`);
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
        
        // 按类型和难度统计
        const typeCounts = { _3DTo2D_N: 0, _3DTo2D_Y: 0 };
        const difficultyCounts = { easy: 0, hard: 0 };
        const detailedCounts = {
            _3DTo2D_N: { easy: 0, hard: 0 },
            _3DTo2D_Y: { easy: 0, hard: 0 }
        };
        
        set.questions.forEach(question => {
            const imagePath = question.image;
            
            // 判断类型
            let type;
            if (imagePath.includes('_3DTo2D_N/')) {
                type = '_3DTo2D_N';
                typeCounts._3DTo2D_N++;
            } else if (imagePath.includes('_3DTo2D_Y/')) {
                type = '_3DTo2D_Y';
                typeCounts._3DTo2D_Y++;
            }
            
            // 判断难度
            let difficulty;
            if (imagePath.includes('/easy/')) {
                difficulty = 'easy';
                difficultyCounts.easy++;
            } else if (imagePath.includes('/hard/')) {
                difficulty = 'hard';
                difficultyCounts.hard++;
            }
            
            // 详细统计
            if (type && difficulty) {
                detailedCounts[type][difficulty]++;
            }
        });
        
        console.log(`  类型分布: _3DTo2D_N=${typeCounts._3DTo2D_N}, _3DTo2D_Y=${typeCounts._3DTo2D_Y}`);
        console.log(`  难度分布: easy=${difficultyCounts.easy}, hard=${difficultyCounts.hard}`);
        console.log(`  详细分布: _3DTo2D_N(easy=${detailedCounts._3DTo2D_N.easy}, hard=${detailedCounts._3DTo2D_N.hard}), _3DTo2D_Y(easy=${detailedCounts._3DTo2D_Y.easy}, hard=${detailedCounts._3DTo2D_Y.hard})`);
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
        const types = ['_3DTo2D_N', '_3DTo2D_Y'];
        const difficulties = ['easy', 'hard'];
        
        types.forEach(type => {
            console.log(`\n${type}:`);
            difficulties.forEach(difficulty => {
                console.log(`  ${difficulty}: ${categories[type][difficulty].length} 题`);
            });
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