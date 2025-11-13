import json
from collections import Counter

def analyze_answer_distribution(file_path):
    """分析merged_dataset_fixed_paths.jsonl文件中选项的分布"""
    answer_counts = Counter()
    total_records = 0
    
    # 按目录分组统计
    fold_1_answers = Counter()
    fold_2_answers = Counter()
    other_answers = Counter()
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line.strip())
            answer = data['answer']
            image_path = data['image']
            
            # 总体统计
            answer_counts[answer] += 1
            total_records += 1
            
            # 按目录分组统计
            if image_path.startswith('fold_1/'):
                fold_1_answers[answer] += 1
            elif image_path.startswith('fold_2/'):
                fold_2_answers[answer] += 1
            elif image_path.startswith('other/'):
                other_answers[answer] += 1
    
    print("=== 选项分布统计 ===")
    print(f"总记录数: {total_records}")
    print("\n总体选项分布:")
    for option in ['A', 'B', 'C', 'D']:
        count = answer_counts[option]
        percentage = (count / total_records) * 100 if total_records > 0 else 0
        print(f"选项 {option}: {count} 次 ({percentage:.1f}%)")
    
    # 验证总数
    total_answers = sum(answer_counts.values())
    print(f"\n验证: 所有选项总数 = {total_answers}")
    if total_answers != total_records:
        print(f"⚠ 警告: 选项总数({total_answers})与记录总数({total_records})不匹配!")
    
    print("\n=== 按目录分组的选项分布 ===")
    
    # fold_1目录统计
    fold_1_total = sum(fold_1_answers.values())
    print(f"\nfold_1目录 (共{fold_1_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = fold_1_answers[option]
        percentage = (count / fold_1_total) * 100 if fold_1_total > 0 else 0
        print(f"  选项 {option}: {count} 次 ({percentage:.1f}%)")
    
    # fold_2目录统计
    fold_2_total = sum(fold_2_answers.values())
    print(f"\nfold_2目录 (共{fold_2_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = fold_2_answers[option]
        percentage = (count / fold_2_total) * 100 if fold_2_total > 0 else 0
        print(f"  选项 {option}: {count} 次 ({percentage:.1f}%)")
    
    # other目录统计
    other_total = sum(other_answers.values())
    print(f"\nother目录 (共{other_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = other_answers[option]
        percentage = (count / other_total) * 100 if other_total > 0 else 0
        print(f"  选项 {option}: {count} 次 ({percentage:.1f}%)")
    
    # 检查分布是否均匀
    print("\n=== 分布均匀性分析 ===")
    expected_per_option = total_records / 4
    print(f"理想情况下每个选项应有: {expected_per_option:.1f} 次")
    
    max_deviation = 0
    for option in ['A', 'B', 'C', 'D']:
        deviation = abs(answer_counts[option] - expected_per_option)
        max_deviation = max(max_deviation, deviation)
        print(f"选项 {option} 偏差: {deviation:.1f}")
    
    print(f"最大偏差: {max_deviation:.1f}")
    if max_deviation <= expected_per_option * 0.1:  # 10%以内认为相对均匀
        print("✓ 选项分布相对均匀")
    else:
        print("⚠ 选项分布存在较大偏差")

if __name__ == "__main__":
    file_path = "merged_dataset_fixed_paths.jsonl"
    analyze_answer_distribution(file_path)