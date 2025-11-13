import json
from collections import Counter

# 统计选项分布
answer_counts = Counter()
total = 0

with open('merged_dataset_fixed_paths.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line.strip())
        answer_counts[data['answer']] += 1
        total += 1

print(f"总记录数: {total}")
print("选项分布:")
for option in ['A', 'B', 'C', 'D']:
    count = answer_counts[option]
    pct = count/total*100
    print(f"{option}: {count} ({pct:.1f}%)")

print(f"\n验证总数: {sum(answer_counts.values())}")
print(f"所有选项: {dict(answer_counts)}")