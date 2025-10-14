/**
 * 麻将AlphaZero AI真实训练启动脚本
 * 基于TensorFlow.js的完整训练实现
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🀄 麻将AlphaZero AI真实训练启动');
console.log('='.repeat(50));

/**
 * 显示真实训练配置信息
 */
function showRealTrainingConfig() {
  console.log('⚙️ 真实训练配置信息:');
  console.log('   神经网络: TensorFlow.js');
  console.log('   输入维度: 320维状态向量');
  console.log('   输出维度: 39维动作概率 + 1维价值');
  console.log('   网络架构: [512, 256, 128] 隐藏层');
  console.log('   激活函数: ReLU');
  console.log('   优化器: Adam');
  console.log('   学习率: 0.001');
  console.log('   批次大小: 32');
  console.log('   Dropout: 0.3');
  console.log('');
  
  console.log('🎯 训练目标:');
  console.log('   阶段1: 基础训练 (100局)');
  console.log('   阶段2: 稳定性优化 (500局)');
  console.log('   阶段3: 性能提升 (1000局)');
  console.log('   目标性能: 60-70分 AI水平');
  console.log('');
  
  console.log('📊 训练特性:');
  console.log('   ✅ 真实神经网络训练');
  console.log('   ✅ 自对弈数据收集');
  console.log('   ✅ 梯度更新和权重优化');
  console.log('   ✅ 模型保存和加载');
  console.log('   ✅ 实时训练监控');
  console.log('   ✅ 内存管理和优化');
  console.log('');
}

/**
 * 启动真实训练
 */
async function startRealTraining() {
  console.log('🚀 启动真实训练进程...');
  
  // 构建TypeScript文件路径
  const trainerPath = path.join(__dirname, '../../src/majiang/ai-alphazero/real-self-play-trainer.ts');
  
  // 创建启动脚本
  const startScript = `
import { RealSelfPlayTrainer, DEFAULT_REAL_TRAINING_CONFIG } from '../../src/majiang/ai-alphazero/real-self-play-trainer';

async function main() {
  console.log('🔥 初始化真实训练器...');
  
  const trainer = new RealSelfPlayTrainer({
    totalGames: 100,        // 演示用较少局数
    saveInterval: 20,       // 每20局保存一次
    evaluationInterval: 10, // 每10局评估一次
    logInterval: 5,         // 每5局记录一次
    mctsSimulations: 200,   // 较少的MCTS模拟（演示用）
    batchSize: 16,          // 较小的批次大小
    learningRate: 0.001,
    temperature: 1.0,
    modelSavePath: './models/majiang-real-training'
  });
  
  try {
    await trainer.startTraining();
    console.log('✅ 训练完成！');
  } catch (error) {
    console.error('❌ 训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

main().catch(console.error);
`;

  // 写入临时启动文件
  const fs = require('fs');
  const tempScriptPath = path.join(__dirname, 'temp-real-training.ts');
  fs.writeFileSync(tempScriptPath, startScript);
  
  console.log('📝 临时启动脚本已创建');
  console.log('🎬 开始执行训练...');
  console.log('');
  
  // 使用ts-node执行
  const child = spawn('npx', ['ts-node', tempScriptPath], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    console.log(`\n🏁 训练进程结束，退出码: ${code}`);
    
    // 清理临时文件
    try {
      fs.unlinkSync(tempScriptPath);
      console.log('🧹 临时文件已清理');
    } catch (error) {
      console.warn('⚠️ 清理临时文件失败:', error.message);
    }
    
    if (code === 0) {
      console.log('🎉 真实训练成功完成！');
      showNextSteps();
    } else {
      console.log('❌ 训练过程中出现错误');
      showTroubleshooting();
    }
  });
  
  child.on('error', (error) => {
    console.error('💥 启动训练失败:', error);
    showTroubleshooting();
  });
}

/**
 * 显示下一步建议
 */
function showNextSteps() {
  console.log('\n🚀 下一步建议:');
  console.log('1. 📊 检查训练日志和损失曲线');
  console.log('2. 🎯 测试训练后的模型性能');
  console.log('3. 🔧 根据结果调整超参数');
  console.log('4. 📈 进行更长时间的训练');
  console.log('5. 🤖 与规则AI进行对战测试');
  console.log('6. 💾 备份最佳模型');
}

/**
 * 显示故障排除信息
 */
function showTroubleshooting() {
  console.log('\n🔧 故障排除:');
  console.log('1. 检查TensorFlow.js依赖是否正确安装');
  console.log('2. 确认Node.js版本兼容性');
  console.log('3. 检查内存使用情况');
  console.log('4. 查看详细错误日志');
  console.log('5. 尝试减少批次大小或游戏数量');
}

/**
 * 主函数
 */
async function main() {
  try {
    showRealTrainingConfig();
    
    console.log('⏳ 准备启动真实训练...');
    console.log('💡 这将使用真实的TensorFlow.js神经网络进行训练');
    console.log('⚠️ 请确保有足够的内存和计算资源');
    console.log('');
    
    // 等待用户确认
    console.log('按 Enter 键开始训练，或 Ctrl+C 取消...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    await startRealTraining();
    
  } catch (error) {
    console.error('💥 启动过程出错:', error);
    process.exit(1);
  }
}

// 启动训练
main();
