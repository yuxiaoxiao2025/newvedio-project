---
title: 角色扮演（Qwen-Character）
update: 2025-10-29
source: https://help.aliyun.com/zh/model-studio/role-play
---

Qwen-Character 适合拟人化对话场景，支持人设还原、话题推进与共情能力。

## 对话调用（OpenAI 兼容）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen-plus-character",
    messages=[
        {"role": "system", "content": "你是江让...说话幽默，爱开玩笑"},
        {"role": "assistant", "content": "班长你在干嘛呢"},
        {"role": "user", "content": "我在看书"},
    ],
)
print(completion.choices[0].message.content)
```

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

const completion = await openai.chat.completions.create({
    model: "qwen-plus-character",
    messages: [
        { role: "system", content: "你是江让...说话幽默，爱开玩笑" },
        { role: "assistant", content: "班长你在干嘛呢" },
        { role: "user", content: "我在看书" }
    ],
});
console.log(completion.choices[0].message.content)
```

## 多样性回复（n）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen-plus-character",
    n=2,
    messages=[
        {"role": "system", "content": "你是江让..."},
        {"role": "assistant", "content": "班长你在干嘛呢"},
        {"role": "user", "content": "我在看书"},
    ],
)
print(completion.model_dump_json())
```

## 模拟群聊

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create({
    model: "qwen-plus-character",
    messages: [
        {"role": "system", "content": "在音乐人群聊场景中，凌路是25岁的天才音乐人..."},
        {"role": "user", "content": "程毅：周末有空不？新歌想听意见。"},
        {"role": "assistant", "content": "凌路：哼，又来蹭我们专业水平？行吧。"}
    ]
});
print(completion.choices[0].message.content)
```