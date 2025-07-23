import base64
import json
import os
import re
import time
from datetime import datetime

from openai import OpenAI
from tqdm import tqdm

# API配置字典 - 添加你的多个API配置
API_CONFIGS = {
    "GPT-4o": {
        "api_key": "sk-dWG4Z71kCCkESwaxBrbHGDYNHgCL6hVqbq3qguugCnz1grgf",
        "base_url": "http://chatapi.littlewheat.com/v1",
        "model": "gpt-4o"
    },
    "doubao-seed-flash": {
        "api_key": "f0bd9a34-fbe4-49c0-8e48-afc9a83f873e",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "model": "doubao-seed-1-6-flash-250615"
    },
    # 这个非常慢，1min做一题
    "doubao-seed": {
        "api_key": "f0bd9a34-fbe4-49c0-8e48-afc9a83f873e",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "model": "doubao-seed-1-6-250615"
    },
    "qwen2.5-vl-72b": {
        "api_key": "sk-d1cc5531b867424bbd89c3c0189b0594",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen2.5-vl-72b-instruct"
    },
    "qwen2-vl-72b": {
        "api_key": "sk-d1cc5531b867424bbd89c3c0189b0594",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen2-vl-72b-instruct"
    },
    "qwen-plus": {
        "api_key": "sk-d1cc5531b867424bbd89c3c0189b0594",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-turbo"
    },
    "claude3.7": {
        "api_key": "sk-fFVoggUZFGK5SCdKeaIQ96ftUxK1xP9H0F6SDrTEyashxLE7",
        "base_url": "http://chatapi.littlewheat.com/v1",
        "model": "claude-3-7-sonnet-20250219"
    },
    "grok-3": {
        "api_key": "sk-fFVoggUZFGK5SCdKeaIQ96ftUxK1xP9H0F6SDrTEyashxLE7",
        "base_url": "http://chatapi.littlewheat.com/v1",
        "model": "grok-3"
    },
    "gemini2.5": {
        "api_key": "sk-fFVoggUZFGK5SCdKeaIQ96ftUxK1xP9H0F6SDrTEyashxLE7",
        "base_url": "http://chatapi.littlewheat.com/v1",
        "model": "gemini-2.5-pro-exp-03-25"
    },
    "GPT-4o-mini": {
        "api_key": "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",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "GPT-4o-mini"
    },
    "Gemini-2.5-Flash": {
        "api_key": "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",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "google/gemini-2.5-flash"
    },
    "GLM-4.1V-Thinking-Flash": {
        "api_key": "c555e60dc2c6479987fbe93097604cf4.8ElZCnuhJSpILR8H",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "GLM-4.1V-Thinking-Flash"
    },
    "glm-z1-airx": {
        "api_key": "c555e60dc2c6479987fbe93097604cf4.8ElZCnuhJSpILR8H",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "model": "glm-z1-airx"
    },
    "glm-4-plus": {
        "api_key": "c555e60dc2c6479987fbe93097604cf4.8ElZCnuhJSpILR8H",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "model": "glm-4-plus"
    },
}

# 当前使用的API配置标识 - 只需要修改这个值即可切换API
CURRENT_API = "doubao-seed-flash"

# QPM限制配置 - 每分钟最大请求次数
QPM_LIMIT = 60  # 可根据实际API限制调整

# 全局变量用于跟踪请求时间
request_timestamps = []


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def extract_answer(text):
    """
    从模型输出中提取答案，支持多种格式：
    - "最终答案为：B" -> "B"
    - "Answer: B" -> "B"
    - "Answer:B" -> "B"
    """
    # 匹配中文格式：最终答案为：X
    match_chinese = re.search(r"[最终]*答案[为是:：\- ]*([A-Za-z0-9])", text)
    if match_chinese:
        return match_chinese.group(1).strip()

    # 匹配英文格式：Answer: X 或 Answer:X
    match_english = re.search(r"Answer\s*:\s*([A-Za-z0-9])", text, re.IGNORECASE)
    if match_english:
        return match_english.group(1).strip()

    # 如果都没匹配到，从最后开始往前查找第一个ABCD选项字母（作为备选方案）
    for i in range(len(text) - 1, -1, -1):
        if text[i] in ['A', 'B', 'C', 'D']:
            return text[i]

    return None


def get_api_config(config_name=None):
    """
    获取API配置
    """
    if config_name is None:
        config_name = CURRENT_API

    if config_name not in API_CONFIGS:
        raise ValueError(f"未找到配置 '{config_name}'。可用配置: {list(API_CONFIGS.keys())}")

    return API_CONFIGS[config_name]


