const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config/upload');
const fileValidator = require('../utils/fileValidator');

// In-memory storage for upload sessions (production would use Redis or database)
const sessions = new Map();
const uploadProgress = new Map();

class UploadService {
  constructor() {
    this.io = null; // Will be set by app.js
  }

  // Set socket.io instance
  setIO(io) {
    this.io = io;
  }

  // Emit progress update to clients
  emitProgress(sessionId, data) {
    if (this.io) {
      this.io.to(`session:${sessionId}`).emit('upload-progress', {
        sessionId,
        timestamp: new Date().toISOString(),
        ...data
      });
    }
  }

  // Validate files
  async validateFiles(files) {
    const result = {
      valid: true,
      files: []
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileResult = {
        index: i,
        valid: true,
        errors: []
      };

      // Check file size
      if (file.size > config.maxFileSize) {
        fileResult.valid = false;
        fileResult.errors.push(`文件大小超过限制 (${config.maxFileSize / 1024 / 1024}MB)`);
        result.valid = false;
      }

      // Check file type
      const ext = path.extname(file.name).toLowerCase();
      if (!config.allowedExtensions.includes(ext)) {
        fileResult.valid = false;
        fileResult.errors.push(`不支持的文件格式 (${ext})`);
        result.valid = false;
      }

      // Check MIME type
      if (!config.allowedMimeTypes.includes(file.type)) {
        fileResult.valid = false;
        fileResult.errors.push(`不支持的MIME类型 (${file.type})`);
        result.valid = false;
      }

      result.files.push(fileResult);
    }

    // Check if all files are the same type
    if (files.length > 1) {
      const fileTypes = new Set(files.map(file => path.extname(file.name).toLowerCase()));
      if (fileTypes.size > 1) {
        result.valid = false;
        result.files.forEach(file => {
          file.errors.push('所有文件必须是相同类型');
          file.valid = false;
        });
      }
    }

    return result;
  }

