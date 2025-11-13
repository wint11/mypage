import json
import os
from collections import defaultdict

def fix_image_paths():
    # 读取当前的merged_dataset.jsonl
    with open('merged_dataset.jsonl', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 统计每个目录下每种形状的数量，用于生成正确的序号
    shape_counters = {
        'fold_1': defaultdict(int),
        'fold_2': defaultdict(int),
        'other': defaultdict(int)
    }
    
    fixed_lines = []
    
    for line in lines:
        data = json.loads(line.strip())
        old_path = data['image']
        
        # 解析路径信息
        parts = old_path.split('/')
        folder = parts[0]  # fold_1, fold_2, 或 other
        filename = parts[1]
        
        # 从文件名中提取形状信息
        if filename.startswith('circle'):
            shape = 'circle'
        elif filename.startswith('Hexagon'):
            shape = 'Hexagon'
        elif filename.startswith('House'):
            shape = 'House'
        elif filename.startswith('Rectangle'):
            shape = 'Rectangle'
        elif filename.startswith('square'):
            shape = 'square'
        else:
            print(f"Unknown shape in filename: {filename}")
            continue
        
        # 增加计数器
        shape_counters[folder][shape] += 1
        counter = shape_counters[folder][shape]
        
        # 生成新的文件名
        new_filename = f"{shape}_{counter:03d}.png"
        new_path = f"{folder}/{new_filename}"
        
        # 更新数据
        data['image'] = new_path
        fixed_lines.append(json.dumps(data, ensure_ascii=False))
    
    # 写入修正后的文件
    with open('merged_dataset_fixed_paths.jsonl', 'w', encoding='utf-8') as f:
        for line in fixed_lines:
            f.write(line + '\n')
    
    print(f"已修正 {len(fixed_lines)} 条记录的图片路径")
    print("各目录形状统计:")
    for folder, shapes in shape_counters.items():
        print(f"  {folder}:")
        for shape, count in shapes.items():
            print(f"    {shape}: {count}")

if __name__ == "__main__":
    fix_image_paths()