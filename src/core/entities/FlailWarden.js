// FlailWarden —— 地牢链枷狱卒：慢速追击，近身抡链锤 360° 横扫（前摇 → 横扫 → 后摇）。
// 高血低速的近战威胁：逼你走位而非硬抗；横扫以自身为中心一次性 AOE。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const TRIGGER_RANGE = 40;
const WINDUP_FRAMES = 24;
const SWING_ANIM_FRAMES = 18;
const RECOVER_FRAMES = 80;
const SWEEP_RADIUS = 52;
const SWEEP_DAMAGE = 14;
const SWEEP_KNOCKBACK = 10;

export class FlailWarden extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 45, 0.6);

        this.spriteScale = 1.3;
        this.chase = new ChaseBehavior();
        this.attackState = 'none'; // none | windup | recover
        this.windupTimer = 0;
        this.swingTimer = 0;       // 横扫动画余帧（后摇内播放挥击帧）
        this.recoverTimer = 0;
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        if (this.attackState === 'none') this.facingRight = player.x > this.x;

        // 前摇：定身蓄力，结束瞬间横扫
        if (this.attackState === 'windup') {
            this.windupTimer--;
            this.state = 'attack';
            if (this.windupTimer <= 0) {
                this._sweep(player);
                this.swingTimer = SWING_ANIM_FRAMES;
                this.recoverTimer = RECOVER_FRAMES;
                this.attackState = 'recover';
            }
            return; // 抡击期间不移动
        }

        // 后摇：站定冷却，挥击帧播放完转空闲
        if (this.attackState === 'recover') {
            this.recoverTimer--;
            if (this.swingTimer > 0) this.swingTimer--;
            this.state = this.swingTimer > 0 ? 'attack' : 'idle';
            if (this.recoverTimer <= 0) this.attackState = 'none';
            return; // 重甲后摇不移动
        }

        // 追击：慢速逼近，进入近身触发前摇
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

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < TRIGGER_RANGE * TRIGGER_RANGE) {
            this.attackState = 'windup';
            this.windupTimer = WINDUP_FRAMES;
            this.state = 'attack';
        }
    }

    /** 360° 横扫：半径内玩家一次性受击 + 击退。 */
    _sweep(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy > SWEEP_RADIUS * SWEEP_RADIUS) return;
        if (player.state === 'roll' || player.state === 'driving' || !player.takeDamage) return;
        const a = Math.atan2(dy, dx);
        const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
        player.takeDamage(Math.round(SWEEP_DAMAGE * mult), {
            x: Math.cos(a) * SWEEP_KNOCKBACK,
            y: Math.sin(a) * SWEEP_KNOCKBACK
        });
    }

    _currentFrames() {
        const assets = Assets.flailWarden;
        if (!assets) return null;
        if (this.state === 'attack') return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    _attackFrameIndex(len) {
        // 前摇映射前半帧（后引蓄力），横扫映射后半帧（挥击绕体）
        if (this.windupTimer > 0) {
            const progress = 1 - this.windupTimer / WINDUP_FRAMES;
            return Math.min(3, Math.floor(progress * 4));
        }
        if (this.swingTimer > 0) {
            const progress = 1 - this.swingTimer / SWING_ANIM_FRAMES;
            return Math.min(len - 1, 4 + Math.floor(progress * 4));
        }
        return 0;
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
            if (this.state === 'attack') {
                frameIndex = this._attackFrameIndex(frames.length);
            } else {
                frameIndex = Math.floor(this.animationTimer / (this.state === 'run' ? 8 : 10)) % frames.length;
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
        const sprite = frames[Math.min(frames.length - 1, Math.floor(this.animationTimer / 10) % frames.length)];
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
        ctx.fillStyle = '#9aa2ad';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
