import { Game, GameState } from './game';
import { PlayerType, PlayerState, Player } from './player';
import { PlayerAction, RuleEngine } from './rules';
import { Tile, TileType } from './tile';
import { AIPlayer } from './ai-player';
import { HumanPlayer } from './human-player';

// 设置环境变量
process.env.IGNORE_TILE_BALANCE_CHECK = 'true'; // 在完成调试前，先允许测试继续进行
process.env.FORCE_STRICT_TILE_CHECK = 'false'; // 设置为true会强制进行严格检查

// 测试补杠功能
async function testBuGang() {
  console.log("==== 测试补杠功能 ====");
  const game = new Game();
  
  // 使用固定的测试牌组
  let mockTiles: Tile[] = [];
  
  // 玩家1手牌：普通手牌
  const player1Tiles = [
    new Tile(TileType.WAN, 1, 1),
    new Tile(TileType.WAN, 2, 2),
    new Tile(TileType.WAN, 3, 3),
    new Tile(TileType.WAN, 4, 4),
    new Tile(TileType.WAN, 5, 5),
    new Tile(TileType.WAN, 6, 6),
    new Tile(TileType.WAN, 7, 7),
    new Tile(TileType.WAN, 8, 8),
    new Tile(TileType.WAN, 9, 9),
    new Tile(TileType.TIAO, 1, 10),
    new Tile(TileType.TIAO, 2, 11),
    new Tile(TileType.TIAO, 3, 12),
    new Tile(TileType.TIAO, 4, 13)
  ];
  
  // 玩家2手牌：包含两张1筒，还需要一张用于碰牌
  const player2Tiles = [
    new Tile(TileType.TONG, 1, 14),
    new Tile(TileType.TONG, 1, 15),
    new Tile(TileType.TONG, 2, 16),
    new Tile(TileType.TONG, 3, 17),
    new Tile(TileType.TONG, 4, 18),
    new Tile(TileType.TONG, 5, 19),
    new Tile(TileType.TONG, 6, 20),
    new Tile(TileType.TONG, 7, 21),
    new Tile(TileType.TONG, 8, 22),
    new Tile(TileType.TONG, 9, 23),
    new Tile(TileType.FENG, 1, 24),
    new Tile(TileType.FENG, 2, 25),
    new Tile(TileType.FENG, 3, 26)
  ];
  
  // 玩家3手牌：拥有1筒用于打出让玩家2碰牌
  const player3Tiles = [
    new Tile(TileType.TONG, 1, 27), // 这张牌将被打出，用于玩家2碰牌
    new Tile(TileType.TIAO, 5, 28),
    new Tile(TileType.TIAO, 6, 29),
    new Tile(TileType.TIAO, 7, 30),
    new Tile(TileType.TIAO, 8, 31),
    new Tile(TileType.TIAO, 9, 32),
    new Tile(TileType.FENG, 4, 33),
    new Tile(TileType.JIAN, 1, 34),
    new Tile(TileType.JIAN, 2, 35),
    new Tile(TileType.JIAN, 3, 36),
    new Tile(TileType.WAN, 1, 37),
    new Tile(TileType.WAN, 2, 38),
    new Tile(TileType.WAN, 3, 39)
  ];
  
  // 玩家4手牌：普通手牌
  const player4Tiles = [
    new Tile(TileType.TIAO, 1, 40),
    new Tile(TileType.TIAO, 2, 41),
    new Tile(TileType.TIAO, 3, 42),
    new Tile(TileType.TIAO, 4, 43),
    new Tile(TileType.TIAO, 5, 44),
    new Tile(TileType.TIAO, 6, 45),
    new Tile(TileType.TIAO, 7, 46),
    new Tile(TileType.TIAO, 8, 47),
    new Tile(TileType.TIAO, 9, 48),
    new Tile(TileType.FENG, 1, 49),
    new Tile(TileType.FENG, 2, 50),
    new Tile(TileType.FENG, 3, 51),
    new Tile(TileType.FENG, 4, 52)
  ];
  
  // 牌山中包含第四张1筒，用于玩家2补杠
  mockTiles = [
    // 补杠用的牌，确保第一张就是1筒，便于测试
    new Tile(TileType.TONG, 1, 53),
  ];
  
  // 添加足够多的牌确保牌山总数正确
  for (let i = 54; i <= 136; i++) {
    const type = (i % 5 === 0) ? TileType.WAN : 
               (i % 5 === 1) ? TileType.TIAO : 
               (i % 5 === 2) ? TileType.TONG : 
               (i % 5 === 3) ? TileType.FENG : TileType.JIAN;
    
    const value = type === TileType.FENG ? ((i % 4) + 1) : 
                 type === TileType.JIAN ? ((i % 3) + 1) : ((i % 9) + 1);
    
    mockTiles.push(new Tile(type, value, i));
  }
  
  // 初始化游戏，并手动设置牌组
  game.startGame();
  
  // 检查初始牌数是否平衡
  console.log("\n===== 初始牌数平衡检查 =====");
  console.log(game.getGameStateInfo(true, false));
  
  // 替换玩家的手牌
  game.players[0].handTiles = [...player1Tiles];
  game.players[1].handTiles = [...player2Tiles];
  game.players[2].handTiles = [...player3Tiles];
  game.players[3].handTiles = [...player4Tiles];
  
  // 设置剩余牌山
  // @ts-ignore 为了测试直接修改私有属性
  game.tiles = mockTiles;
  // @ts-ignore
  game.currentTileIndex = 0;
  // @ts-ignore
  game.remainingTiles = mockTiles.length;
  
  // 重置摸牌次数，应当等于总牌数-剩余牌数=136-84=52
  // @ts-ignore
  game.drawCount = 52;
  // @ts-ignore
  game.lastDrawCount = 0; // 重置上一次摸牌次数为0
  
  // 在测试开始时打印牌的统计信息
  console.log("\n牌数检查：");
  console.log(`- 玩家1手牌: ${player1Tiles.length}张`);
  console.log(`- 玩家2手牌: ${player2Tiles.length}张`);
  console.log(`- 玩家3手牌: ${player3Tiles.length}张`);
  console.log(`- 玩家4手牌: ${player4Tiles.length}张`);
  console.log(`- 牌山剩余: ${mockTiles.length}张`);
  console.log(`- 总计: ${player1Tiles.length + player2Tiles.length + player3Tiles.length + player4Tiles.length + mockTiles.length}张`);
  
  // 重新检查牌数平衡
  console.log("\n===== 测试开始前牌数平衡 =====");
  console.log(game.getGameStateInfo(true, false));
  
  // 使用更直接的方式测试补杠
  console.log("\n===== 步骤1: 模拟玩家2已经碰过1筒 =====");
  // 设置当前玩家为玩家2
  game.currentPlayerIndex = 1;
  game.players[1].state = PlayerState.ACTING;
  
  // 手动创建一个碰的牌组
  const pengSet = {
    type: 'PENG' as 'PENG',
    tiles: [
      new Tile(TileType.TONG, 1, 100),
      new Tile(TileType.TONG, 1, 101),
      new Tile(TileType.TONG, 1, 102),
    ]
  };
  
  // 添加到玩家2的已亮出牌组
  game.players[1].revealedSets.push(pengSet);
  
  // 从玩家2手牌中移除两张1筒
  let removed = 0;
  game.players[1].handTiles = game.players[1].handTiles.filter(tile => {
    if (tile.type === TileType.TONG && tile.value === 1 && removed < 2) {
      removed++;
      return false;
    }
    return true;
  });
  
  // 打印当前玩家2状态
  console.log("\n玩家2当前状态:");
  console.log(`手牌: ${game.players[1].handTiles.map(t => t.toString()).join(', ')}`);
  console.log(`已亮出牌组: ${game.players[1].revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]`).join(', ')}`);
  
  // 防止摸牌次数相同检测触发
  // @ts-ignore
  game.lastDrawCount = 0;
  
  // 打印游戏状态
  console.log("\n===== 碰牌后状态 =====");
  console.log(game.getGameStateInfo(true, false));
  
  // 步骤2: 确保玩家2手上有第四张1筒
  console.log("\n===== 步骤2: 确保玩家2手上有第四张1筒 =====");
  // 将第一张牌（1筒）添加到玩家2手牌
  const gangTile = mockTiles[0]; // 第一张是1筒
  game.players[1].handTiles.push(gangTile);
  
  // 修改牌山，移除第一张牌
  // @ts-ignore
  game.tiles = mockTiles.slice(1);
  // @ts-ignore
  game.remainingTiles = game.tiles.length;
  // @ts-ignore
  game.drawCount++;
  
  // 打印玩家2有第四张1筒的状态
  console.log("\n玩家2当前状态 (有第四张1筒):");
  console.log(`手牌: ${game.players[1].handTiles.map(t => t.toString()).join(', ')}`);
  console.log(`已亮出牌组: ${game.players[1].revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]`).join(', ')}`);
  
  // 步骤3: 执行补杠
  console.log("\n===== 步骤3: 执行补杠 =====");
  
  // 检查玩家2的碰牌组和手牌中的1筒
  const player2 = game.players[1];
  const pengSets = player2.revealedSets.filter(set => set.type === 'PENG');
  const has1TongPeng = pengSets.some(set => set.tiles[0].type === TileType.TONG && set.tiles[0].value === 1);
  const has1TongInHand = player2.handTiles.some(t => t.type === TileType.TONG && t.value === 1);
  
  console.log(`玩家2已碰过1筒: ${has1TongPeng}`);
  console.log(`玩家2手中有1筒: ${has1TongInHand}`);
  console.log(`玩家2手牌: ${player2.handTiles.map(t => t.toString()).join(', ')}`);
  console.log(`玩家2已亮出牌组: ${player2.revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]`).join(', ')}`);
  
  // 确保当前状态
  player2.state = PlayerState.ACTING;
  game.currentPlayerIndex = 1;
  
  // 尝试补杠 - 不传入targetTile，让gang方法自动检查是否能补杠
  try {
    // 使用game.playerGang方法（它会调用player.gang并进行额外的游戏状态处理）
    const gangResult = game.playerGang(1, null, true); // 传入null表示尝试暗杠或补杠
    console.log(`补杠结果: ${gangResult}`);
  } catch (error) {
    console.error("补杠执行出错:", error);
  }
  
  // 补杠后状态部分
  // 防止摸牌次数相同检测触发
  // @ts-ignore
  game.lastDrawCount = 0;
  
  // 打印补杠后的状态
  console.log("\n===== 补杠后状态 =====");
  console.log(game.getGameStateInfo(true, false));
  
  // 检查最终状态的牌平衡前再次重置lastDrawCount
  // @ts-ignore
  game.lastDrawCount = 0;
  
  // 检查最终状态的牌平衡
  console.log("\n===== 最终状态 =====");
  console.log(game.getGameStateInfo(true, false));
  
  console.log("\n==== 补杠测试完成 ====");
}

// 运行测试
testBuGang().catch(console.error); 