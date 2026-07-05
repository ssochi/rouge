// PlagueRat —— 地牢瘟疫鼠：高速横移骚扰 + 接触撕咬 + 死亡喷毒。
// 脆皮快怪：远则逼近、近则绕身横移，死亡时对附近玩家施加中毒 DOT。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';
import { StrafeBehavior } from './behaviors/StrafeBehavior.js';

const TOUCH_DAMAGE = 5;
const TOUCH_RANGE = 20;
const TOUCH_COOLDOWN = 60;
const APPROACH_RANGE = 120;   // 距离玩家超过此值则改为逼近

const DEATH_POISON_RANGE = 40;
const POISON_DAMAGE = 3;
const POISON_DURATION = 150;
const POISON_TICK = 30;
const DEATH_BURST_FALLBACK = { damage: 3, radius: 36, knockback: 2 };

export class PlagueRat extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 8, 2.4);

        this.spriteScale = 1.1; // 体型略小
        this.chase = new ChaseBehavior();
        this.strafe = new StrafeBehavior({ interval: 40, jitter: 20, speedMult: 1.0 });
        this.touchCooldown = 0;
        this.attackAnimTimer = 0;
        this.poisonBurst = false; // 防重复触发死亡喷毒
        this.combatSystem = null;
        this._lastPlayer = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        if (this.hp <= 0 && !this.poisonBurst) {
            this.poisonBurst = true;
            this._deathPoison();
        }
    }

    /** 死亡喷毒：对范围内玩家接入中毒 DOT；无中毒管道则退化为小毒爆。 */
    _deathPoison() {
        const player = this._lastPlayer;
        const cs = this.combatSystem;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const inRange = dx * dx + dy * dy < DEATH_POISON_RANGE * DEATH_POISON_RANGE;
            const notImmune = player.state !== 'roll' && player.state !== 'driving';
            if (inRange && notImmune) {
                const se = cs && cs.statusEffects;
                if (se && typeof se.applyPoison === 'function') {
                    se.applyPoison(player, POISON_DAMAGE, POISON_DURATION, POISON_TICK);
                } else {
                    // 接入玩家中毒 DOT 管道（StatusEffectSystem.updatePoisonEffects 消费）
                    player.poisonDamage = POISON_DAMAGE;
                    player.poisonTickInterval = POISON_TICK;
                    player.poisonTickCounter = 0;
                    player.poisonTimer = Math.max(player.poisonTimer || 0, POISON_DURATION);
                }
                return;
            }
        }
        // 玩家不在范围/管道缺失时的兜底毒爆
        if (cs && cs.spawnExplosion) {
            cs.spawnExplosion(this.x, this.y, DEATH_BURST_FALLBACK.damage, DEATH_BURST_FALLBACK.radius, DEATH_BURST_FALLBACK.knockback);
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        this._lastPlayer = player;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;
        if (this.touchCooldown > 0) this.touchCooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;

        // 接触撕咬（带冷却）
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < TOUCH_RANGE * TOUCH_RANGE
            && this.touchCooldown <= 0
            && player.state !== 'roll' && player.state !== 'driving') {
            if (player.takeDamage) {
                const a = Math.atan2(dy, dx);
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                player.takeDamage(Math.round(TOUCH_DAMAGE * mult), {
                    x: Math.cos(a) * 4,
                    y: Math.sin(a) * 4
                });
            }
            this.touchCooldown = TOUCH_COOLDOWN;
            this.attackAnimTimer = 16;
        }

        const ctx = {
            enemy: this,
            player,
            walls,
            wallQuery,
            getFlowDirection,
            getNavDirection,
            moveResolver,
            combatSystem
        };

        // 远则逼近，近则绕身横移
        if (distSq > APPROACH_RANGE * APPROACH_RANGE) {
            this.chase.update(ctx);
        } else {
            this.strafe.update(ctx);
        }
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.plagueRat;
        if (!assets) return null;
        if (this.attackAnimTimer > 0) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);

        const frames = this._currentFrames();
        if (frames) {
            const frameIndex = Math.floor(this.animationTimer / 4) % frames.length; // 高频窜动
            ctx.drawImage(frames[frameIndex], -16, -16);

            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(frames[frameIndex], -16, -16);
                ctx.restore();
            }
        }
        ctx.restore();

        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        return []; // 贴地小兽不参与光照遮挡
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 18;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 18);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#9fbf5f';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
