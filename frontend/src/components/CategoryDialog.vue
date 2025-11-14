<template>
  <div class="modal-overlay">
    <div class="modal-content fade-in">
      <div class="modal-header">
        <h2 class="modal-title">选择文件分类</h2>
      </div>

      <div class="modal-body">
        <p style="color: #666; margin-bottom: 20px;">
          请选择上传文件的分类，所有文件将存储到对应的目录中
        </p>

        <div class="category-selector">
          <div
            class="category-option"
            :class="{ selected: selectedCategory === 'personal' }"
            @click="selectCategory('personal')"
          >
            <div class="category-icon">👤</div>
            <div class="category-title">个人视频</div>
            <div class="category-desc">个人拍摄的视频内容</div>
          </div>

          <div
            class="category-option"
            :class="{ selected: selectedCategory === 'scenic' }"
            @click="selectCategory('scenic')"
          >
            <div class="category-icon">🏞️</div>
            <div class="category-title">景区视频</div>
            <div class="category-desc">景区相关的视频内容</div>
          </div>
        </div>

        <div v-if="files.length > 0" style="margin-top: 20px;">
          <h4 style="margin-bottom: 12px; color: #333;">待上传文件:</h4>
          <div
            v-for="(file, index) in files"
            :key="index"
            style="padding: 8px; background: #FAFAFA; border-radius: 4px; margin-bottom: 4px; font-size: 14px;"
          >
            {{ file.name }}
            <span style="color: #999; margin-left: 8px;">
              ({{ formatFileSize(file.size) }})
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleCancel">
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="handleConfirm"
          :disabled="!selectedCategory"
        >
          确认选择
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'CategoryDialog',
  props: {
    files: {
      type: Array,
      required: true
    }
  },
  emits: ['category-selected', 'cancel'],
  setup(props, { emit }) {
    const selectedCategory = ref('')

    const selectCategory = (category) => {
      selectedCategory.value = category
    }

    const handleConfirm = () => {
      if (selectedCategory.value) {
        emit('category-selected', selectedCategory.value)
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
      selectedCategory,
      selectCategory,
      handleConfirm,
      handleCancel,
      formatFileSize
    }
  }
}
</script>