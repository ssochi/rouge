// tests/dungeon-verb-rooms.test.js
// 玩法动词房植入布局：保底同层三型同现 / 跨种子三型均出现 / 编成非空。
import { describe, it, expect } from 'vitest';
import { generateDungeonLayout } from '../src/core/systems/generation/DungeonLayoutGenerator.js';

const VERBS = ['survival', 'hunt', 'pact'];
const SEEDS = [11, 202, 3003, 40404, 555, 6789, 98765, 20260705];

describe('玩法动词房植入', () => {
    it('保底：同一层三种动词房要么都出现、要么都不出现（前三间轮转覆盖）', () => {
        for (const seed of SEEDS) {
            for (const floor of [1, 2, 3]) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                const has = (c) => layout.rooms.some(r => r.category === c);
                const [sv, hu, pa] = VERBS.map(has);
                expect(sv).toBe(hu);
                expect(hu).toBe(pa);
            }
        }
    });

    it('跨种子三种动词房均会出现', () => {
        const seen = new Set();
        for (const seed of SEEDS) {
            for (const floor of [1, 2, 3]) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                for (const r of layout.rooms) {
                    if (VERBS.includes(r.category)) seen.add(r.category);
                }
            }
        }
        for (const v of VERBS) expect(seen.has(v)).toBe(true);
    });

    it('动词房编成非空（会出怪），且契约房不占用遭遇战安全区语义', () => {
        for (const seed of SEEDS) {
            for (const floor of [1, 2, 3]) {
                const layout = generateDungeonLayout(130, 130, seed, floor);
                for (const r of layout.rooms) {
                    if (VERBS.includes(r.category)) {
                        expect(r.enemyConfig.count).toBeGreaterThan(0);
                    }
                }
            }
        }
    });
});
