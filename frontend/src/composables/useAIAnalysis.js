import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import {
  saveAnalysisResult,
  getAnalysisResults,
  exportAnalysisResults,
  getStorageStats
} from '../utils/analysisStorage'

/**
 * AI分析功能Composable
 * 提供视频内容分析、融合分析和音乐提示词生成功能
 */
export function useAIAnalysis() {
  // 状态管理
  const isAnalyzing = ref(false)
  const analysisProgress = ref(0)
  const analysisResult = ref(null)
  const error = ref(null)

  // 使用WebSocket连接进行实时进度更新
  const { joinSession, leaveSession } = useWebSocket()

  // API基础URL
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8005'

  /**
   * 视频内容分析
   * 问题9修复: 添加超时控制
   * 问题12修复: 监听WebSocket真实进度
   */
  const analyzeVideoContent = async (videoData) => {
    const analysisStartTime = Date.now()

    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null
      analysisResult.value = null

      // 生成分析会话ID
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 问题12修复: 加入WebSocket会话并监听真实进度
      let socket = null;
      try {
        socket = await joinSession(analysisId)
      } catch (wsError) {
        console.warn('WebSocket连接失败，使用HTTP轮询模式:', wsError)
      }

      // 监听服务器推送的真实进度
      const progressHandler = (data) => {
        analysisProgress.value = data.progress
        console.log(`分析进度: ${data.progress}% - ${data.message}`)
      }

      const errorHandler = (data) => {
        error.value = data.message
      }

      if (socket && typeof socket.on === 'function') {
        socket.on('analysis:progress', progressHandler)
        socket.on('analysis:error', errorHandler)
      }

      // 问题9修复: 添加超时控制 (3分钟)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 180000) // 3分钟超时

      try {
        const response = await fetch(`${API_BASE}/api/ai/analyze/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'X-Session-Id': analysisId
          },
          body: JSON.stringify({
            videoPath: videoData.path,
            category: videoData.category,
            sessionId: analysisId
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        analysisProgress.value = 100

        if (!response.ok) {
          throw new Error(`分析失败: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        analysisResult.value = result.data

        try {
          const saveData = {
            result: {
              vlAnalysis: result.data.rawAnalysis,
              finalReport: result.data.finalReport,
              structuredData: result.data.structuredData
            },
            inputs: {
              videoPath: videoData.path,
              category: videoData.category,
              sessionId: videoData.sessionId || null
            },
            createdAt: new Date().toISOString(),
            processingTime: Date.now() - analysisStartTime
          }
          await saveAnalysisResult(saveData, 'content')
        } catch (saveError) {
          console.warn('保存分析结果失败:', saveError)
        }

        return result.data
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === 'AbortError') {
          throw new Error('分析超时，请重试或联系管理员')
        }
        throw fetchError
      } finally {
        // 清理事件监听
        if (socket) {
          socket.off('analysis:progress', progressHandler)
          socket.off('analysis:error', errorHandler)
        }
        leaveSession(analysisId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 视频融合分析
   * 问题9修复: 添加超时控制
   * 问题12修复: 监听WebSocket真实进度
   */
  const analyzeVideoFusion = async (video1Data, video2Data) => {
    const analysisStartTime = Date.now()

    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null
      analysisResult.value = null

      const fusionId = `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 问题12修复: 加入WebSocket会话并监听真实进度
      let socket = null;
      try {
        socket = await joinSession(fusionId)
      } catch (wsError) {
        console.warn('WebSocket连接失败，使用HTTP轮询模式:', wsError)
      }

      // 监听服务器推送的真实进度
      const progressHandler = (data) => {
        analysisProgress.value = data.progress
        console.log(`融合分析进度: ${data.progress}% - ${data.message}`)
      }

      const errorHandler = (data) => {
        error.value = data.message
      }

      if (socket && typeof socket.on === 'function') {
        socket.on('analysis:progress', progressHandler)
        socket.on('analysis:error', errorHandler)
      }

      // 问题9修复: 添加超时控制 (5分钟，融合分析需要更长时间)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000) // 5分钟超时

      try {
        const response = await fetch(`${API_BASE}/api/ai/analyze/fusion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'X-Session-Id': fusionId
          },
          body: JSON.stringify({
            video1Path: video1Data.path,
            video2Path: video2Data.path,
            category: video1Data.category, // 假设同一类别
            sessionId: fusionId
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        analysisProgress.value = 100

        if (!response.ok) {
          throw new Error(`融合分析失败: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        analysisResult.value = result.data

        // 自动保存分析结果
        try {
          const saveData = {
            ...result.data,
            inputs: {
              video1Path: video1Data.path,
              video2Path: video2Data.path,
              category: video1Data.category,
              sessionId: video1Data.sessionId || video2Data.sessionId || null
            },
            createdAt: new Date().toISOString(),
            processingTime: Date.now() - analysisStartTime
          }
          await saveAnalysisResult(saveData, 'fusion')
        } catch (saveError) {
          console.warn('保存融合分析结果失败:', saveError)
          // 不阻塞主流程
        }

        return result.data
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === 'AbortError') {
          throw new Error('融合分析超时，请重试或联系管理员')
        }
        throw fetchError
      } finally {
        // 清理事件监听
        if (socket) {
          socket.off('analysis:progress', progressHandler)
          socket.off('analysis:error', errorHandler)
        }
        leaveSession(fusionId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 生成背景音乐提示词
   */
  const generateMusicPrompt = async (fusionPlan) => {
    const analysisStartTime = Date.now()

    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null

      const musicId = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      joinSession(musicId)

      // 音乐生成进度
      const progressInterval = setInterval(() => {
        if (analysisProgress.value < 90) {
          analysisProgress.value += 15
        }
      }, 800)

      const response = await fetch(`${API_BASE}/api/ai/generate/music-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          fusionPlan: fusionPlan
        })
      })

      clearInterval(progressInterval)
      analysisProgress.value = 100

      if (!response.ok) {
        throw new Error(`音乐提示词生成失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      // 自动保存分析结果
      try {
        const saveData = {
          ...result.data,
          fusionPlan: fusionPlan,
          inputs: {
            fusionPlan: fusionPlan,
            sessionId: fusionPlan.sessionId || null
          },
          createdAt: new Date().toISOString(),
          processingTime: Date.now() - analysisStartTime
        }
        await saveAnalysisResult(saveData, 'music')
      } catch (saveError) {
        console.warn('保存音乐提示词失败:', saveError)
        // 不阻塞主流程
      }

      leaveSession(musicId)

      return result.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 一体化分析 - 直接上传文件分析
   */
  const analyzeUploadedFiles = async (files, category, analysisType) => {
    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null
      analysisResult.value = null

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      joinSession(uploadId)

      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append('videos', file)
      })
      formData.append('category', category)
      formData.append('analysisType', analysisType)

      const progressInterval = setInterval(() => {
        if (analysisProgress.value < 95) {
          analysisProgress.value += analysisType === 'fusion' ? 3 : 8
        }
      }, analysisType === 'fusion' ? 2000 : 1000)

      const response = await fetch(`${API_BASE}/api/ai/analyze/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: formData
      })

      clearInterval(progressInterval)
      analysisProgress.value = 100

      if (!response.ok) {
        throw new Error(`一体化分析失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      analysisResult.value = result.data

      leaveSession(uploadId)

      return result.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 查询分析状态
   */
  const getAnalysisStatus = async (analysisId) => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/analysis/${analysisId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      })

      if (!response.ok) {
        throw new Error(`状态查询失败: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('状态查询错误:', err)
      return { status: 'unknown', progress: 0 }
    }
  }

  /**
   * 重置状态
   */
  const resetAnalysis = () => {
    isAnalyzing.value = false
    analysisProgress.value = 0
    analysisResult.value = null
    error.value = null
  }

  /**
   * 获取分析历史记录
   */
  const getAnalysisHistory = (type = null) => {
    return getAnalysisResults(type)
  }

  /**
   * 导出分析结果
   */
  const exportResults = async (ids = [], format = 'json') => {
    try {
      const exportData = exportAnalysisResults(ids, format)

      // 创建下载链接
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' :
             format === 'csv' ? 'text/csv' : 'text/plain'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ai_analysis_results_${new Date().toISOString().split('T')[0]}.${format}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error('导出失败:', error)
      error.value = `导出失败: ${error.message}`
      return false
    }
  }

  /**
   * 获取存储统计信息
   */
  const getStorageStatistics = () => {
    return getStorageStats()
  }

  /**
   * 清理存储
   */
  const clearStorage = () => {
    try {
      localStorage.removeItem('ai_analysis_results')
      localStorage.removeItem('ai_analysis_history')
      localStorage.removeItem('ai_user_preferences')
      localStorage.removeItem('ai_cache_expiry')
      return true
    } catch (error) {
      console.error('清理存储失败:', error)
      return false
    }
  }

  /**
   * 格式化分析结果为用户友好的显示
   */
  const formattedResult = computed(() => {
    if (!analysisResult.value) {
      console.log('🔍 formattedResult: analysisResult为空')
      return null
    }

    const result = analysisResult.value

    console.log('🔍 原始分析结果数据结构:', {
      hasRawAnalysis: !!result.rawAnalysis,
      hasStructuredData: !!result.structuredData,
      rawAnalysisDuration: result.rawAnalysis?.duration,
      structuredDataDuration: result.structuredData?.videoInfo?.duration,
      finalReport: !!result.finalReport
    })

    // 构建完整的视频信息摘要
    const buildVideoSummary = (rawAnalysis, structuredData) => {
      const videoInfo = structuredData?.videoInfo || {}

      // 从rawAnalysis提取统计信息
      const rawStats = rawAnalysis ? {
        duration: rawAnalysis.duration,
        frameRate: rawAnalysis.frameRate,
        resolution: rawAnalysis.resolution,
        frames: rawAnalysis.frames,
        keyframeCount: Array.isArray(rawAnalysis.keyframes) ? rawAnalysis.keyframes.length : (rawAnalysis.keyframeCount || 0),
        sceneCount: Array.isArray(rawAnalysis.scenes) ? rawAnalysis.scenes.length : (rawAnalysis.sceneCount || 0),
        objectCount: Array.isArray(rawAnalysis.objects) ? rawAnalysis.objects.length : (rawAnalysis.objectCount || 0),
        actionCount: Array.isArray(rawAnalysis.actions) ? rawAnalysis.actions.length : (rawAnalysis.actionCount || 0)
      } : {}

      // 合并数据，优先使用structuredData，fallback到rawAnalysis
      const summary = {
        duration: videoInfo.duration || rawStats.duration || 0,
        frameRate: videoInfo.frameRate || rawStats.frameRate,
        resolution: videoInfo.resolution || rawStats.resolution,
        frames: videoInfo.frames || rawStats.frames,
        keyframeCount: videoInfo.keyframeCount || rawStats.keyframeCount || 0,
        sceneCount: videoInfo.sceneCount || rawStats.sceneCount || 0,
        objectCount: videoInfo.objectCount || rawStats.objectCount || 0,
        actionCount: videoInfo.actionCount || rawStats.actionCount || 0
      }

      console.log('🔍 构建的视频摘要:', summary)
      return summary
    }

    return {
      analysisId: result.analysisId,
      type: result.analysisType || 'content',
      createdAt: result.createdAt || result.processedAt,

      // 内容分析结果
      contentAnalysis: result.finalReport ? {
        report: result.finalReport,
        summary: buildVideoSummary(result.rawAnalysis, result.structuredData)
      } : null,

      // 融合分析结果
      fusionAnalysis: result.fusionPlan ? {
        plan: result.fusionPlan,
        video1Summary: buildVideoSummary(result.video1Analysis?.rawAnalysis, result.video1Analysis?.structuredData),
        video2Summary: buildVideoSummary(result.video2Analysis?.rawAnalysis, result.video2Analysis?.structuredData),
        compatibility: result.fusionData?.analysis || {}
      } : null,

      // 音乐提示词
      musicPrompt: result.musicPrompt || result.prompt
    }
  })

  return {
    // 状态
    isAnalyzing,
    analysisProgress,
    analysisResult,
    formattedResult,
    error,

    // 方法
    analyzeVideoContent,
    analyzeVideoFusion,
    generateMusicPrompt,
    analyzeUploadedFiles,
    getAnalysisStatus,
    resetAnalysis,

    // 存储和历史功能
    getAnalysisHistory,
    exportResults,
    getStorageStatistics,
    clearStorage
  }
}