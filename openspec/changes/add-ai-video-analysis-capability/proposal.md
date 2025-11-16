# Change: 添加AI视频内容分析、融合与音乐生成能力

## Why
为现有的视频上传应用添加AI驱动的视频内容分析、视频融合方案设计和背景音乐生成提示词功能，提升用户视频处理体验，提供智能化的视频分析和创作建议。

## What Changes
- **新增AI视频分析能力**：基于qwen3-VL模型的视频内容分析报告生成
- **新增视频融合功能**：提供两个视频文件的融合建议和30-50秒目标视频制作方案
- **新增背景音乐提示词生成**：根据融合视频的叙事逻辑生成详细的背景音乐创建提示词
- **扩展API接口**：新增AI分析相关的后端API端点
- **增强前端界面**：添加分析结果展示、融合建议和音乐提示词界面

## Impact
- 受影响的规格：新增video-analysis, video-fusion, music-generation三个能力规格
- 受影响的代码：
  - `backend/src/controllers/` - 新增AI分析控制器
  - `backend/src/services/` - 新增qwen3-VL模型服务
  - `frontend/src/components/` - 新增分析结果展示组件
  - `frontend/src/composables/` - 新增AI分析功能composable
- 外部依赖：阿里云DashScope API集成
- 存储影响：分析结果文件存储