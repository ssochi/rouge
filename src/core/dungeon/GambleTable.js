// GambleTable.js
// 老虎机赌博玩法的纯逻辑（无 Canvas / DOM 依赖，便于单元测试与数值调优）。
// 负责：耐久随机、加权结果抽取、奖励解析、滚轮图案映射，以及一次投币事务（SlotMachineCore）。
// 掉落 / 爆炸 / 动画由实体侧（SlotMachine.js）依据本模块产出的 reward 执行。

import { GAMBLE } from './EconomyConfig.js';
import { pickRarity, pickWeaponByRarity, pickRelic } from './LootTable.js';

// 滚轮图案 id（美术 glyph 见 SlotMachineSprite.js 的 symbols）。
export const SLOT_SYMBOLS = ['seven', 'cherry', 'bell', 'coin', 'bomb', 'key', 'cross', 'sword', 'bar'];

// 中奖结果 → 三连图案（可读的视觉反馈：三连=中奖，混合=空奖，三炸弹=惩罚）。
const OUTCOME_SYMBOL = {
    relic: 'seven',       // 三个 7！大奖
    coins_big: 'coin',
    coins_small: 'cherry',
    medkit: 'cross',
    key: 'key',
    weapon: 'sword',
    bomb: 'bomb',
};

/**
 * 随机耐久（可玩次数）：[durabilityMin, durabilityMax] 闭区间整数。
 * @param {() => number} rng
 * @returns {number}
 */
