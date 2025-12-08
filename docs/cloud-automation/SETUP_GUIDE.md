# 🚀 初始设置指南：创建仓库和推送代码

## 📋 概述

本指南帮助您完成GitHub仓库的初始设置，包括创建仓库和推送代码到GitHub。这是使用GitHub Actions自动化训练的第一步。

## 📦 步骤1：创建GitHub仓库

### 方法1：通过GitHub网页创建（推荐）

1. **访问创建页面**
   - 打开：https://github.com/new
   - 或点击GitHub右上角 "+" → "New repository"

2. **填写仓库信息**
   - **Repository name**: `majiang1`
   - **Description**: `AI辅助游戏系统 - 包含麻将、井字棋和Othello AI助手`
   - **Visibility**: 
     - ✅ Public（公开，推荐用于开源项目）
     - ⬜ Private（私有，需要付费账户）

3. **重要：不要初始化**
   - ⬜ **不要勾选** "Add a README file"
   - ⬜ **不要勾选** "Add .gitignore"
   - ⬜ **不要勾选** "Choose a license"
   - 保持仓库为空

4. **创建仓库**
   - 点击绿色的 "Create repository" 按钮

5. **验证创建成功**
   - 应该看到空仓库页面
   - URL应该是：`https://github.com/business4wangyi/majiang1`
   - 页面显示："Quick setup — if you've done this kind of thing before"

### 方法2：使用GitHub CLI（如果已安装）

```bash
# 安装GitHub CLI（如果未安装）
brew install gh

# 登录GitHub
gh auth login

# 创建仓库
gh repo create majiang1 \
  --public \
  --description "AI辅助游戏系统 - 包含麻将、井字棋和Othello AI助手" \
  --clone=false
```

### ✅ 验证仓库创建成功

- **访问仓库URL**：https://github.com/business4wangyi/majiang1
- **检查仓库设置**：在仓库页面点击 "Settings"，确认Actions已启用（默认启用）

## 📤 步骤2：配置本地Git远程仓库

如果本地仓库还没有配置远程仓库：

```bash
# 添加远程仓库（HTTPS）
git remote add origin https://github.com/business4wangyi/majiang1.git

# 或使用SSH（如果已配置SSH密钥）
git remote add origin git@github.com:business4wangyi/majiang1.git

# 验证远程仓库配置
git remote -v
```

## 🔐 步骤3：推送代码到GitHub

代码已提交到本地仓库后，需要推送到GitHub。推送需要认证，有以下几种方式：

### 方式1：使用GitHub CLI（推荐）

```bash
# 登录GitHub CLI
gh auth login

# 选择：
# - GitHub.com
# - HTTPS
# - 使用token登录
# - 粘贴您的token

# 然后推送
git push -u origin develop
```

**推荐原因**：
- 已配置Token
- 自动处理认证
- 更安全

### 方式2：使用Personal Access Token

1. **获取Token**：
   - 访问：https://github.com/settings/tokens
   - 使用已创建的Token（参考 [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)）

2. **推送时使用Token**：
   ```bash
   # 推送时，用户名输入：business4wangyi
   # 密码输入：您的Personal Access Token
   git push -u origin develop
   ```

3. **或配置Git凭据助手**：
   ```bash
   # macOS
   git config --global credential.helper osxkeychain
   
   # Windows
   git config --global credential.helper wincred
   
   # Linux
   git config --global credential.helper store
   
   # 第一次推送时输入用户名和Token
   # 之后会自动保存
   ```

### 方式3：使用SSH（需要配置SSH密钥）

如果已配置SSH密钥：

```bash
# 切换到SSH URL
git remote set-url origin git@github.com:business4wangyi/majiang1.git

# 推送
git push -u origin develop
```

## ✅ 步骤4：验证推送成功

推送成功后：

1. **访问仓库页面**
   - https://github.com/business4wangyi/majiang1
   - 应该能看到所有代码文件

2. **检查分支**
   - 确认 `develop` 分支已推送
   - 可以在GitHub网页上看到代码

3. **验证工作流文件**
   - 检查 `.github/workflows/alphazero-training.yml` 是否存在
   - 如果存在，GitHub Actions会自动识别

## 🎯 下一步

完成初始设置后，您可以：

1. **部署GitHub Actions**
   - 阅读 [部署指南](DEPLOYMENT_GUIDE.md)
   - 测试工作流是否正常运行

2. **配置Token（如果还没有）**
   - 阅读 [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)
   - 配置Token以使用AI调度功能

3. **开始使用AI调度**
   - 阅读 [AI调度训练指南](AI_SCHEDULING_GUIDE.md)
   - 使用 `npm run ai:schedule-training fast` 开始训练

## 🚨 常见问题

### Q: 创建时提示仓库已存在？

**A**: 可能之前已经创建过，访问 https://github.com/business4wangyi/majiang1 检查。如果已存在，直接使用即可。

### Q: 推送时提示认证失败？

**A**: 
- 检查是否已配置Token或SSH密钥
- 使用GitHub CLI登录：`gh auth login`
- 参考 [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md)

### Q: 找不到创建仓库的按钮？

**A**: 确保已登录GitHub账户 `business4wangyi`。

### Q: 推送后看不到代码？

**A**: 
- 检查是否推送到正确的分支
- 刷新GitHub页面
- 检查远程仓库URL是否正确：`git remote -v`

## 🔗 相关文档

- [GitHub Token获取指南](GITHUB_TOKEN_SETUP.md) - 如何获取和配置Token
- [部署指南](DEPLOYMENT_GUIDE.md) - 部署和测试GitHub Actions
- [AI调度训练指南](AI_SCHEDULING_GUIDE.md) - AI直接调度训练
- [GitHub CLI文档](https://cli.github.com/manual/) - GitHub CLI使用说明

## 💡 提示

- **首次设置**：建议使用GitHub CLI，更简单安全
- **Token安全**：不要将Token提交到代码仓库
- **分支管理**：建议使用 `develop` 分支进行开发，`main` 分支用于生产

**完成初始设置后，就可以开始使用GitHub Actions自动化训练了！** 🚀

