"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRules = void 0;
const tile_1 = require("./tile");
const rules_1 = require("./rules");
class GameRules {
    constructor(gameState) {
        this.gameState = gameState;
    }
    checkChi(player, tile) {
        // 检查是否可以吃牌
        if (player.handTiles.length >= 13) {
            return false;
        }
        // 检查是否有可以吃的组合
        const possibleCombinations = this.findPossibleChiCombinations(player.handTiles, tile);
        return possibleCombinations.length > 0;
    }
    checkPeng(player, tile) {
        // 检查是否可以碰牌
        if (player.handTiles.length >= 13) {
            return false;
        }
        // 检查是否有两张相同的牌
        const sameTiles = player.handTiles.filter(t => t.type === tile.type && t.value === tile.value);
        return sameTiles.length >= 2;
    }
    checkGang(player, tile) {
        // 检查是否可以杠牌
        if (player.handTiles.length >= 13) {
            return false;
        }
        if (tile) {
            // 检查是否可以杠别人打出的牌
            const sameTiles = player.handTiles.filter(t => t.type === tile.type && t.value === tile.value);
            return sameTiles.length === 3;
        }
        else {
            // 检查是否可以暗杠
            const tileGroups = new Map();
            for (const t of player.handTiles) {
                const key = `${t.type}-${t.value}`;
                tileGroups.set(key, (tileGroups.get(key) || 0) + 1);
            }
            return Array.from(tileGroups.values()).some(count => count === 4);
        }
    }
    checkHu(player, tile) {
        // 检查是否可以胡牌
        // 这里实现胡牌规则
        return false;
    }
    findPossibleChiCombinations(handTiles, targetTile) {
        const combinations = [];
        // 只处理数字牌
        if (targetTile.type !== tile_1.TileType.WAN &&
            targetTile.type !== tile_1.TileType.TIAO &&
            targetTile.type !== tile_1.TileType.TONG) {
            return combinations;
        }
        // 检查可能的顺子组合
        for (let i = -2; i <= 0; i++) {
            const values = [targetTile.value + i, targetTile.value + i + 1, targetTile.value + i + 2];
            if (values.some(v => v < 1 || v > 9))
                continue;
            const tiles = values.map(v => {
                if (v === targetTile.value)
                    return targetTile;
                return handTiles.find(t => t.type === targetTile.type && t.value === v);
            });
            if (tiles.every(t => t !== undefined)) {
                combinations.push(tiles);
            }
        }
        return combinations;
    }
    getAvailableActions(player, tile) {
        const actions = [];
        if (this.checkHu(player, tile)) {
            actions.push(rules_1.PlayerAction.HU);
        }
        if (tile && this.checkGang(player, tile)) {
            actions.push(rules_1.PlayerAction.GANG);
        }
        if (tile && this.checkPeng(player, tile)) {
            actions.push(rules_1.PlayerAction.PENG);
        }
        if (tile && this.checkChi(player, tile)) {
            actions.push(rules_1.PlayerAction.CHI);
        }
        return actions;
    }
}
exports.GameRules = GameRules;
