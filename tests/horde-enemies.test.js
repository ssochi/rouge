// tests/horde-enemies.test.js
// 人潮基调新敌人 ×3 机制单测：
//   shambler —— 入池权重存在 + 骨笛光环对 getEffectiveSpeed 的乘算；
//   bone_piper —— 加速光环范围（120px 内生效、外无效）+ 固定倍率不叠乘 + 唤潮上限 6 且不计房间配额；
//   rain_archer —— 撒放登记 3 个错开的延迟箭雨 AoE（中心=玩家、错开 0.3s）；
//   WorldSystem —— 延迟 AoE 倒计时结算（滞空不伤、落点恰伤一次）。
// 注意：canvasStub 必须最先导入（满足帧模块的 Canvas 依赖）。
import './helpers/canvasStub.js';
import { describe, it, expect } from 'vitest';
import { Shambler } from '../src/core/entities/Shambler.js';
import { BonePiper } from '../src/core/entities/BonePiper.js';
import { RainArcher } from '../src/core/entities/RainArcher.js';
import { FLOOR_CONFIGS } from '../src/core/dungeon/FloorConfigs.js';
import { WorldSystem } from '../src/core/systems/WorldSystem.js';

describe('入池权重（FloorConfigs）', () => {
    it('shambler 三层 shallow+mid、bone_piper/rain_archer 三层 mid+deep 均有正权重', () => {
        for (const f of [1, 2, 3]) {
            const t = FLOOR_CONFIGS[f].depthTiers;
            expect(t.shallow.weights.shambler).toBeGreaterThan(0);
            expect(t.mid.weights.shambler).toBeGreaterThan(0);
            expect(t.mid.weights.bone_piper).toBeGreaterThan(0);
            expect(t.deep.weights.bone_piper).toBeGreaterThan(0);
            expect(t.mid.weights.rain_archer).toBeGreaterThan(0);
            expect(t.deep.weights.rain_archer).toBeGreaterThan(0);
        }
    });
});

describe('尸群蹒跚者 Shambler', () => {
    it('炮灰档：HP 10、速度 0.8', () => {
        const s = new Shambler(0, 0);
        expect(s.hp).toBe(10);
        expect(s.speed).toBe(0.8);
    });

    it('骨笛光环生效时 getEffectiveSpeed 按倍率乘算；计时归零后复原', () => {
        const s = new Shambler(0, 0);
        expect(s.getEffectiveSpeed()).toBeCloseTo(0.8);
        s.speedAuraTimer = 5;
        s.speedAuraMult = 1.25;
        expect(s.getEffectiveSpeed()).toBeCloseTo(0.8 * 1.25);
        s.speedAuraTimer = 0;
        expect(s.getEffectiveSpeed()).toBeCloseTo(0.8);
    });

    it('冰冻优先于光环：冻结时速度为 0', () => {
        const s = new Shambler(0, 0);
        s.speedAuraTimer = 5;
        s.speedAuraMult = 1.25;
        s.frozenTimer = 30;
        expect(s.getEffectiveSpeed()).toBe(0);
    });
});

