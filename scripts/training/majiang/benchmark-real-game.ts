/**
 * 真实游戏性能基准测试
 * 运行1000局真实麻将游戏，统计耗时
 */

import { Game } from '../../src/majiang/game';
import { GameEventHandler } from '../../src/majiang/game-event-handler';
import { TileManager } from '../../src/majiang/tile-manager';
import { AIPlayer } from '../../src/majiang/ai-player';
import { runAutoGameLoop } from '../../src/majiang/gameLoop';

async function benchmarkRealGames() {
  console.log('🎮 真实游戏性能基准测试');
  console.log('='.repeat(60));
  console.log('📊 目标：运行1000局真实麻将游戏');
  console.log('⏱️ 统计：总耗时和单局耗时');
  console.log('');

  const totalRounds = 1000;
  const game = new Game();
  const tileManager = TileManager.getInstance();

  // 创建4个AI玩家
  const aiPlayers = [
    new AIPlayer('东家AI'),
    new AIPlayer('南家AI'),
    new AIPlayer('西家AI'),
    new AIPlayer('北家AI')
  ];

  for (const player of aiPlayers) {
    game.addPlayer(player);
  }

  const gameEventHandler = new GameEventHandler(game, tileManager);

  // 记录开始时间
  const startTime = Date.now();
  const gameStartTimes: number[] = [];

  console.log(`🚀 开始运行${totalRounds}局真实游戏...`);
  console.log('');

  // 运行游戏
  for (let round = 1; round <= totalRounds; round++) {
    const gameStartTime = Date.now();
    gameStartTimes.push(gameStartTime);

    try {
      await gameEventHandler.safeStartGameAndEnd();

      // 每100局输出一次进度
      if (round % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgGameElapsed = gameStartTimes.length > 0
          ? gameStartTimes.map((start, idx) => {
              const nextStart = gameStartTimes[idx + 1] || Date.now();
              return (nextStart - start) / 1000;
            }).reduce((a, b) => a + b, 0) / gameStartTimes.length
          : 0;

        console.log(`📊 进度: ${round}/${totalRounds} (${(round / totalRounds * 100).toFixed(1)}%)`);
        console.log(`   ⏱️ 总耗时: ${(elapsed / 60).toFixed(2)}分钟 (${elapsed.toFixed(1)}秒)`);
        console.log(`   ⏱️ 平均单局耗时: ${avgGameElapsed.toFixed(2)}秒`);
        console.log(`   ⚡ 游戏速度: ${(round / elapsed).toFixed(2)}局/秒`);
        console.log('');
      }

      // 重置游戏准备下一局
      if (round < totalRounds) {
        game.reset();
      }
    } catch (error) {
      console.error(`⚠️ 第${round}局游戏出错:`, error);
      break;
    }
  }

  // 计算最终统计
  const totalElapsed = (Date.now() - startTime) / 1000;
  const finalAvgGameElapsed = gameStartTimes.length > 0
    ? gameStartTimes.map((start, idx) => {
        const nextStart = gameStartTimes[idx + 1] || Date.now();
        return (nextStart - start) / 1000;
      }).reduce((a, b) => a + b, 0) / gameStartTimes.length
    : 0;

  console.log('🎉 真实游戏性能基准测试完成！');
  console.log('');
  console.log('📈 最终统计：');
  console.log(`   总游戏数: ${totalRounds}局`);
  console.log(`   ⏱️ 总耗时: ${(totalElapsed / 60).toFixed(2)}分钟 (${totalElapsed.toFixed(1)}秒)`);
  console.log(`   ⏱️ 平均单局耗时: ${finalAvgGameElapsed.toFixed(2)}秒`);
  console.log(`   ⚡ 游戏速度: ${(totalRounds / totalElapsed).toFixed(2)}局/秒`);
  console.log('');
}

// 运行基准测试
benchmarkRealGames().catch(error => {
  console.error('❌ 基准测试失败:', error);
  process.exit(1);
});









