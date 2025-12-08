# 🔑 GitHub Token获取和配置指南

## 📋 概述

本指南详细说明如何获取GitHub Personal Access Token（个人访问令牌），并配置到GitHub MCP服务器中，用于GitHub Actions自动化训练和AI调度功能。

## 🎯 为什么需要GitHub Token

GitHub Token用于：
- ✅ 通过GitHub API触发工作流
- ✅ 通过GitHub CLI操作仓库
- ✅ AI调度脚本访问GitHub Actions
- ✅ 下载训练结果和Artifacts
- ✅ 创建Issues和Pull Requests

## 🔐 步骤1：创建GitHub Personal Access Token

### 方法1：通过GitHub网页创建（推荐）

#### 1. 登录GitHub

访问 [GitHub](https://github.com) 并使用您的账户登录。

#### 2. 进入开发者设置

1. 点击右上角的**头像**
2. 选择 **"Settings"**（设置）
3. 在左侧边栏底部，点击 **"Developer settings"**（开发者设置）

#### 3. 创建个人访问令牌

1. 在左侧边栏中，点击 **"Personal access tokens"**（个人访问令牌）
2. 选择 **"Tokens (classic)"** 或 **"Fine-grained tokens"**（细粒度令牌）

**推荐使用 Fine-grained tokens（更安全）**：
- 点击 **"Generate new token"** → **"Generate new token (fine-grained)"**

**或使用 Classic tokens（更简单）**：
- 点击 **"Generate new token"** → **"Generate new token (classic)"**

#### 4. 配置令牌信息

**Fine-grained tokens配置**：

1. **Token name**（令牌名称）：
   ```
   Cursor MCP GitHub Actions
   ```

2. **Description**（描述，可选）：
   ```
   用于Cursor MCP和GitHub Actions自动化训练
   ```

3. **Expiration**（过期时间）：
   - 选择 **"90 days"**（90天）或 **"Custom"**（自定义）
   - 建议：首次使用选择较短时间，测试通过后可以延长

4. **Repository access**（仓库访问）：
   - 选择 **"Only select repositories"**（仅选定的仓库）
   - 选择您要使用的仓库
   - 或选择 **"All repositories"**（所有仓库，如果信任）

5. **Repository permissions**（仓库权限）：
   
   ⚠️ **重要**：根据实际创建Token时的界面，某些权限（如Metadata、Contents）可能**不在界面上显示**。这可能是GitHub界面更新导致的。
   
   📚 **参考文档**：
   - [实际需要勾选的权限](GITHUB_TOKEN_ACTUAL_PERMISSIONS.md) - 基于实际界面
   - [完整权限列表](GITHUB_FINE_GRAINED_PERMISSIONS.md) - 所有可用权限
   
   **实际需要勾选的权限**（如果界面显示）：
   
   **必需权限**：
   - ✅ **Administration**: Read and write（**必需**，用于创建仓库）
   - ✅ **Actions**: Read and write（**必需**，用于触发工作流）
   - ✅ **Workflows**: Read and write（**必需**，用于管理工作流）
   
   **可选权限**（根据需求勾选）：
   - ✅ **Contents**: Read and write（如果界面显示，用于读写仓库内容）
   - ✅ **Issues**: Read and write（如果需要创建Issues）
   - ✅ **Pull requests**: Read and write（如果需要创建PR）
   - ✅ **Secrets**: Read and write（如果需要管理Secrets）
   - ✅ **Variables**: Read and write（如果需要管理Variables）
   - ✅ **Environments**: Read and write（如果需要管理环境）
   - ✅ **Deployments**: Read and write（如果需要管理部署）
   - ✅ **Pages**: Read and write（如果需要管理Pages）
   - ✅ **Webhooks**: Read and write（如果需要管理Webhooks）
   
   **关于Metadata和Contents权限**：
   - ⚠️ 如果界面**没有显示**这些权限选项，可能：
     1. 已自动包含在其他权限中（如Administration）
     2. 已合并到其他权限
     3. GitHub界面已更新，显示方式不同
   - 💡 **建议**：创建Token后测试，如果权限不足，查看API错误响应中的 `X-Accepted-GitHub-Permissions` 头
   
   **测试Token权限**：
   ```bash
   # 测试创建仓库（需要Administration权限）
   curl -X POST \
     -H "Authorization: token YOUR_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d '{"name":"test-repo","private":false}'
   
   # 如果失败，检查响应头中的 X-Accepted-GitHub-Permissions
   ```

6. **Account permissions**（账户权限）：
   - 通常不需要额外权限
   - 保持默认即可
   - 如果创建仓库失败，可能需要检查是否有 **Administration** 相关权限

7. **点击 "Generate token"**（生成令牌）

**Classic tokens配置**：

1. **Note**（备注）：
   ```
   Cursor MCP GitHub Actions
   ```

2. **Expiration**（过期时间）：
   - 选择 **"90 days"**（90天）或自定义

3. **Select scopes**（选择权限范围）：
   
   ⚠️ **注意**：Classic tokens的权限选项是固定的，但GitHub可能会更新。请根据实际显示的权限选项进行选择。
   
   **必需权限**（用于GitHub MCP和Actions）：
   - ✅ **repo** - 完整仓库访问权限（包含所有仓库操作）
     - 勾选 `repo` 会自动包含以下子权限：
       - `repo:status` - 访问提交状态
       - `repo_deployment` - 访问部署状态
       - `public_repo` - 访问公共仓库
       - `repo:invite` - 访问仓库邀请
       - `security_events` - 访问安全事件
   - ✅ **workflow** - 更新GitHub Actions工作流（用于触发和管理工作流）
   
   **可选权限**（根据需要选择）：
   - `write:packages` - 上传包（如果需要发布包）
   - `read:packages` - 下载包（如果需要下载包）
   - `admin:repo_hook` - 管理仓库Webhooks（如果需要）
   - `delete_repo` - 删除仓库（如果需要）
   
   💡 **提示**：`repo` 权限是最重要的，它包含了创建、读取、更新仓库所需的所有权限。

4. **点击 "Generate token"**（生成令牌）

#### 5. 复制并保存令牌

⚠️ **重要**：令牌**只会显示一次**，请立即复制并妥善保存！

```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**保存方式**：
1. 复制到密码管理器（推荐）
2. 保存到安全的位置
3. **不要**提交到Git仓库
4. **不要**分享给他人

## 🔧 步骤2：配置到Cursor MCP

### 方法1：配置到Cursor MCP服务器（推荐）

#### 1. 找到Cursor MCP配置文件

Cursor的MCP配置文件通常位于：
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

或者通过Cursor设置：
1. 打开Cursor
2. 按 `Cmd/Ctrl + ,` 打开设置
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 找到MCP服务器配置

#### 2. 添加GitHub MCP服务器配置

在MCP配置文件中添加：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

**替换** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 为您刚才复制的token。

#### 3. 使用环境变量（更安全，推荐）

为了避免在配置文件中直接暴露token，可以使用环境变量：

**macOS/Linux**：

1. 编辑 `~/.zshrc` 或 `~/.bashrc`：
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

2. 重新加载配置：
   ```bash
   source ~/.zshrc
   # 或
   source ~/.bashrc
   ```

3. 在MCP配置文件中引用：
   ```json
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
         }
       }
     }
   }
   ```

**Windows**：

1. 打开"环境变量"设置：
   - 搜索 "环境变量"
   - 或：系统属性 → 高级 → 环境变量

2. 添加新的用户变量：
   - 变量名：`GITHUB_PERSONAL_ACCESS_TOKEN`
   - 变量值：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. 在MCP配置文件中引用（同上）

### 方法2：配置到GitHub CLI

#### 1. 安装GitHub CLI

```bash
# macOS
brew install gh

