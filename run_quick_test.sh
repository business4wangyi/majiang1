#!/bin/bash

echo "开始运行快速麻将游戏测试..."

# 创建日志目录
mkdir -p quick_logs

# 编译项目
npm run build

# 测试基本规则和特殊牌型
echo "========== 测试基本规则和特殊牌型 =========="
node dist/index.js --test --test-special-patterns > "quick_logs/special_patterns.log" 2>&1
echo "测试完成，日志保存在 quick_logs/special_patterns.log"

# 检查测试是否通过
if grep -q "所有测试✓ 全部通过" "quick_logs/special_patterns.log"; then
    echo "✅ 特殊牌型测试全部通过"
else
    echo "❌ 特殊牌型测试有失败项"
fi

# 运行一局完整游戏
echo "========== 运行一局完整游戏 =========="
node dist/index.js --test --debug > "quick_logs/full_game.log" 2>&1
echo "游戏完成，日志保存在 quick_logs/full_game.log"

# 检查是否有胡牌
if grep -q "胡牌" "quick_logs/full_game.log"; then
    echo "✅ 游戏中有玩家胡牌"
else
    echo "❌ 游戏中没有玩家胡牌"
fi

# 检查游戏是否正常结束
if grep -q "游戏已结束" "quick_logs/full_game.log"; then
    echo "✓ 游戏正常结束"
else
    echo "× 游戏异常结束"
fi

echo "快速测试完成！" 