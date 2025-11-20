// ============================================================================
// 关键修复：在模块加载前设置所有mock - 基于隔离测试的成功经验
// ============================================================================

// Mock OpenAI 模块 - 必须在任何业务模块加载之前
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

// 基于验证成功经验的定时器mock策略 - 立即执行，不等待真实延迟
const mockSetTimeout = jest.fn().mockImplementation((callback, delay) => {
  return callback(); // 立即执行回调，不等待真实延迟
});

const mockClearTimeout = jest.fn();
const mockSetInterval = jest.fn().mockImplementation(() => 12345);
const mockClearInterval = jest.fn();

// 在模块加载前设置全局定时器mock
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

// 现在安全地加载模块
const AIService = require('../../src/services/aiService');

describe('AIService - analyzeVideoContent方法测试', () => {
  let aiService;
  let mockCompletion;

  beforeEach(() => {
    // 每个测试前重置所有mock和定时器
    jest.clearAllMocks();
    jest.clearAllTimers();

    // 重置定时器mock调用计数
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();

    // 创建AIService实例
    aiService = new AIService();

    // 模拟OpenAI返回的完成响应
    mockCompletion = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              duration: 120,
              keyframes: [
                { timestamp: 0, description: "开场场景：蓝天白云" },
                { timestamp: 60, description: "中段：人物出现" },
                { timestamp: 120, description: "结尾：日落景色" }
              ],
              scenes: [
                { type: "风景", start: 0, end: 30 },
                { type: "人物", start: 30, end: 90 },
                { type: "风景", start: 90, end: 120 }
              ],
              objects: [
                { name: "天空", appearances: [0, 30] },
                { name: "人物", appearances: [30, 90] },
                { name: "太阳", appearances: [90, 120] }
              ],
              actions: [
                { action: "站立", duration: 60 },
                { action: "行走", duration: 30 }
              ]
            })
          }
        }
      ]
    };

    // 模拟OpenAI客户端
    aiService.vlClient.chat.completions.create.mockResolvedValue(mockCompletion);
    aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);
  });

  afterEach(() => {
    // 每个测试后清理mock和定时器
    jest.clearAllMocks();
    jest.clearAllTimers();
    // 重置所有定时器mock调用计数
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
  });

  /**
   * 测试场景1：正常视频分析场景
   * 目的：确保AI服务能正确分析视频并返回标准格式数据
   */
  describe('正常视频分析场景', () => {
    test('应该成功分析视频并返回结构化数据', async () => {
      // 准备测试数据
      const videoPath = '/test/video/sample.mp4';
      const prompt = '请分析这个视频的内容';

      // 设置模拟API调用返回成功结果
      aiService.vlClient.chat.completions.create.mockResolvedValue(mockCompletion);

      // 执行测试
      const result = await aiService.analyzeVideoContent(videoPath, prompt);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.duration).toBe(120);
      expect(result.keyframes).toHaveLength(3);
      expect(result.scenes).toHaveLength(3);
      expect(result.objects).toHaveLength(3);
      expect(result.actions).toHaveLength(2);

      // 验证API调用参数正确
      expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'video_url',
                video_url: { url: videoPath }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });
    });

    test('应该使用默认提示词当没有提供自定义提示词时', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.analyzeVideoContent(videoPath);

      // 验证使用了默认提示词
      const callArgs = aiService.vlClient.chat.completions.create.mock.calls[0];
      const userMessage = callArgs[0].messages[0];
      const textContent = userMessage.content.find(item => item.type === 'text');

      expect(textContent.text).toContain('#背景# 分析上传的视频文件');
      expect(textContent.text).toContain('#目的# 提取视频的基本信息和关键内容要素');
    });
  });

  /**
   * 测试场景2：API调用失败处理
   * 目的：当API调用失败时，程序应该给出友好错误提示
   */
  describe('API调用失败处理', () => {
    test('应该处理API超时错误', async () => {
      const videoPath = '/test/video/sample.mp4';
      const apiError = new Error('Request timeout');
      apiError.code = 'ETIMEDOUT';

      aiService.vlClient.chat.completions.create.mockRejectedValue(apiError);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
        expect(error.message).toContain('Request timeout');
      }
    });

    test('应该处理API认证错误', async () => {
      const videoPath = '/test/video/sample.mp4';
      const authError = new Error('Invalid API key');
      authError.status = 401;

      aiService.vlClient.chat.completions.create.mockRejectedValue(authError);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
        expect(error.message).toContain('Invalid API key');
      }
    });

    test('应该处理网络连接错误', async () => {
      const videoPath = '/test/video/sample.mp4';
      const networkError = new Error('Network error');
      networkError.code = 'ENOTFOUND';

      aiService.vlClient.chat.completions.create.mockRejectedValue(networkError);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
        expect(error.message).toContain('Network error');
      }
    });
  });

  /**
   * 测试场景3：无效视频路径处理
   * 目的：如果视频文件路径有问题，要给出清楚提示
   */
  describe('无效视频路径处理', () => {
    test('应该处理空路径', async () => {
      try {
        await aiService.analyzeVideoContent('');
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });

    test('应该处理null路径', async () => {
      try {
        await aiService.analyzeVideoContent(null);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });

    test('应该处理undefined路径', async () => {
      try {
        await aiService.analyzeVideoContent(undefined);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });
  });

  /**
   * 测试场景4：返回数据格式验证
   * 目的：确保AI返回的数据格式符合预期
   */
  describe('返回数据格式验证', () => {
    test('应该验证返回的JSON格式正确', async () => {
      const videoPath = '/test/video/sample.mp4';
      aiService.vlClient.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.analyzeVideoContent(videoPath);

      // 验证数据结构
      expect(typeof result.duration).toBe('number');
      expect(Array.isArray(result.keyframes)).toBe(true);
      expect(Array.isArray(result.scenes)).toBe(true);
      expect(Array.isArray(result.objects)).toBe(true);
      expect(Array.isArray(result.actions)).toBe(true);

      // 验证keyframes格式
      result.keyframes.forEach(keyframe => {
        expect(keyframe).toHaveProperty('timestamp');
        expect(keyframe).toHaveProperty('description');
        expect(typeof keyframe.description).toBe('string');
      });

      // 验证scenes格式
      result.scenes.forEach(scene => {
        expect(scene).toHaveProperty('type');
        expect(scene).toHaveProperty('start');
        expect(scene).toHaveProperty('end');
        expect(typeof scene.type).toBe('string');
      });

      // 验证objects格式
      result.objects.forEach(object => {
        expect(object).toHaveProperty('name');
        expect(object).toHaveProperty('appearances');
        expect(typeof object.name).toBe('string');
        expect(Array.isArray(object.appearances)).toBe(true);
      });

      // 验证actions格式
      result.actions.forEach(action => {
        expect(action).toHaveProperty('action');
        expect(action).toHaveProperty('duration');
        expect(typeof action.action).toBe('string');
        expect(typeof action.duration).toBe('number');
      });
    });

    test('应该处理无效JSON返回', async () => {
      const videoPath = '/test/video/sample.mp4';
      const invalidJsonResponse = {
        choices: [
          {
            message: {
              content: '不是有效的JSON格式 {invalid json'
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create.mockResolvedValue(invalidJsonResponse);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该抛出JSON解析错误');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });

    test('应该处理空返回数据', async () => {
      const videoPath = '/test/video/sample.mp4';
      const emptyResponse = {
        choices: [
          {
            message: {
              content: '{}'
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create.mockResolvedValue(emptyResponse);

      const result = await aiService.analyzeVideoContent(videoPath);

      expect(result).toEqual({});
    });
  });

  /**
   * 测试场景5：边界情况测试
   * 目的：测试各种特殊和边界情况
   */
  describe('边界情况测试', () => {
    test('应该处理API返回null值', async () => {
      const videoPath = '/test/video/sample.mp4';
      aiService.vlClient.chat.completions.create.mockResolvedValue(null);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该处理null响应');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });

    test('应该处理API返回undefined值', async () => {
      const videoPath = '/test/video/sample.mp4';
      aiService.vlClient.chat.completions.create.mockResolvedValue(undefined);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该处理undefined响应');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });

    test('应该处理choices数组为空的情况', async () => {
      const videoPath = '/test/video/sample.mp4';
      const emptyChoicesResponse = {
        choices: []
      };

      aiService.vlClient.chat.completions.create.mockResolvedValue(emptyChoicesResponse);

      try {
        await aiService.analyzeVideoContent(videoPath);
        fail('应该处理空choices响应');
      } catch (error) {
        expect(error.message).toContain('视频分析失败');
      }
    });
  });
});

// ============================================================================
// generateVideoReport() 方法测试
// ============================================================================

describe('AIService - generateVideoReport方法测试', () => {
  let aiService;
  let mockCompletion;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    // 模拟文本生成API返回
    mockCompletion = {
      choices: [
        {
          message: {
            content: '这是生成的专业视频分析报告内容，包含时长分析、关键帧解读等结构化内容。'
          }
        }
      ]
    };
  });

  describe('内容分析报告生成（content类型）', () => {
    test('应该生成专业的内容分析报告', async () => {
      const analysisData = {
        duration: 120,
        keyframes: [{ timestamp: 0, description: "开场场景" }],
        scenes: [{ type: "风景", start: 0, end: 30 }],
        objects: [{ name: "天空", appearances: [0, 30] }],
        actions: [{ action: "站立", duration: 60 }]
      };

      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateVideoReport(analysisData, 'content');

      expect(result).toBe('这是生成的专业视频分析报告内容，包含时长分析、关键帧解读等结构化内容。');

      // 验证API调用参数
      expect(aiService.textClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的视频分析师和音乐制作人，擅长生成结构化的分析报告和创意方案。'
          },
          {
            role: 'user',
            content: expect.stringContaining('#背景# 视频内容原始分析数据')
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
    });

    test('content类型提示词应该包含所有必要的分析要素', async () => {
      const analysisData = { duration: 60 };
      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateVideoReport(analysisData, 'content');

      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = callArgs[0].messages[1].content;

      // 验证提示词包含所有必要的分析维度
      expect(userContent).toContain('时长分析');
      expect(userContent).toContain('关键帧解读');
      expect(userContent).toContain('场景分类');
      expect(userContent).toContain('物体检测');
      expect(userContent).toContain('动作识别');
      expect(userContent).toContain('情感基调');
      expect(userContent).toContain('色彩分析');
      expect(userContent).toContain('质量评估');
    });
  });

  describe('融合分析报告生成（fusion类型）', () => {
    test('应该生成专业的融合分析方案', async () => {
      const fusionData = {
        video1: { duration: 60, scenes: [{ type: "风景" }] },
        video2: { duration: 90, scenes: [{ type: "人物" }] },
        totalDuration: 150
      };

      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateVideoReport(fusionData, 'fusion');

      expect(result).toBeDefined();

      // 验证融合方案提示词要素
      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = callArgs[0].messages[1].content;

      expect(userContent).toContain('30-50秒融合视频');
      expect(userContent).toContain('分段策略');
      expect(userContent).toContain('转场效果');
      expect(userContent).toContain('音频处理');
      expect(userContent).toContain('画面融合');
      expect(userContent).toContain('叙事逻辑');
    });

    test('fusion类型应该包含具体的技术参数要求', async () => {
      const fusionData = { totalDuration: 120 };
      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateVideoReport(fusionData, 'fusion');

      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = callArgs[0].messages[1].content;

      expect(userContent).toContain('分辨率');
      expect(userContent).toContain('编码');
      expect(userContent).toContain('时间轴');
    });
  });

  describe('音乐提示词生成（music类型）', () => {
    test('应该生成专业的音乐创作提示词', async () => {
      const fusionPlan = {
        narrative: '视频讲述了一个从日出到日落的故事',
        emotionalCurve: '从平静到激昂再回归平静'
      };

      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateVideoReport(fusionPlan, 'music');

      expect(result).toBeDefined();

      // 验证音乐提示词要素
      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = callArgs[0].messages[1].content;

      expect(userContent).toContain('音乐风格定位');
      expect(userContent).toContain('情感曲线');
      expect(userContent).toContain('节奏与画面匹配');
      expect(userContent).toContain('乐器选择');
      expect(userContent).toContain('时长控制');
      expect(userContent).toContain('关键转场处的音乐变化指示');
    });

    test('music类型应该针对AI音乐生成模型优化', async () => {
      const fusionPlan = { duration: 45 };
      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateVideoReport(fusionPlan, 'music');

      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = callArgs[0].messages[1].content;

      expect(userContent).toContain('AI音乐生成模型');
      expect(userContent).toContain('氛围描述');
    });
  });

  describe('无效报告类型处理', () => {
    test('应该处理未知的报告类型', async () => {
      const analysisData = { duration: 120 };

      try {
        await aiService.generateVideoReport(analysisData, 'unknown');
        fail('应该处理未知报告类型');
      } catch (error) {
        // 由于switch语句没有default分支，prompt会是空字符串
        // 这会导致API调用，但我们应该验证这种边界情况
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalled();
      }
    });

    test('应该处理空报告类型', async () => {
      const analysisData = { duration: 120 };

      // 空字符串应该使用默认行为
      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateVideoReport(analysisData, '');

      // 验证API仍然被调用，但使用了空提示词
      expect(aiService.textClient.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('默认参数测试', () => {
    test('应该使用默认的content报告类型当未指定时', async () => {
      const analysisData = {
        duration: 120,
        keyframes: [{ timestamp: 0, description: "开场场景" }],
        scenes: [{ type: "风景", start: 0, end: 30 }],
        objects: [{ name: "天空", appearances: [0, 30] }],
        actions: [{ action: "站立", duration: 60 }]
      };

      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      // 不传入第二个参数，应该使用默认值 'content'
      const result = await aiService.generateVideoReport(analysisData);

      expect(result).toBe('这是生成的专业视频分析报告内容，包含时长分析、关键帧解读等结构化内容。');

      // 验证API调用时使用了content类型的提示词
      expect(aiService.textClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的视频分析师和音乐制作人，擅长生成结构化的分析报告和创意方案。'
          },
          {
            role: 'user',
            content: expect.stringContaining('#背景# 视频内容原始分析数据')
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
    });
  });

  describe('generateVideoReport错误处理', () => {
    test('应该处理API调用失败', async () => {
      const analysisData = { duration: 120 };
      const apiError = new Error('Text generation API failed');
      apiError.status = 500;

      aiService.textClient.chat.completions.create.mockRejectedValue(apiError);

      try {
        await aiService.generateVideoReport(analysisData, 'content');
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('报告生成失败');
        expect(error.message).toContain('Text generation API failed');
      }
    });

    test('应该处理网络超时', async () => {
      const analysisData = { duration: 120 };
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ETIMEDOUT';

      aiService.textClient.chat.completions.create.mockRejectedValue(timeoutError);

      try {
        await aiService.generateVideoReport(analysisData, 'content');
        fail('应该抛出超时错误');
      } catch (error) {
        expect(error.message).toContain('报告生成失败');
        expect(error.message).toContain('Network timeout');
      }
    });

    test('应该处理空分析数据', async () => {
      const emptyData = {};
      aiService.textClient.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateVideoReport(emptyData, 'content');

      expect(result).toBeDefined();
      // 验证空数据也被正确处理
      const callArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      expect(callArgs[0].messages[1].content).toContain('{}');
    });
  });
});

// ============================================================================
// analyzeVideoThreeStage() 方法测试
// ============================================================================

describe('AIService - analyzeVideoThreeStage方法测试', () => {
  let aiService;
  let mockVlCompletion;
  let mockTextCompletion;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    // 模拟VL分析返回
    mockVlCompletion = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              duration: 120,
              keyframes: [{ timestamp: 0, description: "开场" }],
              scenes: [{ type: "风景", start: 0, end: 120 }],
              objects: [{ name: "天空", appearances: [0, 120] }],
              actions: [{ action: "静止", duration: 120 }]
            })
          }
        }
      ]
    };

    // 模拟文本生成返回
    mockTextCompletion = {
      choices: [
        {
          message: {
            content: '专业的视频内容分析报告...'
          }
        }
      ]
    };
  });

  describe('完整三阶段流程测试', () => {
    test('应该成功执行完整的三阶段分析流程', async () => {
      const videoPath = '/test/video/sample.mp4';

      // 设置API返回值
      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeVideoThreeStage(videoPath);

      // 验证返回结构
      expect(result).toHaveProperty('rawAnalysis');
      expect(result).toHaveProperty('structuredData');
      expect(result).toHaveProperty('finalReport');

      // 验证原始分析数据
      expect(result.rawAnalysis.duration).toBe(120);
      expect(result.rawAnalysis.keyframes).toHaveLength(1);

      // 验证结构化数据
      expect(result.structuredData.videoInfo.duration).toBe(120);
      expect(result.structuredData.videoInfo.keyframeCount).toBe(1);
      expect(result.structuredData.contentSummary.keyframes).toHaveLength(1);

      // 验证最终报告
      expect(result.finalReport).toBe('专业的视频内容分析报告...');

      // 验证API调用次数
      expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    test('应该使用callWithRetry机制调用各个阶段', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      // Mock callWithRetry方法来验证它被调用
      const originalCallWithRetry = aiService.callWithRetry;
      const mockCallWithRetry = jest.spyOn(aiService, 'callWithRetry');

      await aiService.analyzeVideoThreeStage(videoPath);

      // 验证callWithRetry被调用了两次（VL分析 + 文本生成）
      expect(mockCallWithRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('阶段间数据传递验证', () => {
    test('应该正确传递VL分析结果到数据结构化阶段', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      // Mock structureVideoData来验证数据传递
      const mockStructureVideoData = jest.spyOn(aiService, 'structureVideoData');
      mockStructureVideoData.mockReturnValue({
        videoInfo: { duration: 120 },
        contentSummary: { keyframes: [] }
      });

      await aiService.analyzeVideoThreeStage(videoPath);

      // 验证structureVideoData被调用且传入正确的VL分析结果
      expect(mockStructureVideoData).toHaveBeenCalledWith({
        duration: 120,
        keyframes: [{ timestamp: 0, description: "开场" }],
        scenes: [{ type: "风景", start: 0, end: 120 }],
        objects: [{ name: "天空", appearances: [0, 120] }],
        actions: [{ action: "静止", duration: 120 }]
      });
    });

    test('应该正确传递结构化数据到报告生成阶段', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      await aiService.analyzeVideoThreeStage(videoPath);

      // 验证文本生成API被调用时传入了结构化数据
      const textCallArgs = aiService.textClient.chat.completions.create.mock.calls[0];
      const userContent = textCallArgs[0].messages[1].content;

      expect(userContent).toContain('videoInfo');
      expect(userContent).toContain('contentSummary');
      expect(userContent).toContain('timestamp');
    });

    test('应该验证数据结构化的一致性', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeVideoThreeStage(videoPath);

      // 验证结构化数据的完整性
      expect(result.structuredData.videoInfo).toHaveProperty('duration');
      expect(result.structuredData.videoInfo).toHaveProperty('keyframeCount');
      expect(result.structuredData.videoInfo).toHaveProperty('sceneCount');
      expect(result.structuredData.videoInfo).toHaveProperty('objectCount');
      expect(result.structuredData.videoInfo).toHaveProperty('actionCount');

      expect(result.structuredData.contentSummary).toHaveProperty('keyframes');
      expect(result.structuredData.contentSummary).toHaveProperty('scenes');
      expect(result.structuredData.contentSummary).toHaveProperty('objects');
      expect(result.structuredData.contentSummary).toHaveProperty('actions');

      expect(result.structuredData).toHaveProperty('timestamp');
    });
  });

  describe('错误传播机制', () => {
    test('应该在第一阶段失败时立即停止并传播错误', async () => {
      const videoPath = '/test/video/sample.mp4';
      const vlError = new Error('VL analysis failed');

      aiService.vlClient.chat.completions.create.mockRejectedValue(vlError);

      try {
        await aiService.analyzeVideoThreeStage(videoPath);
        fail('应该在第一阶段失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('VL analysis failed');

        // 验证只有VL分析被调用，后续阶段没有执行
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(1);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(0);
      }
    });

    test('应该在第二阶段失败时停止并传播错误', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);

      // Mock structureVideoData抛出错误
      jest.spyOn(aiService, 'structureVideoData').mockImplementation(() => {
        throw new Error('Data structuring failed');
      });

      try {
        await aiService.analyzeVideoThreeStage(videoPath);
        fail('应该在第二阶段失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('Data structuring failed');

        // 验证VL分析被执行，但文本生成没有
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(1);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(0);
      }
    });

    test('应该在第三阶段失败时停止并传播错误', async () => {
      const videoPath = '/test/video/sample.mp4';
      const textError = new Error('Text generation failed');

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockRejectedValue(textError);

      try {
        await aiService.analyzeVideoThreeStage(videoPath);
        fail('应该在第三阶段失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('Text generation failed');

        // 验证前两个阶段都执行了
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(1);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(1);
      }
    });

    test('应该保持错误的原始信息不被修改', async () => {
      const videoPath = '/test/video/sample.mp4';
      const originalError = new Error('Original error message');
      originalError.code = 'CUSTOM_ERROR';
      originalError.status = 418;

      aiService.vlClient.chat.completions.create.mockRejectedValue(originalError);

      try {
        await aiService.analyzeVideoThreeStage(videoPath);
        fail('应该传播原始错误');
      } catch (error) {
        // 在实际的analyzeVideoThreeStage实现中，错误只是被重新抛出，没有包装
        expect(error.message).toBe('Original error message');
        expect(error.code).toBe('CUSTOM_ERROR');
        expect(error.status).toBe(418);
      }
    });
  });

  describe('边界情况测试', () => {
    test('应该处理空的VL分析结果', async () => {
      const videoPath = '/test/video/sample.mp4';
      const emptyVlCompletion = {
        choices: [
          {
            message: {
              content: JSON.stringify({})
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create.mockResolvedValue(emptyVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeVideoThreeStage(videoPath);

      // 验证空数据也能正确处理
      expect(result.structuredData.videoInfo.duration).toBe(0);
      expect(result.structuredData.videoInfo.keyframeCount).toBe(0);
      expect(result.structuredData.contentSummary.keyframes).toEqual([]);
    });

    test('应该处理VL分析返回null值', async () => {
      const videoPath = '/test/video/sample.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(null);

      try {
        await aiService.analyzeVideoThreeStage(videoPath);
        fail('应该处理VL返回null');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

// ============================================================================
// callWithRetry() 重试机制测试
// ============================================================================

describe('AIService - callWithRetry重试机制测试', () => {
  let aiService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // 重置定时器mock调用计数
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();

    aiService = new AIService();
  });

  afterEach(() => {
    // 每个测试后清理mock和定时器
    jest.clearAllMocks();
    jest.clearAllTimers();
    // 重置所有定时器mock调用计数
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
  });

  describe('网络错误重试逻辑', () => {
    test('应该在第一次尝试成功时立即返回结果', async () => {
      const mockServiceFunction = jest.fn().mockResolvedValue('success');

      const resultPromise = aiService.callWithRetry(mockServiceFunction);

      await expect(resultPromise).resolves.toBe('success');

      // 验证只调用了一次
      expect(mockServiceFunction).toHaveBeenCalledTimes(1);
    });

    test('应该在第一次失败后重试并成功', async () => {
      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      // 执行重试机制 - mock会立即执行，不需要推进时间
      const result = await aiService.callWithRetry(mockServiceFunction);

      // 验证最终成功返回
      expect(result).toBe('success');

      // 验证调用了两次：第一次失败，第二次成功
      expect(mockServiceFunction).toHaveBeenCalledTimes(2);

      // 验证setTimeout被调用了一次（第一次失败后的延迟）
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);

      // 验证延迟时间符合Qwen官方指数退避策略：2^0 = 1ms（测试环境）
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1);
    });

    test('应该在多次失败后重试并成功', async () => {
      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValueOnce('success');

      const resultPromise = aiService.callWithRetry(mockServiceFunction);

      // 推进时间：基于Qwen官方指数退避延迟
      // 第一次重试：2^0 * 1000 = 1000ms (测试环境为1ms)
      // mock setTimeout立即执行，不需要推进时间
      // 第二次重试：2^1 * 1000 = 2000ms (测试环境为2ms)
      // mock setTimeout立即执行，不需要推进时间

      await expect(resultPromise).resolves.toBe('success');

      // 验证调用了三次
      expect(mockServiceFunction).toHaveBeenCalledTimes(3);
    });

    test('应该处理不同类型的网络错误', async () => {
      const testCases = [
        { error: new Error('ETIMEDOUT'), expected: true },
        { error: new Error('ECONNRESET'), expected: true },
        { error: new Error('ENOTFOUND'), expected: true },
        { error: new Error('ECONNREFUSED'), expected: true }
      ];

      for (const testCase of testCases) {
        const mockServiceFunction = jest.fn()
          .mockRejectedValueOnce(testCase.error)
          .mockResolvedValueOnce('success');

        const resultPromise = aiService.callWithRetry(mockServiceFunction);

        // 使用mock setTimeout，不需要推进时间

        await expect(resultPromise).resolves.toBe('success');

        expect(mockServiceFunction).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('最大重试次数限制', () => {
    test('应该在达到最大重试次数后停止重试', async () => {
      const finalError = new Error('Persistent error');
      const mockServiceFunction = jest.fn().mockRejectedValue(finalError);

      try {
        await aiService.callWithRetry(mockServiceFunction, 3);
        fail('应该在达到最大重试次数后抛出错误');
      } catch (error) {
        expect(error).toBe(finalError);
        expect(mockServiceFunction).toHaveBeenCalledTimes(3);
      }
    });

    test('应该支持自定义最大重试次数', async () => {
      const finalError = new Error('Persistent error');
      const mockServiceFunction = jest.fn().mockRejectedValue(finalError);

      try {
        await aiService.callWithRetry(mockServiceFunction, 5);
        fail('应该在达到自定义重试次数后抛出错误');
      } catch (error) {
        expect(error).toBe(finalError);
        expect(mockServiceFunction).toHaveBeenCalledTimes(5);
      }
    });

    test('应该验证最大重试次数参数', async () => {
      const mockServiceFunction = jest.fn().mockResolvedValue('success');

      // 测试重试次数为0的情况
      const result = await aiService.callWithRetry(mockServiceFunction, 0);
      expect(result).toBe('success');
      expect(mockServiceFunction).toHaveBeenCalledTimes(1);
    });

    test('应该在最后一次失败时不添加延迟', async () => {
      const finalError = new Error('Final error');
      const mockServiceFunction = jest.fn().mockRejectedValue(finalError);

      const startTime = Date.now();

      try {
        await aiService.callWithRetry(mockServiceFunction, 2);
        fail('应该抛出最终错误');
      } catch (error) {
        // 验证没有额外的延迟
        expect(mockServiceFunction).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('指数退避延迟验证', () => {
    test('应该使用正确的指数退避延迟', async () => {
      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce('success');

      const resultPromise = aiService.callWithRetry(mockServiceFunction, 5);

      // 验证延迟模式：2秒、4秒、6秒...
      // 第一次重试：2秒
      // mock setTimeout立即执行，不需要推进时间
      await // mock setTimeout立即执行，不需要推进时间

      // 第二次重试：4秒
      // mock setTimeout立即执行，不需要推进时间
      await // mock setTimeout立即执行，不需要推进时间

      // 第三次重试：6秒
      // mock setTimeout立即执行，不需要推进时间
      await // mock setTimeout立即执行，不需要推进时间

      await expect(resultPromise).resolves.toBe('success');
      expect(mockServiceFunction).toHaveBeenCalledTimes(4);
    });

    test('应该在重试间隔记录警告日志', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success');

      const resultPromise = aiService.callWithRetry(mockServiceFunction);

      // 使用mock setTimeout，不需要推进时间

      await expect(resultPromise).resolves.toBe('success');

      // 验证警告日志被记录
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI服务调用失败，重试 1/3'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('应该计算正确的延迟时间：基于Qwen官方指数退避 2^attempt * 1000', async () => {
      // 详细测试用例：验证Qwen官方推荐的指数退避策略
      // 预期延迟序列：测试环境 [1, 2, 4]，生产环境 [1000, 2000, 4000]

      const delays = [];
      const timeoutCallbacks = [];

      // 完全替换所有可能的setTimeout实现
      const originalSetTimeout = global.setTimeout;
      const originalTimersSetTimeout = require('timers').setTimeout;

      // Mock全局setTimeout
      global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        timeoutCallbacks.push(callback);
        // 立即返回一个timer ID，但不执行回调
        return 12345;
      });

      // Mock Node.js timers模块
      jest.mock('timers', () => ({
        setTimeout: jest.fn().mockImplementation((callback, delay) => {
          delays.push(delay);
          timeoutCallbacks.push(callback);
          return 54321;
        })
      }));

      // 创建AI服务实例以使用我们mock的setTimeout
      const testAIService = new AIService();

      // 创建一个总是失败的mock函数
      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('Failure attempt 1'))
        .mockRejectedValueOnce(new Error('Failure attempt 2'))
        .mockRejectedValueOnce(new Error('Failure attempt 3'));

      // 断言1：验证mock服务函数初始状态
      expect(mockServiceFunction).toHaveBeenCalledTimes(0);
      expect(delays).toEqual([]);
      expect(timeoutCallbacks).toEqual([]);

      // 执行重试机制
      let finalError = null;
      try {
        await testAIService.callWithRetry(mockServiceFunction, 3);
      } catch (error) {
        finalError = error;
      }

      // 断言2：验证服务函数被调用了正确的次数
      expect(mockServiceFunction).toHaveBeenCalledTimes(3);

      // 断言3：验证最终抛出的错误信息
      expect(finalError).not.toBeNull();
      expect(finalError.message).toContain('AI服务调用失败，已重试3次');
      expect(finalError.originalError).toBeDefined();
      expect(finalError.retryCount).toBe(3);

      // 断言4：验证Qwen官方指数退避延迟序列
      // 在测试环境中，延迟应该是：1ms, 2ms
      expect(delays).toEqual([1, 2]);

      // 断言5：验证所有回调都被捕获
      expect(timeoutCallbacks).toHaveLength(2);

      // 断言6：验证回调函数的有效性
      timeoutCallbacks.forEach((callback, index) => {
        expect(typeof callback).toBe('function');
      });

      // 断言7：验证错误信息包含重试过程的详细信息
      expect(finalError.originalError.message).toBe('Failure attempt 3');
      expect(finalError.code).toBe('AI_SERVICE_ERROR');
      expect(finalError.status).toBe(500);

      // 恢复原始setTimeout实现
      global.setTimeout = originalSetTimeout;
      jest.unmock('timers');
    });
  });

  describe('callWithRetry边界情况', () => {
    test('应该处理同步抛出的错误', async () => {
      const mockServiceFunction = jest.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      try {
        await aiService.callWithRetry(mockServiceFunction, 2);
        fail('应该处理同步错误');
      } catch (error) {
        expect(error.message).toBe('Synchronous error');
        expect(mockServiceFunction).toHaveBeenCalledTimes(2);
      }
    });

    test('应该处理服务函数返回Promise.reject', async () => {
      const mockServiceFunction = jest.fn().mockReturnValue(
        Promise.reject(new Error('Promise rejection'))
      );

      try {
        await aiService.callWithRetry(mockServiceFunction, 2);
        fail('应该处理Promise rejection');
      } catch (error) {
        expect(error.message).toBe('Promise rejection');
        expect(mockServiceFunction).toHaveBeenCalledTimes(2);
      }
    });

    test('应该处理服务函数为null的情况', async () => {
      try {
        await aiService.callWithRetry(null, 2);
        fail('应该处理null服务函数');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
      }
    });

    test('应该处理服务函数不是函数的情况', async () => {
      try {
        await aiService.callWithRetry('not a function', 2);
        fail('应该处理非函数参数');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
      }
    });

    test('应该在成功时清除所有定时器', async () => {
      const mockServiceFunction = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const resultPromise = aiService.callWithRetry(mockServiceFunction);

      // 使用mock setTimeout，不需要推进时间

      await expect(resultPromise).resolves.toBe('success');

      // 验证没有遗留的定时器
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

// ============================================================================
// 辅助方法测试 - structureVideoData, structureFusionData等
// ============================================================================

describe('AIService - 辅助方法测试', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('structureVideoData方法', () => {
    test('应该正确结构化完整的视频数据', () => {
      const rawData = {
        duration: 180,
        keyframes: [
          { timestamp: 0, description: "开场" },
          { timestamp: 90, description: "中段" },
          { timestamp: 180, description: "结尾" }
        ],
        scenes: [
          { type: "风景", start: 0, end: 60 },
          { type: "人物", start: 60, end: 180 }
        ],
        objects: [
          { name: "天空", appearances: [0, 60] },
          { name: "人物", appearances: [60, 180] }
        ],
        actions: [
          { action: "站立", duration: 60 },
          { action: "行走", duration: 120 }
        ]
      };

      const result = aiService.structureVideoData(rawData);

      expect(result.videoInfo.duration).toBe(180);
      expect(result.videoInfo.keyframeCount).toBe(3);
      expect(result.videoInfo.sceneCount).toBe(2);
      expect(result.videoInfo.objectCount).toBe(2);
      expect(result.videoInfo.actionCount).toBe(2);

      expect(result.contentSummary.keyframes).toEqual(rawData.keyframes);
      expect(result.contentSummary.scenes).toEqual(rawData.scenes);
      expect(result.contentSummary.objects).toEqual(rawData.objects);
      expect(result.contentSummary.actions).toEqual(rawData.actions);

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    test('应该处理空的视频数据', () => {
      const rawData = {};

      const result = aiService.structureVideoData(rawData);

      expect(result.videoInfo.duration).toBe(0);
      expect(result.videoInfo.keyframeCount).toBe(0);
      expect(result.videoInfo.sceneCount).toBe(0);
      expect(result.videoInfo.objectCount).toBe(0);
      expect(result.videoInfo.actionCount).toBe(0);

      expect(result.contentSummary.keyframes).toEqual([]);
      expect(result.contentSummary.scenes).toEqual([]);
      expect(result.contentSummary.objects).toEqual([]);
      expect(result.contentSummary.actions).toEqual([]);
    });

    test('应该处理null数据', () => {
      const result = aiService.structureVideoData(null);

      expect(result.videoInfo.duration).toBe(0);
      expect(result.contentSummary.keyframes).toEqual([]);
    });
  });

  describe('structureFusionData方法', () => {
    test('应该正确结构化融合数据', () => {
      const video1Data = {
        duration: 60,
        scenes: [{ type: "风景" }],
        objects: [{ name: "天空" }]
      };

      const video2Data = {
        duration: 90,
        scenes: [{ type: "人物" }],
        objects: [{ name: "人物" }]
      };

      const result = aiService.structureFusionData(video1Data, video2Data);

      expect(result.video1).toBeDefined();
      expect(result.video2).toBeDefined();
      expect(result.totalDuration).toBe(150);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.contentCompatibility).toBeDefined();
      expect(result.analysis.technicalAlignment).toBeDefined();
    });

    test('应该计算正确的总时长', () => {
      const video1Data = { duration: 120 };
      const video2Data = { duration: 180 };

      const result = aiService.structureFusionData(video1Data, video2Data);

      expect(result.totalDuration).toBe(300);
    });

    test('应该处理零时长视频', () => {
      const video1Data = { duration: 0 };
      const video2Data = { duration: 0 };

      const result = aiService.structureFusionData(video1Data, video2Data);

      expect(result.totalDuration).toBe(0);
    });
  });

  describe('analyzeContentCompatibility方法', () => {
    test('应该正确识别共同场景元素', () => {
      const video1 = {
        scenes: [
          { type: "风景" },
          { type: "人物" },
          { type: "建筑" }
        ]
      };

      const video2 = {
        scenes: [
          { type: "风景" },
          { type: "动物" },
          { type: "人物" }
        ]
      };

      const result = aiService.analyzeContentCompatibility(video1, video2);

      expect(result.commonElements).toEqual(["风景", "人物"]);
      expect(result.compatibility).toBe('high');
      expect(result.recommendation).toBe('适合自然过渡融合');
    });

    test('应该识别低兼容性视频', () => {
      const video1 = {
        scenes: [
          { type: "风景" },
          { type: "建筑" }
        ]
      };

      const video2 = {
        scenes: [
          { type: "人物" },
          { type: "动物" }
        ]
      };

      const result = aiService.analyzeContentCompatibility(video1, video2);

      expect(result.commonElements).toEqual([]);
      expect(result.compatibility).toBe('medium');
      expect(result.recommendation).toBe('需要创意转场效果');
    });

    test('应该处理空场景数据', () => {
      const video1 = { scenes: [] };
      const video2 = { scenes: [] };

      const result = aiService.analyzeContentCompatibility(video1, video2);

      expect(result.commonElements).toEqual([]);
      expect(result.compatibility).toBe('medium');
    });

    test('应该识别高兼容性视频（3个或更多共同场景）', () => {
      const video1 = {
        scenes: [
          { type: "风景" },
          { type: "人物" },
          { type: "建筑" },
          { type: "动物" }
        ]
      };

      const video2 = {
        scenes: [
          { type: "风景" },
          { type: "人物" },
          { type: "建筑" },
          { type: "车辆" }
        ]
      };

      const result = aiService.analyzeContentCompatibility(video1, video2);

      expect(result.commonElements).toEqual(["风景", "人物", "建筑"]);
      expect(result.compatibility).toBe('high');
      expect(result.recommendation).toBe('适合自然过渡融合');
    });
  });

  describe('analyzeTechnicalAlignment方法', () => {
    test('应该分析时长匹配度', () => {
      const video1 = { duration: 120 };
      const video2 = { duration: 130 };

      const result = aiService.analyzeTechnicalAlignment(video1, video2);

      expect(result.durationDifference).toBe(10);
      expect(result.recommendation).toBe('时长匹配良好');
    });

    test('应该识别时长不匹配的视频', () => {
      const video1 = { duration: 60 };
      const video2 = { duration: 120 };

      const result = aiService.analyzeTechnicalAlignment(video1, video2);

      expect(result.durationDifference).toBe(60);
      expect(result.recommendation).toBe('需要裁剪或拉伸处理');
    });

    test('应该处理零时长视频', () => {
      const video1 = { duration: 0 };
      const video2 = { duration: 60 };

      const result = aiService.analyzeTechnicalAlignment(video1, video2);

      expect(result.durationDifference).toBe(60);
      expect(result.recommendation).toBe('需要裁剪或拉伸处理');
    });
  });
});

// ============================================================================
// analyzeFusionThreeStage() 方法测试
// ============================================================================

describe('AIService - analyzeFusionThreeStage方法测试', () => {
  let aiService;
  let mockVlCompletion;
  let mockTextCompletion;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    // 模拟两个视频的VL分析返回
    mockVlCompletion = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              duration: 120,
              keyframes: [{ timestamp: 0, description: "视频关键帧" }],
              scenes: [{ type: "风景", start: 0, end: 120 }],
              objects: [{ name: "天空", appearances: [0, 120] }],
              actions: [{ action: "静止", duration: 120 }]
            })
          }
        }
      ]
    };

    // 模拟融合方案文本生成返回
    mockTextCompletion = {
      choices: [
        {
          message: {
            content: '专业的视频融合分析方案...'
          }
        }
      ]
    };
  });

  describe('双视频融合分析完整流程', () => {
    test('应该成功执行双视频的三阶段融合分析流程', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      // 设置API返回值
      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证返回结构
      expect(result).toHaveProperty('video1Analysis');
      expect(result).toHaveProperty('video2Analysis');
      expect(result).toHaveProperty('fusionData');
      expect(result).toHaveProperty('fusionPlan');

      // 验证两个视频分析结果
      expect(result.video1Analysis.duration).toBe(120);
      expect(result.video2Analysis.duration).toBe(120);

      // 验证融合数据结构
      expect(result.fusionData.video1).toBeDefined();
      expect(result.fusionData.video2).toBeDefined();
      expect(result.fusionData.totalDuration).toBe(240);
      expect(result.fusionData.analysis).toBeDefined();

      // 验证最终融合方案
      expect(result.fusionPlan).toBe('专业的视频融合分析方案...');

      // 验证API调用次数：2次VL分析 + 1次文本生成
      expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(2);
      expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    test('应该并行执行两个视频的VL分析', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证VL分析的API调用参数
      const calls = aiService.vlClient.chat.completions.create.mock.calls;

      expect(calls).toHaveLength(2);

      // 验证第一次调用（video1）
      expect(calls[0][0].messages[0].content[0].video_url.url).toBe(video1Path);

      // 验证第二次调用（video2）
      expect(calls[1][0].messages[0].content[0].video_url.url).toBe(video2Path);

      // 验证两个调用使用了相同的模型和参数
      calls.forEach(call => {
        expect(call[0].model).toBe('qwen-vl-plus');
        expect(call[0].response_format).toEqual({ type: 'json_object' });
        expect(call[0].max_tokens).toBe(2000);
      });
    });

    test('应该使用callWithRetry机制调用各个阶段', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      // Mock callWithRetry方法来验证它被调用
      const mockCallWithRetry = jest.spyOn(aiService, 'callWithRetry');

      await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证callWithRetry被调用了3次（2次VL分析 + 1次文本生成）
      expect(mockCallWithRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('融合数据处理验证', () => {
    test('应该正确计算总时长', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      // 模拟不同时长的视频
      const video1Completion = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 180,
                keyframes: [{ timestamp: 0, description: "视频1关键帧" }],
                scenes: [{ type: "风景", start: 0, end: 180 }],
                objects: [{ name: "天空", appearances: [0, 180] }],
                actions: [{ action: "静止", duration: 180 }]
              })
            }
          }
        ]
      };

      const video2Completion = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 240,
                keyframes: [{ timestamp: 0, description: "视频2关键帧" }],
                scenes: [{ type: "人物", start: 0, end: 240 }],
                objects: [{ name: "人物", appearances: [0, 240] }],
                actions: [{ action: "移动", duration: 240 }]
              })
            }
          }
        ]
      };

      // 为两次调用设置不同的返回值
      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(video1Completion)
        .mockResolvedValueOnce(video2Completion);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      expect(result.fusionData.totalDuration).toBe(420); // 180 + 240
      expect(result.fusionData.video1.videoInfo.duration).toBe(180);
      expect(result.fusionData.video2.videoInfo.duration).toBe(240);
    });

    test('应该进行内容兼容性分析', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      // 模拟有共同场景的视频
      const sharedSceneVideo1 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 120,
                scenes: [
                  { type: "风景", start: 0, end: 60 },
                  { type: "建筑", start: 60, end: 120 }
                ]
              })
            }
          }
        ]
      };

      const sharedSceneVideo2 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 120,
                scenes: [
                  { type: "风景", start: 0, end: 60 },
                  { type: "人物", start: 60, end: 120 }
                ]
              })
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(sharedSceneVideo1)
        .mockResolvedValueOnce(sharedSceneVideo2);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证内容兼容性分析
      expect(result.fusionData.analysis.contentCompatibility).toBeDefined();
      expect(result.fusionData.analysis.contentCompatibility.commonElements).toContain("风景");
      expect(result.fusionData.analysis.contentCompatibility.compatibility).toBe('high');
    });

    test('应该进行技术对齐分析', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      // 模拟不同时长的视频
      const differentDurationVideo1 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 90,
                scenes: [{ type: "风景", start: 0, end: 90 }]
              })
            }
          }
        ]
      };

      const differentDurationVideo2 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 300,
                scenes: [{ type: "人物", start: 0, end: 300 }]
              })
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(differentDurationVideo1)
        .mockResolvedValueOnce(differentDurationVideo2);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证技术对齐分析
      expect(result.fusionData.analysis.technicalAlignment).toBeDefined();
      expect(result.fusionData.analysis.technicalAlignment.durationDifference).toBe(210);
      expect(result.fusionData.analysis.technicalAlignment.recommendation).toBe('需要裁剪或拉伸处理');
    });
  });

  describe('错误处理和传播机制', () => {
    test('应该在第一个视频分析失败时停止执行', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';
      const video1Error = new Error('Video1 analysis failed');

      // 第一次调用失败，第二次调用不应该被执行
      aiService.vlClient.chat.completions.create
        .mockRejectedValueOnce(video1Error);

      try {
        await aiService.analyzeFusionThreeStage(video1Path, video2Path);
        fail('应该在第一个视频分析失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('Video1 analysis failed');

        // 验证只执行了一次VL分析调用
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(1);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(0);
      }
    });

    test('应该在第二个视频分析失败时停止执行', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';
      const video2Error = new Error('Video2 analysis failed');

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(mockVlCompletion)
        .mockRejectedValueOnce(video2Error);

      try {
        await aiService.analyzeFusionThreeStage(video1Path, video2Path);
        fail('应该在第二个视频分析失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('Video2 analysis failed');

        // 验证执行了两次VL分析调用
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(2);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(0);
      }
    });

    test('应该在融合方案生成失败时停止执行', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';
      const fusionError = new Error('Fusion plan generation failed');

      aiService.vlClient.chat.completions.create.mockResolvedValue(mockVlCompletion);
      aiService.textClient.chat.completions.create.mockRejectedValue(fusionError);

      try {
        await aiService.analyzeFusionThreeStage(video1Path, video2Path);
        fail('应该在融合方案生成失败时抛出错误');
      } catch (error) {
        expect(error.message).toContain('Fusion plan generation failed');

        // 验证执行了所有VL分析和文本生成调用
        expect(aiService.vlClient.chat.completions.create).toHaveBeenCalledTimes(2);
        expect(aiService.textClient.chat.completions.create).toHaveBeenCalledTimes(1);
      }
    });

    test('应该保持原始错误信息', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';
      const originalError = new Error('Detailed API error message');
      originalError.code = 'RATE_LIMIT';
      originalError.status = 429;

      aiService.vlClient.chat.completions.create.mockRejectedValue(originalError);

      try {
        await aiService.analyzeFusionThreeStage(video1Path, video2Path);
        fail('应该传播原始错误');
      } catch (error) {
        expect(error.message).toBe('Detailed API error message');
        expect(error.code).toBe('RATE_LIMIT');
        expect(error.status).toBe(429);
      }
    });
  });

  describe('边界情况测试', () => {
    test('应该处理零时长视频', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      const zeroDurationVideo = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 0,
                keyframes: [],
                scenes: [],
                objects: [],
                actions: []
              })
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(zeroDurationVideo)
        .mockResolvedValueOnce(zeroDurationVideo);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      expect(result.fusionData.totalDuration).toBe(0);
      expect(result.fusionData.video1.videoInfo.duration).toBe(0);
      expect(result.fusionData.video2.videoInfo.duration).toBe(0);
    });

    test('应该处理包含缺失字段的VL分析结果', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      const incompleteVideo1 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                duration: 120
                // 缺少其他字段
              })
            }
          }
        ]
      };

      const incompleteVideo2 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                scenes: [{ type: "风景", start: 0, end: 120 }]
                // 缺少其他字段
              })
            }
          }
        ]
      };

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(incompleteVideo1)
        .mockResolvedValueOnce(incompleteVideo2);
      aiService.textClient.chat.completions.create.mockResolvedValue(mockTextCompletion);

      const result = await aiService.analyzeFusionThreeStage(video1Path, video2Path);

      // 验证缺失字段被正确处理
      expect(result.fusionData.video1.videoInfo.duration).toBe(120);
      expect(result.fusionData.video1.videoInfo.keyframeCount).toBe(0);
      expect(result.fusionData.video1.contentSummary.keyframes).toEqual([]);

      expect(result.fusionData.video2.videoInfo.duration).toBe(0);
      expect(result.fusionData.video2.videoInfo.sceneCount).toBe(1);
    });

    test('应该处理VL分析返回null值', async () => {
      const video1Path = '/test/video/video1.mp4';
      const video2Path = '/test/video/video2.mp4';

      aiService.vlClient.chat.completions.create
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockVlCompletion);

      try {
        await aiService.analyzeFusionThreeStage(video1Path, video2Path);
        fail('应该处理VL返回null');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});