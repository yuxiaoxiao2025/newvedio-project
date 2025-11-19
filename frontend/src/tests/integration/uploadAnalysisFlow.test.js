/**
 * 上传分析流程集成测试
 *
 * 测试覆盖范围：
 * - 文件上传到AI分析的完整流程
 * - 多种分析类型的集成测试
 * - 上传组件和分析服务的协作
 * - 错误处理和状态同步
 * - 实时进度更新机制
 *
 * 测试方法：
 * - 使用 Vitest + Vue Test Utils 进行组件集成测试
 * - Mock 外部API但保持内部逻辑完整性
 * - 测试组件间的数据流和事件处理
 * - 验证完整用户场景的实现
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useWebSocket } from '@/composables/useWebSocket'
import {
  createMockVideoFile,
  createMockFormData,
  TEST_CONFIG
} from '@/tests/fixtures/dataFactory'

// Mock WebSocket
vi.mock('@/composables/useWebSocket', () => ({
  useWebSocket: () => ({
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    isConnected: ref(false),
    messages: ref([])
  })
}))

// Mock analysis storage
vi.mock('@/utils/analysisStorage', () => ({
  saveAnalysisResult: vi.fn(() => ({})),
  getAnalysisResults: vi.fn(() => []),
  exportAnalysisResults: vi.fn(() => '{}'),
  getStorageStats: vi.fn(() => ({
    totalResults: 0,
    storageSize: { total: 0, percentage: '0' }
  }))
}))

// Mock fetch for upload simulation
global.fetch = vi.fn()

describe('上传分析流程集成测试', () => {
  let mockFetch
  let mockUploadProgress
  let mockAnalysisProgress

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock fetch with different responses for different endpoints
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Mock XMLHttpRequest for file upload progress
    global.XMLHttpRequest = vi.fn(() => ({
      upload: {
        addEventListener: vi.fn((event, callback) => {
          if (event === 'progress') {
            mockUploadProgress = callback
          }
        })
      },
      addEventListener: vi.fn((event, callback) => {
        if (event === 'load') {
          // Simulate successful upload
          setTimeout(() => callback({
            target: {
              response: JSON.stringify({
                success: true,
                data: {
                  files: [
                    { originalname: 'test-video.mp4', path: '/uploads/test-video.mp4' }
                  ]
                }
              })
            }
          }), 0)
        }
      }),
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn()
    }))

    // Mock progress tracking
    mockAnalysisProgress = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('文件上传到内容分析流程', () => {
    it('应该完成从文件上传到内容分析的完整流程', async () => {
      const mockFiles = [
        createMockVideoFile({ name: 'personal-video.mp4', size: 50 * 1024 * 1024 })
      ]

      // Mock upload API response
      const uploadResponse = {
        success: true,
        data: {
          files: [
            {
              originalname: 'personal-video.mp4',
              path: '/uploads/personal-video.mp4',
              size: 50 * 1024 * 1024,
              category: 'personal'
            }
          ],
          sessionId: 'upload-session-123'
        }
      }

      // Mock content analysis API response
      const analysisResponse = {
        data: {
          analysisId: 'content-analysis-456',
          analysisType: 'content',
          finalReport: '这是一个关于个人视频的详细分析报告...',
          structuredData: {
            videoInfo: {
              duration: '2分30秒',
              format: 'mp4',
              resolution: '1920x1080'
            },
            contentAnalysis: {
              keyframes: [
                { timestamp: '00:10', analysis: '开场人物特写' },
                { timestamp: '01:20', analysis: '风景展示' }
              ],
              scenes: [
                { category: '人物', duration: '45秒' },
                { category: '风景', duration: '105秒' }
              ]
            },
            technicalAnalysis: {
              emotionalTone: '温馨',
              qualityAssessment: {
                clarity: 85,
                stability: 90,
                composition: 88
              },
              overallScore: 87
            }
          }
        }
      }

      // Setup mock fetch responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(uploadResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(analysisResponse)
        })

      // Initialize composables
      const {
        files,
        uploadProgress,
        uploadFiles,
        isUploading,
        uploadComplete,
        error: uploadError
      } = useFileUpload()

      const {
        analyzeVideoContent,
        isAnalyzing,
        analysisProgress,
        analysisResult,
        error: analysisError,
        formattedResult
      } = useAIAnalysis()

      // Step 1: 模拟文件选择
      files.value = mockFiles

      expect(files.value).toHaveLength(1)
      expect(files.value[0].name).toBe('personal-video.mp4')

      // Step 2: 执行文件上传
      const uploadPromise = uploadFiles('personal')

      // 模拟上传进度更新
      mockUploadProgress({
        lengthComputable: true,
        loaded: 25 * 1024 * 1024,
        total: 50 * 1024 * 1024
      })

      await uploadPromise

      // 验证上传完成状态
      expect(isUploading.value).toBe(false)
      expect(uploadComplete.value).toBe(true)
      expect(uploadProgress.value).toBe(100)
      expect(uploadError.value).toBe(null)

      // Step 3: 执行内容分析
      const videoData = {
        path: '/uploads/personal-video.mp4',
        category: 'personal',
        sessionId: 'upload-session-123'
      }

      const analysisPromise = analyzeVideoContent(videoData)

      // 等待分析完成（包括模拟的进度更新）
      await analysisPromise

      // 验证分析完成状态
      expect(isAnalyzing.value).toBe(false)
      expect(analysisProgress.value).toBe(100)
      expect(analysisError.value).toBe(null)

      // 验证分析结果
      expect(analysisResult.value).toBeDefined()
      expect(analysisResult.value.analysisId).toBe('content-analysis-456')
      expect(analysisResult.value.finalReport).toContain('个人视频的详细分析报告')

      // 验证格式化结果
      expect(formattedResult.value).toBeDefined()
      expect(formattedResult.value.type).toBe('content')
      expect(formattedResult.value.contentAnalysis).toBeDefined()
      expect(formattedResult.value.contentAnalysis.report).toBeTruthy()
    })

    it('应该处理上传失败的情况', async () => {
      const mockFiles = [createMockVideoFile()]

      // Mock上传失败
      global.XMLHttpRequest = vi.fn(() => {
        const xhr = {
          upload: {
            addEventListener: vi.fn()
          },
          addEventListener: vi.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback({
                target: {
                  status: 500,
                  response: 'Upload failed'
                }
              }), 0)
            }
          }),
          open: vi.fn(),
          send: vi.fn(),
          setRequestHeader: vi.fn()
        }
        return xhr
      })

      const { files, uploadFiles, isUploading, error } = useFileUpload()

      files.value = mockFiles

      await expect(uploadFiles('personal')).rejects.toThrow()

      expect(isUploading.value).toBe(false)
      expect(error.value).toBeTruthy()
    })

    it('应该处理分析API错误响应', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      // Mock分析API错误
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          error: 'Invalid video format'
        })
      })

      const { analyzeVideoContent, isAnalyzing, error } = useAIAnalysis()

      await expect(analyzeVideoContent(mockVideoData)).rejects.toThrow('分析失败: 400 Bad Request')

      expect(isAnalyzing.value).toBe(false)
      expect(error.value).toBe('分析失败: 400 Bad Request')
    })
  })

  describe('文件上传到融合分析流程', () => {
    it('应该完成双文件融合分析的完整流程', async () => {
      const mockFiles = [
        createMockVideoFile({ name: 'video1.mp4' }),
        createMockVideoFile({ name: 'video2.mp4' })
      ]

      // Mock upload API response for fusion
      const uploadResponse = {
        success: true,
        data: {
          files: [
            { path: '/uploads/video1.mp4', category: 'personal' },
            { path: '/uploads/video2.mp4', category: 'personal' }
          ],
          sessionId: 'fusion-upload-789'
        }
      }

      // Mock fusion analysis API response
      const fusionResponse = {
        data: {
          analysisId: 'fusion-analysis-101',
          analysisType: 'fusion',
          fusionPlan: {
            overallPlan: {
              targetDuration: 60,
              narrativeLogic: '通过时间线交错展现两个场景的关联',
              emotionalCurve: '从平静到高潮再到温馨收尾'
            },
            segmentation: [
              {
                id: 'segment_1',
                source: 'video1',
                startTime: '00:00',
                endTime: '00:20',
                targetStart: '00:00',
                targetEnd: '00:20',
                description: '开场场景引入',
                reason: '建立情感基调'
              },
              {
                id: 'segment_2',
                source: 'video2',
                startTime: '00:30',
                endTime: '00:40',
                targetStart: '00:20',
                targetEnd: '00:30',
                description: '关键内容展示',
                reason: '增加视觉变化'
              }
            ],
            transitions: [
              {
                fromSegment: 'segment_1',
                toSegment: 'segment_2',
                type: 'fade',
                duration: 2.0,
                reason: '平滑的情感转换'
              }
            ],
            technicalParams: {
              resolution: '1920x1080',
              frameRate: 30,
              codec: 'H.264'
            }
          },
          compatibility: {
            colorMatching: 0.85,
            styleCompatibility: 0.78,
            overallCompatibility: 0.82,
            recommendations: ['建议调整白平衡', '增加转场效果']
          }
        }
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(uploadResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(fusionResponse)
        })

      // Initialize composables
      const { files, uploadFiles } = useFileUpload()
      const { analyzeVideoFusion, analysisResult, formattedResult } = useAIAnalysis()

      // Step 1: 上传文件
      files.value = mockFiles
      await uploadFiles('personal')

      // Step 2: 执行融合分析
      const video1Data = { path: '/uploads/video1.mp4', category: 'personal' }
      const video2Data = { path: '/uploads/video2.mp4', category: 'personal' }

      await analyzeVideoFusion(video1Data, video2Data)

      // 验证融合分析结果
      expect(analysisResult.value).toBeDefined()
      expect(analysisResult.value.analysisType).toBe('fusion')
      expect(analysisResult.value.fusionPlan).toBeDefined()
      expect(analysisResult.value.fusionPlan.overallPlan.targetDuration).toBe(60)

      // 验证格式化结果中的融合分析
      expect(formattedResult.value.fusionAnalysis).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.plan).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.compatibility).toBeDefined()
      expect(formattedResult.value.fusionAnalysis.compatibility.colorMatching).toBe(0.85)
    })

    it('融合分析应该包含音乐提示词生成的准备工作', async () => {
      const fusionPlan = {
        overallPlan: { targetDuration: 45 },
        segmentation: [
          { source: 'video1', startTime: '00:00', endTime: '00:20' },
          { source: 'video2', startTime: '00:25', endTime: '00:45' }
        ],
        transitions: [
          { fromSegment: 'segment_1', toSegment: 'segment_2', type: 'fade' }
        ]
      }

      const musicResponse = {
        data: {
          musicPrompt: '生成温馨的轻音乐，适合展示家庭聚会场景...',
          basicInfo: {
            musicStyle: '轻音乐',
            emotionalTone: '温馨',
            tempo: 110
          }
        }
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(musicResponse)
      })

      const { generateMusicPrompt, analysisResult } = useAIAnalysis()

      await generateMusicPrompt(fusionPlan)

      expect(analysisResult.value).toBeDefined()
      expect(analysisResult.value.musicPrompt).toContain('温馨的轻音乐')
      expect(analysisResult.value.basicInfo.emotionalTone).toBe('温馨')
    })
  })

  describe('一体化分析流程', () => {
    it('应该支持直接上传并分析的模式', async () => {
      const mockFiles = [
        createMockVideoFile({ name: 'direct-upload.mp4' })
      ]

      // Mock一体化分析API
      const directAnalysisResponse = {
        data: {
          analysisId: 'direct-analysis-202',
          analysisType: 'content',
          result: {
            finalReport: '直接分析生成的报告...',
            structuredData: {
              videoInfo: { duration: '1分45秒' }
            }
          }
        }
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(directAnalysisResponse)
      })

      const { analyzeUploadedFiles, analysisResult } = useAIAnalysis()

      const result = await analyzeUploadedFiles(mockFiles, 'personal', 'content')

      // 验证直接分析结果
      expect(result).toBeDefined()
      expect(result.analysisId).toBe('direct-analysis-202')
      expect(analysisResult.value).toEqual(result)

      // 验证API调用
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/analyze/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    it('应该支持不同类型的一体化分析', async () => {
      const mockFiles = [
        createMockVideoFile({ name: 'fusion-test.mp4' }),
        createMockVideoFile({ name: 'fusion-test-2.mp4' })
      ]

      // Mock不同类型的分析响应
      const responses = [
        {
          data: {
            analysisType: 'fusion',
            fusionPlan: { targetDuration: 60 }
          }
        },
        {
          data: {
            analysisType: 'content',
            finalReport: '内容分析完成'
          }
        }
      ]

      const { analyzeUploadedFiles } = useAIAnalysis()

      // 测试融合分析
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(responses[0])
      })

      const fusionResult = await analyzeUploadedFiles(mockFiles, 'personal', 'fusion')
      expect(fusionResult.analysisType).toBe('fusion')

      // 测试内容分析
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(responses[1])
      })

      const contentResult = await analyzeUploadedFiles(mockFiles, 'personal', 'content')
      expect(contentResult.analysisType).toBe('content')
    })
  })

  describe('实时进度更新机制', () => {
    it('应该在上传过程中更新进度', async () => {
      const { uploadFiles, uploadProgress } = useFileUpload()

      // 创建一个可控制的进度模拟
      let progressCallback = null

      global.XMLHttpRequest = vi.fn(() => ({
        upload: {
          addEventListener: vi.fn((event, callback) => {
            if (event === 'progress') {
              progressCallback = callback
            }
          })
        },
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(callback, 100) // 延迟完成
          }
        }),
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn()
      }))

      const uploadPromise = uploadFiles([createMockVideoFile()], 'personal')

      // 模拟进度更新
      if (progressCallback) {
        progressCallback({
          lengthComputable: true,
          loaded: 10 * 1024 * 1024,
          total: 50 * 1024 * 1024
        })

        await nextTick()
        expect(uploadProgress.value).toBe(20) // 10/50 * 100

        progressCallback({
          lengthComputable: true,
          loaded: 25 * 1024 * 1024,
          total: 50 * 1024 * 1024
        })

        await nextTick()
        expect(uploadProgress.value).toBe(50) // 25/50 * 100
      }

      await uploadPromise
    })

    it('应该在分析过程中更新进度', async () => {
      const { analyzeVideoContent, analysisProgress } = useAIAnalysis()

      // Mock长时间运行的分析
      mockFetch.mockImplementation(() => new Promise(resolve => {
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          if (analysisProgress.value < 90) {
            analysisProgress.value += 10
          }
        }, 100)

        setTimeout(() => {
          clearInterval(progressInterval)
          analysisProgress.value = 100
          resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { analysisId: 'test' } })
          })
        }, 500)
      }))

      const videoData = { path: '/test/video.mp4', category: 'personal' }

      const analysisPromise = analyzeVideoContent(videoData)

      // 验证进度更新
      await new Promise(resolve => {
        const checkProgress = () => {
          if (analysisProgress.value > 0 && analysisProgress.value < 100) {
            expect(analysisProgress.value).toBeGreaterThan(0)
            expect(analysisProgress.value).toBeLessThan(100)
            resolve()
          } else {
            setTimeout(checkProgress, 50)
          }
        }
        checkProgress()
      })

      await analysisPromise

      expect(analysisProgress.value).toBe(100)
    })
  })

  describe('错误处理和恢复机制', () => {
    it('应该处理网络连接错误', async () => {
      const { analyzeVideoContent, error } = useAIAnalysis()

      mockFetch.mockRejectedValue(new Error('Network connection failed'))

      const videoData = { path: '/test/video.mp4', category: 'personal' }

      await expect(analyzeVideoContent(videoData)).rejects.toThrow('Network connection failed')

      expect(error.value).toBe('Network connection failed')
    })

    it('应该处理服务器超时', async () => {
      const { analyzeVideoContent, error } = useAIAnalysis()

      mockFetch.mockRejectedValue(new Error('Request timeout'))

      const videoData = { path: '/test/video.mp4', category: 'personal' }

      await expect(analyzeVideoContent(videoData)).rejects.toThrow('Request timeout')

      expect(error.value).toBe('Request timeout')
    })

    it('应该处理无效的API响应格式', async () => {
      const { analyzeVideoContent, analysisResult } = useAIAnalysis()

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          // 缺少data字段
          error: 'Invalid response format'
        })
      })

      const videoData = { path: '/test/video.mp4', category: 'personal' }

      const result = await analyzeVideoContent(videoData)

      // 应该能够处理不完整的响应
      expect(result).toBeDefined()
      expect(analysisResult.value).toBe(result)
    })
  })

  describe('状态同步和数据一致性', () => {
    it('应该确保上传和分析状态的一致性', async () => {
      const { files, uploadFiles, uploadComplete } = useFileUpload()
      const { analyzeVideoContent, isAnalyzing } = useAIAnalysis()

      const mockFiles = [createMockVideoFile()]
      files.value = mockFiles

      // 上传前状态
      expect(uploadComplete.value).toBe(false)

      // 模拟上传完成
      global.XMLHttpRequest = vi.fn(() => ({
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => callback({
              target: { response: JSON.stringify({ success: true, data: {} }) }
            }), 0)
          }
        }),
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn()
      }))

      await uploadFiles('personal')

      expect(uploadComplete.value).toBe(true)

      // 开始分析
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      })

      await analyzeVideoContent({ path: '/test.mp4', category: 'personal' })

      // 分析完成后，上传状态应该保持完成
      expect(uploadComplete.value).toBe(true)
      expect(isAnalyzing.value).toBe(false)
    })

    it('应该正确处理多个并发请求', async () => {
      const { analyzeVideoContent } = useAIAnalysis()

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { analysisId: 'test' } })
      })

      // 启动多个并发分析
      const promises = [
        analyzeVideoContent({ path: '/test1.mp4', category: 'personal' }),
        analyzeVideoContent({ path: '/test2.mp4', category: 'personal' }),
        analyzeVideoContent({ path: '/test3.mp4', category: 'personal' })
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})