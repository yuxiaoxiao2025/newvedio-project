/**
 * AI分析结果本地存储服务
 * 提供分析结果的持久化存储、查询和导出功能
 */

import {
  ContentAnalysisResult,
  FusionAnalysisResult,
  MusicPromptResult,
  AnalysisHistory,
  validateAnalysisResult
} from './analysisDataStructures'

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
  ANALYSIS_RESULTS: 'ai_analysis_results',
  ANALYSIS_HISTORY: 'ai_analysis_history',
  USER_PREFERENCES: 'ai_user_preferences',
  CACHE_EXPIRY: 'ai_cache_expiry'
}

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
  MAX_STORAGE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_RECORDS: 100 // 最大记录数
}

/**
 * 本地存储服务类
 */
export class AnalysisStorage {
  constructor() {
    this.init()
  }

  /**
   * 初始化存储
   */
  init() {
    try {
      // 检查存储是否可用
      if (!this.isStorageAvailable()) {
        console.warn('LocalStorage不可用，分析结果将无法持久化')
        return
      }

      // 清理过期数据
      this.cleanExpiredData()

      // 检查存储空间
      this.checkStorageSpace()
    } catch (error) {
      console.error('存储初始化失败:', error)
    }
  }

  /**
   * 检查存储是否可用
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * 保存分析结果
   */
  saveAnalysisResult(result, type) {
    try {
      // 验证数据结构
      const validation = validateAnalysisResult(result, type)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }

      // 添加元数据
      const resultWithMeta = {
        ...result,
        type,
        id: result.id || this.generateId(type),
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      }

      // 获取现有结果
      const existingResults = this.getAnalysisResults()

      // 检查是否已存在相同ID的结果
      const existingIndex = existingResults.findIndex(r => r.id === resultWithMeta.id)
      if (existingIndex >= 0) {
        existingResults[existingIndex] = resultWithMeta
      } else {
        existingResults.unshift(resultWithMeta)
      }

      // 限制记录数量
      if (existingResults.length > CACHE_CONFIG.MAX_RECORDS) {
        existingResults.splice(CACHE_CONFIG.MAX_RECORDS)
      }

      // 保存到本地存储
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(existingResults))

      // 更新历史记录
      this.updateHistory(resultWithMeta)

