# ⚡ 快速开始：GitHub Actions自动化训练

## 🚀 5分钟快速部署

### 步骤1：提交文件到Git

```bash
# 添加所有新文件
git add .github/
git add docs/cloud-automation/
git add scripts/ai-scheduler/
git add package.json
git add README.md

# 提交
git commit -m "feat: 添加GitHub Actions自动化训练和AI调度功能"

# 推送到GitHub
git push origin develop
```

### 步骤2：在GitHub网页测试

1. **打开GitHub仓库页面**
   - 访问您的GitHub仓库
   - 点击 "Actions" 标签

2. **找到工作流**
   - 应该能看到 "AlphaZero Training" 工作流
   - 如果看不到，等待几秒刷新页面

3. **手动触发测试**
   - 点击 "AlphaZero Training" 工作流
   - 点击右侧 "Run workflow" 按钮
   - 选择：
     - Branch: `develop`
     - Training type: `fast`（快速测试）
   - 点击绿色的 "Run workflow" 按钮

4. **查看运行状态**
   - 点击运行记录
   - 查看各个步骤的执行情况
   - 等待训练完成（快速模式约10-30分钟）

### 步骤3：验证结果

训练完成后：

1. **下载训练结果**
   - 在运行页面底部找到 "Artifacts"
   - 点击下载 "training-results-XXX"

2. **查看AI可读格式**
   - 解压下载的文件
   - 查看 `training-reports/ai_summary.json`
   - 查看 `training-reports/training_report.json`

3. **查看通知**
   - 在仓库的Issues页面
   - 应该能看到训练完成的Issue通知

## 🧪 测试验证清单

- [ ] 工作流文件已提交到GitHub
- [ ] 在Actions页面可以看到工作流
- [ ] 可以手动触发工作流
- [ ] 工作流成功运行
- [ ] 训练结果可以下载
- [ ] AI可读格式报告已生成
- [ ] 通知Issue已创建

## 🎯 下一步

### 使用AI调度（研发阶段）

```bash
# 安装GitHub CLI（如果还没有）
brew install gh
gh auth login

# 使用AI调度脚本
npm run ai:schedule-training fast
```

### 启用定时训练（生产环境）

编辑 `.github/workflows/alphazero-training.yml`，取消注释定时触发部分。

### 启用代码推送触发

编辑 `.github/workflows/alphazero-training.yml`，取消注释push触发部分。

## 📚 详细文档

- [部署指南](DEPLOYMENT_GUIDE.md) - 详细部署步骤
- [AI调度指南](AI_SCHEDULING_GUIDE.md) - AI直接调度训练
- [自动化方案指南](CLOUD_DEVELOPMENT_AUTOMATION_GUIDE.md) - 所有自动化方案

## 💡 提示

- **首次测试**：使用 `fast` 模式，快速验证流程
- **监控资源**：免费账户每月2000分钟，合理安排
- **保存结果**：及时下载重要训练结果，Artifacts保留30天

**开始您的第一个自动化训练吧！** 🚀

