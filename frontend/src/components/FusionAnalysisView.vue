<template>
  <div class="fusion-analysis-view">
    <div class="section-header">
      <h2>🎬 视频融合分析方案</h2>
    </div>

    <!-- 视频概览 -->
    <div class="videos-overview">
      <div class="video-card">
        <h4>视频 A</h4>
        <div class="video-stats">
          <div class="stat">
            <span>时长</span>
            <span>{{ formatDuration(video1Summary.duration) }}</span>
          </div>
          <div class="stat">
            <span>场景数</span>
            <span>{{ video1Summary.sceneCount }}个</span>
          </div>
        </div>
      </div>

      <div class="fusion-arrow">➕</div>

      <div class="video-card">
        <h4>视频 B</h4>
        <div class="video-stats">
          <div class="stat">
            <span>时长</span>
            <span>{{ formatDuration(video2Summary.duration) }}</span>
          </div>
          <div class="stat">
            <span>场景数</span>
            <span>{{ video2Summary.sceneCount }}个</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 兼容性分析 -->
    <div class="compatibility-section" v-if="compatibility">
      <h3>🔗 兼容性分析</h3>
      <div class="compatibility-grid">
        <div class="compatibility-item">
          <span class="label">内容兼容性</span>
          <span class="value" :class="compatibility.contentCompatibility?.compatibility">
            {{ getCompatibilityLabel(compatibility.contentCompatibility?.compatibility) }}
          </span>
        </div>
        <div class="compatibility-item">
          <span class="label">推荐方案</span>
          <span class="recommendation">
            {{ compatibility.contentCompatibility?.recommendation }}
          </span>
        </div>
      </div>
    </div>

    <!-- 融合方案 -->
    <div class="fusion-plan-section">
      <h3>📋 详细融合方案</h3>
      <div class="plan-content">
        <pre>{{ fusion.plan }}</pre>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="$emit('generate-music', fusion.plan)" class="generate-music-btn">
        🎵 生成背景音乐提示词
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FusionAnalysisView',

  props: {
    fusion: {
      type: Object,
      required: true
    }
  },

  emits: ['generate-music'],

  setup(props) {
    const video1Summary = props.fusion.video1Summary || {}
    const video2Summary = props.fusion.video2Summary || {}
    const compatibility = props.fusion.compatibility || {}
    const fusion = props.fusion

    const formatDuration = (seconds) => {
      if (!seconds) return '未知'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds}秒`
    }

    const getCompatibilityLabel = (compatibility) => {
      switch (compatibility) {
        case 'high':
          return '高兼容'
        case 'medium':
          return '中等兼容'
        case 'low':
          return '低兼容'
        default:
          return '未知'
      }
    }

    return {
      video1Summary,
      video2Summary,
      compatibility,
      fusion,
      formatDuration,
      getCompatibilityLabel
    }
  }
}
</script>

<style scoped>
.fusion-analysis-view {
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
}

.section-header h2 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.videos-overview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.video-card {
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  min-width: 200px;
}

.video-card h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.video-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.stat span:first-child {
  color: #6b7280;
}

.stat span:last-child {
  font-weight: 600;
  color: #111827;
}

.fusion-arrow {
  font-size: 2rem;
  color: #6b7280;
  align-self: center;
}

.compatibility-section {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.compatibility-section h3 {
  margin: 0 0 1rem 0;
  color: #0c4a6e;
  font-size: 1.1rem;
}

.compatibility-grid {
  display: grid;
  gap: 1rem;
}

.compatibility-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.compatibility-item .label {
  font-weight: 500;
  color: #374151;
}

.compatibility-item .value {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.compatibility-item .value.high {
  background: #dcfce7;
  color: #166534;
}

.compatibility-item .value.medium {
  background: #fef3c7;
  color: #92400e;
}

.compatibility-item .value.low {
  background: #fee2e2;
  color: #991b1b;
}

.compatibility-item .recommendation {
  color: #6b7280;
  font-style: italic;
  max-width: 60%;
  text-align: right;
}

.fusion-plan-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.2rem;
}

.plan-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.plan-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.generate-music-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.generate-music-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fusion-analysis-view {
    padding: 1.5rem;
  }

  .videos-overview {
    flex-direction: column;
    gap: 1rem;
  }

  .fusion-arrow {
    transform: rotate(90deg);
  }

  .compatibility-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .compatibility-item .recommendation {
    max-width: 100%;
    text-align: left;
  }
}
</style>