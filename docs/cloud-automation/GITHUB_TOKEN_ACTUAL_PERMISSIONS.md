# ✅ GitHub Fine-grained Token 实际需要勾选的权限

## ⚠️ 重要发现

根据实际创建Token时的界面，**Metadata** 和 **Contents** 等权限可能：
1. **不在界面上显示**（可能已自动包含或合并）
2. **需要手动勾选**（但界面可能没有显示）

## 📋 实际创建Token时需要勾选的权限

### 情况1：如果界面显示权限选项

如果GitHub创建Token界面显示了权限选项，请勾选以下权限：

#### 最小必需权限（用于GitHub MCP和Actions）

- ✅ **Contents**: Read and write（如果显示）
- ✅ **Actions**: Read and write（如果显示）
- ✅ **Workflows**: Read and write（如果显示）

#### 创建仓库所需权限

- ✅ **Administration**: Read and write（**必需**，用于创建仓库）

#### 可选权限（根据需求）

- ✅ **Issues**: Read and write（如果需要创建Issues）
- ✅ **Pull requests**: Read and write（如果需要创建PR）
- ✅ **Secrets**: Read and write（如果需要管理Secrets）
- ✅ **Variables**: Read and write（如果需要管理Variables）

### 情况2：如果界面没有显示某些权限选项

如果界面没有显示 **Metadata**、**Contents** 等权限选项，可能的原因：

1. **权限已自动包含**：
   - 某些基础权限（如Metadata）可能在创建Token时自动包含
   - 但根据GitHub官方文档，Fine-grained token默认不包含任何权限

2. **权限合并**：
   - GitHub可能将某些权限合并到其他权限中
   - 例如：Contents权限可能包含在Administration中

3. **界面更新**：
   - GitHub界面可能已更新，权限显示方式不同
   - 某些权限可能在不同位置显示

## 🎯 推荐操作步骤

### 步骤1：创建Token时

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (fine-grained)"
3. 填写Token信息
4. **查看实际显示的权限选项**
5. **勾选所有显示的权限选项**（根据需求）

### 步骤2：测试Token权限

创建Token后，测试以下操作：

```bash
# 测试1：访问公开仓库（可能不需要权限）
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/octocat/Hello-World

# 测试2：访问私有仓库（需要Contents权限）
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO

# 测试3：触发工作流（需要Actions和Workflows权限）
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/WORKFLOW_ID/dispatches \
  -d '{"ref":"main"}'

# 测试4：创建仓库（需要Administration权限）
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"test-repo","private":false}'
```

### 步骤3：检查API响应头

如果遇到权限错误，检查API响应头：

```bash
curl -I -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO

# 查看 X-Accepted-GitHub-Permissions 头
# 这个头会告诉您需要什么权限
```

## 📝 实际需要勾选的权限清单

基于GitHub官方文档和实际使用经验，以下是**实际需要勾选的权限**：

### ✅ 必须勾选（如果界面显示）

1. **Administration**: Read and write
   - **用途**：创建、更新、删除仓库
   - **必需**：是（如果要用Token创建仓库）

2. **Actions**: Read and write
   - **用途**：触发和管理GitHub Actions
   - **必需**：是（如果要用Token触发工作流）

3. **Workflows**: Read and write
   - **用途**：读取和管理工作流文件
   - **必需**：是（如果要用Token管理工作流）

### ⚠️ 可能自动包含（如果界面不显示）

1. **Metadata**: Read-only
   - **状态**：可能自动包含或合并到其他权限
   - **用途**：访问仓库基本元数据

2. **Contents**: Read and write
   - **状态**：可能合并到Administration中
   - **用途**：访问仓库内容

### 🔍 如何确认权限

如果界面没有显示某些权限，可以通过以下方式确认：

1. **创建Token后测试**：
   - 尝试使用Token访问需要该权限的API端点
   - 如果成功，说明权限已包含
   - 如果失败，检查错误信息中的 `X-Accepted-GitHub-Permissions` 头

2. **查看Token详情**：
   - 创建Token后，在Token列表页面查看Token详情
   - 应该能看到Token实际拥有的权限列表

3. **使用GitHub CLI**：
   ```bash
   gh auth status
   # 查看当前Token的权限
   ```

## 🎯 针对不同用途的权限配置

### 用途1：仅用于GitHub MCP（读取操作）

如果只需要读取仓库信息，可能只需要：
- **Metadata**: Read-only（如果显示）
- 或者不勾选任何权限（如果访问公开仓库）

### 用途2：用于GitHub Actions自动化

需要勾选：
- ✅ **Actions**: Read and write
- ✅ **Workflows**: Read and write
- ✅ **Contents**: Read and write（如果显示）

### 用途3：创建仓库

需要勾选：
- ✅ **Administration**: Read and write（**必需**）

### 用途4：完整功能（推荐）

勾选以下所有权限（如果界面显示）：
- ✅ **Administration**: Read and write
- ✅ **Actions**: Read and write
- ✅ **Workflows**: Read and write
- ✅ **Contents**: Read and write（如果显示）
- ✅ **Issues**: Read and write（如果需要）
- ✅ **Pull requests**: Read and write（如果需要）
- ✅ **Secrets**: Read and write（如果需要）
- ✅ **Variables**: Read and write（如果需要）

## 💡 建议

1. **先创建Token测试**：
   - 创建Token时，勾选所有显示的权限选项
   - 然后测试Token是否能完成所需操作

2. **如果权限不足**：
   - 查看API错误响应中的 `X-Accepted-GitHub-Permissions` 头
   - 根据错误信息更新Token权限

3. **最小权限原则**：
   - 只勾选实际需要的权限
   - 如果某些权限不在界面显示，可能已自动包含或不需要

4. **参考官方文档**：
   - [GitHub官方文档：Fine-grained PAT权限](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens?apiVersion=2022-11-28)
   - 每个API端点文档会说明需要什么权限

## 🔗 相关文档

- [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)
- [GitHub Fine-grained权限完整列表](GITHUB_FINE_GRAINED_PERMISSIONS.md)
- [GitHub官方文档：管理个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens)

