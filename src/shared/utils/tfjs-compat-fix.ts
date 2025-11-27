/**
 * TensorFlow.js兼容性修复
 * 修复Node.js中util.isNullOrUndefined不存在的问题
 */

// 必须在导入TensorFlow.js之前执行
if (typeof require !== 'undefined') {
  const util = require('util');

// 为util模块添加isNullOrUndefined polyfill（如果不存在）
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = function(value: any): boolean {
    return value === null || value === undefined;
  };
  }
  
  // 确保在全局util对象上也存在
  if (typeof global !== 'undefined' && !(global as any).util) {
    (global as any).util = util;
  }
}

// 确保在所有使用TensorFlow.js的文件之前导入此文件
export {};

