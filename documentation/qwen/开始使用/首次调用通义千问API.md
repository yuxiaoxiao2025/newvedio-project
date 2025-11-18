---
title: 首次调用通义千问API
update: 2025-11-18
source: https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen
---

阿里云百炼支持通过API调用通义千问模型，兼容OpenAI接口与DashScope SDK。

## 账号设置

1. 注册阿里云账号并完成实名认证。
2. 开通阿里云百炼（北京或新加坡地域）。
3. 在密钥管理页面创建 API Key（推荐主账号空间）。

## 配置 API Key 到环境变量

避免在代码中直接写入密钥，建议配置到环境变量。

### Linux/macOS（临时）

```javascript
export DASHSCOPE_API_KEY="YOUR_DASHSCOPE_API_KEY"
```

### Linux/macOS（持久）

```javascript
echo "export DASHSCOPE_API_KEY='YOUR_DASHSCOPE_API_KEY'" >> ~/.bashrc
source ~/.bashrc
```

或 Zsh：

```javascript
echo "export DASHSCOPE_API_KEY='YOUR_DASHSCOPE_API_KEY'" >> ~/.zshrc
source ~/.zshrc
```

### Windows CMD（临时）

```javascript
set DASHSCOPE_API_KEY=YOUR_DASHSCOPE_API_KEY
```

### Windows PowerShell（临时）

```javascript
$env:DASHSCOPE_API_KEY = "YOUR_DASHSCOPE_API_KEY"
```

### Windows（持久）

通过系统属性添加用户环境变量 `DASHSCOPE_API_KEY`，或：

```javascript
setx DASHSCOPE_API_KEY "YOUR_DASHSCOPE_API_KEY"
```

## 选择开发语言

以下示例覆盖 Python 与 Node.js 两种调用方式。更多模型请参见[模型列表](模型列表.md)，价格参见[模型价格](模型价格.md)，限流规则参见[限流](限流.md)。

### Python 环境与SDK安装

确保 Python 3.8+ 与 `pip` 可用：

```javascript
python -V
pip --version
```

创建并激活虚拟环境（可选）：

```javascript
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
```

安装 SDK：

```javascript
pip install -U openai
pip install -U dashscope
```

### 使用 OpenAI Python SDK 调用通义千问

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen-plus",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "你是谁？"}
    ]
)
print(completion.choices[0].message.content)
```

### 使用 Node.js SDK 调用通义千问

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "你是谁？" },
    ],
  });
  console.log(completion.choices[0].message.content);
}

main();
```

### REST 调用（参考）

```javascript
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "model": "qwen-plus",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "你是谁？"}
  ]
}'
```

## 常见错误定位

如遇认证或限流问题，请检查：

- 是否正确设置 `DASHSCOPE_API_KEY` 环境变量
- 地域 `base_url` 是否匹配（北京与新加坡不同）
- 模型名称是否存在于当前地域的可用列表