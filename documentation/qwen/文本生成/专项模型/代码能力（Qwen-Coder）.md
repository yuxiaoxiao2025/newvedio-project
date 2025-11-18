---
title: 代码能力（Qwen-Coder）
update: 2025-11-14
source: https://help.aliyun.com/zh/model-studio/qwen-coder
---

Qwen-Coder 专注代码生成与补全，支持流式输出与工具调用，适合多种开发集成场景。

## 快速开始（OpenAI 兼容）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen3-coder-plus",
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': '请编写一个Python函数 find_prime_numbers，返回所有小于 n 的质数'}],
)
print(completion.choices[0].message.content)
```

```javascript
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

const completion = await client.chat.completions.create({
    model: "qwen3-coder-plus",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "请编写一个Python函数 find_prime_numbers，返回所有小于 n 的质数" }
    ],
});
console.log(completion.choices[0].message.content);
```

## 流式输出

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen3-coder-plus",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "请编写一个Python函数 find_prime_numbers，返回所有小于 n 的质数"},
    ],
    stream=True,
    stream_options={"include_usage": True}
)

for chunk in completion:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="")
    elif chunk.usage:
        print("\nToken:", chunk.usage)
```

```javascript
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

const stream = await client.chat.completions.create({
    model: "qwen3-coder-plus",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "请编写一个Python函数 find_prime_numbers，返回所有小于 n 的质数" }
    ],
    stream: true,
    stream_options: { include_usage: true },
});

for await (const chunk of stream) {
  if (chunk.choices?.length) process.stdout.write(chunk.choices[0]?.delta?.content || "");
  else if (chunk.usage) console.log("Token:", chunk.usage);
}
```