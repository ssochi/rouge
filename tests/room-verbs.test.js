// tests/room-verbs.test.js
// 房间玩法动词状态机（生存计时/猎杀超时无奖励/契约不拉杆可通行）纯逻辑单测。
// 副作用经 spy ctx 注入（对齐 DungeonTrapObjects 的 def + fakeWorld 范式）。
import { describe, it, expect } from 'vitest';
import {
    SURVIVAL, HUNT, PACT, randRange, isVerbCategory,
    activateSurvival, updateSurvival,
    activateHunt, updateHunt,
    startPact, updatePact
} from '../src/core/systems/dungeon/RoomVerbs.js';

/** 构造记录调用的 spy ctx；overrides.target 控制 spawnHuntTarget 返回值。 */
function makeCtx(overrides = {}) {
    let alive = overrides.alive ?? 0;
    const calls = {
        spawnBatch: [], spawnGuards: [], spawnHuntTarget: 0, spawnPactEnemies: 0,
        wipeEnemies: 0, escapeTarget: [], clearWithReward: [], clearNoReward: 0, lockGates: 0
    };
    return {
        calls,
        rng: overrides.rng || (() => 0.5),
        setAlive: (n) => { alive = n; },
        aliveCount: () => alive,
        lockGates: () => { calls.lockGates++; },
        spawnBatch: (_room, count) => { calls.spawnBatch.push(count); },
        spawnGuards: (_room, n) => { calls.spawnGuards.push(n); },
        spawnHuntTarget: () => {
            calls.spawnHuntTarget++;
            return 'target' in overrides ? overrides.target : { hp: 100 };
        },
        spawnPactEnemies: () => { calls.spawnPactEnemies++; alive = 3; },
        wipeEnemies: () => { calls.wipeEnemies++; alive = 0; },
        escapeTarget: (_room, t) => { calls.escapeTarget.push(t); },
        clearWithReward: (_room, kind) => { calls.clearWithReward.push(kind); },
        clearNoReward: () => { calls.clearNoReward++; }
    };
}

describe('工具', () => {
    it('randRange 落在闭区间', () => {
        expect(randRange(2, 3, () => 0)).toBe(2);
        expect(randRange(2, 3, () => 0.999)).toBe(3);
        expect(randRange(4, 6, () => 0.5)).toBe(5);
    });
    it('isVerbCategory 只认三种新房型', () => {
        expect(isVerbCategory('survival')).toBe(true);
        expect(isVerbCategory('hunt')).toBe(true);
        expect(isVerbCategory('pact')).toBe(true);
        expect(isVerbCategory('combat_cover')).toBe(false);
        expect(isVerbCategory('elite')).toBe(false);
    });
});

describe('生存房 survival', () => {
    it('激活即起 30s 计时并放首批', () => {
        const room = {};
        const ctx = makeCtx();
        activateSurvival(room, ctx);
        expect(room.survivalTimer).toBe(SURVIVAL.duration);
        expect(room.survivalTimerMax).toBe(SURVIVAL.duration);
        expect(room.survivalComplete).toBe(false);
        expect(ctx.calls.spawnBatch.length).toBe(1); // 首批立即涌入
        expect(ctx.calls.spawnBatch[0]).toBeGreaterThanOrEqual(SURVIVAL.batchSizeMin);
        expect(ctx.calls.spawnBatch[0]).toBeLessThanOrEqual(SURVIVAL.batchSizeMax);
    });

    it('增援计时归零时补刷一小批', () => {
        const room = {};
        const ctx = makeCtx();
        activateSurvival(room, ctx);
        room.survivalBatchTimer = 1;
        updateSurvival(room, ctx); // batchTimer -> 0 -> 补刷
        expect(ctx.calls.spawnBatch.length).toBe(2);
        expect(room.survivalBatchTimer).toBeGreaterThan(0); // 已重置
    });

    it('撑满 30s → 全灭现存 + 丰厚奖励（且此前不结算）', () => {
        const room = {};
        const ctx = makeCtx();
        activateSurvival(room, ctx);
        // 计时中途：不结算
        room.survivalTimer = 2;
        updateSurvival(room, ctx); // -> 1
        updateSurvival(room, ctx); // -> 0（仍在计时分支返回）
        expect(ctx.calls.wipeEnemies).toBe(0);
        expect(ctx.calls.clearWithReward.length).toBe(0);
        // 归零后一帧：全灭 + 奖励
        updateSurvival(room, ctx);
        expect(room.survivalComplete).toBe(true);
        expect(ctx.calls.wipeEnemies).toBe(1);
        expect(ctx.calls.clearWithReward).toEqual(['survival']);
    });
});

