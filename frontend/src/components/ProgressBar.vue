<template>
  <div class="card">
    <h2 style="margin-bottom: 20px; color: #333;">上传进度</h2>

    <!-- 始终显示进度，即使没有文件信息 -->
    <div class="progress-section">
      <!-- 总体进度 -->
      <div class="progress-container">
        <div class="progress-bar" :class="{ 'progress-complete': overallProgress === 100 }">
          <div
            class="progress-fill"
            :class="{
              'progress-active': overallProgress > 0 && overallProgress < 100,
              'progress-complete': overallProgress === 100
            }"
            :style="{ width: overallProgress + '%' }"
          >
            <div class="progress-shine"></div>
          </div>
          <!-- 进度百分比显示在进度条内部 -->
          <div v-if="overallProgress > 0" class="progress-percentage">
            {{ overallProgress }}%
          </div>
        </div>
        <div class="progress-text">
          <span class="progress-label">
            <i class="icon" :class="getProgressIcon()"></i>
            {{ getProgressLabel() }}
          </span>
          <span class="progress-stats">
            {{ completedFiles }}/{{ files.length }} 完成
          </span>
        </div>
      </div>

      <!-- 进度消息 -->
      <div v-if="progress.message" class="progress-message" :class="getMessageClass()">
        <i class="message-icon" :class="getMessageIcon()"></i>
        {{ progress.message }}
      </div>

      <!-- 上传速度和剩余时间 -->
      <div v-if="showDetails && progress.currentFile" class="progress-details">
        <div class="detail-item">
          <span class="detail-label">当前文件:</span>
          <span class="detail-value">{{ progress.currentFile.originalName }}</span>
        </div>
        <div v-if="progress.currentFile.uploadSpeed" class="detail-item">
          <span class="detail-label">上传速度:</span>
          <span class="detail-value">{{ formatSpeed(progress.currentFile.uploadSpeed) }}</span>
        </div>
        <div v-if="estimatedTimeRemaining > 0" class="detail-item">
          <span class="detail-label">预计剩余:</span>
          <span class="detail-value">{{ formatTime(estimatedTimeRemaining) }}</span>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="files.length > 0" class="files-section">
        <h3 style="margin-bottom: 16px; color: #333;">文件详情</h3>

        <div
          v-for="(file, index) in files"
          :key="file.id || index"
          class="file-item"
          :class="{
            'file-uploading': file.status === 'uploading',
            'file-completed': file.status === 'completed',
            'file-failed': file.status === 'failed'
          }"
        >
          <div class="file-info">
            <div class="file-name">
              <i class="file-icon" :class="getFileIcon(file)"></i>
              {{ file.originalName }}
            </div>
            <div class="file-meta">
              {{ formatFileSize(file.fileSize) }} • {{ file.fileType?.toUpperCase() }}
              <span class="file-status" :class="`status-${file.status}`">
                {{ getStatusText(file.status) }}
              </span>
            </div>
          </div>

          <!-- 文件进度条 -->
          <div v-if="file.status === 'uploading'" class="file-progress">
            <div class="mini-progress-bar">
              <div
                class="mini-progress-fill"
                :style="{ width: file.progress + '%' }"
              ></div>
            </div>
            <div class="mini-progress-text">
              <span>{{ file.progress }}%</span>
              <span v-if="file.uploadSpeed" class="upload-speed">
                {{ formatSpeed(file.uploadSpeed) }}
              </span>
            </div>
          </div>

          <!-- 完成图标 -->
          <div v-if="file.status === 'completed'" class="completion-indicator">
            <i class="icon-check">✓</i>
          </div>

          <!-- 错误信息 -->
          <div v-if="file.status === 'failed'" class="error-message">
            <i class="icon-error">✕</i>
            {{ file.errorMessage || '上传失败' }}
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          v-if="!isCompleted && !isFailed"
          class="btn btn-danger"
          @click="handleCancel"
        >
          <i class="btn-icon">✕</i>
          取消上传
        </button>

        <button
          v-if="isCompleted"
          class="btn btn-success btn-complete"
          @click="handleComplete"
        >
          <i class="btn-icon">✓</i>
          上传完成
        </button>

        <!-- 显示/隐藏详情切换 -->
        <button
          v-if="!isCompleted && !isFailed"
          class="btn btn-outline"
          @click="showDetails = !showDetails"
        >
          <i class="btn-icon">{{ showDetails ? '▲' : '▼' }}</i>
          {{ showDetails ? '隐藏详情' : '显示详情' }}
        </button>
      </div>
    </div>

    <!-- 空状态或初始化状态 -->
    <div v-if="files.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <div class="empty-text">{{ getEmptyStateText() }}</div>
      <div v-if="progress.message" class="empty-message">
        {{ progress.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useWebSocket } from '../composables/useWebSocket'

export default {
  name: 'ProgressBar',
  props: {
    sessionId: {
      type: String,
      required: true
    },
    files: {
      type: Array,
      default: () => []
    }
  },
  emits: ['upload-complete', 'upload-cancel'],
  setup(props, { emit }) {
    // UI状态
    const showDetails = ref(false)

    // Use WebSocket for real-time progress
    const { progress, onCompleted, onError, connected, ensureConnection } = useWebSocket(props.sessionId)

    // HTTP轮询作为备用方案
    let pollInterval = null
    const startHttpPolling = () => {
      if (pollInterval) return

      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE}/api/upload/progress/${props.sessionId}`)
          if (response.ok) {
            const data = await response.json()

            // 只有在WebSocket未连接时才使用HTTP数据
            if (!connected.value) {
              progress.value.totalProgress = data.totalProgress
              progress.value.completedFiles = data.completedFiles
              progress.value.failedFiles = data.failedFiles
              progress.value.overallStatus = data.overallStatus
              progress.value.message = `已上传 ${data.completedFiles}/${data.totalFiles} 个文件`

              // 更新文件状态
              if (data.files && data.files.length > 0) {
                data.files.forEach((uploadedFile, index) => {
                  const existingFileIndex = files.value.findIndex(f =>
                    f.originalName === uploadedFile.originalName
                  )
                  if (existingFileIndex >= 0) {
                    files.value[existingFileIndex] = {
                      ...files.value[existingFileIndex],
                      progress: uploadedFile.progress || 100,
                      status: uploadedFile.status || 'completed'
                    }
                  }
                })
              }
            }

            // 如果上传完成，停止轮询
            if (data.overallStatus === 'completed' || data.overallStatus === 'partial') {
              stopHttpPolling()
              if (!connected.value) {
                progress.value.totalProgress = 100
                emit('upload-complete')
              }
            }
          }
        } catch (error) {
          console.warn('HTTP polling failed:', error)
        }
      }, 1000) // 每秒轮询一次
    }

    const stopHttpPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    // Local files state with real-time updates
    const files = ref([])

    // Watch for WebSocket progress updates
    onCompleted.value = (data) => {
      console.log('Upload completed:', data)
      progress.value.totalProgress = 100

      // Update all files to completed status
      files.value.forEach((file, index) => {
        files.value[index] = {
          ...file,
          progress: 100,
          status: 'completed'
        }
      })

      emit('upload-complete')
    }

    onError.value = (error) => {
      console.error('Upload error:', error)
    }

    // Update files when progress changes
    watch(() => progress.value.currentFile, (currentFile) => {
      if (currentFile) {
        const existingFileIndex = files.value.findIndex(f => f.id === currentFile.id)
        if (existingFileIndex >= 0) {
          files.value[existingFileIndex] = { ...files.value[existingFileIndex], ...currentFile }
        } else {
          files.value.push(currentFile)
        }
      }
    })

    // Watch for overall progress updates
    watch(() => progress.value.totalProgress, (newProgress) => {
      // 始终显示进度，即使没有WebSocket更新
      if (files.value.length > 0) {
        const progressPerFile = newProgress / files.value.length
        files.value.forEach((file, index) => {
          // 更新文件状态和进度
          const fileProgress = Math.min(progressPerFile * (index + 1), 100)
          let fileStatus = file.status

          // 根据进度更新状态
          if (fileProgress > 0 && fileProgress < 100 && (fileStatus === 'queued' || fileStatus === 'pending')) {
            fileStatus = 'uploading'
          } else if (fileProgress >= 100 && fileStatus !== 'completed' && fileStatus !== 'failed') {
            fileStatus = 'completed'
          }

          // 使用Vue的响应式更新
          files.value[index] = {
            ...file,
            progress: Math.round(fileProgress),
            status: fileStatus
          }
        })
      }
    }, { immediate: true }) // 立即执行一次

    // Initialize with props.files
    files.value = props.files.map(file => ({
      ...file,
      progress: file.progress || 0,
      status: file.status || 'pending',
      id: file.id || Math.random().toString(36).substr(2, 9) // 确保有唯一ID
    }))

    // 立即开始显示初始进度，确保用户能看到进度条
    if (files.value.length > 0) {
      // 设置初始进度为5%，让用户看到上传开始了
      setTimeout(() => {
        if (progress.value.totalProgress === 0) {
          progress.value.totalProgress = 5
          progress.value.message = '正在准备上传文件...'
          progress.value.overallStatus = 'uploading'
        }
      }, 100)
    }

    // 启动HTTP轮询作为备用方案
    setTimeout(() => {
      if (!connected.value) {
        startHttpPolling()
      }
    }, 2000) // 2秒后如果WebSocket还没连接，启动HTTP轮询

    // 组件卸载时清理
    onUnmounted(() => {
      stopHttpPolling()
    })

    // 计算属性
    const overallProgress = computed(() => {
      return progress.value.totalProgress || 0
    })

    const completedFiles = computed(() => {
      return progress.value.completedFiles || 0
    })

    const isCompleted = computed(() => {
      return progress.value.overallStatus === 'completed'
    })

    // 处理取消
    const handleCancel = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/upload/cancel/${props.sessionId}`, {
          method: 'POST'
        })

        if (response.ok) {
          emit('upload-cancel')
        }
      } catch (error) {
        console.error('取消上传失败:', error)
      }
    }

    // 处理完成
    const handleComplete = () => {
      emit('upload-complete')
    }

    // 工具函数
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatSpeed = (bytesPerSecond) => {
      const k = 1024
      const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
      const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
      return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getStatusText = (status) => {
      const statusMap = {
        'pending': '等待中',
        'uploading': '上传中',
        'completed': '已完成',
        'failed': '失败',
        'cancelled': '已取消',
        'queued': '队列中'
      }
      return statusMap[status] || status
    }

    // 新增的UI辅助函数
    const getProgressIcon = () => {
      if (overallProgress.value === 100) return 'icon-complete'
      if (overallProgress.value > 0) return 'icon-uploading'
      return 'icon-waiting'
    }

    const getProgressLabel = () => {
      if (overallProgress.value === 100) return '上传完成'
      if (overallProgress.value > 0) return '正在上传'
      return '准备中'
    }

    const getMessageClass = () => {
      if (overallProgress.value === 100) return 'message-success'
      if (progress.value.message?.includes('失败') || progress.value.message?.includes('错误')) return 'message-error'
      return 'message-info'
    }

    const getMessageIcon = () => {
      if (overallProgress.value === 100) return 'icon-success'
      if (progress.value.message?.includes('失败') || progress.value.message?.includes('错误')) return 'icon-error'
      return 'icon-info'
    }

    const getFileIcon = (file) => {
      if (file.status === 'completed') return 'icon-file-complete'
      if (file.status === 'failed') return 'icon-file-error'
      if (file.status === 'uploading') return 'icon-file-uploading'
      return 'icon-file-pending'
    }

    const getEmptyStateText = () => {
      if (connected.value) return '等待上传文件...'
      return '正在连接服务器...'
    }

    const formatTime = (seconds) => {
      if (seconds < 60) return `${seconds}秒`
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds}秒`
    }

    const estimatedTimeRemaining = computed(() => {
      const cf = progress.value.currentFile
      if (!cf || !cf.uploadSpeed || !cf.progress) return 0
      const meta = files.value.find(f => f.originalName === cf.originalName)
      const size = meta?.fileSize
      if (!size || cf.uploadSpeed <= 0) return 0
      const remainingBytes = Math.round(size * (100 - cf.progress) / 100)
      const seconds = Math.round(remainingBytes / cf.uploadSpeed)
      return seconds > 0 ? seconds : 0
    })

    const isFailed = computed(() => {
      return progress.value.overallStatus === 'failed' ||
             files.value.some(file => file.status === 'failed')
    })

    // 确保WebSocket连接在上传开始前建立
    const initializeConnection = async () => {
      if (props.sessionId) {
        try {
          await ensureConnection()
        } catch (error) {
          console.warn('Failed to establish WebSocket connection:', error)
        }
      }
    }

    // 组件挂载时初始化连接
    initializeConnection()

    return {
      // UI状态
      showDetails,
      // 数据
      files,
      overallProgress,
      completedFiles,
      isCompleted,
      isFailed,
      progress,
      connected,
      // 方法
      handleCancel,
      handleComplete,
      formatFileSize,
      formatSpeed,
      formatTime,
      estimatedTimeRemaining,
      getStatusText,
      // 新增的UI辅助函数
      getProgressIcon,
      getProgressLabel,
      getMessageClass,
      getMessageIcon,
      getFileIcon,
      getEmptyStateText
    }
  }
}
</script>

<style scoped>
/* 主要样式定义 */
.progress-section {
  width: 100%;
}

.progress-container {
  margin-bottom: 20px;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
}

.progress-bar.progress-complete {
  background-color: #f6ffed;
  box-shadow: inset 0 2px 4px rgba(82, 196, 26, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  position: relative;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.4);
  min-width: 2px;
}

.progress-fill.progress-active {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 25%, #69c0ff 50%, #40a9ff 75%, #1890ff 100%);
  background-size: 200% 100%;
  animation: progressActive 2s linear infinite;
}

.progress-fill.progress-complete {
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #95de64 100%);
  box-shadow: 0 2px 12px rgba(82, 196, 26, 0.4);
  animation: progressComplete 0.6s ease-out;
}

@keyframes progressActive {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes progressComplete {
  0% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.1);
  }
  100% {
    transform: scaleY(1);
  }
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-top: 12px;
  font-weight: 500;
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-stats {
  color: #999;
  font-size: 13px;
}

.progress-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

.message-info {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.message-success {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.message-error {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.progress-details {
  margin-top: 16px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.files-section {
  margin-top: 24px;
}

.file-item {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.file-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-uploading {
  border-color: #e6f7ff;
  background-color: #f0f8ff;
}

.file-completed {
  border-color: #b7eb8f;
  background-color: #f6ffed;
}

.file-failed {
  border-color: #ffccc7;
  background-color: #fff2f0;
}

.file-info {
  margin-bottom: 12px;
}

.file-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 16px;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
}

.file-meta {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.file-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #f0f0f0;
  color: #666;
}

.status-uploading {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.file-progress {
  margin-top: 12px;
}

.mini-progress-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  transition: width 0.4s ease;
  border-radius: 3px;
}

.mini-progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.upload-speed {
  color: #1890ff;
}

.completion-indicator {
  margin-top: 12px;
  text-align: center;
}

.icon-check {
  color: #52c41a;
  font-size: 24px;
  font-weight: bold;
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #fff2f0;
  border-radius: 6px;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-error {
  color: #ff4d4f;
  font-weight: bold;
}

.action-buttons {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: #666;
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-message {
  color: #999;
  font-size: 14px;
}

/* 图标样式 */
.icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  text-align: center;
}

.icon-waiting::before { content: '⏳'; }
.icon-uploading::before { content: '📤'; }
.icon-complete::before { content: '✅'; }
.icon-success::before { content: '✅'; }
.icon-info::before { content: 'ℹ️'; }
.icon-error::before { content: '❌'; }

.icon-file-pending::before { content: '📄'; }
.icon-file-uploading::before { content: '📤'; }
.icon-file-complete::before { content: '✅'; }
.icon-file-error::before { content: '❌'; }

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
}

.btn:active {
  transform: translateY(1px);
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background-color: #ff7875;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-success:hover {
  background-color: #73d13d;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.btn-complete {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  animation: successPulse 1s ease-in-out;
}

@keyframes successPulse {
  0% {
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
  }
  50% {
    box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
  }
  100% {
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
  }
}

.btn-outline {
  background-color: transparent;
  color: #1890ff;
  border: 1px solid #1890ff;
}

.btn-outline:hover {
  background-color: #1890ff;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-container {
    margin-bottom: 16px;
  }

  .progress-bar {
    height: 14px;
  }

  .progress-text {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font-size: 13px;
  }

  .progress-label {
    order: -1;
  }

  .file-item {
    padding: 12px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 12px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 13px;
    min-height: 36px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .btn {
    width: 100%;
    justify-content: center;
  }
}

/* 确保进度条在所有情况下都可见 */
.progress-fill[style*="width: 0%"] {
  min-width: 2px;
  background-color: #e6f7ff;
}

/* 完成状态特殊处理 */
.progress-bar.progress-complete .progress-percentage {
  color: #52c41a;
}

/* 错误状态样式 */
.progress-message.message-error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .progress-bar {
    border: 2px solid #000;
  }

  .progress-fill {
    border: 1px solid #fff;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .progress-shine,
  .btn,
  .file-item,
  .progress-message {
    animation: none;
    transition: none;
  }
}

.file-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-info {
  margin-bottom: 12px;
}

.file-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 16px;
  word-break: break-all;
}

.file-meta {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.error-message {
  color: #ff4d4f;
  font-size: 13px;
  padding: 8px 12px;
  background-color: #fff2f0;
  border-radius: 6px;
  border: 1px solid #ffccc7;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(1px);
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background-color: #ff7875;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-success:hover {
  background-color: #73d13d;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-container {
    margin-bottom: 16px;
  }

  .progress-bar {
    height: 10px;
  }

  .file-item {
    padding: 12px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 12px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}

/* 确保进度条在所有情况下都可见 */
.progress-fill[style*="width: 0%"] {
  min-width: 2px;
  background-color: #e6f7ff;
}
</style>
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8005'