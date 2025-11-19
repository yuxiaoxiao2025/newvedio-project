<template>
  <div class="ai-analysis-progress" v-if="isVisible">
    <div class="progress-container">
      <!-- 分析标题 -->
      <div class="progress-header">
        <div class="analysis-title">
          <span class="icon">{{ getAnalysisIcon() }}</span>
          <span class="title-text">{{ getAnalysisTitle() }}</span>
        </div>
        <div class="progress-status">
          <span class="status-text">{{ getCurrentStatusText() }}</span>
          <span class="percentage">{{ Math.round(percentage) }}%</span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: percentage + '%' }"
          ></div>
          <div
            class="progress-pulse"
            :style="{ left: percentage + '%' }"
          ></div>
        </div>
        <div class="progress-timeline">
          <div
            v-for="(stage, index) in stages"
            :key="index"
            class="timeline-stage"
            :class="{
              'completed': stage.completed,
              'current': stage.current,
              'upcoming': !stage.completed && !stage.current
            }"
          >
            <div class="stage-dot"></div>
            <div class="stage-label">{{ stage.label }}</div>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="progress-details" v-if="showDetails">
        <div class="detail-row" v-if="currentStage">
          <span class="detail-label">当前阶段：</span>
          <span class="detail-value">{{ currentStage.label }}</span>
        </div>
        <div class="detail-row" v-if="elapsedTime">
          <span class="detail-label">已用时间：</span>
          <span class="detail-value">{{ elapsedTime }}</span>
        </div>
        <div class="detail-row" v-if="estimatedTimeRemaining">
          <span class="detail-label">剩余时间：</span>
          <span class="detail-value">{{ estimatedTimeRemaining }}</span>
        </div>
        <div class="detail-row" v-if="processingInfo">
          <span class="detail-label">处理信息：</span>
          <span class="detail-value">{{ processingInfo }}</span>
        </div>
      </div>

      <!-- 实时日志 -->
      <div class="progress-logs" v-if="logs.length > 0">
        <div class="logs-header">
          <span>处理日志</span>
          <button
            @click="toggleLogsVisibility"
            class="logs-toggle"
            :class="{ 'expanded': showFullLogs }"
          >
            {{ showFullLogs ? '收起' : '展开' }}
          </button>
        </div>
        <div
          class="logs-container"
          :class="{ 'expanded': showFullLogs }"
        >
          <div
            v-for="(log, index) in displayedLogs"
            :key="index"
            class="log-entry"
            :class="log.type"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- 取消按钮 -->
      <div class="progress-actions" v-if="cancellable">
        <button
          @click="$emit('cancel')"
          class="cancel-btn"
          :disabled="!canCancel"
        >
          取消分析
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'AIAnalysisProgress',
  props: {
    // 分析类型
    analysisType: {
      type: String,
      default: 'content',
      validator: (value) => ['content', 'fusion', 'music'].includes(value)
    },
    // 当前进度百分比 (0-100)
    progress: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0 && value <= 100
    },
    // 当前状态
    status: {
      type: String,
      default: 'processing',
      validator: (value) => ['processing', 'completed', 'failed', 'cancelled'].includes(value)
    },
    // 是否可见
    visible: {
      type: Boolean,
      default: true
    },
    // 是否显示详细信息
    showDetails: {
      type: Boolean,
      default: true
    },
    // 是否可取消
    cancellable: {
      type: Boolean,
      default: true
    },
    // 处理信息
    processingInfo: {
      type: String,
      default: ''
    },
    // 开始时间
    startTime: {
      type: Number,
      default: null
    }
  },
  emits: ['cancel', 'complete', 'failed'],
  setup(props, { emit }) {
    // 状态管理
    const currentStageIndex = ref(0)
    const logs = ref([])
    const showFullLogs = ref(false)
    const timer = ref(null)

    // 分析阶段配置
    const stages = computed(() => {
      switch (props.analysisType) {
        case 'content':
          return [
            { label: '视频上传', percentage: 10, completed: false, current: false },
            { label: 'VL模型分析', percentage: 40, completed: false, current: false },
            { label: '数据结构化', percentage: 70, completed: false, current: false },
            { label: '报告生成', percentage: 90, completed: false, current: false },
            { label: '结果保存', percentage: 100, completed: false, current: false }
          ]
        case 'fusion':
          return [
            { label: '双视频上传', percentage: 10, completed: false, current: false },
            { label: '视频1分析', percentage: 25, completed: false, current: false },
            { label: '视频2分析', percentage: 40, completed: false, current: false },
            { label: '融合方案设计', percentage: 70, completed: false, current: false },
            { label: '时间轴生成', percentage: 85, completed: false, current: false },
            { label: '结果保存', percentage: 100, completed: false, current: false }
          ]
        case 'music':
          return [
            { label: '融合方案解析', percentage: 20, completed: false, current: false },
            { label: '情感曲线分析', percentage: 40, completed: false, current: false },
            { label: '乐器选择', percentage: 60, completed: false, current: false },
            { label: '提示词生成', percentage: 85, completed: false, current: false },
            { label: '结果保存', percentage: 100, completed: false, current: false }
          ]
        default:
          return []
      }
    })

    // 计算属性
    const isVisible = computed(() => props.visible && props.status !== 'completed')
    const percentage = computed(() => Math.min(100, Math.max(0, props.progress)))
    const currentStage = computed(() => stages.value[currentStageIndex.value])
    const canCancel = computed(() => props.cancellable && props.status === 'processing')
    const displayedLogs = computed(() => {
      return showFullLogs.value ? logs.value : logs.value.slice(-3)
    })

    // 时间计算
    const elapsedTime = ref('')
    const estimatedTimeRemaining = ref('')
    const startTime = ref(props.startTime || Date.now())

    // 获取分析图标
    const getAnalysisIcon = () => {
      switch (props.analysisType) {
        case 'content':
          return '📊'
        case 'fusion':
          return '🎬'
        case 'music':
          return '🎵'
        default:
          return '🤖'
      }
    }

    // 获取分析标题
    const getAnalysisTitle = () => {
      switch (props.analysisType) {
        case 'content':
          return '视频内容分析'
        case 'fusion':
          return '视频融合分析'
        case 'music':
          return '背景音乐提示词生成'
        default:
          return 'AI分析处理'
      }
    }

    // 获取当前状态文本
    const getCurrentStatusText = () => {
      switch (props.status) {
        case 'processing':
          return '正在处理'
        case 'completed':
          return '已完成'
        case 'failed':
          return '处理失败'
        case 'cancelled':
          return '已取消'
        default:
          return '准备中'
      }
    }

    // 添加日志
    const addLog = (message, type = 'info') => {
      logs.value.push({
        timestamp: Date.now(),
        message,
        type
      })

      // 限制日志数量
      if (logs.value.length > 50) {
        logs.value = logs.value.slice(-50)
      }
    }

    // 切换日志显示
    const toggleLogsVisibility = () => {
      showFullLogs.value = !showFullLogs.value
    }

    // 格式化日志时间
    const formatLogTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 更新阶段状态
    const updateStages = () => {
      const currentPercentage = percentage.value

      stages.value.forEach((stage, index) => {
        stage.completed = currentPercentage >= stage.percentage
        stage.current = false
      })

      // 设置当前阶段
      for (let i = 0; i < stages.value.length; i++) {
        if (!stages.value[i].completed) {
          stages.value[i].current = true
          currentStageIndex.value = i
          break
        }
      }

      // 如果全部完成，最后一个为当前
      if (currentPercentage >= 100) {
        const lastIndex = stages.value.length - 1
        stages.value[lastIndex].current = true
        currentStageIndex.value = lastIndex
      }
    }

    // 更新时间显示
    const updateTimeDisplay = () => {
      const now = Date.now()
      const elapsed = now - startTime.value

      // 计算已用时间
      if (elapsed > 0) {
        const seconds = Math.floor(elapsed / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        elapsedTime.value = minutes > 0
          ? `${minutes}分${remainingSeconds}秒`
          : `${remainingSeconds}秒`
      }

      // 估算剩余时间
      if (percentage.value > 5 && percentage.value < 95) {
        const estimatedTotal = (elapsed / percentage.value) * 100
        const remaining = estimatedTotal - elapsed

        if (remaining > 0) {
          const seconds = Math.floor(remaining / 1000)
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          estimatedTimeRemaining.value = minutes > 0
            ? `约${minutes}分${remainingSeconds}秒`
            : `约${remainingSeconds}秒`
        } else {
          estimatedTimeRemaining.value = '即将完成'
        }
      }
    }

    // 监听进度变化
    watch(() => props.progress, (newProgress) => {
      updateStages()

      // 添加阶段性日志
      const stageIndex = Math.floor(newProgress / 20)
      const stageMessages = [
        '开始处理...',
        '正在分析视频内容...',
        '正在生成分析报告...',
        '即将完成...',
        '处理完成！'
      ]

      if (stageIndex < stageMessages.length && newProgress > 0) {
        addLog(stageMessages[stageIndex], 'info')
      }
    })

    // 监听状态变化
    watch(() => props.status, (newStatus) => {
      if (newStatus === 'completed') {
        addLog('分析任务完成', 'success')
        emit('complete')
      } else if (newStatus === 'failed') {
        addLog('分析任务失败', 'error')
        emit('failed')
      } else if (newStatus === 'cancelled') {
        addLog('分析任务已取消', 'warning')
      }
    })

    // 启动定时器
    onMounted(() => {
      addLog('开始AI分析任务', 'info')
      timer.value = setInterval(updateTimeDisplay, 1000)
      updateStages()
    })

    // 清理定时器
    onUnmounted(() => {
      if (timer.value) {
        clearInterval(timer.value)
      }
    })

    return {
      stages,
      currentStage,
      isVisible,
      percentage,
      canCancel,
      displayedLogs,
      showFullLogs,
      elapsedTime,
      estimatedTimeRemaining,
      getAnalysisIcon,
      getAnalysisTitle,
      getCurrentStatusText,
      toggleLogsVisibility,
      formatLogTime
    }
  }
}
</script>

