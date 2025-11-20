// Jest测试环境设置文件 - 基于Qwen官方规范和webapp-testing最佳实践

// ============================================================================
// 关键：在任何模块加载前就mock setTimeout！
// 这是解决测试超时问题的核心修复
// ============================================================================

// Mock OpenAI 模块 - 在任何业务模块加载之前
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Mock Node.js timers模块 - 确保AI服务使用mock定时器
jest.mock('timers', () => ({
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn()
}));

// 基于验证成功经验的定时器mock策略
const mockSetTimeout = jest.fn().mockImplementation((callback, delay) => {
  // 在测试环境中立即执行回调，不等待真实延迟
  // 这解决了所有setTimeout相关的测试超时问题
  return callback();
});

const mockClearTimeout = jest.fn();
const mockSetInterval = jest.fn().mockImplementation(() => 12345);
const mockClearInterval = jest.fn();

// 在模块加载前设置全局定时器mock
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

// 设置测试超时时间 - 基于Qwen官方建议的合理超时
jest.setTimeout(30000);

// 测试专用的快速延迟函数（使用mock定时器）
global.testDelay = (ms = 1) => new Promise(resolve => global.setTimeout(resolve, ms));

// ============================================================================
// 环境变量和工具函数 - 在模块加载后设置
// ============================================================================

// 模拟环境变量
process.env.DASHSCOPE_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// 全局测试工具函数
global.testUtils = {
  /**
   * 创建模拟的视频分析数据
   */
  createMockVideoAnalysis: (duration = 120) => ({
    duration,
    keyframes: [
      { timestamp: 0, description: "开场场景" },
      { timestamp: Math.floor(duration / 2), description: "中段场景" },
      { timestamp: duration, description: "结尾场景" }
    ],
    scenes: [
      { type: "风景", start: 0, end: Math.floor(duration / 3) },
      { type: "人物", start: Math.floor(duration / 3), end: Math.floor(duration * 2 / 3) },
      { type: "风景", start: Math.floor(duration * 2 / 3), end: duration }
    ],
    objects: [
      { name: "天空", appearances: [0, 30] },
      { name: "地面", appearances: [0, duration] }
    ],
    actions: [
      { action: "静止", duration: Math.floor(duration / 2) },
      { action: "移动", duration: Math.floor(duration / 2) }
    ]
  }),

  /**
   * 创建模拟的OpenAI响应
   */
  createMockOpenAIResponse: (data) => ({
    choices: [
      {
        message: {
          content: JSON.stringify(data)
        }
      }
    ]
  })
};

// 控制台输出格式化 - 在文件末尾统一定义

// ============================================================================
// 测试清理 - 基于Jest最佳实践
// ============================================================================

// 在每个测试后清理mock和定时器
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  // 重置所有定时器mock调用计数
  mockSetTimeout.mockClear();
  mockClearTimeout.mockClear();
});

// ============================================================================
// 全局测试工具函数 - 基于Qwen官方测试规范
// ============================================================================

// 全局测试工具函数
global.testUtils = {
  /**
   * 创建模拟的视频分析数据
   */
  createMockVideoAnalysis: (duration = 120) => ({
    duration,
    keyframes: [
      { timestamp: 0, description: "开场场景" },
      { timestamp: Math.floor(duration / 2), description: "中段场景" },
      { timestamp: duration, description: "结尾场景" }
    ],
    scenes: [
      { type: "风景", start: 0, end: Math.floor(duration / 3) },
      { type: "人物", start: Math.floor(duration / 3), end: Math.floor(duration * 2 / 3) },
      { type: "风景", start: Math.floor(duration * 2 / 3), end: duration }
    ],
    objects: [
      { name: "天空", appearances: [0, 30] },
      { name: "地面", appearances: [0, duration] }
    ],
    actions: [
      { action: "静止", duration: Math.floor(duration / 2) },
      { action: "移动", duration: Math.floor(duration / 2) }
    ]
  }),

  /**
   * 创建模拟的OpenAI响应
   */
  createMockOpenAIResponse: (data) => ({
    choices: [
      {
        message: {
          content: JSON.stringify(data)
        }
      }
    ]
  }),

  /**
   * 获取定时器调用统计
   */
  getTimerStats: () => ({
    setTimeoutCalls: mockSetTimeout.mock.calls.length,
    clearTimeoutCalls: mockClearTimeout.mock.calls.length
  }),

  /**
   * 清理定时器调用历史
   */
  clearTimerStats: () => {
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
  }
};

// ============================================================================
// 控制台输出格式化 - 抑制测试期间的预期错误
// ============================================================================

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // 在测试期间抑制某些错误输出，但保留重要信息
  const message = args[0];
  if (typeof message === 'string' &&
      (message.includes('VL模型分析失败') ||
       message.includes('测试期间的预期错误') ||
       message.includes('AI服务调用失败'))) {
    return; // 抑制预期的错误输出
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // 在测试期间抑制重试相关的警告输出
  const message = args[0];
  if (typeof message === 'string' && message.includes('重试')) {
    return; // 抑制重试警告输出
  }
  originalConsoleWarn(...args);
};