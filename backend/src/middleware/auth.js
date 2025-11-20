const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// Simple authentication middleware with environment-controlled mock
const requireAuth = (req, res, next) => {
  // 允许在开发环境中跳过认证（通过环境变量控制）
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    logger.warn('认证已跳过 - 仅限开发环境使用');
    req.user = {
      id: 'dev-user',
      role: 'admin'
    };
    return next();
  }

  // 生产环境必须验证JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: '未提供认证令牌，请先登录',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // 验证JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = {
      id: decoded.userId || decoded.id,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    logger.error('Token验证失败:', error.message);
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: '认证令牌无效或已过期',
      timestamp: new Date().toISOString()
    });
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  // For development, allow all requests
  // In production, this would check if user has admin privileges

  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      error: 'INSUFFICIENT_PERMISSIONS',
      message: '权限不足',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  requireAuth,
  requireAdmin
};