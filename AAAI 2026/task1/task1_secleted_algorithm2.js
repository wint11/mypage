const fs = require('fs');
const path = require('path');

/**
 * Task1 折叠分类管理器
 * 整合了图片选择、验证和JSONL生成功能
 */
class Task1FoldClassificationManager {
    constructor() {
        this.sourceImageDir = 'task1_1_images';
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
     * 改进的平衡选择算法 - 确保每个fold内形状分布也均衡
     * @param {Object} foldData - 分类数据
     * @param {number} targetPerFold - 每个fold的目标数量
     * @returns {Object} 选择的图片数据
     */
    selectGloballyBalancedImages(foldData, targetPerFold = 200) {
        // 获取所有可用的形状
        const allShapes = new Set();
        for (const foldShapes of Object.values(foldData)) {
            for (const shapeName of Object.keys(foldShapes)) {
                allShapes.add(shapeName);
            }
        }
        
        const allShapesArray = Array.from(allShapes).sort(); // 排序确保一致性
        const targetPerShapePerFold = Math.floor(targetPerFold / allShapesArray.length);
        const remainderPerFold = targetPerFold % allShapesArray.length;
        
        console.log(`每个fold目标: ${targetPerFold}张, 形状数: ${allShapesArray.length}`);
        console.log(`每个fold每种形状基础目标: ${targetPerShapePerFold}张`);
        
        const selectedByFold = {};
        this.folds.forEach(fold => selectedByFold[fold] = []);
        
        // 为每个fold分别进行平衡选择
        for (const fold of this.folds) {
            console.log(`\n处理 ${fold}...`);
            
            if (!foldData[fold]) {
                console.warn(`警告: ${fold} 没有数据`);
                continue;
            }
            
            // 计算该fold中每种形状的目标数量
            const foldShapeTargets = {};
            allShapesArray.forEach((shape, index) => {
                foldShapeTargets[shape] = targetPerShapePerFold + (index < remainderPerFold ? 1 : 0);
            });
            
            console.log(`${fold} 形状目标分布:`, foldShapeTargets);
            
            // 收集该fold中每种形状的所有图片
            const foldImagesByShape = {};
            for (const [shapeName, shapeAnswers] of Object.entries(foldData[fold])) {
                foldImagesByShape[shapeName] = [];
                for (const [answer, images] of Object.entries(shapeAnswers)) {
                    for (const img of images) {
                        foldImagesByShape[shapeName].push([img, answer]);
                    }
                }
            }
            
            // 为每种形状选择目标数量的图片
            const foldSelectedImages = [];
            for (const [shape, targetCount] of Object.entries(foldShapeTargets)) {
                const availableImages = foldImagesByShape[shape] || [];
                
                if (availableImages.length === 0) {
                    console.warn(`警告: ${fold} 中没有 ${shape} 形状的图片`);
                    continue;
                }
                
                let selectedCount = Math.min(targetCount, availableImages.length);
                
                // 如果某种形状图片不足，记录实际选择数量
                if (availableImages.length < targetCount) {
                    console.warn(`${fold} 中 ${shape} 只有 ${availableImages.length} 张，少于目标 ${targetCount} 张`);
                }
                
                // 随机选择图片，确保答案分布尽可能均衡
                const selectedForShape = this.selectBalancedByAnswer(availableImages, selectedCount);
                
                for (const [img, answer] of selectedForShape) {
                    foldSelectedImages.push(img);
                }
                
                console.log(`${fold} ${shape}: 选择了 ${selectedForShape.length}/${availableImages.length} 张`);
            }
            
            // 如果总数不足，从剩余图片中补充
            if (foldSelectedImages.length < targetPerFold) {
                const deficit = targetPerFold - foldSelectedImages.length;
                console.log(`${fold} 需要补充 ${deficit} 张图片`);
                
                // 收集所有未选择的图片
                const allFoldImages = [];
                for (const [shapeName, shapeAnswers] of Object.entries(foldData[fold])) {
                    for (const [answer, images] of Object.entries(shapeAnswers)) {
                        allFoldImages.push(...images);
                    }
                }
                
                const availableForSupplement = allFoldImages.filter(img => !foldSelectedImages.includes(img));
                
                if (availableForSupplement.length > 0) {
                    const supplementCount = Math.min(deficit, availableForSupplement.length);
                    const supplementImages = this.shuffleArray(availableForSupplement).slice(0, supplementCount);
                    foldSelectedImages.push(...supplementImages);
                    console.log(`${fold} 补充了 ${supplementImages.length} 张图片`);
                }
            }
            
            // 如果超出目标，随机移除多余的
            if (foldSelectedImages.length > targetPerFold) {
                const excess = foldSelectedImages.length - targetPerFold;
                console.log(`${fold} 移除多余的 ${excess} 张图片`);
                selectedByFold[fold] = this.shuffleArray(foldSelectedImages).slice(0, targetPerFold);
            } else {
                selectedByFold[fold] = foldSelectedImages;
            }
            
            console.log(`${fold} 最终选择: ${selectedByFold[fold].length} 张图片`);
        }
        
        return selectedByFold;
    }
    
    /**
     * 按答案平衡选择图片
     * @param {Array} imageAnswerPairs - [[图片名, 答案], ...]
     * @param {number} targetCount - 目标数量
     * @returns {Array} 选择的图片答案对
     */
    selectBalancedByAnswer(imageAnswerPairs, targetCount) {
        if (imageAnswerPairs.length <= targetCount) {
            return imageAnswerPairs;
        }
        
        // 按答案分组
        const byAnswer = {};
        for (const [img, answer] of imageAnswerPairs) {
            if (!byAnswer[answer]) byAnswer[answer] = [];
            byAnswer[answer].push([img, answer]);
        }
        
        const answers = Object.keys(byAnswer);
        const targetPerAnswer = Math.floor(targetCount / answers.length);
        const remainder = targetCount % answers.length;
        
        const selected = [];
        
        // 为每个答案选择目标数量
        answers.forEach((answer, index) => {
            const answerTarget = targetPerAnswer + (index < remainder ? 1 : 0);
            const available = byAnswer[answer];
            const selectedCount = Math.min(answerTarget, available.length);
            
            const shuffled = this.shuffleArray(available);
            selected.push(...shuffled.slice(0, selectedCount));
        });
        
        // 如果还需要更多，从剩余中随机选择
        if (selected.length < targetCount) {
            const remaining = imageAnswerPairs.filter(pair => 
                !selected.some(sel => sel[0] === pair[0])
            );
            const needed = targetCount - selected.length;
            const additional = this.shuffleArray(remaining).slice(0, needed);
            selected.push(...additional);
        }
        
        return selected.slice(0, targetCount);
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
     * 复制选中的图片到输出目录并重命名（打乱顺序）
     * @param {Array} selectedImages - 选中的图片列表
     * @param {string} sourceDir - 源目录
     * @param {string} outputDir - 输出目录
     * @param {string} foldName - fold名称
     * @returns {Object} 文件名映射关系 {原文件名: 新文件名}
     */
    copySelectedImages(selectedImages, sourceDir, outputDir, foldName) {
        const foldOutputDir = path.join(outputDir, foldName);
        const fileNameMapping = {};
        
        // 先打乱图片顺序，让答案分布更随机
        const shuffledImages = this.shuffleArray([...selectedImages]);
        console.log(`${foldName}: 已打乱 ${shuffledImages.length} 张图片的顺序`);
        
        // 按形状分组统计
        const shapeCounters = {};
        
        for (const filename of shuffledImages) {
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