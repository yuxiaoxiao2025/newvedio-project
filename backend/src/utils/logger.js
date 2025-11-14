const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

// Ensure logs directory exists
fs.ensureDirSync(path.join(__dirname, '../../logs'));

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Add user log method for end-user friendly messages
logger.user = (message, meta = {}) => {
  logger.info(message, {
    ...meta,
    type: 'user_log',
    timestamp: new Date().toISOString()
  });
};

// Add developer log method for technical debugging
logger.dev = (message, meta = {}) => {
  logger.debug(message, {
    ...meta,
    type: 'developer_log',
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;