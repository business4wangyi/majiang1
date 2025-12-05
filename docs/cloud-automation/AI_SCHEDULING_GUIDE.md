# 🤖 AI调度训练指南

## 📋 概述

本指南说明如何让AI直接调度GitHub Actions训练任务，并获取AI可读格式的训练结果。

## ✅ GitHub Actions调度能力

### 1. 支持随时调度

GitHub Actions支持**任何时候**通过以下方式触发：

- ✅ **API触发**：通过GitHub API随时触发
- ✅ **CLI触发**：通过GitHub CLI随时触发
- ✅ **手动触发**：在GitHub网页随时手动触发
- ✅ **定时触发**：按cron表达式定时触发
- ✅ **事件触发**：代码推送等事件自动触发

**无时间限制**：可以随时触发，不受限制。

### 2. AI可读的数据格式

训练结果以**标准JSON格式**输出，AI可以直接读取：

- ✅ `training_report.json` - 完整训练报告（JSON格式）
- ✅ `metadata.json` - 运行元数据（JSON格式）
- ✅ `ai_summary.json` - AI可读摘要（JSON格式）
- ✅ `metrics.jsonl` - 训练指标（JSONL格式，每行一个JSON对象）

## 🚀 快速开始

### 方式1：使用AI调度脚本（推荐）

#### 1. 安装GitHub CLI

```bash
# macOS
brew install gh

# 或访问 https://cli.github.com/
```

#### 2. 登录GitHub

```bash
gh auth login
```

#### 3. 使用AI调度脚本

```bash
# 快速训练
ts-node scripts/ai-scheduler/github-actions-trigger.ts fast

# 标准训练
ts-node scripts/ai-scheduler/github-actions-trigger.ts standard

# 完整训练
ts-node scripts/ai-scheduler/github-actions-trigger.ts full

# 自定义参数
ts-node scripts/ai-scheduler/github-actions-trigger.ts fast \
  --iterations 150 \
  --selfplay-games 100 \
  --mcts-simulations 500
```

### 方式2：直接使用GitHub CLI

```bash
# 触发快速训练
gh workflow run "AlphaZero Training.yml" -f training_type=fast

# 触发标准训练
gh workflow run "AlphaZero Training.yml" -f training_type=standard

# 触发完整训练
gh workflow run "AlphaZero Training.yml" -f training_type=full

# 自定义参数
gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  -f iterations=150 \
  -f selfplay_games=100 \
  -f mcts_simulations=500
```

### 方式3：使用GitHub API（程序化调用）

```bash
# 获取Personal Access Token
# Settings → Developer settings → Personal access tokens → Tokens (classic)

# 触发训练
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/alphazero-training.yml/dispatches \
  -d '{
    "ref": "develop",
    "inputs": {
      "training_type": "fast",
      "iterations": "150",
      "selfplay_games": "100"
    }
  }'
```

## 📊 获取训练结果（AI可读格式）

### 方式1：使用AI调度脚本自动获取

```bash
# 脚本会自动等待训练完成并返回结果
ts-node scripts/ai-scheduler/github-actions-trigger.ts fast

# 输出示例：
# {
#   "success": true,
#   "run_id": 123456789,
#   "url": "https://github.com/.../actions/runs/123456789",
#   "training_results": {
#     "summary": {
#       "totalIterations": 100,
#       "bestWinRate": 85.5,
#       ...
#     }
#   }
# }
```

### 方式2：手动获取训练结果

```bash
# 查看运行列表
gh run list --workflow="AlphaZero Training.yml"

# 查看特定运行的结果
gh run view RUN_ID --json conclusion,status,url,artifacts

# 下载训练结果
gh run download RUN_ID

# 查看训练报告
cat training-reports/training_report.json
cat training-reports/ai_summary.json
```

### 方式3：通过GitHub API获取

```bash
# 获取运行详情
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/runs/RUN_ID

# 下载artifacts
curl -L -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/artifacts/ARTIFACT_ID/zip \
  -o training-results.zip
```

## 📄 训练结果格式说明

