const AIService = require('../../src/services/aiService');

// Mock OpenAI 库，避免真实的API调用
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('AIService - analyzeVideoContent方法测试', () => {
  let aiService;
  let mockCompletion;

  beforeEach(() => {
    // 每个测试前重置环境
    jest.clearAllMocks();

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