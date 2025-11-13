#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复数据集合并问题的脚本
重新正确合并三个JSONL文件
"""

import json
import os

def fix_merge_dataset():
    """重新正确合并数据集"""
    print("开始修复数据集合并...")
    
    # 输入文件
    input_files = [
        'fold 1.jsonl',
        'fold 2.jsonl', 
        'other.jsonl'
    ]
    
    # 输出文件
    output_file = 'merged_dataset_fixed.jsonl'
    
    merged_data = []
    
    # 逐个处理文件
    for i, file_path in enumerate(input_files):
        if not os.path.exists(file_path):
            print(f"警告：文件 {file_path} 不存在，跳过")
            continue
            
        print(f"处理文件：{file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            file_data = []
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        
                        # 根据文件来源更新图片路径
                        if i == 0:  # fold 1.jsonl
                            # 将路径更新为fold_1/
                            image_name = os.path.basename(data['image'])
                            data['image'] = f"fold_1/{image_name}"
                        elif i == 1:  # fold 2.jsonl
                            # 将路径更新为fold_2/
                            image_name = os.path.basename(data['image'])
                            data['image'] = f"fold_2/{image_name}"
                        else:  # other.jsonl
                            # 将路径更新为other/
                            image_name = os.path.basename(data['image'])
                            data['image'] = f"other/{image_name}"
                            
                        file_data.append(data)
                        
                    except json.JSONDecodeError as e:
                        print(f"文件 {file_path} 第 {line_num} 行JSON解析错误: {e}")
                        continue
            
            print(f"从 {file_path} 读取了 {len(file_data)} 条记录")
            merged_data.extend(file_data)
    
    # 写入合并后的数据
    print(f"\n写入合并数据到 {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        for data in merged_data:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
    
    print(f"合并完成！总共处理了 {len(merged_data)} 条记录")
    
    # 统计各目录的记录数
    fold_1_count = sum(1 for data in merged_data if data['image'].startswith('fold_1/'))
    fold_2_count = sum(1 for data in merged_data if data['image'].startswith('fold_2/'))
    other_count = sum(1 for data in merged_data if data['image'].startswith('other/'))
    
    print(f"\n各目录记录统计：")
    print(f"fold_1/: {fold_1_count} 条记录")
    print(f"fold_2/: {fold_2_count} 条记录")
    print(f"other/: {other_count} 条记录")
    
    return output_file

if __name__ == "__main__":
    fix_merge_dataset()