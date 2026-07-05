// 地牢经济数值集中配置
// 所有掉落/奖励相关的数值均在此定义，供 P6 数值调优时统一调整。

// 敌人死亡掉落金币基准值（按敌人类型），default 为兜底值。
export const ENEMY_COIN_VALUES = { zombie: 2, zombie_female: 2, zombie_brute: 5, hunter: 4, soldier: 5, warlock: 6, boomer: 3, summoner: 6, shieldbearer: 5, sentry: 5, lobber: 5, wraith: 2, archer: 4, hellhound: 3, flail_warden: 6, plague_rat: 1, cultist: 5, gargoyle: 5, spinner: 5, weeper: 5, splitter: 6, /* [depth-batch:enemies] loot_goblin 死亡金币由实体 getDungeonCoinValue 覆盖 */ loot_goblin: 2, burrower: 5, arc_twin: 3, revenant: 4, default: 2, boss: 50 };

// 可破坏物掉落金币：触发概率 + 数量区间（仅地牢场景生效）。
export const BREAKABLE_COIN = { chance: 0.3, min: 1, max: 3 };

// 清房奖励：钥匙/武器掉落概率 + 金币数量区间 + 武器稀有度权重。
export const ROOM_CLEAR = {
    keyChance: 0.15,
    weaponChance: 0.15,
    coinMin: 3,
    coinMax: 8,
    weaponRarityWeights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
    chestChance: 0.08, // 普通房清除后生成木箱的概率（正式宝箱房归 P3，此为过渡曝光）
};

// 地牢总层数（末层 Boss 清除后出胜利传送门）。
export const FINAL_FLOOR = 3;

// Boss 清除保底宝箱档位（按楼层）。
export const BOSS_CHEST_TIER = { 1: 'mithril', 2: 'dragon', 3: 'dragon' };

// 宝箱房固定投放（按楼层，地图初始化时生成）。
export const TREASURE_ROOM_CHESTS = { 1: ['iron', 'wood'], 2: ['mithril', 'iron'], 3: ['dragon', 'mithril'] };

// 精英房清除保底奖励：必掉钥匙 + 保底宝箱 + 金币加成。
export const ELITE_CLEAR = { chestTier: 'iron', coinMult: 1.5 };

// 宝箱档位：是否需要钥匙、金币区间、稀有度权重分布。
// petChance：产出宠物物品的概率（优先级低于遗物、高于武器）。仅高档箱设置，wood/iron 不产宠物。
export const CHEST_TIERS = {
    wood: { needsKey: false, coins: [3, 8], relicChance: 0.10, rarityWeights: { common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0 } },
    iron: { needsKey: true, coins: [6, 14], relicChance: 0.25, rarityWeights: { common: 15, uncommon: 45, rare: 30, epic: 9, legendary: 1 } },
    mithril: { needsKey: true, coins: [10, 20], relicChance: 0.45, petChance: 0.06, rarityWeights: { common: 0, uncommon: 20, rare: 45, epic: 28, legendary: 7 } },
    dragon: { needsKey: true, coins: [15, 30], relicChance: 0.55, petChance: 0.10, rarityWeights: { common: 0, uncommon: 0, rare: 30, epic: 45, legendary: 25 } },
};

// 商店定价与商品权重。
export const SHOP = {
    weaponPriceByRarity: { common: 15, uncommon: 25, rare: 40, epic: 60, legendary: 90 },
    weaponRarityWeights: { common: 20, uncommon: 35, rare: 30, epic: 12, legendary: 3 },
    relicPrice: 45,
    keyPrice: 20,
    medkitPrice: 15,
    floorPriceMult: { 1: 1, 2: 1.4, 3: 1.8 },
};

// 掉落池黑名单：非战斗/特殊拾取武器 id，唯一权威来源（WorldSystem 房间刷枪池同样引用此处）。
export const LOOT_WEAPON_BLACKLIST = new Set(['hammer', 'boomerang', 'recovery_needle', 'hamburger', 'medkit']);

// [depth-batch:gamble] 老虎机赌博玩法配置：投币价、耐久区间、加权结果表、武器稀有度权重、放置规则。
// 结果表权重之和无需为 100，抽取时按总权重归一化（见 GambleTable.pickGambleOutcome）。
// kind 语义见 GambleTable.resolveGambleReward / SlotMachine：
//   empty        空奖（三个不同图案，无产出）
//   coins_small  小额金币返还
//   coins_big    金币大奖
//   medkit       医疗包
//   key          钥匙
//   weapon       武器（稀有度加权）
//   relic        遗物（三个 7！大奖特效）
//   bomb         爆炸惩罚（小范围爆炸，伤玩家）
export const GAMBLE = {
    coinCost: 8,          // 每次投币价（金币）
    durabilityMin: 3,     // 单台机器最少可玩次数
    durabilityMax: 8,     // 单台机器最多可玩次数
    // 加权结果表（约：空奖35% / 小额25% / 大奖15% / medkit8% / 钥匙6% / 武器5% / 遗物3% / 爆炸3%）
    outcomes: [
        { kind: 'empty',       weight: 35 },
        { kind: 'coins_small', weight: 25, coinMin: 3,  coinMax: 5 },
        { kind: 'coins_big',   weight: 15, coinMin: 15, coinMax: 25 },
        { kind: 'medkit',      weight: 8 },
        { kind: 'key',         weight: 6 },
        { kind: 'weapon',      weight: 5 },
        { kind: 'relic',       weight: 3 },
        { kind: 'bomb',        weight: 3, damage: 10, radius: 56, knockback: 6 },
    ],
    // 非中奖结果集合：耗尽保底（最后一次）时从结果表中剔除，确保「中奖及以上」。
    nonRewardKinds: ['empty', 'bomb'],
    // 武器稀有度权重（略偏保守，低于宝箱）。
    weaponRarityWeights: { common: 45, uncommon: 30, rare: 18, epic: 6, legendary: 1 },
    // 放置：每层随机战斗房清房后角落刷机的概率 + 每层战斗房最多刷几台。
    battleRoomChance: 0.20,
    maxPerFloorBattleRooms: 2,
};
