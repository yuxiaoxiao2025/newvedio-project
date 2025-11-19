import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vite测试环境配置
 * 专门用于AI分析功能的测试和验证
 */
export default defineConfig({
  plugins: [vue()],

  // 测试环境服务器配置
  server: {
    port: 3006, // 避免与开发服务器冲突
    host: true,
    cors: true,
    open: '/tests/',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },

  // 预览服务器配置（用于构建后的测试）
  preview: {
    port: 3007,
    host: true
  },

  // 路径解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'src/tests'),
      '@components': resolve(__dirname, 'src/components'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },

  // 构建配置
  build: {
    // 测试环境构建优化
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tests: resolve(__dirname, 'src/tests/index.html')
      },
      output: {
        manualChunks: {
          // 将测试相关代码分离
          'test-utils': ['src/tests/utils/testDataGenerator.js'],
          'ai-analysis': ['src/composables/useAIAnalysis.js'],
          'storage': ['src/utils/analysisStorage.js']
        }
      }
    },
    // 设置较大的chunk大小警告限制，用于测试大文件
    chunkSizeWarningLimit: 1000
  },

  // 环境变量配置
  define: {
    __TEST__: 'true',
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },

  // CSS配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/test-variables.scss";`
      }
    }
  },

  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia'
    ],
    exclude: ['@tests']
  },

  // 工作目录配置
  base: './',

  // 实验性功能
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    }
  },

  // 测试特定配置
  test: {
    // 如果使用vitest，可以在这里配置
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})