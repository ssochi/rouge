// tests/dungeon-layout.test.js
// 地牢生成器纯逻辑健全性（seeded，无 Canvas 依赖）。
import { describe, it, expect } from 'vitest';
import { generateDungeonLayout } from '../src/core/systems/generation/DungeonLayoutGenerator.js';

const SEED = 20260705;

function roomGeometry(layout) {
    return layout.rooms.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, type: r.type, category: r.category }));
}

describe('DungeonLayoutGenerator', () => {
    for (const floor of [1, 2, 3]) {
        it(`F${floor}：房间/特殊房/门/墙地板健全`, () => {
            const layout = generateDungeonLayout(130, 130, SEED, floor);

            expect(layout.floor).toBe(floor);
            // [room-v2:p3] 连接 V2 拓扑房数 = start + 4~5 战斗 + 前厅 + Boss + 宝藏/商店/精英 = 10~11
            // （旧 BSP 的 8~10 是撒房叶子数的实现副产物，已随图优先拓扑改为有意图的房数）。
            expect(layout.rooms.length).toBeGreaterThanOrEqual(9);
            expect(layout.rooms.length).toBeLessThanOrEqual(12);

            const byType = (t) => layout.rooms.filter(r => r.type === t);
            expect(byType('start').length).toBe(1);
            expect(byType('boss').length).toBe(1);

            const byCategory = (c) => layout.rooms.filter(r => r.category === c);
            expect(byCategory('treasure').length).toBe(1);
            expect(byCategory('elite').length).toBe(1);
            expect(byCategory('shop').length).toBe(1);

            // 安全区不刷怪，战斗房有怪
            for (const room of layout.rooms) {
                if (room.type === 'start' || room.category === 'treasure' || room.category === 'shop') {
                    expect(room.enemyConfig.count).toBe(0);
                } else {
                    expect(room.enemyConfig.count).toBeGreaterThan(0);
                }
            }

            expect(layout.gates.length).toBeGreaterThan(0);
            expect(layout.wallTiles.size).toBeGreaterThan(0);
            expect(layout.floorTiles.size).toBeGreaterThan(0);

            // 门 tile 必须是可通行地板
            for (const g of layout.gates) {
                for (const t of g.tiles) {
                    expect(layout.floorTiles.has(`${t.x},${t.y}`)).toBe(true);
                    expect(layout.wallTiles.has(`${t.x},${t.y}`)).toBe(false);
                }
            }
        });
    }

    it('氛围光源：火把挂在南向墙面，Boss 房有火盆', () => {
        const layout = generateDungeonLayout(130, 130, SEED, 1);
        const torches = layout.lightObjects.filter(l => l.type === 'dungeon_torch');
        const braziers = layout.lightObjects.filter(l => l.type === 'dungeon_brazier');

        expect(torches.length).toBeGreaterThan(0);
        for (const t of torches) {
            expect(layout.wallTiles.has(`${t.x},${t.y}`)).toBe(true);
            expect(layout.floorTiles.has(`${t.x},${t.y + 1}`)).toBe(true);
        }

        const boss = layout.rooms.find(r => r.type === 'boss');
        const bossBraziers = braziers.filter(b => b.roomId === boss.id);
        expect(bossBraziers.length).toBeGreaterThanOrEqual(1);
        for (const b of braziers) {
            expect(layout.floorTiles.has(`${b.x},${b.y}`)).toBe(true);
        }
    });

    it('装饰：特殊房固定件到位（Boss 雕像/精英旗帜/宝箱房祭坛）', () => {
        const layout = generateDungeonLayout(130, 130, SEED, 1);
        const decorIn = (room, type) =>
            layout.decorObjects.filter(o => o.roomId === room.id && o.type === type);

        const boss = layout.rooms.find(r => r.type === 'boss');
        expect(decorIn(boss, 'dungeon_statue').length).toBeGreaterThanOrEqual(1);

        const elite = layout.rooms.find(r => r.category === 'elite');
        expect(decorIn(elite, 'dungeon_banner').length).toBeGreaterThanOrEqual(1);

        const treasure = layout.rooms.find(r => r.category === 'treasure');
        expect(decorIn(treasure, 'dungeon_altar').length).toBe(1);

        // 所有装饰均落在地板上且不与内部墙重叠
        for (const o of layout.decorObjects) {
            expect(layout.floorTiles.has(`${o.x},${o.y}`)).toBe(true);
        }
    });

    it('贴花：Boss 房保底圆环，楼层配比生效（F3 无苔藓水洼）', () => {
        const f1 = generateDungeonLayout(130, 130, SEED, 1);
        const boss = f1.rooms.find(r => r.type === 'boss');
        const rings = f1.decals.filter(d => d.kind === 'boss_ring');
        expect(rings.length).toBe(1);
        expect(rings[0].x).toBeCloseTo(boss.x + boss.w / 2);

        const f3 = generateDungeonLayout(130, 130, SEED, 3);
        expect(f3.decals.some(d => d.kind === 'moss')).toBe(false);
        expect(f3.decals.some(d => d.kind === 'puddle')).toBe(false);
    });

    it('Boss 楼层顺序：F1 巨兽 → F2 巨蛇 → F3 魔偶', () => {
        const bossTypes = (floor) => {
            const layout = generateDungeonLayout(130, 130, SEED, floor);
            return layout.rooms.find(r => r.type === 'boss').enemyConfig.types.map(t => t.type);
        };
        expect(bossTypes(1)).toContain('mutant_beast');
        expect(bossTypes(2)).toContain('snake_boss');
        expect(bossTypes(3)).toContain('mecha_golem');
    });

    it('同种子同楼层几何可复现', () => {
        const a = generateDungeonLayout(130, 130, SEED, 2);
        const b = generateDungeonLayout(130, 130, SEED, 2);
        expect(roomGeometry(a)).toEqual(roomGeometry(b));
    });
});
