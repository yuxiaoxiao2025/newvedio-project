/**
 * AI分析功能测试运行器
 * 可以在Node.js环境中运行测试
 */

import { testFunctions } from './utils/testImplementations.js'

/**
 * 测试运行器类
 */
class TestRunner {
  constructor() {
    this.results = []
    this.startTime = null
    this.endTime = null
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行AI分析功能测试套件')
    console.log('=' .repeat(50))

    this.startTime = Date.now()
    this.results = []

    const allTests = [
      // 单元测试
      { id: 'ai-service-init', name: 'AI服务初始化测试', fn: testFunctions.testAIServiceInit },
      { id: 'storage-service', name: '存储服务测试', fn: testFunctions.testStorageService },
      { id: 'data-validation', name: '数据结构验证测试', fn: testFunctions.testDataValidation },

      // 集成测试
      { id: 'upload-analysis-flow', name: '上传-分析流程集成测试', fn: testFunctions.testUploadAnalysisFlow },
      { id: 'progress-indicator', name: '进度指示器集成测试', fn: testFunctions.testProgressIndicator },
      { id: 'result-display', name: '分析结果显示集成测试', fn: testFunctions.testResultDisplay },

      // 端到端测试
      { id: 'complete-content-analysis', name: '完整内容分析流程测试', fn: testFunctions.testCompleteContentAnalysis },
      { id: 'complete-fusion-analysis', name: '完整融合分析流程测试', fn: testFunctions.testCompleteFusionAnalysis },

      // 性能测试
      { id: 'analysis-response-time', name: '分析响应时间测试', fn: testFunctions.testAnalysisResponseTime },
      { id: 'memory-usage', name: '内存使用测试', fn: testFunctions.testMemoryUsage },
      { id: 'concurrent-analysis', name: '并发分析测试', fn: testFunctions.testConcurrentAnalysis },

      // 兼容性测试
      { id: 'video-formats', name: '不同视频格式测试', fn: testFunctions.testVideoFormats },
      { id: 'video-durations', name: '不同视频时长测试', fn: testFunctions.testVideoDurations },
      { id: 'error-handling', name: '错误处理测试', fn: testFunctions.testErrorHandling }
    ]

    for (const test of allTests) {
      await this.runSingleTest(test)
    }

    this.endTime = Date.now()
    this.printSummary()
  }

  /**
   * 运行单个测试
   */
  async runSingleTest(test) {
    console.log(`\n📋 运行测试: ${test.name}`)
    console.log('-'.repeat(40))

    try {
      const startTime = Date.now()
      const result = await test.fn()
      const endTime = Date.now()

      const testResult = {
        id: test.id,
        name: test.name,
        passed: result.passed,
        duration: endTime - startTime,
        error: result.error || null,
        details: result.details || null,
        assertions: result.assertions || []
      }

      this.results.push(testResult)

      if (testResult.passed) {
        console.log(`✅ 测试通过 (${testResult.duration}ms)`)
        if (testResult.details) {
          this.printDetails(testResult.details)
        }
      } else {
        console.log(`❌ 测试失败 (${testResult.duration}ms)`)
        if (testResult.error) {
          console.log(`   错误: ${testResult.error}`)
        }
      }

      if (testResult.assertions && testResult.assertions.length > 0) {
        this.printAssertions(testResult.assertions)
      }

    } catch (error) {
      console.log(`💥 测试异常: ${error.message}`)

      this.results.push({
        id: test.id,
        name: test.name,
        passed: false,
        duration: 0,
        error: error.message,
        details: null,
        assertions: []
      })
    }
  }

