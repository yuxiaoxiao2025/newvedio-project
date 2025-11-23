const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Import middleware and controllers
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/upload');
const { uploadWithProgress, getProgress, cancelUpload, setIO } = require('../middleware/realtimeUpload');
const authMiddleware = require('../middleware/auth');

// File validation middleware
const validateFiles = (req, res, next) => {
  const files = req.files;
  const sessionId = req.body.sessionId;

  if (!files || files.length === 0) {
    return res.status(400).json({
      error: 'NO_FILES',
      message: '请选择要上传的文件',
      timestamp: new Date().toISOString()
    });
  }

  if (files.length > 3) {
    return res.status(400).json({
      error: 'TOO_MANY_FILES',
      message: '最多只能上传3个文件',
      timestamp: new Date().toISOString()
    });
  }

  if (!sessionId) {
    return res.status(400).json({
      error: 'NO_SESSION_ID',
      message: '缺少会话ID',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Routes
router.post('/validate', uploadController.validateFiles);

router.post('/session', uploadController.createSession);

router.post('/batch',
  uploadWithProgress(), // 使用新的实时进度上传中间件
  validateFiles,
  uploadController.uploadFiles
);

router.get('/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const progress = getProgress(sessionId);

  if (!progress) {
    return res.status(404).json({
      error: 'SESSION_NOT_FOUND',
      message: '上传会话不存在',
      timestamp: new Date().toISOString()
    });
  }

  res.json(progress);
});

router.post('/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const success = cancelUpload(sessionId);

  if (success) {
    res.json({
      success: true,
      message: '上传已取消',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      error: 'SESSION_NOT_FOUND',
      message: '上传会话不存在或已完成',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/file/:fileId', authMiddleware.requireAuth, uploadController.deleteFile);

// 导出设置IO的方法供app.js使用
module.exports = router;
module.exports.setIO = setIO;