# 🧪 GitHub Actions测试验证指南

## ✅ 部署状态

**文件已提交到本地Git仓库** ✅

提交信息：
- Commit: `c675fc0`
- 消息: "feat: 添加GitHub Actions自动化训练和AI调度功能"
- 文件: 12个文件，3102行新增代码

## 🚀 下一步：推送到GitHub并测试

### 步骤1：配置GitHub远程仓库（如果还没有）

```bash
# 检查是否已有远程仓库
git remote -v

# 如果没有，添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 或使用SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### 步骤2：推送到GitHub

```bash
# 推送到develop分支
git push origin develop

# 或首次推送
git push -u origin develop
```

### 步骤3：在GitHub网页测试

推送完成后，等待几秒钟，然后：

1. **打开GitHub仓库页面**
   - 访问 `https://github.com/YOUR_USERNAME/YOUR_REPO`
   - 点击 "Actions" 标签

2. **验证工作流已加载**
   - 应该能看到 "AlphaZero Training" 工作流
   - 如果看不到，刷新页面或等待几秒

3. **手动触发测试**
   - 点击 "AlphaZero Training" 工作流
   - 点击右侧 "Run workflow" 按钮
   - 选择：
     - Branch: `develop`
     - Training type: `fast`（快速测试，约10-30分钟）
   - 点击绿色的 "Run workflow" 按钮

4. **查看运行状态**
   - 点击运行记录
   - 查看各个步骤的执行情况：
     - ✅ Checkout code
     - ✅ Setup Node.js
     - ✅ Install dependencies
     - ⏳ Run training（需要时间）
     - ✅ Generate AI-readable training report
     - ✅ Upload training results
     - ✅ Create training report
     - ✅ Notify completion

### 步骤4：验证结果

训练完成后（约10-30分钟）：

1. **下载训练结果**
   - 在运行页面底部找到 "Artifacts"
   - 点击下载 "training-results-XXX"

2. **查看AI可读格式**
   ```bash
   # 解压下载的文件
   unzip training-results-*.zip
   
   # 查看AI摘要
   cat training-reports/ai_summary.json
   
   # 查看完整报告
   cat training-reports/training_report.json
   ```

3. **查看通知**
   - 在仓库的Issues页面
   - 应该能看到训练完成的Issue通知

## 🧪 测试检查清单

- [ ] 代码已推送到GitHub
- [ ] 在Actions页面可以看到工作流
- [ ] 可以手动触发工作流
- [ ] 工作流成功运行（所有步骤通过）
- [ ] 训练结果可以下载
- [ ] AI可读格式报告已生成
- [ ] 通知Issue已创建

## 🔧 使用GitHub CLI测试（可选）

如果已安装GitHub CLI：

```bash
# 安装GitHub CLI（如果还没有）
brew install gh
gh auth login

# 触发测试训练
gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  --ref develop

# 查看运行状态
gh run list --workflow="AlphaZero Training.yml"

# 实时监控
gh run watch

# 下载结果（运行完成后）
gh run download
```

## 📊 预期结果

### 成功的运行应该：

1. **所有步骤通过** ✅
   - Checkout code: ✅
   - Setup Node.js: ✅
   - Install dependencies: ✅
   - Run training: ✅（可能需要较长时间）
   - Generate AI-readable training report: ✅
   - Upload training results: ✅
   - Create training report: ✅
   - Notify completion: ✅

2. **生成的文件**
   - `training-reports/ai_summary.json` - AI可读摘要
   - `training-reports/training_report.json` - 完整训练报告
   - `training-reports/metadata.json` - 运行元数据
   - `src/othello/models/**` - 训练模型文件

3. **创建的通知**
   - Issue标题: "✅ 训练完成: fast (Run #X)"
   - 包含训练详情和结果链接

## ⚠️ 常见问题

### 问题1：工作流不显示

**原因**：文件路径或格式错误

**解决**：
- 检查文件路径：`.github/workflows/alphazero-training.yml`
- 检查YAML格式是否正确
- 等待几秒后刷新页面

### 问题2：推送失败

**原因**：未配置远程仓库或权限问题

**解决**：
```bash
# 检查远程仓库
git remote -v

# 如果没有，添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 检查权限
git push origin develop
```

### 问题3：训练失败

**原因**：依赖安装失败、训练脚本错误、超时

**解决**：
1. 查看运行日志，找到失败步骤
2. 检查错误信息
3. 修复问题后重新运行

### 问题4：找不到工作流

**原因**：文件未推送到GitHub或路径错误

**解决**：
- 确保已推送到GitHub
- 检查文件路径：`.github/workflows/alphazero-training.yml`
- 等待几秒后刷新Actions页面

## 🎯 快速测试命令

```bash
# 1. 检查远程仓库
git remote -v

# 2. 如果没有，添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 3. 推送代码
git push origin develop

# 4. 等待几秒后，在GitHub网页测试
# 或使用GitHub CLI（如果已安装）
gh workflow run "AlphaZero Training.yml" -f training_type=fast
```

## 📚 相关文档

- [快速开始指南](QUICK_START.md) - 5分钟快速部署
- [部署指南](DEPLOYMENT_GUIDE.md) - 详细部署步骤
- [AI调度指南](AI_SCHEDULING_GUIDE.md) - AI直接调度训练

## 💡 提示

- **首次测试**：使用 `fast` 模式，快速验证流程
- **监控资源**：免费账户每月2000分钟，合理安排
- **保存结果**：及时下载重要训练结果，Artifacts保留30天

**准备好后，推送到GitHub并开始测试吧！** 🚀

