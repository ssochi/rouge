// tests/costume-stats.test.js
import { describe, it, expect } from 'vitest';
import { COSTUME_STATS, getCostumeStats, costumeStatsDescription } from '../src/assets/characters/player/costumes/CostumeStats.js';

describe('CostumeStats', () => {
    it('空/裸装返回中性值', () => {
        expect(getCostumeStats(null)).toEqual({ maxHpBonus: 0, moveSpeedMult: 1, damageMult: 1, critChance: 0 });
        expect(getCostumeStats({ hairstyle: 'hair_long', hat: null, clothes: null, glasses: null, beard: null }))
            .toEqual({ maxHpBonus: 0, moveSpeedMult: 1, damageMult: 1, critChance: 0 });
    });

    it('多件叠加：加法项相加、乘法项相乘', () => {
        const stats = getCostumeStats({
            hairstyle: 'hair_long',
            hat: 'hat_knight',       // maxHp +15, speed ×0.98
            clothes: 'clothes_knight', // maxHp +30, speed ×0.94
            glasses: 'glasses_cyber',  // crit +8%
            beard: null
        });
        expect(stats.maxHpBonus).toBe(45);
        expect(stats.moveSpeedMult).toBeCloseTo(0.98 * 0.94);
        expect(stats.critChance).toBeCloseTo(0.08);
        expect(stats.damageMult).toBe(1);
    });

    it('描述文本：有属性生成、无属性返回 null', () => {
        const desc = costumeStatsDescription('clothes_knight');
        expect(desc).toContain('生命上限 +30');
        expect(desc).toContain('移速 -6%');
        expect(costumeStatsDescription('hair_long')).toBeNull();
    });

    it('属性表数值健全（乘区为正、暴击 ≤ 20%）', () => {
        for (const [id, stats] of Object.entries(COSTUME_STATS)) {
            if (stats.moveSpeedMult !== undefined) {
                expect(stats.moveSpeedMult, id).toBeGreaterThan(0.8);
                expect(stats.moveSpeedMult, id).toBeLessThan(1.3);
            }
            if (stats.damageMult !== undefined) {
                expect(stats.damageMult, id).toBeGreaterThan(0.8);
                expect(stats.damageMult, id).toBeLessThan(1.3);
            }
            if (stats.critChance !== undefined) {
                expect(stats.critChance, id).toBeLessThanOrEqual(0.2);
            }
        }
    });
});
