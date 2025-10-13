
// AlphaZero训练脚本 - 通过Desktop Commander MCP执行
const { AlphaZeroMCPRealTrainer } = require('./alphazero-mcp-real-trainer');

const config = {
  "totalIterations": 5,
  "selfPlayGames": 20,
  "trainingEpochs": 10,
  "experienceBufferSize": 2000,
  "batchSize": 16,
  "mctsSimulations": 250,
  "outputDir": "src/othello/training-output/dc-mcp-real",
  "enableMemoryOptimization": true,
  "memoryThresholdMB": 1500
};

console.log('🚀 通过Desktop Commander MCP启动AlphaZero训练...');
console.log('📋 配置:', JSON.stringify(config, null, 2));

const trainer = new AlphaZeroMCPRealTrainer(config);

trainer.startTraining()
  .then(() => {
    console.log('✅ Desktop Commander MCP训练完成！');
    const state = trainer.getTrainingState();
    console.log('📊 最终状态:', JSON.stringify(state, null, 2));
  })
  .catch(error => {
    console.error('❌ Desktop Commander MCP训练失败:', error);
    process.exit(1);
  });
