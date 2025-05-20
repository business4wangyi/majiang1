import { Tile, TileType } from '../src/tile';
import { Player, PlayerType } from '../src/player';
import { WinConditionRegistry } from '../src/win-conditions/win-condition-detector';
import '../src/win-conditions/index'; // 注册所有检测器

// ====== 可复用的手牌变量 ======
const handTiles: Tile[] = [
  new Tile(TileType.WAN, 3, 1),
  new Tile(TileType.WAN, 7, 2),
  new Tile(TileType.WAN, 8, 3),
  new Tile(TileType.WAN, 8, 4),
  new Tile(TileType.TIAO, 4, 5),
  new Tile(TileType.TIAO, 4, 6),
  new Tile(TileType.TIAO, 6, 7),
  new Tile(TileType.TONG, 1, 8),
  new Tile(TileType.TONG, 3, 9),
  new Tile(TileType.TONG, 5, 10),
  new Tile(TileType.TONG, 6, 11),
  new Tile(TileType.TONG, 9, 12),
  new Tile(TileType.FENG, 2, 13),
  new Tile(TileType.JIAN, 3, 14),
];

// 明牌为空
const revealedSets: import('../src/rule-types').TileSet[] = [];

// 构造虚拟玩家
const player = new Player(1, '测试玩家', PlayerType.AI);
player.handTiles = handTiles;
player.revealedSets = revealedSets;

// 检查所有检测器
const detectors = WinConditionRegistry.getAllDetectors();
const problemDetectors: string[] = [];

for (const detector of detectors) {
  try {
    const result = detector.detect(handTiles, revealedSets, player);
    if (result) {
      problemDetectors.push(detector.getName());
    }
  } catch (e) {
    console.error(`检测器 ${detector.getName()} 执行出错:`, e);
  }
}

if (problemDetectors.length === 0) {
  console.log('没有检测器误判该手牌为胡牌。');
} else {
  console.log('以下检测器误判该手牌为胡牌:');
  for (const name of problemDetectors) {
    console.log(' -', name);
  }
} 