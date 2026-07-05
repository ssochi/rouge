import { PlayerGenerator } from '../../assets/characters/player/PlayerGenerator.js';
import { getCostumePiece } from '../../assets/characters/player/costumes/CostumeData.js';
import { getCostumeStats } from '../../assets/characters/player/costumes/CostumeStats.js';

/**
 * CostumeSystem
 * Manages player costume state, frame generation, and caching.
 *
 * Usage:
 *   costumeSystem.equipCostume(player, 'hat', 'hat_beret');
 *   costumeSystem.unequipCostume(player, 'glasses');
 *   const frames = costumeSystem.getPlayerFrames(player.costume);
 */
export class CostumeSystem {
    constructor() {
        this.generator = new PlayerGenerator();
        this.cache = new Map(); // cacheKey -> { idle: Canvas[], run: Canvas[] }

        // Default costume IDs (used for initial state only)
        // 出生裸装（仅保留发型）：服装作为地牢掉落装备逐步获取并自动穿戴
        this.defaultSlots = {
            hairstyle: 'hair_long',
            hat: null,
            clothes: null,
            glasses: null,
            beard: null,
        };
    }

    /**
     * Create initial costume state for player
     * @returns {Object} { hairstyle, hat, clothes, glasses }
     */
    createDefaultCostumeState() {
        return { ...this.defaultSlots };
    }

    /**
     * Equip a costume piece
     * @param {Object} player - player object with .costume
     * @param {string} slot - 'hairstyle' | 'hat' | 'clothes' | 'glasses'
     * @param {string} pieceId - costume piece ID
     * @returns {boolean} success
     */
    equipCostume(player, slot, pieceId) {
        const piece = getCostumePiece(slot, pieceId);
        if (!piece) return false;

        const before = getCostumeStats(player.costume);
        player.costume[slot] = pieceId;
        this._applyMaxHpDiff(player, before, getCostumeStats(player.costume));
        this.invalidateCache(player.costume);
        return true;
    }

    /**
     * Unequip a costume piece (all slots can be unequipped to null)
     * @param {Object} player - player object with .costume
     * @param {string} slot
     * @returns {string|null} the removed pieceId, or null if was empty
     */
    unequipCostume(player, slot) {
        const current = player.costume[slot];
        const before = getCostumeStats(player.costume);
        player.costume[slot] = null;
        this._applyMaxHpDiff(player, before, getCostumeStats(player.costume));
        this.invalidateCache(player.costume);
        return current;
    }

    /** 服装 maxHp 加成记账：装备/卸下时同步调整上限与当前血量。 */
    _applyMaxHpDiff(player, before, after) {
        const diff = after.maxHpBonus - before.maxHpBonus;
        if (diff === 0 || !Number.isFinite(player.maxHp)) return;
        player.maxHp += diff;
        // 增加上限时血量同步增加；降低上限时血量夹到新上限（至少保留 1）
        player.hp = Math.max(1, Math.min(player.maxHp, player.hp + Math.max(0, diff)));
    }

    /**
     * Get resolved costume config (piece objects, not IDs)
     * @param {Object} costumeState - { hairstyle: id, hat: id|null, ... }
     * @returns {Object} { hairstyle: piece, hat: piece|null, clothes: piece, glasses: piece|null }
     */
    resolveCostume(costumeState) {
        return {
            hairstyle: costumeState.hairstyle ? getCostumePiece('hairstyle', costumeState.hairstyle) : null,
            hat: costumeState.hat ? getCostumePiece('hat', costumeState.hat) : null,
            clothes: costumeState.clothes ? getCostumePiece('clothes', costumeState.clothes) : null,
            glasses: costumeState.glasses ? getCostumePiece('glasses', costumeState.glasses) : null,
            beard: costumeState.beard ? getCostumePiece('beard', costumeState.beard) : null,
        };
    }

    /**
     * Get player animation frames for current costume.
     * Returns cached frames or generates new ones.
     * @param {Object} costumeState - { hairstyle, hat, clothes, glasses }
     * @returns {{ idle: HTMLCanvasElement[], run: HTMLCanvasElement[] }}
     */
    getPlayerFrames(costumeState) {
        const key = this._getCacheKey(costumeState);
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const frames = this._generateAllFrames(costumeState);
        this.cache.set(key, frames);
        return frames;
    }

    /**
     * Invalidate cache for a costume config
     */
    invalidateCache(costumeState) {
        const key = this._getCacheKey(costumeState);
        this.cache.delete(key);
    }

    /**
     * Clear entire cache
     */
    clearCache() {
        this.cache.clear();
    }

    // ---- Private Methods ----

    _getCacheKey(costumeState) {
        return [
            costumeState.hairstyle || 'none',
            costumeState.hat || 'none',
            costumeState.clothes || 'none',
            costumeState.glasses || 'none',
            costumeState.beard || 'none',
        ].join('|');
    }

    _generateAllFrames(costumeState) {
        const costume = this.resolveCostume(costumeState);
        const idle = this._generateIdleFrames(costume);
        const run = this._generateRunFrames(costume);
        return { idle, run };
    }

    _generateIdleFrames(costume) {
        const TOTAL = 16;
        const frames = [];
        for (let i = 0; i < TOTAL; i++) {
            const progress = i / TOTAL;
            const rad = progress * Math.PI * 2;
            const breathe = Math.sin(rad);
            const bodyYOffset = breathe * -0.8;

            frames.push(this.generator.generateFrameWithCostume({
                bodySquash: bodyYOffset,
                headOffset: { x: 0, y: bodyYOffset },
                hairWave: progress,
            }, costume));
        }
        return frames;
    }

    _generateRunFrames(costume) {
        const cycle = [
            { bodyY: 0, left: 'back2', right: 'fwd2', hair: 0.0, coat: 0.0 },
            { bodyY: 1, left: 'tuck', right: 'stand', hair: 0.1, coat: 0.2 },
            { bodyY: 0, left: 'knee', right: 'back1', hair: 0.2, coat: 0.4 },
            { bodyY: -1, left: 'fwd1', right: 'back2', hair: 0.3, coat: 0.6 },
            { bodyY: -1, left: 'fwd2', right: 'tuck', hair: 0.4, coat: 0.8 },
            { bodyY: 0, left: 'fwd2', right: 'back1', hair: 0.5, coat: 0.9 },
            { bodyY: 0, left: 'fwd2', right: 'back2', hair: 0.5, coat: 1.0 },
            { bodyY: 1, left: 'stand', right: 'tuck', hair: 0.6, coat: 0.8 },
            { bodyY: 0, left: 'back1', right: 'knee', hair: 0.7, coat: 0.6 },
            { bodyY: -1, left: 'back2', right: 'fwd1', hair: 0.8, coat: 0.4 },
            { bodyY: -1, left: 'tuck', right: 'fwd2', hair: 0.9, coat: 0.2 },
            { bodyY: 0, left: 'back1', right: 'fwd2', hair: 1.0, coat: 0.1 },
        ];

        const frames = [];
        cycle.forEach(p => {
            frames.push(this.generator.generateFrameWithCostume({
                bodySquash: p.bodyY,
                legFrame: { left: p.left, right: p.right },
                headOffset: { x: 0, y: p.bodyY },
                hairWave: p.hair,
                coatWave: p.coat,
            }, costume));
        });
        return frames;
    }
}
