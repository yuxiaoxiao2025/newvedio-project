/**
 * AI分析测试数据生成器
 * 基于Qwen模型的最佳实践生成测试数据
 */

/**
 * 模拟视频数据生成器
 */
export class MockVideoDataGenerator {
  /**
   * 生成模拟视频文件数据
   */
  static generateVideoFile(options = {}) {
    const defaults = {
      name: 'test-video.mp4',
      size: 50 * 1024 * 1024, // 50MB
      duration: 120, // 2分钟
      format: 'mp4',
      resolution: '1920x1080',
      frameRate: 30
    }

    return { ...defaults, ...options }
  }

  /**
   * 生成个人视频测试数据
   */
  static generatePersonalVideos() {
    return [
      {
        ...this.generateVideoFile({
          name: 'family-trip.mp4',
          duration: 180,
          size: 80 * 1024 * 1024
        }),
        category: 'personal',
        scene: '家庭旅行记录',
        content: {
          people: ['家庭成员', '游客'],
          locations: ['景点', '酒店'],
          activities: ['观光', '拍照', '用餐']
        }
      },
      {
        ...this.generateVideoFile({
          name: 'birthday-party.mp4',
          duration: 90,
          size: 40 * 1024 * 1024
        }),
        category: 'personal',
        scene: '生日聚会',
        content: {
          people: ['朋友', '家人'],
          locations: ['家中', '餐厅'],
          activities: ['庆祝', '切蛋糕', '游戏']
        }
      },
      {
        ...this.generateVideoFile({
          name: 'sports-activity.mp4',
          duration: 150,
          size: 60 * 1024 * 1024
        }),
        category: 'personal',
        scene: '运动活动',
        content: {
          people: ['运动员', '教练'],
          locations: ['体育馆', '户外场地'],
          activities: ['跑步', '训练', '比赛']
        }
      }
    ]
  }

  /**
   * 生成景区视频测试数据
   */
  static generateScenicVideos() {
    return [
      {
        ...this.generateVideoFile({
          name: 'mountain-landscape.mp4',
          duration: 240,
          size: 120 * 1024 * 1024
        }),
        category: 'scenic',
        scene: '山岳风光',
        content: {
          landscapes: ['山峰', '云海', '森林'],
          weather: ['晴朗', '多云'],
          timeOfDay: ['日出', '日落']
        }
      },
      {
        ...this.generateVideoFile({
          name: 'waterfall-scene.mp4',
          duration: 180,
          size: 90 * 1024 * 1024
        }),
        category: 'scenic',
        scene: '瀑布景观',
        content: {
          landscapes: ['瀑布', '溪流', '岩石'],
          weather: ['阴天', '小雨'],
          timeOfDay: ['白天']
        }
      },
      {
        ...this.generateVideoFile({
          name: 'city-night-view.mp4',
          duration: 200,
          size: 100 * 1024 * 1024
        }),
        category: 'scenic',
        scene: '城市夜景',
        content: {
          landscapes: ['建筑', '街道', '灯光'],
          weather: ['晴朗'],
          timeOfDay: ['夜晚']
        }
      }
    ]
  }

  /**
   * 生成不同格式的视频数据
   */
  static generateDifferentFormats() {
    const formats = ['mp4', 'avi', 'mov', 'mkv']
    return formats.map(format => ({
      ...this.generateVideoFile({
        name: `test-video.${format}`,
        format: format
      }),
      category: format === 'avi' ? 'personal' : 'scenic'
    }))
  }

  /**
   * 生成不同时长的视频数据
   */
  static generateDifferentDurations() {
    return [
      {
        ...this.generateVideoFile({
          name: 'short-video.mp4',
          duration: 30,
          size: 15 * 1024 * 1024
        }),
        durationCategory: 'short'
      },
      {
        ...this.generateVideoFile({
          name: 'medium-video.mp4',
          duration: 300,
          size: 150 * 1024 * 1024
        }),
        durationCategory: 'medium'
      },
      {
        ...this.generateVideoFile({
          name: 'long-video.mp4',
          duration: 600,
          size: 300 * 1024 * 1024
        }),
        durationCategory: 'long'
      }
    ]
  }
}

/**
 * AI分析结果模拟器
 */
export class AIAnalysisResultSimulator {
  /**
   * 模拟VL模型分析结果
   */
  static simulateVLAnalysis(videoData) {
    const baseAnalysis = {
      duration: videoData.duration,
      keyframes: [],
      scenes: [],
      objects: [],
      actions: []
    }

    // 根据视频类型生成不同的分析结果
    if (videoData.category === 'personal') {
      return this.generatePersonalVLAnalysis(baseAnalysis, videoData)
    } else if (videoData.category === 'scenic') {
      return this.generateScenicVLAnalysis(baseAnalysis, videoData)
    }

    return baseAnalysis
  }

