// tests/f2-temple-templates.test.js
// F2 教团圣殿层专项：模板齐全/楼层亲和/地板材质合法/新地板注册/叙事物件已注册。
// 通用健全性（行宽/连通/掩体/波次/尺寸）由 encounter-templates.test.js 覆盖全池，含本层模板。
import { describe, it, expect } from 'vitest';
import { F2_TEMPLE_TEMPLATES } from '../src/core/systems/generation/encounters/f2_temple.js';
import { parseEncounter } from '../src/core/systems/generation/EncounterTemplates.js';
import { FLOOR_TYPES, FLOOR_TYPE_KEYS } from '../src/utils/FloorTypes.js';

const F2_FLOOR_TYPES = ['TEMPLE_TILES', 'TEMPLE_CARPET', 'RITUAL_DARK'];

// 本层 legend 允许引用的物件（8 新造 + 复用既有）。ObjectRegistry 实际注册由 npm run build 校验
// （registry 传递依赖 Assets → document，node 测试环境不可导入）。
const ALLOWED_PROPS = new Set([
    'temple_pew', 'temple_pulpit', 'alchemy_cauldron', 'potion_shelf',
    'temple_candelabra', 'broken_organ', 'reliquary_case', 'sacrifice_slab',
    'dungeon_altar', 'dungeon_banner', 'bookshelf', 'dungeon_iron_cage', 'workbench',
    // [depth-batch:rooms] 房间机关
    'spike_trap', 'reward_cage', 'cage_lever', 'decoy_statue'
]);

describe('F2 圣殿层模板', () => {
    it('模板数量达标（≥8）', () => {
        expect(F2_TEMPLE_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    });

    it('每个模板都标记 floors: [2]', () => {
        for (const t of F2_TEMPLE_TEMPLATES) {
            expect(Array.isArray(t.floors), `${t.id} floors 缺失`).toBe(true);
            expect(t.floors, `${t.id} floors`).toEqual([2]);
        }
    });

    it('每个模板都指定合法的 F2 地板材质', () => {
        for (const t of F2_TEMPLE_TEMPLATES) {
            expect(t.floorType, `${t.id} 缺 floorType`).toBeTruthy();
            expect(F2_FLOOR_TYPES, `${t.id} floorType=${t.floorType}`).toContain(t.floorType);
            // floorType 字符串必须能解析到 FLOOR_TYPES 数值键
            expect(FLOOR_TYPES[t.floorType], `${t.id} floorType 未注册`).not.toBeUndefined();
        }
    });

    it('三档位齐备（shallow/mid/deep 均有本层模板）', () => {
        for (const tier of ['shallow', 'mid', 'deep']) {
            const n = F2_TEMPLE_TEMPLATES.filter(t => t.tier === tier).length;
            expect(n, `${tier} 档位`).toBeGreaterThanOrEqual(1);
        }
    });

    it('至少 3 个异形房间（含 # 内墙或 p 坑成块雕刻）', () => {
        let irregular = 0;
        for (const t of F2_TEMPLE_TEMPLATES) {
            const parsed = parseEncounter(t);
            if (parsed.walls.length >= 3 || parsed.pits.length >= 6) irregular++;
        }
        expect(irregular).toBeGreaterThanOrEqual(3);
    });

    it('模板 legend 引用的叙事物件均在允许清单内（防拼写错误）', () => {
        for (const t of F2_TEMPLE_TEMPLATES) {
            const legend = t.legend || {};
            for (const type of Object.values(legend)) {
                expect(ALLOWED_PROPS.has(type), `${t.id} 物件 ${type} 不在清单`).toBe(true);
            }
        }
    });
});

describe('F2 圣殿层专属地板注册（ID 13-15）', () => {
    it('FLOOR_TYPES 枚举含三种 F2 地板且 ID 为 13/14/15', () => {
        expect(FLOOR_TYPES.TEMPLE_TILES).toBe(13);
        expect(FLOOR_TYPES.TEMPLE_CARPET).toBe(14);
        expect(FLOOR_TYPES.RITUAL_DARK).toBe(15);
    });

    it('FLOOR_TYPE_KEYS 索引 13-15 映射到正确键名', () => {
        expect(FLOOR_TYPE_KEYS[13]).toBe('temple_tiles');
        expect(FLOOR_TYPE_KEYS[14]).toBe('temple_carpet');
        expect(FLOOR_TYPE_KEYS[15]).toBe('ritual_dark');
    });
});
