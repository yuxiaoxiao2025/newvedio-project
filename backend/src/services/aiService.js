const axios = require('axios');

/**
 * AI服务 - 双模型协同架构 (全面使用DashScope原生API)
 * qwen3-vl: 视频理解分析
 * qwen-plus: 文本生成和报告创作
 */
class AIService {
  constructor() {
    // 问题2修复: 验证API密钥是否存在
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error(
        'DASHSCOPE_API_KEY环境变量未设置。请在.env文件中配置: DASHSCOPE_API_KEY=your-api-key'
      );
    }

    // 统一使用DashScope原生API
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1';
    this.timeout = 120000; // 120秒超时
  }

  /**
   * qwen3-VL模型 - 使用DashScope原生API进行视频内容分析
   * 修复: 使用正确的DashScope API格式处理视频
   */
  async analyzeVideoContent(videoPath, prompt = null) {
    try {
      // 验证视频URL有效性
      if (!videoPath || typeof videoPath !== 'string') {
        throw new Error('无效的视频路径');
      }

      const defaultPrompt = `请分析这个视频文件，提供详细的内容分析。

请按以下JSON格式输出结果：
{
  "duration": 视频时长（秒），
  "resolution": "视频分辨率",
  "frameRate": 帧率,
  "keyframes": [
    {
      "timestamp": 时间戳（秒）,
      "description": "该时间点的画面描述",
      "importance": "重要程度（high/medium/low）"
    }
  ],
  "scenes": [
    {
      "type": "场景类型",
      "startTime": 开始时间,
      "endTime": 结束时间,
      "description": "场景描述",
      "atmosphere": "氛围描述"
    }
  ],
  "objects": [
    {
      "name": "物体或人物名称",
      "confidence": 置信度（0-1）,
      "first_seen": 首次出现时间,
      "duration": 出现时长
    }
  ],
  "actions": [
    {
      "action": "动作描述",
      "startTime": 开始时间,
      "endTime": 结束时间,
      "participants": "参与对象"
    }
  ],
  "visual_analysis": {
    "color_palette": ["主要色彩"],
    "lighting": "光线状况描述",
    "composition": "构图特点",
    "movement": "运动特征"
  },
  "quality_assessment": {
    "sharpness": 清晰度评分（1-10）,
    "stability": 稳定性评分（1-10）,
    "exposure": 曝光评估,
    "overall_quality": 整体质量评分（1-10）
  },
  "emotional_tone": "情感基调描述",
  "content_summary": "视频内容概要"
}`;

      console.log('开始视频分析，视频路径:', videoPath);

      // 修复: 使用DashScope原生API格式进行视频分析
      const requestData = {
        model: 'qwen3-vl-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一名专业的视频分析师，具有深厚的视觉分析和内容解读能力。请用JSON格式返回分析结果。'
            },
            {
              role: 'user',
              content: [
                // 修复: DashScope原生格式的content应该是对象数组，每个对象包含一种模态
                ...(videoPath.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  ? [{ image: videoPath }]
                  : [{ video: videoPath }]
                ),
                { text: prompt || defaultPrompt }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 4000,
          temperature: 0.2
        }
      };

      const response = await axios.post(
        `${this.baseURL}/services/aigc/multimodal-generation/generation`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      // 修复: 处理DashScope原生API的响应格式
      if (response.status !== 200) {
        throw new Error(`DashScope API调用失败: ${response.status} - ${response.data?.message || '未知错误'}`);
      }

      const responseData = response.data;
      if (responseData.output?.choices?.length > 0) {
        const messageContent = responseData.output.choices[0].message.content;

        // DashScope原生API返回的content可能是数组格式
        let content = '';
        if (Array.isArray(messageContent)) {
          // 如果是数组，提取text内容并拼接
          content = messageContent
            .filter(item => item.text)
            .map(item => item.text)
            .join('');
        } else if (typeof messageContent === 'string') {
          // 如果是字符串，直接使用
          content = messageContent;
        } else {
          throw new Error(`不支持的content格式: ${typeof messageContent}`);
        }

        console.log('AI返回内容:', content.substring(0, 200) + '...');

        try {
          const result = JSON.parse(content);
          console.log('视频分析成功完成');
          return result;
        } catch (parseError) {
          console.error('AI返回内容JSON解析失败:', {
            content: content,
            error: parseError.message
          });

          // 如果JSON解析失败，尝试返回原始内容作为基础结果
          return {
            duration: 0,
            resolution: "unknown",
            frameRate: 0,
            keyframes: [],
            scenes: [],
            objects: [],
            actions: [],
            visual_analysis: {
              color_palette: [],
              lighting: "unknown",
              composition: "unknown",
              movement: "unknown"
            },
            quality_assessment: {
              sharpness: 5,
              stability: 5,
              exposure: "unknown",
              overall_quality: 5
            },
            emotional_tone: "neutral",
            content_summary: typeof content === 'string' ? content.substring(0, 500) : '无法解析的内容',
            parse_error: true
          };
        }
      } else {
        throw new Error(`DashScope API返回格式异常: ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.error('VL模型分析失败:', error);
      throw new Error(`视频分析失败: ${error.message}`);
    }
  }

  /**
   * qwen-plus模型 - 使用DashScope原生API进行文本生成（报告创作）
   */
  async generateVideoReport(analysisData, reportType = 'content', stream = false) {
    try {
      let prompt = '';

      switch (reportType) {
        case 'content':
          prompt = `请基于以下视频内容分析数据，生成全面的视频内容分析报告：

分析数据：${JSON.stringify(analysisData)}

请按照以下结构生成详细的分析报告：

## 视频基本信息
- 视频时长分析和节奏评估
- 技术参数解读（分辨率、帧率等）

## 关键帧深度解读
- 每个关键帧的视觉元素分析
- 构图和美学价值评估
- 重要程度分级说明

## 场景专业分析
- 场景类型分类和特征
- 场景转换逻辑
- 空间关系和氛围营造

## 内容要素识别
- 物体检测和意义解读
- 动作序列分析
- 人物行为分析

## 情感与美学评估
- 情感基调和变化曲线
- 色彩构成和视觉效果
- 画面质量专业评估

## 内容价值评估
- 内容完整性评估
- 视觉冲击力评分
- 传播价值分析

## 专业建议
- 改进建议
- 应用场景推荐
- 优化方向`;
          break;

        case 'fusion':
          prompt = `你是一位经验丰富的专业视频剪辑师和后期制作专家，拥有10年以上的视频制作经验。你擅长将不同风格和内容的视频进行完美融合，注重叙事逻辑和视觉效果的统一。

请基于以下视频融合分析数据，设计一个30-50秒的专业级融合视频制作方案：

分析数据：${JSON.stringify(analysisData)}

请按照以下结构提供详细的融合方案：

# 融合策略概述
- 目标时长：30-50秒
- 整体风格定位：根据视频内容确定
- 核心叙事主题：明确的主题方向
- 主要融合挑战：技术或内容层面的挑战
- 创新解决方案：具体的解决思路

# 智能分段策略
## 视频A优化分段
1. 开场片段（0-X秒）：内容描述及保留理由
2. 核心片段（X-Y秒）：关键内容分析
3. 高潮片段（Y-Z秒）：精华部分选择
4. 每段的优化建议：技术处理方案

## 视频B互补分段
1. 衔接片段（A段后）：内容配合分析
2. 发展片段：与A段的呼应关系
3. 收尾片段：整体效果的完善
4. 时间节点精确到秒级

# 融合时间轴设计
## 详细时间轴图表
0-10秒：开场引入（建议使用视频A的开场）
10-25秒：情节发展（两视频的交替展示）
25-40秒：高潮部分（最佳画面组合）
40-50秒：完美收尾（情感升华）

## 内容分配比例
- 视频A：XX%（突出其优势内容）
- 视频B：XX%（补充其独特元素）
- 转场处理：XX%（时间分配）

# 视觉效果统一
## 画面处理方案
- 分辨率标准化：统一到1920x1080
- 色彩校正：两视频的色彩匹配
- 构图调整：画面的构图优化
- 质量提升：清晰度和细节增强

## 转场效果设计
1. 淡入淡出转场：用于温和过渡
2. 快速切换转场：增强节奏感
3. 溶解转场：画面的自然融合
4. 每种转场的具体参数设置

# 音频处理方案
## 音频统一处理
- 音量平衡：两视频音量的协调
- 淡入淡出：自然的声音过渡
- 环境音处理：背景音的保留和调整
- 音效增强：必要音效的添加

# 技术参数配置
## 输出标准
- 编码格式：H.264 high profile
- 比特率：8-12 Mbps
- 帧率：30fps统一
- 色彩空间：sRGB
- 音频：AAC 192kbps

# 制作流程规划
1. 素材准备：5分钟（格式检查和预处理）
2. 粗剪制作：10分钟（按时间轴分段）
3. 精细调整：15分钟（画面和音质优化）
4. 转场添加：8分钟（转场效果制作）
5. 最终渲染：12分钟（输出成片）

# 质量控制
- 技术指标：分辨率、帧率、编码质量
- 视觉效果：色彩一致性、画面稳定性
- 音频质量：音量平衡、清晰度
- 整体体验：观赏流畅度和感染力

请确保方案具有实用性和可操作性，每个建议都要具体可行。`;
          break;

        case 'music':
          prompt = `你是一位专业的影视配乐家和音乐制作人，拥有丰富的影视配乐经验和深厚的音乐理论知识。你精通各种音乐风格，特别擅长为视频内容创作情感丰富、节奏恰当的背景音乐。

请基于以下视频融合方案，生成专业级的AI音乐创作提示词：

融合方案：${JSON.stringify(analysisData)}

请按照以下要求生成详细的音乐创作提示词：

# 音乐创作概要
**目标时长**: 45秒（根据视频融合方案确定）
**核心情感**: 根据视频内容确定主要情感基调
**音乐风格**: 选择最适合视频氛围的风格
**适用场景**: 明确音乐的播放场景

# 情感曲线设计
## 开头部分 (0-10秒)
- **情绪起点**: 具体情绪状态，如平静引入、渐强开始
- **音量级别**: 具体的音量描述，如 medium-low
- **主要乐器**: 开场使用的主要乐器，如钢琴、弦乐
- **节奏特征**: 节奏描述，如缓慢稳定、中等速度

## 发展部分 (10-30秒)
- **情绪演进**: 如何推进情绪，如逐渐上升、保持稳定
- **音量调整**: 音量变化，如渐强、保持一致
- **乐器叠加**: 新增的乐器和层次，如鼓点加入、合成器铺垫
- **节奏变化**: 节奏的调整，如加快、加强、保持

## 收尾部分 (30-45秒)
- **情绪归宿**: 结尾情绪，如渐弱收束、高潮结束
- **音量处理**: 收尾的音量处理，如淡出、突然停止
- **乐器退出**: 乐器退出顺序，如弦乐先退、钢琴最后
- **节奏放缓**: 结尾的节奏处理

# 乐器配置详情
## 主要乐器
1. **主奏乐器**: 乐器名称 - 具体作用和表现效果
2. **辅助乐器**: 乐器名称 - 与主奏的配合方式

## 和声层次
1. **基础和声**: 和声乐器 - 和声进行方式
2. **丰富和声**: 其他和声乐器 - 增加的层次感

## 节奏元素
1. **基础节奏**: 鼓点类型 - 节奏模式描述
2. **辅助节奏**: 其他节奏元素 - 复杂度描述

## 音效元素
1. **环境音效**: 音效类型 - 使用时机
2. **特殊效果**: 特效音 - 具体应用位置

# 技术参数设定
## 基础参数
- **速度**: BPM范围，如80-120 BPM的具体数值
- **调性**: 建议调性，如C大调、A小调等
- **拍号**: 拍号，如4/4拍、3/4拍等
- **音色特征**: 整体音色描述，如温暖、明亮等

## 音效处理
- **混响**: 混响效果描述，如空间感大小
- **均衡**: EQ调整建议
- **压缩**: 动态处理建议

# 风格融合策略
## 主导风格 (70%)
- **风格**: 主要音乐风格，如Cinematic、Ambient等
- **特征**: 该风格的典型特征
- **应用**: 在45秒中的主要应用段落

## 辅助风格 (30%)
- **风格**: 辅助音乐风格，如Electronic、Classical等
- **特征**: 该风格的特点
- **应用**: 与主导风格的融合方式

# AI音乐生成专用提示
## 综合提示词
请生成一个45秒的[主要情感]背景音乐，风格为[主导风格]融合[辅助风格]。音乐以[主要乐器]为主奏，配以[和声乐器]的和声层次。节奏为[BPM范围]，整体采用[调性]。情绪从[开头情绪]开始，中段逐步推进至[中段情绪]，最后以[结尾情绪]收尾。适合用作[使用场景]的背景音乐，营造[整体氛围]的感觉。

## 分段详细提示
### 第一段 (0-15秒)
详细的15秒音乐描述，包括乐器、情绪、节奏等具体要求

### 第二段 (15-30秒)
详细的15秒音乐描述，强调情绪的发展和乐器变化

### 第三段 (30-45秒)
详细的15秒音乐描述，描述高潮和收尾的处理

# 质量标准要求
- **音质品质**: 高清无损，专业制作水准
- **连贯流畅**: 段落间过渡自然，无明显断层
- **画面契合**: 与视频画面节奏和情绪完美匹配
- **情感感染**: 具有强烈的情感共鸣能力
- **原创独特**: 体现原创性和独特性，避免模板化

请确保提示词具体、可执行，能够直接用于AI音乐生成工具。`;
          break;
      }

      // 使用DashScope原生API进行文本生成
      const requestData = {
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位专业的视频分析师和音乐制作人，具有丰富的行业经验和深厚的专业知识。你擅长生成结构化的分析报告、创意方案和技术指导。你的回答总是准确、详细、实用，并且具有专业的洞察力。'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.8,
          repetition_penalty: 1.1, // DashScope使用repetition_penalty而不是frequency/presence penalty
          stream: stream
        }
      };

      console.log('开始文本生成，类型:', reportType);

      if (stream) {
        // 流式响应处理
        const response = await axios.post(
          `${this.baseURL}/services/aigc/text-generation/generation`,
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: this.timeout,
            responseType: 'stream'
          }
        );

        let fullContent = '';

        return new Promise((resolve, reject) => {
          response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  resolve(fullContent);
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.output?.choices?.[0]?.message?.content;
                  if (content) {
                    fullContent += content;
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          });

          response.data.on('error', (error) => {
            reject(error);
          });

          response.data.on('end', () => {
            resolve(fullContent);
          });
        });
      } else {
        // 标准异步处理
        const response = await axios.post(
          `${this.baseURL}/services/aigc/text-generation/generation`,
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: this.timeout
          }
        );

        if (response.status !== 200) {
          throw new Error(`DashScope文本生成API调用失败: ${response.status} - ${response.data?.message || '未知错误'}`);
        }

        const responseData = response.data;
        if (responseData.output?.choices?.length > 0) {
          const content = responseData.output.choices[0].message.content;
          console.log('文本生成成功完成，长度:', content.length);
          return content;
        } else {
          throw new Error(`DashScope文本生成API返回格式异常: ${JSON.stringify(responseData)}`);
        }
      }
    } catch (error) {
      console.error('文本生成失败:', error);
      throw new Error(`报告生成失败: ${error.message}`);
    }
  }

  /**
   * 三阶段处理流程：视频内容分析
   * 问题12修复: 增加WebSocket实时进度推送
   */
  async analyzeVideoThreeStage(videoPath, io = null, sessionId = null) {
    try {
      // 阶段1: VL模型视频理解
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 1,
          progress: 10,
          message: '开始视频理解分析...',
          timestamp: new Date().toISOString()
        });
      }

      let vlAnalysis;
      try {
        vlAnalysis = await this.callWithRetry(() => this.analyzeVideoContent(videoPath));
      } catch (e) {
        if (this.isExternalAIError(e)) {
          vlAnalysis = {};
        } else {
          throw e;
        }
      }

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 1,
          progress: 40,
          message: '视频理解完成',
          timestamp: new Date().toISOString()
        });
      }

      // 阶段2: 数据转换和结构化
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 2,
          progress: 50,
          message: '数据结构化处理中...',
          timestamp: new Date().toISOString()
        });
      }

      const structuredData = this.structureVideoData(vlAnalysis);

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 2,
          progress: 60,
          message: '数据结构化完成',
          timestamp: new Date().toISOString()
        });
      }

      // 阶段3: qwen-plus生成专业报告
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 3,
          progress: 70,
          message: '生成分析报告...',
          timestamp: new Date().toISOString()
        });
      }

      let finalReport;
      try {
        finalReport = await this.callWithRetry(() => this.generateVideoReport(structuredData, 'content'));
      } catch (e) {
        if (this.isExternalAIError(e)) {
          finalReport = JSON.stringify({
            summary: '本地降级生成的内容分析报告',
            videoInfo: structuredData.videoInfo,
            notes: '外部AI服务不可用，已使用降级策略生成概要'
          });
        } else {
          throw e;
        }
      }

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 3,
          progress: 100,
          message: '分析完成',
          timestamp: new Date().toISOString()
        });
      }

      return {
        rawAnalysis: vlAnalysis,
        structuredData,
        finalReport
      };
    } catch (error) {
      console.error('三阶段视频分析失败:', error);
      
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:error', {
          message: '分析失败: ' + error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  /**
   * 三阶段处理流程：视频融合分析
   * 问题12修复: 增加WebSocket实时进度推送
   */
  async analyzeFusionThreeStage(video1Path, video2Path, io = null, sessionId = null) {
    try {
      // 阶段1: 双视频VL分析
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 1,
          progress: 10,
          message: '开始分析两个视频...',
          timestamp: new Date().toISOString()
        });
      }

      let video1Analysis;
      let video2Analysis;
      try {
        video1Analysis = await this.callWithRetry(() => this.analyzeVideoContent(video1Path));
      } catch (e) {
        if (this.isExternalAIError(e)) {
          video1Analysis = {};
        } else {
          throw e;
        }
      }
      try {
        video2Analysis = await this.callWithRetry(() => this.analyzeVideoContent(video2Path));
      } catch (e) {
        if (this.isExternalAIError(e)) {
          video2Analysis = {};
        } else {
          throw e;
        }
      }

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 1,
          progress: 40,
          message: '视频理解完成',
          timestamp: new Date().toISOString()
        });
      }

      // 阶段2: 数据整合和结构化
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 2,
          progress: 50,
          message: '融合数据处理中...',
          timestamp: new Date().toISOString()
        });
      }

      const fusionData = this.structureFusionData(video1Analysis, video2Analysis);

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 2,
          progress: 60,
          message: '数据融合完成',
          timestamp: new Date().toISOString()
        });
      }

      // 阶段3: qwen-plus生成融合方案
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 3,
          progress: 70,
          message: '生成融合方案...',
          timestamp: new Date().toISOString()
        });
      }

      let fusionPlan;
      try {
        fusionPlan = await this.callWithRetry(() => this.generateVideoReport(fusionData, 'fusion'));
      } catch (e) {
        if (this.isExternalAIError(e)) {
          fusionPlan = JSON.stringify({
            summary: '本地降级生成的融合方案',
            totalDuration: fusionData.totalDuration,
            notes: '外部AI服务不可用，已使用降级策略生成概要'
          });
        } else {
          throw e;
        }
      }

      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:progress', {
          stage: 3,
          progress: 100,
          message: '融合分析完成',
          timestamp: new Date().toISOString()
        });
      }

      return {
        video1Analysis,
        video2Analysis,
        fusionData,
        fusionPlan
      };
    } catch (error) {
      console.error('三阶段融合分析失败:', error);
      
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('analysis:error', {
          message: '融合分析失败: ' + error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  /**
   * 数据结构化处理
   */
  structureVideoData(rawData) {
    // 输入验证 - 处理null、undefined和无效数据
    if (!rawData || typeof rawData !== 'object') {
      console.warn('structureVideoData: 无效的rawData，使用默认值');
      rawData = {};
    }

    // 安全访问嵌套属性
    const safeGet = (obj, path, defaultValue = []) => {
      try {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            return defaultValue;
          }
        }
        return result || defaultValue;
      } catch (error) {
        console.warn(`structureVideoData: 访问路径 ${path} 时出错:`, error.message);
        return defaultValue;
      }
    };

    // 安全获取数组长度
    const safeLength = (arr) => {
      if (Array.isArray(arr)) return arr.length;
      if (arr && typeof arr === 'object' && typeof arr.length === 'number') return arr.length;
      return 0;
    };

    // 安全获取时长 - 处理null情况
    const duration = rawData && typeof rawData.duration === 'number' && rawData.duration >= 0 ? rawData.duration : 0;

    return {
      videoInfo: {
        duration: duration,
        keyframeCount: safeLength(safeGet(rawData, 'keyframes')),
        sceneCount: safeLength(safeGet(rawData, 'scenes')),
        objectCount: safeLength(safeGet(rawData, 'objects')),
        actionCount: safeLength(safeGet(rawData, 'actions'))
      },
      contentSummary: {
        keyframes: safeGet(rawData, 'keyframes'),
        scenes: safeGet(rawData, 'scenes'),
        objects: safeGet(rawData, 'objects'),
        actions: safeGet(rawData, 'actions')
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
    // 输入验证
    if (!video1 || !video2) {
      return {
        commonElements: [],
        compatibility: 'low',
        recommendation: '缺少视频数据，无法分析兼容性'
      };
    }

    // 安全提取场景类型
    const extractSceneTypes = (video) => {
      try {
        if (!video.scenes || !Array.isArray(video.scenes)) return [];
        return video.scenes
          .filter(scene => scene && typeof scene === 'object' && scene.type)
          .map(scene => scene.type);
      } catch (error) {
        console.warn('analyzeContentCompatibility: 提取场景类型时出错:', error.message);
        return [];
      }
    };

    const scenes1 = extractSceneTypes(video1);
    const scenes2 = extractSceneTypes(video2);
    const commonScenes = scenes1.filter(s => scenes2.includes(s));

    // 兼容性评估逻辑 - 修复边界逻辑
    let compatibility = 'low';
    let recommendation = '内容差异较大，需要创意转场效果';

    if (commonScenes.length >= 2) {
      compatibility = 'high';
      recommendation = '适合自然过渡融合';
    } else if (commonScenes.length === 1) {
      compatibility = 'medium';
      recommendation = '可通过转场效果实现融合';
    }

    return {
      commonElements: commonScenes,
      compatibility,
      recommendation
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
   * 带重试机制的AI服务调用 - 基于Qwen官方推荐的重试机制
   * 遵循官方文档中的指数退避策略：wait_time = 2 ^ attempt
   */
  async callWithRetry(serviceFunction, maxRetries = 3) {
    // 输入验证
    if (typeof serviceFunction !== 'function') {
      throw new Error('serviceFunction must be a function');
    }

    // 确保setTimeout在测试环境中可用 - 修复setTimeout undefined错误
    const setTimeout = (() => {
      // 优先级：global.setTimeout > globalThis.setTimeout > Node.js timers
      if (typeof global !== 'undefined' && global.setTimeout) {
        return global.setTimeout;
      }
      if (typeof globalThis !== 'undefined' && globalThis.setTimeout) {
        return globalThis.setTimeout;
      }
      try {
        return require('timers').setTimeout;
      } catch (e) {
        // 最后的fallback - 使用原生setTimeout
        return setTimeout;
      }
    })();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await serviceFunction();
      } catch (error) {
        // 最后一次重试失败，抛出错误
        if (attempt === maxRetries - 1) {
          // 丰富错误信息，保留原始错误的所有属性
          const enhancedError = new Error(`AI服务调用失败，已重试${maxRetries}次: ${error.message}`);
          enhancedError.originalError = error;
          enhancedError.retryCount = maxRetries;
          enhancedError.code = error.code || 'AI_SERVICE_ERROR';
          enhancedError.status = error.status || 500;
          throw enhancedError;
        }

        // 问题8修复: 优化速率限制处理
        let delay;
        if (error.status === 429) {
          // 处理429速率限制错误
          const retryAfter = error.headers?.['retry-after'] || error.headers?.['Retry-After'];
          if (retryAfter) {
            // 如果有Retry-After头，使用其指定的时间
            delay = parseInt(retryAfter) * 1000;
            console.warn(`触发AI服务速率限制，将在${retryAfter}秒后重试`);
          } else {
            // 没有Retry-After头，使用更长的退避时间
            delay = Math.pow(2, attempt + 2) * 1000; // 4秒、8秒、16秒
            console.warn(`触发AI服务速率限制，将在${delay / 1000}秒后重试`);
          }
        } else {
          // 其他错误使用标准指数退避
          delay = process.env.NODE_ENV === 'test' ? 1 : Math.pow(2, attempt) * 1000;
        }

        // 记录重试信息
        console.warn(`AI服务调用失败，重试 ${attempt + 1}/${maxRetries}:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          retryAttempt: attempt + 1,
          delaySeconds: delay / 1000
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  isExternalAIError(error) {
    const s = error && (error.status || error.httpStatus);
    const c = error && error.code;
    if (s && [429, 500, 502, 503, 504].includes(Number(s))) return true;
    if (typeof c === 'string' && ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(c)) return true;
    return false;
  }
}

module.exports = AIService;