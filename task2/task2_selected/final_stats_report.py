import json
from collections import Counter

def generate_complete_report():
    """生成完整的选项分布统计报告"""
    
    # 总体统计
    answer_counts = Counter()
    total_records = 0
    
    # 按目录分组统计
    fold_1_answers = Counter()
    fold_2_answers = Counter()
    other_answers = Counter()
    
    with open('merged_dataset_fixed_paths.jsonl', 'r', encoding='utf-8') as f:
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
    
    print("=" * 50)
    print("         选项分布统计报告")
    print("=" * 50)
    
    print(f"\n📊 总体统计")
    print(f"总记录数: {total_records}")
    print("\n选项分布:")
    for option in ['A', 'B', 'C', 'D']:
        count = answer_counts[option]
        percentage = (count / total_records) * 100
        print(f"  选项 {option}: {count:3d} 次 ({percentage:5.1f}%)")
    
    print(f"\n📁 按目录分组统计")
    
    # fold_1目录统计
    fold_1_total = sum(fold_1_answers.values())
    print(f"\n📂 fold_1目录 (共{fold_1_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = fold_1_answers[option]
        percentage = (count / fold_1_total) * 100 if fold_1_total > 0 else 0
        print(f"  选项 {option}: {count:2d} 次 ({percentage:5.1f}%)")
    
    # fold_2目录统计
    fold_2_total = sum(fold_2_answers.values())
    print(f"\n📂 fold_2目录 (共{fold_2_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = fold_2_answers[option]
        percentage = (count / fold_2_total) * 100 if fold_2_total > 0 else 0
        print(f"  选项 {option}: {count:2d} 次 ({percentage:5.1f}%)")
    
    # other目录统计
    other_total = sum(other_answers.values())
    print(f"\n📂 other目录 (共{other_total}条记录):")
    for option in ['A', 'B', 'C', 'D']:
        count = other_answers[option]
        percentage = (count / other_total) * 100 if other_total > 0 else 0
        print(f"  选项 {option}: {count:2d} 次 ({percentage:5.1f}%)")
    
    print(f"\n📈 分布均匀性分析")
    expected_per_option = total_records / 4
    print(f"理想情况下每个选项应有: {expected_per_option:.1f} 次")
    
    max_deviation = 0
    print("\n各选项偏差:")
    for option in ['A', 'B', 'C', 'D']:
        deviation = abs(answer_counts[option] - expected_per_option)
        max_deviation = max(max_deviation, deviation)
        print(f"  选项 {option}: {deviation:4.1f} (实际: {answer_counts[option]})")
    
    print(f"\n最大偏差: {max_deviation:.1f}")
    deviation_percentage = (max_deviation / expected_per_option) * 100
    
    if deviation_percentage <= 10:  # 10%以内认为相对均匀
        print(f"✅ 选项分布相对均匀 (最大偏差 {deviation_percentage:.1f}%)")
    elif deviation_percentage <= 20:
        print(f"⚠️  选项分布略有偏差 (最大偏差 {deviation_percentage:.1f}%)")
    else:
        print(f"❌ 选项分布存在较大偏差 (最大偏差 {deviation_percentage:.1f}%)")
    
    print("\n" + "=" * 50)
    print("统计完成!")
    print("=" * 50)

if __name__ == "__main__":
    generate_complete_report()