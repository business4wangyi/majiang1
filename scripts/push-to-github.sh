#!/bin/bash
# 推送代码到GitHub的辅助脚本

echo "📤 准备推送代码到GitHub"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo ""

# 检查远程仓库配置
echo ""
echo "1️⃣ 检查远程仓库配置"
echo "----------------------------------------"
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo "✅ 远程仓库: $REMOTE_URL"
else
    echo "❌ 未配置远程仓库"
    exit 1
fi

# 检查当前分支
echo ""
echo "2️⃣ 检查当前分支"
echo "----------------------------------------"
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 检查是否有未提交的更改
echo ""
echo "3️⃣ 检查未提交的更改"
echo "----------------------------------------"
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改"
    echo ""
    read -p "是否先提交这些更改？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "chore: 自动提交更改"
    fi
else
    echo "✅ 没有未提交的更改"
fi

# 提示认证方式
echo ""
echo "4️⃣ 认证方式"
echo "----------------------------------------"
echo "推送代码需要认证，有以下方式："
echo ""
echo "方式1：使用Personal Access Token（推荐）"
echo "  1. 访问：https://github.com/settings/tokens"
echo "  2. 复制您的Token"
echo "  3. 推送时："
echo "     - 用户名：business4wangyi"
echo "     - 密码：粘贴您的Token"
echo ""
echo "方式2：使用GitHub CLI"
echo "  1. 安装：brew install gh"
echo "  2. 登录：gh auth login"
echo "  3. 然后推送"
echo ""
read -p "按Enter继续推送（将提示输入凭据）..."

# 执行推送
echo ""
echo "5️⃣ 执行推送"
echo "----------------------------------------"
echo "正在推送到 origin/$CURRENT_BRANCH..."
echo ""

# 尝试推送
if git push -u origin "$CURRENT_BRANCH"; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📋 仓库信息："
    echo "   URL: https://github.com/business4wangyi/majiang1"
    echo "   分支: $CURRENT_BRANCH"
    echo ""
    echo "🎯 下一步："
    echo "   1. 访问仓库查看代码"
    echo "   2. 测试GitHub Actions工作流"
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "   1. 认证失败（Token无效或权限不足）"
    echo "   2. 网络问题"
    echo "   3. 仓库不存在或无权访问"
    echo ""
    echo "解决方案："
    echo "   1. 检查Token是否正确"
    echo "   2. 确认Token有repo权限"
    echo "   3. 参考：docs/cloud-automation/PUSH_CODE_GUIDE.md"
fi

