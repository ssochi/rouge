// tests/relic-system.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { RelicSystem } from '../src/core/dungeon/RelicSystem.js';
import { DungeonRunState } from '../src/core/dungeon/DungeonRunState.js';

function makePlayer(hp = 100, maxHp = 100) {
    return { hp, maxHp };
}

describe('RelicSystem', () => {
    let runState, player, rs;

    beforeEach(() => {
        runState = new DungeonRunState();
        runState.start(12345);
        player = makePlayer();
        rs = new RelicSystem({ runState, player });
    });

    it('无遗物时所有乘区为 1、加成为 0', () => {
        expect(rs.moveSpeedMult()).toBe(1);
        expect(rs.fireIntervalMult()).toBe(1);
        expect(rs.damageMult()).toBe(1);
        expect(rs.magnetMult()).toBe(1);
        expect(rs.critChance()).toBe(0);
        expect(rs.extraPellets()).toBe(0);
        expect(rs.bulletSizeMult()).toBe(1);
        expect(rs.piercingBonus()).toBe(0);
        expect(rs.bounceBonus()).toBe(0);
        expect(rs.roomClearCoinMult()).toBe(1);
    });

    it('addRelic 后乘区生效且 runState.relicIds 记录', () => {
        rs.addRelic('swift_boots');
        rs.addRelic('power_core');
        expect(rs.moveSpeedMult()).toBeCloseTo(1.15);
        expect(rs.damageMult()).toBeCloseTo(1.15);
        expect(runState.hasRelic('swift_boots')).toBe(true);
    });

    it('同名遗物不重复叠加', () => {
        rs.addRelic('power_core');
        rs.addRelic('power_core');
        expect(rs.damageMult()).toBeCloseTo(1.15);
    });

    it('多个伤害乘区相乘（power_core × heavy_caliber）', () => {
        rs.addRelic('power_core');
        rs.addRelic('heavy_caliber');
        expect(rs.damageMult()).toBeCloseTo(1.15 * 1.05);
    });

    it('vital_heart 拾取加 maxHp 并回血，clear 时回退', () => {
        player.hp = 60;
        rs.addRelic('vital_heart');
        expect(player.maxHp).toBe(125);
        expect(player.hp).toBe(85);
        rs.clear();
        expect(player.maxHp).toBe(100);
        expect(player.hp).toBeLessThanOrEqual(100);
    });

    it('berserker_totem 低血时才生效', () => {
        rs.addRelic('berserker_totem');
        player.hp = 80;
        expect(rs.damageMult()).toBe(1);
        expect(rs.fireIntervalMult()).toBe(1);
        player.hp = 20;
        expect(rs.damageMult()).toBeCloseTo(1.3);
        expect(rs.fireIntervalMult()).toBeCloseTo(0.8);
    });

    it('modifyPlayerBullet 注入弹道改造', () => {
        rs.addRelic('ember_rounds');
        rs.addRelic('piercing_tip');
        rs.addRelic('rubber_shell');
        rs.addRelic('heavy_caliber');
        const bullet = { damage: 100, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(bullet, () => 0.99); // rng 不触发暴击
        expect(bullet.burnDamage).toBe(2);
        expect(bullet.burnDuration).toBe(180);
        expect(bullet.piercing).toBe(1);
        expect(bullet.bounceCount).toBe(1);
        expect(bullet.maxBounces).toBe(1);
        expect(bullet.size).toBe(6);
        expect(bullet.damage).toBe(105); // 100 × 1.05
    });

    it('split_chamber 全弹丸伤害补偿 ×0.8', () => {
        rs.addRelic('split_chamber');
        expect(rs.extraPellets()).toBe(1);
        const bullet = { damage: 100, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(bullet, () => 0.99);
        expect(bullet.damage).toBe(80);
    });

    it('lucky_dice 暴击 roll ×2 伤害', () => {
        rs.addRelic('lucky_dice');
        const crit = { damage: 100, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(crit, () => 0.05); // roll < 0.1 → 暴击
        expect(crit.damage).toBe(200);
        expect(crit.isCrit).toBe(true);
        const normal = { damage: 100, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(normal, () => 0.5);
        expect(normal.damage).toBe(100);
    });

    it('onKill：leech_fang 概率回血（rng 注入）', () => {
        rs.addRelic('leech_fang');
        player.hp = 50;
        rs.onKill(0, 0, () => 0.05); // < 0.1 触发
        expect(player.hp).toBe(52);
        rs.onKill(0, 0, () => 0.99); // 不触发
        expect(player.hp).toBe(52);
    });

    it('onPlayerHit：reactive_plate 冲击波带 CD', () => {
        rs.addRelic('reactive_plate');
        let waves = 0;
        rs.setShockwaveHandler(() => waves++);
        rs.onPlayerHit();
        expect(waves).toBe(1);
        rs.onPlayerHit(); // CD 内不触发
        expect(waves).toBe(1);
        for (let i = 0; i < 181; i++) rs.tick();
        rs.onPlayerHit();
        expect(waves).toBe(2);
    });

    it('golden_idol / treasure_scope 查询', () => {
        expect(rs.chestDoubleRoll(() => 0.1)).toBe(false); // 未持有
        rs.addRelic('golden_idol');
        rs.addRelic('treasure_scope');
        expect(rs.roomClearCoinMult()).toBe(2);
        expect(rs.chestDoubleRoll(() => 0.1)).toBe(true);  // 0.1 < 0.2
        expect(rs.chestDoubleRoll(() => 0.5)).toBe(false);
    });

    // ── P7 新增遗物 ──

    it('modifyPlayerBullet 注入 giant_belt / swift_quiver / abyss_eye 弹道字段', () => {
        rs.addRelic('giant_belt');
        rs.addRelic('swift_quiver');
        rs.addRelic('abyss_eye');
        const bullet = { damage: 100, size: 4, piercing: 0, type: 'standard', vx: 10, vy: 0 };
        rs.modifyPlayerBullet(bullet, () => 0.99); // 不触发暴击
        expect(bullet.relicKnockback).toBe(8);      // 巨人腰带
        expect(bullet.firstStrikeMult).toBe(1.5);   // 深渊之眼
        expect(bullet.vx).toBeCloseTo(13);           // 迅捷箭袋 10 × 1.3
        expect(bullet.vy).toBeCloseTo(0);
    });

    it('golden_fleece 金币价值乘区 ×1.25', () => {
        expect(rs.coinValueMult()).toBe(1);
        rs.addRelic('golden_fleece');
        expect(rs.coinValueMult()).toBeCloseTo(1.25);
    });

    it('onCritHit：vampiric_crown 暴击回血且封顶，未持有返回 0', () => {
        player.hp = 50;
        expect(rs.onCritHit()).toBe(0); // 未持有
        expect(player.hp).toBe(50);
        rs.addRelic('vampiric_crown');
        expect(rs.onCritHit()).toBe(1);
        expect(player.hp).toBe(51);
        player.hp = 100;
        expect(rs.onCritHit()).toBe(1);
        expect(player.hp).toBe(100); // 不超过 maxHp
    });

    it('onWaveSpawned：chrono_watch 对新敌人施加减速，未持有不改动', () => {
        const enemies = [{ slowTimer: 0, slowAmount: 0 }, { slowTimer: 0, slowAmount: 0 }];
        rs.onWaveSpawned(enemies);
        expect(enemies[0].slowTimer).toBe(0); // 未持有

        rs.addRelic('chrono_watch');
        rs.onWaveSpawned(enemies);
        for (const e of enemies) {
            expect(e.slowTimer).toBe(180);
            expect(e.slowAmount).toBeCloseTo(0.3);
        }
    });

    it('onKill：bone_charm 概率返回额外金币（rng 注入）', () => {
        rs.addRelic('bone_charm');
        expect(rs.onKill(0, 0, () => 0.05).bonusCoin).toBe(1);  // < 0.15 触发
        expect(rs.onKill(0, 0, () => 0.99).bonusCoin).toBe(0);  // 不触发
    });

    it('onPlayerHit：thorn_mail 每次受击触发荆棘反射 handler', () => {
        rs.addRelic('thorn_mail');
        let bursts = 0;
        let conf = null;
        rs.setThornBurstHandler((c) => { bursts++; conf = c; });
        rs.onPlayerHit();
        expect(bursts).toBe(1);
        expect(conf.count).toBe(8);
        rs.onPlayerHit(); // 无冷却
        expect(bursts).toBe(2);
    });

    it('runState.end() 后效果消失（以 relicIds 为事实源）', () => {
        rs.addRelic('swift_boots');
        rs.addRelic('vital_heart');
        rs.clear();       // 清算（回退 maxHp）
        runState.end();   // relicIds 清空
        expect(rs.moveSpeedMult()).toBe(1);
        expect(player.maxHp).toBe(100);
    });
});
