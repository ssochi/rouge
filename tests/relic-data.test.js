// tests/relic-data.test.js
import { describe, it, expect } from 'vitest';
import { RELICS, RELIC_IDS, RELIC_CATEGORIES, RELIC_RARITIES } from '../src/assets/relics/RelicData.js';
import { RELIC_ICON_IDS } from '../src/assets/relics/RelicIcons.js';

// P7 新增遗物（8 个），逐一断言字段完备 / rarity 合法 / 图标齐全。
const NEW_RELIC_IDS = [
    'golden_fleece', 'swift_quiver', 'giant_belt', 'abyss_eye',
    'vampiric_crown', 'thorn_mail', 'chrono_watch', 'bone_charm',
];

describe('RelicData', () => {
    it('共 26 个遗物且 id 唯一', () => {
        expect(RELIC_IDS.length).toBe(26);
        expect(new Set(RELIC_IDS).size).toBe(26);
    });

    it('每个遗物 schema 完整（id/name/category/desc）且分类合法', () => {
        for (const id of RELIC_IDS) {
            const r = RELICS[id];
            expect(r.id).toBe(id);
            expect(typeof r.name).toBe('string');
            expect(r.name.length).toBeGreaterThan(0);
            expect(typeof r.desc).toBe('string');
            expect(RELIC_CATEGORIES).toContain(r.category);
        }
    });

    it('分类数量：属性 8 / 弹道 9 / 触发 9', () => {
        const count = { stat: 0, ballistic: 0, trigger: 0 };
        for (const id of RELIC_IDS) count[RELICS[id].category]++;
        expect(count.stat).toBe(8);
        expect(count.ballistic).toBe(9);
        expect(count.trigger).toBe(9);
    });

    it('新增 8 遗物均存在、字段完备且 effect 非空', () => {
        for (const id of NEW_RELIC_IDS) {
            const r = RELICS[id];
            expect(r).toBeTruthy();
            expect(r.id).toBe(id);
            expect(r.name.length).toBeGreaterThan(0);
            expect(r.desc.length).toBeGreaterThan(0);
            expect(RELIC_CATEGORIES).toContain(r.category);
            expect(r.effect && typeof r.effect === 'object').toBe(true);
            expect(Object.keys(r.effect).length).toBeGreaterThan(0);
        }
    });

    it('新增 8 遗物 rarity 合法且平衡为 uncommon 3 / rare 3 / epic 2', () => {
        const rarityCount = {};
        for (const id of NEW_RELIC_IDS) {
            const r = RELICS[id];
            expect(RELIC_RARITIES).toContain(r.rarity);
            rarityCount[r.rarity] = (rarityCount[r.rarity] || 0) + 1;
        }
        expect(rarityCount.uncommon).toBe(3);
        expect(rarityCount.rare).toBe(3);
        expect(rarityCount.epic).toBe(2);
    });

    it('图标齐全：每个遗物都有对应绘制函数', () => {
        expect(RELIC_ICON_IDS.length).toBe(RELIC_IDS.length);
        for (const id of RELIC_IDS) {
            expect(RELIC_ICON_IDS).toContain(id);
        }
    });
});
