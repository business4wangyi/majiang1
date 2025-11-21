/**
 * TensorFlow.js兼容性修复
 * 修复Node.js中util.isNullOrUndefined不存在的问题
 */

import * as util from 'util';

// 为util模块添加isNullOrUndefined polyfill（如果不存在）
if (!util.isNullOrUndefined) {
  (util as any).isNullOrUndefined = function(value: any): boolean {
    return value === null || value === undefined;
  };
}

// 确保在所有使用TensorFlow.js的文件之前导入此文件
export {};

