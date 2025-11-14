#!/usr/bin/env node

/**
 * API测试脚本
 * 用于验证视频上传系统的后端API功能
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 配置
const API_BASE_URL = 'http://localhost:8005';
const TEST_VIDEOS_DIR = path.join(__dirname, 'test-videos');

// 工具函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const logError = (message) => log(message, 'error');
const logSuccess = (message) => log(message, 'success');

// HTTP请求函数
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    logError(`请求失败: ${error.message}`);
    throw error;
  }
}

// 测试1: 健康检查
async function testHealthCheck() {
  log('开始健康检查测试...');

  try {
    const { response, data } = await makeRequest('/health');

    if (response.ok && data.status === 'OK') {
      logSuccess('健康检查通过');
      console.log('服务器信息:', {
        uptime: Math.floor(data.uptime),
        memory: Math.floor(data.memory.heapUsed / 1024 / 1024) + 'MB'
      });
      return true;
    } else {
      logError('健康检查失败');
      return false;
    }
  } catch (error) {
    logError('健康检查异常: ' + error.message);
    return false;
  }
}

// 测试2: 文件验证
async function testFileValidation() {
  log('开始文件验证测试...');

  try {
    const testFiles = [
      {
        name: '景区测试视频01.mp4',
        size: 2604838,
        type: 'video/mp4'
      },
      {
        name: '游客测试视频01.mp4',
        size: 745615,
        type: 'video/mp4'
      }
    ];

    const { response, data } = await makeRequest('/api/upload/validate', {
      method: 'POST',
      body: JSON.stringify({ files: testFiles })
    });

    if (response.ok && data.valid) {
      logSuccess('文件验证通过');
      console.log('验证结果:', {
        totalFiles: data.summary.total,
        validFiles: data.summary.valid,
        invalidFiles: data.summary.invalid
      });
      return true;
    } else {
      logError('文件验证失败: ' + (data.message || '未知错误'));
      return false;
    }
  } catch (error) {
    logError('文件验证异常: ' + error.message);
    return false;
  }
}

// 测试3: 创建会话
async function testCreateSession() {
  log('开始创建会话测试...');

  try {
    const { response, data } = await makeRequest('/api/upload/session', {
      method: 'POST',
      body: JSON.stringify({
        category: 'personal',
        expectedFiles: 2
      })
    });

    if (response.ok && data.sessionId) {
      logSuccess('会话创建成功');
      console.log('会话信息:', {
        sessionId: data.sessionId.substring(0, 8) + '...',
        category: data.category,
        maxFiles: data.maxFiles
      });
      return data.sessionId;
    } else {
      logError('会话创建失败: ' + (data.message || '未知错误'));
      return null;
    }
  } catch (error) {
    logError('会话创建异常: ' + error.message);
    return null;
  }
}

// 测试4: 实际文件上传
async function testFileUpload(sessionId) {
  log('开始文件上传测试...');

  if (!sessionId) {
    logError('缺少会话ID，跳过上传测试');
    return false;
  }

  try {
    // 获取测试文件
    const testVideoPath = path.join(TEST_VIDEOS_DIR, '景区测试视频01.mp4');

    if (!fs.existsSync(testVideoPath)) {
      logError('测试视频文件不存在: ' + testVideoPath);
      return false;
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testVideoPath));
    formData.append('sessionId', sessionId);
    formData.append('category', 'scenic');

    const { response, data } = await makeRequest('/api/upload/batch', {
      method: 'POST',
      headers: formData.getHeaders(),
      body: formData.getBuffer()
    });

    if (response.ok && data.success) {
      logSuccess('文件上传成功');
      console.log('上传结果:', {
        totalFiles: data.summary.totalFiles,
        completedFiles: data.summary.completedFiles,
        failedFiles: data.summary.failedFiles,
        totalSize: Math.floor(data.summary.totalSize / 1024 / 1024) + 'MB'
      });
      return true;
    } else {
      logError('文件上传失败: ' + (data.message || '未知错误'));
      return false;
    }
  } catch (error) {
    logError('文件上传异常: ' + error.message);
    return false;
  }
}

// 测试5: 查询进度
async function testProgressQuery(sessionId) {
  log('开始进度查询测试...');

  if (!sessionId) {
    logError('缺少会话ID，跳过进度查询测试');
    return false;
  }

  try {
    const { response, data } = await makeRequest(`/api/upload/progress/${sessionId}`);

    if (response.ok) {
      logSuccess('进度查询成功');
      console.log('进度信息:', {
        sessionId: data.sessionId.substring(0, 8) + '...',
        status: data.overallStatus,
        totalProgress: data.totalProgress + '%',
        completedFiles: data.completedFiles,
        failedFiles: data.failedFiles
      });
      return true;
    } else {
      logError('进度查询失败: ' + (data.message || '未知错误'));
      return false;
    }
  } catch (error) {
    logError('进度查询异常: ' + error.message);
    return false;
  }
}

// 测试6: 错误场景
async function testErrorScenarios() {
  log('开始错误场景测试...');

  let passedTests = 0;
  let totalTests = 0;

  // 测试无效文件格式
  totalTests++;
  try {
    const { response, data } = await makeRequest('/api/upload/validate', {
      method: 'POST',
      body: JSON.stringify({
        files: [{
          name: 'test.txt',
          size: 1024,
          type: 'text/plain'
        }]
      })
    });

    if (!response.ok || !data.valid) {
      logSuccess('无效文件格式测试通过');
      passedTests++;
    } else {
      logError('无效文件格式测试失败');
    }
  } catch (error) {
    logError('无效文件格式测试异常: ' + error.message);
  }

  // 测试文件过大
  totalTests++;
  try {
    const { response, data } = await makeRequest('/api/upload/validate', {
      method: 'POST',
      body: JSON.stringify({
        files: [{
          name: 'huge.mp4',
          size: 500 * 1024 * 1024, // 500MB
          type: 'video/mp4'
        }]
      })
    });

    if (!response.ok || !data.valid) {
      logSuccess('文件过大测试通过');
      passedTests++;
    } else {
      logError('文件过大测试失败');
    }
  } catch (error) {
    logError('文件过大测试异常: ' + error.message);
  }

  // 测试文件数量过多
  totalTests++;
  try {
    const files = Array(5).fill().map((_, i) => ({
      name: `test${i}.mp4`,
      size: 1024 * 1024,
      type: 'video/mp4'
    }));

    const { response, data } = await makeRequest('/api/upload/validate', {
      method: 'POST',
      body: JSON.stringify({ files })
    });

    if (!response.ok || !data.valid) {
      logSuccess('文件数量过多测试通过');
      passedTests++;
    } else {
      logError('文件数量过多测试失败');
    }
  } catch (error) {
    logError('文件数量过多测试异常: ' + error.message);
  }

  log(`错误场景测试结果: ${passedTests}/${totalTests} 通过`);
  return passedTests === totalTests;
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API测试...\n');

  const results = {
    healthCheck: false,
    fileValidation: false,
    createSession: false,
    fileUpload: false,
    progressQuery: false,
    errorScenarios: false
  };

  let sessionId = null;

  try {
    // 基础功能测试
    results.healthCheck = await testHealthCheck();
    console.log('');

    results.fileValidation = await testFileValidation();
    console.log('');

    sessionId = await testCreateSession();
    results.createSession = !!sessionId;
    console.log('');

    // 上传功能测试
    results.fileUpload = await testFileUpload(sessionId);
    console.log('');

    await sleep(1000); // 等待1秒
    results.progressQuery = await testProgressQuery(sessionId);
    console.log('');

    // 错误场景测试
    results.errorScenarios = await testErrorScenarios();
    console.log('');

  } catch (error) {
    logError('测试过程中发生异常: ' + error.message);
  }

  // 测试结果汇总
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(50));

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    const testName = {
      healthCheck: '健康检查',
      fileValidation: '文件验证',
      createSession: '创建会话',
      fileUpload: '文件上传',
      progressQuery: '进度查询',
      errorScenarios: '错误场景'
    }[test];
    console.log(`${status} ${testName}`);
  });

  console.log('='.repeat(50));
  console.log(`总体结果: ${passedCount}/${totalCount} 测试通过`);

  if (passedCount === totalCount) {
    logSuccess('🎉 所有测试通过！系统功能正常');
    process.exit(0);
  } else {
    logError('❌ 部分测试失败，请检查系统');
    process.exit(1);
  }
}

// 检查是否有fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    logError('测试运行失败: ' + error.message);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testFileValidation,
  testCreateSession,
  testFileUpload,
  testProgressQuery,
  testErrorScenarios
};