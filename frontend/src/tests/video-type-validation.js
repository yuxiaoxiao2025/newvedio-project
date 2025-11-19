/**
 * 视频类型分析效果验证脚本
 * 验证不同类型视频的分析质量和准确性
 */

// 模拟浏览器环境
global.performance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024
  }
}

async function validateVideoTypeAnalysis() {
  console.log('🎬 开始视频类型分析效果验证')
  console.log('=' .repeat(50))

  try {
    // 导入必要的模块
    const { MockVideoDataGenerator, AIAnalysisResultSimulator } = await import('./utils/testDataGenerator.js')
    const { validateAnalysisResult } = await import('../../utils/analysisDataStructures.js')

    const validationResults = []
    let totalTests = 0
    let passedTests = 0

    // 1. 验证个人视频分析
    console.log('\n👥 验证个人视频分析')
    console.log('-'.repeat(30))

    const personalVideos = MockVideoDataGenerator.generatePersonalVideos()

    for (let i = 0; i < personalVideos.length; i++) {
      const video = personalVideos[i]
      totalTests++

      console.log(`\n📹 测试个人视频 ${i + 1}: ${video.name}`)
      console.log(`   内容: ${video.scene}`)
      console.log(`   时长: ${video.duration}秒`)

      // 执行VL分析
      const vlAnalysis = AIAnalysisResultSimulator.simulateVLAnalysis(video)
      console.log(`   ✅ VL分析: ${vlAnalysis.keyframes.length} 关键帧, ${vlAnalysis.objects.length} 物体`)

      // 生成最终报告
      const finalReport = AIAnalysisResultSimulator.simulateFinalReport(vlAnalysis, video)
      console.log(`   ✅ 报告生成: ${finalReport.length} 字符`)

      // 验证个人视频特有的分析特征
      const hasPeople = vlAnalysis.objects.some(obj => obj.name.includes('人物'))
      const hasPersonalScenes = vlAnalysis.scenes.some(scene =>
        ['人物特写', '活动场景', '环境展示'].includes(scene.type)
      )

      const personalValidation = {
        videoType: 'personal',
        videoName: video.name,
        scene: video.scene,
        hasPeopleAnalysis: hasPeople,
        hasPersonalScenes: hasPersonalScenes,
        keyframeCount: vlAnalysis.keyframes.length,
        objectCount: vlAnalysis.objects.length,
        reportLength: finalReport.length,
        quality: this.assessAnalysisQuality(vlAnalysis, finalReport, 'personal')
      }

      // 验证个人视频分析质量
      const qualityChecks = [
        {
          name: '人物识别',
          passed: hasPeople,
          description: '个人视频应该识别人物'
        },
        {
          name: '个人场景分析',
          passed: hasPersonalScenes,
          description: '个人视频应该分析相关场景'
        },
        {
          name: '报告内容',
          passed: finalReport.includes('个人') || finalReport.includes('生活'),
          description: '报告应该包含个人相关内容'
        }
      ]

      personalValidation.checks = qualityChecks
      personalValidation.passed = qualityChecks.every(check => check.passed)

      if (personalValidation.passed) {
        passedTests++
        console.log(`   ✅ 验证通过 (质量评分: ${personalValidation.quality.score}/10)`)
      } else {
        console.log(`   ❌ 验证失败 (质量评分: ${personalValidation.quality.score}/10)`)
        qualityChecks.filter(check => !check.passed).forEach(check => {
          console.log(`      - ${check.description}`)
        })
      }

      validationResults.push(personalValidation)
    }

    // 2. 验证景区视频分析
    console.log('\n🏞️  验证景区视频分析')
    console.log('-'.repeat(30))

    const scenicVideos = MockVideoDataGenerator.generateScenicVideos()

    for (let i = 0; i < scenicVideos.length; i++) {
      const video = scenicVideos[i]
      totalTests++

      console.log(`\n📹 测试景区视频 ${i + 1}: ${video.name}`)
      console.log(`   内容: ${video.scene}`)
      console.log(`   时长: ${video.duration}秒`)

      // 执行VL分析
      const vlAnalysis = AIAnalysisResultSimulator.simulateVLAnalysis(video)
      console.log(`   ✅ VL分析: ${vlAnalysis.keyframes.length} 关键帧, ${vlAnalysis.objects.length} 物体`)

      // 生成最终报告
      const finalReport = AIAnalysisResultSimulator.simulateFinalReport(vlAnalysis, video)
      console.log(`   ✅ 报告生成: ${finalReport.length} 字符`)

      // 验证景区视频特有的分析特征
      const hasLandscapes = vlAnalysis.objects.some(obj =>
        ['山岳', '水体', '建筑'].includes(obj.name)
      )
      const hasScenicScenes = vlAnalysis.scenes.some(scene =>
        ['远景景观', '中景展示', '特写细节'].includes(scene.type)
      )

      const scenicValidation = {
        videoType: 'scenic',
        videoName: video.name,
        scene: video.scene,
        hasLandscapeAnalysis: hasLandscapes,
        hasScenicScenes: hasScenicScenes,
        keyframeCount: vlAnalysis.keyframes.length,
        objectCount: vlAnalysis.objects.length,
        reportLength: finalReport.length,
        quality: this.assessAnalysisQuality(vlAnalysis, finalReport, 'scenic')
      }

      // 验证景区视频分析质量
      const qualityChecks = [
        {
          name: '景观识别',
          passed: hasLandscapes,
          description: '景区视频应该识别自然景观'
        },
        {
          name: '景观场景分析',
          passed: hasScenicScenes,
          description: '景区视频应该分析景观相关场景'
        },
        {
          name: '报告内容',
          passed: finalReport.includes('景区') || finalReport.includes('景观'),
          description: '报告应该包含景观相关内容'
        }
      ]

      scenicValidation.checks = qualityChecks
      scenicValidation.passed = qualityChecks.every(check => check.passed)

      if (scenicValidation.passed) {
        passedTests++
        console.log(`   ✅ 验证通过 (质量评分: ${scenicValidation.quality.score}/10)`)
      } else {
        console.log(`   ❌ 验证失败 (质量评分: ${scenicValidation.quality.score}/10)`)
        qualityChecks.filter(check => !check.passed).forEach(check => {
          console.log(`      - ${check.description}`)
        })
      }

      validationResults.push(scenicValidation)
    }

    // 3. 验证视频融合分析
    console.log('\n🎬 验证视频融合分析')
    console.log('-'.repeat(30))

    // 测试相同类型视频融合
    const fusionTests = [
      {
        name: '个人视频融合',
        video1: personalVideos[0],
        video2: personalVideos[1]
      },
      {
        name: '景区视频融合',
        video1: scenicVideos[0],
        video2: scenicVideos[1]
      },
      {
        name: '混合类型融合',
        video1: personalVideos[0],
        video2: scenicVideos[0]
      }
    ]

    for (let i = 0; i < fusionTests.length; i++) {
      const test = fusionTests[i]
      totalTests++

      console.log(`\n🔀 测试融合方案 ${i + 1}: ${test.name}`)
      console.log(`   视频1: ${test.video1.name}`)
      console.log(`   视频2: ${test.video2.name}`)

      // 执行融合分析
      const fusionPlan = AIAnalysisResultSimulator.simulateFusionAnalysis(test.video1, test.video2)
      console.log(`   ✅ 融合方案: ${fusionPlan.segmentation.length} 片段`)

      // 生成音乐提示词
      const musicPrompt = AIAnalysisResultSimulator.simulateMusicPrompt(fusionPlan)
      console.log(`   ✅ 音乐提示词: ${musicPrompt.basicInfo?.targetDuration || 0}秒`)

      // 验证融合质量
      const hasValidSegmentation = fusionPlan.segmentation.length >= 2
      const hasValidTransitions = fusionPlan.transitions && fusionPlan.transitions.length > 0
      const hasMusicPrompt = musicPrompt && musicPrompt.basicInfo

      const fusionValidation = {
        videoType: 'fusion',
        testName: test.name,
        video1Type: test.video1.category,
        video2Type: test.video2.category,
        segmentCount: fusionPlan.segmentation.length,
        transitionCount: fusionPlan.transitions?.length || 0,
        hasMusicPrompt: !!hasMusicPrompt,
        targetDuration: fusionPlan.overallPlan.targetDuration
      }

      const qualityChecks = [
        {
          name: '分段策略',
          passed: hasValidSegmentation,
          description: '融合方案应该包含有效的分段策略'
        },
        {
          name: '转场效果',
          passed: hasValidTransitions,
          description: '融合方案应该包含转场效果'
        },
        {
          name: '音乐提示词',
          passed: hasMusicPrompt,
          description: '应该生成背景音乐提示词'
        }
      ]

      fusionValidation.checks = qualityChecks
      fusionValidation.passed = qualityChecks.every(check => check.passed)

      if (fusionValidation.passed) {
        passedTests++
        console.log(`   ✅ 验证通过`)
      } else {
        console.log(`   ❌ 验证失败`)
        qualityChecks.filter(check => !check.passed).forEach(check => {
          console.log(`      - ${check.description}`)
        })
      }

      validationResults.push(fusionValidation)
    }

    // 4. 生成验证报告
    console.log('\n📊 生成视频类型验证报告')
    console.log('=' .repeat(50))

    const successRate = ((passedTests / totalTests) * 100).toFixed(1)

    console.log(`总测试数: ${totalTests}`)
    console.log(`通过测试: ${passedTests}`)
    console.log(`失败测试: ${totalTests - passedTests}`)
    console.log(`成功率: ${successRate}%`)

    // 按类型统计
    const typeStats = {
      personal: validationResults.filter(r => r.videoType === 'personal'),
      scenic: validationResults.filter(r => r.videoType === 'scenic'),
      fusion: validationResults.filter(r => r.videoType === 'fusion')
    }

    console.log('\n📈 分类统计:')
    Object.entries(typeStats).forEach(([type, results]) => {
      const passed = results.filter(r => r.passed).length
      const total = results.length
      const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'
      const typeName = type === 'personal' ? '个人视频' :
                     type === 'scenic' ? '景区视频' : '视频融合'
      console.log(`   ${typeName}: ${passed}/${total} (${rate}%)`)
    })

    // 质量分析
    const allQualityScores = validationResults
      .filter(r => r.quality)
      .map(r => r.quality.score)

    if (allQualityScores.length > 0) {
      const avgQuality = allQualityScores.reduce((a, b) => a + b, 0) / allQualityScores.length
      console.log(`\n⭐ 平均质量评分: ${avgQuality.toFixed(1)}/10`)
    }

    // 建议和结论
    console.log('\n💡 验证结论:')
    if (parseFloat(successRate) >= 90) {
      console.log('   🎉 视频类型分析效果优秀！')
      console.log('   所有主要视频类型都能正确识别和分析。')
    } else if (parseFloat(successRate) >= 75) {
      console.log('   👍 视频类型分析效果良好！')
      console.log('   大部分视频类型能正确识别，有改进空间。')
    } else {
      console.log('   ⚠️  视频类型分析需要改进！')
      console.log('   建议优化分析算法以提高准确性。')
    }

    const validationReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: successRate
      },
      typeStats: Object.fromEntries(
        Object.entries(typeStats).map(([type, results]) => [
          type,
          {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            rate: ((results.filter(r => r.passed).length / results.length) * 100).toFixed(1)
          }
        ])
      ),
      results: validationResults,
      recommendations: this.generateRecommendations(validationResults)
    }

    return validationReport

  } catch (error) {
    console.error('\n💥 视频类型验证失败:', error.message)
    return {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: '0%'
      }
    }
  }

  /**
   * 评估分析质量
   */
  function assessAnalysisQuality(vlAnalysis, finalReport, videoType) {
    let score = 5 // 基础分

    // 关键帧质量
    if (vlAnalysis.keyframes.length > 0) {
      score += 1
      if (vlAnalysis.keyframes.length >= 5) score += 1
    }

    // 场景识别质量
    if (vlAnalysis.scenes.length > 0) {
      score += 1
      if (vlAnalysis.scenes.length >= 3) score += 1
    }

    // 物体识别质量
    if (vlAnalysis.objects.length > 0) {
      score += 1
    }

    // 报告质量
    if (finalReport && finalReport.length > 100) {
      score += 1
      if (finalReport.includes(videoType)) score += 1
    }

    return {
      score: Math.min(10, score),
      maxScore: 10,
      factors: {
        keyframes: vlAnalysis.keyframes.length,
        scenes: vlAnalysis.scenes.length,
        objects: vlAnalysis.objects.length,
        reportLength: finalReport ? finalReport.length : 0
      }
    }
  }

  /**
   * 生成改进建议
   */
  function generateRecommendations(results) {
    const recommendations = []

    // 分析失败案例
    const failedResults = results.filter(r => !r.passed)
    if (failedResults.length > 0) {
      recommendations.push('修复失败的测试用例以提高整体成功率')
    }

    // 分析质量评分
    const lowQualityResults = results.filter(r =>
      r.quality && r.quality.score < 7
    )
    if (lowQualityResults.length > 0) {
      recommendations.push('提高分析质量评分，重点关注低质量案例')
    }

    // 类型特定建议
    const personalResults = results.filter(r => r.videoType === 'personal')
    const scenicResults = results.filter(r => r.videoType === 'scenic')
    const fusionResults = results.filter(r => r.videoType === 'fusion')

    const personalRate = personalResults.length > 0 ?
      (personalResults.filter(r => r.passed).length / personalResults.length) : 0
    const scenicRate = scenicResults.length > 0 ?
      (scenicResults.filter(r => r.passed).length / scenicResults.length) : 0
    const fusionRate = fusionResults.length > 0 ?
      (fusionResults.filter(r => r.passed).length / fusionResults.length) : 0

    if (personalRate < 0.8) {
      recommendations.push('改进个人视频识别算法，加强人物和活动分析')
    }
    if (scenicRate < 0.8) {
      recommendations.push('优化景区视频分析，提升景观识别能力')
    }
    if (fusionRate < 0.8) {
      recommendations.push('完善视频融合策略，提供更好的转场和分段建议')
    }

    return recommendations
  }
}

// 运行验证
validateVideoTypeAnalysis().then(result => {
  console.log('\n📋 视频类型验证报告已生成')

  if (result.summary) {
    console.log(`🎯 最终成功率: ${result.summary.successRate}%`)

    // 保存验证报告
    if (typeof process !== 'undefined' && process !== null) {
      import('fs').then(fs => {
        fs.promises.writeFile(
          './video-type-validation-report.json',
          JSON.stringify(result, null, 2)
        ).then(() => {
          console.log('💾 验证报告已保存到 video-type-validation-report.json')
        }).catch(err => {
          console.log('⚠️  无法保存报告文件:', err.message)
        })
      })
    }
  }
}).catch(error => {
  console.error('💥 视频类型验证异常:', error)
})