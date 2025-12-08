# 📋 GitHub Fine-grained Personal Access Tokens 权限完整列表

## 📚 来源

本文档基于GitHub官方文档：
- [Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens?apiVersion=2022-11-28)
- API版本：2022-11-28 (latest)

## 🎯 权限分类

Fine-grained personal access tokens的权限分为三大类：
1. **Organization permissions**（组织权限）
2. **Repository permissions**（仓库权限）
3. **User permissions**（用户权限）

## 📦 Repository Permissions（仓库权限）

这是最常用的权限类别，用于GitHub MCP和GitHub Actions自动化。

### 核心权限

#### 1. **Metadata**（元数据）
- **必需权限**：Read-only（只读，通常自动勾选）
- **用途**：访问仓库的基本元数据
- **API端点示例**：
  - `GET /repos/{owner}/{repo}` - 获取仓库信息
  - `GET /repos/{owner}/{repo}/languages` - 获取仓库语言

#### 2. **Contents**（内容）
- **权限级别**：Read / Read and write
- **用途**：访问仓库内容（文件、目录）
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/contents/{path}` - 获取文件内容
  - `PUT /repos/{owner}/{repo}/contents/{path}` - 创建/更新文件
  - `DELETE /repos/{owner}/{repo}/contents/{path}` - 删除文件

#### 3. **Actions**（Actions）
- **权限级别**：Read / Read and write
- **用途**：访问GitHub Actions
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/actions/runs` - 获取工作流运行
  - `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches` - 触发工作流

#### 4. **Workflows**（工作流）
- **权限级别**：Read / Read and write
- **用途**：访问工作流文件
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/actions/workflows` - 获取工作流列表
  - `GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}` - 获取工作流详情

#### 5. **Administration**（管理）
- **权限级别**：Read / Read and write
- **用途**：管理仓库设置（**创建仓库需要此权限**）
- **API端点示例**：
  - `POST /user/repos` - 创建仓库
  - `PATCH /repos/{owner}/{repo}` - 更新仓库设置
  - `DELETE /repos/{owner}/{repo}` - 删除仓库

### 其他常用权限

#### 6. **Issues**（Issues）
- **权限级别**：Read / Read and write
- **用途**：访问和管理Issues
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/issues` - 获取Issues列表
  - `POST /repos/{owner}/{repo}/issues` - 创建Issue
  - `PATCH /repos/{owner}/{repo}/issues/{issue_number}` - 更新Issue

#### 7. **Pull requests**（Pull Requests）
- **权限级别**：Read / Read and write
- **用途**：访问和管理Pull Requests
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/pulls` - 获取PR列表
  - `POST /repos/{owner}/{repo}/pulls` - 创建PR
  - `PATCH /repos/{owner}/{repo}/pulls/{pull_number}` - 更新PR

#### 8. **Secrets**（密钥）
- **权限级别**：Read / Read and write
- **用途**：访问仓库Secrets
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/actions/secrets` - 获取Secrets列表
  - `PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}` - 创建/更新Secret

#### 9. **Variables**（变量）
- **权限级别**：Read / Read and write
- **用途**：访问仓库Variables
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/actions/variables` - 获取Variables列表
  - `POST /repos/{owner}/{repo}/actions/variables` - 创建Variable

#### 10. **Environments**（环境）
- **权限级别**：Read / Read and write
- **用途**：访问部署环境
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/environments` - 获取环境列表
  - `PUT /repos/{owner}/{repo}/environments/{environment_name}` - 创建/更新环境

#### 11. **Deployments**（部署）
- **权限级别**：Read / Read and write
- **用途**：访问部署
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/deployments` - 获取部署列表
  - `POST /repos/{owner}/{repo}/deployments` - 创建部署

#### 12. **Pages**（Pages）
- **权限级别**：Read / Read and write
- **用途**：访问GitHub Pages
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/pages` - 获取Pages信息
  - `PUT /repos/{owner}/{repo}/pages` - 更新Pages设置

#### 13. **Webhooks**（Webhooks）
- **权限级别**：Read / Read and write
- **用途**：管理仓库Webhooks
- **API端点示例**：
  - `GET /repos/{owner}/{repo}/hooks` - 获取Webhooks列表
  - `POST /repos/{owner}/{repo}/hooks` - 创建Webhook

