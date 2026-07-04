import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';
import { RARITY_TIERS } from '../src/core/dungeon/RarityConfig.js';

describe('武器稀有度', () => {
  it('所有非工具战斗武器都有合法 rarity', () => {
    for (const [id, conf] of Object.entries(WEAPONS)) {
      if (conf.isUtility || conf.damage === 0) continue;
      expect(RARITY_TIERS, `${id} 缺少合法 rarity`).toContain(conf.rarity);
    }
  });
  it('每档至少 3 把武器（legendary 至少 3）', () => {
    const count = Object.fromEntries(RARITY_TIERS.map(t => [t, 0]));
    for (const conf of Object.values(WEAPONS)) {
      if (conf.rarity) count[conf.rarity]++;
    }
    for (const t of RARITY_TIERS) expect(count[t], t).toBeGreaterThanOrEqual(3);
  });
});
