---
title: 数学能力（Qwen-Math）
update: 2025-10-15
source: https://help.aliyun.com/zh/model-studio/math-language-model
---

Qwen-Math 专注数学推理与计算，提供详细解题步骤。推荐优先使用最新 Qwen3 通用模型，但此系列仍可用于数学场景。

## 快速开始（OpenAI 兼容）

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen-math-plus",
    messages=[{'role': 'user', 'content': 'Derive a universal solution for the quadratic equation $ Ax^2+Bx+C=0 $'}]
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
  model: "qwen-math-plus",
  messages: [{ role: "user", content: "Derive a universal solution for the quadratic equation $ Ax^2+Bx+C=0 $" }]
});
console.log(completion.choices[0].message.content);
```

## 使用建议

- 输入英文并使用 LaTeX 表达式
- 如需严格格式控制，可结合“前缀续写”
- 默认 `temperature=0`，输出稳定
- 最终结果常位于 `\boxed{}` 区块