describe('猎杀房 hunt', () => {
    it('激活刷目标怪 + 护卫、起 45s 计时', () => {
        const room = {};
        const ctx = makeCtx({ target: { hp: 100 } });
        activateHunt(room, ctx);
        expect(ctx.calls.spawnHuntTarget).toBe(1);
        expect(ctx.calls.spawnGuards.length).toBe(1);
        expect(ctx.calls.spawnGuards[0]).toBeGreaterThanOrEqual(HUNT.guardMin);
        expect(ctx.calls.spawnGuards[0]).toBeLessThanOrEqual(HUNT.guardMax);
        expect(room.huntTimer).toBe(HUNT.duration);
    });

    it('目标未落位 → 直接开门无奖励、不刷护卫', () => {
        const room = {};
        const ctx = makeCtx({ target: null });
        activateHunt(room, ctx);
        expect(ctx.calls.clearNoReward).toBe(1);
        expect(ctx.calls.spawnGuards.length).toBe(0);
        expect(ctx.calls.clearWithReward.length).toBe(0);
    });

    it('45s 内击杀目标 → 丰厚奖励', () => {
        const room = {};
        const ctx = makeCtx({ target: { hp: 100 } });
        activateHunt(room, ctx);
        room.huntTarget.hp = 0; // 目标被击杀
        updateHunt(room, ctx);
        expect(ctx.calls.clearWithReward).toEqual(['hunt']);
        expect(ctx.calls.clearNoReward).toBe(0);
    });

    it('超时目标存活 → 遁地逃走、门开但无奖励', () => {
        const room = {};
        const ctx = makeCtx({ target: { hp: 100 } });
        activateHunt(room, ctx);
        room.huntTimer = 1;
        updateHunt(room, ctx); // 计时归零：逃走 + 开门无奖励
        expect(ctx.calls.escapeTarget.length).toBe(1);
        expect(ctx.calls.escapeTarget[0]).toBe(room.huntTarget);
        expect(room.huntEscaped).toBe(true);
        expect(ctx.calls.clearNoReward).toBe(1);
        expect(ctx.calls.clearWithReward.length).toBe(0);
    });
});

describe('契约房 pact', () => {
    it('不拉杆：updatePact 空转（可自由通行，不出怪不结算）', () => {
        const room = { pactStarted: false };
        const ctx = makeCtx({ alive: 0 });
        updatePact(room, ctx);
        updatePact(room, ctx);
        expect(ctx.calls.spawnPactEnemies).toBe(0);
        expect(ctx.calls.lockGates).toBe(0);
        expect(ctx.calls.clearWithReward.length).toBe(0);
    });

    it('拉杆开战：封门 + 刷 ×1.5 全精英；重复拉杆无效', () => {
        const room = {};
        const ctx = makeCtx();
        expect(startPact(room, ctx)).toBe(true);
        expect(room.pactStarted).toBe(true);
        expect(ctx.calls.lockGates).toBe(1);
        expect(ctx.calls.spawnPactEnemies).toBe(1);
        // 再拉无效（已开战）
        expect(startPact(room, ctx)).toBe(false);
        expect(ctx.calls.spawnPactEnemies).toBe(1);
    });

    it('清光敌人 → 翻倍奖励（保底遗物）；未清完不结算', () => {
        const room = {};
        const ctx = makeCtx();
        startPact(room, ctx); // spawnPactEnemies 令 alive=3
        updatePact(room, ctx);
        expect(ctx.calls.clearWithReward.length).toBe(0); // 还有敌人
        ctx.setAlive(0);
        updatePact(room, ctx);
        expect(ctx.calls.clearWithReward).toEqual(['pact']);
    });

    it('PACT 数量系数为 1.5', () => {
        expect(PACT.countMult).toBe(1.5);
    });
});
