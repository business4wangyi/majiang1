#!/bin/bash

echo "开始最终麻将游戏测试..."

# 创建日志目录
mkdir -p final_logs

# 编译项目
npm run build

# 1. 特殊牌型测试
echo "========== 1. 特殊牌型测试 =========="
node dist/index.js --test --test-special-patterns > "final_logs/special_patterns.log" 2>&1
echo "特殊牌型测试完成，日志保存在 final_logs/special_patterns.log"

# 检查特殊牌型测试是否通过
if grep -q "所有测试✓ 全部通过" "final_logs/special_patterns.log"; then
    echo "✅ 特殊牌型测试全部通过"
else
    echo "❌ 特殊牌型测试有失败项"
fi

# 2. 使用现有的自动化测试脚本
echo "========== 2. 运行自动测试脚本 (1局) =========="
bash run_test_games.sh | head -n 20 > "final_logs/auto_test.log" 2>&1
killall -9 node > /dev/null 2>&1 || true
echo "自动测试脚本运行完成，日志保存在 final_logs/auto_test.log"

# 3. 检查规则引擎
echo "========== 3. 规则引擎检查 =========="
node dist/index.js --test --check-seven-pairs --check-thirteen-orphans > "final_logs/rule_engine.log" 2>&1
echo "规则引擎检查完成，日志保存在 final_logs/rule_engine.log"

# 结果汇总
echo "========== 测试结果汇总 =========="
echo "1. 特殊牌型测试: $(grep -q "所有测试✓ 全部通过" "final_logs/special_patterns.log" && echo "通过" || echo "失败")"
echo "2. 七对测试: $(grep -q "七对牌型测试结果: ✓ 通过" "final_logs/rule_engine.log" && echo "通过" || echo "失败")"
echo "3. 十三幺测试: $(grep -q "十三幺牌型测试结果: ✓ 通过" "final_logs/rule_engine.log" && echo "通过" || echo "失败")"

echo "最终测试完成！" 