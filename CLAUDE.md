<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a responsive H5 video file upload application with a simplified, practical approach. The project implements a 1-2 day timeline with 29 tasks, focusing on essential functionality over enterprise complexity.

**Core Feature**: Upload up to 3 video files (mp4/avi, max 300MB) with category selection (个人视频/景区视频) and real-time progress tracking.

## Active Technologies & Stack

- **Frontend**: Vue.js 3 + Composition API
- **Backend**: Node.js + Express.js
- **Testing**: Chrome DevTools MCP for visual E2E testing
- **Dependencies**: cnpm (required for all package installations)
- **Ports**: Frontend 3005 (fixed), Backend 8005 (fixed)

## Architecture Overview

### Project Structure
```text
backend/                    # Node.js + Express server (port 8005)
├── src/
│   ├── controllers/        # File upload controllers
│   ├── middleware/         # File validation, error handling
│   ├── routes/             # API routes (/api/upload)
│   ├── services/           # Upload service, file management
│   └── utils/              # File validation, logging
├── upload/
│   ├── personal/          # Personal video uploads
│   └── scenic/            # Scenic video uploads
└── tests/

frontend/                   # Vue.js 3 application (port 3005)
├── src/
│   ├── components/        # Vue components (FileUploader, ProgressBar, etc.)
│   ├── composables/        # Vue composables (useFileUpload, useWebSocket)
│   ├── utils/              # Frontend utilities, constants
│   └── styles/             # CSS styling
└── tests/

specs/                      # Feature specifications
└── 001-responsive-h5-upload/
    ├── spec.md            # Feature specification
    ├── plan.md            # Implementation plan
    ├── tasks.md           # Task list (29 tasks)
    └── checklists/        # Requirements quality checklists
```

### Key Architectural Decisions

- **API First Approach**: Backend API endpoints implemented first, then frontend development
- **Fixed Port Configuration**: No dynamic port allocation to ensure consistency
- **Local File System Storage**: Direct file storage without database complexity
- **Parallel Development**: Frontend and backend can work simultaneously after API completion

## Development Commands

### Package Management
```bash
# Install dependencies (always use cnpm)
cnpm install

# Install specific packages
cnpm install express multer vue axios
```

### Backend Development
```bash
cd backend
cnpm install
npm start          # Start Express server on port 8005
```

### Frontend Development
```bash
cd frontend
cnpm install
npm run dev         # Start Vue dev server on port 3005
```

### Testing
```bash
# Chrome DevTools MCP E2E testing
# Use MCP Chrome DevTools tool with real video files from test-videos/

# Port conflict resolution (before testing)
# Check ports 3005 and 8005, terminate any conflicting processes
```

## Feature Specification Context

Current active feature: `001-responsive-h5-upload`

**Key Requirements**:
- File validation: mp4/avi formats, max 300MB, max 3 files
- Category selection: Single category per batch (个人视频 or 景区视频)
- Progress tracking: Real-time upload progress with cancel functionality
- Error handling: Basic user-friendly error messages
- Responsive design: Mobile-first H5 design
- Completion flow: Upload completion button → Navigate to "下回分解" page

**Timeline**: 1-2 days implementation across 4 phases
- Phase 1: API Development (7 tasks)
- Phase 2: Frontend Development (10 tasks)
- Phase 3: Progress Tracking (4 tasks)
- Phase 4: Testing (8 tasks)

## Project Constitution Alignment

The project follows a practical implementation constitution (v1.1.0) with 7 core principles:

1. **Mobile-First Design**: All functionality must work on mobile devices
2. **Practical Video Processing**: Focus on 300MB file uploads, basic error handling
3. **User Experience First**: Simple, intuitive interfaces with clear feedback
4. **Practical Performance**: Mature tech stack, reasonable concurrency
5. **Practical Security**: Basic file validation and access control
6. **Practical Technology Stack**: Fixed ports, cnpm dependencies, Chrome DevTools MCP
7. **Structured Debugging**: Code commenting elimination method, dual-level logging

## Development Workflow

1. **API First**: Backend endpoints → Frontend integration
2. **Fixed Environment**: Ensure port configuration consistency
3. **Practical Testing**: Chrome DevTools MCP visual testing
4. **Unified Dependencies**: cnpm for consistent package management
5. **Structured Debugging**: Code commenting elimination method for error resolution

## Important Constraints & Requirements

- **Port Management**: Always check for port conflicts before starting development/testing
- **Dependency Management**: Must use cnpm, not npm
- **File Validation**: Strict mp4/avi format validation with size/count limits
- **Testing Resources**: Use real video files from `test-videos/` directory
- **Error Handling**: Focus on user-friendly messages over technical jargon
- **No Over-Engineering**: Prioritize practical implementation over enterprise complexity

## Common Development Tasks

### Starting a New Feature
1. Create feature spec in `specs/[###-feature-name]/spec.md`
2. Run `/speckit.plan` to generate implementation plan
3. Run `/speckit.tasks` to create task list
4. Follow API-first development approach

### Port Conflict Resolution
```bash
# Check if ports 3005 or 8005 are in use
netstat -ano | findstr :3005
netstat -ano | findstr :8005

# Kill processes using the ports (Windows)
taskkill /PID <process_id> /F
```

### Debugging Method
When encountering errors:
1. Identify error-related code section
2. Comment out code blocks systematically
3. Test after each comment to isolate the problematic code
4. Use dual-level logging (user + developer logs) for tracing

## Testing with Chrome DevTools MCP

The project uses Chrome DevTools MCP for E2E testing:
- Visual testing approach with real browser
- Use `test-videos/` directory for actual video files
- Test upload flows, error scenarios, and responsive behavior
- No complex integration test setup required

## Logging System

Two-level logging system:
- **User Logs**: End-user facing operation logs
- **Developer Logs**: Technical debugging and system monitoring logs

Both levels must be implemented for comprehensive debugging and issue resolution.