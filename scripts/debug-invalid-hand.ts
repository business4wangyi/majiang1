import { Tile, TileType } from '../src/tile';
import { Player, PlayerType } from '../src/player';
import { WinConditionRegistry } from '../src/win-conditions/win-condition-detector';
import { WinConditions } from '../src/win-conditions/win-conditions-main';
import '../src/win-conditions/index'; // 注册所有检测器

// ====== 测试手牌 ======
const handTiles: Tile[] = [
  new Tile(TileType.WAN, 1, 0),
  new Tile(TileType.WAN, 5, 1),
  new Tile(TileType.WAN, 6, 2),
  new Tile(TileType.WAN, 7, 3),
  new Tile(TileType.WAN, 8, 4),
  new Tile(TileType.TONG, 1, 5),
  new Tile(TileType.TONG, 3, 6),
  new Tile(TileType.TONG, 4, 7),
  new Tile(TileType.TONG, 6, 8),
  new Tile(TileType.TONG, 8, 9),
  new Tile(TileType.FENG, 3, 10), // 西风
  new Tile(TileType.JIAN, 3, 11), // 白箭
  new Tile(TileType.JIAN, 3, 12), // 白箭
];

const revealedSets: import('../src/rule-types').TileSet[] = [];

const player = new Player(1, '测试玩家', PlayerType.AI);
player.handTiles = handTiles;
player.revealedSets = revealedSets;

console.log('测试手牌: 1万 5万 6万 7万 8万 1筒 3筒 4筒 6筒 8筒 西风 白箭 白箭');
console.log('------------------------------');

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

console.log('\n==== 主流程 WinConditions.canHu 判定 ====');
const result = WinConditions.canHu(player);
console.log('WinConditions.canHu 返回：', result); 