def wait_for_qpm_limit():
    """
    检查QPM限制，如果需要则等待
    """
    global request_timestamps
    current_time = time.time()

    # 清理超过1分钟的旧时间戳
    request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]

    # 如果当前分钟内的请求数已达到限制
    if len(request_timestamps) >= QPM_LIMIT:
        # 计算需要等待的时间（到最早请求的1分钟后）
        oldest_request = min(request_timestamps)
        wait_time = 60 - (current_time - oldest_request)

        if wait_time > 0:
            time.sleep(wait_time)
            # 重新清理时间戳
            current_time = time.time()
            request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]

    # 记录当前请求时间
    request_timestamps.append(current_time)


def get_prompt_text(image_path):
    """
    根据image路径中的标识符返回相应的prompt文本
    如果路径包含_N（如_2DTo3D_N），使用一套prompt
    如果路径包含_Y（如_2DTo3D_Y），使用另一套prompt
    """
    if "_N/" in image_path:
        # N结尾的prompt
        return ("image is not important, return: N")
    elif "_Y/" in image_path:
        # Y结尾的prompt
        return ("image is not important, return: Y")


def evaluate_accuracy(jsonl_path, config_name=None):
    # 获取API配置
    config = get_api_config(config_name)
    client = OpenAI(api_key=config["api_key"], base_url=config["base_url"])

    print(f"🔧 使用API配置: {config_name or CURRENT_API}")
    print(f"🌐 Base URL: {config['base_url']}")
    print(f"🤖 Model: {config['model']}")
    print(f" ⚡ QPM限制: {QPM_LIMIT} 请求/分钟")

    # 创建log文件夹
    log_dir = "../log"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # 创建本次运行的日志文件
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"model_responses_{timestamp}.txt")

    total = 0
    correct = 0

    with open(jsonl_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line in tqdm(lines, desc="Evaluating"):
        data = json.loads(line)
        image_path = data["image"]
        true_answer = data["answer"]

        base64_image = encode_image(image_path)

        # 根据image路径获取相应的prompt文本
        prompt_text = get_prompt_text(image_path)

        # 检查QPM限制并等待（如果需要）
        wait_for_qpm_limit()

        response = client.chat.completions.create(
            model=config["model"],
            messages=[
                {
                    "role": "system",
                    "content": [
                        {"type": "text",
                         "text": "You are a professional visual reasoning expert. Please strictly follow the prompt format for output."}
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        },
                        {"type": "text",
                         "text": prompt_text}
                    ]
                }
            ],
            # stream=True,
            # extra_body={"enable_thinking": False},
        )

        result_text = response.choices[0].message.content
        predicted_answer = extract_answer(result_text)

        # 确定使用的prompt类型
        prompt_type = "N类型" if "_N/" in image_path else "Y类型" if "_Y/" in image_path else "默认类型"

        # 保存大模型回复到日志文件
        with open(log_file, "a", encoding="utf-8") as log_f:
            log_f.write(f"\n{'=' * 50}\n")
            log_f.write(f"题目: {image_path}\n")
            log_f.write(f"Prompt类型: {prompt_type}\n")
            log_f.write(f"正确答案: {true_answer}\n")
            log_f.write(f"预测答案: {predicted_answer}\n")
            log_f.write(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            log_f.write(f"使用的Prompt: {prompt_text}\n")
            log_f.write(f"大模型完整回复:\n{result_text}\n")
            log_f.write(f"{'=' * 50}\n")

        if predicted_answer is not None and predicted_answer.upper() == true_answer.upper():
            correct += 1

        total += 1

    accuracy = correct / total if total > 0 else 0
    print(f"\n📊 推理准确率：{accuracy:.2%} ({correct}/{total})")

    # 在日志文件末尾添加总结信息
    with open(log_file, "a", encoding="utf-8") as log_f:
        log_f.write(f"\n\n{'=' * 60}\n")
        log_f.write(f"运行总结\n")
        log_f.write(f"{'=' * 60}\n")
        log_f.write(f"总题目数: {total}\n")
        log_f.write(f"正确数量: {correct}\n")
        log_f.write(f"准确率: {accuracy:.2%}\n")
        log_f.write(f"运行结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        log_f.write(f"{'=' * 60}\n")

    print(f"\n📝 日志已保存到: {log_file}")


# 示例调用：
if __name__ == "__main__":
    # 使用默认配置（CURRENT_API指定的配置）
    evaluate_accuracy(
        jsonl_path=r"demo.jsonl"
    )
