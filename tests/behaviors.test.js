// tests/behaviors.test.js
// 行为组件纯逻辑测试：弹幕角度数学、Kite 决策、冲锋状态机、召唤节奏。
import { describe, it, expect } from 'vitest';
import { computeFanAngles, computeRingAngles, RangedPatternBehavior } from '../src/core/entities/behaviors/RangedPatternBehavior.js';
import { KiteBehavior } from '../src/core/entities/behaviors/KiteBehavior.js';
import { TelegraphedChargeBehavior } from '../src/core/entities/behaviors/TelegraphedChargeBehavior.js';
import { SummonBehavior } from '../src/core/entities/behaviors/SummonBehavior.js';

function mockCtx(enemyPos, playerPos) {
    const moves = [];
    const enemy = {
        x: enemyPos.x,
        y: enemyPos.y,
        speed: 1,
        hp: 10,
        getEffectiveSpeed: () => 1,
        resolveWallCollision(nx, ny) { this.x = nx; this.y = ny; }
    };
    return {
        enemy,
        player: { x: playerPos.x, y: playerPos.y },
        walls: [],
        wallQuery: null,
        getFlowDirection: null,
        moveResolver: (e, nx, ny, ix, iy) => {
            moves.push({ ix, iy });
            e.x = nx;
            e.y = ny;
        },
        combatSystem: null,
        moves
    };
}

describe('弹幕角度数学', () => {
    it('fan：围绕基准角均匀展开且对称', () => {
        const angles = computeFanAngles(0, 5, Math.PI / 2);
        expect(angles.length).toBe(5);
        expect(angles[0]).toBeCloseTo(-Math.PI / 4);
        expect(angles[2]).toBeCloseTo(0);
        expect(angles[4]).toBeCloseTo(Math.PI / 4);
        expect(computeFanAngles(1.5, 1, Math.PI)).toEqual([1.5]);
    });

    it('ring：全环均匀分布带相位', () => {
        const angles = computeRingAngles(8, 0.5);
        expect(angles.length).toBe(8);
        for (let i = 1; i < 8; i++) {
            expect(angles[i] - angles[i - 1]).toBeCloseTo(Math.PI / 4);
        }
        expect(angles[0]).toBeCloseTo(0.5);
    });

    it('弹幕行为：冷却期不发射，发射调用 spawnEnemyBullet 带 owner', () => {
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'ring', count: 6, weight: 1 }],
            cooldown: 10,
            range: 500
        });
        behavior.cooldownTimer = 0;
        const spawned = [];
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        ctx.combatSystem = { spawnEnemyBullet: (b) => spawned.push(b) };

        behavior.update(ctx); // 选定模式
        behavior.update(ctx); // 执行 ring 齐射
        expect(spawned.length).toBe(6);
        expect(spawned[0].owner).toBe(ctx.enemy);
        expect(behavior.isFiring).toBe(false);
        expect(behavior.cooldownTimer).toBe(10);
    });
});

describe('KiteBehavior 决策', () => {
    it('距离带三态', () => {
        const kite = new KiteBehavior({ near: 100, far: 200 });
        expect(kite.decide(50)).toBe('retreat');
        expect(kite.decide(150)).toBe('drift');
        expect(kite.decide(300)).toBe('approach');
    });

    it('过近后撤方向背向玩家', () => {
        const kite = new KiteBehavior({ near: 100, far: 200 });
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 50, y: 0 });
        kite.update(ctx);
        expect(ctx.moves[0].ix).toBeLessThan(0);
    });
});

describe('TelegraphedChargeBehavior 状态机', () => {
    it('idle→telegraph→charge→recover→idle 完整周期', () => {
        const charge = new TelegraphedChargeBehavior({
            telegraphTime: 3, chargeTime: 2, recoverTime: 2, cooldown: 10, triggerRange: 300
        });
        charge.cooldownTimer = 0;
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 100, y: 0 });

        expect(charge.update(ctx)).toBe(true); // 触发 → telegraph
        expect(charge.state).toBe('telegraph');
        expect(charge.getTelegraphLine(ctx.enemy)).not.toBeNull();

        for (let i = 0; i < 3; i++) charge.update(ctx);
        expect(charge.state).toBe('charge');
        const xBefore = ctx.enemy.x;
        charge.update(ctx);
        expect(ctx.enemy.x).toBeGreaterThan(xBefore); // 冲锋位移朝玩家

        charge.update(ctx);
        expect(charge.state).toBe('recover');
        charge.update(ctx);
        charge.update(ctx);
        expect(charge.state).toBe('idle');
        expect(charge.cooldownTimer).toBe(10);
    });
});

describe('SummonBehavior 节奏与上限', () => {
    it('施法结束触发回调，达到上限后不再召唤', () => {
        const summoned = [];
        const summon = new SummonBehavior({
            interval: 5, batch: 2, cap: 3, castTime: 2, range: 500,
            onSummon: () => {
                const m = { hp: 10 };
                summoned.push(m);
                return m;
            }
        });
        summon.timer = 0;
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 50, y: 0 });

        summon.update(ctx); // 进入施法
        expect(summon.isCasting).toBe(true);
        summon.update(ctx);
        summon.update(ctx); // 施法完成 → 召唤 2
        expect(summoned.length).toBe(2);

        // cap=3，batch=2：2+2>3 → 不召唤，进入短重试
        summon.timer = 0;
        summon.update(ctx);
        expect(summon.isCasting).toBe(false);
        expect(summoned.length).toBe(2);

        // 一只死亡后腾出空间
        summoned[0].hp = 0;
        summon.timer = 0;
        summon.update(ctx);
        expect(summon.isCasting).toBe(true);
    });
});
