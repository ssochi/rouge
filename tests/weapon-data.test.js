import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';

describe('WeaponData', () => {
  it('武器库可导入且非空', () => {
    expect(Object.keys(WEAPONS).length).toBeGreaterThan(30);
  });
});
