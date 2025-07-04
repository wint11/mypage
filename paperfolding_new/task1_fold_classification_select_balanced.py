import os
import shutil
import random
from collections import defaultdict, Counter

def analyze_images(image_dir):
    """分析图片文件，按fold、形状和答案类型分类"""
    fold_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    
    for filename in os.listdir(image_dir):
        if filename.endswith('.png'):
            parts = filename.split('-')
            if len(parts) >= 5:
                # 提取fold信息
                fold_part = None
                answer_part = None
                shape_part = None
                
                for part in parts:
                    if part.startswith('fold_'):
                        fold_part = part
                    elif part.startswith('answ_'):
                        answer_part = part.replace('answ_', '').replace('.png', '')
                
                # 提取形状信息
                if filename.startswith('circle-'):
                    shape_part = 'circle'
                elif filename.startswith('House-'):
                    shape_part = 'House'
                elif filename.startswith('Rectangle-'):
                    shape_part = 'Rectangle'
                elif filename.startswith('square-'):
                    shape_part = 'square'
                elif filename.startswith('Hexagon-'):
                    shape_part = 'Hexagon'
                
                if fold_part and answer_part and shape_part:
                    fold_data[fold_part][shape_part][answer_part].append(filename)
    
    return fold_data

def get_global_shape_distribution(fold_data):
    """获取全局形状分布统计"""
    global_shapes = Counter()
    
    for fold_name, fold_shapes in fold_data.items():
        for shape_name, shape_answers in fold_shapes.items():
            total_for_shape = sum(len(images) for images in shape_answers.values())
            global_shapes[shape_name] += total_for_shape
    
    return global_shapes

def select_globally_balanced_images(fold_data, target_per_fold=200):
    """全局平衡选择图片，确保总体形状分布尽可能均匀"""
    total_target = target_per_fold * 3  # 总共600张
    
    # 获取所有可用的形状
    all_shapes = set()
    for fold_shapes in fold_data.values():
        all_shapes.update(fold_shapes.keys())
    
    all_shapes = list(all_shapes)
    target_per_shape = total_target // len(all_shapes)
    shape_remainder = total_target % len(all_shapes)
    
    # 计算每种形状的目标数量
    shape_targets = {}
    for i, shape in enumerate(all_shapes):
        shape_targets[shape] = target_per_shape + (1 if i < shape_remainder else 0)
    
    print(f"形状目标分布: {shape_targets}")
    
    # 收集所有图片按形状分类
    all_images_by_shape = defaultdict(list)
    for fold_name, fold_shapes in fold_data.items():
        for shape_name, shape_answers in fold_shapes.items():
            for answer, images in shape_answers.items():
                for img in images:
                    all_images_by_shape[shape_name].append((img, fold_name, answer))
    
    # 为每种形状选择目标数量的图片
    selected_by_fold = defaultdict(list)
    
    for shape, target_count in shape_targets.items():
        available_images = all_images_by_shape[shape]
        
        if len(available_images) <= target_count:
            # 如果可用图片不够，全部选择
            selected_images = available_images
        else:
            # 随机选择目标数量的图片
            selected_images = random.sample(available_images, target_count)
        
        # 按fold分组
        for img, fold_name, answer in selected_images:
            selected_by_fold[fold_name].append(img)
    
    # 确保每个fold都有足够的图片（如果不够，从其他图片中补充）
    for fold in ['fold_1', 'fold_2', 'fold_3']:
        current_count = len(selected_by_fold[fold])
        
        if current_count < target_per_fold:
            # 需要补充图片
            need_more = target_per_fold - current_count
            
            # 收集该fold中所有未选择的图片
            all_fold_images = []
            if fold in fold_data:
                for shape_name, shape_answers in fold_data[fold].items():
                    for answer, images in shape_answers.items():
                        all_fold_images.extend(images)
            
            # 排除已选择的图片
            available_for_supplement = [img for img in all_fold_images if img not in selected_by_fold[fold]]
            
            if available_for_supplement:
                supplement_count = min(need_more, len(available_for_supplement))
                supplement_images = random.sample(available_for_supplement, supplement_count)
                selected_by_fold[fold].extend(supplement_images)
        
        elif current_count > target_per_fold:
            # 如果超过了，随机移除一些
            selected_by_fold[fold] = random.sample(selected_by_fold[fold], target_per_fold)
    
    return dict(selected_by_fold)

