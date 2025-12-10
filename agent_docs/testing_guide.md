# 测试指南

Chrome DevTools MCP测试流程和E2E测试策略，确保应用质量。

## Chrome DevTools MCP测试

### 测试环境配置
- 使用真实的Chrome浏览器进行测试
- 支持移动端模拟测试
- 可视化测试结果记录
- 自动化测试流程支持

### 测试数据准备
```bash
# 测试视频文件组织
test-videos/
├── small/
│   ├── sample-1mb.mp4      # 1MB测试视频
│   └── sample-5mb.avi       # 5MB测试视频
├── medium/
│   ├── sample-50mb.mp4     # 50MB测试视频
│   └── sample-100mb.avi    # 100MB测试视频
└── large/
    ├── sample-200mb.mp4    # 200MB测试视频
    └── sample-299mb.avi    # 299MB测试视频（接近限制）
```

### E2E测试场景
1. **正常上传流程测试**
   - 选择3个有效视频文件
   - 选择分类（个人视频/景区视频）
   - 完成上传流程
   - 验证上传进度显示
   - 确认文件保存位置正确

2. **错误处理测试**
   - 上传非mp4/avi格式文件
   - 上传超过300MB的文件
   - 上传超过3个文件
   - 网络中断模拟
   - 服务器错误响应

3. **移动端响应式测试**
   - 不同屏幕尺寸测试
   - 触摸操作测试
   - 移动端浏览器兼容性
   - 横竖屏切换测试

4. **WebSocket连接测试**
   - 连接建立和断开
   - 实时进度更新
   - 连接异常恢复
   - 多客户端并发测试

## 测试命令示例
```bash
# 启动Chrome DevTools MCP测试
mcp playwright test

# 运行特定测试场景
mcp playwright test --grep "文件上传"

# 生成测试报告
mcp playwright test --reporter=html
```

## 测试检查清单
- [ ] 前端页面响应式布局
- [ ] 文件选择和验证功能
- [ ] 上传进度实时更新
- [ ] 错误提示用户友好
- [ ] WebSocket连接稳定
- [ ] 移动端操作流畅
- [ ] 大文件上传性能
- [ ] 并发上传处理