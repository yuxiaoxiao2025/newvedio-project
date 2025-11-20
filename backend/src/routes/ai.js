const express = require('express');
const multer = require('multer');
const AIController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const aiController = new AIController();

// 配置文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB
    files: 2 // 最多2个文件
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。仅支持MP4、AVI格式。'), false);
    }
  }
});

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
  upload.array('videos', 2), // 最多2个文件
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