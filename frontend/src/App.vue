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

            <!-- AI分析选项 -->
            <div v-if="uploadedFilesData.length > 0" class="analysis-options">
              <h3 style="color: #333; margin-bottom: 16px; font-size: 18px;">
                🤖 AI智能分析
              </h3>
              <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                选择您想要的AI分析类型，获取专业的视频处理建议
              </p>

              <div class="analysis-buttons">
                <button
                  @click="startAIAnalysis('content')"
                  :disabled="isAnalyzing"
                  class="btn btn-primary analysis-btn"
                  style="margin-right: 12px; margin-bottom: 8px;"
                >
                  <span class="btn-icon">📊</span>
                  {{ isAnalyzing && analysisType === 'content' ? '分析中...' : '内容分析' }}
                </button>

                <button
                  v-if="uploadedFilesData.length >= 2"
                  @click="startAIAnalysis('fusion')"
                  :disabled="isAnalyzing"
                  class="btn btn-secondary analysis-btn"
                  style="margin-right: 12px; margin-bottom: 8px;"
                >
                  <span class="btn-icon">🎬</span>
                  {{ isAnalyzing && analysisType === 'fusion' ? '分析中...' : '融合建议' }}
                </button>

                <button
                  @click="handleSkipAnalysis"
                  :disabled="isAnalyzing"
                  class="btn btn-success"
                  style="margin-bottom: 8px;"
                >
                  跳过分析
                </button>
              </div>

              <!-- AI分析进度指示器 -->
              <AIAnalysisProgress
                v-if="isAnalyzing"
                :analysis-type="analysisType"
                :progress="analysisProgress"
                :status="analysisError ? 'failed' : 'processing'"
                :processing-info="analysisError || ''"
                :start-time="analysisStartTime"
                @cancel="handleAnalysisCancel"
              />
            </div>

            <!-- 如果没有文件数据或跳过分析 -->
            <div v-else>
              <button @click="handleUploadComplete" class="btn btn-success">
                上传完成
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI分析结果展示 -->
      <div v-if="currentStep === 'analysis'" class="fade-in">
        <div class="card">
          <div class="analysis-header">
            <h2 style="color: #333; margin-bottom: 16px;">
              {{ getAnalysisResultTitle() }}
            </h2>
            <button @click="handleBackToUpload" class="btn btn-outline">
              ← 返回
            </button>
          </div>

          <!-- 分析结果 -->
          <div class="analysis-result">
            <ContentAnalysisView
              v-if="analysisResult && analysisResult.type === 'content'"
              :analysis="analysisResult.contentAnalysis"
            />

            <FusionAnalysisView
              v-else-if="analysisResult && analysisResult.type === 'fusion'"
              :analysis="analysisResult.fusionAnalysis"
            />

            <MusicPromptView
              v-if="analysisResult && analysisResult.musicPrompt"
              :prompt="analysisResult.musicPrompt"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="analysis-actions">
            <button
              v-if="uploadedFilesData.length >= 2 && analysisResult && analysisResult.type === 'fusion'"
              @click="generateMusicFromFusion"
              :disabled="isGeneratingMusic"
              class="btn btn-primary"
              style="margin-right: 12px;"
            >
              {{ isGeneratingMusic ? '生成中...' : '生成背景音乐提示词' }}
            </button>

            <button @click="handleAnalysisComplete" class="btn btn-success">
              完成分析
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
import ContentAnalysisView from './components/ContentAnalysisView.vue'
import FusionAnalysisView from './components/FusionAnalysisView.vue'
import MusicPromptView from './components/MusicPromptView.vue'
import AIAnalysisProgress from './components/AIAnalysisProgress.vue'
import { useAIAnalysis } from './composables/useAIAnalysis'

