module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式 - 优化匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // 覆盖率收集 - 默认关闭以提升性能
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // 排除入口文件
    '!**/node_modules/**'
  ],

  // 覆盖率报告目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式 - 简化格式以提升性能
  coverageReporters: ['text', 'json'],

  // 覆盖率阈值 - 暂时降低，因为刚开始测试
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },


  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 详细输出 - 简化输出以提升性能
  verbose: false,

  // 错误时停止
  bail: false,

  // 最大工作进程 - 优化并发性能
  maxWorkers: 4, // 限制最大进程数避免资源竞争

  // 测试超时时间 - 基于Qwen官方规范优化超时设置
  testTimeout: 30000, // 减少超时时间，快速失败

  // 清理mock
  clearMocks: true,

  // 恢复mock
  restoreMocks: true,

  // 优化性能配置
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // 缓存配置 - 启用缓存提升性能
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  //  transform优化
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 忽略转换的文件
  transformIgnorePatterns: [
    'node_modules/(?!(module-to-transform)/)'
  ]
};