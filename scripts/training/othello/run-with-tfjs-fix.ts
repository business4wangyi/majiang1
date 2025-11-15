/**
 * TensorFlow.js兼容性修复启动器
 * 在加载TensorFlow.js之前修复util.isNullOrUndefined问题
 */

// 必须在任何其他导入之前执行
import * as util from 'util';
if (!util.isNullOrUndefined) {
  (util as any).isNullOrUndefined = function(value: any): boolean {
    return value === null || value === undefined;
  };
}

// 现在可以安全地导入TensorFlow.js相关模块
export {};

