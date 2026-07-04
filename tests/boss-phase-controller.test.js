// tests/boss-phase-controller.test.js
import { describe, it, expect } from 'vitest';
import { BossPhaseController } from '../src/core/entities/bosses/BossPhaseController.js';

describe('BossPhaseController', () => {
    it('相位按阈值单向推进且 onEnter 只触发一次', () => {
        const entered = [];
        const c = new BossPhaseController({
            phases: [
                { threshold: 0.6, phase: 2, onEnter: () => entered.push(2) },
                { threshold: 0.25, phase: 3, onEnter: () => entered.push(3) }
            ]
        });

        expect(c.updatePhase(0.9)).toBeNull();
        expect(c.phase).toBe(1);

        expect(c.updatePhase(0.5)).toBe(2);
        expect(c.updatePhase(0.5)).toBeNull(); // 幂等
        expect(entered).toEqual([2]);

        // 跨双阈值一次推进到 3（两个 onEnter 都触发）
        expect(c.updatePhase(0.1)).toBe(3);
        expect(entered).toEqual([2, 3]);

        // 不回退
        expect(c.updatePhase(0.9)).toBeNull();
        expect(c.phase).toBe(3);
    });

    it('选招：minPhase 过滤 + 动态权重 + 条件过滤', () => {
        const c = new BossPhaseController({
            attacks: [
                { id: 'basic', weight: 1 },
                { id: 'p2only', weight: 5, minPhase: 2 },
                { id: 'far', weight: 5, condition: (ctx) => ctx.dist > 100 },
                { id: 'zero', weight: () => 0 }
            ]
        });

        // 相位 1 + 近距：只剩 basic
        for (let i = 0; i < 10; i++) {
            expect(c.pickAttack({ dist: 50 }, () => 0.99)).toBe('basic');
        }

        c.updatePhase; // no-op
        c.phase = 2;
        const picks = new Set();
        for (let i = 0; i < 60; i++) picks.add(c.pickAttack({ dist: 150 }, Math.random));
        expect(picks.has('p2only')).toBe(true);
        expect(picks.has('far')).toBe(true);
        expect(picks.has('zero')).toBe(false);
    });

    it('优先级链：最高层独占（表达 if-else 选招）', () => {
        const c = new BossPhaseController({
            attacks: [
                { id: 'low', priority: 1 },
                { id: 'high', priority: 5, condition: (ctx) => ctx.ready }
            ]
        });
        expect(c.pickAttack({ ready: true })).toBe('high');
        expect(c.pickAttack({ ready: false })).toBe('low');
    });

    it('per-招式冷却：setAttackCooldown/tick/isReady', () => {
        const c = new BossPhaseController({
            attacks: [{ id: 'a', weight: 1 }, { id: 'b', weight: 1 }]
        });
        c.setAttackCooldown('a', 2);
        expect(c.isReady('a')).toBe(false);
        expect(c.pickAttack({}, () => 0)).toBe('b');
        c.tick();
        c.tick();
        expect(c.isReady('a')).toBe(true);
    });

    it('无候选返回 null', () => {
        const c = new BossPhaseController({
            attacks: [{ id: 'x', minPhase: 3 }]
        });
        expect(c.pickAttack({})).toBeNull();
    });
});
