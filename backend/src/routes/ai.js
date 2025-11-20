const express = require('express');
const AIController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');
// 问题ROBUST-004修复: 复用统一的upload中间件配置
const { array: uploadArray } = require('../middleware/upload');

const router = express.Router();
const aiController = new AIController();

/**
 * POST /api/ai/analyze/content
 * 视频内容分析
 */
router.post('/analyze/content', requireAuth, async (req, res) => {
  await aiController.analyzeVideo(req, res);
});

/**
 * POST /api/ai/analyze/fusion
 * 视频融合分析
 */
router.post('/analyze/fusion', requireAuth, async (req, res) => {
  await aiController.analyzeFusion(req, res);
});

/**
 * POST /api/ai/generate/music-prompt
 * 背景音乐提示词生成
 */
router.post('/generate/music-prompt', requireAuth, async (req, res) => {
  await aiController.generateMusicPrompt(req, res);
});

/**
 * POST /api/ai/analyze/upload
 * 一体化上传分析
 */
router.post('/analyze/upload',
  requireAuth,
  uploadArray, // 使用统一的upload中间件
  async (req, res) => {
    await aiController.analyzeUploadedFile(req, res);
  }
);

/**
 * GET /api/ai/analysis/:analysisId/status
 * 分析状态查询
 */
router.get('/analysis/:analysisId/status', requireAuth, async (req, res) => {
  await aiController.getAnalysisStatus(req, res);
});

module.exports = router;