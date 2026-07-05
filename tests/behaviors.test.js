// tests/behaviors.test.js
// 行为组件纯逻辑测试：弹幕角度数学、Kite 决策、冲锋状态机、召唤节奏。
import { describe, it, expect } from 'vitest';
import { computeFanAngles, computeRingAngles, RangedPatternBehavior } from '../src/core/entities/behaviors/RangedPatternBehavior.js';
import { KiteBehavior } from '../src/core/entities/behaviors/KiteBehavior.js';
import { TelegraphedChargeBehavior } from '../src/core/entities/behaviors/TelegraphedChargeBehavior.js';
import { SummonBehavior } from '../src/core/entities/behaviors/SummonBehavior.js';
import { PounceChargeBehavior } from '../src/core/entities/behaviors/PounceChargeBehavior.js';
import { FlankingBias, setFlankGroupCount } from '../src/core/entities/behaviors/FlankingBias.js';

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

describe('弹幕模式扩展（spiral/wave_volley/split_shot/wall）', () => {
    function firingCtx(enemyPos, playerPos) {
        const spawned = [];
        const ctx = mockCtx(enemyPos, playerPos);
        ctx.combatSystem = { spawnEnemyBullet: (b) => spawned.push(b) };
        return { ctx, spawned };
    }

    it('spiral：起始角朝玩家，逐发角度 +stepRad', () => {
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'spiral', count: 5, interval: 1, stepRad: 0.5, speed: 2, damage: 7, weight: 1 }],
            cooldown: 30, range: 500
        });
        behavior.cooldownTimer = 0;
        const { ctx, spawned } = firingCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        for (let f = 0; f < 8; f++) behavior.update(ctx); // 首帧选定，其后逐帧连发
        expect(spawned.length).toBe(5);
        expect(spawned[0].angle).toBeCloseTo(0);   // 朝玩家
        expect(spawned[1].angle).toBeCloseTo(0.5);
        expect(spawned[4].angle).toBeCloseTo(2.0);
        expect(spawned[0].owner).toBe(ctx.enemy);
    });

    it('spiral 期间 isFiring 为真，结束后进入冷却', () => {
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'spiral', count: 3, interval: 1, stepRad: 0.3, weight: 1 }],
            cooldown: 25, range: 500
        });
        behavior.cooldownTimer = 0;
        const { ctx } = firingCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        behavior.update(ctx); // 选定 → active
        expect(behavior.isFiring).toBe(true);
        for (let f = 0; f < 5; f++) behavior.update(ctx);
        expect(behavior.isFiring).toBe(false);
        expect(behavior.cooldownTimer).toBeGreaterThan(0); // 已进入冷却
    });

    it('wave_volley：向玩家齐射并注入 wave 字段', () => {
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'wave_volley', count: 3, spreadDeg: 10, damage: 8, waveAmplitude: 14, waveFrequency: 0.14, weight: 1 }],
            cooldown: 30, range: 500
        });
        behavior.cooldownTimer = 0;
        const { ctx, spawned } = firingCtx({ x: 0, y: 0 }, { x: 0, y: 100 }); // 瞄准向下 = PI/2
        behavior.update(ctx); // 选定
        behavior.update(ctx); // 齐射
        expect(spawned.length).toBe(3);
        for (const b of spawned) {
            expect(b.waveAmplitude).toBe(14);
            expect(b.waveFrequency).toBeCloseTo(0.14);
            expect(b.owner).toBe(ctx.enemy);
        }
        expect(spawned[1].angle).toBeCloseTo(Math.PI / 2); // 中间弹朝玩家
    });

    it('split_shot：单发大弹注入分裂字段', () => {
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'split_shot', damage: 10, size: 8, splitAfter: 45, splitCount: 8, splitDamage: 5, splitSpeed: 2.5, weight: 1 }],
            cooldown: 30, range: 500
        });
        behavior.cooldownTimer = 0;
        const { ctx, spawned } = firingCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        behavior.update(ctx);
        behavior.update(ctx);
        expect(spawned.length).toBe(1);
        expect(spawned[0].splitAfter).toBe(45);
        expect(spawned[0].splitCount).toBe(8);
        expect(spawned[0].splitDamage).toBe(5);
        expect(spawned[0].size).toBe(8);
        expect(spawned[0].angle).toBeCloseTo(0);
    });

    it('wall：一字排开留缺口且弹道平行', () => {
        let calls = 0;
        const seq = [0.0, 0.9]; // floor(0*7)=0, floor(0.9*7)=6 → 缺口 {0,6}
        const behavior = new RangedPatternBehavior({
            patterns: [{ kind: 'wall', count: 7, spacing: 20, gapCount: 2, speed: 3, damage: 7, weight: 1 }],
            cooldown: 30, range: 500,
            rng: () => seq[calls++ % seq.length]
        });
        behavior.cooldownTimer = 0;
        const { ctx, spawned } = firingCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        behavior.update(ctx);
        behavior.update(ctx);
        expect(spawned.length).toBe(5); // 7 - 2 缺口
        for (const b of spawned) {
            expect(b.angle).toBeCloseTo(0);            // 全部朝玩家方向（平行）
            expect(Math.abs(b.x)).toBeLessThan(1e-6);  // 沿垂直方向排开：x≈0
        }
        const ys = spawned.map(b => b.y).sort((a, z) => a - z);
        expect(ys[ys.length - 1] - ys[0]).toBeGreaterThan(0); // y 方向分散
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

describe('PounceChargeBehavior 冲刺扑击', () => {
    it('decideTrigger：仅距离带内且掷点命中概率时触发', () => {
        const p = new PounceChargeBehavior({ minRange: 100, maxRange: 200, triggerChance: 0.5 });
        expect(p.decideTrigger(150, 0.4)).toBe(true);   // 带内 + 命中
        expect(p.decideTrigger(150, 0.6)).toBe(false);  // 带内 + 未命中
        expect(p.decideTrigger(80, 0.1)).toBe(false);   // 过近（<100）
        expect(p.decideTrigger(260, 0.1)).toBe(false);  // 过远（>200）
    });

    it('状态机：idle→telegraph→charge→recover→idle，扑击朝玩家位移并进入冷却', () => {
        const p = new PounceChargeBehavior({
            minRange: 50, maxRange: 300, telegraphTime: 3, chargeTime: 2, recoverTime: 2,
            cooldown: 40, triggerChance: 1, rng: () => 0
        });
        p.cooldownTimer = 0;
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 100, y: 0 });

        expect(p.update(ctx)).toBe(true);       // 触发 → telegraph
        expect(p.state).toBe('telegraph');
        expect(p.isTelegraphing).toBe(true);
        expect(p.getTelegraphLine(ctx.enemy)).not.toBeNull();

        for (let i = 0; i < 3; i++) p.update(ctx);
        expect(p.state).toBe('charge');
        const xBefore = ctx.enemy.x;
        p.update(ctx);
        expect(ctx.enemy.x).toBeGreaterThan(xBefore); // 扑击朝玩家（+x）位移

        p.update(ctx);
        expect(p.state).toBe('recover');
        p.update(ctx);
        p.update(ctx);
        expect(p.state).toBe('idle');
        expect(p.cooldownTimer).toBe(40);
    });

    it('概率判定失败时进入短重试而非立即触发', () => {
        const p = new PounceChargeBehavior({
            minRange: 0, maxRange: 500, triggerChance: 0.5, retryDelay: 7, rng: () => 0.9
        });
        p.cooldownTimer = 0;
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        expect(p.update(ctx)).toBe(false);      // 掷点 0.9 ≥ 0.5 → 不触发
        expect(p.state).toBe('idle');
        expect(p.cooldownTimer).toBe(7);        // 设置重试间隔
    });

    it('tryConsumeHit：单次扑击仅结算一次接触伤害', () => {
        const p = new PounceChargeBehavior({
            minRange: 0, maxRange: 500, telegraphTime: 1, chargeTime: 5, recoverTime: 1,
            triggerChance: 1, rng: () => 0
        });
        p.cooldownTimer = 0;
        const ctx = mockCtx({ x: 0, y: 0 }, { x: 100, y: 0 });
        p.update(ctx); // idle→telegraph
        p.update(ctx); // telegraph→charge
        expect(p.isCharging).toBe(true);
        expect(p.tryConsumeHit()).toBe(true);   // 首次命中
        expect(p.tryConsumeHit()).toBe(false);  // 同次扑击不再结算
    });
});

