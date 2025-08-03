import os
import re
from collections import defaultdict

def extract_question_type(question_line):
    """从题目行提取题目类型"""
    # 匹配格式: fold_X/类型_编号.png 或 ./task2_selected\fold_X/类型_编号.png 或 other/类型_编号.png 或 fold/类型_编号.png
    # 先尝试匹配 fold_X/ 格式
    match = re.search(r'fold_\d+/(\w+)_\d+\.png', question_line)
    if match:
        return match.group(1).lower()
    
    # 匹配 fold/ 格式 (multi-step reasoning)
    match = re.search(r'fold/(\w+)_\d+\.png', question_line)
    if match:
        return match.group(1).lower()
    
    # 再尝试匹配 other/ 格式
    match = re.search(r'other/(\w+)_\d+\.png', question_line)
    if match:
        return match.group(1).lower()
    
    # 最后尝试匹配带路径前缀的格式
    match = re.search(r'[^/\\]*[/\\]fold_\d+[/\\](\w+)_\d+\.png', question_line)
    if match:
        return match.group(1).lower()
    
    return None

def parse_txt_file(file_path):
    """解析单个txt文件，返回题目类型和准确率统计"""
    results = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 分割每个题目块
    blocks = content.split('==================================================\n')
    
    for block in blocks:
        if '题目:' in block and '正确答案:' in block and '预测答案:' in block:
            lines = block.strip().split('\n')
            question_line = None
            correct_answer = None
            predicted_answer = None
            
            for line in lines:
                if line.startswith('题目:'):
                    question_line = line
                elif line.startswith('正确答案:'):
                    correct_answer = line.split(':')[1].strip()
                elif line.startswith('预测答案:'):
                    predicted_answer = line.split(':')[1].strip()
            
            if question_line and correct_answer and predicted_answer:
                question_type = extract_question_type(question_line)
                if question_type:
                    is_correct = correct_answer == predicted_answer
                    results.append({
                        'type': question_type,
                        'correct': is_correct,
                        'question': question_line
                    })
    
    return results

def analyze_reasoning_folders():
    """分析三个reasoning文件夹的准确率"""
    base_path = r'd:\网站\aliyun公网\启元慧学\Supplement material'
    reasoning_folders = [
        'single-step reasoning',
        'multi-step reasoning', 
        'Inverse Reasoning',
        'error mixing'
    ]
    
    # 存储所有结果
    all_results = defaultdict(lambda: {'correct': 0, 'total': 0})
    model_results = defaultdict(lambda: defaultdict(lambda: {'correct': 0, 'total': 0}))
    
    for folder in reasoning_folders:
        folder_path = os.path.join(base_path, folder)
        print(f"\n分析文件夹: {folder}")
        
        for filename in os.listdir(folder_path):
            if filename.endswith('.txt'):
                file_path = os.path.join(folder_path, filename)
                print(f"  处理文件: {filename}")
                
                # 提取模型名称（去掉epoch信息）
                model_name = re.sub(r' epoch\d+\.txt$', '', filename)
                
                results = parse_txt_file(file_path)
                
                # 统计每种类型的准确率
                type_stats = defaultdict(lambda: {'correct': 0, 'total': 0})
                
                for result in results:
                    question_type = result['type']
                    type_stats[question_type]['total'] += 1
                    if result['correct']:
                        type_stats[question_type]['correct'] += 1
                    
                    # 累计到总体统计
                    all_results[question_type]['total'] += 1
                    if result['correct']:
                        all_results[question_type]['correct'] += 1
                    
                    # 累计到模型统计
                    model_results[model_name][question_type]['total'] += 1
                    if result['correct']:
                        model_results[model_name][question_type]['correct'] += 1
                
                # 打印当前文件的统计
                print(f"    题目总数: {len(results)}")
                for qtype, stats in type_stats.items():
                    accuracy = stats['correct'] / stats['total'] * 100 if stats['total'] > 0 else 0
                    print(f"    {qtype}: {stats['correct']}/{stats['total']} ({accuracy:.2f}%)")
    
    return all_results, model_results

def print_summary(all_results, model_results):
    """打印汇总统计结果"""
    print("\n" + "="*60)
    print("各模型分类准确率统计")
    print("="*60)
    
    question_types = ['circle', 'rectangle', 'house', 'square', 'hexagon']
    
    for model_name in sorted(model_results.keys()):
        print(f"\n模型: {model_name}")
        print("-" * 40)
        
        model_stats = model_results[model_name]
        model_total_correct = 0
        model_total_questions = 0
        
        for qtype in question_types:
            if qtype in model_stats:
                stats = model_stats[qtype]
                accuracy = stats['correct'] / stats['total'] * 100 if stats['total'] > 0 else 0
                print(f"  {qtype.capitalize()}: {stats['correct']}/{stats['total']} ({accuracy:.2f}%)")
                model_total_correct += stats['correct']
                model_total_questions += stats['total']
            else:
                print(f"  {qtype.capitalize()}: 0/0 (0.0%)")
        
        model_accuracy = model_total_correct / model_total_questions * 100 if model_total_questions > 0 else 0
        print(f"  总体: {model_total_correct}/{model_total_questions} ({model_accuracy:.2f}%)")

if __name__ == "__main__":
    print("开始分析reasoning文件夹...")
    all_results, model_results = analyze_reasoning_folders()
    print_summary(all_results, model_results)
    print("\n分析完成！")