// tests/room-builder.test.js
// 房间系统 V2 · P2 RoomBuilder 代码构建器 + 5 示范房 + 选池接入。
// 覆盖：各工具（形状/地板/物件/出怪/坑）单测、对称工具、归一化坐标、
//       wave 口径、校验报错、5 示范房 validateRoomPlan 全过、同 id 双种子差异、
//       入池可被 selectEncounter 选中、逐格地板 floorCells 落地（字符模板零回归）。
import { describe, it, expect } from 'vitest';
import { defineRoom, RoomBuilder } from '../src/core/systems/generation/rooms/RoomBuilder.js';
import {
    validateRoomPlan,
    OBJECT_PROP, OBJECT_COVER, OBJECT_DECOR,
    WAVE_FIRST, WAVE_SECOND
} from '../src/core/systems/generation/rooms/RoomPlan.js';
import { FLOOR_TYPES } from '../src/utils/FloorTypes.js';
import { V2_SHOWCASE_ROOMS } from '../src/core/systems/generation/encounters/v2_showcase.js';
import {
    selectEncounter, selectEncounterById, placeEncounter,
    SELECTABLE_TEMPLATES, ENCOUNTER_TEMPLATES
} from '../src/core/systems/generation/EncounterTemplates.js';

// 确定性种子 rng（测试用）
function rngFrom(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const mk = (w, h, seed = 1) => new RoomBuilder(w, h, rngFrom(seed), { id: 'unit' });
const at = (R, x, y) => R.mask[y * R.w + x];
const floorAt = (R, x, y) => R.floorLayer[y * R.w + x];

describe('RoomBuilder · 形状层 R.shape', () => {
    it('rect() 无参 = 全矩形；有参 = 只保留该矩形', () => {
        const R = mk(5, 5);
        expect([...R.mask].every(v => v === 1)).toBe(true);
        R.shape.rect(1, 1, 3, 3);
        expect(at(R, 0, 0)).toBe(0);
        expect(at(R, 2, 2)).toBe(1);
        expect(at(R, 4, 4)).toBe(0);
    });

    it('ellipse() 内切椭圆：四角挖除、中心保留', () => {
        const R = mk(9, 9);
        R.shape.ellipse();
        expect(at(R, 0, 0)).toBe(0);   // 角
        expect(at(R, 4, 4)).toBe(1);   // 中心
        expect(at(R, 4, 0)).toBe(1);   // 边中点
    });

    it('carve 挖矩形、carveEllipse 挖椭圆（置 0）', () => {
        const R = mk(7, 7);
        R.shape.carve(3, 3, 1, 1);
        expect(at(R, 3, 3)).toBe(0);
        const R2 = mk(7, 7);
        R2.shape.carveEllipse(0.5, 0.5, 2, 2);
        expect(at(R2, 3, 3)).toBe(0);   // 中心被挖
        expect(at(R2, 0, 3)).toBe(1);   // 边缘保留
    });

    it('union 并入另一形状（置 1）', () => {
        const R = mk(7, 5);
        R.shape.rect(0, 0, 2, 5);               // 左条
        R.shape.union((s) => s.rect(5, 0, 2, 5)); // 并入右条
        expect(at(R, 0, 2)).toBe(1);
        expect(at(R, 6, 2)).toBe(1);
        expect(at(R, 3, 2)).toBe(0);            // 中间仍空
    });
});

describe('RoomBuilder · 地板层 R.floor（逐格像素画）', () => {
    it('fill 整房、checker 棋盘拼花', () => {
        const R = mk(4, 4);
        R.floor.fill('STONE');
        expect([...R.floorLayer].every(v => v === FLOOR_TYPES.STONE)).toBe(true);
        const R2 = mk(4, 4);
        R2.floor.checker('PRISON_CELLBLOCK', 'PRISON_WET');
        expect(floorAt(R2, 0, 0)).toBe(FLOOR_TYPES.PRISON_CELLBLOCK); // (0+0)%2==0 → a
        expect(floorAt(R2, 1, 0)).toBe(FLOOR_TYPES.PRISON_WET);       // 奇 → b
    });

    it('border 沿轮廓镶边 thickness 圈', () => {
        const R = mk(7, 7);
        R.floor.border('STONE', 1);
        // 7x7 外圈 24 格上色，内 5x5 为 0
        const painted = [...R.floorLayer].filter(v => v !== 0).length;
        expect(painted).toBe(7 * 7 - 5 * 5);
        expect(floorAt(R, 0, 0)).toBe(FLOOR_TYPES.STONE);
        expect(floorAt(R, 3, 3)).toBe(0);
    });

    it('scatter count 区间产确定数量、rect 区域上色', () => {
        const R = mk(6, 6);
        R.floor.scatter('PRISON_BLOOD', { count: [4, 4] });
        expect([...R.floorLayer].filter(v => v === FLOOR_TYPES.PRISON_BLOOD).length).toBe(4);
        const R2 = mk(6, 6);
        R2.floor.rect('LAB_TILE', 1, 1, 2, 2);
        expect([...R2.floorLayer].filter(v => v === FLOOR_TYPES.LAB_TILE).length).toBe(4);
    });

    it('未知地板类型抛清晰错误', () => {
        expect(() => mk(4, 4).floor.fill('NOT_A_FLOOR')).toThrow(/未知地板类型/);
    });

    it('地板层只作用于 mask 内 tile（挖除处保持 0）', () => {
        const R = mk(7, 7);
        R.shape.ellipse();
        R.floor.fill('STONE');
        expect(floorAt(R, 0, 0)).toBe(0);           // 角被挖 → 不上色
        expect(floorAt(R, 3, 3)).toBe(FLOOR_TYPES.STONE);
    });
});

describe('RoomBuilder · 物件层 R.objects', () => {
    it('place 产 prop(type)、cover/decor 产抽象件', () => {
        const R = mk(5, 5);
        R.objects.place('dungeon_pillar', 1, 1);
        R.objects.cover(2, 2);
        R.objects.decor(3, 3);
        const [p, c, d] = R._objects;
        expect(p).toEqual({ x: 1, y: 1, kind: OBJECT_PROP, type: 'dungeon_pillar' });
        expect(c).toEqual({ x: 2, y: 2, kind: OBJECT_COVER });
        expect(d).toEqual({ x: 3, y: 3, kind: OBJECT_DECOR });
    });

    it('row 直线排布 count 个（含端点）', () => {
        const R = mk(7, 3);
        R.objects.row('box', { from: [0, 1], to: [6, 1], count: 3 });
        expect(R._objects.map(o => `${o.x},${o.y}`)).toEqual(['0,1', '3,1', '6,1']);
    });

    it('ring 环阵 + skip 留缺口', () => {
        const R = mk(11, 11);
        R.objects.ring('box', { radius: 0.7, count: 4, skip: [0] });
        expect(R._objects.length).toBe(3); // 4 个留 1 缺口
        expect(R._objects.every(o => o.kind === OBJECT_PROP && o.type === 'box')).toBe(true);
    });

    it('scatter 只落 mask 内、不与已占用重叠', () => {
        const R = mk(6, 6);
        R.objects.place('box', 0, 0);
        R.objects.scatter('box', { count: [5, 5] });
        const keys = new Set(R._objects.map(o => `${o.x},${o.y}`));
        expect(keys.size).toBe(R._objects.length); // 无重叠
        expect(R._objects.length).toBe(6);          // 1 + 5
    });
});

describe('RoomBuilder · 出怪层 R.spawns（波次 1|2 口径）', () => {
    it('wave(1)/wave(2) 写入正确波次；at/ring 落点', () => {
        const R = mk(11, 11);
        R.spawns.wave(1).at('r', 0.5, 0.5);
        R.spawns.wave(2).ring('m', { radius: 0.5, count: 4 });
        expect(R._spawns.filter(s => s.wave === WAVE_FIRST).length).toBe(1);
        expect(R._spawns.filter(s => s.wave === WAVE_SECOND).length).toBe(4);
        expect(R._spawns.every(s => s.wave === 1 || s.wave === 2)).toBe(true);
    });

    it('cluster near=edges/center 成团、count 区间', () => {
        const R = mk(11, 11);
        R.spawns.wave(1).cluster('m', { count: [3, 3], near: 'edges' });
        expect(R._spawns.length).toBe(3);
    });

    it('wave() 只接受 1|2，其余抛错', () => {
        expect(() => mk(5, 5).spawns.wave(0)).toThrow(/只接受 1 或 2/);
        expect(() => mk(5, 5).spawns.wave(3)).toThrow(/只接受 1 或 2/);
    });
});

describe('RoomBuilder · 危险层 R.pits', () => {
    it('rect 铺坑、ring 环坑', () => {
        const R = mk(9, 9);
        R.pits.rect(3, 3, 2, 2);
        expect(R._pits.length).toBe(4);
        const R2 = mk(11, 11);
        R2.pits.ring({ radius: 0.6, count: 6 });
        expect(R2._pits.length).toBeGreaterThan(0);
    });
});

describe('RoomBuilder · 归一化 vs 绝对坐标', () => {
    it('小数=归一化（相对尺寸），整数=绝对 tile', () => {
        const R = mk(11, 11);
        R.objects.place('box', 0.5, 0.5); // 归一化中心 → round(0.5*10)=5
        R.objects.place('box', 3, 4);     // 绝对
        expect(R._objects[0]).toMatchObject({ x: 5, y: 5 });
        expect(R._objects[1]).toMatchObject({ x: 3, y: 4 });
    });
});

describe('RoomBuilder · 对称工具', () => {
    it('mirrorX 沿垂直中轴镜像物件', () => {
        const R = mk(7, 5);
        R.objects.place('box', 1, 2);
        R.mirrorX();
        const keys = R._objects.map(o => `${o.x},${o.y}`).sort();
        expect(keys).toEqual(['1,2', '5,2']); // x=1 ↔ x=5（w-1-1）
    });

    it('mirrorY 沿水平中轴镜像', () => {
        const R = mk(5, 7);
        R.objects.place('box', 2, 1);
        R.mirrorY();
        expect(R._objects.map(o => `${o.x},${o.y}`).sort()).toEqual(['2,1', '2,5']);
    });

    it('rot4 四向旋转复制（方形）', () => {
        const R = mk(7, 7);
        R.objects.place('box', 1, 1);
        R.rot4();
        expect(R._objects.map(o => `${o.x},${o.y}`).sort())
            .toEqual(['1,1', '1,5', '5,1', '5,5'].sort());
    });

    it('rot4 非方形栅格抛错', () => {
        expect(() => mk(7, 5).rot4()).toThrow(/方形栅格/);
    });
});

describe('defineRoom · 定义期校验（fail-fast）', () => {
    it('物件压在挖除处 → 定义即抛错', () => {
        expect(() => defineRoom('bad_prop', { tier: 'mid', w: 7, h: 7 }, (R) => {
            R.shape.ellipse();
            R.objects.place('box', 0, 0); // 角被挖 → 压墙
        })).toThrow(/定义校验失败/);
    });

    it('尺寸缺失 → 抛错', () => {
        expect(() => defineRoom('nosize', { tier: 'mid' }, () => {})).toThrow(/正整数尺寸/);
    });

    it('合法房返回 descriptor（__code + build）', () => {
        const d = defineRoom('ok_room', { tier: 'mid', floors: [1], w: 9, h: 9 }, (R) => {
            R.shape.rect();
            R.spawns.wave(1).at('m', 0.5, 0.5);
        });
        expect(d.__code).toBe(true);
        expect(d.w).toBe(9);
        expect(typeof d.build).toBe('function');
        expect(validateRoomPlan(d.build(rngFrom(1))).ok).toBe(true);
    });
});

describe('5 示范房 · validateRoomPlan 全过 + 元数据合理', () => {
    it('全部示范房多种子下自洽', () => {
        for (const room of V2_SHOWCASE_ROOMS) {
            for (const seed of [1, 7, 42, 100, 2026]) {
                const plan = room.build(rngFrom(seed));
                const { ok, errors } = validateRoomPlan(plan);
                expect(ok, `${room.id}@${seed}: ${errors.join('; ')}`).toBe(true);
                // 产物尺寸与声明一致（选池尺寸过滤依赖）
                expect(plan.w).toBe(room.w);
                expect(plan.h).toBe(room.h);
                // 波次口径 1|2
                expect(plan.spawns.every(s => s.wave === 1 || s.wave === 2)).toBe(true);
            }
        }
    });

    it('tier/floors 分布覆盖三层', () => {
        const floorsSeen = new Set();
        for (const r of V2_SHOWCASE_ROOMS) {
            expect(['shallow', 'mid', 'deep']).toContain(r.tier);
            (r.floors || []).forEach(f => floorsSeen.add(f));
        }
        expect([...floorsSeen].sort()).toEqual([1, 2, 3]); // F1/F2/F3 均有示范
    });

    it('圆厅/同心环用挖除产非矩形形状（mask 有 0）', () => {
        const round = V2_SHOWCASE_ROOMS.find(r => r.id === 'v2_circular_hall').build(rngFrom(1));
        const ring = V2_SHOWCASE_ROOMS.find(r => r.id === 'v2_concentric_ring').build(rngFrom(1));
        expect([...round.mask].some(v => v === 0)).toBe(true);
        expect([...ring.mask].some(v => v === 0)).toBe(true);
    });

    it('渐变污渍大厅逐格地板层非空（地板即像素画）', () => {
        const stain = V2_SHOWCASE_ROOMS.find(r => r.id === 'v2_stain_hall').build(rngFrom(1));
        const ids = new Set([...stain.floor].filter(v => v !== 0));
        // 棋盘两色 + 血渍 ≥3 种地板 id
        expect(ids.size).toBeGreaterThanOrEqual(3);
        expect(ids.has(FLOOR_TYPES.PRISON_BLOOD)).toBe(true);
    });
});

describe('种子变体 · 同 id 不同种子产生可见差异', () => {
    const serialize = (p) => JSON.stringify([p.objects, p.spawns, [...p.floor], [...p.mask]]);
    for (const room of V2_SHOWCASE_ROOMS) {
        it(`${room.id}：多种子产物存在差异`, () => {
            const variants = new Set();
            for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
                variants.add(serialize(room.build(rngFrom(seed))));
            }
            expect(variants.size, `${room.id} 所有种子产物相同（变体未生效）`).toBeGreaterThan(1);
        });
    }
});