  // Create upload session
  async createSession({ category, expectedFiles }) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      category,
      expectedFiles,
      maxFiles: config.maxFilesPerSession,
      uploadPath: config.categoryPaths[category],
      overallStatus: 'pending',
      totalProgress: 0,
      completedFiles: 0,
      failedFiles: 0,
      files: [],
      sessionStartTime: new Date(),
      createdAt: new Date()
    };

    sessions.set(sessionId, session);

    logger.dev('Created upload session', {
      sessionId,
      category,
      expectedFiles
    });

    return session;
  }

  // Upload files
  async uploadFiles(sessionId, category, files) {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    session.overallStatus = 'uploading';
    const result = {
      files: [],
      completedFiles: 0,
      failedFiles: 0
    };

    // Create target directory if it doesn't exist
    const targetDir = path.join(__dirname, '../../upload', category);
    await fs.ensureDir(targetDir);

    // Emit initial progress
    this.emitProgress(sessionId, {
      overallStatus: 'uploading',
      totalProgress: 5, // 设置初始进度为5%，让用户看到上传开始了
      completedFiles: 0,
      failedFiles: 0,
      message: '开始上传文件...'
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create file info object for progress tracking
      const fileInfo = {
        id: uuidv4(),
        originalName: file.originalname,
        fileSize: file.size,
        fileType: path.extname(file.originalname).substring(1),
        status: 'uploading',
        progress: 0,
        uploadSpeed: 0,
        uploadStartTime: new Date()
      };

      session.files.push(fileInfo);

      // Emit file start progress
      this.emitProgress(sessionId, {
        overallStatus: 'uploading',
        totalProgress: Math.round((i / files.length) * 100),
        completedFiles: result.completedFiles,
        failedFiles: result.failedFiles,
        currentFile: {
          id: fileInfo.id,
          originalName: file.originalname,
          progress: 0,
          status: 'uploading'
        },
        message: `正在上传 ${file.originalname}...`
      });

      try {
        // 实际文件移动和进度模拟
        const fileName = config.generateFileName(sessionId, file.originalname);
        const targetPath = path.join(targetDir, fileName);

        // 先移动文件
        await fs.move(file.path, targetPath);

        // 模拟上传进度（更平滑的进度条）
        const progressSteps = [5, 15, 30, 45, 60, 75, 85, 95, 100];
        const stepDelay = 300; // 每步间隔300ms

        for (const progress of progressSteps) {
          await new Promise(resolve => setTimeout(resolve, stepDelay));

          fileInfo.progress = progress;
          fileInfo.uploadSpeed = file.size / 1000; // Mock speed

          // 计算总体进度
          const completedFilesProgress = result.completedFiles * (100 / files.length);
          const currentFileProgress = (progress / 100) * (100 / files.length);
          const totalProgress = Math.round(completedFilesProgress + currentFileProgress);

          // 发送进度更新
          this.emitProgress(sessionId, {
            overallStatus: 'uploading',
            totalProgress,
            completedFiles: result.completedFiles,
            failedFiles: result.failedFiles,
            currentFile: {
              id: fileInfo.id,
              originalName: file.originalname,
              progress,
              status: 'uploading',
              uploadSpeed: fileInfo.uploadSpeed
            },
            message: `正在上传 ${file.originalname}... ${progress}%`
          });
        }

        // Complete file info
        fileInfo.fileName = fileName;
        fileInfo.filePath = targetPath;
        fileInfo.status = 'completed';
        fileInfo.uploadEndTime = new Date();
        fileInfo.isValidFormat = true;
        fileInfo.isValidSize = true;

        result.files.push(fileInfo);
        result.completedFiles++;

        // Update session progress
        session.completedFiles = result.completedFiles;
        session.totalProgress = Math.round((result.completedFiles / files.length) * 100);

        uploadProgress.set(fileInfo.id, {
          progress: 100,
          speed: fileInfo.uploadSpeed,
          lastUpdate: new Date()
        });

        logger.dev('File uploaded successfully', {
          fileId: fileInfo.id,
          fileName: file.originalname,
          size: file.size
        });

        // Emit file completion
        this.emitProgress(sessionId, {
          overallStatus: 'uploading',
          totalProgress: session.totalProgress,
          completedFiles: result.completedFiles,
          failedFiles: result.failedFiles,
          currentFile: {
            id: fileInfo.id,
            originalName: file.originalname,
            progress: 100,
            status: 'completed'
          },
          message: `${file.originalname} 上传完成`
        });

      } catch (error) {
        logger.error('File upload failed', {
          fileName: file.originalname,
          error: error.message
        });

        fileInfo.status = 'failed';
        fileInfo.errorMessage = error.message;
        fileInfo.errorCode = 'UPLOAD_FAILED';

        result.files.push(fileInfo);
        result.failedFiles++;

        // Emit file error
        this.emitProgress(sessionId, {
          overallStatus: 'uploading',
          totalProgress: session.totalProgress,
          completedFiles: result.completedFiles,
          failedFiles: result.failedFiles,
          currentFile: {
            id: fileInfo.id,
            originalName: file.originalname,
            progress: 0,
            status: 'failed',
            error: error.message
          },
          message: `${file.originalname} 上传失败`
        });
      }
    }

    // Update session status
    session.overallStatus = result.failedFiles === 0 ? 'completed' : 'partial';
    session.sessionEndTime = new Date();

    // Emit final progress
    this.emitProgress(sessionId, {
      overallStatus: session.overallStatus,
      totalProgress: 100,
      completedFiles: result.completedFiles,
      failedFiles: result.failedFiles,
      message: session.overallStatus === 'completed' ? '所有文件上传完成' : '部分文件上传失败'
    });

    return result;
  }

  // Get upload progress
  async getProgress(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Calculate estimated time remaining
    let estimatedTimeRemaining = 0;
    if (session.overallStatus === 'uploading' && session.totalProgress > 0) {
      const elapsed = Date.now() - session.sessionStartTime.getTime();
      const totalEstimated = elapsed / (session.totalProgress / 100);
      estimatedTimeRemaining = Math.round((totalEstimated - elapsed) / 1000);
    }

    return {
      sessionId: session.sessionId,
      overallStatus: session.overallStatus,
      totalProgress: session.totalProgress,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      estimatedTimeRemaining,
      files: session.files,
      lastUpdate: new Date()
    };
  }

  // Cancel upload
  async cancelUpload(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return { success: false };
    }

    const cancelledFiles = [];

    // Cancel files that are still uploading
    session.files.forEach(file => {
      if (file.status === 'uploading' || file.status === 'queued') {
        file.status = 'cancelled';
        cancelledFiles.push(file.id);
      }
    });

    session.overallStatus = 'cancelled';
    session.sessionEndTime = new Date();

    logger.user('Upload cancelled', {
      sessionId,
      cancelledFilesCount: cancelledFiles.length
    });

    return {
      success: true,
      cancelledFiles
    };
  }

  // Delete file
  async deleteFile(fileId) {
    // Find file in all sessions
    for (const [sessionId, session] of sessions) {
      const fileIndex = session.files.findIndex(file => file.id === fileId);
      if (fileIndex !== -1) {
        const file = session.files[fileIndex];

        try {
          // Delete physical file
          if (file.filePath && await fs.pathExists(file.filePath)) {
            await fs.remove(file.filePath);
          }

          // Remove from session
          session.files.splice(fileIndex, 1);

          logger.dev('File deleted successfully', {
            fileId,
            fileName: file.originalName
          });

          return { success: true };

        } catch (error) {
          logger.error('File deletion failed', {
            fileId,
            error: error.message
          });
          return { success: false };
        }
      }
    }

    return { success: false };
  }

  // Cleanup old sessions
  async cleanupSessions() {
    const now = Date.now();
    const maxAge = config.sessionTimeout;

    for (const [sessionId, session] of sessions) {
      const age = now - session.sessionStartTime.getTime();
      if (age > maxAge) {
        sessions.delete(sessionId);
        logger.dev('Session cleaned up', { sessionId });
      }
    }
  }
}

// Create singleton instance
const uploadService = new UploadService();

// Start cleanup interval
setInterval(() => {
  uploadService.cleanupSessions();
}, config.cleanupInterval);

module.exports = uploadService;