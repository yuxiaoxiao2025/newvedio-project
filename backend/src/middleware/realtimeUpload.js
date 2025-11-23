const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const uploadProgressTracker = require('./uploadProgressTracker');
const config = require('../config/upload');

// 创建临时目录
const tempDir = path.join(__dirname, '../../upload/temp');
fs.ensureDirSync(tempDir);

class RealtimeUploadMiddleware {
  constructor() {
    this.io = null; // 将在app.js中设置
  }

  // 设置Socket.IO实例
  setIO(io) {
    this.io = io;

    // 监听进度事件并通过WebSocket发送
    uploadProgressTracker.on('progress', (progressData) => {
      if (this.io) {
        this.io.to(`session:${progressData.sessionId}`).emit('upload-progress', progressData);
      }
    });
  }

  // 自定义存储引擎，支持真实进度跟踪
  createStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, tempDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const tempFileName = `temp-${uniqueSuffix}${ext}`;

        // 为文件分配唯一ID用于进度跟踪
        file.id = uuidv4();
        file.tempFileName = tempFileName;

        cb(null, tempFileName);
      }
    });
  }

  // 文件过滤器
  createFileFilter() {
    return (req, file, cb) => {
      // 检查文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      if (!config.allowedExtensions.includes(ext)) {
        const error = new Error('不支持的文件格式');
        error.code = 'INVALID_FILE_FORMAT';
        error.allowedFormats = config.allowedExtensions;
        return cb(error, false);
      }

      // 检查MIME类型
      if (file.mimetype && !config.allowedMimeTypes.includes(file.mimetype)) {
        const extAllowed = config.allowedExtensions.includes(ext);
        if (!extAllowed) {
          const error = new Error('不支持的文件类型');
          error.code = 'INVALID_MIME_TYPE';
          error.allowedTypes = config.allowedMimeTypes;
          return cb(error, false);
        }
      }

      cb(null, true);
    };
  }

  // 创建带有进度跟踪的multer实例
  createMulterInstance() {
    const storage = this.createStorage();
    const fileFilter = this.createFileFilter();

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: config.maxFileSize,
        files: config.maxFilesPerSession
      }
    });
  }

  // 包装multer中间件，添加进度跟踪
  uploadWithProgress() {
    const multerInstance = this.createMulterInstance();

    return (req, res, next) => {
      let sessionId = null;

      // 监听请求进度（使用原生方式）
      let totalSize = 0;
      let uploadedSize = 0;
      let filesToProcess = [];
      let processedFiles = 0;

      // 保存原始的res.end方法
      const originalEnd = res.end;
      const originalJson = res.json;

      // 拦截响应以完成进度跟踪
      const finishTracking = () => {
        // 确保所有文件都标记为完成
        if (filesToProcess.length > 0) {
          filesToProcess.forEach(file => {
            if (file.status !== 'failed') {
              uploadProgressTracker.completeFile(sessionId, file.id);
            }
          });
        }
      };

      // 包装响应方法
      res.end = function(...args) {
        finishTracking();
        return originalEnd.apply(this, args);
      };

      res.json = function(...args) {
        finishTracking();
        return originalJson.apply(this, args);
      };

      // 处理文件上传前的准备工作
      const prepareUpload = (req, res, next) => {
        sessionId = req.body.sessionId;

        if (!sessionId) {
          return res.status(400).json({
            error: 'NO_SESSION_ID',
            message: '缺少会话ID',
            timestamp: new Date().toISOString()
          });
        }

        // 获取Content-Length来计算总大小
        const contentLength = parseInt(req.headers['content-length'] || '0');

        // 如果有文件，计算文件总数和总大小
        if (req.files && req.files.length > 0) {
          const filesInfo = req.files.map(file => ({
            id: file.id,
            originalname: file.originalname,
            size: file.size,
            status: 'pending'
          }));

          filesToProcess = filesInfo;
          totalSize = filesInfo.reduce((sum, file) => sum + file.size, 0);

          // 开始跟踪上传进度
          uploadProgressTracker.startTracking(sessionId, filesInfo.length, totalSize);

          // 为每个文件开始跟踪
          filesInfo.forEach((fileInfo, index) => {
            setTimeout(() => {
              uploadProgressTracker.startFile(sessionId, fileInfo);
            }, index * 50); // 错开文件开始时间以提供更好的用户体验
          });

          logger.dev('Upload progress tracking initialized', {
            sessionId,
            totalFiles: filesInfo.length,
            totalSize,
            contentLength
          });
        }

        next();
      };

      // 监听请求的data事件来跟踪上传进度
      let isDataListening = false;

      const setupProgressTracking = () => {
        if (isDataListening || !req.files || req.files.length === 0 || !sessionId) return;

        isDataListening = true;
        let lastProgressEmit = 0;

        req.on('data', (chunk) => {
          uploadedSize += chunk.length;

          // 更新所有正在上传的文件的进度
          if (filesToProcess.length > 0) {
            const activeFile = filesToProcess.find(f => f.status === 'uploading') || filesToProcess[0];

            if (activeFile && totalSize > 0) {
              const fileProgress = Math.min(Math.round((uploadedSize / totalSize) * 100), 100);

              // 节流进度更新
              const now = Date.now();
              if (now - lastProgressEmit > 100) { // 每100ms最多更新一次
                uploadProgressTracker.updateFileProgress(
                  sessionId,
                  activeFile.id,
                  uploadedSize,
                  totalSize
                );
                lastProgressEmit = now;
              }
            }
          }
        });

        req.on('end', () => {
          logger.dev('Upload request completed', {
            sessionId,
            uploadedSize,
            totalSize,
            filesCount: req.files?.length || 0
          });
        });
      };

      // 使用multer处理文件上传
      multerInstance.array('files', config.maxFilesPerSession)(req, res, (err) => {
        if (err) {
          // 处理上传错误
          logger.error('Multer upload error', {
            sessionId,
            error: err.message,
            code: err.code
          });

          // 标记所有文件为失败
          if (filesToProcess.length > 0) {
            filesToProcess.forEach(file => {
              uploadProgressTracker.failFile(sessionId, file.id, err);
            });
          }

          return next(err);
        }

        // 设置进度跟踪
        prepareUpload(req, res, () => {
          setupProgressTracking();

          // 继续到下一个中间件
          next();
        });
      });
    };
  }

  // 获取上传进度
  getProgress(sessionId) {
    return uploadProgressTracker.getProgress(sessionId);
  }

  // 取消上传
  cancelUpload(sessionId) {
    return uploadProgressTracker.cancelUpload(sessionId);
  }
}

// 创建单例实例
const realtimeUpload = new RealtimeUploadMiddleware();

// 导出中间件实例和方法
module.exports = {
  // 主要的上传中间件
  uploadWithProgress: realtimeUpload.uploadWithProgress.bind(realtimeUpload),

  // 获取进度方法
  getProgress: realtimeUpload.getProgress.bind(realtimeUpload),

  // 取消上传方法
  cancelUpload: realtimeUpload.cancelUpload.bind(realtimeUpload),

  // 设置IO实例方法
  setIO: realtimeUpload.setIO.bind(realtimeUpload),

  // 单例实例
  instance: realtimeUpload
};