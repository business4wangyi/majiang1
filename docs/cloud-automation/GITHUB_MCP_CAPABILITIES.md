# 🔧 GitHub MCP 功能完整指南

## 📋 GitHub MCP 功能列表

GitHub MCP (Model Context Protocol) 提供了丰富的GitHub操作功能，以下是完整的功能列表：

### 🗂️ 仓库管理 (Repository Management)

#### ✅ 创建和配置
- **`create_repository`** - 创建新仓库
  - 支持设置名称、描述、可见性（公开/私有）
  - 支持初始化README、.gitignore、许可证
  - **问题**: 需要正确的Token权限（`repo` scope）

- **`get_file_contents`** - 获取文件或目录内容
  - 支持指定分支
  - 支持获取单个文件或整个目录

- **`create_or_update_file`** - 创建或更新文件
  - 支持提交消息
  - 支持指定分支

- **`push_files`** - 批量推送文件
  - 单次提交推送多个文件
  - 支持指定分支和提交消息

#### ✅ 分支管理
- **`create_branch`** - 创建新分支
  - 支持从指定分支创建
  - 默认从主分支创建

- **`list_commits`** - 列出提交历史
  - 支持分页
  - 支持按作者、日期、分支过滤

### 🔍 搜索功能 (Search)

- **`search_repositories`** - 搜索仓库
  - 支持GitHub搜索语法
  - 支持分页
  - 可以搜索用户、组织、关键词等

- **`search_code`** - 搜索代码
  - 跨仓库代码搜索
  - 支持复杂查询条件

- **`search_issues`** - 搜索Issues和PR
  - 支持状态、标签、作者等过滤
  - 支持排序

- **`search_users`** - 搜索用户
  - 支持按关注者、仓库数、加入时间排序

### 📝 Issues 管理 (Issues Management)

- **`create_issue`** - 创建Issue
  - 支持标题、描述、标签、里程碑、指派人

- **`get_issue`** - 获取Issue详情
  - 获取单个Issue的完整信息

- **`list_issues`** - 列出Issues
  - 支持状态、标签、作者等过滤
  - 支持排序和分页

- **`update_issue`** - 更新Issue
  - 修改标题、描述、状态、标签等

- **`add_issue_comment`** - 添加Issue评论
  - 支持Markdown格式

### 🔀 Pull Requests 管理 (Pull Requests)

- **`create_pull_request`** - 创建Pull Request
  - 支持标题、描述、源分支、目标分支
  - 支持草稿模式

- **`get_pull_request`** - 获取PR详情
  - 获取PR的完整信息

- **`list_pull_requests`** - 列出PRs
  - 支持状态、分支、排序过滤

- **`update_pull_request_branch`** - 更新PR分支
  - 与基础分支同步

- **`merge_pull_request`** - 合并PR
  - 支持merge、squash、rebase三种方式

- **`create_pull_request_review`** - 创建PR审查
  - 支持批准、请求更改、评论

- **`get_pull_request_files`** - 获取PR文件变更
- **`get_pull_request_status`** - 获取PR状态检查
- **`get_pull_request_comments`** - 获取PR评论
- **`get_pull_request_reviews`** - 获取PR审查

### 🔄 其他功能

- **`fork_repository`** - Fork仓库
  - 支持Fork到指定组织

- **`list_commits`** - 列出提交
- **`get_file_contents`** - 获取文件内容

## ❌ 为什么创建仓库失败？

### 错误信息
```
MCP error -32603: Permission Denied: Resource not accessible by personal access token
```

### 可能的原因

#### 1. Token权限不足 ⚠️
创建仓库需要 `repo` scope，但Token可能：
- 没有 `repo` 权限
- 只有 `public_repo` 权限（只能创建公开仓库）
- Token已过期

#### 2. Token对应的账户不匹配 ⚠️
- Token可能是由其他GitHub账户创建的
- 当前使用的Token不属于 `business4wangyi` 账户

#### 3. Token未正确配置 ⚠️
- Token未设置到环境变量
- Cursor MCP配置中Token格式错误
- Token包含特殊字符未正确转义

