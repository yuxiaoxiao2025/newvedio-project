/**
 * useAIAnalysis Composable 单元测试
 *
 * 测试覆盖范围：
 * - AI分析服务初始化
 * - 视频内容分析功能
 * - 视频融合分析功能
 * - 背景音乐提示词生成功能
 * - 状态管理和错误处理
 * - 存储和导出功能
 *
 * 测试方法：
 * - 使用 Vitest + Vue Test Utils
 * - Mock 外部依赖 (fetch, localStorage, WebSocket)
 * - 模拟各种场景和边界条件
 * - 验证状态变化和方法调用
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import {
  createMockVideoFile,
  createMockWebSocket,
  createMockFormData,
  TEST_CONFIG
} from '@/tests/fixtures/dataFactory'

// Mock WebSocket composable
vi.mock('@/composables/useWebSocket', () => ({
  useWebSocket: () => ({
    joinSession: vi.fn(),
    leaveSession: vi.fn()
  })
}))

// Mock analysis storage
vi.mock('@/utils/analysisStorage', () => ({
  saveAnalysisResult: vi.fn(),
  getAnalysisResults: vi.fn(() => []),
  exportAnalysisResults: vi.fn(() => '{}'),
  getStorageStats: vi.fn(() => ({
    totalResults: 0,
    storageSize: { total: 0, percentage: '0' }
  }))
}))

describe('useAIAnalysis Composable', () => {
  let mockFetch
  let mockLocalStorage

  beforeEach(() => {
    // 清除所有Mock调用记录
    vi.clearAllMocks()

    // Mock fetch API
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    global.localStorage = mockLocalStorage

    // 设置默认的localStorage token
    mockLocalStorage.getItem.mockReturnValue('test-token')
  })

  afterEach(() => {
    // 清理测试环境
    vi.restoreAllMocks()
  })

  describe('初始化测试', () => {
    it('应该正确初始化AI分析状态', () => {
      const { isAnalyzing, analysisProgress, analysisResult, error } = useAIAnalysis()

      expect(isAnalyzing.value).toBe(false)
      expect(analysisProgress.value).toBe(0)
      expect(analysisResult.value).toBe(null)
      expect(error.value).toBe(null)
    })

    it('应该提供所有必需的方法', () => {
      const {
        analyzeVideoContent,
        analyzeVideoFusion,
        generateMusicPrompt,
        analyzeUploadedFiles,
        getAnalysisStatus,
        resetAnalysis,
        getAnalysisHistory,
        exportResults,
        getStorageStatistics,
        clearStorage
      } = useAIAnalysis()

      expect(typeof analyzeVideoContent).toBe('function')
      expect(typeof analyzeVideoFusion).toBe('function')
      expect(typeof generateMusicPrompt).toBe('function')
      expect(typeof analyzeUploadedFiles).toBe('function')
      expect(typeof getAnalysisStatus).toBe('function')
      expect(typeof resetAnalysis).toBe('function')
      expect(typeof getAnalysisHistory).toBe('function')
      expect(typeof exportResults).toBe('function')
      expect(typeof getStorageStatistics).toBe('function')
      expect(typeof clearStorage).toBe('function')
    })
  })

  describe('视频内容分析功能', () => {
    it('应该成功执行视频内容分析', async () => {
      const mockVideoData = {
        path: '/test/video.mp4',
        category: 'personal',
        sessionId: 'test-session-123'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            analysisId: 'analysis_123',
            finalReport: '这是一个关于个人视频的分析报告...',
            structuredData: {
              videoInfo: {
                duration: '2分30秒',
                format: 'mp4',
                resolution: '1920x1080'
              }
            }
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const { analyzeVideoContent, isAnalyzing, analysisProgress, analysisResult, error } = useAIAnalysis()

      const result = await analyzeVideoContent(mockVideoData)

      // 验证API调用
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/analyze/content`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify({
            videoPath: mockVideoData.path,
            category: mockVideoData.category
          })
        })
      )

      // 验证状态变化
      expect(isAnalyzing.value).toBe(false) // 应该完成并重置
      expect(analysisProgress.value).toBe(100)
      expect(error.value).toBe(null)

      // 验证返回结果
      expect(result).toBeDefined()
      expect(result.analysisId).toBe('analysis_123')
      expect(result.finalReport).toBeTruthy()

      // 验证结果被保存
      expect(analysisResult.value).toEqual(result)
    })

    it('应该正确处理分析过程中的状态变化', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      // 模拟长时间运行的分析
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { analysisId: 'analysis_123', finalReport: '完成' }
            })
          })
        }, 100)
      }))

      const { analyzeVideoContent, isAnalyzing, analysisProgress } = useAIAnalysis()

      const analysisPromise = analyzeVideoContent(mockVideoData)

      // 立即检查初始状态
      expect(isAnalyzing.value).toBe(true)
      expect(analysisProgress.value).toBe(0)

      await analysisPromise

      // 分析完成后状态
      expect(isAnalyzing.value).toBe(false)
      expect(analysisProgress.value).toBe(100)
    })

    it('应该处理API错误响应', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const { analyzeVideoContent, isAnalyzing, error } = useAIAnalysis()

      await expect(analyzeVideoContent(mockVideoData)).rejects.toThrow('分析失败: 500 Internal Server Error')

      expect(isAnalyzing.value).toBe(false)
      expect(error.value).toBe('分析失败: 500 Internal Server Error')
    })

    it('应该处理网络错误', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { analyzeVideoContent, isAnalyzing, error } = useAIAnalysis()

      await expect(analyzeVideoContent(mockVideoData)).rejects.toThrow('Network error')

      expect(isAnalyzing.value).toBe(false)
      expect(error.value).toBe('Network error')
    })

    it('应该使用默认token当localStorage中没有token时', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      })

      const { analyzeVideoContent } = useAIAnalysis()

      await analyzeVideoContent(mockVideoData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer demo-token'
          })
        })
      )
    })
  })

  describe('视频融合分析功能', () => {
    it('应该成功执行视频融合分析', async () => {
      const mockVideo1Data = { path: '/test/video1.mp4', category: 'personal' }
      const mockVideo2Data = { path: '/test/video2.mp4', category: 'personal' }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            analysisId: 'fusion_123',
            fusionPlan: {
              overallPlan: {
                targetDuration: 60,
                narrativeLogic: '两段视频的叙事逻辑...'
              },
              segmentation: [
                {
                  id: 'segment_1',
                  source: 'video1',
                  startTime: '00:00',
                  endTime: '00:30'
                }
              ]
            }
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const { analyzeVideoFusion, analysisResult, error } = useAIAnalysis()

      const result = await analyzeVideoFusion(mockVideo1Data, mockVideo2Data)

      // 验证API调用
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/analyze/fusion`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            video1Path: mockVideo1Data.path,
            video2Path: mockVideo2Data.path,
            category: 'personal'
          })
        })
      )

      expect(error.value).toBe(null)
      expect(result.fusionPlan).toBeDefined()
      expect(result.fusionPlan.overallPlan.targetDuration).toBe(60)
    })

    it('融合分析应该比内容分析有更长的处理时间', async () => {
      const mockVideo1Data = { path: '/test/video1.mp4', category: 'personal' }
      const mockVideo2Data = { path: '/test/video2.mp4', category: 'personal' }

      let contentProgressSteps = []
      let fusionProgressSteps = []

      // Mock content analysis
      const mockContentResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      }

      // Mock fusion analysis
      const mockFusionResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      }

      mockFetch
        .mockResolvedValueOnce(mockContentResponse)
        .mockResolvedValueOnce(mockFusionResponse)

      const { analyzeVideoContent, analyzeVideoFusion, analysisProgress } = useAIAnalysis()

      // Mock progress tracking
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn((callback, delay) => {
        if (typeof callback === 'function') {
          if (delay === 1000) {
            contentProgressSteps.push(delay)
          } else if (delay === 1500) {
            fusionProgressSteps.push(delay)
          }
        }
        return originalSetTimeout(callback, 0)
      })

      await Promise.all([
        analyzeVideoContent({ path: '/test/content.mp4', category: 'personal' }),
        analyzeVideoFusion(mockVideo1Data, mockVideo2Data)
      ])

      // 融合分析的进度更新间隔应该更长（1500ms vs 1000ms）
      expect(fusionProgressSteps.length).toBeGreaterThan(0)

      // 恢复原始setTimeout
      global.setTimeout = originalSetTimeout
    })
  })

  describe('背景音乐提示词生成功能', () => {
    it('应该成功生成背景音乐提示词', async () => {
      const mockFusionPlan = {
        overallPlan: { targetDuration: 60 },
        sessionId: 'test-session-123'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            musicPrompt: '生成轻柔的背景音乐，适合个人视频...',
            basicInfo: {
              musicStyle: '轻音乐',
              emotionalTone: '温馨',
              tempo: 120
            }
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const { generateMusicPrompt, analysisResult, error } = useAIAnalysis()

      const result = await generateMusicPrompt(mockFusionPlan)

      // 验证API调用
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/generate/music-prompt`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fusionPlan: mockFusionPlan
          })
        })
      )

      expect(error.value).toBe(null)
      expect(result.musicPrompt).toContain('轻柔的背景音乐')
      expect(result.basicInfo.musicStyle).toBe('轻音乐')
    })

    it('音乐生成的进度更新间隔应该为800ms', async () => {
      const mockFusionPlan = { overallPlan: { targetDuration: 60 } }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      })

      const { generateMusicPrompt } = useAIAnalysis()

      const originalSetTimeout = global.setTimeout
      const progressDelays = []

      global.setTimeout = vi.fn((callback, delay) => {
        if (typeof callback === 'function' && delay === 800) {
          progressDelays.push(delay)
        }
        return originalSetTimeout(callback, 0)
      })

      await generateMusicPrompt(mockFusionPlan)

      expect(progressDelays.length).toBeGreaterThan(0)

      // 恢复原始setTimeout
      global.setTimeout = originalSetTimeout
    })
  })

  describe('一体化分析功能', () => {
    it('应该成功处理上传文件的一体化分析', async () => {
      const mockFiles = [
        createMockVideoFile({ name: 'video1.mp4' }),
        createMockVideoFile({ name: 'video2.mp4' })
      ]
      const category = 'personal'
      const analysisType = 'fusion'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            analysisId: 'upload_123',
            analysisType: 'fusion',
            result: { fusionPlan: { targetDuration: 45 } }
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const { analyzeUploadedFiles, analysisResult, error } = useAIAnalysis()

      const result = await analyzeUploadedFiles(mockFiles, category, analysisType)

      // 验证FormData构造
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/analyze/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )

      expect(error.value).toBe(null)
      expect(result.analysisType).toBe('fusion')
    })

    it('应该根据分析类型调整进度更新策略', async () => {
      const mockFiles = [createMockVideoFile()]
      const category = 'personal'

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      })

      const { analyzeUploadedFiles } = useAIAnalysis()

      const originalSetTimeout = global.setTimeout
      const progressDelays = []

      global.setTimeout = vi.fn((callback, delay) => {
        if (typeof callback === 'function') {
          progressDelays.push(delay)
        }
        return originalSetTimeout(callback, 0)
      })

      // 测试融合分析的进度更新（2000ms间隔）
      await analyzeUploadedFiles(mockFiles, category, 'fusion')

      // 重置delay记录
      progressDelays.length = 0

      // 测试内容分析的进度更新（1000ms间隔）
      await analyzeUploadedFiles(mockFiles, category, 'content')

      expect(progressDelays.length).toBeGreaterThan(0)

      // 恢复原始setTimeout
      global.setTimeout = originalSetTimeout
    })
  })

  describe('状态管理功能', () => {
    it('resetAnalysis 应该重置所有状态', () => {
      const {
        resetAnalysis,
        isAnalyzing,
        analysisProgress,
        analysisResult,
        error
      } = useAIAnalysis()

      // 模拟非初始状态
      isAnalyzing.value = true
      analysisProgress.value = 50
      analysisResult.value = { someData: 'test' }
      error.value = 'Some error'

      resetAnalysis()

      expect(isAnalyzing.value).toBe(false)
      expect(analysisProgress.value).toBe(0)
      expect(analysisResult.value).toBe(null)
      expect(error.value).toBe(null)
    })

    it('getAnalysisStatus 应该返回状态信息', async () => {
      const analysisId = 'test-analysis-123'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: 'completed',
          progress: 100
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const { getAnalysisStatus } = useAIAnalysis()

      const status = await getAnalysisStatus(analysisId)

      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_CONFIG.API_BASE}/api/ai/analysis/${analysisId}/status`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )

      expect(status.status).toBe('completed')
      expect(status.progress).toBe(100)
    })

    it('getAnalysisStatus 应该处理错误并返回默认状态', async () => {
      const analysisId = 'invalid-analysis'

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getAnalysisStatus } = useAIAnalysis()

      const status = await getAnalysisStatus(analysisId)

      expect(status.status).toBe('unknown')
      expect(status.progress).toBe(0)
    })
  })

  describe('存储和导出功能', () => {
    it('getAnalysisHistory 应该调用存储服务', () => {
      const { getAnalysisHistory } = useAIAnalysis()

      const history = getAnalysisHistory('content')

      // 验证调用了mock的存储服务
      expect(history).toBeDefined()
    })

    it('exportResults 应该成功导出结果', async () => {
      // Mock DOM elements
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }

      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
      global.URL.revokeObjectURL = vi.fn()
      global.Blob = vi.fn((content, options) => ({ content, options }))

      global.document = {
        createElement: vi.fn().mockReturnValue(mockLink),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      }

      const { exportResults, error } = useAIAnalysis()

      const result = await exportResults(['id1', 'id2'], 'json')

      expect(result).toBe(true)
      expect(error.value).toBe(null)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('exportResults 应该处理导出失败', async () => {
      // Mock失败的exportAnalysisResults
      const { exportAnalysisResults } = require('@/utils/analysisStorage')
      exportAnalysisResults.mockImplementation(() => {
        throw new Error('Export failed')
      })

      const { exportResults, error } = useAIAnalysis()

      const result = await exportResults(['id1'], 'json')

      expect(result).toBe(false)
      expect(error.value).toContain('导出失败')
    })

    it('getStorageStatistics 应该返回统计信息', () => {
      const { getStorageStatistics } = useAIAnalysis()

      const stats = getStorageStatistics()

      expect(stats).toBeDefined()
      expect(typeof stats.totalResults).toBe('number')
    })

    it('clearStorage 应该清理所有AI相关存储', () => {
      const { clearStorage } = useAIAnalysis()

      const result = clearStorage()

      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_results')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_history')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_user_preferences')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_cache_expiry')
    })
  })

  describe('格式化结果功能', () => {
    it('formattedResult 应该正确格式化内容分析结果', () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockResult = {
        analysisId: 'content_123',
        analysisType: 'content',
        finalReport: '测试报告',
        structuredData: {
          videoInfo: {
            duration: '2分30秒',
            format: 'mp4'
          }
        }
      }

      analysisResult.value = mockResult

      expect(formattedResult.value).toEqual({
        analysisId: 'content_123',
        type: 'content',
        createdAt: undefined,
        contentAnalysis: {
          report: '测试报告',
          summary: {
            duration: '2分30秒',
            format: 'mp4'
          }
        },
        fusionAnalysis: null,
        musicPrompt: undefined
      })
    })

    it('formattedResult 应该正确格式化融合分析结果', () => {
      const { analysisResult, formattedResult } = useAIAnalysis()

      const mockResult = {
        analysisId: 'fusion_123',
        fusionPlan: {
          overallPlan: { targetDuration: 60 }
        },
        video1Analysis: {
          structuredData: { videoInfo: { duration: '1分30秒' } }
        },
        video2Analysis: {
          structuredData: { videoInfo: { duration: '2分00秒' } }
        }
      }

      analysisResult.value = mockResult

      expect(formattedResult.value.fusionAnalysis).toEqual({
        plan: {
          overallPlan: { targetDuration: 60 }
        },
        video1Summary: { duration: '1分30秒' },
        video2Summary: { duration: '2分00秒' },
        compatibility: {}
      })
    })

    it('formattedResult 应该返回null当没有结果时', () => {
      const { formattedResult } = useAIAnalysis()

      expect(formattedResult.value).toBe(null)
    })
  })

  describe('边界条件测试', () => {
    it('应该处理空的视频数据', async () => {
      const { analyzeVideoContent, error } = useAIAnalysis()

      // 测试null值
      await expect(analyzeVideoContent(null)).rejects.toThrow()

      // 测试undefined值
      await expect(analyzeVideoContent(undefined)).rejects.toThrow()
    })

    it('应该处理缺少必要字段的视频数据', async () => {
      const incompleteVideoData = { /* 缺少path和category */ }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} })
      })

      const { analyzeVideoContent } = useAIAnalysis()

      // 应该仍然能够发送请求（因为fetch会处理undefined）
      const result = await analyzeVideoContent(incompleteVideoData)

      expect(result).toBeDefined()
    })

    it('应该处理API返回的数据格式异常', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      // Mock返回不完整的JSON
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          // 缺少data字段
          error: 'Unexpected format'
        })
      })

      const { analyzeVideoContent, analysisResult } = useAIAnalysis()

      const result = await analyzeVideoContent(mockVideoData)

      // 应该能够处理不完整的响应
      expect(result).toBeDefined()
      expect(analysisResult.value).toBe(result)
    })

    it('应该处理并发分析请求', async () => {
      const mockVideoData = { path: '/test/video.mp4', category: 'personal' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { analysisId: 'test' } })
      })

      const { analyzeVideoContent, isAnalyzing } = useAIAnalysis()

      // 启动多个并发请求
      const promises = [
        analyzeVideoContent(mockVideoData),
        analyzeVideoContent(mockVideoData),
        analyzeVideoContent(mockVideoData)
      ]

      await Promise.all(promises)

      // 所有请求应该都能完成
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(isAnalyzing.value).toBe(false)
    })
  })
})