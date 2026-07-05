// tests/dungeon-topology.test.js
// [room-v2:p3] 连接算法 V2 不变量：图优先拓扑 + 宏观网格嵌入 + 开门纪律。
// 抽象拓扑层（planFloorTopology）与整层布局（generateDungeonLayout）双维度多种子回归。
import { describe, it, expect } from 'vitest';
import {
    planFloorTopology,
    topologyConfigForFloor
} from '../src/core/systems/generation/rooms/FloorTopology.js';
import { generateDungeonLayout } from '../src/core/systems/generation/DungeonLayoutGenerator.js';

// 与生成器同款种子 rng（mulberry 变体）。
function makeRng(seed) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 生成器对 130×130 地图切出的网格（computeGridSpec：cell 24×20，avail 102 → 4×5）。
const GRID_COLS = 4;
const GRID_ROWS = 5;
const SEEDS = [
    11, 202, 3003, 40404, 555, 6789, 98765, 20260705,
    1, 2, 7, 42, 99, 123, 777, 8080,
    31337, 424242, 5150, 90210, 1024, 65536, 271828, 314159
];
const FLOORS = [1, 2, 3];
const VERBS = ['survival', 'hunt', 'pact'];

// 稳健取一个可嵌入的拓扑（少数种子的自避行走可能死角失败，与生成器换种子重试同理）。
function topoFor(seed, floor) {
    for (let a = 0; a < 8; a++) {
        const rng = makeRng((seed + a * 0x9E3779B9) | 0);
        const topo = planFloorTopology(rng, floor, GRID_COLS, GRID_ROWS);
        if (topo) return topo;
    }
    return null;
}

const cellKey = (c) => `${c.col},${c.row}`;
const adjacent = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;

describe('[room-v2:p3] 抽象拓扑不变量', () => {
    it('角色数：每层恰好 1 start / 1 boss / 1 前厅 / 1 宝藏 / 1 商店 / 1 精英', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                expect(topo, `seed ${seed} F${floor} 可嵌入`).not.toBeNull();
                const roleCount = (r) => topo.nodes.filter(n => n.role === r).length;
                expect(roleCount('start')).toBe(1);
                expect(roleCount('boss')).toBe(1);
                expect(roleCount('antechamber')).toBe(1);
                expect(roleCount('treasure')).toBe(1);
                expect(roleCount('shop')).toBe(1);
                expect(roleCount('elite')).toBe(1);
            }
        }
    });

    it('主干长度在楼层配置区间；start=spineIndex0、Boss 为最深', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                const cfg = topologyConfigForFloor(floor);
                const combat = topo.nodes.filter(n => n.role === 'combat');
                expect(combat.length).toBeGreaterThanOrEqual(cfg.spineCombat[0]);
                expect(combat.length).toBeLessThanOrEqual(cfg.spineCombat[1]);
                const start = topo.nodes[topo.startId];
                const boss = topo.nodes[topo.bossId];
                expect(start.spineIndex).toBe(0);
                // Boss = 主干末端（spineIndex 最大）
                const maxSpine = Math.max(...topo.spine.map(id => topo.nodes[id].spineIndex));
                expect(boss.spineIndex).toBe(maxSpine);
            }
        }
    });

    it('三动词房每层各 ≥1，且均落在主干战斗节点上（非前厅）', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                for (const v of VERBS) {
                    const nodes = topo.nodes.filter(n => n.category === v);
                    expect(nodes.length, `seed ${seed} F${floor} ${v}`).toBeGreaterThanOrEqual(1);
                    for (const n of nodes) {
                        expect(n.role).toBe('combat');
                        expect(n.isAntechamber).toBeFalsy();
                    }
                }
            }
        }
    });

    it('宝藏深度带 < 商店深度带（~40% vs ~60%）', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                const treasure = topo.nodes.find(n => n.role === 'treasure');
                const shop = topo.nodes.find(n => n.role === 'shop');
                const tDepth = topo.nodes[treasure.branchOf].spineIndex;
                const sDepth = topo.nodes[shop.branchOf].spineIndex;
                expect(tDepth).toBeLessThan(sDepth);
            }
        }
    });

    it('至多 1 条环边；环两端均为主干战斗节点（不穿 Boss 前厅/Boss/起点）', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                const loops = topo.edges.filter(e => e.kind === 'loop');
                expect(loops.length).toBeLessThanOrEqual(1);
                for (const e of loops) {
                    for (const id of [e.a, e.b]) {
                        expect(topo.nodes[id].role).toBe('combat');
                        expect(topo.nodes[id].isAntechamber).toBeFalsy();
                    }
                    // 环是真正的捷径：两端 spineIndex 间隔 ≥ 配置下限
                    const gap = Math.abs(topo.nodes[e.a].spineIndex - topo.nodes[e.b].spineIndex);
                    expect(gap).toBeGreaterThanOrEqual(topologyConfigForFloor(floor).loopMinGap);
                }
            }
        }
    });

    it('嵌入合法：cell 互不重叠、每条边连相邻格、全图连通', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const topo = topoFor(seed, floor);
                // 无重叠
                const cells = new Set();
                for (const n of topo.nodes) {
                    expect(n.cell).toBeTruthy();
                    const k = cellKey(n.cell);
                    expect(cells.has(k), `cell 重叠 ${k}`).toBe(false);
                    cells.add(k);
                }
                // 每边相邻
                for (const e of topo.edges) {
                    expect(adjacent(topo.nodes[e.a].cell, topo.nodes[e.b].cell),
                        `边 ${e.a}-${e.b}(${e.kind}) 非相邻格`).toBe(true);
                }
                // 连通（BFS from start）
                const adj = new Map(topo.nodes.map(n => [n.id, []]));
                for (const e of topo.edges) { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); }
                const seen = new Set([topo.startId]);
                const q = [topo.startId];
                while (q.length) {
                    const cur = q.shift();
                    for (const nb of adj.get(cur)) if (!seen.has(nb)) { seen.add(nb); q.push(nb); }
                }
                expect(seen.size).toBe(topo.nodes.length);
            }
        }
    });
});

