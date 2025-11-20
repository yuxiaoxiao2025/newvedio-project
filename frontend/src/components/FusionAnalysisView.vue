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
          <div class="stat">
            <span>关键帧</span>
            <span>{{ video1Summary.keyframeCount }}个</span>
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
          <div class="stat">
            <span>关键帧</span>
            <span>{{ video2Summary.keyframeCount }}个</span>
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

    <!-- 融合时间轴可视化 -->
    <div class="timeline-section">
      <h3>⏱️ 融合时间轴设计</h3>
      <div class="timeline-container">
        <div class="timeline-header">
          <div class="timeline-labels">
            <span class="video-label">视频 A</span>
            <span class="video-label">融合后</span>
            <span class="video-label">视频 B</span>
          </div>
        </div>

        <div class="timeline-bars">
          <!-- 视频A时间轴 -->
          <div class="video-timeline">
            <div class="timeline-bar">
              <div
                v-for="(segment, index) in getVideoSegments('video1')"
                :key="`video1-${index}`"
                class="timeline-segment video1-segment"
                :style="{
                  left: segment.percentage + '%',
                  width: segment.width + '%',
                  backgroundColor: getSegmentColor(segment.type)
                }"
                :title="`${segment.type}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`"
              ></div>
            </div>
          </div>

          <!-- 融合后时间轴 -->
          <div class="video-timeline">
            <div class="timeline-bar fusion-bar">
              <div
                v-for="(segment, index) in getFusionSegments()"
                :key="`fusion-${index}`"
                class="timeline-segment fusion-segment"
                :style="{
                  left: segment.percentage + '%',
                  width: segment.width + '%',
                  backgroundColor: getFusionColor(segment.source)
                }"
                :title="`${segment.source}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`"
              >
                <span class="segment-label">{{ segment.source === 'video1' ? 'A' : 'B' }}</span>
              </div>
            </div>
          </div>

          <!-- 视频2时间轴 -->
          <div class="video-timeline">
            <div class="timeline-bar">
              <div
                v-for="(segment, index) in getVideoSegments('video2')"
                :key="`video2-${index}`"
                class="timeline-segment video2-segment"
                :style="{
                  left: segment.percentage + '%',
                  width: segment.width + '%',
                  backgroundColor: getSegmentColor(segment.type)
                }"
                :title="`${segment.type}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`"
              ></div>
            </div>
          </div>
        </div>

        <div class="timeline-marks">
          <span>0:00</span>
          <span>{{ formatTime(getTotalDuration() / 4) }}</span>
          <span>{{ formatTime(getTotalDuration() / 2) }}</span>
          <span>{{ formatTime(getTotalDuration() * 3/4) }}</span>
          <span>{{ formatTime(getTotalDuration()) }}</span>
        </div>
      </div>
    </div>

    <!-- 融合方案详情 -->
    <div class="fusion-plan-section">
      <h3>📋 详细融合方案</h3>
      <div class="plan-tabs">
        <button
          v-for="tab in planTabs"
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="plan-content">
        <div v-if="activeTab === 'overview'" class="tab-content">
          <div class="plan-text" v-html="formatPlan(fusion.plan)"></div>
        </div>

        <div v-if="activeTab === 'timeline'" class="tab-content">
          <div class="timeline-details">
            <h4>🎯 分段策略</h4>
            <div class="segments-list">
              <div
                v-for="(segment, index) in getDetailedSegments()"
                :key="index"
                class="segment-detail"
              >
                <div class="segment-header">
                  <span class="segment-name">{{ segment.name }}</span>
                  <span class="segment-time">{{ formatTime(segment.startTime) }} - {{ formatTime(segment.endTime) }}</span>
                  <span class="segment-source" :class="segment.source">{{ segment.source === 'video1' ? '视频A' : '视频B' }}</span>
                </div>
                <div class="segment-description">{{ segment.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'transitions'" class="tab-content">
          <div class="transitions-details">
            <h4>✨ 转场效果设计</h4>
            <div class="transitions-list">
              <div
                v-for="(transition, index) in getTransitions()"
                :key="index"
                class="transition-detail"
              >
                <div class="transition-icon">{{ transition.icon }}</div>
                <div class="transition-content">
                  <h5>{{ transition.name }}</h5>
                  <p>{{ transition.description }}</p>
                  <div class="transition-params">
                    <span class="param">时长: {{ transition.duration }}</span>
                    <span class="param">类型: {{ transition.type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'quality'" class="tab-content">
          <div class="quality-details">
            <h4>🔧 技术参数配置</h4>
            <div class="quality-grid">
              <div class="quality-item">
                <h5>分辨率统一</h5>
                <p>1920x1080 (Full HD)</p>
              </div>
              <div class="quality-item">
                <h5>帧率同步</h5>
                <p>30fps 统一帧率</p>
              </div>
              <div class="quality-item">
                <h5>编码格式</h5>
                <p>H.264 高质量编码</p>
              </div>
              <div class="quality-item">
                <h5>色彩空间</h5>
                <p>sRGB 标准色彩空间</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 制作时间线 -->
    <div class="production-timeline">
      <h3>📊 制作时间线</h3>
      <div class="timeline-steps">
        <div
          v-for="(step, index) in getProductionSteps()"
          :key="index"
          class="step-item"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
            <span class="step-duration">⏱️ {{ step.duration }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="$emit('generate-music', fusion.plan)" class="generate-music-btn">
        🎵 生成背景音乐提示词
      </button>
      <button @click="exportPlan" class="export-btn">
        📄 导出制作方案
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

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
    const activeTab = ref('overview')

    const video1Summary = computed(() => props.fusion.video1Summary || {})
    const video2Summary = computed(() => props.fusion.video2Summary || {})
    const compatibility = computed(() => props.fusion.compatibility || {})
    const fusion = computed(() => props.fusion)

    const planTabs = [
      { key: 'overview', label: '方案总览' },
      { key: 'timeline', label: '时间轴详情' },
      { key: 'transitions', label: '转场效果' },
      { key: 'quality', label: '技术参数' }
    ]

    // 格式化时间
    const formatDuration = (seconds) => {
      if (!seconds) return '未知'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}分${remainingSeconds}秒`
    }

    const formatTime = (seconds) => {
      if (!seconds) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

    // 获取总时长
    const getTotalDuration = () => {
      return Math.min(
        (video1Summary.value.duration || 0) + (video2Summary.value.duration || 0),
        45 // 目标最大45秒
      )
    }

    // 获取视频分段
    const getVideoSegments = (videoType) => {
      const summary = videoType === 'video1' ? video1Summary.value : video2Summary.value
      const duration = summary.duration || 0

      // 模拟场景分段数据
      const sceneCount = summary.sceneCount || 3
      const segments = []

      for (let i = 0; i < sceneCount; i++) {
        const startTime = (duration / sceneCount) * i
        const endTime = (duration / sceneCount) * (i + 1)
        const segmentDuration = endTime - startTime

        segments.push({
          type: getSceneType(i),
          startTime,
          endTime,
          duration: segmentDuration,
          percentage: (startTime / duration) * 100,
          width: (segmentDuration / duration) * 100
        })
      }

      return segments
    }

    // 获取场景类型
    const getSceneType = (index) => {
      const types = ['风景', '人物', '建筑', '动物', '食物', '运动']
      return types[index % types.length]
    }

    // 获取分段颜色
    const getSegmentColor = (sceneType) => {
      const colors = {
        '风景': '#4ade80',
        '人物': '#3b82f6',
        '建筑': '#f59e0b',
        '动物': '#ef4444',
        '食物': '#8b5cf6',
        '运动': '#ec4899'
      }
      return colors[sceneType] || '#9ca3af'
    }

    // 获取融合分段
    const getFusionSegments = () => {
      const totalDuration = getTotalDuration()
      const segments = []

      // 模拟智能融合策略
      segments.push(
        {
          source: 'video1',
          startTime: 0,
          endTime: 10,
          percentage: 0,
          width: (10 / totalDuration) * 100
        },
        {
          source: 'video2',
          startTime: 0,
          endTime: 8,
          percentage: (10 / totalDuration) * 100,
          width: (8 / totalDuration) * 100
        },
        {
          source: 'video1',
          startTime: 10,
          endTime: 25,
          percentage: ((10 + 8) / totalDuration) * 100,
          width: (15 / totalDuration) * 100
        },
        {
          source: 'video2',
          startTime: 8,
          endTime: 20,
          percentage: ((10 + 8 + 15) / totalDuration) * 100,
          width: (12 / totalDuration) * 100
        },
        {
          source: 'video2',
          startTime: 20,
          endTime: totalDuration,
          percentage: ((10 + 8 + 15 + 12) / totalDuration) * 100,
          width: ((totalDuration - 32) / totalDuration) * 100
        }
      )

      return segments
    }

    // 获取融合颜色
    const getFusionColor = (source) => {
      return source === 'video1' ? '#3b82f6' : '#10b981'
    }

    // 获取详细分段
    const getDetailedSegments = () => {
      return [
        {
          name: '开篇引入',
          startTime: 0,
          endTime: 10,
          source: 'video1',
          description: '使用视频A的精彩开场，快速吸引观众注意力'
        },
        {
          name: '情节发展',
          startTime: 10,
          endTime: 18,
          source: 'video2',
          description: '引入视频B的核心内容，丰富叙事层次'
        },
        {
          name: '高潮部分',
          startTime: 18,
          endTime: 33,
          source: 'video1',
          description: '回归视频A的高潮片段，强化主题表达'
        },
        {
          name: '结尾收束',
          startTime: 33,
          endTime: 45,
          source: 'video2',
          description: '使用视频B的精彩结尾，完美收束'
        }
      ]
    }

    // 获取转场效果
    const getTransitions = () => {
      return [
        {
          icon: '🎬',
          name: '淡入淡出',
          description: '温和的过渡效果，适合场景的自然切换',
          duration: '1.5秒',
          type: '柔和转场'
        },
        {
          icon: '⚡',
          name: '快速切换',
          description: '动感的快速转场，增强节奏感',
          duration: '0.5秒',
          type: '动感转场'
        },
        {
          icon: '🌟',
          name: '溶解过渡',
          description: '优雅的溶解效果，画面融合自然',
          duration: '2秒',
          type: '艺术转场'
        }
      ]
    }

    // 获取制作步骤
    const getProductionSteps = () => {
      return [
        {
          title: '素材准备',
          description: '导入两个视频文件，进行格式检查和预处理',
          duration: '5分钟'
        },
        {
          title: '粗剪分段',
          description: '按照时间轴方案，对两个视频进行精确分段',
          duration: '10分钟'
        },
        {
          title: '精细调整',
          description: '调整画面质量、色彩统一、音量平衡',
          duration: '15分钟'
        },
        {
          title: '转场添加',
          description: '在切换点添加专业的转场效果',
          duration: '8分钟'
        },
        {
          title: '最终渲染',
          description: '输出高质量的融合视频文件',
          duration: '12分钟'
        }
      ]
    }

    // 格式化方案内容
    const formatPlan = (plan) => {
      if (!plan) return '暂无融合方案'
      return plan
        .replace(/\n/g, '<br>')
        .replace(/##\s*(.+)/g, '<h4>$1</h4>')
        .replace(/#\s*(.+)/g, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/-\s*(.+)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    }

    // 导出方案
    const exportPlan = () => {
      const exportData = {
        fusionPlan: fusion.value,
        video1Summary: video1Summary.value,
        video2Summary: video2Summary.value,
        compatibility: compatibility.value,
        timeline: getFusionSegments(),
        transitions: getTransitions(),
        productionSteps: getProductionSteps()
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `fusion_plan_${Date.now()}.json`
      link.click()
    }

    return {
      activeTab,
      video1Summary,
      video2Summary,
      compatibility,
      fusion,
      planTabs,
      formatDuration,
      formatTime,
      getCompatibilityLabel,
      getTotalDuration,
      getVideoSegments,
      getSegmentColor,
      getFusionSegments,
      getFusionColor,
      getDetailedSegments,
      getTransitions,
      getProductionSteps,
      formatPlan,
      exportPlan
    }
  }
}
</script>

<style scoped>
.fusion-analysis-view {
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header h2 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 视频概览 */
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

/* 兼容性分析 */
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

/* 时间轴可视化 */
.timeline-section {
  margin-bottom: 2rem;
}

.timeline-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timeline-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.video-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.timeline-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.video-timeline {
  position: relative;
}

.timeline-bar {
  position: relative;
  height: 32px;
  background: #f3f4f6;
  border-radius: 16px;
  overflow: hidden;
}

.fusion-bar {
  background: linear-gradient(90deg, #e0f2fe, #dcfce7);
}

.timeline-segment {
  position: absolute;
  height: 100%;
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.timeline-segment:hover {
  opacity: 0.8;
  transform: scaleY(1.2);
}

.segment-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.timeline-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* 融合方案详情 */
.fusion-plan-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plan-tabs {
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

.plan-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.tab-content {
  color: #374151;
  line-height: 1.6;
}

.plan-text {
  color: #374151;
  line-height: 1.6;
}

.plan-text h3 {
  color: #111827;
  margin: 1.5rem 0 1rem 0;
}

.plan-text h4 {
  color: #374151;
  margin: 1rem 0 0.5rem 0;
}

.plan-text ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.plan-text li {
  margin-bottom: 0.25rem;
}

/* 分段详情 */
.segments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.segment-detail {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.segment-name {
  font-weight: 600;
  color: #111827;
}

.segment-time {
  font-size: 0.85rem;
  color: #6b7280;
}

.segment-source {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.segment-source.video1 {
  background: #dbeafe;
  color: #1d4ed8;
}

.segment-source.video2 {
  background: #dcfce7;
  color: #166534;
}

.segment-description {
  font-size: 0.9rem;
  color: #374151;
}

/* 转场效果 */
.transitions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transition-detail {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.transition-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.transition-content h5 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1rem;
}

.transition-content p {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.transition-params {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.param {
  background: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #374151;
}

/* 技术参数 */
.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quality-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.quality-item h5 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1rem;
}

.quality-item p {
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
}

/* 制作时间线 */
.production-timeline {
  margin-bottom: 2rem;
}

.production-timeline h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timeline-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 0.9rem;
}

.step-content p {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.85rem;
  line-height: 1.4;
}

.step-duration {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.generate-music-btn,
.export-btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.generate-music-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.generate-music-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.export-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.export-btn:hover {
  background: #e5e7eb;
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

  .timeline-labels {
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline-steps {
    grid-template-columns: 1fr;
  }

  .segment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .transition-detail {
    flex-direction: column;
    text-align: center;
  }

  .transition-params {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
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

@media (max-width: 480px) {
  .tab-button {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }

  .plan-tabs {
    flex-wrap: wrap;
  }
}
</style>