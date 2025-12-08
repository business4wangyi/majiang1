# ✅ GitHub Token权限验证文档

## 📋 说明

本文档用于验证GitHub Token创建时实际可用的权限选项，确保文档准确性。

## 🔍 需要验证的权限

### Fine-grained Tokens (细粒度令牌)

在创建Fine-grained token时，实际可用的Repository permissions包括：

**需要验证的权限**：
- [ ] Actions (Read / Read and write)
- [ ] Contents (Read / Read and write)
- [ ] Issues (Read / Read and write)
- [ ] Metadata (Read-only，自动勾选)
- [ ] Pull requests (Read / Read and write)
- [ ] Workflows (Read / Read and write)

**其他可能存在的权限**：
- [ ] Administration (Read / Read and write)
- [ ] Secrets (Read / Read and write)
- [ ] Variables (Read / Read and write)
- [ ] Environments (Read / Read and write)
- [ ] Deployments (Read / Read and write)
- [ ] Pages (Read / Read and write)
- [ ] Security events (Read / Read and write)

### Classic Tokens (经典令牌)

在创建Classic token时，实际可用的Scopes包括：

**需要验证的权限**：
- [ ] repo (完整仓库访问)
  - [ ] repo:status
  - [ ] repo_deployment
  - [ ] public_repo
  - [ ] repo:invite
  - [ ] security_events
- [ ] workflow (GitHub Actions工作流)
- [ ] write:packages
- [ ] read:packages

**其他可能存在的权限**：
- [ ] admin:repo_hook
- [ ] admin:org
- [ ] admin:org_hook
- [ ] admin:public_key
- [ ] admin:gpg_key
- [ ] gist
- [ ] notifications
- [ ] user
- [ ] delete_repo

## 📝 实际创建Token时的步骤记录

### Fine-grained Token创建流程

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (fine-grained)"
3. 填写Token name和Description
4. 选择Expiration
5. 选择Repository access（All repositories 或 Only select repositories）
6. **查看Repository permissions列表**（记录实际显示的权限）
7. **查看Account permissions列表**（记录实际显示的权限）
8. 点击 "Generate token"

### Classic Token创建流程

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写Note
4. 选择Expiration
5. **查看Select scopes列表**（记录实际显示的权限）
6. 勾选所需权限
7. 点击 "Generate token"

## 🎯 最小必需权限

对于GitHub MCP和GitHub Actions自动化，最小必需权限：

### Fine-grained Token
- ✅ **Contents**: Read and write（读写仓库内容）
- ✅ **Metadata**: Read-only（自动勾选）
- ✅ **Actions**: Read and write（读写Actions）
- ✅ **Workflows**: Read and write（读写工作流）

### Classic Token
- ✅ **repo**（完整仓库访问，包含所有子权限）
- ✅ **workflow**（GitHub Actions工作流）

## 📚 参考资源

- [GitHub官方文档：Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens)
- [GitHub官方文档：Classic personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#classic-personal-access-tokens)
- [GitHub API文档：权限范围](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

## ⚠️ 注意事项

1. GitHub的权限选项可能会更新
2. Fine-grained tokens和Classic tokens的权限选项不同
3. 某些权限可能需要特定的账户类型或组织设置
4. 建议参考GitHub官方文档获取最新信息

