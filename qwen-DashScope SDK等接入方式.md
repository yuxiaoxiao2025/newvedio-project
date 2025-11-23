阿里云百炼支持通过API调用大模型，涵盖OpenAI兼容接口、DashScope SDK等接入方式。

如果您已经熟悉大模型调用，也可以直接查看API参考文档通义千问。

如果您不熟悉编程，可以参见Chatbox，通过图形化界面与通义千问模型对话。

本文以通义千问为例，引导您完成大模型API调用。您将了解到：

如何获取 API Key

如何配置本地开发环境

如何调用通义千问 API

账号设置
注册账号：如果没有阿里云账号，您需要先注册阿里云账号。

开通阿里云百炼：使用阿里云主账号前往阿里云百炼大模型服务平台（北京或新加坡），阅读并同意协议后，将自动开通阿里云百炼，如果未弹出服务协议，则表示您已经开通。

如果开通服务时提示“您尚未进行实名认证”，请先进行实名认证。
获取API Key：前往密钥管理（北京或新加坡）页面，单击创建API-KEY，即可通过API KEY调用大模型。

创建新的API Key时，归属业务空间推荐选择主账号空间。使用子空间API Key需由主账号管理员为对应子空间开通模型授权（如本文使用通义千问-Plus模型），详情请参见授权子业务空间模型调用、训练和部署。
配置API Key到环境变量
建议您把API Key配置到环境变量，从而避免在代码里显式地配置API Key，降低泄漏风险。

配置步骤

选择开发语言
选择您熟悉的语言或工具，用于调用大模型API。

PythonNode.jsJavacurl其它语言
步骤 1：配置Python环境
检查您的Python版本
配置虚拟环境（可选）
安装OpenAI Python SDK或DashScope Python SDK
步骤 2：调用大模型API
OpenAI Python SDKDashScope Python SDK
如果您安装完成了Python以及DashScope的Python SDK，可以参考以下步骤发送您的API请求。

新建一个文件，命名为hello_qwen.py。

将以下代码复制到hello_qwen.py中并保存。

 
import os
from dashscope import Generation
import dashscope 

# 若使用新加坡地域的模型，请释放下列注释
# dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"
messages = [
    {'role': 'system', 'content': 'You are a helpful assistant.'},
    {'role': 'user', 'content': '你是谁？'}
    ]
response = Generation.call(
    # 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：api_key = "sk-xxx",
    api_key=os.getenv("DASHSCOPE_API_KEY"), 
    model="qwen-plus",   # 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages=messages,
    result_format="message"
)

if response.status_code == 200:
    print(response.output.choices[0].message.content)
else:
    print(f"HTTP返回码：{response.status_code}")
    print(f"错误码：{response.code}")
    print(f"错误信息：{response.message}")
    print("请参考文档：https://help.aliyun.com/zh/model-studio/developer-reference/error-code")
通过命令行运行python hello_qwen.py或python3 hello_qwen.py。

DashScope
北京地域新加坡地域金融云
HTTP 请求地址：

通义千问大语言模型：POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

通义千问VL/Audio模型：POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation

SDK 调用无需配置 base_url。

您需要已获取API Key并配置API Key到环境变量。如果通过DashScope SDK进行调用，需要安装DashScope SDK。
请求体
文本输入流式输出图像输入视频输入音频输入联网搜索工具调用异步调用文字提取深入研究文档理解
以下为传入视频帧的示例代码，关于更多用法（如传入视频文件），请参见视觉理解。
PythonJavacurl
 
from http import HTTPStatus
import os
# dashscope版本需要不低于1.20.10
import dashscope

messages = [{"role": "user",
             "content": [
                 {"video":["https://img.alicdn.com/imgextra/i3/O1CN01K3SgGo1eqmlUgeE9b_!!6000000003923-0-tps-3840-2160.jpg",
                           "https://img.alicdn.com/imgextra/i4/O1CN01BjZvwg1Y23CF5qIRB_!!6000000003000-0-tps-3840-2160.jpg",
                           "https://img.alicdn.com/imgextra/i4/O1CN01Ib0clU27vTgBdbVLQ_!!6000000007859-0-tps-3840-2160.jpg",
                           "https://img.alicdn.com/imgextra/i1/O1CN01aygPLW1s3EXCdSN4X_!!6000000005710-0-tps-3840-2160.jpg"]},
                 {"text": "描述这个视频的具体过程"}]}]
