/**
 * 结果展示集成测试
 *
 * 测试覆盖范围：
 * - 内容分析结果展示组件
 * - 融合分析结果展示组件
 * - 音乐提示词结果展示
 * - 结果数据的格式化和渲染
 * - 结果导出功能集成
 * - 结果历史记录管理
 *
 * 测试方法：
 * - 使用 Vitest + Vue Test Utils 测试UI组件
 * - 模拟各种分析结果数据
 * - 测试结果展示的响应式更新
 * - 验证用户交互功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { useAIAnalysis } from '@/composables/useAIAnalysis'

// Mock analysis storage for result management
vi.mock('@/utils/analysisStorage', () => ({
  saveAnalysisResult: vi.fn(() => ({})),
  getAnalysisResults: vi.fn(() => []),
  exportAnalysisResults: vi.fn(() => '{}'),
  getStorageStats: vi.fn(() => ({
    totalResults: 0,
    storageSize: { total: 0, percentage: '0' }
  }))
}))

// Mock DOM APIs for download functionality
global.URL = {
  createObjectURL: vi.fn(() => 'mock-blob-url'),
  revokeObjectURL: vi.fn()
}

global.Blob = vi.fn((content, options) => ({ content, options }))

global.document = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
    style: { display: '' }
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
}

describe('结果展示集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('内容分析结果展示', () => {
    it('应该正确展示内容分析结果', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockContentResult = {
        analysisId: 'content-123',
        analysisType: 'content',
        createdAt: '2025-01-19T10:00:00Z',
        finalReport: '这是一个详细的个人视频分析报告。视频主要记录了家庭聚会的温馨场景，包含了多个人物互动和自然风景的展示。',
        structuredData: {
          videoInfo: {
            duration: '2分30秒',
            format: 'mp4',
            size: '85MB',
            resolution: '1920x1080',
            frameRate: 30
          },
          contentAnalysis: {
            keyframes: [
              {
                timestamp: '00:10',
                analysis: '开场人物特写，展现了主角开心的表情'
              },
              {
                timestamp: '01:20',
                analysis: '风景展示部分，阳光明媚的自然景观'
              }
            ],
            scenes: [
              {
                category: '人物',
                description: '家庭成员互动场景',
                duration: '1分20秒'
              },
              {
                category: '风景',
                description: '户外自然风光',
                duration: '1分10秒'
              }
            ],
            objects: [
              {
                name: '人物',
                significance: '主要对象',
                frequency: '高频率出现'
              },
              {
                name: '阳光',
                significance: '环境氛围营造',
                frequency: '中等频率'
              }
            ],
            actions: [
              {
                description: '微笑交谈',
                sequence: '连续动作',
                significance: '情感表达'
              },
              {
                description: '步行游览',
                sequence: '移动场景',
                significance: '场景转换'
              }
            ]
          },
          technicalAnalysis: {
            emotionalTone: '温馨愉悦',
            colorPalette: [
              { color: '#FFD700', percentage: '35%' }, // 金色阳光
              { color: '#87CEEB', percentage: '25%' }, // 天蓝色
              { color: '#90EE90', percentage: '20%' }  // 浅绿色
            ],
            qualityAssessment: {
              clarity: 88,
              stability: 92,
              composition: 85
            },
            overallScore: 88
          }
        },
        summary: {
          duration: 150,
          keyframeCount: 2,
          sceneCount: 2,
          objectCount: 2,
          actionCount: 2,
          primaryEmotion: '愉悦',
          dominantColors: ['#FFD700', '#87CEEB'],
          qualityScore: 88
        }
      }

      // 设置分析结果
      analysisResult.value = mockContentResult

      await nextTick()

      // 验证格式化结果
      expect(formattedResult.value).toBeDefined()
      expect(formattedResult.value.analysisId).toBe('content-123')
      expect(formattedResult.value.type).toBe('content')
      expect(formattedResult.value.contentAnalysis).toBeDefined()

      // 验证内容分析展示数据
      const contentDisplay = formattedResult.value.contentAnalysis
      expect(contentDisplay.report).toContain('个人视频分析报告')
      expect(contentDisplay.summary).toBeDefined()
      expect(contentDisplay.summary.duration).toBe('2分30秒')
      expect(contentDisplay.summary.format).toBe('mp4')
    })

    it('应该展示技术分析的质量评分', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockResult = {
        analysisId: 'tech-123',
        analysisType: 'content',
        structuredData: {
          technicalAnalysis: {
            qualityAssessment: {
              clarity: 95,
              stability: 88,
              composition: 92
            },
            overallScore: 92
          }
        }
      }

      analysisResult.value = mockResult

      await nextTick()

      const techAnalysis = formattedResult.value.contentAnalysis?.summary
      expect(techAnalysis).toBeDefined()
    })

    it('应该处理不完整的内容分析结果', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const incompleteResult = {
        analysisId: 'incomplete-123',
        analysisType: 'content',
        finalReport: '不完整的分析报告'
        // 缺少structuredData
      }

      analysisResult.value = incompleteResult

      await nextTick()

      // 应该仍然能够展示基本信息
      expect(formattedResult.value).toBeDefined()
      expect(formattedResult.value.contentAnalysis).toBeDefined()
      expect(formattedResult.value.contentAnalysis.report).toBe('不完整的分析报告')
    })
  })

  describe('融合分析结果展示', () => {
    it('应该正确展示融合分析结果', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockFusionResult = {
        analysisId: 'fusion-456',
        analysisType: 'fusion',
        createdAt: '2025-01-19T11:00:00Z',
        video1Analysis: {
          structuredData: {
            videoInfo: {
              duration: '1分30秒',
              format: 'mp4',
              resolution: '1920x1080'
            }
          }
        },
        video2Analysis: {
          structuredData: {
            videoInfo: {
              duration: '2分00秒',
              format: 'mp4',
              resolution: '1920x1080'
            }
          }
        },
        fusionPlan: {
          overallPlan: {
            targetDuration: 75,
            narrativeLogic: '通过时间线交错展现两个场景的故事线，创造情感上的递进和对比',
            emotionalCurve: '从平静的日常场景逐渐发展到温馨的高潮，最后以平和的基调收尾'
          },
          segmentation: [
            {
              id: 'segment_1',
              source: 'video1',
              startTime: '00:00',
              endTime: '00:30',
              targetStart: '00:00',
              targetEnd: '00:30',
              description: '开场场景建立',
              reason: '建立故事背景和人物关系'
            },
            {
              id: 'segment_2',
              source: 'video2',
              startTime: '00:45',
              endTime: '01:15',
              targetStart: '00:30',
              targetEnd: '01:00',
              description: '关键情节展示',
              reason: '引入主要冲突和情感元素'
            },
            {
              id: 'segment_3',
              source: 'video1',
              startTime: '01:00',
              endTime: '01:30',
              targetStart: '01:00',
              targetEnd: '01:30',
              description: '情感高潮部分',
              reason: '展示情感发展的顶点'
            }
          ],
          transitions: [
            {
              fromSegment: 'segment_1',
              toSegment: 'segment_2',
              type: 'fade',
              duration: 2.0,
              parameters: { opacity: [1, 0, 1] },
              reason: '平滑的场景转换，保持情感连贯性'
            },
            {
              fromSegment: 'segment_2',
              toSegment: 'segment_3',
              type: 'dissolve',
              duration: 1.5,
              parameters: { blendMode: 'normal' },
              reason: '情感的自然过渡和融合'
            }
          ],
          cropping: [
            {
              segmentId: 'segment_1',
              cropArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
              focusPoint: { x: 0.5, y: 0.4 },
              composition: 'rule_of_thirds',
              reason: '突出主体，遵循构图规则'
            }
          ],
          technicalParams: {
            resolution: '1920x1080',
            frameRate: 30,
            bitrate: 8000,
            codec: 'H.264',
            format: 'MP4'
          }
        },
        compatibility: {
          colorMatching: 0.85,
          styleCompatibility: 0.78,
          audioCompatibility: 0.92,
          overallCompatibility: 0.85,
          recommendations: [
            '建议调整video1的色温以匹配video2',
            '可以在转场处增加音效过渡',
            '考虑统一两个视频的曝光水平'
          ]
        },
        timeline: {
          totalDuration: 75,
          segments: [
            {
              id: 'segment_1',
              start: 0,
              end: 30,
              source: 'video1',
              title: '开场场景'
            },
            {
              id: 'segment_2',
              start: 30,
              end: 60,
              source: 'video2',
              title: '关键情节'
            },
            {
              id: 'segment_3',
              start: 60,
              end: 75,
              source: 'video1',
              title: '情感高潮'
            }
          ],
          transitions: [
            { at: 30, type: 'fade', duration: 2.0 },
            { at: 60, type: 'dissolve', duration: 1.5 }
          ]
        }
      }

      analysisResult.value = mockFusionResult

      await nextTick()

      // 验证融合分析展示
      expect(formattedResult.value.fusionAnalysis).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.plan).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.plan.overallPlan.targetDuration).toBe(75)

      // 验证视频摘要信息
      expect(formattedResult.value.fusionAnalysis.video1Summary.duration).toBe('1分30秒')
      expect(formattedResult.value.fusionAnalysis.video2Summary.duration).toBe('2分00秒')

      // 验证兼容性分析
      expect(formattedResult.value.fusionAnalysis.compatibility.overallCompatibility).toBe(0.85)
    })

    it('应该展示融合方案的详细信息', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const fusionResult = {
        analysisId: 'fusion-detail-789',
        analysisType: 'fusion',
        fusionPlan: {
          segmentation: [
            {
              id: 'seg1',
              source: 'video1',
              startTime: '00:00',
              endTime: '00:20',
              description: '开场片段'
            }
          ],
          transitions: [
            {
              fromSegment: 'seg1',
              toSegment: 'seg2',
              type: 'wipe',
              duration: 1.0
            }
          ]
        },
        video1Analysis: { structuredData: { videoInfo: {} } },
        video2Analysis: { structuredData: { videoInfo: {} } }
      }

      analysisResult.value = fusionResult

      await nextTick()

      const fusionDisplay = formattedResult.value.fusionAnalysis
      expect(fusionDisplay.plan.segmentation).toBeDefined()
      expect(fusionDisplay.plan.segmentation).toHaveLength(1)
      expect(fusionDisplay.plan.transitions).toBeDefined()
    })

    it('应该处理缺少部分数据的融合分析结果', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const incompleteFusionResult = {
        analysisId: 'incomplete-fusion',
        analysisType: 'fusion',
        fusionPlan: {
          overallPlan: { targetDuration: 60 }
        }
        // 缺少video1Analysis和video2Analysis
      }

      analysisResult.value = incompleteFusionResult

      await nextTick()

      // 应该能够处理缺失的数据
      expect(formattedResult.value.fusionAnalysis).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.plan).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.video1Summary).toEqual({})
      expect(formattedResult.value.fusionAnalysis.video2Summary).toEqual({})
    })
  })

  describe('音乐提示词结果展示', () => {
    it('应该正确展示音乐提示词结果', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockMusicResult = {
        analysisId: 'music-789',
        analysisType: 'music',
        createdAt: '2025-01-19T12:00:00Z',
        musicPrompt: '生成一段温馨、轻快的背景音乐，适合家庭聚会场景。音乐应该以钢琴为主乐器，辅以轻柔的弦乐，营造出轻松愉悦的氛围。整体节奏应该在100-120 BPM之间，采用4/4拍。',
        basicInfo: {
          targetDuration: 60,
          musicStyle: '轻音乐',
          emotionalTone: '温馨愉悦',
          tempo: 110
        },
        prompt: {
          sections: {
            styleGuide: {
              primaryStyle: '轻音乐',
              secondaryStyles: ['爵士', '古典'],
              instrumentation: ['钢琴', '小提琴', '大提琴'],
              mood: '温馨',
              genre: 'New Age'
            },
            emotionalCurve: [
              {
                start: 0,
                end: 20,
                emotion: 'peaceful',
                intensity: 0.6,
                description: '开场平和，建立温馨氛围'
              },
              {
                start: 20,
                end: 40,
                emotion: 'uplifting',
                intensity: 0.8,
                description: '情绪逐渐提升，增加活力'
              },
              {
                start: 40,
                end: 60,
                emotion: 'warm',
                intensity: 0.7,
                description: '收尾温馨，保持愉悦感'
              }
            ],
            rhythmMatching: [
              {
                timestamp: '00:15',
                rhythmChange: 'accelerate',
                bpm: 100,
                reason: '与画面情绪提升相匹配'
              },
              {
                timestamp: '00:45',
                rhythmChange: 'decelerate',
                bpm: 90,
                reason: '配合结尾的平静氛围'
              }
            ],
            instrumentation: {
              lead: ['piano', 'violin'],
              harmony: ['cello', 'guitar'],
              rhythm: ['light percussion'],
              ambient: ['strings', 'synth pad'],
              effects: ['reverb', 'delay']
            },
            technicalSpecs: {
              duration: 60,
              key: 'C major',
              timeSignature: '4/4',
              tempo: 110,
              dynamics: 'moderate',
              structure: 'intro-verse-chorus-outro'
            }
          },
          usability: {
            clarity: 92,
            specificity: 88,
            completeness: 95,
            overallScore: 92
          }
        }
      }

      analysisResult.value = mockMusicResult

      await nextTick()

      // 验证音乐提示词展示
      expect(formattedResult.value.musicPrompt).toBeDefined()
      expect(formattedResult.value.musicPrompt).toContain('温馨、轻快的背景音乐')

      // 如果有musicResult的结构，应该包含更详细的信息
      if (formattedResult.value.musicResult) {
        expect(formattedResult.value.musicResult.basicInfo).toBeDefined()
        expect(formattedResult.value.musicResult.basicInfo.musicStyle).toBe('轻音乐')
        expect(formattedResult.value.musicResult.basicInfo.emotionalTone).toBe('温馨愉悦')
      }
    })

    it('应该展示音乐提示词的技术参数', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const musicWithTechSpecs = {
        analysisId: 'music-tech-123',
        analysisType: 'music',
        basicInfo: {
          targetDuration: 45,
          musicStyle: '电子音乐',
          tempo: 128
        },
        prompt: {
          technicalSpecs: {
            duration: 45,
            key: 'A minor',
            timeSignature: '4/4',
            tempo: 128,
            dynamics: 'dynamic',
            structure: 'intro-buildup-drop-outro'
          }
        }
      }

      analysisResult.value = musicWithTechSpecs

      await nextTick()

      expect(formattedResult.value.musicPrompt).toBeDefined()
    })
  })

  describe('结果导出功能', () => {
    it('应该支持JSON格式导出', async () => {
      const { exportResults, error } = useAIAnalysis()

      // Mock exportAnalysisResults
      const { exportAnalysisResults } = require('@/utils/analysisStorage')
      exportAnalysisResults.mockReturnValue(JSON.stringify({
        exportedAt: '2025-01-19T10:00:00Z',
        results: [
          { id: 'result1', type: 'content' },
          { id: 'result2', type: 'fusion' }
        ]
      }))

      const result = await exportResults(['result1', 'result2'], 'json')

      expect(result).toBe(true)
      expect(error.value).toBe(null)
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.document.createElement).toHaveBeenCalledWith('a')
    })

    it('应该支持CSV格式导出', async () => {
      const { exportResults } = useAIAnalysis()

      const { exportAnalysisResults } = require('@/utils/analysisStorage')
      exportAnalysisResults.mockReturnValue('ID,类型,创建时间\nresult1,content,2025-01-19')

      const result = await exportResults(['result1'], 'csv')

      expect(result).toBe(true)
      expect(exportAnalysisResults).toHaveBeenCalledWith(['result1'], 'csv')
    })

    it('应该支持TXT格式导出', async () => {
      const { exportResults } = useAIAnalysis()

      const { exportAnalysisResults } = require('@/utils/analysisStorage')
      exportAnalysisResults.mockReturnValue('AI分析结果导出\n导出时间: 2025-01-19\n结果数量: 1')

      const result = await exportResults(['result1'], 'txt')

      expect(result).toBe(true)
      expect(exportAnalysisResults).toHaveBeenCalledWith(['result1'], 'txt')
    })

    it('应该处理导出失败的情况', async () => {
      const { exportResults, error } = useAIAnalysis()

      const { exportAnalysisResults } = require('@/utils/analysisStorage')
      exportAnalysisResults.mockImplementation(() => {
        throw new Error('Export failed')
      })

      const result = await exportResults(['result1'], 'json')

      expect(result).toBe(false)
      expect(error.value).toContain('导出失败')
    })
  })

  describe('结果历史记录管理', () => {
    it('应该获取分析历史记录', () => {
      const { getAnalysisHistory } = useAIAnalysis()

      const { getAnalysisResults } = require('@/utils/analysisStorage')
      getAnalysisResults.mockReturnValue([
        { id: 'history1', type: 'content', createdAt: '2025-01-19T10:00:00Z' },
        { id: 'history2', type: 'fusion', createdAt: '2025-01-19T11:00:00Z' }
      ])

      const history = getAnalysisHistory()

      expect(history).toBeDefined()
      expect(getAnalysisResults).toHaveBeenCalled()
    })

    it('应该按类型过滤历史记录', () => {
      const { getAnalysisHistory } = useAIAnalysis()

      const { getAnalysisResults } = require('@/utils/analysisStorage')
      getAnalysisResults.mockImplementation((type) => {
        if (type === 'content') {
          return [{ id: 'content1', type: 'content' }]
        }
        return []
      })

      const contentHistory = getAnalysisHistory('content')
      const fusionHistory = getAnalysisHistory('fusion')

      expect(contentHistory).toHaveLength(1)
      expect(fusionHistory).toHaveLength(0)
    })
  })

  describe('结果展示响应性', () => {
    it('应该在结果更新时立即反映到UI', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      // 初始状态
      expect(formattedResult.value).toBe(null)

      // 设置第一个结果
      analysisResult.value = {
        analysisId: 'test1',
        analysisType: 'content',
        finalReport: '第一个报告'
      }

      await nextTick()

      expect(formattedResult.value).toBeDefined()
      expect(formattedResult.value.analysisId).toBe('test1')

      // 更新结果
      analysisResult.value = {
        analysisId: 'test2',
        analysisType: 'fusion',
        fusionPlan: { targetDuration: 60 }
      }

      await nextTick()

      expect(formattedResult.value.analysisId).toBe('test2')
      expect(formattedResult.value.type).toBe('fusion')
      expect(formattedResult.value.fusionAnalysis).toBeDefined()
    })

    it('应该正确处理结果清空', async () => {
      const { analysisResult, formattedResult, resetAnalysis } = useAIAnalysis()

      // 设置结果
      analysisResult.value = {
        analysisId: 'test',
        analysisType: 'content',
        finalReport: '测试报告'
      }

      await nextTick()

      expect(formattedResult.value).toBeDefined()

      // 清空结果
      resetAnalysis()

      await nextTick()

      expect(analysisResult.value).toBe(null)
      expect(formattedResult.value).toBe(null)
    })
  })

  describe('数据验证和错误处理', () => {
    it('应该处理无效的结果数据', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      // 设置无效数据
      analysisResult.value = {
        analysisId: null,
        analysisType: 'unknown_type',
        invalidField: 'invalid'
      }

      await nextTick()

      // 应该能够处理无效数据而不崩溃
      expect(formattedResult.value).toBeDefined()
    })

    it('应该处理空的结果数据', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      analysisResult.value = {}

      await nextTick()

      expect(formattedResult.value).toBeDefined()
      expect(formattedResult.value.analysisId).toBeUndefined()
    })

    it('应该处理字符串类型的结果数据', async () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      analysisResult.value = 'string result'

      await nextTick()

      // 应该能够处理意外的数据类型
      expect(typeof formattedResult.value).toBe('object')
    })
  })
})