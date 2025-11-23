#!/usr/bin/env node

// 加载环境变量
require('dotenv').config();

const AIService = require('./src/services/aiService');

async function testTextGeneration() {
  console.log('🧪 开始测试qwen-plus文本生成功能...');

  try {
    // 创建AI服务实例
    const aiService = new AIService();

    // 模拟视频分析数据
    const mockAnalysisData = {
      videoInfo: {
        duration: 30,
        keyframeCount: 5,
        sceneCount: 3,
        objectCount: 2,
        actionCount: 2
      },
      contentSummary: {
        keyframes: [
          {
            timestamp: 5,
            description: "开场画面，展示主题",
            importance: "high"
          }
        ],
        scenes: [
          {
            type: "室内场景",
            startTime: 0,
            endTime: 15,
            description: "室内活动",
            atmosphere: "温馨"
          }
        ],
        objects: [
          {
            name: "人物",
            confidence: 0.95,
            first_seen: 2,
            duration: 28
          }
        ],
        actions: [
          {
            action: "走路",
            startTime: 3,
            endTime: 8,
            participants: "人物"
          }
        ]
      }
    };

    console.log('📊 测试数据准备完成');

    // 测试内容报告生成
    console.log('📝 开始生成内容分析报告...');
    const contentReport = await aiService.generateVideoReport(mockAnalysisData, 'content');
    console.log('✅ 内容报告生成成功!');
    console.log('📄 报告长度:', contentReport.length, '字符');
    console.log('📋 报告预览:', contentReport.substring(0, 200) + '...');

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试融合方案生成
    console.log('🔀 开始生成融合方案...');
    const fusionPlan = await aiService.generateVideoReport(mockAnalysisData, 'fusion');
    console.log('✅ 融合方案生成成功!');
    console.log('📄 方案长度:', fusionPlan.length, '字符');
    console.log('📋 方案预览:', fusionPlan.substring(0, 200) + '...');

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试音乐提示词生成
    console.log('🎵 开始生成音乐提示词...');
    const musicPrompt = await aiService.generateVideoReport(mockAnalysisData, 'music');
    console.log('✅ 音乐提示词生成成功!');
    console.log('📄 提示词长度:', musicPrompt.length, '字符');
    console.log('📋 提示词预览:', musicPrompt.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ 文本生成测试失败:', error.message);

    // 提供详细的错误信息
    if (error.originalError) {
      console.error('原始错误:', error.originalError);
    }

    console.error('完整错误栈:', error.stack);
  }
}

// 运行测试
testTextGeneration().then(() => {
  console.log('🎯 测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('💥 测试过程中发生错误:', error);
  process.exit(1);
});