# API设计规范

RESTful API设计标准、WebSocket事件定义和错误处理规范。

## RESTful API规范

### 通用响应格式
```javascript
// 成功响应
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-10T12:00:00.000Z"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "用户友好的错误描述",
    "details": "详细错误信息（开发环境）"
  },
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

### HTTP状态码使用规范
- `200 OK` - 成功获取资源
- `201 Created` - 成功创建资源
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未授权访问
- `403 Forbidden` - 禁止访问
- `404 Not Found` - 资源不存在
- `413 Payload Too Large` - 请求体过大
- `422 Unprocessable Entity` - 请求格式正确但语义错误
- `500 Internal Server Error` - 服务器内部错误
- `503 Service Unavailable` - 服务不可用

### 错误代码标准
```javascript
const ERROR_CODES = {
  // 文件相关错误 (FILE_xxx)
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // 验证相关错误 (VALIDATION_xxx)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_CATEGORY: 'INVALID_CATEGORY',

  // 系统相关错误 (SYSTEM_xxx)
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // 认证相关错误 (AUTH_xxx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED'
};
```

## WebSocket事件规范

### 客户端发送事件
```javascript
// 连接建立后无需额外事件，自动开始进度推送
```

### 服务端推送事件
```javascript
// 上传进度更新
socket.emit('upload-progress', {
  uploadId: 'uuid-string',
  progress: 75,                    // 0-100
  uploaded: 150000000,             // 已上传字节数
  total: 200000000,               // 总字节数
  speed: 2.5,                     // MB/s
  remainingTime: 20               // 预计剩余时间（秒）
});

// 上传完成
socket.emit('upload-complete', {
  uploadId: 'uuid-string',
  files: [
    {
      filename: 'video.mp4',
      path: 'upload/personal/video.mp4',
      size: 157286400,
      uploadTime: 45000
    }
  ]
});

// 上传错误
socket.emit('upload-error', {
  uploadId: 'uuid-string',
  error: {
    code: 'FILE_TOO_LARGE',
    message: '文件大小超过限制',
    filename: 'large_video.mp4'
  }
});
```

## API端点定义

### 文件上传端点
```
POST /api/upload
Content-Type: multipart/form-data

Request Body:
- files: File[] (1-3个文件)
- category: "personal" | "scenic"

Response:
{
  "success": true,
  "data": {
    "uploadId": "uuid-string",
    "files": [
      {
        "filename": "video.mp4",
        "originalName": "我的视频.mp4",
        "size": 157286400,
        "path": "upload/personal/uuid-video.mp4",
        "category": "personal"
      }
    ]
  }
}
```

### 文件验证端点
```
GET /api/validate/file-info?filename=video.mp4&size=157286400

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "allowedTypes": ["mp4", "avi"],
    "maxSize": 314572800,
    "maxFiles": 3
  }
}
```

### 健康检查端点
```
GET /api/health

Response:
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 3600,
    "memory": {
      "used": "150MB",
      "total": "512MB"
    },
    "checks": {
      "uploadDirectory": "ok",
      "diskSpace": "ok"
    }
  }
}
```

## 安全规范

### 请求头验证
```javascript
// 必需的请求头
const requiredHeaders = {
  'Content-Type': 'multipart/form-data',
  'X-Requested-With': 'XMLHttpRequest'
};

// CORS配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 文件安全检查
```javascript
// 文件类型白名单
const allowedMimeTypes = [
  'video/mp4',
  'video/avi',
  'video/msvideo',
  'video/x-msvideo'
];

// 文件扩展名白名单
const allowedExtensions = ['.mp4', '.avi'];

// 文件大小限制
const MAX_FILE_SIZE = 314572800; // 300MB
const MAX_FILES_PER_REQUEST = 3;
```