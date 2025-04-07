#!/bin/bash

echo "开始运行5局麻将游戏测试..."

# 创建日志目录
mkdir -p test_logs

# 编译项目
npm run build

# 运行5局游戏
for i in {1..5}
do
    echo "========== 开始第 $i 局游戏 =========="
    node dist/index.js --test --debug > "test_logs/game_$i.log" 2>&1
    echo "第 $i 局游戏完成，日志保存在 test_logs/game_$i.log"
    
    # 检查是否有胡牌
    if grep -q "胡牌" "test_logs/game_$i.log"; then
        echo "✅ 第 $i 局有玩家胡牌"
    else
        echo "❌ 第 $i 局没有玩家胡牌"
    fi
    
    # 检查游戏是否正常结束
    if grep -q "游戏已结束" "test_logs/game_$i.log"; then
        echo "✓ 游戏正常结束"
    else
        echo "× 游戏异常结束"
    fi
    
    echo ""
done

echo "测试完成，开始分析结果..."
echo "胡牌情况汇总："
grep "胡牌" -A 5 test_logs/*.log | grep -E "玩家|AI" | sort | uniq -c

echo "检查胡牌逻辑触发情况："
grep "canHu.*常规胡牌检查结果: 可以胡牌" test_logs/*.log -c

echo "检查游戏状态："
grep "游戏状态: ENDED" test_logs/*.log -c

echo "全部测试完成！" 