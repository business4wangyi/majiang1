import { Tile } from '../core/tile';

// 玩家动作枚举
export enum PlayerAction {
  PASS = '过',        // 过
  CHI = '吃',         // 吃
  PENG = '碰',        // 碰
  GANG = '杠',        // 杠
  HU = '胡'           // 胡
}

// 牌组类型
export type TileSetType = 'CHI' | 'PENG' | 'GANG' | 'HU';

// 牌组来源
export type TileSetSource = 'ming' | 'an' | 'bu' | 'qiang' | 'gangshang' | 'haidi' | undefined;

// 牌组
export interface TileSet {
  type: TileSetType;
  tiles: Tile[];
  source?: TileSetSource;
}

// 杠牌类型
export enum GangType {
  MING = '明杠',  // 明杠
  AN = '暗杠',    // 暗杠
  BU = '补杠',    // 补杠
  QIANG = '抢杠'  // 抢杠
}

// 胡牌类型枚举
export enum HuType {
  PING_HU,     // 平胡
  PENG_PENG_HU, // 碰碰胡
  QING_YI_SE,  // 清一色
  SEVEN_PAIRS, // 七对
  THIRTEEN_ORPHANS, // 十三幺
  BIG_FOUR_WINDS, // 大四喜
  BIG_THREE_DRAGONS, // 大三元
  SMALL_FOUR_WINDS, // 小四喜
  SMALL_THREE_DRAGONS, // 小三元
  ALL_HONORS, // 字一色
  NINE_GATES, // 九莲宝灯
  FOUR_KONGS, // 四杠子
  ALL_GREEN, // 绿一色
  HALF_FLUSH, // 混一色
  OUTSIDE_HAND, // 全带幺
  PURE_TERMINAL_CHOW, // 清幺九
  ALL_EVEN_PUNGS, // 全双刻
  ALL_HIGH_NUMBERS, // 大于五
  ALL_LOW_NUMBERS, // 小于五
  FOUR_CONCEALED_PUNGS, // 四暗刻
  
  // 已添加的特殊牌型
  THREE_KONGS, // 三杠子
  DOUBLE_CONCEALED_KONGS, // 双暗杠
  CONCEALED_HAND, // 门前清
  PURE_STRAIGHT, // 一条龙
  SELF_DRAWN, // 不求人/自摸
  ALL_TYPES, // 五门齐
  PURE_SAME_CHOW, // 一色四同顺
  PURE_SHIFTED_PUNGS, // 一色四节高
  PURE_SHIFTED_CHOWS, // 一色四步高
  PURE_DOUBLE_CHOW, // 一色双龙会
  
  // 新增更多特殊牌型
  MIXED_STRAIGHT, // 组合龙 - 由三种花色数牌组成的1-9
  ALL_FIVES, // 全带五 - 每组牌都包含数字5
  THREE_SIMILAR_SEQUENCES, // 三色三同顺 - 三种花色各一组相同点数的顺子
  THREE_SIMILAR_PUNGS, // 三色三节高 - 三种花色各一组相同点数的刻子
  FULLY_ISOLATED, // 全不靠 - 由不相邻的单张牌组成的特殊和牌型
  SEVEN_STARS, // 七星不靠 - 七个字牌加六个不同数牌组成的特殊牌型
  REVERSIBLE_TILES, // 推不倒 - 只由左右对称的牌组成的和牌
  SEVEN_CONNECTED_PAIRS, // 连七对 - 七个连续数字的对子
  FOUR_OF_A_KIND, // 四归一 - 包含4种四归一组合
  TWO_DRAGON_PUNGS, // 双箭刻 - 两副箭牌刻子
  TWO_IDENTICAL_PUNGS, // 双同刻 - 两副点数相同但花色不同的刻子
  TWO_CONCEALED_PUNGS, // 双暗刻 - 两个暗刻
  ONE_VOIDED_SUIT, // 缺一门 - 缺少一种花色的牌
  KNITTED_STRAIGHT, // 组合龙特殊形式
  ALL_TERMINALS, // 全幺九 - 由幺九牌组成的和牌
  MIXED_TERMINALS, // 混幺九 - 由幺九牌和字牌组成的和牌
  LAST_TILE, // 海底捞月 - 抓到最后一张牌和牌
  KONG_FLOWER, // 杠上开花 - 摸杠牌后和牌
  ROBBING_KONG, // 抢杠和 - 别人补杠时和牌
  
  // 花牌相关（需要系统支持花牌）
  EIGHT_FLOWERS, // 花牌全 - 集齐全部8张花牌
  FOUR_FLOWERS, // 花牌杠 - 集齐4张同类型花牌
  
  // 特殊标记
  NOT_HU, // 不是和牌
  // 可以添加更多胡牌类型
} 