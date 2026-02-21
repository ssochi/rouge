#!/usr/bin/env python3
"""
Gemini 像素画优化工具

调用 OpenRouter 上的 Gemini 3.1 Pro Preview 模型来优化像素画代码。
自动读取 PixelDraw.js API 作为上下文。
仅输出到 stdout，由调用者（Claude Code）审查并写入文件。

用法:
    python3 tools/gemini_pixel_art.py <像素画文件路径> [--prompt "额外提示"]
"""

import argparse
import json
import os
import re
import ssl
import sys
import urllib.request
import urllib.error

API_URL = "https://openrouter.ai/api/v1/chat/completions"
API_KEY = "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"
MODEL = "google/gemini-3.1-pro-preview"

# 项目根目录（相对于本脚本位置）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PIXELDRAW_PATH = os.path.join(PROJECT_ROOT, "src", "utils", "PixelDraw.js")

SYSTEM_PROMPT = """\
你是一位像素画专家，擅长使用 PixelDraw API 创作精美的程序化像素画。

你的任务是优化用户提供的像素画 JS 代码，使其视觉效果更好。

优化方向：
- 增强细节层次（高光、阴影、边缘处理）
- 改善色彩搭配和过渡
- 提升光影效果和立体感
- 保持像素画的清晰度和风格一致性
- 在小尺寸画布上最大化视觉表现力

严格要求：
- 保持原有的 export 结构和函数接口完全不变
- 保持原有的 import 语句不变
- 只返回完整的、可直接替换的 JS 代码
- 将代码包裹在 ```javascript 代码块中
- 不要添加任何解释文字，只返回代码
"""


def find_pixeldraw():
    """读取 PixelDraw.js 内容"""
    if not os.path.exists(PIXELDRAW_PATH):
        print(f"警告: 未找到 PixelDraw.js ({PIXELDRAW_PATH})", file=sys.stderr)
        return ""
    with open(PIXELDRAW_PATH, "r", encoding="utf-8") as f:
        return f.read()


def call_gemini(pixel_art_code, pixeldraw_api, extra_prompt=""):
    """调用 OpenRouter API"""
    user_content = f"以下是 PixelDraw API 的完整代码，你的像素画代码必须基于这个 API：\n\n```javascript\n{pixeldraw_api}\n```\n\n"
    user_content += f"请优化以下像素画代码：\n\n```javascript\n{pixel_art_code}\n```"
    if extra_prompt:
        user_content += f"\n\n额外要求：{extra_prompt}"

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "thinking": {
            "type": "enabled",
            "budget_tokens": 10000,
        },
        "max_tokens": 65536,
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers=headers, method="POST")

    # 创建不验证 SSL 的上下文（macOS Python 常见问题）
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    print("正在调用 Gemini 3.1 Pro Preview ...", file=sys.stderr)

    try:
        with urllib.request.urlopen(req, timeout=300, context=ssl_ctx) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        print(f"API 错误 ({e.code}): {error_body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"网络错误: {e.reason}", file=sys.stderr)
        sys.exit(1)

    # 提取响应文本（跳过 thinking 部分）
    choices = body.get("choices", [])
    if not choices:
        print("API 返回了空响应", file=sys.stderr)
        print(json.dumps(body, indent=2, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    message = choices[0].get("message", {})
    content = message.get("content", "")

    # 打印 usage 信息
    usage = body.get("usage", {})
    if usage:
        print(f"Token 使用: 输入={usage.get('prompt_tokens', '?')}, "
              f"输出={usage.get('completion_tokens', '?')}, "
              f"总计={usage.get('total_tokens', '?')}", file=sys.stderr)

    return content


def extract_code(response_text):
    """从响应中提取 javascript 代码块"""
    # 匹配 ```javascript ... ``` 或 ```js ... ```
    pattern = r"```(?:javascript|js)\s*\n(.*?)```"
    matches = re.findall(pattern, response_text, re.DOTALL)
    if matches:
        # 返回最长的匹配（通常是完整代码）
        return max(matches, key=len).strip()

    # 如果没有代码块标记，尝试返回整个内容
    print("警告: 未找到代码块标记，返回原始响应", file=sys.stderr)
    return response_text.strip()


def main():
    parser = argparse.ArgumentParser(
        description="使用 Gemini 3.1 Pro Preview 优化像素画代码（输出到 stdout）"
    )
    parser.add_argument("file_path", help="要优化的像素画 JS 文件路径")
    parser.add_argument("--prompt", default="", help="额外的优化提示")
    args = parser.parse_args()

    # 读取像素画文件
    file_path = os.path.abspath(args.file_path)
    if not os.path.exists(file_path):
        print(f"错误: 文件不存在 - {file_path}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        pixel_art_code = f.read()

    print(f"读取文件: {file_path} ({len(pixel_art_code)} 字符)", file=sys.stderr)

    # 读取 PixelDraw API
    pixeldraw_api = find_pixeldraw()
    if pixeldraw_api:
        print(f"读取 PixelDraw API: {PIXELDRAW_PATH}", file=sys.stderr)

    # 调用 API
    response = call_gemini(pixel_art_code, pixeldraw_api, args.prompt)

    # 提取代码并输出到 stdout
    optimized_code = extract_code(response)
    print(optimized_code)

    print("完成!", file=sys.stderr)


if __name__ == "__main__":
    main()
