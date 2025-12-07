#!/bin/bash
# GitHub仓库验证脚本

echo "🔍 验证GitHub仓库是否存在"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo ""

REPO_OWNER="business4wangyi"
REPO_NAME="majiang1"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}"

echo ""
echo "📋 检查信息"
echo "----------------------------------------"
echo "仓库所有者: $REPO_OWNER"
echo "仓库名称: $REPO_NAME"
echo "仓库URL: $REPO_URL"
echo ""

# 检查1: 使用curl访问仓库
echo "1️⃣ 检查仓库可访问性"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$REPO_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 仓库存在且可访问 (HTTP $HTTP_CODE)"
    echo "   URL: $REPO_URL"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 仓库不存在 (HTTP $HTTP_CODE)"
    echo "   请先在GitHub网页创建仓库"
    echo "   创建地址: https://github.com/new"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "⚠️  仓库可能为私有或需要认证 (HTTP $HTTP_CODE)"
    echo "   请检查仓库可见性设置"
else
    echo "⚠️  无法确定仓库状态 (HTTP $HTTP_CODE)"
fi

# 检查2: 检查本地Git远程配置
echo ""
echo "2️⃣ 检查本地Git远程配置"
echo "----------------------------------------"
if git remote get-url origin &> /dev/null; then
    REMOTE_URL=$(git remote get-url origin)
    echo "✅ 本地已配置远程仓库"
    echo "   远程URL: $REMOTE_URL"
    
    if echo "$REMOTE_URL" | grep -q "$REPO_NAME"; then
        echo "   ✅ 远程URL包含仓库名称: $REPO_NAME"
    else
        echo "   ⚠️  远程URL不包含仓库名称"
    fi
    
    if echo "$REMOTE_URL" | grep -q "$REPO_OWNER"; then
        echo "   ✅ 远程URL包含所有者: $REPO_OWNER"
    else
        echo "   ⚠️  远程URL不包含所有者"
    fi
else
    echo "❌ 本地未配置远程仓库"
    echo "   需要添加: git remote add origin $REPO_URL.git"
fi

# 检查3: 尝试获取仓库信息（如果Token可用）
echo ""
echo "3️⃣ 检查仓库详细信息"
echo "----------------------------------------"
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "   使用Token获取仓库信息..."
    REPO_INFO=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
        "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}")
    
    if echo "$REPO_INFO" | grep -q '"name"'; then
        REPO_FULL_NAME=$(echo "$REPO_INFO" | grep '"full_name"' | head -1 | sed 's/.*"full_name": "\([^"]*\)".*/\1/')
        REPO_PRIVATE=$(echo "$REPO_INFO" | grep '"private"' | head -1 | sed 's/.*"private": \(.*\),.*/\1/')
        REPO_DESCRIPTION=$(echo "$REPO_INFO" | grep '"description"' | head -1 | sed 's/.*"description": "\([^"]*\)".*/\1/' || echo "无描述")
        
        echo "   ✅ 仓库信息获取成功"
        echo "   完整名称: $REPO_FULL_NAME"
        echo "   是否私有: $REPO_PRIVATE"
        echo "   描述: $REPO_DESCRIPTION"
    elif echo "$REPO_INFO" | grep -q '"message"'; then
        ERROR_MSG=$(echo "$REPO_INFO" | grep '"message"' | head -1 | sed 's/.*"message": "\([^"]*\)".*/\1/')
        echo "   ❌ 无法获取仓库信息: $ERROR_MSG"
    else
        echo "   ⚠️  无法解析仓库信息"
    fi
else
    echo "   ℹ️  Token未设置，跳过API检查"
    echo "   提示: 设置GITHUB_PERSONAL_ACCESS_TOKEN可获取更详细信息"
fi

# 总结
echo ""
echo "📊 验证总结"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 仓库已创建并可以访问"
    echo ""
    echo "🎯 下一步："
    echo "   1. 在浏览器中打开: $REPO_URL"
    echo "   2. 确认仓库是空的（没有文件）"
    echo "   3. 确认仓库设置正确"
    echo "   4. 然后可以推送代码: git push -u origin develop"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 仓库尚未创建"
    echo ""
    echo "🔧 需要操作："
    echo "   1. 访问: https://github.com/new"
    echo "   2. 仓库名称: $REPO_NAME"
    echo "   3. 描述: AI辅助游戏系统 - 包含麻将、井字棋和Othello AI助手"
    echo "   4. 选择: Public"
    echo "   5. 不要初始化README"
    echo "   6. 点击创建"
    echo "   7. 然后重新运行此脚本验证"
else
    echo "⚠️  无法确定仓库状态"
    echo ""
    echo "🔧 建议："
    echo "   1. 手动访问: $REPO_URL"
    echo "   2. 检查仓库是否存在"
    echo "   3. 如果不存在，按照上述步骤创建"
fi

echo ""

