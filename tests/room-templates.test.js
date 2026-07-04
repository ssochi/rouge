// tests/room-templates.test.js
// 房间内部模板健全性：数量、墙不越界、不封死任何地板区域。
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../src/core/systems/generation/RoomInteriorTemplates.js';

function mulberry32(seed) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 房间边缘 2 tile 通带永远无墙；从角落 BFS，所有非墙 tile 必须连通。 */
function assertNoSealedArea(room, walls) {
    const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
    const total = room.w * room.h - wallSet.size;

    const visited = new Set();
    const queue = [[room.x, room.y]];
    visited.add(`${room.x},${room.y}`);
    while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < room.x || nx >= room.x + room.w) continue;
            if (ny < room.y || ny >= room.y + room.h) continue;
            const key = `${nx},${ny}`;
            if (visited.has(key) || wallSet.has(key)) continue;
            visited.add(key);
            queue.push([nx, ny]);
        }
    }
    return { reachable: visited.size, total };
}

describe('RoomInteriorTemplates', () => {
    it('模板池 ≥24 且特殊房类别均有专属模板', () => {
        expect(TEMPLATES.length).toBeGreaterThanOrEqual(24);
        for (const cat of ['treasure', 'shop', 'elite', 'boss_arena']) {
            const pool = TEMPLATES.filter(t => t.allowedCategories.includes(cat));
            expect(pool.length, `category ${cat}`).toBeGreaterThanOrEqual(1);
        }
        // 战斗类别模板充足
        for (const cat of ['combat_open', 'combat_cover', 'combat_maze', 'challenge_trapline']) {
            const pool = TEMPLATES.filter(t => t.allowedCategories.includes(cat));
            expect(pool.length, `category ${cat}`).toBeGreaterThanOrEqual(3);
        }
    });

    // 每个模板在最小尺寸与更大尺寸下：墙在 interior 内、边缘 2 tile 通带无墙、无封死区域
    for (const template of TEMPLATES) {
        it(`模板 ${template.id}：墙不越界、边缘通带干净、无封死区域`, () => {
            const sizes = [
                [template.minInteriorW + 4, template.minInteriorH + 4],
                [template.minInteriorW + 7, template.minInteriorH + 6]
            ];

            for (const [w, h] of sizes) {
                for (const seed of [1, 42, 20260705]) {
                    const room = {
                        x: 20,
                        y: 20,
                        w,
                        h,
                        type: template.allowedTypes[0],
                        category: template.allowedCategories[0],
                        id: 'test_room'
                    };
                    const { walls, coverSpots } = template.generate(room, mulberry32(seed));

                    for (const wall of walls) {
                        expect(wall.x, `${template.id} ${w}x${h} wall.x`).toBeGreaterThanOrEqual(room.x + 2);
                        expect(wall.x).toBeLessThanOrEqual(room.x + room.w - 3);
                        expect(wall.y, `${template.id} ${w}x${h} wall.y`).toBeGreaterThanOrEqual(room.y + 2);
                        expect(wall.y).toBeLessThanOrEqual(room.y + room.h - 3);
                    }

                    const { reachable, total } = assertNoSealedArea(room, walls);
                    expect(reachable, `${template.id} ${w}x${h} seed ${seed} sealed area`).toBe(total);

                    if (coverSpots) {
                        for (const s of coverSpots) {
                            expect(walls.some(wl => wl.x === s.x && wl.y === s.y), `${template.id} coverSpot on wall`).toBe(false);
                        }
                    }
                }
            }
        });
    }
});