# Windows
# 下载安装包：https://cli.github.com/
# 或使用 winget
winget install GitHub.cli

# Linux
# 参考：https://cli.github.com/manual/installation
```

#### 2. 登录GitHub CLI

```bash
# 使用token登录
gh auth login --with-token <<< "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 或交互式登录
gh auth login
# 选择：
# - GitHub.com
# - HTTPS
# - 使用token登录
# - 粘贴您的token
```

#### 3. 验证登录

```bash
# 检查登录状态
gh auth status

# 测试API访问
gh api user
```

## 🧪 步骤3：测试Token

### 测试1：GitHub CLI测试

```bash
# 测试基本访问
gh api user

# 测试仓库访问
gh repo view YOUR_USERNAME/YOUR_REPO

# 测试工作流访问
gh workflow list
```

### 测试2：API直接测试

```bash
# 使用curl测试
curl -H "Authorization: token ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  https://api.github.com/user

# 应该返回您的用户信息
```

### 测试3：触发工作流测试

```bash
# 使用GitHub CLI触发工作流
gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  --ref develop

# 查看运行状态
gh run list --workflow="AlphaZero Training.yml"
```

### 测试4：AI调度脚本测试

```bash
# 使用AI调度脚本
npm run ai:schedule-training fast

# 应该能够成功触发训练
```

## 🔒 安全最佳实践

### 1. Token安全

- ✅ **不要**将token提交到Git仓库
- ✅ **不要**在公开场合分享token
- ✅ **不要**在代码中硬编码token
- ✅ 使用环境变量存储token
- ✅ 定期轮换token（每90天）
- ✅ 使用最小权限原则（只授予必要的权限）

### 2. 添加到.gitignore

确保 `.gitignore` 包含：

```
# GitHub Token
.env
*.token
*_token.txt
```

### 3. 使用环境变量文件（.env）

创建 `.env` 文件（不要提交到Git）：

```bash
# .env
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

