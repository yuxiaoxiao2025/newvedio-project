<template>
  <div class="card">
    <h2 style="margin-bottom: 20px; color: #333;">上传进度</h2>

    <div v-if="files.length === 0" class="text-center" style="padding: 40px;">
      <div style="color: #999;">等待上传文件...</div>
    </div>

    <div v-else>
      <!-- 总体进度 -->
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: overallProgress + '%' }"
          ></div>
        </div>
        <div class="progress-text">
          <span>总体进度: {{ overallProgress }}%</span>
          <span>{{ completedFiles }}/{{ files.length }} 完成</span>
        </div>
      </div>

      <!-- 进度消息 -->
      <div v-if="progress.message" style="margin-top: 16px; padding: 12px; background: #E6F7FF; border-radius: 6px; color: #1890FF; font-size: 14px;">
        {{ progress.message }}
      </div>

      <!-- 单个文件进度 -->
      <div style="margin-top: 24px;">
        <h3 style="margin-bottom: 16px; color: #333;">文件详情</h3>

        <div
          v-for="(file, index) in files"
          :key="file.id || index"
          class="file-item"
          style="margin-bottom: 16px;"
        >
          <div class="file-info">
            <div class="file-name">{{ file.originalName }}</div>
            <div class="file-meta">
              {{ formatFileSize(file.fileSize) }} • {{ file.fileType?.toUpperCase() }}
              <span v-if="file.status" style="margin-left: 8px;">
                • {{ getStatusText(file.status) }}
              </span>
            </div>
          </div>

          <!-- 进度条 -->
          <div v-if="file.status === 'uploading'" class="progress-container" style="margin-top: 8px;">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: file.progress + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              <span>{{ file.progress }}%</span>
              <span v-if="file.uploadSpeed">
                {{ formatSpeed(file.uploadSpeed) }}
              </span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="file.status === 'failed'" class="error-message" style="margin-top: 8px;">
            {{ file.errorMessage || '上传失败' }}
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <button
          v-if="!isCompleted"
          class="btn btn-danger"
          @click="handleCancel"
        >
          取消上传
        </button>

        <button
          v-if="isCompleted"
          class="btn btn-success"
          @click="handleComplete"
          style="margin-left: auto;"
        >
          上传完成
        </button>
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
    // Use WebSocket for real-time progress
    const { progress, onCompleted, onError, connected } = useWebSocket(props.sessionId)

    // HTTP轮询作为备用方案
    let pollInterval = null
    const startHttpPolling = () => {
      if (pollInterval) return

      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/upload/progress/${props.sessionId}`)
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

          files.value[index] = {
            ...file,
            progress: Math.round(fileProgress),
            status: fileStatus
          }
        })
      }
    })

    // Initialize with props.files
    files.value = props.files.map(file => ({
      ...file,
      progress: file.progress || 0,
      status: file.status || 'pending',
      id: file.id || Math.random().toString(36).substr(2, 9) // 确保有唯一ID
    }))

    // 立即开始显示初始进度，确保用户能看到进度条
    if (files.value.length > 0 && progress.value.totalProgress === 0) {
      // 设置初始进度为5%，让用户看到上传开始了
      setTimeout(() => {
        progress.value.totalProgress = 5
        progress.value.message = '正在准备上传文件...'
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
        const response = await fetch(`/api/upload/cancel/${props.sessionId}`, {
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

  
    return {
      files,
      overallProgress,
      completedFiles,
      isCompleted,
      progress,
      handleCancel,
      handleComplete,
      formatFileSize,
      formatSpeed,
      getStatusText
    }
  }
}
</script>