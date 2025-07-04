const fs = require('fs');
const path = require('path');

/**
 * Task1 折叠分类管理器
 * 整合了图片选择、验证和JSONL生成功能
 */
class Task1FoldClassificationManager {
    constructor() {
        this.sourceImageDir = 'task1_image';
        this.outputImageDir = 'task1_selected_algorithm2';
        this.outputJsonlFile = 'task1_selected_algorithm2.jsonl';
        this.targetPerFold = 200;
        this.folds = ['fold_1', 'fold_2', 'fold_3'];
    }

    /**
     * 从文件名中提取答案
     * @param {string} filename - 文件名
     * @returns {string|null} 答案或null
     */
    extractAnswerFromFilename(filename) {
        // 匹配模式: {shape}-id_{id}-fold_{fold}-sample_{sample}-candidate_4-answ_{answer}.png
        const match = filename.match(/-answ_([A-D])\.png$/);
        return match ? match[1] : null;
    }

    /**
     * 从文件名中提取形状
     * @param {string} filename - 文件名
     * @returns {string|null} 形状或null
     */
    extractShapeFromFilename(filename) {
        // 匹配模式: {shape}-id_{id}-fold_{fold}-sample_{sample}-candidate_4-answ_{answer}.png
        const match = filename.match(/^([a-zA-Z]+)-id_/);
        return match ? match[1] : null;
    }