describe('FlankingBias 包抄偏置', () => {
    it('rotate：启用时按侧翼角旋转，左右翼分向相反且写入 outX/outY', () => {
        setFlankGroupCount(3);
        const left = new FlankingBias({ angleDeg: 25, minGroup: 3, sign: 1 });
        const right = new FlankingBias({ angleDeg: 25, minGroup: 3, sign: -1 });
        expect(left.refresh()).toBe(true);
        right.refresh();

        // 沿 +x 前进：左翼(+25°)→y>0，右翼(-25°)→y<0（分向两侧合围）
        expect(left.rotate(1, 0)).toBe(true);
        right.rotate(1, 0);
        expect(left.outX).toBeCloseTo(Math.cos(25 * Math.PI / 180));
        expect(left.outY).toBeCloseTo(Math.sin(25 * Math.PI / 180));
        expect(right.outY).toBeCloseTo(-Math.sin(25 * Math.PI / 180));
        expect(Math.sign(left.outY)).toBe(-Math.sign(right.outY));
        // 旋转保持向量长度不变
        expect(Math.hypot(left.outX, left.outY)).toBeCloseTo(1);
        setFlankGroupCount(0);
    });

    it('群体不足阈值时不旋转（原样透传）', () => {
        setFlankGroupCount(2);
        const b = new FlankingBias({ angleDeg: 25, minGroup: 3, sign: 1 });
        expect(b.refresh()).toBe(false);
        expect(b.rotate(1, 0)).toBe(false);
        expect(b.outX).toBe(1);
        expect(b.outY).toBe(0);
        setFlankGroupCount(0);
    });

    it('默认按构造顺序奇偶交替分配左右翼', () => {
        const a = new FlankingBias({});
        const b = new FlankingBias({});
        expect(a.sign).toBe(-b.sign); // 相邻两只分属不同翼
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
