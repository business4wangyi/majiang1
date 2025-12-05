# 🤖 云端训练自动化方案指南（自动化优先）

## 📋 概述

本指南**优先推荐自动化方案**，帮助您实现**完全自动化**的云端训练流程，无需手动干预。所有方案按**自动化程度**排序，从完全自动化到手动操作。

## 🎯 方案对比（按自动化程度排序）

| 方案 | 自动化程度 | 费用 | 可行性 | 推荐度 |
|------|-----------|------|--------|--------|
| **GitHub Actions** | ✅✅✅ **完全自动化** | 🟢 **免费** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Gitpod自动化** | ✅✅✅ **完全自动化** | 🟢 **免费50小时/月** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **云服务器+脚本** | ✅✅✅ **完全自动化** | 🔴 **200-300元/月** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **GitHub Codespaces API** | ✅✅ **高度自动化** | 🟢 **免费60小时/月** | ⭐⭐⭐ | ⭐⭐⭐ |
| **Google Colab自动化** | ✅ **部分自动化** | 🟢 **完全免费** | ⭐⭐⭐ | ⭐⭐⭐ |
| **Augment Remote Agent** | ✅ **部分自动化** | 🟡 **14天试用，之后$30-50/月** | ⭐⭐ | ⭐⭐ |

---

## 🤖 方案一：GitHub Actions（最推荐 - 完全自动化）

### 自动化程度：✅✅✅ 完全自动化

**可行性分析**：⭐⭐⭐⭐⭐ **最高推荐**

### 功能说明

GitHub Actions是GitHub提供的**完全免费**的CI/CD平台，可以**完全自动化**训练流程：
- ✅ 代码推送后自动触发训练
- ✅ 定时自动训练
- ✅ 手动触发训练
- ✅ 自动保存训练结果
- ✅ 自动通知训练完成

### 免费资源

- ✅ **完全免费**（公共仓库）
- ✅ **2000分钟/月**免费运行时间
- ✅ **500MB存储空间**
- ✅ **无限制的并发任务**（公共仓库）

### 自动化配置

#### 1. 创建GitHub Actions工作流

创建 `.github/workflows/alphazero-training.yml`：

```yaml
name: AlphaZero Training

on:
  # 定时触发（每天凌晨2点）
  schedule:
    - cron: '0 2 * * *'
  
  # 手动触发
  workflow_dispatch:
    inputs:
      training_type:
        description: 'Training type'
        required: true
        default: 'fast'
        type: choice
        options:
          - fast
          - standard
          - full
  
  # 代码推送触发（可选）
  push:
    branches:
      - develop
    paths:
      - 'src/othello/**'
      - 'package.json'

jobs:
  train:
    runs-on: ubuntu-latest
    timeout-minutes: 360  # 6小时超时
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run training
        id: training
        run: |
          if [ "${{ github.event.inputs.training_type }}" == "fast" ]; then
            npm run othello:alphazero-fast-train
          elif [ "${{ github.event.inputs.training_type }}" == "standard" ]; then
            npm run othello:alphazero-train
          else
            npm run othello:alphazero-fast-train
          fi
        env:
          ALPHAZERO_TOTAL_ITERATIONS: ${{ github.event.inputs.training_type == 'full' && '200' || '100' }}
          ALPHAZERO_SELFPLAY_GAMES: ${{ github.event.inputs.training_type == 'full' && '100' || '80' }}
      
      - name: Upload training results
        uses: actions/upload-artifact@v4
        with:
          name: training-results-${{ github.run_number }}
          path: |
            src/othello/models/**
            logs/**
          retention-days: 30
      
      - name: Create training report
        run: |
          echo "## Training Report" >> $GITHUB_STEP_SUMMARY
          echo "- Training Type: ${{ github.event.inputs.training_type || 'scheduled' }}" >> $GITHUB_STEP_SUMMARY
          echo "- Run Number: ${{ github.run_number }}" >> $GITHUB_STEP_SUMMARY
          echo "- Commit: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
      
      - name: Notify completion
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Training Completed: ${{ github.event.inputs.training_type || 'scheduled' }}`,
              body: `Training run #${{ github.run_number }} completed. Check artifacts for results.`
            })
