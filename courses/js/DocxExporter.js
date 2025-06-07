// DocxExporter.js
// Word文档导出模块

import { exercises } from './ExerciseManager.js';
import { getCourseConfig } from './CourseConfig.js';

export async function exportToDocx(courseId = 'caozuoxitong') {
    const { Document, Packer, Paragraph, TextRun } = window.docx;

    // 读取 localStorage 里的题目
    const exercises = getExercises();

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
    link.download = "操作系统题目集.docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}