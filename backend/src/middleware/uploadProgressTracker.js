const EventEmitter = require('events');
const logger = require('../utils/logger');

class UploadProgressTracker extends EventEmitter {
  constructor() {
    super();
    this.activeUploads = new Map();
  }

  // 开始跟踪上传会话
  startTracking(sessionId, totalFiles, totalSize) {
    const tracking = {
      sessionId,
      totalFiles,
      totalSize,
      uploadedFiles: 0,
      uploadedSize: 0,
      currentFileIndex: 0,
      files: [],
      startTime: Date.now(),
      lastProgressEmit: 0
    };

    this.activeUploads.set(sessionId, tracking);
    logger.dev('Started upload progress tracking', { sessionId, totalFiles, totalSize });

    // 立即发送初始进度
    this.emitProgress(sessionId, 0, '开始上传...');
  }

  // 开始单个文件上传
  startFile(sessionId, file) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) {
      logger.error('Upload tracking not found for session', { sessionId });
      return;
    }

    const fileTracking = {
      id: file.id,
      originalName: file.originalname,
      size: file.size,
      uploadedSize: 0,
      status: 'uploading',
      startTime: Date.now()
    };

    tracking.files.push(fileTracking);
    tracking.currentFileIndex = tracking.files.length - 1;

    logger.dev('Started file upload tracking', {
      sessionId,
      fileId: file.id,
      fileName: file.originalname,
      fileSize: file.size
    });
  }

  // 更新文件上传进度
  updateFileProgress(sessionId, fileId, uploadedSize, totalSize) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return;

    const fileIndex = tracking.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const file = tracking.files[fileIndex];
    const previousUploadedSize = file.uploadedSize;
    file.uploadedSize = uploadedSize;

    // 更新总体上传大小
    tracking.uploadedSize = tracking.uploadedSize - previousUploadedSize + uploadedSize;

    // 计算进度百分比
    const overallProgress = Math.round((tracking.uploadedSize / tracking.totalSize) * 100);
    const fileProgress = Math.round((uploadedSize / totalSize) * 100);

    // 节流：限制进度更新频率为最多每100ms一次
    const now = Date.now();
    if (now - tracking.lastProgressEmit < 100 && overallProgress < 100) {
      return;
    }
    tracking.lastProgressEmit = now;

    // 构建进度消息
    const progressMessage = `正在上传 ${file.originalName}... ${fileProgress}%`;

    this.emitProgress(sessionId, overallProgress, progressMessage, {
      currentFile: {
        id: fileId,
        originalName: file.originalName,
        progress: fileProgress,
        status: 'uploading',
        uploadSpeed: this.calculateUploadSpeed(file, uploadedSize)
      }
    });

    logger.dev('Upload progress updated', {
      sessionId,
      fileId,
      fileProgress,
      overallProgress,
      uploadedSize,
      totalSize
    });
  }

  // 完成文件上传
  completeFile(sessionId, fileId) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return;

    const fileIndex = tracking.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const file = tracking.files[fileIndex];
    file.status = 'completed';
    file.endTime = Date.now();
    file.uploadedSize = file.size; // 确保上传大小等于文件大小

    tracking.uploadedFiles++;

    logger.dev('File upload completed', {
      sessionId,
      fileId,
      fileName: file.originalName,
      uploadedFiles: tracking.uploadedFiles,
      totalFiles: tracking.totalFiles
    });

    // 检查是否所有文件都已完成
    if (tracking.uploadedFiles === tracking.totalFiles) {
      this.completeUpload(sessionId);
    }
  }

  // 完成整个上传会话
  completeUpload(sessionId) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return;

    tracking.endTime = Date.now();
    const duration = tracking.endTime - tracking.startTime;

    // 发送完成进度
    this.emitProgress(sessionId, 100, '所有文件上传完成', {
      overallStatus: 'completed',
      completedFiles: tracking.uploadedFiles,
      failedFiles: 0
    });

    logger.user('Upload session completed', {
      sessionId,
      totalFiles: tracking.totalFiles,
      totalSize: tracking.totalSize,
      duration: `${duration}ms`,
      averageSpeed: `${(tracking.totalSize / duration * 1000).toFixed(2)} bytes/s`
    });

    // 延迟清理跟踪数据，给客户端时间处理完成事件
    setTimeout(() => {
      this.activeUploads.delete(sessionId);
    }, 5000);
  }

  // 文件上传失败
  failFile(sessionId, fileId, error) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return;

    const fileIndex = tracking.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const file = tracking.files[fileIndex];
    file.status = 'failed';
    file.error = error;
    file.endTime = Date.now();

    logger.error('File upload failed', {
      sessionId,
      fileId,
      fileName: file.originalName,
      error: error.message
    });

    this.emitProgress(sessionId, null, `${file.originalName} 上传失败: ${error.message}`, {
      currentFile: {
        id: fileId,
        originalName: file.originalName,
        status: 'failed',
        error: error.message
      }
    });
  }

  // 发送进度事件
  emitProgress(sessionId, totalProgress, message, additionalData = {}) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return;

    const progressData = {
      sessionId,
      timestamp: new Date().toISOString(),
      overallStatus: totalProgress === 100 ? 'completed' : 'uploading',
      totalProgress: totalProgress || tracking.totalProgress,
      completedFiles: tracking.uploadedFiles,
      failedFiles: tracking.files.filter(f => f.status === 'failed').length,
      totalFiles: tracking.totalFiles,
      message,
      ...additionalData
    };

    this.emit('progress', progressData);
  }

  // 计算上传速度
  calculateUploadSpeed(file, uploadedSize) {
    const elapsed = Date.now() - file.startTime;
    if (elapsed === 0) return 0;
    return Math.round(uploadedSize / elapsed * 1000); // bytes per second
  }

  // 获取上传进度
  getProgress(sessionId) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return null;

    return {
      sessionId: tracking.sessionId,
      overallStatus: tracking.endTime ? 'completed' : 'uploading',
      totalProgress: Math.round((tracking.uploadedSize / tracking.totalSize) * 100),
      completedFiles: tracking.uploadedFiles,
      failedFiles: tracking.files.filter(f => f.status === 'failed').length,
      totalFiles: tracking.totalFiles,
      files: tracking.files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        progress: Math.round((file.uploadedSize / file.size) * 100),
        status: file.status,
        error: file.error
      })),
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(tracking),
      lastUpdate: new Date()
    };
  }

  // 计算预计剩余时间
  calculateEstimatedTimeRemaining(tracking) {
    if (tracking.uploadedSize === 0) return 0;

    const elapsed = Date.now() - tracking.startTime;
    const averageSpeed = tracking.uploadedSize / elapsed;
    const remainingSize = tracking.totalSize - tracking.uploadedSize;

    if (averageSpeed === 0) return 0;

    return Math.round(remainingSize / averageSpeed / 1000); // seconds
  }

  // 取消上传
  cancelUpload(sessionId) {
    const tracking = this.activeUploads.get(sessionId);
    if (!tracking) return false;

    tracking.overallStatus = 'cancelled';
    tracking.endTime = Date.now();

    this.emitProgress(sessionId, null, '上传已取消', {
      overallStatus: 'cancelled'
    });

    logger.user('Upload cancelled', { sessionId });

    setTimeout(() => {
      this.activeUploads.delete(sessionId);
    }, 2000);

    return true;
  }

  // 清理过期的跟踪数据
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, tracking] of this.activeUploads) {
      const age = now - tracking.startTime;
      if (age > maxAge) {
        this.activeUploads.delete(sessionId);
        logger.dev('Cleaned up expired upload tracking', { sessionId, age });
      }
    }
  }
}

// 创建单例实例
const uploadProgressTracker = new UploadProgressTracker();

// 定期清理过期数据
setInterval(() => {
  uploadProgressTracker.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

module.exports = uploadProgressTracker;