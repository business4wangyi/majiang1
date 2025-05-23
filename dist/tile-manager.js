"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TileManager = void 0;
const tile_1 = require("./tile");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
/**
 * TileManager 单例类 - 管理麻将牌山
 *
 * 一局游戏中只应该存在一个牌山管理器实例
 * 游戏结束后通过reset方法重置牌山，而不是创建新实例
 */
class TileManager {
    constructor() {
        this.tiles = [];
        this.totalTiles = 0;
        this.remainingTiles = 0;
        this.reset();
    }
    /**
     * 获取TileManager的单例实例
     */
    static getInstance() {
        if (!TileManager.instance) {
            TileManager.instance = new TileManager();
        }
        return TileManager.instance;
    }
    /**
     * 重置牌山，用于新的一局游戏
     */
    reset() {
        this.tiles = (0, tile_1.shuffleTiles)((0, tile_1.createFullTileSet)());
        this.totalTiles = this.tiles.length;
        this.remainingTiles = this.totalTiles;
        display_manager_1.displayManager.printSuccess(`牌山初始化完成，总牌数: ${this.totalTiles}, 剩余牌数: ${this.remainingTiles}`);
        // 验证牌山大小是否合理
        if (this.totalTiles < 136) {
            (0, logger_1.warnLog)(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
            display_manager_1.displayManager.printWarning(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
        }
    }
    /**
     * 从牌山抽取一张牌
     */
    drawTile() {
        if (this.remainingTiles <= 0) {
            return null;
        }
        this.remainingTiles--;
        return this.tiles.pop() || null;
    }
    /**
     * 获取牌山总牌数
     */
    getTotalTiles() {
        return this.totalTiles;
    }
    /**
     * 获取牌山剩余牌数
     */
    getRemainingTiles() {
        return this.remainingTiles;
    }
}
exports.TileManager = TileManager;
