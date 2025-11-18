---
title: 深入研究（Qwen-Deep-Research）
update: 2025-11-05
source: https://help.aliyun.com/zh/model-studio/qwen-deep-research
---

Qwen-Deep-Research 自动规划研究步骤、执行多轮搜索与信息整合，生成结构化研究报告。当前仅支持 DashScope Python SDK 流式调用。

## 快速开始（DashScope）

```python
import os
import dashscope

API_KEY = os.getenv('DASHSCOPE_API_KEY')

def call_deep_research(messages):
    return dashscope.Generation.call(
        api_key=API_KEY,
        model="qwen-deep-research",
        messages=messages,
        stream=True,
    )

messages = [{'role': 'user', 'content': '研究一下人工智能在教育中的应用'}]
responses = call_deep_research(messages)
for resp in responses:
    if getattr(resp, 'output', None):
        msg = resp.output.get('message', {})
        print(msg.get('content', ''), end='')
```

## 阶段解析

- answer：反问确认与报告生成；status：typing、finished
- ResearchPlanning：生成研究计划；status：typing、finished
- WebResearch：联网搜索与网页分析；status：streamingQueries、streamingWebResult、WebResultFinished
- KeepAlive：连接保持（忽略）

## 计费说明

- 输入：每千 Token 0.054 元；输出：每千 Token 0.163 元
- 统计在 status=finished 时可从 `usage` 获取输入/输出 Token