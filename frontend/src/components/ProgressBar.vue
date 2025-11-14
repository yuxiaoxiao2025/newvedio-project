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
import { ref, computed, watch } from 'vue'
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
    const { progress, onCompleted, onError } = useWebSocket(props.sessionId)

    // Local files state with real-time updates
    const files = ref([])

    // Watch for WebSocket progress updates
    onCompleted.value = (data) => {
      console.log('Upload completed:', data)
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

    // Initialize with props.files
    files.value = props.files.map(file => ({
      ...file,
      progress: 0,
      status: 'pending'
    }))

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