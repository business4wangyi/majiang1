#!/bin/bash

echo "开始运行特殊牌型测试..."

# 创建日志目录
mkdir -p special_logs

# 编译项目
npm run build

# 运行测试模式下的游戏，但重点关注特殊牌型
echo "========== 测试七对牌型 =========="
node dist/index.js --test --debug --check-seven-pairs > "special_logs/seven_pairs.log" 2>&1
echo "七对测试完成，日志保存在 special_logs/seven_pairs.log"

# 检查是否检测到七对
if grep -q "七对牌型测试结果: ✓ 通过" "special_logs/seven_pairs.log"; then
    echo "✅ 成功检测到七对牌型"
else
    echo "❌ 未检测到七对牌型"
fi

echo "========== 测试十三幺牌型 =========="
node dist/index.js --test --debug --check-thirteen-orphans > "special_logs/thirteen_orphans.log" 2>&1
echo "十三幺测试完成，日志保存在 special_logs/thirteen_orphans.log"

# 检查是否检测到十三幺
if grep -q "十三幺牌型测试结果: ✓ 通过" "special_logs/thirteen_orphans.log"; then
    echo "✅ 成功检测到十三幺牌型"
else
    echo "❌ 未检测到十三幺牌型"
fi

echo "========== 测试清一色牌型 =========="
node dist/index.js --test --debug --check-qing-yi-se > "special_logs/qing_yi_se.log" 2>&1
echo "清一色测试完成，日志保存在 special_logs/qing_yi_se.log"

# 检查是否检测到清一色
if grep -q "清一色牌型测试结果: ✓ 通过" "special_logs/qing_yi_se.log"; then
    echo "✅ 成功检测到清一色牌型"
else
    echo "❌ 未检测到清一色牌型"
fi

echo "========== 测试碰碰胡牌型 =========="
node dist/index.js --test --debug --check-peng-peng-hu > "special_logs/peng_peng_hu.log" 2>&1
echo "碰碰胡测试完成，日志保存在 special_logs/peng_peng_hu.log"

# 检查是否检测到碰碰胡
if grep -q "碰碰胡牌型测试结果: ✓ 通过" "special_logs/peng_peng_hu.log"; then
    echo "✅ 成功检测到碰碰胡牌型"
else
    echo "❌ 未检测到碰碰胡牌型"
fi

echo "========== 测试大四喜牌型 =========="
node dist/index.js --test --debug --check-big-four-winds > "special_logs/big_four_winds.log" 2>&1
echo "大四喜测试完成，日志保存在 special_logs/big_four_winds.log"

# 检查是否检测到大四喜
if grep -q "大四喜牌型测试结果: ✓ 通过" "special_logs/big_four_winds.log"; then
    echo "✅ 成功检测到大四喜牌型"
else
    echo "❌ 未检测到大四喜牌型"
fi

echo "========== 测试大三元牌型 =========="
node dist/index.js --test --debug --check-big-three-dragons > "special_logs/big_three_dragons.log" 2>&1
echo "大三元测试完成，日志保存在 special_logs/big_three_dragons.log"

# 检查是否检测到大三元
if grep -q "大三元牌型测试结果: ✓ 通过" "special_logs/big_three_dragons.log"; then
    echo "✅ 成功检测到大三元牌型"
else
    echo "❌ 未检测到大三元牌型"
fi

echo "========== 测试小四喜牌型 =========="
node dist/index.js --test --debug --check-small-four-winds > "special_logs/small_four_winds.log" 2>&1
echo "小四喜测试完成，日志保存在 special_logs/small_four_winds.log"

# 检查是否检测到小四喜
if grep -q "小四喜牌型测试结果: ✓ 通过" "special_logs/small_four_winds.log"; then
    echo "✅ 成功检测到小四喜牌型"
else
    echo "❌ 未检测到小四喜牌型"
fi

echo "========== 测试小三元牌型 =========="
node dist/index.js --test --debug --check-small-three-dragons > "special_logs/small_three_dragons.log" 2>&1
echo "小三元测试完成，日志保存在 special_logs/small_three_dragons.log"

# 检查是否检测到小三元
if grep -q "小三元牌型测试结果: ✓ 通过" "special_logs/small_three_dragons.log"; then
    echo "✅ 成功检测到小三元牌型"
else
    echo "❌ 未检测到小三元牌型"
fi

echo "========== 测试字一色牌型 =========="
node dist/index.js --test --debug --check-all-honors > "special_logs/all_honors.log" 2>&1
echo "字一色测试完成，日志保存在 special_logs/all_honors.log"

# 检查是否检测到字一色
if grep -q "字一色牌型测试结果: ✓ 通过" "special_logs/all_honors.log"; then
    echo "✅ 成功检测到字一色牌型"
else
    echo "❌ 未检测到字一色牌型"
fi

echo "特殊牌型测试完成，开始分析结果..."

echo "七对检测情况："
grep -A 3 "\[RuleEngine.testSevenPairs\] 测试结果" "special_logs/seven_pairs.log" || echo "未找到七对检测记录"

echo "十三幺检测情况："
grep -A 3 "\[RuleEngine.testThirteenOrphans\] 测试结果" "special_logs/thirteen_orphans.log" || echo "未找到十三幺检测记录"

echo "清一色检测情况："
grep -A 3 "\[RuleEngine.testQingYiSe\] 测试结果" "special_logs/qing_yi_se.log" || echo "未找到清一色检测记录"

echo "碰碰胡检测情况："
grep -A 3 "\[RuleEngine.testPengPengHu\] 测试结果" "special_logs/peng_peng_hu.log" || echo "未找到碰碰胡检测记录"

echo "大四喜检测情况："
grep -A 3 "\[RuleEngine.testBigFourWinds\] 测试结果" "special_logs/big_four_winds.log" || echo "未找到大四喜检测记录"

echo "大三元检测情况："
grep -A 3 "\[RuleEngine.testBigThreeDragons\] 测试结果" "special_logs/big_three_dragons.log" || echo "未找到大三元检测记录"

echo "小四喜检测情况："
grep -A 3 "\[RuleEngine.testSmallFourWinds\] 测试结果" "special_logs/small_four_winds.log" || echo "未找到小四喜检测记录"

echo "小三元检测情况："
grep -A 3 "\[RuleEngine.testSmallThreeDragons\] 测试结果" "special_logs/small_three_dragons.log" || echo "未找到小三元检测记录"

echo "字一色检测情况："
grep -A 3 "\[RuleEngine.testAllHonors\] 测试结果" "special_logs/all_honors.log" || echo "未找到字一色检测记录"

echo "全部特殊牌型测试完成！"

# 注意：此脚本需要在src/index.ts中添加相应的命令行参数处理
# 如 --check-seven-pairs, --check-thirteen-orphans 等 