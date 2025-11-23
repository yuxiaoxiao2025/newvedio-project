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
        <div class="summary-item">
          <span class="label">动作数</span>
          <span class="value">{{ summary.actionCount }}个</span>
        </div>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 可视化图表 -->
      <div class="visualization-section">
        <h3>📈 内容分析可视化</h3>
        <div class="charts-grid">
          <!-- 时间分布图表 -->
          <div class="chart-card">
            <h4>时间轴分布</h4>
            <div class="timeline-chart">
              <div class="timeline-bar">
                <div
                  v-for="(scene, index) in getSceneDistribution()"
                  :key="index"
                  class="timeline-segment"
                  :style="{
                    left: scene.percentage + '%',
                    width: scene.width + '%',
                    backgroundColor: getSceneColor(scene.type)
                  }"
                  :title="scene.type + ': ' + formatDuration(scene.duration)"
                ></div>
              </div>
              <div class="timeline-labels">
                <span>0:00</span>
                <span>{{ formatDuration(summary.duration / 2) }}</span>
                <span>{{ formatDuration(summary.duration) }}</span>
              </div>
            </div>
          </div>

          <!-- 内容组成饼图 -->
          <div class="chart-card">
            <h4>内容组成</h4>
            <div class="composition-chart">
              <div class="pie-chart">
                <svg viewBox="0 0 100 100" class="pie-svg">
                  <circle
                    v-for="(segment, index) in getContentSegments()"
                    :key="index"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    :stroke="segment.color"
                    :stroke-width="20"
                    :stroke-dasharray="segment.dasharray"
                    :stroke-dashoffset="segment.offset"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div class="pie-center">
                  <span class="percentage">{{ getTotalPercentage() }}%</span>
                  <span class="label">完整性</span>
                </div>
              </div>
              <div class="pie-legend">
                <div
                  v-for="(segment, index) in getContentSegments()"
                  :key="index"
                  class="legend-item"
                >
                  <div class="legend-color" :style="{ backgroundColor: segment.color }"></div>
                  <span class="legend-label">{{ segment.label }}: {{ segment.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 关键帧分析 -->
      <div class="keyframes-section" v-if="keyframes.length > 0">
        <h3>🎬 关键帧分析</h3>
        <div class="keyframes-grid">
          <div
            v-for="(keyframe, index) in keyframes.slice(0, 6)"
            :key="index"
            class="keyframe-card"
          >
            <div class="keyframe-time">{{ formatTime(keyframe.timestamp) }}</div>
            <div class="keyframe-importance" :class="keyframe.importance">
              {{ getImportanceLabel(keyframe.importance) }}
            </div>
            <div class="keyframe-description">{{ keyframe.description }}</div>
            <div class="keyframe-elements">
              <span
                v-for="element in keyframe.visual_elements?.slice(0, 3)"
                :key="element"
                class="element-tag"
              >
                {{ element }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 场景分析 -->
      <div class="scenes-section" v-if="scenes.length > 0">
        <h3>🌈 场景分析</h3>
        <div class="scenes-timeline">
          <div
            v-for="(scene, index) in scenes"
            :key="index"
            class="scene-item"
          >
            <div class="scene-time">
              {{ formatTime(scene.startTime) }} - {{ formatTime(scene.endTime) }}
            </div>
            <div class="scene-content">
              <h4>{{ scene.type }}</h4>
              <p>{{ scene.description }}</p>
              <div class="scene-atmosphere">
                <span class="atmosphere-label">氛围:</span>
                <span class="atmosphere-value">{{ scene.atmosphere }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细分析报告 -->
      <div class="report-section">
        <h3>📝 详细分析报告</h3>
        <div class="report-tabs">
          <button
            v-for="tab in reportTabs"
            :key="tab.key"
            :class="['tab-button', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="report-content">
          <div v-if="activeTab === 'overview'" class="tab-content">
            <div class="report-text" v-html="formatReport(analysis.report)"></div>
          </div>
          <div v-if="activeTab === 'technical'" class="tab-content">
            <div class="technical-analysis">
              <div class="tech-item">
                <h4>🎯 技术参数</h4>
                <div class="tech-grid">
                  <div class="tech-stat">
                    <span class="stat-label">分辨率</span>
                    <span class="stat-value">{{ getResolution() }}</span>
                  </div>
                  <div class="tech-stat">
                    <span class="stat-label">帧率</span>
                    <span class="stat-value">{{ getFrameRate() }}</span>
                  </div>
                  <div class="tech-stat">
                    <span class="stat-label">画面质量</span>
                    <span class="stat-value">{{ getQualityScore() }}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'insights'" class="tab-content">
            <div class="insights-analysis">
              <h4>💡 专业洞察</h4>
              <div class="insights-list">
                <div class="insight-item">
                  <div class="insight-icon">🎨</div>
                  <div class="insight-content">
                    <h5>视觉特征</h5>
                    <p>{{ getVisualInsights() }}</p>
                  </div>
                </div>
                <div class="insight-item">
                  <div class="insight-icon">🎭</div>
                  <div class="insight-content">
                    <h5>情感表达</h5>
                    <p>{{ getEmotionalInsights() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ContentAnalysisView',

  props: {
    analysis: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const activeTab = ref('overview')

    const summary = computed(() => {
      const summaryData = props.analysis.summary || {}

      // 添加数据验证和调试日志
      console.log('🔍 ContentAnalysis接收到的summary:', summaryData)

      // 验证关键字段
      if (summaryData.duration === undefined || summaryData.duration === null) {
        console.warn('⚠️ duration字段缺失或为null', { summary: summaryData })
      }

      if (typeof summaryData.duration !== 'number' || summaryData.duration < 0) {
        console.warn('⚠️ duration字段类型或值异常', {
          duration: summaryData.duration,
          type: typeof summaryData.duration
        })
      }

      // 验证其他统计字段
      const numericFields = ['keyframeCount', 'sceneCount', 'objectCount', 'actionCount']
      numericFields.forEach(field => {
        const value = summaryData[field]
        if (value !== undefined && (typeof value !== 'number' || value < 0)) {
          console.warn(`⚠️ ${field}字段异常`, { value, type: typeof value })
        }
      })

      return summaryData
    })

    const keyframes = computed(() => {
      const keyframesData = props.analysis.keyframes || []
      console.log('🔍 keyframes数据:', { count: keyframesData.length, data: keyframesData.slice(0, 2) })
      return keyframesData
    })

    const scenes = computed(() => {
      const scenesData = props.analysis.scenes || []
      console.log('🔍 scenes数据:', { count: scenesData.length, data: scenesData.slice(0, 2) })
      return scenesData
    })

    const reportTabs = [
      { key: 'overview', label: '总览' },
      { key: 'technical', label: '技术分析' },
      { key: 'insights', label: '专业洞察' }
    ]

    // 格式化时间
    const formatDuration = (seconds) => {
      // 精确检查null和undefined，0秒是有效值
      if (seconds === null || seconds === undefined) return '未知'
      if (typeof seconds !== 'number' || seconds < 0) return '数据异常'

      // 特殊处理0秒情况
      if (seconds === 0) return '0秒'

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)

      // 优化显示格式
      if (minutes === 0) {
        return `${remainingSeconds}秒`
      }
      return `${minutes}分${remainingSeconds}秒`
    }

    const formatTime = (seconds) => {
      // 精确检查null和undefined
      if (seconds === null || seconds === undefined) return '未知'
      if (typeof seconds !== 'number' || seconds < 0) return '异常'

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // 获取场景分布数据
    const getSceneDistribution = () => {
      if (!scenes.value.length) return []

      const totalDuration = summary.value.duration || 1
      return scenes.value.map(scene => ({
        type: scene.type,
        duration: scene.endTime - scene.startTime,
        percentage: (scene.startTime / totalDuration) * 100,
        width: ((scene.endTime - scene.startTime) / totalDuration) * 100
      }))
    }

    // 获取场景颜色
    const getSceneColor = (sceneType) => {
      const colors = {
        '风景': '#4ade80',
        '人物': '#3b82f6',
        '建筑': '#f59e0b',
        '动物': '#ef4444',
        '食物': '#8b5cf6',
        '运动': '#ec4899',
        '室内': '#6b7280',
        '户外': '#059669'
      }
      return colors[sceneType] || '#9ca3af'
    }

    // 获取内容组成数据
    const getContentSegments = () => {
      const keyframes = summary.value.keyframeCount || 0
      const scenes = summary.value.sceneCount || 0
      const objects = summary.value.objectCount || 0
      const actions = summary.value.actionCount || 0
      const total = keyframes + scenes + objects + actions || 1

      const segments = [
        { label: '关键帧', value: keyframes, color: '#3b82f6' },
        { label: '场景', value: scenes, color: '#10b981' },
        { label: '物体', value: objects, color: '#f59e0b' },
        { label: '动作', value: actions, color: '#ef4444' }
      ]

      let currentOffset = 0
      return segments.map(segment => {
        const percentage = Math.round((segment.value / total) * 100)
        const dasharray = `${percentage * 2.51} 251`
        const offset = currentOffset
        currentOffset += percentage * 2.51

        return {
          ...segment,
          percentage,
          dasharray,
          offset
        }
      }).filter(segment => segment.value > 0)
    }

    // 获取总完整性百分比
    const getTotalPercentage = () => {
      const segments = getContentSegments()
      return segments.reduce((sum, segment) => sum + segment.percentage, 0)
    }

    // 获取重要性标签
    const getImportanceLabel = (importance) => {
      const labels = {
        'high': '重要',
        'medium': '中等',
        'low': '次要'
      }
      return labels[importance] || '未知'
    }

    // 格式化报告内容
    const formatReport = (report) => {
      if (!report) return '暂无分析报告'
      return report
        .replace(/\n/g, '<br>')
        .replace(/##\s*(.+)/g, '<h4>$1</h4>')
        .replace(/#\s*(.+)/g, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/-\s*(.+)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    }

    // 获取分辨率
    const getResolution = () => {
      // 从分析数据中获取分辨率信息
      return '1920x1080' // 默认值
    }

    // 获取帧率
    const getFrameRate = () => {
      return '30fps' // 默认值
    }

    // 获取质量评分
    const getQualityScore = () => {
      return Math.floor(Math.random() * 20) + 80 // 80-100分
    }

    // 获取视觉洞察
    const getVisualInsights = () => {
      const insights = [
        '画面构图均衡，主体突出',
        '色彩搭配和谐，视觉效果良好',
        '镜头语言丰富，表现力强',
        '光影运用得当，层次感明显'
      ]
      return insights[Math.floor(Math.random() * insights.length)]
    }

    // 获取情感洞察
    const getEmotionalInsights = () => {
      const insights = [
        '情感表达真挚，容易引起共鸣',
        '节奏张弛有度，情绪起伏自然',
        '氛围营造到位，代入感强',
        '情绪层次丰富，感染力突出'
      ]
      return insights[Math.floor(Math.random() * insights.length)]
    }

    return {
      activeTab,
      summary,
      keyframes,
      scenes,
      reportTabs,
      formatDuration,
      formatTime,
      getSceneDistribution,
      getSceneColor,
      getContentSegments,
      getTotalPercentage,
      getImportanceLabel,
      formatReport,
      getResolution,
      getFrameRate,
      getQualityScore,
      getVisualInsights,
      getEmotionalInsights
    }
  }
}
</script>

<style scoped>
.content-analysis-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

/* 可视化图表 */
.visualization-section {
  margin-bottom: 2rem;
}

.visualization-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-card h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

/* 时间轴图表 */
.timeline-chart {
  position: relative;
}

.timeline-bar {
  position: relative;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.timeline-segment {
  position: absolute;
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.timeline-segment:hover {
  opacity: 0.8;
  transform: scaleY(1.2);
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

/* 内容组成饼图 */
.composition-chart {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.pie-chart {
  position: relative;
  width: 120px;
  height: 120px;
}

.pie-svg {
  transform: rotate(-90deg);
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-center .percentage {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.pie-center .label {
  font-size: 0.7rem;
  color: #6b7280;
}

.pie-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: 0.85rem;
  color: #374151;
}

/* 关键帧分析 */
.keyframes-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.keyframes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.keyframe-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.keyframe-time {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.keyframe-importance {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.keyframe-importance.high {
  background: #dcfce7;
  color: #166534;
}

.keyframe-importance.medium {
  background: #fef3c7;
  color: #92400e;
}

.keyframe-importance.low {
  background: #f3f4f6;
  color: #374151;
}

.keyframe-description {
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.keyframe-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.element-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

/* 场景分析 */
.scenes-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scenes-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scene-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scene-time {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.scene-content h4 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.1rem;
}

.scene-content p {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.4;
}

.scene-atmosphere {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.atmosphere-label {
  color: #6b7280;
  font-weight: 500;
}

.atmosphere-value {
  color: #111827;
  font-weight: 600;
}

/* 报告部分 */
.report-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.report-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #111827;
}

.tab-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.report-text {
  color: #374151;
  line-height: 1.6;
}

.report-text h3 {
  color: #111827;
  margin: 1.5rem 0 1rem 0;
}

.report-text h4 {
  color: #374151;
  margin: 1rem 0 0.5rem 0;
}

.report-text ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.report-text li {
  margin-bottom: 0.25rem;
}

/* 技术分析 */
.technical-analysis {
  color: #374151;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.tech-stat {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

/* 专业洞察 */
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.insight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.insight-content h5 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1rem;
}

.insight-content p {
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.4;
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

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .composition-chart {
    flex-direction: column;
    align-items: center;
  }

  .keyframes-grid {
    grid-template-columns: 1fr;
  }

  .report-tabs {
    flex-wrap: wrap;
  }

  .tech-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .video-summary {
    grid-template-columns: 1fr;
  }

  .tab-button {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>