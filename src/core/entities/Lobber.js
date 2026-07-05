// Lobber —— 地牢投弹手：Kite 保距 + 抛物线榴弹（落点红圈预警，可越过掩体）。
// 榴弹为定时定点爆炸（不走 BulletSystem 碰撞），是掩体阵地的反制威胁轴。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';

const THROW_COOLDOWN = 170;
const THROW_RANGE = 300;
const GRENADE_FLIGHT_FRAMES = 52;
const GRENADE_DAMAGE = 14;
const GRENADE_RADIUS = 56;
const THROW_ANIM_FRAMES = 24;
const RELEASE_FRAME = 14; // 抡臂到位的出手帧

export class Lobber extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 28, 1.0);

        this.spriteScale = 1.35; // 体型放大至角色同级（N1）

        this.kite = new KiteBehavior({ near: 170, far: 280 });
        this.throwCooldown = Math.floor(THROW_COOLDOWN * 0.5);
        this.throwAnimTimer = 0; // >0 投掷动作中
        this.grenades = [];      // { sx, sy, tx, ty, t }
        this.combatSystem = null;
        this._pendingTarget = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        // 死亡即从敌人数组移除，飞行中榴弹立即在落点结算
        if (this.hp <= 0 && this.grenades.length > 0 && this.combatSystem) {
            const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
            for (const g of this.grenades) {
                this.combatSystem.spawnExplosion(
                    g.tx, g.ty,
                    Math.round(GRENADE_DAMAGE * mult),
                    GRENADE_RADIUS,
                    4
                );
            }
            this.grenades.length = 0;
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        this._updateGrenades();
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        // 投掷动作中：定身抡臂，出手帧发射
        if (this.throwAnimTimer > 0) {
            this.throwAnimTimer--;
            this.state = 'combat';
            if (this.throwAnimTimer === THROW_ANIM_FRAMES - RELEASE_FRAME && this._pendingTarget) {
                this.grenades.push({
                    sx: this.x,
                    sy: this.y - 10,
                    tx: this._pendingTarget.x,
                    ty: this._pendingTarget.y,
                    t: 0
                });
                this._pendingTarget = null;
            }
            return;
        }

        if (this.throwCooldown > 0) this.throwCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (this.throwCooldown <= 0 && distSq < THROW_RANGE * THROW_RANGE) {
            // 锁定落点（玩家当前位置 + 散布）
            this._pendingTarget = {
                x: player.x + (Math.random() - 0.5) * 48,
                y: player.y + (Math.random() - 0.5) * 48
            };
            this.throwAnimTimer = THROW_ANIM_FRAMES;
            this.throwCooldown = THROW_COOLDOWN;
            this.state = 'combat';
            return;
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
        this.kite.update(ctx);
        this.state = 'run';
    }

    _updateGrenades() {
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const g = this.grenades[i];
            g.t++;
            if (g.t >= GRENADE_FLIGHT_FRAMES) {
                if (this.combatSystem) {
                    const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                    this.combatSystem.spawnExplosion(
                        g.tx, g.ty,
                        Math.round(GRENADE_DAMAGE * mult),
                        GRENADE_RADIUS,
                        4
                    );
                }
                this.grenades.splice(i, 1);
            }
        }
    }

    _currentFrames() {
        const assets = Assets.lobber;
        if (!assets) return null;
        if (this.throwAnimTimer > 0) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp > 0) {
            ctx.save();
            ctx.translate(Math.floor(this.x), Math.floor(this.y));
            const s = this.spriteScale || 1;
            ctx.scale(this.facingRight ? -s : s, s);

            const frames = this._currentFrames();
            if (frames) {
                let frameIndex;
                if (this.throwAnimTimer > 0) {
                    const progress = 1 - this.throwAnimTimer / THROW_ANIM_FRAMES;
                    frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
                } else {
                    frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
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

        // 飞行榴弹与落点预警（world 空间）
        for (const g of this.grenades) {
            const t = g.t / GRENADE_FLIGHT_FRAMES;

            // 落点预警圈：随时间收缩 + 加深
            const warnRadius = GRENADE_RADIUS * (1.15 - t * 0.35);
            ctx.save();
            ctx.globalAlpha = 0.25 + t * 0.4;
            ctx.strokeStyle = '#ff5040';
            ctx.lineWidth = t > 0.75 ? 2 : 1;
            ctx.beginPath();
            ctx.arc(g.tx, g.ty, warnRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.12 + t * 0.18;
            ctx.fillStyle = '#ff5040';
            ctx.beginPath();
            ctx.arc(g.tx, g.ty, warnRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 弹体（抛物线：线性插值 + 正弦高度）
            const gx = g.sx + (g.tx - g.sx) * t;
            const gy = g.sy + (g.ty - g.sy) * t;
            const height = Math.sin(t * Math.PI) * 46;
            ctx.save();
            // 地面影子
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(gx, gy, 3, 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // 弹体与引线火花
            ctx.fillStyle = '#33333e';
            ctx.fillRect(Math.floor(gx) - 2, Math.floor(gy - height) - 2, 4, 4);
            ctx.fillStyle = '#ff8a3c';
            ctx.fillRect(Math.floor(gx), Math.floor(gy - height) - 4, 1, 1);
            ctx.restore();
        }
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
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
