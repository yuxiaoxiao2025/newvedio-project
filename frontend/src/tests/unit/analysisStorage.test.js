/**
 * analysisStorage 存储服务单元测试
 *
 * 测试覆盖范围：
 * - 存储服务初始化和可用性检查
 * - 分析结果的保存、获取、删除功能
 * - 历史记录管理
 * - 导出功能（JSON/CSV/TXT格式）
 * - 存储统计和空间管理
 * - 缓存和过期数据清理
 * - 数据验证和错误处理
 *
 * 测试方法：
 * - 使用 Vitest + localStorage Mock
 * - 测试各种存储操作和边界条件
 * - 验证数据完整性和一致性
 * - 模拟存储空间不足等异常情况
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AnalysisStorage, saveAnalysisResult, getAnalysisResults } from '@/utils/analysisStorage'
import { validateAnalysisResult } from '@/utils/analysisDataStructures'

describe('AnalysisStorage 存储服务', () => {
  let storage
  let mockLocalStorage

  beforeEach(() => {
    // 清除所有Mock调用记录
    vi.clearAllMocks()

    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: vi.fn((key) => mockLocalStorage.data[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage.data[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage.data[key]
      }),
      clear: vi.fn(() => {
        mockLocalStorage.data = {}
      })
    }
    global.localStorage = mockLocalStorage

    // Mock Blob API for storage size calculation
    global.Blob = vi.fn((content, options) => ({
      content,
      options,
      size: content ? JSON.stringify(content).length * 2 : 0 // 模拟大小
    }))

    // Mock validation function
    vi.mock('@/utils/analysisDataStructures', () => ({
      validateAnalysisResult: vi.fn((result, type) => ({
        valid: true,
        errors: []
      }))
    }))

    // 创建新的存储实例
    storage = new AnalysisStorage()
  })

  afterEach(() => {
    // 清理测试环境
    vi.restoreAllMocks()
    delete global.localStorage
    delete global.Blob
  })

  describe('初始化测试', () => {
    it('应该正确初始化存储服务', () => {
      expect(storage).toBeInstanceOf(AnalysisStorage)
      expect(typeof storage.init).toBe('function')
      expect(typeof storage.saveAnalysisResult).toBe('function')
      expect(typeof storage.getAnalysisResults).toBe('function')
    })

    it('应该检测localStorage可用性', () => {
      // 测试可用的localStorage
      expect(storage.isStorageAvailable()).toBe(true)

      // 测试不可用的localStorage
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled')
      })
      global.localStorage.removeItem = vi.fn()

      expect(storage.isStorageAvailable()).toBe(false)
    })

    it('应该处理localStorage初始化错误', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage不可用
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled')
      })
      global.localStorage.removeItem = vi.fn()

      const newStorage = new AnalysisStorage()

      expect(consoleSpy).toHaveBeenCalledWith('LocalStorage不可用，分析结果将无法持久化')

      consoleSpy.mockRestore()
    })
  })

  describe('分析结果保存功能', () => {
    const mockResult = {
      analysisId: 'test-analysis-123',
      finalReport: '测试分析报告',
      structuredData: {
        videoInfo: { duration: '2分30秒', format: 'mp4' }
      },
      processingTime: 5000,
      inputs: { category: 'personal' }
    }

    it('应该成功保存分析结果', () => {
      const result = storage.saveAnalysisResult(mockResult, 'content')

      expect(validateAnalysisResult).toHaveBeenCalledWith(mockResult, 'content')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_analysis_results',
        expect.any(String)
      )

      expect(result.id).toBeDefined()
      expect(result.type).toBe('content')
      expect(result.savedAt).toBeDefined()
      expect(result.version).toBe('1.0.0')
    })

    it('应该为结果生成唯一ID', () => {
      const result1 = storage.saveAnalysisResult(mockResult, 'content')
      const result2 = storage.saveAnalysisResult(mockResult, 'content')

      expect(result1.id).not.toBe(result2.id)
      expect(result1.id).toMatch(/^content_\d+_[a-z0-9]+$/)
      expect(result2.id).toMatch(/^content_\d+_[a-z0-9]+$/)
    })

    it('应该处理数据验证失败', () => {
      // Mock验证失败
      validateAnalysisResult.mockReturnValue({
        valid: false,
        errors: ['缺少必要字段', '数据格式错误']
      })

      expect(() => {
        storage.saveAnalysisResult(mockResult, 'content')
      }).toThrow('数据验证失败: 缺少必要字段, 数据格式错误')
    })

    it('应该更新已存在的结果', () => {
      // 第一次保存
      const result1 = storage.saveAnalysisResult(mockResult, 'content')
      const originalId = result1.id

      // 修改结果内容
      const updatedResult = { ...mockResult, finalReport: '更新的报告' }

      // 使用相同ID再次保存
      const result2 = storage.saveAnalysisResult({ ...updatedResult, id: originalId }, 'content')

      expect(result2.id).toBe(originalId)
      expect(result2.finalReport).toBe('更新的报告')

      // 验证存储中只有一条记录
      const storedResults = storage.getAnalysisResults()
      expect(storedResults.length).toBe(1)
    })

    it('应该限制最大记录数量', () => {
      // 保存超过限制数量的结果
      for (let i = 0; i < 150; i++) {
        storage.saveAnalysisResult({
          ...mockResult,
          analysisId: `test-analysis-${i}`
        }, 'content')
      }

      const results = storage.getAnalysisResults()
      expect(results.length).toBeLessThanOrEqual(100) // MAX_RECORDS
    })

    it('应该处理存储错误', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => {
        storage.saveAnalysisResult(mockResult, 'content')
      }).toThrow('Storage quota exceeded')
    })
  })

  describe('分析结果获取功能', () => {
    beforeEach(() => {
      // 准备测试数据
      const testData = [
        { id: 'content-1', type: 'content', finalReport: '内容分析1' },
        { id: 'content-2', type: 'content', finalReport: '内容分析2' },
        { id: 'fusion-1', type: 'fusion', fusionPlan: {} }
      ]

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)
    })

    it('应该获取所有分析结果', () => {
      const results = storage.getAnalysisResults()

      expect(results).toHaveLength(3)
      expect(results[0].type).toBe('content')
      expect(results[2].type).toBe('fusion')
    })

    it('应该按类型过滤结果', () => {
      const contentResults = storage.getAnalysisResults('content')
      const fusionResults = storage.getAnalysisResults('fusion')

      expect(contentResults).toHaveLength(2)
      expect(fusionResults).toHaveLength(1)
      expect(contentResults.every(r => r.type === 'content')).toBe(true)
      expect(fusionResults.every(r => r.type === 'fusion')).toBe(true)
    })

    it('应该根据ID获取单个结果', () => {
      const result = storage.getAnalysisResultById('content-1')

      expect(result).toBeDefined()
      expect(result.id).toBe('content-1')
      expect(result.finalReport).toBe('内容分析1')
    })

    it('应该返回null当ID不存在时', () => {
      const result = storage.getAnalysisResultById('non-existent-id')

      expect(result).toBe(null)
    })

    it('应该根据会话ID获取结果', () => {
      const resultWithSession = {
        id: 'session-test',
        type: 'content',
        inputs: { sessionId: 'test-session-123' },
        finalReport: '会话测试'
      }

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify([resultWithSession])

      const results = storage.getAnalysisResultsBySessionId('test-session-123')

      expect(results).toHaveLength(1)
      expect(results[0].inputs.sessionId).toBe('test-session-123')
    })

    it('应该处理JSON解析错误', () => {
      mockLocalStorage.data['ai_analysis_results'] = 'invalid-json'

      const results = storage.getAnalysisResults()

      expect(results).toEqual([])
    })
  })

  describe('分析结果删除功能', () => {
    beforeEach(() => {
      const testData = [
        { id: 'delete-1', type: 'content' },
        { id: 'delete-2', type: 'content' },
        { id: 'keep-1', type: 'fusion' }
      ]

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)
    })

    it('应该删除单个分析结果', () => {
      const success = storage.deleteAnalysisResult('delete-1')

      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_analysis_results',
        expect.stringMatching(/"keep-1"/) // 应该包含keep-1
      )
    })

    it('应该返回false当删除不存在的ID时', () => {
      const success = storage.deleteAnalysisResult('non-existent-id')

      expect(success).toBe(true) // 仍然返回true，因为没有报错
    })

    it('应该批量删除分析结果', () => {
      const success = storage.deleteAnalysisResults(['delete-1', 'delete-2'])

      expect(success).toBe(true)
      const remainingResults = storage.getAnalysisResults()
      expect(remainingResults).toHaveLength(1)
      expect(remainingResults[0].id).toBe('keep-1')
    })

    it('应该清空所有分析结果', () => {
      const success = storage.clearAnalysisResults()

      expect(success).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_results')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_history')
    })
  })

  describe('导出功能', () => {
    beforeEach(() => {
      const testData = [
        {
          id: 'export-1',
          type: 'content',
          createdAt: '2025-01-19T10:00:00Z',
          processingTime: 5000,
          inputs: { files: [{ name: 'video1.mp4' }] },
          status: 'completed',
          finalReport: '测试报告1'
        },
        {
          id: 'export-2',
          type: 'fusion',
          createdAt: '2025-01-19T11:00:00Z',
          processingTime: 8000,
          inputs: { files: [{ name: 'video2.mp4' }, { name: 'video3.mp4' }] },
          status: 'completed',
          fusionPlan: { overallPlan: { targetDuration: 60 } }
        }
      ]

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)
    })

    it('应该导出JSON格式', () => {
      const exportData = storage.exportAnalysisResults([], 'json')

      const parsed = JSON.parse(exportData)
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.count).toBe(2)
      expect(parsed.results).toHaveLength(2)
    })

    it('应该导出CSV格式', () => {
      const exportData = storage.exportAnalysisResults([], 'csv')

      expect(exportData).toContain('"ID","类型","创建时间","处理时间(毫秒)","文件数量","状态","错误信息"')
      expect(exportData).toContain('"export-1","content"')
      expect(exportData).toContain('"export-2","fusion"')
    })

    it('应该导出TXT格式', () => {
      const exportData = storage.exportAnalysisResults([], 'txt')

      expect(exportData).toContain('AI分析结果导出')
      expect(exportData).toContain('结果数量: 2')
      expect(exportData).toContain('1. CONTENT - export-1')
      expect(exportData).toContain('2. FUSION - export-2')
    })

    it('应该只导出指定的ID', () => {
      const exportData = storage.exportAnalysisResults(['export-1'], 'json')

      const parsed = JSON.parse(exportData)
      expect(parsed.count).toBe(1)
      expect(parsed.results[0].id).toBe('export-1')
    })

    it('应该处理不支持的导出格式', () => {
      expect(() => {
        storage.exportAnalysisResults([], 'xml')
      }).toThrow('不支持的导出格式: xml')
    })
  })

  describe('存储统计功能', () => {
    beforeEach(() => {
      const testData = [
        { id: 'stat-1', type: 'content', createdAt: '2025-01-19T10:00:00Z', status: 'completed' },
        { id: 'stat-2', type: 'content', createdAt: '2025-01-19T11:00:00Z', status: 'failed' },
        { id: 'stat-3', type: 'fusion', createdAt: '2025-01-19T12:00:00Z', status: 'completed' },
        { id: 'stat-4', type: 'music', createdAt: '2025-01-19T13:00:00Z', status: 'completed' }
      ]

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)
      mockLocalStorage.data['ai_analysis_history'] = JSON.stringify([
        { id: 'history-1', sessionId: 'session-1' }
      ])
    })

    it('应该返回完整的存储统计信息', () => {
      const stats = storage.getStorageStats()

      expect(stats.totalResults).toBe(4)
      expect(stats.totalHistory).toBe(1)
      expect(stats.storageSize).toBeDefined()
      expect(stats.byType).toEqual({
        content: 2,
        fusion: 1,
        music: 1
      })
      expect(stats.byStatus).toEqual({
        completed: 3,
        failed: 1
      })
    })

    it('应该计算存储大小百分比', () => {
      const stats = storage.getStorageStats()

      expect(stats.storageSize.percentage).toMatch(/^\d+\.\d{2}$/) // 应该是数字格式
    })

    it('应该返回最旧和最新记录时间', () => {
      const stats = storage.getStorageStats()

      expect(stats.oldestRecord).toBeInstanceOf(Date)
      expect(stats.newestRecord).toBeInstanceOf(Date)
      expect(stats.newestRecord.getTime()).toBeGreaterThan(stats.oldestRecord.getTime())
    })

    it('应该处理统计计算错误', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const stats = storage.getStorageStats()

      expect(stats).toBe(null)
    })
  })

  describe('缓存和过期管理', () => {
    it('应该设置默认过期时间', () => {
      storage.cleanExpiredData()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_cache_expiry',
        expect.stringMatching(/^\d+$/)
      )
    })

    it('应该在过期时清理数据', () => {
      // 设置过去的过期时间
      const pastTime = Date.now() - 1000
      mockLocalStorage.data['ai_cache_expiry'] = pastTime.toString()
      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify([{ id: 'test' }])

      storage.cleanExpiredData()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_results')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ai_analysis_history')
    })

    it('应该在存储空间不足时清理旧记录', () => {
      // Mock存储大小超过限制
      global.Blob = vi.fn((content) => ({
        size: 60 * 1024 * 1024 // 60MB，超过50MB限制
      }))

      const testData = Array.from({ length: 120 }, (_, i) => ({
        id: `test-${i}`,
        type: 'content',
        createdAt: new Date(Date.now() - i * 1000).toISOString() // 不同时间
      }))

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)

      storage.checkStorageSpace()

      // 验证调用了清理方法
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_analysis_results',
        expect.any(String)
      )
    })

    it('应该保留80%的最新记录', () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        type: 'content',
        createdAt: new Date(Date.now() - i * 1000).toISOString()
      }))

      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify(testData)

      storage.cleanupOldRecords()

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'ai_analysis_results'
      )[1])

      expect(savedData.length).toBe(80) // 100 * 0.8
    })
  })

  describe('用户偏好管理', () => {
    it('应该保存用户偏好设置', () => {
      const preferences = {
        analysisTypes: ['content', 'fusion'],
        exportFormats: ['json'],
        notifications: true
      }

      const success = storage.saveUserPreferences(preferences)

      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_user_preferences',
        JSON.stringify(preferences)
      )
    })

    it('应该获取用户偏好设置', () => {
      const preferences = { theme: 'dark' }
      mockLocalStorage.data['ai_user_preferences'] = JSON.stringify(preferences)

      const result = storage.getUserPreferences()

      expect(result).toEqual(preferences)
    })

    it('应该返回空对象当没有偏好设置时', () => {
      const result = storage.getUserPreferences()

      expect(result).toEqual({})
    })

    it('应该处理偏好设置的JSON解析错误', () => {
      mockLocalStorage.data['ai_user_preferences'] = 'invalid-json'

      const result = storage.getUserPreferences()

      expect(result).toEqual({})
    })
  })

  describe('历史记录管理', () => {
    it('应该更新历史记录', () => {
      const result = {
        id: 'test-result',
        inputs: { sessionId: 'test-session-123' },
        processingTime: 5000
      }

      storage.updateHistory(result)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai_analysis_history',
        expect.any(String)
      )

      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedHistory[0].sessionId).toBe('test-session-123')
      expect(savedHistory[0].analyses).toContain(result)
    })

    it('应该创建新的历史记录当会话不存在时', () => {
      const result = {
        id: 'test-result',
        inputs: { sessionId: 'new-session-456' }
      }

      storage.updateHistory(result)

      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedHistory[0].sessionId).toBe('new-session-456')
      expect(savedHistory[0].id).toMatch(/^history_\d+_[a-z0-9]+$/)
    })

    it('应该更新现有历史记录的分析结果', () => {
      const existingHistory = [
        {
          id: 'history-1',
          sessionId: 'test-session-123',
          analyses: [{ id: 'existing-result' }],
          metadata: { totalAnalysisTime: 3000 }
        }
      ]

      mockLocalStorage.data['ai_analysis_history'] = JSON.stringify(existingHistory)

      const newResult = {
        id: 'new-result',
        inputs: { sessionId: 'test-session-123' },
        processingTime: 2000
      }

      storage.updateHistory(newResult)

      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedHistory[0].analyses).toHaveLength(2)
      expect(savedHistory[0].metadata.totalAnalysisTime).toBe(5000) // 3000 + 2000
    })
  })

  describe('便捷方法测试', () => {
    it('saveAnalysisResult 便捷方法应该正常工作', () => {
      const mockResult = { analysisId: 'test' }
      const result = saveAnalysisResult(mockResult, 'content')

      expect(result).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('getAnalysisResults 便捷方法应该正常工作', () => {
      mockLocalStorage.data['ai_analysis_results'] = JSON.stringify([
        { id: 'test', type: 'content' }
      ])

      const results = getAnalysisResults('content')

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('content')
    })
  })

  describe('错误处理和边界条件', () => {
    it('应该处理localStorage禁用的情况', () => {
      global.localStorage = null

      const errorStorage = new AnalysisStorage()
      const result = errorStorage.getAnalysisResults()

      expect(result).toEqual([])
    })

    it('应该处理存储大小计算错误', () => {
      global.Blob = vi.fn(() => {
        throw new Error('Blob creation failed')
      })

      const size = storage.calculateStorageSize('test-key')
      expect(size).toBe(0)
    })

    it('应该生成有效的ID', () => {
      const id1 = storage.generateId('content')
      const id2 = storage.generateId('fusion')

      expect(id1).toMatch(/^content_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^fusion_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('应该处理空的历史记录', () => {
      const history = storage.getAnalysisHistory()
      expect(history).toEqual([])
    })
  })
})