describe('入池 · 代码模板与字符模板同池被 selectEncounter 选中', () => {
    it('选池 = 字符池 + 5 代码房；字符池仍纯 rows（黄金测试口径不变）', () => {
        expect(ENCOUNTER_TEMPLATES.every(t => Array.isArray(t.rows) && !t.__code)).toBe(true);
        const codeIds = SELECTABLE_TEMPLATES.filter(t => t.__code).map(t => t.id).sort();
        expect(codeIds).toEqual(V2_SHOWCASE_ROOMS.map(r => r.id).sort());
        expect(SELECTABLE_TEMPLATES.length).toBe(ENCOUNTER_TEMPLATES.length + V2_SHOWCASE_ROOMS.length);
    });

    it('selectEncounterById 物化每个示范房为合法 RoomPlan', () => {
        for (const room of V2_SHOWCASE_ROOMS) {
            const plan = selectEncounterById(room.id, rngFrom(9));
            expect(plan, room.id).not.toBeNull();
            expect(validateRoomPlan(plan).ok, room.id).toBe(true);
            expect(plan.meta.id).toBe(room.id);
        }
        expect(selectEncounterById('__nope__', rngFrom(1))).toBeNull();
    });

    it('selectEncounter 在匹配楼层/尺寸下会选出示范房', () => {
        // F2 大房：circular_hall / concentric_ring（floors:[2]）应可被选中
        const hits = new Set();
        for (let i = 0; i < 300; i++) {
            const p = selectEncounter('mid', 18, 18, rngFrom(3000 + i), new Set(), 2);
            if (p && p.meta.id.startsWith('v2_')) hits.add(p.meta.id);
        }
        expect(hits.size).toBeGreaterThan(0);
    });

    it('尺寸/降档口径不变：3x3 返回 null、小房返回可放下的模板', () => {
        expect(selectEncounter('deep', 3, 3, () => 0.5)).toBeNull();
        const small = selectEncounter('shallow', 13, 13, () => 0.5);
        expect(small).not.toBeNull();
        expect(small.w).toBeLessThanOrEqual(13);
    });
});

describe('逐格地板落地 · placeEncounter floorCells（字符模板零回归）', () => {
    it('代码房产 floorCells（键名可被 FLOOR_TYPES 反查）', () => {
        const plan = selectEncounterById('v2_stain_hall', rngFrom(5));
        const placed = placeEncounter(plan, { x: 20, y: 20, w: plan.w + 6, h: plan.h + 6 });
        expect(placed.floorCells.length).toBeGreaterThan(0);
        for (const c of placed.floorCells) {
            expect(FLOOR_TYPES[c.floorType]).toBeDefined();
        }
    });

    it('字符模板 floorCells 恒为空（floor 层全 0）', () => {
        const plan = selectEncounterById('open_brawl', rngFrom(1));
        const placed = placeEncounter(plan, { x: 0, y: 0, w: plan.w + 6, h: plan.h + 6 });
        expect(placed.floorCells).toEqual([]);
    });
});
