#!/bin/bash

# 1. 创建新目录结构
mkdir -p src/majiang
mkdir -p src/othello
mkdir -p src/tic-tac-toe
mkdir -p src/ai/framework
mkdir -p src/ai/models
mkdir -p src/ai/utils
mkdir -p src/common
mkdir -p tests
mkdir -p scripts
mkdir -p docs

# 2. 移动麻将相关文件到 src/majiang
mv src/player.ts src/majiang/
mv src/ai-player.ts src/majiang/
mv src/game.ts src/majiang/
mv src/gameLoop.ts src/majiang/
mv src/game-event-handler.ts src/majiang/
# 你可以根据实际情况继续添加麻将相关文件
# mv src/xxx.ts src/majiang/

# 3. 移动通用AI相关文件到 src/ai/framework 或 src/ai/models
# 假如你有遗传算法、强化学习等通用AI代码
# mv src/genetic.ts src/ai/framework/
# mv src/rl.ts src/ai/framework/
# mv src/base-ai.ts src/ai/models/

# 4. 移动通用工具/类型到 src/common
# mv src/utils.ts src/common/
# mv src/types.ts src/common/

# 5. 预留黑白棋、井字棋目录（可后续开发时添加文件）
touch src/othello/.keep
touch src/tic-tac-toe/.keep

# 6. 移动测试、脚本、文档（如有）
# mv src/tests/* tests/
# mv src/scripts/* scripts/
# mv src/docs/* docs/

echo "目录结构迁移完成！请检查 src/majiang、src/ai、src/common 等目录。"