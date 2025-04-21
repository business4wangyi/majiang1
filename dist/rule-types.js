"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuType = exports.GangType = exports.PlayerAction = void 0;
// 玩家动作枚举
var PlayerAction;
(function (PlayerAction) {
    PlayerAction["PASS"] = "\u8FC7";
    PlayerAction["CHI"] = "\u5403";
    PlayerAction["PENG"] = "\u78B0";
    PlayerAction["GANG"] = "\u6760";
    PlayerAction["HU"] = "\u80E1"; // 胡
})(PlayerAction || (exports.PlayerAction = PlayerAction = {}));
// 杠牌类型
var GangType;
(function (GangType) {
    GangType["MING"] = "\u660E\u6760";
    GangType["AN"] = "\u6697\u6760";
    GangType["BU"] = "\u8865\u6760";
    GangType["QIANG"] = "\u62A2\u6760"; // 抢杠
})(GangType || (exports.GangType = GangType = {}));
// 胡牌类型枚举
var HuType;
(function (HuType) {
    HuType[HuType["PING_HU"] = 0] = "PING_HU";
    HuType[HuType["PENG_PENG_HU"] = 1] = "PENG_PENG_HU";
    HuType[HuType["QING_YI_SE"] = 2] = "QING_YI_SE";
    HuType[HuType["SEVEN_PAIRS"] = 3] = "SEVEN_PAIRS";
    HuType[HuType["THIRTEEN_ORPHANS"] = 4] = "THIRTEEN_ORPHANS";
    HuType[HuType["BIG_FOUR_WINDS"] = 5] = "BIG_FOUR_WINDS";
    HuType[HuType["BIG_THREE_DRAGONS"] = 6] = "BIG_THREE_DRAGONS";
    HuType[HuType["SMALL_FOUR_WINDS"] = 7] = "SMALL_FOUR_WINDS";
    HuType[HuType["SMALL_THREE_DRAGONS"] = 8] = "SMALL_THREE_DRAGONS";
    HuType[HuType["ALL_HONORS"] = 9] = "ALL_HONORS";
    HuType[HuType["NINE_GATES"] = 10] = "NINE_GATES";
    HuType[HuType["FOUR_KONGS"] = 11] = "FOUR_KONGS";
    HuType[HuType["ALL_GREEN"] = 12] = "ALL_GREEN";
    HuType[HuType["HALF_FLUSH"] = 13] = "HALF_FLUSH";
    HuType[HuType["OUTSIDE_HAND"] = 14] = "OUTSIDE_HAND";
    HuType[HuType["PURE_TERMINAL_CHOW"] = 15] = "PURE_TERMINAL_CHOW";
    HuType[HuType["ALL_EVEN_PUNGS"] = 16] = "ALL_EVEN_PUNGS";
    HuType[HuType["ALL_HIGH_NUMBERS"] = 17] = "ALL_HIGH_NUMBERS";
    HuType[HuType["ALL_LOW_NUMBERS"] = 18] = "ALL_LOW_NUMBERS";
    HuType[HuType["FOUR_CONCEALED_PUNGS"] = 19] = "FOUR_CONCEALED_PUNGS";
    // 已添加的特殊牌型
    HuType[HuType["THREE_KONGS"] = 20] = "THREE_KONGS";
    HuType[HuType["DOUBLE_CONCEALED_KONGS"] = 21] = "DOUBLE_CONCEALED_KONGS";
    HuType[HuType["CONCEALED_HAND"] = 22] = "CONCEALED_HAND";
    HuType[HuType["PURE_STRAIGHT"] = 23] = "PURE_STRAIGHT";
    HuType[HuType["SELF_DRAWN"] = 24] = "SELF_DRAWN";
    HuType[HuType["ALL_TYPES"] = 25] = "ALL_TYPES";
    HuType[HuType["PURE_SAME_CHOW"] = 26] = "PURE_SAME_CHOW";
    HuType[HuType["PURE_SHIFTED_PUNGS"] = 27] = "PURE_SHIFTED_PUNGS";
    HuType[HuType["PURE_SHIFTED_CHOWS"] = 28] = "PURE_SHIFTED_CHOWS";
    HuType[HuType["PURE_DOUBLE_CHOW"] = 29] = "PURE_DOUBLE_CHOW";
    // 新增更多特殊牌型
    HuType[HuType["MIXED_STRAIGHT"] = 30] = "MIXED_STRAIGHT";
    HuType[HuType["ALL_FIVES"] = 31] = "ALL_FIVES";
    HuType[HuType["THREE_SIMILAR_SEQUENCES"] = 32] = "THREE_SIMILAR_SEQUENCES";
    HuType[HuType["THREE_SIMILAR_PUNGS"] = 33] = "THREE_SIMILAR_PUNGS";
    HuType[HuType["FULLY_ISOLATED"] = 34] = "FULLY_ISOLATED";
    HuType[HuType["SEVEN_STARS"] = 35] = "SEVEN_STARS";
    HuType[HuType["REVERSIBLE_TILES"] = 36] = "REVERSIBLE_TILES";
    HuType[HuType["SEVEN_CONNECTED_PAIRS"] = 37] = "SEVEN_CONNECTED_PAIRS";
    HuType[HuType["FOUR_OF_A_KIND"] = 38] = "FOUR_OF_A_KIND";
    HuType[HuType["TWO_DRAGON_PUNGS"] = 39] = "TWO_DRAGON_PUNGS";
    HuType[HuType["TWO_IDENTICAL_PUNGS"] = 40] = "TWO_IDENTICAL_PUNGS";
    HuType[HuType["TWO_CONCEALED_PUNGS"] = 41] = "TWO_CONCEALED_PUNGS";
    HuType[HuType["ONE_VOIDED_SUIT"] = 42] = "ONE_VOIDED_SUIT";
    HuType[HuType["KNITTED_STRAIGHT"] = 43] = "KNITTED_STRAIGHT";
    HuType[HuType["ALL_TERMINALS"] = 44] = "ALL_TERMINALS";
    HuType[HuType["MIXED_TERMINALS"] = 45] = "MIXED_TERMINALS";
    HuType[HuType["LAST_TILE_DRAW"] = 46] = "LAST_TILE_DRAW";
    HuType[HuType["LAST_TILE"] = 47] = "LAST_TILE";
    HuType[HuType["KONG_FLOWER"] = 48] = "KONG_FLOWER";
    HuType[HuType["ROBBING_KONG"] = 49] = "ROBBING_KONG";
    // 花牌相关（需要系统支持花牌）
    HuType[HuType["EIGHT_FLOWERS"] = 50] = "EIGHT_FLOWERS";
    HuType[HuType["FOUR_FLOWERS"] = 51] = "FOUR_FLOWERS";
    // 特殊标记
    HuType[HuType["NOT_HU"] = 52] = "NOT_HU";
    // 可以添加更多胡牌类型
})(HuType || (exports.HuType = HuType = {}));
