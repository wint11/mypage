import json
import os

def merge_jsonl_files():
    """
    合并task2\导出推理数据集(type c)文件夹下的3个jsonl文件
    """
    # 定义文件路径
    base_dir = "导出推理数据集(type c)"
    input_files = [
        os.path.join(base_dir, "fold 1.jsonl"),
        os.path.join(base_dir, "fold 2.jsonl"),
        os.path.join(base_dir, "other.jsonl")
    ]
    output_file = os.path.join(base_dir, "merged_dataset.jsonl")
    
    # 检查输入文件是否存在
    for file_path in input_files:
        if not os.path.exists(file_path):
            print(f"警告：文件 {file_path} 不存在")
            continue
    
    # 合并文件
    merged_count = 0
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for input_file in input_files:
            if os.path.exists(input_file):
                print(f"正在处理文件：{input_file}")
                file_count = 0
                with open(input_file, 'r', encoding='utf-8') as infile:
                    for line_num, line in enumerate(infile, 1):
                        line = line.strip()
                        if line:  # 跳过空行
                            try:
                                # 验证JSON格式
                                json.loads(line)
                                outfile.write(line + '\n')
                                merged_count += 1
                                file_count += 1
                            except json.JSONDecodeError as e:
                                print(f"警告：{input_file} 第{line_num}行JSON格式错误：{e}")
                                print(f"问题行内容：{line}")
                print(f"  从 {input_file} 合并了 {file_count} 条记录")
            else:
                print(f"警告：文件 {input_file} 不存在，跳过处理")
    
    print(f"\n合并完成！")
    print(f"总共合并了 {merged_count} 条记录")
    print(f"输出文件：{output_file}")
    
    # 验证合并结果
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            actual_count = sum(1 for line in f if line.strip())
        print(f"验证：输出文件实际包含 {actual_count} 条记录")
    
    # 显示每个文件的统计信息
    print("\n各文件统计：")
    for input_file in input_files:
        if os.path.exists(input_file):
            with open(input_file, 'r', encoding='utf-8') as f:
                count = sum(1 for line in f if line.strip())
            print(f"{input_file}: {count} 条记录")

if __name__ == "__main__":
    merge_jsonl_files()