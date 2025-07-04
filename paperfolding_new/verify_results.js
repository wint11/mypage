const fs = require('fs');
const path = require('path');

// 验证结果
function verifyResults() {
    console.log('=== 验证筛选结果 ===\n');
    
    // 1. 检查图片文件
    const imagesDir = path.join(__dirname, 'images_selected');
    const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.png'));
    
    console.log(`总图片数量: ${imageFiles.length}`);
    
    // 按形状统计图片
    const imageShapeCounts = {};
    imageFiles.forEach(file => {
        const shape = file.split('_')[0];
        imageShapeCounts[shape] = (imageShapeCounts[shape] || 0) + 1;
    });
    
    console.log('\n图片按形状分布:');
    Object.entries(imageShapeCounts).forEach(([shape, count]) => {
        console.log(`${shape}: ${count} 张`);
    });
    
    // 2. 检查答案文件
    const answerFile = path.join(__dirname, 'answer_selected.jsonl');
    const answerContent = fs.readFileSync(answerFile, 'utf8');
    const answerLines = answerContent.trim().split('\n');
    
    console.log(`\n总答案条目数: ${answerLines.length}`);
    
    // 统计答案分布
    const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
    const answerShapeCounts = {};
    
    answerLines.forEach(line => {
        const data = JSON.parse(line);
        const answer = data.answer;
        const shape = data.image.split('_')[0];
        
        answerCounts[answer]++;
        answerShapeCounts[shape] = (answerShapeCounts[shape] || 0) + 1;
    });
    
    console.log('\n答案分布:');
    Object.entries(answerCounts).forEach(([answer, count]) => {
        console.log(`${answer}: ${count} 个`);
    });
    
    console.log('\n答案文件按形状分布:');
    Object.entries(answerShapeCounts).forEach(([shape, count]) => {
        console.log(`${shape}: ${count} 条`);
    });
    
    // 3. 验证图片和答案的一致性
    console.log('\n=== 一致性检查 ===');
    
    let consistent = true;
    
    // 检查图片数量和答案数量是否一致
    if (imageFiles.length !== answerLines.length) {
        console.log(`❌ 图片数量(${imageFiles.length})与答案数量(${answerLines.length})不一致`);
        consistent = false;
    } else {
        console.log(`✅ 图片数量与答案数量一致: ${imageFiles.length}`);
    }
    
    // 检查每个形状的数量是否一致
    Object.keys(imageShapeCounts).forEach(shape => {
        if (imageShapeCounts[shape] !== answerShapeCounts[shape]) {
            console.log(`❌ ${shape}形状图片数量(${imageShapeCounts[shape]})与答案数量(${answerShapeCounts[shape]})不一致`);
            consistent = false;
        } else {
            console.log(`✅ ${shape}形状数量一致: ${imageShapeCounts[shape]}`);
        }
    });
    
    // 检查文件名对应关系
    const imageSet = new Set(imageFiles.map(f => f.replace('.png', '')));
    let nameConsistent = true;
    
    answerLines.forEach(line => {
        const data = JSON.parse(line);
        const imageName = data.image.replace('.png', '');
        if (!imageSet.has(imageName)) {
            console.log(`❌ 答案文件中的图片 ${data.image} 在图片文件夹中不存在`);
            nameConsistent = false;
        }
    });
    
    if (nameConsistent) {
        console.log('✅ 所有答案条目对应的图片文件都存在');
    }
    
    console.log('\n=== 验证完成 ===');
    if (consistent && nameConsistent) {
        console.log('🎉 所有检查通过！数据完整且一致。');
    } else {
        console.log('⚠️  发现数据不一致问题，请检查。');
    }
}

verifyResults();