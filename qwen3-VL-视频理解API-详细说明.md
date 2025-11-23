通义千问VL模型可以根据您传入的图片或视频进行回答，支持单图或多图的输入，适用于图像描述、视觉问答、物体定位等多种任务。

在线体验：视觉模型（北京或新加坡）

快速开始
前提条件

已获取 API Key并配置API Key到环境变量。

如果通过 SDK 进行调用，需安装SDK，其中 DashScope Python SDK 版本不低于1.24.6，DashScope Java SDK 版本不低于 2.21.10。

以下示例演示了如何调用模型描述图像内容。关于本地文件和图像限制的说明，请参见如何传入本地文件、图像限制章节。

OpenAI兼容DashScope
PythonNode.jscurl
 
import os
from openai import OpenAI

client = OpenAI(
    # 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：api_key="sk-xxx",
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen3-vl-plus", # 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"
                    },
                },
                {"type": "text", "text": "图中描绘的是什么景象?"},
            ],
        },
    ],
)
print(completion.choices[0].message.content)
返回结果
 
这是一张在海滩上拍摄的照片。照片中，一个人和一只狗坐在沙滩上，背景是大海和天空。人和狗似乎在互动，狗的前爪搭在人的手上。阳光从画面的右侧照射过来，给整个场景增添了一种温暖的氛围。
模型选型
对于如高精度的物体识别与定位（包括 3D 定位）、 Agent 工具调用、文档和网页解析、复杂题目解答、长视频理解等任务，首选 Qwen3-VL，系列内模型对比如下：

qwen3-vl-plus：性能最强的模型。

qwen3-vl-flash：速度更快，成本更低，是兼顾性能与成本的高性价比选择，适用于对响应速度敏感的场景。

对于简单的图像描述、短视频摘要提取等通用任务，可选 Qwen2.5-VL，系列内模型对比如下：

qwen-vl-max：Qwen2.5-VL 系列中效果最佳的模型。

qwen-vl-plus：速度更快，在效果与成本之间实现良好平衡。

模型的名称、上下文、价格、快照版本等信息请参见模型列表；并发限流条件请参考限流。

模型特性对比

效果概览
图像问答
描述图像中的内容或者对其进行分类打标，如识别人物、地点、动植物等。

p1021359

如果太阳很刺眼，我应该用这张图中的什么物品？

当太阳很刺眼时，你应该使用图中的粉色太阳镜。太阳镜可以有效阻挡强光、减少紫外线对眼睛的伤害，帮助你在阳光强烈时保护视力并提升视觉舒适度。

创意写作
根据图片或视频内容生成生动的文字描述，适用于故事创作、文案撰写、短视频脚本等创意场景。

vl-问答

请根据图片内容，帮我写一段有意思的朋友圈文案。

好的，这张图片充满了浓郁的中秋节日氛围，古典与现代元素结合得非常巧妙。根据图片中的主要元素，我为你准备了几个不同风格的朋友圈文案，你可以根据自己的喜好选择。

诗意唯美风

今夜月明人尽望，不知秋思落谁家。嫦娥奔月，玉兔捣药，古人的浪漫在今夜被点亮。愿这轮明月，能照亮你回家的路，也能寄去我最深的思念。中秋节快乐！

温馨祝福风

月圆人团圆，中秋夜最温柔。看烟花绽放，赏圆月当空，吃一口月饼，道一声安康。愿你我心中所念，皆能如愿以偿。祝大家中秋快乐，阖家幸福！

文字识别与信息抽取
识别图像中的文字、公式或抽取票据、证件、表单中的信息，支持格式化输出文本；Qwen3-VL模型支持的语言增加至33种，支持的语言可参见模型特性对比。

-q2cdz6jy89b6m3kp

提取图中的：['发票代码','发票号码','到站','燃油费','票价','乘车日期','开车时间','车次','座号']，请你以JSON格式输出。

{

"发票代码": "221021325353",

"发票号码": "10283819",

"到站": "开发区",

"燃油费": "2.0",

"票价": "8.00<全>",

"乘车日期": "2013-06-29",

"开车时间": "流水",

"车次": "040",

"座号": "371"

}

多学科题目解答
解答图像中的数学、物理、化学等问题，适用于中小学、大学以及成人教育阶段。

-5jwcstcvmdpqghaj

请你分步骤解答图中的数学题。

-答案