export function rollDurability(rng = Math.random) {
    const { durabilityMin: lo, durabilityMax: hi } = GAMBLE;
    return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * 按权重抽取一个结果配置（累计权重扫描，自动按总权重归一化）。
 * @param {() => number} rng
 * @param {boolean} isLastSpin 是否为耗尽前最后一次（true 时剔除非中奖结果，保底「中奖及以上」）
 * @returns {{kind: string, weight: number}} 结果表中的配置对象
 */
export function pickGambleOutcome(rng = Math.random, isLastSpin = false) {
    const pool = isLastSpin
        ? GAMBLE.outcomes.filter(o => !GAMBLE.nonRewardKinds.includes(o.kind))
        : GAMBLE.outcomes;
    const total = pool.reduce((sum, o) => sum + (o.weight || 0), 0);
    if (total <= 0) return pool[0] || GAMBLE.outcomes[0];

    const roll = rng() * total;
    let cumulative = 0;
    for (const o of pool) {
        cumulative += o.weight || 0;
        if (roll < cumulative) return o;
    }
    return pool[pool.length - 1];
}

/**
 * 生成三个滚轮最终图案：中奖三连 / 空奖三不同 / 炸弹三连。
 * @param {string} kind 结果 kind
 * @param {() => number} rng
 * @returns {[string, string, string]}
 */
export function symbolsForOutcome(kind, rng = Math.random) {
    if (kind === 'empty') {
        // 三个互不相同的图案（避免凑成三连的误读）
        const bag = SLOT_SYMBOLS.filter(s => s !== 'bomb'); // 炸弹留给惩罚，避免误导
        const picks = [];
        while (picks.length < 3 && bag.length > 0) {
            const idx = Math.min(bag.length - 1, Math.floor(rng() * bag.length));
            picks.push(bag.splice(idx, 1)[0]);
        }
        while (picks.length < 3) picks.push(SLOT_SYMBOLS[0]);
        return picks;
    }
    const sym = OUTCOME_SYMBOL[kind] || 'bar';
    return [sym, sym, sym];
}

/**
 * 解析结果 kind → 具体奖励数据（供实体侧执行掉落 / 爆炸）。
 * @param {{kind: string, coinMin?: number, coinMax?: number, damage?: number, radius?: number, knockback?: number}} outcome
 * @param {() => number} rng
 * @param {{ownedRelicIds?: string[]}} opts
 * @returns {{kind: string, coins: number, weaponConfigId: string|null, relicId: string|null,
 *            damage: number, radius: number, knockback: number, symbols: string[]}}
 */
export function resolveGambleReward(outcome, rng = Math.random, opts = {}) {
    const kind = outcome.kind;
    const reward = {
        kind,
        coins: 0,
        weaponConfigId: null,
        relicId: null,
        damage: 0,
        radius: 0,
        knockback: 0,
        symbols: symbolsForOutcome(kind, rng),
    };

    switch (kind) {
        case 'coins_small':
        case 'coins_big': {
            const lo = outcome.coinMin || 0;
            const hi = outcome.coinMax || lo;
            reward.coins = lo + Math.floor(rng() * (hi - lo + 1));
            break;
        }
        case 'weapon': {
            const rarity = pickRarity(GAMBLE.weaponRarityWeights, rng);
            reward.weaponConfigId = pickWeaponByRarity(rarity, rng);
            // 该稀有度池空导致回退失败时降级为小额金币，避免空手
            if (!reward.weaponConfigId) {
                reward.kind = 'coins_small';
                reward.coins = 3 + Math.floor(rng() * 3);
                reward.symbols = symbolsForOutcome('coins_small', rng);
            }
            break;
        }
        case 'relic': {
            reward.relicId = pickRelic(opts.ownedRelicIds || [], rng);
            // 遗物已全收集 → 降级为金币大奖（仍是「中奖及以上」）
            if (!reward.relicId) {
                reward.kind = 'coins_big';
                reward.coins = 15 + Math.floor(rng() * 11);
                reward.symbols = symbolsForOutcome('coins_big', rng);
            }
            break;
        }
        case 'bomb': {
            reward.damage = outcome.damage || 10;
            reward.radius = outcome.radius || 56;
            reward.knockback = outcome.knockback || 6;
            break;
        }
        // medkit / key / empty：无额外数值
        default:
            break;
    }
    return reward;
}

/**
 * SlotMachineCore —— 老虎机核心状态与投币事务（纯逻辑，无 Canvas）。
 * 实体 SlotMachine 持有一个 core 实例，仅在其上叠加绘制与世界效果。
 */
export class SlotMachineCore {
    /**
     * @param {() => number} rng 随机源（默认 Math.random；测试可注入可复现序列）
     */
    constructor(rng = Math.random) {
        this.rng = rng;
        this.durability = rollDurability(rng); // 剩余可玩次数
        this.dead = false;                     // 是否已爆机（废机）
    }

    /** 当前这一抽是否为耗尽前最后一次（触发保底）。 */
    get isLastSpin() {
        return this.durability === 1;
    }

    /** 是否还能投币（未爆机且有耐久）。 */
    canSpin() {
        return !this.dead && this.durability > 0;
    }

    /**
     * 尝试投币开始一次抽奖（纯事务，不触碰世界）。
     * 金币不足时依赖 runState.spendCoins 的「不足不扣款」语义，绝不消费。
     * @param {import('./DungeonRunState.js').DungeonRunState} runState
     * @param {string[]} ownedRelicIds 已持有遗物 id（遗物去重用）
     * @returns {{ok: boolean, reason: string, reward?: object, isLast?: boolean}}
     */
    beginSpin(runState, ownedRelicIds = []) {
        if (this.dead || this.durability <= 0) return { ok: false, reason: 'dead' };
        if (!runState || !runState.spendCoins(GAMBLE.coinCost)) {
            return { ok: false, reason: 'no_gold' };
        }
        const isLast = this.isLastSpin;
        const outcome = pickGambleOutcome(this.rng, isLast);
        const reward = resolveGambleReward(outcome, this.rng, { ownedRelicIds });
        return { ok: true, reason: 'spinning', reward, isLast };
    }

    /**
     * 抽奖动画结束后结算耐久：-1，归零则爆机。
     * @returns {boolean} 本次是否触发爆机
     */
    settle() {
        this.durability -= 1;
        if (this.durability <= 0) {
            this.durability = 0;
            this.dead = true;
        }
        return this.dead;
    }
}
