import json
import os
import shutil
from pathlib import Path

def merge_jsonl_files():
    """
    合并task5文件夹下4个子文件夹中的answer.jsonl文件，
    并更新图片路径，同时复制图片文件到对应的新路径
    """
    
    # 定义基础路径
    base_path = Path("d:/网站/aliyun公网/启元慧学/task4")
    
    # 定义4个子文件夹路径
    folders = [
        ("_2DTo3D_N", "easy"),
        ("_2DTo3D_N", "hard"),
        ("_2DTo3D_Y", "easy"),
        ("_2DTo3D_Y", "hard")
    ]
    
    # 存储所有合并的数据
    merged_data = []
    
    # 处理每个文件夹
    for main_folder, sub_folder in folders:
        folder_path = base_path / main_folder / sub_folder
        jsonl_file = folder_path / "answer.jsonl"
        
        print(f"处理文件夹: {folder_path}")
        
        # 创建目标文件夹（如果不存在）
        target_folder = base_path / main_folder / sub_folder
        
        # 读取jsonl文件
        if jsonl_file.exists():
            with open(jsonl_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():  # 跳过空行
                        data = json.loads(line.strip())
                        
                        # 更新图片路径
                        original_image = data["image"]
                        new_image_path = f"{main_folder}/{sub_folder}/{original_image}"
                        data["image"] = new_image_path
                        
                        merged_data.append(data)
            
            print(f"从 {jsonl_file} 读取了 {len([line for line in open(jsonl_file, 'r', encoding='utf-8') if line.strip()])} 条记录")
        else:
            print(f"警告: 文件 {jsonl_file} 不存在")
    
    # 写入合并后的文件
    output_file = base_path / "merged_answer.jsonl"
    with open(output_file, 'w', encoding='utf-8') as f:
        for data in merged_data:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
    
    print(f"\n合并完成！")
    print(f"总共合并了 {len(merged_data)} 条记录")
    print(f"输出文件: {output_file}")
    
    # 显示每个文件夹的统计信息
    folder_counts = {}
    for data in merged_data:
        folder_key = '/'.join(data['image'].split('/')[:2])
        folder_counts[folder_key] = folder_counts.get(folder_key, 0) + 1
    
    print("\n各文件夹记录数统计:")
    for folder, count in folder_counts.items():
        print(f"  {folder}: {count} 条记录")

if __name__ == "__main__":
    merge_jsonl_files()