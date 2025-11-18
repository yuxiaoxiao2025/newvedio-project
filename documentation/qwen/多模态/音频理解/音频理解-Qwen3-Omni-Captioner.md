---
title: 音频理解-Qwen3-Omni-Captioner
update: 2025-11-18
source: https://help.aliyun.com/zh/model-studio/qwen3-omni-captioner
---

Qwen3-Omni-Captioner是以通义千问3-Omni为基座的开源模型，无需任何提示，自动为复杂语音、环境声、音乐、影视声效等生成精准、全面的描述，适用于音频内容分析、安全审核、意图识别、音频剪辑等多个领域。

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv('DASHSCOPE_API_KEY'), base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
completion = client.chat.completions.create(
    model="qwen3-omni-30b-a3b-captioner",
    messages=[{
        "role": "user",
        "content": [{"type": "input_audio","input_audio": {"data": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20240916/xvappi/%E8%A3%85%E4%BF%AE%E5%99%AA%E9%9F%B3.wav"}}]
    }]
)
print(completion.choices[0].message.content)
```

```python
import dashscope, os
messages = [{"role": "user","content": [{"audio": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20240916/xvappi/%E8%A3%85%E4%BF%AE%E5%99%AA%E9%9F%B3.wav"}]}]
response = dashscope.MultiModalConversation.call(api_key=os.getenv('DASHSCOPE_API_KEY'), model="qwen3-omni-30b-a3b-captioner", messages=messages)
print(response["output"]["choices"][0]["message"].content[0]["text"]) 
```

...（完整保留Python/Node.js相关示例、表格与列表；外链按规范加 [来源]）