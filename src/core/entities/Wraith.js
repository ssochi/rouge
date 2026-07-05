// Wraith —— 地牢幽魂（囚魂）：快速浮游追踪 + 接触伤害 + 死亡怨爆。
// 低血高速的贴脸压力怪：填充 F1 前期节奏（替代僵尸的"填充怪"角色但更地牢感）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const TOUCH_DAMAGE = 8;
const TOUCH_RANGE = 22;
const TOUCH_COOLDOWN = 55;
const DEATH_BURST_DAMAGE = 4;
const DEATH_BURST_RADIUS = 34;

export class Wraith extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24, 26, 2.6);

        this.spriteScale = 1.3; // 体型与角色同级
        this.chase = new ChaseBehavior();
        this.touchCooldown = 0;
        this.attackAnimTimer = 0;
        this.exploded = false;
        this.combatSystem = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        // 死亡怨爆（小范围，近战收割的代价）
        if (this.hp <= 0 && !this.exploded) {
            this.exploded = true;
            if (this.combatSystem) {
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                this.combatSystem.spawnExplosion(
                    this.x, this.y,
                    Math.round(DEATH_BURST_DAMAGE * mult),
                    DEATH_BURST_RADIUS,
                    2
                );
            }
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;
        if (this.touchCooldown > 0) this.touchCooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;

        // 接触伤害（带冷却）
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < TOUCH_RANGE * TOUCH_RANGE
            && this.touchCooldown <= 0
            && player.state !== 'roll' && player.state !== 'driving') {
            if (player.takeDamage) {
                const a = Math.atan2(dy, dx);
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                player.takeDamage(Math.round(TOUCH_DAMAGE * mult), {
                    x: Math.cos(a) * 6,
                    y: Math.sin(a) * 6
                });
            }
            this.touchCooldown = TOUCH_COOLDOWN;
            this.attackAnimTimer = 24;
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
        this.chase.update(ctx);
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.wraith;
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
            const frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
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
        return []; // 浮游半透明体不参与光照遮挡
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 22;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#9ef0ff';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
