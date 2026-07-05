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

    // ── P8 新增遗物 ──

    it('tycoon_ring：伤害随持有金币阶梯提升并封顶 +30%', () => {
        rs.addRelic('tycoon_ring');
        runState.coins = 0;
        expect(rs.damageMult()).toBeCloseTo(1);
        runState.coins = 100; // floor(100/25)=4 → +8%
        expect(rs.damageMult()).toBeCloseTo(1.08);
        runState.coins = 1000; // 阶梯超上限 → +30%
        expect(rs.damageMult()).toBeCloseTo(1.30);
    });

    it('stoneskin_charm：受伤 -15% 且保底 1 点，未持有原样返回', () => {
        expect(rs.mitigateDamage(10)).toBe(10); // 未持有
        rs.addRelic('stoneskin_charm');
        expect(rs.mitigateDamage(10)).toBeCloseTo(8.5);
        expect(rs.mitigateDamage(1)).toBe(1); // 原伤害 ≤1 不再削减
    });

    it('windrunner_cloak：翻滚结束下降沿触发移速 buff 并随时间衰减', () => {
        rs.addRelic('windrunner_cloak');
        player.state = 'roll';
        rs.tick();               // prev null→roll，不触发
        expect(rs.moveSpeedMult()).toBeCloseTo(1);
        player.state = 'idle';
        rs.tick();               // roll→idle 下降沿，触发移速 buff
        expect(rs.moveSpeedMult()).toBeCloseTo(1.25);
        for (let i = 0; i < 90; i++) rs.tick(); // buff 衰减
        expect(rs.moveSpeedMult()).toBeCloseTo(1);
    });

    it('abyss_echo：坠坑坠杀回血且封顶，未持有返回 0', () => {
        player.hp = 50;
        expect(rs.onPitKill()).toBe(0); // 未持有
        expect(player.hp).toBe(50);
        rs.addRelic('abyss_echo');
        expect(rs.onPitKill()).toBe(4);
        expect(player.hp).toBe(54);
        player.hp = 99;
        rs.onPitKill();
        expect(player.hp).toBe(100); // 不超过 maxHp
    });

    it('momentum_totem：连续击杀叠加伤害层数、封顶 6 层、无击杀衰减清空', () => {
        rs.addRelic('momentum_totem');
        expect(rs.damageMult()).toBeCloseTo(1);
        rs.onKill(0, 0, () => 0.99);
        rs.onKill(0, 0, () => 0.99);
        expect(rs.damageMult()).toBeCloseTo(1 + 2 * 0.04); // 2 层 → +8%
        for (let i = 0; i < 10; i++) rs.onKill(0, 0, () => 0.99);
        expect(rs.damageMult()).toBeCloseTo(1 + 6 * 0.04); // 封顶 6 层 → +24%
        for (let i = 0; i < 151; i++) rs.tick();
        expect(rs.damageMult()).toBeCloseTo(1); // 超时清空
    });

    it('war_horn：波次刷新后开火间隔 -25% 并随时间衰减', () => {
        rs.addRelic('war_horn');
        expect(rs.fireIntervalMult()).toBeCloseTo(1);
        rs.onWaveSpawned([]);
        expect(rs.fireIntervalMult()).toBeCloseTo(0.75);
        for (let i = 0; i < 150; i++) rs.tick();
        expect(rs.fireIntervalMult()).toBeCloseTo(1);
    });

    it('collector_eye：暴击率随持有遗物数量增长并封顶 +20%', () => {
        rs.addRelic('collector_eye');
        expect(rs.critChance()).toBeCloseTo(0.015); // 1 件遗物
        rs.addRelic('lucky_dice'); // +0.1 固定暴击，共 2 件
        expect(rs.critChance()).toBeCloseTo(0.1 + 2 * 0.015);
        // 堆到 14 件遗物 → 收藏暴击封顶 0.20
        for (const id of ['swift_boots', 'rapid_gloves', 'power_core', 'vital_heart',
            'magnet_ring', 'golden_fleece', 'swift_quiver', 'giant_belt', 'abyss_eye',
            'vampiric_crown', 'thorn_mail', 'chrono_watch']) {
            rs.addRelic(id);
        }
        expect(runState.relicIds.length).toBe(14);
        expect(rs.critChance()).toBeCloseTo(0.1 + 0.20); // 收藏部分封顶 + lucky_dice
    });

    it('energy_barrier：拾取即充能一层，抵挡后经冷却重新充能', () => {
        rs.addRelic('energy_barrier');
        let blocks = 0;
        rs.setBarrierBlockHandler(() => blocks++);
        expect(rs.mitigateDamage(20)).toBe(0); // 满层护罩完全抵挡
        expect(blocks).toBe(1);
        expect(rs.mitigateDamage(20)).toBe(20); // 已消耗，本次不抵挡
        for (let i = 0; i < 480; i++) rs.tick(); // 8 秒冷却充能
        expect(rs.mitigateDamage(20)).toBe(0);
        expect(blocks).toBe(2);
    });

    // ── P9 新增遗物 ──

    it('ghost_rounds：每第 7 发子弹化为幽灵弹（phaseThrough + 伤害 ×2 + 蓝光）', () => {
        rs.addRelic('ghost_rounds');
        let ghostSeen = null;
        for (let i = 1; i <= 7; i++) {
            const b = { damage: 50, size: 4, piercing: 0, type: 'standard' };
            rs.modifyPlayerBullet(b, () => 0.99); // 不触发随机暴击
            if (i < 7) {
                expect(b.phaseThrough).toBeUndefined();
                expect(b.damage).toBe(50);
            } else {
                ghostSeen = b;
            }
        }
        expect(ghostSeen.phaseThrough).toBe(true);
        expect(ghostSeen.ghostRelic).toBe(true);
        expect(ghostSeen.color).toBe('#4db8ff');
        expect(ghostSeen.damage).toBe(100); // 50 × 2
    });

    it('doomsday_watch：每 8 秒（480 帧）备好一次保证暴击，命中下一发即消耗', () => {
        rs.addRelic('doomsday_watch');
        const before = { damage: 40, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(before, () => 0.99); // 未充能，普通伤害
        expect(before.damage).toBe(40);
        for (let i = 0; i < 480; i++) rs.tick();
        const crit = { damage: 40, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(crit, () => 0.99); // 保证暴击
        expect(crit.isCrit).toBe(true);
        expect(crit.damage).toBe(80);
        const next = { damage: 40, size: 4, piercing: 0, type: 'standard' };
        rs.modifyPlayerBullet(next, () => 0.99); // 已消耗，恢复普通
        expect(next.damage).toBe(40);
    });

    it('coin_ward：持币 ≥5 且冷却就绪时散币免伤，冷却内不再触发，币不足不触发', () => {
        rs.addRelic('coin_ward');
        let drops = 0;
        rs.setCoinDropHandler(() => drops++);
        runState.coins = 10;
        expect(rs.mitigateDamage(20)).toBe(0); // 触发免伤
        expect(drops).toBe(1);
        expect(runState.coins).toBe(5); // 散落 5 金币
        expect(rs.mitigateDamage(20)).toBe(20); // 冷却内正常受伤
        for (let i = 0; i < 180; i++) rs.tick();
        runState.coins = 4; // 币不足
        expect(rs.mitigateDamage(20)).toBe(20);
        expect(drops).toBe(1);
    });

    it('fate_dice：进房随机掷出增益并生效，离房（再次进房）重掷/清空', () => {
        rs.addRelic('fate_dice');
        // rng=0 → 'damage'
        expect(rs.onRoomEnter(() => 0)).toBe('damage');
        expect(rs.damageMult()).toBeCloseTo(1.25);
        // rng≈0.3 → 'speed'（清空上一房 damage）
        expect(rs.onRoomEnter(() => 0.3)).toBe('speed');
        expect(rs.damageMult()).toBeCloseTo(1);
        expect(rs.moveSpeedMult()).toBeCloseTo(1.2);
        // rng≈0.6 → 'crit'
        expect(rs.onRoomEnter(() => 0.6)).toBe('crit');
        expect(rs.critChance()).toBeCloseTo(0.15);
        // rng≈0.9 → 'shield'，在 mitigateDamage 完全抵挡一次
        expect(rs.onRoomEnter(() => 0.9)).toBe('shield');
        expect(rs.mitigateDamage(30)).toBe(0);
        expect(rs.mitigateDamage(30)).toBe(30); // 护盾已消耗
    });

    it('tesla_coil：静止蓄能满后周期放电，移动重置蓄能', () => {
        player.x = 100; player.y = 100;
        rs.addRelic('tesla_coil');
        let zaps = 0;
        rs.setTeslaHandler(() => zaps++);
        // 静止蓄能满 60 帧（1s）即首次放电，之后每 48 帧（0.8s）一次
        for (let i = 0; i < 60; i++) rs.tick();
        expect(zaps).toBe(1);
        for (let i = 0; i < 48; i++) rs.tick();
        expect(zaps).toBe(2);
        // 移动：重置蓄能，短时间内不再放电
        player.x = 200;
        rs.tick();
        for (let i = 0; i < 40; i++) { player.x += 5; rs.tick(); }
        expect(zaps).toBe(2);
    });

    it('orbit_blade：tick 推进旋转角，命中冷却 0.5 秒内同敌不重复', () => {
        rs.addRelic('orbit_blade');
        const a0 = rs.orbitBladeAngle();
        rs.tick();
        expect(rs.orbitBladeAngle()).toBeGreaterThan(a0);
        const enemy = { id: 'e1' };
        expect(rs.orbitBladeCanHit(enemy)).toBe(true);  // 首次命中
        expect(rs.orbitBladeCanHit(enemy)).toBe(false); // 冷却内
        for (let i = 0; i < 30; i++) rs.tick();
        expect(rs.orbitBladeCanHit(enemy)).toBe(true);  // 冷却结束
    });

    it('reaper_echo：击杀概率迸发亡魂弹（rng 注入）', () => {
        rs.addRelic('reaper_echo');
        let bursts = 0;
        rs.setSoulBurstHandler(() => bursts++);
        rs.onKill(10, 10, () => 0.05); // < 0.12 触发
        expect(bursts).toBe(1);
        rs.onKill(10, 10, () => 0.5);  // 不触发
        expect(bursts).toBe(1);
    });

    it('shell_reclaim：击杀概率返还弹药（rng 注入）', () => {
        rs.addRelic('shell_reclaim');
        let refunds = 0;
        rs.setAmmoRefundHandler(() => refunds++);
        rs.onKill(0, 0, () => 0.1);  // < 0.2 触发
        expect(refunds).toBe(1);
        rs.onKill(0, 0, () => 0.5);  // 不触发
        expect(refunds).toBe(1);
    });

    it('time_hourglass：出怪时冻结新生成敌人，未持有不改动', () => {
        const enemies = [{ frozenTimer: 0 }, { frozenTimer: 0 }];
        rs.onWaveSpawned(enemies);
        expect(enemies[0].frozenTimer).toBe(0); // 未持有
        rs.addRelic('time_hourglass');
        rs.onWaveSpawned(enemies);
        for (const e of enemies) expect(e.frozenTimer).toBe(120);
    });

    it('safe_vault：每局一次死亡半血复活并置灰，第二次不触发', () => {
        rs.addRelic('safe_vault');
        let revives = 0;
        rs.setReviveHandler(() => revives++);
        player.hp = 0;
        expect(rs.isRelicDepleted('safe_vault')).toBe(false);
        expect(rs.tryRevive()).toBe(true);
        expect(player.hp).toBe(50); // ceil(100 × 0.5)
        expect(revives).toBe(1);
        expect(rs.isRelicDepleted('safe_vault')).toBe(true);
        player.hp = 0;
        expect(rs.tryRevive()).toBe(false); // 本局已用
    });

    it('blood_pact：金币不足以血补差额，会致死时拒绝', () => {
        rs.addRelic('blood_pact');
        runState.coins = 3;
        player.hp = 100;
        // 价格 10，差额 7 → 14 HP；扣光 3 金 + 14 HP
        expect(rs.tryBloodPactPurchase(runState, 10)).toBe(true);
        expect(runState.coins).toBe(0);
        expect(player.hp).toBe(86);
        // 会致死：价格 100，差额 100 → 200 HP > 现有生命，拒绝且不改动
        runState.coins = 0;
        const hpBefore = player.hp;
        expect(rs.tryBloodPactPurchase(runState, 100)).toBe(false);
        expect(player.hp).toBe(hpBefore);
    });

    it('abyss_pact：拾取时随机献祭其他遗物并提供全能强化；无其他遗物无副作用', () => {
        // 有其他遗物：献祭一件
        rs.addRelic('power_core');
        rs.addRelic('swift_boots');
        rs.addRelic('abyss_pact', () => 0); // rng=0 → 献祭第一件（power_core）
        expect(runState.hasRelic('abyss_pact')).toBe(true);
        expect(runState.hasRelic('power_core')).toBe(false); // 已献祭
        expect(runState.hasRelic('swift_boots')).toBe(true);
        expect(rs.damageMult()).toBeCloseTo(1.45); // 全能强化（power_core 已被献祭）
        expect(rs.moveSpeedMult()).toBeCloseTo(1.15 * 1.45); // swift_boots × abyss

        // 无其他遗物：无副作用
        const runState2 = new DungeonRunState();
        runState2.start(1);
        const p2 = makePlayer();
        const rs2 = new RelicSystem({ runState: runState2, player: p2 });
        rs2.addRelic('abyss_pact', () => 0.9);
        expect(runState2.relicIds).toEqual(['abyss_pact']);
    });

    it('abyss_pact：献祭 vital_heart 时回退其 maxHp 加成', () => {
        player.hp = 100; player.maxHp = 100;
        rs.addRelic('vital_heart'); // +25 maxHp
        expect(player.maxHp).toBe(125);
        rs.addRelic('abyss_pact', () => 0); // 献祭 vital_heart
        expect(player.maxHp).toBe(100); // maxHp 回退
        expect(player.hp).toBeLessThanOrEqual(100);
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
