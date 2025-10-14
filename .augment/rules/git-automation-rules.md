---
type: "always_apply"
description: "Example description"
---

# Git MCP自动化标准规则

## 核心原则
AI在满足特定条件时应自动调用Git MCP进行代码提交，无需用户明确指示。本规则基于cyanheads/git-mcp-server v2.3.2，提供25个Git自动化工具。

## 自动提交触发标准

### 必须满足的条件 (AND逻辑)
1. **功能完整性**: 用户请求的功能已完整实现
2. **代码质量**: 无语法错误，逻辑完整，符合项目规范
3. **变更规模**: 文件数1-10个，代码行数10-500行，关联性强
4. **用户态度**: 用户未明确拒绝提交

### 自动提交场景
- ✅ 新功能实现完成
- ✅ Bug修复完成
- ✅ 代码重构完成
- ✅ 配置文件更新（项目配置、依赖、构建脚本）
- ✅ 文档更新完成
- ✅ 测试代码添加
- ✅ 用户明确要求提交（"提交代码"、"commit"等）
- ✅ 阶段性完成确认
- ✅ 保存进度要求

### 禁止自动提交场景
- ❌ 实验性/临时代码、调试代码
- ❌ 功能实现不完整或有明显缺陷
- ❌ 大规模架构变更(>500行)或涉及核心架构
- ❌ 用户明确拒绝（"不要提交"、"先不commit"）
- ❌ 代码有明显错误

## MCP服务器配置

### 标准MCP JSON配置
```json
{
  "mcpServers": {
    "git-mcp-server": {
      "command": "npx",
      "args": ["@cyanheads/git-mcp-server"],
      "env": {
        "MCP_LOG_LEVEL": "info",
        "GIT_SIGN_COMMITS": "false",
        "MCP_TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

### 环境变量配置
- `MCP_TRANSPORT_TYPE`: 传输机制 (`stdio` 或 `http`)，默认 `stdio`
- `MCP_LOG_LEVEL`: 日志级别 (`debug`, `info`, `warning`, `error`)，默认 `info`
- `GIT_SIGN_COMMITS`: 是否启用提交签名，默认 `false`
- `MCP_HTTP_PORT`: HTTP服务器端口（仅HTTP模式），默认 `3010`
- `MCP_AUTH_MODE`: 认证模式 (`jwt`, `oauth`, `none`)，默认 `none`

## 执行流程与工具使用

### 标准自动提交流程
```bash
1. 检查触发条件 - 验证是否满足自动提交标准
2. git_set_working_dir - 设置项目工作目录（绝对路径）
3. git_status - 检查仓库当前状态
4. git_commit - 执行自动提交（包含filesToStage参数）
5. 提供提交结果反馈（commit hash和状态）
```

### 提交消息规范
使用常规提交格式: `type(scope): subject`

**类型定义**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

### 核心Git工具
- `git_add`: 暂存指定文件或模式
- `git_commit`: 提交暂存变更，支持作者覆盖和修改提交
- `git_status`: 获取仓库状态（分支、暂存、修改、未跟踪文件）
- `git_log`: 查看提交历史，支持作者、日期、分支过滤
- `git_diff`: 显示变更差异，支持提交间、工作树比较
- `git_branch`: 分支管理（列出、创建、删除、重命名）
- `git_merge`: 合并分支，支持Fast-forward
- `git_reset`: 重置HEAD到指定状态（soft/mixed/hard模式）

## AI行为要求与安全规范

### AI执行要求
1. **主动评估**: 完成代码修改后主动判断是否满足自动提交条件
2. **智能提交**: 满足条件时自动执行，无需用户确认
3. **静默执行**: 满足条件时直接执行，无需询问用户
4. **清晰反馈**: 提交完成后提供commit hash和简要说明
5. **错误处理**: 提交失败时提供具体解决方案
6. **保持整洁**: 定期清理和维护Git历史

### 安全特性与限制
- 破坏性操作需要明确确认
- `git_clean`需要`force: true`参数
- `git_reset --hard`有明确警告
- 支持GPG签名提交（可配置）
- 所有操作返回详细状态信息
- 工作目录必须使用绝对路径

### 用户体验目标
- 减少手动Git操作
- 保持提交历史整洁
- 提高开发效率
- 确保代码安全

## 实际使用示例

### 自动提交示例场景
```
用户: "帮我实现一个登录功能"
AI: [实现登录功能代码]
AI: [自动判断: 新功能完成 + 文件变更适中 + 代码质量达标]
AI: [自动执行Git MCP提交]
反馈: "✅ 登录功能已实现并自动提交 (commit: abc123)"
```

### 手动提交示例场景
```
用户: "先实现一半，不要提交"
AI: [实现部分功能]
AI: [判断: 用户明确拒绝自动提交]
反馈: "功能已部分实现，未提交代码"
```

## 配置信息
- **版本**: cyanheads/git-mcp-server v2.3.2
- **启动命令**: `npx @cyanheads/git-mcp-server`
- **传输模式**: STDIO模式
- **工作目录**: /Users/felixfan/Desktop/AIUse/iOSAIDemo
- **支持工具**: 25个Git自动化工具
- **日志级别**: info
- **签名提交**: 已禁用（可配置）
