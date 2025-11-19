import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vitest 测试配置
 * 提供全面的单元测试、集成测试和E2E测试环境
 */
export default defineConfig({
  plugins: [vue()],

  // 测试环境配置
  test: {
    // 全局测试文件
    setupFiles: ['./src/tests/setup.js'],
    globals: true, // 启用全局变量

    // 环境配置
    environment: 'jsdom',

    // 测试文件匹配模式
    include: [
      'src/tests/**/*.{test,spec}.{js,mjs,ts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,ts,jsx,tsx}'
    ],

    // 排除文件
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'src/tests/coverage/'
    ],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'json',
        'html',
        'lcov'
      ],

      // 包含文件
      include: [
        'src/**/*.{js,jsx,ts,tsx,vue}',
        '!src/tests/**/*',
        '!src/main.js'
      ],

      // 排除文件
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.config.*',
        'src/**/__tests__/**',
        'src/tests/**/*'
      ],

      // 覆盖率阈值
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },

      // 输出目录
      reportsDirectory: './src/tests/coverage'
    },

    // 监听模式配置
    watch: false,

    // 测试超时
    testTimeout: 10000,

    // 并发测试配置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: {
          isolate: false,
          timeout: 10000
        },
        maxThreads: 4,
        minThreads: 1
      }
    }
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

  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      '@vue/test-utils',
      'vitest',
      'jsdom'
    ]
  },

  // 定义全局常量
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __TEST__: true
  }
})