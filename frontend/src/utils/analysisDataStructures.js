/**
 * AI分析结果数据结构定义
 * 统一规范所有AI分析结果的格式和存储方式
 */

/**
 * 基础分析结果结构
 */
export const BaseAnalysisResult = {
  // 唯一标识符
  id: '', // 格式: analysis_type_timestamp_random

  // 分析类型
  type: '', // 'content' | 'fusion' | 'music'

  // 基础信息
  createdAt: '', // ISO 8601 时间戳
  processingTime: 0, // 处理耗时（毫秒）

  // 输入信息
  inputs: {
    files: [], // 输入的文件信息
    category: '', // 视频分类
    parameters: {} // 额外参数
  },

  // 处理状态
  status: '', // 'processing' | 'completed' | 'failed'
  error: null // 错误信息（如果有）
}

/**
 * 视频内容分析结果结构
 */
export const ContentAnalysisResult = {
  ...BaseAnalysisResult,

  type: 'content',

  // 分析结果
  result: {
    // VL模型原始输出
    vlAnalysis: {
      duration: 0, // 视频时长（秒）
      keyframes: [], // 关键帧 [{ timestamp: '00:10', description: '描述' }]
      scenes: [], // 场景信息 [{ type: '风景', startTime: '00:00', endTime: '00:30' }]
      objects: [], // 物体信息 [{ name: '人物', appearances: [{ start: '00:05', end: '00:15' }] }]
      actions: [] // 动作信息 [{ action: '跑步', startTime: '00:10', endTime: '00:20' }]
    },

    // qwen-plus生成的最终报告
    finalReport: '', // 格式化的分析报告文本

    // 结构化数据
    structuredData: {
      // 视频基本信息
      videoInfo: {
        duration: '', // 格式化的时长 "2分30秒"
        format: '', // 视频格式
        size: '', // 文件大小
        resolution: '', // 分辨率
        frameRate: 0 // 帧率
      },

      // 内容分析
      contentAnalysis: {
        keyframes: [], // 关键帧分析 [{ timestamp: '00:10', analysis: '详细分析' }]
        scenes: [], // 场景分类 [{ category: '自然风景', description: '描述', duration: '30秒' }]
        objects: [], // 物体检测 [{ name: '山川', significance: '重要性', frequency: '出现频率' }]
        actions: [] // 动作识别 [{ description: '动作描述', sequence: '序列', significance: '重要性' }]
      },

      // 技术分析
      technicalAnalysis: {
        emotionalTone: '', // 情感基调
        colorPalette: [], // 色彩分布 [{ color: '#FF6B35', percentage: '25%' }]
        qualityAssessment: {
          clarity: 0, // 清晰度评分 (0-100)
          stability: 0, // 稳定性评分 (0-100)
          composition: 0 // 构图评分 (0-100)
        },
        overallScore: 0 // 综合评分 (0-100)
      }
    },

    // 摘要信息（用于快速展示）
    summary: {
      duration: 0, // 时长（秒）
      keyframeCount: 0, // 关键帧数量
      sceneCount: 0, // 场景数量
      objectCount: 0, // 物体数量
      actionCount: 0, // 动作数量
      primaryEmotion: '', // 主要情感
      dominantColors: [], // 主要颜色
      qualityScore: 0 // 质量评分
    }
  }
}

/**
 * 视频融合分析结果结构
 */
export const FusionAnalysisResult = {
  ...BaseAnalysisResult,

  type: 'fusion',

  // 分析结果
  result: {
    // 两个视频的单独分析
    video1Analysis: ContentAnalysisResult.result,
    video2Analysis: ContentAnalysisResult.result,

    // 融合分析结果
    fusionPlan: {
      // 整体方案
      overallPlan: {
        targetDuration: 45, // 目标时长（秒）
        narrativeLogic: '', // 叙事逻辑说明
        emotionalCurve: '' // 情感曲线设计
      },

      // 分段策略
      segmentation: [
        {
          id: 'segment_1',
          source: 'video1', // 'video1' | 'video2'
          startTime: '00:00', // 原视频开始时间
          endTime: '00:20', // 原视频结束时间
          targetStart: '00:00', // 目标视频开始时间
          targetEnd: '00:20', // 目标视频结束时间
          description: '分段描述',
          reason: '选择理由'
        }
        // ... 更多分段
      ],

      // 裁剪建议
      cropping: [
        {
          segmentId: 'segment_1',
          cropArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }, // 相对坐标
          focusPoint: { x: 0.5, y: 0.5 }, // 焦点
          composition: 'rule_of_thirds', // 构图类型
          reason: '裁剪理由'
        }
      ],

      // 转场效果
      transitions: [
        {
          fromSegment: 'segment_1',
          toSegment: 'segment_2',
          type: 'fade', // 'fade' | 'wipe' | 'dissolve' | 'slide'
          duration: 1.5, // 转场时长（秒）
          parameters: {}, // 转场参数
          reason: '选择理由'
        }
        // ... 至少3种转场方案
      ],

      // 音频处理
      audioProcessing: {
        backgroundMusic: {
          volume: 0.7, // 背景音量 (0-1)
          fadePoints: [ // 淡入淡出点
            { time: '00:00', type: 'fade_in', duration: 2.0 },
            { time: '00:45', type: 'fade_out', duration: 3.0 }
          ]
        },
        soundEffects: [], // 音效建议
        volumeBalance: {
          video1: 0.8,
          video2: 0.6
        }
      },

      // 技术参数
      technicalParams: {
        resolution: '1920x1080', // 目标分辨率
        frameRate: 30, // 目标帧率
        bitrate: 8000, // 目标码率 (kbps)
        codec: 'H.264', // 编码格式
        format: 'MP4' // 输出格式
      }
    },

    // 兼容性分析
    compatibility: {
      colorMatching: 0.8, // 颜色匹配度 (0-1)
      styleCompatibility: 0.7, // 风格兼容性 (0-1)
      audioCompatibility: 0.9, // 音频兼容性 (0-1)
      overallCompatibility: 0.8, // 整体兼容性 (0-1)
      recommendations: [] // 改进建议
    },

    // 时间轴可视化
    timeline: {
      totalDuration: 45,
      segments: [
        {
          id: 'segment_1',
          start: 0,
          end: 20,
          source: 'video1',
          title: '开场风景'
        }
        // ... 更多片段
      ],
      transitions: [
        {
          at: 20,
          type: 'fade',
          duration: 1.5
        }
      ]
    }
  }
}

