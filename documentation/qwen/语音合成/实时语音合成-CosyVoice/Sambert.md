title: 实时语音合成-CosyVoice/Sambert
update: 2025-11-18
source: https://help.aliyun.com/zh/model-studio/text-to-speech

# 实时语音合成-CosyVoice/Sambert

语音合成，又称文本转语音（Text-to-Speech，TTS），是将文本转换为自然语音的技术。该技术基于机器学习算法，通过学习大量语音样本，掌握语言的韵律、语调和发音规则，从而在接收到文本输入时生成真人般自然的语音内容。

## 核心功能

- 实时生成高保真语音，支持中英等多语种自然发声
- 提供声音复刻能力，快速定制个性化音色
- 支持流式输入输出，低延迟响应实时交互场景
- 可调节语速、语调、音量与码率，精细控制语音表现
- 兼容主流音频格式，最高支持48kHz采样率输出

## 适用范围

- 支持的地域：仅支持中国大陆（北京）地域，需使用“中国大陆（北京）”地域的 API Key
- 支持的模型：
  - CosyVoice：cosyvoice-v3-plus、cosyvoice-v3、cosyvoice-v2、cosyvoice-v1
  - Sambert：sambert-zhinan-v1、sambert-zhiqi-v1、sambert-zhichu-v1、sambert-zhide-v1、sambert-zhijia-v1、sambert-zhiru-v1、sambert-zhiqian-v1、sambert-zhixiang-v1、sambert-zhiwei-v1、sambert-zhihao-v1、sambert-zhijing-v1、sambert-zhiming-v1、sambert-zhimo-v1、sambert-zhina-v1、sambert-zhishu-v1、sambert-zhistella-v1、sambert-zhiting-v1、sambert-zhixiao-v1、sambert-zhiya-v1、sambert-zhiye-v1、sambert-zhiying-v1、sambert-zhiyuan-v1、sambert-zhiyue-v1、sambert-zhigui-v1、sambert-zhishuo-v1、sambert-zhimiao-emo-v1、sambert-zhimao-v1、sambert-zhilun-v1、sambert-zhifei-v1、sambert-zhida-v1、sambert-camila-v1、sambert-perla-v1、sambert-indah-v1、sambert-clara-v1、sambert-hanna-v1、sambert-beth-v1、sambert-betty-v1、sambert-cally-v1、sambert-cindy-v1、sambert-eva-v1、sambert-donna-v1、sambert-brian-v1、sambert-waan-v1（详情参见 Sambert 模型列表）

## 快速开始（CosyVoice）

将合成音频保存为文件；将 LLM 生成的文本实时转成语音并通过扬声器播放。

```python
# coding=utf-8

import dashscope
from dashscope.audio.tts_v2 import *

# 若没有将API Key配置到环境变量中，需将your-api-key替换为自己的API Key
# dashscope.api_key = "your-api-key"

# 模型
model = "cosyvoice-v2"
# 音色
voice = "longxiaochun_v2"

# 实例化SpeechSynthesizer，并在构造方法中传入模型（model）、音色（voice）等请求参数
synthesizer = SpeechSynthesizer(model=model, voice=voice)
# 发送待合成文本，获取二进制音频
audio = synthesizer.call("今天天气怎么样？")
# 首次发送文本时需建立 WebSocket 连接，因此首包延迟会包含连接建立的耗时
print('[Metric] requestId为：{}，首包延迟为：{}毫秒'.format(
    synthesizer.get_last_request_id(),
    synthesizer.get_first_package_delay()))

# 将音频保存至本地
with open('output.mp3', 'wb') as f:
    f.write(audio)
```

## 快速开始（Sambert）

将合成音频保存为文件；将合成的音频通过扬声器播放。

```python
import dashscope
from dashscope.audio.tts import SpeechSynthesizer

# 若没有将API Key配置到环境变量中，需将下面这行代码注释放开，并将apiKey替换为自己的API Key
# dashscope.api_key = "apiKey"
result = SpeechSynthesizer.call(model='sambert-zhichu-v1',
                                # 当text内容的语种发生变化时，请确认model是否匹配。不同model支持不同的语种，详情请参见Sambert音色列表中的“语言”列。
                                text='今天天气怎么样',
                                sample_rate=48000,
                                format='wav')
print('requestId: ', result.get_response()['request_id'])
if result.get_audio_data() is not None:
    with open('output.wav', 'wb') as f:
        f.write(result.get_audio_data())
print(' get response: %s' % (result.get_response()))
```

## 模型功能特性对比

| 功能/特性 | cosyvoice-v3-plus | cosyvoice-v3 | cosyvoice-v2 | cosyvoice-v1 | Sambert |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 支持语言 | 中文、英文 | 因音色而异：中文（普通话、东北话、陕北话、闽南语、粤语）、英文（英式、美式）、韩语、日语 | 因音色而异：中文（普通话、东北话）、英文 | 因音色而异：中文、英文、美式英文、意大利语、西班牙语、印尼语、法语、德语、泰语 | — |
| 音频格式 | pcm、wav、mp3、opus | pcm、wav、mp3 | — | — | — |
| 采样率 | 8kHz、16kHz、22.05kHz、24kHz、44.1kHz、48kHz | 16kHz、48kHz | — | — | — |
| 声音复刻 | 支持 | 不支持 | — | — | — |
| SSML | 不支持 | 支持 | 不支持 | 支持 | — |
| LaTeX | 支持 | 不支持 | — | — | — |
| 码率调节 | 支持 | 不支持 | — | — | — |
| 时间戳 | 不支持 | 默认关闭，可开启 | 不支持 | 默认关闭，可开启 | — |
| 设置情感 | 支持 | 不支持 | — | — | — |
| 流式输入 | 支持 | 不支持 | — | — | — |
| 流式输出 | 支持 | — | — | — | — |
| 限流（RPS） | 3 | 20 | — | — | — |

## 相关链接

- 实时语音合成-通义千问: ./实时语音合成-通义千问.md
- 语音合成-通义千问: ./通义千问的语音合成模型.md
- 产品详情: [产品详情](https://www.aliyun.com/product/bailian) [来源]