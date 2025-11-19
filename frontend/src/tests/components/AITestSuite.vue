<template>
  <div class="ai-test-suite">
    <div class="test-header">
      <h1>🧪 AI分析功能测试套件</h1>
      <div class="test-controls">
        <button
          @click="runAllTests"
          :disabled="isRunning"
          class="btn btn-primary"
        >
          {{ isRunning ? '测试运行中...' : '运行所有测试' }}
        </button>
        <button
          @click="clearResults"
          class="btn btn-secondary"
        >
          清除结果
        </button>
        <button
          @click="exportResults"
          :disabled="testResults.length === 0"
          class="btn btn-outline"
        >
          导出结果
        </button>
      </div>
    </div>

    <!-- 测试进度 -->
    <div v-if="isRunning" class="test-progress">
      <div class="progress-header">
        <span>正在运行: {{ currentTest?.name || '准备中...' }}</span>
        <span>{{ completedTests }}/{{ totalTests }}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: (completedTests / totalTests * 100) + '%' }"
        ></div>
      </div>
    </div>

    <!-- 测试分类 -->
    <div class="test-categories">
      <div
        v-for="category in testCategories"
        :key="category.id"
        class="test-category"
        :class="{ 'active': selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        <div class="category-icon">{{ category.icon }}</div>
        <div class="category-info">
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
          <div class="category-stats">
            <span class="stat">
              总计: {{ category.tests.length }}
            </span>
            <span class="stat success">
              通过: {{ getCategoryPassedCount(category) }}
            </span>
            <span class="stat error">
              失败: {{ getCategoryFailedCount(category) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试结果 -->
    <div class="test-results">
      <div class="results-header">
        <h2>测试结果</h2>
        <div class="results-summary">
          <span class="summary-item total">总计: {{ testResults.length }}</span>
          <span class="summary-item success">通过: {{ passedCount }}</span>
          <span class="summary-item error">失败: {{ failedCount }}</span>
          <span class="summary-item">成功率: {{ successRate }}%</span>
        </div>
      </div>

      <div class="test-items">
        <div
          v-for="result in filteredResults"
          :key="result.id"
          class="test-item"
          :class="result.status"
        >
          <div class="test-item-header">
            <div class="test-info">
              <span class="test-name">{{ result.name }}</span>
              <span class="test-category">{{ getCategoryName(result.category) }}</span>
            </div>
            <div class="test-status">
              <span class="status-indicator" :class="result.status"></span>
              <span class="status-text">{{ getStatusText(result.status) }}</span>
              <span v-if="result.duration" class="duration">{{ result.duration }}ms</span>
            </div>
          </div>

          <div v-if="result.error" class="test-error">
            <h4>错误信息</h4>
            <pre>{{ result.error }}</pre>
          </div>

          <div v-if="result.details" class="test-details">
            <h4>详细信息</h4>
            <div class="detail-content">
              <div
                v-for="(value, key) in result.details"
                :key="key"
                class="detail-row"
              >
                <span class="detail-key">{{ key }}:</span>
                <span class="detail-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>

          <div v-if="result.assertions" class="test-assertions">
            <h4>断言结果</h4>
            <div
              v-for="(assertion, index) in result.assertions"
              :key="index"
              class="assertion"
              :class="{ 'failed': !assertion.passed }"
            >
              <span class="assertion-status">{{ assertion.passed ? '✓' : '✗' }}</span>
              <span class="assertion-text">{{ assertion.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAIAnalysis } from '../../composables/useAIAnalysis'
import { analysisStorage } from '../../utils/analysisStorage'
import { testFunctions } from '../utils/testImplementations.js'

// 响应式状态
const isRunning = ref(false)
const currentTest = ref(null)
const completedTests = ref(0)
const totalTests = ref(0)
const selectedCategory = ref('all')
const testResults = ref([])

// 使用AI分析功能
const { resetAnalysis, getAnalysisHistory, exportResults: exportAnalysisResults } = useAIAnalysis()

// 测试分类
const testCategories = ref([
  {
    id: 'unit',
    name: '单元测试',
    icon: '🔬',
    description: '测试单个组件和功能模块',
    tests: []
  },
  {
    id: 'integration',
    name: '集成测试',
    icon: '🔗',
    description: '测试组件间的协作和数据流',
    tests: []
  },
  {
    id: 'e2e',
    name: '端到端测试',
    icon: '🎯',
    description: '完整用户流程测试',
    tests: []
  },
  {
    id: 'performance',
    name: '性能测试',
    icon: '⚡',
    description: '响应时间和资源使用测试',
    tests: []
  },
  {
    id: 'compatibility',
    name: '兼容性测试',
    icon: '🌐',
    description: '不同视频类型和场景测试',
    tests: []
  }
])

// 测试定义 - 使用实际的测试函数
const allTests = ref([
  // 单元测试
  {
    id: 'ai-service-init',
    name: 'AI服务初始化测试',
    category: 'unit',
    fn: testFunctions.testAIServiceInit
  },
  {
    id: 'storage-service',
    name: '存储服务测试',
    category: 'unit',
    fn: testFunctions.testStorageService
  },
  {
    id: 'data-validation',
    name: '数据结构验证测试',
    category: 'unit',
    fn: testFunctions.testDataValidation
  },

  // 集成测试
  {
    id: 'upload-analysis-flow',
    name: '上传-分析流程集成测试',
    category: 'integration',
    fn: testFunctions.testUploadAnalysisFlow
  },
  {
    id: 'progress-indicator',
    name: '进度指示器集成测试',
    category: 'integration',
    fn: testFunctions.testProgressIndicator
  },
  {
    id: 'result-display',
    name: '分析结果显示集成测试',
    category: 'integration',
    fn: testFunctions.testResultDisplay
  },

  // 端到端测试
  {
    id: 'complete-content-analysis',
    name: '完整内容分析流程测试',
    category: 'e2e',
    fn: testFunctions.testCompleteContentAnalysis
  },
  {
    id: 'complete-fusion-analysis',
    name: '完整融合分析流程测试',
    category: 'e2e',
    fn: testFunctions.testCompleteFusionAnalysis
  },

  // 性能测试
  {
    id: 'analysis-response-time',
    name: '分析响应时间测试',
    category: 'performance',
    fn: testFunctions.testAnalysisResponseTime
  },
  {
    id: 'memory-usage',
    name: '内存使用测试',
    category: 'performance',
    fn: testFunctions.testMemoryUsage
  },
  {
    id: 'concurrent-analysis',
    name: '并发分析测试',
    category: 'performance',
    fn: testFunctions.testConcurrentAnalysis
  },

  // 兼容性测试
  {
    id: 'video-formats',
    name: '不同视频格式测试',
    category: 'compatibility',
    fn: testFunctions.testVideoFormats
  },
  {
    id: 'video-durations',
    name: '不同视频时长测试',
    category: 'compatibility',
    fn: testFunctions.testVideoDurations
  },
  {
    id: 'error-handling',
    name: '错误处理测试',
    category: 'compatibility',
    fn: testFunctions.testErrorHandling
  }
])

// 计算属性
const filteredResults = computed(() => {
  if (selectedCategory.value === 'all') {
    return testResults.value
  }
  return testResults.value.filter(result => result.category === selectedCategory.value)
})

const passedCount = computed(() => testResults.value.filter(r => r.status === 'passed').length)
const failedCount = computed(() => testResults.value.filter(r => r.status === 'failed').length)
const successRate = computed(() => {
  if (testResults.value.length === 0) return 0
  return Math.round((passedCount.value / testResults.value.length) * 100)
})

// 初始化测试分类
const initializeTestCategories = () => {
  testCategories.value.forEach(category => {
    category.tests = allTests.value.filter(test => test.category === category.id)
  })
  totalTests.value = allTests.value.length
}

// 运行所有测试
const runAllTests = async () => {
  if (isRunning.value) return

  isRunning.value = true
  completedTests.value = 0
  testResults.value = []

  for (const test of allTests.value) {
    currentTest.value = test
    await runSingleTest(test)
    completedTests.value++

    // 添加延迟以避免过快的测试执行
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  isRunning.value = false
  currentTest.value = null
}

// 运行单个测试
const runSingleTest = async (test) => {
  const startTime = performance.now()

  try {
    const result = await test.fn()
    const endTime = performance.now()

    testResults.value.push({
      id: test.id,
      name: test.name,
      category: test.category,
      status: result.passed ? 'passed' : 'failed',
      duration: Math.round(endTime - startTime),
      error: result.error || null,
      details: result.details || null,
      assertions: result.assertions || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const endTime = performance.now()

    testResults.value.push({
      id: test.id,
      name: test.name,
      category: test.category,
      status: 'failed',
      duration: Math.round(endTime - startTime),
      error: error.message,
      details: null,
      assertions: null,
      timestamp: new Date().toISOString()
    })
  }
}

// 清除结果
const clearResults = () => {
  testResults.value = []
  completedTests.value = 0
}

// 导出结果
const exportResults = () => {
  const exportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.value.length,
      passed: passedCount.value,
      failed: failedCount.value,
      successRate: successRate.value
    },
    results: testResults.value
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ai-test-results-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 辅助方法
const getCategoryPassedCount = (category) => {
  return testResults.value.filter(r =>
    r.category === category.id && r.status === 'passed'
  ).length
}

const getCategoryFailedCount = (category) => {
  return testResults.value.filter(r =>
    r.category === category.id && r.status === 'failed'
  ).length
}

const getCategoryName = (categoryId) => {
  const category = testCategories.value.find(c => c.id === categoryId)
  return category ? category.name : categoryId
}

const getStatusText = (status) => {
  const statusMap = {
    'passed': '通过',
    'failed': '失败',
    'skipped': '跳过',
    'pending': '待执行'
  }
  return statusMap[status] || status
}

const formatValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// 挂载时初始化
onMounted(() => {
  initializeTestCategories()
})

// 导出方法供模板使用
defineExpose({
  runAllTests,
  clearResults,
  exportResults,
  testResults,
  isRunning,
  passedCount,
  failedCount,
  successRate
})
</script>

<style scoped>
.ai-test-suite {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.test-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.test-controls {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
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

.test-progress {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 30px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
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
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
  transition: width 0.3s ease;
}

.test-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.test-category {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-category:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.test-category.active {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.category-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.category-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.category-info p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.category-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 12px;
  color: #666;
}

.stat.success {
  color: #28a745;
}

.stat.error {
  color: #dc3545;
}

.test-results {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.results-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.results-summary {
  display: flex;
  gap: 16px;
}

.summary-item {
  font-size: 14px;
  font-weight: 500;
}

.summary-item.total {
  color: #666;
}

.summary-item.success {
  color: #28a745;
}

.summary-item.error {
  color: #dc3545;
}

.test-items {
  padding: 20px;
}

.test-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.test-item.passed {
  border-left: 4px solid #28a745;
}

.test-item.failed {
  border-left: 4px solid #dc3545;
}

.test-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fafbfc;
}

.test-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.test-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.test-category {
  font-size: 12px;
  color: #666;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.passed {
  background-color: #28a745;
}

.status-indicator.failed {
  background-color: #dc3545;
}

.status-text {
  font-weight: 500;
}

.duration {
  font-size: 12px;
  color: #666;
  background-color: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
}

.test-error,
.test-details,
.test-assertions {
  padding: 16px;
  border-top: 1px solid #e9ecef;
}

.test-error h4,
.test-details h4,
.test-assertions h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.test-error pre {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  margin: 0;
}

.detail-content {
  display: grid;
  gap: 8px;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: start;
}

.detail-key {
  font-weight: 500;
  color: #333;
  font-size: 12px;
}

.detail-value {
  color: #666;
  font-size: 12px;
  word-break: break-all;
}

.assertion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.assertion:not(.failed) {
  background-color: #d4edda;
  color: #155724;
}

.assertion.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.assertion-status {
  font-weight: bold;
  font-size: 14px;
}

.assertion-text {
  font-size: 13px;
}

@media (max-width: 768px) {
  .ai-test-suite {
    padding: 16px;
  }

  .test-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .test-categories {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .test-item-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>