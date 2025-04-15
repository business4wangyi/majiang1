"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateManager = exports.GameState = void 0;
var GameState;
(function (GameState) {
    GameState[GameState["INIT"] = 0] = "INIT";
    GameState[GameState["DEALING"] = 1] = "DEALING";
    GameState[GameState["PLAYING"] = 2] = "PLAYING";
    GameState[GameState["WAITING_ACTION"] = 3] = "WAITING_ACTION";
    GameState[GameState["ENDED"] = 4] = "ENDED"; // 游戏结束
})(GameState || (exports.GameState = GameState = {}));
class GameStateManager {
    constructor() {
        this.state = GameState.INIT;
        this.currentPlayerIndex = 0;
        this.lastDiscardedTile = null;
        this.pendingAction = null;
        this.bankerIndex = 0;
        this.windRound = 0; // 0:东风圈, 1:南风圈, 2:西风圈, 3:北风圈
        this.drawCount = 0;
        this.lastDrawCount = 0;
    }
    setState(newState) {
        this.state = newState;
    }
    setCurrentPlayerIndex(index) {
        this.currentPlayerIndex = index;
    }
    setLastDiscardedTile(tile) {
        this.lastDiscardedTile = tile;
    }
    setPendingAction(action) {
        this.pendingAction = action;
    }
    incrementDrawCount() {
        this.drawCount++;
    }
    resetDrawCount() {
        this.drawCount = 0;
    }
    setLastDrawCount(count) {
        this.lastDrawCount = count;
    }
}
exports.GameStateManager = GameStateManager;
