/**
 * TensorFlow.js兼容性polyfill
 * 必须在加载任何TensorFlow.js模块之前执行
 */

const util = require('util');
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = function(value) {
    return value === null || value === undefined;
  };
}

