const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const sharp = require('sharp');

// 确保task4目录存在
const outputDir = path.join(__dirname);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 定义形状生成函数
function generateCircle(cx, cy, r, fill = 'none', stroke = 'black', strokeWidth = 2) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function generateSquare(x, y, size, fill = 'none', stroke = 'black', strokeWidth = 2) {
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function generateTriangle(cx, cy, size, fill = 'none', stroke = 'black', strokeWidth = 2) {
    const height = size * Math.sqrt(3) / 2;
    const x1 = cx;
    const y1 = cy - height / 2;
    const x2 = cx - size / 2;
    const y2 = cy + height / 2;
    const x3 = cx + size / 2;
    const y3 = cy + height / 2;
    
    return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function generateHexagon(cx, cy, size, fill = 'none', stroke = 'black', strokeWidth = 2) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return `<polygon points="${points.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function generatePentagon(cx, cy, size, fill = 'none', stroke = 'black', strokeWidth = 2) {
    const points = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180; // -90度让五角形顶点朝上
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return `<polygon points="${points.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

// 形状配置（移除三角形）
const shapes = {
    circle: { name: 'circle', generator: generateCircle },
    square: { name: 'square', generator: generateSquare },
    hexagon: { name: 'hexagon', generator: generateHexagon },
    pentagon: { name: 'pentagon', generator: generatePentagon }
};

// 绘制圆形到canvas
function drawCircle(ctx, cx, cy, r, strokeColor = 'black', strokeWidth = 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

// 绘制正方形到canvas
function drawSquare(ctx, x, y, size, strokeColor = 'black', strokeWidth = 2) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(x, y, size, size);
}

// 绘制三角形到canvas
function drawTriangle(ctx, cx, cy, size, strokeColor = 'black', strokeWidth = 2) {
    const height = size * Math.sqrt(3) / 2;
    const x1 = cx;
    const y1 = cy - height / 2;
    const x2 = cx - size / 2;
    const y2 = cy + height / 2;
    const x3 = cx + size / 2;
    const y3 = cy + height / 2;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

// 绘制六边形到canvas
function drawHexagon(ctx, cx, cy, size, strokeColor = 'black', strokeWidth = 2) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

// 绘制五边形到canvas
function drawPentagon(ctx, cx, cy, size, strokeColor = 'black', strokeWidth = 2) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

// 生成BMP图片
async function generateBMP(outerShape, innerShape, filename) {
    const size = 400; // 画布大小
    const center = size / 2;
    const outerSize = 140; // 外层形状大小（稍微小一点）
    const innerSize = 75;  // 内层形状大小（稍微小一点）
    
    // 创建canvas
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 设置白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // 绘制外层形状（黑色）
    if (outerShape === 'circle') {
        drawCircle(ctx, center, center, outerSize / 2, 'black', 3);
    } else if (outerShape === 'square') {
        drawSquare(ctx, center - outerSize / 2, center - outerSize / 2, outerSize, 'black', 3);
    } else if (outerShape === 'hexagon') {
        drawHexagon(ctx, center, center, outerSize / 2, 'black', 3);
    } else if (outerShape === 'pentagon') {
        drawPentagon(ctx, center, center, outerSize / 2, 'black', 3);
    }
    
    // 绘制内层形状（黑色）
    if (innerShape === 'circle') {
        drawCircle(ctx, center, center, innerSize / 2, 'black', 2);
    } else if (innerShape === 'square') {
        drawSquare(ctx, center - innerSize / 2, center - innerSize / 2, innerSize, 'black', 2);
    } else if (innerShape === 'triangle') {
        drawTriangle(ctx, center, center, innerSize, 'black', 2);
    } else if (innerShape === 'hexagon') {
        drawHexagon(ctx, center, center, innerSize / 2, 'black', 2);
    } else if (innerShape === 'pentagon') {
        drawPentagon(ctx, center, center, innerSize / 2, 'black', 2);
    }
    
    // 保存为PNG格式
    const pngBuffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, filename), pngBuffer);
    console.log(`生成图片: ${filename}`);
}

// 生成所有组合
async function generateAllShapes() {
    const shapeNames = Object.keys(shapes);
    let count = 1;
    
    for (const outerShape of shapeNames) {
        // 跳过外层是三角形的情况
        if (outerShape === 'triangle') continue;
        
        for (const innerShape of shapeNames) {
            const filename = `shape_${count.toString().padStart(3, '0')}_outer_${outerShape}_inner_${innerShape}.png`;
            await generateBMP(outerShape, innerShape, filename);
            count++;
        }
    }
    
    console.log(`\n总共生成了 ${count - 1} 个图片文件`);
    console.log('所有图片已保存到 task4 目录下');
}

// 运行生成函数
generateAllShapes().catch(console.error);