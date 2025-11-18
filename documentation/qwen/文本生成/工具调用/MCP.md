---
title: MCP
update: 2025-10-15
source: https://help.aliyun.com/zh/model-studio/mcp
---

MCP（Model Context Protocol）帮助模型使用外部工具与数据，较 Function Calling 更灵活易用。示例以 Qwen-Agent 框架接入 MCP 服务。

## 代码调用（Qwen-Agent）

```python
import os
from qwen_agent.agents import Assistant

llm_cfg = {
    "model": "qwen-plus-latest",
    "model_server": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "api_key": os.getenv("DASHSCOPE_API_KEY"),
}

system = "你是会天气查询、地图查询、网页部署的助手"

tools = [{
    "mcpServers": {
        "amap-maps": {"type": "sse", "url": "https://mcp.api-inference.modelscope.net/xxx/sse"},
        "edgeone-pages-mcp": {"type": "sse", "url": "https://mcp.api-inference.modelscope.net/xxx/sse"},
    }
}]

bot = Assistant(
    llm=llm_cfg,
    name="助手",
    description="高德地图、天气查询、公网链接部署",
    system_message=system,
    function_list=tools,
)

messages = []
query = "我爸妈今天下午到萧山机场，请规划公共交通到阿里巴巴云谷园区并部署为公网链接"
messages.append({"role": "user", "content": query})
for response_chunk in bot.run(messages):
    new_response = response_chunk[-1]
    print(new_response)
```

## 可视化界面（WebUI）

```python
import os
from qwen_agent.agents import Assistant
from qwen_agent.gui import WebUI

llm_cfg = {
    "model": "qwen-plus-latest",
    "model_server": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "api_key": os.getenv("DASHSCOPE_API_KEY"),
}

system = "你是会天气查询、地图查询、网页部署的助手"
tools = [{
    "mcpServers": {
        "amap-maps": {"type": "sse", "url": "https://mcp.api-inference.modelscope.net/xxx/sse"},
        "edgeone-pages-mcp": {"type": "sse", "url": "https://mcp.api-inference.modelscope.net/xxx/sse"},
    }
}]

bot = Assistant(
    llm=llm_cfg,
    name="助手",
    description="高德地图、天气查询、公网链接部署",
    system_message=system,
    function_list=tools,
)
WebUI(bot).run()
```