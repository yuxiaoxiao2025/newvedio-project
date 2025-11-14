<template>
  <div class="error-message fade-in">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">
          {{ getErrorTitle(error.code) }}
        </div>
        <div>{{ error.message }}</div>
        <div v-if="error.solution" style="margin-top: 8px; font-size: 13px;">
          解决方案: {{ error.solution }}
        </div>
      </div>
      <button
        @click="$emit('close')"
        style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; padding: 4px;"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    error: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup() {
    const getErrorTitle = (code) => {
      const titleMap = {
        'INVALID_FILE_FORMAT': '文件格式错误',
        'FILE_TOO_LARGE': '文件过大',
        'TOO_MANY_FILES': '文件数量过多',
        'UPLOAD_ERROR': '上传错误',
        'VALIDATION_ERROR': '验证失败',
        'SESSION_CREATION_FAILED': '会话创建失败',
        'NETWORK_ERROR': '网络错误'
      }
      return titleMap[code] || '错误'
    }

    return {
      getErrorTitle
    }
  }
}
</script>