/**
 * 测试 OthelloGame 类是否正常工作
 */

import { OthelloGame } from '../../../src/othello/core/game';
import { RandomOthelloAgent } from '../../../src/othello/strategy';

async function testGameClass(): Promise<void> {
  console.log('🧪 测试 OthelloGame 类...\n');

  // 测试1: 创建游戏实例
  console.log('测试1: 创建游戏实例');
  const game = new OthelloGame(60);
  console.log('✅ 游戏实例创建成功');
  console.log(`   当前玩家: ${game.getCurrentPlayer()}`);
  console.log(`   步数: ${game.getMoveCount()}`);
  console.log(`   合法动作数: ${game.getLegalActions().length}\n`);

  // 测试2: 使用随机智能体进行一局游戏
  console.log('测试2: 使用随机智能体进行一局游戏');
  const agentB = new RandomOthelloAgent();
  const agentW = new RandomOthelloAgent();
  let moveCount = 0;
  const maxMoves = 60;

  const startTime = Date.now();

  while (!game.isGameOver() && moveCount < maxMoves) {
    const legalActions = game.getLegalActions();
    
    if (legalActions.length === 0) {
      game.pass();
      continue;
    }

    const currentPlayer = game.getCurrentPlayer();
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(game.getBoard(), currentPlayer);

    if (action && game.playAction(action)) {
      moveCount++;
    } else {
      game.pass();
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  const result = game.getResult();

  if (result) {
    console.log('✅ 游戏完成');
    console.log(`   胜者: ${result.winner}`);
    console.log(`   最终分数: B=${result.finalScore.B}, W=${result.finalScore.W}`);
    console.log(`   总步数: ${result.moveCount}`);
    console.log(`   耗时: ${duration.toFixed(2)}秒\n`);
  } else {
    console.log('❌ 游戏未完成\n');
  }

  // 测试3: 测试游戏重置
  console.log('测试3: 测试游戏重置');
  game.reset();
  console.log('✅ 游戏重置成功');
  console.log(`   当前玩家: ${game.getCurrentPlayer()}`);
  console.log(`   步数: ${game.getMoveCount()}`);
  console.log(`   合法动作数: ${game.getLegalActions().length}\n`);

  // 测试4: 测试游戏复制
  console.log('测试4: 测试游戏复制');
  const game2 = game.copy();
  console.log('✅ 游戏复制成功');
  console.log(`   原游戏步数: ${game.getMoveCount()}`);
  console.log(`   复制游戏步数: ${game2.getMoveCount()}`);
  
  // 在复制游戏上执行一个动作
  const legalActions = game2.getLegalActions();
  if (legalActions.length > 0) {
    game2.playAction(legalActions[0]);
    console.log(`   复制游戏执行动作后步数: ${game2.getMoveCount()}`);
    console.log(`   原游戏步数（应不变）: ${game.getMoveCount()}`);
    if (game.getMoveCount() === 0 && game2.getMoveCount() === 1) {
      console.log('✅ 复制游戏独立运行正常\n');
    } else {
      console.log('❌ 复制游戏独立运行异常\n');
    }
  }

  console.log('🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  testGameClass().catch(console.error);
}

export { testGameClass };

