const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Import middleware and controllers
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/upload');
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
  uploadMiddleware.array,
  validateFiles,
  uploadController.uploadFiles
);

router.get('/progress/:sessionId', uploadController.getProgress);

router.post('/cancel/:sessionId', uploadController.cancelUpload);

router.delete('/file/:fileId', authMiddleware.requireAuth, uploadController.deleteFile);

module.exports = router;