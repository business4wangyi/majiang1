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
// export { SelfDrawnDetector } from './win-conditions_self-drawn';
export { KongFlowerDetector } from './win-conditions_kong-flower';
export { RobbingKongDetector } from './win-conditions_robbing-kong';
export { LastTileDetector } from './win-conditions_last-tile';
export { PingHuDetector } from './win-conditions_ping-hu';
export { ThirteenOrphansDetector } from './win-conditions_thirteen-orphans';
export { BigFourWindsDetector } from './win-conditions_big-four-winds';
export { BigThreeDragonsDetector } from './win-conditions_big-three-dragons';
export { SmallFourWindsDetector } from './win-conditions_small-four-winds';
export { SmallThreeDragonsDetector } from './win-conditions_small-three-dragons';
export { AllGreenDetector } from './win-conditions_all-green';
export { NineGatesDetector } from './win-conditions_nine-gates';
export { ThreeKongsDetector } from './win-conditions_three-kongs';
export { PureShiftedPungsDetector } from './win-conditions_pure-shifted-pungs';
export { PureShiftedChowsDetector } from './win-conditions_pure-shifted-chows';
export { PureDoubleChowDetector } from './win-conditions_pure-double-chow';
export { FourConcealedPungsDetector } from './win-conditions_four-concealed-pungs';
export { FourKongsDetector } from './win-conditions_four-kongs';
export { OneVoidedSuitDetector } from './win-conditions_one-voided-suit';
export { MixedTerminalsDetector } from './win-conditions_mixed-terminals';
export { FullyIsolatedDetector } from './win-conditions_fully-isolated';
export { FourFlowersDetector } from './win-conditions_four-flowers';
export { ThreeSimilarSequencesDetector } from './win-conditions_three-similar-sequences';
export { AllTerminalsDetector } from './win-conditions_all-terminals';
export { AllLowNumbersDetector } from './win-conditions_all-low-numbers';
export { AllHighNumbersDetector } from './win-conditions_all-high-numbers';
export { AllFivesDetector } from './win-conditions_all-fives';
export { PureSameChowDetector } from './win-conditions_pure-same-chow';
export { AllEvenPungsDetector } from './win-conditions_all-even-pungs';
export { KnittedStraightDetector } from './win-conditions_knitted-straight';
export { PureStraightDetector } from './win-conditions_pure-straight';
export { EightFlowersDetector } from './win-conditions_eight-flowers';
export { FourOfAKindDetector } from './win-conditions_four-of-a-kind';
export { AllTypesDetector } from './win-conditions_all-types';
export { DoubleConcealedKongsDetector } from './win-conditions_double-concealed-kongs';
export { PureTerminalChowDetector } from './win-conditions_pure-terminal-chow';
export { TwoConcealedPungsDetector } from './win-conditions_two-concealed-pungs';
export { ThreeSimilarPungsDetector } from './win-conditions_three-similar-pungs';
export { TwoIdenticalPungsDetector } from './win-conditions_two-identical-pungs';
export { MixedStraightDetector } from './win-conditions_mixed-straight';
export { SevenStarsDetector } from './win-conditions_seven-stars';
export { SevenConnectedPairsDetector } from './win-conditions_seven-connected-pairs';
export { TwoDragonPungsDetector } from './win-conditions_two-dragon-pungs';
export { ReversibleTilesDetector } from './win-conditions_reversible-tiles'; 