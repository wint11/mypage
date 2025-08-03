import os
import re
from collections import defaultdict

def parse_data_file(file_path):
    """
    解析单个数据文件，提取题目信息和答案
    """
    results = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式匹配题目、Prompt类型、正确答案和预测答案
    pattern = r'题目: ([^\n]+)\nPrompt类型: ([^\n]+)\n正确答案: ([^\n]+)\n预测答案: ([^\n]+)'
    matches = re.findall(pattern, content)
    
    for match in matches:
        question_path, prompt_type, correct_answer, predicted_answer = match
        
        # 提取难度级别 (easy/hard)
        difficulty = 'easy' if '/easy/' in question_path else 'hard'
        
        # 提取Prompt类型 - 优先从题目路径中的_3DTo2D_N或_3DTo2D_Y等标识提取
        prompt_category = 'unknown'
        if '_3DTo2D_N' in question_path or '_2DTo3D_N' in question_path:
            prompt_category = 'N'
        elif '_3DTo2D_Y' in question_path or '_2DTo3D_Y' in question_path:
            prompt_category = 'Y'
        else:
            # 如果路径中没有找到，则从Prompt类型字段提取
            prompt_category = 'N' if 'N类型' in prompt_type else 'Y'
        
        # 判断答案是否正确
        is_correct = correct_answer.strip() == predicted_answer.strip()
        
        results.append({
            'difficulty': difficulty,
            'prompt_type': prompt_category,
            'is_correct': is_correct
        })
    
    return results

def analyze_directory(directory_path, task_name):
    """
    分析指定目录下的所有数据文件
    """
    model_results = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {'correct': 0, 'total': 0})))
    
    for filename in os.listdir(directory_path):
        if filename.endswith('.txt'):
            # 提取模型名称
            model_name = filename.replace(' epoch1.txt', '').replace('task 5 ', '')
            
            file_path = os.path.join(directory_path, filename)
            results = parse_data_file(file_path)
            
            for result in results:
                difficulty = result['difficulty']
                prompt_type = result['prompt_type']
                is_correct = result['is_correct']
                
                model_results[model_name][difficulty][prompt_type]['total'] += 1
                if is_correct:
                    model_results[model_name][difficulty][prompt_type]['correct'] += 1
    
    return model_results

def calculate_accuracy(correct, total):
    """
    计算准确率
    """
    if total == 0:
        return 0.0
    return correct / total * 100

def main():
    # 定义数据目录
    base_dir = r'd:\网站\aliyun公网\启元慧学\Supplement material'
    unfolding_2d_dir = os.path.join(base_dir, '2D Unfolding')
    folding_3d_dir = os.path.join(base_dir, '3D Folding')
    
    # 分析两个任务的数据
    print("正在分析2D Unfolding数据...")
    unfolding_2d_results = analyze_directory(unfolding_2d_dir, '2D Unfolding')
    
    print("正在分析3D Folding数据...")
    folding_3d_results = analyze_directory(folding_3d_dir, '3D Folding')
    
    # 生成结果报告
    output_lines = []
    output_lines.append("模型在2D Unfolding和3D Folding任务上的准确率分析")
    output_lines.append("=" * 60)
    output_lines.append("")
    
    # 获取所有模型名称
    all_models = set(unfolding_2d_results.keys()) | set(folding_3d_results.keys())
    
    for task_name, task_results in [('2D Unfolding', unfolding_2d_results), ('3D Folding', folding_3d_results)]:
        output_lines.append(f"\n{task_name} 任务结果:")
        output_lines.append("-" * 40)
        output_lines.append("")
        
        # 表头
        output_lines.append(f"{'模型名称':<25} {'Easy-N':<10} {'Easy-Y':<10} {'Hard-N':<10} {'Hard-Y':<10}")
        output_lines.append("-" * 65)
        
        for model in sorted(all_models):
            if model in task_results:
                model_data = task_results[model]
                
                # 计算各类别的准确率
                easy_n_acc = calculate_accuracy(
                    model_data['easy']['N']['correct'],
                    model_data['easy']['N']['total']
                )
                easy_y_acc = calculate_accuracy(
                    model_data['easy']['Y']['correct'],
                    model_data['easy']['Y']['total']
                )
                hard_n_acc = calculate_accuracy(
                    model_data['hard']['N']['correct'],
                    model_data['hard']['N']['total']
                )
                hard_y_acc = calculate_accuracy(
                    model_data['hard']['Y']['correct'],
                    model_data['hard']['Y']['total']
                )
                
                output_lines.append(
                    f"{model:<25} {easy_n_acc:<10.2f} {easy_y_acc:<10.2f} {hard_n_acc:<10.2f} {hard_y_acc:<10.2f}"
                )
            else:
                output_lines.append(f"{model:<25} {'N/A':<10} {'N/A':<10} {'N/A':<10} {'N/A':<10}")
        
        output_lines.append("")
    
    # 详细统计信息
    output_lines.append("\n详细统计信息:")
    output_lines.append("=" * 60)
    
    for task_name, task_results in [('2D Unfolding', unfolding_2d_results), ('3D Folding', folding_3d_results)]:
        output_lines.append(f"\n{task_name} 详细数据:")
        output_lines.append("-" * 40)
        
        for model in sorted(task_results.keys()):
            output_lines.append(f"\n模型: {model}")
            model_data = task_results[model]
            
            for difficulty in ['easy', 'hard']:
                for prompt_type in ['N', 'Y']:
                    correct = model_data[difficulty][prompt_type]['correct']
                    total = model_data[difficulty][prompt_type]['total']
                    accuracy = calculate_accuracy(correct, total)
                    output_lines.append(
                        f"  {difficulty.capitalize()}-{prompt_type}: {correct}/{total} = {accuracy:.2f}%"
                    )
    
    # 保存结果到文件
    output_file = os.path.join(base_dir, 'accuracy_analysis_results.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"\n分析完成！结果已保存到: {output_file}")
    print("\n摘要:")
    print(f"2D Unfolding任务: 分析了 {len(unfolding_2d_results)} 个模型")
    print(f"3D Folding任务: 分析了 {len(folding_3d_results)} 个模型")
    print(f"总共分析了 {len(all_models)} 个不同的模型")

if __name__ == "__main__":
    main()