```

#### 2. 使用方式

**方式1：定时自动训练**
- 工作流会在每天凌晨2点自动运行
- 无需任何手动操作

**方式2：手动触发训练**
```bash
# 在GitHub仓库页面
1. 点击 "Actions" 标签
2. 选择 "AlphaZero Training" 工作流
3. 点击 "Run workflow"
4. 选择训练类型（fast/standard/full）
5. 点击 "Run workflow"
```

**方式3：代码推送触发**
- 当您推送代码到develop分支时自动触发
- 修改训练相关代码时自动训练

#### 3. 查看训练结果

- 在GitHub Actions页面查看训练日志
- 下载训练结果（Artifacts）
- 查看训练报告（Summary）

### 优势

- ✅ **完全免费**（公共仓库）
- ✅ **完全自动化**，无需手动操作
- ✅ **与GitHub无缝集成**
- ✅ **自动保存结果**
- ✅ **自动通知**

### 限制

- ⚠️ 免费账户每月2000分钟（约33小时）
- ⚠️ 单次运行最长6小时（可配置）
- ⚠️ 无GPU支持（仅CPU）

### 可行性评估

**✅ 完全可行** - 这是**最推荐的自动化方案**：
- 配置简单
- 完全免费
- 自动化程度高
- 适合本项目

---

## 🤖 方案二：Gitpod自动化（完全自动化）

### 自动化程度：✅✅✅ 完全自动化

**可行性分析**：⭐⭐⭐⭐ **高度可行**

### 功能说明

Gitpod可以通过**API和Webhook**实现完全自动化：
- ✅ API创建工作空间
- ✅ 自动执行训练脚本
- ✅ 自动保存结果
- ✅ Webhook通知

### 免费资源

- ✅ **免费50小时/月**
- ✅ 4核CPU，16GB RAM
- ✅ 基于VS Code环境

### 自动化配置

#### 1. 创建`.gitpod.yml`配置

创建 `.gitpod.yml`：

```yaml
image: gitpod/workspace-node:20

tasks:
  - name: Setup and Train
    init: |
      npm install
      echo "Environment ready"
    command: |
      # 检查是否应该运行训练
      if [ "$GITPOD_AUTO_TRAIN" == "true" ]; then
        npm run othello:alphazero-fast-train
        # 保存结果到GitHub
        git config user.name "Gitpod Bot"
        git config user.email "bot@gitpod.io"
        git add src/othello/models/
        git commit -m "Auto training results $(date +%Y%m%d-%H%M%S)" || true
        git push origin HEAD:training-results || true
      fi

ports:
  - port: 3000
    onOpen: ignore
```

#### 2. 使用Gitpod API自动化

创建自动化脚本 `scripts/automation/gitpod-auto-train.sh`：

```bash
#!/bin/bash
# Gitpod自动化训练脚本

GITPOD_API_TOKEN="your-api-token"
REPO_URL="https://github.com/your-username/your-repo"

# 通过API创建工作空间
curl -X POST "https://api.gitpod.io/v1/workspaces" \
  -H "Authorization: Bearer $GITPOD_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"contextUrl\": \"$REPO_URL\",
    \"workspaceClass\": \"g1-standard\",
    \"ideSetting\": {
      \"defaultIde\": \"code\"
    },
    \"envvars\": [
      {
        \"name\": \"GITPOD_AUTO_TRAIN\",
        \"value\": \"true\"
      }
    ]
  }"
```

#### 3. 使用GitHub Actions触发Gitpod

在GitHub Actions中触发Gitpod：

```yaml
- name: Trigger Gitpod training
  run: |
    curl -X POST "https://api.gitpod.io/v1/workspaces" \
      -H "Authorization: Bearer ${{ secrets.GITPOD_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "contextUrl": "${{ github.repositoryUrl }}",
        "envvars": [{"name": "GITPOD_AUTO_TRAIN", "value": "true"}]
      }'
