// tests/enemy-affixes.test.js
// 精英词缀：数值效果、护盾、再生计时、死亡弹幕（Enemy 基类无 Canvas 依赖，可直接实例化）。
import { describe, it, expect } from 'vitest';
import { Enemy } from '../src/core/entities/Enemy.js';
import { AFFIXES, AFFIX_IDS, applyAffixes, pickRandomAffixes } from '../src/core/dungeon/EnemyAffixSystem.js';

function makeEnemy(hp = 100, speed = 1) {
    return new Enemy(0, 0, 20, 20, hp, speed);
}

describe('EnemyAffixSystem', () => {
    it('词缀表完备且抽取不重复', () => {
        expect(AFFIX_IDS.length).toBe(5);
        for (const id of AFFIX_IDS) {
            expect(AFFIXES[id].name).toBeTruthy();
            expect(AFFIXES[id].color).toMatch(/^#/);
        }
        const picked = pickRandomAffixes(3);
        expect(new Set(picked).size).toBe(3);
        expect(pickRandomAffixes(99).length).toBe(AFFIX_IDS.length);
    });

    it('迅捷：移速 ×1.4；施加词缀后带精英标记', () => {
        const e = applyAffixes(makeEnemy(100, 1), ['swift']);
        expect(e.speed).toBeCloseTo(1.4);
        expect(e.isElite).toBe(true);
        expect(e.eliteScale).toBeCloseTo(1.15);
        expect(e.affixIds).toEqual(['swift']);
    });

    it('坚韧：护盾 50% maxHp，破盾前伤害减半全进盾、HP 不掉', () => {
        const e = applyAffixes(makeEnemy(100), ['stalwart']);
        expect(e.affixShield).toBe(50);

        e.takeDamage(20); // 减半为 10 → 盾 40
        expect(e.affixShield).toBe(40);
        expect(e.hp).toBe(100);

        e.takeDamage(80); // 减半为 40 → 盾 0
        expect(e.affixShield).toBe(0);
        expect(e.hp).toBe(100);

        e.takeDamage(30); // 破盾后正常掉血
        expect(e.hp).toBe(70);
    });

    it('再生：脱战 3s 后每秒回 2% maxHp，受击重置计时', () => {
        const e = applyAffixes(makeEnemy(100), ['regenerating']);
        e.hp = 50;

        // 推进 181 帧（脱战阈值 180）后，逢 60 整数帧回血
        for (let i = 0; i < 300; i++) e.update(null, [], null);
        expect(e.hp).toBeGreaterThan(50);

        const healed = e.hp;
        e.takeDamage(1); // 受击重置
        for (let i = 0; i < 100; i++) e.update(null, [], null);
        expect(e.hp).toBe(healed - 1); // 100 帧内不回血
    });

    it('裂魂：死亡时 8 向弹幕（带 owner）', () => {
        const spawned = [];
        const cs = { spawnEnemyBullet: (b) => spawned.push(b), spawnExplosion: () => {} };
        const e = applyAffixes(makeEnemy(10), ['soulrend']);
        // 经 update 捕获 combatSystem 引用（第 7 参）
        e.update(null, [], null, null, null, null, cs, null);

        e.takeDamage(99);
        expect(e.hp).toBeLessThanOrEqual(0);
        expect(spawned.length).toBe(8);
        expect(spawned[0].owner).toBe(e);
        // 再次伤害不重复触发
        e.takeDamage(10);
        expect(spawned.length).toBe(8);
    });

    it('灼热：死亡爆燃触发 spawnExplosion', () => {
        let explosion = null;
        const cs = { spawnEnemyBullet: () => {}, spawnExplosion: (x, y, dmg, r) => { explosion = { x, y, dmg, r }; } };
        const e = applyAffixes(makeEnemy(10), ['scorching']);
        e.update(null, [], null, null, null, null, cs, null);
        e.takeDamage(99);
        expect(explosion).not.toBeNull();
        expect(explosion.r).toBe(48);
    });
});
