import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'

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
   */
  const analyzeVideoContent = async (videoData) => {
    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null
      analysisResult.value = null

      // 生成分析会话ID
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      joinSession(analysisId)

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        if (analysisProgress.value < 90) {
          analysisProgress.value += 10
        }
      }, 1000)

      const response = await fetch(`${API_BASE}/api/ai/analyze/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          videoPath: videoData.path,
          category: videoData.category
        })
      })

      clearInterval(progressInterval)
      analysisProgress.value = 100

      if (!response.ok) {
        throw new Error(`分析失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      analysisResult.value = result.data

      leaveSession(analysisId)

      return result.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 视频融合分析
   */
  const analyzeVideoFusion = async (video1Data, video2Data) => {
    try {
      isAnalyzing.value = true
      analysisProgress.value = 0
      error.value = null
      analysisResult.value = null

      const fusionId = `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      joinSession(fusionId)

      // 融合分析需要更长时间，进度更新更慢
      const progressInterval = setInterval(() => {
        if (analysisProgress.value < 85) {
          analysisProgress.value += 5
        }
      }, 1500)

      const response = await fetch(`${API_BASE}/api/ai/analyze/fusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          video1Path: video1Data.path,
          video2Path: video2Data.path,
          category: video1Data.category // 假设同一类别
        })
      })

      clearInterval(progressInterval)
      analysisProgress.value = 100

      if (!response.ok) {
        throw new Error(`融合分析失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      analysisResult.value = result.data

      leaveSession(fusionId)

      return result.data
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
   * 格式化分析结果为用户友好的显示
   */
  const formattedResult = computed(() => {
    if (!analysisResult.value) return null

    const result = analysisResult.value

    return {
      analysisId: result.analysisId,
      type: result.analysisType || 'content',
      createdAt: result.createdAt || result.processedAt,

      // 内容分析结果
      contentAnalysis: result.finalReport ? {
        report: result.finalReport,
        summary: result.structuredData?.videoInfo || {}
      } : null,

      // 融合分析结果
      fusionAnalysis: result.fusionPlan ? {
        plan: result.fusionPlan,
        video1Summary: result.video1Analysis?.structuredData?.videoInfo || {},
        video2Summary: result.video2Analysis?.structuredData?.videoInfo || {},
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
    resetAnalysis
  }
}