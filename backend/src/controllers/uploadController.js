const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const logger = require('../utils/logger');
const config = require('../config/upload');
const uploadService = require('../services/uploadService');

// Validation schemas
const fileValidationSchema = Joi.object({
  files: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      size: Joi.number().integer().min(1).max(config.maxFileSize).required(),
      // 允许缺失或未知的 MIME，由服务层进行更严格校验
      type: Joi.string().allow('').optional()
    })
  ).min(1).max(3).required()
});

const sessionSchema = Joi.object({
  category: Joi.string().valid('personal', 'scenic').required(),
  expectedFiles: Joi.number().integer().min(1).max(3).default(1)
});

class UploadController {
  // Validate files before upload
  async validateFiles(req, res) {
    try {
      const { error, value } = fileValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: '文件验证失败',
          details: error.details.map(detail => detail.message),
          timestamp: new Date().toISOString()
        });
      }

      const validationResult = await uploadService.validateFiles(value.files);

      res.json({
        valid: validationResult.valid,
        files: validationResult.files,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('File validation error:', err);
      res.status(500).json({
        error: 'VALIDATION_FAILED',
        message: '文件验证过程中发生错误',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create upload session
  async createSession(req, res) {
    try {
      const { error, value } = sessionSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: 'INVALID_CATEGORY',
          message: '无效的文件分类',
          details: error.details[0].message,
          timestamp: new Date().toISOString()
        });
      }

      const session = await uploadService.createSession(value);

      logger.user('创建上传会话', {
        sessionId: session.sessionId,
        category: value.category,
        expectedFiles: value.expectedFiles
      });

      res.status(201).json({
        sessionId: session.sessionId,
        category: value.category,
        uploadPath: config.categoryPaths[value.category],
        maxFiles: config.maxFilesPerSession,
        allowedTypes: config.allowedExtensions.map(ext => ext.substring(1)),
        maxFileSize: config.maxFileSize,
        createdAt: session.createdAt,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Session creation error:', err);
      res.status(500).json({
        error: 'SESSION_CREATION_FAILED',
        message: '创建上传会话失败',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Upload files
  async uploadFiles(req, res) {
    try {
      const { sessionId, category } = req.body;
      const files = req.files;

      if (!sessionId || !category) {
        return res.status(400).json({
          error: 'MISSING_PARAMETERS',
          message: '缺少必要参数',
          timestamp: new Date().toISOString()
        });
      }

      const result = await uploadService.uploadFiles(sessionId, category, files);

      logger.user('文件上传完成', {
        sessionId,
        category,
        totalFiles: files.length,
        completedFiles: result.completedFiles,
        failedFiles: result.failedFiles
      });

      res.json({
        success: true,
        sessionId,
        files: result.files,
        summary: {
          totalFiles: files.length,
          completedFiles: result.completedFiles,
          failedFiles: result.failedFiles,
          totalSize: files.reduce((sum, file) => sum + file.size, 0)
        },
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('File upload error:', err);
      res.status(500).json({
        error: 'UPLOAD_FAILED',
        message: '文件上传失败',
        details: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get upload progress
  async getProgress(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: 'MISSING_SESSION_ID',
          message: '缺少会话ID',
          timestamp: new Date().toISOString()
        });
      }

      const progress = await uploadService.getProgress(sessionId);

      if (!progress) {
        return res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: '上传会话不存在',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        sessionId: progress.sessionId,
        overallStatus: progress.overallStatus,
        totalProgress: progress.totalProgress,
        completedFiles: progress.completedFiles,
        failedFiles: progress.failedFiles,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
        files: progress.files,
        lastUpdate: progress.lastUpdate,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Progress query error:', err);
      res.status(500).json({
        error: 'PROGRESS_QUERY_FAILED',
        message: '查询进度失败',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Cancel upload
  async cancelUpload(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: 'MISSING_SESSION_ID',
          message: '缺少会话ID',
          timestamp: new Date().toISOString()
        });
      }

      const result = await uploadService.cancelUpload(sessionId);

      if (!result.success) {
        return res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: '上传会话不存在',
          timestamp: new Date().toISOString()
        });
      }

      logger.user('取消上传', {
        sessionId,
        cancelledFiles: result.cancelledFiles.length
      });

      res.json({
        success: true,
        sessionId,
        cancelledFiles: result.cancelledFiles,
        message: `成功取消${result.cancelledFiles.length}个文件的上传`,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Upload cancellation error:', err);
      res.status(500).json({
        error: 'CANCELLATION_FAILED',
        message: '取消上传失败',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Delete file (admin only)
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          error: 'MISSING_FILE_ID',
          message: '缺少文件ID',
          timestamp: new Date().toISOString()
        });
      }

      const result = await uploadService.deleteFile(fileId);

      if (!result.success) {
        return res.status(404).json({
          error: 'FILE_NOT_FOUND',
          message: '文件不存在',
          timestamp: new Date().toISOString()
        });
      }

      logger.user('删除文件', {
        fileId,
        deletedBy: req.user?.id || 'admin'
      });

      res.json({
        success: true,
        message: '文件删除成功',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('File deletion error:', err);
      res.status(500).json({
        error: 'DELETION_FAILED',
        message: '删除文件失败',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new UploadController();