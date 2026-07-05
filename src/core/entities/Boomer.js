// Boomer —— 地牢自爆蜂：高速逼近 → 近身引信（红闪膨胀）→ 自爆。
// 被提前打死也会爆，但半径与伤害减半。爆炸对玩家/敌人/掩体均生效（可链爆）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const FUSE_FRAMES = 40;
const FUSE_TRIGGER_DIST = 38;
const EXPLODE_DAMAGE = 24;
const EXPLODE_RADIUS = 72;
const DEATH_EXPLODE_DAMAGE = 12;
const DEATH_EXPLODE_RADIUS = 42;

export class Boomer extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 28, 2.2);

        this.spriteScale = 1.35; // 体型放大至角色同级（N1）

        this.chase = new ChaseBehavior();
        this.fuseTimer = 0;      // >0 引信中
        this.exploded = false;   // 防重复爆炸
        this.combatSystem = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        // 被击杀：缩水殉爆
        if (this.hp <= 0 && !this.exploded) {
            this.exploded = true;
            if (this.combatSystem) {
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                this.combatSystem.spawnExplosion(
                    this.x, this.y,
                    Math.round(DEATH_EXPLODE_DAMAGE * mult),
                    DEATH_EXPLODE_RADIUS,
                    4
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

        if (this.fuseTimer > 0) {
            this.fuseTimer--;
            this.state = 'fuse';
            // 引信期缓慢贴脸
            const originalSpeed = this.speed;
            this.speed = originalSpeed * 0.3;
            this.chase.update(ctx);
            this.speed = originalSpeed;

            if (this.fuseTimer === 0) {
                this._explode();
            }
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < FUSE_TRIGGER_DIST * FUSE_TRIGGER_DIST) {
            this.fuseTimer = FUSE_FRAMES;
            this.state = 'fuse';
            return;
        }

        this.chase.update(ctx);
        this.state = 'run';
    }

    _explode() {
        if (this.exploded) return;
        this.exploded = true;
        this.hp = 0;
        if (this.combatSystem) {
            const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
            this.combatSystem.spawnExplosion(
                this.x, this.y,
                Math.round(EXPLODE_DAMAGE * mult),
                EXPLODE_RADIUS,
                6
            );
        }
    }

    _currentFrames() {
        const assets = Assets.boomer;
        if (!assets) return null;
        if (this.state === 'fuse') return assets.attack;
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
            let frameIndex;
            if (this.state === 'fuse') {
                // 引信进度映射帧序（越接近爆炸帧越靠后）
                const progress = 1 - this.fuseTimer / FUSE_FRAMES;
                frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
            } else {
                frameIndex = Math.floor(this.animationTimer / 5) % frames.length; // 疾走快帧
            }
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
        if (this.hp <= 0 || this.blocksLight === false) return [];
        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return [];
        const sprite = frames[Math.floor(this.animationTimer / 5) % frames.length];
        if (!sprite) return [];
        return [{
            kind: 'sprite',
            sprite,
            pivotX: this.x,
            pivotY: this.y,
            originX: 16,
            originY: 16,
            rotation: 0,
            flipX: this.facingRight === true
        }];
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 24;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8bc34a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
