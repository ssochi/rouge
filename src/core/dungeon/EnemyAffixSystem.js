// EnemyAffixSystem —— 精英词缀：生成时对敌人实例施加 1-2 个词缀。
// 实现方式为实例级包装（takeDamage/update monkey-patch），零基类侵入、对所有敌人类型通用。
// 精英视觉（体型 1.15×/光环/词缀名）由 Renderer 按 isElite/eliteScale/affixIds 绘制；
// 精英掉落加成（金币 ×3 + 钥匙）在 WorldSystem.updateEnemies 死亡清扫处理。

export const AFFIXES = {
    swift: {
        name: '迅捷',
        color: '#4fc3f7',
        apply(enemy) {
            enemy.speed *= 1.4;
        }
    },
    stalwart: {
        name: '坚韧',
        color: '#ffd54f',
        apply(enemy) {
            enemy.affixShield = Math.round(enemy.maxHp * 0.5);
            enemy.affixShieldMax = enemy.affixShield;
        }
    },
    scorching: {
        name: '灼热',
        color: '#ff7043'
        // 近身灼烧光环 + 死亡爆燃（钩子处理）
    },
    soulrend: {
        name: '裂魂',
        color: '#ba68c8'
        // 死亡 8 向弹幕（钩子处理）
    },
    regenerating: {
        name: '再生',
        color: '#81c784'
        // 脱战回血（钩子处理）
    }
};

export const AFFIX_IDS = Object.keys(AFFIXES);

const REGEN_IDLE_FRAMES = 180;   // 3s 未受击开始回血
const REGEN_TICK_FRAMES = 60;    // 每秒一跳
const REGEN_RATIO = 0.02;
const SCORCH_AURA_RANGE = 44;
const SCORCH_AURA_INTERVAL = 45;
const SCORCH_AURA_DAMAGE = 3;
const SCORCH_DEATH_DAMAGE = 8;
const SCORCH_DEATH_RADIUS = 48;
const SOULREND_BULLETS = 8;

/**
 * 随机抽取 count 个不重复词缀 id。
 */
export function pickRandomAffixes(count, rng = Math.random) {
    const pool = [...AFFIX_IDS];
    const out = [];
    while (out.length < count && pool.length > 0) {
        const idx = Math.floor(rng() * pool.length);
        out.push(pool.splice(idx, 1)[0]);
    }
    return out;
}

/**
 * 对敌人实例施加词缀（应在楼层数值缩放之后调用）。
 * @returns 传入的 enemy（链式便利）
 */
export function applyAffixes(enemy, affixIds) {
    if (!enemy || !affixIds || affixIds.length === 0) return enemy;

    enemy.isElite = true;
    enemy.affixIds = [...affixIds];
    enemy.eliteScale = 1.15;
    enemy._affixFrame = 0;
    enemy._affixLastHitFrame = -9999;
    enemy._affixDeathTriggered = false;

    for (const id of affixIds) {
        const affix = AFFIXES[id];
        if (affix && affix.apply) affix.apply(enemy);
    }

    const has = (id) => enemy.affixIds.includes(id);

    // ── takeDamage 包装：坚韧护盾 / 再生计时 / 死亡词缀触发 ──
    const origTakeDamage = enemy.takeDamage.bind(enemy);
    enemy.takeDamage = (amount, knockback) => {
        enemy._affixLastHitFrame = enemy._affixFrame;

        if (enemy.affixShield > 0) {
            // 坚韧：破盾前伤害减半且全部由护盾承担
            const reduced = Math.max(1, Math.round(amount * 0.5));
            enemy.affixShield = Math.max(0, enemy.affixShield - reduced);
            origTakeDamage(0, knockback); // 保留受击反馈（闪白/血条计时/击退）
        } else {
            origTakeDamage(amount, knockback);
        }

        if (enemy.hp <= 0 && !enemy._affixDeathTriggered) {
            enemy._affixDeathTriggered = true;
            onAffixDeath(enemy, has);
        }
    };

    // ── update 包装：捕获 combatSystem/player 引用 + 周期词缀效果 ──
    const origUpdate = enemy.update.bind(enemy);
    enemy.update = (...args) => {
        enemy._affixFrame++;
        if (args[0]) enemy._affixPlayer = args[0];
        if (args[6]) enemy._affixCombatSystem = args[6];
        origUpdate(...args);
        affixTick(enemy, has);
    };

    return enemy;
}

function affixTick(enemy, has) {
    if (enemy.hp <= 0) return;

    // 再生：脱战 3s 后每秒回 2% maxHp
    if (has('regenerating')) {
        const idle = enemy._affixFrame - enemy._affixLastHitFrame;
        if (idle > REGEN_IDLE_FRAMES && enemy._affixFrame % REGEN_TICK_FRAMES === 0) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.ceil(enemy.maxHp * REGEN_RATIO));
        }
    }

    // 灼热：近身灼烧光环
    if (has('scorching') && enemy._affixPlayer && enemy._affixFrame % SCORCH_AURA_INTERVAL === 0) {
        const p = enemy._affixPlayer;
        if (p.state !== 'roll' && p.state !== 'driving') {
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            if (dx * dx + dy * dy < SCORCH_AURA_RANGE * SCORCH_AURA_RANGE && p.takeDamage) {
                const a = Math.atan2(dy, dx);
                p.takeDamage(SCORCH_AURA_DAMAGE, { x: Math.cos(a) * 2, y: Math.sin(a) * 2 });
            }
        }
    }
}

function onAffixDeath(enemy, has) {
    const cs = enemy._affixCombatSystem;
    if (!cs) return;

    // 裂魂：8 向弹幕爆发
    if (has('soulrend') && cs.spawnEnemyBullet) {
        for (let i = 0; i < SOULREND_BULLETS; i++) {
            const angle = (i / SOULREND_BULLETS) * Math.PI * 2;
            cs.spawnEnemyBullet({
                x: enemy.x,
                y: enemy.y,
                angle,
                damage: 7,
                speed: 3.2,
                color: '#ba68c8',
                size: 4,
                life: 100,
                owner: enemy
            });
        }
    }

    // 灼热：死亡爆燃
    if (has('scorching') && cs.spawnExplosion) {
        cs.spawnExplosion(enemy.x, enemy.y, SCORCH_DEATH_DAMAGE, SCORCH_DEATH_RADIUS, 3);
    }
}
