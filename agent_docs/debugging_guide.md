# 调试指南

完整的调试方法和故障排除指南，帮助快速定位和解决问题。

## 快速诊断流程

### 问题分类诊断
```
遇到问题时，请按以下顺序快速定位：

1. 服务启动问题 → 检查端口和依赖
2. 文件上传问题 → 检查格式、大小、权限
3. 连接问题 → 检查WebSocket和网络
4. 性能问题 → 检查内存和带宽
5. 测试问题 → 检查测试环境和数据
```

## 注释消除法详解

### 基本原理
通过逐步注释代码块来缩小问题范围，是快速定位bug的有效方法。

### 实施步骤
1. **识别问题范围** - 确定可能出现问题的代码区域
2. **逐块注释** - 从外到内逐步注释代码块
3. **测试验证** - 每次注释后进行测试验证
4. **定位问题** - 找到导致问题的具体代码
5. **修复验证** - 修复问题并重新测试

### 实际应用示例

#### 后端调试示例
```javascript
// backend/src/controllers/uploadController.js
const uploadController = async (req, res) => {
  try {
    // 步骤1: 先注释核心业务逻辑，测试数据接收
    const files = req.files;
    const category = req.body.category;

    console.log('调试信息 - 接收到的数据:', {
      fileCount: files?.length,
      category
    });

    // 注释掉业务逻辑进行测试
    // await validateFiles(files);
    // const result = await processUpload(files, category);

    res.json({
      success: true,
      message: '数据接收测试成功',
      fileCount: files?.length || 0,
      category: category || '未指定'
    });
  } catch (error) {
    console.error('详细错误信息:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

#### 前端调试示例
```javascript
// frontend/src/components/FileUploader.vue
const handleFileUpload = async () => {
  try {
    // 步骤1: 注释API调用，测试文件选择逻辑
    console.log('选择的文件:', selectedFiles.value);

    // 验证文件逻辑
    const isValid = validateFiles(selectedFiles.value);
    console.log('文件验证结果:', isValid);

    // 注释API调用进行前端逻辑测试
    // const response = await uploadFiles(selectedFiles.value, selectedCategory.value);

    // 模拟成功响应
    console.log('前端逻辑测试完成');

  } catch (error) {
    console.error('文件上传错误:', error);
    // 错误处理逻辑
  }
};
```

## 双级日志系统

### 用户日志 (User Logs)
面向最终用户的操作日志，提供友好的操作反馈。

#### 后端用户日志实现
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const userLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/upload.log' })
  ]
});

// 使用示例
userLogger.info('文件上传开始', {
  userId: req.user?.id,
  fileName: file.originalname,
  fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
  category: category,
  timestamp: new Date().toISOString()
});

userLogger.success('文件上传完成', {
  fileName: file.originalname,
  filePath: savedPath,
  uploadTime: `${Date.now() - startTime}ms`
});
```

#### 前端用户日志实现
```javascript
// frontend/src/utils/logger.js
const userLogger = {
  info: (message, data) => {
    console.log(`🟢 [用户] ${message}`, data);
    // 可选发送到分析服务
  },

  error: (message, data) => {
    console.error(`🔴 [用户] ${message}`, data);
    // 显示用户友好的错误提示
  },

  success: (message, data) => {
    console.log(`✅ [用户] ${message}`, data);
  }
};
```

### 开发者日志 (Developer Logs)
面向开发者的技术调试日志，包含详细的技术信息。

```javascript
// backend/src/utils/devLogger.js
const devLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' })
  ]
});

// 使用示例
devLogger.debug('控制器执行开始', {
  controller: 'uploadController',
  requestId: req.id,
  headers: req.headers,
  body: req.body,
  files: req.files?.map(f => ({
    name: f.originalname,
    size: f.size,
    mimetype: f.mimetype
  }))
});
```

## WebSocket调试技巧

### 连接诊断
```javascript
// frontend/src/composables/useWebSocket.js
export function useWebSocket() {
  const socket = io(import.meta.env.VITE_WS_URL, {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true
  });

  // 连接状态监控
  socket.on('connect', () => {
    console.log('✅ WebSocket连接成功', {
      socketId: socket.id,
      transport: socket.io.engine.transport.name
    });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ WebSocket连接失败', {
      message: error.message,
      description: error.description,
      advice: '检查后端服务是否运行在端口8005'
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ WebSocket连接断开', {
      reason: reason,
      timestamp: new Date().toISOString()
    });
  });

  return socket;
}
```

