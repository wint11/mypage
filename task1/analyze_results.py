import os
import json
import re
from collections import defaultdict, Counter
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib import rcParams

# 设置中文字体
rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
rcParams['axes.unicode_minus'] = False

def parse_experiment_file(file_path):
    """解析实验数据文件"""
    results = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 分割每个题目的数据
    sections = content.split('='*50)
    
    for section in sections:
        if '题目:' in section:
            lines = section.strip().split('\n')
            
            question = None
            correct_answer = None
            predicted_answer = None
            
            for line in lines:
                if line.startswith('题目:'):
                    question = line.replace('题目:', '').strip()
                elif line.startswith('正确答案:'):
                    correct_answer = line.replace('正确答案:', '').strip()
                elif line.startswith('预测答案:'):
                    predicted_answer = line.replace('预测答案:', '').strip()
            
            if question and correct_answer and predicted_answer:
                results.append({
                    'question': question,
                    'correct_answer': correct_answer,
                    'predicted_answer': predicted_answer,
                    'is_correct': correct_answer == predicted_answer
                })
    
    return results

def load_question_list(jsonl_path):
    """加载题目列表"""
    questions = {}
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line.strip())
            questions[data['image']] = data['answer']
    return questions

def analyze_all_experiments(data_dir):
    """分析所有实验数据"""
    all_results = []
    
    # 获取所有实验文件
    experiment_files = [f for f in os.listdir(data_dir) if f.endswith('.txt')]
    
    for file_name in experiment_files:
        file_path = os.path.join(data_dir, file_name)
        model_name = file_name.replace('.txt', '')
        
        results = parse_experiment_file(file_path)
        
        for result in results:
            result['model'] = model_name
            all_results.append(result)
    
    return all_results

def calculate_statistics(all_results):
    """计算统计信息"""
    # 按题目统计
    question_stats = defaultdict(lambda: {'total': 0, 'correct': 0, 'models': []})
    
    for result in all_results:
        question = result['question']
        question_stats[question]['total'] += 1
        if result['is_correct']:
            question_stats[question]['correct'] += 1
        question_stats[question]['models'].append({
            'model': result['model'],
            'is_correct': result['is_correct']
        })
    
    # 计算错误率
    question_error_rates = {}
    for question, stats in question_stats.items():
        error_rate = (stats['total'] - stats['correct']) / stats['total']
        question_error_rates[question] = {
            'error_rate': error_rate,
            'correct_rate': 1 - error_rate,
            'total_attempts': stats['total'],
            'correct_attempts': stats['correct'],
            'wrong_attempts': stats['total'] - stats['correct']
        }
    
    return question_error_rates, question_stats