def create_output_directories():
    """创建输出目录"""
    base_dir = "task1_fold_classification_images"
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)
    
    os.makedirs(base_dir)
    
    for fold in ['fold_1', 'fold_2', 'fold_3']:
        fold_dir = os.path.join(base_dir, fold)
        os.makedirs(fold_dir)
    
    return base_dir

def copy_selected_images(selected_images, source_dir, output_dir, fold_name):
    """复制选中的图片到输出目录"""
    fold_output_dir = os.path.join(output_dir, fold_name)
    
    for filename in selected_images:
        source_path = os.path.join(source_dir, filename)
        dest_path = os.path.join(fold_output_dir, filename)
        
        if os.path.exists(source_path):
            shutil.copy2(source_path, dest_path)

def analyze_selection_results(selected_data):
    """分析选择结果的统计信息"""
    print("\n=== 选择结果详细统计 ===")
    
    total_images = 0
    global_shape_count = Counter()
    global_answer_count = Counter()
    
    for fold, selected_images in selected_data.items():
        print(f"\n{fold}: {len(selected_images)} 张图片")
        
        fold_shape_count = Counter()
        fold_answer_count = Counter()
        
        for filename in selected_images:
            total_images += 1
            
            # 统计形状
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
            else:
                shape = 'unknown'
            
            fold_shape_count[shape] += 1
            global_shape_count[shape] += 1
            
            # 统计答案
            parts = filename.split('-')
            for part in parts:
                if part.startswith('answ_'):
                    answer = part.replace('answ_', '').replace('.png', '')
                    fold_answer_count[answer] += 1
                    global_answer_count[answer] += 1
                    break
        
        print(f"  形状分布: {dict(fold_shape_count)}")
        print(f"  答案分布: {dict(fold_answer_count)}")
    
    print(f"\n=== 全局统计 ===")
    print(f"总图片数: {total_images}")
    print(f"全局形状分布: {dict(global_shape_count)}")
    print(f"全局答案分布: {dict(global_answer_count)}")
    
    # 检查平衡性
    shape_counts = list(global_shape_count.values())
    answer_counts = list(global_answer_count.values())
    
    shape_balance = max(shape_counts) - min(shape_counts) if shape_counts else 0
    answer_balance = max(answer_counts) - min(answer_counts) if answer_counts else 0
    
    print(f"\n=== 平衡性评估 ===")
    print(f"形状分布差异: {shape_balance} (越小越好)")
    print(f"答案分布差异: {answer_balance} (越小越好)")
    
    if shape_balance <= 20:
        print("✓ 形状分布相对平衡")
    else:
        print("⚠ 形状分布不够平衡")
    
    if answer_balance <= 10:
        print("✓ 答案分布相对平衡")
    else:
        print("⚠ 答案分布不够平衡")

def main():
    # 设置随机种子以确保结果可重现
    random.seed(42)
    
    # 图片源目录
    image_dir = "task1_image"
    
    if not os.path.exists(image_dir):
        print(f"错误: 找不到图片目录 {image_dir}")
        return
    
    print("开始分析图片文件...")
    fold_data = analyze_images(image_dir)
    
    if not fold_data:
        print("错误: 没有找到符合格式的图片文件")
        return
    
    # 显示原始数据统计
    print("\n=== 原始数据统计 ===")
    global_shapes = get_global_shape_distribution(fold_data)
    print(f"全局形状分布: {dict(global_shapes)}")
    
    for fold in ['fold_1', 'fold_2', 'fold_3']:
        if fold in fold_data:
            fold_total = 0
            fold_shapes = Counter()
            for shape, answers in fold_data[fold].items():
                shape_total = sum(len(images) for images in answers.values())
                fold_shapes[shape] = shape_total
                fold_total += shape_total
            print(f"{fold}: 总计 {fold_total} 张，形状分布 {dict(fold_shapes)}")
    
    print("\n创建输出目录...")
    output_dir = create_output_directories()
    
    print("开始全局平衡选择图片...")
    selected_data = select_globally_balanced_images(fold_data, 200)
    
    # 复制选中的图片
    for fold, selected_images in selected_data.items():
        if selected_images:
            print(f"复制 {fold} 的图片...")
            copy_selected_images(selected_images, image_dir, output_dir, fold)
    
    # 分析选择结果
    analyze_selection_results(selected_data)
    
    print(f"\n所有图片已复制到 {output_dir} 目录")
    print("全局平衡选择完成！")

if __name__ == "__main__":
    main()