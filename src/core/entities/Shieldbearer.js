// Shieldbearer —— 地牢盾卫：慢速推进 + 正面塔盾格挡（减伤 90%），背后是弱点。
// 格挡判定基于子弹击退向量与朝向的夹角（±60° 正面锥），与玩家站位无关（穿透/弹射弹同样正确）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const BLOCK_REDUCTION = 0.1; // 正面命中伤害保留 10%

export class Shieldbearer extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 28, 60, 0.55);

        this.spriteScale = 1.3; // 体型放大至角色同级（N1）

        this.chase = new ChaseBehavior();
        this.damage = 12;
        this.attackRange = 32;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 32;
        this.blockFlashTimer = 0;
    }

    /** 正面锥判定：击退向量把它往「背后」推 → 子弹来自正面。 */
    _isFrontalHit(knockback) {
        if (!knockback || (!knockback.x && !knockback.y)) return false;
        const facingDir = this.facingRight ? 1 : -1;
        if (knockback.x * facingDir >= 0) return false; // 从背后/侧后来
        return Math.abs(knockback.x) > Math.abs(knockback.y) * 0.58; // ±60° 锥
    }

    takeDamage(amount, knockback) {
        let finalAmount = amount;
        let finalKnockback = knockback;
        if (this._isFrontalHit(knockback)) {
            finalAmount = Math.max(1, Math.round(amount * BLOCK_REDUCTION));
            finalKnockback = { x: knockback.x * 0.15, y: knockback.y * 0.15 };
            this.blockFlashTimer = 8;
        }
        super.takeDamage(finalAmount, finalKnockback);
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        if (this.blockFlashTimer > 0) this.blockFlashTimer--;
        if (this.frozenTimer > 0) return;

        // 盾击中不转向（锁定正面）
        if (!this.isAttacking) {
            this.facingRight = player.x > this.x;
        }

        if (this.isAttacking) {
            this.attackTimer++;
            if (this.attackTimer === 18) {
                this._checkBashHit(player);
            }
            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = 70;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.attackRange && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackTimer = 0;
            this.state = 'attack';
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
        this.chase.update(ctx);
        this.state = 'run';
    }

    _checkBashHit(player) {
        if (player.state === 'driving' || player.state === 'roll') return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.attackRange + 16) {
            const angle = Math.atan2(dy, dx);
            if (player.takeDamage) {
                player.takeDamage(this.damage, {
                    x: Math.cos(angle) * 10, // 盾击重击退
                    y: Math.sin(angle) * 10
                });
            } else {
                player.hp -= this.damage;
            }
        }
    }

    _currentFrames() {
        const assets = Assets.shieldbearer;
        if (!assets) return null;
        if (this.isAttacking) return assets.attack;
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
            if (this.isAttacking) {
                frameIndex = Math.min(frames.length - 1, Math.floor((this.attackTimer / this.attackDuration) * frames.length));
            } else {
                frameIndex = Math.floor(this.animationTimer / 11) % frames.length; // 沉重慢帧
            }
            ctx.drawImage(frames[frameIndex], -16, -16);

            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(frames[frameIndex], -16, -16);
                ctx.restore();
            }

            // 格挡反馈：盾面白闪竖条（本地坐标，盾在朝向前侧 x≈-11）
            if (this.blockFlashTimer > 0) {
                ctx.globalAlpha = this.blockFlashTimer / 8;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-12, -8, 2, 18);
                ctx.globalAlpha = 1;
            }
        }
        ctx.restore();

        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];
        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return [];
        const sprite = frames[Math.floor(this.animationTimer / 11) % frames.length];
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
        const barWidth = 26;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 25);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