#### 4. GitHub API限制 ⚠️
- 达到API速率限制
- 账户被限制创建仓库

## 🔧 解决方案

### 方案1：检查并更新Token权限

#### 步骤1：验证当前Token

```bash
# 检查Token对应的账户
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user

# 应该返回：
# {
#   "login": "business4wangyi",
#   ...
# }
```

#### 步骤2：创建新Token（如果需要）

1. 访问：https://github.com/settings/tokens
2. 使用 **`business4wangyi`** 账户登录
3. 点击 "Generate new token (classic)"
4. **重要权限**：
   - ✅ `repo` - 完整仓库访问权限（包括创建仓库）
   - ✅ `workflow` - GitHub Actions权限
   - ✅ `admin:repo_hook` - 仓库Webhooks（可选）
5. 生成并复制Token

#### 步骤3：更新Token配置

**方法A：环境变量**
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxx"
```

**方法B：Cursor MCP配置**
在Cursor的MCP配置文件中更新Token

### 方案2：使用GitHub CLI（替代方案）

如果MCP无法工作，可以使用GitHub CLI：

```bash
# 安装GitHub CLI
brew install gh

# 登录
gh auth login

# 创建仓库
gh repo create majiang1 \
  --public \
  --description "AI辅助游戏系统 - 包含麻将、井字棋和Othello AI助手" \
  --clone=false
```

### 方案3：手动创建（最简单）

1. 访问：https://github.com/new
2. 填写仓库信息
3. 点击创建

## 🧪 测试GitHub MCP功能

### 测试1：搜索仓库（不需要写权限）

```typescript
// 使用GitHub MCP搜索
mcp_github_search_repositories({
  q: "user:business4wangyi",
  perPage: 10
})
```

### 测试2：获取仓库信息（不需要写权限）

```typescript
// 获取仓库内容
mcp_github_get_file_contents({
  owner: "business4wangyi",
  repo: "majiang1",
  path: "README.md"
})
```

### 测试3：创建Issue（需要repo权限）

```typescript
// 创建Issue测试
mcp_github_create_issue({
  owner: "business4wangyi",
  repo: "majiang1",
  title: "测试Issue",
  body: "这是一个测试Issue"
})
```

## 📊 功能权限对照表

| 功能 | 所需权限 | 说明 |
|------|---------|------|
| 搜索仓库 | 无 | 公开信息，无需Token |
| 获取文件 | `repo` (私有) | 公开仓库无需Token |
| 创建仓库 | `repo` | 需要完整repo权限 |
| 创建Issue | `repo` | 需要repo权限 |
| 创建PR | `repo` | 需要repo权限 |
| 合并PR | `repo` (写权限) | 需要仓库写权限 |
| 创建分支 | `repo` | 需要repo权限 |
| 推送文件 | `repo` | 需要repo权限 |

## 🎯 推荐工作流程

### 对于创建仓库

1. **首选**：手动在GitHub网页创建（最简单可靠）
2. **备选**：使用GitHub CLI（如果已安装）
3. **最后**：使用GitHub MCP（需要正确配置Token）

### 对于其他操作

- **搜索、读取**：GitHub MCP很好用
- **创建Issue/PR**：GitHub MCP很方便
- **批量操作**：GitHub MCP的`push_files`很有用

## 📚 相关文档

- [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)
- [Token配置检查报告](TOKEN_CONFIGURATION_REPORT.md)
- [GitHub MCP连接修复](GITHUB_MCP_CONNECTION_FIX.md)

## 💡 总结

**GitHub MCP功能很强大**，包括：
- ✅ 仓库管理（创建、读取、更新）
- ✅ 搜索功能（仓库、代码、Issues、用户）
- ✅ Issues管理（创建、更新、评论）
- ✅ Pull Requests管理（创建、合并、审查）
- ✅ 分支和提交管理

**但创建仓库失败是因为**：
- ❌ Token权限不足或配置不正确
- ❌ Token对应的账户不匹配

**建议**：
1. 先手动创建仓库（最简单）
2. 然后使用GitHub MCP进行其他操作
3. 配置正确的Token后，MCP的其他功能会很好用

