#!/bin/bash
# GitHub Token配置检查脚本

echo "🔍 GitHub Token配置检查"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo ""

# 检查1: 环境变量
echo ""
echo "1️⃣ 检查环境变量"
echo "----------------------------------------"
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    TOKEN_PREFIX=$(echo $GITHUB_PERSONAL_ACCESS_TOKEN | cut -c1-10)
    TOKEN_LENGTH=${#GITHUB_PERSONAL_ACCESS_TOKEN}
    echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN 已设置"
    echo "   Token前缀: $TOKEN_PREFIX..."
    echo "   Token长度: $TOKEN_LENGTH 字符"
    
    # 验证Token有效性
    echo ""
    echo "   正在验证Token..."
    USER_INFO=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user)
    
    if echo "$USER_INFO" | grep -q '"login"'; then
        USERNAME=$(echo "$USER_INFO" | grep '"login"' | head -1 | sed 's/.*"login": "\([^"]*\)".*/\1/')
        NAME=$(echo "$USER_INFO" | grep '"name"' | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/' || echo "未设置")
        echo "   ✅ Token有效"
        echo "   👤 GitHub用户名: $USERNAME"
        echo "   📝 显示名称: $NAME"
        
        # 检查是否是business4wangyi
        if [ "$USERNAME" = "business4wangyi" ]; then
            echo "   ✅ 用户名匹配: business4wangyi"
        else
            echo "   ⚠️  用户名不匹配！当前: $USERNAME，期望: business4wangyi"
        fi
    else
        echo "   ❌ Token无效或已过期"
        echo "   错误信息: $USER_INFO"
    fi
else
    echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN 未设置"
fi

# 检查2: Shell配置文件
echo ""
echo "2️⃣ 检查Shell配置文件"
echo "----------------------------------------"
if [ -f ~/.zshrc ]; then
    if grep -q "GITHUB.*TOKEN" ~/.zshrc; then
        echo "✅ 在 ~/.zshrc 中找到GitHub Token配置"
        grep "GITHUB.*TOKEN" ~/.zshrc | sed 's/\(.*TOKEN=\)\([^"]*\)/\1***隐藏***/'
    else
        echo "❌ ~/.zshrc 中未找到GitHub Token配置"
    fi
else
    echo "⚠️  ~/.zshrc 文件不存在"
fi

if [ -f ~/.bashrc ]; then
    if grep -q "GITHUB.*TOKEN" ~/.bashrc; then
        echo "✅ 在 ~/.bashrc 中找到GitHub Token配置"
        grep "GITHUB.*TOKEN" ~/.bashrc | sed 's/\(.*TOKEN=\)\([^"]*\)/\1***隐藏***/'
    else
        echo "❌ ~/.bashrc 中未找到GitHub Token配置"
    fi
else
    echo "⚠️  ~/.bashrc 文件不存在"
fi

# 检查3: .env文件
echo ""
echo "3️⃣ 检查.env文件"
echo "----------------------------------------"
if [ -f .env ]; then
    if grep -q "GITHUB.*TOKEN" .env; then
        echo "✅ 在项目根目录的.env文件中找到GitHub Token配置"
        grep "GITHUB.*TOKEN" .env | sed 's/\(.*TOKEN=\)\([^"]*\)/\1***隐藏***/'
    else
        echo "❌ .env文件中未找到GitHub Token配置"
    fi
else
    echo "⚠️  项目根目录没有.env文件"
fi

# 检查4: Cursor MCP配置
echo ""
echo "4️⃣ 检查Cursor MCP配置"
echo "----------------------------------------"
CURSOR_MCP_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"
if [ -f "$CURSOR_MCP_PATH" ]; then
    echo "✅ 找到Cursor MCP配置文件"
    echo "   路径: $CURSOR_MCP_PATH"
    if grep -q "github" "$CURSOR_MCP_PATH" -i; then
        echo "   ✅ 配置文件中包含GitHub相关配置"
        # 显示配置（隐藏token）
        grep -A 5 "github" "$CURSOR_MCP_PATH" -i | sed 's/\(.*token.*:.*"\)\([^"]*\)/\1***隐藏***/'
    else
        echo "   ❌ 配置文件中未找到GitHub配置"
    fi
else
    echo "⚠️  Cursor MCP配置文件不存在"
    echo "   预期路径: $CURSOR_MCP_PATH"
fi

# 检查5: GitHub CLI
echo ""
echo "5️⃣ 检查GitHub CLI配置"
echo "----------------------------------------"
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI已安装"
    if gh auth status &> /dev/null; then
        echo "   ✅ GitHub CLI已登录"
        gh auth status 2>&1 | grep -E "Logged in|Logged out|Token" | head -3
    else
        echo "   ❌ GitHub CLI未登录"
    fi
else
    echo "⚠️  GitHub CLI未安装"
    echo "   安装方法: brew install gh"
fi

# 检查6: Token权限测试
echo ""
echo "6️⃣ Token权限测试"
echo "----------------------------------------"
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    # 测试基本权限
    echo "   测试基本API访问..."
    API_TEST=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user)
    if echo "$API_TEST" | grep -q '"login"'; then
        echo "   ✅ 基本API访问正常"
    else
        echo "   ❌ 基本API访问失败"
    fi
    
    # 测试仓库访问权限
    echo "   测试仓库访问权限..."
    REPO_TEST=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user/repos?per_page=1)
    if echo "$REPO_TEST" | grep -q '"name"'; then
        echo "   ✅ 仓库访问权限正常"
    elif echo "$REPO_TEST" | grep -q '"message"'; then
        ERROR_MSG=$(echo "$REPO_TEST" | grep '"message"' | head -1)
        echo "   ❌ 仓库访问权限不足: $ERROR_MSG"
    else
        echo "   ⚠️  无法确定仓库访问权限"
    fi
    
    # 测试Actions权限
    echo "   测试Actions权限..."
    ACTIONS_TEST=$(curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user)
    echo "   ℹ️  Actions权限需要在实际仓库中测试"
fi

# 总结
echo ""
echo "📊 检查总结"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo ""
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "✅ Token已配置"
    if [ "$USERNAME" = "business4wangyi" ]; then
        echo "✅ Token对应的账户正确: business4wangyi"
        echo ""
        echo "🎯 下一步："
        echo "   1. 在GitHub网页创建 majiang1 仓库"
        echo "   2. 推送代码: git push -u origin develop"
        echo "   3. 测试GitHub Actions工作流"
    else
        echo "⚠️  Token对应的账户不正确"
        echo "   当前账户: $USERNAME"
        echo "   期望账户: business4wangyi"
        echo ""
        echo "🔧 需要修复："
        echo "   1. 使用 business4wangyi 账户创建新Token"
        echo "   2. 更新环境变量或MCP配置"
    fi
else
    echo "❌ Token未配置"
    echo ""
    echo "🔧 需要配置："
    echo "   1. 创建GitHub Personal Access Token"
    echo "   2. 设置环境变量: export GITHUB_PERSONAL_ACCESS_TOKEN='your_token'"
    echo "   3. 或配置到Cursor MCP"
fi

echo ""

