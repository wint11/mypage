import os
import json
import re
from collections import defaultdict

def extract_shape_from_filename(filename):
    """从文件名中提取形状名称"""
    # 匹配形状名称（在第一个-之前）
    match = re.match(r'^([^-]+)', filename)
    if match:
        shape = match.group(1)
        # 处理特殊情况
        if shape.lower() == 'hexagon':
            return 'Hexagon'
        elif shape.lower() == 'house':
            return 'House'
        elif shape.lower() == 'rectangle':
            return 'Rectangle'
        elif shape.lower() == 'circle':
            return 'circle'
        elif shape.lower() == 'square':
            return 'square'
        else:
            return shape
    return 'unknown'

def rename_images_in_folder(folder_path, folder_name):
    """重命名文件夹中的图片文件"""
    if not os.path.exists(folder_path):
        print(f"文件夹不存在: {folder_path}")
        return {}
    
    # 获取所有png文件
    png_files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
    
    # 按形状分组
    shape_groups = defaultdict(list)
    for filename in png_files:
        shape = extract_shape_from_filename(filename)
        shape_groups[shape].append(filename)
    
    # 重命名映射
    rename_mapping = {}
    
    # 为每个形状的文件重命名
    for shape, files in shape_groups.items():
        files.sort()  # 确保顺序一致
        for i, old_filename in enumerate(files, 1):
            new_filename = f"{shape}_{i:03d}.png"
            old_path = os.path.join(folder_path, old_filename)
            new_path = os.path.join(folder_path, new_filename)
            
            # 重命名文件
            try:
                os.rename(old_path, new_path)
                # 记录映射关系（使用相对路径）
                old_relative = old_filename
                new_relative = f"{folder_name}/{new_filename}"
                rename_mapping[old_relative] = new_relative
                print(f"重命名: {old_filename} -> {new_filename}")
            except Exception as e:
                print(f"重命名失败 {old_filename}: {e}")
    
    return rename_mapping

def update_jsonl_file(jsonl_path, all_mappings):
    """更新JSONL文件中的图片路径"""
    if not os.path.exists(jsonl_path):
        print(f"JSONL文件不存在: {jsonl_path}")
        return
    
    updated_lines = []
    updated_count = 0
    
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    data = json.loads(line)
                    old_image = data['image']
                    
                    # 查找对应的新路径
                    new_image = None
                    for old_name, new_path in all_mappings.items():
                        if old_image == old_name:
                            new_image = new_path
                            break
                    
                    if new_image:
                        data['image'] = new_image
                        updated_count += 1
                        print(f"更新路径: {old_image} -> {new_image}")
                    
                    updated_lines.append(json.dumps(data, ensure_ascii=False))
                except json.JSONDecodeError as e:
                    print(f"JSON解析错误: {e}")
                    updated_lines.append(line)
    
    # 写回文件
    with open(jsonl_path, 'w', encoding='utf-8') as f:
        for line in updated_lines:
            f.write(line + '\n')
    
    print(f"\n总共更新了 {updated_count} 条记录")

def main():
    base_path = r"d:\网站\aliyun公网\启元慧学\task2\导出推理数据集(type c)"
    
    # 三个文件夹
    folders = [
        ("fold_1", "fold_1"),
        ("fold_2", "fold_2"), 
        ("other", "other")
    ]
    
    all_mappings = {}
    
    # 处理每个文件夹
    for folder_name, folder_display_name in folders:
        folder_path = os.path.join(base_path, folder_name)
        print(f"\n处理文件夹: {folder_name}")
        mappings = rename_images_in_folder(folder_path, folder_display_name)
        all_mappings.update(mappings)
    
    # 更新JSONL文件
    jsonl_path = os.path.join(base_path, "merged_dataset.jsonl")
    print(f"\n更新JSONL文件: {jsonl_path}")
    update_jsonl_file(jsonl_path, all_mappings)
    
    print("\n处理完成！")

if __name__ == "__main__":
    main()