describe('骨笛吹手 BonePiper —— 加速光环', () => {
    it('120px 内敌人获得 ×1.25 提速续期，范围外不受影响', () => {
        const piper = new BonePiper(0, 0);
        const near = { x: 50, y: 0, hp: 10, speedAuraTimer: 0, speedAuraMult: 1 };
        const edge = { x: 119, y: 0, hp: 10, speedAuraTimer: 0, speedAuraMult: 1 };
        const far = { x: 200, y: 0, hp: 10, speedAuraTimer: 0, speedAuraMult: 1 };
        piper.worldSystem = { enemies: [piper, near, edge, far] };

        piper._applySpeedAura();

        expect(near.speedAuraTimer).toBeGreaterThan(0);
        expect(near.speedAuraMult).toBe(1.25);
        expect(edge.speedAuraTimer).toBeGreaterThan(0);
        expect(far.speedAuraTimer).toBe(0);
    });

    it('固定倍率覆写：多个吹手同时作用不叠乘（精英叠乘上限）', () => {
        const p1 = new BonePiper(0, 0);
        const p2 = new BonePiper(10, 0);
        const target = { x: 40, y: 0, hp: 10, speedAuraTimer: 0, speedAuraMult: 1 };
        const enemies = [p1, p2, target];
        p1.worldSystem = { enemies };
        p2.worldSystem = { enemies };

        p1._applySpeedAura();
        p2._applySpeedAura();

        expect(target.speedAuraMult).toBe(1.25); // 非 1.25*1.25
    });

    it('死亡的敌人不吃光环', () => {
        const piper = new BonePiper(0, 0);
        const dead = { x: 30, y: 0, hp: 0, speedAuraTimer: 0, speedAuraMult: 1 };
        piper.worldSystem = { enemies: [piper, dead] };
        piper._applySpeedAura();
        expect(dead.speedAuraTimer).toBe(0);
    });
});

describe('骨笛吹手 BonePiper —— 唤潮', () => {
    function makePiperWithWorld() {
        const spawned = [];
        let scaledCount = 0;
        const piper = new BonePiper(0, 0);
        piper.worldSystem = {
            enemies: [piper],
            dungeonManager: { scaleUncountedSpawn() { scaledCount++; } },
            spawnEnemy(type) {
                if (type !== 'shambler') return null;
                const m = { hp: 10, x: 0, y: 0, spawnType: 'shambler' };
                spawned.push(m);
                piper.worldSystem.enemies.push(m);
                return m;
            }
        };
        return { piper, spawned, getScaled: () => scaledCount };
    }

    it('唤起物应用楼层缩放但不计房间配额（scaleUncountedSpawn，非 registerSpawnedEnemy）', () => {
        const { piper, getScaled } = makePiperWithWorld();
        const minion = piper._summonShambler(0);
        expect(minion).not.toBeNull();
        expect(minion.spawnType).toBe('shambler');
        expect(getScaled()).toBe(1);
    });

    it('存活唤起物上限 6：反复施法不超过 6（batch 2 / cap 6）', () => {
        const { piper, spawned } = makePiperWithWorld();
        const ctx = { enemy: piper, player: { x: 0, y: 0 } };
        // 反复完整施法周期（起手 → 完成前摇 → 召唤）
        for (let cycle = 0; cycle < 12; cycle++) {
            piper.summon.timer = 0;
            piper.summon.update(ctx);                       // 触发施法
            for (let i = 0; i < piper.summon.castTime + 2; i++) {
                piper.summon.update(ctx);                   // 推进前摇 → 结算召唤
            }
        }
        expect(piper.summon.cap).toBe(6);
        expect(piper.summon.aliveMinionCount()).toBe(6);
        expect(spawned.length).toBe(6); // 全存活时封顶 6，不再多刷
    });

    it('唤起物死亡后腾出名额，可再唤起补满', () => {
        const { piper, spawned } = makePiperWithWorld();
        const ctx = { enemy: piper, player: { x: 0, y: 0 } };
        const runCycle = () => {
            piper.summon.timer = 0;
            piper.summon.update(ctx);
            for (let i = 0; i < piper.summon.castTime + 2; i++) piper.summon.update(ctx);
        };
        for (let c = 0; c < 6; c++) runCycle();
        expect(piper.summon.aliveMinionCount()).toBe(6);
        // 杀掉 2 只
        spawned[0].hp = 0;
        spawned[1].hp = 0;
        for (let c = 0; c < 6; c++) runCycle();
        expect(piper.summon.aliveMinionCount()).toBe(6); // 补满回 6
        expect(spawned.length).toBe(8);                  // 累计生成 6 + 补 2
    });
});

