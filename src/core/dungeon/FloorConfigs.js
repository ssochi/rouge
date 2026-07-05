// FloorConfigs —— 三层楼层数据驱动配置（纯数据，无逻辑）。
// 消费方：
//   - DungeonLayoutGenerator.computeEnemyConfig（深度分层敌人池 / 特殊房编成 / Boss 编成）
//   - DungeonManager._spawnRoomEnemies（hpMult/dmgMult 数值缩放、精英预算）
// 调参入口：P6 全链路平衡统一在此调整。
//
// 敌人池结构：depthTiers 按房间 BFS 深度分三档（shallow ≤2 / mid ≤4 / deep 5+），
// 每档 {countMin, countMax, weights: {type: 权重}}——权重决定组成比例（按比例取整分配，至少 1）。
// 新敌人（warlock/boomer/summoner/shieldbearer/sentry/lobber）随 P4-T3~T5 落地逐步入池。

export const FLOOR_CONFIGS = {
    1: {
        hpMult: 1.0,
        dmgMult: 1.0,
        // 精英预算：普通战斗房每只怪成为精英的概率 / 精英词缀数范围
        eliteChance: 0.06,
        eliteAffixCount: [1, 1],
        depthTiers: {
            shallow: { countMin: 4, countMax: 5, weights: { wraith: 4, zombie: 2, archer: 3, zombie_female: 2 } },
            mid: { countMin: 5, countMax: 7, weights: { wraith: 3, archer: 3, zombie_female: 2, boomer: 2, zombie_brute: 1.5, lobber: 1 } },
            deep: { countMin: 6, countMax: 8, weights: { wraith: 2, archer: 2.5, zombie_brute: 2, warlock: 1.5, boomer: 1.5, shieldbearer: 1.5, sentry: 1, lobber: 1 } }
        },
        eliteSquad: { types: [{ type: 'zombie_brute', count: 2 }, { type: 'hunter', count: 2 }, { type: 'soldier', count: 2 }] },
        boss: { types: [{ type: 'mutant_beast', count: 1 }, { type: 'zombie', count: 2 }, { type: 'zombie_female', count: 1 }] },
        // 遭遇战模板角色 → 敌人映射（m 近战 / r 远程 / h 重装 / e 精英保底词缀）
        roleMap: {
            m: ['wraith', 'wraith', 'zombie', 'zombie_female'],
            r: ['archer', 'archer', 'hunter'],
            h: ['zombie_brute', 'shieldbearer'],
            e: ['zombie_brute', 'archer', 'warlock']
        }
    },
    2: {
        hpMult: 1.3,
        dmgMult: 1.3,
        eliteChance: 0.10,
        eliteAffixCount: [1, 2],
        depthTiers: {
            shallow: { countMin: 6, countMax: 7, weights: { zombie_female: 3, zombie_brute: 3, hunter: 3, boomer: 2 } },
            mid: { countMin: 7, countMax: 9, weights: { zombie_brute: 1.5, hunter: 2.5, soldier: 2.5, warlock: 2, boomer: 1.5, shieldbearer: 2, summoner: 1, lobber: 1.5, sentry: 1 } },
            deep: { countMin: 8, countMax: 10, weights: { hunter: 2, soldier: 3.5, warlock: 2.5, shieldbearer: 2, summoner: 1.5, lobber: 1.5, sentry: 1.5 } }
        },
        eliteSquad: { types: [{ type: 'shieldbearer', count: 2 }, { type: 'hunter', count: 2 }, { type: 'soldier', count: 3 }] },
        // F2 Boss = 机械巨蛇（P4-T8 正式接入；全场机动压迫，护卫从简）
        boss: { types: [{ type: 'snake_boss', count: 1 }, { type: 'soldier', count: 2 }] },
        roleMap: {
            m: ['zombie_female', 'boomer', 'wraith'],
            r: ['hunter', 'lobber', 'warlock', 'sentry', 'archer'],
            h: ['shieldbearer'],
            e: ['warlock', 'summoner']
        }
    },
    3: {
        hpMult: 1.6,
        dmgMult: 1.6,
        eliteChance: 0.14,
        eliteAffixCount: [1, 2],
        depthTiers: {
            shallow: { countMin: 7, countMax: 8, weights: { zombie_brute: 3, hunter: 2.5, soldier: 3, boomer: 2.5 } },
            mid: { countMin: 8, countMax: 10, weights: { zombie_brute: 1.5, hunter: 2, soldier: 2.5, warlock: 2.5, boomer: 2, shieldbearer: 2, summoner: 1.5, lobber: 2, sentry: 1.5 } },
            deep: { countMin: 9, countMax: 11, weights: { hunter: 2, soldier: 3, warlock: 3, shieldbearer: 2.5, summoner: 2, lobber: 2, sentry: 2 } }
        },
        eliteSquad: { types: [{ type: 'shieldbearer', count: 2 }, { type: 'warlock', count: 2 }, { type: 'soldier', count: 3 }] },
        boss: { types: [{ type: 'mecha_golem', count: 1 }, { type: 'soldier', count: 4 }, { type: 'hunter', count: 2 }] },
        roleMap: {
            m: ['boomer', 'zombie_brute'],
            r: ['soldier', 'warlock', 'lobber', 'sentry'],
            h: ['shieldbearer'],
            e: ['warlock', 'summoner']
        }
    }
};

/**
 * 取楼层配置；越界回退 F1。
 * @param {number} floor 楼层（1 起）
 */
export function getFloorConfig(floor) {
    return FLOOR_CONFIGS[floor] || FLOOR_CONFIGS[1];
}

/**
 * 按深度取敌人池档位（shallow ≤2 / mid ≤4 / deep 5+）。
 */
export function getDepthTier(config, depth) {
    if (depth <= 2) return config.depthTiers.shallow;
    if (depth <= 4) return config.depthTiers.mid;
    return config.depthTiers.deep;
}
