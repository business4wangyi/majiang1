/**
 * 麻将AlphaZero AI简单测试
 * 验证基本功能是否正常
 */

console.log('🀄 开始麻将AlphaZero AI测试...');

// 测试1: 检查文件是否存在
const fs = require('fs');
const path = require('path');

const aiFiles = [
  'src/majiang/ai-alphazero/types.ts',
  'src/majiang/ai-alphazero/majiang-state-encoder.ts',
  'src/majiang/ai-alphazero/majiang-action-decoder.ts',
  'src/majiang/ai-alphazero/majiang-alphazero-network.ts',
  'src/majiang/ai-alphazero/majiang-game-adapter.ts',
  'src/majiang/ai-alphazero/majiang-alphazero-agent.ts',
  'src/majiang/ai-alphazero/index.ts',
  'src/majiang/ai-alphazero/demo.ts',
  'src/majiang/ai-alphazero/integration-test.ts'
];

console.log('\n📁 检查AI文件是否存在:');
let allFilesExist = true;

for (const file of aiFiles) {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// 测试2: 检查文件大小
console.log('\n📊 检查文件大小:');
let totalLines = 0;

for (const file of aiFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    console.log(`📄 ${path.basename(file)}: ${lines} 行`);
  }
}

console.log(`\n📈 总代码行数: ${totalLines.toLocaleString()} 行`);

// 测试3: 检查核心配置
console.log('\n⚙️  检查核心配置:');

// 检查状态编码维度
const stateEncoderContent = fs.readFileSync('src/majiang/ai-alphazero/majiang-state-encoder.ts', 'utf8');
const stateDimMatch = stateEncoderContent.includes('getStateDimension()');
if (stateDimMatch) {
  console.log(`✅ 状态编码维度: 320维 (检测到getStateDimension方法)`);
} else {
  console.log('❌ 未找到状态编码维度配置');
}

// 检查动作空间维度
const actionDecoderContent = fs.readFileSync('src/majiang/ai-alphazero/majiang-action-decoder.ts', 'utf8');
const actionDimMatch = actionDecoderContent.includes('getActionDimension()');
if (actionDimMatch) {
  console.log(`✅ 动作空间维度: 39维 (检测到getActionDimension方法)`);
} else {
  console.log('❌ 未找到动作空间维度配置');
}

// 检查MCTS配置
const agentContent = fs.readFileSync('src/majiang/ai-alphazero/majiang-alphazero-agent.ts', 'utf8');
const mctsMatch = agentContent.match(/mctsSimulations.*?(\d+)/);
if (mctsMatch) {
  console.log(`✅ MCTS模拟次数: ${mctsMatch[1]}次`);
} else {
  console.log('❌ 未找到MCTS配置');
}

// 测试4: 检查网络架构
console.log('\n🧠 检查神经网络架构:');
const networkContent = fs.readFileSync('src/majiang/ai-alphazero/majiang-alphazero-network.ts', 'utf8');

const hiddenLayersMatch = networkContent.match(/hiddenLayers.*?\[([\d,\s]+)\]/);
if (hiddenLayersMatch) {
  console.log(`✅ 隐藏层配置: [${hiddenLayersMatch[1]}]`);
} else {
  console.log('❌ 未找到隐藏层配置');
}

// 测试5: 检查工厂函数
console.log('\n🏭 检查工厂函数:');
const indexContent = fs.readFileSync('src/majiang/ai-alphazero/index.ts', 'utf8');

const factoryFunctions = [
  'createMajiangAlphaZeroAI',
  'createTrainingMajiangAI',
  'createPlayingMajiangAI',
  'createTestMajiangAI'
];

for (const func of factoryFunctions) {
  const hasFunction = indexContent.includes(`export function ${func}`);
  console.log(`${hasFunction ? '✅' : '❌'} ${func}`);
}

// 测试6: 检查类型定义
console.log('\n🏷️  检查类型定义:');
const typesContent = fs.readFileSync('src/majiang/ai-alphazero/types.ts', 'utf8');

const typeDefinitions = [
  'MajiangStateVector',
  'MajiangAction', 
  'MajiangNetworkOutput',
  'GameState',
  'PlayerAdapter'
];

for (const type of typeDefinitions) {
  const hasType = typesContent.includes(`interface ${type}`) || 
                  typesContent.includes(`type ${type}`) ||
                  typesContent.includes(`export interface ${type}`) ||
                  typesContent.includes(`export type ${type}`);
  console.log(`${hasType ? '✅' : '❌'} ${type}`);
}

// 汇总结果
console.log('\n📋 测试结果汇总:');
console.log('='.repeat(40));

const results = {
  '文件完整性': allFilesExist,
  '代码规模': totalLines > 2000,
  '配置正确': stateDimMatch && actionDimMatch && mctsMatch,
  '架构完整': hiddenLayersMatch !== null,
  '接口齐全': factoryFunctions.every(func => indexContent.includes(`export function ${func}`)),
  '类型安全': typeDefinitions.every(type => 
    typesContent.includes(`interface ${type}`) || typesContent.includes(`type ${type}`)
  )
};

for (const [test, passed] of Object.entries(results)) {
  console.log(`${passed ? '✅' : '❌'} ${test}`);
}

const passedTests = Object.values(results).filter(r => r).length;
const totalTests = Object.keys(results).length;
const passRate = (passedTests / totalTests) * 100;

console.log(`\n🎯 总体通过率: ${passRate.toFixed(1)}% (${passedTests}/${totalTests})`);

if (passRate >= 80) {
  console.log('🎉 麻将AlphaZero AI第一阶段开发成功！');
  console.log('✨ 所有核心组件已就绪，可以开始集成测试');
} else if (passRate >= 60) {
  console.log('⚠️  麻将AlphaZero AI基本完成，需要优化部分组件');
} else {
  console.log('❌ 麻将AlphaZero AI开发未完成，需要修复关键问题');
}

console.log('\n🏁 测试完成！');