#!/bin/bash

# 需要替换的文件名列表
FILES=("player" "game" "ai-player" "game-event-handler" "gameLoop" "tile" "tile-manager" "display-manager" "rule-engine" "score-calculator" "win-conditions")

# 遍历所有 ts 文件
find src -type f -name "*.ts" | while read file; do
  for name in "${FILES[@]}"; do
    # 只替换以 ./ 或 ../ 开头的本地导入
    sed -i '' "s#from './$name'#from './majiang/$name'#g" "$file"
    sed -i '' "s#from \"./$name\"#from \"./majiang/$name\"#g" "$file"
    sed -i '' "s#from '../$name'#from '../majiang/$name'#g" "$file"
    sed -i '' "s#from \"../$name\"#from \"../majiang/$name\"#g" "$file"
  done
done

echo "批量替换完成！请检查 src/ 目录下的 import 路径。"
