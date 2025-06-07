// DocxExporter.js
// Word文档导出模块

import { getCourseConfig } from './CourseConfig.js';

export async function exportToDocx(courseId = 'caozuoxitong') {
    const { Document, Packer, Paragraph, TextRun } = window.docx;

    // 获取当前课程的练习管理器实例
    const exerciseManager = window.courseExerciseManagers?.[courseId];
    if (!exerciseManager) {
        alert('未找到课程练习数据！');
        return;
    }
    
    // 获取练习数据
    const exercises = exerciseManager.exercises;

    if (exercises.length === 0) {
        alert("题目为空！");
        return;
    }

    const paragraphs = [];

    const courseConfig = getCourseConfig(courseId);
    const title = courseConfig ? courseConfig.title : '题目集';
    
    // 标题
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title,
                    bold: true,
                    size: 36, // 字号18磅
                    font: "宋体",
                }),
            ],
            spacing: { after: 300 },
            alignment: "center",
        })
    );

    // 遍历每个题目
    exercises.forEach((item, index) => {
        const lines = item.split("\n");
        const question = lines[0];
        const options = lines.filter(line => line.trim().startsWith("-"));
        const answerMatch = item.match(/【正确答案：(\d+)】/);
        const correctIndex = answerMatch ? parseInt(answerMatch[1]) : null;
        const explanationMatch = item.match(/解析[:：]([\s\S]*)$/);
        const explanation = explanationMatch ? explanationMatch[1].trim() : "无";
        
        // 获取用户选择
        const userChoice = exerciseManager.getUserChoice(index);

        // 题干
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${index + 1}. ${question}`,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 100 },
            })
        );

        // 选项
        options.forEach(opt => {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: opt.trim(),
                            size: 24,
                            font: "宋体",
                        }),
                    ],
                    spacing: { after: 100 },
                })
            );
        });

        // 答案
        const answerText = `正确答案：${correctIndex !== null ? String.fromCharCode(65 + correctIndex) : "未知"}`;
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: answerText,
                        italics: true,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 100 },
            })
        );

        // 我的选择
        const myChoiceText = `我的选择：${userChoice !== null && userChoice !== undefined ? String.fromCharCode(65 + userChoice) : "未作答"}`;
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: myChoiceText,
                        italics: true,
                        size: 24,
                        font: "宋体",
                        color: userChoice === correctIndex ? "008000" : "FF0000", // 绿色表示正确，红色表示错误
                    }),
                ],
                spacing: { after: 100 },
            })
        );

        // 解析
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `解析：${explanation.split("\n")[0]}`,
                        size: 24,
                        font: "宋体",
                    }),
                ],
                spacing: { after: 300 },
            })
        );
    });

    // 创建 Word 文档对象
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    // 导出为 blob
    const blob = await Packer.toBlob(doc);

    // 下载
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}练习记录.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}