### 消息调试
```javascript
// 详细的WebSocket消息监控
socket.onAny((eventName, ...args) => {
  console.log(`📡 WebSocket事件: ${eventName}`, {
    data: args,
    timestamp: new Date().toISOString()
  });
});

// 上传进度详细监控
socket.on('upload-progress', (data) => {
  console.log('📊 上传进度更新', {
    progress: `${data.progress}%`,
    uploaded: `${(data.uploaded / 1024 / 1024).toFixed(2)}MB`,
    total: `${(data.total / 1024 / 1024).toFixed(2)}MB`,
    speed: `${data.speed}MB/s`,
    remainingTime: `${data.remainingTime}s`
  });
});
```

## 常见错误代码对照表

| HTTP状态码 | 错误代码 | 描述 | 常见原因 | 解决方案 |
|-----------|----------|------|----------|----------|
| 400 | INVALID_FILE_TYPE | 文件格式错误 | 上传非mp4/avi文件 | 检查文件格式 |
| 413 | FILE_TOO_LARGE | 文件过大 | 文件超过300MB | 压缩或选择小文件 |
| 422 | VALIDATION_FAILED | 验证失败 | 文件数量超过限制 | 减少到3个文件以内 |
| 500 | INTERNAL_ERROR | 服务器错误 | 代码异常或系统错误 | 查看错误日志 |
| 503 | SERVICE_UNAVAILABLE | 服务不可用 | 后端服务未启动 | 启动后端服务 |

## 日志分析技巧

### 实时日志监控
```bash
# 后端日志实时监控
cd backend
tail -f logs/upload.log    # 上传操作日志
tail -f logs/error.log     # 错误日志

# PowerShell实时监控
Get-Content logs\upload.log -Wait -Tail 10
Get-Content logs\error.log -Wait -Tail 10
```

### 日志过滤和搜索
```bash
# 搜索特定错误
grep -i "error" logs/error.log
grep -i "上传失败" logs/upload.log

# 按时间范围过滤
grep "2024-01-10" logs/upload.log

# PowerShell搜索
Select-String -Pattern "ERROR" -Path logs\error.log
Select-String -Pattern "上传失败" -Path logs\upload.log
```

## 性能调试

### 内存使用监控
```javascript
const monitorMemory = () => {
  const used = process.memoryUsage();
  console.log('内存使用情况:');
  Object.entries(used).forEach(([key, value]) => {
    console.log(`${key}: ${Math.round(value / 1024 / 1024 * 100) / 100} MB`);
  });
};

// 在关键操作前后监控内存
console.log('上传前内存状态:');
monitorMemory();

// 执行上传操作...

console.log('上传后内存状态:');
monitorMemory();
```

### 网络请求调试
```javascript
// Axios请求拦截器用于调试
axios.interceptors.request.use(request => {
  console.log('🚀 API请求:', {
    method: request.method.toUpperCase(),
    url: request.url,
    data: request.data,
    headers: request.headers
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('✅ API响应:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ API错误:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);
```

## 故障排除检查清单

### 服务启动问题
- [ ] 检查Node.js版本 (>= 16.0.0)
- [ ] 确认使用cnpm而非npm
- [ ] 检查端口8005是否被占用
- [ ] 验证环境变量配置
- [ ] 查看启动错误日志

### 文件上传问题
- [ ] 验证文件格式 (mp4/avi)
- [ ] 检查文件大小 (<= 300MB)
- [ ] 确认文件数量 (<= 3个)
- [ ] 检查上传目录权限
- [ ] 验证分类选择

### WebSocket连接问题
- [ ] 确认后端服务运行状态
- [ ] 检查防火墙设置
- [ ] 验证WebSocket URL配置
- [ ] 检查Socket.IO版本兼容性
- [ ] 查看浏览器控制台错误

## 环境重置步骤

当遇到无法解决的复杂问题时，可以执行完整的环境重置：

```bash
# 1. 停止所有Node.js进程
taskkill /f /im node.exe

# 2. 清理端口占用
netstat -ano | findstr :3005
netstat -ano | findstr :8005

# 3. 重新安装依赖
cd backend
rm -rf node_modules package-lock.json
cnpm cache clean --force
cnpm install

cd ../frontend
rm -rf node_modules package-lock.json
cnpm cache clean --force
cnpm install

# 4. 重新启动服务
cd backend && npm start &
cd ../frontend && npm run dev &
```