视觉编码
可通过图像或视频生成代码，可用于将设计图、网站截图等生成HTML、CSS、JS 代码。

code

根据我的草图设计使用HTML、CSS创建网页，主色调为黑色。

code-预览

网页预览效果

物体定位
支持二维和三维定位，可用于判断物体方位、视角变化、遮挡关系。三维定位为Qwen3-VL模型新增能力。

Qwen2.5-VL模型 480*480 ～ 2560*2560 分辨率范围内，物体定位效果较为鲁棒，在此范围之外检测精度可能会下降（偶发检测框漂移现象）。
如需将定位结果绘制到原图可参见常见问题。
二维定位

-530xdcos1lqkcfuy

返回 Box（边界框）坐标 ：检测图中所有食物并以JSON格式输出其bbox的坐标。

返回 Point（中心点）坐标：以点的形式定位图中所有食物并以XML格式输出其point坐标。

可视化展示二维定位效果

-mu9podu1eyvph1zd

三维定位

可视化展示三维定位效果

文档解析
将图像类的文档（如扫描件/图片PDF）解析为 QwenVL HTML 或 QwenVL Markdown 格式，该格式不仅能精准识别文本，还能获取图像、表格等元素的位置信息。Qwen3-VL模型新增解析为 Markdown 格式的能力。

推荐提示词如下：qwenvl html（解析为HTML格式）或qwenvl markdown（解析为Markdown格式）
image

qwenvl markdown。

-结果

可视化展示效果

视频理解
分析视频内容，如对具体事件进行定位并获取时间戳，或生成关键时间段的摘要。

请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event），请使用HH:mm:ss表示 时间戳。

{

"events": [

{

"start_time": "00:00:00",

"end_time": "00:00:05",

"event": "人物手持一个纸箱走向桌子，并将纸箱放在桌上。"

},

{

"start_time": "00:00:05",

"end_time": "00:00:15",

"event": "人物拿起扫描枪，对准纸箱上的标签进行扫描。"

},

{

"start_time": "00:00:15",

"end_time": "00:00:21",

"event": "人物将扫描枪放回原位，然后拿起笔在笔记本上记录信息。"}]

}

核心能力
开启/关闭思考模式
qwen3-vl-plus、qwen3-vl-flash系列模型属于混合思考模型，模型可以在思考后回复，也可直接回复；通过enable_thinking参数控制是否开启思考模式：

true：开启思考模式

false（默认）：关闭思考模式

qwen3-vl-235b-a22b-thinking等带thinking后缀的属于仅思考模型，模型总会在回复前进行思考，且无法关闭。

重要
模型配置：在非 Agent 工具调用的通用对话场景下，为保持最佳效果，建议不设置System Message，可将模型角色设定、输出格式要求等指令通过User Message 传入。

优先使用流式输出： 开启思考模式时，支持流式和非流式两种输出方式。为避免因响应内容过长导致超时，建议优先使用流式输出方式。

限制思考长度：深度思考模型有时会输出冗长的推理过程，可使用 thinking_budget 参数限制思考过程的长度。若模型思考过程生成的 Token 数超过thinking_budget，推理内容会进行截断并立刻开始生成最终回复内容。thinking_budget 默认值为模型的最大思维链长度，请参见模型列表。

OpenAI 兼容DashScope
enable_thinking非 OpenAI 标准参数，若使用 OpenAI Python SDK 请通过 extra_body传入。

PythonNode.jscurl

 
from openai import OpenAI
import os

# 初始化OpenAI客户端
client = OpenAI(
    # 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：api_key="sk-xxx",
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

reasoning_content = ""  # 定义完整思考过程
answer_content = ""     # 定义完整回复
is_answering = False   # 判断是否结束思考过程并开始回复
enable_thinking = True
# 创建聊天完成请求
completion = client.chat.completions.create(
    model="qwen3-vl-plus",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://img.alicdn.com/imgextra/i1/O1CN01gDEY8M1W114Hi3XcN_!!6000000002727-0-tps-1024-406.jpg"
                    },
                },
                {"type": "text", "text": "这道题怎么解答？"},
            ],
        },
    ],
    stream=True,
    # enable_thinking 参数开启思考过程，thinking_budget 参数设置最大推理过程 Token 数
    # qwen3-vl-plus、 qwen3-vl-flash可通过enable_thinking开启或关闭思考、对于qwen3-vl-235b-a22b-thinking等带thinking后缀的模型，enable_thinking仅支持设置为开启，对其他Qwen-VL模型均不适用
    extra_body={
        'enable_thinking': enable_thinking,
        "thinking_budget": 81920},

    # 解除以下注释会在最后一个chunk返回Token使用量
    # stream_options={
    #     "include_usage": True
    # }
)

