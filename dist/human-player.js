"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumanPlayer = void 0;
const player_1 = require("./player");
class HumanPlayer extends player_1.Player {
    constructor(name) {
        super(0, name, player_1.PlayerType.HUMAN);
    }
}
exports.HumanPlayer = HumanPlayer;
