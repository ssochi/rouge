// tests/f1-prison-encounters.test.js
// F1 监狱层主题模板专项校验：floors 标记、专属地板、异形数量、legend 物件与地板均可解析。
import { describe, it, expect } from 'vitest';
import { F1_PRISON_TEMPLATES } from '../src/core/systems/generation/encounters/f1_prison.js';
import { parseEncounter } from '../src/core/systems/generation/EncounterTemplates.js';
import { FLOOR_TYPES } from '../src/utils/FloorTypes.js';

// F1 legend 允许的物件类型（新增 prison_* + 复用的既有家具/地牢件）。
// 注：ObjectRegistry 会传递性加载 Assets.js（依赖 document），node 环境无法导入，
// 故此处以静态清单校验 legend 无拼写错误；真实注册由 build + 截图覆盖。
const F1_KNOWN_PROPS = new Set([
    'prison_cell_door', 'prison_file_cabinet', 'prison_locker', 'prison_dirt_mound',
    'prison_visit_booth', 'prison_watchtower', 'prison_bunk',
    'dungeon_bars', 'dungeon_bone_pile', 'dungeon_iron_cage', 'dungeon_rack',
    'table', 'chair', 'computer_desk', 'tv_stand',
    // [depth-batch:rooms] 房间机关
    'spike_trap', 'reward_cage', 'cage_lever', 'decoy_statue'
]);

describe('F1 监狱层模板', () => {
    it('数量 ≥ 8 且档位覆盖 shallow/mid/deep', () => {
        expect(F1_PRISON_TEMPLATES.length).toBeGreaterThanOrEqual(8);
        for (const tier of ['shallow', 'mid', 'deep']) {
            const pool = F1_PRISON_TEMPLATES.filter(t => t.tier === tier);
            expect(pool.length, tier).toBeGreaterThanOrEqual(2);
        }
    });

    it('每个模板都标记 floors: [1]', () => {
        for (const t of F1_PRISON_TEMPLATES) {
            expect(Array.isArray(t.floors), `${t.id} floors 数组`).toBe(true);
            expect(t.floors, `${t.id} 仅限 F1`).toEqual([1]);
        }
    });

    it('floorType 均为合法 FLOOR_TYPES 键', () => {
        for (const t of F1_PRISON_TEMPLATES) {
            expect(t.floorType, `${t.id} 有地板`).toBeTruthy();
            expect(FLOOR_TYPES[t.floorType], `${t.id} floorType=${t.floorType}`).toBeDefined();
        }
    });

    it('三种 F1 专属地板已注册（ID 10/11/12 + 键名）', () => {
        expect(FLOOR_TYPES.PRISON_CELLBLOCK).toBe(10);
        expect(FLOOR_TYPES.PRISON_WET).toBe(11);
        expect(FLOOR_TYPES.PRISON_BLOOD).toBe(12);
    });

    it('至少 3 个异形房间（含实体内墙 #）', () => {
        const misshapen = F1_PRISON_TEMPLATES.filter(t => t.rows.some(r => r.includes('#')));
        expect(misshapen.length).toBeGreaterThanOrEqual(3);
    });

    it('尺寸合法：行宽一致、宽≤16、高≤13', () => {
        for (const t of F1_PRISON_TEMPLATES) {
            const w = t.rows[0].length;
            for (const row of t.rows) expect(row.length, `${t.id} 行宽`).toBe(w);
            expect(w, `${t.id} 宽`).toBeLessThanOrEqual(16);
            expect(t.rows.length, `${t.id} 高`).toBeLessThanOrEqual(13);
        }
    });

    it('每个 legend 物件都是已知类型（无拼写错误）', () => {
        for (const t of F1_PRISON_TEMPLATES) {
            for (const type of Object.values(t.legend || {})) {
                expect(F1_KNOWN_PROPS.has(type), `${t.id} 物件 ${type} 非已知类型`).toBe(true);
            }
        }
    });

    it('波次结构：波1 开局 3-8（人潮化）、波2 不弱于波1', () => {
        for (const t of F1_PRISON_TEMPLATES) {
            const parsed = parseEncounter(t);
            const w0 = parsed.spawns.filter(s => s.wave === 0).length;
            const w1 = parsed.spawns.filter(s => s.wave === 1).length;
            expect(w0, `${t.id} 波1`).toBeGreaterThanOrEqual(3);
            expect(w0, `${t.id} 波1 上限`).toBeLessThanOrEqual(8);
            if (w1 > 0) expect(w1, `${t.id} 波2`).toBeGreaterThanOrEqual(w0);
        }
    });
});
