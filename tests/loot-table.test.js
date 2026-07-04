// tests/loot-table.test.js
import { describe, it, expect } from 'vitest';
import { pickRarity, pickWeaponByRarity, weaponsOfRarity, rollChest, pickRelic } from '../src/core/dungeon/LootTable.js';
import { CHEST_TIERS } from '../src/core/dungeon/EconomyConfig.js';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';
import { RELIC_IDS } from '../src/assets/relics/RelicData.js';

describe('LootTable', () => {
  it('pickRarity 按权重分布（种子化验证边界）', () => {
    const w = { common: 50, uncommon: 50, rare: 0, epic: 0, legendary: 0 };
    expect(pickRarity(w, () => 0.0)).toBe('common');
    expect(pickRarity(w, () => 0.99)).toBe('uncommon');
  });
  it('weaponsOfRarity 排除工具武器', () => {
    for (const tier of ['common','uncommon','rare','epic','legendary']) {
      for (const id of weaponsOfRarity(tier)) {
        expect(WEAPONS[id].isUtility).toBeFalsy();
        expect(WEAPONS[id].rarity).toBe(tier);
      }
    }
  });
  it('rollChest 返回合法武器与金币区间（rng=0.99 不触发遗物）', () => {
    for (const tier of Object.keys(CHEST_TIERS)) {
      const r = rollChest(tier, () => 0.99);
      expect(r.kind).toBe('weapon');
      expect(WEAPONS[r.weaponConfigId]).toBeDefined();
      expect(r.coins).toBeGreaterThanOrEqual(CHEST_TIERS[tier].coins[0]);
      expect(r.coins).toBeLessThanOrEqual(CHEST_TIERS[tier].coins[1]);
    }
  });

  it('pickRelic 排除已持有，全持有返回 null', () => {
    const first = pickRelic([], () => 0.0);
    expect(typeof first).toBe('string');
    expect(pickRelic([first], () => 0.0)).not.toBe(first);
    expect(pickRelic(RELIC_IDS, () => 0.5)).toBe(null);
  });

  it('rollChest forceRelic 保底出遗物，全收集回退武器', () => {
    const r = rollChest('mithril', () => 0.99, { forceRelic: true, ownedRelicIds: [] });
    expect(r.kind).toBe('relic');
    expect(typeof r.relicId).toBe('string');
    const fallback = rollChest('mithril', () => 0.99, { forceRelic: true, ownedRelicIds: RELIC_IDS });
    expect(fallback.kind).toBe('weapon');
    expect(fallback.weaponConfigId).toBeTruthy();
  });
});