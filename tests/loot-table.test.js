// tests/loot-table.test.js
import { describe, it, expect } from 'vitest';
import { pickRarity, pickWeaponByRarity, weaponsOfRarity, rollChest, pickRelic, pickPetItem, PET_ITEM_IDS } from '../src/core/dungeon/LootTable.js';
import { CHEST_TIERS } from '../src/core/dungeon/EconomyConfig.js';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';
import { RELIC_IDS } from '../src/assets/relics/RelicData.js';

// 序列化 rng：按数组顺序返回，耗尽后重复最后一个值。便于精确控制 rollChest 内部各次抽取。
function seqRng(values) {
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
}

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

  it('pickPetItem 排除已拥有，全拥有返回 null', () => {
    // 无持有：抽首个（rng=0）
    expect(pickPetItem([], () => 0)).toBe(PET_ITEM_IDS[0]);
    // 已持有首个：从剩余池抽取，不会再抽到它
    const rest = pickPetItem([PET_ITEM_IDS[0]], () => 0);
    expect(rest).not.toBe(PET_ITEM_IDS[0]);
    expect(PET_ITEM_IDS).toContain(rest);
    // 三只全持有：无可抽 → null
    expect(pickPetItem(PET_ITEM_IDS, () => 0.5)).toBe(null);
  });

  it('rollChest 高档箱 petChance 命中产出宠物（优先级低于遗物）', () => {
    // 调用序列：coins → relicGate(0.99 不触发) → petGate(0.0 触发) → petPick(0.0 取首个)
    const r = rollChest('dragon', seqRng([0, 0.99, 0.0, 0.0]), { ownedPetItemIds: [] });
    expect(r.kind).toBe('pet');
    expect(r.petItemId).toBe(PET_ITEM_IDS[0]);
    expect(r.weaponConfigId).toBe(null);
    expect(r.coins).toBeGreaterThanOrEqual(CHEST_TIERS.dragon.coins[0]);
  });

  it('rollChest 宠物去重：已拥有的宠物不会被再次产出', () => {
    // 已拥有 pet_dog，petPick=0 应从剩余池取首个（pet_cat）
    const r = rollChest('dragon', seqRng([0, 0.99, 0.0, 0.0]), { ownedPetItemIds: [PET_ITEM_IDS[0]] });
    expect(r.kind).toBe('pet');
    expect(r.petItemId).toBe(PET_ITEM_IDS[1]);
    expect(r.petItemId).not.toBe(PET_ITEM_IDS[0]);
  });

  it('rollChest 三只宠物全拥有 → petChance 命中也回退武器', () => {
    const r = rollChest('dragon', seqRng([0, 0.99, 0.0]), { ownedPetItemIds: PET_ITEM_IDS });
    expect(r.kind).toBe('weapon');
    expect(r.weaponConfigId).toBeTruthy();
    expect(r.petItemId).toBe(null);
  });

  it('wood/iron 箱不产宠物（无 petChance）', () => {
    for (const tier of ['wood', 'iron']) {
      // rng=0.99 规避遗物；无 petChance 字段 → 恒不产宠物
      const r = rollChest(tier, () => 0.99, { ownedPetItemIds: [] });
      expect(r.kind).not.toBe('pet');
      expect(r.petItemId).toBe(null);
    }
  });
});