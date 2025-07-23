const fs = require('fs');
const path = require('path');

/**
 * 重命名图片文件，从完整文件名提取简化格式
 * 例如：_2DimgType-Symmetric-sample_0-answ_C.png -> sample_0.png
 * @param {string} sourceDir - 源目录路径
 * @param {string} targetDir - 目标目录路径（可选，默认为源目录下的renamed文件夹）
 */
function renameImages(sourceDir, targetDir = null) {
    // 如果没有指定目标目录，则在源目录下创建renamed文件夹
    if (!targetDir) {
        targetDir = path.join(sourceDir, 'renamed');
    }

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
        // 读取源目录中的所有文件
        const files = fs.readdirSync(sourceDir);
        
        // 过滤出图片文件
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext);
        });

        console.log(`找到 ${imageFiles.length} 个图片文件`);

        imageFiles.forEach(file => {
            // 提取sample_数字部分
            const match = file.match(/sample_(\d+)/i);
            if (match) {
                const sampleNumber = match[1];
                const extension = path.extname(file);
                const newFileName = `sample_${sampleNumber}${extension}`;
                
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, newFileName);
                
                try {
                    // 复制文件到新位置并重命名
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`重命名: ${file} -> ${newFileName}`);
                } catch (error) {
                    console.error(`重命名文件 ${file} 时出错:`, error.message);
                }
            } else {
                console.log(`跳过文件 ${file}：未找到sample_数字格式`);
            }
        });

        console.log('重命名完成！');
    } catch (error) {
        console.error('读取目录时出错:', error.message);
    }
}

/**
 * 批量处理多个子目录
 * @param {string} baseDir - 基础目录路径
 * @param {string[]} subDirs - 子目录名称数组
 */
function batchRenameImages(baseDir, subDirs) {
    subDirs.forEach(subDir => {
        const fullPath = path.join(baseDir, subDir);
        if (fs.existsSync(fullPath)) {
            console.log(`\n处理目录: ${fullPath}`);
            renameImages(fullPath);
        } else {
            console.log(`目录不存在: ${fullPath}`);
        }
    });
}

// 使用示例
if (require.main === module) {
    // 当前脚本所在目录
    const currentDir = __dirname;
    
    // 示例1：处理单个目录
    // const sourceDirectory = path.join(currentDir, 'task4_selected', '_2DTo3D_N', 'easy');
    // renameImages(sourceDirectory);
    
    // 示例2：批量处理多个目录
    const baseDir = path.join(currentDir, 'task4_selected');
    const subDirectories = [
        '_2DTo3D_N/easy',
        '_2DTo3D_N/hard',
        '_2DTo3D_Y/easy',
        '_2DTo3D_Y/hard'
    ];
    
    console.log('开始批量重命名图片文件...');
    batchRenameImages(baseDir, subDirectories);
}

// 导出函数供其他模块使用
module.exports = {
    renameImages,
    batchRenameImages
};