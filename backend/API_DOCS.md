# 视频文件上传 API 文档

**版本**: 1.0.0
**更新日期**: 2025-11-14
**端口**: 8005
**CORS**: http://localhost:3005

## 概述

响应式H5文件上传页面的后端API接口，支持视频文件(mp4/avi)的批量上传、验证、分类存储和进度跟踪。

### 核心特性

- ✅ 支持最多3个同类型视频文件上传
- ✅ 文件格式验证：mp4/avi (最大300MB)
- ✅ 文件分类存储：个人视频/景区视频
- ✅ 实时上传进度跟踪
- ✅ WebSocket实时通信
- ✅ 完整的错误处理机制
- ✅ 请求限流和安全防护

## 基础信息

- **Base URL**: `http://localhost:8005`
- **API Prefix**: `/api/upload`
- **WebSocket**: Socket.io 连接

## API 端点

### 1. 健康检查

```http
GET /health
```

**响应示例**:
```json
{
  "status": "OK",
  "timestamp": "2025-11-14T14:04:33.889Z",
  "uptime": 123.456,
  "memory": {
    "rss": 67108864,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  }
}
```

---

### 2. 文件验证

在实际上传之前验证文件的格式、大小和数量。

```http
POST /api/upload/validate
Content-Type: application/json
```

**请求体**:
```json
{
  "files": [
    {
      "name": "sample_video.mp4",
      "size": 104857600,
      "type": "video/mp4"
    }
  ]
}
```

**响应示例**:
```json
{
  "valid": true,
  "files": [
    {
      "index": 0,
      "filename": "sample_video.mp4",
      "valid": true,
      "errors": []
    }
  ],
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  },
  "timestamp": "2025-11-14T14:04:33.889Z"
}
```

**错误响应**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "文件验证失败",
  "details": ["文件数量不能超过3个"],
  "timestamp": "2025-11-14T14:04:33.889Z"
}
```

---

### 3. 创建上传会话

创建新的批量上传会话，返回会话ID用于后续操作。

```http
POST /api/upload/session
Content-Type: application/json
```

**请求体**:
```json
{
  "category": "personal",
  "expectedFiles": 2
}
```

**响应示例**:
```json
{
  "sessionId": "0a77bff2-52bc-4941-9b1f-b41ef8a37c53",
  "category": "personal",
  "uploadPath": "/backend/upload/personal/",
  "maxFiles": 3,
  "allowedTypes": ["mp4", "avi"],
  "maxFileSize": 314572800,
  "createdAt": "2025-11-14T14:04:33.889Z"
}
```

**参数说明**:
- `category`: 文件分类，可选值：`personal` | `scenic`
- `expectedFiles`: 预期文件数量，范围：1-3

---

### 4. 批量文件上传

上传多个文件到指定分类目录。

```http
POST /api/upload/batch
Content-Type: multipart/form-data
```

**请求体**:
```
files: [File File File]
sessionId: "0a77bff2-52bc-4941-9b1f-b41ef8a37c53"
category: "personal"
```

**响应示例**:
```json
{
  "success": true,
  "sessionId": "0a77bff2-52bc-4941-9b1f-b41ef8a37c53",
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "originalName": "我的视频.mp4",
      "fileName": "0a77bff2_2025-11-14T14-04-33-889Z_我的视频.mp4",
      "filePath": "/backend/upload/personal/0a77bff2_2025-11-14T14-04-33-889Z_我的视频.mp4",
      "fileSize": 104857600,
      "fileType": "mp4",
      "status": "completed",
      "progress": 100,
      "uploadSpeed": 2097152
    }
  ],
  "summary": {
    "totalFiles": 1,
    "completedFiles": 1,
    "failedFiles": 0,
    "totalSize": 104857600
  }
}
```

---

### 5. 获取上传进度

获取指定会话中所有文件的上传进度。

```http
GET /api/upload/progress/:sessionId
```

**响应示例**:
```json
{
  "sessionId": "0a77bff2-52bc-4941-9b1f-b41ef8a37c53",
  "overallStatus": "uploading",
  "totalProgress": 75,
  "completedFiles": 1,
  "failedFiles": 0,
  "estimatedTimeRemaining": 30,
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "originalName": "我的视频.mp4",
      "status": "uploading",
      "progress": 75,
      "uploadSpeed": 2097152
    }
  ],
  "lastUpdate": "2025-11-14T14:04:33.889Z"
}
```

---

### 6. 取消上传

取消指定会话中所有未完成的上传。

```http
POST /api/upload/cancel/:sessionId
```

**响应示例**:
```json
{
  "success": true,
  "sessionId": "0a77bff2-52bc-4941-9b1f-b41ef8a37c53",
  "cancelledFiles": ["550e8400-e29b-41d4-a716-446655440001"],
  "message": "成功取消1个文件的上传"
}
```

---

### 7. 删除文件

删除已上传的文件（管理员功能）。

```http
DELETE /api/upload/file/:fileId
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## WebSocket 事件

