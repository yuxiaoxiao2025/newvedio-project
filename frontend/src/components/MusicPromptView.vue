<template>
  <div class="music-prompt-view">
    <div class="section-header">
      <h2>🎵 背景音乐生成提示词</h2>
      <div class="prompt-actions">
        <button @click="copyToClipboard" class="copy-btn">
          📋 复制提示词
        </button>
        <button @click="downloadPrompt" class="download-btn">
          💾 下载文件
        </button>
      </div>
    </div>

    <div class="prompt-content">
      <div class="prompt-text">
        <pre>{{ prompt }}</pre>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="usage-tips">
      <h4>💡 使用说明</h4>
      <ul>
        <li>将此提示词复制到AI音乐生成工具中</li>
        <li>可根据实际需要调整音乐风格和时长参数</li>
        <li>建议先生成30秒片段试听，确认效果后再生成完整版本</li>
      </ul>
    </div>

    <!-- 复制成功提示 -->
    <div v-if="copySuccess" class="copy-success">
      ✅ 提示词已复制到剪贴板
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'MusicPromptView',

  props: {
    prompt: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const copySuccess = ref(false)

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(props.prompt)
        copySuccess.value = true

        setTimeout(() => {
          copySuccess.value = false
        }, 3000)
      } catch (err) {
        console.error('复制失败:', err)
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = props.prompt
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 3000)
      }
    }

    const downloadPrompt = () => {
      const blob = new Blob([props.prompt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `music_prompt_${Date.now()}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    }

    return {
      copySuccess,
      copyToClipboard,
      downloadPrompt
    }
  }
}
</script>

<style scoped>
.music-prompt-view {
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  color: #111827;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt-actions {
  display: flex;
  gap: 1rem;
}

.copy-btn, .download-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-btn:hover, .download-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.prompt-content {
  margin-bottom: 2rem;
}

.prompt-text {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
}

.prompt-text pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Consolas, monospace;
  line-height: 1.6;
  color: #78350f;
  margin: 0;
  font-size: 0.95rem;
}

.usage-tips {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1.5rem;
}

.usage-tips h4 {
  margin: 0 0 1rem 0;
  color: #0c4a6e;
  font-size: 1.1rem;
}

.usage-tips ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #0c4a6e;
}

.usage-tips li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.copy-success {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-prompt-view {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .prompt-actions {
    justify-content: flex-start;
  }

  .prompt-text {
    padding: 1rem;
  }

  .prompt-text pre {
    font-size: 0.9rem;
  }

  .copy-success {
    right: 10px;
    left: 10px;
    top: 10px;
  }
}
</style>