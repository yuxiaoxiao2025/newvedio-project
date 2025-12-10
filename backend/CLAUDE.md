# Backend Development Guide

后端API开发规范，处理后端任务时请仔细阅读本指南。

## Tech Stack Details
- **Runtime**: Node.js 16+ (LTS)
- **Framework**: Express.js 4.18+
- **Package Manager**: cnpm (required)
- **File Upload**: Multer 1.4+
- **WebSocket**: Socket.IO 4.8+
- **Logging**: Winston 3.10+

## Project Structure
```
backend/
├── src/
│   ├── app.js              # Express应用入口
│   ├── controllers/        # 请求处理逻辑
│   ├── middleware/         # 中间件（验证、错误处理）
│   ├── routes/            # API路由定义
│   ├── services/          # 业务逻辑层
│   └── utils/             # 工具函数
├── upload/                # 文件存储
│   ├── personal/         # 个人视频
│   └── scenic/           # 景区视频
├── logs/                  # 日志文件
├── .env                   # 环境变量
└── package.json
```

## Core Requirements
- Port: 8005 (fixed)
- File validation: mp4/avi, max 300MB, max 3 files
- Categories: 个人视频(personal), 景区视频(scenic)
- Real-time progress via WebSocket

## API Development Standards

### File Upload Endpoint
```javascript
// Reference: src/routes/upload.js
POST /api/upload
Content-Type: multipart/form-data

Request Body:
- files: File[] (max 3 files)
- category: "personal" | "scenic"
```

### Response Format
```javascript
// Success Response
{
  success: true,
  data: {
    uploadedFiles: [
      { filename: "video.mp4", path: "upload/personal/video.mp4", size: 157286400 }
    ],
    category: "personal"
  }
}

// Error Response
{
  success: false,
  error: {
    code: "INVALID_FILE_TYPE",
    message: "只支持mp4和avi格式"
  }
}
```

### WebSocket Events
- `upload-progress`: 上传进度更新
- `upload-complete`: 上传完成
- `upload-error`: 上传错误

## Environment Variables Required
```env
PORT=8005
NODE_ENV=development
UPLOAD_DIR=./upload
MAX_FILE_SIZE=314572800
ALLOWED_FILE_TYPES=mp4,avi
CORS_ORIGIN=http://localhost:3005
JWT_SECRET=your-jwt-secret
```

## Common Development Tasks
```bash
# Install dependencies
cnpm install

# Start development server
npm start          # or npm run dev with nodemon

# Run tests
npm test
npm run test:coverage

# Check logs
tail -f logs/upload.log
tail -f logs/error.log
```

## Error Handling Patterns
- Use consistent error codes (see agent_docs/api_conventions.md)
- Log errors with context information
- Return user-friendly error messages
- Implement proper HTTP status codes

## Testing Guidelines
- Unit tests for controllers and services
- Integration tests for API endpoints
- File upload tests with actual video files
- WebSocket connection tests

## File Storage Strategy
- Organize by category (personal/scenic)
- Use UUID filenames to avoid conflicts
- Implement cleanup for failed uploads
- Monitor disk usage

## Security Considerations
- File type validation (MIME + extension)
- File size limits
- Rate limiting on upload endpoints
- CORS configuration for frontend domain

## Performance Optimization
- Stream large file uploads
- Implement concurrent upload limits
- Use compression for responses
- Monitor memory usage during uploads

## Additional Documentation
For detailed information, consult:
- `../agent_docs/api_conventions.md` - API design standards
- `../agent_docs/file_operations.md` - File upload details
- `../agent_docs/debugging_guide.md` - Debugging methods
- `../agent_docs/deployment_guide.md` - Deployment configuration