describe('雨幕射手 RainArcher —— 抛射箭雨', () => {
    function makeArcher() {
        const calls = [];
        const archer = new RainArcher(100, 100);
        archer.worldSystem = { spawnDelayedAoe(o) { calls.push(o); return o; } };
        archer.combatSystem = { particles: [] };
        return { archer, calls };
    }

    it('撒放登记 3 个延迟 AoE：中心=玩家、错开 0.3s(18帧)、半径 36、伤 10', () => {
        const { archer, calls } = makeArcher();
        archer._loose({ x: 300, y: 220 });
        expect(calls.length).toBe(3);
        // 第 0 圈落在玩家脚下
        expect(calls[0].x).toBeCloseTo(300);
        expect(calls[0].y).toBeCloseTo(220);
        // 错开递增 18 帧
        expect(calls[1].delay - calls[0].delay).toBe(18);
        expect(calls[2].delay - calls[1].delay).toBe(18);
        for (const c of calls) {
            expect(c.radius).toBe(36);
            expect(c.damage).toBe(10);
            expect(c.warnFrames).toBeGreaterThan(0);
            expect(c.delay).toBeGreaterThan(c.warnFrames); // 存在不可见滞空段
        }
    });

    it('精英伤害倍率作用于落箭伤害', () => {
        const { archer, calls } = makeArcher();
        archer.damageMult = 1.6;
        archer._loose({ x: 0, y: 0 });
        expect(calls[0].damage).toBe(Math.round(10 * 1.6));
    });

    it('aim 蓄力满后撒放：aimTimer 归零帧触发一次登记', () => {
        const { archer, calls } = makeArcher();
        const player = { x: 300, y: 100, state: 'idle' };
        archer.aimTimer = 1; // 下一帧撒放
        archer.update(player, [], null, null, null, null, archer.combatSystem, (e, nx, ny) => { e.x = nx; e.y = ny; });
        expect(calls.length).toBe(3);
        expect(archer.shotCooldown).toBeGreaterThan(0);
    });
});

describe('WorldSystem —— 延迟 AoE 结算', () => {
    function makeWorld(player) {
        return new WorldSystem({
            navGrid: { gridSize: 32, gridCols: 40, gridRows: 40 },
            walls: [], enemies: [], droppedItems: [], breakableObjects: [],
            player, combatSystem: { particles: [] }, vehicles: [],
            inventorySystem: null, pets: [], dungeonRunState: null
        });
    }

    it('滞空段不伤害；倒计时归零落点恰结算一次伤害', () => {
        const player = { x: 100, y: 100, state: 'idle', taken: 0, takeDamage(d) { this.taken += d; } };
        const ws = makeWorld(player);
        ws.spawnDelayedAoe({ x: 100, y: 100, radius: 36, delay: 10, warnFrames: 5, damage: 10, knockback: 3 });
        expect(ws.groundHazards.length).toBe(1);

        for (let i = 0; i < 9; i++) ws.updateGroundHazards();
        expect(player.taken).toBe(0);           // 落点前不伤
        expect(ws.groundHazards.length).toBe(1);

        ws.updateGroundHazards();               // 第 10 帧落点
        expect(player.taken).toBe(10);
        expect(ws.groundHazards.length).toBe(0); // 结算后移除
    });

    it('玩家在半径外：落点不造成伤害', () => {
        const player = { x: 999, y: 999, state: 'idle', taken: 0, takeDamage(d) { this.taken += d; } };
        const ws = makeWorld(player);
        ws.spawnDelayedAoe({ x: 100, y: 100, radius: 36, delay: 2, warnFrames: 1, damage: 10 });
        ws.updateGroundHazards();
        ws.updateGroundHazards();
        expect(player.taken).toBe(0);
    });

    it('翻滚无敌：落点不造成伤害', () => {
        const player = { x: 100, y: 100, state: 'roll', taken: 0, takeDamage(d) { this.taken += d; } };
        const ws = makeWorld(player);
        ws.spawnDelayedAoe({ x: 100, y: 100, radius: 36, delay: 1, warnFrames: 1, damage: 10 });
        ws.updateGroundHazards();
        expect(player.taken).toBe(0);
    });
});