def create_visualizations(question_error_rates):
    """创建可视化图表"""
    # 准备数据
    questions = list(question_error_rates.keys())
    error_rates = [question_error_rates[q]['error_rate'] for q in questions]
    
    # 按错误率排序
    sorted_data = sorted(zip(questions, error_rates), key=lambda x: x[1], reverse=True)
    sorted_questions, sorted_error_rates = zip(*sorted_data)
    
    # 创建图表
    plt.figure(figsize=(20, 12))
    
    # 子图1: 错误率最高的前20题
    plt.subplot(2, 2, 1)
    top_20_questions = sorted_questions[:20]
    top_20_error_rates = sorted_error_rates[:20]
    
    bars = plt.bar(range(len(top_20_questions)), top_20_error_rates, color='red', alpha=0.7)
    plt.title('错误率最高的前20题', fontsize=14, fontweight='bold')
    plt.xlabel('题目')
    plt.ylabel('错误率')
    plt.xticks(range(len(top_20_questions)), [q.split('/')[-1] for q in top_20_questions], rotation=45, ha='right')
    
    # 添加数值标签
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{height:.2f}', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    
    # 子图2: 正确率最高的前20题
    plt.subplot(2, 2, 2)
    bottom_20_questions = sorted_questions[-20:]
    bottom_20_error_rates = sorted_error_rates[-20:]
    bottom_20_correct_rates = [1 - rate for rate in bottom_20_error_rates]
    
    bars = plt.bar(range(len(bottom_20_questions)), bottom_20_correct_rates, color='green', alpha=0.7)
    plt.title('正确率最高的前20题', fontsize=14, fontweight='bold')
    plt.xlabel('题目')
    plt.ylabel('正确率')
    plt.xticks(range(len(bottom_20_questions)), [q.split('/')[-1] for q in bottom_20_questions], rotation=45, ha='right')
    
    # 添加数值标签
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{height:.2f}', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    
    # 子图3: 错误率分布直方图
    plt.subplot(2, 2, 3)
    plt.hist(error_rates, bins=20, color='blue', alpha=0.7, edgecolor='black')
    plt.title('错误率分布', fontsize=14, fontweight='bold')
    plt.xlabel('错误率')
    plt.ylabel('题目数量')
    plt.grid(True, alpha=0.3)
    
    # 子图4: 按题目类型分析
    plt.subplot(2, 2, 4)
    
    # 提取题目类型
    type_error_rates = defaultdict(list)
    for question, error_rate in zip(questions, error_rates):
        if '/' in question:
            question_type = question.split('/')[1].split('_')[0]
            type_error_rates[question_type].append(error_rate)
    
    types = list(type_error_rates.keys())
    avg_error_rates = [sum(rates)/len(rates) for rates in type_error_rates.values()]
    
    bars = plt.bar(types, avg_error_rates, color='orange', alpha=0.7)
    plt.title('各题目类型平均错误率', fontsize=14, fontweight='bold')
    plt.xlabel('题目类型')
    plt.ylabel('平均错误率')
    plt.xticks(rotation=45, ha='right')
    
    # 添加数值标签
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{height:.3f}', ha='center', va='bottom', fontsize=10)
    
    plt.tight_layout()
    plt.savefig('d:\\网站\\aliyun公网\\启元慧学\\task1\\error_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

def generate_report(question_error_rates, question_stats):
    """生成详细报告"""
    # 按错误率排序
    sorted_questions = sorted(question_error_rates.items(), key=lambda x: x[1]['error_rate'], reverse=True)
    
    report = []
    report.append("# 大模型答题错误率分析报告\n")
    report.append(f"## 总体统计")
    report.append(f"- 总题目数: {len(question_error_rates)}")
    report.append(f"- 平均错误率: {sum(stats['error_rate'] for stats in question_error_rates.values()) / len(question_error_rates):.3f}")
    report.append(f"- 平均正确率: {sum(stats['correct_rate'] for stats in question_error_rates.values()) / len(question_error_rates):.3f}\n")
    
    # 错误率最高的题目
    report.append("## 错误率最高的前20题")
    report.append("| 排名 | 题目 | 错误率 | 正确率 | 总尝试次数 | 错误次数 |")
    report.append("|------|------|--------|--------|------------|----------|")
    
    for i, (question, stats) in enumerate(sorted_questions[:20], 1):
        report.append(f"| {i} | {question} | {stats['error_rate']:.3f} | {stats['correct_rate']:.3f} | {stats['total_attempts']} | {stats['wrong_attempts']} |")
    
    report.append("\n")
    
    # 正确率最高的题目
    report.append("## 正确率最高的前20题")
    report.append("| 排名 | 题目 | 正确率 | 错误率 | 总尝试次数 | 正确次数 |")
    report.append("|------|------|--------|--------|------------|----------|")
    
    sorted_by_correct = sorted(question_error_rates.items(), key=lambda x: x[1]['correct_rate'], reverse=True)
    for i, (question, stats) in enumerate(sorted_by_correct[:20], 1):
        report.append(f"| {i} | {question} | {stats['correct_rate']:.3f} | {stats['error_rate']:.3f} | {stats['total_attempts']} | {stats['correct_attempts']} |")
    
    report.append("\n")
    
    # 按题目类型分析
    type_stats = defaultdict(lambda: {'total': 0, 'errors': 0, 'questions': []})
    for question, stats in question_error_rates.items():
        if '/' in question:
            question_type = question.split('/')[1].split('_')[0]
            type_stats[question_type]['total'] += stats['total_attempts']
            type_stats[question_type]['errors'] += stats['wrong_attempts']
            type_stats[question_type]['questions'].append(question)
    
    report.append("## 按题目类型分析")
    report.append("| 题目类型 | 平均错误率 | 题目数量 | 总尝试次数 | 错误次数 |")
    report.append("|----------|------------|----------|------------|----------|")
    
    for type_name, stats in sorted(type_stats.items(), key=lambda x: x[1]['errors']/x[1]['total'], reverse=True):
        error_rate = stats['errors'] / stats['total']
        report.append(f"| {type_name} | {error_rate:.3f} | {len(stats['questions'])} | {stats['total']} | {stats['errors']} |")
    
    return "\n".join(report)

def main():
    # 设置路径
    data_dir = 'd:\\网站\\aliyun公网\\启元慧学\\task1\\experiment_data'
    jsonl_path = 'd:\\网站\\aliyun公网\\启元慧学\\task1\\task1_selected_algorithm2.jsonl'
    
    print("开始分析实验数据...")
    
    # 分析所有实验数据
    all_results = analyze_all_experiments(data_dir)
    print(f"共处理了 {len(all_results)} 条实验记录")
    
    # 计算统计信息
    question_error_rates, question_stats = calculate_statistics(all_results)
    print(f"共分析了 {len(question_error_rates)} 个题目")
    
    # 创建可视化
    print("生成可视化图表...")
    create_visualizations(question_error_rates)
    
    # 生成报告
    print("生成分析报告...")
    report = generate_report(question_error_rates, question_stats)
    
    # 保存报告
    with open('d:\\网站\\aliyun公网\\启元慧学\\task1\\analysis_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    # 保存详细数据到CSV
    df_data = []
    for question, stats in question_error_rates.items():
        df_data.append({
            '题目': question,
            '错误率': stats['error_rate'],
            '正确率': stats['correct_rate'],
            '总尝试次数': stats['total_attempts'],
            '正确次数': stats['correct_attempts'],
            '错误次数': stats['wrong_attempts']
        })
    
    df = pd.DataFrame(df_data)
    df = df.sort_values('错误率', ascending=False)
    df.to_csv('d:\\网站\\aliyun公网\\启元慧学\\task1\\detailed_results.csv', index=False, encoding='utf-8-sig')
    
    print("分析完成！")
    print("生成的文件:")
    print("- error_analysis.png: 可视化图表")
    print("- analysis_report.md: 分析报告")
    print("- detailed_results.csv: 详细数据")
    
    # 显示简要统计
    print("\n=== 简要统计 ===")
    print(f"总题目数: {len(question_error_rates)}")
    avg_error_rate = sum(stats['error_rate'] for stats in question_error_rates.values()) / len(question_error_rates)
    print(f"平均错误率: {avg_error_rate:.3f}")
    print(f"平均正确率: {1-avg_error_rate:.3f}")
    
    # 显示错误率最高的前5题
    sorted_questions = sorted(question_error_rates.items(), key=lambda x: x[1]['error_rate'], reverse=True)
    print("\n错误率最高的前5题:")
    for i, (question, stats) in enumerate(sorted_questions[:5], 1):
        print(f"{i}. {question} - 错误率: {stats['error_rate']:.3f}")
    
    # 显示正确率最高的前5题
    sorted_by_correct = sorted(question_error_rates.items(), key=lambda x: x[1]['correct_rate'], reverse=True)
    print("\n正确率最高的前5题:")
    for i, (question, stats) in enumerate(sorted_by_correct[:5], 1):
        print(f"{i}. {question} - 正确率: {stats['correct_rate']:.3f}")

if __name__ == "__main__":
    main()