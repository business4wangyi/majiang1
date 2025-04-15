"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TileManager = void 0;
const tile_1 = require("./tile");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
class TileManager {
    constructor() {
        this.tiles = [];
        this.totalTiles = 0;
        this.remainingTiles = 0;
        this.reset();
    }
    reset() {
        this.tiles = (0, tile_1.shuffleTiles)((0, tile_1.createFullTileSet)());
        this.totalTiles = this.tiles.length;
        this.remainingTiles = this.totalTiles;
        (0, logger_1.infoLog)(`牌山初始化完成，总牌数: ${this.totalTiles}, 剩余牌数: ${this.remainingTiles}`);
        display_manager_1.displayManager.printSuccess(`牌山初始化完成，总牌数: ${this.totalTiles}, 剩余牌数: ${this.remainingTiles}`);
        // 验证牌山大小是否合理
        if (this.totalTiles < 136) {
            (0, logger_1.warnLog)(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
            display_manager_1.displayManager.printWarning(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
        }
    }
    drawTile() {
        if (this.remainingTiles <= 0) {
            return null;
        }
        this.remainingTiles--;
        return this.tiles.pop() || null;
    }
    getTotalTiles() {
        return this.totalTiles;
    }
    getRemainingTiles() {
        return this.remainingTiles;
    }
}
exports.TileManager = TileManager;