### 1. training_report.json（完整报告）

```json
{
  "summary": {
    "totalIterations": 100,
    "totalTimeHours": 2.5,
    "bestModel": "alphazero-model-iteration-100",
    "bestWinRate": 85.5,
    "converged": true
  },
  "history": [
    {
      "iteration": 1,
      "winRateVsRandom": 65.0,
      "winRateVsGreedy": 55.0,
      "winRateVsHeuristic": 45.0,
      "policyLoss": 0.1234,
      "valueLoss": 0.0567
    },
    ...
  ],
  "config": {
    "agent": {...},
    "training": {...}
  }
}
```

### 2. ai_summary.json（AI摘要）

```json
{
  "training_status": "success",
  "run_id": 123456789,
  "training_type": "fast",
  "workflow_url": "https://github.com/.../actions/runs/123456789",
  "artifacts_available": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. metadata.json（运行元数据）

```json
{
  "run_id": 123456789,
  "run_number": 42,
  "workflow": "AlphaZero Training",
  "triggered_by": "workflow_dispatch",
  "training_type": "fast",
  "commit_sha": "abc123...",
  "commit_message": "Update training config",
  "timestamp": "2024-01-15T10:30:00Z",
  "repository": "username/repo",
  "workflow_url": "https://github.com/.../actions/runs/123456789"
}
```

### 4. metrics.jsonl（训练指标，每行一个JSON）

```jsonl
{"iteration": 1, "winRate": 65.0, "loss": 0.1234, "timestamp": "2024-01-15T10:30:00Z"}
{"iteration": 2, "winRate": 68.5, "loss": 0.1156, "timestamp": "2024-01-15T10:35:00Z"}
...
```

## 🤖 AI集成示例

### 在Cursor中使用

```typescript
// 在Cursor中，AI可以直接调用：
import { aiScheduleTraining } from './scripts/ai-scheduler/github-actions-trigger';

// AI调度训练
const result = await aiScheduleTraining({
  training_type: 'fast',
  iterations: 100,
  selfplay_games: 80
});

// AI读取结果
console.log('训练结果:', result.training_results);
console.log('最佳胜率:', result.training_results.summary.bestWinRate);
```

### 在Python中使用

```python
import subprocess
import json

# 触发训练
result = subprocess.run([
    'ts-node', 
    'scripts/ai-scheduler/github-actions-trigger.ts',
    'fast'
], capture_output=True, text=True)

# 解析结果
training_result = json.loads(result.stdout)
print(f"训练完成: {training_result['success']}")
print(f"最佳胜率: {training_result['training_results']['summary']['bestWinRate']}")
```

## 🔧 高级配置

### 自定义训练参数

```bash
# 完全自定义的训练
gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  -f iterations=200 \
  -f selfplay_games=120 \
  -f mcts_simulations=800
```

### 批量训练

```bash
# 创建批量训练脚本
for i in {1..5}; do
  gh workflow run "AlphaZero Training.yml" \
    -f training_type=fast \
    -f iterations=$((100 + i * 20))
  sleep 60  # 避免并发过多
done
```

### 监控训练进度

```bash
# 实时监控训练状态
watch -n 30 'gh run list --workflow="AlphaZero Training.yml" --limit 5'
```

## 📚 相关资源

- [GitHub Actions API文档](https://docs.github.com/en/rest/actions)
- [GitHub CLI文档](https://cli.github.com/manual/)
- [GitHub Actions工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## 💡 总结

**GitHub Actions完全支持AI调度**：

1. ✅ **随时触发**：无时间限制，可以随时触发
2. ✅ **AI可读格式**：所有结果以JSON格式输出
3. ✅ **多种触发方式**：API、CLI、手动、定时、事件
4. ✅ **自动获取结果**：AI调度脚本自动等待并返回结果

**推荐使用方式**：
- 研发阶段：使用AI调度脚本，随时触发训练
- 生产环境：使用定时触发或事件触发
- AI集成：直接调用API或使用调度脚本

**所有训练结果都以标准JSON格式输出，AI可以直接读取和分析！** 🚀

