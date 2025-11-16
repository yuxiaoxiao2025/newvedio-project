<template>
  <div class="content-analysis-view">
    <div class="section-header">
      <h2>📊 视频内容分析报告</h2>
      <div class="video-summary">
        <div class="summary-item">
          <span class="label">时长</span>
          <span class="value">{{ formatDuration(summary.duration) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">关键帧</span>
          <span class="value">{{ summary.keyframeCount }}个</span>
        </div>
        <div class="summary-item">
          <span class="label">场景数</span>
          <span class="value">{{ summary.sceneCount }}个</span>
        </div>
        <div class="summary-item">
          <span class="label">物体数</span>
          <span class="value">{{ summary.objectCount }}个</span>
        </div>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 分析报告 -->
      <div class="report-section">
        <h3>📝 详细分析报告</h3>
        <div class="report-content">
          <pre>{{ analysis.report }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentAnalysisView',

  props: {
    analysis: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const summary = props.analysis.summary || {}

    const formatDuration = (seconds) => {
      if (!seconds) return '未知'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds}秒`
    }

    return {
      summary,
      formatDuration
    }
  }
}
</script>

<style scoped>
.content-analysis-view {
  padding: 2rem;
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.video-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.summary-item {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-item .value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.report-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.report-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.report-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-analysis-view {
    padding: 1.5rem;
  }

  .video-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header h2 {
    font-size: 1.3rem;
  }
}
</style>