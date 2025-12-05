# ☁️ 云端开发环境配置指南（免费优先版）

## 📋 概述

本项目包含AlphaZero训练任务，会占用大量CPU和内存资源。本指南**优先推荐免费方案**，帮助您将训练任务迁移到云端，释放本地资源，**零成本**完成训练任务。

## 🎯 方案对比（按费用排序）

| 方案 | 费用 | 优点 | 缺点 | 适用场景 | 推荐度 |
|------|------|------|------|----------|--------|
| **Google Colab** | 🟢 **完全免费** | 免费GPU，Jupyter环境，易用 | 12小时限制，需要适配 | 短期训练任务 | ⭐⭐⭐⭐⭐ |
| **GitHub Codespaces** | 🟢 **免费60小时/月** | 开箱即用，与GitHub集成 | 有时间限制 | 临时开发环境 | ⭐⭐⭐⭐ |
| **Gitpod** | 🟢 **免费50小时/月** | 基于VS Code，功能完整 | 有时间限制 | 云端开发 | ⭐⭐⭐⭐ |
| **Augment Remote Agent** | 🟡 **14天免费试用，之后$30-50/月** | 自动化开发流程，异步执行 | 需要注册和付费订阅 | AI辅助开发 | ⭐⭐⭐ |
| **腾讯云Cloud Studio** | 🟢 **免费1000分钟/月** | 中文支持好，易用 | 有时间限制 | 国内用户 | ⭐⭐⭐ |
| **云服务器试用** | 🟡 **免费试用期** | 完全控制，性能好 | 试用期后需付费 | 短期项目 | ⭐⭐⭐ |
| **SSH远程连接** | 🔴 **200-300元/月** | 完全控制，性能好 | 需要付费 | 长期训练任务 | ⭐⭐ |

---

## 🆓 方案一：Google Colab（最推荐 - 完全免费）

### 功能说明

Google Colab提供**完全免费的Jupyter Notebook环境**，包括**免费GPU资源**（Tesla T4/K80），非常适合机器学习训练任务。

### 免费资源

- ✅ **完全免费**，无需信用卡
- ✅ **免费GPU**：Tesla T4（15GB）或 K80（12GB）
- ✅ **免费CPU**：2核，12GB RAM
- ✅ **免费存储**：与Google Drive集成
- ⚠️ **限制**：会话最长12小时，空闲90分钟后断开

### ⚠️ 网络访问说明

**重要**：Google Colab在中国大陆地区**需要科学上网**才能访问。

**解决方案**：
1. **使用VPN或代理**：配置浏览器代理访问Colab
2. **使用国内替代方案**：
   - 腾讯云Cloud Studio（免费1000分钟/月，国内可直接访问）
   - 阿里云DevStudio（免费，国内可直接访问）
   - 华为云CloudIDE（免费，国内可直接访问）

**如果无法访问Colab，推荐使用**：
- 🥇 **腾讯云Cloud Studio**（免费1000分钟/月，国内用户友好，无需科学上网）
- 🥈 **GitHub Codespaces**（免费60小时/月，需要GitHub账户）
- ⚠️ **Augment Remote Agent**（14天免费试用，之后$30-50/月，需要付费）

### 配置步骤

#### 1. 创建Colab Notebook

