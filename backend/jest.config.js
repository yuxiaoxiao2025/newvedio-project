module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // 排除入口文件
    '!**/node_modules/**'
  ],

  // 覆盖率报告目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],

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

  // 详细输出
  verbose: true,

  // 错误时停止
  bail: false,

  // 最大工作进程
  maxWorkers: 1,

  // 测试超时时间
  testTimeout: 30000,

  // 清理mock
  clearMocks: true,

  // 恢复mock
  restoreMocks: true
};