export default {
  name: 'App',
  components: {
    FileUploader,
    CategoryDialog,
    ProgressBar,
    ErrorMessage,
    ContentAnalysisView,
    FusionAnalysisView,
    MusicPromptView,
    AIAnalysisProgress
  },
  setup() {
    // 应用状态
    const currentStep = ref('selection') // selection, uploading, completed, analysis, finished
    const showCategoryDialog = ref(false)
    const selectedFiles = ref([])
    const sessionId = ref('')
    const uploadFiles = ref([])
    const completedFiles = ref(0)
    const currentError = ref(null)

    // AI分析相关状态
    const uploadedFilesData = ref([])
    const analysisType = ref('')
    const isGeneratingMusic = ref(false)
    const analysisStartTime = ref(null)

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8005'

    // 使用AI分析composable
    const {
      isAnalyzing,
      analysisProgress,
      analysisResult,
      formattedResult,
      error: analysisError,
      analyzeVideoContent,
      analyzeVideoFusion,
      analyzeUploadedFiles,
      generateMusicPrompt,
      resetAnalysis
    } = useAIAnalysis()

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
        const response = await fetch(`${API_BASE}/api/upload/session`, {
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

          // 立即初始化上传文件数据，确保进度条组件有数据可显示
          uploadFiles.value = selectedFiles.value.map((file, index) => ({
            id: `file-${index}-${Date.now()}`,
            originalName: file.name,
            fileSize: file.size,
            fileType: file.name.toLowerCase().split('.').pop(),
            progress: 0,
            status: 'queued'
          }))

          console.log('开始上传文件，进度条组件应该已显示', {
            sessionId: sessionId.value,
            filesCount: selectedFiles.value.length,
            step: currentStep.value
          })

          // 短暂等待确保进度条组件渲染完成
          await new Promise(resolve => setTimeout(resolve, 500))

          // 开始上传
          const formData = new FormData()
          selectedFiles.value.forEach(file => {
            formData.append('files', file)
          })
          formData.append('sessionId', data.sessionId)
          formData.append('category', category)

          const uploadResponse = await fetch(`${API_BASE}/api/upload/batch`, {
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
              console.log('所有文件上传成功，等待进度条确认完成')

              // 保存上传成功的文件数据，用于AI分析
              uploadedFilesData.value = uploadData.files.map(file => ({
                id: file.id,
                name: file.originalName,
                path: file.filePath || `/uploads/${category}/${file.filename}`,
                size: file.fileSize,
                category: category,
                sessionId: sessionId.value
              }))

              // 延迟跳转，确保用户能看到完成状态
              setTimeout(() => {
                if (currentStep.value === 'uploading') {
                  currentStep.value = 'completed'
                }
              }, 2000)
            } else {
              // 如果有失败文件，稍后跳转到完成页面显示结果
              setTimeout(() => {
                currentStep.value = 'completed'
                // 保存成功上传的文件数据
                uploadedFilesData.value = uploadData.files
                  .filter(file => file.status === 'completed')
                  .map(file => ({
                    id: file.id,
                    name: file.originalName,
                    path: file.filePath || `/uploads/${category}/${file.filename}`,
                    size: file.fileSize,
                    category: category,
                    sessionId: sessionId.value
                  }))
              }, 1000)
            }
          } else {
            throw new Error(uploadData.message || '上传失败')
          }
        } else {
          throw new Error(data.message || '创建会话失败')
        }
      } catch (error) {
        console.error('上传过程中发生错误:', error)
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
      currentStep.value = 'completed'
    }

    const handleSkipAnalysis = () => {
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

    // AI分析相关方法
    const startAIAnalysis = async (type) => {
      try {
        analysisType.value = type
        analysisStartTime.value = Date.now()
        resetAnalysis()

        if (type === 'content') {
          const [file] = uploadedFilesData.value
          await analyzeVideoContent({ path: file.path, category: file.category, sessionId: sessionId.value })
        } else if (type === 'fusion') {
          const [file1, file2] = uploadedFilesData.value
          await analyzeVideoFusion({ path: file1.path, category: file1.category, sessionId: sessionId.value }, { path: file2.path, category: file2.category, sessionId: sessionId.value })
        }

        // 分析完成后跳转到结果展示页面
        currentStep.value = 'analysis'
      } catch (error) {
        currentError.value = {
          code: 'AI_ANALYSIS_ERROR',
          message: error.message || 'AI分析失败',
          solution: '请检查网络连接后重试，或联系技术支持'
        }
      }
    }

    const generateMusicFromFusion = async () => {
      try {
        isGeneratingMusic.value = true

        if (formattedResult.value?.fusionAnalysis?.plan) {
          const musicPrompt = await generateMusicPrompt(formattedResult.value.fusionAnalysis.plan)

          // 更新分析结果，添加音乐提示词
          if (analysisResult.value) {
            analysisResult.value.musicPrompt = musicPrompt
          }
        }
      } catch (error) {
        currentError.value = {
          code: 'MUSIC_GENERATION_ERROR',
          message: error.message || '背景音乐提示词生成失败',
          solution: '请稍后重试或检查网络连接'
        }
      } finally {
        isGeneratingMusic.value = false
      }
    }

    const handleBackToUpload = () => {
      currentStep.value = 'completed'
    }

    const handleAnalysisCancel = () => {
      resetAnalysis()
      analysisType.value = ''
      analysisStartTime.value = null
      currentStep.value = 'completed'
    }

    const handleAnalysisComplete = () => {
      currentStep.value = 'finished'
    }

    const getAnalysisTypeText = () => {
      switch (analysisType.value) {
        case 'content':
          return '视频内容分析'
        case 'fusion':
          return '视频融合分析'
        default:
          return 'AI分析'
      }
    }

    const getAnalysisResultTitle = () => {
      switch (analysisType.value) {
        case 'content':
          return '📊 视频内容分析报告'
        case 'fusion':
          return '🎬 视频融合建议方案'
        default:
          return '🤖 AI分析结果'
      }
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

      // 重置AI分析相关状态
      uploadedFilesData.value = []
      analysisType.value = ''
      isGeneratingMusic.value = false
      resetAnalysis()
    }

    // 组件挂载时的初始化
    onMounted(() => {
      console.log('视频上传应用已启动')
    })

    return {
      // 基础状态
      currentStep,
      showCategoryDialog,
      selectedFiles,
      sessionId,
      uploadFiles,
      completedFiles,
      currentError,

      // AI分析相关状态
      uploadedFilesData,
      analysisType,
      isAnalyzing,
      analysisProgress,
      analysisResult: formattedResult,
      analysisError,
      isGeneratingMusic,
      analysisStartTime,

      // 基础方法
      handleFilesSelected,
      handleCategorySelected,
      handleCategoryCancel,
      handleUploadComplete,
      handleUploadCancel,
      handleErrorClose,
      handleReset,

      // AI分析方法
      startAIAnalysis,
      generateMusicFromFusion,
      handleBackToUpload,
      handleAnalysisComplete,
      handleAnalysisCancel,
      getAnalysisTypeText,
      getAnalysisResultTitle,
      handleSkipAnalysis
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* AI分析选项样式 */
.analysis-options {
  margin: 24px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.analysis-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.analysis-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn-icon {
  margin-right: 6px;
  font-size: 16px;
}

/* 分析进度样式 */
.analysis-progress {
  margin-top: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #52C41A 0%, #73D13D 100%);
  transition: width 0.3s ease;
  border-radius: 3px;
}

/* 分析结果展示样式 */
.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.analysis-result {
  margin-bottom: 32px;
}

.analysis-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analysis-buttons {
    flex-direction: column;
    align-items: center;
  }

  .analysis-btn {
    width: 100%;
    max-width: 200px;
  }

  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .analysis-actions {
    flex-direction: column;
  }
}

/* 按钮样式补充 */
.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8005'