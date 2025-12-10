<!-- OPENSPEC:START -->
# OpenSpec Instructions

Always open `@/openspec/AGENTS.md` when planning or creating change proposals.

<!-- OPENSPEC:END -->

# 项目导航

## 文档结构
- **backend/CLAUDE.md**: 后端 API 开发规范，处理后端任务时必读
- **frontend/CLAUDE.md**: 前端 Vue.js 开发指南，处理前端任务时必读
- **agent_docs/**: 详细专题文档，按需查阅

## 使用规则
- **后端任务**: 先读取 `backend/CLAUDE.md`，必要时查阅 `agent_docs/`
- **前端任务**: 先读取 `frontend/CLAUDE.md`，必要时查阅 `agent_docs/`
- **通用问题**: 查阅 `agent_docs/` 中对应专题文档

---

# CLAUDE.md

## Project Overview
Responsive H5 video upload application. Upload up to 3 video files (mp4/avi, max 300MB) with category selection and real-time progress tracking.

## Tech Stack
- **Frontend**: Vue.js 3 + Composition API (port 3005)
- **Backend**: Node.js + Express.js (port 8005)
- **Testing**: Chrome DevTools MCP
- **Package Manager**: cnpm (required)

## Architecture
```
backend/src/             # Controllers, middleware, routes, services
backend/upload/          # personal/, scenic/ video storage
frontend/src/            # Vue components, composables, utils
specs/001-responsive-h5-upload/  # Feature spec, plan, tasks
```

## Development Workflow
1. API First: Backend endpoints → Frontend integration
2. Fixed ports: Frontend 3005, Backend 8005
3. Use cnpm for all package installations
4. Check port conflicts before starting services

## Core Requirements
- File validation: mp4/avi formats, max 300MB, max 3 files
- Category selection: 个人视频 or 景区视频 (single category per batch)
- Progress tracking: Real-time upload progress with cancel functionality
- Mobile-first responsive H5 design

## Common Commands
```bash
# Backend
cd backend && cnpm install && npm start

# Frontend
cd frontend && cnpm install && npm run dev

# Port check (Windows)
netstat -ano | findstr :3005  # Frontend
netstat -ano | findstr :8005  # Backend

# Kill process
taskkill /PID <process_id> /F
```

## Environment Variables
Key variables required:
- Backend: PORT=8005, MAX_FILE_SIZE=314572800, UPLOAD_DIR=./upload
- Frontend: VITE_API_BASE_URL=http://localhost:8005, VITE_WS_URL=ws://localhost:8005

## Additional Documentation
Detailed guides available in `agent_docs/`:
- `debugging_guide.md` - 调试方法和故障排除
- `deployment_guide.md` - 环境配置和部署指南
- `testing_guide.md` - 测试流程和Chrome DevTools MCP使用
- `api_conventions.md` - API设计规范和约定
- `file_operations.md` - 文件操作和上传处理
- `development_tools.md` - 开发工具和配置指南

**使用方法**: 根据任务类型先阅读对应的backend/或frontend/CLAUDE.md，需要详细信息时查阅上述文档。