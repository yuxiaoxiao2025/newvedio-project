# 图片视频等多模态内容理解-视觉理解-大模型服务平台百炼-阿里云

Source: https://help.aliyun.com/zh/model-studio/vision?mode=pure

通义千问VL模型可以根据您传入的图片或视频进行回答，支持单图或多图的输入，适用于图像描述、视觉问答、物体定位等多种任务。

在线体验：视觉模型（北京或新加坡）

## 快速开始

前提条件

- 已获取 API Key并配置API Key到环境变量。
- 如果通过 SDK 进行调用，需安装SDK，其中 DashScope Python SDK 版本不低于1.24.6，DashScope Java SDK 版本不低于 2.21.10。

以下示例演示了如何调用模型描述图像内容。关于本地文件和图像限制的说明，请参见如何传入本地文件、图像限制章节。

单图输入
多图输入

OpenAI兼容
DashScope

Python
Node.js
curl

```
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
```

### 返回结果

```
这是一张在海滩上拍摄的照片。照片中，一个人和一只狗坐在沙滩上，背景是大海和天空。人和狗似乎在互动，狗的前爪搭在人的手上。阳光从画面的右侧照射过来，给整个场景增添了一种温暖的氛围。
```

```
import OpenAI from "openai";

const openai = new OpenAI({
  // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx"
 // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
  apiKey: process.env.DASHSCOPE_API_KEY,
  // 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

async function main() {
  const response = await openai.chat.completions.create({
    model: "qwen3-vl-plus",  // 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
    messages: [
      {
        role: "user",
        content: [{
            type: "image_url",
            image_url: {
              "url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"
            }
          },
          {
            type: "text",
            text: "图中描绘的是什么景象?"
          }
        ]
      }
    ]
  });
  console.log(response.choices[0].message.content);
}
main()
```

### 返回结果

```
这是一张在海滩上拍摄的照片。照片中，一个人和一只狗坐在沙滩上，背景是大海和天空。人和狗似乎在互动，狗的前爪搭在人的手上。阳光从画面的右侧照射过来，给整个场景增添了一种温暖的氛围。
```

```
# ======= 重要提示 =======
# 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
# 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
# === 执行时请删除该注释 ===

curl --location 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' \
--header "Authorization: Bearer $DASHSCOPE_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
  "model": "qwen3-vl-plus",
  "messages": [
  {
    "role": "user",
    "content": [
      {"type": "image_url", "image_url": {"url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"}},
      {"type": "text", "text": "图中描绘的是什么景象?"}
    ]
  }]
}'
```

### 返回结果

```
{
  "choices": [
    {
      "message": {
        "content": "这是一张在海滩上拍摄的照片。照片中，一个人和一只狗坐在沙滩上，背景是大海和天空。人和狗似乎在互动，狗的前爪搭在人的手上。阳光从画面的右侧照射过来，给整个场景增添了一种温暖的氛围。",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null
    }
  ],
  "object": "chat.completion",
  "usage": {
    "prompt_tokens": 1270,
    "completion_tokens": 54,
    "total_tokens": 1324
  },
  "created": 1725948561,
  "system_fingerprint": null,
  "model": "qwen3-vl-plus",
  "id": "chatcmpl-0fd66f46-b09e-9164-a84f-3ebbbedbac15"
}
```

Python
Java
curl

```
import os
import dashscope
# 若使用新加坡地域的模型，请取消下列注释
# dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"

messages = [
{
    "role": "user",
    "content": [
    {"image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"},
    {"text": "图中描绘的是什么景象?"}]
}]
response = dashscope.MultiModalConversation.call(
    # 若没有配置环境变量， 请用百炼API Key将下行替换为： api_key ="sk-xxx"
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key = os.getenv('DASHSCOPE_API_KEY'),
    model = 'qwen3-vl-plus',  # 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
    messages = messages
)
print(response.output.choices[0].message.content[0]["text"])
```

