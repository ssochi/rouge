// tests/depth-batch-enemies.test.js
// 机制型敌人 ×4 核心机制单测：盗宝地精偷钱与掉落翻倍/遁走、复生亡灵仅复活一次与补刀、
// 电弧双子狂暴触发与电弧判伤、掘地虫潜地无敌。
// 注意：canvasStub 必须最先导入（满足帧模块的 Canvas 依赖）。
import './helpers/canvasStub.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { LootGoblin } from '../src/core/entities/LootGoblin.js';
import { Revenant } from '../src/core/entities/Revenant.js';
import { ArcTwin } from '../src/core/entities/ArcTwin.js';
import { Burrower } from '../src/core/entities/Burrower.js';

function makePlayer(x = 9999, y = 9999) {
    return { x, y, state: 'idle', damageTaken: 0, takeDamage(d) { this.damageTaken += d; } };
}
const combat = () => ({ particles: [], spawnGroundSlam() {}, spawnExplosion() {} });

// 以默认参数驱动一次 update（moveResolver 直接落位，避免依赖导航网格）。
function tick(enemy, player, cs) {
    enemy.update(
        player, [], null, null, null, null, cs,
        (e, nx, ny) => { e.x = nx; e.y = ny; }
    );
}

describe('盗宝地精 LootGoblin', () => {
    it('偷窃从运行状态扣钱并累计所偷；不超过现有金币', () => {
        const g = new LootGoblin(0, 0);
        const runState = { active: true, coins: 20 };
        const got = g._trySteal(runState);
        expect(got).toBeGreaterThanOrEqual(3);
        expect(got).toBeLessThanOrEqual(6);
        expect(runState.coins).toBe(20 - got);
        expect(g.stolenCoins).toBe(got);

        // 金币不足时最多偷现有
        const poor = { active: true, coins: 2 };
        const got2 = g._trySteal(poor);
        expect(got2).toBeLessThanOrEqual(2);
        expect(poor.coins).toBe(2 - got2);
    });

    it('死亡金币 = 所偷 ×2 + 固定 5 奖励（翻倍）', () => {
        const g = new LootGoblin(0, 0);
        expect(g.getDungeonCoinValue()).toBe(5); // 未偷仍有奖励
        g.stolenCoins = 8;
        expect(g.getDungeonCoinValue()).toBe(8 * 2 + 5);
    });

    it('偷满阈值后进入钻地并最终标记 escaped（无掉落移除）', () => {
        const g = new LootGoblin(200, 200);
        g.stolenCoins = 10; // 达到遁走阈值
        const player = makePlayer(0, 0); // 远离，避免偷窃干扰
        const cs = combat();
        tick(g, player, cs);
        expect(g.phase).toBe('burrow');
        for (let i = 0; i < 60; i++) tick(g, player, cs);
        expect(g.escaped).toBe(true);
    });
});

describe('复生亡灵 Revenant', () => {
    let cs, player;
    beforeEach(() => { cs = combat(); player = makePlayer(); });

    it('首次致死变尸体（不真死、hp>0 以跳过掉落）；超时半血复活并加速', () => {
        const r = new Revenant(0, 0);
        r.combatSystem = cs;
        r.takeDamage(40, { x: 0, y: 0 });
        expect(r.isCorpse).toBe(true);
        expect(r.hp).toBeGreaterThan(0);        // 关键：死亡清扫据此跳过 onKill/掉落
        expect(r.corpseHp).toBe(15);

        // 尸体阶段推进到复活
        for (let i = 0; i < 190; i++) tick(r, player, cs);
        expect(r.hasRevived).toBe(true);
        expect(r.isCorpse).toBe(false);
        expect(r.hp).toBe(Math.round(40 * 0.5));
        expect(r.speed).toBeCloseTo(1.4 * 1.2);
    });

    it('仅复活一次：复活后再次致死为真死，不再成尸', () => {
        const r = new Revenant(0, 0);
        r.combatSystem = cs;
        r.takeDamage(40);
        for (let i = 0; i < 190; i++) tick(r, player, cs);
        expect(r.hasRevived).toBe(true);
        r.takeDamage(999);
        expect(r.hp).toBeLessThanOrEqual(0);
        expect(r.isCorpse).toBe(false);
    });

    it('补刀尸体（打碎尸体 HP）阻止复活并真死', () => {
        const r = new Revenant(0, 0);
        r.combatSystem = cs;
        r.takeDamage(40);
        expect(r.isCorpse).toBe(true);
        r.takeDamage(15); // 打碎尸体
        expect(r.hp).toBeLessThanOrEqual(0);
        expect(r.isCorpse).toBe(false);
        expect(r.hasRevived).toBe(false); // 未复活即真死
    });
});