response = dashscope.MultiModalConversation.call(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    model='qwen-vl-max-latest',  # 此处以qwen-vl-max-latest为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages=messages
)
if response.status_code == HTTPStatus.OK:
    print(response)
else:
    print(response.code)
    print(response.message)
model string （必选）

模型名称。

支持的模型：Qwen 大语言模型（商业版、开源版）、Qwen-VL、Qwen-Coder、深入研究模型、通义千问Audio、数学模型。

具体模型名称和计费，请参见模型列表。

messages array （必选）

传递给大模型的上下文，按对话顺序排列。

通过HTTP调用时，请将messages 放入 input 对象中。
消息类型

temperature float （可选）

采样温度，控制模型生成文本的多样性。

temperature越高，生成的文本更多样，反之，生成的文本更确定。

取值范围： [0, 2)

temperature默认值

通过HTTP调用时，请将 temperature 放入 parameters 对象中。
不建议修改QVQ模型的默认 temperature 值。
top_p float （可选）

核采样的概率阈值，控制模型生成文本的多样性。

top_p越高，生成的文本更多样。反之，生成的文本更确定。

取值范围：（0,1.0]。

top_p默认值

Java SDK中为topP。通过HTTP调用时，请将 top_p 放入 parameters 对象中。
不建议修改QVQ模型的默认 top_p 值。
top_k integer （可选）

生成过程中采样候选集的大小。例如，取值为50时，仅将单次生成中得分最高的50个Token组成随机采样的候选集。取值越大，生成的随机性越高；取值越小，生成的确定性越高。取值为None或当top_k大于100时，表示不启用top_k策略，此时仅有top_p策略生效。

取值需要大于或等于0。

top_k默认值

Java SDK中为topK。通过HTTP调用时，请将 top_k 放入 parameters 对象中。
不建议修改QVQ模型的默认 top_k 值。
enable_thinking boolean （可选）

使用混合思考模型时，是否开启思考模式，适用于 Qwen3 、Qwen3-VL模型。相关文档：深度思考

可选值：

true：开启

开启后，思考内容将通过reasoning_content字段返回。
false：不开启

不同模型的默认值：支持的模型

Java SDK 为enableThinking；通过HTTP调用时，请将 enable_thinking 放入 parameters 对象中。
thinking_budget integer （可选）

思考过程的最大长度。适用于Qwen3-VL、Qwen3 的商业版与开源版模型。相关文档：限制思考长度。

默认值为模型最大思维链长度，请参见：模型列表

Java SDK 为 thinkingBudget。通过HTTP调用时，请将 thinking_budget 放入 parameters 对象中。
默认值为模型最大思维链长度。
enable_code_interpreter boolean （可选）默认值为 false

是否开启代码解释器功能。仅适用于思考模式下的 qwen3-max-preview。相关文档：代码解释器

可选值：

true：开启

false：不开启

不支持 Java SDK。通过HTTP调用时，请将 enable_code_interpreter 放入 parameters 对象中。
repetition_penalty float （可选）

模型生成时连续序列中的重复度。提高repetition_penalty时可以降低模型生成的重复度，1.0表示不做惩罚。没有严格的取值范围，只要大于0即可。

repetition_penalty默认值

Java SDK中为repetitionPenalty。通过HTTP调用时，请将 repetition_penalty 放入 parameters 对象中。
使用qwen-vl-plus、qwen-vl-plus_2025-01-25模型进行文字提取时，建议设置repetition_penalty为1.0。
对于通义千问OCR模型，repetition_penalty的默认值为1.05，该参数对模型效果影响较大，请勿随意修改。
不建议修改QVQ模型的默认 repetition_penalty 值。
presence_penalty float （可选）

控制模型生成文本时的内容重复度。

取值范围：[-2.0, 2.0]。正值降低重复度，负值增加重复度。