  /**
   * 打印测试详情
   */
  printDetails(details) {
    Object.entries(details).forEach(([key, value]) => {
      if (typeof value === 'object') {
        console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`)
      } else {
        console.log(`   ${key}: ${value}`)
      }
    })
  }

  /**
   * 打印断言结果
   */
  printAssertions(assertions) {
    console.log(`   断言结果 (${assertions.length}个):`)
    assertions.forEach((assertion, index) => {
      const status = assertion.passed ? '✓' : '✗'
      console.log(`   ${status} ${assertion.description}`)
    })
  }

  /**
   * 打印测试总结
   */
  printSummary() {
    const totalDuration = this.endTime - this.startTime
    const passedCount = this.results.filter(r => r.passed).length
    const failedCount = this.results.filter(r => !r.passed).length
    const successRate = ((passedCount / this.results.length) * 100).toFixed(1)

    console.log('\n' + '='.repeat(50))
    console.log('📊 测试总结')
    console.log('='.repeat(50))
    console.log(`总测试数: ${this.results.length}`)
    console.log(`通过: ${passedCount}`)
    console.log(`失败: ${failedCount}`)
    console.log(`成功率: ${successRate}%`)
    console.log(`总耗时: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}秒)`)

    if (failedCount > 0) {
      console.log('\n❌ 失败的测试:')
      this.results.filter(r => !r.passed).forEach(test => {
        console.log(`   - ${test.name}: ${test.error || '未知错误'}`)
      })
    }

    // 按类别统计
    const categories = {
      unit: { name: '单元测试', total: 0, passed: 0 },
      integration: { name: '集成测试', total: 0, passed: 0 },
      e2e: { name: '端到端测试', total: 0, passed: 0 },
      performance: { name: '性能测试', total: 0, passed: 0 },
      compatibility: { name: '兼容性测试', total: 0, passed: 0 }
    }

    // 这里简化处理，实际应该从测试定义中获取类别信息
    this.results.forEach(result => {
      if (result.id.includes('init') || result.id.includes('storage') || result.id.includes('validation')) {
        categories.unit.total++
        if (result.passed) categories.unit.passed++
      } else if (result.id.includes('flow') || result.id.includes('progress') || result.id.includes('display')) {
        categories.integration.total++
        if (result.passed) categories.integration.passed++
      } else if (result.id.includes('content') || result.id.includes('fusion')) {
        categories.e2e.total++
        if (result.passed) categories.e2e.passed++
      } else if (result.id.includes('response') || result.id.includes('memory') || result.id.includes('concurrent')) {
        categories.performance.total++
        if (result.passed) categories.performance.passed++
      } else {
        categories.compatibility.total++
        if (result.passed) categories.compatibility.passed++
      }
    })

    console.log('\n📈 分类统计:')
    Object.values(categories).forEach(category => {
      if (category.total > 0) {
        const rate = ((category.passed / category.total) * 100).toFixed(1)
        console.log(`   ${category.name}: ${category.passed}/${category.total} (${rate}%)`)
      }
    })

    console.log('\n🎯 建议:')
    if (successRate === '100.0') {
      console.log('   所有测试通过！AI分析功能已准备就绪。')
    } else if (parseFloat(successRate) >= 80) {
      console.log('   大部分测试通过，建议修复失败的测试后发布。')
    } else {
      console.log('   测试失败率较高，建议优先修复核心功能问题。')
    }
  }

  /**
   * 导出测试结果
   */
  exportResults() {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        successRate: ((this.results.filter(r => r.passed).length / this.results.length) * 100).toFixed(1),
        duration: this.endTime - this.startTime
      },
      results: this.results
    }

    return exportData
  }
}

/**
 * 主函数 - 在Node.js环境中运行
 */
async function main() {
  const runner = new TestRunner()

  try {
    await runner.runAllTests()

    // 保存测试结果
    const results = runner.exportResults()

    if (typeof process !== 'undefined' && process !== null) {
      // 在Node.js环境中保存到文件
      const fs = await import('fs')
      await fs.promises.writeFile(
        './test-results.json',
        JSON.stringify(results, null, 2)
      )
      console.log('\n💾 测试结果已保存到 test-results.json')
    }

  } catch (error) {
    console.error('💥 测试运行器异常:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { TestRunner, main }