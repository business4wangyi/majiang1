#!/bin/bash
# GitHub Actions测试验证脚本

set -e

echo "🧪 GitHub Actions测试验证脚本"
echo "=" .repeat(50)

# 检查GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI未安装"
    echo "   安装方法: brew install gh"
    echo "   或访问: https://cli.github.com/"
    echo ""
    echo "📝 您可以在GitHub网页手动测试："
    echo "   1. 访问仓库的Actions页面"
    echo "   2. 选择 'AlphaZero Training' 工作流"
    echo "   3. 点击 'Run workflow' 按钮"
    exit 0
fi

# 检查登录状态
if ! gh auth status &> /dev/null; then
    echo "⚠️  未登录GitHub CLI"
    echo "   运行: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI已安装并登录"
echo ""

# 检查工作流文件
if [ ! -f ".github/workflows/alphazero-training.yml" ]; then
    echo "❌ 工作流文件不存在: .github/workflows/alphazero-training.yml"
    exit 1
fi

echo "✅ 工作流文件存在"
echo ""

# 检查是否已推送到GitHub
echo "📋 检查Git状态..."
if git status --porcelain | grep -q ".github/workflows/alphazero-training.yml"; then
    echo "⚠️  工作流文件未提交到GitHub"
    echo ""
    echo "请先提交文件："
    echo "  git add .github/workflows/alphazero-training.yml"
    echo "  git commit -m 'feat: 添加GitHub Actions训练工作流'"
    echo "  git push origin develop"
    exit 1
fi

echo "✅ 工作流文件已提交"
echo ""

# 触发测试运行
echo "🚀 触发测试训练（快速模式）..."
echo ""

gh workflow run "AlphaZero Training.yml" \
  -f training_type=fast \
  --ref develop

echo ""
echo "✅ 训练已触发"
echo ""
echo "📊 查看运行状态："
echo "   gh run list --workflow='AlphaZero Training.yml'"
echo ""
echo "📊 实时监控："
echo "   gh run watch"
echo ""
echo "📥 下载结果（运行完成后）："
echo "   gh run download"
echo ""