if enable_thinking:
    print("\n" + "=" * 20 + "思考过程" + "=" * 20 + "\n")

for chunk in completion:
    # 如果chunk.choices为空，则打印usage
    if not chunk.choices:
        print("\nUsage:")
        print(chunk.usage)
    else:
        delta = chunk.choices[0].delta
        # 打印思考过程
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content != None:
            print(delta.reasoning_content, end='', flush=True)
            reasoning_content += delta.reasoning_content
        else:
            # 开始回复
            if delta.content != "" and is_answering is False:
                print("\n" + "=" * 20 + "完整回复" + "=" * 20 + "\n")
                is_answering = True
            # 打印回复过程
            print(delta.content, end='', flush=True)
            answer_content += delta.content

# print("=" * 20 + "完整思考过程" + "=" * 20 + "\n")
# print(reasoning_content)
# print("=" * 20 + "完整回复" + "=" * 20 + "\n")
# print(answer_content)

多图像输入
通义千问VL 模型支持在单次请求中传入多张图片，可用于商品对比、多页文档处理等任务。实现时只需在user message 的content数组中包含多个图片对象即可。

重要
图片数量受模型图文总 Token 上限（即模型的最大输入）的限制，所有图片和文本的总 Token 数必须小于模型的最大输入。

OpenAI兼容DashScope
PythonNode.jscurl
 
import os
from openai import OpenAI

client = OpenAI(
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen3-vl-plus", # 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
    messages=[
       {"role": "user","content": [
           {"type": "image_url","image_url": {"url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"},},
           {"type": "image_url","image_url": {"url": "https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png"},},
           {"type": "text", "text": "这些图描绘了什么内容？"},
            ],
        }
    ],
)

print(completion.choices[0].message.content)
返回结果
 
图1中是一位女士和一只拉布拉多犬在海滩上互动的场景。女士穿着格子衬衫，坐在沙滩上，与狗进行握手的动作，背景是海浪和天空，整个画面充满了温馨和愉快的氛围。

图2中是一只老虎在森林中行走的场景。老虎的毛色是橙色和黑色条纹相间，它正向前迈步，周围是茂密的树木和植被，地面上覆盖着落叶，整个画面给人一种野生自然的感觉。
视频理解
通义千问VL模型支持对视频内容进行理解，文件形式包括图像列表（视频帧）或视频文件。

建议使用性能较优的最新版或近期快照版模型理解视频文件。
视频文件图像列表
视频抽帧说明

通义千问VL 模型通过从视频中提取帧序列进行内容分析，抽帧的频率决定了模型分析的精细度，不同 SDK 抽帧频率不同：

使用 DashScope SDK：

可通过 fps参数来控制抽帧间隔（每隔 
fps
1
​
 
秒抽取一帧），该参数范围为  (0.1, 10)且默认值为2.0。建议为高速运动场景设置较高 fps，为静态或长视频设置较低 fps。

使用OpenAI兼容SDK：采用固定频率抽帧（每0.5秒1帧），不支持自定义。

以下是理解在线视频（通过URL指定）的示例代码。了解如何传入本地文件。

OpenAI兼容DashScope
使用OpenAI SDK或HTTP方式向通义千问VL模型直接输入视频文件时，需要将用户消息中的"type"参数设为"video_url"。
PythonNode.jscurl
 
import os
from openai import OpenAI

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen3-vl-plus",
    messages=[
        {"role": "user","content": [{
            # 直接传入视频文件时，请将type的值设置为video_url
            # 使用OpenAI SDK时，视频文件默认每间隔0.5秒抽取一帧，且不支持修改，如需自定义抽帧频率，请使用DashScope SDK.
            "type": "video_url",            
            "video_url": {"url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241115/cqqkru/1.mp4"}},
            {"type": "text","text": "这段视频的内容是什么?"}]
         }]
)
print(completion.choices[0].message.content)
传入本地文件（Base64 编码或文件路径）
通义千问VL 提供两种本地文件上传方式：

Base64 编码上传

文件路径直接上传（传输更稳定，推荐方式）

上传方式：

