import re

def process_file(input_file, output_file):
    """
    处理GPT-o4-mini epoch1.txt文件，去掉题目路径中的./task1_selected_algorithm2\前缀
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式替换路径
    # 匹配 "题目: ./task1_selected_algorithm2\" 后面跟着的路径
    pattern = r'题目: ./task2_selected/'
    replacement = '题目: '
    
    # 执行替换
    processed_content = re.sub(pattern, replacement, content)
    
    # 写入新文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(processed_content)
    
    # 统计替换次数
    original_matches = len(re.findall(pattern, content))
    remaining_matches = len(re.findall(pattern, processed_content))
    
    print(f"处理完成！")
    print(f"原文件: {input_file}")
    print(f"输出文件: {output_file}")
    print(f"共替换了 {original_matches} 个路径前缀")
    print(f"剩余未处理的: {remaining_matches} 个")
    
    return processed_content

if __name__ == "__main__":
    input_file = "experiment_data\GPT-4o-mini epoch1.txt"
    output_file = "experiment_data\GPT-4o-mini epoch1_fixed.txt"
    
    try:
        process_file(input_file, output_file)
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_file}")
    except Exception as e:
        print(f"处理过程中出现错误: {e}")