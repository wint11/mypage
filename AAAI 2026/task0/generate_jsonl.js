const fs = require('fs');
const path = require('path');

// 读取questions.json文件
function generateJsonl() {
  try {
    // 读取questions.json文件
    const questionsPath = path.join(__dirname, 'questions.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    
    const questions = questionsData.questions;
    const jsonlLines = [];
    
    // 遍历每个题目
    questions.forEach(question => {
      const questionNumber = question.questionNumber;
      const correctAnswer = question.correctAnswer;
      
      // 生成图片路径，格式为：原始图片/第xxx题.png
      const imagePath = `paperfolding/第${questionNumber.toString().padStart(3, '0')}题.png`;
      
      // 创建jsonl格式的对象
      const jsonlObject = {
        image: imagePath,
        answer: correctAnswer
      };
      
      // 转换为JSON字符串并添加到数组
      jsonlLines.push(JSON.stringify(jsonlObject));
    });
    
    // 将所有行合并为jsonl格式（每行一个JSON对象）
    const jsonlContent = jsonlLines.join('\n');
    
    // 写入到文件
    const outputPath = path.join(__dirname, 'paperfolding_data.jsonl');
    fs.writeFileSync(outputPath, jsonlContent, 'utf8');
    
    console.log(`成功生成 ${questions.length} 条记录到 ${outputPath}`);
    console.log('前5条记录预览:');
    jsonlLines.slice(0, 5).forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('生成jsonl文件时出错:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateJsonl();
}

module.exports = { generateJsonl };