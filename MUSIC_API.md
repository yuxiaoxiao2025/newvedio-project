# Mureka 纯音乐生成 API 文档

> 文档范围：专注纯音乐生成相关接口（生成与查询）  
> 基础地址：`https://api.mureka.cn`  
> 认证方式：`Authorization: Bearer <API_KEY>`  
> 版本：纯音乐 API 独立说明

---

## 概述

Mureka 纯音乐生成 API 支持基于文本提示或参考纯音乐的生成模式，提供流式生成（边生成边收听）与批量生成（通过 `n` 参数控制单次生成数量）。生成完成后可通过查询接口获取最终音频 URL 与任务状态。

- 生成模式：
  - `prompt` 文本提示生成（最大 1024 字符）
  - `instrumental_id` 参考纯音乐生成（通过 `files/upload` 上传，`purpose: instrumental`）
- 互斥规则：`prompt` 与 `instrumental_id` 二选一，不能同时使用。
- 批量生成：`n` 最大为 3，默认 2（将按照数量计费）。
- 流式输出：`stream=true` 时任务状态会进入 `streaming` 阶段，可获取 `stream_url` 实时播放。

---

## 认证

所有请求需使用 Bearer Token：

```
Authorization: Bearer MUREKA_API_KEY
```

请勿在浏览器或客户端应用暴露密钥，建议由服务端保管并代发请求。

---

## 端点

### 1) 生成纯音乐

- 方法：`POST`
- 路径：`/v1/instrumental/generate`
- 描述：根据用户输入生成纯音乐。

#### 请求参数（JSON）

- `model`：要使用的模型；`auto` 选择常规模型最新版。
- `n`：每次请求生成的纯音乐数量，最大值为 `3`，默认 `2`。
- `prompt`：文本提示词（最大 1024 字符）。与 `instrumental_id` 互斥。
- `instrumental_id`：参考纯音乐文件 ID（由 `files/upload` 生成，`purpose: instrumental`）。与 `prompt` 互斥。
- `stream`：布尔值，`true` 时可在 `streaming` 阶段通过 `stream_url` 边生成边收听。

互斥与选择建议：
- 仅文本创作：使用 `prompt`；
- 风格参考创作：使用 `instrumental_id`；
- 若需实时预听：开启 `stream=true`。

#### 成功响应（概要）

- `id`：任务 ID（字符串）
- `created_at`：任务创建时间戳（秒）
- `completed_at`：任务完成时间戳（秒，完成后存在）
- `model`：用于生成的模型名
- `status`：任务状态（例如 `preparing` / `streaming` / `succeeded` / `failed`）
- `reason`：失败原因（当 `status=failed` 时存在）
- `watermark_added`：布尔值，尾部是否添加 5s 水印音频
- `instrumentals`：生成的纯音乐列表（仅 `succeeded` 时存在）
- （在 `stream=true` 且任务进入 `streaming` 阶段时，可返回 `stream_url` 用于播放）

#### 示例（文本提示生成）

```
curl https://api.mureka.cn/v1/instrumental/generate \
  -H "Authorization: Bearer $MUREKA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "prompt": "cinematic, ambient, calm",
    "n": 2,
    "stream": true
  }'
```

#### 示例（参考纯音乐生成）

```
# 先上传参考纯音乐文件（purpose: instrumental）
curl https://api.mureka.cn/v1/files/upload \
  -H "Authorization: Bearer $MUREKA_API_KEY" \
  -F purpose="instrumental" \
  -F file="@reference.mp3"

# 用返回的文件 ID 进行生成
curl https://api.mureka.cn/v1/instrumental/generate \
  -H "Authorization: Bearer $MUREKA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "instrumental_id": "<FILE_ID>",
    "n": 1
  }'
```

---

### 2) 查询纯音乐任务

- 方法：`GET`
- 路径：`/v1/instrumental/query/{task_id}`
- 描述：查询纯音乐生成任务的信息与结果。

#### 路径参数

- `task_id`：纯音乐生成任务的 ID。

#### 成功响应（概要）

- `id`、`created_at`、`completed_at`、`model`、`status`、`reason`、`watermark_added`、`instrumentals`（同生成接口响应结构）。

#### 示例

```
curl https://api.mureka.cn/v1/instrumental/query/435134 \
  -H "Authorization: Bearer $MUREKA_API_KEY"
```

---

## 错误代码

| 代码 | 概述 |
| --- | --- |
| 400 - Invalid Request | 请求参数错误；检查必填项与互斥规则。 |
| 401 - Invalid Authentication | 认证失败；确认 Bearer Token。 |
| 403 - Forbidden | 不支持的访问地区；确保来自支持地区。 |
| 429 - Rate limit reached for requests | 请求速率过快；降低速率与并发。 |
| 429 - You exceeded your current quota, please check your billing details | 余额不足或额度用尽；请充值。 |
| 451 - Unavailable For Legal Reasons | 参数未通过安审；修改请求内容。 |
| 500 - The server had an error while processing your request | 服务内部错误；稍后重试或联系支持。 |
| 503 - The engine is currently overloaded, please try again later | 服务过载；稍后重试。 |

参考：错误代码官方页 https://platform.mureka.cn/docs/cn/error-codes.html

---

## 使用与集成建议

- 服务端保管 API Key，避免泄露；客户端通过后端转发请求。
- 记录 `trace_id`，便于生产排障与与支持团队沟通。
- 批量生成（`n`）会影响计费与并发占用；建议按业务场景控制。
- 需要边生成边预览时开启 `stream=true` 并处理 `streaming` 状态。
- 上传参考纯音乐文件时遵循尺寸与格式要求（`mp3` / `m4a`）。

---

## 相关链接

- 平台文档导航：https://platform.mureka.cn/docs/
- 更新日志（含 `n` 参数新增）：https://platform.mureka.cn/docs/cn/changelog.html
- 常见问题（并发与价格）：https://platform.mureka.cn/docs/cn/faq.html