1. 访问 [Google Colab](https://colab.research.google.com/)
   - ⚠️ 如果无法访问，请使用VPN或选择其他方案
2. 点击 "文件" → "新建笔记本"
3. 选择 "运行时" → "更改运行时类型" → 选择 "GPU"

#### 2. 安装Node.js环境

在Colab中运行：

```python
# 安装Node.js 20
!curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
!apt-get install -y nodejs

# 验证安装
!node --version
!npm --version
```

#### 3. 克隆项目并安装依赖

```python
# 克隆项目（需要将项目推送到GitHub）
!git clone https://github.com/your-username/your-repo.git
%cd your-repo

# 安装依赖
!npm install

# 如果需要GPU支持
!npm install @tensorflow/tfjs-node-gpu
```

#### 4. 运行训练任务

```python
# 在Colab中运行训练
!npm run othello:alphazero-fast-train
```

#### 5. 保存训练结果到Google Drive

```python
# 挂载Google Drive
from google.colab import drive
drive.mount('/content/drive')

# 复制训练结果
!cp -r src/othello/models /content/drive/MyDrive/training-results/
```

### 优化技巧

1. **保持会话活跃**：定期运行代码防止断开
   ```python
   import time
   while True:
       time.sleep(300)  # 每5分钟执行一次
   ```

2. **使用GPU加速**：确保选择GPU运行时
3. **保存检查点**：定期保存模型到Google Drive

### 适用场景

- ✅ 短期训练任务（<12小时）
- ✅ 实验和测试
- ✅ 学习和研究
- ❌ 长时间训练（需要定期保存和重启）
- ⚠️ 需要科学上网（国内用户）

---

## 方案二：Cursor后台智能体（Background Agent）

### 功能说明

Cursor的后台智能体功能允许在远程环境中启动异步代理来编辑和运行代码。

### 使用方法

1. **启动后台智能体**
   - 使用快捷键 `Ctrl+E` (Windows/Linux) 或 `Cmd+E` (Mac)
   - 或通过侧边栏访问后台代理模式

2. **配置远程环境**
   - 在Cursor设置中配置SSH连接信息
   - 支持JumpServer等远程资产连接

3. **使用限制**
   - 主要用于代码编辑和轻量级操作
   - 不适合长时间运行的训练任务
   - 异步执行，需要查看代理状态

### 适用场景

- ✅ 远程代码编辑
- ✅ 轻量级脚本执行
- ❌ 长时间训练任务（不推荐）

---

## 方案二：SSH远程连接 + 云服务器（推荐）

### 架构说明

```
本地Cursor IDE ←→ SSH连接 ←→ 云端服务器（运行训练）
```

### 实施步骤

#### 1. 准备云服务器

**推荐配置**（针对AlphaZero训练）：
- CPU: 8核以上（推荐16核）
- 内存: 16GB以上（推荐32GB）
- 存储: 100GB以上SSD
- GPU: 可选（如果使用GPU加速）

**云服务商推荐**：
- 阿里云ECS
- 腾讯云CVM
- AWS EC2
- 华为云ECS

#### 2. 配置SSH连接

**生成SSH密钥**：
```bash
# 在本地生成密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server-ip
```

**配置SSH config**（`~/.ssh/config`）：
```
Host training-server
    HostName your-server-ip
    User your-username
    Port 22
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

#### 3. 在服务器上配置项目环境

```bash
# 连接到服务器
ssh training-server

# 安装Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装项目依赖
cd /path/to/project
npm install

# 安装TensorFlow.js（如果需要GPU支持）
npm install @tensorflow/tfjs-node-gpu
```

#### 4. 使用tmux/screen管理训练任务

```bash
# 安装tmux
sudo apt-get install tmux

# 启动训练会话
tmux new -s training

# 在tmux中运行训练
npm run othello:alphazero-fast-train

# 分离会话（Ctrl+B, 然后按D）
# 重新连接会话
tmux attach -t training
```

#### 5. 配置自动同步（可选）

使用rsync同步代码：
```bash
# 创建同步脚本 sync-to-server.sh
#!/bin/bash
rsync -avz --exclude 'node_modules' \
           --exclude 'dist' \
           --exclude '*.log' \
           ./ user@your-server-ip:/path/to/project/
```

---

## 方案三：GitHub Codespaces

### 功能说明

GitHub Codespaces提供基于浏览器的云端开发环境，基于Visual Studio Code。

### 配置步骤

#### 1. 创建`.devcontainer`配置

创建 `.devcontainer/devcontainer.json`：

```json
{
  "name": "AlphaZero Training Environment",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },
  "forwardPorts": [3000, 8080],
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

#### 2. 启动Codespace

1. 在GitHub仓库页面，点击 "Code" → "Codespaces" → "Create codespace"
2. 选择机器配置（推荐：4核8GB或更高）
3. 等待环境创建完成

#### 3. 运行训练任务

```bash
# 在Codespace终端中
npm run othello:alphazero-fast-train
```

### 注意事项

- ⚠️ Codespaces有使用时间限制（免费用户每月60小时）
- ⚠️ 长时间训练任务可能被中断
- ⚠️ 需要稳定的网络连接

---

## 方案四：VS Code Remote SSH（推荐用于专业开发）

### 功能说明

VS Code的Remote SSH扩展允许您直接在远程服务器上开发，体验接近本地开发。

### 配置步骤

#### 1. 安装Remote SSH扩展

在VS Code中安装 "Remote - SSH" 扩展。

#### 2. 配置SSH连接

1. 按 `F1` 打开命令面板
2. 输入 "Remote-SSH: Connect to Host"
3. 选择已配置的SSH主机（如 `training-server`）

#### 3. 在远程环境中开发

- 打开远程文件夹
- 安装必要的扩展（在远程环境中）
- 直接在远程环境中运行和调试

### 与Cursor的配合

虽然Cursor不直接支持Remote SSH，但您可以：
1. 使用VS Code Remote SSH进行开发
2. 使用Cursor进行本地代码审查和AI辅助
3. 通过Git同步代码

---

## 方案五：云服务器 + 自动化脚本（适合大规模训练）

### 架构设计

```
本地开发 → Git推送 → 云服务器自动拉取 → 自动训练 → 结果通知
```

### 实施步骤

#### 1. 创建训练脚本

创建 `scripts/cloud-training/remote-train.sh`：

```bash
#!/bin/bash
# 云端训练脚本

set -e

echo "🚀 开始云端训练任务"
echo "时间: $(date)"

# 拉取最新代码
git pull origin develop

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    npm install
fi

# 运行训练
npm run othello:alphazero-fast-train

# 保存训练结果
echo "✅ 训练完成"
echo "时间: $(date)"
```

#### 2. 配置GitHub Actions（可选）

创建 `.github/workflows/cloud-training.yml`：

```yaml
name: Cloud Training

on:
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

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run training
        run: |
          if [ "${{ github.event.inputs.training_type }}" == "fast" ]; then
            npm run othello:alphazero-fast-train
          elif [ "${{ github.event.inputs.training_type }}" == "standard" ]; then
            npm run othello:alphazero-train
          else
            npm run othello:alphazero-fast-train
          fi
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: training-results
          path: src/othello/models/
```

---

## 🎯 针对本项目的推荐方案

### 短期方案（快速开始）

**推荐：SSH远程连接 + tmux**

1. 租用一台云服务器（8核16GB，约200-300元/月）
2. 配置SSH连接
3. 使用tmux管理训练会话
4. 在本地Cursor中编辑代码，通过Git同步到服务器

**优点**：
- 成本低
- 配置简单
- 完全控制

### 长期方案（专业开发）

**推荐：VS Code Remote SSH + 云服务器**

1. 使用VS Code Remote SSH连接到云服务器
2. 在远程环境中直接开发
3. 使用Cursor进行代码审查和AI辅助

**优点**：
- 开发体验好
- 功能完整
- 适合长期项目

### 临时方案（快速测试）

**推荐：GitHub Codespaces**

1. 创建Codespace
2. 快速测试和调试
3. 完成后关闭

**优点**：
- 开箱即用
- 无需配置
- 适合临时使用

---

## 📝 最佳实践

### 1. 代码同步策略

```bash
# 使用Git进行代码同步
# 本地开发 → Git提交 → 服务器拉取

# 本地
git add .
git commit -m "Update training config"
git push origin develop

# 服务器
git pull origin develop
```

### 2. 训练任务管理

```bash
# 使用tmux管理长时间运行的训练任务
tmux new -s training
# 运行训练
npm run othello:alphazero-fast-train
# 分离：Ctrl+B, 然后按D
# 重连：tmux attach -t training
```

### 3. 资源监控

```bash
# 监控CPU和内存使用
htop

# 监控GPU使用（如果有）
nvidia-smi

# 监控磁盘使用
df -h
```

### 4. 日志管理

```bash
# 将训练日志保存到文件
npm run othello:alphazero-fast-train 2>&1 | tee training-$(date +%Y%m%d-%H%M%S).log
```

---

## 🔧 故障排查

### 问题1：SSH连接超时

**解决方案**：
```bash
# 在SSH config中添加
ServerAliveInterval 60
ServerAliveCountMax 3
```

### 问题2：训练任务被中断

**解决方案**：
- 使用tmux或screen管理会话
- 配置系统服务（systemd）自动重启

### 问题3：网络不稳定

**解决方案**：
- 使用rsync增量同步
- 配置断点续传
- 使用VPN或专线

---

## 📚 相关资源

- [Cursor后台智能体文档](https://docs.cursor.com/zh/background-agent)
- [VS Code Remote SSH文档](https://code.visualstudio.com/docs/remote/ssh)
- [GitHub Codespaces文档](https://docs.github.com/en/codespaces)
- [tmux使用指南](https://github.com/tmux/tmux/wiki)

---

## 💡 总结

对于本项目的AlphaZero训练任务，**推荐使用SSH远程连接 + 云服务器**的方案：

1. ✅ 成本可控（200-300元/月）
2. ✅ 性能充足（8核16GB可满足需求）
3. ✅ 完全控制训练过程
4. ✅ 可以长时间运行
5. ✅ 本地Cursor仍可用于代码编辑和AI辅助

如果需要更专业的开发体验，可以结合使用VS Code Remote SSH。

