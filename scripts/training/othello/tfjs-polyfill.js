/**
 * TensorFlow.js Polyfill for Training Scripts
 * 在训练脚本中统一导入TensorFlow.js兼容性修复
 */

// 修复util.isNullOrUndefined兼容性问题（必须在导入TensorFlow.js之前执行）
if (typeof require !== 'undefined') {
  const util = require('util');
  
  // 为util模块添加isNullOrUndefined polyfill（如果不存在）
  if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = function(value) {
      return value === null || value === undefined;
    };
  }
  
  // 确保在全局util对象上也存在
  if (typeof global !== 'undefined' && !global.util) {
    global.util = util;
  }
}

// 导入TensorFlow.js Node.js版本
require('@tensorflow/tfjs-node');

// 初始化TensorFlow.js优化（简化版本，避免TypeScript依赖）
try {
  // 设置TensorFlow.js环境变量
  process.env.TF_CPP_MIN_LOG_LEVEL = '2'; // 减少日志输出
} catch (e) {
  // 忽略错误
}

console.log('✅ TensorFlow.js polyfill loaded');

