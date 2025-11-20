// Jest测试环境设置文件

// 设置测试超时时间
jest.setTimeout(30000);

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

// 控制台输出格式化
const originalConsoleError = console.error;
console.error = (...args) => {
  // 在测试期间抑制某些错误输出，但保留重要信息
  const message = args[0];
  if (typeof message === 'string' &&
      (message.includes('VL模型分析失败') ||
       message.includes('测试期间的预期错误'))) {
    return; // 抑制预期的错误输出
  }
  originalConsoleError(...args);
};

// 测试清理
afterEach(() => {
  jest.clearAllMocks();
});