// tests/dungeon-shop.test.js
import { describe, it, expect } from 'vitest';
import { generateShopInventory } from '../src/core/dungeon/DungeonShop.js';
import { SHOP } from '../src/core/dungeon/EconomyConfig.js';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';
import { RELIC_IDS } from '../src/assets/relics/RelicData.js';

describe('DungeonShop', () => {
    it('商品结构：1 武器 + 2 遗物 + 钥匙 + medkit', () => {
        const items = generateShopInventory(1, [], () => 0.5);
        const kinds = items.map(i => i.kind);
        expect(kinds.filter(k => k === 'weapon').length).toBe(1);
        expect(kinds.filter(k => k === 'relic').length).toBe(2);
        expect(kinds).toContain('key');
        expect(kinds).toContain('medkit');
        const weapon = items.find(i => i.kind === 'weapon');
        expect(WEAPONS[weapon.payloadId]).toBeDefined();
        const relics = items.filter(i => i.kind === 'relic');
        expect(relics[0].payloadId).not.toBe(relics[1].payloadId);
    });

    it('武器价格与稀有度对应，F2 价格上浮', () => {
        const f1 = generateShopInventory(1, [], () => 0.5);
        const f2 = generateShopInventory(2, [], () => 0.5);
        const w1 = f1.find(i => i.kind === 'weapon');
        const rarity = WEAPONS[w1.payloadId].rarity;
        expect(w1.price).toBe(SHOP.weaponPriceByRarity[rarity]);
        const k1 = f1.find(i => i.kind === 'key');
        const k2 = f2.find(i => i.kind === 'key');
        expect(k2.price).toBe(Math.round(k1.price * SHOP.floorPriceMult[2]));
    });

    it('遗物排除已持有；全持有时无遗物商品', () => {
        const items = generateShopInventory(1, RELIC_IDS, () => 0.5);
        expect(items.filter(i => i.kind === 'relic').length).toBe(0);
        const someOwned = RELIC_IDS.slice(0, RELIC_IDS.length - 1);
        const items2 = generateShopInventory(1, someOwned, () => 0.5);
        const relics2 = items2.filter(i => i.kind === 'relic');
        expect(relics2.length).toBe(1);
        expect(someOwned).not.toContain(relics2[0].payloadId);
    });
});
