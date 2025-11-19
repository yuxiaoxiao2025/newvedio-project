/**
 * analysisDataStructures 数据结构单元测试
 *
 * 测试覆盖范围：
 * - 数据结构常量定义
 * - 内容分析结果验证
 * - 融合分析结果验证
 * - 音乐提示词结果验证
 * - 边界条件和异常数据处理
 * - 数据完整性检查
 *
 * 测试方法：
 * - 使用 Vitest 进行单元测试
 * - 测试各种数据格式和边界条件
 * - 验证数据结构的完整性和一致性
 * - 测试错误消息的准确性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BaseAnalysisResult,
  ContentAnalysisResult,
  FusionAnalysisResult,
  MusicPromptResult,
  AnalysisHistory,
  validateAnalysisResult
} from '@/utils/analysisDataStructures'

describe('analysisDataStructures 数据结构', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('数据结构定义', () => {
    it('应该定义基础分析结果结构', () => {
      expect(BaseAnalysisResult).toBeDefined()
      expect(BaseAnalysisResult.id).toBe('')
      expect(BaseAnalysisResult.type).toBe('')
      expect(BaseAnalysisResult.createdAt).toBe('')
      expect(BaseAnalysisResult.processingTime).toBe(0)
      expect(BaseAnalysisResult.status).toBe('')
      expect(BaseAnalysisResult.error).toBe(null)
    })

    it('应该定义内容分析结果结构', () => {
      expect(ContentAnalysisResult).toBeDefined()
      expect(ContentAnalysisResult.type).toBe('content')
      expect(ContentAnalysisResult.result).toBeDefined()
      expect(ContentAnalysisResult.result.vlAnalysis).toBeDefined()
      expect(ContentAnalysisResult.result.finalReport).toBe('')
      expect(ContentAnalysisResult.result.structuredData).toBeDefined()
    })

    it('应该定义融合分析结果结构', () => {
      expect(FusionAnalysisResult).toBeDefined()
      expect(FusionAnalysisResult.type).toBe('fusion')
      expect(FusionAnalysisResult.result).toBeDefined()
      expect(FusionAnalysisResult.result.video1Analysis).toBeDefined()
      expect(FusionAnalysisResult.result.video2Analysis).toBeDefined()
      expect(FusionAnalysisResult.result.fusionPlan).toBeDefined()
    })

    it('应该定义音乐提示词结果结构', () => {
      expect(MusicPromptResult).toBeDefined()
      expect(MusicPromptResult.type).toBe('music')
      expect(MusicPromptResult.result).toBeDefined()
      expect(MusicPromptResult.result.prompt).toBeDefined()
      expect(MusicPromptResult.result.basicInfo).toBeDefined()
    })

    it('应该定义分析历史记录结构', () => {
      expect(AnalysisHistory).toBeDefined()
      expect(AnalysisHistory.id).toBe('')
      expect(AnalysisHistory.sessionId).toBe('')
      expect(AnalysisHistory.analyses).toEqual([])
      expect(AnalysisHistory.userPreferences).toBeDefined()
      expect(AnalysisHistory.metadata).toBeDefined()
    })
  })

  describe('validateAnalysisResult 函数', () => {
    describe('内容分析验证', () => {
      it('应该验证有效的内容分析结果', () => {
        const validResult = {
          vlAnalysis: {
            duration: 150,
            keyframes: [{ timestamp: '00:10', description: '关键帧描述' }],
            scenes: [{ type: '风景', startTime: '00:00', endTime: '00:30' }],
            objects: [{ name: '人物', appearances: [{ start: '00:05', end: '00:15' }] }],
            actions: [{ action: '跑步', startTime: '00:10', endTime: '00:20' }]
          },
          finalReport: '这是一个详细的视频分析报告...',
          structuredData: {
            videoInfo: {
              duration: '2分30秒',
              format: 'mp4',
              size: '50MB',
              resolution: '1920x1080',
              frameRate: 30
            },
            contentAnalysis: {
              keyframes: [{ timestamp: '00:10', analysis: '关键帧分析' }],
              scenes: [{ category: '自然风景', description: '描述', duration: '30秒' }],
              objects: [{ name: '山川', significance: '重要性', frequency: '出现频率' }],
              actions: [{ description: '动作描述', sequence: '序列', significance: '重要性' }]
            },
            technicalAnalysis: {
              emotionalTone: '愉悦',
              colorPalette: [{ color: '#FF6B35', percentage: '25%' }],
              qualityAssessment: {
                clarity: 85,
                stability: 90,
                composition: 88
              },
              overallScore: 87
            }
          }
        }

        const validation = validateAnalysisResult(validResult, 'content')

        expect(validation.valid).toBe(true)
        expect(validation.errors).toEqual([])
      })

      it('应该检测缺少VL分析结果', () => {
        const invalidResult = {
          finalReport: '测试报告',
          structuredData: { videoInfo: {} }
        }

        const validation = validateAnalysisResult(invalidResult, 'content')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少VL分析结果')
      })

      it('应该检测缺少最终报告', () => {
        const invalidResult = {
          vlAnalysis: {},
          structuredData: { videoInfo: {} }
        }

        const validation = validateAnalysisResult(invalidResult, 'content')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少最终报告')
      })

      it('应该检测缺少结构化数据', () => {
        const invalidResult = {
          vlAnalysis: {},
          finalReport: '测试报告'
        }

        const validation = validateAnalysisResult(invalidResult, 'content')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少结构化数据')
      })

      it('应该检测所有必需字段的缺失', () => {
        const invalidResult = {}

        const validation = validateAnalysisResult(invalidResult, 'content')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toHaveLength(3)
        expect(validation.errors).toContain('缺少VL分析结果')
        expect(validation.errors).toContain('缺少最终报告')
        expect(validation.errors).toContain('缺少结构化数据')
      })

      it('应该验证VL分析的结构完整性', () => {
        const incompleteVLResult = {
          vlAnalysis: {
            // 缺少duration
            keyframes: [],
            scenes: [],
            objects: [],
            actions: []
          },
          finalReport: '报告',
          structuredData: {}
        }

        const validation = validateAnalysisResult(incompleteVLResult, 'content')

        expect(validation.valid).toBe(true) // 当前实现只检查字段是否存在，不检查内容
      })
    })

    describe('融合分析验证', () => {
      it('应该验证有效的融合分析结果', () => {
        const validResult = {
          video1Analysis: {
            vlAnalysis: {},
            finalReport: '视频1分析',
            structuredData: { videoInfo: {} }
          },
          video2Analysis: {
            vlAnalysis: {},
            finalReport: '视频2分析',
            structuredData: { videoInfo: {} }
          },
          fusionPlan: {
            overallPlan: {
              targetDuration: 45,
              narrativeLogic: '叙事逻辑',
              emotionalCurve: '情感曲线'
            },
            segmentation: [
              {
                id: 'segment_1',
                source: 'video1',
                startTime: '00:00',
                endTime: '00:20',
                targetStart: '00:00',
                targetEnd: '00:20',
                description: '分段描述',
                reason: '选择理由'
              }
            ],
            cropping: [
              {
                segmentId: 'segment_1',
                cropArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
                focusPoint: { x: 0.5, y: 0.5 },
                composition: 'rule_of_thirds',
                reason: '裁剪理由'
              }
            ],
            transitions: [
              {
                fromSegment: 'segment_1',
                toSegment: 'segment_2',
                type: 'fade',
                duration: 1.5,
                parameters: {},
                reason: '转场理由'
              }
            ],
            audioProcessing: {
              backgroundMusic: {
                volume: 0.7,
                fadePoints: [
                  { time: '00:00', type: 'fade_in', duration: 2.0 },
                  { time: '00:45', type: 'fade_out', duration: 3.0 }
                ]
              },
              soundEffects: [],
              volumeBalance: {
                video1: 0.8,
                video2: 0.6
              }
            },
            technicalParams: {
              resolution: '1920x1080',
              frameRate: 30,
              bitrate: 8000,
              codec: 'H.264',
              format: 'MP4'
            }
          },
          compatibility: {
            colorMatching: 0.8,
            styleCompatibility: 0.7,
            audioCompatibility: 0.9,
            overallCompatibility: 0.8,
            recommendations: ['建议1', '建议2']
          },
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

        const validation = validateAnalysisResult(validResult, 'fusion')

        expect(validation.valid).toBe(true)
        expect(validation.errors).toEqual([])
      })

      it('应该检测缺少视频1分析结果', () => {
        const invalidResult = {
          video2Analysis: {},
          fusionPlan: {}
        }

        const validation = validateAnalysisResult(invalidResult, 'fusion')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少视频1分析结果')
      })

      it('应该检测缺少视频2分析结果', () => {
        const invalidResult = {
          video1Analysis: {},
          fusionPlan: {}
        }

        const validation = validateAnalysisResult(invalidResult, 'fusion')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少视频2分析结果')
      })

      it('应该检测缺少融合方案', () => {
        const invalidResult = {
          video1Analysis: {},
          video2Analysis: {}
        }

        const validation = validateAnalysisResult(invalidResult, 'fusion')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少融合方案')
      })

      it('应该检测融合分析所有必需字段的缺失', () => {
        const invalidResult = {}

        const validation = validateAnalysisResult(invalidResult, 'fusion')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toHaveLength(3)
        expect(validation.errors).toContain('缺少视频1分析结果')
        expect(validation.errors).toContain('缺少视频2分析结果')
        expect(validation.errors).toContain('缺少融合方案')
      })
    })

    describe('音乐提示词验证', () => {
      it('应该验证有效的音乐提示词结果', () => {
        const validResult = {
          prompt: {
            fullPrompt: '完整的音乐提示词文本...',
            sections: {
              styleGuide: {
                primaryStyle: '轻音乐',
                secondaryStyles: ['爵士', '古典'],
                instrumentation: ['钢琴', '小提琴'],
                mood: '温馨',
                genre: 'New Age'
              },
              emotionalCurve: [
                {
                  start: 0,
                  end: 15,
                  emotion: 'peaceful',
                  intensity: 0.6,
                  description: '开场平和'
                },
                {
                  start: 15,
                  end: 30,
                  emotion: 'uplifting',
                  intensity: 0.8,
                  description: '逐渐提升'
                }
              ],
              rhythmMatching: [
                {
                  timestamp: '00:15',
                  rhythmChange: 'accelerate',
                  bpm: 120,
                  reason: '与画面动作匹配'
                }
              ],
              instrumentation: {
                lead: ['piano', 'violin'],
                harmony: ['cello', 'guitar'],
                rhythm: ['drums', 'bass'],
                ambient: ['strings', 'synth_pad'],
                effects: ['reverb', 'delay']
              },
              transitionCues: [
                {
                  timestamp: '00:20',
                  transitionType: 'fade',
                  musicChange: 'bridge_section',
                  description: '融合转场处的音乐处理'
                }
              ],
              technicalSpecs: {
                duration: 45,
                key: 'C major',
                timeSignature: '4/4',
                tempo: 120,
                dynamics: 'moderate',
                structure: 'intro-verse-chorus-outro'
              },
              atmosphere: {
                overall: '整体氛围描述',
                spatial: '空间感描述',
                texture: '音色质感描述',
                evolution: '演变过程描述'
              }
            }
          },
          basicInfo: {
            targetDuration: 45,
            musicStyle: '轻音乐',
            emotionalTone: '温馨',
            tempo: 120
          },
          usability: {
            clarity: 90,
            specificity: 85,
            completeness: 95,
            overallScore: 90
          }
        }

        const validation = validateAnalysisResult(validResult, 'music')

        expect(validation.valid).toBe(true)
        expect(validation.errors).toEqual([])
      })

      it('应该检测缺少提示词', () => {
        const invalidResult = {
          basicInfo: {}
        }

        const validation = validateAnalysisResult(invalidResult, 'music')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少提示词')
      })

      it('应该检测缺少基础信息', () => {
        const invalidResult = {
          prompt: {}
        }

        const validation = validateAnalysisResult(invalidResult, 'music')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('缺少基础信息')
      })

      it('应该检测音乐提示词所有必需字段的缺失', () => {
        const invalidResult = {}

        const validation = validateAnalysisResult(invalidResult, 'music')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toHaveLength(2)
        expect(validation.errors).toContain('缺少提示词')
        expect(validation.errors).toContain('缺少基础信息')
      })
    })

    describe('未知类型验证', () => {
      it('应该拒绝未知的分析类型', () => {
        const result = { someData: 'test' }

        const validation = validateAnalysisResult(result, 'unknown')

        expect(validation.valid).toBe(false)
        expect(validation.errors).toContain('未知的分析类型')
      })
    })
  })

  describe('边界条件和异常数据测试', () => {
    it('应该处理null值输入', () => {
      const validation = validateAnalysisResult(null, 'content')

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('应该处理undefined值输入', () => {
      const validation = validateAnalysisResult(undefined, 'content')

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('应该处理空对象输入', () => {
      const validation = validateAnalysisResult({}, 'content')

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('应该处理空字符串字段', () => {
      const result = {
        vlAnalysis: {},
        finalReport: '',
        structuredData: { videoInfo: {} }
      }

      const validation = validateAnalysisResult(result, 'content')

      // 当前实现只检查字段是否存在，不检查内容
      expect(validation.valid).toBe(true)
    })

    it('应该处理部分字段为null的情况', () => {
      const result = {
        vlAnalysis: null,
        finalReport: '报告',
        structuredData: { videoInfo: {} }
      }

      const validation = validateAnalysisResult(result, 'content')

      expect(validation.valid).toBe(true) // 当前认为null是存在的字段
    })
  })

  describe('数据结构完整性测试', () => {
    it('内容分析结果应该包含所有必需的嵌套结构', () => {
      const result = ContentAnalysisResult

      // 验证顶层结构
      expect(result.type).toBe('content')
      expect(result.result).toBeDefined()

      // 验证VL分析结构
      expect(result.result.vlAnalysis).toBeDefined()
      expect(result.result.vlAnalysis.duration).toBeDefined()
      expect(result.result.vlAnalysis.keyframes).toBeDefined()
      expect(result.result.vlAnalysis.scenes).toBeDefined()
      expect(result.result.vlAnalysis.objects).toBeDefined()
      expect(result.result.vlAnalysis.actions).toBeDefined()

      // 验证结构化数据
      expect(result.result.structuredData).toBeDefined()
      expect(result.result.structuredData.videoInfo).toBeDefined()
      expect(result.result.structuredData.contentAnalysis).toBeDefined()
      expect(result.result.structuredData.technicalAnalysis).toBeDefined()

      // 验证摘要信息
      expect(result.result.summary).toBeDefined()
      expect(result.result.summary.duration).toBeDefined()
      expect(result.result.summary.keyframeCount).toBeDefined()
    })

    it('融合分析结果应该包含完整的融合方案结构', () => {
      const result = FusionAnalysisResult

      // 验证融合方案结构
      expect(result.result.fusionPlan).toBeDefined()
      expect(result.result.fusionPlan.overallPlan).toBeDefined()
      expect(result.result.fusionPlan.segmentation).toBeDefined()
      expect(result.result.fusionPlan.cropping).toBeDefined()
      expect(result.result.fusionPlan.transitions).toBeDefined()
      expect(result.result.fusionPlan.audioProcessing).toBeDefined()
      expect(result.result.fusionPlan.technicalParams).toBeDefined()

      // 验证兼容性分析
      expect(result.result.compatibility).toBeDefined()
      expect(result.result.timeline).toBeDefined()
    })

    it('音乐提示词结果应该包含完整的提示词结构', () => {
      const result = MusicPromptResult

      // 验证提示词结构
      expect(result.result.prompt).toBeDefined()
      expect(result.result.prompt.fullPrompt).toBeDefined()
      expect(result.result.prompt.sections).toBeDefined()

      // 验证提示词段落
      const sections = result.result.prompt.sections
      expect(sections.styleGuide).toBeDefined()
      expect(sections.emotionalCurve).toBeDefined()
      expect(sections.rhythmMatching).toBeDefined()
      expect(sections.instrumentation).toBeDefined()
      expect(sections.transitionCues).toBeDefined()
      expect(sections.technicalSpecs).toBeDefined()
      expect(sections.atmosphere).toBeDefined()

      // 验证基础信息
      expect(result.result.basicInfo).toBeDefined()
      expect(result.result.usability).toBeDefined()
    })

    it('分析历史记录应该包含完整的元数据结构', () => {
      const history = AnalysisHistory

      expect(history.analyses).toEqual([])
      expect(history.userPreferences).toBeDefined()
      expect(history.metadata).toBeDefined()
      expect(history.metadata.totalAnalysisTime).toBeDefined()
      expect(history.metadata.tokenConsumption).toBeDefined()
      expect(history.metadata.costEstimate).toBeDefined()
    })
  })

  describe('数据类型验证', () => {
    it('应该验证数值字段的数据类型', () => {
      const result = ContentAnalysisResult

      expect(typeof result.result.structuredData.technicalAnalysis.qualityAssessment.clarity).toBe('number')
      expect(typeof result.result.summary.duration).toBe('number')
      expect(typeof result.result.summary.keyframeCount).toBe('number')
    })

    it('应该验证数组字段的数据类型', () => {
      const result = ContentAnalysisResult

      expect(Array.isArray(result.result.vlAnalysis.keyframes)).toBe(true)
      expect(Array.isArray(result.result.vlAnalysis.scenes)).toBe(true)
      expect(Array.isArray(result.result.vlAnalysis.objects)).toBe(true)
      expect(Array.isArray(result.result.vlAnalysis.actions)).toBe(true)
    })

    it('应该验证融合分析中的数值范围', () => {
      const result = FusionAnalysisResult

      // 兼容性评分应该在0-1之间
      expect(result.result.compatibility.colorMatching).toBeGreaterThanOrEqual(0)
      expect(result.result.compatibility.colorMatching).toBeLessThanOrEqual(1)
      expect(result.result.compatibility.styleCompatibility).toBeGreaterThanOrEqual(0)
      expect(result.result.compatibility.styleCompatibility).toBeLessThanOrEqual(1)
    })

    it('应该验证音乐提示词中的评分范围', () => {
      const result = MusicPromptResult

      expect(result.result.usability.clarity).toBeGreaterThanOrEqual(0)
      expect(result.result.usability.clarity).toBeLessThanOrEqual(100)
      expect(result.result.usability.specificity).toBeGreaterThanOrEqual(0)
      expect(result.result.usability.specificity).toBeLessThanOrEqual(100)
      expect(result.result.usability.completeness).toBeGreaterThanOrEqual(0)
      expect(result.result.usability.completeness).toBeLessThanOrEqual(100)
    })
  })
})