# Frontend Development Guide

前端Vue.js开发指南，处理前端任务时请仔细阅读本指南。

## Tech Stack Details
- **Framework**: Vue.js 3.3+
- **Build Tool**: Vite 4.4+
- **Language**: JavaScript (ES2022)
- **Package Manager**: cnpm (required)
- **HTTP Client**: Axios 1.4+
- **WebSocket**: Socket.IO Client 4.8+
- **Testing**: Vitest + Playwright

## Project Structure
```
frontend/
├── src/
│   ├── main.js            # 应用入口
│   ├── App.vue           # 根组件
│   ├── components/       # Vue组件
│   │   ├── FileUploader.vue    # 文件上传组件
│   │   ├── ProgressBar.vue     # 进度条组件
│   │   └── CategorySelector.vue # 分类选择组件
│   ├── composables/      # Composition API函数
│   │   ├── useFileUpload.js    # 文件上传逻辑
│   │   └── useWebSocket.js     # WebSocket管理
│   ├── utils/           # 工具函数
│   │   ├── constants.js        # 常量定义
│   │   └── validators.js       # 验证工具
│   └── styles/          # 样式文件
├── public/              # 静态资源
├── tests/               # 测试文件
├── vite.config.js      # Vite配置
└── package.json
```

## Core Requirements
- Port: 3005 (fixed)
- Mobile-first responsive H5 design
- Real-time upload progress tracking
- File validation: mp4/avi, max 300MB, max 3 files
- Category selection: 个人视频 or 景区视频

## Vue.js Development Standards

### Component Development Pattern
```javascript
// Reference: src/components/FileUploader.vue
<template>
  <div class="file-uploader">
    <!-- Mobile-first responsive design -->
    <input
      type="file"
      multiple
      accept=".mp4,.avi"
      @change="handleFileChange"
      ref="fileInput"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'

const { uploadFiles, validateFiles } = useFileUpload()
const fileInput = ref(null)

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (validateFiles(files)) {
    uploadFiles(files)
  }
}
</script>
```

### Composables Pattern
```javascript
// Reference: src/composables/useFileUpload.js
import { ref } from 'vue'
import axios from 'axios'

export function useFileUpload() {
  const uploadProgress = ref(0)
  const isUploading = ref(false)
  const error = ref(null)

  const uploadFiles = async (files) => {
    // Implementation details
  }

  const validateFiles = (files) => {
    // File validation logic
  }

  return {
    uploadProgress,
    isUploading,
    error,
    uploadFiles,
    validateFiles
  }
}
```

## Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8005
VITE_WS_URL=ws://localhost:8005
VITE_MAX_FILE_SIZE=314572800
VITE_ALLOWED_FILE_TYPES=mp4,avi
```

## Common Development Tasks
```bash
# Install dependencies
cnpm install

# Start development server
npm run dev         # Port 3005

# Build for production
npm run build

# Run tests
npm run test              # Unit tests with Vitest
npm run test:e2e          # E2E tests with Playwright
npm run test:ui           # Visual test runner
```

## UI/UX Development Principles
- Mobile-first responsive design
- Touch-friendly interface elements
- Clear visual feedback for all actions
- Progressive disclosure of information
- Accessible design patterns

## WebSocket Integration
```javascript
// Reference: src/composables/useWebSocket.js
import { io } from 'socket.io-client'

export function useWebSocket() {
  const socket = io(import.meta.env.VITE_WS_URL)

  socket.on('upload-progress', (data) => {
    // Handle progress updates
  })

  return { socket }
}
```

## State Management Strategy
- Use Composition API for local state
- Leverage composables for shared logic
- Avoid complex state management libraries
- Keep component state minimal and focused

## Testing Approach
- Unit tests for composables and utilities
- Component tests with Vue Test Utils
- E2E tests with Playwright for user flows
- Visual regression tests for UI consistency

## Performance Optimization
- Lazy load components when needed
- Optimize bundle size with dynamic imports
- Implement proper caching strategies
- Monitor and optimize runtime performance

## Mobile Development Considerations
- Test on actual mobile devices
- Implement proper touch event handling
- Consider network conditions and offline scenarios
- Optimize for battery usage and performance

## Additional Documentation
For detailed information, consult:
- `../agent_docs/api_conventions.md` - API integration standards
- `../agent_docs/file_operations.md` - File upload client implementation
- `../agent_docs/debugging_guide.md` - Frontend debugging techniques
- `../agent_docs/testing_guide.md` - Testing strategies and tools