在创意写作或头脑风暴等需要多样性、趣味性或创造力的场景中，建议调高该值；在技术文档或正式文本等强调一致性与术语准确性的场景中，建议调低该值。

presence_penalty默认值

原理介绍

示例

使用qwen-vl-plus-2025-01-25模型进行文字提取时，建议设置presence_penalty为1.5。
不建议修改QVQ模型的默认presence_penalty值。
Java SDK不支持设置该参数。通过HTTP调用时，请将 presence_penalty 放入 parameters 对象中。
vl_high_resolution_images boolean （可选）默认值为false

是否将输入图像的像素上限提升至 16384 Token 对应的像素值。相关文档：处理高分辨率图像。

vl_high_resolution_images：true，使用固定分辨率策略，忽略 max_pixels 设置，超过此分辨率时会将图像总像素缩小至此上限内。

点击查看各模型像素上限

vl_high_resolution_images为false，实际分辨率由 max_pixels 与默认上限共同决定，取二者计算结果的最大值。超过此像素上限时会将图像缩小至此上限内。

点击查看各模型的默认像素上限

Java SDK 为 vlHighResolutionImages（需要的最低版本为2.20.8）。通过HTTP调用时，请将 vl_high_resolution_images 放入 parameters 对象中。
vl_enable_image_hw_output boolean （可选）默认值为 false

是否返回图像缩放后的尺寸。模型会对输入的图像进行缩放处理，配置为 True 时会返回图像缩放后的高度和宽度，开启流式输出时，该信息在最后一个数据块（chunk）中返回。支持Qwen-VL模型。

Java SDK中为 vlEnableImageHwOutput，Java SDK最低版本为2.20.8。通过HTTP调用时，请将 vl_enable_image_hw_output 放入 parameters 对象中。
ocr_options object （可选）

使用通义千问OCR模型调用内置任务时需要配置的参数。

属性

Java SDK为OcrOptions，DashScope Python SDK 最低版本为1.22.2， Java SDK 最低版本为2.18.4。
通过HTTP调用时，请将 ocr_options 放入 parameters 对象中。
max_input_tokens integer （可选）

允许输入的最大 Token 长度。目前仅支持qwen-plus-0728/latest模型。

qwen-plus-latest 默认值：129,024

后续默认值可能调整至1,000,000。
qwen-plus-2025-07-28 默认值：1,000,000

Java SDK 暂不支持该参数。通过HTTP调用时，请将 max_input_tokens 放入 parameters 对象中。
max_tokens integer （可选）

用于限制模型输出的最大 Token 数。若生成内容超过此值，生成将提前停止，且返回的finish_reason为length。

默认值与最大值均为模型的最大输出长度，请参见模型列表。

适用于需控制输出长度的场景，如生成摘要、关键词，或用于降低成本、缩短响应时间。

触发 max_tokens 时，响应的 finish_reason 字段为 length。

qwen-vl-ocr、qwen-vl-ocr-latest、qwen-vl-ocr-2025-04-13、qwen-vl-ocr-2025-08-28模型的max_tokens参数（最大输出长度）默认为 4096，如需提高该参数值（4097~8192范围），请发送邮件至 modelstudio@service.aliyun.com进行申请，并提供以下信息：主账号ID、图像类型（如文档图、电商图、合同等）、模型名称、预计 QPS 和每日请求总数，以及模型输出长度超过4096的请求占比。
max_tokens不限制思考模型思维链的长度。
Java SDK中为maxTokens（模型为通义千问VL/OCR/Audio时，Java SDK中为maxLength，在 2.18.4 版本之后支持也设置为 maxTokens）。通过HTTP调用时，请将 max_tokens 放入 parameters 对象中。
seed integer （可选）

随机数种子。用于确保在相同输入和参数下生成结果可复现。若调用时传入相同的 seed 且其他参数不变，模型将尽可能返回相同结果。

取值范围：[0,231−1]。

seed默认值

通过HTTP调用时，请将 seed 放入 parameters 对象中。
stream boolean （可选） 默认值为false

是否流式输出回复。参数值：

false：模型生成完所有内容后一次性返回结果。

true：边生成边输出，即每生成一部分内容就立即输出一个片段（chunk）。

