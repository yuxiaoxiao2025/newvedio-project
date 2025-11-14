# 视频文件上传 API 文档

## 概述

视频文件上传API支持最多3个同类型视频文件(mp4/avi)的批量上传，具备文件分类存储(个人视频/景区视频)、实时进度跟踪和错误处理功能。

**服务器地址**: `http://localhost:8005`
**API版本**: v1.0.0

## 认证

当前版本不需要认证(简化实现)，生产环境将支持JWT认证。

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "timestamp": "2025-11-14T13:54:11.000Z"
}
```

### 错误响应
```json
{
  "error": "ERROR_CODE",
  "message": "错误描述",
  "timestamp": "2025-11-14T13:54:11.000Z"
}
```

## API 端点

### 1. 健康检查

**GET** `/health`

检查服务器状态。

**响应示例**:
```json
{
  "status": "OK",
  "timestamp": "2025-11-14T13:54:11.000Z",
  "uptime": 123.45,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  }
}
```

---

### 2. 文件验证

**POST** `/api/upload/validate`

在实际上传之前验证文件的格式、大小和数量。

**请求体**:
```json
{
  "files": [
    {
      "name": "video.mp4",
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
      "valid": true,
      "errors": []
    }
  ],
  "timestamp": "2025-11-14T13:54:11.000Z"
}
```

**错误代码**:
- `VALIDATION_ERROR`: 文件验证失败
- `INVALID_FILE_FORMAT`: 不支持的文件格式
- `FILE_TOO_LARGE`: 文件过大

---

### 3. 创建上传会话

**POST** `/api/upload/session`

创建新的批量上传会话，返回会话ID。

**请求体**:
```json
{
  "category": "personal",
  "expectedFiles": 2
}
```

**参数说明**:
- `category`: 文件分类 (`personal` | `scenic`)
- `expectedFiles`: 预期上传的文件数量 (1-3)

**响应示例**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "personal",
  "uploadPath": "/backend/upload/personal/",
  "maxFiles": 3,
  "allowedTypes": ["mp4", "avi"],
  "maxFileSize": 314572800,
  "createdAt": "2025-11-14T13:54:11.000Z"
}
```

---

### 4. 批量文件上传

**POST** `/api/upload/batch`

上传多个文件到指定分类目录。

**请求类型**: `multipart/form-data`

**请求参数**:
- `files`: 上传的文件(最多3个)
- `sessionId`: 上传会话ID
- `category`: 文件分类 (`personal` | `scenic`)

**响应示例**:
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "originalName": "我的视频.mp4",
      "fileName": "550e8400-e29b-41d4-a716-446655440001_2025-11-14T13-54-11_我的视频.mp4",
      "filePath": "/backend/upload/personal/550e8400-e29b-41d4-a716-446655440001_2025-11-14T13-54-11_我的视频.mp4",
      "fileSize": 104857600,
      "fileType": "mp4",
      "status": "completed",
      "progress": 100
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

**错误代码**:
- `UPLOAD_FAILED`: 上传失败
- `NO_FILES`: 未选择文件
- `TOO_MANY_FILES`: 文件数量过多
- `MISSING_PARAMETERS`: 缺少必要参数

---

### 5. 获取上传进度

**GET** `/api/upload/progress/{sessionId}`

获取指定会话中所有文件的上传进度。

**路径参数**:
- `sessionId`: 上传会话ID

**响应示例**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "overallStatus": "uploading",
  "totalProgress": 75,
  "completedFiles": 1,
  "failedFiles": 0,
  "estimatedTimeRemaining": 30,
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "originalName": "我的视频.mp4",
      "status": "completed",
      "progress": 100
    }
  ],
  "lastUpdate": "2025-11-14T13:54:11.000Z"
}
```

**错误代码**:
- `SESSION_NOT_FOUND`: 会话不存在
- `PROGRESS_QUERY_FAILED`: 查询进度失败

---

### 6. 取消上传

**POST** `/api/upload/cancel/{sessionId}`

取消指定会话中所有未完成的上传。

**路径参数**:
- `sessionId`: 上传会话ID

**响应示例**:
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "cancelledFiles": ["550e8400-e29b-41d4-a716-446655440001"],
  "message": "成功取消1个文件的上传"
}
```

---

### 7. 删除文件 (管理员功能)

**DELETE** `/api/upload/file/{fileId}`

删除已上传的文件。

**路径参数**:
- `fileId`: 文件ID

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 文件限制

- **支持格式**: MP4, AVI
- **最大文件大小**: 300MB (314,572,800 bytes)
- **最大文件数量**: 每个会话最多3个文件
- **批次要求**: 同批次文件必须是相同格式

## 文件存储路径

### 个人视频
```
/backend/upload/personal/{sessionId}_{timestamp}_{originalName}
```

### 景区视频
```
/backend/upload/scenic/{sessionId}_{timestamp}_{originalName}
```

## 错误代码参考

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| `VALIDATION_ERROR` | 400 | 文件验证失败 |
| `INVALID_FILE_FORMAT` | 400 | 不支持的文件格式 |
| `FILE_TOO_LARGE` | 413 | 文件过大 |
| `TOO_MANY_FILES` | 400 | 文件数量过多 |
| `NO_FILES` | 400 | 未选择文件 |
| `UPLOAD_FAILED` | 500 | 上传失败 |
| `SESSION_NOT_FOUND` | 404 | 会话不存在 |
| `CANCELLATION_FAILED` | 500 | 取消上传失败 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

## 使用示例

### 完整上传流程

```javascript
// 1. 验证文件
const validationResponse = await fetch('/api/upload/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [{ name: 'video.mp4', size: 104857600, type: 'video/mp4' }]
  })
});

// 2. 创建会话
const sessionResponse = await fetch('/api/upload/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ category: 'personal', expectedFiles: 1 })
});
const { sessionId } = await sessionResponse.json();

// 3. 上传文件
const formData = new FormData();
formData.append('files', fileInput.files[0]);
formData.append('sessionId', sessionId);
formData.append('category', 'personal');

const uploadResponse = await fetch('/api/upload/batch', {
  method: 'POST',
  body: formData
});
```

## 测试

使用以下curl命令测试API：

```bash
# 健康检查
curl http://localhost:8005/health

# 文件验证
curl -X POST http://localhost:8005/api/upload/validate \
  -H "Content-Type: application/json" \
  -d '{"files":[{"name":"test.mp4","size":104857600,"type":"video/mp4"}]}'

# 创建会话
curl -X POST http://localhost:8005/api/upload/session \
  -H "Content-Type: application/json" \
  -d '{"category":"personal","expectedFiles":1}'
```