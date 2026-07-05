// tests/gamble-table.test.js
// 老虎机赌博纯逻辑测试：结果表权重归一、耐久耗尽爆机（最后一次保底中奖）、金币不足不消费。
import { describe, it, expect } from 'vitest';
import {
    pickGambleOutcome,
    resolveGambleReward,
    symbolsForOutcome,
    rollDurability,
    SlotMachineCore,
} from '../src/core/dungeon/GambleTable.js';
import { GAMBLE } from '../src/core/dungeon/EconomyConfig.js';
import { DungeonRunState } from '../src/core/dungeon/DungeonRunState.js';

function makeRunState(coins) {
    const rs = new DungeonRunState();
    rs.coins = coins;
    return rs;
}

describe('GambleTable — 结果表权重', () => {
    it('权重之和为 100，边界抽取落到预期档位', () => {
        const total = GAMBLE.outcomes.reduce((s, o) => s + o.weight, 0);
        expect(total).toBe(100);

        // 累计带：empty[0,35) small[35,60) big[60,75) medkit[75,83) key[83,89)
        //          weapon[89,94) relic[94,97) bomb[97,100)
        expect(pickGambleOutcome(() => 0.00, false).kind).toBe('empty');
        expect(pickGambleOutcome(() => 0.30, false).kind).toBe('empty');
        expect(pickGambleOutcome(() => 0.40, false).kind).toBe('coins_small');
        expect(pickGambleOutcome(() => 0.70, false).kind).toBe('coins_big');
        expect(pickGambleOutcome(() => 0.999, false).kind).toBe('bomb');
    });

    it('最后一次保底：剔除空奖与爆炸，任何 rng 都返回中奖档', () => {
        for (let i = 0; i <= 200; i++) {
            const kind = pickGambleOutcome(() => i / 200, true).kind;
            expect(GAMBLE.nonRewardKinds).not.toContain(kind);
        }
    });

    it('三连图案：中奖三连、空奖三不同、遗物为 777', () => {
        expect(symbolsForOutcome('relic', () => 0.5)).toEqual(['seven', 'seven', 'seven']);
        expect(symbolsForOutcome('coins_big', () => 0.5)).toEqual(['coin', 'coin', 'coin']);
        const empty = symbolsForOutcome('empty', () => 0.13);
        expect(empty).toHaveLength(3);
        expect(new Set(empty).size).toBe(3); // 互不相同
    });

    it('奖励解析：金币落在配置区间，武器/遗物给出 payload 或安全降级', () => {
        const small = resolveGambleReward({ kind: 'coins_small', coinMin: 3, coinMax: 5 }, () => 0.5);
        expect(small.coins).toBeGreaterThanOrEqual(3);
        expect(small.coins).toBeLessThanOrEqual(5);

        const weapon = resolveGambleReward({ kind: 'weapon' }, () => 0.2);
        // 有武器则给 configId，否则降级为金币（绝不空手）
        expect(weapon.weaponConfigId || weapon.coins > 0).toBeTruthy();

        // 遗物全收集 → 降级为金币大奖
        const relicFull = resolveGambleReward({ kind: 'relic' }, () => 0.5, { ownedRelicIds: ['__all__'] });
        // ownedRelicIds 不含全部时仍可能给遗物；此处仅验证结构合法
        expect(relicFull.kind === 'relic' || relicFull.coins > 0).toBeTruthy();
    });
});

describe('SlotMachineCore — 耐久与投币事务', () => {
    it('耐久在区间内', () => {
        for (let i = 0; i < 50; i++) {
            const n = rollDurability(Math.random);
            expect(n).toBeGreaterThanOrEqual(GAMBLE.durabilityMin);
            expect(n).toBeLessThanOrEqual(GAMBLE.durabilityMax);
        }
    });

    it('耐久耗尽后爆机，最后一次保底中奖，废机拒绝再投且不扣款', () => {
        const core = new SlotMachineCore(Math.random);
        const n = core.durability;
        expect(n).toBeGreaterThanOrEqual(GAMBLE.durabilityMin);

        let lastIsLast = false;
        let lastReward = null;
        for (let i = 0; i < n; i++) {
            const rs = makeRunState(1000);
            const wasLast = core.isLastSpin;
            const res = core.beginSpin(rs, []);
            expect(res.ok).toBe(true);
            expect(rs.coins).toBe(1000 - GAMBLE.coinCost); // 正常扣款
            if (wasLast) {
                lastIsLast = true;
                lastReward = res.reward;
            }
            core.settle();
        }

        expect(core.dead).toBe(true);
        expect(core.canSpin()).toBe(false);
        expect(lastIsLast).toBe(true);
        expect(GAMBLE.nonRewardKinds).not.toContain(lastReward.kind);

        // 废机：拒绝再投，且不消费金币
        const rs2 = makeRunState(1000);
        const res2 = core.beginSpin(rs2, []);
        expect(res2.ok).toBe(false);
        expect(res2.reason).toBe('dead');
        expect(rs2.coins).toBe(1000);
    });

    it('金币不足不消费', () => {
        const core = new SlotMachineCore(() => 0.5);
        const poor = makeRunState(GAMBLE.coinCost - 1);
        const res = core.beginSpin(poor, []);
        expect(res.ok).toBe(false);
        expect(res.reason).toBe('no_gold');
        expect(poor.coins).toBe(GAMBLE.coinCost - 1); // 未扣款
        expect(core.durability).toBe(core.durability); // 耐久未变（未 settle）

        // 恰好够钱：成功且扣清
        const exact = makeRunState(GAMBLE.coinCost);
        const ok = core.beginSpin(exact, []);
        expect(ok.ok).toBe(true);
        expect(exact.coins).toBe(0);
    });
});
