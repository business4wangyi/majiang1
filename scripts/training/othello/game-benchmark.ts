/**
 * 黑白棋游戏基准测试
 * 使用 OthelloGame 类运行多局游戏，测试纯游戏逻辑的耗时
 */

import { OthelloGame } from '../../../src/othello/core/game';
import { RandomOthelloAgent } from '../../../src/othello/strategy';
import { GreedyOthelloAgent } from '../../../src/othello/strategy';
import { HeuristicOthelloAgent } from '../../../src/othello/strategy';

type AgentType = 'random' | 'greedy' | 'heuristic';

function runGameBenchmark(gameCount: number, agentType: AgentType = 'random'): void {
  console.log('\n🚀 开始黑白棋游戏基准测试...');
  console.log(`   总对局数: ${gameCount}`);
  console.log(`   策略类型: ${agentType}`);
  console.log('='.repeat(80));

  // 创建智能体
  const agentB = agentType === 'random' ? new RandomOthelloAgent() :
                 agentType === 'greedy' ? new GreedyOthelloAgent() :
                 new HeuristicOthelloAgent();
  const agentW = agentType === 'random' ? new RandomOthelloAgent() :
                 agentType === 'greedy' ? new GreedyOthelloAgent() :
                 new HeuristicOthelloAgent();

  const startTime = Date.now();
  let totalMoves = 0;
  let blackWins = 0;
  let whiteWins = 0;
  let draws = 0;
  const gameDurations: number[] = [];

  for (let game = 0; game < gameCount; game++) {
    const gameStart = Date.now();
    const gameInstance = new OthelloGame(60);
    let moveCount = 0;

    while (!gameInstance.isGameOver() && moveCount < 60) {
      const legalActions = gameInstance.getLegalActions();
      
      if (legalActions.length === 0) {
        gameInstance.pass();
        continue;
      }

      const currentPlayer = gameInstance.getCurrentPlayer();
      const agent = currentPlayer === 'B' ? agentB : agentW;
      const action = agent.chooseAction(gameInstance.getBoard(), currentPlayer);

      if (action && gameInstance.playAction(action)) {
        moveCount++;
      } else {
        gameInstance.pass();
      }
    }

    const gameDuration = (Date.now() - gameStart) / 1000;
    gameDurations.push(gameDuration);
    
    const result = gameInstance.getResult();
    if (result) {
      totalMoves += result.moveCount;
      
      if (result.winner === 'B') blackWins++;
      else if (result.winner === 'W') whiteWins++;
      else draws++;

      // 每100局输出一次进度
      if ((game + 1) % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgDuration = gameDurations.reduce((a, b) => a + b, 0) / gameDurations.length;
        console.log(
          `[进度] 已完成 ${game + 1}/${gameCount} 局 | 平均耗时: ${avgDuration.toFixed(3)}秒/局 | 总耗时: ${(elapsed / 60).toFixed(2)}分钟`
        );
      }
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgDuration = gameDurations.reduce((a, b) => a + b, 0) / gameDurations.length;
  const minDuration = Math.min(...gameDurations);
  const maxDuration = Math.max(...gameDurations);
  
  // 计算标准差
  const variance = gameDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / gameDurations.length;
  const stdDev = Math.sqrt(variance);

  console.log('='.repeat(80));
  console.log('📊 基准测试结果:');
  console.log(`   总运行时间: ${(totalTime / 60).toFixed(2)}分钟 (${totalTime.toFixed(1)}秒)`);
  console.log(`   平均每局时间: ${avgDuration.toFixed(3)}秒`);
  console.log(`   最快单局: ${minDuration.toFixed(3)}秒`);
  console.log(`   最慢单局: ${maxDuration.toFixed(3)}秒`);
  console.log(`   标准差: ${stdDev.toFixed(3)}秒`);
  console.log(`   平均每局步数: ${(totalMoves / gameCount).toFixed(1)}步`);
  console.log(`   平均每步耗时: ${(totalTime / totalMoves).toFixed(4)}秒`);
  console.log(`   胜率统计: 黑方 ${blackWins} | 白方 ${whiteWins} | 平局 ${draws}`);
  console.log('='.repeat(80));
}

// 如果直接运行此文件
if (require.main === module) {
  const gameCount = Number(process.env.GAME_COUNT) || 1000;
  const agentType = (process.env.AGENT_TYPE || 'random') as AgentType;
  
  runGameBenchmark(gameCount, agentType);
}

export { runGameBenchmark };

