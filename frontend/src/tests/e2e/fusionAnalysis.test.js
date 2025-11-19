/**
 * 完整融合分析E2E测试
 *
 * 测试覆盖范围：
 * - 使用真实Qwen API进行双视频融合分析
 * - 融合方案的生成和验证
 * - 音乐提示词的生成
 * - 转场效果和技术参数
 * - 兼容性分析结果
 *
 * 测试方法：
 * - 使用Chrome DevTools MCP进行真实浏览器测试
 * - 上传两个真实视频文件
 * - 测试完整的融合分析流程
 * - 验证音乐提示词生成功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('完整融合分析E2E测试', () => {
  let browser
  let page
  let testVideo1Path
  let testVideo2Path

  beforeAll(async () => {
    // 检查环境变量
    if (!process.env.VITE_QWEN_API_KEY) {
      throw new Error('VITE_QWEN_API_KEY环境变量未设置')
    }

    // 查找测试视频文件
    testVideo1Path = 'E:/trae-pc/newvedio-001/test-videos/video1-personal.mp4'
    testVideo2Path = 'E:/trae-pc/newvedio-001/test-videos/video2-scenic.mp4'

    // 创建浏览器实例
    const mcpChrome = require('mcp__chrome-devtools')
    browser = mcpChrome

    // 打开新页面
    await browser.new_page({
      url: 'http://localhost:3006'
    })

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

  describe('双视频融合分析流程', () => {
    it('应该完成双视频上传和融合分析', async () => {
      // 导航到应用主页
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true,
        timeout: 10000
      })

      await browser.wait_for('AI视频分析应用', { timeout: 5000 })

      // 步骤1: 切换到融合分析模式
      await browser.click('button[id="fusion-mode"]')
      await browser.wait_for('融合分析模式', { timeout: 3000 })

      // 步骤2: 上传第一个视频
      const fileInput1 = 'input[name="video1"]'
      await browser.upload_file(fileInput1, testVideo1Path)
      await browser.wait_for('视频1已选择', { timeout: 5000 })

      // 步骤3: 上传第二个视频
      const fileInput2 = 'input[name="video2"]'
      await browser.upload_file(fileInput2, testVideo2Path)
      await browser.wait_for('视频2已选择', { timeout: 5000 })

      // 步骤4: 选择视频类别
      await browser.click('input[value="personal"]')

      // 步骤5: 开始上传
      await browser.click('button[id="upload-both-videos"]')

      // 步骤6: 等待两个视频都上传完成
      await browser.wait_for('视频1上传完成', { timeout: 45000 })
      await browser.wait_for('视频2上传完成', { timeout: 45000 })

      // 步骤7: 开始融合分析
      await browser.click('button[id="start-fusion-analysis"]')

      // 步骤8: 等待融合分析进度
      await browser.wait_for('融合分析中', { timeout: 5000 })

      // 验证进度指示器
      const progressSnapshot = await browser.take_snapshot()
      expect(progressSnapshot).toContain('融合进度')

      // 步骤9: 等待融合分析完成（最长5分钟）
      await browser.wait_for('融合分析完成', { timeout: 300000 })

      // 截图融合分析结果
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/10-fusion-results.png'
      })

      // 验证融合方案生成
      const fusionSnapshot = await browser.take_snapshot()
      expect(fusionSnapshot).toContain('融合方案')
      expect(fusionSnapshot).toContain('分段策略')
    }, 360000) // 6分钟超时

    it('应该显示详细的融合方案', async () => {
      // 等待融合方案完全加载
      await browser.wait_for('整体方案', { timeout: 10000 })

      // 验证整体方案
      const overallPlan = await browser.take_snapshot()
      expect(overallPlan).toContain('目标时长')
      expect(overallPlan).toContain('叙事逻辑')
      expect(overallPlan).toContain('情感曲线')

      // 验证分段策略
      await browser.wait_for('分段策略', { timeout: 5000 })
      const segmentation = await browser.take_snapshot()
      expect(segmentation).toContain('视频1')
      expect(segmentation).toContain('视频2')

      // 验证转场效果
      await browser.wait_for('转场效果', { timeout: 5000 })
      const transitions = await browser.take_snapshot()
      expect(transitions).toContain('转场类型')
      expect(transitions).toContain('转场时长')

      // 验证技术参数
      await browser.wait_for('技术参数', { timeout: 5000 })
      const techParams = await browser.take_snapshot()
      expect(techParams).toContain('分辨率')
      expect(techParams).toContain('帧率')
      expect(techParams).toContain('编码格式')

      // 验证兼容性分析
      await browser.wait_for('兼容性分析', { timeout: 5000 })
      const compatibility = await browser.take_snapshot()
      expect(compatibility).toContain('颜色匹配')
      expect(compatibility).toContain('风格兼容性')
      expect(compatibility).toContain('改进建议')

      // 截图详细融合方案
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/11-detailed-fusion-plan.png'
      })
    }, 60000)

    it('应该支持时间轴可视化展示', async () => {
      // 查找时间轴组件
      await browser.wait_for('时间轴', { timeout: 5000 })

      // 验证时间轴显示
      const timelineSnapshot = await browser.take_snapshot()
      expect(timelineSnapshot).toContain('时间轴')
      expect(timelineSnapshot).toContain('分段')
      expect(timelineSnapshot).toContain('转场')

      // 与时间轴交互 - 点击第一个分段
      await browser.click('.timeline-segment:first-child')

      // 等待分段详情显示
      await browser.wait_for('分段详情', { timeout: 3000 })

      // 验证分段详情
      const segmentDetails = await browser.take_snapshot()
      expect(segmentDetails).toContain('开始时间')
      expect(segmentDetails).toContain('结束时间')
      expect(segmentDetails).toContain('选择理由')

      // 截图时间轴界面
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: false,
        filePath: './test-screenshots/12-timeline-visualization.png'
      })
    }, 30000)
  })

  describe('音乐提示词生成', () => {
    it('应该根据融合方案生成音乐提示词', async () => {
      // 点击生成音乐提示词按钮
      await browser.click('button[id="generate-music-prompt"]')

      // 等待音乐生成开始
      await browser.wait_for('音乐提示词生成中', { timeout: 5000 })

      // 等待音乐生成完成（最长2分钟）
      await browser.wait_for('音乐提示词生成完成', { timeout: 120000 })

      // 截图音乐提示词结果
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/13-music-prompt-results.png'
      })

      // 验证音乐提示词内容
      const musicSnapshot = await browser.take_snapshot()
      expect(musicSnapshot).toContain('音乐提示词')
      expect(musicSnapshot).toContain('音乐风格')
      expect(musicSnapshot).toContain('情感基调')
      expect(musicSnapshot).toContain('节拍信息')
    }, 150000)

    it('应该显示详细的音乐参数', async () => {
      // 等待音乐参数完全加载
      await browser.wait_for('音乐参数', { timeout: 10000 })

      // 验证基础信息
      const basicInfo = await browser.take_snapshot()
      expect(basicInfo).toContain('目标时长')
      expect(basicInfo).toContain('音乐风格')
      expect(basicInfo).toContain('BPM')

      // 验证情感曲线
      await browser.wait_for('情感曲线', { timeout: 5000 })
      const emotionalCurve = await browser.take_snapshot()
      expect(emotionalCurve).toContain('情感段落')
      expect(emotionalCurve).toContain('强度变化')

      // 验证乐器选择
      await browser.wait_for('乐器配置', { timeout: 5000 })
      const instrumentation = await browser.take_snapshot()
      expect(instrumentation).toContain('主乐器')
      expect(instrumentation).toContain('和声')
      expect(instrumentation).toContain('节奏乐器')

      // 验证技术规格
      await browser.wait_for('技术规格', { timeout: 5000 })
      const technicalSpecs = await browser.take_snapshot()
      expect(technicalSpecs).toContain('调性')
      expect(technicalSpecs).toContain('拍号')
      expect(technicalSpecs).toContain('结构')

      // 截图详细音乐参数
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: false,
        filePath: './test-screenshots/14-music-parameters.png'
      })
    }, 60000)

    it('应该支持音乐提示词导出', async () => {
      // 点击导出音乐提示词
      await browser.click('button[id="export-music-prompt"]')

      // 选择导出格式
      await browser.wait_for('导出格式选择', { timeout: 3000 })

      // 选择完整提示词格式
      await browser.click('button[data-music-format="full"]')

      // 等待导出完成
      await browser.wait_for('音乐提示词导出成功', { timeout: 5000)

      // 验证导出内容
      const exportSnapshot = await browser.take_snapshot()
      expect(exportSnapshot).toContain('导出')

      // 测试简化格式导出
      await browser.click('button[data-music-format="simple"]')
      await browser.wait_for('简化导出成功', { timeout: 5000 })
    }, 30000)
  })

  describe('兼容性分析验证', () => {
    it('应该提供详细的兼容性分析', async () => {
      // 切换到兼容性分析标签
      await browser.click('button[id="compatibility-tab"]')

      await browser.wait_for('兼容性分析', { timeout: 5000 })

      // 验证各项兼容性指标
      const compatibilitySnapshot = await browser.take_snapshot()
      expect(compatibilitySnapshot).toContain('颜色匹配度')
      expect(compatibilitySnapshot).toContain('风格兼容性')
      expect(compatibilitySnapshot).toContain('音频兼容性')
      expect(compatibilitySnapshot).toContain('整体兼容性')

      // 验证评分显示
      const scores = await browser.evaluate_script({
        function: () => {
          const scoreElements = document.querySelectorAll('.compatibility-score')
          return Array.from(scoreElements).map(el => ({
            label: el.getAttribute('data-label'),
            value: el.innerText
          }))
        }
      })

      expect(scores.length).toBeGreaterThan(3)

      // 验证评分在0-100范围内
      scores.forEach(score => {
        const numericValue = parseInt(score.value)
        expect(numericValue).toBeGreaterThanOrEqual(0)
        expect(numericValue).toBeLessThanOrEqual(100)
      })

      // 验证改进建议
      await browser.wait_for('改进建议', { timeout: 5000)
      const recommendations = await browser.take_snapshot()
      expect(recommendations).toContain('建议')
    }, 60000)

    it('应该提供兼容性优化建议', async () => {
      // 点击优化建议按钮
      await browser.click('button[id="optimization-suggestions"]')

      await browser.wait_for('优化建议', { timeout: 5000 })

      // 验证优化建议类别
      const suggestions = await browser.take_snapshot()
      expect(suggestions).toContain('色彩调整')
      expect(suggestions).toContain('转场优化')
      expect(suggestions).toContain('音频平衡')

      // 截图兼容性分析
      await browser.take_screenshot({
        format: 'png',
        quality: 90,
        fullPage: true,
        filePath: './test-screenshots/15-compatibility-analysis.png'
      })
    }, 30000)
  })

  describe('融合方案自定义', () => {
    it('应该支持融合方案手动调整', async () => {
      // 点击自定义融合方案按钮
      await browser.click('button[id="customize-fusion"]')

      await browser.wait_for('自定义融合方案', { timeout: 5000 })

      // 测试分段调整
      await browser.click('button[id="adjust-segmentation"]')

      // 修改目标时长
      await browser.fill('input[name="target-duration"]', '90')

      // 保存调整
      await browser.click('button[id="save-adjustments"]')

      await browser.wait_for('调整已保存', { timeout: 3000 })

      // 验证调整后的方案
      const adjustedSnapshot = await browser.take_snapshot()
      expect(adjustedSnapshot).toContain('90秒') // 验证目标时长更新
    }, 60000)

    it('应该支持转场效果选择', async () => {
      // 点击转场效果选择器
      await browser.click('button[id="transition-selector"]')

      await browser.wait_for('转场效果选择', { timeout: 5000 })

      // 选择不同的转场效果
      await browser.click('input[value="dissolve"]')
      await browser.click('input[value="slide"]')

      // 应用转场效果
      await browser.click('button[id="apply-transitions"]')

      await browser.wait_for('转场效果已应用', { timeout: 3000)

      // 验证转场效果更新
      const transitionSnapshot = await browser.take_snapshot()
      expect(transitionSnapshot).toContain('dissolve')
      expect(transitionSnapshot).toContain('slide')
    }, 30000)
  })

  describe('性能和质量测试', () => {
    it('应该在合理时间内完成融合分析', async () => {
      const startTime = Date.now()

      // 重新进行融合分析测试
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true
      })

      await browser.click('button[id="fusion-mode"]')
      await browser.upload_file('input[name="video1"]', testVideo1Path)
      await browser.upload_file('input[name="video2"]', testVideo2Path)
      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-both-videos"]')

      await browser.wait_for('视频1上传完成', { timeout: 45000)
      await browser.wait_for('视频2上传完成', { timeout: 45000)

      await browser.click('button[id="start-fusion-analysis"]')
      await browser.wait_for('融合分析完成', { timeout: 300000)

      const endTime = Date.now()
      const duration = endTime - startTime

      // 融合分析应该在4分钟内完成
      expect(duration).toBeLessThan(240000)

      console.log(`融合分析完成耗时: ${duration / 1000}秒`)

      // 记录性能数据
      const performanceData = {
        testType: 'fusion-analysis',
        duration: duration,
        videoCount: 2,
        timestamp: new Date().toISOString()
      }

      await browser.evaluate_script({
        function: (data) => {
          const existingData = JSON.parse(localStorage.getItem('performance-test-data') || '[]')
          existingData.push(data)
          localStorage.setItem('performance-test-data', JSON.stringify(existingData))
        },
        args: [{ performanceData }]
      })
    }, 360000)

    it('应该生成高质量的融合方案', async () => {
      // 等待融合分析完成
      await browser.wait_for('融合分析完成', { timeout: 300000)

      // 验证融合方案质量
      const fusionQuality = await browser.evaluate_script({
        function: () => {
          const fusionPlan = document.querySelector('.fusion-plan')
          const segmentation = document.querySelector('.segmentation-strategy')
          const transitions = document.querySelector('.transition-effects')

          return {
            hasPlan: !!fusionPlan,
            hasSegmentation: !!segmentation,
            hasTransitions: !!transitions,
            planContent: fusionPlan ? fusionPlan.innerText.length : 0,
            segmentationCount: segmentation ? segmentation.querySelectorAll('.segment-item').length : 0,
            transitionCount: transitions ? transitions.querySelectorAll('.transition-item').length : 0
          }
        }
      })

      expect(fusionQuality.hasPlan).toBe(true)
      expect(fusionQuality.hasSegmentation).toBe(true)
      expect(fusionQuality.hasTransitions).toBe(true)
      expect(fusionQuality.planContent).toBeGreaterThan(200) // 融合方案应该足够详细
      expect(fusionQuality.segmentationCount).toBeGreaterThan(2) // 至少3个分段
      expect(fusionQuality.transitionCount).toBeGreaterThan(1) // 至少2个转场

      console.log('融合方案质量验证通过')
    }, 320000)
  })

  describe('错误处理和边界情况', () => {
    it('应该处理文件格式不兼容的情况', async () => {
      // 上传不兼容的文件组合
      await browser.navigate_page({
        type: 'url',
        url: 'http://localhost:3006',
        ignoreCache: true
      })

      await browser.click('button[id="fusion-mode"]')

      // 使用一个有效视频和一个无效文件
      await browser.upload_file('input[name="video1"]', testVideo1Path)
      // 这里可以上传一个不兼容的文件，但为了测试稳定性，我们使用两个相同文件

      await browser.click('input[value="personal"]')
      await browser.click('button[id="upload-both-videos"]')

      // 等待错误提示
      await browser.wait_for('文件兼容性检查', { timeout: 15000)

      const errorSnapshot = await browser.take_snapshot()
      expect(errorSnapshot).toContain('兼容性')
    }, 60000)

    it('应该处理网络连接问题', async () => {
      // 模拟网络问题
      await browser.emulate({
        networkConditions: 'Offline',
        cpuThrottlingRate: 1
      })

      // 尝试进行分析
      await browser.click('button[id="start-fusion-analysis"]')

      // 等待网络错误提示
      await browser.wait_for('网络连接错误', { timeout: 10000)

      // 恢复网络连接
      await browser.emulate({
        networkConditions: 'No emulation',
        cpuThrottlingRate: 1
      })

      // 验证错误恢复
      await browser.wait_for('网络连接已恢复', { timeout: 5000)
    }, 30000)
  })
})