<template>
  <div class="card">
    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{ dragover: isDragOver, active: files.length > 0 }"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".mp4,.avi"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />

      <div v-if="files.length === 0" class="upload-content">
        <div class="upload-icon">📹</div>
        <div class="upload-text">点击选择文件或拖拽文件到此处</div>
        <div class="upload-hint">支持 MP4、AVI 格式，最大 300MB，最多 3 个文件</div>
      </div>

      <div v-else class="upload-content">
        <div class="upload-icon">✅</div>
        <div class="upload-text">已选择 {{ files.length }} 个文件</div>
        <div class="upload-hint">点击可重新选择文件</div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="file-list">
      <h3 style="margin-bottom: 12px; color: #333;">选择的文件</h3>

      <div
        v-for="(file, index) in files"
        :key="index"
        class="file-item"
      >
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            {{ formatFileSize(file.size) }} • {{ getFileType(file.name) }}
          </div>
        </div>
        <button
          class="file-remove"
          @click="removeFile(index)"
          title="删除文件"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div v-if="files.length > 0" class="mt-20">
      <button
        class="btn btn-primary btn-block"
        @click="handleUpload"
        :disabled="!isValidFiles || loading"
      >
        {{ loading ? '处理中...' : '开始上传' }}
      </button>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'FileUploader',
  emits: ['files-selected', 'upload-complete'],
  setup(props, { emit }) {
    // 状态
    const fileInput = ref(null)
    const files = ref([])
    const isDragOver = ref(false)
    const loading = ref(false)
    const errorMessage = ref('')

    // 计算属性
    const isValidFiles = computed(() => {
      if (files.value.length === 0) return false
      if (files.value.length > 3) return false

      // 检查文件大小
      for (const file of files.value) {
        if (file.size > 300 * 1024 * 1024) { // 300MB
          return false
        }
      }

      // 检查文件类型一致性
      const extensions = files.value.map(file =>
        file.name.toLowerCase().split('.').pop()
      )
      const uniqueExtensions = new Set(extensions)
      if (uniqueExtensions.size > 1) {
        return false
      }

      return true
    })

    // 触发文件选择
    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    // 处理文件选择
    const handleFileSelect = (event) => {
      const selectedFiles = Array.from(event.target.files)
      processFiles(selectedFiles)
    }

    // 处理拖拽
    const handleDragOver = (event) => {
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      isDragOver.value = false
    }

    const handleDrop = (event) => {
      isDragOver.value = false
      const droppedFiles = Array.from(event.dataTransfer.files)
      processFiles(droppedFiles)
    }

    // 处理文件
    const processFiles = (newFiles) => {
      errorMessage.value = ''

      // 过滤有效文件
      const validFiles = newFiles.filter(file => {
        const extension = file.name.toLowerCase().split('.').pop()
        const isValidExtension = ['mp4', 'avi'].includes(extension)
        const isValidSize = file.size <= 300 * 1024 * 1024 // 300MB

        if (!isValidExtension) {
          errorMessage.value = `不支持的文件格式: ${file.name}`
          return false
        }

        if (!isValidSize) {
          errorMessage.value = `文件过大: ${file.name} (最大300MB)`
          return false
        }

        return true
      })

      if (validFiles.length === 0) {
        return
      }

      // 检查总数限制
      const totalFiles = files.value.length + validFiles.length
      if (totalFiles > 3) {
        errorMessage.value = `最多只能上传3个文件 (当前: ${files.value.length}, 新增: ${validFiles.length})`
        return
      }

      // 检查类型一致性
      const currentExtensions = files.value.map(file =>
        file.name.toLowerCase().split('.').pop()
      )
      const newExtensions = validFiles.map(file =>
        file.name.toLowerCase().split('.').pop()
      )
      const allExtensions = [...currentExtensions, ...newExtensions]
      const uniqueExtensions = new Set(allExtensions)

      if (uniqueExtensions.size > 1) {
        errorMessage.value = '所有文件必须是相同格式 (MP4 或 AVI)'
        return
      }

      // 添加文件
      files.value = [...files.value, ...validFiles]

      // 清空文件输入
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    // 删除文件
    const removeFile = (index) => {
      files.value.splice(index, 1)
      errorMessage.value = ''
    }

    // 处理上传
    const handleUpload = async () => {
      if (!isValidFiles.value || loading.value) {
        return
      }

      loading.value = true
      errorMessage.value = ''

      try {
        const validationData = {
          files: files.value.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type || ''
          }))
        }

        const response = await fetch('/api/upload/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validationData)
        })

        // 兼容代理/网络错误返回text/plain空响应
        let result = null
        try {
          result = await response.json()
        } catch (_) {
          result = null
        }

        if (!response.ok) {
          throw new Error('服务器不可用或网络故障，请稍后重试')
        }

        if (!result?.valid) {
          throw new Error('文件验证失败，请检查格式与大小限制')
        }

        emit('files-selected', files.value)
      } catch (error) {
        errorMessage.value = error.message || '上传失败，请重试'
      } finally {
        loading.value = false
      }
    }

    // 工具函数
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'

      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileType = (filename) => {
      const extension = filename.toLowerCase().split('.').pop()
      return extension.toUpperCase()
    }

    return {
      fileInput,
      files,
      isDragOver,
      loading,
      errorMessage,
      isValidFiles,
      triggerFileInput,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      removeFile,
      handleUpload,
      formatFileSize,
      getFileType
    }
  }
}
</script>

<style scoped>
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.file-item {
  transition: all 0.3s ease;
}

.file-item:hover {
  background-color: #F5F5F5;
}

.btn-block {
  margin-top: 16px;
}
</style>