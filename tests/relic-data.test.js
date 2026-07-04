// tests/relic-data.test.js
import { describe, it, expect } from 'vitest';
import { RELICS, RELIC_IDS, RELIC_CATEGORIES } from '../src/assets/relics/RelicData.js';

describe('RelicData', () => {
    it('共 18 个遗物且 id 唯一', () => {
        expect(RELIC_IDS.length).toBe(18);
        expect(new Set(RELIC_IDS).size).toBe(18);
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

    it('分类数量：属性 6 / 弹道 7 / 触发 5', () => {
        const count = { stat: 0, ballistic: 0, trigger: 0 };
        for (const id of RELIC_IDS) count[RELICS[id].category]++;
        expect(count.stat).toBe(6);
        expect(count.ballistic).toBe(7);
        expect(count.trigger).toBe(5);
    });
});
