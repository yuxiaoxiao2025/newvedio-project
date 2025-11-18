---
title: 翻译能力（Qwen-MT）
update: 2025-11-11
source: https://help.aliyun.com/zh/model-studio/machine-translation
---

Qwen-MT 支持 92 个语种互译，并提供术语干预、翻译记忆与领域提示能力。

## 基本用法（OpenAI 兼容）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen-mt-flash",
    messages=[{"role": "user", "content": "我看到这个视频后没有笑"}],
    extra_body={"translation_options": {"source_lang": "auto", "target_lang": "English"}},
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
    model: "qwen-mt-flash",
    messages: [{ role: "user", content: "我看到这个视频后没有笑" }],
    translation_options: { source_lang: "auto", target_lang: "English" }
});
console.log(completion.choices[0].message.content);
```

## 流式输出（增量）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
messages = [{"role": "user", "content": "我看到这个视频后没有笑"}]
translation_options = {"source_lang": "Chinese", "target_lang": "English"}

completion = client.chat.completions.create(
    model="qwen-mt-flash",
    messages=messages,
    stream=True,
    stream_options={"include_usage": True},
    extra_body={"translation_options": translation_options},
)
for chunk in completion:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="")
```

```javascript
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

const messages = [{ role: "user", content: "我看到这个视频后没有笑" }];
const translation_options = { source_lang: "Chinese", target_lang: "English" };

const stream = await client.chat.completions.create({
    model: "qwen-mt-flash",
    messages,
    stream: true,
    translation_options
});
for await (const chunk of stream) {
    if (chunk.choices?.length) process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

## 术语干预

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
messages = [{"role": "user", "content": "这套生物传感器运用了石墨烯..."}]
translation_options = {
    "source_lang": "Chinese",
    "target_lang": "English",
    "terms": [
        {"source": "生物传感器", "target": "biological sensor"},
        {"source": "身体健康状况", "target": "health status of the body"}
    ]
}
completion = client.chat.completions.create(
    model="qwen-mt-plus",
    messages=messages,
    extra_body={"translation_options": translation_options}
)
print(completion.choices[0].message.content)
```

## 翻译记忆（tm_list）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
messages = [{"role": "user", "content": "通过如下命令可以看出安装thrift的版本信息；"}]
translation_options = {
    "source_lang": "Chinese",
    "target_lang": "English",
    "tm_list": [
        {"source": "您可以通过如下方式查看集群的内核版本信息:", "target": "You can use one of the following methods to query the engine version of a cluster:"}
    ]
}
completion = client.chat.completions.create(
    model="qwen-mt-plus",
    messages=messages,
    extra_body={"translation_options": translation_options}
)
print(completion.choices[0].message.content)
```