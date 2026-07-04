// 稀有度加权掉落表
// 纯逻辑模块：不依赖 Canvas / DOM，仅做随机选取与数值计算，便于单元测试与后续数值调优（P6）。

import { RARITY_TIERS } from './RarityConfig.js';
import { RELIC_IDS } from '../../assets/relics/RelicData.js';
import { LOOT_WEAPON_BLACKLIST, CHEST_TIERS } from './EconomyConfig.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';

// 按权重表随机选取稀有度档位（累计权重扫描）。
// weights: { common, uncommon, rare, epic, legendary } 部分档位可缺省（视为 0）。
// 权重总和为 0 时兜底返回 'common'。
export function pickRarity(weights, rng = Math.random) {
    const total = RARITY_TIERS.reduce((sum, tier) => sum + (weights[tier] || 0), 0);
    if (total <= 0) return 'common';

    const roll = rng() * total;
    let cumulative = 0;
    for (const tier of RARITY_TIERS) {
        cumulative += weights[tier] || 0;
        if (roll < cumulative) return tier;
    }
    return RARITY_TIERS[RARITY_TIERS.length - 1];
}

// 返回该稀有度档位下可掉落的武器 configId 列表。
// 排除工具武器（isUtility）、无伤害武器（damage === 0）、以及掉落黑名单（LOOT_WEAPON_BLACKLIST）。
export function weaponsOfRarity(rarity) {
    const ids = [];
    for (const [id, conf] of Object.entries(WEAPONS)) {
        if (conf.rarity !== rarity) continue;
        if (conf.isUtility) continue;
        if (conf.damage === 0) continue;
        if (LOOT_WEAPON_BLACKLIST.has(id)) continue;
        ids.push(id);
    }
    return ids;
}

// 在指定稀有度档内均匀随机选取一把武器；若该档为空，向下逐档回退（rare 空 → uncommon → common）。
// 全部档位（自身及以下）均为空时返回 null。
export function pickWeaponByRarity(rarity, rng = Math.random) {
    let tierIndex = RARITY_TIERS.indexOf(rarity);
    for (let i = tierIndex; i >= 0; i--) {
        const pool = weaponsOfRarity(RARITY_TIERS[i]);
        if (pool.length > 0) {
            const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
            return pool[idx];
        }
    }
    return null;
}

// 在未持有的遗物中均匀随机抽取一个；全部持有时返回 null。
export function pickRelic(ownedRelicIds = [], rng = Math.random) {
    const owned = new Set(ownedRelicIds);
    const pool = RELIC_IDS.filter(id => !owned.has(id));
    if (pool.length === 0) return null;
    const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    return pool[idx];
}

// 组合稀有度权重 + 武器/遗物抽取 + 金币区间随机，模拟一次开箱。
// opts.ownedRelicIds: 已持有遗物（去重）；opts.forceRelic: 保底遗物（Boss 箱，未全收集时必出遗物）。
// 返回 { kind: 'weapon'|'relic', weaponConfigId, relicId, coins }。
export function rollChest(tierName, rng = Math.random, opts = {}) {
    const tier = CHEST_TIERS[tierName];
    const [min, max] = tier.coins;
    const coins = min + Math.floor(rng() * (max - min + 1));

    const ownedRelicIds = opts.ownedRelicIds || [];
    const wantRelic = opts.forceRelic || rng() < (tier.relicChance || 0);
    if (wantRelic) {
        const relicId = pickRelic(ownedRelicIds, rng);
        if (relicId) {
            return { kind: 'relic', weaponConfigId: null, relicId, coins };
        }
        // 遗物全收集 → 回退武器
    }

    const rarity = pickRarity(tier.rarityWeights, rng);
    const weaponConfigId = pickWeaponByRarity(rarity, rng);
    return { kind: 'weapon', weaponConfigId, relicId: null, coins };
}
