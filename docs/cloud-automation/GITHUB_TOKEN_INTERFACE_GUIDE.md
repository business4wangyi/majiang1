# 🖥️ GitHub Fine-grained Token 创建界面指南

## ⚠️ 重要发现

在创建Fine-grained token时，权限分为**三个部分**：
1. **Repository permissions**（仓库权限）- 这是最重要的部分
2. **Organization permissions**（组织权限）- 通常不需要
3. **User permissions**（用户权限）- 您看到的"Block another user"等就在这里

## 📍 如何找到Repository Permissions

### 步骤1：进入创建Token页面

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (fine-grained)"
3. 填写Token基本信息（名称、过期时间等）

### 步骤2：选择仓库访问范围

在"Repository access"部分：
- 选择 **"All repositories"**（所有仓库）
- 或选择 **"Only select repositories"**（仅选定仓库）

### 步骤3：找到Repository Permissions部分

**关键**：在"Repository access"选择后，页面会显示**"Repository permissions"**部分。

这个部分应该显示以下权限选项：

#### 核心权限（应该能看到）

- ✅ **Actions** - Read / Read and write
- ✅ **Administration** - Read / Read and write
- ✅ **Contents** - Read / Read and write
- ✅ **Metadata** - Read-only（可能自动勾选）
- ✅ **Workflows** - Read / Read and write

#### 其他权限（应该能看到）

- **Issues** - Read / Read and write
- **Pull requests** - Read / Read and write
- **Secrets** - Read / Read and write
- **Variables** - Read / Read and write
- **Environments** - Read / Read and write
- **Deployments** - Read / Read and write
- **Pages** - Read / Read and write
- **Webhooks** - Read / Read and write
- 等等...

### 步骤4：User Permissions部分

在页面下方，您会看到**"User permissions"**部分，这里显示的是：
- Block another user
- Codespaces user secrets
- Email addresses
- Followers
- GPG keys
- Gists
- Git SSH keys
- 等等...

**这些是用户级别的权限，不是仓库权限！**

## 🎯 正确的权限选择步骤

### 完整流程

1. **填写Token信息**
   - Token name: `Cursor MCP GitHub Actions`
   - Expiration: `90 days`
   - Description: `用于Cursor MCP和GitHub Actions自动化训练`

2. **选择Repository access**
   - 选择 **"All repositories"** 或指定仓库

3. **在Repository permissions部分勾选**（重要！）
   - ✅ **Administration**: Read and write（创建仓库需要）
   - ✅ **Actions**: Read and write（触发工作流需要）
   - ✅ **Workflows**: Read and write（管理工作流需要）
   - ✅ **Contents**: Read and write（读写仓库内容需要）
   - ✅ **Metadata**: Read-only（通常自动勾选）

4. **User permissions部分**（通常不需要）
   - 保持默认（不勾选）
   - 除非您需要用户级别的操作

## 🔍 如果看不到Repository Permissions

### 可能的原因

1. **没有选择Repository access**
   - 必须先选择"All repositories"或"Only select repositories"
   - 选择后才会显示Repository permissions部分

2. **界面加载问题**
   - 刷新页面重试
   - 检查浏览器是否支持JavaScript

3. **账户类型限制**
   - 某些权限可能需要特定的账户类型
   - 检查您的GitHub账户类型

4. **GitHub界面更新**
   - GitHub可能更新了界面
   - 尝试使用不同的浏览器

### 解决方案

1. **确保选择了Repository access**
   ```
   在"Repository access"部分：
   ○ All repositories
   ○ Only select repositories
   
   必须选择其中一个，才会显示Repository permissions
   ```

2. **滚动页面查看**
   - Repository permissions可能在页面下方
   - 需要滚动才能看到

3. **检查页面结构**
   - Repository permissions应该在"Repository access"选择后立即显示
   - 在"User permissions"之前

## 📸 界面结构示意

```
┌─────────────────────────────────────┐
│ Fine-grained personal access token  │
├─────────────────────────────────────┤
│ Token name: [输入框]                │
│ Expiration: [下拉选择]               │
│ Description: [输入框]               │
├─────────────────────────────────────┤
│ Repository access                    │
│ ○ All repositories                   │
│ ○ Only select repositories          │
│   [选择仓库...]                      │
├─────────────────────────────────────┤
│ Repository permissions  ← 这里！     │
│ ☐ Administration: [Read/Write]      │
│ ☐ Actions: [Read/Write]             │
│ ☐ Workflows: [Read/Write]           │
│ ☐ Contents: [Read/Write]            │
│ ☐ Metadata: [Read-only] (自动勾选)  │
│ ...更多权限...                       │
├─────────────────────────────────────┤
│ User permissions                     │
│ ☐ Block another user                │
│ ☐ Codespaces user secrets           │
│ ☐ Email addresses                   │
│ ...更多用户权限...                   │
└─────────────────────────────────────┘
```

## ✅ 验证步骤

创建Token后，验证权限是否正确：

```bash
# 测试1：检查Token对应的用户
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user

# 测试2：测试创建仓库（需要Administration权限）
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"test-repo","private":false}'

# 测试3：测试触发工作流（需要Actions和Workflows权限）
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/WORKFLOW_ID/dispatches \
  -d '{"ref":"main"}'
```

## 🎯 最小必需权限配置

对于GitHub MCP和Actions自动化，最小配置：

### Repository permissions（必须勾选）

- ✅ **Administration**: Read and write
- ✅ **Actions**: Read and write
- ✅ **Workflows**: Read and write
- ✅ **Contents**: Read and write
- ✅ **Metadata**: Read-only（自动勾选）

### User permissions（不需要）

- 保持默认，不勾选任何选项

## 💡 常见问题

### Q1: 为什么我只看到User permissions？

**A**: 您可能还没有选择"Repository access"。必须先选择"All repositories"或"Only select repositories"，才会显示Repository permissions部分。

### Q2: Repository permissions在哪里？

**A**: Repository permissions在"Repository access"选择后，在"User permissions"之前。如果看不到，请：
1. 确保已选择Repository access
2. 滚动页面查看
3. 刷新页面重试

### Q3: 需要勾选User permissions吗？

**A**: 通常不需要。User permissions是用户级别的操作（如管理自己的GPG密钥、关注者等），与仓库操作无关。

### Q4: 如果还是看不到Repository permissions怎么办？

**A**: 
1. 尝试使用不同的浏览器
2. 清除浏览器缓存
3. 检查GitHub账户是否有任何限制
4. 参考GitHub官方文档或联系GitHub支持

## 🔗 相关文档

- [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)
- [实际需要勾选的权限](GITHUB_TOKEN_ACTUAL_PERMISSIONS.md)
- [GitHub官方文档：管理个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens)