    /**
     * 从文件名中提取fold
     * @param {string} filename - 文件名
     * @returns {number|null} fold编号或null
     */
    extractFoldFromFilename(filename) {
        // 匹配模式: {shape}-id_{id}-fold_{fold}-sample_{sample}-candidate_4-answ_{answer}.png
        const match = filename.match(/-fold_([0-9]+)-/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * 分析图片文件，按fold、形状和答案类型分类
     * @param {string} imageDir - 图片目录
     * @returns {Object} 分类后的数据
     */
    analyzeImages(imageDir) {
        const foldData = {};
        
        if (!fs.existsSync(imageDir)) {
            console.error(`错误: 找不到目录 ${imageDir}`);
            return foldData;
        }

        const files = fs.readdirSync(imageDir);
        
        for (const filename of files) {
            if (!filename.endsWith('.png')) continue;
            
            // 提取fold、答案和形状信息
            const foldNum = this.extractFoldFromFilename(filename);
            const answerPart = this.extractAnswerFromFilename(filename);
            const shapePart = this.extractShapeFromFilename(filename);
            
            if (foldNum !== null && answerPart && shapePart) {
                const foldPart = `fold_${foldNum}`;
                
                if (!foldData[foldPart]) foldData[foldPart] = {};
                if (!foldData[foldPart][shapePart]) foldData[foldPart][shapePart] = {};
                if (!foldData[foldPart][shapePart][answerPart]) foldData[foldPart][shapePart][answerPart] = [];
                
                foldData[foldPart][shapePart][answerPart].push(filename);
            }
        }
        
        return foldData;
    }

    /**
     * 获取全局形状分布统计
     * @param {Object} foldData - 分类数据
     * @returns {Object} 形状分布统计
     */
    getGlobalShapeDistribution(foldData) {
        const globalShapes = {};
        
        for (const [foldName, foldShapes] of Object.entries(foldData)) {
            for (const [shapeName, shapeAnswers] of Object.entries(foldShapes)) {
                const totalForShape = Object.values(shapeAnswers).reduce((sum, images) => sum + images.length, 0);
                globalShapes[shapeName] = (globalShapes[shapeName] || 0) + totalForShape;
            }
        }
        
        return globalShapes;
    }

    /**
     * 全局平衡选择图片
     * @param {Object} foldData - 分类数据
     * @param {number} targetPerFold - 每个fold的目标数量
     * @returns {Object} 选择的图片数据
     */
    selectGloballyBalancedImages(foldData, targetPerFold = 200) {
        const totalTarget = targetPerFold * 3; // 总共600张
        
        // 获取所有可用的形状
        const allShapes = new Set();
        for (const foldShapes of Object.values(foldData)) {
            for (const shapeName of Object.keys(foldShapes)) {
                allShapes.add(shapeName);
            }
        }
        
        const allShapesArray = Array.from(allShapes);
        const targetPerShape = Math.floor(totalTarget / allShapesArray.length);
        const shapeRemainder = totalTarget % allShapesArray.length;
        
        // 计算每种形状的目标数量
        const shapeTargets = {};
        allShapesArray.forEach((shape, index) => {
            shapeTargets[shape] = targetPerShape + (index < shapeRemainder ? 1 : 0);
        });
        
        console.log('形状目标分布:', shapeTargets);
        
        // 收集所有图片按形状分类
        const allImagesByShape = {};
        for (const [foldName, foldShapes] of Object.entries(foldData)) {
            for (const [shapeName, shapeAnswers] of Object.entries(foldShapes)) {
                if (!allImagesByShape[shapeName]) allImagesByShape[shapeName] = [];
                for (const [answer, images] of Object.entries(shapeAnswers)) {
                    for (const img of images) {
                        allImagesByShape[shapeName].push([img, foldName, answer]);
                    }
                }
            }
        }
        
        // 为每种形状选择目标数量的图片
        const selectedByFold = {};
        this.folds.forEach(fold => selectedByFold[fold] = []);
        
        for (const [shape, targetCount] of Object.entries(shapeTargets)) {
            const availableImages = allImagesByShape[shape] || [];
            
            let selectedImages;
            if (availableImages.length <= targetCount) {
                selectedImages = availableImages;
            } else {
                selectedImages = this.shuffleArray([...availableImages]).slice(0, targetCount);
            }
            
            // 按fold分组
            for (const [img, foldName, answer] of selectedImages) {
                selectedByFold[foldName].push(img);
            }
        }
        
        // 确保每个fold都有足够的图片
        for (const fold of this.folds) {
            const currentCount = selectedByFold[fold].length;
            
            if (currentCount < targetPerFold) {
                const needMore = targetPerFold - currentCount;
                
                // 收集该fold中所有未选择的图片
                const allFoldImages = [];
                if (foldData[fold]) {
                    for (const [shapeName, shapeAnswers] of Object.entries(foldData[fold])) {
                        for (const [answer, images] of Object.entries(shapeAnswers)) {
                            allFoldImages.push(...images);
                        }
                    }
                }
                
                // 排除已选择的图片
                const availableForSupplement = allFoldImages.filter(img => !selectedByFold[fold].includes(img));
                
                if (availableForSupplement.length > 0) {
                    const supplementCount = Math.min(needMore, availableForSupplement.length);
                    const supplementImages = this.shuffleArray(availableForSupplement).slice(0, supplementCount);
                    selectedByFold[fold].push(...supplementImages);
                }
            } else if (currentCount > targetPerFold) {
                selectedByFold[fold] = this.shuffleArray(selectedByFold[fold]).slice(0, targetPerFold);
            }
        }
        
        return selectedByFold;
    }

    /**
     * 洗牌算法
     * @param {Array} array - 要洗牌的数组
     * @returns {Array} 洗牌后的数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 递归删除目录（兼容旧版本 Node.js）
     * @param {string} dirPath - 要删除的目录路径
     */
    removeDirectoryRecursive(dirPath) {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    this.removeDirectoryRecursive(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            fs.rmdirSync(dirPath);
        }
    }

    /**
     * 创建输出目录
     * @returns {string} 输出目录路径
     */
    createOutputDirectories() {
        if (fs.existsSync(this.outputImageDir)) {
            // 兼容旧版本 Node.js，使用递归删除目录的方法
            this.removeDirectoryRecursive(this.outputImageDir);
        }
        
        fs.mkdirSync(this.outputImageDir, { recursive: true });
        
        for (const fold of this.folds) {
            const foldDir = path.join(this.outputImageDir, fold);
            fs.mkdirSync(foldDir, { recursive: true });
        }
        
        return this.outputImageDir;
    }

    /**
     * 复制选中的图片到输出目录并重命名
     * @param {Array} selectedImages - 选中的图片列表
     * @param {string} sourceDir - 源目录
     * @param {string} outputDir - 输出目录
     * @param {string} foldName - fold名称
     * @returns {Object} 文件名映射关系 {原文件名: 新文件名}
     */
    copySelectedImages(selectedImages, sourceDir, outputDir, foldName) {
        const foldOutputDir = path.join(outputDir, foldName);
        const fileNameMapping = {};
        
        // 按形状分组统计
        const shapeCounters = {};
        
        for (const filename of selectedImages) {
            const shape = this.extractShapeFromFilename(filename);
            if (shape) {
                shapeCounters[shape] = (shapeCounters[shape] || 0) + 1;
                const newFilename = `${shape}_${String(shapeCounters[shape]).padStart(3, '0')}.png`;
                
                const sourcePath = path.join(sourceDir, filename);
                const destPath = path.join(foldOutputDir, newFilename);
                
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, destPath);
                    fileNameMapping[filename] = newFilename;
                }
            }
        }
        
        return fileNameMapping;
    }

