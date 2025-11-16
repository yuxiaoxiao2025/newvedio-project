const OpenAI = require('openai');

/**
 * AI服务 - 双模型协同架构
 * qwen3-vl: 视频理解分析
 * qwen-plus: 文本生成和报告创作
 */
class AIService {
  constructor() {
    this.vlClient = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    this.textClient = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }

  /**
   * qwen3-VL模型 - 视频内容分析
   */
  async analyzeVideoContent(videoPath, prompt = null) {
    try {
      const defaultPrompt = `#背景# 分析上传的视频文件
#目的# 提取视频的基本信息和关键内容要素
#任务步骤# 1. 识别视频时长 2. 提取关键帧 3. 分析场景变化 4. 检测主要物体 5. 识别动作序列
#输出# JSON格式：{duration: 秒, keyframes: [时间戳, 描述], scenes: [类型, 时间段], objects: [名称, 出现时间], actions: [动作, 时间段]}`;

      const completion = await this.vlClient.chat.completions.create({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'video_url',
                video_url: {
                  url: videoPath
                }
              },
              {
                type: 'text',
                text: prompt || defaultPrompt
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('VL模型分析失败:', error);
      throw new Error(`视频分析失败: ${error.message}`);
    }
  }

  /**
   * qwen-plus模型 - 文本生成（报告创作）
   */
  async generateVideoReport(analysisData, reportType = 'content') {
    try {
      let prompt = '';

      switch (reportType) {
        case 'content':
          prompt = `#背景# 视频内容原始分析数据：${JSON.stringify(analysisData)}
#目的# 生成专业的视频内容分析报告
#风格# 专业视频分析师，数据驱动，客观准确
#受众# 视频制作专业人士
#输出# 结构化报告，包含：时长分析、关键帧解读、场景分类、物体检测、动作识别、情感基调、色彩分析、质量评估
#任务步骤#
1. 分析视频时长特征和节奏
2. 详细解读每个关键帧的视觉元素
3. 对场景进行专业分类和分析
4. 列出检测到的物体及其意义
5. 分析动作序列的逻辑性
6. 评估整体情感基调
7. 分析色彩分布和视觉效果
8. 综合评估画面质量`;
          break;

        case 'fusion':
          prompt = `#背景# 视频融合分析数据：${JSON.stringify(analysisData)}
#目的# 设计30-50秒融合视频的完整制作方案
#风格# 专业视频剪辑师，注重叙事逻辑和视觉效果
#受众# 视频制作团队
#输出# 详细融合方案，包含：
1. 最优分段策略（精确到秒级时间戳）
2. 关键画面裁剪建议（构图、焦点）
3. 转场效果选择（3种以上方案）
4. 音频处理建议（音量、音效）
5. 画面融合技术参数（分辨率、编码）
6. 整体叙事逻辑说明
7. 时间轴可视化图表描述`;
          break;

        case 'music':
          prompt = `#背景# 视频融合方案：${JSON.stringify(analysisData)}
#目的# 生成专业级背景音乐创作提示词
#风格# 音乐制作人和影视配乐专家
#受众# AI音乐生成模型
#输出# 详细音乐创作提示词，包含：
1. 音乐风格定位（基于视频情感基调）
2. 情感曲线设计（随时间变化的情绪变化）
3. 节奏与画面匹配方案（具体时间点的节奏要求）
4. 乐器选择建议（适合场景和情感的乐器组合）
5. 时长控制参数（与视频精确匹配）
6. 关键转场处的音乐变化指示
7. 整体氛围描述（营造的听觉环境）`;
          break;
      }

      const completion = await this.textClient.chat.completions.create({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的视频分析师和音乐制作人，擅长生成结构化的分析报告和创意方案。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('文本生成失败:', error);
      throw new Error(`报告生成失败: ${error.message}`);
    }
  }

  /**
   * 三阶段处理流程：视频内容分析
   */
  async analyzeVideoThreeStage(videoPath) {
    try {
      // 阶段1: VL模型视频理解
      const vlAnalysis = await this.callWithRetry(() =>
        this.analyzeVideoContent(videoPath)
      );

      // 阶段2: 数据转换和结构化
      const structuredData = this.structureVideoData(vlAnalysis);

      // 阶段3: qwen-plus生成专业报告
      const finalReport = await this.callWithRetry(() =>
        this.generateVideoReport(structuredData, 'content')
      );

      return {
        rawAnalysis: vlAnalysis,
        structuredData,
        finalReport
      };
    } catch (error) {
      console.error('三阶段视频分析失败:', error);
      throw error;
    }
  }

  /**
   * 三阶段处理流程：视频融合分析
   */
  async analyzeFusionThreeStage(video1Path, video2Path) {
    try {
      // 阶段1: 双视频VL分析
      const [video1Analysis, video2Analysis] = await Promise.all([
        this.callWithRetry(() => this.analyzeVideoContent(video1Path)),
        this.callWithRetry(() => this.analyzeVideoContent(video2Path))
      ]);

      // 阶段2: 数据整合和结构化
      const fusionData = this.structureFusionData(video1Analysis, video2Analysis);

      // 阶段3: qwen-plus生成融合方案
      const fusionPlan = await this.callWithRetry(() =>
        this.generateVideoReport(fusionData, 'fusion')
      );

      return {
        video1Analysis,
        video2Analysis,
        fusionData,
        fusionPlan
      };
    } catch (error) {
      console.error('三阶段融合分析失败:', error);
      throw error;
    }
  }

  /**
   * 数据结构化处理
   */
  structureVideoData(rawData) {
    return {
      videoInfo: {
        duration: rawData.duration || 0,
        keyframeCount: rawData.keyframes?.length || 0,
        sceneCount: rawData.scenes?.length || 0,
        objectCount: rawData.objects?.length || 0,
        actionCount: rawData.actions?.length || 0
      },
      contentSummary: {
        keyframes: rawData.keyframes || [],
        scenes: rawData.scenes || [],
        objects: rawData.objects || [],
        actions: rawData.actions || []
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 融合数据结构化
   */
  structureFusionData(video1Data, video2Data) {
    return {
      video1: this.structureVideoData(video1Data),
      video2: this.structureVideoData(video2Data),
      totalDuration: (video1Data.duration || 0) + (video2Data.duration || 0),
      analysis: {
        contentCompatibility: this.analyzeContentCompatibility(video1Data, video2Data),
        technicalAlignment: this.analyzeTechnicalAlignment(video1Data, video2Data)
      }
    };
  }

  /**
   * 内容兼容性分析
   */
  analyzeContentCompatibility(video1, video2) {
    const scenes1 = video1.scenes?.map(s => s.type) || [];
    const scenes2 = video2.scenes?.map(s => s.type) || [];
    const commonScenes = scenes1.filter(s => scenes2.includes(s));

    return {
      commonElements: commonScenes,
      compatibility: commonScenes.length > 0 ? 'high' : 'medium',
      recommendation: commonScenes.length > 2 ? '适合自然过渡融合' : '需要创意转场效果'
    };
  }

  /**
   * 技术对齐分析
   */
  analyzeTechnicalAlignment(video1, video2) {
    const duration1 = video1.duration || 0;
    const duration2 = video2.duration || 0;
    const durationDiff = Math.abs(duration1 - duration2);

    return {
      durationDifference: durationDiff,
      aspectRatioAlignment: 'unknown', // 需要更详细分析
      recommendation: durationDiff < 30 ? '时长匹配良好' : '需要裁剪或拉伸处理'
    };
  }

  /**
   * 带重试机制的AI服务调用
   */
  async callWithRetry(serviceFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await serviceFunction();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        console.warn(`AI服务调用失败，重试 ${i + 1}/${maxRetries}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
}

module.exports = AIService;