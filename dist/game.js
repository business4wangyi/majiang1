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
    getGameStateInfo() {
        return `游戏状态: ${this.gameState.state}
当前玩家: ${this.gameState.currentPlayerIndex}
剩余牌数: ${this.tileManager.getRemainingTiles()}
总牌数: ${this.tileManager.getTotalTiles()}`;
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
        return this.players.some(p => p.handTiles.length > 13);
    }
    getPlayersWithExcessTiles() {
        return this.players.filter(p => p.handTiles.length > 13);
    }
    getAvailableActions() {
        // 这里需要实现获取当前可用操作的逻辑
        // 为了简单起见，这里返回一个空数组
        return [];
    }
    playerPass(playerId) {
        // 这里需要实现玩家"过"的逻辑
        // 为了简单起见，这里只是设置下一个玩家为当前玩家
        this.nextTurn();
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
        // 添加手牌数量校验
        this.ensureValidHandSizes();
        return true;
    }
    ensureValidHandSizes() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const handSize = player.handTiles.length;
            const expectedSize = 13;
            if (handSize < expectedSize) {
                display_manager_1.displayManager.printWarning(`玩家${i}手牌数量不足，当前数量: ${handSize}，需要补牌`);
                const tilesToDraw = expectedSize - handSize;
                for (let j = 0; j < tilesToDraw; j++) {
                    const tile = this.tileManager.drawTile();
                    if (tile) {
                        player.drawTile(tile);
                    }
                    else {
                        display_manager_1.displayManager.printWarning(`牌墙已空，无法补牌`);
                        break;
                    }
                }
            }
            else if (handSize > expectedSize) {
                display_manager_1.displayManager.printWarning(`玩家${i}手牌数量过多，当前数量: ${handSize}，需要弃牌`);
                const tilesToDiscard = handSize - expectedSize;
                for (let j = 0; j < tilesToDiscard; j++) {
                    const tile = player.handTiles[player.handTiles.length - 1];
                    if (tile) {
                        player.discardTile(player.handTiles.length - 1);
                    }
                }
            }
        }
    }
}
exports.Game = Game;
