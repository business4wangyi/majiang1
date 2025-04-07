#!/bin/bash

echo "开始运行标准模式麻将游戏测试..."

# 创建日志目录
mkdir -p standard_logs

# 编译项目
npm run build

# 运行5局标准模式游戏
for i in {1..5}
do
    echo "========== 开始第 $i 局标准模式游戏 =========="
    node dist/index.js --debug > "standard_logs/game_$i.log" 2>&1
    echo "第 $i 局游戏完成，日志保存在 standard_logs/game_$i.log"
    
    # 检查是否有胡牌
    if grep -q "胡牌" "standard_logs/game_$i.log"; then
        echo "✅ 第 $i 局有玩家胡牌"
    else
        echo "❌ 第 $i 局没有玩家胡牌"
    fi
    
    # 检查游戏是否正常结束
    if grep -q "游戏已结束" "standard_logs/game_$i.log"; then
        echo "✓ 游戏正常结束"
    else
        echo "× 游戏异常结束"
    fi
    
    echo ""
done

echo "标准测试完成，开始分析结果..."
echo "胡牌情况汇总："
grep "胡牌" -A 5 standard_logs/*.log | grep -E "玩家|AI" | sort | uniq -c

echo "检查胡牌逻辑触发情况："
grep "canHu.*常规胡牌检查结果: 可以胡牌" standard_logs/*.log -c

echo "检查七对判断情况："
grep "\[RuleEngine.isSevenPairs\]" standard_logs/*.log | grep -E "检测到.*七对" -c

echo "检查十三幺判断情况："
grep "\[RuleEngine.isThirteenOrphans\]" standard_logs/*.log | grep -E "确认为十三幺" -c

echo "检查游戏状态："
grep "游戏状态: ENDED" standard_logs/*.log -c

echo "全部标准测试完成！" 