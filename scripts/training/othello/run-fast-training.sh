#!/bin/bash

# AlphaZero快速训练脚本
# 按照文档配置运行完整训练

echo "🚀 启动AlphaZero快速训练（完整训练模式）"
echo "=========================================="
echo ""

# 检测CPU核心数
CPU_CORES=$(node -e "const os = require('os'); console.log(os.cpus().length);")
PARALLEL_GAMES=$((CPU_CORES - 2))  # 留2个核心给系统

echo "📊 系统信息:"
echo "   CPU核心数: $CPU_CORES"
echo "   并行游戏数: $PARALLEL_GAMES"
echo ""

# 设置训练参数（按照文档推荐配置）
export ALPHAZERO_TOTAL_ITERATIONS=100
export ALPHAZERO_SELFPLAY_GAMES=80
export ALPHAZERO_PARALLEL_GAMES=$PARALLEL_GAMES
export ALPHAZERO_INITIAL_MCTS=200
export ALPHAZERO_FINAL_MCTS=600
export ALPHAZERO_EARLY_EPOCHS=10
export ALPHAZERO_LATE_EPOCHS=20
export ALPHAZERO_EVAL_FREQUENCY=10
export ALPHAZERO_SAVE_FREQUENCY=10

echo "⚙️ 训练配置:"
echo "   总迭代次数: $ALPHAZERO_TOTAL_ITERATIONS"
echo "   自我对弈局数: $ALPHAZERO_SELFPLAY_GAMES"
echo "   并行游戏数: $ALPHAZERO_PARALLEL_GAMES"
echo "   MCTS模拟: $ALPHAZERO_INITIAL_MCTS → $ALPHAZERO_FINAL_MCTS"
echo "   训练轮数: 早期$ALPHAZERO_EARLY_EPOCHS / 后期$ALPHAZERO_LATE_EPOCHS"
echo "   评估频率: 每$ALPHAZERO_EVAL_FREQUENCY次迭代"
echo ""

# 记录开始时间
START_TIME=$(date +%s)
echo "⏰ 训练开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 运行训练
npm run othello:alphazero-fast-train

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "=========================================="
echo "✅ 训练完成！"
echo "⏰ 训练结束时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "⏱️ 总用时: ${HOURS}小时 ${MINUTES}分钟 ${SECONDS}秒"
echo "=========================================="




