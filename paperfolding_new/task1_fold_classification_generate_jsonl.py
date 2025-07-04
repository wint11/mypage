import os
import json

def extract_answer_from_filename(filename):
    """从文件名中提取答案"""
    parts = filename.split('-')
    for part in parts:
        if part.startswith('answ_'):
            answer = part.replace('answ_', '').replace('.png', '')
            return answer
    return None

def generate_jsonl_for_selected_images():
    """为选中的图片生成jsonl文件"""
    selected_dir = "task1_fold_classification_images"
    output_file = "task1_fold_classification_answer.jsonl"
    
    if not os.path.exists(selected_dir):
        print(f"错误: 找不到目录 {selected_dir}")
        return
    
    # 收集所有图片文件
    all_images = []
    
    for fold in ['fold_1', 'fold_2', 'fold_3']:
        fold_dir = os.path.join(selected_dir, fold)
        if os.path.exists(fold_dir):
            for filename in os.listdir(fold_dir):
                if filename.endswith('.png'):
                    answer = extract_answer_from_filename(filename)
                    if answer:
                        all_images.append({
                            'image': filename,
                            'answer': answer
                        })
                    else:
                        print(f"警告: 无法从文件名 {filename} 中提取答案")
    
    # 按文件名排序以保持一致性
    all_images.sort(key=lambda x: x['image'])
    
    # 写入jsonl文件
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in all_images:
            json.dump(item, f, ensure_ascii=False)
            f.write('\n')
    
    print(f"\n=== JSONL文件生成完成 ===")
    print(f"输出文件: {output_file}")
    print(f"总记录数: {len(all_images)}")
    
    # 统计答案分布
    answer_count = {}
    for item in all_images:
        answer = item['answer']
        answer_count[answer] = answer_count.get(answer, 0) + 1
    
    print(f"答案分布: {dict(sorted(answer_count.items()))}")
    
    # 显示前几条记录作为示例
    print(f"\n前5条记录示例:")
    for i, item in enumerate(all_images[:5]):
        print(f"  {i+1}. {json.dumps(item, ensure_ascii=False)}")
    
    if len(all_images) > 5:
        print(f"  ...")
        print(f"  {len(all_images)}. {json.dumps(all_images[-1], ensure_ascii=False)}")

def main():
    print("开始为选中的图片生成JSONL文件...")
    generate_jsonl_for_selected_images()
    print("JSONL文件生成完成！")

if __name__ == "__main__":
    main()