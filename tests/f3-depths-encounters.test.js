// F3 深渊实验室层模板健全性：floors 标记 / 专属地板 / 尺寸 / 异形房 / 地板注册。
// 通用连通性/掩体/波次约束由 encounter-templates.test.js 对全池统一校验。
import { describe, it, expect } from 'vitest';
import { F3_DEPTHS_TEMPLATES } from '../src/core/systems/generation/encounters/f3_depths.js';
import { parseEncounter } from '../src/core/systems/generation/EncounterTemplates.js';
import { FLOOR_TYPES, FLOOR_TYPE_KEYS } from '../src/utils/FloorTypes.js';

const F3_FLOOR_TYPES = ['LAB_GRATE', 'LAB_TILE', 'LAB_HAZARD'];

describe('F3 深渊实验室层模板', () => {
    it('至少 10 个故事模板', () => {
        expect(F3_DEPTHS_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('每个模板都带 floors:[3]（只在 F3 出现）', () => {
        for (const t of F3_DEPTHS_TEMPLATES) {
            expect(t.floors, `${t.id} floors`).toEqual([3]);
        }
    });

    it('每个模板整房换 F3 专属地板', () => {
        for (const t of F3_DEPTHS_TEMPLATES) {
            expect(F3_FLOOR_TYPES, `${t.id} floorType`).toContain(t.floorType);
        }
    });

    it('尺寸合法：行宽一致且不超上限（w≤16, h≤12）', () => {
        for (const t of F3_DEPTHS_TEMPLATES) {
            const w = t.rows[0].length;
            for (const row of t.rows) {
                expect(row.length, `${t.id} 行宽`).toBe(w);
            }
            expect(w, `${t.id} 宽`).toBeLessThanOrEqual(16);
            expect(t.rows.length, `${t.id} 高`).toBeLessThanOrEqual(12);
        }
    });

    it('至少 3 个异形房（用 # 雕刻墙块）', () => {
        const shaped = F3_DEPTHS_TEMPLATES.filter(t => t.rows.some(r => r.includes('#')));
        expect(shaped.length).toBeGreaterThanOrEqual(3);
    });

    it('parseEncounter 透传 floorType 为已注册地板类型', () => {
        for (const t of F3_DEPTHS_TEMPLATES) {
            const parsed = parseEncounter(t);
            expect(parsed.floorType, `${t.id} 解析 floorType`).toBe(t.floorType);
            expect(FLOOR_TYPES[parsed.floorType], `${t.id} 地板已注册`).toBeDefined();
        }
    });

    it('F3 专属地板 ID/键注册正确（16/17/18）', () => {
        expect(FLOOR_TYPES.LAB_GRATE).toBe(16);
        expect(FLOOR_TYPES.LAB_TILE).toBe(17);
        expect(FLOOR_TYPES.LAB_HAZARD).toBe(18);
        expect(FLOOR_TYPE_KEYS[16]).toBe('lab_grate');
        expect(FLOOR_TYPE_KEYS[17]).toBe('lab_tile');
        expect(FLOOR_TYPE_KEYS[18]).toBe('lab_hazard');
    });
});
