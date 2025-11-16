const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Import utilities
const logger = require('./utils/logger');
const config = require('./config/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 8005;

// Ensure upload directories exist
fs.ensureDirSync(path.join(__dirname, '../upload/personal'));
fs.ensureDirSync(path.join(__dirname, '../upload/scenic'));

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

// Multer error handling middleware
const { handleMulterError } = require('./middleware/upload');
app.use('/api/upload', handleMulterError);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: req.id || uuidv4()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: '请求的资源不存在',
    timestamp: new Date().toISOString()
  });
});

// WebSocket connections
io.on('connection', (socket) => {
  logger.dev('Client connected to WebSocket', { socketId: socket.id });

  socket.on('join-session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    logger.dev('Client joined session', { socketId: socket.id, sessionId });
  });

  socket.on('leave-session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    logger.dev('Client left session', { socketId: socket.id, sessionId });
  });

  socket.on('disconnect', () => {
    logger.dev('Client disconnected from WebSocket', { socketId: socket.id });
  });
});

// Make io available to routes
app.set('io', io);

// Initialize uploadService with io instance
const uploadService = require('./services/uploadService');
uploadService.setIO(io);

// Start server
server.listen(PORT, () => {
  logger.info(`Server started successfully on port ${PORT}`, {
    port: PORT,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });

  // User log for successful server start
  logger.user('视频上传服务已启动', {
    port: PORT,
    status: 'running',
    message: '服务已准备接收文件上传请求'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;