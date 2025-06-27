const fs = require('fs');
const path = require('path');

/**
 * 根据图片文件自动生成questions.json
 * 编码规则：q{题号}-{类型}-{标识}.png
 * - q1表示第一题
 * - a表示答案选项，t表示题干
 * - s1,s2,s3表示步骤，1,2,3表示选项序号，!表示正确选项
 */

function generateQuestionsJson() {
    const imagesDir = path.join(__dirname, 'images');
    const outputFile = path.join(__dirname, 'questions.json');
    
    // 读取images目录中的所有文件
    const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.png'));
    
    // 解析文件名并分组
    const questionsData = {};
    
    files.forEach(file => {
        const match = file.match(/^q(\d+)-(a|t)-([\w!]+)\.png$/);
        if (!match) {
            console.warn(`文件名格式不符合规则: ${file}`);
            return;
        }
        
        const [, questionNum, type, identifier] = match;
        const qNum = parseInt(questionNum);
        
        if (!questionsData[qNum]) {
            questionsData[qNum] = {
                questionNumber: qNum,
                stemImages: [],
                answerFiles: [], // 临时存储答案文件
                correctFile: null // 正确答案文件
            };
        }
        
        if (type === 't') {
            // 题干图片 (t-s1, t-s2, t-s3)
            questionsData[qNum].stemImages.push(file);
        } else if (type === 'a') {
            // 答案选项
            if (identifier === '!') {
                // 正确答案
                questionsData[qNum].correctFile = file;
            } else {
                // 其他选项 (1, 2, 3)
                questionsData[qNum].answerFiles.push(file);
            }
        }
    });
    
    // 为每个题目随机分配选项位置
    Object.values(questionsData).forEach(question => {
        const allAnswers = [...question.answerFiles];
        if (question.correctFile) {
            allAnswers.push(question.correctFile);
        }
        
        // 随机打乱选项顺序
        const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
        const optionLetters = ['A', 'B', 'C', 'D'];
        
        question.options = {};
        question.correctAnswer = null;
        
        shuffledAnswers.forEach((file, index) => {
            const letter = optionLetters[index];
            question.options[letter] = file;
            
            // 找到正确答案的位置
            if (file === question.correctFile) {
                question.correctAnswer = letter;
            }
        });
        
        // 清理临时属性
        delete question.answerFiles;
        delete question.correctFile;
    });
    
    // 对每个题目的stemImages按文件名排序
    Object.values(questionsData).forEach(question => {
        question.stemImages.sort((a, b) => {
            const aMatch = a.match(/s(\d+)/);
            const bMatch = b.match(/s(\d+)/);
            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            return a.localeCompare(b);
        });
    });
    
    // 转换为数组并按题号排序
    const questions = Object.values(questionsData).sort((a, b) => a.questionNumber - b.questionNumber);
    
    // 生成最终的JSON结构
    const result = {
        questions: questions
    };
    
    // 写入文件
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    
    console.log(`成功生成 questions.json，包含 ${questions.length} 道题目`);
    console.log('生成的题目信息:');
    questions.forEach(q => {
        console.log(`题目 ${q.questionNumber}: ${q.stemImages.length} 张题干图片, ${Object.keys(q.options).length} 个选项, 正确答案: ${q.correctAnswer}`);
    });
    
    return result;
}

// 如果直接运行此脚本
if (require.main === module) {
    try {
        generateQuestionsJson();
    } catch (error) {
        console.error('生成questions.json时出错:', error.message);
        process.exit(1);
    }
}

module.exports = { generateQuestionsJson };