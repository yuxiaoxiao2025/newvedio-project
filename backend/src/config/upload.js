const path = require('path');

const uploadConfig = {
  // Server configuration
  port: process.env.PORT || 8005,

  // File upload limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 300 * 1024 * 1024, // 300MB
  maxFilesPerSession: parseInt(process.env.MAX_FILES_PER_SESSION) || 3,

  // Allowed file types
  allowedMimeTypes: [
    'video/mp4',
    'video/avi',
    'video/x-msvideo'
  ],
  allowedExtensions: ['.mp4', '.avi'],

  // Upload directories
  uploadBaseDir: process.env.UPLOAD_BASE_DIR || path.join(__dirname, '../../upload'),

  // Category paths
  categoryPaths: {
    personal: '/backend/upload/personal/',
    scenic: '/backend/upload/scenic/'
  },

  // File naming
  generateFileName: (sessionId, originalName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${sessionId}_${timestamp}_${sanitizedName}`;
  },

  // Session management
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

  // Cleanup configuration
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  tempFileMaxAge: 60 * 60 * 1000, // 1 hour

  // Security
  maxRequestSize: '500mb',

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3005',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
};

module.exports = uploadConfig;