// tests/mutant-beast.test.js
// F1 Boss（变异巨兽）弹幕化重做的纯逻辑测试：怒吼环形弹 + 冷却、P3 唤潮上限、落石延迟结算、横扫弹幕波。
// 构造函数已守卫 document（node 下 _overlayCtx=null），可直接 new。draw() 不在测试路径。
import './helpers/canvasStub.js'; // 必须先于导入 MutantBeast（其链上 Assets 会实例化 PixelDraw）
import { describe, it, expect } from 'vitest';
import { MutantBeast, MUTANT_BEAST_TUNING as T } from '../src/core/entities/MutantBeast.js';

function makeBulletCS() {
    const bullets = [];
    return {
        bullets,
        camera: { x: 0, y: 0 },
        spawnEnemyBullet: (b) => bullets.push(b)
    };
}

function makeSlamCS() {
    const slams = [];
    return {
        slams,
        camera: { x: 0, y: 0 },
        spawnGroundSlam: (...args) => slams.push(args)
    };
}

describe('变异巨兽 — 怒吼环形弹幕', () => {
    it('前摇结束帧放 10-12 发环形弹，单发伤害 8、owner 为 Boss', () => {
        const boss = new MutantBeast(0, 0);
        const cs = makeBulletCS();
        boss.combatSystem = cs;
        boss.startAttack('roar_ring', { x: 100, y: 0 });

        // 前摇期间不发射
        boss.executeRoarRing({ x: 100, y: 0 }, T.ROAR_WINDUP - 1, cs);
        expect(cs.bullets.length).toBe(0);

        // 前摇结束帧齐射
        boss.executeRoarRing({ x: 100, y: 0 }, T.ROAR_WINDUP, cs);
        expect(cs.bullets.length).toBeGreaterThanOrEqual(T.ROAR_MIN);
        expect(cs.bullets.length).toBeLessThanOrEqual(T.ROAR_MAX);
        for (const b of cs.bullets) {
            expect(b.owner).toBe(boss);
            expect(b.damage).toBe(T.BULLET_DMG);
            expect(b.damage).toBeLessThanOrEqual(12); // 弹幕单发红线
            expect(b.speed).toBe(T.BULLET_SPEED);
        }
    });

    it('起手即锁定独立冷却，同一次吼不二次齐射', () => {
        const boss = new MutantBeast(0, 0);
        const cs = makeBulletCS();
        boss.combatSystem = cs;
        boss.startAttack('roar_ring', { x: 100, y: 0 });
        expect(boss.roarCooldown).toBe(T.ROAR_COOLDOWN);

        boss.executeRoarRing({ x: 100, y: 0 }, T.ROAR_WINDUP, cs);
        const fired = cs.bullets.length;
        // 再次到达同帧不应重复齐射（_roarFired 已置位）
        boss.executeRoarRing({ x: 100, y: 0 }, T.ROAR_WINDUP, cs);
        expect(cs.bullets.length).toBe(fired);
    });

    it('环形角度均匀铺满一整圈', () => {
        const boss = new MutantBeast(0, 0);
        const cs = makeBulletCS();
        boss.fireRing(cs, 12);
        expect(cs.bullets.length).toBe(12);
        // 环形：12 发角度均匀覆盖四象限（cos/sin 分量正负齐全）
        expect(cs.bullets.some(b => Math.cos(b.angle) > 0.5)).toBe(true);
        expect(cs.bullets.some(b => Math.cos(b.angle) < -0.5)).toBe(true);
        expect(cs.bullets.some(b => Math.sin(b.angle) > 0.5)).toBe(true);
        expect(cs.bullets.some(b => Math.sin(b.angle) < -0.5)).toBe(true);
    });
});

describe('变异巨兽 — 横扫弹幕波（P2）', () => {
    it('三连发共 15 发，每波 5 发扇形；中间弹朝玩家', () => {
        const boss = new MutantBeast(0, 0);
        boss.phase = 2;
        const cs = makeBulletCS();
        boss.combatSystem = cs;
        boss.startAttack('sweep_barrage', { x: 0, y: 100 }); // 玩家正下方 → aim ≈ PI/2

        const cfg = boss.attacks.sweep_barrage;
        for (let w = 0; w < T.BARRAGE_WAVES; w++) {
            boss.executeSweepBarrage({ x: 0, y: 100 }, cfg.windup + w * T.BARRAGE_WAVE_GAP, cs);
        }
        expect(cs.bullets.length).toBe(T.BARRAGE_WAVES * T.BARRAGE_PER_WAVE);

        // 波数上限：超出不再发
        boss.executeSweepBarrage({ x: 0, y: 100 }, cfg.windup + T.BARRAGE_WAVES * T.BARRAGE_WAVE_GAP, cs);
        expect(cs.bullets.length).toBe(T.BARRAGE_WAVES * T.BARRAGE_PER_WAVE);

        expect(boss.barrageCooldown).toBe(T.BARRAGE_COOLDOWN);
    });
});

