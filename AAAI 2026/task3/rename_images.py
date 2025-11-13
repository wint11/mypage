import os
import json
import re
from collections import defaultdict

def rename_images_and_update_jsonl():
    # 定义路径
    fold_dir = "fold"
    jsonl_file = "fold.jsonl"
    
    # 读取现有的jsonl文件
    with open(jsonl_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 解析所有条目
    entries = []
    for line in lines:
        entry = json.loads(line.strip())
        entries.append(entry)
    
    # 按形状分组图片
    shape_groups = defaultdict(list)
    
    for entry in entries:
        image_name = entry['image']
        # 提取形状名称
        if image_name.startswith('circle-'):
            shape = 'circle'
        elif image_name.startswith('Hexagon-'):
            shape = 'Hexagon'
        elif image_name.startswith('House-'):
            shape = 'House'
        elif image_name.startswith('Rectangle-'):
            shape = 'Rectangle'
        elif image_name.startswith('square-'):
            shape = 'square'
        else:
            print(f"Unknown shape for image: {image_name}")
            continue
            
        shape_groups[shape].append(entry)
    
    # 为每个形状重命名图片并更新条目
    updated_entries = []
    
    for shape, shape_entries in shape_groups.items():
        print(f"Processing {len(shape_entries)} images for shape: {shape}")
        
        for i, entry in enumerate(shape_entries, 1):
            old_image_name = entry['image']
            old_image_path = os.path.join(fold_dir, old_image_name)
            
            # 生成新的文件名
            new_image_name = f"{shape}_{i:03d}.png"
            new_image_path = os.path.join(fold_dir, new_image_name)
            
            # 重命名文件
            if os.path.exists(old_image_path):
                os.rename(old_image_path, new_image_path)
                print(f"Renamed: {old_image_name} -> {new_image_name}")
            else:
                print(f"Warning: File not found: {old_image_path}")
            
            # 更新条目
            entry['image'] = f"fold/{new_image_name}"
            updated_entries.append(entry)
    
    # 写入更新后的jsonl文件
    with open(jsonl_file, 'w', encoding='utf-8') as f:
        for entry in updated_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    print(f"\nCompleted! Updated {len(updated_entries)} entries in {jsonl_file}")
    print("All images have been renamed and jsonl file has been updated.")

if __name__ == "__main__":
    rename_images_and_update_jsonl()