    /**
     * 分析选择结果的统计信息
     * @param {Object} selectedData - 选择的数据
     */
    analyzeSelectionResults(selectedData) {
        console.log('\n=== 选择结果详细统计 ===');
        
        let totalImages = 0;
        const globalShapeCount = {};
        const globalAnswerCount = {};
        
        for (const [fold, selectedImages] of Object.entries(selectedData)) {
            console.log(`\n${fold}: ${selectedImages.length} 张图片`);
            
            const foldShapeCount = {};
            const foldAnswerCount = {};
            
            for (const filename of selectedImages) {
                totalImages++;
                
                // 统计形状
                const shape = this.extractShapeFromFilename(filename) || 'unknown';
                foldShapeCount[shape] = (foldShapeCount[shape] || 0) + 1;
                globalShapeCount[shape] = (globalShapeCount[shape] || 0) + 1;
                
                // 统计答案
                const answer = this.extractAnswerFromFilename(filename);
                if (answer) {
                    foldAnswerCount[answer] = (foldAnswerCount[answer] || 0) + 1;
                    globalAnswerCount[answer] = (globalAnswerCount[answer] || 0) + 1;
                }
            }
            
            console.log(`  形状分布: ${JSON.stringify(foldShapeCount)}`);
            console.log(`  答案分布: ${JSON.stringify(foldAnswerCount)}`);
        }
        
        console.log('\n=== 全局统计 ===');
        console.log(`总图片数: ${totalImages}`);
        console.log(`全局形状分布: ${JSON.stringify(globalShapeCount)}`);
        console.log(`全局答案分布: ${JSON.stringify(globalAnswerCount)}`);
        
        // 检查平衡性
        const shapeCounts = Object.values(globalShapeCount);
        const answerCounts = Object.values(globalAnswerCount);
        
        const shapeBalance = shapeCounts.length > 0 ? Math.max(...shapeCounts) - Math.min(...shapeCounts) : 0;
        const answerBalance = answerCounts.length > 0 ? Math.max(...answerCounts) - Math.min(...answerCounts) : 0;
        
        console.log('\n=== 平衡性评估 ===');
        console.log(`形状分布差异: ${shapeBalance} (越小越好)`);
        console.log(`答案分布差异: ${answerBalance} (越小越好)`);
        
        if (shapeBalance <= 20) {
            console.log('✓ 形状分布相对平衡');
        } else {
            console.log('⚠ 形状分布不够平衡');
        }
        
        if (answerBalance <= 10) {
            console.log('✓ 答案分布相对平衡');
        } else {
            console.log('⚠ 答案分布不够平衡');
        }
    }

