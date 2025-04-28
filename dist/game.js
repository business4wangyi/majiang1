"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GameState = void 0;
const player_1 = require("./player");
const tile_manager_1 = require("./tile-manager");
const rule_engine_1 = require("./rule-engine");
const display_manager_1 = require("./display-manager");
const ai_player_1 = require("./ai-player");
const human_player_1 = require("./human-player");
// 游戏状态
var GameState;
(function (GameState) {
    GameState[GameState["INIT"] = 0] = "INIT";
    GameState[GameState["DEALING"] = 1] = "DEALING";
    GameState[GameState["PLAYING"] = 2] = "PLAYING";
    GameState[GameState["WAITING_ACTION"] = 3] = "WAITING_ACTION";
    GameState[GameState["ENDED"] = 4] = "ENDED"; // 游戏结束
})(GameState || (exports.GameState = GameState = {}));
// 游戏类 - 只负责游戏状态管理和核心逻辑
class Game {
    constructor(players) {
        // 游戏状态相关属性
        this.state = GameState.INIT;
        this.currentPlayerIndex = 0;
        this.lastDiscardedTile = null;
        this.pendingAction = null;
        this.bankerIndex = 0;
        this.windRound = 0; // 0:东风圈, 1:南风圈, 2:西风圈, 3:北风圈
        this.drawCount = 0;
        this.lastDrawCount = 0;
        this.players = [];
        // 使用 TileManager 的单例实例
        this.tileManager = tile_manager_1.TileManager.getInstance();
        this.players = players || [];
    }
    /**
     * 设置游戏玩家
     * @param autoPlayMode 是否启用自动打牌模式
     */
    setupPlayers(autoPlayMode) {
        // 清空现有玩家列表
        this.players = [];
        if (autoPlayMode) {
            // 自动模式：4个AI玩家
            display_manager_1.displayManager.printTitle(`初始化游戏：4个AI玩家对弈`);
            // 添加1个AI玩家
            this.addPlayer(new ai_player_1.AIPlayer('东家(AI)'));
        }
        else {
            // 手动模式：1个人类玩家 + 3个AI玩家
            display_manager_1.displayManager.printTitle(`初始化游戏：1个人类玩家 + 3个AI玩家`);
            // 添加1个人类玩家
            this.addPlayer(new human_player_1.HumanPlayer('东家(玩家)'));
        }
        // 添加3个AI玩家
        this.addPlayer(new ai_player_1.AIPlayer('南家(AI)'));
        this.addPlayer(new ai_player_1.AIPlayer('西家(AI)'));
        this.addPlayer(new ai_player_1.AIPlayer('北家(AI)'));
        display_manager_1.displayManager.printSuccess(`游戏玩家设置完成，共${this.players.length}名玩家`);
    }
    // 状态管理方法
    setState(newState) {
        this.state = newState;
    }
    setCurrentPlayerIndex(index) {
        if (index >= 0 && index < this.players.length) {
            this.currentPlayerIndex = index;
            display_manager_1.displayManager.print(`当前玩家索引已更新为: ${index}, 玩家: ${this.players[index].name}`);
        }
        else {
            display_manager_1.displayManager.printError(`无效的玩家索引: ${index}, 有效范围: 0-${this.players.length - 1}`);
        }
    }
    setLastDiscardedTile(tile) {
        this.lastDiscardedTile = tile;
    }
    getLastDiscardedTile() {
        return this.lastDiscardedTile;
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
    // 玩家管理方法
    getPlayers() {
        return this.players;
    }
    addPlayer(player) {
        display_manager_1.displayManager.print(`添加玩家: ${player.name} (${player.type === player_1.PlayerType.AI ? 'AI' : '人类'})`);
        this.players.push(player);
        display_manager_1.displayManager.print(`当前游戏共有 ${this.players.length} 名玩家`);
    }
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    getPlayerByIndex(index) {
        return this.players[index];
    }
    getAllPlayers() {
        return [...this.players];
    }
    // 游戏状态查询方法
    hasPlayerWithExcessTiles() {
        return this.players.some(p => p.needsToDiscard());
    }
    getPlayersWithExcessTiles() {
        return this.players.filter(p => p.needsToDiscard());
    }
    // 牌管理方法
    getRemainingTiles() {
        return this.tileManager.getRemainingTiles();
    }
    getTotalTiles() {
        return this.tileManager.getTotalTiles();
    }
    getTileManager() {
        return this.tileManager;
    }
    // 规则相关方法
    getAvailableActions() {
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) {
            return [];
        }
        return rule_engine_1.RuleEngine.getAvailableActions(currentPlayer, this.lastDiscardedTile);
    }
    /**
     * 重置游戏状态，准备开始新一局
     */
    reset() {
        // 重置游戏状态
        this.state = GameState.INIT;
        this.lastDiscardedTile = null;
        this.pendingAction = null;
        this.drawCount = 0;
        this.lastDrawCount = 0;
        // 重置牌管理器
        this.tileManager.reset();
        // 重置所有玩家状态
        for (const player of this.players) {
            player.handTiles = [];
            player.discardedTiles = [];
            player.revealedSets = [];
            player.flowerTiles = [];
            player.state = player_1.PlayerState.WAITING;
            player.lastDrawnTile = null;
        }
        // 设置庄家（可以轮换）
        this.bankerIndex = (this.bankerIndex + 1) % this.players.length;
        this.currentPlayerIndex = this.bankerIndex;
        display_manager_1.displayManager.printSuccess("游戏状态已重置，准备开始新一局");
    }
}
exports.Game = Game;
