/**
 * DQN训练启动器 - 带TensorFlow.js兼容性修复
 */

// 必须在任何其他模块加载之前设置polyfill
const util = require('util');
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = function(value) {
    return value === null || value === undefined;
  };
}

// 现在可以安全地加载TypeScript模块
require('ts-node/register');
const trainer = require('../../src/othello/strategy/dqn-trainer.ts');

if (trainer.runTraining) {
  trainer.runTraining().catch(console.error);
} else {
  console.error('❌ runTraining function not found');
}

