<template>
  <div class="analysis-result-display">
    <!-- 加载状态 -->
    <div v-if="isAnalyzing" class="loading-state">
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: analysisProgress + '%' }"
          ></div>
        </div>
        <span class="progress-text">{{ analysisProgress }}%</span>
      </div>
      <p class="loading-message">
        {{ getLoadingMessage() }}
      </p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>分析失败</h3>
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">重试</button>
    </div>

    <!-- 成功状态 -->
    <div v-else-if="formattedResult" class="success-state">
      <!-- 结果头部信息 -->
      <div class="result-header">
        <div class="result-meta">
          <span class="analysis-type">{{ getAnalysisTypeLabel() }}</span>
          <span class="timestamp">{{ formatTimestamp(formattedResult.createdAt) }}</span>
        </div>
        <div class="result-actions">
          <button @click="exportResult" class="export-btn">导出结果</button>
          <button @click="$emit('close')" class="close-btn">关闭</button>
        </div>
      </div>

      <!-- 内容分析结果 -->
      <ContentAnalysisView
        v-if="formattedResult.contentAnalysis"
        :analysis="formattedResult.contentAnalysis"
      />

      <!-- 融合分析结果 -->
      <FusionAnalysisView
        v-if="formattedResult.fusionAnalysis"
        :fusion="formattedResult.fusionAnalysis"
        @generate-music="handleGenerateMusic"
      />

      <!-- 音乐提示词 -->
      <MusicPromptView
        v-if="formattedResult.musicPrompt"
        :prompt="formattedResult.musicPrompt"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📹</div>
      <h3>暂无分析结果</h3>
      <p>请上传视频文件开始分析</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import ContentAnalysisView from './ContentAnalysisView.vue'
import FusionAnalysisView from './FusionAnalysisView.vue'
import MusicPromptView from './MusicPromptView.vue'

export default {
  name: 'AnalysisResultDisplay',

  components: {
    ContentAnalysisView,
    FusionAnalysisView,
    MusicPromptView
  },

  props: {
    isAnalyzing: {
      type: Boolean,
      default: false
    },
    analysisProgress: {
      type: Number,
      default: 0
    },
    analysisResult: {
      type: Object,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  },

  emits: ['retry', 'close', 'generate-music'],

  setup(props, { emit }) {
    // 计算格式化结果
    const formattedResult = computed(() => {
      if (!props.analysisResult) return null

      const result = props.analysisResult

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

    // 获取加载消息
    const getLoadingMessage = () => {
      const progress = props.analysisProgress

      if (progress < 30) {
        return '正在上传视频文件...'
      } else if (progress < 60) {
        return 'AI正在分析视频内容...'
      } else if (progress < 90) {
        return '正在生成分析报告...'
      } else {
        return '即将完成...'
      }
    }

    // 获取分析类型标签
    const getAnalysisTypeLabel = () => {
      switch (formattedResult.value?.type) {
        case 'content':
          return '视频内容分析'
        case 'fusion':
          return '视频融合分析'
        case 'music':
          return '音乐提示词生成'
        default:
          return '综合分析'
      }
    }

    // 格式化时间戳
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    // 导出结果
    const exportResult = () => {
      if (!formattedResult.value) return

      const dataStr = JSON.stringify(formattedResult.value, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `analysis_${formattedResult.value.analysisId}.json`
      link.click()
    }

    // 处理生成音乐
    const handleGenerateMusic = (fusionPlan) => {
      emit('generate-music', fusionPlan)
    }

    return {
      formattedResult,
      getLoadingMessage,
      getAnalysisTypeLabel,
      formatTimestamp,
      exportResult,
      handleGenerateMusic
    }
  }
}
</script>

<style scoped>
.analysis-result-display {
  max-width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 加载状态 */
.loading-state {
  padding: 3rem 2rem;
  text-align: center;
}

.progress-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #3b82f6;
  min-width: 50px;
}

.loading-message {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

/* 错误状态 */
.error-state {
  padding: 3rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

/* 成功状态 */
.success-state {
  /* 样式由子组件管理 */
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.result-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.analysis-type {
  font-weight: 600;
  color: #111827;
  font-size: 1.1rem;
}

.timestamp {
  font-size: 0.9rem;
  color: #6b7280;
}

.result-actions {
  display: flex;
  gap: 1rem;
}

.export-btn, .close-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.export-btn {
  background: #f3f4f6;
  color: #374151;
}

.export-btn:hover {
  background: #e5e7eb;
}

.close-btn {
  background: white;
  color: #6b7280;
}

.close-btn:hover {
  background: #f9fafb;
}

/* 空状态 */
.empty-state {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #9ca3af;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .result-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .progress-container {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>