### 返回结果

```
是一张在海滩上拍摄的照片。照片中有一位女士和一只狗。女士坐在沙滩上，微笑着与狗互动。狗戴着项圈，似乎在与女士握手。背景是大海和天空，阳光洒在她们身上，营造出温馨的氛围。
```

```
import java.util.Arrays;
import java.util.Collections;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.common.MultiModalMessage;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.exception.UploadFileException;
import com.alibaba.dashscope.utils.JsonUtils;
import com.alibaba.dashscope.utils.Constants;

public class Main {

// 若使用新加坡地域的模型，请取消下列注释
//    static {Constants.baseHttpApiUrl="https://dashscope-intl.aliyuncs.com/api/v1";}
        
    public static void simpleMultiModalConversationCall()
            throws ApiException, NoApiKeyException, UploadFileException {
        MultiModalConversation conv = new MultiModalConversation();
        MultiModalMessage userMessage = MultiModalMessage.builder().role(Role.USER.getValue())
                .content(Arrays.asList(
                        Collections.singletonMap("image", "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"),
                        Collections.singletonMap("text", "图中描绘的是什么景象?"))).build();
        MultiModalConversationParam param = MultiModalConversationParam.builder()
                 // 若没有配置环境变量，请用百炼API Key将下行替换为：.apiKey("sk-xxx")
                 // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
                .apiKey(System.getenv("DASHSCOPE_API_KEY"))
                .model("qwen3-vl-plus")  // 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
                .messages(Arrays.asList(userMessage))
                .build();
        MultiModalConversationResult result = conv.call(param);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent().get(0).get("text"));
    }
    public static void main(String[] args) {
        try {
            simpleMultiModalConversationCall();
        } catch (ApiException | NoApiKeyException | UploadFileException e) {
            System.out.println(e.getMessage());
        }
        System.exit(0);
    }
}
```

### 返回结果

```
这是一张在海滩上拍摄的照片。照片中有一个穿着格子衬衫的人和一只戴着项圈的狗。人和狗面对面坐着，似乎在互动。背景是大海和天空，阳光洒在他们身上，营造出温暖的氛围。
```

```
# ======= 重要提示 =======
# 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
# 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
# === 执行时请删除该注释 ===

curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "model": "qwen3-vl-plus",
    "input":{
        "messages":[
            {
                "role": "user",
                "content": [
                    {"image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"},
                    {"text": "图中描绘的是什么景象?"}
                ]
            }
        ]
    }
}'
```

### 返回结果

```
{
  "output": {
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "role": "assistant",
          "content": [
            {
              "text": "这是一张在海滩上拍摄的照片。照片中有一个穿着格子衬衫的人和一只戴着项圈的狗。他们坐在沙滩上，背景是大海和天空。阳光从画面的右侧照射过来，给整个场景增添了一种温暖的氛围。"
            }
          ]
        }
      }
    ]
  },
  "usage": {
    "output_tokens": 55,
    "input_tokens": 1271,
    "image_tokens": 1247
  },
  "request_id": "ccf845a3-dc33-9cda-b581-20fe7dc23f70"
}
```

通义千问VL 模型支持在单次请求中传入多张图片，可用于商品对比、多页文档处理等任务。实现时只需在user message 的content数组中包含多个图片对象即可。

重要
图片数量受模型图文总 Token 上限（即模型的最大输入）的限制，所有图片和文本的总 Token 数必须小于模型的最大输入。

OpenAI兼容
DashScope

Python
Node.js
curl

```
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
```

### 返回结果

```
图1中是一位女士和一只拉布拉多犬在海滩上互动的场景。女士穿着格子衬衫，坐在沙滩上，与狗进行握手的动作，背景是海浪和天空，整个画面充满了温馨和愉快的氛围。

图2中是一只老虎在森林中行走的场景。老虎的毛色是橙色和黑色条纹相间，它正向前迈步，周围是茂密的树木和植被，地面上覆盖着落叶，整个画面给人一种野生自然的感觉。
```

