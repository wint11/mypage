import json
import os
import shutil
from pathlib import Path

def merge_jsonl_files():
    """合并三个jsonl文件"""
    print("开始合并JSONL文件...")
    
    input_files = ['fold 1.jsonl', 'fold 2.jsonl', 'other.jsonl']
    output_file = 'merged_dataset.jsonl'
    
    merged_data = []
    file_counts = {}
    
    for file_name in input_files:
        if os.path.exists(file_name):
            with open(file_name, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                count = 0
                for line in lines:
                    line = line.strip()
                    if line:
                        try:
                            data = json.loads(line)
                            merged_data.append(data)
                            count += 1
                        except json.JSONDecodeError as e:
                            print(f"警告：跳过无效JSON行：{line}，错误：{e}")
                file_counts[file_name] = count
                print(f"从 {file_name} 读取了 {count} 条记录")
        else:
            print(f"警告：文件 {file_name} 不存在")
    
    # 写入合并后的文件
    with open(output_file, 'w', encoding='utf-8') as f:
        for data in merged_data:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
    
    print(f"合并完成！总共合并了 {len(merged_data)} 条记录到 {output_file}")
    return len(merged_data)

def rename_directories():
    """重命名目录"""
    print("开始重命名目录...")
    
    rename_map = {
        'fold 1': 'fold_1',
        'fold 2': 'fold_2'
        # 'other' 保持不变
    }
    
    for old_name, new_name in rename_map.items():
        if os.path.exists(old_name):
            if os.path.exists(new_name):
                shutil.rmtree(new_name)
            os.rename(old_name, new_name)
            print(f"目录 '{old_name}' 重命名为 '{new_name}'")
        else:
            print(f"警告：目录 '{old_name}' 不存在")

def rename_images_and_update_paths():
    """重命名图片文件并更新JSONL中的路径"""
    print("开始重命名图片文件并更新路径...")
    
    directories = ['fold_1', 'fold_2', 'other']
    
    # 读取merged_dataset.jsonl
    with open('merged_dataset.jsonl', 'r', encoding='utf-8') as f:
        data_lines = f.readlines()
    
    updated_data = []
    
    for line in data_lines:
        line = line.strip()
        if line:
            try:
                data = json.loads(line)
                updated_data.append(data)
            except json.JSONDecodeError as e:
                print(f"警告：跳过无效JSON行：{line}，错误：{e}")
    
    # 为每个目录重命名图片
    for directory in directories:
        if os.path.exists(directory):
            print(f"处理目录：{directory}")
            
            # 获取所有图片文件
            image_files = [f for f in os.listdir(directory) if f.endswith('.png')]
            
            # 按形状分组
            shape_groups = {}
            for img_file in image_files:
                # 从文件名中提取形状
                if img_file.startswith('circle-'):
                    shape = 'circle'
                elif img_file.startswith('Hexagon-'):
                    shape = 'Hexagon'
                elif img_file.startswith('House-'):
                    shape = 'House'
                elif img_file.startswith('Rectangle-'):
                    shape = 'Rectangle'
                elif img_file.startswith('square-'):
                    shape = 'square'
                else:
                    continue
                
                if shape not in shape_groups:
                    shape_groups[shape] = []
                shape_groups[shape].append(img_file)
            
            # 为每个形状重命名文件
            for shape, files in shape_groups.items():
                files.sort()  # 确保一致的排序
                for i, old_filename in enumerate(files, 1):
                    new_filename = f"{shape}_{i:03d}.png"
                    old_path = os.path.join(directory, old_filename)
                    new_path = os.path.join(directory, new_filename)
                    
                    # 重命名文件
                    if os.path.exists(old_path):
                        os.rename(old_path, new_path)
                    
                    # 更新JSONL中的路径
                    old_image_path = old_filename
                    new_image_path = f"{directory}/{new_filename}"
                    
                    for data in updated_data:
                        if data['image'] == old_image_path:
                            data['image'] = new_image_path
            
            print(f"目录 {directory} 中的图片重命名完成")
        else:
            print(f"警告：目录 {directory} 不存在")
    
    # 写入更新后的JSONL文件
    with open('merged_dataset.jsonl', 'w', encoding='utf-8') as f:
        for data in updated_data:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
    
    print(f"图片重命名和路径更新完成！处理了 {len(updated_data)} 条记录")

def main():
    """主函数"""
    print("开始处理数据集...")
    print("="*50)
    
    # 1. 合并JSONL文件
    total_records = merge_jsonl_files()
    print("="*50)
    
    # 2. 重命名目录
    rename_directories()
    print("="*50)
    
    # 3. 重命名图片并更新路径
    rename_images_and_update_paths()
    print("="*50)
    
    print("数据集处理完成！")
    print(f"最终合并文件：merged_dataset.jsonl，包含 {total_records} 条记录")
    print("目录结构：")
    print("  - fold_1/ (包含重命名后的图片)")
    print("  - fold_2/ (包含重命名后的图片)")
    print("  - other/ (包含重命名后的图片)")

if __name__ == "__main__":
    main()