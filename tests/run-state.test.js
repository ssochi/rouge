import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DungeonRunState } from '../src/core/dungeon/DungeonRunState.js';

describe('DungeonRunState', () => {
  let run;

  beforeEach(() => {
    run = new DungeonRunState();
  });

  it('初始状态未激活且全部清零', () => {
    expect(run.active).toBe(false);
    expect(run.coins).toBe(0);
    expect(run.keys).toBe(0);
    expect(run.relicIds).toEqual([]);
    expect(run.floor).toBe(1);
    expect(run.seed).toBe(0);
  });

  it('start(seed) 激活、清零并记录种子', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // 先弄脏状态，验证 start 会清零
    run.addCoins(50);
    run.addKeys(2);
    run.addRelic('r1');
    run.floor = 2;

    run.start(12345);

    expect(run.active).toBe(true);
    expect(run.seed).toBe(12345);
    expect(run.coins).toBe(0);
    expect(run.keys).toBe(0);
    expect(run.relicIds).toEqual([]);
    expect(run.floor).toBe(1);
    expect(logSpy).toHaveBeenCalledWith('[Dungeon] seed:', 12345);

    logSpy.mockRestore();
  });

  it('end() 全部清零并停用', () => {
    run.start(999);
    run.addCoins(100);
    run.addKeys(3);
    run.addRelic('relic_a');
    run.floor = 2;

    run.end();

    expect(run.active).toBe(false);
    expect(run.coins).toBe(0);
    expect(run.keys).toBe(0);
    expect(run.relicIds).toEqual([]);
    expect(run.floor).toBe(1);
    expect(run.seed).toBe(0);
  });

  it('addCoins 累加金币', () => {
    run.addCoins(30);
    run.addCoins(20);
    expect(run.coins).toBe(50);
  });

  it('spendCoins 足额时扣款并返回 true', () => {
    run.addCoins(100);
    expect(run.spendCoins(60)).toBe(true);
    expect(run.coins).toBe(40);
  });

  it('spendCoins 不足时返回 false 且不扣款', () => {
    run.addCoins(30);
    expect(run.spendCoins(50)).toBe(false);
    expect(run.coins).toBe(30);
  });

  it('addKeys 累加钥匙', () => {
    run.addKeys(1);
    run.addKeys(2);
    expect(run.keys).toBe(3);
  });

  it('useKey 有钥匙时消耗一把并返回 true', () => {
    run.addKeys(2);
    expect(run.useKey()).toBe(true);
    expect(run.keys).toBe(1);
  });

  it('useKey 无钥匙时返回 false 且不变为负数', () => {
    expect(run.useKey()).toBe(false);
    expect(run.keys).toBe(0);
  });

  it('addRelic / hasRelic 圣物占位', () => {
    expect(run.hasRelic('r1')).toBe(false);
    run.addRelic('r1');
    expect(run.hasRelic('r1')).toBe(true);
    // 去重
    run.addRelic('r1');
    expect(run.relicIds).toEqual(['r1']);
  });

  it('floor 流转：start 归 1，可推进到 2', () => {
    run.start(1);
    expect(run.floor).toBe(1);
    run.floor = 2;
    expect(run.floor).toBe(2);
    // 单局内 seed 不随楼层改变（可复现派生 seed + floor）
    expect(run.seed).toBe(1);
    run.end();
    expect(run.floor).toBe(1);
  });
});