### 连接配置

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:8005', {
  query: { sessionId: 'your-session-id' }
});
```

### 事件列表

#### 1. 加入会话

```javascript
socket.emit('join-session', sessionId);
```

#### 2. 离开会话

```javascript
socket.emit('leave-session', sessionId);
```

#### 3. 监听进度更新

```javascript
socket.on('upload-progress', (data) => {
  console.log('Progress update:', data);
  // data: { fileId, progress, speed, status }
});
```

#### 4. 监听上传完成

```javascript
socket.on('upload-completed', (data) => {
  console.log('Upload completed:', data);
  // data: { sessionId, files, summary }
});
```

#### 5. 监听上传错误

```javascript
socket.on('upload-error', (data) => {
  console.log('Upload error:', data);
  // data: { fileId, error, message }
});
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 | 解决方案 |
|---------|-----------|------|---------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 | 检查请求参数格式 |
| `NO_FILES` | 400 | 没有选择文件 | 请选择要上传的文件 |
| `TOO_MANY_FILES` | 400 | 文件数量超过限制 | 最多只能上传3个文件 |
| `INVALID_FILE_FORMAT` | 400 | 不支持的文件格式 | 只支持mp4/avi格式 |
| `FILE_TOO_LARGE` | 413 | 文件大小超限 | 单个文件最大300MB |
| `SESSION_NOT_FOUND` | 404 | 会话不存在 | 检查会话ID是否正确 |
| `SESSION_EXPIRED` | 410 | 会话已过期 | 重新创建会话 |
| `STORAGE_FULL` | 507 | 存储空间不足 | 联系管理员 |
| `TOO_MANY_REQUESTS` | 429 | 请求过于频繁 | 稍后重试 |

## 配置说明

### 服务器配置

- **端口**: 8005 (可通过环境变量 `PORT` 修改)
- **文件大小限制**: 300MB (可通过环境变量 `MAX_FILE_SIZE` 修改)
- **文件数量限制**: 3个 (可通过环境变量 `MAX_FILES_PER_SESSION` 修改)
- **请求大小限制**: 500MB
- **会话超时**: 24小时

### 存储配置

- **个人视频目录**: `/backend/upload/personal/`
- **景区视频目录**: `/backend/upload/scenic/`
- **临时文件目录**: 自动清理，1小时后删除

### 安全配置

- **CORS源**: `http://localhost:3005`
- **请求限流**: 15分钟内最多100次请求
- **文件验证**: 扩展名 + MIME类型 + 文件签名验证

## 使用示例

### 完整上传流程

```javascript
// 1. 创建会话
const sessionResponse = await fetch('http://localhost:8005/api/upload/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ category: 'personal', expectedFiles: 2 })
});
const { sessionId } = await sessionResponse.json();

// 2. 建立WebSocket连接
const socket = io('http://localhost:8005');
socket.emit('join-session', sessionId);

// 3. 监听进度
socket.on('upload-progress', (data) => {
  console.log(`文件上传进度: ${data.progress}%`);
});

// 4. 上传文件
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('sessionId', sessionId);
formData.append('category', 'personal');

const uploadResponse = await fetch('http://localhost:8005/api/upload/batch', {
  method: 'POST',
  body: formData
});

// 5. 获取结果
const result = await uploadResponse.json();
console.log('上传完成:', result);
```

## 测试

### 使用 curl 测试

```bash
# 健康检查
curl http://localhost:8005/health

# 文件验证
curl -X POST http://localhost:8005/api/upload/validate \
  -H "Content-Type: application/json" \
  -d '{"files":[{"name":"test.mp4","size":1024,"type":"video/mp4"}]}'

# 创建会话
curl -X POST http://localhost:8005/api/upload/session \
  -H "Content-Type: application/json" \
  -d '{"category":"personal","expectedFiles":1}'
```

## 部署说明

### 环境变量

```bash
PORT=8005
NODE_ENV=production
MAX_FILE_SIZE=314572800
MAX_FILES_PER_SESSION=3
UPLOAD_BASE_DIR=./upload
CORS_ORIGIN=http://localhost:3005
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 更新日志

### v1.0.0 (2025-11-14)
- ✨ 初始版本发布
- ✨ 基础文件上传功能
- ✨ WebSocket实时进度跟踪
- ✨ 文件验证和分类存储
- ✨ 完整的错误处理机制
- ✨ 请求限流和安全防护