  /**
   * 生成个人视频VL分析结果
   */
  static generatePersonalVLAnalysis(baseAnalysis, videoData) {
    const keyframeCount = Math.floor(videoData.duration / 10) // 每10秒一个关键帧

    for (let i = 0; i < keyframeCount; i++) {
      const timestamp = i * 10
      baseAnalysis.keyframes.push({
        timestamp: this.formatTime(timestamp),
        description: `人物活动画面 - 第${i + 1}个关键场景`
      })
    }

    baseAnalysis.scenes = [
      {
        type: '人物特写',
        startTime: '00:00',
        endTime: this.formatTime(videoData.duration * 0.3)
      },
      {
        type: '活动场景',
        startTime: this.formatTime(videoData.duration * 0.3),
        endTime: this.formatTime(videoData.duration * 0.7)
      },
      {
        type: '环境展示',
        startTime: this.formatTime(videoData.duration * 0.7),
        endTime: this.formatTime(videoData.duration)
      }
    ]

    baseAnalysis.objects = [
      {
        name: '人物',
        appearances: [
          { start: '00:00', end: this.formatTime(videoData.duration) }
        ]
      },
      {
        name: '建筑',
        appearances: [
          { start: '00:30', end: this.formatTime(videoData.duration * 0.8) }
        ]
      }
    ]

    baseAnalysis.actions = [
      {
        action: '行走',
        startTime: '00:10',
        endTime: '01:30'
      },
      {
        action: '交谈',
        startTime: '02:00',
        endTime: '03:00'
      }
    ]

    return baseAnalysis
  }

  /**
   * 生成景区视频VL分析结果
   */
  static generateScenicVLAnalysis(baseAnalysis, videoData) {
    const keyframeCount = Math.floor(videoData.duration / 15) // 每15秒一个关键帧

    for (let i = 0; i < keyframeCount; i++) {
      const timestamp = i * 15
      baseAnalysis.keyframes.push({
        timestamp: this.formatTime(timestamp),
        description: `自然风光画面 - ${this.getScenicDescription(i)}`
      })
    }

    baseAnalysis.scenes = [
      {
        type: '远景景观',
        startTime: '00:00',
        endTime: this.formatTime(videoData.duration * 0.4)
      },
      {
        type: '中景展示',
        startTime: this.formatTime(videoData.duration * 0.4),
        endTime: this.formatTime(videoData.duration * 0.8)
      },
      {
        type: '特写细节',
        startTime: this.formatTime(videoData.duration * 0.8),
        endTime: this.formatTime(videoData.duration)
      }
    ]

    baseAnalysis.objects = [
      {
        name: '山岳',
        appearances: [
          { start: '00:00', end: this.formatTime(videoData.duration * 0.6) }
        ]
      },
      {
        name: '水体',
        appearances: [
          { start: '01:00', end: this.formatTime(videoData.duration) }
        ]
      }
    ]

    return baseAnalysis
  }

  /**
   * 模拟qwen-plus最终报告生成
   */
  static simulateFinalReport(vlAnalysis, videoData) {
    const templates = {
      personal: `
# 视频内容分析报告

## 基本信息
- 视频时长: ${this.formatTime(videoData.duration)}
- 文件格式: ${videoData.format.toUpperCase()}
- 分辨率: ${videoData.resolution}
- 文件大小: ${(videoData.size / 1024 / 1024).toFixed(1)}MB

## 内容分析

### 关键帧分析
识别到 ${vlAnalysis.keyframes.length} 个关键帧，主要记录了人物活动的重要瞬间。

### 场景分类
- 人物特写: 展现人物表情和互动
- 活动场景: 记录动态活动过程
- 环境展示: 呈现活动背景环境

### 物体检测
主要识别对象包括人物、建筑等元素，为视频内容提供丰富的视觉信息。

### 技术评估
- 画面质量: 良好
- 稳定性: 稳定
- 构图: 合理

## 总结
该视频记录了个人生活片段，具有较好的叙事性和观赏价值。
      `,
      scenic: `
# 景区视频分析报告

## 基本信息
- 视频时长: ${this.formatTime(videoData.duration)}
- 文件格式: ${videoData.format.toUpperCase()}
- 分辨率: ${videoData.resolution}
- 文件大小: ${(videoData.size / 1024 / 1024).toFixed(1)}MB

## 内容分析

### 关键帧分析
识别到 ${vlAnalysis.keyframes.length} 个关键帧，展现了景区的自然美景。

### 场景分类
- 远景景观: 展现景区整体风貌
- 中景展示: 呈现景观细节特色
- 特写细节: 突出独特景观元素

### 物体检测
主要识别对象包括山岳、水体等自然景观元素，展现了景区的自然资源特色。

### 技术评估
- 画面质量: 优秀
- 色彩表现: 丰富
- 构图: 专业

## 总结
该景区视频具有良好的视觉效果，能够有效展现景区的特色和魅力。
      `
    }

    return templates[videoData.category] || templates.personal
  }

