# AI视频分析系统故障排除指南

## 🔧 常见问题与解决方案

### 1. Windows系统下视频文件路径错误

**问题描述：**
- 真实的视频文件被错误识别为"不是视频文件"
- 错误信息：`The file: /path/to/video.mp4 is not exists!`
- 系统报告文件不存在，但文件确实存在且可播放

**根本原因：**
阿里云DashScope API对Windows系统下的file://协议路径格式有特殊要求。错误的路径格式导致API无法访问本地文件。

**解决方案：**
```python
# 错误格式（三个斜杠）
file:///E:/path/to/video.mp4

# 正确格式（两个斜杠）
file://E:/path/to/video.mp4
```

**修复位置：**
- `backend/scripts/video_analyzer.py` 第116-120行
- `backend/scripts/video_analyzer.py` 第271-275行

**验证方法：**
```bash
cd backend
python scripts/video_analyzer.py --video-path "upload/personal/test.mp4" --type content
```

### 2. 环境变量配置问题

**问题描述：**
- 错误：`DASHSCOPE_API_KEY环境变量未设置`
- AI分析服务无法启动

**解决方案：**
1. 确保 `.env` 文件在 `backend/` 目录下
2. 检查环境变量格式：
```env
DASHSCOPE_API_KEY=sk-your-api-key-here
```

3. 验证环境变量加载：
```bash
cd backend/scripts
python -c "import os; print('API Key存在:', bool(os.getenv('DASHSCOPE_API_KEY')))"
```

### 3. 文件大小处理策略

**系统行为：**
- **< 10MB**: 使用Base64编码传输
- **≥ 10MB**: 使用file://协议传输

**测试验证：**
```bash
# 小文件测试（应使用Base64）
python scripts/video_analyzer.py --video-path "upload/personal/small_video.mp4"

# 大文件测试（应使用file://）
python scripts/video_analyzer.py --video-path "upload/scenic/large_video.mp4"
```

### 4. API调用失败处理

**问题描述：**
- HTTP API调用失败，错误400：`InvalidParameter: The provided URL does not appear to be valid`
- 系统自动回退到Python SDK

**解决方案：**
系统已实现智能回退机制：
1. 优先尝试Python SDK（支持本地文件）
2. SDK失败时回退到HTTP API
3. 最终失败时提供友好的错误信息

**监控日志：**
```bash
# 查看后端日志
cd backend
npm start

# 观察是否有以下日志：
# "Python SDK分析失败，回退到HTTP API"
# "VL模型分析失败: AxiosError"
```

## 📊 性能优化建议

### 1. 大文件处理优化

**当前限制：**
- 单个视频文件：≤ 100MB
- Base64编码：≤ 10MB

**优化建议：**
- 压缩大视频文件到合理大小
- 考虑使用视频压缩工具：
```bash
# 使用FFmpeg压缩
ffmpeg -i input.mp4 -b:v 1M -b:a 128k output.mp4
```

### 2. API调用优化

**超时设置：**
- Python SDK：3分钟（180秒）
- HTTP API：2分钟（120秒）

**重试机制：**
- 自动重试3次
- 指数退避延迟
- 智能错误分类

### 3. 内存使用优化

**文件处理：**
- 流式读取大文件
- 及时清理临时数据
- 避免同时处理多个大文件

## 🔍 调试工具

### 1. Python脚本调试

**启用调试模式：**
```bash
python scripts/video_analyzer.py --video-path "video.mp4" --type content --debug
```

**调试信息包括：**
- API Key状态
- 文件路径解析
- 文件存在性检查
- 传输方式选择

### 2. Node.js服务调试

**环境变量检查：**
```javascript
console.log('API Key:', process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置');
```

**路径安全验证：**
```javascript
const path = require('path');
const uploadDir = path.resolve('upload');
const filePath = path.resolve('user/file.mp4');
console.log('路径安全:', filePath.startsWith(uploadDir));
```

### 3. 前端调试

**WebSocket连接状态：**
```javascript
// 在浏览器控制台检查
socket.on('connect', () => console.log('WebSocket已连接'));
socket.on('analysis:progress', (data) => console.log('进度更新:', data));
```

## 📋 系统状态检查清单

### 启动前检查
- [ ] `.env` 文件存在且包含有效的 `DASHSCOPE_API_KEY`
- [ ] `backend/upload/` 目录存在且有写权限
- [ ] Python环境已安装 `dashscope` 包
- [ ] Node.js依赖已安装（`npm install`）

### 运行时检查
- [ ] 后端服务在端口8005运行
- [ ] 前端服务在端口3005运行
- [ ] 环境变量正确加载
- [ ] WebSocket连接正常

### 功能测试检查
- [ ] 小文件（<10MB）使用Base64编码
- [ ] 大文件（≥10MB）使用file://协议
- [ ] Windows路径格式正确
- [ ] 路径遍历攻击防护有效

## 🚨 紧急恢复程序

### 完全重置
1. 停止所有服务：
```bash
# 停止后端
pkill -f "node.*src/app.js"

# 停止前端
pkill -f "npm run dev"
```

2. 清理临时文件：
```bash
# 清理上传目录（谨慎操作）
# rm -rf backend/upload/*
```

3. 重新安装依赖：
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

4. 重新启动服务：
```bash
cd backend
npm start

cd ../frontend
npm run dev
```

### 联系支持
如果遇到无法解决的问题，请提供：
1. 完整的错误日志
2. 系统环境信息（OS、Node.js版本、Python版本）
3. 重现步骤
4. 测试文件信息（大小、格式）

---

**最后更新：** 2025-11-23
**版本：** v1.0
**状态：** 已验证 ✅