    /**
     * 验证选择的图片结果
     * @returns {Object} 统计结果
     */
    verifySelectedImages() {
        if (!fs.existsSync(this.outputImageDir)) {
            console.error(`错误: 找不到目录 ${this.outputImageDir}`);
            return null;
        }
        
        const totalStats = {
            totalImages: 0,
            foldDistribution: {},
            answerDistribution: {},
            shapeDistribution: {},
            foldAnswerDistribution: {},
            foldShapeDistribution: {}
        };
        
        for (const fold of this.folds) {
            const foldDir = path.join(this.outputImageDir, fold);
            
            if (!fs.existsSync(foldDir)) {
                console.warn(`警告: 找不到目录 ${foldDir}`);
                continue;
            }
            
            const images = fs.readdirSync(foldDir).filter(f => f.endsWith('.png'));
            const foldCount = images.length;
            totalStats.totalImages += foldCount;
            totalStats.foldDistribution[fold] = foldCount;
            totalStats.foldAnswerDistribution[fold] = {};
            totalStats.foldShapeDistribution[fold] = {};
            
            console.log(`\n=== ${fold} 分析结果 ===`);
            console.log(`总图片数: ${foldCount}`);
            
            const answerCounter = {};
            const shapeCounter = {};
            
            for (const filename of images) {
                const answer = this.extractAnswerFromFilename(filename);
                const shape = this.extractShapeFromFilename(filename);
                
                if (answer) {
                    answerCounter[answer] = (answerCounter[answer] || 0) + 1;
                    totalStats.answerDistribution[answer] = (totalStats.answerDistribution[answer] || 0) + 1;
                    totalStats.foldAnswerDistribution[fold][answer] = (totalStats.foldAnswerDistribution[fold][answer] || 0) + 1;
                }
                
                if (shape) {
                    shapeCounter[shape] = (shapeCounter[shape] || 0) + 1;
                    totalStats.shapeDistribution[shape] = (totalStats.shapeDistribution[shape] || 0) + 1;
                    totalStats.foldShapeDistribution[fold][shape] = (totalStats.foldShapeDistribution[fold][shape] || 0) + 1;
                }
            }
            
            // 打印答案分布
            console.log('答案分布:');
            for (const [answer, count] of Object.entries(answerCounter).sort()) {
                const percentage = foldCount > 0 ? (count / foldCount * 100).toFixed(1) : 0;
                console.log(`  ${answer}: ${count} 张 (${percentage}%)`);
            }
            
            // 打印形状分布
            console.log('形状分布:');
            for (const [shape, count] of Object.entries(shapeCounter).sort()) {
                const percentage = foldCount > 0 ? (count / foldCount * 100).toFixed(1) : 0;
                console.log(`  ${shape}: ${count} 张 (${percentage}%)`);
            }
        }
        
        // 打印总体统计
        console.log('\n' + '='.repeat(50));
        console.log('=== 总体统计结果 ===');
        console.log('='.repeat(50));
        
        console.log(`\n总图片数: ${totalStats.totalImages}`);
        
        console.log('\nFold分布:');
        for (const [fold, count] of Object.entries(totalStats.foldDistribution)) {
            const percentage = totalStats.totalImages > 0 ? (count / totalStats.totalImages * 100).toFixed(1) : 0;
            console.log(`  ${fold}: ${count} 张 (${percentage}%)`);
        }
        
        console.log('\n总体答案分布:');
        for (const [answer, count] of Object.entries(totalStats.answerDistribution).sort()) {
            const percentage = totalStats.totalImages > 0 ? (count / totalStats.totalImages * 100).toFixed(1) : 0;
            console.log(`  ${answer}: ${count} 张 (${percentage}%)`);
        }
        
        console.log('\n总体形状分布:');
        for (const [shape, count] of Object.entries(totalStats.shapeDistribution).sort()) {
            const percentage = totalStats.totalImages > 0 ? (count / totalStats.totalImages * 100).toFixed(1) : 0;
            console.log(`  ${shape}: ${count} 张 (${percentage}%)`);
        }
        
        // 检查平衡性
        console.log('\n=== 平衡性检查 ===');
        
        // 检查每个fold是否都有200张图片
        let foldBalanceOk = true;
        for (const [fold, count] of Object.entries(totalStats.foldDistribution)) {
            if (count !== 200) {
                console.log(`警告: ${fold} 有 ${count} 张图片，期望 200 张`);
                foldBalanceOk = false;
            }
        }
        
        if (foldBalanceOk) {
            console.log('✓ Fold分布平衡 (每个fold都有200张图片)');
        }
        
        // 检查答案分布是否平衡
        const answerCounts = Object.values(totalStats.answerDistribution);
        if (answerCounts.length > 0) {
            const answerBalanceOk = Math.max(...answerCounts) - Math.min(...answerCounts) <= 10;
            if (answerBalanceOk) {
                console.log('✓ 答案分布相对平衡');
            } else {
                console.log(`警告: 答案分布不平衡，最大差异: ${Math.max(...answerCounts) - Math.min(...answerCounts)}`);
            }
        }
        
        // 检查形状分布是否平衡
        const shapeCounts = Object.values(totalStats.shapeDistribution);
        if (shapeCounts.length > 0) {
            const shapeBalanceOk = Math.max(...shapeCounts) - Math.min(...shapeCounts) <= 30;
            if (shapeBalanceOk) {
                console.log('✓ 形状分布相对平衡');
            } else {
                console.log(`警告: 形状分布不平衡，最大差异: ${Math.max(...shapeCounts) - Math.min(...shapeCounts)}`);
            }
        }
        
        return totalStats;
    }