```
import OpenAI from "openai";

const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx"
        // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
        apiKey: process.env.DASHSCOPE_API_KEY,
        // 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);

async function main() {
    const response = await openai.chat.completions.create({
        model: "qwen3-vl-plus",  // 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
        messages: [
          {role: "user",content: [
            {type: "image_url",image_url: {"url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"}},
            {type: "image_url",image_url: {"url": "https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png"}},
            {type: "text", text: "这些图描绘了什么内容？" },
        ]}]
    });
    console.log(response.choices[0].message.content);
}

main()
```

### 返回结果

```
第一张图片中，一个人和一只狗在海滩上互动。人穿着格子衬衫，狗戴着项圈，他们似乎在握手或击掌。

第二张图片中，一只老虎在森林中行走。老虎的毛色是橙色和黑色条纹，背景是绿色的树木和植被。
```

```
# ======= 重要提示 =======
# 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
# 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
# === 执行时请删除该注释 ===

curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "qwen3-vl-plus",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"
          }
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png"
          }
        },
        {
          "type": "text",
          "text": "这些图描绘了什么内容？"
        }
      ]
    }
  ]
}'
```

### 返回结果

```
{
  "choices": [
    {
      "message": {
        "content": "图1中是一位女士和一只拉布拉多犬在海滩上互动的场景。女士穿着格子衬衫，坐在沙滩上，与狗进行握手的动作，背景是海景和日落的天空，整个画面显得非常温馨和谐。\n\n图2中是一只老虎在森林中行走的场景。老虎的毛色是橙色和黑色条纹相间，它正向前迈步，周围是茂密的树木和植被，地面上覆盖着落叶，整个画面充满了自然的野性和生机。",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null
    }
  ],
  "object": "chat.completion",
  "usage": {
    "prompt_tokens": 2497,
    "completion_tokens": 109,
    "total_tokens": 2606
  },
  "created": 1725948561,
  "system_fingerprint": null,
  "model": "qwen3-vl-plus",
  "id": "chatcmpl-0fd66f46-b09e-9164-a84f-3ebbbedbac15"
}
```

Python
Java
curl

```
import os
import dashscope

# 若使用新加坡地域的模型，请取消下列注释
# dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"

messages = [
    {
        "role": "user",
        "content": [
            {"image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"},
            {"image": "https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png"},
            {"text": "这些图描绘了什么内容?"}
        ]
    }
]

response = dashscope.MultiModalConversation.call(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    api_key = os.getenv('DASHSCOPE_API_KEY'),
    model = 'qwen3-vl-plus',
    messages = messages
)

print(response.output.choices[0].message.content[0]["text"])
```

### 返回结果

```
图1中是一位女士和一只拉布拉多犬在海滩上的互动场景。女士穿着格子衬衫，坐在沙滩上，与狗进行握手的动作，背景是海景和天空，画面温馨和谐。

图2中是一只老虎在森林中行走的场景。老虎橙色和黑色条纹相间，周围是茂密的树木和植被，地面覆盖着落叶，显得自然和富有生机。
```

### 视频理解

分析视频内容，如对具体事件进行定位并获取时间戳，或生成关键时间段的摘要。

| 请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event），请使用HH:mm:ss表示 时间戳。 | { "events": [ { "start_time": "00:00:00", "end_time": "00:00:05", "event": "人物手持一个纸箱走向桌子，并将纸箱放在桌上。" }, { "start_time": "00:00:05", "end_time": "00:00:15", "event": "人物拿起扫描枪，对准纸箱上的标签进行扫描。" }, { "start_time": "00:00:15", "end_time": "00:00:21", "event": "人物将扫描枪放回原位，然后拿起笔在笔记本上记录信息。"}]} |
| --- | --- |