const AIService = require('../services/aiService');
const path = require('path');
const fs = require('fs');
const config = require('../config/upload'); // 添加config导入用于路径验证

class AIController {
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 视频内容分析API端点
   */
  async analyzeVideo(req, res) {
    try {
      const { videoPath } = req.body;

      if (!videoPath) {
        return res.status(400).json({
          success: false,
          error: '缺少视频文件路径'
        });
      }

      // 问题3修复: 防止路径遍历攻击
      const resolvedPath = path.resolve(videoPath);
      const uploadBaseDir = path.resolve(config.uploadBaseDir || path.join(__dirname, '../../upload'));
      
      // 验证文件路径是否在允许的上传目录内
      if (!resolvedPath.startsWith(uploadBaseDir)) {
        return res.status(400).json({
          success: false,
          error: '非法的文件路径，请使用有效的上传文件'
        });
      }

      // 验证文件是否存在
      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({
          success: false,
          error: '视频文件不存在'
        });
      }

      // 执行三阶段分析
      const analysisResult = await this.aiService.analyzeVideoThreeStage(resolvedPath);

      res.json({
        success: true,
        data: {
          analysisId: `analysis_${Date.now()}`,
          videoPath: resolvedPath,
          ...analysisResult,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('视频分析API错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 视频融合分析API端点
   */
  async analyzeFusion(req, res) {
    try {
      const { video1Path, video2Path } = req.body;

      if (!video1Path || !video2Path) {
        return res.status(400).json({
          success: false,
          error: '缺少两个视频文件路径'
        });
      }

      // 问题3修复: 防止路径遍历攻击
      const uploadBaseDir = path.resolve(config.uploadBaseDir || path.join(__dirname, '../../upload'));
      const resolvedPath1 = path.resolve(video1Path);
      const resolvedPath2 = path.resolve(video2Path);
      
      // 验证两个文件路径是否在允许的上传目录内
      if (!resolvedPath1.startsWith(uploadBaseDir) || !resolvedPath2.startsWith(uploadBaseDir)) {
        return res.status(400).json({
          success: false,
          error: '非法的文件路径，请使用有效的上传文件'
        });
      }

      // 验证文件是否存在
      const video1Exists = fs.existsSync(resolvedPath1);
      const video2Exists = fs.existsSync(resolvedPath2);

      if (!video1Exists || !video2Exists) {
        return res.status(404).json({
          success: false,
          error: '一个或多个视频文件不存在'
        });
      }

      // 执行融合分析
      const fusionResult = await this.aiService.analyzeFusionThreeStage(resolvedPath1, resolvedPath2);

      res.json({
        success: true,
        data: {
          fusionId: `fusion_${Date.now()}`,
          video1Path: resolvedPath1,
          video2Path: resolvedPath2,
          ...fusionResult,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('视频融合分析API错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 背景音乐提示词生成API端点
   */
  async generateMusicPrompt(req, res) {
    try {
      const { fusionPlan } = req.body;

      if (!fusionPlan) {
        return res.status(400).json({
          success: false,
          error: '缺少视频融合方案数据'
        });
      }

      // 生成音乐提示词
      const musicPrompt = await this.aiService.generateVideoReport(fusionPlan, 'music');

      res.json({
        success: true,
        data: {
          musicPromptId: `music_${Date.now()}`,
          prompt: musicPrompt,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('音乐提示词生成API错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 一体化分析API - 从上传文件直接分析
   */
  async analyzeUploadedFile(req, res) {
    try {
      const { category, analysisType } = req.body;
      const uploadedFiles = req.files;

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: '没有上传的文件'
        });
      }

      let result;

      switch (analysisType) {
        case 'content':
          // 单视频内容分析
          if (uploadedFiles.length !== 1) {
            return res.status(400).json({
              success: false,
              error: '内容分析只需要一个视频文件'
            });
          }
          const videoPath = uploadedFiles[0].path;
          result = await this.aiService.analyzeVideoThreeStage(videoPath);
          break;

        case 'fusion':
          // 视频融合分析
          if (uploadedFiles.length !== 2) {
            return res.status(400).json({
              success: false,
              error: '融合分析需要两个视频文件'
            });
          }
          const [video1, video2] = uploadedFiles;
          result = await this.aiService.analyzeFusionThreeStage(video1.path, video2.path);

          // 附加音乐提示词
          result.musicPrompt = await this.aiService.generateVideoReport(result.fusionData, 'music');
          break;

        default:
          return res.status(400).json({
            success: false,
            error: '不支持的分析类型'
          });
      }

      res.json({
        success: true,
        data: {
          analysisType,
          category,
          ...result,
          processedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('一体化分析API错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 分析状态查询API
   */
  async getAnalysisStatus(req, res) {
    try {
      const { analysisId } = req.params;

      // 这里可以集成状态查询逻辑
      // 目前返回模拟状态
      res.json({
        success: true,
        data: {
          analysisId,
          status: 'completed',
          progress: 100,
          estimatedTime: 0
        }
      });

    } catch (error) {
      console.error('状态查询API错误:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AIController;