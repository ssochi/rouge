// CostumeStats —— 服装属性表（纯数据 + 聚合函数）。
// 帽子/衣服/眼镜按主题携带属性加成（发型/胡子保持纯外观）；
// 消费点：PlayerSystem 移速、CombatSystem 玩家子弹伤害/暴击、CostumeSystem 装备时 maxHp 记账。

export const COSTUME_STATS = {
    // ── 帽子 ──
    hat_beret: { damageMult: 1.04 },
    hat_bandana: { moveSpeedMult: 1.03 },
    hat_santa: { maxHpBonus: 5 },
    hat_clown: { critChance: 0.04 },
    hat_knight: { maxHpBonus: 15, moveSpeedMult: 0.98 },
    hat_ninja: { moveSpeedMult: 1.05, critChance: 0.05 },
    hat_pirate: { damageMult: 1.03, critChance: 0.05 },

    // ── 衣服 ──
    clothes_hoodie: { maxHpBonus: 8 },
    clothes_vest: { maxHpBonus: 12, moveSpeedMult: 0.98 },
    clothes_santa: { maxHpBonus: 10 },
    clothes_clown: { moveSpeedMult: 1.08 },
    clothes_cyber: { damageMult: 1.08, moveSpeedMult: 1.03 },
    clothes_knight: { maxHpBonus: 30, moveSpeedMult: 0.94 },
    clothes_ninja: { moveSpeedMult: 1.12 },
    clothes_pirate: { damageMult: 1.1 },

    // ── 眼镜 ──
    glasses_round: { maxHpBonus: 5 },
    glasses_goggles: { critChance: 0.03 },
    glasses_cyber: { critChance: 0.08 },
    glasses_eyepatch: { damageMult: 1.05 }
};

const NEUTRAL = Object.freeze({ maxHpBonus: 0, moveSpeedMult: 1, damageMult: 1, critChance: 0 });

/**
 * 聚合当前穿着的全部属性。
 * @param {Object|null} costumeState 玩家 costume 状态 { hairstyle, hat, clothes, glasses, beard }
 * @returns {{maxHpBonus: number, moveSpeedMult: number, damageMult: number, critChance: number}}
 */
export function getCostumeStats(costumeState) {
    if (!costumeState) return NEUTRAL;

    let maxHpBonus = 0;
    let moveSpeedMult = 1;
    let damageMult = 1;
    let critChance = 0;

    for (const slot of ['hat', 'clothes', 'glasses', 'hairstyle', 'beard']) {
        const pieceId = costumeState[slot];
        if (!pieceId) continue;
        const stats = COSTUME_STATS[pieceId];
        if (!stats) continue;
        maxHpBonus += stats.maxHpBonus || 0;
        moveSpeedMult *= stats.moveSpeedMult ?? 1;
        damageMult *= stats.damageMult ?? 1;
        critChance += stats.critChance || 0;
    }

    return { maxHpBonus, moveSpeedMult, damageMult, critChance };
}

/**
 * 单件服装的属性描述文本（背包 tooltip 用）；无属性返回 null。
 */
export function costumeStatsDescription(pieceId) {
    const stats = COSTUME_STATS[pieceId];
    if (!stats) return null;

    const parts = [];
    if (stats.maxHpBonus) parts.push(`生命上限 ${stats.maxHpBonus > 0 ? '+' : ''}${stats.maxHpBonus}`);
    if (stats.moveSpeedMult && stats.moveSpeedMult !== 1) {
        const pct = Math.round((stats.moveSpeedMult - 1) * 100);
        parts.push(`移速 ${pct > 0 ? '+' : ''}${pct}%`);
    }
    if (stats.damageMult && stats.damageMult !== 1) {
        const pct = Math.round((stats.damageMult - 1) * 100);
        parts.push(`伤害 ${pct > 0 ? '+' : ''}${pct}%`);
    }
    if (stats.critChance) parts.push(`暴击 +${Math.round(stats.critChance * 100)}%`);

    return parts.length > 0 ? parts.join(' · ') : null;
}