```

### 优势

- ✅ 免费50小时/月
- ✅ 可以通过API完全自动化
- ✅ 性能好（4核16GB）

### 限制

- ⚠️ 需要API token
- ⚠️ 免费额度有限（50小时/月）

### 可行性评估

**✅ 高度可行** - 需要配置API token，但可以实现完全自动化

---

## 🤖 方案三：云服务器+自动化脚本（完全自动化）

### 自动化程度：✅✅✅ 完全自动化

**可行性分析**：⭐⭐⭐⭐⭐ **完全可行**

### 功能说明

使用云服务器配合自动化脚本，实现完全自动化的训练流程：
- ✅ Git Webhook自动触发
- ✅ 自动拉取代码
- ✅ 自动运行训练
- ✅ 自动保存结果
- ✅ 自动通知

### 费用

- 🔴 **200-300元/月**（云服务器费用）

### 自动化配置

#### 1. 创建自动化训练脚本

创建 `scripts/cloud-training/auto-train.sh`：

```bash
#!/bin/bash
# 完全自动化的云端训练脚本

set -e

PROJECT_DIR="/path/to/project"
LOG_FILE="/var/log/alphazero-training.log"

cd "$PROJECT_DIR"

# 记录开始时间
echo "[$(date)] 开始自动训练任务" >> "$LOG_FILE"

# 拉取最新代码
git fetch origin
git reset --hard origin/develop
git pull origin develop

# 安装/更新依赖
npm ci

# 运行训练
npm run othello:alphazero-fast-train 2>&1 | tee -a "$LOG_FILE"

