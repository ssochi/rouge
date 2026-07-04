// tests/dungeon-themes.test.js
import { describe, it, expect } from 'vitest';
import { DUNGEON_THEMES, getDungeonTheme } from '../src/core/dungeon/DungeonThemes.js';
import { FINAL_FLOOR, BOSS_CHEST_TIER, TREASURE_ROOM_CHESTS, SHOP, CHEST_TIERS } from '../src/core/dungeon/EconomyConfig.js';

const WALL_KEYS = ['top', 'topMortar', 'front', 'frontMortar', 'highlight', 'accent', 'crack'];
const FLOOR_KEYS = ['base', 'light', 'dark', 'gap', 'accent'];
const DECAL_KEYS = ['crack', 'web', 'moss', 'blood', 'puddle', 'pages'];

describe('DungeonThemes', () => {
    it('三个楼层主题字段完备', () => {
        for (const floor of [1, 2, 3]) {
            const theme = DUNGEON_THEMES[floor];
            expect(theme, `floor ${floor}`).toBeDefined();
            expect(theme.id).toBe(`f${floor}`);
            for (const k of WALL_KEYS) {
                expect(theme.wall[k], `floor ${floor} wall.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
            }
            for (const k of FLOOR_KEYS) {
                expect(theme.floor[k], `floor ${floor} floor.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
            }
            for (const c of ['r', 'g', 'b']) {
                expect(theme.ambient[c]).toBeGreaterThanOrEqual(0);
                expect(theme.ambient[c]).toBeLessThanOrEqual(255);
            }
            expect(theme.torchColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(theme.brazierColor).toMatch(/^#[0-9a-f]{6}$/i);
            for (const k of DECAL_KEYS) {
                expect(theme.decalWeights[k], `floor ${floor} decal.${k}`).toBeGreaterThanOrEqual(0);
            }
            expect(Object.keys(theme.decorWeights).length).toBeGreaterThan(0);
        }
    });

    it('地牢环境光低于全局默认亮度（突出火光对比）', () => {
        for (const floor of [1, 2, 3]) {
            const { r, g, b } = DUNGEON_THEMES[floor].ambient;
            expect((r + g + b) / 3).toBeLessThan(115);
        }
    });

    it('越界楼层回退 F1', () => {
        expect(getDungeonTheme(99)).toBe(DUNGEON_THEMES[1]);
        expect(getDungeonTheme(undefined)).toBe(DUNGEON_THEMES[1]);
        expect(getDungeonTheme(2)).toBe(DUNGEON_THEMES[2]);
    });
});

describe('EconomyConfig F3 数值', () => {
    it('三层经济表齐备', () => {
        expect(FINAL_FLOOR).toBe(3);
        for (const floor of [1, 2, 3]) {
            expect(CHEST_TIERS[BOSS_CHEST_TIER[floor]], `boss chest floor ${floor}`).toBeDefined();
            const tiers = TREASURE_ROOM_CHESTS[floor];
            expect(tiers.length).toBeGreaterThanOrEqual(1);
            for (const t of tiers) expect(CHEST_TIERS[t]).toBeDefined();
            expect(SHOP.floorPriceMult[floor]).toBeGreaterThanOrEqual(1);
        }
        // 价格与宝箱档次随楼层单调不降
        expect(SHOP.floorPriceMult[3]).toBeGreaterThan(SHOP.floorPriceMult[2]);
    });
});
