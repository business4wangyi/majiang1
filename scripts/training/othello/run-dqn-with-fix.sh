#!/bin/bash
# TensorFlow.js兼容性修复启动脚本

cd "$(dirname "$0")/../../.."

# 在Node.js中设置polyfill
node -r ts-node/register -e "
const util = require('util');
util.isNullOrUndefined = util.isNullOrUndefined || function(value) {
  return value === null || value === undefined;
};
require('./src/othello/strategy/dqn-trainer.ts');
" "$@"