在代码中读取：

```typescript
// 使用 dotenv 包
import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
```

## 🔄 步骤4：更新或撤销Token

### 更新Token

如果token过期或需要更新：

1. 按照步骤1创建新token
2. 更新环境变量或配置文件
3. 重新加载配置
4. 测试新token

### 撤销Token

如果需要撤销token：

1. 访问 GitHub → Settings → Developer settings → Personal access tokens
2. 找到要撤销的token
3. 点击 **"Revoke"**（撤销）
4. 确认撤销

## ⚠️ 重要说明

### 权限选项可能会变化

GitHub的权限选项可能会根据以下因素而变化：
- GitHub平台更新
- 账户类型（个人账户 vs 组织账户）
- 组织设置
- Fine-grained tokens vs Classic tokens

**建议**：
1. 创建Token时，请根据实际界面显示的权限选项进行选择
2. 如果遇到权限不足的问题，参考GitHub官方文档获取最新信息
3. 优先使用Fine-grained tokens，权限更细粒度，更安全

### 创建仓库所需的权限

如果使用Token创建仓库失败，可能需要：
- **Fine-grained tokens**: `Administration` 权限（Read and write）
- **Classic tokens**: `repo` 权限（已包含创建仓库权限）

如果Token权限不足，建议：
1. 手动在GitHub网页创建仓库（最简单）
2. 或使用GitHub CLI创建（如果已安装）
3. 或更新Token权限后重试

## 📚 相关资源

- [GitHub官方文档：创建个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub官方文档：Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens)
- [GitHub官方文档：Classic personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#classic-personal-access-tokens)
- [GitHub CLI文档](https://cli.github.com/manual/)
- [GitHub API文档](https://docs.github.com/en/rest)
- [MCP GitHub服务器文档](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

## 🎯 快速检查清单

- [ ] 已创建GitHub Personal Access Token
- [ ] Token已复制并安全保存
- [ ] 已配置到Cursor MCP（或环境变量）
- [ ] GitHub CLI已安装并登录
- [ ] Token测试通过
- [ ] 可以触发GitHub Actions工作流
- [ ] AI调度脚本可以正常工作

## 💡 常见问题

### Q1: Token在哪里使用？

**A**: Token用于：
- GitHub CLI (`gh` 命令)
- GitHub API调用
- AI调度脚本 (`scripts/ai-scheduler/github-actions-trigger.ts`)
- Cursor MCP GitHub服务器

### Q2: Token过期了怎么办？

**A**: 
1. 创建新token
2. 更新环境变量或配置文件
3. 重新加载配置
4. 测试新token

### Q3: 如何检查Token权限？

**A**: 
```bash
# 使用GitHub CLI
gh auth status

# 或访问GitHub网页
# Settings → Developer settings → Personal access tokens
```

### Q4: Token可以用于多个仓库吗？

**A**: 可以。在创建token时：
- Fine-grained tokens: 选择 "All repositories" 或指定多个仓库
- Classic tokens: `repo` 权限默认包含所有仓库

### Q5: 如何提高安全性？

**A**: 
1. 使用Fine-grained tokens（细粒度权限）
2. 只授予必要的权限
3. 设置较短的过期时间
4. 使用环境变量存储
5. 定期轮换token

## 🎉 完成

配置完成后，您可以：

1. ✅ 使用GitHub CLI操作仓库
2. ✅ 通过API触发GitHub Actions
3. ✅ 使用AI调度脚本自动训练
4. ✅ 下载训练结果和Artifacts

**开始使用GitHub Actions自动化训练吧！** 🚀

