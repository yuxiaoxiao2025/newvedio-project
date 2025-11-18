---
title: 长上下文（Qwen-Long）
update: 2025-11-12
source: https://help.aliyun.com/zh/model-studio/long-context-qwen-long
---

Qwen-Long 提供 1000 万 Token 的上下文长度，通过文件上传与引用机制支持超长文档推理。

## 文档上传

```python
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

file_object = client.files.create(file=Path("阿里云百炼系列手机产品介绍.docx"), purpose="file-extract")
print(file_object.id)
```

## 通过 file-id 引用并对话

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen-long",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": f"fileid://{FILE_ID}"},
        {"role": "user", "content": "这篇文章讲了什么?"}
    ],
    stream=True,
    stream_options={"include_usage": True}
)

full_content = ""
for chunk in completion:
    if chunk.choices and chunk.choices[0].delta.content:
        full_content += chunk.choices[0].delta.content
print(full_content)
```

## 传入多个文档

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen-long",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": f"fileid://{FILE_ID1},fileid://{FILE_ID2}"},
        {"role": "user", "content": "这几篇文章讲了什么？"}
    ],
    stream=True,
)
```

## 直接使用纯文本

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen-long",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": "阿里云百炼手机产品介绍 ..."},
        {"role": "user", "content": "文章讲了什么？"}
    ],
    stream=True,
)
```