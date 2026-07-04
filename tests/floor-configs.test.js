// tests/floor-configs.test.js
import { describe, it, expect } from 'vitest';
import { FLOOR_CONFIGS, getFloorConfig, getDepthTier } from '../src/core/dungeon/FloorConfigs.js';
import { generateDungeonLayout } from '../src/core/systems/generation/DungeonLayoutGenerator.js';

describe('FloorConfigs', () => {
    it('三层配置完备（敌人池/精英/Boss/缩放）', () => {
        for (const floor of [1, 2, 3]) {
            const c = FLOOR_CONFIGS[floor];
            expect(c, `floor ${floor}`).toBeDefined();
            expect(c.hpMult).toBeGreaterThanOrEqual(1);
            expect(c.dmgMult).toBeGreaterThanOrEqual(1);
            expect(c.eliteChance).toBeGreaterThan(0);
            expect(c.eliteAffixCount[0]).toBeGreaterThanOrEqual(1);
            for (const tier of ['shallow', 'mid', 'deep']) {
                const t = c.depthTiers[tier];
                expect(t.countMin).toBeGreaterThan(0);
                expect(t.countMax).toBeGreaterThanOrEqual(t.countMin);
                expect(Object.keys(t.weights).length).toBeGreaterThan(0);
            }
            expect(c.eliteSquad.types.length).toBeGreaterThan(0);
            expect(c.boss.types.length).toBeGreaterThan(0);
        }
    });

    it('难度缩放随楼层单调递增', () => {
        expect(FLOOR_CONFIGS[2].hpMult).toBeGreaterThan(FLOOR_CONFIGS[1].hpMult);
        expect(FLOOR_CONFIGS[3].hpMult).toBeGreaterThan(FLOOR_CONFIGS[2].hpMult);
        expect(FLOOR_CONFIGS[3].dmgMult).toBeGreaterThan(FLOOR_CONFIGS[1].dmgMult);
    });

    it('越界回退与深度档位选择', () => {
        expect(getFloorConfig(99)).toBe(FLOOR_CONFIGS[1]);
        const c = FLOOR_CONFIGS[1];
        expect(getDepthTier(c, 1)).toBe(c.depthTiers.shallow);
        expect(getDepthTier(c, 3)).toBe(c.depthTiers.mid);
        expect(getDepthTier(c, 7)).toBe(c.depthTiers.deep);
    });

    it('生成器编成：遭遇战房 count=出怪点数且角色合法；池化房 count 与 types 一致', () => {
        for (const floor of [1, 2, 3]) {
            const layout = generateDungeonLayout(130, 130, 987654, floor);
            const config = FLOOR_CONFIGS[floor];
            const poolTypes = new Set();
            for (const tier of Object.values(config.depthTiers)) {
                for (const t of Object.keys(tier.weights)) poolTypes.add(t);
            }
            for (const t of config.eliteSquad.types) poolTypes.add(t.type);
            for (const t of config.boss.types) poolTypes.add(t.type);

            let encounterRooms = 0;
            for (const room of layout.rooms) {
                const cfg = room.enemyConfig;
                if (Array.isArray(room.encounterSpawns) && room.encounterSpawns.length > 0) {
                    encounterRooms++;
                    expect(cfg.count, `room ${room.id} encounter count`).toBe(room.encounterSpawns.length);
                    for (const s of room.encounterSpawns) {
                        expect(config.roleMap[s.role], `role ${s.role}`).toBeDefined();
                    }
                    continue;
                }
                const sum = cfg.types.reduce((s, t) => s + t.count, 0);
                expect(sum, `room ${room.id} count consistency`).toBe(cfg.count);
                for (const t of cfg.types) {
                    expect(poolTypes.has(t.type), `type ${t.type} in pool`).toBe(true);
                }
            }
            // 普通战斗房应有相当比例走遭遇战模板
            expect(encounterRooms, `F${floor} encounter rooms`).toBeGreaterThan(0);
        }
    });
});
