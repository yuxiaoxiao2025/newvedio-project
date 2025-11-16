# Project Context

## Purpose
这是一个响应式H5视频文件上传应用，集成AI视频内容分析功能。项目采用简洁实用的实现方案，专注于核心功能，支持用户上传视频文件并进行智能内容分析、视频融合处理和背景音乐生成提示词文档生成。

## Tech Stack
### Frontend
- Vue.js 3 + Composition API
- 响应式设计，移动端优先
- WebSocket 实时进度跟踪
- cnpm 依赖管理

### Backend
- Node.js + Express.js
- 文件上传处理（multer）
- 固定端口配置（Frontend: 3005, Backend: 8005）
- 本地文件系统存储

### AI & External Services
- **视频分析**：阿里云通义千问 VL 模型（qwen3-vl-plus/qwen3-vl-max）
- **文本生成**：阿里云通义千问文本模型（qwen-plus）
- **协同架构**：VL模型负责视频理解，qwen-plus负责报告生成和提示词创作
- 多模态内容理解API
- DashScope SDK for Python/Node.js
- OpenAI 兼容接口

### Testing
- Chrome DevTools MCP for E2E testing
- 视觉测试方案
- 真实视频文件测试（test-videos/）

## Project Conventions

### Code Style
- 简洁直接的实现方案
- 避免过度设计和不必要的复杂功能
- 移动端优先的响应式设计
- 统一的错误处理和用户友好提示

### Architecture Patterns
- API First 开发模式：后端优先实现，前端集成
- 固定端口配置，避免动态端口分配
- 本地文件存储，暂不使用数据库
- 并行开发：API完成后前后端可同时开发

### Testing Strategy
- 使用真实视频文件进行测试
- Chrome DevTools MCP 视觉E2E测试
- 端口冲突检查机制
- 分阶段测试：API -> 前端 -> 集成 -> E2E

### Git Workflow
- 特性驱动开发（Feature-driven）
- 简洁的提交信息，中文注释
- 分阶段部署和测试

## Domain Context

### 视频处理能力
项目使用阿里云通义千问VL模型提供以下视频分析功能：

1. **视频内容分析报告**：
   - 视频时长分析
   - 关键帧识别与提取
   - 场景分类与物体检测
   - 动作识别与情感基调分析
   - 色彩分布统计与画面质量评估

2. **视频融合方案设计**：
   - 30-50秒目标视频分段策略（精确到秒级）
   - 关键画面裁剪建议
   - 转场效果选择（3种以上方案）
   - 音频处理建议与画面融合技术参数
   - 整体叙事逻辑说明与时间轴可视化

3. **背景音乐生成提示词**：
   - 音乐风格定位与情感曲线设计
   - 节奏与视频画面匹配方案
   - 乐器选择建议与时长控制参数
   - 关键转场处音乐变化指示

### 文件类型支持
- **格式**：MP4、AVI
- **大小限制**：最大300MB
- **数量限制**：最多3个文件
- **分类**：个人视频、景区视频（单批次只能选择一个分类）

## Important Constraints

### 技术约束
- 固定端口使用（3005/8005），启动前需检查端口冲突
- 必须使用 cnpm 进行依赖管理
- 视频文件大小和格式严格限制
- API调用频率和Token使用量限制

### 业务约束
- 1-2天快速开发周期
- 专注于核心功能实现
- 简洁的用户体验设计
- 可编辑格式的分析结果交付

### 安全约束
- 基础文件验证和访问控制
- API Key 环境变量管理
- 用户友好的错误信息

## External Dependencies

### 核心依赖
- **阿里云DashScope API**：通义千问VL模型服务
- **OpenAI兼容接口**：标准化的AI模型调用
- **DashScope SDK**：Python/Node.js 官方SDK

### API 配置要求
- 需要配置 DASHSCOPE_API_KEY 环境变量
- 北京地域：https://dashscope.aliyuncs.com/compatible-mode/v1
- 新加坡地域：https://dashscope-intl.aliyuncs.com/compatible-mode/v1

### 支持的模型
- **视频理解**：
  - qwen3-vl-plus：标准视觉理解模型
  - qwen3-vl-max：高性能视觉理解模型（适合复杂分析任务）
- **文本生成**：
  - qwen-plus：通用文本生成模型，适合报告撰写和提示词创作
- **调用策略**：双模型协同工作，确保输出质量

### 文件存储
- 本地文件系统存储路径：
  - `backend/upload/personal/`：个人视频存储
  - `backend/upload/scenic/`：景区视频存储
