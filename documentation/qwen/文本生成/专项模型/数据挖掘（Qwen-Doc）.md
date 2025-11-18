---
title: 数据挖掘（Qwen-Doc）
update: 2025-11-13
source: https://help.aliyun.com/zh/model-studio/data-mining-qwen-doc
---

Qwen-Doc-Turbo 面向信息抽取、审核、分类与摘要，输出规范 JSON 结构。

## 文件URL方式（DashScope）

```python
import os
import dashscope

response = dashscope.Generation.call(
    api_key=os.getenv('DASHSCOPE_API_KEY'),
    model='qwen-doc-turbo',
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "从两份产品手册中提取产品信息并以 JSON 返回"},
                {"type": "doc_url", "doc_url": [
                    "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20251107/jockge/%E7%A4%BA%E4%BE%8B%E4%BA%A7%E5%93%81%E6%89%8B%E5%86%8CA.docx",
                    "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20251107/ztwxzr/%E7%A4%BA%E4%BE%8B%E4%BA%A7%E5%93%81%E6%89%8B%E5%86%8CB.docx"
                ], "file_parsing_strategy": "auto"}
            ]
        }
    ]
)
print(response.output.choices[0].message.content)
```

## 文件ID方式（OpenAI 兼容）

```python
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

file_object = client.files.create(file=Path("示例产品手册A.docx"), purpose="file-extract")
file_id = file_object.id

completion = client.chat.completions.create(
    model="qwen-doc-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": f"fileid://{file_id}"},
        {"role": "user", "content": "提取手册中的产品信息并以 JSON 返回"}
    ],
    stream=True,
)
for chunk in completion:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end='')
```

## 纯文本方式

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen-doc-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": "智能办公产品手册 版本：V2.0 ..."},
        {"role": "user", "content": "提取产品信息并以 JSON 返回"}
    ],
    stream=True,
)
for chunk in completion:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end='')
```