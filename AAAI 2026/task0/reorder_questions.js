const fs = require('fs');
const path = require('path');

/**
 * 重新排序题目文件，使题目序号连续
 * 文件命名规律：q{序号}-{类型}-{子序号}.png
 * 类型：t (题干), a (答案选项)
 * 子序号：s1,s2,s3... (题干步骤), 1,2,3,! (答案选项)
 */
class QuestionReorder {
    constructor() {
        this.imagesDir = path.join(__dirname, 'images');
        this.backupDir = path.join(__dirname, 'images_backup');
    }

    /**
     * 获取所有题目文件并按题目序号分组
     */
    getQuestionGroups() {
        const files = fs.readdirSync(this.imagesDir);
        const questionGroups = new Map();
        
        files.forEach(file => {
            const match = file.match(/^q(\d+)-(.+)\.png$/);
            if (match) {
                const questionNum = parseInt(match[1]);
                const suffix = match[2]; // 例如: "a-!", "t-s1", "a-1"
                
                if (!questionGroups.has(questionNum)) {
                    questionGroups.set(questionNum, []);
                }
                questionGroups.get(questionNum).push({
                    originalFile: file,
                    suffix: suffix,
                    questionNum: questionNum
                });
            }
        });
        
        return questionGroups;
    }

    /**
     * 创建备份目录
     */
    createBackup() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }
        
        const files = fs.readdirSync(this.imagesDir);
        files.forEach(file => {
            const srcPath = path.join(this.imagesDir, file);
            const destPath = path.join(this.backupDir, file);
            fs.copyFileSync(srcPath, destPath);
        });
        
        console.log(`✅ 已创建备份目录: ${this.backupDir}`);
    }

    /**
     * 重新排序题目文件
     */
    reorderQuestions() {
        try {
            // 创建备份
            this.createBackup();
            
            // 获取题目分组
            const questionGroups = this.getQuestionGroups();
            const sortedQuestionNums = Array.from(questionGroups.keys()).sort((a, b) => a - b);
            
            console.log(`📊 发现 ${sortedQuestionNums.length} 个题目组`);
            console.log(`📋 原始题目序号: ${sortedQuestionNums.join(', ')}`);
            
            // 检查是否需要重新排序
            let needReorder = false;
            for (let i = 0; i < sortedQuestionNums.length; i++) {
                if (sortedQuestionNums[i] !== i + 1) {
                    needReorder = true;
                    break;
                }
            }
            
            if (!needReorder) {
                console.log('✅ 题目序号已经连续，无需重新排序');
                return;
            }
            
            // 执行重命名
            const renameOperations = [];
            
            sortedQuestionNums.forEach((oldNum, index) => {
                const newNum = index + 1;
                const files = questionGroups.get(oldNum);
                
                files.forEach(fileInfo => {
                    const oldPath = path.join(this.imagesDir, fileInfo.originalFile);
                    const newFileName = `q${newNum}-${fileInfo.suffix}.png`;
                    const newPath = path.join(this.imagesDir, newFileName);
                    
                    renameOperations.push({
                        oldPath,
                        newPath,
                        oldFileName: fileInfo.originalFile,
                        newFileName
                    });
                });
            });
            
            // 先重命名为临时文件名，避免冲突
            console.log('🔄 开始重命名文件...');
            const tempOperations = [];
            
            renameOperations.forEach((op, index) => {
                const tempFileName = `temp_${index}_${path.basename(op.newPath)}`;
                const tempPath = path.join(this.imagesDir, tempFileName);
                
                fs.renameSync(op.oldPath, tempPath);
                tempOperations.push({
                    tempPath,
                    finalPath: op.newPath,
                    oldFileName: op.oldFileName,
                    newFileName: op.newFileName
                });
            });
            
            // 再重命名为最终文件名
            tempOperations.forEach(op => {
                fs.renameSync(op.tempPath, op.finalPath);
                console.log(`  ${op.oldFileName} → ${op.newFileName}`);
            });
            
            console.log('✅ 题目序号重排完成！');
            console.log(`📋 新的题目序号: ${Array.from({length: sortedQuestionNums.length}, (_, i) => i + 1).join(', ')}`);
            console.log(`💾 原始文件已备份到: ${this.backupDir}`);
            
        } catch (error) {
            console.error('❌ 重排序过程中发生错误:', error.message);
            console.log('💡 请检查备份目录并手动恢复文件');
        }
    }

    /**
     * 显示当前题目状态
     */
    showStatus() {
        const questionGroups = this.getQuestionGroups();
        const questionNums = Array.from(questionGroups.keys()).sort((a, b) => a - b);
        
        console.log('📊 当前题目状态:');
        console.log(`   题目总数: ${questionNums.length}`);
        console.log(`   题目序号: ${questionNums.join(', ')}`);
        
        // 检查连续性
        const gaps = [];
        for (let i = 1; i <= Math.max(...questionNums); i++) {
            if (!questionNums.includes(i)) {
                gaps.push(i);
            }
        }
        
        if (gaps.length > 0) {
            console.log(`   缺失序号: ${gaps.join(', ')}`);
            console.log('   ⚠️  题目序号不连续');
        } else {
            console.log('   ✅ 题目序号连续');
        }
        
        // 显示每个题目的文件数量
        questionNums.forEach(num => {
            const files = questionGroups.get(num);
            const stemFiles = files.filter(f => f.suffix.startsWith('t-')).length;
            const answerFiles = files.filter(f => f.suffix.startsWith('a-')).length;
            console.log(`   Q${num}: ${stemFiles}个题干图片, ${answerFiles}个答案选项`);
        });
    }

    /**
     * 恢复备份
     */
    restoreBackup() {
        if (!fs.existsSync(this.backupDir)) {
            console.log('❌ 备份目录不存在');
            return;
        }
        
        try {
            // 清空当前images目录
            const currentFiles = fs.readdirSync(this.imagesDir);
            currentFiles.forEach(file => {
                fs.unlinkSync(path.join(this.imagesDir, file));
            });
            
            // 从备份恢复
            const backupFiles = fs.readdirSync(this.backupDir);
            backupFiles.forEach(file => {
                const srcPath = path.join(this.backupDir, file);
                const destPath = path.join(this.imagesDir, file);
                fs.copyFileSync(srcPath, destPath);
            });
            
            console.log('✅ 已从备份恢复文件');
        } catch (error) {
            console.error('❌ 恢复备份时发生错误:', error.message);
        }
    }
}

// 命令行参数处理
function main() {
    const reorder = new QuestionReorder();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 题目序号重排工具');
        console.log('用法:');
        console.log('  node reorder_questions.js status    - 显示当前状态');
        console.log('  node reorder_questions.js reorder   - 重新排序题目');
        console.log('  node reorder_questions.js restore   - 恢复备份');
        return;
    }
    
    const command = args[0].toLowerCase();
    
    switch (command) {
        case 'status':
            reorder.showStatus();
            break;
        case 'reorder':
            reorder.reorderQuestions();
            break;
        case 'restore':
            reorder.restoreBackup();
            break;
        default:
            console.log('❌ 未知命令:', command);
            console.log('请使用: status, reorder, 或 restore');
    }
}

if (require.main === module) {
    main();
}

module.exports = QuestionReorder;