该参数仅支持Python SDK。通过Java SDK实现流式输出请通过streamCall接口调用；通过HTTP实现流式输出请在Header中指定X-DashScope-SSE为enable。
Qwen3商业版（思考模式）、Qwen3开源版、QwQ、QVQ只支持流式输出。
incremental_output boolean （可选）默认为false（Qwen3-Max、Qwen3-VL、Qwen3 开源版、QwQ 、QVQ模型默认值为 true）

在流式输出模式下是否开启增量输出。推荐您优先设置为true。

参数值：

false：每次输出为当前已经生成的整个序列，最后一次输出为生成的完整结果。

 
I
I like
I like apple
I like apple.
true（推荐）：增量输出，即后续输出内容不包含已输出的内容。您需要实时地逐个读取这些片段以获得完整的结果。

 
I
like
apple
.
Java SDK中为incrementalOutput。通过HTTP调用时，请将 incremental_output 放入 parameters 对象中。
QwQ 模型与思考模式下的 Qwen3 模型只支持设置为 true。由于 Qwen3 商业版模型默认值为false，您需要在思考模式下手动设置为 true。
Qwen3 开源版模型不支持设置为 false。
response_format object （可选） 默认值为{"type": "text"}

返回内容的格式。可选值：{"type": "text"}或{"type": "json_object"}。设置为{"type": "json_object"}时会输出标准格式的JSON字符串。相关文档：结构化输出。

如果指定为{"type": "json_object"}，需同时在提示词中指引模型输出JSON格式，如：“请按照json格式输出”，否则会报错。
Java SDK 中为 responseFormat。通过HTTP调用时，请将 response_format 放入 parameters 对象中。
支持的模型

output_format string （可选）默认值为"model_detailed_report"

仅当调用通义千问深入研究模型 qwen-deep-research 时，用于规定输出内容格式。

可选值：

"model_detailed_report"：详细研究报告，约6000字

"model_summary_report"：摘要研究报告，约1500-2000字

result_format string （可选） 默认为text（Qwen3-Max、Qwen3-VL、QwQ 模型、Qwen3 开源模型（除了qwen3-next-80b-a3b-instruct）与 Qwen-Long 模型默认值为 message）

返回数据的格式。推荐您优先设置为message，可以更方便地进行多轮对话。

平台后续将统一调整默认值为message。
Java SDK中为resultFormat。通过HTTP调用时，请将 result_format 放入 parameters 对象中。
模型为通义千问VL/QVQ/OCR/Audio时，设置text不生效。
Qwen3-Max、Qwen3-VL、思考模式下的 Qwen3 模型只能设置为message，由于 Qwen3 商业版模型默认值为text，您需要将其设置为message。
如果您使用 Java SDK 调用Qwen3 开源模型，并且传入了 text，依然会以 message格式进行返回。
logprobs boolean （可选）默认值为 false

是否返回输出 Token 的对数概率，可选值：

true

返回

false

不返回

支持以下模型：

qwen-plus系列的快照模型（不包含主线模型）

qwen-turbo 系列的快照模型（不包含主线模型）

qwen-vl-ocr-2025-04-13及之后更新的模型

Qwen3 开源模型

通过HTTP调用时，请将 logprobs 放入 parameters 对象中。
top_logprobs integer （可选）默认值为0

指定在每一步生成时，返回模型最大概率的候选 Token 个数。

取值范围：[0,5]

仅当 logprobs 为 true 时生效。

Java SDK中为topLogprobs。通过HTTP调用时，请将 top_logprobs 放入 parameters 对象中。
n integer （可选） 默认值为1

生成响应的个数，取值范围是1-4。对于需要生成多个响应的场景（如创意写作、广告文案等），可以设置较大的 n 值。

当前仅支持 qwen-plus、 Qwen3（非思考模式）、qwen-plus-character 模型，且在传入 tools 参数时固定为1。
设置较大的 n 值不会增加输入 Token 消耗，会增加输出 Token 的消耗。
通过HTTP调用时，请将 n 放入 parameters 对象中。
stop string 或 array （可选）

用于指定停止词。当模型生成的文本中出现stop 指定的字符串或token_id时，生成将立即终止。

