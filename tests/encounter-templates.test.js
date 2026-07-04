// tests/encounter-templates.test.js
// 遭遇战模板健全性：数量/行宽/无封死/掩体保底/尺寸选择与放置。
import { describe, it, expect } from 'vitest';
import {
    ENCOUNTER_TEMPLATES,
    parseEncounter,
    selectEncounter,
    placeEncounter,
    tierForDepth
} from '../src/core/systems/generation/EncounterTemplates.js';
import { FLOOR_CONFIGS } from '../src/core/dungeon/FloorConfigs.js';

const KNOWN_ENEMY_TYPES = new Set([
    'zombie', 'zombie_female', 'zombie_brute', 'hunter', 'soldier',
    'warlock', 'boomer', 'summoner', 'shieldbearer', 'sentry', 'lobber'
]);

/** 模板网格 BFS：所有非墙格必须连通（不允许墙封死区域）。 */
function assertConnected(parsed, rows) {
    const wallSet = new Set(parsed.walls.map(w => `${w.x},${w.y}`));
    const totalOpen = parsed.w * parsed.h - wallSet.size;

    let start = null;
    for (let y = 0; y < parsed.h && !start; y++) {
        for (let x = 0; x < parsed.w; x++) {
            if (!wallSet.has(`${x},${y}`)) { start = [x, y]; break; }
        }
    }
    const visited = new Set([`${start[0]},${start[1]}`]);
    const queue = [start];
    while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= parsed.w || ny < 0 || ny >= parsed.h) continue;
            const key = `${nx},${ny}`;
            if (visited.has(key) || wallSet.has(key)) continue;
            visited.add(key);
            queue.push([nx, ny]);
        }
    }
    return { reachable: visited.size, totalOpen };
}

describe('EncounterTemplates', () => {
    it('模板池 ≥15 且各档位充足', () => {
        expect(ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(15);
        for (const tier of ['shallow', 'mid', 'deep']) {
            const pool = ENCOUNTER_TEMPLATES.filter(t => t.tier === tier);
            expect(pool.length, tier).toBeGreaterThanOrEqual(4);
        }
    });

    for (const template of ENCOUNTER_TEMPLATES) {
        it(`模板 ${template.id}：行宽一致/有出怪点/无封死/远程配掩体`, () => {
            const w = template.rows[0].length;
            for (const row of template.rows) {
                expect(row.length, `${template.id} 行宽`).toBe(w);
            }

            const parsed = parseEncounter(template);
            expect(parsed.spawns.length, '出怪点').toBeGreaterThanOrEqual(3);
            expect(parsed.spawns.length, '出怪点上限').toBeLessThanOrEqual(8);

            const { reachable, totalOpen } = assertConnected(parsed, template.rows);
            expect(reachable, `${template.id} 封死区域`).toBe(totalOpen);

            // 掩体保底：含远程/重装威胁的模板必须给玩家 ≥2 个掩体
            const hasRanged = parsed.spawns.some(s => s.role === 'r' || s.role === 'h');
            if (hasRanged) {
                expect(parsed.covers.length, `${template.id} 掩体保底`).toBeGreaterThanOrEqual(2);
            }
        });
    }

    it('selectEncounter：尺寸过滤 + 降档回退 + 放不下返回 null', () => {
        const rng = () => 0.5;
        const big = selectEncounter('deep', 14, 12, rng);
        expect(big).not.toBeNull();
        expect(big.w).toBeLessThanOrEqual(14);
        expect(big.h).toBeLessThanOrEqual(12);

        // 小房间：deep 放不下 → 降档到 shallow
        const small = selectEncounter('deep', 8, 8, rng);
        expect(small).not.toBeNull();
        expect(small.w).toBeLessThanOrEqual(8);

        expect(selectEncounter('deep', 3, 3, rng)).toBeNull();
    });

    it('placeEncounter：居中放置且不越 2 tile 通带', () => {
        const parsed = parseEncounter(ENCOUNTER_TEMPLATES[0]);
        const room = { x: 10, y: 10, w: parsed.w + 6, h: parsed.h + 6 };
        const placed = placeEncounter(parsed, room);
        const all = [...placed.walls, ...placed.covers, ...placed.decors, ...placed.spawns];
        for (const p of all) {
            expect(p.x).toBeGreaterThanOrEqual(room.x + 2);
            expect(p.x).toBeLessThanOrEqual(room.x + room.w - 3);
            expect(p.y).toBeGreaterThanOrEqual(room.y + 2);
            expect(p.y).toBeLessThanOrEqual(room.y + room.h - 3);
        }
    });

    it('tierForDepth 口径与角色映射完备（三层 m/r/h/e 均指向已知敌人）', () => {
        expect(tierForDepth(1)).toBe('shallow');
        expect(tierForDepth(4)).toBe('mid');
        expect(tierForDepth(6)).toBe('deep');

        for (const floor of [1, 2, 3]) {
            const roleMap = FLOOR_CONFIGS[floor].roleMap;
            for (const role of ['m', 'r', 'h', 'e']) {
                expect(roleMap[role].length, `F${floor} ${role}`).toBeGreaterThan(0);
                for (const type of roleMap[role]) {
                    expect(KNOWN_ENEMY_TYPES.has(type), `F${floor} ${role} ${type}`).toBe(true);
                }
            }
        }
    });
});