  /**
   * 模拟融合分析结果
   */
  static simulateFusionAnalysis(video1Data, video2Data) {
    return {
      overallPlan: {
        targetDuration: Math.min(60, (video1Data.duration + video2Data.duration) / 2),
        narrativeLogic: '两个视频的有机结合，创造连贯的观看体验',
        emotionalCurve: '从平静到高潮再到平静的情感曲线'
      },
      segmentation: [
        {
          id: 'segment_1',
          source: 'video1',
          startTime: '00:00',
          endTime: '00:20',
          targetStart: '00:00',
          targetEnd: '00:20',
          description: '开场部分',
          reason: '建立视频基调和氛围'
        },
        {
          id: 'segment_2',
          source: 'video2',
          startTime: '00:10',
          endTime: '00:30',
          targetStart: '00:20',
          targetEnd: '00:40',
          description: '发展部分',
          reason: '引入新的视觉元素'
        }
      ],
      transitions: [
        {
          fromSegment: 'segment_1',
          toSegment: 'segment_2',
          type: 'fade',
          duration: 2.0,
          reason: '平稳过渡，保持观看体验'
        }
      ],
      technicalParams: {
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: 8000,
        codec: 'H.264'
      }
    }
  }

  /**
   * 模拟音乐提示词生成
   */
  static simulateMusicPrompt(fusionPlan) {
    return {
      basicInfo: {
        targetDuration: fusionPlan.overallPlan.targetDuration,
        musicStyle: '背景音乐',
        emotionalTone: '舒缓温暖',
        tempo: 120
      },
      prompt: {
        sections: {
          styleGuide: {
            primaryStyle: '环境音乐',
            instrumentation: ['钢琴', '弦乐', '轻打击乐'],
            mood: '放松愉悦'
          },
          emotionalCurve: [
            {
              start: 0,
              end: 15,
              emotion: 'calm',
              intensity: 0.5
            },
            {
              start: 15,
              end: 30,
              emotion: 'uplifting',
              intensity: 0.7
            }
          ]
        }
      }
    }
  }

  /**
   * 工具方法
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  static getScenicDescription(index) {
    const descriptions = [
      '山峦起伏',
      '云雾缭绕',
      '溪水流淌',
      '阳光透过云层',
      '倒影如镜',
      '色彩斑斓'
    ]
    return descriptions[index % descriptions.length]
  }
}

/**
 * 性能测试数据生成器
 */
export class PerformanceTestDataGenerator {
  /**
   * 生成性能测试用的视频数据集
   */
  static generatePerformanceTestSet() {
    return {
      smallDataset: Array.from({ length: 5 }, (_, i) =>
        MockVideoDataGenerator.generateVideoFile({
          name: `perf-test-small-${i}.mp4`,
          duration: 30 + Math.random() * 60,
          size: (20 + Math.random() * 30) * 1024 * 1024
        })
      ),
      mediumDataset: Array.from({ length: 3 }, (_, i) =>
        MockVideoDataGenerator.generateVideoFile({
          name: `perf-test-medium-${i}.mp4`,
          duration: 120 + Math.random() * 180,
          size: (80 + Math.random() * 70) * 1024 * 1024
        })
      ),
      largeDataset: Array.from({ length: 2 }, (_, i) =>
        MockVideoDataGenerator.generateVideoFile({
          name: `perf-test-large-${i}.mp4`,
          duration: 300 + Math.random() * 300,
          size: (200 + Math.random() * 100) * 1024 * 1024
        })
      )
    }
  }

  /**
   * 生成并发测试数据
   */
  static generateConcurrencyTestData() {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `concurrent-test-${i}`,
      video: MockVideoDataGenerator.generateVideoFile({
        name: `concurrent-${i}.mp4`,
        duration: 60 + Math.random() * 120
      }),
      expectedCompletionTime: 30000 + Math.random() * 60000, // 30-90秒
      priority: i < 3 ? 'high' : 'normal'
    }))
  }
}

/**
 * 错误测试数据生成器
 */
export class ErrorTestDataGenerator {
  /**
   * 生成各种错误场景的测试数据
   */
  static generateErrorTestCases() {
    return [
      {
        type: 'invalid_file',
        description: '无效文件格式测试',
        data: {
          file: MockVideoDataGenerator.generateVideoFile({
            name: 'invalid.xyz',
            format: 'xyz'
          }),
          expectedError: '不支持的文件格式'
        }
      },
      {
        type: 'oversized_file',
        description: '文件过大测试',
        data: {
          file: MockVideoDataGenerator.generateVideoFile({
            size: 500 * 1024 * 1024 // 500MB
          }),
          expectedError: '文件过大'
        }
      },
      {
        type: 'corrupted_file',
        description: '损坏文件测试',
        data: {
          file: MockVideoDataGenerator.generateVideoFile(),
          simulatedError: '文件读取失败'
        }
      },
      {
        type: 'network_error',
        description: '网络错误测试',
        data: {
          file: MockVideoDataGenerator.generateVideoFile(),
          simulatedError: '网络连接失败'
        }
      }
    ]
  }
}

export default {
  MockVideoDataGenerator,
  AIAnalysisResultSimulator,
  PerformanceTestDataGenerator,
  ErrorTestDataGenerator
}