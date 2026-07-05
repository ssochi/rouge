// 稀有度加权掉落表
// 纯逻辑模块：不依赖 Canvas / DOM，仅做随机选取与数值计算，便于单元测试与后续数值调优（P6）。

import { RARITY_TIERS } from './RarityConfig.js';
import { RELIC_IDS } from '../../assets/relics/RelicData.js';
import { LOOT_WEAPON_BLACKLIST, CHEST_TIERS, ROOM_CLEAR } from './EconomyConfig.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';

// 可作为地牢掉落的宠物物品 id（InventorySystem 中注册的召唤凭证），三选一。
export const PET_ITEM_IDS = ['consumable:pet_dog', 'consumable:pet_cat', 'consumable:pet_2b'];

// 在未拥有的宠物物品中均匀随机抽取一个；全部已拥有时返回 null。
// ownedPetItemIds：玩家已在背包持有 或 已召唤同类的宠物物品 id，避免重复无用掉落。
export function pickPetItem(ownedPetItemIds = [], rng = Math.random) {
    const owned = new Set(ownedPetItemIds);
    const pool = PET_ITEM_IDS.filter(id => !owned.has(id));
    if (pool.length === 0) return null;
    const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    return pool[idx];
}

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

// [tension-batch:power] 遗物「三选一」候选抽取：从未持有池中不重复抽取 count 个 id（默认 3）。
// 供 RelicAltar 祭坛使用——互不重复、排除已持有；池不足 count 时返回尽可能多的候选。
export function pickRelicChoices(ownedRelicIds = [], count = 3, rng = Math.random) {
    const excluded = [...ownedRelicIds];
    const picks = [];
    for (let i = 0; i < count; i++) {
        const id = pickRelic(excluded, rng);
        if (!id) break; // 池已抽空
        excluded.push(id);
        picks.push(id);
    }
    return picks;
}

// [tension-batch:power] 当层清房武器稀有度权重：按层取 ROOM_CLEAR.weaponRarityWeightsByFloor，
// 缺失楼层回退旧的固定权重（防越界，超出配置层数时沿用最后一档语义由调用方保证）。
export function weaponRarityWeightsForFloor(floor) {
    const byFloor = ROOM_CLEAR.weaponRarityWeightsByFloor;
    return (byFloor && byFloor[floor]) || ROOM_CLEAR.weaponRarityWeights;
}

// [tension-batch:power] 每层武器保底判定：本层已清房数达阈值且本层尚未掉过武器时，强制掉落。
// threshold 默认取 ROOM_CLEAR.weaponGuaranteeRooms。纯函数，供 DungeonManager 计数器消费与单测。
export function shouldForceWeaponDrop(roomsClearedThisFloor, weaponDroppedThisFloor, threshold = ROOM_CLEAR.weaponGuaranteeRooms) {
    if (weaponDroppedThisFloor) return false;
    return roomsClearedThisFloor >= threshold;
}

// 组合稀有度权重 + 武器/遗物/宠物抽取 + 金币区间随机，模拟一次开箱。
// opts.ownedRelicIds: 已持有遗物（去重）；opts.forceRelic: 保底遗物（Boss 箱，未全收集时必出遗物）。
// opts.ownedPetItemIds: 已拥有/已召唤的宠物物品 id（去重），避免重复无用掉落。
// 抽取优先级：遗物 > 宠物 > 武器（前两者未命中或已收满时回退武器）。
// 返回 { kind: 'weapon'|'relic'|'pet', weaponConfigId, relicId, petItemId, coins }。
export function rollChest(tierName, rng = Math.random, opts = {}) {
    const tier = CHEST_TIERS[tierName];
    const [min, max] = tier.coins;
    const coins = min + Math.floor(rng() * (max - min + 1));

    const ownedRelicIds = opts.ownedRelicIds || [];
    const wantRelic = opts.forceRelic || rng() < (tier.relicChance || 0);
    if (wantRelic) {
        const relicId = pickRelic(ownedRelicIds, rng);
        if (relicId) {
            return { kind: 'relic', weaponConfigId: null, relicId, petItemId: null, coins };
        }
        // 遗物全收集 → 回退武器
    }

    // 宠物掉落：仅高档箱（petChance>0）参与，命中且尚有未拥有宠物时产出，否则回退武器。
    const petChance = tier.petChance || 0;
    if (petChance > 0 && rng() < petChance) {
        const petItemId = pickPetItem(opts.ownedPetItemIds || [], rng);
        if (petItemId) {
            return { kind: 'pet', weaponConfigId: null, relicId: null, petItemId, coins };
        }
        // 三只宠物全部已拥有 → 回退武器
    }

    const rarity = pickRarity(tier.rarityWeights, rng);
    const weaponConfigId = pickWeaponByRarity(rarity, rng);
    return { kind: 'weapon', weaponConfigId, relicId: null, petItemId: null, coins };
}