<style scoped>
.ai-analysis-progress {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 24px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.progress-container {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 24px;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.percentage {
  font-size: 16px;
  font-weight: 600;
  color: #007bff;
}

.progress-bar-container {
  margin-bottom: 16px;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-pulse {
  position: absolute;
  top: -2px;
  width: 12px;
  height: 12px;
  background-color: #007bff;
  border-radius: 50%;
  border: 2px solid white;
  transform: translateX(-50%);
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 123, 255, 0.8);
  }
}

.progress-timeline {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding: 0 8px;
}

.timeline-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e9ecef;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
}

.timeline-stage.completed .stage-dot {
  background-color: #28a745;
  border-color: #28a745;
}

.timeline-stage.current .stage-dot {
  background-color: #007bff;
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}

.stage-label {
  font-size: 12px;
  color: #666;
  text-align: center;
  line-height: 1.2;
}

.timeline-stage.completed .stage-label {
  color: #28a745;
  font-weight: 500;
}

.timeline-stage.current .stage-label {
  color: #007bff;
  font-weight: 600;
}

.progress-details {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.progress-logs {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.logs-toggle {
  background: none;
  border: none;
  color: #007bff;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.logs-toggle:hover {
  background-color: #e9ecef;
}

.logs-container {
  max-height: 120px;
  overflow-y: auto;
  transition: max-height 0.3s ease;
}

.logs-container.expanded {
  max-height: 300px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f3f4;
  font-size: 12px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.info {
  border-left: 3px solid #007bff;
}

.log-entry.success {
  border-left: 3px solid #28a745;
  color: #155724;
}

.log-entry.error {
  border-left: 3px solid #dc3545;
  color: #721c24;
}

.log-entry.warning {
  border-left: 3px solid #ffc107;
  color: #856404;
}

.log-time {
  color: #6c757d;
  white-space: nowrap;
}

.log-message {
  flex: 1;
  color: #333;
}

.progress-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.cancel-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-analysis-progress {
    width: 95%;
    padding: 16px;
  }

  .progress-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .analysis-title {
    justify-content: center;
  }

  .progress-timeline {
    flex-wrap: wrap;
    gap: 8px;
  }

  .timeline-stage {
    min-width: 60px;
  }

  .stage-label {
    font-size: 10px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>