// ───────── 整层布局：门位纪律 / 走廊短直不交叉 / 连通 ─────────

function roomTileMembership(rooms) {
    // 返回 (x,y) → roomId 的判定函数
    return (x, y) => {
        for (const r of rooms) {
            if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.id;
        }
        return null;
    };
}

describe('[room-v2:p3] 整层布局门位/走廊纪律', () => {
    it('走廊为轴对齐短直矩形、互不交叉、且不穿任何房间', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                const inRoom = roomTileMembership(layout.rooms);
                const allTiles = new Set();

                for (const c of layout.corridors) {
                    const xs = c.tiles.map(t => t.x);
                    const ys = c.tiles.map(t => t.y);
                    const minX = Math.min(...xs), maxX = Math.max(...xs);
                    const minY = Math.min(...ys), maxY = Math.max(...ys);
                    const rectW = maxX - minX + 1;
                    const rectH = maxY - minY + 1;
                    // 填满的实心矩形（无 L 拐弯）
                    expect(c.tiles.length, `corridor ${c.id} 实心矩形`).toBe(rectW * rectH);
                    // 短直：短边 ≤ 门宽 3
                    expect(Math.min(rectW, rectH)).toBeLessThanOrEqual(3);
                    // 不穿房间 + 走廊间不交叉
                    for (const t of c.tiles) {
                        expect(inRoom(t.x, t.y), `走廊 tile 落进房间 ${t.x},${t.y}`).toBeNull();
                        const k = `${t.x},${t.y}`;
                        expect(allTiles.has(k), `走廊交叉于 ${k}`).toBe(false);
                        allTiles.add(k);
                    }
                }
            }
        }
    });

    it('每条走廊贴着其两端房间（门开在共享边），门 tile 是可通行地板', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                const roomById = new Map(layout.rooms.map(r => [r.id, r]));
                const touches = (tiles, room) => tiles.some(t =>
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
                        const x = t.x + dx, y = t.y + dy;
                        return x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h;
                    }));
                for (const c of layout.corridors) {
                    const [ra, rb] = c.connectsRooms.map(id => roomById.get(id));
                    expect(touches(c.tiles, ra), `${c.id} 未贴 ${ra.id}`).toBe(true);
                    expect(touches(c.tiles, rb), `${c.id} 未贴 ${rb.id}`).toBe(true);
                }
                // 门 tile（gates）恒为可通行地板
                for (const g of layout.gates) {
                    for (const t of g.tiles) {
                        expect(layout.floorTiles.has(`${t.x},${t.y}`)).toBe(true);
                        expect(layout.wallTiles.has(`${t.x},${t.y}`)).toBe(false);
                    }
                }
            }
        }
    });

    it('全图连通：房间图 BFS 覆盖所有房间', () => {
        for (const seed of SEEDS) {
            for (const floor of FLOORS) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                const adj = new Map(layout.rooms.map(r => [r.id, []]));
                for (const c of layout.corridors) {
                    const [a, b] = c.connectsRooms;
                    adj.get(a).push(b); adj.get(b).push(a);
                }
                const seen = new Set([layout.startRoomId]);
                const q = [layout.startRoomId];
                while (q.length) {
                    const cur = q.shift();
                    for (const nb of adj.get(cur)) if (!seen.has(nb)) { seen.add(nb); q.push(nb); }
                }
                expect(seen.size).toBe(layout.rooms.length);
            }
        }
    });

    it('?layout=v1 回退旧算法仍产出健全布局（对照路径不腐烂）', () => {
        for (const floor of FLOORS) {
            const layout = generateDungeonLayout(130, 130, 20260705, floor, { algorithm: 'v1' });
            expect(layout.rooms.length).toBeGreaterThanOrEqual(8);
            expect(layout.rooms.filter(r => r.type === 'start').length).toBe(1);
            expect(layout.rooms.filter(r => r.type === 'boss').length).toBe(1);
            expect(layout.gates.length).toBeGreaterThan(0);
        }
    });
});
