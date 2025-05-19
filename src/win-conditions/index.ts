// 导出所有胡牌检测器

// 导出胡牌检测器接口和注册中心
export { WinConditionDetector, BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';
export { WinConditions } from './win-conditions-main';

// 导出具体的胡牌检测器
export { QingYiSeDetector } from './win-conditions_qing-yi-se';
export { SevenPairsDetector } from './win-conditions_seven-pairs';
export { HalfFlushDetector } from './win-conditions_half-flush';
export { AllHonorsDetector } from './win-conditions_all-honors';
export { OutsideHandDetector } from './win-conditions_outside-hand';
export { PengPengHuDetector } from './win-conditions_peng-peng-hu';
export { ConcealedHandDetector } from './win-conditions_concealed-hand';
export { SelfDrawnDetector } from './win-conditions_self-drawn';
export { KongFlowerDetector } from './win-conditions_kong-flower';
export { RobbingKongDetector } from './win-conditions_robbing-kong';
export { LastTileDetector } from './win-conditions_last-tile';
// 需要先创建这个检测器
// export { LastTileDrawDetector } from './win-conditions_last-tile-draw';

// 新增的胡牌检测器
export { PingHuDetector } from './win-conditions_ping-hu';
export { ThirteenOrphansDetector } from './win-conditions_thirteen-orphans';
export { BigFourWindsDetector } from './win-conditions_big-four-winds';
export { BigThreeDragonsDetector } from './win-conditions_big-three-dragons';
export { SmallFourWindsDetector } from './win-conditions_small-four-winds';
export { SmallThreeDragonsDetector } from './win-conditions_small-three-dragons';
export { AllGreenDetector } from './win-conditions_all-green';
export { NineGatesDetector } from './win-conditions_nine-gates';

// 随着项目发展，这里会导出更多的胡牌检测器 