可传入敏感词以控制模型的输出。

stop为数组时，不可将token_id和字符串同时作为元素输入，比如不可以指定为["你好",104307]。
通过HTTP调用时，请将 stop 放入 parameters 对象中。
tools array （可选）

包含一个或多个工具对象的数组，供模型在 Function Calling 中调用。相关文档：Function Calling

使用 tools 时，必须将result_format设为message。

发起 Function Calling，或提交工具执行结果时，都必须设置tools参数。

属性

通过HTTP调用时，请将 tools 放入 parameters 对象中。暂时不支持qwen-vl与qwen-audio系列模型。
tool_choice string 或 object （可选）默认值为 auto

工具选择策略。若需对某类问题强制指定工具调用方式（例如始终使用某工具或禁用所有工具），可设置此参数。

auto

大模型自主选择工具策略；

none

若在特定请求中希望临时禁用工具调用，可设定tool_choice参数为none；

{"type": "function", "function": {"name": "the_function_to_call"}}

若希望强制调用某个工具，可设定tool_choice参数为{"type": "function", "function": {"name": "the_function_to_call"}}，其中the_function_to_call是指定的工具函数名称。

思考模式的模型不支持强制调用某个工具。
Java SDK中为toolChoice。通过HTTP调用时，请将 tool_choice 放入 parameters 对象中。
parallel_tool_calls boolean （可选）默认值为 false

是否开启并行工具调用。

可选值：

true：开启

false：不开启。

并行工具调用详情请参见：并行工具调用。

Java SDK中为parallelToolCalls。通过HTTP调用时，请将 parallel_tool_calls 放入 parameters 对象中。
enable_search boolean （可选） 默认值为false

模型在生成文本时是否使用互联网搜索结果进行参考。取值如下：

true：启用互联网搜索，模型会将搜索结果作为文本生成过程中的参考信息，但模型会基于其内部逻辑判断是否使用互联网搜索结果。

若开启后未联网搜索，可优化提示词，或设置search_options中的forced_search参数开启强制搜索。
false：关闭互联网搜索。

计费信息请参见计费说明。

Java SDK中为enableSearch。通过HTTP调用时，请将 enable_search 放入 parameters 对象中。
启用互联网搜索功能可能会增加 Token 的消耗。
search_options object （可选）

联网搜索的策略。仅当enable_search为true时生效。详情参见联网搜索。

通过HTTP调用时，请将 search_options 放入 parameters 对象中。Java SDK中为searchOptions。
属性

X-DashScope-DataInspection string （可选）

在通义千问 API 的内容安全能力基础上，是否进一步识别输入输出内容的违规信息。取值如下：

'{"input":"cip","output":"cip"}'：进一步识别；

不设置该参数：不进一步识别。

通过 HTTP 调用时请放入请求头：-H "X-DashScope-DataInspection: {\"input\": \"cip\", \"output\": \"cip\"}"；

通过 Python SDK 调用时请通过headers配置：headers={'X-DashScope-DataInspection': '{"input":"cip","output":"cip"}'}。

详细使用方法请参见内容审核。

不支持通过 Java SDK 设置。
不适用于 Qwen-VL、Qwen-Audio 系列模型。
chat响应对象（流式与非流式输出格式一致）
 
{
  "status_code": 200,
  "request_id": "902fee3b-f7f0-9a8c-96a1-6b4ea25af114",
  "code": "",
  "message": "",
  "output": {
    "text": null,
    "finish_reason": null,
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "role": "assistant",
          "content": "我是阿里云开发的一款超大规模语言模型，我叫通义千问。"
        }
      }
    ]
  },
  "usage": {
    "input_tokens": 22,
    "output_tokens": 17,
    "total_tokens": 39
  }
}
status_code string

本次请求的状态码。200 表示请求成功，否则表示请求失败。

Java SDK不会返回该参数。调用失败会抛出异常，异常信息为status_code和message的内容。
request_id string

本次调用的唯一标识符。

Java SDK返回参数为requestId。
code string

错误码，调用成功时为空值。

只有Python SDK返回该参数。
output object

调用结果信息。

属性

usage map

本次chat请求使用的Token信息。

属性