Base64 编码上传文件路径上传
直接向模型传入本地文件路径。仅 DashScope Python 和 Java SDK 支持，不支持 DashScope HTTP 和OpenAI 兼容方式。

请您参考下表，结合您的编程语言与操作系统指定文件的路径。

指定文件路径（以图像为例）

系统

SDK

传入的文件路径

示例

Linux或macOS系统

Python SDK

file://{文件的绝对路径}

file:///home/images/test.png

Java SDK

Windows系统

Python SDK

file://{文件的绝对路径}

file://D:/images/test.png

Java SDK

file:///{文件的绝对路径}

file:///D:/images/test.png

使用限制：

建议优先选择文件路径上传（稳定性更高），1MB以下的文件可选择 Base64 编码方式上传；

直接传入文件路径时，单张图像或视频帧（图像列表）本身需小于 10MB，单个视频需小于100MB；

Base64编码方式传入时，由于Base64编码会增加数据体积，需保证编码后的单个图像或视频需小于 10MB。

如需压缩文件体积请参见如何将图像或视频压缩到满足要求的大小？
图像视频文件图像列表
文件路径传入Base64 编码传入
传入文件路径仅支持 DashScope Python 和 Java SDK方式调用，不支持 DashScope HTTP 和OpenAI 兼容方式。
PythonJava
 
import os
from dashscope import MultiModalConversation
import dashscope 

# 若使用新加坡地域的模型，请取消下列注释
# dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"

# 将xxx/eagle.png替换为你本地图像的绝对路径
local_path = "xxx/eagle.png"
image_path = f"file://{local_path}"
messages = [
                {'role':'user',
                'content': [{'image': image_path},
                            {'text': '图中描绘的是什么景象?'}]}]
response = MultiModalConversation.call(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv('DASHSCOPE_API_KEY'),
    model='qwen3-vl-plus',  # 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
    messages=messages)
print(response.output.choices[0].message.content[0]["text"])
处理高分辨率图像
通义千问VL API对单张图像编码后的视觉 Token 数量设有限制，默认配置下，高分辨率图像会被压缩，可能丢失细节，影响理解准确性。启用 vl_high_resolution_images 或调整 max_pixels 可增加视觉 Token 数量，从而保留更多图像细节，提升理解效果。

不同模型，每个视觉 Token 对应的像素与 Token 上限不同。具体参数如下：

模型

每Token 对应像素

vl_high_resolution_images

max_pixels

Token 上限

像素上限

Qwen3-VL系列、qwen-vl-max-0813、qwen-vl-plus-0815、qwen-vl-plus-0710模型

32*32

true

vl_high_resolution_images为true时，max_pixels 无效

16384 Token

16777216（即16384*32*32），超过此像素，则将图像的总像素缩小至此上限内。

false（默认）

vl_high_resolution_images为false时，可自定义，最大值是16777216

2560 Token与 max_pixels/32/32 中的最大值

2621440或max_pixels，超过此像素，则将图像的总像素缩小至此上限内。

QVQ系列及其他Qwen2.5-VL模型

28*28

true

vl_high_resolution_images为true时，max_pixels 无效

16384 Token

12845056(即16384*28*28)，超过此像素，则将图像的总像素缩小至此上限内。

false（默认）

vl_high_resolution_images为false时，可自定义，最大值是12845056

1280 Token与 max_pixels/28/28 中的最大值

1003520或max_pixels，超过此像素，则将图像的总像素缩小至此上限内。

当vl_high_resolution_images=true 时，API使用固定分辨率策略，忽略 max_pixels 设置。适合用于识别图像中的精细文本、微小物体或丰富细节。

当vl_high_resolution_images=false 时，实际分辨率由 max_pixels 与默认上限共同决定，取二者计算结果的最大值。

对处理速度要求高或成本敏感：使用 max_pixels 的默认值或设置为更小的值

需要关注一定的细节，可接受较低的处理速度：适当提高 max_pixels 的值

OpenAI 兼容DashScope
vl_high_resolution_images非 OpenAI 标准参数，若使用 OpenAI Python SDK 请通过 extra_body传入。

PythonNode.jscurl
 
import os
from openai import OpenAI

client = OpenAI(
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)