      return resultWithMeta
    } catch (error) {
      console.error('保存分析结果失败:', error)
      throw error
    }
  }

  /**
   * 获取所有分析结果
   */
  getAnalysisResults(type = null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      if (!stored) return []

      const results = JSON.parse(stored)

      // 按类型过滤
      if (type) {
        return results.filter(result => result.type === type)
      }

      return results
    } catch (error) {
      console.error('获取分析结果失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取分析结果
   */
  getAnalysisResultById(id) {
    try {
      const results = this.getAnalysisResults()
      return results.find(result => result.id === id) || null
    } catch (error) {
      console.error('获取分析结果失败:', error)
      return null
    }
  }

  /**
   * 根据会话ID获取分析结果
   */
  getAnalysisResultsBySessionId(sessionId) {
    try {
      const results = this.getAnalysisResults()
      return results.filter(result =>
        result.inputs && result.inputs.sessionId === sessionId
      )
    } catch (error) {
      console.error('获取会话分析结果失败:', error)
      return []
    }
  }

  /**
   * 删除分析结果
   */
  deleteAnalysisResult(id) {
    try {
      const results = this.getAnalysisResults()
      const filteredResults = results.filter(result => result.id !== id)
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(filteredResults))
      return true
    } catch (error) {
      console.error('删除分析结果失败:', error)
      return false
    }
  }

  /**
   * 批量删除分析结果
   */
  deleteAnalysisResults(ids) {
    try {
      const results = this.getAnalysisResults()
      const filteredResults = results.filter(result => !ids.includes(result.id))
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(filteredResults))
      return true
    } catch (error) {
      console.error('批量删除分析结果失败:', error)
      return false
    }
  }

  /**
   * 清空所有分析结果
   */
  clearAnalysisResults() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY)
      return true
    } catch (error) {
      console.error('清空分析结果失败:', error)
      return false
    }
  }

  /**
   * 更新历史记录
   */
  updateHistory(result) {
    try {
      const history = this.getAnalysisHistory()

      // 查找现有历史记录
      const sessionId = result.inputs?.sessionId || 'unknown'
      let historyRecord = history.find(record => record.sessionId === sessionId)

      if (!historyRecord) {
        // 创建新的历史记录
        historyRecord = {
          id: this.generateId('history'),
          sessionId,
          timestamp: new Date().toISOString(),
          analyses: [],
          userPreferences: this.getUserPreferences(),
          metadata: {
            totalAnalysisTime: 0,
            tokenConsumption: 0,
            costEstimate: 0
          }
        }
        history.unshift(historyRecord)
      }

      // 更新分析结果
      const existingAnalysisIndex = historyRecord.analyses.findIndex(a => a.id === result.id)
      if (existingAnalysisIndex >= 0) {
        historyRecord.analyses[existingAnalysisIndex] = result
      } else {
        historyRecord.analyses.push(result)
      }

      // 更新元数据
      historyRecord.metadata.totalAnalysisTime += result.processingTime || 0
      historyRecord.timestamp = new Date().toISOString()

      // 保存历史记录
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(history))
    } catch (error) {
      console.error('更新历史记录失败:', error)
    }
  }

  /**
   * 获取分析历史
   */
  getAnalysisHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('获取分析历史失败:', error)
      return []
    }
  }

  /**
   * 导出分析结果
   */
  exportAnalysisResults(ids, format = 'json') {
    try {
      const allResults = this.getAnalysisResults()
      const resultsToExport = ids.length > 0
        ? allResults.filter(result => ids.includes(result.id))
        : allResults

      switch (format.toLowerCase()) {
        case 'json':
          return this.exportAsJSON(resultsToExport)
        case 'csv':
          return this.exportAsCSV(resultsToExport)
        case 'txt':
          return this.exportAsTXT(resultsToExport)
        default:
          throw new Error(`不支持的导出格式: ${format}`)
      }
    } catch (error) {
      console.error('导出分析结果失败:', error)
      throw error
    }
  }

  /**
   * JSON格式导出
   */
  exportAsJSON(results) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      count: results.length,
      results: results
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * CSV格式导出
   */
  exportAsCSV(results) {
    const headers = [
      'ID', '类型', '创建时间', '处理时间(毫秒)', '文件数量', '状态', '错误信息'
    ]

    const rows = results.map(result => [
      result.id,
      result.type,
      result.createdAt,
      result.processingTime || 0,
      result.inputs?.files?.length || 0,
      result.status,
      result.error || ''
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }

  /**
   * TXT格式导出
   */
  exportAsTXT(results) {
    let content = `AI分析结果导出\n`
    content += `导出时间: ${new Date().toLocaleString()}\n`
    content += `结果数量: ${results.length}\n`
    content += `${'='.repeat(50)}\n\n`

    results.forEach((result, index) => {
      content += `${index + 1}. ${result.type.toUpperCase()} - ${result.id}\n`
      content += `   创建时间: ${new Date(result.createdAt).toLocaleString()}\n`
      content += `   处理时间: ${result.processingTime || 0}ms\n`
      content += `   状态: ${result.status}\n`

      if (result.error) {
        content += `   错误: ${result.error}\n`
      }

      // 根据类型添加特定信息
      if (result.type === 'content' && result.result?.finalReport) {
        content += `   报告预览: ${result.result.finalReport.substring(0, 100)}...\n`
      } else if (result.type === 'fusion' && result.result?.fusionPlan) {
        content += `   目标时长: ${result.result.fusionPlan.overallPlan?.targetDuration || 0}秒\n`
      } else if (result.type === 'music' && result.result?.prompt) {
        content += `   音乐风格: ${result.result.basicInfo?.musicStyle || '未指定'}\n`
      }

      content += '\n'
    })

    return content
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    try {
      const results = this.getAnalysisResults()
      const history = this.getAnalysisHistory()

      // 计算存储大小
      const resultsSize = this.calculateStorageSize(STORAGE_KEYS.ANALYSIS_RESULTS)
      const historySize = this.calculateStorageSize(STORAGE_KEYS.ANALYSIS_HISTORY)
      const totalSize = resultsSize + historySize

      // 按类型统计
      const typeStats = {}
      results.forEach(result => {
        typeStats[result.type] = (typeStats[result.type] || 0) + 1
      })

      // 按状态统计
      const statusStats = {}
      results.forEach(result => {
        statusStats[result.status] = (statusStats[result.status] || 0) + 1
      })

      return {
        totalResults: results.length,
        totalHistory: history.length,
        storageSize: {
          results: resultsSize,
          history: historySize,
          total: totalSize,
          percentage: (totalSize / CACHE_CONFIG.MAX_STORAGE_SIZE * 100).toFixed(2)
        },
        byType: typeStats,
        byStatus: statusStats,
        oldestRecord: results.length > 0 ? new Date(Math.min(...results.map(r => new Date(r.createdAt)))) : null,
        newestRecord: results.length > 0 ? new Date(Math.max(...results.map(r => new Date(r.createdAt)))) : null
      }
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return null
    }
  }

  /**
   * 清理过期数据
   */
  cleanExpiredData() {
    try {
      const expiryTime = localStorage.getItem(STORAGE_KEYS.CACHE_EXPIRY)
      if (!expiryTime) {
        // 设置过期时间
        localStorage.setItem(STORAGE_KEYS.CACHE_EXPIRY,
          (Date.now() + CACHE_CONFIG.DEFAULT_EXPIRY).toString())
        return
      }

      if (Date.now() > parseInt(expiryTime)) {
        // 清空数据
        this.clearAnalysisResults()
        localStorage.setItem(STORAGE_KEYS.CACHE_EXPIRY,
          (Date.now() + CACHE_CONFIG.DEFAULT_EXPIRY).toString())
      }
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }

  /**
   * 检查存储空间
   */
  checkStorageSpace() {
    try {
      const totalSize = this.calculateStorageSize(STORAGE_KEYS.ANALYSIS_RESULTS) +
                       this.calculateStorageSize(STORAGE_KEYS.ANALYSIS_HISTORY)

      if (totalSize > CACHE_CONFIG.MAX_STORAGE_SIZE) {
        console.warn('存储空间不足，将清理最旧的数据')
        this.cleanupOldRecords()
      }
    } catch (error) {
      console.error('检查存储空间失败:', error)
    }
  }

  /**
   * 清理旧记录
   */
  cleanupOldRecords() {
    try {
      const results = this.getAnalysisResults()
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const keepCount = Math.floor(CACHE_CONFIG.MAX_RECORDS * 0.8) // 保留80%
      const trimmedResults = results.slice(0, keepCount)

      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(trimmedResults))
    } catch (error) {
      console.error('清理旧记录失败:', error)
    }
  }

  /**
   * 计算存储大小
   */
  calculateStorageSize(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? new Blob([data]).size : 0
    } catch {
      return 0
    }
  }

  /**
   * 生成唯一ID
   */
  generateId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取用户偏好设置
   */
  getUserPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  /**
   * 保存用户偏好设置
   */
  saveUserPreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
      return true
    } catch (error) {
      console.error('保存用户偏好失败:', error)
      return false
    }
  }
}

// 创建默认实例
export const analysisStorage = new AnalysisStorage()

/**
 * 便捷方法导出
 */
export const saveAnalysisResult = (result, type) => analysisStorage.saveAnalysisResult(result, type)
export const getAnalysisResults = (type) => analysisStorage.getAnalysisResults(type)
export const getAnalysisResultById = (id) => analysisStorage.getAnalysisResultById(id)
export const deleteAnalysisResult = (id) => analysisStorage.deleteAnalysisResult(id)
export const exportAnalysisResults = (ids, format) => analysisStorage.exportAnalysisResults(ids, format)
export const getStorageStats = () => analysisStorage.getStorageStats()