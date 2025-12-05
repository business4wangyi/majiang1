# 🚀 GitHub Actions部署和测试指南

## 📋 概述

本指南说明如何部署和测试GitHub Actions自动化训练流程。

## ✅ 前置条件

### 1. GitHub仓库

确保您的项目已推送到GitHub：
- 公共仓库：完全免费使用GitHub Actions
- 私有仓库：需要GitHub Pro账户或使用免费额度

### 2. GitHub CLI（可选，用于测试）

```bash
# macOS
brew install gh

# 登录
gh auth login
```

### 3. 项目依赖

确保项目根目录有：
- `package.json` - 包含训练脚本
- `.github/workflows/alphazero-training.yml` - GitHub Actions工作流

## 🚀 部署步骤

### 步骤1：提交工作流文件

```bash
# 添加工作流文件
git add .github/workflows/alphazero-training.yml

# 提交
git commit -m "feat: 添加GitHub Actions自动化训练工作流"

# 推送到GitHub
git push origin develop
```

### 步骤2：验证工作流文件

在GitHub仓库页面：
1. 点击 "Actions" 标签
2. 应该能看到 "AlphaZero Training" 工作流
3. 如果看不到，检查文件路径是否正确：`.github/workflows/alphazero-training.yml`

### 步骤3：首次测试运行

#### 方式1：手动触发（推荐）

1. 在GitHub仓库页面，点击 "Actions" 标签
2. 选择 "AlphaZero Training" 工作流
3. 点击 "Run workflow" 按钮
4. 选择：
   - Branch: `develop`（或您的主分支）
   - Training type: `fast`（快速测试）
5. 点击 "Run workflow"

#### 方式2：使用GitHub CLI

```bash
# 确保已登录
gh auth login

# 触发快速训练测试
gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  --ref develop
```

#### 方式3：代码推送触发

```bash
# 修改训练相关文件（触发自动运行）
git commit --allow-empty -m "test: 触发GitHub Actions训练测试"
git push origin develop
```

## 🧪 测试验证

### 1. 检查工作流状态

```bash
# 查看运行列表
gh run list --workflow="AlphaZero Training.yml"

# 查看最新运行
gh run view --web
```

### 2. 查看运行日志

在GitHub Actions页面：
1. 点击运行记录
2. 点击 "train" job
3. 查看各个步骤的日志

### 3. 验证训练结果

```bash
# 下载训练结果
gh run download RUN_ID

# 查看AI可读格式的报告
cat training-reports/ai_summary.json
cat training-reports/training_report.json
```

### 4. 验证Artifacts

在GitHub Actions页面：
1. 滚动到页面底部
2. 应该能看到 "training-results-XXX" artifact
3. 点击下载

## 🔧 故障排查

### 问题1：工作流不显示

**原因**：文件路径或格式错误

**解决方案**：
```bash
# 检查文件路径
ls -la .github/workflows/

# 检查YAML格式
yamllint .github/workflows/alphazero-training.yml
```

### 问题2：工作流运行失败

**常见原因**：
- 依赖安装失败
- 训练脚本错误
- 超时

**解决方案**：
1. 查看运行日志，找到失败步骤
2. 检查错误信息
3. 修复问题后重新运行

### 问题3：无法触发工作流

**原因**：分支或路径配置不正确

**解决方案**：
检查 `.github/workflows/alphazero-training.yml` 中的：
- `push.branches` - 确保包含您的分支
- `push.paths` - 确保路径正确

### 问题4：训练超时

**原因**：训练时间超过6小时（免费账户限制）

**解决方案**：
1. 减少训练迭代次数
2. 使用快速训练模式
3. 或升级到GitHub Pro

## 📊 测试检查清单

- [ ] 工作流文件已提交到GitHub
- [ ] 工作流在Actions页面可见
- [ ] 可以手动触发工作流
- [ ] 工作流可以成功运行
- [ ] 训练结果可以下载
- [ ] AI可读格式报告已生成
- [ ] 通知Issue已创建（如果成功）
- [ ] 定时触发已配置（可选）

## 🎯 快速测试命令

```bash
# 1. 提交工作流
git add .github/workflows/alphazero-training.yml
git commit -m "feat: 添加GitHub Actions训练工作流"
git push origin develop

# 2. 等待几秒后触发测试
gh workflow run "AlphaZero Training.yml" -f training_type=fast

# 3. 查看运行状态
gh run watch

# 4. 下载结果（运行完成后）
gh run download
```

## 💡 最佳实践

1. **首次测试使用快速模式**
   - 使用 `fast` 训练类型
   - 减少迭代次数
   - 快速验证流程

2. **逐步增加复杂度**
   - 先测试快速训练
   - 再测试标准训练
   - 最后测试完整训练

3. **监控资源使用**
   - 查看GitHub Actions使用情况
   - 免费账户每月2000分钟
   - 合理安排训练频率

4. **保存重要结果**
   - 及时下载训练结果
   - Artifacts保留30天
   - 重要结果备份到其他位置

## 📚 相关资源

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [GitHub CLI文档](https://cli.github.com/manual/)
- [AI调度训练指南](AI_SCHEDULING_GUIDE.md)

## 🎉 部署完成

部署完成后，您可以：

1. **随时手动触发训练**
   - GitHub网页：Actions → Run workflow
   - GitHub CLI：`gh workflow run`

2. **AI直接调度训练**
   - 使用 `npm run ai:schedule-training fast`
   - AI自动等待并获取结果

3. **定时自动训练**
   - 每天凌晨2点UTC自动运行
   - 无需手动操作

**开始您的第一个自动化训练吧！** 🚀

