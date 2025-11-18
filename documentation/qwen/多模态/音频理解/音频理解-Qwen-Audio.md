---
title: 音频理解-Qwen-Audio
update: 2025-11-18
source: https://help.aliyun.com/zh/model-studio/audio-language-model
---

通义千问Audio是阿里云研发的大规模音频语言模型，能够理解多种音频（包括说话人语音、自然声音、音乐、歌声等）。模型的核心能力包括音频转录、提取内容摘要、情感分析、音频事件检测及语音聊天等。

|应用场景|输入示例|输出结果|
|---|---|---|

```python
import dashscope
messages = [
    {"role": "user","content": [
        {"audio": "https://dashscope.oss-cn-beijing.aliyuncs.com/audios/welcome.mp3"},
        {"text": "这段音频在说什么?"}
    ]}
]
response = dashscope.MultiModalConversation.call(
    model="qwen-audio-turbo-latest", messages=messages, result_format="message")
print(response["output"]["choices"][0]["message"].content[0]["text"]) 
```

```python
from dashscope import MultiModalConversation
audio_file_path = "file://ABSOLUTE_PATH/welcome.mp3"
messages = [
    {"role": "system", "content": [{"text": "You are a helpful assistant."}]},
    {"role": "user","content": [{"audio": audio_file_path}, {"text": "音频里在说什么?"}]}
]
response = MultiModalConversation.call(model="qwen-audio-turbo-latest", messages=messages)
print(response["output"]["choices"][0]["message"].content[0]["text"]) 
```

...（完整保留Python/Node.js相关示例、表格与列表；外链按规范加 [来源]）