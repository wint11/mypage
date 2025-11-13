from PIL import Image
import os
import glob

# 获取task4目录下所有PNG文件
png_files = glob.glob('*.png')

print(f"找到 {len(png_files)} 个PNG文件")

# 转换每个PNG文件为BMP格式
for png_file in png_files:
    # 打开PNG图片
    img = Image.open(png_file)
    
    # 生成BMP文件名
    bmp_file = png_file.replace('.png', '.bmp')
    
    # 保存为BMP格式
    img.save(bmp_file, 'BMP')
    
    print(f"转换完成: {png_file} -> {bmp_file}")
    
    # 删除原PNG文件
    os.remove(png_file)
    print(f"删除原文件: {png_file}")

print("\n所有PNG文件已成功转换为BMP格式并删除原文件")
print(f"共转换了 {len(png_files)} 个文件")