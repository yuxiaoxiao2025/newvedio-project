#!/usr/bin/env node

// 加载环境变量
require('dotenv').config();

const AIService = require('./src/services/aiService');
const path = require('path');

async function testVideoAnalysis() {
  console.log('🧪 开始测试视频分析功能...');

  try {
    // 创建AI服务实例
    const aiService = new AIService();

    // 测试用的图片URL (先用图片测试API格式是否正确)
    const testImageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png';

    console.log('🖼️ 测试图片URL:', testImageUrl);

    // 调用分析 (先用图片测试)
    console.log('⏳ 开始分析图片...');
    const result = await aiService.analyzeVideoContent(testImageUrl);

    console.log('✅ 视频分析成功完成!');
    console.log('📊 分析结果:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ 视频分析测试失败:', error.message);

    // 提供详细的错误信息
    if (error.originalError) {
      console.error('原始错误:', error.originalError);
    }

    console.error('完整错误栈:', error.stack);
  }
}

// 运行测试
testVideoAnalysis().then(() => {
  console.log('🎯 测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('💥 测试过程中发生错误:', error);
  process.exit(1);
});