### 安全相关权限

#### 14. **Code scanning alerts**（代码扫描警报）
- **权限级别**：Read / Read and write
- **用途**：访问代码扫描警报

#### 15. **Dependabot alerts**（Dependabot警报）
- **权限级别**：Read / Read and write
- **用途**：访问Dependabot安全警报

#### 16. **Dependabot secrets**（Dependabot密钥）
- **权限级别**：Read / Read and write
- **用途**：访问Dependabot Secrets

#### 17. **Secret scanning alerts**（密钥扫描警报）
- **权限级别**：Read / Read and write
- **用途**：访问密钥扫描警报

#### 18. **Repository security advisories**（仓库安全公告）
- **权限级别**：Read / Read and write
- **用途**：访问安全公告

### 其他权限

#### 19. **Artifact metadata**（Artifact元数据）
- **权限级别**：Read / Read and write
- **用途**：访问Artifact元数据

#### 20. **Attestations**（证明）
- **权限级别**：Read / Read and write
- **用途**：访问证明

#### 21. **Codespaces**（Codespaces）
- **权限级别**：Read / Read and write
- **用途**：访问Codespaces

#### 22. **Codespaces lifecycle admin**（Codespaces生命周期管理）
- **权限级别**：Read / Read and write
- **用途**：管理Codespaces生命周期

#### 23. **Codespaces metadata**（Codespaces元数据）
- **权限级别**：Read / Read and write
- **用途**：访问Codespaces元数据

#### 24. **Codespaces secrets**（Codespaces密钥）
- **权限级别**：Read / Read and write
- **用途**：访问Codespaces Secrets

#### 25. **Commit statuses**（提交状态）
- **权限级别**：Read / Read and write
- **用途**：访问提交状态

#### 26. **Custom properties**（自定义属性）
- **权限级别**：Read / Read and write
- **用途**：访问自定义属性

## 🏢 Organization Permissions（组织权限）

这些权限用于组织级别的操作（通常个人账户不需要）。

主要权限包括：
- API Insights
- Administration
- Blocking users
- Campaigns
- Custom organization roles
- Custom properties for organizations
- Events
- GitHub Copilot Business
- Hosted runner custom images
- Issue Types
- Members
- Network configurations
- Organization codespaces
- Organization dependabot secrets
- Organization private registries
- Projects
- Secrets
- Self-hosted runners
- Team discussions
- Variables
- Webhooks

## 👤 User Permissions（用户权限）

这些权限用于用户级别的操作。

主要权限包括：
- Block another user
- Codespaces user secrets
- Email addresses
- Followers
- GPG keys
- Gists
- Git SSH keys
- Interaction limits
- Plan
- Private repository invitations
- Profile
- SSH signing keys
- Starring
- Watching

## 🎯 对于GitHub MCP和Actions的最小必需权限

### 最小必需权限（仅读取）

- ✅ **Metadata**: Read-only（自动勾选，必需）
- ✅ **Contents**: Read（读取仓库内容）
- ✅ **Actions**: Read（读取Actions信息）
- ✅ **Workflows**: Read（读取工作流信息）

### 推荐权限（完整功能）

- ✅ **Metadata**: Read-only（自动勾选）
- ✅ **Contents**: Read and write（读写仓库内容）
- ✅ **Actions**: Read and write（触发和管理Actions）
- ✅ **Workflows**: Read and write（读取和管理工作流）
- ✅ **Issues**: Read and write（如果需要创建Issues）
- ✅ **Pull requests**: Read and write（如果需要创建PR）

### 创建仓库所需权限

- ✅ **Administration**: Read and write（**必需**，用于创建仓库）

## 📝 注意事项

1. **Metadata权限**：通常是自动勾选的，且必需
2. **创建仓库**：需要 `Administration: Read and write` 权限
3. **权限组合**：某些API端点可能需要多个权限
4. **权限验证**：如果遇到权限错误，检查API响应头中的 `X-Accepted-GitHub-Permissions`

## 🔗 参考资源

- [GitHub官方文档：Fine-grained PAT权限](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens?apiVersion=2022-11-28)
- [GitHub官方文档：管理个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens)
- [GitHub API文档](https://docs.github.com/en/rest)