# 保存训练结果
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "/backup/training-results/$TIMESTAMP"
cp -r src/othello/models/* "/backup/training-results/$TIMESTAMP/"

# 推送到GitHub（可选）
git add src/othello/models/
git commit -m "Auto training results $TIMESTAMP" || true
git push origin develop || true

# 发送通知（可选）
# curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
#   -d "chat_id=$CHAT_ID&text=Training completed: $TIMESTAMP"

echo "[$(date)] 训练任务完成" >> "$LOG_FILE"
```

#### 2. 配置Git Webhook自动触发

在服务器上创建Webhook接收器 `scripts/cloud-training/webhook-server.js`：

```javascript
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const payload = JSON.parse(body);
      if (payload.ref === 'refs/heads/develop') {
        exec('bash /path/to/auto-train.sh', (error, stdout, stderr) => {
          console.log(stdout);
          if (error) console.error(stderr);
        });
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
  }
});

server.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
```

#### 3. 配置定时任务（Cron）

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点自动训练
0 2 * * * /path/to/auto-train.sh >> /var/log/alphazero-cron.log 2>&1
```

#### 4. 配置systemd服务（可选）

创建 `/etc/systemd/system/alphazero-training.service`：

```ini
[Unit]
Description=AlphaZero Auto Training Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
ExecStart=/path/to/auto-train.sh
Restart=on-failure
RestartSec=60

[Install]
WantedBy=multi-user.target
```

### 优势

- ✅ 完全自动化
- ✅ 完全控制
- ✅ 性能充足
- ✅ 可以长时间运行

### 限制

- ⚠️ 需要付费（200-300元/月）
- ⚠️ 需要服务器运维知识

### 可行性评估

**✅ 完全可行** - 需要付费，但可以实现完全自动化

---

## 🤖 方案四：GitHub Codespaces API（高度自动化）

### 自动化程度：✅✅ **高度自动化**

**可行性分析**：⭐⭐⭐ **中等可行**

### 功能说明

通过GitHub Codespaces API实现自动化：
- ✅ API创建Codespace
- ✅ 自动执行训练
- ✅ 自动保存结果

### 免费资源

- ✅ **免费60小时/月**
- ✅ 2核CPU，4GB RAM（免费层）

### 自动化配置

#### 使用GitHub CLI自动化

```bash
# 安装GitHub CLI
brew install gh  # macOS
# 或访问 https://cli.github.com/

# 登录
gh auth login

# 创建Codespace并运行训练
gh codespace create \
  --repo your-username/your-repo \
  --machine basicLinux32gb \
  --command "npm run othello:alphazero-fast-train"
```

#### 使用GitHub API

```bash
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/your-username/your-repo/codespaces \
  -d '{
    "machine": "basicLinux32gb",
    "display_name": "Training",
    "idle_timeout_minutes": 60
  }'
```

### 优势

- ✅ 免费60小时/月
- ✅ 与GitHub集成

### 限制

- ⚠️ API使用较复杂
- ⚠️ 免费额度有限

### 可行性评估

**⚠️ 中等可行** - API使用较复杂，但可以实现自动化

---

## 🤖 方案五：Google Colab自动化（部分自动化）

### 自动化程度：✅ **部分自动化**

**可行性分析**：⭐⭐⭐ **中等可行**

### 功能说明

Google Colab可以通过**Colab API**实现部分自动化：
- ✅ API创建Notebook
- ✅ 自动执行代码
- ⚠️ 需要手动启动会话

### 免费资源

- ✅ **完全免费**
- ✅ **免费GPU**

### 自动化配置

#### 使用Colab API（需要Colab Pro）

```python
# 需要Colab Pro账户
from google.colab import drive
import subprocess

# 挂载Drive
drive.mount('/content/drive')

# 克隆项目
subprocess.run(['git', 'clone', 'https://github.com/your-username/your-repo.git'])

# 安装依赖
subprocess.run(['npm', 'install'], cwd='/content/your-repo')

# 运行训练
subprocess.run(['npm', 'run', 'othello:alphazero-fast-train'], cwd='/content/your-repo')
```

#### 使用Selenium自动化（不推荐）

可以通过Selenium自动化浏览器操作，但：
- ⚠️ 违反Colab服务条款
- ⚠️ 不稳定
- ⚠️ 不推荐使用

### 优势

- ✅ 完全免费
- ✅ 免费GPU

### 限制

- ⚠️ 自动化程度有限
- ⚠️ 需要科学上网
- ⚠️ 12小时限制

### 可行性评估

**⚠️ 中等可行** - 自动化程度有限，主要需要手动操作

---

## 🤖 方案六：Augment Remote Agent（部分自动化）

### 自动化程度：✅ **部分自动化**

**可行性分析**：⭐⭐ **较低可行**

### 功能说明

Augment Remote Agent需要**手动创建**，但创建后可以自动化执行：
- ⚠️ 需要手动创建Remote Agent
- ✅ 创建后自动执行任务
- ✅ 自动保存结果

### 费用

- 🟡 **14天免费试用，之后$30-50/月**

### 自动化配置

**限制**：Augment Remote Agent**不支持API自动化创建**，必须手动在Augment面板中创建。

但创建后可以：
- ✅ 自动执行任务
- ✅ 自动保存结果
- ✅ 自动提交到GitHub

### 可行性评估

**⚠️ 较低可行** - 需要手动创建，自动化程度有限

---

## 📊 自动化方案总结

### 🥇 最推荐：GitHub Actions

**理由**：
- ✅ 完全免费
- ✅ 完全自动化
- ✅ 配置简单
- ✅ 与GitHub无缝集成

**适用场景**：
- 公共仓库
- 需要定时训练
- 需要自动保存结果

### 🥈 次推荐：云服务器+自动化脚本

**理由**：
- ✅ 完全自动化
- ✅ 完全控制
- ✅ 性能充足

**适用场景**：
- 愿意付费
- 需要长时间训练
- 需要GPU支持

### 🥉 第三推荐：Gitpod自动化

**理由**：
- ✅ 免费50小时/月
- ✅ 可以通过API自动化
- ✅ 性能好

**适用场景**：
- 需要VS Code环境
- 免费额度足够

---

## 🔧 实施建议

### 第一步：尝试GitHub Actions（推荐）

1. 创建 `.github/workflows/alphazero-training.yml`
2. 配置定时触发或手动触发
3. 测试运行
4. 查看结果

### 第二步：如果GitHub Actions不够用

考虑：
- 云服务器+自动化脚本（付费但完全控制）
- Gitpod自动化（免费但额度有限）

### 第三步：长期方案

- 云服务器+自动化脚本
- 配置完整的CI/CD流程

---

## 📚 相关资源

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Gitpod API文档](https://www.gitpod.io/docs/references/api)
- [GitHub Codespaces API](https://docs.github.com/en/rest/codespaces)

---

## 💡 总结

**优先推荐自动化方案**：

1. **🥇 GitHub Actions** - 完全免费，完全自动化，最推荐
2. **🥈 云服务器+脚本** - 付费但完全控制，适合长期使用
3. **🥉 Gitpod自动化** - 免费但额度有限

**所有方案都可以实现完全自动化，无需手动干预！** 🚀

