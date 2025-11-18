---
title: Function Calling
update: 2025-11-11
source: https://help.aliyun.com/zh/model-studio/qwen-function-calling
---

Function Calling 让模型在需要外部数据或能力时，调用工具并基于工具输出生成最终答案。

## 工作原理

1. 第一次调用：携带用户问题与可用工具列表
2. 模型返回工具调用指令（函数名与入参）或直接回答
3. 应用侧执行工具，得到结果
4. 第二次调用：把工具结果加入 `messages` 再次请求模型
5. 模型整合工具结果与上下文输出最终回复

## 快速开始（OpenAI 兼容）

```python
from openai import OpenAI
from datetime import datetime
import json
import os
import random

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

tools = [{
    "type": "function",
    "function": {
        "name": "get_current_weather",
        "description": "查询指定城市天气",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "如北京市、杭州市"}
            },
            "required": ["location"],
        },
    },
}]

def get_current_weather(arguments):
    weather_conditions = ["晴天", "多云", "雨天"]
    return f"{arguments['location']}今天是{random.choice(weather_conditions)}。"

def get_response(messages):
    return client.chat.completions.create(
        model="qwen-plus",
        messages=messages,
        tools=tools,
    )

messages = [{"role": "user", "content": "北京天气咋样"}]
response = get_response(messages)
assistant_output = response.choices[0].message
if assistant_output.content is None:
    assistant_output.content = ""
messages.append(assistant_output)

if assistant_output.tool_calls is None:
    print(f"无需调用天气查询工具：{assistant_output.content}")
else:
    while assistant_output.tool_calls is not None:
        tool_call = assistant_output.tool_calls[0]
        func_args = json.loads(tool_call.function.arguments)
        tool_result = get_current_weather(func_args)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": tool_result,
        })
        response = get_response(messages)
        assistant_output = response.choices[0].message
        if assistant_output.content is None:
            assistant_output.content = ""
        messages.append(assistant_output)
    print(f"助手最终回复：{assistant_output.content}")
```

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const tools = [{
  type: "function",
  function: {
    name: "get_current_weather",
    description: "查询指定城市天气",
    parameters: {
      type: "object",
      properties: { location: { type: "string" } },
      required: ["location"],
    },
  },
}];

const getCurrentWeather = (args) => {
  const weather = ["晴天", "多云", "雨天"][Math.floor(Math.random() * 3)];
  return `${args.location}今天是${weather}。`;
};

const getResponse = async (messages) =>
  openai.chat.completions.create({ model: "qwen-plus", messages, tools });

let messages = [{ role: "user", content: "北京天气咋样" }];
let response = await getResponse(messages);
let assistantOutput = response.choices[0].message;
if (!assistantOutput.content) assistantOutput.content = "";
messages.push(assistantOutput);

if (!assistantOutput.tool_calls) {
  console.log(`无需调用工具：${assistantOutput.content}`);
} else {
  while (assistantOutput.tool_calls) {
    const call = assistantOutput.tool_calls[0];
    const args = JSON.parse(call.function.arguments);
    const toolMessage = {
      role: "tool",
      tool_call_id: call.id,
      content: getCurrentWeather(args),
    };
    messages.push(toolMessage);
    response = await getResponse(messages);
    assistantOutput = response.choices[0].message;
    if (!assistantOutput.content) assistantOutput.content = "";
    messages.push(assistantOutput);
  }
  console.log(`助手最终回复：${assistantOutput.content}`);
}
```