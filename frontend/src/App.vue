<template>
  <div id="app">
    <div class="container">
      <!-- 头部 -->
      <div class="header">
        <h1>视频文件上传</h1>
        <p>支持 MP4/AVI 格式，最多上传 3 个文件</p>
      </div>

      <!-- 主应用内容 -->
      <div v-if="currentStep === 'selection'" class="fade-in">
        <FileUploader
          @files-selected="handleFilesSelected"
          @upload-complete="handleUploadComplete"
        />
      </div>

      <!-- 分类选择对话框 -->
      <CategoryDialog
        v-if="showCategoryDialog"
        :files="selectedFiles"
        @category-selected="handleCategorySelected"
        @cancel="handleCategoryCancel"
      />

      <!-- 上传进度 -->
      <div v-if="currentStep === 'uploading'" class="fade-in">
        <ProgressBar
          :session-id="sessionId"
          :files="uploadFiles"
          @upload-complete="handleUploadComplete"
          @upload-cancel="handleUploadCancel"
        />
      </div>

      <!-- 上传完成 -->
      <div v-if="currentStep === 'completed'" class="fade-in">
        <div class="card">
          <div class="text-center">
            <div style="font-size: 48px; color: #52C41A; margin-bottom: 16px;">✅</div>
            <h2 style="color: #333; margin-bottom: 16px;">上传完成</h2>
            <p style="color: #666; margin-bottom: 24px;">
              成功上传 {{ completedFiles }} 个文件
            </p>
            <button @click="handleUploadComplete" class="btn btn-success">
              上传完成
            </button>
          </div>
        </div>
      </div>

      <!-- 完成页面 -->
      <div v-if="currentStep === 'finished'" class="fade-in">
        <div class="card">
          <div class="text-center">
            <h2 style="color: #333; margin-bottom: 16px;">下回分解</h2>
            <p style="color: #666; margin-bottom: 24px;">
              感谢使用视频上传功能
            </p>
            <button @click="handleReset" class="btn btn-primary">
              重新上传
            </button>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <ErrorMessage
        v-if="currentError"
        :error="currentError"
        @close="handleErrorClose"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import FileUploader from './components/FileUploader.vue'
import CategoryDialog from './components/CategoryDialog.vue'
import ProgressBar from './components/ProgressBar.vue'
import ErrorMessage from './components/ErrorMessage.vue'

export default {
  name: 'App',
  components: {
    FileUploader,
    CategoryDialog,
    ProgressBar,
    ErrorMessage
  },
  setup() {
    // 应用状态
    const currentStep = ref('selection') // selection, uploading, completed, finished
    const showCategoryDialog = ref(false)
    const selectedFiles = ref([])
    const sessionId = ref('')
    const uploadFiles = ref([])
    const completedFiles = ref(0)
    const currentError = ref(null)

    // 处理文件选择
    const handleFilesSelected = (files) => {
      selectedFiles.value = files
      showCategoryDialog.value = true
    }

    // 处理分类选择
    const handleCategorySelected = async (category) => {
      showCategoryDialog.value = false
      currentStep.value = 'uploading'

      try {
        // 创建上传会话
        const response = await fetch('/api/upload/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category,
            expectedFiles: selectedFiles.value.length
          })
        })

        const data = await response.json()

        if (response.ok) {
          sessionId.value = data.sessionId

          // 初始化上传文件数据
          uploadFiles.value = selectedFiles.value.map((file, index) => ({
            id: index,
            originalName: file.name,
            fileSize: file.size,
            fileType: file.name.toLowerCase().split('.').pop(),
            progress: 0,
            status: 'queued'
          }))

          // 等待足够时间确保WebSocket连接建立
          await new Promise(resolve => setTimeout(resolve, 1000))

          // 开始上传
          const formData = new FormData()
          selectedFiles.value.forEach(file => {
            formData.append('files', file)
          })
          formData.append('sessionId', data.sessionId)
          formData.append('category', category)

          const uploadResponse = await fetch('/api/upload/batch', {
            method: 'POST',
            body: formData
          })

          const uploadData = await uploadResponse.json()

          if (uploadResponse.ok) {
            // 更新文件状态
            uploadFiles.value = uploadData.files || uploadFiles.value
            completedFiles.value = uploadData.summary?.completedFiles || selectedFiles.value.length

            // 检查是否所有文件都上传成功
            if (uploadData.summary?.failedFiles === 0) {
              // 不要立即跳转，让用户看到进度条完成
              // 进度条组件会在WebSocket收到完成信号后自动触发跳转
              console.log('所有文件上传成功，等待进度条确认完成')
            } else {
              // 如果有失败文件，稍后跳转到完成页面显示结果
              setTimeout(() => {
                currentStep.value = 'completed'
              }, 1000)
            }
          } else {
            throw new Error(uploadData.message || '上传失败')
          }
        } else {
          throw new Error(data.message || '创建会话失败')
        }
      } catch (error) {
        currentError.value = {
          code: 'UPLOAD_ERROR',
          message: error.message,
          solution: '请检查网络连接后重试'
        }
        currentStep.value = 'selection'
      }
    }

    // 处理分类选择取消
    const handleCategoryCancel = () => {
      showCategoryDialog.value = false
      selectedFiles.value = []
    }

    // 处理上传完成
    const handleUploadComplete = () => {
      currentStep.value = 'finished'
    }

    // 处理上传取消
    const handleUploadCancel = () => {
      currentStep.value = 'selection'
      selectedFiles.value = []
      uploadFiles.value = []
      sessionId.value = ''
      completedFiles.value = 0
    }

    // 处理错误关闭
    const handleErrorClose = () => {
      currentError.value = null
    }

    // 重置应用状态
    const handleReset = () => {
      currentStep.value = 'selection'
      showCategoryDialog.value = false
      selectedFiles.value = []
      uploadFiles.value = []
      sessionId.value = ''
      completedFiles.value = 0
      currentError.value = null
    }

    // 组件挂载时的初始化
    onMounted(() => {
      console.log('视频上传应用已启动')
    })

    return {
      currentStep,
      showCategoryDialog,
      selectedFiles,
      sessionId,
      uploadFiles,
      completedFiles,
      currentError,
      handleFilesSelected,
      handleCategorySelected,
      handleCategoryCancel,
      handleUploadComplete,
      handleUploadCancel,
      handleErrorClose,
      handleReset
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>