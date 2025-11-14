<!--
Sync Impact Report:
- Version change: (none) → 1.0.0 (initial adoption)
- Modified principles: (none) → New constitution created with 4 core principles
- Added sections: Core Principles (4), Technical Constraints, Development Standards, Governance
- Removed sections: (none)
- Templates requiring updates: ✅ all updated
  - ✅ plan-template.md: Added comprehensive Constitution Check section with mobile-first, UI design, native tech, and path validation gates
  - ✅ spec-template.md: Added constitution compliance notes for requirement specification
  - ✅ tasks-template.md: Added constitution compliance requirements for task implementation
- Follow-up TODOs: (none) - all placeholders resolved
-->

# 视频上传H5项目 Constitution

## Core Principles

### 移动优先适配原则
所有界面设计必须优先考虑移动端用户体验，屏幕适配范围320px-428px。所有可点击元素的最小触摸区域必须达到44px×44px，确保在各种移动设备上都有良好的触控体验。按钮、链接等交互元素的设计和布局必须严格遵循此标准。

### 简洁UI设计原则
界面视觉风格必须简洁清爽，避免不必要的装饰元素。主色调统一使用蓝色(#1E88E5)，成功状态使用绿色(#4CAF50)，错误/警告状态使用红色(#F44336)。色彩使用必须一致且有明确的功能区分，确保用户能够快速理解界面状态和信息层级。

### 原生技术开发原则
代码开发优先使用原生HTML/CSS/JavaScript技术栈，严禁引入第三方UI框架或库。所有功能必须通过原生技术实现，确保文件体积最小化、加载性能最优化。只有在原生技术无法实现核心功能时，才允许引入最小化的第三方依赖，并需经过充分论证。

### 路径规范执行原则
文件上传路径必须严格按照业务规则执行：个人视频文件必须保存至项目根目录/upload/personal/，景区视频文件必须保存至项目根目录/upload/scenic/。路径映射规则必须精确无误，不允许任何形式的路径偏差或动态修改，确保文件分类管理的准确性。

## Technical Constraints

### 响应式设计要求
- 必须支持320px-428px屏幕范围内的完美显示
- 所有交互元素最小44px×44px触摸区域
- 支持横竖屏切换的布局适配
- 字体大小必须在小屏幕上保持可读性

### 性能标准
- 页面首次加载时间必须在3秒内完成
- 文件上传响应时间在1秒内开始
- 所有动画效果必须在60fps下流畅运行
- 内存使用控制在合理范围内

## Development Standards

### 代码质量要求
- HTML语义化标签使用必须准确
- CSS必须使用移动优先的媒体查询策略
- JavaScript代码必须模块化组织，避免全局变量污染
- 所有代码必须通过性能测试验证

### 文件结构规范
- 目录结构必须清晰，便于维护和扩展
- 文件命名必须使用有意义的名称
- 代码注释必须准确且及时更新
- 版本控制必须遵循适当的提交规范

## Governance

This constitution supersedes all other development practices and guidelines. All project members must comply with these principles without exception.

### Amendment Process
- 任何原则修改必须经过充分的团队讨论和评估
- 修改提案必须详细说明理由和影响范围
- 批准的修改必须更新版本号并记录修改历史
- 重大修改可能需要重新评审现有代码以符合新标准

### Compliance Review
- 所有代码提交必须自动检查是否符合宪法原则
- 定期审查项目代码，确保持续符合开发标准
- 发现不符合原则的代码必须及时修正
- 新成员加入时必须学习并理解项目宪法

### Violation Handling
- 故意违反宪法原则的行为必须被记录和纠正
- 技术债务如果违反宪法原则必须优先处理
- 外部依赖引入必须严格审查是否符合原生技术原则

**Version**: 1.0.0 | **Ratified**: 2025-11-14 | **Last Amended**: 2025-11-14