/**
 * 背景音乐提示词结果结构
 */
export const MusicPromptResult = {
  ...BaseAnalysisResult,

  type: 'music',

  // 输入信息
  fusionPlan: FusionAnalysisResult.result.fusionPlan,

  // 音乐提示词
  result: {
    // 基础信息
    basicInfo: {
      targetDuration: 45, // 目标时长（秒）
      musicStyle: '', // 音乐风格
      emotionalTone: '', // 情感基调
      tempo: 0 // BPM (每分钟节拍数)
    },

    // 详细提示词
    prompt: {
      // 完整的提示词文本
      fullPrompt: '',

      // 结构化提示词
      sections: {
        // 音乐风格定位
        styleGuide: {
          primaryStyle: '', // 主要风格
          secondaryStyles: [], // 次要风格
          instrumentation: [], // 乐器选择
          mood: '', // 情绪氛围
          genre: '' // 音乐类型
        },

        // 情感曲线设计
        emotionalCurve: [
          {
            start: 0, // 开始时间（秒）
            end: 15, // 结束时间（秒）
            emotion: 'peaceful', // 情绪状态
            intensity: 0.6, // 强度 (0-1)
            description: '描述' // 详细描述
          }
          // ... 更多情感段落
        ],

        // 节奏匹配
        rhythmMatching: [
          {
            timestamp: '00:15', // 时间戳
            rhythmChange: 'accelerate', // 节奏变化
            bpm: 120, // BPM值
            reason: '与画面动作匹配' // 变化理由
          }
        ],

        // 乐器选择
        instrumentation: {
          lead: ['piano', 'violin'], // 主乐器
          harmony: ['cello', 'guitar'], // 和声乐器
          rhythm: ['drums', 'bass'], // 节奏乐器
          ambient: ['strings', 'synth_pad'], // 氛围乐器
          effects: ['reverb', 'delay'] // 效果器
        },

        // 关键转场指示
        transitionCues: [
          {
            timestamp: '00:20',
            transitionType: 'fade',
            musicChange: 'bridge_section',
            description: '融合转场处的音乐处理'
          }
        ],

        // 技术参数
        technicalSpecs: {
          duration: 45, // 精确时长
          key: 'C major', // 调性
          timeSignature: '4/4', // 拍号
          tempo: 120, // 速度
          dynamics: 'moderate', // 动态
          structure: 'intro-verse-chorus-outro' // 结构
        },

        // 氛围描述
        atmosphere: {
          overall: '', // 整体氛围
          spatial: '', // 空间感
          texture: '', // 音色质感
          evolution: '' // 演变过程
        }
      }
    },

    // 可用性评分
    usability: {
      clarity: 0, // 清晰度 (0-100)
      specificity: 0, // 具体性 (0-100)
      completeness: 0, // 完整性 (0-100)
      overallScore: 0 // 综合评分 (0-100)
    }
  }
}

/**
 * 分析历史记录结构
 */
export const AnalysisHistory = {
  id: '',
  sessionId: '', // 关联的上传会话ID
  timestamp: '', // 创建时间
  analyses: [], // 分析结果数组 [ContentAnalysisResult, FusionAnalysisResult, MusicPromptResult]
  userPreferences: {
    analysisTypes: [], // 用户偏好的分析类型
    exportFormats: [], // 用户偏好的导出格式
    notifications: [] // 通知设置
  },
  metadata: {
    totalAnalysisTime: 0, // 总分析时间
    tokenConsumption: 0, // Token消耗量
    costEstimate: 0 // 成本估算
  }
}

/**
 * 数据验证函数
 */
export const validateAnalysisResult = (result, type) => {
  switch (type) {
    case 'content':
      return validateContentAnalysis(result)
    case 'fusion':
      return validateFusionAnalysis(result)
    case 'music':
      return validateMusicPrompt(result)
    default:
      return { valid: false, errors: ['未知的分析类型'] }
  }
}

const validateContentAnalysis = (result) => {
  const errors = []

  const top = result || {}
  const nested = (result && result.result) || {}

  const vl = top.vlAnalysis || nested.vlAnalysis
  const report = top.finalReport || nested.finalReport
  const structured = top.structuredData || nested.structuredData

  if (!vl) errors.push('缺少VL分析结果')
  if (!report) errors.push('缺少最终报告')
  if (!structured) errors.push('缺少结构化数据')

  return {
    valid: errors.length === 0,
    errors
  }
}

const validateFusionAnalysis = (result) => {
  const errors = []

  if (!result.video1Analysis) errors.push('缺少视频1分析结果')
  if (!result.video2Analysis) errors.push('缺少视频2分析结果')
  if (!result.fusionPlan) errors.push('缺少融合方案')

  return {
    valid: errors.length === 0,
    errors
  }
}

const validateMusicPrompt = (result) => {
  const errors = []

  if (!result.prompt) errors.push('缺少提示词')
  if (!result.basicInfo) errors.push('缺少基础信息')

  return {
    valid: errors.length === 0,
    errors
  }
}