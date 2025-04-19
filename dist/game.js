"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GameState = void 0;
const player_1 = require("./player");
const game_state_1 = require("./game-state");
const tile_manager_1 = require("./tile-manager");
const rule_engine_1 = require("./rule-engine");
const game_flow_1 = require("./game-flow");
const display_manager_1 = require("./display-manager");
// 游戏状态
var GameState;
(function (GameState) {
    GameState[GameState["INIT"] = 0] = "INIT";
    GameState[GameState["DEALING"] = 1] = "DEALING";
    GameState[GameState["PLAYING"] = 2] = "PLAYING";
    GameState[GameState["WAITING_ACTION"] = 3] = "WAITING_ACTION";
    GameState[GameState["ENDED"] = 4] = "ENDED"; // 游戏结束
})(GameState || (exports.GameState = GameState = {}));
// 游戏类
class Game {
    constructor(players) {
        this.players = [];
        this.gameState = new game_state_1.GameStateManager();
        this.tileManager = new tile_manager_1.TileManager();
        this.gameFlow = new game_flow_1.GameFlow(this.gameState, this.tileManager, players || []);
        this.players = players || [];
    }
    startGame() {
        this.gameFlow.startGame();
    }
    currentPlayerDraw() {
        return this.gameFlow.currentPlayerDraw();
    }
    currentPlayerDiscard(tileIndex) {
        return this.gameFlow.currentPlayerDiscard(tileIndex);
    }
    nextTurn() {
        this.gameFlow.nextTurn();
    }
    forceAIPlayerDiscard() {
        return this.gameFlow.forceAIPlayerDiscard();
    }
    getPlayers() {
        return this.players;
    }
    addPlayer(player) {
        display_manager_1.displayManager.print(`添加玩家: ${player.name} (${player.type === player_1.PlayerType.AI ? 'AI' : '人类'})`);
        this.players.push(player);
        // 重新初始化GameFlow，确保玩家列表更新
        this.gameFlow = new game_flow_1.GameFlow(this.gameState, this.tileManager, this.players);
        display_manager_1.displayManager.print(`当前游戏共有 ${this.players.length} 名玩家`);
    }
    // 添加公共属性访问器
    get state() {
        return this.gameState.state;
    }
    get currentPlayerIndex() {
        return this.gameState.currentPlayerIndex;
    }
    // 设置当前玩家索引
    setCurrentPlayerIndex(index) {
        if (index >= 0 && index < this.players.length) {
            this.gameState.currentPlayerIndex = index;
            display_manager_1.displayManager.print(`当前玩家索引已更新为: ${index}, 玩家: ${this.players[index].name}`);
        }
        else {
            display_manager_1.displayManager.printError(`无效的玩家索引: ${index}, 有效范围: 0-${this.players.length - 1}`);
        }
    }
    get lastDiscardedTile() {
        return this.gameState.lastDiscardedTile;
    }
    setLastDiscardedTile(tile) {
        this.gameState.setLastDiscardedTile(tile);
    }
    get drawCount() {
        return this.gameState.drawCount;
    }
    get remainingTiles() {
        return this.tileManager.getRemainingTiles();
    }
    getTotalTiles() {
        return this.tileManager.getTotalTiles();
    }
    getRemainingTiles() {
        return this.tileManager.getRemainingTiles();
    }
    getTileManager() {
        return this.tileManager;
    }
    getCurrentPlayer() {
        return this.players[this.gameState.currentPlayerIndex];
    }
    getPlayerByIndex(index) {
        return this.players[index];
    }
    getAllPlayers() {
        return [...this.players];
    }
    hasPlayerWithExcessTiles() {
        return this.players.some(p => p.needsToDiscard());
    }
    getPlayersWithExcessTiles() {
        return this.players.filter(p => p.needsToDiscard());
    }
    getAvailableActions() {
        // 获取当前玩家
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) {
            return [];
        }
        // 使用RuleEngine获取可用操作
        return rule_engine_1.RuleEngine.getAvailableActions(currentPlayer, this.gameState.lastDiscardedTile);
    }
    playerPass(playerId) {
        // 获取玩家
        const player = this.players[playerId];
        if (!player) {
            display_manager_1.displayManager.printError(`玩家ID ${playerId} 无效`);
            return;
        }
        // 记录玩家选择"过"
        display_manager_1.displayManager.printWarning(`玩家 ${player.name} 选择了"过"`);
        // 如果是当前玩家，进入下一个回合
        if (playerId === this.gameState.currentPlayerIndex) {
            display_manager_1.displayManager.print(`当前玩家选择了"过"，进入下一个回合`);
            this.nextTurn();
        }
        else {
            // 如果不是当前玩家，可能是在响应其他玩家的动作
            display_manager_1.displayManager.print(`玩家${playerId}选择了"过"，等待其他玩家响应或继续游戏`);
            // 处理等待玩家的回应逻辑...
            // (这部分逻辑可能需要访问gameFlow的内部状态，
            // 具体实现可能需要根据GameFlow类的设计进一步修改)
            if (this.gameState.state === GameState.WAITING_ACTION) {
                // 检查是否所有玩家都已响应
                // 如果是，恢复到PLAYING状态
                this.gameState.state = GameState.PLAYING;
            }
        }
    }
    // 添加公共方法，直接从牌山抽牌给指定玩家
    drawTileForPlayer(player) {
        // 从牌山抽一张牌
        const tile = this.tileManager.drawTile();
        if (tile) {
            // 将牌添加到玩家手牌中
            player.drawTile(tile);
            return tile;
        }
        return null;
    }
    playerGang(playerId, targetTile, isTestMode = false) {
        const player = this.players[playerId];
        if (!player) {
            return false;
        }
        // 执行杠牌操作
        const success = player.gang(targetTile);
        if (!success) {
            return false;
        }
        // 杠后摸牌
        const tile = this.tileManager.drawTile();
        if (tile) {
            player.drawTile(tile);
        }
        // 检查杠后是否可以胡
        if (rule_engine_1.RuleEngine.canHu(player)) {
            display_manager_1.displayManager.printSuccess(`${player.name} 杠后胡牌！`);
            return true;
        }
        return true;
    }
}
exports.Game = Game;
