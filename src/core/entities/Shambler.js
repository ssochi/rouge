// Shambler —— 尸群蹒跚者：纯炮灰人潮填充物。慢速无脑追击 + 接触撕咬，无特殊技能。
// 存在意义是成群涌来让玩家的枪一直有活干（割草爽感来源）。HP 极低，1 枪必死。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const TOUCH_DAMAGE = 6;
const TOUCH_RANGE = 20;
const TOUCH_COOLDOWN = 45;
const ATTACK_ANIM = 20;

export class Shambler extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 10, 0.8);

        this.spriteScale = 0.9; // 比僵尸矮瘦一号
        this.chase = new ChaseBehavior();
        this.touchCooldown = 0;
        this.attackAnimTimer = 0;
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
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
                    x: Math.cos(a) * 3,
                    y: Math.sin(a) * 3
                });
            }
            this.touchCooldown = TOUCH_COOLDOWN;
            this.attackAnimTimer = ATTACK_ANIM;
        }

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };
        this.chase.update(ctx);
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.shambler;
        if (!assets) return null;
        if (this.attackAnimTimer > 0) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return;

        let frameIndex;
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / ATTACK_ANIM;
            frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
        } else {
            frameIndex = Math.floor(this.animationTimer / 6) % frames.length; // 迟缓摇摆
        }
        const sprite = frames[frameIndex];

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);
        ctx.drawImage(sprite, -16, -16);
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            ctx.drawImage(sprite, -16, -16);
            ctx.restore();
        }
        ctx.restore();

        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        return []; // 矮小炮灰频繁移动，跳过光照遮挡省开销
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 16;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 18);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8fae6a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
