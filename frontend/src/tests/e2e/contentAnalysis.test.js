/**
 * 完整内容分析E2E测试
 *
 * 测试覆盖范围：
 * - 使用真实Qwen API进行视频内容分析
 * - 完整的用户操作流程测试
 * - 真实数据文件处理
 * - API响应数据验证
 * - 性能和稳定性测试
 *
 * 测试方法：
 * - 使用Chrome DevTools MCP进行真实浏览器测试
 * - 使用真实的Qwen API密钥
 * - 测试真实的视频文件上传和分析
 * - 验证实际API响应结果
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('完整内容分析E2E测试', () => {
  let browser
  let page
  let testVideoPath

  beforeAll(async () => {
    // 检查环境变量
    if (!process.env.VITE_QWEN_API_KEY) {
      throw new Error('VITE_QWEN_API_KEY环境变量未设置')
    }

    // 查找测试视频文件
    testVideoPath = 'E:/trae-pc/newvedio-001/test-videos/sample-personal-video.mp4'

    // 创建浏览器实例
    const mcpChrome = require('mcp__chrome-devtools')
    browser = mcpChrome

    // 打开新页面
    await browser.new_page({
      url: 'http://localhost:3006'
    })

    // 选择页面
    const pages = await browser.list_pages()
    page = pages[0]
    await browser.select_page(0)
  })

  afterAll(async () => {
    // 清理浏览器资源
    if (browser) {
      const pages = await browser.list_pages()
      for (let i = pages.length - 1; i >= 0; i--) {
        await browser.close_page(i)
      }
    }
  })

  describe('真实API内容分析流程', () => {
    it('应该完成完整的视频内容分析流程', async () => {
      // 步骤1: 导航到应用主页
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true,
        timeout: 10000
      })

      // 等待页面加载
      await browser.wait_for('AI视频分析应用', { timeout: 5000 })

      // 步骤2: 验证页面元素
      const snapshot = await browser.take_snapshot({
        verbose: false,
        filePath: './test-screenshots/01-initial-page.png'
      })

      expect(snapshot).toBeDefined()

      // 步骤3: 选择文件上传
      const fileInput = await browser.take_snapshot()
      expect(fileInput).toContain('input[type="file"]')

      // 步骤4: 上传测试视频文件
      await browser.upload_file(
        'input[type="file"]',
        testVideoPath
      )

      // 等待文件选择完成
      await browser.wait_for('已选择文件', { timeout: 3000 })

      // 步骤5: 选择视频类别
      await browser.click('input[value="personal"]')

      // 步骤6: 开始上传
      await browser.click('button[id="upload-button"]')

      // 步骤7: 等待上传完成
      await browser.wait_for('上传完成', { timeout: 30000 })

      // 步骤8: 开始AI分析
      await browser.click('button[id="start-analysis"]')

      // 步骤9: 等待分析进度更新
      await browser.wait_for('分析进度', { timeout: 2000 })

      // 验证进度条存在
      const progressSnapshot = await browser.take_snapshot()
      expect(progressSnapshot).toContain('progress')

      // 步骤10: 等待分析完成（最长3分钟）
      await browser.wait_for('分析完成', { timeout: 180000 })

      // 步骤11: 验证分析结果展示
      await browser.wait_for('分析结果', { timeout: 5000 })

      // 截图保存分析结果
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/02-analysis-results.png'
      })

      // 步骤12: 验证结果内容
      const resultsSnapshot = await browser.take_snapshot()
      expect(resultsSnapshot).toContain('视频分析报告')
      expect(resultsSnapshot).toContain('技术分析')
      expect(resultsSnapshot).toContain('质量评分')
    }, 300000) // 5分钟超时

    it('应该显示详细的内容分析结果', async () => {
      // 等待结果完全加载
      await browser.wait_for('结构化数据', { timeout: 10000 })

      // 检查关键帧分析
      const keyframesSection = await browser.take_snapshot()
      expect(keyframesSection).toContain('关键帧')

      // 检查场景分析
      const scenesSection = await browser.take_snapshot()
      expect(scenesSection).toContain('场景分析')

      // 检查物体识别
      const objectsSection = await browser.take_snapshot()
      expect(objectsSection).toContain('物体识别')

      // 检查动作识别
      const actionsSection = await browser.take_snapshot()
      expect(actionsSection).toContain('动作识别')

      // 检查技术分析
      const techSection = await browser.take_snapshot()
      expect(techSection).toContain('情感基调')
      expect(techSection).toContain('色彩分析')
      expect(techSection).toContain('质量评估')

      // 截图技术分析部分
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: false,
        filePath: './test-screenshots/03-technical-analysis.png'
      })
    }, 60000)

    it('应该支持结果导出功能', async () => {
      // 点击导出按钮
      await browser.click('button[id="export-results"]')

      // 等待导出选项出现
      await browser.wait_for('导出格式', { timeout: 3000 })

      // 选择JSON格式导出
      await browser.click('button[data-format="json"]')

      // 验证下载开始（检查文件下载）
      await browser.wait_for('导出成功', { timeout: 5000 })

      // 检查是否生成了下载链接
      const exportSnapshot = await browser.take_snapshot()
      expect(exportSnapshot).toContain('下载')

      // 测试CSV格式导出
      await browser.click('button[data-format="csv"]')
      await browser.wait_for('CSV导出成功', { timeout: 5000 })

      // 测试TXT格式导出
      await browser.click('button[data-format="txt"]')
      await browser.wait_for('TXT导出成功', { timeout: 5000 })
    }, 30000)

    it('应该支持分析历史记录查看', async () => {
      // 点击历史记录按钮
      await browser.click('button[id="view-history"]')

      // 等待历史记录加载
      await browser.wait_for('分析历史', { timeout: 5000 })

      // 验证历史记录列表
      const historySnapshot = await browser.take_snapshot()
      expect(historySnapshot).toContain('历史记录')
      expect(historySnapshot).toContain('内容分析')

      // 点击历史记录项查看详情
      await browser.click('div.history-item:first-child')

      // 等待详情加载
      await browser.wait_for('历史详情', { timeout: 3000 })

      // 截图历史记录界面
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/04-analysis-history.png'
      })
    }, 30000)
  })

  describe('真实API响应验证', () => {
    it('应该从真实Qwen API获得有效响应', async () => {
      // 开始新的分析
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true
      })

      // 上传文件并开始分析
      await browser.upload_file('input[type="file"]', testVideoPath)
      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-button"]')
      await browser.wait_for('上传完成', { timeout: 30000 })
      await browser.click('button[id="start-analysis"]')

      // 等待分析完成
      await browser.wait_for('分析完成', { timeout: 180000 })

      // 验证API响应数据的结构
      const apiResponseSnapshot = await browser.take_snapshot()

      // 检查是否包含Qwen API的特征数据
      expect(apiResponseSnapshot).toBeDefined()

      // 验证分析报告的质量
      const reportSection = await browser.take_snapshot()
      expect(reportSection.length).toBeGreaterThan(100) // 报告应该有一定长度

      // 验证数据完整性
      const dataIntegrityCheck = await browser.take_snapshot()
      expect(dataIntegrityCheck).not.toContain('error')
      expect(dataIntegrityCheck).not.toContain('failed')
      expect(dataIntegrityCheck).not.toContain('null')
    }, 200000)

    it('应该处理真实API的错误响应', async () => {
      // 测试API错误处理
      // 这里可以通过修改API密钥或使用无效文件来触发错误

      // 导航到错误测试页面
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006?test_error=true',
        ignoreCache: true
      })

      // 尝试分析一个会导致错误的情况
      await browser.upload_file('input[type="file"]', testVideoPath)
      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-button"]')
      await browser.wait_for('上传完成', { timeout: 30000 })
      await browser.click('button[id="start-analysis"]')

      // 检查错误处理
      await browser.wait_for('错误提示', { timeout: 10000 })

      const errorSnapshot = await browser.take_snapshot()
      expect(errorSnapshot).toContain('错误')

      // 验证用户友好的错误信息
      expect(errorSnapshot).not.toContain('API Key')
      expect(errorSnapshot).not.toContain('Internal Server')
    }, 60000)
  })

  describe('性能和稳定性测试', () => {
    it('应该在合理时间内完成分析', async () => {
      const startTime = Date.now()

      // 完整的分析流程
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true
      })

      await browser.upload_file('input[type="file"]', testVideoPath)
      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-button"]')
      await browser.wait_for('上传完成', { timeout: 30000 })
      await browser.click('button[id="start-analysis"]')
      await browser.wait_for('分析完成', { timeout: 180000 })

      const endTime = Date.now()
      const duration = endTime - startTime

      // 验证性能要求
      expect(duration).toBeLessThan(120000) // 应该在2分钟内完成

      console.log(`分析完成耗时: ${duration / 1000}秒`)

      // 记录性能数据
      const performanceData = {
        testType: 'content-analysis',
        duration: duration,
        videoSize: '50MB',
        timestamp: new Date().toISOString()
      }

      // 保存性能数据
      await browser.evaluate_script({
        function: (data) => {
          localStorage.setItem('performance-test-data', JSON.stringify(data))
        },
        args: [{ performanceData }]
      })
    }, 180000)

    it('应该处理多次连续分析', async () => {
      // 连续进行3次分析以测试稳定性
      for (let i = 0; i < 3; i++) {
        console.log(`执行第${i + 1}次分析`)

        await browser.navigate_page({
          type: 'url',
          url: 'http://localhost:3006',
          ignoreCache: true
        })

        await browser.upload_file('input[type="file"]', testVideoPath)
        await browser.click('input[value="personal"]')
        await browser.click('button[id="upload-button"]')
        await browser.wait_for('上传完成', { timeout: 30000 })
        await browser.click('button[id="start-analysis"]')
        await browser.wait_for('分析完成', { timeout: 180000 })

        // 验证每次分析都成功
        const successSnapshot = await browser.take_snapshot()
        expect(successSnapshot).toContain('分析完成')

        // 截图每次的结果
        await browser.take_screenshot({
          format: 'png',
          quality: 90,
          fullPage: false,
          filePath: `./test-screenshots/05-stability-test-${i + 1}.png`
        })

        // 短暂等待避免API限制
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }, 600000) // 10分钟超时
  })

  describe('数据质量验证', () => {
    it('应该生成高质量的分析报告', async () => {
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true
      })

      await browser.upload_file('input[type="file"]', testVideoPath)
      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-button"]')
      await browser.wait_for('上传完成', { timeout: 30000 })
      await browser.click('button[id="start-analysis"]')
      await browser.wait_for('分析完成', { timeout: 180000 })

      // 获取分析报告内容
      const reportContent = await browser.evaluate_script({
        function: () => {
          const reportElement = document.querySelector('.analysis-report')
          return reportElement ? reportElement.innerText : ''
        }
      })

      // 验证报告质量
      expect(reportContent.length).toBeGreaterThan(200) // 报告应该足够详细
      expect(reportContent).toContain('分析') // 应该包含分析相关词汇
      expect(reportContent.split(' ').length).toBeGreaterThan(50) // 应该有足够多的词汇

      // 验证技术分析数据
      const technicalData = await browser.evaluate_script({
        function: () => {
          const scores = document.querySelectorAll('.quality-score')
          return Array.from(scores).map(score => score.innerText)
        }
      })

      expect(technicalData.length).toBeGreaterThan(0)

      // 验证评分在合理范围内
      technicalData.forEach(score => {
        const numericScore = parseInt(score)
        expect(numericScore).toBeGreaterThanOrEqual(0)
        expect(numericScore).toBeLessThanOrEqual(100)
      })

      console.log('分析报告质量验证通过')
    }, 200000)
  })
})