    /**
     * 为选中的图片生成JSONL文件
     * @param {Object} fileNameMappings - 文件名映射关系 {fold: {原文件名: 新文件名}}
     */
    generateJsonlForSelectedImages(fileNameMappings = {}) {
        if (!fs.existsSync(this.outputImageDir)) {
            console.error(`错误: 找不到目录 ${this.outputImageDir}`);
            return;
        }
        
        // 收集所有图片文件
        const allImages = [];
        
        for (const fold of this.folds) {
            const foldDir = path.join(this.outputImageDir, fold);
            if (fs.existsSync(foldDir)) {
                const files = fs.readdirSync(foldDir);
                for (const filename of files) {
                    if (filename.endsWith('.png')) {
                        // 从原始文件名中提取答案（通过映射关系找到原始文件名）
                        let answer = null;
                        
                        // 如果有文件名映射，从原始文件名中提取答案
                        if (fileNameMappings[fold]) {
                            const originalFilename = Object.keys(fileNameMappings[fold]).find(
                                key => fileNameMappings[fold][key] === filename
                            );
                            if (originalFilename) {
                                answer = this.extractAnswerFromFilename(originalFilename);
                            }
                        }
                        
                        // 如果没有映射关系或找不到原始文件名，尝试从当前文件名提取
                        if (!answer) {
                            answer = this.extractAnswerFromFilename(filename);
                        }
                        
                        if (answer) {
                            allImages.push({
                                image: `${fold}/${filename}`,  // 包含fold路径
                                answer: answer
                            });
                        } else {
                            console.warn(`警告: 无法从文件名 ${filename} 中提取答案`);
                        }
                    }
                }
            }
        }
        
        // 按文件名排序以保持一致性
        allImages.sort((a, b) => a.image.localeCompare(b.image));
        
        // 写入JSONL文件
        const jsonlContent = allImages.map(item => JSON.stringify(item)).join('\n');
        fs.writeFileSync(this.outputJsonlFile, jsonlContent, 'utf8');
        
        console.log('\n=== JSONL文件生成完成 ===');
        console.log(`输出文件: ${this.outputJsonlFile}`);
        console.log(`总记录数: ${allImages.length}`);
        
        // 统计答案分布
        const answerCount = {};
        for (const item of allImages) {
            const answer = item.answer;
            answerCount[answer] = (answerCount[answer] || 0) + 1;
        }
        
        const sortedAnswerCount = {};
        Object.keys(answerCount).sort().forEach(key => {
            sortedAnswerCount[key] = answerCount[key];
        });
        
        console.log(`答案分布: ${JSON.stringify(sortedAnswerCount)}`);
        
        // 显示前几条记录作为示例
        console.log('\n前5条记录示例:');
        for (let i = 0; i < Math.min(5, allImages.length); i++) {
            console.log(`  ${i + 1}. ${JSON.stringify(allImages[i])}`);
        }
        
        if (allImages.length > 5) {
            console.log('  ...');
            console.log(`  ${allImages.length}. ${JSON.stringify(allImages[allImages.length - 1])}`);
        }
    }

    /**
     * 执行完整流程
     */
    executeFullProcess() {
        console.log('=== 开始执行完整的图片选择和处理流程 ===\n');
        
        // 选择并复制图片
        const fileNameMappings = this.selectAndCopyImages();
        
        // 验证选择结果
        this.verifySelectedImages();
        
        // 生成JSONL文件
        this.generateJsonlForSelectedImages(fileNameMappings);
        
        console.log('\n=== 完整流程执行完成 ===');
    }

    /**
     * 仅执行图片选择和复制
     * @returns {Object} 文件名映射关系 {fold: {原文件名: 新文件名}}
     */
    selectAndCopyImages() {
        console.log('开始执行图片选择和复制...');
        
        if (!fs.existsSync(this.sourceImageDir)) {
            console.error(`错误: 找不到图片目录 ${this.sourceImageDir}`);
            return;
        }
        
        const foldData = this.analyzeImages(this.sourceImageDir);
        if (Object.keys(foldData).length === 0) {
            console.error('错误: 没有找到符合格式的图片文件');
            return;
        }
        
        const outputDir = this.createOutputDirectories();
        const selectedData = this.selectGloballyBalancedImages(foldData, this.targetPerFold);
        
        // 复制选中的图片并收集文件名映射
        const fileNameMappings = {};
        for (const [fold, selectedImages] of Object.entries(selectedData)) {
            if (selectedImages.length > 0) {
                const mapping = this.copySelectedImages(selectedImages, this.sourceImageDir, outputDir, fold);
                fileNameMappings[fold] = mapping;
            }
        }
        
        this.analyzeSelectionResults(selectedData);
        console.log('图片选择和复制完成！');
        
        return fileNameMappings;
    }

    /**
     * 仅验证已选择的图片
     */
    verifyOnly() {
        console.log('开始验证图片选择结果...');
        const stats = this.verifySelectedImages();
        console.log('验证完成！');
        return stats;
    }

    /**
     * 仅生成JSONL文件
     */
    generateJsonlOnly() {
        console.log('开始为选中的图片生成JSONL文件...');
        this.generateJsonlForSelectedImages();
        console.log('JSONL文件生成完成！');
    }
}

// 导出类
module.exports = Task1FoldClassificationManager;

// 如果直接运行此文件，执行完整流程
if (require.main === module) {
    const manager = new Task1FoldClassificationManager();
    manager.executeFullProcess();
}