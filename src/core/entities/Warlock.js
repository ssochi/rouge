// Warlock —— 地牢弹幕法师：Kite 拉扯 + 环形/扇形弹幕 + 受击积伤闪现。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';
import { RangedPatternBehavior } from './behaviors/RangedPatternBehavior.js';

const TELEPORT_DAMAGE_THRESHOLD = 16;

export class Warlock extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 30, 0.9);

        this.spriteScale = 1.35; // 体型放大至角色同级（N1）

        this.kite = new KiteBehavior({ near: 150, far: 250 });
        this.pattern = new RangedPatternBehavior({
            patterns: [
                { kind: 'ring', count: 12, speed: 3.2, damage: 8, color: '#d86eff', size: 4, life: 130, weight: 1 },
                { kind: 'fan', count: 5, spreadDeg: 55, speed: 4.2, damage: 8, color: '#b98bff', size: 4, life: 110, weight: 1.2 }
            ],
            cooldown: 140,
            range: 330
        });

        this.teleportAccum = 0;      // 受击积伤，达阈值闪现
        this.teleportPending = false;
        this.attackAnimTimer = 0;
        this.combatSystem = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        if (this.hp <= 0) return;
        this.teleportAccum += amount;
        if (this.teleportAccum >= TELEPORT_DAMAGE_THRESHOLD) {
            this.teleportAccum = 0;
            this.teleportPending = true;
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        if (this.teleportPending) {
            this._tryTeleport(player, wallQuery, combatSystem);
            this.teleportPending = false;
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

        const firing = this.pattern.update(ctx);
        if (firing) {
            this.attackAnimTimer = 20;
            this.state = 'combat';
        } else {
            this.kite.update(ctx);
            this.state = 'run';
        }
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
    }

    /** 短距闪现：随机方向 80~140px 找可站立点（8 次尝试），带紫色粒子。 */
    _tryTeleport(player, wallQuery, combatSystem) {
        for (let attempt = 0; attempt < 8; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 80 + Math.random() * 60;
            const tx = this.x + Math.cos(angle) * dist;
            const ty = this.y + Math.sin(angle) * dist;
            const rect = this.getMovementHitboxAt(tx, ty);
            if (wallQuery && wallQuery(rect)) continue;

            this._spawnTeleportParticles(combatSystem, this.x, this.y);
            this.x = tx;
            this.y = ty;
            this._spawnTeleportParticles(combatSystem, tx, ty);
            return;
        }
    }

    _spawnTeleportParticles(combatSystem, x, y) {
        const particles = combatSystem && combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            particles.push({
                x,
                y: y - 8,
                vx: Math.cos(a) * 2,
                vy: Math.sin(a) * 2,
                life: 18,
                color: i % 2 === 0 ? '#d86eff' : '#7650ab',
                size: 3,
                friction: 0.88
            });
        }
    }

    _currentFrames() {
        const assets = Assets.warlock;
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
            const frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
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
        const sprite = frames[Math.floor(this.animationTimer / 8) % frames.length];
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
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
