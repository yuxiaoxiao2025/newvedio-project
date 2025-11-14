# 快速开始指南

**版本**: 1.0.0
**更新日期**: 2025-11-14
**功能**: 响应式H5文件上传页面

## 项目概述

这是一个基于Vue.js 3和Node.js的响应式H5文件上传应用，支持最多3个同类型视频文件(mp4/avi)的批量上传，具备文件分类、实时进度、错误处理等功能。

### 核心特性

- ✅ **移动端优先**: 响应式设计，完美适配各种移动设备
- ✅ **批量上传**: 支持最多3个同类型视频文件
- ✅ **文件分类**: 个人视频和景区视频分类存储
- ✅ **实时进度**: WebSocket实时进度更新
- ✅ **智能验证**: 文件格式、大小、数量自动验证
- ✅ **错误处理**: 完善的错误提示和恢复机制
- ✅ **性能优化**: 分片上传，断点续传支持

## 技术栈

### 前端
- **框架**: Vue.js 3 + Composition API
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **文件上传**: vue-simple-uploader
- **测试**: Vitest + Testing Library

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **文件处理**: Multer
- **实时通信**: Socket.io
- **测试**: Jest

## 环境要求

- Node.js 18.0+
- npm 8.0+ 或 yarn 1.22+
- 现代浏览器支持 (iOS 10.3+, Android Chrome 64+)

## 项目结构

```
video-upload-h5/
├── backend/                 # 后端API服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   └── utils/           # 工具函数
│   ├── upload/              # 文件存储目录
│   └── tests/               # 后端测试
├── frontend/                # 前端H5页面
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   ├── composables/     # Composition API
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式文件
│   └── tests/               # 前端测试
├── shared/                  # 共享类型和常量
└── docs/                    # 项目文档
```

## 安装和运行

### 1. 克隆项目

```bash
git clone <repository-url>
cd video-upload-h5
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 环境配置

#### 后端环境配置

创建 `backend/.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=314572800        # 300MB
MAX_FILES_PER_SESSION=3
UPLOAD_BASE_DIR=./upload

# 安全配置
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=60000        # 1分钟
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs
```

#### 前端环境配置

创建 `frontend/.env` 文件：

```env
# API配置
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000

# 功能配置
VITE_MAX_FILE_SIZE=314572800
VITE_MAX_FILES=3
VITE_SUPPORTED_FORMATS=mp4,avi

# 开发配置
VITE_ENABLE_MOCK=false
VITE_DEBUG_MODE=true
```

### 4. 启动服务

#### 开发模式

```bash
# 启动后端服务 (终端1)
cd backend
npm run dev

# 启动前端服务 (终端2)
cd frontend
npm run dev
```

#### 生产模式

```bash
# 构建前端
cd frontend
npm run build

# 启动后端
cd backend
npm run prod
```

### 5. 访问应用

- 前端页面: http://localhost:5173
- 后端API: http://localhost:3000
- API文档: http://localhost:3000/api-docs

## 核心功能使用

### 文件上传流程

1. **选择文件**
   ```javascript
   // 前端调用示例
   const files = event.target.files;
   if (files.length > 0 && files.length <= 3) {
     await validateAndSelectFiles(files);
   }
   ```

2. **创建上传会话**
   ```javascript
   const response = await api.post('/api/upload/session', {
     category: 'personal'  // 或 'scenic'
   });
   const { sessionId } = response.data;
   ```

3. **开始上传**
   ```javascript
   const formData = new FormData();
   files.forEach(file => {
     formData.append('files', file);
   });
   formData.append('sessionId', sessionId);
   formData.append('category', 'personal');

   const response = await api.post('/api/upload/batch', formData, {
     onUploadProgress: handleProgress
   });
   ```

4. **监控进度**
   ```javascript
   // WebSocket连接
   const socket = io(VITE_WS_BASE_URL, {
     query: { sessionId }
   });

   socket.on('upload-progress', (data) => {
     updateFileProgress(data.fileId, data.progress);
   });

   socket.on('upload-completed', (data) => {
     handleUploadComplete(data);
   });
   ```

### API接口示例

#### 文件验证
```bash
curl -X POST http://localhost:3000/api/upload/validate \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "name": "video.mp4",
        "size": 104857600,
        "type": "video/mp4"
      }
    ]
  }'
```

#### 创建会话
```bash
curl -X POST http://localhost:3000/api/upload/session \
  -H "Content-Type: application/json" \
  -d '{
    "category": "personal",
    "expectedFiles": 2
  }'
```

#### 查询进度
```bash
curl http://localhost:3000/api/upload/progress/{sessionId}
```

## 测试

### 运行测试

```bash
# 后端测试
cd backend
npm test                    # 单元测试
npm run test:coverage       # 测试覆盖率
npm run test:e2e           # 端到端测试

# 前端测试
cd frontend
npm test                    # 单元测试
npm run test:e2e           # 端到端测试
npm run test:coverage       # 测试覆盖率
```

### 测试数据

项目提供了测试用的模拟数据：

```javascript
// 测试文件示例
const mockFiles = [
  {
    name: 'test-video.mp4',
    size: 50 * 1024 * 1024,  // 50MB
    type: 'video/mp4'
  },
  {
    name: 'test-video.avi',
    size: 100 * 1024 * 1024, // 100MB
    type: 'video/avi'
  }
];
```

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t video-upload-h5 .

# 运行容器
docker run -p 3000:3000 -v $(pwd)/upload:/app/upload video-upload-h5
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 监控状态
pm2 monit

# 查看日志
pm2 logs
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 常见问题

### Q: 上传大文件时遇到超时问题
A: 调整nginx和express的超时配置：
```nginx
# nginx.conf
client_max_body_size 500M;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

```javascript
// express配置
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
```

### Q: 移动端上传速度慢
A: 启用分片上传和压缩：
```javascript
// 前端配置
const uploaderOptions = {
  chunkSize: 2 * 1024 * 1024,  // 2MB分片
  simultaneousUploads: 3,
  compress: true
};
```

### Q: WebSocket连接不稳定
A: 启用重连机制和心跳检测：
```javascript
const socket = io(url, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});
```

## 性能优化建议

### 前端优化
- 使用CDN加速静态资源
- 启用Gzip压缩
- 实现图片懒加载
- 优化包大小，移除未使用依赖

### 后端优化
- 启用文件缓存
- 使用集群模式部署
- 实现数据库连接池
- 配置负载均衡

### 存储优化
- 使用云存储服务
- 实现文件清理策略
- 配置CDN分发
- 监控磁盘使用情况

## 监控和日志

### 日志配置

```javascript
// 后端日志
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 性能监控

```javascript
// 上传性能监控
const performanceMetrics = {
  uploadSpeed: [],
  successRate: 0,
  averageTime: 0,
  errorCount: 0
};
```

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您遇到问题或有建议，请：

1. 查看 [常见问题](#常见问题)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的Issue描述问题
4. 联系开发团队

## 更新日志

### v1.0.0 (2025-11-14)
- ✨ 初始版本发布
- ✨ 基础文件上传功能
- ✨ 移动端响应式设计
- ✨ 文件分类存储
- ✨ 实时进度显示
- ✨ 错误处理机制