completion = client.chat.completions.create(
    model="qwen3-vl-plus",
    messages=[
        {"role": "user","content": [
            {"type": "image_url","image_url": {"url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250212/earbrt/vcg_VCG211286867973_RF.jpg"},
            # max_pixels表示输入图像的最大像素阈值，在vl_high_resolution_images=True，无效，vl_high_resolution_images=False，支持自定义，不同模型最大值不同
            # "max_pixels": 16384 * 32 * 32
            },
           {"type": "text", "text": "这张图表现的是哪个节日的氛围？"},
            ],
        }
    ],
    extra_body={"vl_high_resolution_images":True}

)
print(f"模型输出结果: {completion.choices[0].message.content}")
print(f"输入总Tokens: {completion.usage.prompt_tokens}")
更多用法
多轮对话

流式输出

使用限制
输入文件限制
图像文件限制
支持的图像格式：




图像格式

常见扩展名

MIME Type

BMP

.bmp

image/bmp

JPEG

.jpe, .jpeg, .jpg

image/jpeg

PNG

.png

image/png

TIFF

.tif, .tiff

image/tiff

WEBP

.webp

image/webp

HEIC

.heic

image/heic

图像大小：单个图像的大小不超过10 MB。如果传入 Base64编码的图像，需保证编码后的字符串小于10MB，详情请参见传入本地文件。如需压缩文件体积请参见图像或视频压缩方法。

尺寸与比例：图像的宽度和高度均需大于 10 像素，图像的宽高比（长边与短边的比值）不得超过 200。

像素总量：对图像的像素总数无严格限制，模型会自动缩放图像。

支持传入的图片数量：传入多张图像时，图片数量受模型的最大输入的限制，所有图片和文本的总 Token 数必须小于模型的最大输入。

举例说明：使用的模型为qwen3-vl-plus，思考模式下模型的最大输入为258048个Token，若传入的图像转换为2560个Token（转换规则请参见可参见计费与限流），则最大能传入258048 / 2560 = 100张。
视频文件限制
视频大小：

公网URL：

Qwen3-VL、qwen-vl-max（包含qwen-vl-max-latest、qwen-vl-max-2025-04-08之后的所有版本）：不超过 2GB；

其他Qwen2.5-VL系列及QVQ系列：不超过 1GB；

其他模型不超过 150MB。

Base64编码：经Base64编码后的视频需小于10MB；

本地文件路径：视频本身需小于100MB。

视频时长：

Qwen3-VL、qwen-vl-max、qwen-vl-max-latest、qwen-vl-max-2025-08-13及qwen-vl-max-2025-04-08：2秒至20分钟；

其他Qwen2.5-VL系列及QVQ模型：2秒至10分钟；

其他模型：2秒至40秒。

视频格式： MP4、AVI、MKV、MOV、FLV、WMV 等。

视频尺寸：无特定限制，模型处理前会被调整到约60万像素数，更大尺寸的视频文件不会有更好的理解效果。

音频理解：不支持对视频文件的音频进行理解。

文件输入方式
公网URL：提供一个公网可访问的文件地址，支持 HTTP 或 HTTPS 协议。可将本地文件图像上传至OSS或上传文件获取临时URL，获取公网 URL。

Base64编码传入：将文件转换为 Base64 编码字符串。

本地文件路径传入：直接传入本地文件的路径。

应用于生产环境
图像/视频预处理：通义千问VL 对输入的文件有大小限制，如需压缩文件请参见图像或视频压缩方法。

处理文本文件：通义千问VL仅支持处理图像格式的文件，无法直接处理文本文件。但可使用以下替代方案：

将文本文件转换为图片格式，建议使用图像处理库（如 Python 的 pdf2image）将文件按页转换为多张高质量的图片，再使用多图像输入方式传入模型。

Qwen-Long支持处理文本文件，可用于解析文件内容。

异步与批量处理：对于大规模、非实时的图像或视频处理任务，推荐使用OpenAI兼容-Batch的方式（仅支持部分模型）。此方式以异步方式处理任务，并提供50%的成本折扣。

容错与稳定性

超时处理：在非流式调用中，180秒内模型没有结束输出通常会触发超时报错。为了提升用户体验，超时后响应体中会将已生成的内容返回。如果响应头包含x-dashscope-partialresponse：true，表示本次响应触发了超时。您可以使用前缀续写功能（部分通义千问VL模型支持），将已生成的内容添加到 messages 数组并再次发出请求，使大模型继续生成内容。详情请参见：基于不完整输出进行续写。

重试机制：设计合理的API调用重试逻辑（如指数退避），以应对网络波动或服务瞬时不可用的情况。