const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/upload');
const logger = require('../utils/logger');

// Create temp directory for uploads
const tempDir = path.join(__dirname, '../../upload/temp');
fs.ensureDirSync(tempDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename for temp storage
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    const error = new Error('不支持的文件格式');
    error.code = 'INVALID_FILE_FORMAT';
    error.allowedFormats = config.allowedExtensions;
    return cb(error, false);
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('不支持的文件类型');
    error.code = 'INVALID_MIME_TYPE';
    error.allowedTypes = config.allowedMimeTypes;
    return cb(error, false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: config.maxFilesPerSession
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = '文件上传错误';
    let errorCode = 'UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `文件大小超过限制 (${config.maxFileSize / 1024 / 1024}MB)`;
        errorCode = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = `文件数量超过限制 (${config.maxFilesPerSession}个)`;
        errorCode = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        errorCode = 'UNEXPECTED_FILE';
        break;
    }

    return res.status(400).json({
      error: errorCode,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Custom validation errors
  if (error.code === 'INVALID_FILE_FORMAT') {
    return res.status(400).json({
      error: 'INVALID_FILE_FORMAT',
      message: error.message,
      allowedFormats: error.allowedFormats,
      timestamp: new Date().toISOString()
    });
  }

  if (error.code === 'INVALID_MIME_TYPE') {
    return res.status(400).json({
      error: 'INVALID_MIME_TYPE',
      message: error.message,
      allowedTypes: error.allowedTypes,
      timestamp: new Date().toISOString()
    });
  }

  next(error);
};

module.exports = {
  single: upload.single('file'),
  array: upload.array('files', config.maxFilesPerSession),
  handleMulterError
};