describe('电弧双子 ArcTwin', () => {
    function makePair() {
        const a = new ArcTwin(0, 0);
        const b = new ArcTwin(100, 0);
        a.setTwinIdentity(0, b);
        b.setTwinIdentity(1, a);
        return { a, b };
    }

    it('成对身份：蓝(0)/紫(1)镜像 + 互相引用', () => {
        const { a, b } = makePair();
        expect(a.variant).toBe('blue');
        expect(b.variant).toBe('purple');
        expect(a.twin).toBe(b);
        expect(b.twin).toBe(a);
        expect(a._isArcMaster()).toBe(true);
        expect(b._isArcMaster()).toBe(false);
    });

    it('一只死亡 → 另一只狂暴（速度 ×1.4、攻击间隔 ×0.7、电弧消失）', () => {
        const { a, b } = makePair();
        b.hp = 0; // 伴生体死亡
        const player = makePlayer(9999, 9999);
        tick(a, player, combat());
        expect(a.enraged).toBe(true);
        expect(a.speed).toBeCloseTo(1.5 * 1.4);
        expect(a.touchCdMax).toBe(Math.round(52 * 0.7));
        expect(a.twin).toBeNull();
        expect(a.arcActive).toBe(false);
    });

    it('电弧命中：玩家处于双子连线上时受 8 伤', () => {
        const { a, b } = makePair();
        const player = makePlayer(50, 0); // 位于 (0,0)-(100,0) 连线中点
        a._arcDamage(player);
        expect(player.damageTaken).toBe(8);
    });

    it('电弧断开：间距过大时 master 不产生电弧', () => {
        const a = new ArcTwin(0, 0);
        const b = new ArcTwin(2000, 0); // 远超 12 tiles
        a.setTwinIdentity(0, b);
        b.setTwinIdentity(1, a);
        const player = makePlayer(9999, 9999);
        tick(a, player, combat());
        expect(a.arcActive).toBe(false);
    });
});

describe('掘地虫 Burrower', () => {
    it('潜地/预警阶段无敌：hurtbox 为空且 takeDamage 无效；露头后可受伤', () => {
        const b = new Burrower(0, 0);
        expect(b.phase).toBe('submerged');
        expect(b.getBulletHurtbox()).toBeNull();
        b.takeDamage(100, { x: 0, y: 0 });
        expect(b.hp).toBe(45); // 潜地无敌

        b.phase = 'exposed';
        expect(b.getBulletHurtbox()).not.toBeNull();
        b.takeDamage(25, { x: 0, y: 0 });
        expect(b.hp).toBe(20);
    });

    it('完整循环：潜地→预警→出土(触发 AoE)→露头，进入可打窗口', () => {
        const b = new Burrower(0, 0);
        const player = makePlayer(300, 0);
        let aoeCalls = 0;
        const cs = { particles: [], spawnGroundSlam() { aoeCalls++; }, spawnExplosion() {} };
        // 潜地 150 + 预警 36 帧后应破土露头
        for (let i = 0; i < 150 + 36 + 1; i++) tick(b, player, cs);
        expect(b.phase).toBe('exposed');
        expect(aoeCalls).toBe(1); // 出土 AoE 恰触发一次
    });

    it('潜地进入时清空控制/DOT（免疫控制）', () => {
        const b = new Burrower(0, 0);
        b.phase = 'exposed';
        b.frozenTimer = 60;
        b.burnTimer = 60;
        b._enterPhase('submerged');
        expect(b.frozenTimer).toBe(0);
        expect(b.burnTimer).toBe(0);
    });
});
