// 地牢经济数值集中配置
// 所有掉落/奖励相关的数值均在此定义，供 P6 数值调优时统一调整。

// 敌人死亡掉落金币基准值（按敌人类型），default 为兜底值。
export const ENEMY_COIN_VALUES = { zombie: 2, zombie_female: 2, zombie_brute: 5, hunter: 4, soldier: 5, default: 2, boss: 50 };

// 可破坏物掉落金币：触发概率 + 数量区间（仅地牢场景生效）。
export const BREAKABLE_COIN = { chance: 0.3, min: 1, max: 3 };

// 清房奖励：钥匙/武器掉落概率 + 金币数量区间 + 武器稀有度权重。
export const ROOM_CLEAR = {
    keyChance: 0.15,
    weaponChance: 0.15,
    coinMin: 3,
    coinMax: 8,
    weaponRarityWeights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
};

// 宝箱档位：是否需要钥匙、金币区间、稀有度权重分布。
export const CHEST_TIERS = {
    wood: { needsKey: false, coins: [3, 8], rarityWeights: { common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0 } },
    iron: { needsKey: true, coins: [6, 14], rarityWeights: { common: 15, uncommon: 45, rare: 30, epic: 9, legendary: 1 } },
    mithril: { needsKey: true, coins: [10, 20], rarityWeights: { common: 0, uncommon: 20, rare: 45, epic: 28, legendary: 7 } },
    dragon: { needsKey: true, coins: [15, 30], rarityWeights: { common: 0, uncommon: 0, rare: 30, epic: 45, legendary: 25 } },
};

// 掉落池黑名单：非战斗/特殊拾取武器 id，唯一权威来源（WorldSystem 房间刷枪池同样引用此处）。
export const LOOT_WEAPON_BLACKLIST = new Set(['hammer', 'boomerang', 'recovery_needle', 'hamburger', 'medkit']);
