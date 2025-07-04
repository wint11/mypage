import os
from collections import Counter, defaultdict

def analyze_selected_images():
    """分析选择的图片结果"""
    base_dir = "task1_fold_classification_images"
    
    if not os.path.exists(base_dir):
        print(f"错误: 找不到目录 {base_dir}")
        return
    
    total_stats = {
        'total_images': 0,
        'fold_distribution': {},
        'answer_distribution': Counter(),
        'shape_distribution': Counter(),
        'fold_answer_distribution': defaultdict(lambda: Counter()),
        'fold_shape_distribution': defaultdict(lambda: Counter())
    }
    
    for fold in ['fold_1', 'fold_2', 'fold_3']:
        fold_dir = os.path.join(base_dir, fold)
        
        if not os.path.exists(fold_dir):
            print(f"警告: 找不到目录 {fold_dir}")
            continue
        
        images = [f for f in os.listdir(fold_dir) if f.endswith('.png')]
        fold_count = len(images)
        total_stats['total_images'] += fold_count
        total_stats['fold_distribution'][fold] = fold_count
        
        print(f"\n=== {fold} 分析结果 ===")
        print(f"总图片数: {fold_count}")
        
        # 分析答案分布
        answer_counter = Counter()
        shape_counter = Counter()
        
        for filename in images:
            # 提取答案
            parts = filename.split('-')
            answer = None
            shape = None
            
            for part in parts:
                if part.startswith('answ_'):
                    answer = part.replace('answ_', '').replace('.png', '')
                    break
            
            # 提取形状
            if filename.startswith('circle-'):
                shape = 'circle'
            elif filename.startswith('House-'):
                shape = 'House'
            elif filename.startswith('Rectangle-'):
                shape = 'Rectangle'
            elif filename.startswith('square-'):
                shape = 'square'
            elif filename.startswith('Hexagon-'):
                shape = 'Hexagon'
            
            if answer:
                answer_counter[answer] += 1
                total_stats['answer_distribution'][answer] += 1
                total_stats['fold_answer_distribution'][fold][answer] += 1
            
            if shape:
                shape_counter[shape] += 1
                total_stats['shape_distribution'][shape] += 1
                total_stats['fold_shape_distribution'][fold][shape] += 1
        
        # 打印答案分布
        print("答案分布:")
        for answer in sorted(answer_counter.keys()):
            count = answer_counter[answer]
            percentage = (count / fold_count) * 100 if fold_count > 0 else 0
            print(f"  {answer}: {count} 张 ({percentage:.1f}%)")
        
        # 打印形状分布
        print("形状分布:")
        for shape in sorted(shape_counter.keys()):
            count = shape_counter[shape]
            percentage = (count / fold_count) * 100 if fold_count > 0 else 0
            print(f"  {shape}: {count} 张 ({percentage:.1f}%)")
    
    # 打印总体统计
    print("\n" + "="*50)
    print("=== 总体统计结果 ===")
    print("="*50)
    
    print(f"\n总图片数: {total_stats['total_images']}")
    
    print("\nFold分布:")
    for fold, count in total_stats['fold_distribution'].items():
        percentage = (count / total_stats['total_images']) * 100 if total_stats['total_images'] > 0 else 0
        print(f"  {fold}: {count} 张 ({percentage:.1f}%)")
    
    print("\n总体答案分布:")
    for answer in sorted(total_stats['answer_distribution'].keys()):
        count = total_stats['answer_distribution'][answer]
        percentage = (count / total_stats['total_images']) * 100 if total_stats['total_images'] > 0 else 0
        print(f"  {answer}: {count} 张 ({percentage:.1f}%)")
    
    print("\n总体形状分布:")
    for shape in sorted(total_stats['shape_distribution'].keys()):
        count = total_stats['shape_distribution'][shape]
        percentage = (count / total_stats['total_images']) * 100 if total_stats['total_images'] > 0 else 0
        print(f"  {shape}: {count} 张 ({percentage:.1f}%)")
    
    # 检查平衡性
    print("\n=== 平衡性检查 ===")
    
    # 检查每个fold是否都有200张图片
    fold_balance_ok = True
    for fold, count in total_stats['fold_distribution'].items():
        if count != 200:
            print(f"警告: {fold} 有 {count} 张图片，期望 200 张")
            fold_balance_ok = False
    
    if fold_balance_ok:
        print("✓ Fold分布平衡 (每个fold都有200张图片)")
    
    # 检查答案分布是否平衡
    answer_counts = list(total_stats['answer_distribution'].values())
    if answer_counts:
        answer_balance_ok = max(answer_counts) - min(answer_counts) <= 10  # 允许10张的差异
        if answer_balance_ok:
            print("✓ 答案分布相对平衡")
        else:
            print(f"警告: 答案分布不平衡，最大差异: {max(answer_counts) - min(answer_counts)}")
    
    # 检查形状分布是否平衡
    shape_counts = list(total_stats['shape_distribution'].values())
    if shape_counts:
        shape_balance_ok = max(shape_counts) - min(shape_counts) <= 30  # 允许30张的差异
        if shape_balance_ok:
            print("✓ 形状分布相对平衡")
        else:
            print(f"警告: 形状分布不平衡，最大差异: {max(shape_counts) - min(shape_counts)}")
    
    return total_stats

def main():
    print("开始验证图片选择结果...")
    stats = analyze_selected_images()
    print("\n验证完成！")

if __name__ == "__main__":
    main()