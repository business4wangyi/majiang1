/**
 * 测试TensorFlow.js神经网络基本功能
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 测试TensorFlow.js神经网络基本功能');
console.log('='.repeat(50));

/**
 * 创建测试脚本
 */
function createTestScript() {
  return `
import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

async function testNetwork() {
  console.log('🔥 初始化TensorFlow.js环境...');
  
  // 设置TensorFlow.js后端
  await tf.ready();
  console.log('✅ TensorFlow.js后端:', tf.getBackend());
  console.log('✅ 内存信息:', tf.memory());
  
  console.log('\\n🧠 创建神经网络...');
  const network = new MajiangAlphaZeroNetworkTF({
    hiddenLayers: [256, 128], // 较小的网络用于测试
    learningRate: 0.001,
    batchSize: 4,
    dropoutRate: 0.2
  });
  
  console.log('✅ 网络创建成功');
  console.log('📊 网络参数数量:', network.getParameterCount());
  console.log('⚙️ 网络配置:', JSON.stringify(network.getConfig(), null, 2));
  
  console.log('\\n🔍 测试前向传播...');
  
  // 创建模拟输入
  const mockStateVector = {
    handTiles: new Float32Array(136).map(() => Math.random()),
    visibleTiles: new Float32Array(136).map(() => Math.random()),
    playerStates: new Float32Array(32).map(() => Math.random()),
    gameContext: new Float32Array(16).map(() => Math.random())
  };
  
  try {
    const output = await network.forward(mockStateVector);
    console.log('✅ 前向传播成功');
    console.log('📈 动作概率维度:', output.actionProbabilities.length);
    console.log('📈 价值评估:', output.valueEstimation.toFixed(4));
    console.log('📈 动作概率前5个:', Array.from(output.actionProbabilities.slice(0, 5)).map(x => x.toFixed(4)));
    
    // 验证输出合理性
    const probSum = Array.from(output.actionProbabilities).reduce((a, b) => a + b, 0);
    console.log('📊 概率和:', probSum.toFixed(4), probSum > 0.99 && probSum < 1.01 ? '✅' : '❌');
    console.log('📊 价值范围:', output.valueEstimation >= -1 && output.valueEstimation <= 1 ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ 前向传播失败:', error);
    return false;
  }
  
  console.log('\\n🎯 测试批量训练...');
  
  try {
    // 创建模拟训练批次
    const batchSize = 4;
    const states = tf.randomNormal([batchSize, 320]) as tf.Tensor2D;
    const actionProbs = tf.softmax(tf.randomNormal([batchSize, 39])) as tf.Tensor2D;
    const values = tf.randomUniform([batchSize], -1, 1) as tf.Tensor1D;

    const batch = { states, actionProbs, values };
    
    console.log('📊 训练批次形状:');
    console.log('  - 状态:', states.shape);
    console.log('  - 动作概率:', actionProbs.shape);
    console.log('  - 价值:', values.shape);
    
    // 执行训练
    const loss = await network.trainBatch(batch);
    console.log('✅ 训练批次成功');
    console.log('📉 损失信息:');
    console.log('  - 总损失:', loss.totalLoss.toFixed(4));
    console.log('  - 策略损失:', loss.policyLoss.toFixed(4));
    console.log('  - 价值损失:', loss.valueLoss.toFixed(4));
    
    // 清理张量
    states.dispose();
    actionProbs.dispose();
    values.dispose();
    
  } catch (error) {
    console.error('❌ 训练失败:', error);
    return false;
  }
  
  console.log('\\n💾 测试模型保存...');
  
  try {
    const modelPath = './test-model';
    await network.saveModel(modelPath);
    console.log('✅ 模型保存成功:', modelPath);
  } catch (error) {
    console.error('❌ 模型保存失败:', error);
  }
  
  console.log('\\n🧹 清理资源...');
  network.dispose();
  
  console.log('\\n📊 最终内存信息:', tf.memory());
  
  console.log('\\n🎉 所有测试完成！');
  return true;
}

// 运行测试
testNetwork().then(success => {
  if (success) {
    console.log('\\n✅ TensorFlow.js神经网络测试通过');
    console.log('🚀 可以开始真实训练了！');
  } else {
    console.log('\\n❌ 测试失败，需要修复问题');
    process.exit(1);
  }
}).catch(error => {
  console.error('\\n💥 测试过程出错:', error);
  process.exit(1);
});
`;
}

/**
 * 运行测试
 */
async function runTest() {
  console.log('📝 创建测试脚本...');
  
  const testScript = createTestScript();
  const fs = require('fs');
  const tempTestPath = path.join(__dirname, 'temp-tf-test.ts');
  
  fs.writeFileSync(tempTestPath, testScript);
  console.log('✅ 测试脚本已创建');
  
  console.log('🎬 开始执行测试...');
  console.log('');
  
  // 使用ts-node执行测试
  const child = spawn('npx', ['ts-node', tempTestPath], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    console.log(`\\n🏁 测试进程结束，退出码: ${code}`);
    
    // 清理临时文件
    try {
      fs.unlinkSync(tempTestPath);
      console.log('🧹 临时文件已清理');
    } catch (error) {
      console.warn('⚠️ 清理临时文件失败:', error.message);
    }
    
    if (code === 0) {
      console.log('🎉 TensorFlow.js网络测试成功！');
      showNextSteps();
    } else {
      console.log('❌ 测试失败');
      showTroubleshooting();
    }
  });
  
  child.on('error', (error) => {
    console.error('💥 启动测试失败:', error);
    showTroubleshooting();
  });
}

/**
 * 显示下一步建议
 */
function showNextSteps() {
  console.log('\\n🚀 下一步建议:');
  console.log('1. 🎯 运行真实自对弈训练');
  console.log('2. 🔧 集成MCTS搜索算法');
  console.log('3. 📊 完善状态编码器');
  console.log('4. 🤖 测试与规则AI对战');
  console.log('5. 📈 监控训练进度和性能');
}

/**
 * 显示故障排除信息
 */
function showTroubleshooting() {
  console.log('\\n🔧 故障排除:');
  console.log('1. 检查TensorFlow.js安装: npm list @tensorflow/tfjs');
  console.log('2. 检查Node.js版本兼容性');
  console.log('3. 尝试重新安装依赖: npm install');
  console.log('4. 检查内存使用情况');
  console.log('5. 查看详细错误日志');
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('⏳ 准备测试TensorFlow.js神经网络...');
    console.log('💡 这将验证网络创建、前向传播和训练功能');
    console.log('');
    
    await runTest();
    
  } catch (error) {
    console.error('💥 测试启动失败:', error);
    process.exit(1);
  }
}

// 启动测试
main();