describe('变异巨兽 — 落石预警延迟结算', () => {
    it('预警圈倒计时归零那一帧才落石（AoE 伤 12 / 半径 40）', () => {
        const boss = new MutantBeast(0, 0);
        const cs = makeSlamCS();
        boss.scheduleRockfalls(50, 50, T.ROCKFALL_COUNT);
        expect(boss.rockfalls.length).toBe(T.ROCKFALL_COUNT);

        // 预警窗口内不结算
        for (let i = 0; i < T.ROCKFALL_WARN - 1; i++) boss.updateRockfalls(cs);
        expect(cs.slams.length).toBe(0);
        expect(boss.rockfalls.length).toBe(T.ROCKFALL_COUNT);

        // 归零帧全部落石
        boss.updateRockfalls(cs);
        expect(cs.slams.length).toBe(T.ROCKFALL_COUNT);
        expect(boss.rockfalls.length).toBe(0);

        // spawnGroundSlam(x, y, damage, radius, knockback, color)
        const [, , dmg, radius] = cs.slams[0];
        expect(dmg).toBe(T.ROCKFALL_DMG);
        expect(radius).toBe(T.ROCKFALL_RADIUS);
    });
});

describe('变异巨兽 — P3 唤潮上限', () => {
    function makeWorld() {
        const spawned = [];
        return {
            spawned,
            spawnEnemy: (type, opts) => {
                const m = { hp: 10, spawnType: type, x: opts.x, y: opts.y };
                spawned.push(m);
                return m;
            }
        };
    }

    it('每波唤起 2 只，房内小怪不超过 6', () => {
        const boss = new MutantBeast(0, 0);
        boss.worldSystem = makeWorld();

        expect(boss.summonHordeWave()).toBe(T.HORDE_BATCH); // 波1 → 2
        expect(boss.summonHordeWave()).toBe(T.HORDE_BATCH); // 波2 → 4
        expect(boss.summonHordeWave()).toBe(T.HORDE_BATCH); // 波3 → 6（满）
        expect(boss.summonedMinions.length).toBe(T.HORDE_CAP);

        // 满员：不再唤起
        expect(boss.summonHordeWave()).toBe(0);
        expect(boss.summonedMinions.length).toBe(T.HORDE_CAP);
    });

    it('小怪死亡后腾出名额可继续唤潮', () => {
        const boss = new MutantBeast(0, 0);
        boss.worldSystem = makeWorld();
        boss.summonedMinions = Array.from({ length: T.HORDE_CAP }, () => ({ hp: 10 }));

        expect(boss.summonHordeWave()).toBe(0); // 满员

        // 杀掉 3 只
        boss.summonedMinions[0].hp = 0;
        boss.summonedMinions[1].hp = 0;
        boss.summonedMinions[2].hp = 0;

        // 仅剩 3 只存活，可补 2（batch）
        expect(boss.summonHordeWave()).toBe(T.HORDE_BATCH);
        expect(boss.summonedMinions.length).toBe(5);
    });

    it('唤起类型取自人潮池（wraith/plague_rat）', () => {
        const boss = new MutantBeast(0, 0);
        const world = makeWorld();
        boss.worldSystem = world;
        boss.summonHordeWave();
        for (const m of world.spawned) {
            expect(T.HORDE_POOL).toContain(m.spawnType);
        }
    });
});

describe('变异巨兽 — 相位与承伤红线不变', () => {
    it('HP 900 / dpsCap 26 / 阈值 0.6、0.25 保持', () => {
        const boss = new MutantBeast(0, 0);
        expect(boss.maxHp).toBe(900);
        expect(boss.dpsCap).toBe(26);
        expect(boss.phaseMarkers).toEqual([0.6, 0.25]);
    });

    it('转阶段挂起演出标记 + 提速（P3 → 0.75）', () => {
        const boss = new MutantBeast(0, 0);
        boss.hp = boss.maxHp * 0.5; // 落入 P2
        boss.checkPhaseTransition();
        expect(boss.phase).toBe(2);
        expect(boss.speed).toBe(0.7);
        expect(boss.isTransitioning).toBe(true);
        expect(boss._transitionFxPending).toBe(true);

        boss.hp = boss.maxHp * 0.2; // 落入 P3
        boss.checkPhaseTransition();
        expect(boss.phase).toBe(3);
        expect(boss.speed).toBe(0.75);
    });
});
